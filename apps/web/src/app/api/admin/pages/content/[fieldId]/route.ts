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

export async function PUT(request: NextRequest, context: { params: Promise<{ fieldId: string }> }) {
  const params = await context.params;
  const auth = await verifyAuth(request);
  if (!auth) {
    return ApiError.unauthorized();
  }

  try {
    const { value } = await request.json();

    const [updated] = await db
      .update(siteContent)
      .set({
        value,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(siteContent.id, params.fieldId))
      .returning();

    if (!updated) {
      return ApiError.notFound('Page content');
    }

    // Map to snake_case for response
    const mappedContent = {
      id: updated.id,
      section: updated.section,
      key: updated.key,
      value: updated.value,
      content_type: updated.contentType,
      metadata: updated.metadata,
      is_active: updated.isActive,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    };

    return apiSuccess({ content: mappedContent }, 'Page content updated successfully');
  } catch {
    return ApiError.internal();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ fieldId: string }> }
) {
  const params = await context.params;
  const auth = await verifyAuth(request);
  if (!auth) {
    return ApiError.unauthorized();
  }

  try {
    await db.delete(siteContent).where(eq(siteContent.id, params.fieldId));

    return apiSuccess(null, 'Page content deleted successfully');
  } catch {
    return ApiError.internal();
  }
}
