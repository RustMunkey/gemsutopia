import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    
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
          payment_id: orderData.payment.paymentIntentId || orderData.payment.captureID,
          amount: orderData.totals.total
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
        { error: 'Failed to save order' },
        { status: 500 }
      );
    }

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