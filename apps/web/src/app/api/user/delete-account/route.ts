import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { log } from '@/lib/logger';

// POST - Delete user account (soft delete)
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required');
    }

    const body = await request.json();
    const { confirmation } = body;

    if (confirmation !== 'DELETE') {
      return ApiError.validation('Please type DELETE to confirm account deletion');
    }

    const userId = session.user.id;

    // Soft delete: anonymize the user's data
    await db
      .update(users)
      .set({
        email: `deleted_${userId}@deleted.local`,
        name: 'Deleted User',
        firstName: null,
        lastName: null,
        phone: null,
        avatarUrl: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        province: null,
        postalCode: null,
        emailVerified: false,
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    log.audit('delete', 'user', userId, { action: 'account_deleted' });

    return apiSuccess({ deleted: true }, 'Account deleted successfully');
  } catch (error) {
    log.error('Error deleting account', error as Error);
    return ApiError.internal('Failed to delete account');
  }
}
