import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { action } = await request.json(); // 'add' or 'remove'

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!action || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Valid action (add/remove) is required' },
        { status: 400 }
      );
    }

    // Get current product to check existing wishlist count
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

    // Update wishlist count
    const currentWishlistCount = product.metadata?.wishlist_count || 0;
    let newWishlistCount;
    
    if (action === 'add') {
      newWishlistCount = currentWishlistCount + 1;
    } else {
      newWishlistCount = Math.max(0, currentWishlistCount - 1);
    }

    // Update metadata with new wishlist count
    const updatedMetadata = {
      ...product.metadata,
      wishlist_count: newWishlistCount
    };

    const { error: updateError } = await supabase
      .from('products')
      .update({ metadata: updatedMetadata })
      .eq('id', productId);

    if (updateError) {
      console.error('Error updating wishlist count:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update wishlist count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wishlist_count: newWishlistCount
    });

  } catch (error) {
    console.error('Wishlist tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}