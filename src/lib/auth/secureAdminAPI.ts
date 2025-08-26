// 🛡️ Quick security wrapper for admin APIs
// This ensures all admin APIs have consistent security

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, rateLimit, validateAndSanitize } from './adminAuth';

export function createSecureAdminAPI(handlers: {
  GET?: (request: NextRequest) => Promise<NextResponse>;
  POST?: (request: NextRequest) => Promise<NextResponse>;
  PUT?: (request: NextRequest) => Promise<NextResponse>;
  DELETE?: (request: NextRequest) => Promise<NextResponse>;
}) {
  const secureHandlers: any = {};

  if (handlers.GET) {
    secureHandlers.GET = rateLimit(100, 15 * 60 * 1000)(requireAdmin(handlers.GET));
  }

  if (handlers.POST) {
    secureHandlers.POST = rateLimit(20, 15 * 60 * 1000)(
      validateAndSanitize(requireAdmin(handlers.POST))
    );
  }

  if (handlers.PUT) {
    secureHandlers.PUT = rateLimit(30, 15 * 60 * 1000)(
      validateAndSanitize(requireAdmin(handlers.PUT))
    );
  }

  if (handlers.DELETE) {
    secureHandlers.DELETE = rateLimit(10, 15 * 60 * 1000)(requireAdmin(handlers.DELETE));
  }

  return secureHandlers;
}

// Standard error response format
export function createErrorResponse(
  message: string, 
  code: string = 'ERROR', 
  status: number = 500
): NextResponse {
  return NextResponse.json({
    error: message,
    code,
    timestamp: new Date().toISOString()
  }, { status });
}

// Standard success response format
export function createSuccessResponse(
  data: any = null, 
  message: string = 'Success'
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
}