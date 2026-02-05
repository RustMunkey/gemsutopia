import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { loyaltyTiers } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET - List all loyalty tiers
export async function GET(request: NextRequest) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const tiers = await db.query.loyaltyTiers.findMany({
      orderBy: [asc(loyaltyTiers.sortOrder), asc(loyaltyTiers.minSpend)],
    });

    return apiSuccess({ tiers });
  } catch (error) {
    console.error('Error fetching loyalty tiers:', error);
    return ApiError.internal('Failed to fetch loyalty tiers');
  }
}

// POST - Create a new loyalty tier
export async function POST(request: NextRequest) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const body = await request.json();
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

    // Validate required fields
    if (!name || !slug) {
      return ApiError.validation('Name and slug are required');
    }

    // Check for duplicate slug
    const existingTier = await db.query.loyaltyTiers.findFirst({
      where: eq(loyaltyTiers.slug, slug),
    });

    if (existingTier) {
      return ApiError.validation('A tier with this slug already exists');
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db
        .update(loyaltyTiers)
        .set({ isDefault: false, updatedAt: new Date().toISOString() })
        .where(eq(loyaltyTiers.isDefault, true));
    }

    const [newTier] = await db
      .insert(loyaltyTiers)
      .values({
        name,
        slug,
        minSpend: minSpend?.toString() || '0',
        minOrders: minOrders || 0,
        discountPercent: discountPercent?.toString() || '0',
        freeShipping: freeShipping || false,
        freeShippingThreshold: freeShippingThreshold?.toString() || null,
        prioritySupport: prioritySupport || false,
        earlyAccess: earlyAccess || false,
        birthdayBonus: birthdayBonus?.toString() || null,
        color: color || '#808080',
        icon,
        description,
        benefits: benefits || [],
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
        isDefault: isDefault || false,
      })
      .returning();

    return apiSuccess({ tier: newTier }, 'Loyalty tier created', 201);
  } catch (error) {
    console.error('Error creating loyalty tier:', error);
    return ApiError.internal('Failed to create loyalty tier');
  }
}
