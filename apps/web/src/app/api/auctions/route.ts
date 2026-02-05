import { NextRequest } from 'next/server';
import { db, auctions } from '@/lib/db';
import { eq, desc, lte, gt, and } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import {
  getCache,
  setCache,
  generateCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
} from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET /api/auctions - Get all active auctions (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Generate cache key
    const cacheKey = generateCacheKey(CACHE_KEYS.AUCTIONS, { status: status || 'all' });

    // Try cache first
    const cached = await getCache<{ auctions: unknown[]; count: number }>(cacheKey);
    if (cached) {
      return apiSuccess(cached);
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

    // Fetch active auctions only
    let allAuctions = await db.query.auctions.findMany({
      where: eq(auctions.isActive, true),
      orderBy: [desc(auctions.createdAt)],
    });

    // Filter out ended auctions older than 24 hours
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

    if (status) {
      allAuctions = allAuctions.filter(a => a.status === status);
    }

    const responseData = {
      auctions: allAuctions,
      count: allAuctions.length,
    };

    // Cache for 1 minute (auctions change frequently with bids)
    await setCache(cacheKey, responseData, CACHE_TTL.AUCTIONS);

    return apiSuccess(responseData);
  } catch {
    return ApiError.internal('Failed to fetch auctions');
  }
}

// POST /api/auctions - Admin functionality moved to JetBeans BaaS
