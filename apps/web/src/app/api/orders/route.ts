import { NextRequest } from 'next/server';
import { db, orders, products } from '@/lib/db';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { filterOrdersByMode } from '@/lib/utils/orderUtils';
import { requireAdmin, extractAuth, checkRateLimit } from '@/lib/security/apiAuth';
import {
  sanitizeInput,
  validateEmail,
  validateRequiredFields,
  sanitizeObject,
  sanitizeEmail,
} from '@/lib/security/sanitize';
import { notifyOrderConfirmed } from '@/lib/email';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Function to determine if an order is a test order based on payment details and system mode
function isTestOrderFromPayment(orderData: any, systemMode?: string): boolean {
  const { payment } = orderData;

  // If system mode is explicitly set, use it (from admin dashboard toggle)
  if (systemMode === 'live') {
    return false;
  }
  if (systemMode === 'dev' || systemMode === 'test') {
    return true;
  }

  // Fallback to auto-detection based on payment details
  switch (payment.paymentMethod) {
    case 'stripe':
    case 'card':
      return payment.paymentIntentId?.startsWith('pi_test_') || false;

    case 'paypal':
      return payment.captureID?.includes('sandbox') || payment.captureID?.includes('test') || false;

    case 'crypto':
      if (
        payment.network?.includes('mainnet') ||
        payment.network?.includes('bitcoin') ||
        payment.network?.includes('ethereum-mainnet')
      ) {
        return false;
      }
      return (
        payment.network?.includes('testnet') ||
        payment.network?.includes('devnet') ||
        payment.network?.includes('sepolia') ||
        true
      );

    default:
      return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    const isAuthenticated = auth.isAuthenticated;

    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const maxRequests = isAuthenticated ? 100 : 10;
    const rateLimit = checkRateLimit(clientIP, maxRequests, 3600000);

    if (!rateLimit.allowed) {
      return ApiError.rateLimited('Too many order attempts. Please wait before creating another order.');
    }

    const rawOrderData = await request.json();
    const orderData = sanitizeObject(rawOrderData);

    // Validate required fields
    if (!orderData.customerInfo || !orderData.payment || !orderData.totals) {
      return ApiError.validation('Missing required order data');
    }

    const requiredCustomerFields = [
      'email',
      'firstName',
      'lastName',
      'address',
      'city',
      'state',
      'zipCode',
      'country',
    ];
    const fieldValidation = validateRequiredFields(orderData.customerInfo, requiredCustomerFields);

    if (!fieldValidation.isValid) {
      return ApiError.validation(
        `Missing customer information: ${fieldValidation.missingFields.join(', ')}`
      );
    }

    if (!validateEmail(orderData.customerInfo.email)) {
      return ApiError.validation('Invalid email address format');
    }

    orderData.customerInfo.email = sanitizeEmail(orderData.customerInfo.email);
    orderData.customerInfo.firstName = sanitizeInput(orderData.customerInfo.firstName);
    orderData.customerInfo.lastName = sanitizeInput(orderData.customerInfo.lastName);

    if (!orderData.payment.paymentMethod) {
      return ApiError.validation('Missing payment method');
    }

    const requiredTotalFields = ['subtotal', 'total'];
    const missingTotalFields = requiredTotalFields.filter(
      field => orderData.totals[field] === undefined || orderData.totals[field] === null
    );
    if (missingTotalFields.length > 0) {
      return ApiError.validation(`Missing order totals: ${missingTotalFields.join(', ')}`);
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return ApiError.validation('Order must contain at least one item');
    }

    // Pre-validate inventory
    const productIds = orderData.items.filter((item: any) => item.id).map((item: any) => item.id);

    if (productIds.length > 0) {
      const productsData = await db.query.products.findMany({
        where: inArray(products.id, productIds),
        columns: {
          id: true,
          inventory: true,
          name: true,
        },
      });

      const productMap = new Map(productsData.map(p => [p.id, p]));

      for (const item of orderData.items) {
        if (item.id && item.quantity) {
          const productData = productMap.get(item.id);
          if (!productData) {
            return ApiError.notFound('Product');
          }

          const currentInventory = productData.inventory || 0;
          if (currentInventory < item.quantity) {
            return ApiError.conflict(
              `Insufficient inventory for ${productData.name}. Only ${currentInventory} left in stock.`,
              {
                insufficientItems: [
                  {
                    id: item.id,
                    name: productData.name,
                    requested: item.quantity,
                    available: currentInventory,
                  },
                ],
              }
            );
          }
        }
      }
    }

    const systemMode =
      request.headers.get('x-system-mode') || new URL(request.url).searchParams.get('mode');

    const isTestOrder = isTestOrderFromPayment(orderData, systemMode || undefined);

    // Generate order number
    const orderNumber = `GEM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Prepare order data for database insert
    const orderRecord = {
      orderNumber,
      customerEmail: orderData.customerInfo.email,
      customerName: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
      shippingAddress: {
        firstName: orderData.customerInfo.firstName,
        lastName: orderData.customerInfo.lastName,
        address: orderData.customerInfo.address,
        apartment: orderData.customerInfo.apartment || null,
        city: orderData.customerInfo.city,
        state: orderData.customerInfo.state,
        zipCode: orderData.customerInfo.zipCode,
        country: orderData.customerInfo.country,
        phone: orderData.customerInfo.phone || null,
      },
      items: orderData.items,
      paymentDetails: {
        method: orderData.payment.paymentMethod,
        payment_id:
          orderData.payment.paymentIntentId ||
          orderData.payment.captureID ||
          orderData.payment.transactionId,
        amount: orderData.totals.total,
        currency: orderData.payment.currency || 'CAD',
        ...(orderData.payment.paymentMethod === 'crypto' && {
          crypto_type: orderData.payment.cryptoType,
          crypto_amount: orderData.payment.cryptoAmount,
          crypto_currency: orderData.payment.cryptoCurrency,
          wallet_address: orderData.payment.walletAddress,
          network: orderData.payment.network,
        }),
      },
      subtotal: String(parseFloat(orderData.totals.subtotal) || 0),
      shipping: String(parseFloat(orderData.totals.shipping) || 0),
      tax: String(parseFloat(orderData.totals.tax) || 0),
      total: String(parseFloat(orderData.totals.total) || 0),
      status: 'confirmed',
    };

    const [newOrder] = await db.insert(orders).values(orderRecord).returning();

    if (!newOrder) {
      return ApiError.internal('Order creation failed - no data returned');
    }

    // Update product inventory after successful order
    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        if (item.id && item.quantity) {
          try {
            await db
              .update(products)
              .set({
                inventory: sql`${products.inventory} - ${item.quantity}`,
              })
              .where(eq(products.id, item.id));
          } catch {
            // Inventory update failed, order still created
          }
        }
      }
    }

    // Send order confirmation emails (non-blocking)
    notifyOrderConfirmed({
      orderId: newOrder.id,
      customerEmail: orderData.customerInfo.email,
      customerName: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
      items: orderData.items.map((item: { name: string; price: number; quantity: number }) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: parseFloat(orderData.totals.subtotal) || 0,
      shipping: parseFloat(orderData.totals.shipping) || 0,
      total: parseFloat(orderData.totals.total) || 0,
      currency: orderData.payment.currency || 'CAD',
      shippingAddress: {
        firstName: orderData.customerInfo.firstName,
        lastName: orderData.customerInfo.lastName,
        address: orderData.customerInfo.address,
        apartment: orderData.customerInfo.apartment,
        city: orderData.customerInfo.city,
        state: orderData.customerInfo.state,
        zipCode: orderData.customerInfo.zipCode,
        country: orderData.customerInfo.country,
        phone: orderData.customerInfo.phone,
      },
    }).catch(() => {
      // Email sending failed - don't block order response
    });

    return apiSuccess({ order: newOrder });
  } catch {
    return ApiError.internal('Failed to process order');
  }
}

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const modeParam = sanitizeInput(searchParams.get('mode') || 'dev');
    const mode = (modeParam === 'live' ? 'live' : 'dev') as 'dev' | 'live';

    const allOrders = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      limit: limit,
      offset: offset,
    });

    // Filter orders based on mode (test vs live)
    const filteredOrders = filterOrdersByMode(allOrders, mode);

    return apiSuccess({ orders: filteredOrders });
  } catch {
    return ApiError.internal('Failed to fetch orders');
  }
});
