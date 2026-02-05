import { NextRequest } from 'next/server';
import { db, auctions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import {
  getCache,
  setCache,
  generateCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
} from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET /api/auctions/[id] - Get single auction (public)
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

// PUT /api/auctions/[id] - Admin functionality moved to JetBeans BaaS
// DELETE /api/auctions/[id] - Admin functionality moved to JetBeans BaaS
