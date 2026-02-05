import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase storage credentials not configured');
  }
  return createClient(url, key);
}

function verifyAdminToken(request: NextRequest): {
  valid: boolean;
  email?: string;
  reason?: string;
} {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, reason: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJWTSecret()) as Record<string, unknown>;

    if (!decoded.email || !decoded.isAdmin) {
      return { valid: false, reason: 'Invalid token payload' };
    }

    if (!ADMIN_EMAILS.includes(decoded.email as string)) {
      return { valid: false, reason: 'Unauthorized email address' };
    }

    if (decoded.exp && (decoded.exp as number) < Date.now() / 1000) {
      return { valid: false, reason: 'Token expired' };
    }

    return { valid: true, email: decoded.email as string };
  } catch (error) {
    return { valid: false, reason: `Token verification failed: ${error}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authCheck = verifyAdminToken(request);
    if (!authCheck.valid) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return ApiError.validation('URL is required');
    }

    // Verify URL is from Supabase storage
    if (!url.includes('supabase.co')) {
      return ApiError.validation('Invalid storage URL');
    }

    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      return ApiError.validation('Could not parse storage URL');
    }

    const pathParts = urlParts[1].split('/');
    const bucketName = pathParts[0];
    const filePath = pathParts.slice(1).join('/');

    if (!bucketName || !filePath) {
      return ApiError.validation('Could not extract file path from URL');
    }

    const storageClient = getStorageClient();

    const { error } = await storageClient.storage.from(bucketName).remove([filePath]);

    if (error) {
      return ApiError.externalService('Supabase Storage', error.message);
    }

    return apiSuccess(null, 'File deleted successfully');
  } catch {
    return ApiError.internal('Failed to delete file');
  }
}
