import { NextRequest } from 'next/server';
import { db, emailSubscriptions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { log } from '@/lib/logger';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return ApiError.validation('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ApiError.validation('Invalid email format');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const existing = await db.query.emailSubscriptions.findFirst({
      where: eq(emailSubscriptions.email, normalizedEmail),
    });

    if (existing) {
      if (existing.unsubscribedAt) {
        // Re-subscribe
        await db
          .update(emailSubscriptions)
          .set({
            newsletter: true,
            unsubscribedAt: null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(emailSubscriptions.id, existing.id));

        log.info('Newsletter re-subscription', { email: normalizedEmail });
        return apiSuccess({ subscribed: true }, 'Welcome back! You have been re-subscribed.');
      }

      // Already subscribed
      return apiSuccess({ subscribed: true }, 'You are already subscribed!');
    }

    // Create new subscription
    await db.insert(emailSubscriptions).values({
      email: normalizedEmail,
      newsletter: true,
      promotions: true,
      orderUpdates: true,
      auctionUpdates: false,
      priceAlerts: false,
      stockAlerts: false,
      isVerified: false,
      unsubscribeToken: randomUUID(),
      source: 'footer_newsletter',
    });

    log.info('New newsletter subscription', { email: normalizedEmail });
    return apiSuccess({ subscribed: true }, 'Successfully subscribed!', 201);
  } catch (error) {
    log.error('Newsletter subscription failed', error instanceof Error ? error : new Error(String(error)));
    return ApiError.internal('Failed to subscribe');
  }
}
