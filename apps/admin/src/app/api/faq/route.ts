import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, faq } from '@gemsutopia/database';
import { asc } from 'drizzle-orm';
import { triggerEvent } from '@gemsutopia/realtime';
import { invalidateContentCaches } from '@gemsutopia/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await db.query.faq.findMany({
    orderBy: [asc(faq.sortOrder)],
  });

  return NextResponse.json({ data: items });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { question, answer, sortOrder } = body;

  if (!question || !answer) {
    return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
  }

  const [created] = await db.insert(faq).values({
    question,
    answer,
    sortOrder: sortOrder ?? 0,
    isActive: true,
  }).returning();

  await invalidateContentCaches('faq');
  await triggerEvent('content', 'faq-updated', { id: created.id });

  return NextResponse.json({ data: created }, { status: 201 });
}
