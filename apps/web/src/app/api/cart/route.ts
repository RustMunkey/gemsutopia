import { NextRequest } from 'next/server';
import { db, carts, cartItems, products } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cart - Get the current user's cart
 */
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required to access cart');
    }

    // Find active cart for user
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, session.user.id), eq(carts.status, 'active')),
      with: {
        cartItems: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      // Return empty cart structure
      return apiSuccess({
        cart: null,
        items: [],
        subtotal: 0,
        itemCount: 0,
      });
    }

    // Format the response
    const items = cart.cartItems.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      salePrice: item.salePrice ? parseFloat(item.salePrice) : null,
      product: item.product,
      addedAt: item.createdAt,
    }));

    return apiSuccess({
      cart: {
        id: cart.id,
        status: cart.status,
        discountCode: cart.discountCode,
        discountAmount: cart.discountAmount ? parseFloat(cart.discountAmount) : 0,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
      items,
      subtotal: parseFloat(cart.subtotal || '0'),
      itemCount: cart.itemCount || 0,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return ApiError.internal('Failed to fetch cart');
  }
}

/**
 * POST /api/cart - Sync entire cart from client
 * Body: { items: [{ productId, quantity }], discountCode?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required to sync cart');
    }

    const body = await request.json();
    const { items, discountCode } = body as {
      items: Array<{ productId: string; quantity: number }>;
      discountCode?: string;
    };

    if (!Array.isArray(items)) {
      return ApiError.validation('Items must be an array');
    }

    // Find or create active cart for user
    let cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, session.user.id), eq(carts.status, 'active')),
    });

    if (!cart) {
      // Create new cart
      const [newCart] = await db
        .insert(carts)
        .values({
          userId: session.user.id,
          status: 'active',
          itemCount: 0,
          subtotal: '0',
        })
        .returning();
      cart = newCart;
    }

    // Clear existing cart items
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    // Add new items
    let subtotal = 0;
    const newItems: Array<{
      cartId: string;
      productId: string;
      quantity: number;
      unitPrice: string;
      salePrice: string | null;
      productSnapshot: Record<string, unknown>;
    }> = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) continue;

      // Fetch product details
      const product = await db.query.products.findFirst({
        where: eq(products.id, item.productId),
      });

      if (!product || !product.isActive) continue;

      const price = product.salePrice
        ? parseFloat(product.salePrice)
        : parseFloat(product.price || '0');
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      newItems.push({
        cartId: cart.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price || '0',
        salePrice: product.salePrice || null,
        productSnapshot: {
          name: product.name,
          image: product.images?.[0] || null,
          sku: product.sku,
        },
      });
    }

    // Insert all new items
    if (newItems.length > 0) {
      await db.insert(cartItems).values(newItems);
    }

    // Update cart totals
    await db
      .update(carts)
      .set({
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal.toFixed(2),
        discountCode: discountCode || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(carts.id, cart.id));

    return apiSuccess(
      {
        cartId: cart.id,
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        syncedAt: new Date().toISOString(),
      },
      'Cart synced successfully'
    );
  } catch (error) {
    console.error('Error syncing cart:', error);
    return ApiError.internal('Failed to sync cart');
  }
}

/**
 * DELETE /api/cart - Clear the user's cart
 */
export async function DELETE() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required to clear cart');
    }

    // Find active cart
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, session.user.id), eq(carts.status, 'active')),
    });

    if (cart) {
      // Delete cart items
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

      // Reset cart totals
      await db
        .update(carts)
        .set({
          itemCount: 0,
          subtotal: '0',
          discountCode: null,
          discountAmount: '0',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(carts.id, cart.id));
    }

    return apiSuccess(null, 'Cart cleared successfully');
  } catch (error) {
    console.error('Error clearing cart:', error);
    return ApiError.internal('Failed to clear cart');
  }
}
