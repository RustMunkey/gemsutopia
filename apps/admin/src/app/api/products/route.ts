import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, products, categories } from '@gemsutopia/database';
import { eq, desc, ilike, and, sql } from 'drizzle-orm';
import { triggerEvent } from '@gemsutopia/realtime';
import { invalidateProductCaches } from '@gemsutopia/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get('search');
  const category = request.nextUrl.searchParams.get('category');
  const status = request.nextUrl.searchParams.get('status');
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(ilike(products.name, `%${search}%`));
  }
  if (category) {
    conditions.push(eq(products.categoryId, category));
  }
  if (status === 'active') {
    conditions.push(eq(products.isActive, true));
  } else if (status === 'inactive') {
    conditions.push(eq(products.isActive, false));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [allProducts, countResult] = await Promise.all([
    db.query.products.findMany({
      where,
      with: { category: { columns: { id: true, name: true } } },
      orderBy: [desc(products.createdAt)],
      limit,
      offset,
    }),
    db.select({ count: sql<string>`COUNT(*)` }).from(products).where(where),
  ]);

  return NextResponse.json({
    data: allProducts,
    pagination: {
      page,
      limit,
      total: parseInt(countResult[0]?.count || '0'),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    name, description, shortDescription, price, salePrice, onSale,
    inventory, sku, images, categoryId, gemstoneType, caratWeight,
    cut, clarity, color, origin, treatment, certification,
    dimensions, weight, shape, isActive, featured, isNew, isBestseller,
    tags, metaTitle, metaDescription,
  } = body;

  if (!name || !price) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const [created] = await db.insert(products).values({
    name,
    slug,
    description: description || null,
    shortDescription: shortDescription || null,
    price: String(price),
    salePrice: salePrice ? String(salePrice) : null,
    onSale: onSale ?? !!salePrice,
    inventory: inventory ?? 1,
    sku: sku || null,
    images: images?.length ? images : [''],
    categoryId: categoryId || null,
    gemstoneType: gemstoneType || null,
    caratWeight: caratWeight ? String(caratWeight) : null,
    cut: cut || null,
    clarity: clarity || null,
    color: color || null,
    origin: origin || null,
    treatment: treatment || null,
    certification: certification || null,
    dimensions: dimensions || null,
    weight: weight ? String(weight) : null,
    shape: shape || null,
    isActive: isActive ?? true,
    featured: featured ?? false,
    isNew: isNew ?? false,
    isBestseller: isBestseller ?? false,
    tags: tags || [],
    metaTitle: metaTitle || null,
    metaDescription: metaDescription || null,
  }).returning();

  await invalidateProductCaches(created.id);
  await triggerEvent('content', 'product-created', { id: created.id });

  return NextResponse.json({ data: created }, { status: 201 });
}
