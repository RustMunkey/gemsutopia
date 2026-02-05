import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validateAdminToken, type AdminSession } from '@gemsutopia/auth/admin';
import { ADMIN_COOKIE_NAME } from '@gemsutopia/auth';
import { DashboardShell } from '@/components/DashboardShell';

async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return validateAdminToken(token);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login?error=session_expired');
  }

  return <DashboardShell session={session}>{children}</DashboardShell>;
}
