import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, siteSettings } from '@gemsutopia/database';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await db.query.siteSettings.findMany({
    where: eq(siteSettings.category, 'seo'),
  });

  const data: Record<string, string> = {};
  for (const s of settings) {
    data[s.key] = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
  }

  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { fields } = body as { fields: Record<string, string> };

  if (!fields || typeof fields !== 'object') {
    return NextResponse.json({ error: 'Fields object is required' }, { status: 400 });
  }

  for (const [key, value] of Object.entries(fields)) {
    await db
      .insert(siteSettings)
      .values({
        key,
        value: JSON.stringify(value),
        type: 'string',
        category: 'seo',
        label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        isPublic: true,
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: JSON.stringify(value),
          updatedAt: new Date().toISOString(),
        },
      });
  }

  return NextResponse.json({ data: { success: true } });
}
