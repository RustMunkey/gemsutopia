import { NextRequest } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { sanitizeText } from '@/lib/security/sanitize';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return ApiError.notFound('User');
    }

    return apiSuccess({
      profile: {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone || '',
        addressLine1: user.addressLine1 || '',
        addressLine2: user.addressLine2 || '',
        city: user.city || '',
        province: user.province || '',
        postalCode: user.postalCode || '',
        country: user.country || 'Canada',
        createdAt: user.createdAt,
      },
    });
  } catch {
    return ApiError.internal('Failed to fetch profile');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required');
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      country,
    } = body;

    // Build update object with only provided fields
    const updateData: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };

    if (firstName !== undefined) updateData.firstName = sanitizeText(firstName).slice(0, 100);
    if (lastName !== undefined) updateData.lastName = sanitizeText(lastName).slice(0, 100);
    if (phone !== undefined) updateData.phone = sanitizeText(phone).slice(0, 20);
    if (addressLine1 !== undefined) updateData.addressLine1 = sanitizeText(addressLine1).slice(0, 200);
    if (addressLine2 !== undefined) updateData.addressLine2 = sanitizeText(addressLine2).slice(0, 200);
    if (city !== undefined) updateData.city = sanitizeText(city).slice(0, 100);
    if (province !== undefined) updateData.province = sanitizeText(province).slice(0, 100);
    if (postalCode !== undefined) updateData.postalCode = sanitizeText(postalCode).slice(0, 20);
    if (country !== undefined) updateData.country = sanitizeText(country).slice(0, 100);

    // Also update the name field (used by Better Auth)
    if (firstName !== undefined || lastName !== undefined) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      });
      const fName = firstName !== undefined ? sanitizeText(firstName) : (user?.firstName || '');
      const lName = lastName !== undefined ? sanitizeText(lastName) : (user?.lastName || '');
      updateData.name = `${fName} ${lName}`.trim();
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

    return apiSuccess({ updated: true }, 'Profile updated');
  } catch {
    return ApiError.internal('Failed to update profile');
  }
}
