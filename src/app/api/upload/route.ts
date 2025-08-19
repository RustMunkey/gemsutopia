import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1,
  process.env.ADMIN_EMAIL_2, 
  process.env.ADMIN_EMAIL_3
].filter(Boolean);

// Admin Supabase client with service role key
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting storage (in production, use Redis)
const uploadAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_UPLOADS_PER_HOUR = 200;
const MAX_UPLOADS_PER_MINUTE = 20;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real.trim();
  }
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const key = ip;
  const attempts = uploadAttempts.get(key) || { count: 0, lastAttempt: 0 };
  
  // Clean up old entries (older than 1 hour)
  if (now - attempts.lastAttempt > 3600000) {
    attempts.count = 0;
  }
  
  // More lenient rate limiting - reset count if more than 1 minute has passed
  if (now - attempts.lastAttempt > 60000) {
    attempts.count = 0;
  }
  
  // Check per-minute rate limit
  if (attempts.count >= MAX_UPLOADS_PER_MINUTE) {
    return { allowed: false, reason: `Too many uploads per minute (${attempts.count}/${MAX_UPLOADS_PER_MINUTE})` };
  }
  
  // Check per-hour rate limit (but reset more frequently)
  if (attempts.count >= MAX_UPLOADS_PER_HOUR) {
    return { allowed: false, reason: `Too many uploads per hour (${attempts.count}/${MAX_UPLOADS_PER_HOUR})` };
  }
  
  // Update attempts
  attempts.count++;
  attempts.lastAttempt = now;
  uploadAttempts.set(key, attempts);
  
  return { allowed: true };
}

function verifyAdminToken(request: NextRequest): { valid: boolean; email?: string; reason?: string } {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, reason: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    
    // Verify token contains required fields
    if (!decoded.email || !decoded.isAdmin) {
      return { valid: false, reason: 'Invalid token payload' };
    }
    
    // Verify email is in admin list
    if (!ADMIN_EMAILS.includes(decoded.email as string)) {
      return { valid: false, reason: 'Unauthorized email address' };
    }
    
    // Check token expiration (extra security)
    if (decoded.exp && (decoded.exp as number) < Date.now() / 1000) {
      return { valid: false, reason: 'Token expired' };
    }
    
    return { valid: true, email: decoded.email as string };
  } catch (error) {
    return { valid: false, reason: `Token verification failed: ${error}` };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  
  // Security logs for monitoring
  console.log(`[SECURITY] Upload attempt from IP: ${clientIP} at ${new Date().toISOString()}`);
  
  try {
    // 1. Rate limiting check
    const rateLimitCheck = checkRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      console.log(`[SECURITY] Rate limit exceeded for IP: ${clientIP} - ${rateLimitCheck.reason}`);
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // 2. Verify admin token with detailed checks
    const authCheck = verifyAdminToken(request);
    if (!authCheck.valid) {
      console.log(`[SECURITY] Unauthorized upload attempt from IP: ${clientIP} - ${authCheck.reason}`);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[SECURITY] Authorized upload from admin: ${authCheck.email} (IP: ${clientIP})`);

    // 3. Extract and validate form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log(`[SECURITY] No file in upload request from ${authCheck.email}`);
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // 4. Strict file validation
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4'];
    const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    
    if (!allAllowedTypes.includes(file.type.toLowerCase())) {
      console.log(`[SECURITY] Invalid file type attempted: ${file.type} from ${authCheck.email}`);
      return NextResponse.json(
        { success: false, message: 'Only JPG, PNG, WebP, GIF images and MP4 videos are allowed' },
        { status: 400 }
      );
    }

    // 5. File size limits (strict - different for videos vs images)
    const isVideo = allowedVideoTypes.includes(file.type.toLowerCase());
    const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024; // 100MB for videos, 5MB for images
    
    if (file.size > maxSize) {
      console.log(`[SECURITY] File too large: ${file.size} bytes from ${authCheck.email}`);
      return NextResponse.json(
        { success: false, message: `File size must be less than ${isVideo ? '100MB' : '5MB'}` },
        { status: 400 }
      );
    }

    // 6. Generate secure filename (no user input for path)
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4'];
    
    if (!allowedExtensions.includes(fileExt)) {
      console.log(`[SECURITY] Suspicious file extension: ${fileExt} from ${authCheck.email}`);
      return NextResponse.json(
        { success: false, message: 'Invalid file extension' },
        { status: 400 }
      );
    }

    // 7. Additional file content validation
    const fileBuffer = new Uint8Array(await file.arrayBuffer());
    
    // Check for minimum file size (prevent empty files)
    if (fileBuffer.length < 100) {
      console.log(`[SECURITY] Suspiciously small file from ${authCheck.email}`);
      return NextResponse.json(
        { success: false, message: 'File appears to be corrupt or too small' },
        { status: 400 }
      );
    }

    // Determine bucket and folder based on file type
    const folder = formData.get('folder') as string || 'hero';
    // Use product-images bucket for both images and videos for now
    const bucketName = 'product-images';
    
    // Generate secure path with timestamp and random string
    const secureFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 12)}-${authCheck.email?.replace('@', '_at_')}.${file.name.split('.').pop()?.toLowerCase()}`;

    console.log(`[SECURITY] Uploading ${isVideo ? 'video' : 'image'}: ${secureFileName} (${fileBuffer.length} bytes = ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB) from ${authCheck.email}`);

    // Check if bucket exists first
    const { data: buckets } = await adminSupabase.storage.listBuckets();
    console.log(`[SECURITY] Available buckets:`, buckets?.map(b => b.name));

    // 8. Upload to Supabase Storage with security headers
    // For large files, try using a different upload method
    const uploadOptions = {
      contentType: file.type,
      upsert: false, // Prevent overwriting
      cacheControl: isVideo ? '86400' : '3600', // Cache videos for 24 hours, images for 1 hour
      ...(isVideo && file.size > 25 * 1024 * 1024 ? { duplex: 'half' } : {}) // Try different upload mode for large videos
    };
    
    const { data, error } = await adminSupabase.storage
      .from(bucketName)
      .upload(secureFileName, fileBuffer, uploadOptions);

    if (error) {
      console.error(`[SECURITY] Supabase storage error for ${authCheck.email}:`, {
        error: error,
        message: error.message,
        details: error,
        fileName: secureFileName,
        fileSize: fileBuffer.length,
        isVideo: isVideo
      });
      
      // If it's a size error, be more specific
      if (error.message?.includes('size') || error.message?.includes('exceeded')) {
        return NextResponse.json(
          { success: false, message: `Video file too large for storage (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB). Try compressing to under 50MB or use a video hosting service.` },
          { status: 413 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: `Failed to upload file to storage: ${error.message || JSON.stringify(error)}` },
        { status: 500 }
      );
    }

    // 9. Get public URL
    const { data: urlData } = adminSupabase.storage
      .from(bucketName)
      .getPublicUrl(secureFileName);

    const uploadTime = Date.now() - startTime;
    console.log(`[SECURITY] Successful upload by ${authCheck.email} in ${uploadTime}ms: ${urlData.publicUrl}`);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: urlData.publicUrl,
      path: data.path,
      uploadTime
    });

  } catch (error) {
    const uploadTime = Date.now() - startTime;
    console.error(`[SECURITY] Upload error after ${uploadTime}ms from ${clientIP}:`, error);
    
    return NextResponse.json(
      { success: false, message: 'Upload failed due to server error' },
      { status: 500 }
    );
  }
}

// Disable all other HTTP methods
export async function GET() {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
}