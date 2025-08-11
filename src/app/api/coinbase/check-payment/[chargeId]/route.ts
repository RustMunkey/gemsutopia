import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chargeId: string }> }
) {
  try {
    const { chargeId } = await params;

    if (!chargeId) {
      return NextResponse.json(
        { error: 'Charge ID is required' },
        { status: 400 }
      );
    }

    // Check charge status with Coinbase Commerce
    const response = await fetch(`https://api.commerce.coinbase.com/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
        'X-CC-Version': '2018-03-22'
      }
    });

    if (!response.ok) {
      console.error('Coinbase Commerce API error:', response.status);
      return NextResponse.json(
        { error: 'Failed to check payment status' },
        { status: 500 }
      );
    }

    const chargeData = await response.json();
    const charge = chargeData.data;

    // If payment is completed and not yet stored in our database
    if (charge.timeline && charge.timeline.length > 0) {
      const completedEvent = charge.timeline.find((event: any) => 
        event.status === 'COMPLETED' && event.context === 'CONFIRMED'
      );

      if (completedEvent) {
        // Check if order already exists
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_intent_id', chargeId)
          .single();

        if (!existingOrder) {
          // Parse metadata
          const metadata = charge.metadata || {};
          const orderItems = JSON.parse(metadata.order_items || '[]');
          const shippingAddress = JSON.parse(metadata.shipping_address || '{}');

          // Store order in database
          const { error } = await supabase.from('orders').insert({
            payment_intent_id: chargeId,
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
              coinbase_charge_id: chargeId,
              coinbase_payment_id: completedEvent.payment?.transaction_id,
              cryptocurrency: completedEvent.payment?.value?.crypto?.currency,
              crypto_amount: completedEvent.payment?.value?.crypto?.amount,
              subtotal: parseFloat(metadata.subtotal),
              shipping: parseFloat(metadata.shipping),
              tax: parseFloat(metadata.tax),
              total: parseFloat(metadata.total)
            },
            created_at: new Date(completedEvent.time).toISOString(),
          });

          if (error) {
            console.error('Error saving Coinbase order to database:', error);
          } else {
            console.log('Coinbase order saved successfully:', chargeId);
          }
        }
      }
    }

    return NextResponse.json({
      id: charge.id,
      status: charge.timeline?.[charge.timeline.length - 1]?.status || 'NEW',
      hosted_url: charge.hosted_url,
      expires_at: charge.expires_at,
      payments: charge.payments || [],
      timeline: charge.timeline || []
    });

  } catch (error) {
    console.error('Error checking Coinbase payment:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}