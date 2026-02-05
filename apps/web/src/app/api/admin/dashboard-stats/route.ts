import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// IP allowlist and security check
const ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const connectingIP = request.headers.get('x-connecting-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return realIP || connectingIP || 'unknown';
}

// Type for the dashboard stats result
interface DashboardStatsResult {
  orderStats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    todayRevenue: number;
    todayOrders: number;
    thisWeekRevenue: number;
    thisWeekOrders: number;
    thisMonthRevenue: number;
    thisMonthOrders: number;
  };
  productStats: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockProducts: Array<{ id: string; name: string; inventory: number }>;
  };
  topProducts: Array<{
    id: string;
    name: string;
    total_sold: number;
    inventory: number;
    price: string;
  }>;
  recentOrders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    total: string;
    status: string;
    payment_status: string;
    created_at: string;
    items: Array<{ name: string; quantity?: number }>;
    payment_details: Record<string, unknown>;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    // Security checks
    const clientIP = getClientIP(request);

    // Allow localhost in development
    const isLocalhost = clientIP === '::1' || clientIP === '127.0.0.1' || clientIP === 'localhost';
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (
      ALLOWED_IPS.length > 0 &&
      !ALLOWED_IPS.includes(clientIP) &&
      !(isDevelopment && isLocalhost)
    ) {
      return ApiError.forbidden('Access denied');
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify admin token
    const verifyResponse = await fetch(`${request.nextUrl.origin}/api/admin/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!verifyResponse.ok) {
      return ApiError.unauthorized('Invalid token');
    }

    // Get mode from query params
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'live';

    // Try Redis cache first (2 min TTL)
    const cacheKey = `${CACHE_KEYS.DASHBOARD_STATS}:${mode}`;
    const cached = await getCache<{ stats: unknown }>(cacheKey);
    if (cached) {
      return apiSuccess(cached);
    }

    // Use database function for efficient stats retrieval
    // This does all aggregations in a single query instead of fetching all records
    const result = await db.execute<{ get_full_dashboard_stats: DashboardStatsResult }>(
      sql`SELECT get_full_dashboard_stats(${mode}) as get_full_dashboard_stats`
    );

    const dashboardData = result.rows[0]?.get_full_dashboard_stats;

    if (!dashboardData) {
      // Fallback if function doesn't exist yet (migration not run)
      return apiSuccess({
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalProducts: 0,
          todayRevenue: 0,
          todayOrders: 0,
          thisWeekRevenue: 0,
          thisWeekOrders: 0,
          thisMonthRevenue: 0,
          thisMonthOrders: 0,
          revenueChange: 0,
          ordersChange: 0,
          customersChange: 0,
          productsChange: 0,
          pageViews: 0,
          pageViewsChange: 0,
          conversionRate: 0,
          topProduct: 'No orders yet',
          stockStatus: 'All good',
          recentOrders: [],
        },
      });
    }

    const { orderStats, productStats, topProducts, recentOrders } = dashboardData;

    // Get top product name
    const topProduct =
      topProducts && topProducts.length > 0 ? topProducts[0].name : 'No orders yet';

    // Format stock status
    const stockStatus =
      productStats.lowStockCount > 0
        ? `${productStats.lowStockCount} low stock`
        : 'All good';

    const stats = {
      // Overall totals
      totalRevenue: orderStats.totalRevenue || 0,
      totalOrders: orderStats.totalOrders || 0,
      totalCustomers: orderStats.totalCustomers || 0,
      totalProducts: productStats.totalProducts || 0,

      // Period-specific stats
      todayRevenue: orderStats.todayRevenue || 0,
      todayOrders: orderStats.todayOrders || 0,
      thisWeekRevenue: orderStats.thisWeekRevenue || 0,
      thisWeekOrders: orderStats.thisWeekOrders || 0,
      thisMonthRevenue: orderStats.thisMonthRevenue || 0,
      thisMonthOrders: orderStats.thisMonthOrders || 0,

      // Legacy fields for compatibility
      yesterdayRevenue: 0,
      yesterdayOrders: 0,
      lastWeekRevenue: 0,
      lastWeekOrders: 0,
      lastMonthRevenue: 0,
      lastMonthOrders: 0,
      revenueChange: 0,
      ordersChange: 0,
      customersChange: 0,
      recentCustomers: 0,
      productsChange: 0,
      pageViews: 0,
      pageViewsChange: 0,
      conversionRate: 0,
      topProduct,
      stockStatus,
      lowStockProducts: productStats.lowStockProducts || [],
      topProducts: topProducts || [],

      // Recent orders formatted for display
      recentOrders: (recentOrders || []).map(order => ({
        id: order.id.slice(-8).toUpperCase(),
        fullId: order.id,
        status: order.status || 'pending',
        customer: order.customer_name,
        customerEmail: order.customer_email,
        amount: `$${parseFloat(order.total || '0').toFixed(2)}`,
        date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
        items: Array.isArray(order.items)
          ? order.items.map(item => item.name).join(', ')
          : 'Unknown',
      })),
    };

    const responseData = { stats };

    // Cache for 2 minutes
    await setCache(cacheKey, responseData, CACHE_TTL.DASHBOARD_STATS);

    return apiSuccess(responseData);
  } catch {
    return ApiError.internal('Failed to fetch dashboard stats');
  }
}
