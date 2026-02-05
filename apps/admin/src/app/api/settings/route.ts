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

  const allSettings = await db.query.siteSettings.findMany();

  const grouped: Record<string, Record<string, unknown>> = {};
  for (const s of allSettings) {
    const cat = s.category || 'general';
    if (!grouped[cat]) grouped[cat] = {};
    grouped[cat][s.key] = s.value;
  }

  return NextResponse.json({ data: grouped });
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { category, settings } = body as { category: string; settings: Record<string, unknown> };

  if (!category || !settings) {
    return NextResponse.json({ error: 'Category and settings required' }, { status: 400 });
  }

  for (const [key, value] of Object.entries(settings)) {
    await db
      .insert(siteSettings)
      .values({
        key,
        value: typeof value === 'string' ? JSON.stringify(value) : value as object,
        type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
        category,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: typeof value === 'string' ? JSON.stringify(value) : value as object,
          updatedAt: new Date().toISOString(),
        },
      });
  }

  return NextResponse.json({ data: { success: true } });
}
