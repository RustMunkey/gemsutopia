import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, contactSubmissions } from '@gemsutopia/database';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messages = await db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.createdAt));

  return NextResponse.json({ data: messages });
}
