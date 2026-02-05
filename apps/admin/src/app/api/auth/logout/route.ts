import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateAdminToken, invalidateAdminSession } from '@gemsutopia/auth/admin';
import { ADMIN_COOKIE_NAME } from '@gemsutopia/auth';

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (token) {
      const session = await validateAdminToken(token);
      if (session) {
        await invalidateAdminSession(session.id, session.email);
      }
    }

    // Clear cookie
    cookieStore.delete(ADMIN_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);

  return NextResponse.redirect(`${ADMIN_URL}/login`);
}
