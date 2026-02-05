import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, orders, products, users, auctions } from '@gemsutopia/database';
import { sql, eq, desc, gte, and, lt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalRevenueResult,
    monthlyRevenueResult,
    totalOrdersResult,
    recentOrdersCount,
    totalProductsResult,
    totalCustomersResult,
    recentOrders,
    lowStockProducts,
    activeAuctions,
    pendingOrders,
  ] = await Promise.all([
    // Total revenue (paid orders)
    db.select({ total: sql<string>`COALESCE(SUM(total), 0)` })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid')),
    // Monthly revenue
    db.select({ total: sql<string>`COALESCE(SUM(total), 0)` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, 'paid'), gte(orders.createdAt, thirtyDaysAgo.toISOString()))),
    // Total orders
    db.select({ count: sql<string>`COUNT(*)` }).from(orders),
    // Recent orders (7 days)
    db.select({ count: sql<string>`COUNT(*)` })
      .from(orders)
      .where(gte(orders.createdAt, sevenDaysAgo.toISOString())),
    // Total products
    db.select({ count: sql<string>`COUNT(*)` })
      .from(products)
      .where(eq(products.isActive, true)),
    // Total customers
    db.select({ count: sql<string>`COUNT(*)` }).from(users),
    // Recent 5 orders
    db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      total: orders.total,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
    })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5),
    // Low stock products
    db.select({
      id: products.id,
      name: products.name,
      inventory: products.inventory,
      lowStockThreshold: products.lowStockThreshold,
      images: products.images,
    })
      .from(products)
      .where(and(
        eq(products.isActive, true),
        eq(products.trackInventory, true),
        lt(products.inventory, sql`${products.lowStockThreshold}`)
      ))
      .orderBy(products.inventory)
      .limit(5),
    // Active auctions
    db.select({ count: sql<string>`COUNT(*)` })
      .from(auctions)
      .where(eq(auctions.status, 'active')),
    // Pending orders
    db.select({ count: sql<string>`COUNT(*)` })
      .from(orders)
      .where(eq(orders.status, 'pending')),
  ]);

  return NextResponse.json({
    data: {
      stats: {
        totalRevenue: parseFloat(totalRevenueResult[0]?.total || '0'),
        monthlyRevenue: parseFloat(monthlyRevenueResult[0]?.total || '0'),
        totalOrders: parseInt(totalOrdersResult[0]?.count || '0'),
        recentOrders: parseInt(recentOrdersCount[0]?.count || '0'),
        totalProducts: parseInt(totalProductsResult[0]?.count || '0'),
        totalCustomers: parseInt(totalCustomersResult[0]?.count || '0'),
        activeAuctions: parseInt(activeAuctions[0]?.count || '0'),
        pendingOrders: parseInt(pendingOrders[0]?.count || '0'),
      },
      recentOrders,
      lowStockProducts,
    },
  });
}
