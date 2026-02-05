import { NextRequest } from 'next/server';
import { db, orders } from '@/lib/db';
import { eq, desc, or } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/user - Get orders for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required to view orders');
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const status = searchParams.get('status'); // Filter by status

    // Find orders by user ID or by email (for orders placed before account creation)
    const userOrders = await db.query.orders.findMany({
      where: or(
        eq(orders.userId, session.user.id),
        eq(orders.customerEmail, session.user.email)
      ),
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
    });

    // Filter by status if provided
    let filteredOrders = userOrders;
    if (status && status !== 'all') {
      filteredOrders = userOrders.filter(
        order => order.status?.toLowerCase() === status.toLowerCase()
      );
    }

    // Transform orders for the frontend
    const transformedOrders = filteredOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      status: order.status || 'pending',
      total: parseFloat(order.total || '0'),
      currency: (order.paymentDetails as any)?.currency || 'CAD',
      items: (order.items as any[]) || [],
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingNumber
        ? `https://track.canadapost.ca/search?searchFor=${order.trackingNumber}`
        : null,
      shippingAddress: {
        line1: order.shippingAddressLine1,
        line2: order.shippingAddressLine2,
        city: order.shippingCity,
        state: order.shippingProvince,
        zipCode: order.shippingPostalCode,
        country: order.shippingCountry,
      },
    }));

    return apiSuccess({
      orders: transformedOrders,
      total: transformedOrders.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return ApiError.internal('Failed to fetch orders');
  }
}
