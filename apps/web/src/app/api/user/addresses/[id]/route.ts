import { NextRequest } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

interface SavedAddress {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const preferences = (user.preferences as Record<string, unknown>) || {};
    const addresses = (preferences.savedAddresses as SavedAddress[]) || [];

    const index = addresses.findIndex(a => a.id === id);
    if (index === -1) {
      return ApiError.notFound('Address');
    }

    const body = await request.json();
    const { label, firstName, lastName, addressLine1, addressLine2, city, province, postalCode, country, phone, isDefault } = body;

    // If setting as default, unset others
    if (isDefault) {
      addresses.forEach(a => (a.isDefault = false));
    }

    addresses[index] = {
      ...addresses[index],
      ...(label !== undefined && { label }),
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(addressLine1 !== undefined && { addressLine1 }),
      ...(addressLine2 !== undefined && { addressLine2 }),
      ...(city !== undefined && { city }),
      ...(province !== undefined && { province }),
      ...(postalCode !== undefined && { postalCode }),
      ...(country !== undefined && { country }),
      ...(phone !== undefined && { phone }),
      ...(isDefault !== undefined && { isDefault }),
    };

    await db
      .update(users)
      .set({
        preferences: { ...preferences, savedAddresses: addresses },
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, session.user.id));

    return apiSuccess({ address: addresses[index] }, 'Address updated');
  } catch {
    return ApiError.internal('Failed to update address');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const preferences = (user.preferences as Record<string, unknown>) || {};
    const addresses = (preferences.savedAddresses as SavedAddress[]) || [];

    const index = addresses.findIndex(a => a.id === id);
    if (index === -1) {
      return ApiError.notFound('Address');
    }

    const wasDefault = addresses[index].isDefault;
    addresses.splice(index, 1);

    // If deleted address was default, make the first remaining one default
    if (wasDefault && addresses.length > 0) {
      addresses[0].isDefault = true;
    }

    await db
      .update(users)
      .set({
        preferences: { ...preferences, savedAddresses: addresses },
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, session.user.id));

    return apiSuccess({ deleted: true }, 'Address deleted');
  } catch {
    return ApiError.internal('Failed to delete address');
  }
}
