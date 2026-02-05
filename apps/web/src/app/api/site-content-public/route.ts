import { NextResponse } from 'next/server';
import { db, siteContent } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { ApiError } from '@/lib/api';
import { getCache, setCache } from '@/lib/cache';

const CACHE_KEY = 'content:site-content';
const CACHE_TTL = 300; // 5 minutes

export const revalidate = 300;

export async function GET() {
  try {
    // Try Redis cache first
    const cached = await getCache<{ content: unknown[] }>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(
        { success: true, data: cached },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
      );
    }

    const content = await db.query.siteContent.findMany({
      where: eq(siteContent.isActive, true),
      orderBy: [asc(siteContent.section), asc(siteContent.key)],
      columns: {
        id: true,
        section: true,
        key: true,
        contentType: true,
        value: true,
        isActive: true,
      },
    });

    const mappedContent = content.map(item => ({
      id: item.id,
      section: item.section,
      key: item.key,
      content_type: item.contentType,
      value: item.value,
      is_active: item.isActive,
    }));

    const responseData = { content: mappedContent, count: mappedContent.length };

    // Cache in Redis
    await setCache(CACHE_KEY, responseData, CACHE_TTL);

    return NextResponse.json(
      { success: true, data: responseData },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch {
    return ApiError.internal('Failed to fetch site content');
  }
}
