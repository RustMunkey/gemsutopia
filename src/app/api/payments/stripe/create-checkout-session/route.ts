import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      currency = 'cad',
      customerEmail,
      customerData,
      items,
      subtotal,
      shipping,
      tax,
      appliedDiscount,
      metadata = {}
    } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    // Create line items for Stripe Checkout
    const lineItems = items?.map((item: any) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: item.name || 'Gemstone',
          images: item.image ? [item.image] : [],
          description: item.description || undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity || 1,
    })) || [];

    // Add discount as a line item (negative amount) if applicable
    if (appliedDiscount && appliedDiscount.amount > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Discount (${appliedDiscount.code})`,
            description: appliedDiscount.type === 'percentage'
              ? `${appliedDiscount.value}% off`
              : `$${appliedDiscount.value} off`,
          },
          unit_amount: -Math.round(appliedDiscount.amount * 100), // Negative amount for discount
        },
        quantity: 1,
      });
    }

    // Add shipping as a line item if applicable (after discount check for free shipping)
    if (shipping && shipping > 0 && !(appliedDiscount?.free_shipping)) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Shipping',
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    } else if (appliedDiscount?.free_shipping) {
      // Show free shipping as a line item with $0
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Shipping (FREE with discount)',
          },
          unit_amount: 0,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?session_id={CHECKOUT_SESSION_ID}&payment_method=stripe`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
      customer_email: customerEmail,
      metadata: {
        ...metadata,
        customerData: JSON.stringify(customerData),
        items: JSON.stringify(items),
        subtotal: subtotal?.toString(),
        shipping: shipping?.toString(),
        tax: tax?.toString(),
        appliedDiscount: appliedDiscount ? JSON.stringify(appliedDiscount) : undefined,
      },
      allow_promotion_codes: true, // Allow Stripe promotion codes
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
