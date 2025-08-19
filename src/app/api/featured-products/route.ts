import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: allProducts, error } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured products:', error);
      return NextResponse.json({ error: 'Failed to fetch featured products' }, { status: 500 });
    }

    // Filter by frontend_visible
    const products = allProducts?.filter(p => p.metadata?.frontend_visible !== false) || [];

    // Transform products to match the expected Featured component interface
    const featuredProducts = (products || []).map(product => ({
      id: product.id,
      name: product.name,
      type: product.category,
      description: product.description || `Hand-mined ${product.category} from Alberta, Canada. Premium quality gemstone with exceptional clarity and natural beauty.`,
      image_url: product.images?.[0] || '/images/placeholder.jpg',
      card_color: product.metadata?.card_color || '#1f2937',
      price: product.on_sale && product.sale_price ? product.sale_price : product.price,
      original_price: product.price,
      product_id: product.id, // Keep UUID as string
      sort_order: 1,
      is_active: product.is_active
    }));

    return NextResponse.json(featuredProducts);
  } catch (error) {
    console.error('Error in GET /api/featured-products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}