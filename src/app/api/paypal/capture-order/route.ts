import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { orderID, details, customerInfo, items } = await request.json();

    if (!orderID || !details) {
      return NextResponse.json(
        { error: 'Missing order details' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 300 ? 0 : 15;
    const tax = Math.round((subtotal + shipping) * 0.13 * 100) / 100;
    const total = subtotal + shipping + tax;

    // Store order in database
    const { data, error } = await supabase.from('orders').insert({
      payment_intent_id: orderID,
      amount: Math.round(total * 100), // Convert to cents for consistency
      currency: 'cad',
      status: details.status === 'COMPLETED' ? 'completed' : 'pending',
      customer_email: customerInfo.email,
      customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
      items_count: items.length,
      shipping_address: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        address: customerInfo.address,
        apartment: customerInfo.apartment,
        city: customerInfo.city,
        state: customerInfo.state,
        zipCode: customerInfo.zipCode,
        country: customerInfo.country,
      },
      order_items: items,
      metadata: {
        payment_method: 'paypal',
        paypal_order_id: orderID,
        paypal_payer_id: details.payer?.payer_id,
        paypal_payer_email: details.payer?.email_address,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving PayPal order to database:', error);
      return NextResponse.json(
        { error: 'Failed to save order' },
        { status: 500 }
      );
    }

    console.log('PayPal order saved successfully:', orderID);

    return NextResponse.json({
      success: true,
      orderId: data?.[0]?.id || orderID,
      message: 'Order processed successfully'
    });

  } catch (error) {
    console.error('Error processing PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  }
}