import { NextRequest } from 'next/server';
import { db, siteContent } from '@/lib/db';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const content = await db.query.siteContent.findFirst({
      where: eq(siteContent.id, resolvedParams.id),
    });

    if (!content) {
      return ApiError.notFound('Content');
    }

    // Map to snake_case for API response
    const mappedContent = {
      id: content.id,
      section: content.section,
      key: content.key,
      value: content.value,
      content_type: content.contentType,
      metadata: content.metadata,
      is_active: content.isActive,
      created_at: content.createdAt,
      updated_at: content.updatedAt,
    };

    return apiSuccess({ content: mappedContent });
  } catch {
    return ApiError.internal('Failed to fetch content');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    if (!verifyAdminToken(request)) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const data = await request.json();

    const updateData: Partial<typeof siteContent.$inferInsert> = {};

    if (data.value !== undefined) updateData.value = data.value;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.is_active !== undefined) updateData.isActive = data.is_active;

    const [updatedContent] = await db
      .update(siteContent)
      .set(updateData)
      .where(eq(siteContent.id, resolvedParams.id))
      .returning();

    if (!updatedContent) {
      return ApiError.database('Failed to update content');
    }

    // Map to snake_case for response
    const mappedContent = {
      id: updatedContent.id,
      section: updatedContent.section,
      key: updatedContent.key,
      value: updatedContent.value,
      content_type: updatedContent.contentType,
      metadata: updatedContent.metadata,
      is_active: updatedContent.isActive,
      created_at: updatedContent.createdAt,
      updated_at: updatedContent.updatedAt,
    };

    return apiSuccess({ content: mappedContent }, 'Content updated successfully');
  } catch {
    return ApiError.internal('Failed to update content');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    if (!verifyAdminToken(request)) {
      return ApiError.unauthorized('Admin authentication required');
    }

    await db.delete(siteContent).where(eq(siteContent.id, resolvedParams.id));

    return apiSuccess(null, 'Content deleted successfully');
  } catch {
    return ApiError.internal('Failed to delete content');
  }
}
