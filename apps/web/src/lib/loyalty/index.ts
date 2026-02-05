import { db } from '@/lib/db';
import { customerLoyalty, loyaltyTiers, loyaltyTierHistory } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { log } from '@/lib/logger';

interface UpdateLoyaltyResult {
  success: boolean;
  loyalty: typeof customerLoyalty.$inferSelect | null;
  tierChanged: boolean;
  previousTier?: string | null;
  newTier?: string | null;
  error?: string;
}

/**
 * Update customer spend and recalculate tier after order completion
 */
export async function updateCustomerLoyalty(
  email: string,
  orderTotal: number,
  userId?: string | null
): Promise<UpdateLoyaltyResult> {
  try {
    // Get all active tiers sorted by minSpend
    const tiers = await db.query.loyaltyTiers.findMany({
      where: eq(loyaltyTiers.isActive, true),
      orderBy: [asc(loyaltyTiers.minSpend)],
    });

    if (tiers.length === 0) {
      return { success: true, loyalty: null, tierChanged: false };
    }

    // Get or create customer loyalty record
    let loyalty = await db.query.customerLoyalty.findFirst({
      where: eq(customerLoyalty.email, email.toLowerCase()),
    });

    const defaultTier = tiers.find(t => t.isDefault) || tiers[0];
    let tierChanged = false;
    let previousTierName: string | null = null;
    let previousTierId: string | null = null;

    if (!loyalty) {
      // Create new loyalty record
      const [newLoyalty] = await db
        .insert(customerLoyalty)
        .values({
          email: email.toLowerCase(),
          userId: userId || null,
          tierId: defaultTier.id,
          tierName: defaultTier.name,
          lifetimeSpend: orderTotal.toString(),
          yearToDateSpend: orderTotal.toString(),
          totalOrders: 1,
        })
        .returning();

      loyalty = newLoyalty;

      // Log initial tier assignment
      await db.insert(loyaltyTierHistory).values({
        customerLoyaltyId: loyalty.id,
        previousTierId: null,
        previousTierName: null,
        newTierId: defaultTier.id,
        newTierName: defaultTier.name,
        reason: 'new_customer',
        lifetimeSpendAtChange: orderTotal.toString(),
        triggeredBy: 'system',
      });
    } else {
      // Update existing record
      previousTierName = loyalty.tierName;
      previousTierId = loyalty.tierId;

      const newLifetimeSpend = Number(loyalty.lifetimeSpend) + orderTotal;
      const newYtdSpend = Number(loyalty.yearToDateSpend) + orderTotal;
      const newTotalOrders = loyalty.totalOrders + 1;

      await db
        .update(customerLoyalty)
        .set({
          lifetimeSpend: newLifetimeSpend.toString(),
          yearToDateSpend: newYtdSpend.toString(),
          totalOrders: newTotalOrders,
          userId: userId || loyalty.userId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(customerLoyalty.id, loyalty.id));

      // Update local copy
      loyalty = {
        ...loyalty,
        lifetimeSpend: newLifetimeSpend.toString(),
        yearToDateSpend: newYtdSpend.toString(),
        totalOrders: newTotalOrders,
      };
    }

    // Recalculate tier based on new lifetime spend
    const newTier = calculateTier(Number(loyalty.lifetimeSpend), tiers);

    if (newTier && newTier.id !== loyalty.tierId) {
      tierChanged = true;
      const isUpgrade = Number(newTier.minSpend) > Number(loyalty.tierId ? tiers.find(t => t.id === loyalty!.tierId)?.minSpend || 0 : 0);

      // Update tier
      await db
        .update(customerLoyalty)
        .set({
          tierId: newTier.id,
          tierName: newTier.name,
          lastTierChange: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(customerLoyalty.id, loyalty.id));

      // Log tier change
      await db.insert(loyaltyTierHistory).values({
        customerLoyaltyId: loyalty.id,
        previousTierId: previousTierId,
        previousTierName: previousTierName,
        newTierId: newTier.id,
        newTierName: newTier.name,
        reason: isUpgrade ? 'upgrade' : 'downgrade',
        lifetimeSpendAtChange: loyalty.lifetimeSpend,
        triggeredBy: 'system',
      });

      loyalty = {
        ...loyalty,
        tierId: newTier.id,
        tierName: newTier.name,
      };
    }

    return {
      success: true,
      loyalty,
      tierChanged,
      previousTier: previousTierName,
      newTier: loyalty.tierName,
    };
  } catch (error) {
    log.error('Error updating customer loyalty', error, { email, orderTotal });
    return {
      success: false,
      loyalty: null,
      tierChanged: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate appropriate tier based on lifetime spend
 */
function calculateTier(
  lifetimeSpend: number,
  tiers: (typeof loyaltyTiers.$inferSelect)[]
): typeof loyaltyTiers.$inferSelect | null {
  // Tiers are sorted by minSpend ascending
  // Find the highest tier the customer qualifies for
  let qualifiedTier: typeof loyaltyTiers.$inferSelect | null = null;

  for (const tier of tiers) {
    if (lifetimeSpend >= Number(tier.minSpend)) {
      // Check minOrders if set (we'd need totalOrders passed in for full check)
      qualifiedTier = tier;
    }
  }

  // Default to first tier if none qualified
  return qualifiedTier || tiers[0] || null;
}

/**
 * Get loyalty discount for checkout
 */
export async function getLoyaltyDiscount(email: string): Promise<{
  discountPercent: number;
  freeShipping: boolean;
  freeShippingThreshold: number | null;
  tierName: string | null;
}> {
  try {
    const loyalty = await db.query.customerLoyalty.findFirst({
      where: eq(customerLoyalty.email, email.toLowerCase()),
      with: {
        tier: true,
      },
    });

    if (!loyalty?.tier) {
      return {
        discountPercent: 0,
        freeShipping: false,
        freeShippingThreshold: null,
        tierName: null,
      };
    }

    return {
      discountPercent: Number(loyalty.tier.discountPercent) || 0,
      freeShipping: loyalty.tier.freeShipping || false,
      freeShippingThreshold: loyalty.tier.freeShippingThreshold
        ? Number(loyalty.tier.freeShippingThreshold)
        : null,
      tierName: loyalty.tier.name,
    };
  } catch (error) {
    log.error('Error getting loyalty discount', error);
    return {
      discountPercent: 0,
      freeShipping: false,
      freeShippingThreshold: null,
      tierName: null,
    };
  }
}

/**
 * Manually adjust customer tier (admin function)
 */
export async function adjustCustomerTier(
  email: string,
  newTierId: string,
  adminUserId?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const loyalty = await db.query.customerLoyalty.findFirst({
      where: eq(customerLoyalty.email, email.toLowerCase()),
    });

    if (!loyalty) {
      return { success: false, error: 'Customer loyalty record not found' };
    }

    const newTier = await db.query.loyaltyTiers.findFirst({
      where: eq(loyaltyTiers.id, newTierId),
    });

    if (!newTier) {
      return { success: false, error: 'Tier not found' };
    }

    // Log the manual adjustment
    await db.insert(loyaltyTierHistory).values({
      customerLoyaltyId: loyalty.id,
      previousTierId: loyalty.tierId,
      previousTierName: loyalty.tierName,
      newTierId: newTier.id,
      newTierName: newTier.name,
      reason: 'manual_adjustment',
      notes,
      lifetimeSpendAtChange: loyalty.lifetimeSpend,
      triggeredBy: 'admin',
      adminUserId,
    });

    // Update the tier
    await db
      .update(customerLoyalty)
      .set({
        tierId: newTier.id,
        tierName: newTier.name,
        lastTierChange: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customerLoyalty.id, loyalty.id));

    return { success: true };
  } catch (error) {
    log.error('Error adjusting customer tier', error, { email, newTierId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
