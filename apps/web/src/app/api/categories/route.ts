import { NextRequest, NextResponse } from 'next/server';
import { db, categories, products } from '@/lib/db';
import { asc, eq, and, gt, sql } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { getCache, setCache, invalidateCategoryCaches, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// GET /api/categories - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    // Only cache public requests
    const cacheKey = !includeInactive ? `${CACHE_KEYS.CATEGORIES_LIST}:active` : null;

    if (cacheKey) {
      const cached = await getCache<{ categories: unknown[] }>(cacheKey);
      if (cached) {
        const response = NextResponse.json({ success: true, data: cached });
        response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
        return response;
      }
    }

    let allCategories = await db.query.categories.findMany({
      orderBy: [asc(categories.sortOrder)],
    });

    // By default, only show active categories
    if (!includeInactive) {
      allCategories = allCategories.filter(c => c.isActive);
    }

    // Get inventory status for each category
    const categoriesWithInventory = await Promise.all(
      allCategories.map(async (category) => {
        // Count total products and products with inventory > 0 in this category
        const inventoryStats = await db
          .select({
            totalProducts: sql<number>`count(*)::int`,
            availableProducts: sql<number>`count(*) filter (where ${products.inventory} > 0)::int`,
          })
          .from(products)
          .where(and(eq(products.categoryId, category.id), eq(products.isActive, true)));

        const stats = inventoryStats[0] || { totalProducts: 0, availableProducts: 0 };
        const allSoldOut = stats.totalProducts > 0 && stats.availableProducts === 0;

        return {
          ...category,
          product_count: stats.totalProducts,
          available_count: stats.availableProducts,
          all_sold_out: allSoldOut,
        };
      })
    );

    const responseData = { categories: categoriesWithInventory || [] };

    // Cache public category list
    if (cacheKey) {
      await setCache(cacheKey, responseData, CACHE_TTL.CATEGORIES_LIST);
    }

    const response = NextResponse.json({ success: true, data: responseData });

    if (!includeInactive) {
      response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    }

    return response;
  } catch {
    return ApiError.internal();
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, description, image_url, sort_order, is_active } = body;

    if (!name) {
      return ApiError.validation('Category name is required');
    }

    // Generate slug from name
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const [category] = await db
      .insert(categories)
      .values({
        name: name.trim(),
        slug: slug,
        description: description?.trim() || null,
        image: image_url?.trim() || null,
        sortOrder: sort_order || 0,
        isActive: is_active !== undefined ? is_active : true,
      })
      .returning();

    // Invalidate category caches
    await invalidateCategoryCaches();

    return apiSuccess({ category }, undefined, 201);
  } catch (error: unknown) {
    // Handle unique constraint violations
    if ((error as { code?: string })?.code === '23505') {
      return ApiError.conflict('A category with this name already exists');
    }

    return ApiError.internal();
  }
}
