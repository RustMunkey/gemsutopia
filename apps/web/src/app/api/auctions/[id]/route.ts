import { NextRequest } from 'next/server';
import { db, auctions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { apiSuccess, ApiError } from '@/lib/api';
import {
  getCache,
  setCache,
  generateCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
  invalidateAuctionsCaches,
} from '@/lib/cache';
import { triggerAuctionUpdated, triggerAuctionEnded } from '@/lib/pusher';

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

// GET /api/auctions/[id] - Get single auction
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Try cache first
    const cacheKey = generateCacheKey(CACHE_KEYS.AUCTIONS, { id });
    const cached = await getCache<{ auction: unknown }>(cacheKey);
    if (cached) {
      return apiSuccess(cached);
    }

    const auction = await db.query.auctions.findFirst({
      where: eq(auctions.id, id),
    });

    if (!auction) {
      return ApiError.notFound('Auction');
    }

    const responseData = { auction };

    // Cache for 1 minute (auctions change frequently with bids)
    await setCache(cacheKey, responseData, CACHE_TTL.AUCTIONS);

    return apiSuccess(responseData);
  } catch {
    return ApiError.internal('Failed to fetch auction');
  }
}

// PUT /api/auctions/[id] - Update auction (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return ApiError.unauthorized();
    }

    const data = await request.json();

    // Get existing auction first
    const existingAuction = await db.query.auctions.findFirst({
      where: eq(auctions.id, id),
    });

    if (!existingAuction) {
      return ApiError.notFound('Auction');
    }

    // Validate numeric fields if provided
    const startingBid = data.starting_bid
      ? parseFloat(data.starting_bid)
      : parseFloat(existingAuction.startingBid);
    const reservePrice =
      data.reserve_price !== undefined
        ? data.reserve_price
          ? parseFloat(data.reserve_price)
          : null
        : existingAuction.reservePrice
          ? parseFloat(existingAuction.reservePrice)
          : null;

    if (startingBid < 0) {
      return ApiError.validation('Starting bid must be greater than or equal to 0');
    }

    if (reservePrice && reservePrice < startingBid) {
      return ApiError.validation('Reserve price must be greater than or equal to starting bid');
    }

    // Validate dates if provided
    const startTime = data.start_time
      ? new Date(data.start_time)
      : new Date(existingAuction.startTime);
    const endTime = data.end_time ? new Date(data.end_time) : new Date(existingAuction.endTime);

    if (endTime <= startTime) {
      return ApiError.validation('End time must be after start time');
    }

    // Check if auction duration is reasonable (max 1 month)
    const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    if (endTime.getTime() - startTime.getTime() > maxDuration) {
      return ApiError.validation('Auction duration cannot exceed 30 days');
    }

    // Update status based on new times if changed
    let newStatus = data.status || existingAuction.status;
    if (data.start_time || data.end_time) {
      const now = new Date();
      if (startTime <= now && endTime > now) {
        newStatus = 'active';
      } else if (endTime <= now) {
        newStatus = 'ended';
      } else if (startTime > now) {
        newStatus = 'pending';
      }
    }

    // Prepare update data - only include fields that are provided
    const updateData: Partial<typeof auctions.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.video_url !== undefined) updateData.videoUrl = data.video_url;
    if (data.featured_image_index !== undefined)
      updateData.featuredImageIndex = data.featured_image_index;
    if (data.starting_bid !== undefined) updateData.startingBid = String(startingBid);
    if (data.reserve_price !== undefined)
      updateData.reservePrice = reservePrice ? String(reservePrice) : null;
    if (data.start_time !== undefined) updateData.startTime = startTime.toISOString();
    if (data.end_time !== undefined) updateData.endTime = endTime.toISOString();
    if (data.is_active !== undefined) updateData.isActive = data.is_active;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    updateData.status = newStatus;

    const [updatedAuction] = await db
      .update(auctions)
      .set(updateData)
      .where(eq(auctions.id, id))
      .returning();

    if (!updatedAuction) {
      return ApiError.internal('Failed to update auction');
    }

    // Invalidate auctions cache (both list and single)
    await invalidateAuctionsCaches();

    // Trigger real-time updates via Pusher (non-blocking)
    if (newStatus === 'ended' && existingAuction.status !== 'ended') {
      // Auction just ended
      triggerAuctionEnded(id, {
        finalBid: parseFloat(updatedAuction.currentBid || '0'),
      }).catch(() => {});
    } else {
      // General update
      triggerAuctionUpdated(id, {
        title: updatedAuction.title,
        status: updatedAuction.status,
        isActive: updatedAuction.isActive,
        endTime: updatedAuction.endTime,
      }).catch(() => {});
    }

    return apiSuccess({ auction: updatedAuction }, 'Auction updated successfully');
  } catch {
    return ApiError.internal('Failed to update auction');
  }
}

// DELETE /api/auctions/[id] - Delete auction (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return ApiError.unauthorized();
    }

    // Check if auction exists and has no bids before allowing deletion
    const auction = await db.query.auctions.findFirst({
      where: eq(auctions.id, id),
      columns: { bidCount: true },
    });

    if (!auction) {
      return ApiError.notFound('Auction');
    }

    // Prevent deletion if auction has bids (for data integrity)
    if (auction.bidCount && auction.bidCount > 0) {
      return ApiError.badRequest(
        'Cannot delete auction with existing bids. Consider setting it as inactive instead.'
      );
    }

    await db.delete(auctions).where(eq(auctions.id, id));

    // Invalidate auctions cache
    await invalidateAuctionsCaches();

    return apiSuccess(null, 'Auction deleted successfully');
  } catch {
    return ApiError.internal('Failed to delete auction');
  }
}
