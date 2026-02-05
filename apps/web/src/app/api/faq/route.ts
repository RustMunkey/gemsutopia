import { db, faq } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try Redis cache first
    const cached = await getCache<{ faq: unknown[] }>(CACHE_KEYS.FAQ);
    if (cached) {
      return apiSuccess(cached);
    }

    const faqItems = await db.query.faq.findMany({
      where: eq(faq.isActive, true),
      orderBy: [asc(faq.sortOrder)],
    });

    // Map to snake_case for API response compatibility
    const mappedFaq = faqItems.map(item => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      category: item.category,
      sort_order: item.sortOrder,
      is_active: item.isActive,
      is_featured: item.isFeatured,
      view_count: item.viewCount,
      helpful_count: item.helpfulCount,
      not_helpful_count: item.notHelpfulCount,
      metadata: item.metadata,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));

    const responseData = { faq: mappedFaq };

    // Cache for 30 minutes
    await setCache(CACHE_KEYS.FAQ, responseData, CACHE_TTL.FAQ);

    return apiSuccess(responseData);
  } catch {
    return ApiError.internal('Failed to fetch FAQ');
  }
}
