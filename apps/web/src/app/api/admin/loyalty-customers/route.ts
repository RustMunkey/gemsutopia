import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { customerLoyalty, loyaltyTiers, loyaltyTierHistory } from '@/lib/db/schema';
import { eq, desc, ilike, sql, and, or } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { verifyAdminToken } from '@/lib/auth/adminAuth';
import { adjustCustomerTier } from '@/lib/loyalty';

// GET - List all customer loyalty records with filters
export async function GET(request: NextRequest) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search');
    const tierId = searchParams.get('tierId');
    const sortBy = searchParams.get('sortBy') || 'lifetimeSpend';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(ilike(customerLoyalty.email, `%${search}%`));
    }

    if (tierId) {
      conditions.push(eq(customerLoyalty.tierId, tierId));
    }

    // Get customers with tier info
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build orderBy based on sortBy param
    const orderByColumn = sortBy === 'totalOrders'
      ? customerLoyalty.totalOrders
      : sortBy === 'createdAt'
        ? customerLoyalty.createdAt
        : customerLoyalty.lifetimeSpend;

    const customers = await db.query.customerLoyalty.findMany({
      where: whereClause,
      with: {
        tier: true,
      },
      orderBy: sortOrder === 'desc' ? [desc(orderByColumn)] : [orderByColumn],
      limit,
      offset,
    });

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerLoyalty)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    return apiSuccess({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching loyalty customers:', error);
    return ApiError.internal('Failed to fetch loyalty customers');
  }
}

// PUT - Update customer tier manually
export async function PUT(request: NextRequest) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const body = await request.json();
    const { email, newTierId, notes } = body;

    if (!email || !newTierId) {
      return ApiError.validation('Email and new tier ID are required');
    }

    const result = await adjustCustomerTier(email, newTierId, undefined, notes);

    if (!result.success) {
      return ApiError.validation(result.error || 'Failed to update tier');
    }

    // Get updated customer
    const customer = await db.query.customerLoyalty.findFirst({
      where: eq(customerLoyalty.email, email.toLowerCase()),
      with: {
        tier: true,
      },
    });

    return apiSuccess({ customer }, 'Customer tier updated');
  } catch (error) {
    console.error('Error updating customer tier:', error);
    return ApiError.internal('Failed to update customer tier');
  }
}
