import { NextRequest } from 'next/server';
import { db, orders } from '@/lib/db';
import { eq, or } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { verifyAdminToken } from '@/lib/auth/adminAuth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return ApiError.validation('Order ID is required');
    }

    // Check if request is from admin
    const adminUser = verifyAdminToken(request);

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
    // 1. Admin can see all orders
    if (adminUser) {
      return apiSuccess({ order });
    }

    // 2. Authenticated user can see their own orders
    if (session?.user) {
      const isOwner =
        order.userId === session.user.id || order.customerEmail === session.user.email;
      if (isOwner) {
        return apiSuccess({ order });
      }
    }

    // 3. Guest with matching email can see their order (for order confirmation)
    if (email && order.customerEmail === email.toLowerCase()) {
      return apiSuccess({ order });
    }

    // No valid authorization
    return ApiError.forbidden('You do not have permission to view this order');
  } catch {
    return ApiError.internal('Failed to fetch order');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return ApiError.validation('Order ID is required');
    }

    // Only admins can delete orders
    const adminUser = verifyAdminToken(request);
    if (!adminUser) {
      return ApiError.unauthorized('Admin access required to delete orders');
    }

    // Fetch the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { id: true, paymentDetails: true },
    });

    if (!order) {
      return ApiError.notFound('Order');
    }

    // Check if it's a live order based on payment details
    const paymentDetails = order.paymentDetails as Record<string, unknown>;
    const paymentId = paymentDetails?.payment_id as string;
    const isTestOrder =
      paymentId?.includes('test') || paymentId?.includes('sandbox') || !paymentId;

    if (!isTestOrder) {
      return ApiError.forbidden('Live orders cannot be deleted');
    }

    // Delete the test order
    await db.delete(orders).where(eq(orders.id, orderId));

    return apiSuccess(null, 'Test order deleted successfully');
  } catch {
    return ApiError.internal('Failed to delete order');
  }
}
