import { db, gemFacts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const random = searchParams.get('random');

    // Only cache "fact of the day" (non-random requests)
    const cacheKey = random !== 'true' ? CACHE_KEYS.GEM_FACTS : null;

    if (cacheKey) {
      const cached = await getCache<{ gemFact: unknown }>(cacheKey);
      if (cached) {
        return apiSuccess(cached);
      }
    }

    // Get all active gem facts
    const allGemFacts = await db.query.gemFacts.findMany({
      where: eq(gemFacts.isActive, true),
    });

    if (!allGemFacts || allGemFacts.length === 0) {
      return apiSuccess({
        gemFact: {
          id: 'fallback',
          fact: 'Gems have fascinated humans for thousands of years with their beauty and rarity.',
          gem_type: 'General',
          source: 'Default',
          is_active: true,
        },
      });
    }

    let selectedFact;

    if (random === 'true') {
      // Return a random fact
      const randomIndex = Math.floor(Math.random() * allGemFacts.length);
      selectedFact = allGemFacts[randomIndex];
    } else {
      // Use current date to deterministically select fact of the day
      const today = new Date();
      const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
      );
      const factIndex = dayOfYear % allGemFacts.length;
      selectedFact = allGemFacts[factIndex];
    }

    // Map to snake_case for API response compatibility
    const mappedFact = {
      id: selectedFact.id,
      title: selectedFact.title,
      content: selectedFact.content,
      short_content: selectedFact.shortContent,
      image: selectedFact.image,
      video_url: selectedFact.videoUrl,
      gemstone_type: selectedFact.gemstoneType,
      category: selectedFact.category,
      sort_order: selectedFact.sortOrder,
      is_active: selectedFact.isActive,
      is_featured: selectedFact.isFeatured,
      source: selectedFact.source,
      source_url: selectedFact.sourceUrl,
      created_at: selectedFact.createdAt,
      updated_at: selectedFact.updatedAt,
    };

    const responseData = { gemFact: mappedFact };

    // Cache fact of the day for 30 minutes
    if (cacheKey) {
      await setCache(cacheKey, responseData, CACHE_TTL.GEM_FACTS);
    }

    return apiSuccess(responseData);
  } catch {
    return ApiError.internal('Failed to fetch gem facts');
  }
}
