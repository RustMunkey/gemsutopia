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

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1,
  process.env.ADMIN_EMAIL_2,
  process.env.ADMIN_EMAIL_3,
].filter(Boolean);

// Rate limiting
const requestAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_REQUESTS_PER_MINUTE = 60;

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = requestAttempts.get(ip) || { count: 0, lastAttempt: 0 };

  if (now - attempts.lastAttempt > 60000) {
    attempts.count = 0;
  }

  if (attempts.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  attempts.count++;
  attempts.lastAttempt = now;
  requestAttempts.set(ip, attempts);
  return true;
}

function verifyAdminToken(request: NextRequest): { valid: boolean; email?: string } {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJWTSecret()) as Record<string, unknown>;

    if (!decoded.email || !decoded.isAdmin || !ADMIN_EMAILS.includes(decoded.email as string)) {
      return { valid: false };
    }

    return { valid: true, email: decoded.email as string };
  } catch {
    return { valid: false };
  }
}

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      return ApiError.rateLimited('Too many requests');
    }

    // Admin verification for sensitive operations
    const authCheck = verifyAdminToken(request);
    if (!authCheck.valid) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    // Validate section parameter
    const allowedSections = ['hero', 'featured', 'about', 'contact', 'marquee'];
    if (section && !allowedSections.includes(section)) {
      return ApiError.validation('Invalid section');
    }

    let content;
    if (section) {
      content = await db.query.siteContent.findMany({
        where: eq(siteContent.section, section),
        orderBy: [asc(siteContent.section), asc(siteContent.key)],
      });
    } else {
      content = await db.query.siteContent.findMany({
        orderBy: [asc(siteContent.section), asc(siteContent.key)],
      });
    }

    // Map to snake_case for API response compatibility
    const mappedContent = content.map(item => ({
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
    return ApiError.internal('Failed to fetch content');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = verifyAdminToken(request);
    if (!authCheck.valid) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const data = await request.json();

    if (!data.section || !data.key || !data.content_type || !data.value) {
      return ApiError.validation('Section, key, content_type, and value are required');
    }

    const [newContent] = await db
      .insert(siteContent)
      .values({
        section: data.section,
        key: data.key,
        contentType: data.content_type,
        value: data.value,
        metadata: data.metadata || {},
        isActive: data.is_active !== false,
      })
      .returning();

    if (!newContent) {
      return ApiError.database('Failed to create content');
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

    return apiSuccess({ content: mappedContent }, 'Content created successfully', 201);
  } catch {
    return ApiError.internal('Failed to create content');
  }
}
