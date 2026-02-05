import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimitAsync,
  recordFailedAttempt,
  recordSuccessfulLogin,
} from '../../../../lib/security/rateLimiter';
import jwt from 'jsonwebtoken';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Get authorized credentials from environment variables
const AUTHORIZED_USERS = [
  {
    email: process.env.ADMIN_EMAIL_1,
    passcode: process.env.ADMIN_PASSCODE_1,
  },
  {
    email: process.env.ADMIN_EMAIL_2,
    passcode: process.env.ADMIN_PASSCODE_2,
  },
  {
    email: process.env.ADMIN_EMAIL_3,
    passcode: process.env.ADMIN_PASSCODE_3,
  },
].filter(user => user.email && user.passcode);

// User name mapping
function getUserName(email: string): string {
  switch (email) {
    case 'gemsutopia@gmail.com':
    case 'reeseroberge10@gmail.com':
      return 'Reese';
    case 'wilson.asher00@gmail.com':
      return 'Asher';
    default:
      return 'Admin';
  }
}

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    // 🛡️ Rate Limiting Check (uses Redis if configured, otherwise in-memory)
    const rateLimitCheck = await checkRateLimitAsync(ip);
    if (!rateLimitCheck.allowed) {
      const banTimeRemaining = rateLimitCheck.bannedUntil
        ? Math.ceil((rateLimitCheck.bannedUntil - Date.now()) / 1000 / 60)
        : 0;

      return ApiError.rateLimited(`Too many failed attempts. Try again in ${banTimeRemaining} minutes.`, {
        bannedUntil: rateLimitCheck.bannedUntil,
      });
    }

    const { email, passcode, step = 'initial' } = await request.json();

    if (step === 'initial') {
      // Credential Check
      const user = AUTHORIZED_USERS.find(u => u.email === email && u.passcode === passcode);

      if (!user) {
        recordFailedAttempt(ip);

        return ApiError.unauthorized('Invalid credentials');
      }

      // 🛡️ SECURITY LAYER 5: Suspicious Login Detection
      // const suspicious = detectSuspiciousLogin(email, ip, userAgent);
      // if (suspicious) {
      //   // await sendLoginNotification(request, email, false, 'Suspicious login attempt detected');
      //   // recordFailedAttempt(ip);
      //   return NextResponse.json(
      //     { message: 'Security check failed' },
      //     { status: 403 }
      //   );
      // }

      // ✅ LOGIN SUCCESSFUL - Clear rate limit record
      recordSuccessfulLogin(ip);

      // Create JWT token for the session
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        return ApiError.internal('Server configuration error');
      }
      const userName = getUserName(email);
      const token = jwt.sign(
        {
          email,
          name: userName,
          isAdmin: true,
          loginTime: Date.now(),
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json(
        {
          success: true,
          data: { token },
          message: 'Login successful',
        },
        { status: 200 }
      );

      // Set secure httpOnly cookie as backup protection
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      return response;
    }

    // Handle 2FA code verification step
    if (step === 'verify_code') {
      // This would be handled by a separate endpoint
      return ApiError.badRequest('Use the verify-code endpoint');
    }

    return ApiError.badRequest('Invalid request');
  } catch {
    return ApiError.internal();
  }
}
