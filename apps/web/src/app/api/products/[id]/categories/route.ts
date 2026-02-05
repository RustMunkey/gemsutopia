import { NextRequest } from 'next/server';
import { db, products, categories } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/products/[id]/categories - Get category for a product
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        category: true,
      },
    });

    if (!product) {
      return ApiError.notFound('Product');
    }

    // Return category as array for backward compatibility
    const categoryData = product.category ? [product.category] : [];

    return apiSuccess({ categories: categoryData });
  } catch {
    return ApiError.internal('Failed to fetch product categories');
  }
}

// POST /api/products/[id]/categories - Assign category to product
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;
    const body = await request.json();

    const { category_ids } = body;

    if (!Array.isArray(category_ids)) {
      return ApiError.validation('category_ids must be an array');
    }

    // Verify product exists
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { id: true },
    });

    if (!product) {
      return ApiError.notFound('Product');
    }

    // If empty array, clear category assignment
    if (category_ids.length === 0) {
      await db.update(products).set({ categoryId: null }).where(eq(products.id, productId));

      return apiSuccess({ categoryId: null }, 'Category removed from product');
    }

    // Use first category (products have single category relationship)
    const categoryId = category_ids[0];

    // Verify category exists
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
      columns: { id: true },
    });

    if (!category) {
      return ApiError.notFound('Category');
    }

    // Update product with new category
    const [updatedProduct] = await db
      .update(products)
      .set({ categoryId: categoryId })
      .where(eq(products.id, productId))
      .returning();

    return apiSuccess({ categoryId: updatedProduct.categoryId });
  } catch {
    return ApiError.internal('Failed to assign category to product');
  }
}

// DELETE /api/products/[id]/categories - Remove category from product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    await db.update(products).set({ categoryId: null }).where(eq(products.id, productId));

    return apiSuccess(null, 'Category removed from product');
  } catch {
    return ApiError.internal('Failed to remove category from product');
  }
}
