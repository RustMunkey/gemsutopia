import { NextRequest } from 'next/server';
import { apiSuccess, ApiError } from '@/lib/api';
import { getLoyaltyDiscount } from '@/lib/loyalty';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET - Get loyalty discount for checkout
export async function GET(request: NextRequest) {
  try {
    // Try to get user from session
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    // Get email from query param (for guest checkout) or session
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');
    const subtotal = parseFloat(searchParams.get('subtotal') || '0');

    const email = session?.user?.email || emailParam;

    if (!email) {
      // No email, no discount
      return apiSuccess({
        discount: null,
        message: 'No email provided for loyalty lookup',
      });
    }

    const loyalty = await getLoyaltyDiscount(email);

    if (!loyalty.tierName || loyalty.discountPercent === 0) {
      return apiSuccess({
        discount: null,
        tierName: loyalty.tierName,
        message: loyalty.tierName
          ? `${loyalty.tierName} tier has no percentage discount`
          : 'No loyalty tier found',
      });
    }

    // Calculate discount amount
    const discountAmount = (subtotal * loyalty.discountPercent) / 100;

    // Check if free shipping applies
    const qualifiesForFreeShipping =
      loyalty.freeShipping &&
      (!loyalty.freeShippingThreshold || subtotal >= loyalty.freeShippingThreshold);

    return apiSuccess({
      discount: {
        code: `LOYALTY_${loyalty.tierName?.toUpperCase().replace(/\s+/g, '_')}`,
        type: 'percentage',
        value: loyalty.discountPercent,
        amount: Math.round(discountAmount * 100) / 100,
        free_shipping: qualifiesForFreeShipping,
        tierName: loyalty.tierName,
      },
      tierName: loyalty.tierName,
      freeShipping: qualifiesForFreeShipping,
      freeShippingThreshold: loyalty.freeShippingThreshold,
    });
  } catch (error) {
    console.error('Error getting loyalty discount:', error);
    return ApiError.internal('Failed to get loyalty discount');
  }
}
