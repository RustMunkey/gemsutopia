import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    console.log('Received order data:', JSON.stringify(orderData, null, 2));
    
    // Validate required fields
    if (!orderData.customerInfo || !orderData.payment || !orderData.totals) {
      console.error('Missing required order data fields');
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      );
    }
    
    // Save order to database
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_email: orderData.customerInfo.email,
        customer_name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
        shipping_address: {
          address: orderData.customerInfo.address,
          apartment: orderData.customerInfo.apartment,
          city: orderData.customerInfo.city,
          state: orderData.customerInfo.state,
          zipCode: orderData.customerInfo.zipCode,
          country: orderData.customerInfo.country
        },
        items: orderData.items,
        payment_details: {
          method: orderData.payment.paymentMethod,
          payment_id: orderData.payment.paymentIntentId || orderData.payment.captureID || orderData.payment.transactionId,
          amount: orderData.totals.total,
          currency: orderData.payment.currency || 'CAD',
          ...(orderData.payment.paymentMethod === 'crypto' && {
            crypto_type: orderData.payment.cryptoType,
            crypto_amount: orderData.payment.cryptoAmount,
            crypto_currency: orderData.payment.cryptoCurrency,
            wallet_address: orderData.payment.walletAddress,
            network: orderData.payment.network
          })
        },
        subtotal: orderData.totals.subtotal,
        shipping: orderData.totals.shipping,
        tax: orderData.totals.tax,
        total: orderData.totals.total,
        status: 'confirmed',
        created_at: orderData.timestamp
      }])
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save order', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error('No data returned from database insert');
      return NextResponse.json(
        { error: 'Order creation failed - no data returned' },
        { status: 500 }
      );
    }

    console.log('Order saved successfully to database:', data[0]);
    return NextResponse.json({ success: true, order: data[0] });
  } catch (error) {
    console.error('Error saving order:', error);
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}