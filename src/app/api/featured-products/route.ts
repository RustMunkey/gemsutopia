import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: featuredProducts, error } = await supabase
      .from('featured_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching featured products:', error);
      return NextResponse.json({ error: 'Failed to fetch featured products' }, { status: 500 });
    }

    return NextResponse.json(featuredProducts || []);
  } catch (error) {
    console.error('Error in GET /api/featured-products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}