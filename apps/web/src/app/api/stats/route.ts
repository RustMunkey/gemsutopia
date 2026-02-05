import { NextResponse } from 'next/server';
import { db, stats } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { ApiError } from '@/lib/api';
import { getCache, setCache } from '@/lib/cache';

const CACHE_KEY = 'content:stats';
const CACHE_TTL = 300; // 5 minutes

export const revalidate = 300;

export async function GET() {
  try {
    // Try Redis cache first
    const cached = await getCache<{ stats: unknown[] }>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(
        { success: true, data: cached },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
      );
    }

    const allStats = await db.query.stats.findMany({
      where: eq(stats.isActive, true),
      orderBy: [asc(stats.sortOrder)],
    });

    const mappedStats = allStats.map(stat => ({
      id: stat.id,
      title: stat.title,
      value: stat.value,
      description: stat.description,
      icon: stat.icon,
      data_source: stat.dataSource,
      is_real_time: stat.isRealTime,
      sort_order: stat.sortOrder,
      is_active: stat.isActive,
      created_at: stat.createdAt,
      updated_at: stat.updatedAt,
    }));

    const responseData = { stats: mappedStats };

    // Cache in Redis
    await setCache(CACHE_KEY, responseData, CACHE_TTL);

    return NextResponse.json(
      { success: true, data: responseData },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch {
    return ApiError.internal('Failed to fetch stats');
  }
}
