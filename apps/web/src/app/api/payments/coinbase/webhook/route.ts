import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { orders, payments } from '@/lib/db/schema/tables';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Coinbase Commerce webhook events
type CoinbaseEvent =
  | 'charge:created'
  | 'charge:confirmed'
  | 'charge:failed'
  | 'charge:delayed'
  | 'charge:pending'
  | 'charge:resolved';

interface CoinbaseWebhookPayload {
  id: string;
  scheduled_for: string;
  event: {
    id: string;
    type: CoinbaseEvent;
    api_version: string;
    created_at: string;
    data: {
      id: string;
      code: string;
      name: string;
      description: string;
      pricing: {
        local: { amount: string; currency: string };
        bitcoin?: { amount: string; currency: string };
        ethereum?: { amount: string; currency: string };
        usdc?: { amount: string; currency: string };
      };
      payments: Array<{
        network: string;
        transaction_id: string;
        status: string;
        value: {
          local: { amount: string; currency: string };
          crypto: { amount: string; currency: string };
        };
      }>;
      metadata: {
        customer_email?: string;
        customer_name?: string;
        items?: string;
        subtotal?: string;
        shipping?: string;
        discount?: string;
        order_id?: string;
      };
      timeline: Array<{
        time: string;
        status: string;
      }>;
    };
  };
}

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Coinbase webhook secret not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const signature = request.headers.get('x-cc-webhook-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const payload = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookData: CoinbaseWebhookPayload = JSON.parse(payload);
    const event = webhookData.event;
    const chargeData = event.data;

    console.log(`Coinbase webhook: ${event.type} for charge ${chargeData.code}`);

    switch (event.type) {
      case 'charge:confirmed': {
        // Payment confirmed - create/update order
        const metadata = chargeData.metadata;
        const payment = chargeData.payments[0]; // Get the first (usually only) payment

        if (!payment) {
          console.error('No payment data in confirmed charge');
          break;
        }

        // Check if order already exists (from order_id in metadata)
        if (metadata.order_id) {
          // Update existing order
          await db
            .update(orders)
            .set({
              status: 'paid',
              paymentStatus: 'completed',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, metadata.order_id));

          // Update payment record
          await db
            .update(payments)
            .set({
              status: 'completed',
              providerPaymentId: payment.transaction_id,
              providerResponse: chargeData,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(payments.orderId, metadata.order_id));
        }

        console.log(`Charge ${chargeData.code} confirmed via ${payment.network}`);
        break;
      }

      case 'charge:failed': {
        // Payment failed
        const metadata = chargeData.metadata;

        if (metadata.order_id) {
          await db
            .update(orders)
            .set({
              status: 'cancelled',
              paymentStatus: 'failed',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, metadata.order_id));

          await db
            .update(payments)
            .set({
              status: 'failed',
              providerResponse: chargeData,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(payments.orderId, metadata.order_id));
        }

        console.log(`Charge ${chargeData.code} failed`);
        break;
      }

      case 'charge:delayed': {
        // Payment delayed (underpayment or network congestion)
        console.log(`Charge ${chargeData.code} delayed - may need manual review`);
        break;
      }

      case 'charge:pending': {
        // Payment detected but not yet confirmed
        console.log(`Charge ${chargeData.code} pending confirmation`);
        break;
      }

      case 'charge:resolved': {
        // Charge resolved (after being unresolved/delayed)
        const metadata = chargeData.metadata;

        if (metadata.order_id) {
          await db
            .update(orders)
            .set({
              status: 'paid',
              paymentStatus: 'completed',
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, metadata.order_id));
        }

        console.log(`Charge ${chargeData.code} resolved`);
        break;
      }

      case 'charge:created': {
        // Charge created - just log
        console.log(`Charge ${chargeData.code} created`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Coinbase webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
