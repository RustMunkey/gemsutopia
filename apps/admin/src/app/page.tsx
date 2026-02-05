import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validateAdminToken } from '@gemsutopia/auth/admin';
import { ADMIN_COOKIE_NAME } from '@gemsutopia/auth';

export default async function HomePage() {
  // Check if user is authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (token) {
    const session = await validateAdminToken(token);
    if (session) {
      redirect('/dashboard');
    }
  }

  redirect('/login');
}
