import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) + '...',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}