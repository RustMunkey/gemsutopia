import { NextRequest } from 'next/server';
import { db, reviews } from '@/lib/db';
import { desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

// Verify admin token
function verifyAdminToken(request: NextRequest): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    jwt.verify(token, getJWTSecret());
    return true;
  } catch {
    return false;
  }
}

// GET /api/admin/reviews - Get all reviews for admin
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return ApiError.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let allReviews = await db.query.reviews.findMany({
      orderBy: [desc(reviews.createdAt)],
    });

    // Filter by status if not including all
    if (!includeInactive) {
      allReviews = allReviews.filter(r => r.status !== 'rejected');
    }

    return apiSuccess({
      reviews: allReviews,
      count: allReviews.length,
    });
  } catch {
    return ApiError.internal('Failed to fetch reviews');
  }
}
