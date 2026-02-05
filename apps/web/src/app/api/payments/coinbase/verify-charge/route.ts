import { NextRequest } from 'next/server';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

const COINBASE_COMMERCE_API_URL = 'https://api.commerce.coinbase.com';

interface CoinbaseChargeStatus {
  id: string;
  code: string;
  name: string;
  pricing: {
    local: { amount: string; currency: string };
  };
  payments: Array<{
    network: string;
    transaction_id: string;
    status: string;
    value: {
      local: { amount: string; currency: string };
      crypto: { amount: string; currency: string };
    };
  }>;
  timeline: Array<{
    time: string;
    status: string;
  }>;
  metadata: Record<string, string>;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY;

    if (!apiKey) {
      return ApiError.internal('Coinbase Commerce is not configured');
    }

    const { searchParams } = new URL(request.url);
    const chargeCode = searchParams.get('code');

    if (!chargeCode) {
      return ApiError.validation('Charge code is required');
    }

    // Fetch charge status from Coinbase Commerce
    const response = await fetch(`${COINBASE_COMMERCE_API_URL}/charges/${chargeCode}`, {
      method: 'GET',
      headers: {
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return ApiError.notFound('Charge');
      }
      return ApiError.externalService('Coinbase Commerce', 'Failed to verify charge');
    }

    const result = await response.json();
    const charge: CoinbaseChargeStatus = result.data;

    // Get the latest status from timeline
    const latestStatus = charge.timeline[charge.timeline.length - 1]?.status || 'NEW';

    // Determine if payment is complete
    const isComplete = ['COMPLETED', 'RESOLVED'].includes(latestStatus);
    const isPending = ['PENDING', 'UNRESOLVED', 'DELAYED'].includes(latestStatus);
    const isFailed = ['EXPIRED', 'CANCELED', 'REFUNDED'].includes(latestStatus);

    // Get payment details if available
    const paymentInfo = charge.payments[0];

    return apiSuccess({
      chargeCode: charge.code,
      status: latestStatus,
      isComplete,
      isPending,
      isFailed,
      amount: charge.pricing.local.amount,
      currency: charge.pricing.local.currency,
      payment: paymentInfo
        ? {
            network: paymentInfo.network,
            transactionId: paymentInfo.transaction_id,
            cryptoAmount: paymentInfo.value.crypto.amount,
            cryptoCurrency: paymentInfo.value.crypto.currency,
          }
        : null,
      metadata: charge.metadata,
    });
  } catch (error) {
    console.error('Coinbase charge verification error:', error);
    return ApiError.internal('Failed to verify charge');
  }
}
