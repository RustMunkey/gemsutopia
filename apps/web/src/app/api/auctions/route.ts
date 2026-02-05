import { NextRequest } from 'next/server';
import { db, auctions } from '@/lib/db';
import { eq, desc, lte, gt, and } from 'drizzle-orm';
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
import { triggerAuctionCreated } from '@/lib/pusher';

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

// GET /api/auctions - Get all auctions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const status = searchParams.get('status');

    // If includeInactive is requested, verify admin token
    if (includeInactive && !verifyAdminToken(request)) {
      return ApiError.unauthorized('Admin access required to include inactive auctions');
    }

    // Generate cache key for public requests (non-admin)
    const cacheKey = !includeInactive
      ? generateCacheKey(CACHE_KEYS.AUCTIONS, { status: status || 'all' })
      : null;

    // Try cache for public requests
    if (cacheKey) {
      const cached = await getCache<{ auctions: unknown[]; count: number }>(cacheKey);
      if (cached) {
        return apiSuccess(cached);
      }
    }

    const now = new Date().toISOString();

    // Update pending auctions to active if start time has passed
    await db
      .update(auctions)
      .set({ status: 'active' })
      .where(
        and(eq(auctions.status, 'pending'), lte(auctions.startTime, now), gt(auctions.endTime, now))
      );

    // Update active auctions to ended if end time has passed
    await db
      .update(auctions)
      .set({ status: 'ended' })
      .where(and(eq(auctions.status, 'active'), lte(auctions.endTime, now)));

    // Fetch auctions
    let allAuctions = await db.query.auctions.findMany({
      orderBy: [desc(auctions.createdAt)],
    });

    // Apply filters
    if (!includeInactive) {
      allAuctions = allAuctions.filter(a => a.isActive);
    }

    // Filter out ended auctions older than 24 hours (for public view)
    if (!includeInactive) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      allAuctions = allAuctions.filter(a => {
        // Keep active and pending auctions
        if (a.status === 'active' || a.status === 'pending' || a.status === 'scheduled') {
          return true;
        }
        // For ended/sold auctions, only show if ended within 24 hours
        const endTime = new Date(a.endTime);
        return endTime > twentyFourHoursAgo;
      });
    }

    if (status) {
      allAuctions = allAuctions.filter(a => a.status === status);
    }

    const responseData = {
      auctions: allAuctions,
      count: allAuctions.length,
    };

    // Cache public requests for 1 minute (auctions change frequently with bids)
    if (cacheKey) {
      await setCache(cacheKey, responseData, CACHE_TTL.AUCTIONS);
    }

    return apiSuccess(responseData);
  } catch {
    return ApiError.internal('Failed to fetch auctions');
  }
}

// POST /api/auctions - Create new auction (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return ApiError.unauthorized();
    }

    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.starting_bid || !data.start_time || !data.end_time) {
      return ApiError.validation('Title, starting bid, start time, and end time are required');
    }

    // Validate numeric fields
    const startingBid = parseFloat(data.starting_bid);
    const reservePrice = data.reserve_price ? parseFloat(data.reserve_price) : null;

    if (startingBid < 0) {
      return ApiError.validation('Starting bid must be greater than or equal to 0');
    }

    if (reservePrice && reservePrice < startingBid) {
      return ApiError.validation('Reserve price must be greater than or equal to starting bid');
    }

    // Validate dates
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);

    if (endTime <= startTime) {
      return ApiError.validation('End time must be after start time');
    }

    // Check if auction duration is reasonable (max 1 month)
    const maxDuration = 30 * 24 * 60 * 60 * 1000;
    if (endTime.getTime() - startTime.getTime() > maxDuration) {
      return ApiError.validation('Auction duration cannot exceed 30 days');
    }

    // Determine initial status based on start time
    const now = new Date();
    let initialStatus = 'pending';
    if (startTime <= now && endTime > now) {
      initialStatus = 'active';
    } else if (endTime <= now) {
      initialStatus = 'ended';
    }

    // Prepare auction data
    const [newAuction] = await db
      .insert(auctions)
      .values({
        title: data.title,
        description: data.description || null,
        images: data.images || [],
        videoUrl: data.video_url || null,
        featuredImageIndex: data.featured_image_index || 0,
        startingBid: String(startingBid),
        currentBid: String(startingBid),
        reservePrice: reservePrice ? String(reservePrice) : null,
        bidCount: 0,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: initialStatus,
        isActive: data.is_active !== false,
        metadata: data.metadata || {},
      })
      .returning();

    // Invalidate auctions cache
    await invalidateAuctionsCaches();

    // Trigger real-time auction created event via Pusher (non-blocking)
    triggerAuctionCreated({
      id: newAuction.id,
      title: newAuction.title,
      startingBid: startingBid,
      endTime: newAuction.endTime,
    }).catch(() => {
      // Pusher event failed - don't block response
    });

    return apiSuccess({ auction: newAuction }, 'Auction created successfully', 201);
  } catch {
    return ApiError.internal('Failed to create auction');
  }
}
