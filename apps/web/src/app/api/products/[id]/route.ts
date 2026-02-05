import { NextRequest } from 'next/server';
import { db, products } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import {
  getCache,
  setCache,
  CACHE_KEYS,
  CACHE_TTL,
} from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET /api/products/[id] - Get single product (public)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const cacheKey = `${CACHE_KEYS.PRODUCTS_SINGLE}:${resolvedParams.id}`;

    // Try cache first
    const cached = await getCache<{ product: unknown }>(cacheKey);
    if (cached) {
      return apiSuccess(cached);
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, resolvedParams.id),
      with: {
        category: true,
      },
    });

    if (!product) {
      return ApiError.notFound('Product');
    }

    const responseData = { product };

    // Cache the response
    await setCache(cacheKey, responseData, CACHE_TTL.PRODUCTS_SINGLE);

    return apiSuccess(responseData);
  } catch {
    return ApiError.internal('Failed to fetch product');
  }
}

// PUT /api/products/[id] - Admin functionality moved to JetBeans BaaS
// DELETE /api/products/[id] - Admin functionality moved to JetBeans BaaS
