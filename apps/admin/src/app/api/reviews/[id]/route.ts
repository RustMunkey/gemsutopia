import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, reviews } from '@gemsutopia/database';
import { eq } from 'drizzle-orm';
import { triggerEvent } from '@gemsutopia/realtime';
import { invalidateReviewsCaches } from '@gemsutopia/cache';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, isFeatured, reviewerName, content, rating, title } = body;

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (status !== undefined) updateData.status = status;
  if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
  if (reviewerName !== undefined) updateData.reviewerName = reviewerName;
  if (content !== undefined) updateData.content = content;
  if (rating !== undefined) updateData.rating = Math.min(5, Math.max(1, Number(rating)));
  if (title !== undefined) updateData.title = title;

  const [updated] = await db.update(reviews).set(updateData).where(eq(reviews.id, id)).returning();

  if (!updated) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  await invalidateReviewsCaches();
  await triggerEvent('content', 'reviews-updated', { id: updated.id });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db.delete(reviews).where(eq(reviews.id, id)).returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  await invalidateReviewsCaches();
  await triggerEvent('content', 'reviews-updated', { id });

  return NextResponse.json({ data: { success: true } });
}
