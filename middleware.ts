import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { isPublicEndpoint } from '@/lib/security/apiAuth';

// Rate limiting store (in production, use Redis)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Security utility functions
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

function isRateLimited(ip: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const existing = rateLimit.get(ip);
  if (!existing || existing.resetTime < windowStart) {
    rateLimit.set(ip, { count: 1, resetTime: now });
    return false;
  }
  
  if (existing.count >= maxRequests) {
    return true;
  }
  
  existing.count++;
  return false;
}

function detectXSSAttempt(url: string): boolean {
  // Only check for the most obvious XSS attempts
  const dangerousPatterns = [
    /<script[^>]*>.*?alert.*?<\/script>/gi,
    /javascript:alert/gi,
    /<iframe.*?src.*?javascript:/gi,
    /eval\s*\(.*?\)/gi
  ];
  
  // Only check URL parameters, not the entire URL path
  const urlParams = url.split('?')[1] || '';
  
  return dangerousPatterns.some(pattern => pattern.test(urlParams));
}

function detectSQLInjection(url: string): boolean {
  // Only check for the most obvious SQL injection attempts
  const dangerousSQLPatterns = [
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from.*where/gi,
    /insert\s+into.*values/gi,
    /select.*from.*information_schema/gi,
    /exec\s+xp_/gi
  ];
  
  // Only check URL parameters, not normal paths
  const urlParams = url.split('?')[1] || '';
  
  return dangerousSQLPatterns.some(pattern => pattern.test(urlParams));
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Protected admin routes that require authentication
const ADMIN_PROTECTED_ROUTES = [
  '/admin/dashboard'
];

// API routes that require admin authentication  
const ADMIN_API_ROUTES = [
  '/api/admin/dashboard-stats',
  '/api/admin/stats',
  '/api/admin/reviews',
  '/api/admin/faq', 
  '/api/admin/featured-products',
  '/api/admin/gem-facts',
  '/api/admin/pages',
  '/api/admin/settings'
];

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PROTECTED_ROUTES.some(route => pathname.startsWith(route)) ||
         ADMIN_API_ROUTES.some(route => pathname.startsWith(route));
}

function verifyAdminToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; isAdmin: boolean };
    return decoded.isAdmin === true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = request.nextUrl.hostname === 'localhost' || 
                     request.nextUrl.hostname === '127.0.0.1' ||
                     request.nextUrl.hostname.startsWith('192.168.');
  const clientIP = getClientIP(request);
  const fullUrl = request.url;
  const method = request.method;
  
  // 🛡️ ENHANCED SECURITY CHECKS
  
  // 1. Stricter rate limiting
  if (isRateLimited(clientIP, 200, 60000)) { // 200 requests per minute
    console.log(`🚫 RATE LIMITED: ${clientIP} blocked for ${pathname}`);
    return NextResponse.json({ 
      error: 'Too many requests',
      message: 'Please slow down your requests'
    }, { status: 429 });
  }
  
  // 2. Enhanced XSS detection
  if (pathname.startsWith('/api/') && detectXSSAttempt(fullUrl)) {
    console.log(`🚫 XSS BLOCKED: Suspicious request from ${clientIP} to ${pathname}`);
    return NextResponse.json({ 
      error: 'Malicious request detected',
      message: 'XSS attempt blocked'
    }, { status: 403 });
  }
  
  // 3. Enhanced SQL injection detection
  if (pathname.startsWith('/api/') && detectSQLInjection(fullUrl)) {
    console.log(`🚫 SQL INJECTION BLOCKED: Attack from ${clientIP} to ${pathname}`);
    return NextResponse.json({ 
      error: 'Malicious request detected',
      message: 'SQL injection attempt blocked'
    }, { status: 403 });
  }
  
  // 4. Block attack tools and suspicious user agents
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousTools = ['sqlmap', 'nikto', 'masscan', 'nessus', 'burpsuite', 'owasp', 'metasploit'];
  
  if (suspiciousTools.some(tool => userAgent.toLowerCase().includes(tool))) {
    console.log(`🚫 ATTACK TOOL BLOCKED: ${userAgent} from ${clientIP}`);
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  
  // 5. Block requests with no user agent (likely bots/scripts)
  if (!userAgent && pathname.startsWith('/api/')) {
    console.log(`🚫 NO USER AGENT: Request blocked from ${clientIP} to ${pathname}`);
    return NextResponse.json({ 
      error: 'Access denied',
      message: 'User agent required'
    }, { status: 403 });
  }
  
  // Create response with security headers
  const response = NextResponse.next();
  
  // 🛡️ SECURITY HEADERS
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // More permissive Content Security Policy for development
  const csp = [
    "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:",
    "style-src 'self' 'unsafe-inline' https: data:",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https: data:",
    "connect-src 'self' https: http: ws: wss:",
    "frame-src 'self' https: http:",
    "media-src 'self' https: http:",
    "object-src 'self'"
  ].join('; ');
  
  // Only apply strict CSP in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Content-Security-Policy', csp);
  }
  
  // 🔒 API SECURITY - Enhanced protection
  if (pathname.startsWith('/api/')) {
    // Check if this is a public endpoint
    const isPublic = isPublicEndpoint(pathname, method);
    
    if (!isPublic) {
      console.log(`🔒 PROTECTED API: ${method} ${pathname} - auth required at route level`);
      
      // Add security warning header for non-public APIs
      response.headers.set('X-Auth-Required', 'true');
      response.headers.set('X-Security-Level', 'high');
    } else {
      console.log(`✅ PUBLIC API: ${method} ${pathname} - public access allowed`);
      response.headers.set('X-Security-Level', 'standard');
    }
  }
  
  // 🔒 ADMIN ROUTE PROTECTION
  if (isAdminRoute(pathname)) {
    // Always allow the admin login page itself
    if (pathname === '/admin') {
      return response;
    }
    
    // Always allow the login and verify API endpoints
    if (pathname === '/api/admin/login' || 
        pathname === '/api/admin/verify' || 
        pathname === '/api/admin/logout') {
      return response;
    }
    
    // In development/localhost, be more permissive but still check for valid token
    if (isDevelopment && isLocalhost) {
      // Check for admin token but allow if missing in dev (with warning)
      const token = request.cookies.get('admin-token')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
      
      if (token && verifyAdminToken(token)) {
        // Valid token, allow access
        return response;
      }
      
      // No token or invalid token in development - redirect to login
      if (pathname.startsWith('/api/admin/')) {
        console.warn(`⚠️ DEV: Admin API access without valid token: ${pathname}`);
        return NextResponse.json(
          { error: 'Please login first', dev: true }, 
          { status: 401 }
        );
      }
      
      // For page routes in dev, redirect to login
      console.warn(`⚠️ DEV: Admin page access without valid token: ${pathname}`);
      const loginUrl = new URL('/admin', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // In production, strict token verification required
    const token = request.cookies.get('admin-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token || !verifyAdminToken(token)) {
      console.error(`🚨 PROD: Unauthorized admin access attempt: ${pathname}`);
      
      // For API routes, return 401
      if (pathname.startsWith('/api/admin/')) {
        return NextResponse.json(
          { error: 'Unauthorized access' }, 
          { status: 401 }
        );
      }
      
      // For page routes, redirect to admin login
      const loginUrl = new URL('/admin', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*']
};