import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { customerLoyalty, loyaltyTierHistory } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

interface RouteContext {
  params: Promise<{ email: string }>;
}

// GET - Get customer's tier history
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const adminVerified = await verifyAdminToken(request);
    if (!adminVerified) {
      return ApiError.unauthorized('Admin authentication required');
    }

    const { email } = await context.params;
    const decodedEmail = decodeURIComponent(email);

    // Get customer loyalty record
    const loyalty = await db.query.customerLoyalty.findFirst({
      where: eq(customerLoyalty.email, decodedEmail.toLowerCase()),
      with: {
        tier: true,
      },
    });

    if (!loyalty) {
      return ApiError.notFound('Customer loyalty record');
    }

    // Get tier history
    const history = await db.query.loyaltyTierHistory.findMany({
      where: eq(loyaltyTierHistory.customerLoyaltyId, loyalty.id),
      orderBy: [desc(loyaltyTierHistory.createdAt)],
      with: {
        previousTier: true,
        newTier: true,
      },
    });

    return apiSuccess({
      customer: loyalty,
      history,
    });
  } catch (error) {
    console.error('Error fetching tier history:', error);
    return ApiError.internal('Failed to fetch tier history');
  }
}
