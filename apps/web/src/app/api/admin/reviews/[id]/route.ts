import { NextRequest } from 'next/server';
import { db, reviews } from '@/lib/db';
import { eq } from 'drizzle-orm';
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

// PUT /api/admin/reviews/[id] - Update review (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return ApiError.unauthorized();
    }

    const data = await request.json();

    // Prepare update data (only include fields that are provided)
    const updateData: Partial<typeof reviews.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    // Map is_approved to status
    if (data.is_approved !== undefined) {
      updateData.status = data.is_approved ? 'approved' : 'pending';
    }
    if (data.is_featured !== undefined) updateData.isFeatured = data.is_featured;
    if (data.customer_name !== undefined) updateData.reviewerName = data.customer_name;
    if (data.rating !== undefined) updateData.rating = parseInt(data.rating);
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;

    const [updatedReview] = await db
      .update(reviews)
      .set(updateData)
      .where(eq(reviews.id, resolvedParams.id))
      .returning();

    if (!updatedReview) {
      return ApiError.notFound('Review');
    }

    return apiSuccess({ review: updatedReview }, 'Review updated successfully');
  } catch {
    return ApiError.internal('Failed to update review');
  }
}

// DELETE /api/admin/reviews/[id] - Delete review (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return ApiError.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // Permanent delete
      await db.delete(reviews).where(eq(reviews.id, resolvedParams.id));
    } else {
      // Soft delete (mark as rejected)
      await db.update(reviews).set({ status: 'rejected' }).where(eq(reviews.id, resolvedParams.id));
    }

    return apiSuccess(null, permanent ? 'Review deleted permanently' : 'Review deactivated');
  } catch {
    return ApiError.internal('Failed to delete review');
  }
}
