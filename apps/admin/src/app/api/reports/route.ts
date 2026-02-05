import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, orders, products, users, auctions } from '@gemsutopia/database';
import { sql, eq, gte, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const period = request.nextUrl.searchParams.get('period') || 'monthly';
  const now = new Date();

  let startDate: Date;
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'quarterly':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'annual':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default: // monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const periodFilter = gte(orders.createdAt, startDate.toISOString());

  const [
    revenueResult,
    orderCountResult,
    avgOrderResult,
    newCustomersResult,
    topProductsResult,
    ordersByStatus,
    paymentMethods,
  ] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(total), 0)` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, 'paid'), periodFilter)),
    db.select({ count: sql<string>`COUNT(*)` })
      .from(orders)
      .where(periodFilter),
    db.select({ avg: sql<string>`COALESCE(AVG(total), 0)` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, 'paid'), periodFilter)),
    db.select({ count: sql<string>`COUNT(*)` })
      .from(users)
      .where(gte(users.createdAt, startDate.toISOString())),
    db.select({
      name: products.name,
      count: sql<string>`COUNT(*)`,
      revenue: sql<string>`COALESCE(SUM(oi.subtotal), 0)`,
    })
      .from(products)
      .leftJoin(sql`order_items oi`, sql`oi.product_id = ${products.id}`)
      .leftJoin(orders, sql`${orders.id} = oi.order_id`)
      .where(periodFilter)
      .groupBy(products.id, products.name)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5),
    db.select({
      status: orders.status,
      count: sql<string>`COUNT(*)`,
    })
      .from(orders)
      .where(periodFilter)
      .groupBy(orders.status),
    db.select({
      method: orders.paymentMethod,
      count: sql<string>`COUNT(*)`,
      total: sql<string>`COALESCE(SUM(total), 0)`,
    })
      .from(orders)
      .where(and(periodFilter, eq(orders.paymentStatus, 'paid')))
      .groupBy(orders.paymentMethod),
  ]);

  return NextResponse.json({
    data: {
      period,
      startDate: startDate.toISOString(),
      revenue: parseFloat(revenueResult[0]?.total || '0'),
      orderCount: parseInt(orderCountResult[0]?.count || '0'),
      avgOrderValue: parseFloat(avgOrderResult[0]?.avg || '0'),
      newCustomers: parseInt(newCustomersResult[0]?.count || '0'),
      topProducts: topProductsResult,
      ordersByStatus,
      paymentMethods,
    },
  });
}
