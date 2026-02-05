import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, orders, contactSubmissions, products } from '@gemsutopia/database';
import { eq, and, sql, desc, lte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'stock';
  title: string;
  description: string;
  time: string;
  link: string;
  read: boolean;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications: Notification[] = [];

    // Fetch recent pending orders (last 7 days)
    const recentOrders = await db.query.orders.findMany({
      where: eq(orders.status, 'pending'),
      orderBy: [desc(orders.createdAt)],
      columns: { id: true, orderNumber: true, customerName: true, total: true, createdAt: true },
      limit: 10,
    }).catch(() => []);

    for (const order of recentOrders) {
      notifications.push({
        id: `order-${order.id}`,
        type: 'order',
        title: `New Order #${order.orderNumber}`,
        description: `${order.customerName || 'Customer'} - $${parseFloat(order.total).toFixed(2)}`,
        time: order.createdAt || new Date().toISOString(),
        link: '/orders',
        read: false,
      });
    }

    // Fetch unread messages
    const newMessages = await db.query.contactSubmissions.findMany({
      where: eq(contactSubmissions.status, 'new'),
      orderBy: [desc(contactSubmissions.createdAt)],
      columns: { id: true, name: true, subject: true, createdAt: true },
      limit: 10,
    }).catch(() => []);

    for (const msg of newMessages) {
      notifications.push({
        id: `msg-${msg.id}`,
        type: 'message',
        title: `New message from ${msg.name}`,
        description: msg.subject || 'No subject',
        time: msg.createdAt || new Date().toISOString(),
        link: '/messages',
        read: false,
      });
    }

    // Fetch low stock alerts
    const lowStockProducts = await db
      .select({
        id: products.id,
        name: products.name,
        inventory: products.inventory,
        lowStockThreshold: products.lowStockThreshold,
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.inventory} <= ${products.lowStockThreshold}`
        )
      )
      .limit(10)
      .catch(() => []);

    for (const product of lowStockProducts) {
      notifications.push({
        id: `stock-${product.id}`,
        type: 'stock',
        title: `Low stock: ${product.name}`,
        description: `${product.inventory} remaining`,
        time: new Date().toISOString(),
        link: '/products',
        read: false,
      });
    }

    // Sort all by time, newest first
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      data: notifications.slice(0, 20),
      unreadCount: notifications.length,
    });
  } catch {
    return NextResponse.json({ data: [], unreadCount: 0 });
  }
}
