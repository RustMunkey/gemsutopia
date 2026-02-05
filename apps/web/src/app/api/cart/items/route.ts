import { NextRequest } from 'next/server';
import { db, carts, cartItems, products } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cart/items - Add item to cart
 * Body: { productId: string, quantity: number }
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required to add items to cart');
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body as { productId: string; quantity?: number };

    if (!productId) {
      return ApiError.validation('Product ID is required');
    }

    if (quantity < 1) {
      return ApiError.validation('Quantity must be at least 1');
    }

    // Fetch product
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return ApiError.notFound('Product');
    }

    if (!product.isActive) {
      return ApiError.badRequest('Product is not available');
    }

    // Check stock
    if (product.inventory !== null && product.inventory < quantity) {
      return ApiError.badRequest(`Only ${product.inventory} items available`);
    }

    // Find or create cart
    let cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, session.user.id), eq(carts.status, 'active')),
    });

    if (!cart) {
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

    // Check if item already in cart
    const existingItem = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
    });

    const price = product.salePrice
      ? parseFloat(product.salePrice)
      : parseFloat(product.price || '0');

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      // Check stock for new quantity
      if (product.inventory !== null && product.inventory < newQuantity) {
        return ApiError.badRequest(`Only ${product.inventory} items available`);
      }

      await db
        .update(cartItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      // Add new item
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId,
        quantity,
        unitPrice: product.price || '0',
        salePrice: product.salePrice || null,
        productSnapshot: {
          name: product.name,
          image: product.images?.[0] || null,
          sku: product.sku,
        },
      });
    }

    // Recalculate cart totals
    const allItems = await db.query.cartItems.findMany({
      where: eq(cartItems.cartId, cart.id),
      with: { product: true },
    });

    let subtotal = 0;
    let itemCount = 0;
    for (const item of allItems) {
      const itemPrice = item.salePrice
        ? parseFloat(item.salePrice)
        : parseFloat(item.unitPrice);
      subtotal += itemPrice * item.quantity;
      itemCount += item.quantity;
    }

    await db
      .update(carts)
      .set({
        itemCount,
        subtotal: subtotal.toFixed(2),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(carts.id, cart.id));

    return apiSuccess(
      {
        cartId: cart.id,
        itemCount,
        subtotal,
      },
      'Item added to cart'
    );
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return ApiError.internal('Failed to add item to cart');
  }
}

/**
 * PATCH /api/cart/items - Update item quantity
 * Body: { itemId: string, quantity: number } OR { productId: string, quantity: number }
 */
export async function PATCH(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required to update cart');
    }

    const body = await request.json();
    const { itemId, productId, quantity } = body as {
      itemId?: string;
      productId?: string;
      quantity: number;
    };

    if (!itemId && !productId) {
      return ApiError.validation('Item ID or Product ID is required');
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return ApiError.validation('Valid quantity is required');
    }

    // Find user's cart
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, session.user.id), eq(carts.status, 'active')),
    });

    if (!cart) {
      return ApiError.notFound('Cart');
    }

    // Find the cart item
    let cartItem;
    if (itemId) {
      cartItem = await db.query.cartItems.findFirst({
        where: and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)),
        with: { product: true },
      });
    } else {
      cartItem = await db.query.cartItems.findFirst({
        where: and(eq(cartItems.productId, productId!), eq(cartItems.cartId, cart.id)),
        with: { product: true },
      });
    }

    if (!cartItem) {
      return ApiError.notFound('Cart item');
    }

    if (quantity === 0) {
      // Remove item
      await db.delete(cartItems).where(eq(cartItems.id, cartItem.id));
    } else {
      // Check stock
      if (cartItem.product.inventory !== null && cartItem.product.inventory < quantity) {
        return ApiError.badRequest(`Only ${cartItem.product.inventory} items available`);
      }

      // Update quantity
      await db
        .update(cartItems)
        .set({
          quantity,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(cartItems.id, cartItem.id));
    }

    // Recalculate cart totals
    const allItems = await db.query.cartItems.findMany({
      where: eq(cartItems.cartId, cart.id),
    });

    let subtotal = 0;
    let itemCount = 0;
    for (const item of allItems) {
      const itemPrice = item.salePrice
        ? parseFloat(item.salePrice)
        : parseFloat(item.unitPrice);
      subtotal += itemPrice * item.quantity;
      itemCount += item.quantity;
    }

    await db
      .update(carts)
      .set({
        itemCount,
        subtotal: subtotal.toFixed(2),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(carts.id, cart.id));

    return apiSuccess(
      {
        cartId: cart.id,
        itemCount,
        subtotal,
      },
      quantity === 0 ? 'Item removed from cart' : 'Cart updated'
    );
  } catch (error) {
    console.error('Error updating cart item:', error);
    return ApiError.internal('Failed to update cart');
  }
}

/**
 * DELETE /api/cart/items - Remove item from cart
 * Query: ?itemId=xxx OR ?productId=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required to remove items from cart');
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const productId = searchParams.get('productId');

    if (!itemId && !productId) {
      return ApiError.validation('Item ID or Product ID is required');
    }

    // Find user's cart
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, session.user.id), eq(carts.status, 'active')),
    });

    if (!cart) {
      return ApiError.notFound('Cart');
    }

    // Find and delete the cart item
    if (itemId) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
    } else {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.productId, productId!), eq(cartItems.cartId, cart.id)));
    }

    // Recalculate cart totals
    const allItems = await db.query.cartItems.findMany({
      where: eq(cartItems.cartId, cart.id),
    });

    let subtotal = 0;
    let itemCount = 0;
    for (const item of allItems) {
      const itemPrice = item.salePrice
        ? parseFloat(item.salePrice)
        : parseFloat(item.unitPrice);
      subtotal += itemPrice * item.quantity;
      itemCount += item.quantity;
    }

    await db
      .update(carts)
      .set({
        itemCount,
        subtotal: subtotal.toFixed(2),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(carts.id, cart.id));

    return apiSuccess(
      {
        cartId: cart.id,
        itemCount,
        subtotal,
      },
      'Item removed from cart'
    );
  } catch (error) {
    console.error('Error removing cart item:', error);
    return ApiError.internal('Failed to remove item from cart');
  }
}
