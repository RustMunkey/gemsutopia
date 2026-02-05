import { NextRequest } from 'next/server';
import { db, siteContent } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
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

export async function GET(request: NextRequest, context: { params: Promise<{ pageId: string }> }) {
  const params = await context.params;
  const auth = await verifyAuth(request);
  if (!auth) {
    return ApiError.unauthorized();
  }

  try {
    const pageContent = await db.query.siteContent.findMany({
      where: eq(siteContent.section, params.pageId),
      orderBy: [asc(siteContent.createdAt)],
    });

    // Map to snake_case for API response compatibility
    const mappedContent = pageContent.map(item => ({
      id: item.id,
      section: item.section,
      key: item.key,
      value: item.value,
      content_type: item.contentType,
      metadata: item.metadata,
      is_active: item.isActive,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));

    return apiSuccess({ content: mappedContent });
  } catch {
    return ApiError.internal();
  }
}
