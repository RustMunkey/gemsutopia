import { NextRequest } from 'next/server';
import { db, gemFacts } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { apiSuccess, ApiError } from '@/lib/api';
import { invalidateContentCaches } from '@/lib/cache';

export const dynamic = 'force-dynamic';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, getJWTSecret());
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const allGemFacts = await db.query.gemFacts.findMany({
      orderBy: [desc(gemFacts.createdAt)],
    });

    // Map to snake_case for API response compatibility
    const mappedFacts = allGemFacts.map(fact => ({
      id: fact.id,
      title: fact.title,
      content: fact.content,
      short_content: fact.shortContent,
      image: fact.image,
      video_url: fact.videoUrl,
      gemstone_type: fact.gemstoneType,
      category: fact.category,
      sort_order: fact.sortOrder,
      is_active: fact.isActive,
      is_featured: fact.isFeatured,
      source: fact.source,
      source_url: fact.sourceUrl,
      created_at: fact.createdAt,
      updated_at: fact.updatedAt,
      // Legacy field mapping for backward compatibility
      fact: fact.content,
      gem_type: fact.gemstoneType,
    }));

    return apiSuccess({ gemFacts: mappedFacts });
  } catch {
    return ApiError.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const body = await request.json();
    // Support both new and legacy field names
    const {
      title,
      content,
      fact, // legacy
      gem_type, // legacy
      gemstone_type,
      source,
      is_active,
    } = body;

    const factContent = content || fact;
    const gemType = gemstone_type || gem_type;

    if (!factContent) {
      return ApiError.validation('Content/fact is required');
    }

    const [newFact] = await db
      .insert(gemFacts)
      .values({
        title: title || 'Gem Fact',
        content: factContent,
        gemstoneType: gemType || null,
        source: source || null,
        isActive: is_active !== undefined ? is_active : true,
      })
      .returning();

    if (!newFact) {
      return ApiError.database('Failed to create gem fact');
    }

    // Invalidate gem facts cache
    await invalidateContentCaches('gem-facts');

    // Map to snake_case for response
    const mappedFact = {
      id: newFact.id,
      title: newFact.title,
      content: newFact.content,
      gemstone_type: newFact.gemstoneType,
      source: newFact.source,
      is_active: newFact.isActive,
      created_at: newFact.createdAt,
      updated_at: newFact.updatedAt,
      // Legacy field mapping
      fact: newFact.content,
      gem_type: newFact.gemstoneType,
    };

    return apiSuccess({ gemFact: mappedFact }, 'Gem fact created successfully', 201);
  } catch {
    return ApiError.internal();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const body = await request.json();
    const {
      id,
      title,
      content,
      fact, // legacy
      gem_type, // legacy
      gemstone_type,
      source,
      is_active,
    } = body;

    if (!id) {
      return ApiError.validation('Missing gem fact ID');
    }

    const updateData: Partial<typeof gemFacts.$inferInsert> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (fact !== undefined && content === undefined) updateData.content = fact; // legacy
    if (gemstone_type !== undefined) updateData.gemstoneType = gemstone_type;
    if (gem_type !== undefined && gemstone_type === undefined) updateData.gemstoneType = gem_type; // legacy
    if (source !== undefined) updateData.source = source;
    if (is_active !== undefined) updateData.isActive = is_active;

    const [updated] = await db
      .update(gemFacts)
      .set(updateData)
      .where(eq(gemFacts.id, id))
      .returning();

    if (!updated) {
      return ApiError.notFound('Gem fact');
    }

    // Invalidate gem facts cache
    await invalidateContentCaches('gem-facts');

    // Map to snake_case for response
    const mappedFact = {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      gemstone_type: updated.gemstoneType,
      source: updated.source,
      is_active: updated.isActive,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
      // Legacy field mapping
      fact: updated.content,
      gem_type: updated.gemstoneType,
    };

    return apiSuccess({ gemFact: mappedFact }, 'Gem fact updated successfully');
  } catch {
    return ApiError.internal();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return ApiError.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ApiError.validation('Missing gem fact ID');
    }

    await db.delete(gemFacts).where(eq(gemFacts.id, id));

    // Invalidate gem facts cache
    await invalidateContentCaches('gem-facts');

    return apiSuccess(null, 'Gem fact deleted successfully');
  } catch {
    return ApiError.internal();
  }
}
