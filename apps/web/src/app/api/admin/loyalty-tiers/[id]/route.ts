import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { loyaltyTiers, customerLoyalty } from '@/lib/db/schema';
import { eq, ne, and, count } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get single loyalty tier with stats
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { id } = await context.params;

    const tier = await db.query.loyaltyTiers.findFirst({
      where: eq(loyaltyTiers.id, id),
    });

    if (!tier) {
      return ApiError.notFound('Loyalty tier');
    }

    // Get customer count for this tier
    const [customerStats] = await db
      .select({ count: count() })
      .from(customerLoyalty)
      .where(eq(customerLoyalty.tierId, id));

    return apiSuccess({
      tier,
      customerCount: customerStats?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching loyalty tier:', error);
    return ApiError.internal('Failed to fetch loyalty tier');
  }
}

// PUT - Update loyalty tier
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { id } = await context.params;
    const body = await request.json();

    // Check tier exists
    const existingTier = await db.query.loyaltyTiers.findFirst({
      where: eq(loyaltyTiers.id, id),
    });

    if (!existingTier) {
      return ApiError.notFound('Loyalty tier');
    }

    const {
      name,
      slug,
      minSpend,
      minOrders,
      discountPercent,
      freeShipping,
      freeShippingThreshold,
      prioritySupport,
      earlyAccess,
      birthdayBonus,
      color,
      icon,
      description,
      benefits,
      sortOrder,
      isActive,
      isDefault,
    } = body;

    // If slug is changing, check for duplicates
    if (slug && slug !== existingTier.slug) {
      const duplicateSlug = await db.query.loyaltyTiers.findFirst({
        where: and(eq(loyaltyTiers.slug, slug), ne(loyaltyTiers.id, id)),
      });

      if (duplicateSlug) {
        return ApiError.validation('A tier with this slug already exists');
      }
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingTier.isDefault) {
      await db
        .update(loyaltyTiers)
        .set({ isDefault: false, updatedAt: new Date().toISOString() })
        .where(eq(loyaltyTiers.isDefault, true));
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (minSpend !== undefined) updateData.minSpend = minSpend.toString();
    if (minOrders !== undefined) updateData.minOrders = minOrders;
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent.toString();
    if (freeShipping !== undefined) updateData.freeShipping = freeShipping;
    if (freeShippingThreshold !== undefined)
      updateData.freeShippingThreshold = freeShippingThreshold?.toString() || null;
    if (prioritySupport !== undefined) updateData.prioritySupport = prioritySupport;
    if (earlyAccess !== undefined) updateData.earlyAccess = earlyAccess;
    if (birthdayBonus !== undefined) updateData.birthdayBonus = birthdayBonus?.toString() || null;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (description !== undefined) updateData.description = description;
    if (benefits !== undefined) updateData.benefits = benefits;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const [updated] = await db
      .update(loyaltyTiers)
      .set(updateData)
      .where(eq(loyaltyTiers.id, id))
      .returning();

    // If tier name changed, update denormalized tierName on customer_loyalty
    if (name && name !== existingTier.name) {
      await db
        .update(customerLoyalty)
        .set({ tierName: name, updatedAt: new Date().toISOString() })
        .where(eq(customerLoyalty.tierId, id));
    }

    return apiSuccess({ tier: updated }, 'Loyalty tier updated');
  } catch (error) {
    console.error('Error updating loyalty tier:', error);
    return ApiError.internal('Failed to update loyalty tier');
  }
}

// DELETE - Delete loyalty tier
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { id } = await context.params;

    const tier = await db.query.loyaltyTiers.findFirst({
      where: eq(loyaltyTiers.id, id),
    });

    if (!tier) {
      return ApiError.notFound('Loyalty tier');
    }

    // Check if any customers are on this tier
    const [customerStats] = await db
      .select({ count: count() })
      .from(customerLoyalty)
      .where(eq(customerLoyalty.tierId, id));

    if (customerStats && customerStats.count > 0) {
      return ApiError.validation(
        `Cannot delete tier with ${customerStats.count} customers. Move customers to another tier first.`
      );
    }

    // Don't allow deleting default tier
    if (tier.isDefault) {
      return ApiError.validation('Cannot delete the default tier. Set another tier as default first.');
    }

    await db.delete(loyaltyTiers).where(eq(loyaltyTiers.id, id));

    return apiSuccess({}, 'Loyalty tier deleted');
  } catch (error) {
    console.error('Error deleting loyalty tier:', error);
    return ApiError.internal('Failed to delete loyalty tier');
  }
}
