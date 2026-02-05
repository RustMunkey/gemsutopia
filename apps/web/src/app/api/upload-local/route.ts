import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Security function to verify admin token
function verifyAdminToken(request: NextRequest): {
  valid: boolean;
  email?: string;
  reason?: string;
} {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false, reason: 'No authorization header' };
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return { valid: false, reason: 'Server configuration error' };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;

    if (!decoded.isAdmin) {
      return { valid: false, reason: 'Not admin user' };
    }

    return { valid: true, email: decoded.email as string };
  } catch {
    return { valid: false, reason: 'Invalid token' };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = verifyAdminToken(request);
    if (!auth.valid) {
      return ApiError.unauthorized(`Admin authentication required: ${auth.reason}`);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return ApiError.validation('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return ApiError.validation('Only image files (JPG, PNG, WebP, GIF) are allowed');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return ApiError.validation('File size must be less than 5MB');
    }

    // Create secure filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 12);
    const secureFileName = `${timestamp}-${randomString}.${fileExtension}`;

    // Create upload directory path
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
    const filePath = join(uploadDir, secureFileName);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    // Return public URL
    const publicUrl = `/uploads/${folder}/${secureFileName}`;

    return apiSuccess(
      { url: publicUrl, filename: secureFileName, size: file.size },
      'File uploaded successfully'
    );
  } catch (error) {
    return ApiError.internal(
      error instanceof Error ? error.message : 'Upload failed'
    );
  }
}
