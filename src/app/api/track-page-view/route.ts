import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { page, userAgent } = await request.json();
    
    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwardedFor ? forwardedFor.split(',')[0].trim() : realIP || 'unknown';
    
    // Insert page view
    const { error } = await supabase
      .from('page_views')
      .insert({
        page: page || '/',
        ip_address: clientIP,
        user_agent: userAgent || request.headers.get('user-agent'),
        viewed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking page view:', error);
      return NextResponse.json({ error: 'Failed to track page view' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Page view tracking error:', error);
    return NextResponse.json({ error: 'Failed to track page view' }, { status: 500 });
  }
}