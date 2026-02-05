import { NextRequest } from 'next/server';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

const PAYPAL_API_BASE = 'https://api.paypal.com'; // Live mode

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

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
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { orderID } = await request.json();

    if (!orderID) {
      return ApiError.validation('Order ID is required');
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return ApiError.externalService('PayPal', 'Failed to capture PayPal payment');
    }

    const captureData = await response.json();

    // Extract relevant payment information
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const amount = parseFloat(capture?.amount?.value || '0');
    const currency = capture?.amount?.currency_code || 'USD';

    return apiSuccess({
      captureID: captureData.id,
      status: captureData.status,
      amount,
      currency,
      paymentDetails: captureData,
    });
  } catch {
    return ApiError.externalService('PayPal', 'Failed to capture PayPal payment');
  }
}
