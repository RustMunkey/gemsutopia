import { NextRequest } from 'next/server';
import { db, categories, products } from '@/lib/db';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import {
  getCache,
  setCache,
  generateCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
} from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET /api/categories/[id]/products - Get products in a category
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Support pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;

    // Sort params
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Try cache first
    const cacheKey = generateCacheKey(CACHE_KEYS.CATEGORY_PRODUCTS, {
      id,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const cached = await getCache<{
      category: unknown;
      products: unknown[];
      pagination: unknown;
    }>(cacheKey);
    if (cached) {
      return apiSuccess(cached);
    }

    // Check if id is a slug or UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // First get the category to verify it exists
    const category = await db.query.categories.findFirst({
      where: isUuid ? eq(categories.id, id) : eq(categories.slug, id),
      columns: { id: true, name: true, slug: true },
    });

    if (!category) {
      return ApiError.notFound('Category');
    }

    // Build where clause for active products in this category
    const whereClause = and(
      eq(products.categoryId, category.id),
      eq(products.isActive, true),
      sql`(${products.metadata}->>'frontend_visible' IS NULL OR ${products.metadata}->>'frontend_visible' != 'false')`
    );

    // Get total count using efficient COUNT query
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause);

    // Determine sort column and order
    let orderByClause;
    const isDesc = sortOrder === 'desc';

    switch (sortBy) {
      case 'price':
        orderByClause = isDesc ? desc(products.price) : asc(products.price);
        break;
      case 'name':
        orderByClause = isDesc ? desc(products.name) : asc(products.name);
        break;
      case 'created_at':
      default:
        orderByClause = isDesc ? desc(products.createdAt) : asc(products.createdAt);
    }

    // Get products in this category
    const productsInCategory = await db.query.products.findMany({
      where: whereClause,
      orderBy: [orderByClause],
      limit: limit,
      offset: offset,
    });

    // Transform for compatibility with existing frontend
    const transformedProducts = productsInCategory.map(product => ({
      ...product,
      originalPrice: product.price,
      stock: product.inventory,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    const responseData = {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    // Cache the response
    await setCache(cacheKey, responseData, CACHE_TTL.CATEGORY_PRODUCTS);

    return apiSuccess(responseData);
  } catch {
    return ApiError.internal('Failed to fetch category products');
  }
}
