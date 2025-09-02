import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/categories/[id]/products - Get products in a category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin;
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    console.log(`[API] Fetching products for category ID: ${id}`);
    
    // Support pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Check if id is a slug or UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    console.log(`[API] ID is ${isUuid ? 'UUID' : 'slug'}: ${id}`);
    
    // First get the category to verify it exists
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq(isUuid ? 'id' : 'slug', id)
      .single();
    
    console.log(`[API] Category query result:`, { category, categoryError });
    
    if (categoryError || !category) {
      console.log(`[API] Category not found: ${categoryError?.message}`);
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Get products in this category with full product details
    console.log(`[API] Fetching products for category ${category.id} (${category.name})`);
    
    const { data: productData, error } = await supabase
      .from('product_categories')
      .select(`
        products (
          id,
          name,
          description,
          price,
          sale_price,
          on_sale,
          inventory,
          images,
          featured,
          is_active,
          metadata,
          created_at,
          updated_at
        )
      `)
      .eq('category_id', category.id)
      .range(offset, offset + limit - 1);
    
    console.log(`[API] Products query result:`, { 
      productDataLength: productData?.length, 
      error: error?.message,
      rawProductData: productData 
    });
    
    if (error) {
      console.error('Error fetching category products:', error);
      return NextResponse.json(
        { error: `Failed to fetch products: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Extract product data and filter out null products
    const products = productData
      ?.map(item => (item as any).products)
      .filter(product => product !== null)
      .map(product => ({
        ...product,
        // Transform for compatibility with existing frontend
        originalPrice: product.price, // Use price as originalPrice
        stock: product.inventory
      })) || [];
    
    console.log(`Found ${products.length} products in category ${category.name}`);
    
    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('product_categories')
      .select('id', { count: 'exact' })
      .eq('category_id', category.id);
    
    if (countError) {
      console.error('Error getting product count:', countError);
    }
    
    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug
      },
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Category products fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}