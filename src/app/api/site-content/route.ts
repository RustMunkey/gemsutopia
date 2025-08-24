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

// Rate limiting
const requestAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_REQUESTS_PER_MINUTE = 60;

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         'unknown';
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
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    
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
  console.log(`[SECURITY] Site content GET request from IP: ${clientIP}`);

  try {
    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      console.log(`[SECURITY] Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Admin verification for sensitive operations
    const authCheck = verifyAdminToken(request);
    if (!authCheck.valid) {
      console.log(`[SECURITY] Unauthorized site content access from IP: ${clientIP}`);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    // Validate section parameter
    const allowedSections = ['hero', 'featured', 'about', 'contact', 'marquee'];
    if (section && !allowedSections.includes(section)) {
      console.log(`[SECURITY] Invalid section requested: ${section} by ${authCheck.email}`);
      return NextResponse.json(
        { success: false, message: 'Invalid section' },
        { status: 400 }
      );
    }

    let query = adminSupabase.from('site_content').select('*');

    if (section) {
      query = query.eq('section', section);
    }

    const { data: content, error } = await query.order('section').order('key');

    if (error) {
      console.error(`[SECURITY] Supabase error for ${authCheck.email}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch content' },
        { status: 500 }
      );
    }

    console.log(`[SECURITY] Successful content fetch by ${authCheck.email}`);
    return NextResponse.json({
      success: true,
      content: content || []
    });

  } catch (error) {
    console.error(`[SECURITY] Site content GET error from ${clientIP}:`, error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    if (!data.section || !data.key || !data.content_type || !data.value) {
      return NextResponse.json(
        { success: false, message: 'Section, key, content_type, and value are required' },
        { status: 400 }
      );
    }

    const contentData = {
      section: data.section,
      key: data.key,
      content_type: data.content_type,
      value: data.value,
      metadata: data.metadata || {},
      is_active: data.is_active !== false
    };

    const { data: newContent, error } = await adminSupabase
      .from('site_content')
      .insert([contentData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Content created successfully',
      content: newContent
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create content' },
      { status: 500 }
    );
  }
}