import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { items, customerInfo, amount } = await request.json();

    if (!items || items.length === 0 || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate totals for verification
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 300 ? 0 : 15;
    const tax = Math.round((subtotal + shipping) * 0.13 * 100) / 100;
    const total = subtotal + shipping + tax;

    // Create charge with Coinbase Commerce
    const chargeData = {
      name: `Gemsutopia Order - ${items.length} item(s)`,
      description: `Purchase of ${items.length} gem(s) from Gemsutopia`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: total.toFixed(2),
        currency: 'CAD'
      },
      metadata: {
        customer_email: customerInfo.email,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        items_count: items.length.toString(),
        order_type: 'gem_purchase',
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        shipping_address: JSON.stringify({
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          address: customerInfo.address,
          apartment: customerInfo.apartment,
          city: customerInfo.city,
          state: customerInfo.state,
          zipCode: customerInfo.zipCode,
          country: customerInfo.country,
        }),
        order_items: JSON.stringify(items)
      },
      redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?payment=canceled`
    };

    const response = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(chargeData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Coinbase Commerce API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create crypto payment' },
        { status: 500 }
      );
    }

    const charge = await response.json();

    return NextResponse.json({
      id: charge.data.id,
      hosted_url: charge.data.hosted_url,
      expires_at: charge.data.expires_at,
      pricing: charge.data.pricing,
    });

  } catch (error) {
    console.error('Error creating Coinbase charge:', error);
    return NextResponse.json(
      { error: 'Failed to create crypto payment' },
      { status: 500 }
    );
  }
}