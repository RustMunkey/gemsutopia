import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, users, orders } from '@gemsutopia/database';
import { eq, desc, ilike, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get('search');
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '25');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${users.email} ILIKE ${'%' + search + '%'} OR ${users.name} ILIKE ${'%' + search + '%'})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [allUsers, countResult] = await Promise.all([
    db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      city: users.city,
      province: users.province,
      country: users.country,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      orderCount: sql<string>`(SELECT COUNT(*) FROM orders WHERE orders.user_id = ${users.id})`,
      totalSpent: sql<string>`(SELECT COALESCE(SUM(total), 0) FROM orders WHERE orders.user_id = ${users.id} AND orders.payment_status = 'paid')`,
    })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<string>`COUNT(*)` }).from(users).where(where),
  ]);

  return NextResponse.json({
    data: allUsers,
    pagination: {
      page,
      limit,
      total: parseInt(countResult[0]?.count || '0'),
    },
  });
}
