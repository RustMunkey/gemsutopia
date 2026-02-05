import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, reviews } from '@gemsutopia/database';
import { desc } from 'drizzle-orm';
import { triggerEvent } from '@gemsutopia/realtime';
import { invalidateReviewsCaches } from '@gemsutopia/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allReviews = await db.query.reviews.findMany({
    orderBy: [desc(reviews.createdAt)],
  });

  return NextResponse.json({ data: allReviews });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { reviewerName, content, rating, title } = body;

  if (!reviewerName || !content || !rating) {
    return NextResponse.json({ error: 'Name, content, and rating are required' }, { status: 400 });
  }

  const [created] = await db.insert(reviews).values({
    reviewerName,
    reviewerEmail: 'admin@gemsutopia.ca',
    content,
    rating: Math.min(5, Math.max(1, Number(rating))),
    title: title || null,
    status: 'approved',
    isFeatured: false,
  }).returning();

  await invalidateReviewsCaches();
  await triggerEvent('content', 'reviews-updated', { id: created.id });

  return NextResponse.json({ data: created }, { status: 201 });
}
