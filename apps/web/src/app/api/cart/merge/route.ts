import { NextRequest } from 'next/server';
import { db, carts, cartItems, products } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

interface GuestCartItem {
  productId: string;
  quantity: number;
  addedAt?: string;
}

/**
 * POST /api/cart/merge - Merge guest cart into authenticated user's cart
 * Called on login to combine local storage cart with server cart
 *
 * Body: { guestItems: [{ productId, quantity }] }
 *
 * Merge Strategy:
 * - If item exists in both carts, take the higher quantity
 * - Add items that only exist in guest cart
 * - Keep items that only exist in server cart
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required to merge cart');
    }

    const body = await request.json();
    const { guestItems } = body as { guestItems: GuestCartItem[] };

    if (!Array.isArray(guestItems)) {
      return ApiError.validation('guestItems must be an array');
    }

    // Find or create active cart for user
    let cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, session.user.id), eq(carts.status, 'active')),
      with: {
        cartItems: true,
      },
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
      cart = { ...newCart, cartItems: [] };
    }

    // Create a map of existing cart items by productId
    const existingItemsMap = new Map(
      cart.cartItems.map(item => [item.productId, item])
    );

    // Track merged items for response
    const mergedItems: Array<{ productId: string; quantity: number; action: string }> = [];

    // Process guest items
    for (const guestItem of guestItems) {
      if (!guestItem.productId || !guestItem.quantity || guestItem.quantity < 1) {
        continue;
      }

      // Fetch product to validate and get current prices
      const product = await db.query.products.findFirst({
        where: eq(products.id, guestItem.productId),
      });

      if (!product || !product.isActive) {
        continue;
      }

      const existingItem = existingItemsMap.get(guestItem.productId);

      if (existingItem) {
        // Item exists in both carts - take the higher quantity
        const newQuantity = Math.max(existingItem.quantity, guestItem.quantity);

        // Check stock
        if (product.inventory !== null && newQuantity > product.inventory) {
          // Use available stock
          const availableQty = product.inventory;
          if (availableQty > 0) {
            await db
              .update(cartItems)
              .set({
                quantity: availableQty,
                unitPrice: product.price || '0',
                salePrice: product.salePrice || null,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(cartItems.id, existingItem.id));

            mergedItems.push({
              productId: guestItem.productId,
              quantity: availableQty,
              action: 'updated_limited_stock',
            });
          }
        } else if (newQuantity !== existingItem.quantity) {
          // Update to higher quantity
          await db
            .update(cartItems)
            .set({
              quantity: newQuantity,
              unitPrice: product.price || '0',
              salePrice: product.salePrice || null,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(cartItems.id, existingItem.id));

          mergedItems.push({
            productId: guestItem.productId,
            quantity: newQuantity,
            action: 'updated',
          });
        } else {
          mergedItems.push({
            productId: guestItem.productId,
            quantity: existingItem.quantity,
            action: 'kept',
          });
        }

        // Remove from map to track processed items
        existingItemsMap.delete(guestItem.productId);
      } else {
        // Item only in guest cart - add to server cart
        let quantityToAdd = guestItem.quantity;

        // Check stock
        if (product.inventory !== null && quantityToAdd > product.inventory) {
          quantityToAdd = product.inventory;
        }

        if (quantityToAdd > 0) {
          await db.insert(cartItems).values({
            cartId: cart.id,
            productId: guestItem.productId,
            quantity: quantityToAdd,
            unitPrice: product.price || '0',
            salePrice: product.salePrice || null,
            productSnapshot: {
              name: product.name,
              image: product.images?.[0] || null,
              sku: product.sku,
            },
          });

          mergedItems.push({
            productId: guestItem.productId,
            quantity: quantityToAdd,
            action: 'added',
          });
        }
      }
    }

    // Items remaining in existingItemsMap were only in server cart - they stay
    for (const [productId, item] of existingItemsMap) {
      mergedItems.push({
        productId,
        quantity: item.quantity,
        action: 'kept_server',
      });
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

    // Return merged cart state
    return apiSuccess(
      {
        cartId: cart.id,
        itemCount,
        subtotal,
        mergedItems,
        mergedAt: new Date().toISOString(),
      },
      'Cart merged successfully'
    );
  } catch (error) {
    console.error('Error merging cart:', error);
    return ApiError.internal('Failed to merge cart');
  }
}
