import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { refundRequests, orders, payments } from '@/lib/db/schema';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET - List all refund requests (admin)
export async function GET(request: NextRequest) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(refundRequests.status, status));
    }

    if (search) {
      conditions.push(
        or(
          ilike(refundRequests.orderNumber, `%${search}%`),
          ilike(refundRequests.customerEmail, `%${search}%`),
          ilike(refundRequests.customerName, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(refundRequests)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    // Get refund requests with pagination
    const requests = await db.query.refundRequests.findMany({
      where: whereClause,
      orderBy: [desc(refundRequests.createdAt)],
      limit,
      offset,
    });

    // Get status counts
    const statusCounts = await db
      .select({
        status: refundRequests.status,
        count: sql<number>`count(*)`,
      })
      .from(refundRequests)
      .groupBy(refundRequests.status);

    const counts = {
      pending: 0,
      under_review: 0,
      approved: 0,
      denied: 0,
      refunded: 0,
      cancelled: 0,
    };

    statusCounts.forEach((row) => {
      if (row.status && row.status in counts) {
        counts[row.status as keyof typeof counts] = Number(row.count);
      }
    });

    return apiSuccess({
      refundRequests: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts,
    });
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    return ApiError.internal('Failed to fetch refund requests');
  }
}
