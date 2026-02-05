import { NextRequest, NextResponse } from 'next/server';
import { db, siteContent } from '@gemsutopia/database';
import { triggerEvent } from '@gemsutopia/realtime';
import { deleteCache } from '@gemsutopia/cache';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT update content by id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { value, contentType, isActive } = body;

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (value !== undefined) updateData.value = value;
  if (contentType !== undefined) updateData.contentType = contentType;
  if (isActive !== undefined) updateData.isActive = isActive;

  const [updated] = await db.update(siteContent)
    .set(updateData)
    .where(eq(siteContent.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  // Invalidate public content cache
  await deleteCache('content:site-content');

  // Trigger real-time update with actual data for text fields (fast inline update)
  // For large values (images), just signal a refetch
  const isLargeValue = updated.value && updated.value.length > 1000;
  const eventPayload = isLargeValue
    ? { section: updated.section, key: updated.key, refetch: true }
    : { section: updated.section, key: updated.key, value: updated.value };

  await triggerEvent('content', 'content-updated', eventPayload);
  if (updated.section === 'hero') {
    await triggerEvent('content', 'hero-updated', eventPayload);
  }

  return NextResponse.json({ success: true, data: updated });
}

// DELETE content by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db.delete(siteContent)
    .where(eq(siteContent.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  }

  // Invalidate public content cache
  await deleteCache('content:site-content');

  // Trigger real-time update
  await triggerEvent('content', 'content-updated', { section: deleted.section, key: deleted.key });
  if (deleted.section === 'hero') {
    await triggerEvent('content', 'hero-updated', { key: deleted.key });
  }

  return NextResponse.json({ success: true, message: 'Deleted' });
}
