import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const analyticsEvent = await request.json();
    
    // Validate required fields
    if (!analyticsEvent.event_type || !analyticsEvent.session_id) {
      return NextResponse.json(
        { error: 'Missing required fields: event_type, session_id' },
        { status: 400 }
      );
    }

    // Save analytics event to database
    const { data, error } = await supabase
      .from('analytics_events')
      .insert([{
        event_type: analyticsEvent.event_type,
        session_id: analyticsEvent.session_id,
        user_id: analyticsEvent.user_id || null,
        page_url: analyticsEvent.page_url || '',
        page_title: analyticsEvent.page_title || '',
        referrer: analyticsEvent.referrer || '',
        user_agent: analyticsEvent.user_agent || '',
        device_type: analyticsEvent.device_type || 'unknown',
        browser: analyticsEvent.browser || 'unknown',
        os: analyticsEvent.os || 'unknown',
        country: analyticsEvent.country || 'unknown',
        screen_resolution: analyticsEvent.screen_resolution || '',
        viewport_size: analyticsEvent.viewport_size || '',
        timestamp: analyticsEvent.timestamp || new Date().toISOString(),
        event_data: analyticsEvent.event_data || {},
        is_test_session: analyticsEvent.is_test_session || false
      }])
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save analytics event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, event: data[0] });
  } catch (error) {
    console.error('Error saving analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'dev';
    const eventType = searchParams.get('event_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '1000');

    let query = supabase
      .from('analytics_events')
      .select('*');

    // Filter by test/live mode
    if (mode === 'live') {
      query = query.eq('is_test_session', false);
    } else {
      query = query.eq('is_test_session', true);
    }

    // Filter by event type if specified
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    // Filter by date range if specified
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data: events, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics events' },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error('Error fetching analytics events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics events' },
      { status: 500 }
    );
  }
}