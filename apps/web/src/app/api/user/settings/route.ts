import { NextRequest } from 'next/server';
import { db, users, emailSubscriptions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return ApiError.notFound('User');
    }

    // Get email subscription preferences
    const subscription = await db.query.emailSubscriptions.findFirst({
      where: eq(emailSubscriptions.email, user.email),
    });

    const preferences = (user.preferences as Record<string, unknown>) || {};

    return apiSuccess({
      settings: {
        notifications: {
          orderUpdates: subscription?.orderUpdates ?? true,
          promotions: subscription?.promotions ?? false,
          newsletter: subscription?.newsletter ?? true,
          priceAlerts: subscription?.priceAlerts ?? false,
          stockAlerts: subscription?.stockAlerts ?? false,
        },
        privacy: {
          profileVisibility: (preferences.profileVisibility as string) || 'private',
          showPurchases: (preferences.showPurchases as boolean) || false,
          showWishlist: (preferences.showWishlist as boolean) || false,
        },
        communication: {
          emailFrequency: (preferences.emailFrequency as string) || 'weekly',
          contactMethod: (preferences.contactMethod as string) || 'email',
        },
      },
    });
  } catch {
    return ApiError.internal('Failed to fetch settings');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return ApiError.notFound('User');
    }

    const body = await request.json();
    const { notifications, privacy, communication } = body;

    // Update email subscription preferences
    if (notifications) {
      const existing = await db.query.emailSubscriptions.findFirst({
        where: eq(emailSubscriptions.email, user.email),
      });

      const subscriptionData = {
        newsletter: notifications.newsletter ?? true,
        promotions: notifications.promotions ?? false,
        orderUpdates: notifications.orderUpdates ?? true,
        priceAlerts: notifications.priceAlerts ?? false,
        stockAlerts: notifications.stockAlerts ?? false,
        updatedAt: new Date().toISOString(),
      };

      if (existing) {
        await db
          .update(emailSubscriptions)
          .set(subscriptionData)
          .where(eq(emailSubscriptions.id, existing.id));
      } else {
        await db.insert(emailSubscriptions).values({
          email: user.email,
          userId: user.id,
          ...subscriptionData,
          source: 'settings',
        });
      }
    }

    // Update user preferences (privacy + communication)
    const currentPreferences = (user.preferences as Record<string, unknown>) || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...(privacy && {
        profileVisibility: privacy.profileVisibility || 'private',
        showPurchases: privacy.showPurchases || false,
        showWishlist: privacy.showWishlist || false,
      }),
      ...(communication && {
        emailFrequency: communication.emailFrequency || 'weekly',
        contactMethod: communication.contactMethod || 'email',
      }),
    };

    await db
      .update(users)
      .set({
        preferences: updatedPreferences,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, session.user.id));

    return apiSuccess({ updated: true }, 'Settings saved');
  } catch {
    return ApiError.internal('Failed to save settings');
  }
}
