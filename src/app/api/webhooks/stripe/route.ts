import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      try {
        // Store order in database
        const { error } = await supabase.from('orders').insert({
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'completed',
          customer_email: paymentIntent.metadata.customer_email,
          customer_name: paymentIntent.metadata.customer_name,
          items_count: parseInt(paymentIntent.metadata.items_count),
          created_at: new Date().toISOString(),
          metadata: paymentIntent.metadata
        });

        if (error) {
          console.error('Error saving order to database:', error);
        }

        console.log('Payment succeeded:', paymentIntent.id);
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Store failed payment for tracking
      try {
        await supabase.from('orders').insert({
          payment_intent_id: failedPayment.id,
          amount: failedPayment.amount,
          currency: failedPayment.currency,
          status: 'failed',
          customer_email: failedPayment.metadata.customer_email,
          customer_name: failedPayment.metadata.customer_name,
          items_count: parseInt(failedPayment.metadata.items_count),
          created_at: new Date().toISOString(),
          metadata: failedPayment.metadata,
          error_message: failedPayment.last_payment_error?.message || 'Payment failed'
        });
      } catch (dbError) {
        console.error('Database error storing failed payment:', dbError);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}