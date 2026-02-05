import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, orders } from '@gemsutopia/database';
import { eq, desc, ilike, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get('search');
  const status = request.nextUrl.searchParams.get('status');
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '25');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${orders.orderNumber} ILIKE ${'%' + search + '%'} OR ${orders.customerEmail} ILIKE ${'%' + search + '%'} OR ${orders.customerName} ILIKE ${'%' + search + '%'})`
    );
  }
  if (status && status !== 'all') {
    conditions.push(eq(orders.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [allOrders, countResult] = await Promise.all([
    db.query.orders.findMany({
      where,
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
    }),
    db.select({ count: sql<string>`COUNT(*)` }).from(orders).where(where),
  ]);

  return NextResponse.json({
    data: allOrders,
    pagination: {
      page,
      limit,
      total: parseInt(countResult[0]?.count || '0'),
    },
  });
}
