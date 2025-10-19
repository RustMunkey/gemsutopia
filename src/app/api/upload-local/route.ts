import { NextRequest, NextResponse } from 'next/server';

import { writeFile, mkdir } from 'fs/promises';

import { join } from 'path';

import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';



// Security function to verify admin token
function verifyAdminToken(request: NextRequest): { valid: boolean; email?: string; reason?: string } {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false, reason: 'No authorization header' };
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return { valid: false, reason: 'Server configuration error' };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    
    if (!decoded.isAdmin) {
      return { valid: false, reason: 'Not admin user' };
    }

    return { valid: true, email: decoded.email as string };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { valid: false, reason: 'Invalid token' };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = verifyAdminToken(request);
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, message: `Unauthorized: ${auth.reason}` },
        { status: 401 }
      );
    }

    console.log(`Upload request from admin: ${auth.email}`);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Only image files (JPG, PNG, WebP, GIF) are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    console.log(`Processing upload: ${file.name} (${file.size} bytes)`);

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
    
    console.log(`Upload successful: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: publicUrl,
      filename: secureFileName,
      size: file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}