import { NextRequest } from 'next/server';
import { db, products } from '@/lib/db';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { apiSuccess, ApiError } from '@/lib/api';
import {
  getCache,
  setCache,
  invalidateProductCaches,
  CACHE_KEYS,
  CACHE_TTL,
} from '@/lib/cache';

export const dynamic = 'force-dynamic';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

// Verify admin token
function verifyAdminToken(request: NextRequest): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    jwt.verify(token, getJWTSecret());
    return true;
  } catch {
    return false;
  }
}

// GET /api/products/[id] - Get single product
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

// PUT /api/products/[id] - Update product (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return ApiError.unauthorized();
    }

    const data = await request.json();

    // Get current product metadata once to avoid race conditions
    const currentProduct = await db.query.products.findFirst({
      where: eq(products.id, resolvedParams.id),
      columns: { metadata: true },
    });

    if (!currentProduct) {
      return ApiError.notFound('Product');
    }

    const currentMetadata = (currentProduct.metadata as Record<string, unknown>) || {};

    // Prepare update data (only include fields that are provided)
    const updateData: Partial<typeof products.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = String(parseFloat(data.price));
    if (data.sale_price !== undefined)
      updateData.salePrice = data.sale_price ? String(parseFloat(data.sale_price)) : null;
    if (data.on_sale !== undefined) updateData.onSale = data.on_sale;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.inventory !== undefined) updateData.inventory = parseInt(data.inventory);
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.weight !== undefined)
      updateData.weight = data.weight ? String(parseFloat(data.weight)) : null;
    if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
    if (data.is_active !== undefined) updateData.isActive = data.is_active;
    if (data.featured !== undefined) updateData.featured = data.featured;

    // Handle video_url directly (not in metadata)
    if (data.video_url !== undefined) {
      updateData.videoUrl = data.video_url || null;
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
    if (
      data.featured_image_index !== undefined ||
      data.frontend_visible !== undefined ||
      data.metadata !== undefined
    ) {
      updateData.metadata = newMetadata;
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, resolvedParams.id))
      .returning();

    if (!updatedProduct) {
      return ApiError.internal('Failed to update product');
    }

    // Invalidate caches for this product and all list caches
    await invalidateProductCaches(resolvedParams.id);

    return apiSuccess({ product: updatedProduct }, 'Product updated successfully');
  } catch {
    return ApiError.internal('Failed to update product');
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
      return ApiError.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // Permanent delete
      await db.delete(products).where(eq(products.id, resolvedParams.id));
    } else {
      // Soft delete (mark as inactive)
      await db.update(products).set({ isActive: false }).where(eq(products.id, resolvedParams.id));
    }

    // Invalidate caches
    await invalidateProductCaches(resolvedParams.id);

    return apiSuccess(
      null,
      permanent ? 'Product deleted permanently' : 'Product deactivated'
    );
  } catch {
    return ApiError.internal('Failed to delete product');
  }
}
