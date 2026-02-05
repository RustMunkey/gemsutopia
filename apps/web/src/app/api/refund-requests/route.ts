import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { refundRequests, orders } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// POST - Submit a refund request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      reason,
      reasonDetails,
      requestedAmount,
      items,
      attachments,
    } = body;

    // Validate required fields
    if (!orderId || !reason) {
      return ApiError.validation('Order ID and reason are required');
    }

    // Get the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return ApiError.notFound('Order');
    }

    // Check if order is eligible for refund (not already refunded, not too old, etc.)
    if (order.status === 'refunded') {
      return ApiError.validation('This order has already been refunded');
    }

    if (order.paymentStatus === 'refunded') {
      return ApiError.validation('This order has already been refunded');
    }

    // Check for existing pending refund request
    const existingRequest = await db.query.refundRequests.findFirst({
      where: and(
        eq(refundRequests.orderId, orderId),
        eq(refundRequests.status, 'pending')
      ),
    });

    if (existingRequest) {
      return ApiError.validation('A refund request for this order is already pending');
    }

    // Get session to check if user owns this order
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // If logged in, verify order belongs to user
    if (session?.user?.id && order.userId && session.user.id !== order.userId) {
      return ApiError.forbidden('You can only request refunds for your own orders');
    }

    // Calculate refund amount (default to order total if not specified)
    const refundAmount = requestedAmount || order.total;

    // Validate refund amount doesn't exceed order total
    if (Number(refundAmount) > Number(order.total)) {
      return ApiError.validation('Refund amount cannot exceed order total');
    }

    // Create the refund request
    const [refundRequest] = await db
      .insert(refundRequests)
      .values({
        orderId,
        orderNumber: order.orderNumber,
        userId: session?.user?.id || order.userId,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        reason,
        reasonDetails: reasonDetails || null,
        requestedAmount: refundAmount.toString(),
        items: items || [],
        attachments: attachments || [],
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      })
      .returning();

    return apiSuccess(
      { refundRequest },
      'Refund request submitted successfully',
      201
    );
  } catch (error) {
    console.error('Error creating refund request:', error);
    return ApiError.internal('Failed to submit refund request');
  }
}

// GET - Get user's refund requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const orderId = searchParams.get('orderId');

    // Build query conditions
    let whereCondition;

    if (session?.user?.id) {
      // Logged in user - get their requests
      whereCondition = eq(refundRequests.userId, session.user.id);
    } else if (email) {
      // Guest user - get by email
      whereCondition = eq(refundRequests.customerEmail, email);
    } else if (orderId) {
      // Get by order ID
      whereCondition = eq(refundRequests.orderId, orderId);
    } else {
      return ApiError.unauthorized('Please log in or provide email to view refund requests');
    }

    const requests = await db.query.refundRequests.findMany({
      where: whereCondition,
      orderBy: [desc(refundRequests.createdAt)],
    });

    return apiSuccess({ refundRequests: requests });
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    return ApiError.internal('Failed to fetch refund requests');
  }
}
