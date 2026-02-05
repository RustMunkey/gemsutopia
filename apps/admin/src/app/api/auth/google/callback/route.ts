import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createAdminSession,
  isAllowedAdmin,
  type AdminUser,
} from '@gemsutopia/auth/admin';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_OPTIONS } from '@gemsutopia/auth';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${ADMIN_URL}/login?error=auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${ADMIN_URL}/login?error=auth_failed`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${ADMIN_URL}/login?error=auth_failed`);
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('User info fetch failed:', await userInfoResponse.text());
      return NextResponse.redirect(`${ADMIN_URL}/login?error=auth_failed`);
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    // Check if user is allowed
    if (!isAllowedAdmin(googleUser.email)) {
      console.warn('Unauthorized admin login attempt:', googleUser.email);
      return NextResponse.redirect(`${ADMIN_URL}/login?error=unauthorized`);
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create admin session
    const adminUser: AdminUser = {
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      googleId: googleUser.id,
    };

    const { token } = await createAdminSession(adminUser, ipAddress, userAgent);

    // Set cookie and redirect to dashboard
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, ADMIN_COOKIE_OPTIONS);

    return NextResponse.redirect(`${ADMIN_URL}/dashboard`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${ADMIN_URL}/login?error=auth_failed`);
  }
}
