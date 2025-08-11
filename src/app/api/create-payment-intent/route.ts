import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculateOrderAmount } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { items, customerInfo } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    const { total } = calculateOrderAmount(items);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'cad', // Canadian dollars
      description: `Gemsutopia order for ${items.length} item(s)`,
      metadata: {
        customer_email: customerInfo?.email || '',
        customer_name: `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim(),
        items_count: items.length.toString(),
        order_type: 'gem_purchase'
      },
      // Enable payment methods
      payment_method_types: ['card'],
      // Allow future payments if customer wants to save payment method
      setup_future_usage: 'off_session',
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}