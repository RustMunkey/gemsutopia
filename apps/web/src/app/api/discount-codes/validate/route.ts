import { NextRequest } from 'next/server';
import { validateDiscountCode } from '@/lib/database/discountCodes';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code, orderTotal } = await request.json();

    if (!code || typeof orderTotal !== 'number') {
      return ApiError.validation('Code and order total are required');
    }

    const result = await validateDiscountCode(code, orderTotal);

    return apiSuccess(result);
  } catch {
    return ApiError.internal('Failed to validate discount code');
  }
}
