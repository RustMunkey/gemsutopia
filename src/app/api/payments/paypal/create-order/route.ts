import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_API_BASE = 'https://api.paypal.com'; // Live mode

export const dynamic = 'force-dynamic';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  console.log('PayPal ClientID exists:', !!clientId);
  console.log('PayPal ClientID length:', clientId?.length);
  console.log('PayPal ClientSecret exists:', !!clientSecret);
  console.log('PayPal ClientSecret length:', clientSecret?.length);
  console.log('PayPal API Base:', PAYPAL_API_BASE);

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured - check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  console.log('Requesting access token from PayPal...');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  console.log('PayPal auth response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal auth failed:', errorText);
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { message: errorText };
    }
    throw new Error(`Failed to get PayPal access token: ${errorData.error_description || errorData.message || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('PayPal access token obtained');
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    console.log('PayPal create-order endpoint called');
    const body = await request.json();
    const { amount, currency = 'USD', items = [] } = body;
    console.log('Request data:', { amount, currency, items, fullBody: body });

    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Valid amount is required', details: `Amount is ${amount}` },
        { status: 400 }
      );
    }

    console.log('Getting PayPal access token...');
    let accessToken;
    try {
      accessToken = await getPayPalAccessToken();
      console.log('Access token obtained successfully');
    } catch (tokenError) {
      console.error('Failed to get PayPal access token:', tokenError);
      return NextResponse.json(
        {
          error: 'Failed to authenticate with PayPal',
          details: tokenError instanceof Error ? tokenError.message : String(tokenError)
        },
        { status: 500 }
      );
    }

    // For PayPal, we need to match the exact total amount passed from the frontend
    // The frontend calculates: subtotal + shipping (no tax)
    // We'll use a simple structure without breakdown to avoid mismatches

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: 'Gemstone purchase from Gemsutopia',
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    };

    console.log('Sending PayPal order request:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const responseText = await response.text();
    console.log('PayPal API Response Status:', response.status);
    console.log('PayPal API Response Body:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }
      console.error('PayPal order creation failed:', JSON.stringify(errorData, null, 2));

      // Return more detailed error info
      return NextResponse.json(
        {
          error: 'Failed to create PayPal order',
          details: errorData.message || errorData.error_description || 'Unknown error',
          paypalError: errorData
        },
        { status: 500 }
      );
    }

    let order;
    try {
      order = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse PayPal response:', responseText);
      return NextResponse.json(
        { error: 'Invalid PayPal response' },
        { status: 500 }
      );
    }

    console.log('PayPal order created successfully:', order.id);
    return NextResponse.json({ orderID: order.id });
  } catch (error) {
    console.error('PayPal order creation exception:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: 'Failed to create PayPal order',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}