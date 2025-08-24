import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify admin token
function verifyAdminToken(request: NextRequest): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const onSale = searchParams.get('onSale') === 'true';

    // If includeInactive is requested, verify admin token
    if (includeInactive && !verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required to include inactive products' },
        { status: 401 }
      );
    }

    let query = supabase.from('products').select('*');

    console.log('GET /api/products - includeInactive:', includeInactive);

    // Apply filters
    if (!includeInactive) {
      console.log('Filtering to only frontend visible products');
      // For public API, filter by frontend_visible in metadata
      const { data: allProducts, error: fetchError } = await query.order('created_at', { ascending: false });
      if (fetchError) {
        throw fetchError;
      }
      const visibleProducts = allProducts?.filter(p => p.metadata?.frontend_visible !== false) || [];
      console.log(`Returning ${visibleProducts.length} frontend visible products out of ${allProducts?.length || 0} total`);
      return NextResponse.json({
        success: true,
        products: visibleProducts,
        count: visibleProducts.length
      });
    } else {
      console.log('Including ALL products (admin view)');
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (featured) {
      query = query.eq('featured', true);
    }
    if (onSale) {
      query = query.eq('on_sale', true);
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    console.log(`Returning ${products?.length || 0} products. Active: ${products?.filter(p => p.is_active).length}, Inactive: ${products?.filter(p => !p.is_active).length}`);

    return NextResponse.json({
      success: true,
      products: products || [],
      count: products?.length || 0
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.price || !data.category) {
      return NextResponse.json(
        { success: false, message: 'Name, price, and category are required' },
        { status: 400 }
      );
    }

    // Validate numeric fields to prevent overflow
    const price = parseFloat(data.price);
    const salePrice = data.sale_price ? parseFloat(data.sale_price) : null;
    const weight = data.weight ? parseFloat(data.weight) : null;

    if (price > 99999.99) {
      return NextResponse.json(
        { success: false, message: 'Price must be less than $99,999.99' },
        { status: 400 }
      );
    }

    if (salePrice && salePrice > 99999.99) {
      return NextResponse.json(
        { success: false, message: 'Sale price must be less than $99,999.99' },
        { status: 400 }
      );
    }

    if (weight && weight > 99999.999) {
      return NextResponse.json(
        { success: false, message: 'Weight must be less than 99,999.999 grams' },
        { status: 400 }
      );
    }

    // Prepare product data
    const productData = {
      name: data.name,
      description: data.description || '',
      price: price,
      sale_price: salePrice,
      on_sale: data.on_sale || false,
      category: data.category,
      images: data.images || [],
      video_url: data.video_url || null, // Save to direct column
      tags: data.tags || [],
      inventory: parseInt(data.inventory) || 0,
      sku: data.sku || `${data.category.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      weight: weight,
      dimensions: data.dimensions || null,
      is_active: data.is_active !== false,
      featured: data.featured || false,
      metadata: {
        ...(data.metadata || {}),
        featured_image_index: data.featured_image_index || 0
      }
    };

    const { data: newProduct, error } = await supabaseAdmin
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating product:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        productData: productData
      });
      return NextResponse.json(
        { success: false, message: `Failed to create product: ${error.message || error.details || 'Unknown error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: newProduct
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create product' },
      { status: 500 }
    );
  }
}