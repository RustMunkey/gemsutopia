import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get current product to check existing view count
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('metadata')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('Error fetching product:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Increment view count
    const currentViewCount = product.metadata?.view_count || 0;
    const newViewCount = currentViewCount + 1;

    // Update metadata with new view count
    const updatedMetadata = {
      ...product.metadata,
      view_count: newViewCount
    };

    const { error: updateError } = await supabase
      .from('products')
      .update({ metadata: updatedMetadata })
      .eq('id', productId);

    if (updateError) {
      console.error('Error updating view count:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update view count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      view_count: newViewCount
    });

  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}