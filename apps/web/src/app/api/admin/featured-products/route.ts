import { NextRequest } from 'next/server';
import { db, featuredProducts } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, getJWTSecret());
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const allFeatured = await db.query.featuredProducts.findMany({
      orderBy: [asc(featuredProducts.sortOrder)],
    });

    // Map to snake_case for API response compatibility
    const mappedProducts = allFeatured.map(product => ({
      id: product.id,
      name: product.name,
      type: product.type,
      description: product.description,
      image_url: product.imageUrl,
      card_color: product.cardColor,
      price: product.price ? parseFloat(product.price) : null,
      original_price: product.originalPrice ? parseFloat(product.originalPrice) : null,
      product_id: product.productId,
      sort_order: product.sortOrder,
      is_active: product.isActive,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    }));

    return apiSuccess({ featuredProducts: mappedProducts });
  } catch {
    return ApiError.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const body = await request.json();
    const {
      name,
      type,
      description,
      image_url,
      card_color,
      price,
      original_price,
      product_id,
      sort_order,
      is_active,
    } = body;

    if (!name || !type || !image_url) {
      return ApiError.validation('Missing required fields: name, type, image_url');
    }

    const [newProduct] = await db
      .insert(featuredProducts)
      .values({
        name,
        type,
        description: description || null,
        imageUrl: image_url,
        cardColor: card_color || null,
        price: price ? String(price) : null,
        originalPrice: original_price ? String(original_price) : null,
        productId: product_id || null,
        sortOrder: sort_order || 0,
        isActive: is_active !== undefined ? is_active : true,
      })
      .returning();

    if (!newProduct) {
      return ApiError.database('Failed to create featured product');
    }

    // Map to snake_case for response
    const mappedProduct = {
      id: newProduct.id,
      name: newProduct.name,
      type: newProduct.type,
      description: newProduct.description,
      image_url: newProduct.imageUrl,
      card_color: newProduct.cardColor,
      price: newProduct.price ? parseFloat(newProduct.price) : null,
      original_price: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : null,
      product_id: newProduct.productId,
      sort_order: newProduct.sortOrder,
      is_active: newProduct.isActive,
      created_at: newProduct.createdAt,
      updated_at: newProduct.updatedAt,
    };

    return apiSuccess({ featuredProduct: mappedProduct }, 'Featured product created successfully', 201);
  } catch {
    return ApiError.internal();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const body = await request.json();
    const {
      id,
      name,
      type,
      description,
      image_url,
      card_color,
      price,
      original_price,
      product_id,
      sort_order,
      is_active,
    } = body;

    if (!id) {
      return ApiError.validation('Missing product ID');
    }

    const updateData: Partial<typeof featuredProducts.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.imageUrl = image_url;
    if (card_color !== undefined) updateData.cardColor = card_color;
    if (price !== undefined) updateData.price = price ? String(price) : null;
    if (original_price !== undefined)
      updateData.originalPrice = original_price ? String(original_price) : null;
    if (product_id !== undefined) updateData.productId = product_id;
    if (sort_order !== undefined) updateData.sortOrder = sort_order;
    if (is_active !== undefined) updateData.isActive = is_active;

    const [updated] = await db
      .update(featuredProducts)
      .set(updateData)
      .where(eq(featuredProducts.id, id))
      .returning();

    if (!updated) {
      return ApiError.notFound('Featured product');
    }

    // Map to snake_case for response
    const mappedProduct = {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      description: updated.description,
      image_url: updated.imageUrl,
      card_color: updated.cardColor,
      price: updated.price ? parseFloat(updated.price) : null,
      original_price: updated.originalPrice ? parseFloat(updated.originalPrice) : null,
      product_id: updated.productId,
      sort_order: updated.sortOrder,
      is_active: updated.isActive,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    };

    return apiSuccess({ featuredProduct: mappedProduct }, 'Featured product updated successfully');
  } catch {
    return ApiError.internal();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ApiError.validation('Missing product ID');
    }

    await db.delete(featuredProducts).where(eq(featuredProducts.id, id));

    return apiSuccess(null, 'Featured product deleted successfully');
  } catch {
    return ApiError.internal();
  }
}
