import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// IP allowlist and security check (copied from other admin APIs)
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

export async function GET(request: NextRequest) {
  try {
    // Security checks
    const clientIP = getClientIP(request);
    
    // Allow localhost in development
    const isLocalhost = clientIP === '::1' || clientIP === '127.0.0.1' || clientIP === 'localhost';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(clientIP) && !(isDevelopment && isLocalhost)) {
      console.log(`Dashboard stats access blocked for IP: ${clientIP}`);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify admin token
    const verifyResponse = await fetch(`${request.nextUrl.origin}/api/admin/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const lastWeekStart = new Date(thisWeekStart.getTime() - (7 * 24 * 60 * 60 * 1000));
    const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('status', 'confirmed');

    if (revenueError) {
      console.error('Error fetching revenue:', revenueError);
    }

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const recentRevenue = revenueData?.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    ).reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    
    const oldRevenue = revenueData?.filter(order => 
      new Date(order.created_at) >= sixtyDaysAgo && new Date(order.created_at) < thirtyDaysAgo
    ).reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    const revenueChange = oldRevenue > 0 ? ((recentRevenue - oldRevenue) / oldRevenue) * 100 : 0;

    // Get orders count
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('status', 'confirmed');

    const { count: recentOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('status', 'confirmed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: oldOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('status', 'confirmed')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    const ordersChange = (oldOrders || 0) > 0 ? (((recentOrders || 0) - (oldOrders || 0)) / (oldOrders || 0)) * 100 : 0;

    // Get unique customers count
    const { data: customersData } = await supabase
      .from('orders')
      .select('customer_email, created_at')
      .eq('status', 'confirmed');

    const uniqueCustomers = new Set(customersData?.map(order => order.customer_email)).size;
    const recentCustomers = new Set(
      customersData?.filter(order => new Date(order.created_at) >= thirtyDaysAgo)
        .map(order => order.customer_email)
    ).size;
    const oldCustomers = new Set(
      customersData?.filter(order => 
        new Date(order.created_at) >= sixtyDaysAgo && new Date(order.created_at) < thirtyDaysAgo
      ).map(order => order.customer_email)
    ).size;

    const customersChange = oldCustomers > 0 ? ((recentCustomers - oldCustomers) / oldCustomers) * 100 : 0;

    // Get products count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Get recent orders for the recent orders section
    const { data: recentOrdersData } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get top-selling product
    const { data: orderItemsData } = await supabase
      .from('orders')
      .select('items');

    let topProduct = 'No orders yet';
    if (orderItemsData && orderItemsData.length > 0) {
      const itemCounts: { [key: string]: number } = {};
      
      orderItemsData.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
          });
        }
      });

      const sortedItems = Object.entries(itemCounts).sort(([,a], [,b]) => b - a);
      if (sortedItems.length > 0) {
        topProduct = sortedItems[0][0];
      }
    }

    // Get page view data
    const { count: totalPageViews } = await supabase
      .from('page_views')
      .select('*', { count: 'exact' });

    const { count: recentPageViews } = await supabase
      .from('page_views')
      .select('*', { count: 'exact' })
      .gte('viewed_at', thirtyDaysAgo.toISOString());

    const { count: oldPageViews } = await supabase
      .from('page_views')
      .select('*', { count: 'exact' })
      .gte('viewed_at', sixtyDaysAgo.toISOString())
      .lt('viewed_at', thirtyDaysAgo.toISOString());

    const pageViewsChange = (oldPageViews || 0) > 0 ? (((recentPageViews || 0) - (oldPageViews || 0)) / (oldPageViews || 0)) * 100 : 0;

    // Calculate conversion rate with actual page view data
    const conversionRate = (totalPageViews || 0) > 0 ? ((totalOrders || 0) / (totalPageViews || 1)) * 100 : 0;

    // Get low stock products
    const { data: lowStockData } = await supabase
      .from('products')
      .select('name, inventory')
      .eq('is_active', true)
      .lte('inventory', 5);

    const stockStatus = (lowStockData?.length || 0) > 0 
      ? `${lowStockData?.length} low stock` 
      : 'All good';

    // Calculate period-specific metrics
    const todayRevenue = revenueData?.filter(order => 
      new Date(order.created_at) >= today
    ).reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    const yesterdayRevenue = revenueData?.filter(order => 
      new Date(order.created_at) >= yesterday && new Date(order.created_at) < today
    ).reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    const thisWeekRevenue = revenueData?.filter(order => 
      new Date(order.created_at) >= thisWeekStart
    ).reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    const lastWeekRevenue = revenueData?.filter(order => 
      new Date(order.created_at) >= lastWeekStart && new Date(order.created_at) <= lastWeekEnd
    ).reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    const thisMonthRevenue = revenueData?.filter(order => 
      new Date(order.created_at) >= thisMonthStart
    ).reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    const lastMonthRevenue = revenueData?.filter(order => 
      new Date(order.created_at) >= lastMonthStart && new Date(order.created_at) <= lastMonthEnd
    ).reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    // Calculate order counts for different periods
    const todayOrders = revenueData?.filter(order => 
      new Date(order.created_at) >= today
    ).length || 0;

    const yesterdayOrders = revenueData?.filter(order => 
      new Date(order.created_at) >= yesterday && new Date(order.created_at) < today
    ).length || 0;

    const thisWeekOrders = revenueData?.filter(order => 
      new Date(order.created_at) >= thisWeekStart
    ).length || 0;

    const lastWeekOrders = revenueData?.filter(order => 
      new Date(order.created_at) >= lastWeekStart && new Date(order.created_at) <= lastWeekEnd
    ).length || 0;

    const thisMonthOrders = revenueData?.filter(order => 
      new Date(order.created_at) >= thisMonthStart
    ).length || 0;

    const lastMonthOrders = revenueData?.filter(order => 
      new Date(order.created_at) >= lastMonthStart && new Date(order.created_at) <= lastMonthEnd
    ).length || 0;


    const stats = {
      // Overall totals
      totalRevenue,
      totalOrders: totalOrders || 0,
      totalCustomers: uniqueCustomers,
      totalProducts: totalProducts || 0,
      
      // Today vs Yesterday
      todayRevenue,
      yesterdayRevenue,
      todayOrders,
      yesterdayOrders,
      
      // This week vs Last week
      thisWeekRevenue,
      lastWeekRevenue,
      thisWeekOrders,
      lastWeekOrders,
      
      // This month vs Last month
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthOrders,
      lastMonthOrders,
      
      // Legacy fields (for compatibility)
      revenueChange,
      ordersChange,
      customersChange,
      recentCustomers,
      productsChange: 0,
      pageViews: totalPageViews || 0,
      pageViewsChange: Math.round(pageViewsChange * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      topProduct,
      stockStatus,
      recentOrders: recentOrdersData?.map(order => ({
        id: order.id.slice(-8).toUpperCase(),
        status: 'completed',
        customer: order.customer_name,
        amount: `$${order.total.toFixed(2)}`,
        date: new Date(order.created_at).toLocaleDateString(),
        items: Array.isArray(order.items) ? order.items.map((item: any) => item.name).join(', ') : 'Unknown'
      })) || []
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}