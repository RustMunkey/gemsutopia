import { NextRequest } from 'next/server';
import { db, products } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;
    const { action } = await request.json(); // 'add' or 'remove'

    if (!productId) {
      return ApiError.validation('Product ID is required');
    }

    if (!action || !['add', 'remove'].includes(action)) {
      return ApiError.validation('Valid action (add/remove) is required');
    }

    // Get current product to check existing wishlist count in metadata
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { metadata: true },
    });

    if (!product) {
      return ApiError.notFound('Product');
    }

    // Update wishlist count in metadata
    const metadata = (product.metadata as Record<string, unknown>) || {};
    const currentWishlistCount = (metadata.wishlist_count as number) || 0;
    let newWishlistCount: number;

    if (action === 'add') {
      newWishlistCount = currentWishlistCount + 1;
    } else {
      newWishlistCount = Math.max(0, currentWishlistCount - 1);
    }

    // Update metadata with new wishlist count
    const updatedMetadata = {
      ...metadata,
      wishlist_count: newWishlistCount,
    };

    await db.update(products).set({ metadata: updatedMetadata }).where(eq(products.id, productId));

    return apiSuccess({ wishlist_count: newWishlistCount });
  } catch {
    return ApiError.internal();
  }
}
