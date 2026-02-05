import { NextResponse } from 'next/server';
import { db, products } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { ApiError } from '@/lib/api';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// Cache for 5 minutes, revalidate in background
export const revalidate = 300;

export async function GET() {
  try {
    // Try Redis cache first
    const cached = await getCache<{ featuredProducts: unknown[] }>(CACHE_KEYS.FEATURED_PRODUCTS);
    if (cached) {
      return NextResponse.json(
        { success: true, data: cached },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
      );
    }

    const allProducts = await db.query.products.findMany({
      where: and(eq(products.featured, true), eq(products.isActive, true)),
      with: {
        category: true,
      },
      orderBy: [desc(products.createdAt)],
    });

    // Transform products to match the expected Featured component interface
    const featuredProducts = allProducts.map(product => {
      const metadata = product.metadata as Record<string, unknown> | null;
      return {
        id: product.id,
        name: product.name,
        type: product.category?.name || 'Uncategorized',
        description:
          product.description ||
          `Hand-mined ${product.category?.name || 'gemstone'} from Alberta, Canada. Premium quality gemstone with exceptional clarity and natural beauty.`,
        image_url: (product.images as string[])?.[0] || null,
        card_color: (metadata?.card_color as string) || '#1f2937',
        price: product.onSale && product.salePrice ? product.salePrice : product.price,
        original_price: product.price,
        product_id: product.id,
        sort_order: 1,
        is_active: product.isActive,
        inventory: product.inventory || 0,
        stock: product.inventory || 0,
      };
    });

    const responseData = { featuredProducts };

    // Cache in Redis
    await setCache(CACHE_KEYS.FEATURED_PRODUCTS, responseData, CACHE_TTL.FEATURED_PRODUCTS);

    // Return standardized format with cache headers
    return NextResponse.json(
      { success: true, data: responseData },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch {
    return ApiError.internal('Failed to fetch featured products');
  }
}
