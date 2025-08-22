// Analytics utility functions for processing tracked events

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  session_id: string;
  user_id?: string;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  country?: string;
  screen_resolution?: string;
  viewport_size?: string;
  timestamp: string;
  event_data?: any;
  is_test_session: boolean;
}

export interface ProcessedAnalytics {
  totalSessions: number;
  sessionsChange: number;
  pageViews: number;
  pageViewsChange: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversionRate: number;
  conversionChange: number;
  trafficSources: Array<{ source: string; sessions: number; revenue: number; conversion: number }>;
  topCountries: Array<{ country: string; sessions: number; revenue: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  hourlyTraffic: number[];
  cartAbandonmentRate: number;
  topProducts: Array<{ name: string; views: number; orders: number; revenue: number; conversion: number }>;
}

export async function fetchAnalyticsEvents(mode: 'dev' | 'live', startDate?: string, endDate?: string): Promise<AnalyticsEvent[]> {
  try {
    const params = new URLSearchParams({
      mode,
      limit: '10000'
    });
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`/api/analytics?${params.toString()}`);
    const data = await response.json();
    
    return data.events || [];
  } catch (error) {
    console.error('Error fetching analytics events:', error);
    return [];
  }
}

export function processAnalyticsEvents(events: AnalyticsEvent[], orders: any[] = []): ProcessedAnalytics {
  // Group events by session
  const sessionMap = new Map<string, AnalyticsEvent[]>();
  const pageViewEvents = events.filter(e => e.event_type === 'page_view');
  const checkoutEvents = events.filter(e => e.event_type === 'checkout_complete');
  const cartEvents = events.filter(e => e.event_type === 'cart_add' || e.event_type === 'cart_remove');
  const checkoutStartEvents = events.filter(e => e.event_type === 'checkout_start');

  // Build session map
  events.forEach(event => {
    if (!sessionMap.has(event.session_id)) {
      sessionMap.set(event.session_id, []);
    }
    sessionMap.get(event.session_id)!.push(event);
  });

  // Calculate sessions
  const totalSessions = sessionMap.size;
  const sessionsChange = 0; // TODO: Calculate based on previous period

  // Calculate page views
  const totalPageViews = pageViewEvents.length;
  const pageViewsChange = 0; // TODO: Calculate based on previous period

  // Calculate bounce rate (sessions with only 1 page view)
  const bouncedSessions = Array.from(sessionMap.values()).filter(
    sessionEvents => sessionEvents.filter(e => e.event_type === 'page_view').length === 1
  ).length;
  const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

  // Calculate average session duration
  const sessionDurations = Array.from(sessionMap.values()).map(sessionEvents => {
    const sortedEvents = sessionEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (sortedEvents.length < 2) return 0;
    
    const firstEvent = new Date(sortedEvents[0].timestamp);
    const lastEvent = new Date(sortedEvents[sortedEvents.length - 1].timestamp);
    return (lastEvent.getTime() - firstEvent.getTime()) / 1000; // Duration in seconds
  });
  
  const avgSessionDuration = sessionDurations.length > 0 
    ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
    : 0;

  // Calculate conversion rate
  const conversions = checkoutEvents.length;
  const conversionRate = totalSessions > 0 ? (conversions / totalSessions) * 100 : 0;
  const conversionChange = 0; // TODO: Calculate based on previous period

  // Process traffic sources
  const trafficSourceMap = new Map<string, { sessions: Set<string>; revenue: number }>();
  
  pageViewEvents.forEach(event => {
    if (event.event_data?.traffic_source) {
      const source = event.event_data.traffic_source;
      if (!trafficSourceMap.has(source)) {
        trafficSourceMap.set(source, { sessions: new Set(), revenue: 0 });
      }
      trafficSourceMap.get(source)!.sessions.add(event.session_id);
    }
  });

  // Add revenue to traffic sources from orders
  checkoutEvents.forEach(event => {
    const sessionEvents = sessionMap.get(event.session_id) || [];
    const pageViewEvent = sessionEvents.find(e => e.event_type === 'page_view');
    const source = pageViewEvent?.event_data?.traffic_source || 'direct';
    
    if (!trafficSourceMap.has(source)) {
      trafficSourceMap.set(source, { sessions: new Set(), revenue: 0 });
    }
    
    const orderValue = event.event_data?.order_value || 0;
    trafficSourceMap.get(source)!.revenue += orderValue;
  });

  const trafficSources = Array.from(trafficSourceMap.entries())
    .map(([source, data]) => ({
      source,
      sessions: data.sessions.size,
      revenue: data.revenue,
      conversion: data.sessions.size > 0 ? (conversions / data.sessions.size) * 100 : 0
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 5);

  // Process countries (from user data or IP geolocation)
  const countryMap = new Map<string, { sessions: Set<string>; revenue: number }>();
  
  events.forEach(event => {
    const country = event.country || 'Unknown';
    if (!countryMap.has(country)) {
      countryMap.set(country, { sessions: new Set(), revenue: 0 });
    }
    countryMap.get(country)!.sessions.add(event.session_id);
  });

  const topCountries = Array.from(countryMap.entries())
    .map(([country, data]) => ({
      country,
      sessions: data.sessions.size,
      revenue: data.revenue
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 5);

  // Calculate device breakdown
  const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
  const uniqueDeviceSessions = new Set<string>();

  events.forEach(event => {
    if (!uniqueDeviceSessions.has(event.session_id)) {
      uniqueDeviceSessions.add(event.session_id);
      
      switch (event.device_type) {
        case 'desktop':
          deviceCounts.desktop++;
          break;
        case 'mobile':
          deviceCounts.mobile++;
          break;
        case 'tablet':
          deviceCounts.tablet++;
          break;
      }
    }
  });

  const totalDevices = deviceCounts.desktop + deviceCounts.mobile + deviceCounts.tablet;
  const deviceBreakdown = {
    desktop: totalDevices > 0 ? (deviceCounts.desktop / totalDevices) * 100 : 0,
    mobile: totalDevices > 0 ? (deviceCounts.mobile / totalDevices) * 100 : 0,
    tablet: totalDevices > 0 ? (deviceCounts.tablet / totalDevices) * 100 : 0
  };

  // Calculate hourly traffic pattern
  const hourlyTraffic = Array.from({ length: 24 }, () => 0);
  
  pageViewEvents.forEach(event => {
    const hour = new Date(event.timestamp).getHours();
    hourlyTraffic[hour]++;
  });

  // Calculate cart abandonment rate
  const sessionsWithCartAdd = new Set<string>();
  const sessionsWithCheckout = new Set<string>();

  cartEvents.forEach(event => {
    if (event.event_type === 'cart_add') {
      sessionsWithCartAdd.add(event.session_id);
    }
  });

  checkoutStartEvents.forEach(event => {
    sessionsWithCheckout.add(event.session_id);
  });

  const cartAbandonmentRate = sessionsWithCartAdd.size > 0 
    ? ((sessionsWithCartAdd.size - sessionsWithCheckout.size) / sessionsWithCartAdd.size) * 100 
    : 0;

  // Process top products from analytics events
  const productViewMap = new Map<string, { views: number; orders: number; revenue: number }>();
  
  events.filter(e => e.event_type === 'product_view').forEach(event => {
    const productName = event.event_data?.product_name || 'Unknown Product';
    if (!productViewMap.has(productName)) {
      productViewMap.set(productName, { views: 0, orders: 0, revenue: 0 });
    }
    productViewMap.get(productName)!.views++;
  });

  // Add order data to products
  events.filter(e => e.event_type === 'cart_add').forEach(event => {
    const productName = event.event_data?.product_name || 'Unknown Product';
    if (!productViewMap.has(productName)) {
      productViewMap.set(productName, { views: 0, orders: 0, revenue: 0 });
    }
    const data = productViewMap.get(productName)!;
    data.orders += event.event_data?.quantity || 1;
    data.revenue += event.event_data?.cart_value || 0;
  });

  const topProducts = Array.from(productViewMap.entries())
    .map(([name, data]) => ({
      name,
      views: data.views,
      orders: data.orders,
      revenue: data.revenue,
      conversion: data.views > 0 ? (data.orders / data.views) * 100 : 0
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return {
    totalSessions,
    sessionsChange,
    pageViews: totalPageViews,
    pageViewsChange,
    bounceRate,
    avgSessionDuration,
    conversionRate,
    conversionChange,
    trafficSources,
    topCountries,
    deviceBreakdown,
    hourlyTraffic,
    cartAbandonmentRate,
    topProducts
  };
}