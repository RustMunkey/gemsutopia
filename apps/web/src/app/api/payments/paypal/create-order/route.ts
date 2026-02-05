import { NextRequest } from 'next/server';
import { apiSuccess, ApiError } from '@/lib/api';

const PAYPAL_API_BASE = 'https://api.paypal.com'; // Live mode

export const dynamic = 'force-dynamic';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'PayPal credentials not configured - check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local'
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    throw new Error(
      `Failed to get PayPal access token: ${errorData.error_description || errorData.message || 'Unknown error'}`
    );
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'USD' } = body;

    if (!amount || amount <= 0) {
      return ApiError.validation('Valid amount is required');
    }

    let accessToken;
    try {
      accessToken = await getPayPalAccessToken();
    } catch (tokenError) {
      return ApiError.externalService(
        'PayPal',
        tokenError instanceof Error ? tokenError.message : 'Failed to authenticate with PayPal'
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

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }

      return ApiError.externalService('PayPal', errorData.message || errorData.error_description || 'Failed to create PayPal order');
    }

    let order;
    try {
      order = JSON.parse(responseText);
    } catch {
      return ApiError.externalService('PayPal', 'Invalid PayPal response');
    }

    return apiSuccess({ orderID: order.id });
  } catch (error) {
    return ApiError.externalService(
      'PayPal',
      error instanceof Error ? error.message : 'Failed to create PayPal order'
    );
  }
}
