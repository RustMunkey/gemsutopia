import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, stats } from '@gemsutopia/database';
import { asc } from 'drizzle-orm';
import { triggerEvent } from '@gemsutopia/realtime';
import { deleteCache } from '@gemsutopia/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allStats = await db.query.stats.findMany({
    orderBy: [asc(stats.sortOrder)],
  });

  return NextResponse.json({ data: allStats });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, value, sortOrder } = body;

  if (!title || !value) {
    return NextResponse.json({ error: 'Title and value are required' }, { status: 400 });
  }

  const [created] = await db.insert(stats).values({
    title,
    value,
    sortOrder: sortOrder ?? 0,
    isActive: true,
  }).returning();

  await deleteCache('content:stats');
  await triggerEvent('content', 'stats-created', { id: created.id });

  return NextResponse.json({ data: created }, { status: 201 });
}
