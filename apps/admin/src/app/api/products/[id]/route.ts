import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, products } from '@gemsutopia/database';
import { eq } from 'drizzle-orm';
import { triggerEvent } from '@gemsutopia/realtime';
import { invalidateProductCaches } from '@gemsutopia/cache';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { category: { columns: { id: true, name: true } } },
  });

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  const fields = [
    'name', 'description', 'shortDescription', 'sku', 'categoryId',
    'gemstoneType', 'cut', 'clarity', 'color', 'origin', 'treatment',
    'certification', 'certificationNumber', 'shape', 'metaTitle', 'metaDescription',
  ];

  for (const field of fields) {
    if (body[field] !== undefined) updateData[field] = body[field] || null;
  }

  if (body.name !== undefined) {
    updateData.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (body.price !== undefined) updateData.price = String(body.price);
  if (body.salePrice !== undefined) {
    updateData.salePrice = body.salePrice ? String(body.salePrice) : null;
    updateData.onSale = !!body.salePrice;
  }
  if (body.onSale !== undefined) updateData.onSale = body.onSale;
  if (body.inventory !== undefined) updateData.inventory = Number(body.inventory);
  if (body.images !== undefined) updateData.images = body.images;
  if (body.caratWeight !== undefined) updateData.caratWeight = body.caratWeight ? String(body.caratWeight) : null;
  if (body.weight !== undefined) updateData.weight = body.weight ? String(body.weight) : null;
  if (body.dimensions !== undefined) updateData.dimensions = body.dimensions;
  if (body.featured !== undefined) updateData.featured = body.featured;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.isNew !== undefined) updateData.isNew = body.isNew;
  if (body.isBestseller !== undefined) updateData.isBestseller = body.isBestseller;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

  updateData.updatedAt = new Date().toISOString();

  const [updated] = await db.update(products).set(updateData).where(eq(products.id, id)).returning();

  if (!updated) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  await invalidateProductCaches(updated.id);
  await triggerEvent('content', 'product-updated', { id: updated.id });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  await invalidateProductCaches(id);
  await triggerEvent('content', 'product-deleted', { id });

  return NextResponse.json({ data: { success: true } });
}
