import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { customerLoyalty, loyaltyTiers } from '@/lib/db/schema';
import { eq, gt, asc } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET - Get customer's loyalty status and tier progress
export async function GET(request: NextRequest) {
  try {
    // Try to get user from session
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    // Get email from query param (for guest lookup) or session
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');

    const email = session?.user?.email || emailParam;

    if (!email) {
      return ApiError.validation('Email is required');
    }

    // Get customer loyalty record
    let loyalty = await db.query.customerLoyalty.findFirst({
      where: eq(customerLoyalty.email, email.toLowerCase()),
      with: {
        tier: true,
      },
    });

    // Get all tiers sorted by minSpend for progress calculation
    const allTiers = await db.query.loyaltyTiers.findMany({
      where: eq(loyaltyTiers.isActive, true),
      orderBy: [asc(loyaltyTiers.minSpend)],
    });

    // If no loyalty record exists, create one with default tier
    if (!loyalty) {
      const defaultTier = allTiers.find(t => t.isDefault) || allTiers[0];

      if (defaultTier) {
        const [newLoyalty] = await db
          .insert(customerLoyalty)
          .values({
            email: email.toLowerCase(),
            userId: session?.user?.id || null,
            tierId: defaultTier.id,
            tierName: defaultTier.name,
            lifetimeSpend: '0',
            yearToDateSpend: '0',
            totalOrders: 0,
          })
          .returning();

        loyalty = {
          ...newLoyalty,
          tier: defaultTier,
        };
      } else {
        // No tiers configured
        return apiSuccess({
          loyalty: null,
          currentTier: null,
          nextTier: null,
          progress: 0,
          message: 'Loyalty program not yet configured',
        });
      }
    }

    // Calculate progress to next tier
    const currentSpend = Number(loyalty.lifetimeSpend);
    const currentTierIndex = allTiers.findIndex(t => t.id === loyalty!.tierId);
    const nextTier = currentTierIndex < allTiers.length - 1 ? allTiers[currentTierIndex + 1] : null;

    let progress = 100; // Default to 100% if at highest tier
    let spendToNextTier = 0;

    if (nextTier) {
      const nextTierMinSpend = Number(nextTier.minSpend);
      const currentTierMinSpend = Number(loyalty.tier?.minSpend || 0);
      const tierRange = nextTierMinSpend - currentTierMinSpend;
      const spendInRange = currentSpend - currentTierMinSpend;

      progress = Math.min(100, Math.max(0, (spendInRange / tierRange) * 100));
      spendToNextTier = Math.max(0, nextTierMinSpend - currentSpend);
    }

    return apiSuccess({
      loyalty: {
        id: loyalty.id,
        email: loyalty.email,
        lifetimeSpend: loyalty.lifetimeSpend,
        yearToDateSpend: loyalty.yearToDateSpend,
        totalOrders: loyalty.totalOrders,
        pointsBalance: loyalty.pointsBalance,
      },
      currentTier: loyalty.tier
        ? {
            id: loyalty.tier.id,
            name: loyalty.tier.name,
            slug: loyalty.tier.slug,
            color: loyalty.tier.color,
            icon: loyalty.tier.icon,
            discountPercent: loyalty.tier.discountPercent,
            freeShipping: loyalty.tier.freeShipping,
            freeShippingThreshold: loyalty.tier.freeShippingThreshold,
            benefits: loyalty.tier.benefits,
          }
        : null,
      nextTier: nextTier
        ? {
            id: nextTier.id,
            name: nextTier.name,
            slug: nextTier.slug,
            color: nextTier.color,
            minSpend: nextTier.minSpend,
            discountPercent: nextTier.discountPercent,
          }
        : null,
      progress: Math.round(progress * 100) / 100,
      spendToNextTier: Math.round(spendToNextTier * 100) / 100,
    });
  } catch (error) {
    console.error('Error fetching loyalty status:', error);
    return ApiError.internal('Failed to fetch loyalty status');
  }
}
