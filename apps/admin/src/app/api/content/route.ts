import { NextRequest, NextResponse } from 'next/server';
import { db, siteContent } from '@gemsutopia/database';
import { triggerEvent } from '@gemsutopia/realtime';
import { deleteCache } from '@gemsutopia/cache';
import { eq, asc } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET site content - supports ?section=X&key=Y for specific items
// By default strips large values (base64 images) for fast loading
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const section = request.nextUrl.searchParams.get('section');
  const key = request.nextUrl.searchParams.get('key');
  const full = request.nextUrl.searchParams.get('full') === 'true';

  let content;
  if (section && key) {
    // Specific item - always return full value
    content = await db.query.siteContent.findMany({
      where: (fields, { and, eq: eqOp }) => and(eqOp(fields.section, section), eqOp(fields.key, key)),
    });
    return NextResponse.json({ success: true, data: content });
  }

  content = await db.query.siteContent.findMany({
    orderBy: [asc(siteContent.section), asc(siteContent.key)],
  });

  // Strip large values (base64 blobs) unless ?full=true
  if (!full) {
    content = content.map(item => {
      if (item.value && item.value.length > 1000) {
        return { ...item, value: '__LARGE_VALUE__', valueLength: item.value.length };
      }
      return item;
    });
  }

  return NextResponse.json({ success: true, data: content });
}

// POST create new content
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { section, key, value, contentType = 'text', isActive = true } = body;

  if (!section || !key || value === undefined) {
    return NextResponse.json({ error: 'section, key, and value are required' }, { status: 400 });
  }

  const [created] = await db.insert(siteContent).values({
    section,
    key,
    value,
    contentType,
    isActive,
  }).returning();

  // Invalidate public content cache
  await deleteCache('content:site-content');

  // Trigger real-time update
  await triggerEvent('content', 'content-updated', { section, key });
  if (section === 'hero') {
    await triggerEvent('content', 'hero-updated', { key });
  }

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
