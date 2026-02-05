import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, siteContent } from '@gemsutopia/database';
import { eq } from 'drizzle-orm';
import { deleteCache } from '@gemsutopia/cache';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { section } = await params;

  const rows = await db.query.siteContent.findMany({
    where: eq(siteContent.section, section),
  });

  // Transform to key-value object
  const content: Record<string, string> = {};
  for (const row of rows) {
    content[row.key] = row.value;
  }

  return NextResponse.json({ data: content });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { section } = await params;
  const body = await request.json();
  const { fields } = body as { fields: Record<string, string> };

  if (!fields || typeof fields !== 'object') {
    return NextResponse.json({ error: 'Fields object is required' }, { status: 400 });
  }

  // Upsert each field
  for (const [key, value] of Object.entries(fields)) {
    await db
      .insert(siteContent)
      .values({
        section,
        key,
        value: value || '',
        contentType: 'text',
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [siteContent.section, siteContent.key],
        set: {
          value: value || '',
          updatedAt: new Date().toISOString(),
        },
      });
  }

  await deleteCache(`content:${section}`);

  return NextResponse.json({ data: { success: true } });
}
