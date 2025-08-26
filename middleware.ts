import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

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
  '/api/admin/quotes',
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
  
  // Only check admin routes
  if (isAdminRoute(pathname)) {
    // Always allow the admin login page itself
    if (pathname === '/admin') {
      return NextResponse.next();
    }
    
    // Always allow the login and verify API endpoints
    if (pathname === '/api/admin/login' || 
        pathname === '/api/admin/verify' || 
        pathname === '/api/admin/logout') {
      return NextResponse.next();
    }
    
    // In development/localhost, be more permissive but still check for valid token
    if (isDevelopment && isLocalhost) {
      // Check for admin token but allow if missing in dev (with warning)
      const token = request.cookies.get('admin-token')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
      
      if (token && verifyAdminToken(token)) {
        // Valid token, allow access
        return NextResponse.next();
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
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};