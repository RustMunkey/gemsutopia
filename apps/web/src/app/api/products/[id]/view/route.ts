import { NextRequest } from 'next/server';
import { db, products } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return ApiError.validation('Product ID is required');
    }

    // Get current product to check existing view count
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { viewCount: true },
    });

    if (!product) {
      return ApiError.notFound('Product');
    }

    // Increment view count using the dedicated column
    const [updated] = await db
      .update(products)
      .set({
        viewCount: sql`${products.viewCount} + 1`,
      })
      .where(eq(products.id, productId))
      .returning({ viewCount: products.viewCount });

    return apiSuccess({
      view_count: updated?.viewCount || (product.viewCount || 0) + 1,
    });
  } catch {
    return ApiError.internal();
  }
}
