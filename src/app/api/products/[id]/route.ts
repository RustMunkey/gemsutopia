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

    console.log('GET API - Product retrieved from DB:', product);
    console.log('GET API - Direct video_url column:', product?.video_url);
    console.log('GET API - Metadata:', product?.metadata);
    console.log('GET API - Metadata video_url (legacy):', product?.metadata?.video_url);

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
    console.log('API PUT received data.video_url:', data.video_url);
    console.log('API PUT received full data:', data);

    // Get current product metadata once to avoid race conditions
    const { data: currentProduct } = await supabaseAdmin
      .from('products')
      .select('metadata')
      .eq('id', resolvedParams.id)
      .single();
    
    const currentMetadata = currentProduct?.metadata || {};
    console.log('Current metadata from DB:', currentMetadata);

    // Prepare update data (only include fields that are provided)
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.sale_price !== undefined) updateData.sale_price = data.sale_price ? parseFloat(data.sale_price) : null;
    if (data.on_sale !== undefined) updateData.on_sale = data.on_sale;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.inventory !== undefined) updateData.inventory = parseInt(data.inventory);
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.weight !== undefined) updateData.weight = data.weight ? parseFloat(data.weight) : null;
    if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.featured !== undefined) updateData.featured = data.featured;

    // Handle video_url directly (not in metadata)
    if (data.video_url !== undefined) {
      updateData.video_url = data.video_url || null;
      console.log('Setting direct video_url to:', data.video_url);
    }

    // Handle metadata updates (featured_image_index, frontend_visible, and custom metadata)
    let newMetadata = { ...currentMetadata };
    
    if (data.featured_image_index !== undefined) {
      newMetadata.featured_image_index = data.featured_image_index;
    }
    
    if (data.frontend_visible !== undefined) {
      newMetadata.frontend_visible = data.frontend_visible;
    }
    
    if (data.metadata !== undefined) {
      newMetadata = { ...newMetadata, ...data.metadata };
    }
    
    // Only update metadata if there are changes
    if (data.featured_image_index !== undefined || 
        data.frontend_visible !== undefined || data.metadata !== undefined) {
      updateData.metadata = newMetadata;
      console.log('Final metadata object:', updateData.metadata);
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