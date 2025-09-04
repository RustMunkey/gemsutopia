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

    console.log('GET /api/products - includeInactive:', includeInactive);

    // Get all products with their category information
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Get category information for each product
    const productIds = products?.map(p => p.id) || [];
    const { data: productCategoryData, error: categoryError } = await supabase
      .from('product_categories')
      .select(`
        product_id,
        categories (
          id,
          name,
          slug
        )
      `)
      .in('product_id', productIds);

    if (categoryError) {
      console.error('Error fetching product categories:', categoryError);
    }

    // Create a map of product_id to category name
    const productCategoryMap = new Map();
    productCategoryData?.forEach(item => {
      if (item.categories) {
        productCategoryMap.set(item.product_id, (item.categories as any).name);
      }
    });

    // Apply filters and transform products
    let filteredProducts = products || [];
    
    if (!includeInactive) {
      console.log('Filtering to only frontend visible products');
      filteredProducts = filteredProducts.filter(p => p.metadata?.frontend_visible !== false);
    } else {
      console.log('Including ALL products (admin view)');
    }
    
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    if (featured) {
      filteredProducts = filteredProducts.filter(p => p.featured);
    }
    if (onSale) {
      filteredProducts = filteredProducts.filter(p => p.on_sale);
    }

    console.log(`Returning ${filteredProducts.length} products. Active: ${filteredProducts.filter(p => p.is_active).length}, Inactive: ${filteredProducts.filter(p => !p.is_active).length}`);

    // Transform products to add stock field and real category names for backward compatibility
    const transformedProducts = filteredProducts.map(product => ({
      ...product,
      stock: product.inventory || 0, // Map inventory to stock for compatibility
      category: productCategoryMap.get(product.id) || 'Uncategorized' // Use ONLY real category name from category management system
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      count: transformedProducts.length || 0
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
    if (!data.name || !data.price) {
      return NextResponse.json(
        { success: false, message: 'Name and price are required' },
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
      category: data.category || 'uncategorized',
      images: data.images || [],
      video_url: data.video_url || null, // Save to direct column
      tags: data.tags || [],
      inventory: parseInt(data.inventory) || 0,
      sku: data.sku || `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
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