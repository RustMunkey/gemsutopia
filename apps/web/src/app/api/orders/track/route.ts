import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';

// Carrier tracking URL templates
const CARRIER_TRACKING_URLS: Record<string, string> = {
  canada_post: 'https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=',
  ups: 'https://www.ups.com/track?tracknum=',
  fedex: 'https://www.fedex.com/fedextrack/?trknbr=',
  purolator: 'https://www.purolator.com/en/ship-track/tracking-details.page?pin=',
  dhl: 'https://www.dhl.com/en/express/tracking.html?AWB=',
  usps: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
};

// GET - Track an order by order number or email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');

    if (!orderNumber) {
      return ApiError.validation('Order number is required');
    }

    // Find the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber),
    });

    if (!order) {
      return ApiError.notFound('Order');
    }

    // If email provided, verify it matches (for guest orders)
    if (email && order.customerEmail.toLowerCase() !== email.toLowerCase()) {
      return ApiError.notFound('Order'); // Don't reveal order exists
    }

    // Build tracking URL if we have tracking number and carrier
    let trackingUrl = order.carrierTrackingUrl;
    if (!trackingUrl && order.trackingNumber && order.carrier) {
      const carrierKey = order.carrier.toLowerCase().replace(/\s+/g, '_');
      const template = CARRIER_TRACKING_URLS[carrierKey];
      if (template) {
        trackingUrl = template + order.trackingNumber;
      }
    }

    // Return order tracking info (limited data for security)
    return apiSuccess({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      estimatedDelivery: order.estimatedDelivery,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      trackingUrl,
      shippingMethod: order.shippingMethod,
      // Only show city/country for privacy
      shippingDestination: order.shippingCity && order.shippingCountry
        ? `${order.shippingCity}, ${order.shippingCountry}`
        : null,
      timeline: buildOrderTimeline(order),
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return ApiError.internal('Failed to track order');
  }
}

// Build order timeline
function buildOrderTimeline(order: {
  status: string | null;
  createdAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  paymentStatus: string | null;
}) {
  const timeline = [];

  // Order placed
  timeline.push({
    status: 'Order Placed',
    date: order.createdAt,
    completed: true,
  });

  // Payment
  timeline.push({
    status: 'Payment Confirmed',
    date: order.paymentStatus === 'paid' ? order.createdAt : null,
    completed: order.paymentStatus === 'paid',
  });

  // Processing
  timeline.push({
    status: 'Processing',
    date: order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered'
      ? order.createdAt
      : null,
    completed: ['processing', 'shipped', 'delivered'].includes(order.status || ''),
  });

  // Shipped
  timeline.push({
    status: 'Shipped',
    date: order.shippedAt,
    completed: order.status === 'shipped' || order.status === 'delivered',
  });

  // Delivered
  timeline.push({
    status: 'Delivered',
    date: order.deliveredAt,
    completed: order.status === 'delivered',
  });

  return timeline;
}
