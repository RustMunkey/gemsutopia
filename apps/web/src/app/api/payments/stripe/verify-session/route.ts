import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Lazy Stripe initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });
}

export async function GET(request: NextRequest) {
  try {
    const stripe = getStripe();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return ApiError.validation('Session ID is required');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return ApiError.badRequest('Payment not completed');
    }

    return apiSuccess({
      session: {
        id: session.id,
        payment_intent: session.payment_intent,
        customer_email: session.customer_email,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
        payment_status: session.payment_status,
      },
    });
  } catch {
    return ApiError.externalService('Stripe', 'Failed to verify payment session');
  }
}
