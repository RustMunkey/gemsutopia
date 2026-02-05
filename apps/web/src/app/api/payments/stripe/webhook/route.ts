import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db, orders, products } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { notifyPaymentFailed, notifyRefundProcessed } from '@/lib/email';
import { ApiError } from '@/lib/api';
import { updateCustomerLoyalty } from '@/lib/loyalty';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Lazy Stripe initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const body = await request.text();
  const signature = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch {
    return ApiError.badRequest('Invalid webhook signature');
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;

        // Handle completed checkout session
        if (session.payment_status === 'paid' && session.metadata) {
          const customerEmail = session.customer_email || session.customer_details?.email;
          const total = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents

          // Find or create order from session
          if (customerEmail && total > 0) {
            // Update customer loyalty
            updateCustomerLoyalty(customerEmail, total).catch(err => {
              log.error('Error updating loyalty from checkout session', err, { customerEmail, total });
            });
          }
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Find order by payment intent ID using indexed JSON query
        const matchingOrder = await db.query.orders.findFirst({
          where: sql`${orders.paymentDetails}->>'payment_id' = ${paymentIntent.id}`,
        });

        if (matchingOrder) {
          // Update order status to confirmed
          await db
            .update(orders)
            .set({
              status: 'confirmed',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, matchingOrder.id));

          // Update customer loyalty (track spend and potentially upgrade tier)
          if (matchingOrder.customerEmail && matchingOrder.total) {
            updateCustomerLoyalty(
              matchingOrder.customerEmail,
              parseFloat(matchingOrder.total),
              matchingOrder.userId
            ).catch(err => {
              log.error('Error updating loyalty', err, {
                orderId: matchingOrder.id,
                email: matchingOrder.customerEmail
              });
            });
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;

        // Find order by payment intent ID
        const failedOrder = await db.query.orders.findFirst({
          where: sql`${orders.paymentDetails}->>'payment_id' = ${failedPayment.id}`,
        });

        if (failedOrder) {
          // Update order status to failed
          await db
            .update(orders)
            .set({
              status: 'failed',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, failedOrder.id));

          // Restore inventory since payment failed
          const items = failedOrder.items as Array<{ id?: string; name?: string; price?: number; quantity?: number }>;
          if (items && Array.isArray(items)) {
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
                  // Inventory restoration failed, continue with other items
                }
              }
            }
          }

          // Send payment failed email notification
          notifyPaymentFailed(
            {
              orderId: failedOrder.id,
              customerEmail: failedOrder.customerEmail || '',
              customerName: failedOrder.customerName || '',
              items: items.map(item => ({
                name: item.name || 'Unknown Item',
                price: item.price || 0,
                quantity: item.quantity || 1,
              })),
              subtotal: parseFloat(failedOrder.subtotal || '0'),
              shipping: parseFloat(failedOrder.shippingCost || '0'),
              total: parseFloat(failedOrder.total || '0'),
              currency: 'CAD',
            },
            failedPayment.last_payment_error?.message || 'Payment could not be processed'
          ).catch(() => {
            // Email sending failed - don't block webhook response
          });
        }
        break;

      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;

        // Find order by charge ID
        const chargeId = dispute.charge;
        const disputedOrder = await db.query.orders.findFirst({
          where: sql`${orders.paymentDetails}->>'payment_id' = ${chargeId}`,
        });

        if (disputedOrder) {
          // Update order status to disputed
          await db
            .update(orders)
            .set({
              status: 'disputed',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, disputedOrder.id));
        }
        break;

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Charge;

        // Find order by payment intent
        const refundedOrder = await db.query.orders.findFirst({
          where: sql`${orders.paymentDetails}->>'payment_id' = ${refund.payment_intent}`,
        });

        if (refundedOrder) {
          // Update order status to refunded
          await db
            .update(orders)
            .set({
              status: 'refunded',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, refundedOrder.id));

          // Restore inventory for refunded order
          const items = refundedOrder.items as Array<{ id?: string; name?: string; price?: number; quantity?: number }>;
          if (items && Array.isArray(items)) {
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
                  // Inventory restoration failed, continue with other items
                }
              }
            }
          }

          // Send refund confirmation email
          const refundAmount = (refund.amount_refunded || 0) / 100; // Convert from cents
          notifyRefundProcessed(
            {
              orderId: refundedOrder.id,
              customerEmail: refundedOrder.customerEmail || '',
              customerName: refundedOrder.customerName || '',
              items: items.map(item => ({
                name: item.name || 'Unknown Item',
                price: item.price || 0,
                quantity: item.quantity || 1,
              })),
              subtotal: parseFloat(refundedOrder.subtotal || '0'),
              shipping: parseFloat(refundedOrder.shippingCost || '0'),
              total: parseFloat(refundedOrder.total || '0'),
              currency: 'CAD',
            },
            refundAmount
          ).catch(() => {
            // Email sending failed - don't block webhook response
          });
        }
        break;
    }

    return NextResponse.json({ success: true, data: { received: true } });
  } catch {
    return ApiError.internal('Webhook processing failed');
  }
}
