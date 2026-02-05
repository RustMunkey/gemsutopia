import { NextRequest, NextResponse } from 'next/server';
import { db, orders, products } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { notifyPaymentFailed, notifyRefundProcessed } from '@/lib/email';
import { updateCustomerLoyalty } from '@/lib/loyalty';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const PAYPAL_API_BASE = 'https://api.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function verifyWebhookSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    log.warn('PAYPAL_WEBHOOK_ID not configured, skipping signature verification');
    return false;
  }

  const accessToken = await getPayPalAccessToken();

  const verifyResponse = await fetch(
    `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: request.headers.get('paypal-auth-algo'),
        cert_url: request.headers.get('paypal-cert-url'),
        transmission_id: request.headers.get('paypal-transmission-id'),
        transmission_sig: request.headers.get('paypal-transmission-sig'),
        transmission_time: request.headers.get('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    }
  );

  if (!verifyResponse.ok) {
    return false;
  }

  const result = await verifyResponse.json();
  return result.verification_status === 'SUCCESS';
}

async function findOrderByPayPalId(paypalOrderId: string) {
  const result = await db.query.orders.findFirst({
    where: sql`${orders.paymentDetails}->>'payment_id' = ${paypalOrderId}`,
  });
  return result;
}

async function restoreInventory(items: Array<{ id?: string; quantity?: number }>) {
  for (const item of items) {
    if (item.id && item.quantity) {
      try {
        await db
          .update(products)
          .set({
            inventory: sql`${products.inventory} + ${item.quantity}`,
          })
          .where(eq(products.id, item.id));
      } catch {
        // Continue with other items
      }
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(request, body);
  if (!isValid) {
    log.warn('PayPal webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event_type: string; resource: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  log.payment('paypal', event.event_type, { resourceId: event.resource?.id });

  try {
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const capture = event.resource;
        // The supplementary_data contains the order ID that links to our order
        const paypalOrderId =
          (capture.supplementary_data as Record<string, unknown>)?.related_ids
            ? ((capture.supplementary_data as Record<string, Record<string, string>>).related_ids?.order_id)
            : (capture.id as string);

        const order = await findOrderByPayPalId(paypalOrderId || (capture.id as string));

        if (order) {
          await db
            .update(orders)
            .set({
              status: 'confirmed',
              paymentStatus: 'paid',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, order.id));

          if (order.customerEmail && order.total) {
            updateCustomerLoyalty(
              order.customerEmail,
              parseFloat(order.total),
              order.userId
            ).catch(err => {
              log.error('Error updating loyalty from PayPal webhook', err, {
                orderId: order.id,
              });
            });
          }

          log.order('confirmed', order.id, { method: 'paypal' });
        }
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED': {
        const capture = event.resource;
        const order = await findOrderByPayPalId(capture.id as string);

        if (order) {
          await db
            .update(orders)
            .set({
              status: 'failed',
              paymentStatus: 'failed',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, order.id));

          const items = order.items as Array<{ id?: string; name?: string; price?: number; quantity?: number }>;
          if (items && Array.isArray(items)) {
            await restoreInventory(items);
          }

          notifyPaymentFailed(
            {
              orderId: order.id,
              customerEmail: order.customerEmail || '',
              customerName: order.customerName || '',
              items: (items || []).map(item => ({
                name: item.name || 'Unknown Item',
                price: item.price || 0,
                quantity: item.quantity || 1,
              })),
              subtotal: parseFloat(order.subtotal || '0'),
              shipping: parseFloat(order.shippingCost || '0'),
              total: parseFloat(order.total || '0'),
              currency: 'CAD',
            },
            'PayPal payment was denied'
          ).catch(() => {});

          log.order('failed', order.id, { method: 'paypal' });
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const capture = event.resource;
        const refundAmount = parseFloat(
          (capture.amount as Record<string, string>)?.value || '0'
        );
        const order = await findOrderByPayPalId(capture.id as string);

        if (order) {
          await db
            .update(orders)
            .set({
              status: 'refunded',
              paymentStatus: 'refunded',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, order.id));

          const items = order.items as Array<{ id?: string; name?: string; price?: number; quantity?: number }>;
          if (items && Array.isArray(items)) {
            await restoreInventory(items);
          }

          notifyRefundProcessed(
            {
              orderId: order.id,
              customerEmail: order.customerEmail || '',
              customerName: order.customerName || '',
              items: (items || []).map(item => ({
                name: item.name || 'Unknown Item',
                price: item.price || 0,
                quantity: item.quantity || 1,
              })),
              subtotal: parseFloat(order.subtotal || '0'),
              shipping: parseFloat(order.shippingCost || '0'),
              total: parseFloat(order.total || '0'),
              currency: 'CAD',
            },
            refundAmount
          ).catch(() => {});

          log.order('refunded', order.id, { method: 'paypal', refundAmount });
        }
        break;
      }

      case 'CUSTOMER.DISPUTE.CREATED': {
        const dispute = event.resource;
        const disputedTransactionId = (
          (dispute.disputed_transactions as Array<Record<string, string>>)?.[0]
        )?.seller_transaction_id;

        if (disputedTransactionId) {
          const order = await findOrderByPayPalId(disputedTransactionId);

          if (order) {
            await db
              .update(orders)
              .set({
                status: 'disputed',
                updatedAt: new Date().toISOString(),
              })
              .where(eq(orders.id, order.id));

            log.order('disputed', order.id, { method: 'paypal' });
          }
        }
        break;
      }

      case 'CUSTOMER.DISPUTE.RESOLVED': {
        const dispute = event.resource;
        const resolvedTransactionId = (
          (dispute.disputed_transactions as Array<Record<string, string>>)?.[0]
        )?.seller_transaction_id;

        if (resolvedTransactionId) {
          const order = await findOrderByPayPalId(resolvedTransactionId);

          if (order) {
            const outcome = (dispute as Record<string, string>).outcome;
            const newStatus = outcome === 'RESOLVED_BUYER_FAVOUR' ? 'refunded' : 'confirmed';

            await db
              .update(orders)
              .set({
                status: newStatus,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(orders.id, order.id));

            log.order(newStatus, order.id, { method: 'paypal', disputeOutcome: outcome });
          }
        }
        break;
      }
    }

    return NextResponse.json({ success: true, data: { received: true } });
  } catch (err) {
    log.error('PayPal webhook processing failed', err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
