import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export interface AdminUser {
  email: string;
  name: string;
  isAdmin: boolean;
  loginTime: number;
}

export function verifyAdminToken(request: NextRequest): AdminUser | null {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('admin-token')?.value;
    
    let token: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }
    
    if (!token) {
      return null;
    }
    
    // Verify and decode JWT
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    
    // Check if token is not expired (extra security)
    const tokenAge = Date.now() - decoded.loginTime;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (tokenAge > maxAge) {
      return null;
    }
    
    // Verify admin role
    if (!decoded.isAdmin) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function requireAdmin(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const user = verifyAdminToken(request);
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized: Admin access required',
          code: 'ADMIN_AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="Admin Area"'
          }
        }
      );
    }
    
    // Add user info to request for logging
    console.log(`🔐 Admin API access: ${user.email} → ${request.nextUrl.pathname}`);
    
    // Call the original handler with verified user
    return handler(request, user, ...args);
  };
}

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (handler: Function) => {
    return async (request: NextRequest, ...args: any[]) => {
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      
      const key = `${clientIP}-${request.nextUrl.pathname}`;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old entries
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < windowStart) {
          rateLimitStore.delete(k);
        }
      }
      
      // Get current limit data
      const limitData = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
      
      // Check if within rate limit
      if (limitData.count >= maxRequests && limitData.resetTime > now) {
        const retryAfter = Math.ceil((limitData.resetTime - now) / 1000);
        
        console.warn(`🚨 Rate limit exceeded: ${clientIP} → ${request.nextUrl.pathname}`);
        
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: retryAfter,
            maxRequests,
            windowMs
          },
          { 
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': limitData.resetTime.toString()
            }
          }
        );
      }
      
      // Update counter
      limitData.count++;
      rateLimitStore.set(key, limitData);
      
      // Call original handler
      const response = await handler(request, ...args);
      
      // Add rate limit headers to response
      if (response instanceof NextResponse) {
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - limitData.count).toString());
        response.headers.set('X-RateLimit-Reset', limitData.resetTime.toString());
      }
      
      return response;
    };
  };
}

// Input sanitization
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 10000); // Limit length
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

export function validateAndSanitize(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // Only sanitize POST/PUT requests with JSON body
      if (request.method === 'POST' || request.method === 'PUT') {
        const body = await request.json().catch(() => null);
        if (body) {
          const sanitizedBody = sanitizeInput(body);
          // Create new request with sanitized body
          const sanitizedRequest = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(sanitizedBody)
          });
          return handler(sanitizedRequest, ...args);
        }
      }
      
      return handler(request, ...args);
    } catch (error) {
      console.error('Input validation error:', error);
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }
  };
}