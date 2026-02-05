import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, faq } from '@gemsutopia/database';
import { eq } from 'drizzle-orm';
import { triggerEvent } from '@gemsutopia/realtime';
import { invalidateContentCaches } from '@gemsutopia/cache';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { question, answer, sortOrder, isActive } = body;

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (question !== undefined) updateData.question = question;
  if (answer !== undefined) updateData.answer = answer;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (isActive !== undefined) updateData.isActive = isActive;

  const [updated] = await db.update(faq).set(updateData).where(eq(faq.id, id)).returning();

  if (!updated) {
    return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
  }

  await invalidateContentCaches('faq');
  await triggerEvent('content', 'faq-updated', { id: updated.id });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db.delete(faq).where(eq(faq.id, id)).returning();

  if (!deleted) {
    return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
  }

  await invalidateContentCaches('faq');
  await triggerEvent('content', 'faq-updated', { id });

  return NextResponse.json({ data: { success: true } });
}
