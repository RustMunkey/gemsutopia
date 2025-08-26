import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic route
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
    }

    return NextResponse.json(quotes || []);
  } catch (error) {
    console.error('Error in GET /api/quotes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}