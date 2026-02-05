import { NextRequest } from 'next/server';
import { db, products, categories } from '@/lib/db';
import { eq, desc, and, sql, asc } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import {
  getCache,
  setCache,
  generateCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
} from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET /api/products - Get products with pagination and filtering (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24')));
    const offset = (page - 1) * limit;

    // Filter params (public filters only)
    const categoryFilter = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const onSale = searchParams.get('onSale') === 'true';
    const search = searchParams.get('search')?.trim();

    // Sort params
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Try cache for public requests
    const canUseCache = !search; // Don't cache search queries
    const cacheKey = canUseCache
      ? generateCacheKey(CACHE_KEYS.PRODUCTS_LIST, {
          page,
          limit,
          category: categoryFilter,
          featured,
          onSale,
          sortBy,
          sortOrder,
        })
      : null;

    if (cacheKey) {
      const cached = await getCache<{
        products: unknown[];
        pagination: unknown;
        count: number;
      }>(cacheKey);
      if (cached) {
        return apiSuccess(cached);
      }
    }

    // Build where conditions - only show active products
    const conditions = [];
    conditions.push(eq(products.isActive, true));
    // Also filter out products with frontend_visible = false
    conditions.push(
      sql`(${products.metadata}->>'frontend_visible' IS NULL OR ${products.metadata}->>'frontend_visible' != 'false')`
    );

    // Category filter
    if (categoryFilter) {
      // First find the category ID
      const foundCategory = await db.query.categories.findFirst({
        where: sql`LOWER(${categories.name}) = LOWER(${categoryFilter}) OR ${categories.slug} = ${categoryFilter}`,
      });
      if (foundCategory) {
        conditions.push(eq(products.categoryId, foundCategory.id));
      }
    }

    // Featured filter
    if (featured) {
      conditions.push(eq(products.featured, true));
    }

    // On sale filter
    if (onSale) {
      conditions.push(eq(products.onSale, true));
    }

    // Search filter (name, description, gemstone_type)
    if (search) {
      conditions.push(
        sql`(
          ${products.name} ILIKE ${'%' + search + '%'} OR
          ${products.description} ILIKE ${'%' + search + '%'} OR
          ${products.gemstoneType} ILIKE ${'%' + search + '%'}
        )`
      );
    }

    // Get total count with filters
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
      case 'inventory':
        orderByClause = isDesc ? desc(products.inventory) : asc(products.inventory);
        break;
      case 'purchase_count':
        orderByClause = isDesc ? desc(products.purchaseCount) : asc(products.purchaseCount);
        break;
      case 'created_at':
      default:
        orderByClause = isDesc ? desc(products.createdAt) : asc(products.createdAt);
    }

    // Get paginated products with their category
    const paginatedProducts = await db.query.products.findMany({
      with: {
        category: true,
      },
      where: whereClause,
      orderBy: [orderByClause],
      limit: limit,
      offset: offset,
    });

    // Transform products for response
    const transformedProducts = paginatedProducts.map(product => ({
      ...product,
      stock: product.inventory || 0,
      category: product.category?.name || 'Uncategorized',
      categoryId: product.categoryId,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const responseData = {
      products: transformedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      // Legacy field for backward compatibility
      count: transformedProducts.length,
    };

    // Cache the response for public requests
    if (cacheKey) {
      await setCache(cacheKey, responseData, CACHE_TTL.PRODUCTS_LIST);
    }

    return apiSuccess(responseData);
  } catch {
    return ApiError.internal('Failed to fetch products');
  }
}

// POST /api/products - Admin functionality moved to JetBeans BaaS
