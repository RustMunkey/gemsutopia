import { NextRequest, NextResponse } from 'next/server';
import { db, reviews } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

export const revalidate = 300;

export async function POST(request: NextRequest) {
  try {
    const { name, email, rating, title, review, productId } = await request.json();

    // Validate required fields
    if (!name || !email || !rating || !review) {
      return ApiError.validation('Name, email, rating, and review are required');
    }

    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      return ApiError.validation('Rating must be between 1 and 5');
    }

    // Validate character limits
    if (name.length > 50) {
      return ApiError.validation('Name must be 50 characters or less');
    }

    if (title && title.length > 100) {
      return ApiError.validation('Title must be 100 characters or less');
    }

    if (review.length > 500) {
      return ApiError.validation('Review must be 500 characters or less');
    }

    // Insert into database
    const [newReview] = await db
      .insert(reviews)
      .values({
        productId: productId || null,
        reviewerName: name,
        reviewerEmail: email,
        rating: parseInt(rating),
        title: title || null,
        content: review,
        isFeatured: false,
        status: 'pending',
        images: [],
      })
      .returning();

    return apiSuccess({ review: newReview }, 'Review submitted successfully', 201);
  } catch {
    return ApiError.internal('Failed to submit review');
  }
}

// GET /api/reviews - Get all approved reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';

    const cacheKey = featured ? `${CACHE_KEYS.REVIEWS}:featured` : CACHE_KEYS.REVIEWS;

    // Try Redis cache first
    const cached = await getCache<{ reviews: unknown[]; count: number }>(cacheKey);
    if (cached) {
      return NextResponse.json(
        { success: true, data: cached },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
      );
    }

    let allReviews = await db.query.reviews.findMany({
      where: eq(reviews.status, 'approved'),
      orderBy: [desc(reviews.createdAt)],
    });

    if (featured) {
      allReviews = allReviews.filter(r => r.isFeatured);
    }

    const responseData = { reviews: allReviews, count: allReviews.length };

    // Cache in Redis
    await setCache(cacheKey, responseData, CACHE_TTL.REVIEWS);

    return NextResponse.json(
      { success: true, data: responseData },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch {
    return ApiError.internal('Failed to fetch reviews');
  }
}
