import { NextRequest } from 'next/server';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

const COINBASE_COMMERCE_API_URL = 'https://api.commerce.coinbase.com';

interface CoinbaseCharge {
  id: string;
  code: string;
  hosted_url: string;
  pricing: {
    local: { amount: string; currency: string };
    bitcoin?: { amount: string; currency: string };
    ethereum?: { amount: string; currency: string };
    usdc?: { amount: string; currency: string };
  };
  expires_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY;

    if (!apiKey || apiKey.includes('your-') || apiKey.length < 20) {
      console.error('Coinbase Commerce API key not configured');
      return ApiError.internal('Coinbase Commerce is not configured');
    }

    const {
      amount,
      currency = 'CAD',
      customerEmail,
      customerData,
      items,
      subtotal,
      shipping,
      appliedDiscount,
      metadata = {},
    } = await request.json();

    if (!amount || amount <= 0) {
      return ApiError.validation('Valid amount is required');
    }

    if (!customerEmail) {
      return ApiError.validation('Customer email is required');
    }

    // Create a description from items
    const itemNames = items?.map((item: any) => item.name).join(', ') || 'Gemstone purchase';
    const description = `Order: ${itemNames}`;

    // Build the charge request
    // Only accept BTC, ETH, and SOL - no other currencies
    const chargeData = {
      name: 'Gemsutopia Order',
      description: description.substring(0, 200), // Coinbase limits description length
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toFixed(2),
        currency: currency.toUpperCase(),
      },
      // Limit accepted cryptocurrencies to only BTC, ETH, SOL
      supported_networks: ['bitcoin', 'ethereum', 'solana'],
      metadata: {
        customer_email: customerEmail,
        customer_name: customerData
          ? `${customerData.firstName} ${customerData.lastName}`
          : undefined,
        items: JSON.stringify(items?.map((i: any) => ({ id: i.id, name: i.name, qty: i.quantity }))),
        subtotal: subtotal?.toString(),
        shipping: shipping?.toString(),
        discount: appliedDiscount ? JSON.stringify(appliedDiscount) : undefined,
        ...metadata,
      },
      redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?payment_method=coinbase&status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?payment_method=coinbase&status=cancelled`,
    };

    // Call Coinbase Commerce API
    const response = await fetch(`${COINBASE_COMMERCE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify(chargeData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coinbase Commerce error:', errorText);
      return ApiError.externalService('Coinbase Commerce', 'Failed to create charge');
    }

    const result = await response.json();
    const charge: CoinbaseCharge = result.data;

    return apiSuccess({
      chargeId: charge.id,
      chargeCode: charge.code,
      hostedUrl: charge.hosted_url,
      expiresAt: charge.expires_at,
      pricing: charge.pricing,
    });
  } catch (error) {
    console.error('Coinbase charge creation error:', error);
    return ApiError.internal('Failed to create Coinbase charge');
  }
}
