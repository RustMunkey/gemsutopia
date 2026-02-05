import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDevAdminSession, ADMIN_COOKIE_NAME } from '@gemsutopia/auth';

// DEV ONLY: Bypass authentication for development
// TODO: Remove this route before production deployment
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const token = await createDevAdminSession();

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: false, // Allow non-HTTPS in dev
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Dev bypass activated' });
  } catch {
    return NextResponse.json({ error: 'Failed to create dev session' }, { status: 500 });
  }
}
