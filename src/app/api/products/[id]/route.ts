import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

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

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    console.log('API PUT received data.featured_image_index:', data.featured_image_index);
    console.log('API PUT received full data:', data);

    // Prepare update data (only include fields that are provided)
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.sale_price !== undefined) updateData.sale_price = data.sale_price ? parseFloat(data.sale_price) : null;
    if (data.on_sale !== undefined) updateData.on_sale = data.on_sale;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.images !== undefined) updateData.images = data.images;
    // Store video and featured image in metadata for now (until DB schema is updated)
    if (data.video_url !== undefined || data.featured_image_index !== undefined) {
      // Get current product metadata first
      const { data: currentProduct } = await supabaseAdmin
        .from('products')
        .select('metadata')
        .eq('id', resolvedParams.id)
        .single();
      
      const currentMetadata = currentProduct?.metadata || {};
      updateData.metadata = {
        ...currentMetadata,
        ...(data.video_url !== undefined && { video_url: data.video_url || null }),
        ...(data.featured_image_index !== undefined && { featured_image_index: data.featured_image_index })
      };
    }
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.inventory !== undefined) updateData.inventory = parseInt(data.inventory);
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.weight !== undefined) updateData.weight = data.weight ? parseFloat(data.weight) : null;
    if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.frontend_visible !== undefined) {
      // Store frontend visibility in metadata to avoid database issues
      const { data: currentProduct } = await supabaseAdmin
        .from('products')
        .select('metadata')
        .eq('id', resolvedParams.id)
        .single();
      
      const currentMetadata = currentProduct?.metadata || {};
      updateData.metadata = {
        ...currentMetadata,
        frontend_visible: data.frontend_visible
      };
    }
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.metadata !== undefined) {
      // Merge provided metadata with existing metadata (don't overwrite)
      const existingMetadata = updateData.metadata || {};
      updateData.metadata = { ...existingMetadata, ...data.metadata };
    }

    console.log('UPDATE DATA:', JSON.stringify(updateData, null, 2));

    const { data: updatedProduct, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // Permanent delete
      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', resolvedParams.id);

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to delete product' },
          { status: 500 }
        );
      }
    } else {
      // Soft delete (mark as inactive)
      const { error } = await supabaseAdmin
        .from('products')
        .update({ is_active: false })
        .eq('id', resolvedParams.id);

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to deactivate product' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Product deleted permanently' : 'Product deactivated'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}