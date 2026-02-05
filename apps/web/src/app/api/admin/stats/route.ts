import { NextRequest } from 'next/server';
import { db, stats } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { requireAdmin, validateAndSanitize } from '@/lib/auth/adminAuth';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET - Admin auth required
async function getStatsHandler() {
  try {
    const allStats = await db.query.stats.findMany({
      orderBy: [asc(stats.sortOrder)],
    });

    // Map to snake_case for API response compatibility
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

    return apiSuccess({ stats: mappedStats, timestamp: new Date().toISOString() });
  } catch {
    return ApiError.internal();
  }
}

// POST - Admin auth + Input validation
async function postStatsHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, value, description, icon, data_source, is_real_time, sort_order, is_active } =
      body;

    // Input validation
    if (!title || !value) {
      return ApiError.validation('Missing required fields: title and value');
    }

    if (typeof title !== 'string' || title.length > 200) {
      return ApiError.validation('Title must be a string with max 200 characters');
    }

    const [newStat] = await db
      .insert(stats)
      .values({
        title: title.trim(),
        value: String(value).trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        dataSource: data_source || 'manual',
        isRealTime: Boolean(is_real_time),
        sortOrder: Number(sort_order) || 0,
        isActive: is_active !== undefined ? Boolean(is_active) : true,
      })
      .returning();

    if (!newStat) {
      return ApiError.database('Failed to create stat');
    }

    // Map to snake_case for response
    const data = {
      id: newStat.id,
      title: newStat.title,
      value: newStat.value,
      description: newStat.description,
      icon: newStat.icon,
      data_source: newStat.dataSource,
      is_real_time: newStat.isRealTime,
      sort_order: newStat.sortOrder,
      is_active: newStat.isActive,
      created_at: newStat.createdAt,
      updated_at: newStat.updatedAt,
    };

    return apiSuccess({ stat: data }, 'Stat created successfully', 201);
  } catch {
    return ApiError.internal();
  }
}

// PUT - Admin auth + Input validation
async function putStatsHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return ApiError.validation('Valid stat ID is required');
    }

    // Build update data with camelCase field names
    const updateData: Partial<typeof stats.$inferInsert> = {};

    if (updateFields.title !== undefined) updateData.title = String(updateFields.title).trim();
    if (updateFields.value !== undefined) updateData.value = String(updateFields.value).trim();
    if (updateFields.description !== undefined)
      updateData.description = updateFields.description?.trim() || null;
    if (updateFields.icon !== undefined) updateData.icon = updateFields.icon?.trim() || null;
    if (updateFields.data_source !== undefined) updateData.dataSource = updateFields.data_source;
    if (updateFields.is_real_time !== undefined)
      updateData.isRealTime = Boolean(updateFields.is_real_time);
    if (updateFields.sort_order !== undefined)
      updateData.sortOrder = Number(updateFields.sort_order);
    if (updateFields.is_active !== undefined) updateData.isActive = Boolean(updateFields.is_active);

    const [updated] = await db.update(stats).set(updateData).where(eq(stats.id, id)).returning();

    if (!updated) {
      return ApiError.notFound('Stat');
    }

    // Map to snake_case for response
    const data = {
      id: updated.id,
      title: updated.title,
      value: updated.value,
      description: updated.description,
      icon: updated.icon,
      data_source: updated.dataSource,
      is_real_time: updated.isRealTime,
      sort_order: updated.sortOrder,
      is_active: updated.isActive,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    };

    return apiSuccess({ stat: data }, 'Stat updated successfully');
  } catch {
    return ApiError.internal();
  }
}

// DELETE - Admin auth + Input validation
async function deleteStatsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return ApiError.validation('Valid stat ID is required');
    }

    await db.delete(stats).where(eq(stats.id, id));

    return apiSuccess(null, 'Stat deleted successfully');
  } catch {
    return ApiError.internal();
  }
}

// Apply security middleware to all endpoints
export const GET = requireAdmin(getStatsHandler);
export const POST = validateAndSanitize(requireAdmin(postStatsHandler));
export const PUT = validateAndSanitize(requireAdmin(putStatsHandler));
export const DELETE = requireAdmin(deleteStatsHandler);
