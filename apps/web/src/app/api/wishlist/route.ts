import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { wishlists, wishlistItems, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';

// GET - Fetch user's wishlist
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required');
    }

    // Find or create user's wishlist
    let wishlist = await db.query.wishlists.findFirst({
      where: eq(wishlists.userId, session.user.id),
    });

    if (!wishlist) {
      const [created] = await db
        .insert(wishlists)
        .values({ userId: session.user.id, name: 'My Wishlist' })
        .returning();
      wishlist = created;
    }

    // Get wishlist items with product details
    const items = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        images: products.images,
        inventory: products.inventory,
        addedAt: wishlistItems.createdAt,
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.wishlistId, wishlist.id));

    const formatted = items.map(item => ({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price || '0'),
      image: item.images?.[0] || '',
      inventory: item.inventory ?? 0,
    }));

    return apiSuccess({ items: formatted, wishlistId: wishlist.id });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return ApiError.internal('Failed to fetch wishlist');
  }
}

// PUT - Sync wishlist (replace all items)
export async function PUT(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required');
    }

    const body = await request.json();
    const { items } = body as { items: { id: string; price?: number }[] };

    if (!Array.isArray(items)) {
      return ApiError.validation('Items must be an array');
    }

    // Find or create wishlist
    let wishlist = await db.query.wishlists.findFirst({
      where: eq(wishlists.userId, session.user.id),
    });

    if (!wishlist) {
      const [created] = await db
        .insert(wishlists)
        .values({ userId: session.user.id, name: 'My Wishlist' })
        .returning();
      wishlist = created;
    }

    // Clear existing items
    await db
      .delete(wishlistItems)
      .where(eq(wishlistItems.wishlistId, wishlist.id));

    // Insert new items
    if (items.length > 0) {
      const productIds = items.map(i => i.id);

      // Verify products exist
      const existingProducts = await db.query.products.findMany({
        where: (p, { inArray }) => inArray(p.id, productIds),
        columns: { id: true },
      });

      const validIds = new Set(existingProducts.map(p => p.id));

      const toInsert = items
        .filter(item => validIds.has(item.id))
        .map(item => ({
          wishlistId: wishlist!.id,
          productId: item.id,
          addedPrice: item.price ? String(item.price) : null,
        }));

      if (toInsert.length > 0) {
        await db.insert(wishlistItems).values(toInsert);
      }
    }

    return apiSuccess({ synced: true, count: items.length });
  } catch (error) {
    console.error('Error syncing wishlist:', error);
    return ApiError.internal('Failed to sync wishlist');
  }
}

// POST - Add single item to wishlist
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required');
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return ApiError.validation('Product ID is required');
    }

    // Find or create wishlist
    let wishlist = await db.query.wishlists.findFirst({
      where: eq(wishlists.userId, session.user.id),
    });

    if (!wishlist) {
      const [created] = await db
        .insert(wishlists)
        .values({ userId: session.user.id, name: 'My Wishlist' })
        .returning();
      wishlist = created;
    }

    // Check if already in wishlist
    const existing = await db.query.wishlistItems.findFirst({
      where: and(
        eq(wishlistItems.wishlistId, wishlist.id),
        eq(wishlistItems.productId, productId)
      ),
    });

    if (existing) {
      return apiSuccess({ added: false, message: 'Already in wishlist' });
    }

    await db.insert(wishlistItems).values({
      wishlistId: wishlist.id,
      productId,
    });

    return apiSuccess({ added: true }, 'Added to wishlist', 201);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return ApiError.internal('Failed to add to wishlist');
  }
}

// DELETE - Remove item from wishlist
export async function DELETE(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required');
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return ApiError.validation('Product ID is required');
    }

    const wishlist = await db.query.wishlists.findFirst({
      where: eq(wishlists.userId, session.user.id),
    });

    if (wishlist) {
      await db
        .delete(wishlistItems)
        .where(
          and(
            eq(wishlistItems.wishlistId, wishlist.id),
            eq(wishlistItems.productId, productId)
          )
        );
    }

    return apiSuccess({ removed: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return ApiError.internal('Failed to remove from wishlist');
  }
}
