import { NextRequest } from 'next/server';
import { db, siteContent } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: Promise<{ pageId: string }> }) {
  const params = await context.params;
  try {
    const pageContent = await db.query.siteContent.findMany({
      where: eq(siteContent.section, params.pageId),
      orderBy: [asc(siteContent.createdAt)],
    });

    // Convert array to key-value object for easier use in components
    const contentMap = pageContent.reduce((acc: Record<string, string>, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return apiSuccess({ content: contentMap });
  } catch {
    return ApiError.internal('Failed to fetch page content');
  }
}
