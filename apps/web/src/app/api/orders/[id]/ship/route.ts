import { NextRequest } from 'next/server';
import { db, orders } from '@/lib/db';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { notifyOrderShipped } from '@/lib/email';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function verifyAdminToken(request: NextRequest): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    jwt.verify(token, getJWTSecret());
    return true;
  } catch {
    return false;
  }
}

// POST /api/orders/[id]/ship - Mark order as shipped and send notification
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!verifyAdminToken(request)) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { id } = await params;
    const body = await request.json();
    const { trackingNumber, trackingUrl, carrier } = body;

    // Get the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!order) {
      return ApiError.notFound('Order');
    }

    // Update order status and add tracking info
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: 'shipped',
        trackingNumber: trackingNumber || null,
        carrier: carrier || null,
        carrierTrackingUrl: trackingUrl || null,
        shippedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      return ApiError.internal('Failed to update order');
    }

    // Parse order items
    const items = Array.isArray(order.items)
      ? order.items
      : typeof order.items === 'string'
        ? JSON.parse(order.items)
        : [];

    // Extract customer name parts (if stored as "First Last" format)
    const nameParts = (order.customerName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Send shipping notification email
    notifyOrderShipped({
      orderId: order.id,
      customerEmail: order.customerEmail || '',
      customerName: order.customerName || '',
      items: items.map((item: { name?: string; price?: number; quantity?: number }) => ({
        name: item.name || 'Unknown Item',
        price: item.price || 0,
        quantity: item.quantity || 1,
      })),
      subtotal: parseFloat(order.subtotal || '0'),
      shipping: parseFloat(order.shippingCost || '0'),
      total: parseFloat(order.total || '0'),
      currency: 'CAD',
      trackingNumber,
      trackingUrl,
      shippingAddress: {
        firstName,
        lastName,
        address: order.shippingAddressLine1 || '',
        apartment: order.shippingAddressLine2 || undefined,
        city: order.shippingCity || '',
        state: order.shippingProvince || '',
        zipCode: order.shippingPostalCode || '',
        country: order.shippingCountry || 'Canada',
        phone: order.customerPhone || undefined,
      },
    }).catch(() => {
      // Email sending failed - don't block response
    });

    return apiSuccess({ order: updatedOrder }, 'Order marked as shipped and customer notified');
  } catch {
    return ApiError.internal('Failed to update shipping status');
  }
}
