import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET!;
const API_SECRET = process.env.API_SECRET_KEY!;

// Store for API rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number; banned?: boolean }>();

export interface AuthContext {
  isAuthenticated: boolean;
  isAdmin?: boolean;
  userId?: string;
  email?: string;
}

// Generate secure API key for internal use
export function generateAPIKey(): string {
  return createHash('sha256').update(randomBytes(32)).digest('hex');
}

// Verify JWT token
export function verifyJWTToken(token: string): AuthContext {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      isAuthenticated: true,
      isAdmin: decoded.isAdmin || false,
      userId: decoded.userId || decoded.sub,
      email: decoded.email
    };
  } catch (error) {
    return { isAuthenticated: false };
  }
}

// Verify API key for server-to-server communication
export function verifyAPIKey(apiKey: string): boolean {
  return apiKey === API_SECRET;
}

// Rate limiting with progressive penalties
export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): { allowed: boolean; remainingAttempts: number; bannedUntil?: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const existing = rateLimitStore.get(identifier);
  
  // Clean up expired entries
  if (existing && existing.resetTime < windowStart && !existing.banned) {
    rateLimitStore.delete(identifier);
  }
  
  if (!existing || (existing.resetTime < windowStart && !existing.banned)) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingAttempts: maxRequests - 1 };
  }
  
  // Check if currently banned
  if (existing.banned && existing.resetTime > now) {
    return { 
      allowed: false, 
      remainingAttempts: 0,
      bannedUntil: existing.resetTime 
    };
  } else if (existing.banned && existing.resetTime <= now) {
    // Ban expired, reset
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingAttempts: maxRequests - 1 };
  }
  
  if (existing.count >= maxRequests) {
    // Implement progressive banning
    const banDuration = Math.min(existing.count * 60000, 3600000); // Max 1 hour ban
    existing.banned = true;
    existing.resetTime = now + banDuration;
    existing.count = existing.count + 1;
    
    return { 
      allowed: false, 
      remainingAttempts: 0,
      bannedUntil: existing.resetTime 
    };
  }
  
  existing.count++;
  return { 
    allowed: true, 
    remainingAttempts: maxRequests - existing.count 
  };
}

// Extract auth from request
export function extractAuth(request: NextRequest): AuthContext {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const auth = verifyJWTToken(token);
    if (auth.isAuthenticated) return auth;
  }
  
  // Try API key header
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && verifyAPIKey(apiKey)) {
    return { 
      isAuthenticated: true, 
      isAdmin: true, 
      email: 'system' 
    };
  }
  
  // Try cookie as fallback
  const cookieToken = request.cookies.get('admin-token')?.value;
  if (cookieToken) {
    const auth = verifyJWTToken(cookieToken);
    if (auth.isAuthenticated) return auth;
  }
  
  return { isAuthenticated: false };
}

// Middleware to require authentication
export function requireAuth(handler: (request: NextRequest, auth: AuthContext) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Rate limiting
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      const banTimeRemaining = rateLimit.bannedUntil ? 
        Math.ceil((rateLimit.bannedUntil - Date.now()) / 1000 / 60) : 0;
      
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${banTimeRemaining} minutes.`,
          bannedUntil: rateLimit.bannedUntil 
        },
        { status: 429 }
      );
    }
    
    const auth = extractAuth(request);
    
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(request, auth);
  };
}

// Middleware to require admin privileges
export function requireAdmin(handler: (request: NextRequest, auth: AuthContext) => Promise<NextResponse>) {
  return requireAuth(async (request: NextRequest, auth: AuthContext) => {
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    return handler(request, auth);
  });
}

// Public endpoints that don't require auth (whitelist approach)
export const PUBLIC_ENDPOINTS = [
  '/api/products',
  '/api/products/[id]',
  '/api/categories',
  '/api/site-info',
  '/api/seo-metadata',
  '/api/site-content-public',
  '/api/reviews', // Only GET allowed for public
  '/api/contact',
  '/api/faq',
  '/api/quotes',
  '/api/gem-facts',
  '/api/featured-products',
  '/api/crypto-prices',
  '/api/address-suggestions',
  '/api/address-validation',
  '/api/discount-codes/validate',
  '/api/tax-calculation',
  '/api/payments/stripe/webhook', // Webhook needs to be public but has its own validation
  '/api/payments/paypal/create-order',
  '/api/payments/paypal/capture-order',
  '/api/payments/stripe/create-payment-intent'
];

// Check if endpoint is public
export function isPublicEndpoint(pathname: string, method: string = 'GET'): boolean {
  // Special cases
  if (pathname === '/api/orders' && method === 'POST') {
    return true; // Allow order creation
  }
  
  if (pathname === '/api/reviews' && method !== 'GET') {
    return false; // Only GET is public for reviews
  }
  
  return PUBLIC_ENDPOINTS.some(endpoint => {
    if (endpoint.includes('[id]')) {
      const pattern = endpoint.replace('[id]', '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return endpoint === pathname;
  });
}