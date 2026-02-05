import { NextRequest } from 'next/server';
import { db, orders } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET /api/orders/[id] - Customer can view their own order
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return ApiError.validation('Order ID is required');
    }

    // Check if request is from authenticated user
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    // Guest access: Check for email query param (for order confirmation pages)
    const email = request.nextUrl.searchParams.get('email');

    // Fetch order from database
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return ApiError.notFound('Order');
    }

    // Authorization check
    // 1. Authenticated user can see their own orders
    if (session?.user) {
      const isOwner =
        order.userId === session.user.id || order.customerEmail === session.user.email;
      if (isOwner) {
        return apiSuccess({ order });
      }
    }

    // 2. Guest with matching email can see their order (for order confirmation)
    if (email && order.customerEmail === email.toLowerCase()) {
      return apiSuccess({ order });
    }

    // No valid authorization
    return ApiError.forbidden('You do not have permission to view this order');
  } catch {
    return ApiError.internal('Failed to fetch order');
  }
}

// DELETE /api/orders/[id] - Admin functionality moved to JetBeans BaaS
