import { cookies } from 'next/headers';
import { validateAdminToken, type AdminSession } from '@gemsutopia/auth/admin';
import { ADMIN_COOKIE_NAME } from '@gemsutopia/auth';

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return validateAdminToken(token);
}

export async function requireAuth(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
