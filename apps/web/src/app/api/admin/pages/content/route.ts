import { NextRequest } from 'next/server';
import { db, siteContent } from '@/lib/db';
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

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJWTSecret()) as Record<string, unknown>;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return ApiError.unauthorized();
  }

  try {
    const { section, key, value } = await request.json();

    if (!section || !key) {
      return ApiError.validation('Section and key are required');
    }

    const [newContent] = await db
      .insert(siteContent)
      .values({
        section,
        key,
        contentType: 'text',
        value: value || '',
      })
      .returning();

    if (!newContent) {
      return ApiError.database('Failed to create page content');
    }

    // Map to snake_case for response
    const mappedContent = {
      id: newContent.id,
      section: newContent.section,
      key: newContent.key,
      value: newContent.value,
      content_type: newContent.contentType,
      metadata: newContent.metadata,
      is_active: newContent.isActive,
      created_at: newContent.createdAt,
      updated_at: newContent.updatedAt,
    };

    return apiSuccess({ content: mappedContent }, 'Page content created successfully', 201);
  } catch {
    return ApiError.internal();
  }
}
