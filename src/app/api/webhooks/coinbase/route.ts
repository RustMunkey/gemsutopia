import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-cc-webhook-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  // Verify webhook signature
  const isValid = verifySignature(
    body,
    signature,
    process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!
  );

  if (!isValid) {
    console.error('Coinbase webhook signature verification failed');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    const event = JSON.parse(body);

    // Handle charge:confirmed event
    if (event.type === 'charge:confirmed') {
      const charge = event.data;
      
      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_intent_id', charge.id)
        .single();

      if (!existingOrder) {
        // Parse metadata
        const metadata = charge.metadata || {};
        const orderItems = JSON.parse(metadata.order_items || '[]');
        const shippingAddress = JSON.parse(metadata.shipping_address || '{}');

        // Store order in database
        const { error } = await supabase.from('orders').insert({
          payment_intent_id: charge.id,
          amount: Math.round(parseFloat(metadata.total) * 100), // Convert to cents
          currency: 'cad',
          status: 'completed',
          customer_email: metadata.customer_email,
          customer_name: metadata.customer_name,
          items_count: parseInt(metadata.items_count),
          shipping_address: shippingAddress,
          order_items: orderItems,
          metadata: {
            payment_method: 'coinbase',
            coinbase_charge_id: charge.id,
            coinbase_payment_id: charge.payments?.[0]?.transaction_id,
            cryptocurrency: charge.payments?.[0]?.value?.crypto?.currency,
            crypto_amount: charge.payments?.[0]?.value?.crypto?.amount,
            subtotal: parseFloat(metadata.subtotal),
            shipping: parseFloat(metadata.shipping),
            tax: parseFloat(metadata.tax),
            total: parseFloat(metadata.total)
          },
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error('Error saving Coinbase order to database:', error);
        } else {
          console.log('Coinbase payment confirmed:', charge.id);
        }
      }
    }

    // Handle charge:failed event
    if (event.type === 'charge:failed') {
      const charge = event.data;
      
      try {
        const metadata = charge.metadata || {};
        const orderItems = JSON.parse(metadata.order_items || '[]');
        const shippingAddress = JSON.parse(metadata.shipping_address || '{}');

        await supabase.from('orders').insert({
          payment_intent_id: charge.id,
          amount: Math.round(parseFloat(metadata.total || '0') * 100),
          currency: 'cad',
          status: 'failed',
          customer_email: metadata.customer_email,
          customer_name: metadata.customer_name,
          items_count: parseInt(metadata.items_count || '0'),
          shipping_address: shippingAddress,
          order_items: orderItems,
          metadata: {
            payment_method: 'coinbase',
            coinbase_charge_id: charge.id,
            subtotal: parseFloat(metadata.subtotal || '0'),
            shipping: parseFloat(metadata.shipping || '0'),
            tax: parseFloat(metadata.tax || '0'),
            total: parseFloat(metadata.total || '0')
          },
          error_message: 'Coinbase payment failed or expired',
          created_at: new Date().toISOString(),
        });

        console.log('Coinbase payment failed:', charge.id);
      } catch (dbError) {
        console.error('Database error storing failed Coinbase payment:', dbError);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing Coinbase webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}