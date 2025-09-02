import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/products/[id]/categories - Get categories for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdmin;
    const { id: productId } = await params;
    
    const { data: categories, error } = await supabase
      .from('product_categories')
      .select(`
        categories (
          id,
          name,
          slug,
          description,
          image_url,
          sort_order,
          is_active
        )
      `)
      .eq('product_id', productId);
    
    if (error) {
      console.error('Error fetching product categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product categories' },
        { status: 500 }
      );
    }
    
    // Extract category data from nested structure
    const categoryData = categories?.map(item => (item as any).categories).filter(Boolean) || [];
    
    return NextResponse.json({
      success: true,
      categories: categoryData
    });
    
  } catch (error) {
    console.error('Product categories fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/categories - Assign categories to product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdmin;
    const { id: productId } = await params;
    const body = await request.json();
    
    const { category_ids } = body;
    
    if (!Array.isArray(category_ids)) {
      return NextResponse.json(
        { error: 'category_ids must be an array' },
        { status: 400 }
      );
    }
    
    // If empty array, just clear all assignments and return success
    if (category_ids.length === 0) {
      const { error: deleteError } = await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productId);
      
      if (deleteError) {
        console.error('Error clearing product categories:', deleteError);
        return NextResponse.json(
          { error: 'Failed to clear categories' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'All categories removed from product',
        assignments: []
      });
    }
    
    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Verify all categories exist
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
      .in('id', category_ids);
    
    if (categoriesError) {
      console.error('Error verifying categories:', categoriesError);
      return NextResponse.json(
        { error: 'Failed to verify categories' },
        { status: 500 }
      );
    }
    
    if (!categories || categories.length !== category_ids.length) {
      return NextResponse.json(
        { error: 'One or more categories not found' },
        { status: 404 }
      );
    }
    
    // Clear existing assignments
    const { error: deleteError } = await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId);
    
    if (deleteError) {
      console.error('Error clearing existing categories:', deleteError);
      return NextResponse.json(
        { error: 'Failed to clear existing categories' },
        { status: 500 }
      );
    }
    
    // Create new assignments
    const assignments = category_ids.map(categoryId => ({
      product_id: productId,
      category_id: categoryId
    }));
    
    const { data: newAssignments, error: assignError } = await supabase
      .from('product_categories')
      .insert(assignments)
      .select();
    
    if (assignError) {
      console.error('Error creating category assignments:', assignError);
      return NextResponse.json(
        { error: 'Failed to assign categories' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      assignments: newAssignments
    });
    
  } catch (error) {
    console.error('Category assignment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/categories - Remove all categories from product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdmin;
    const { id: productId } = await params;
    
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId);
    
    if (error) {
      console.error('Error removing product categories:', error);
      return NextResponse.json(
        { error: 'Failed to remove categories' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'All categories removed from product'
    });
    
  } catch (error) {
    console.error('Category removal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}