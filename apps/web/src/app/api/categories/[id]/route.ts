import { NextRequest } from 'next/server';
import { db, categories, products } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { invalidateCategoryCaches } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET /api/categories/[id] - Get single category
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if id is a slug or UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const category = await db.query.categories.findFirst({
      where: isUuid ? eq(categories.id, id) : eq(categories.slug, id),
    });

    if (!category) {
      return ApiError.notFound('Category');
    }

    return apiSuccess({ category });
  } catch {
    return ApiError.internal('Failed to fetch category');
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, description, image_url, sort_order, is_active } = body;

    if (!name) {
      return ApiError.validation('Category name is required');
    }

    const updateData: Partial<typeof categories.$inferInsert> = {
      name: name.trim(),
      description: description?.trim() || null,
      image: image_url?.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    if (sort_order !== undefined) updateData.sortOrder = sort_order;
    if (is_active !== undefined) updateData.isActive = is_active;

    const [category] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    if (!category) {
      return ApiError.notFound('Category');
    }

    // Invalidate category caches
    await invalidateCategoryCaches();

    return apiSuccess({ category }, 'Category updated successfully');
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === '23505') {
      return ApiError.conflict('A category with this name already exists');
    }

    return ApiError.internal('Failed to update category');
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if category has products assigned (using categoryId foreign key)
    const productsInCategory = await db.query.products.findFirst({
      where: eq(products.categoryId, id),
      columns: { id: true },
    });

    if (productsInCategory) {
      return ApiError.conflict('Cannot delete category that has products assigned to it');
    }

    await db.delete(categories).where(eq(categories.id, id));

    // Invalidate category caches
    await invalidateCategoryCaches();

    return apiSuccess(null, 'Category deleted successfully');
  } catch {
    return ApiError.internal('Failed to delete category');
  }
}
