import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: faq, error } = await supabase
      .from('faq')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQ:', error);
      return NextResponse.json({ error: 'Failed to fetch FAQ' }, { status: 500 });
    }

    return NextResponse.json(faq || []);
  } catch (error) {
    console.error('Error in GET /api/faq:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}