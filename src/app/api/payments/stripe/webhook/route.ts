import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);

        // Find order by payment intent ID
        const { data: orders, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_details->>payment_id', paymentIntent.id)
          .limit(1);

        if (fetchError) {
          console.error('Error fetching order:', fetchError);
          break;
        }

        if (orders && orders.length > 0) {
          const order = orders[0];

          // Update order status to confirmed
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          if (updateError) {
            console.error('Error updating order status:', updateError);
          } else {
            console.log(`Order ${order.id} confirmed via webhook`);
          }

          // TODO: Send confirmation email (will implement with Supabase later)
          // You can add this after setting up Supabase email service
        } else {
          console.log(`No order found for payment intent: ${paymentIntent.id}`);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);

        // Find order by payment intent ID
        const { data: failedOrders, error: failedFetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_details->>payment_id', failedPayment.id)
          .limit(1);

        if (failedFetchError) {
          console.error('Error fetching failed order:', failedFetchError);
          break;
        }

        if (failedOrders && failedOrders.length > 0) {
          const order = failedOrders[0];

          // Update order status to failed
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          if (updateError) {
            console.error('Error updating failed order status:', updateError);
          } else {
            console.log(`Order ${order.id} marked as failed`);

            // Restore inventory since payment failed
            if (order.items && Array.isArray(order.items)) {
              for (const item of order.items) {
                if (item.id && item.quantity) {
                  const { error: inventoryError } = await supabase
                    .from('products')
                    .update({
                      inventory: supabase.rpc('increment', {
                        x: item.quantity
                      })
                    })
                    .eq('id', item.id);

                  if (inventoryError) {
                    console.error(`Error restoring inventory for ${item.id}:`, inventoryError);
                  }
                }
              }
            }
          }

          // TODO: Send failure notification email
        }
        break;

      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;
        console.log('Dispute created:', dispute.id);

        // Find order by charge ID
        const chargeId = dispute.charge;
        const { data: disputedOrders, error: disputeFetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_details->>payment_id', chargeId)
          .limit(1);

        if (disputeFetchError) {
          console.error('Error fetching disputed order:', disputeFetchError);
          break;
        }

        if (disputedOrders && disputedOrders.length > 0) {
          const order = disputedOrders[0];

          // Update order status to disputed
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'disputed',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          if (updateError) {
            console.error('Error updating disputed order status:', updateError);
          } else {
            console.log(`Order ${order.id} marked as disputed`);
          }

          // TODO: Send admin notification about dispute
        }
        break;

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Charge;
        console.log('Charge refunded:', refund.id);

        // Find order by charge ID
        const { data: refundedOrders, error: refundFetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_details->>payment_id', refund.payment_intent)
          .limit(1);

        if (refundFetchError) {
          console.error('Error fetching refunded order:', refundFetchError);
          break;
        }

        if (refundedOrders && refundedOrders.length > 0) {
          const order = refundedOrders[0];

          // Update order status to refunded
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'refunded',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          if (updateError) {
            console.error('Error updating refunded order status:', updateError);
          } else {
            console.log(`Order ${order.id} marked as refunded`);

            // Restore inventory for refunded order
            if (order.items && Array.isArray(order.items)) {
              for (const item of order.items) {
                if (item.id && item.quantity) {
                  const { error: inventoryError } = await supabase
                    .rpc('increment_inventory', {
                      product_id: item.id,
                      increment_amount: item.quantity
                    });

                  if (inventoryError) {
                    console.error(`Error restoring inventory for ${item.id}:`, inventoryError);
                  }
                }
              }
            }
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}