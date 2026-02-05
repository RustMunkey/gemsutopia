import { NextRequest } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';

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

    const preferences = (user.preferences as Record<string, unknown>) || {};
    const addresses = (preferences.savedAddresses as SavedAddress[]) || [];

    return apiSuccess({ addresses });
  } catch {
    return ApiError.internal('Failed to fetch addresses');
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { label, firstName, lastName, addressLine1, addressLine2, city, province, postalCode, country, phone, isDefault } = body;

    if (!firstName || !lastName || !addressLine1 || !city || !province || !postalCode || !country) {
      return ApiError.validation('First name, last name, address, city, province, postal code, and country are required');
    }

    const preferences = (user.preferences as Record<string, unknown>) || {};
    const addresses = (preferences.savedAddresses as SavedAddress[]) || [];

    // If this is set as default, unset others
    if (isDefault) {
      addresses.forEach(a => (a.isDefault = false));
    }

    const newAddress: SavedAddress = {
      id: randomUUID(),
      label: label || 'Home',
      firstName,
      lastName,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      province,
      postalCode,
      country,
      phone: phone || '',
      isDefault: isDefault || addresses.length === 0, // First address is always default
    };

    addresses.push(newAddress);

    await db
      .update(users)
      .set({
        preferences: { ...preferences, savedAddresses: addresses },
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, session.user.id));

    return apiSuccess({ address: newAddress }, 'Address added', 201);
  } catch {
    return ApiError.internal('Failed to add address');
  }
}
