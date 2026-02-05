import { NextRequest } from 'next/server';
import {
  getDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  DiscountCode,
} from '@/lib/database/discountCodesServer';
import { requireAdmin, rateLimit, validateAndSanitize } from '@/lib/auth/adminAuth';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

// 🔐 SECURE handlers with proper security
async function getDiscountCodesHandler() {
  try {
    const codes = await getDiscountCodes();
    return apiSuccess({ discountCodes: codes, timestamp: new Date().toISOString() });
  } catch {
    return ApiError.database('Failed to fetch discount codes');
  }
}

async function postDiscountCodesHandler(request: NextRequest) {
  try {
    const discountData: Omit<DiscountCode, 'id' | 'used_count'> = await request.json();

    // Validation
    if (!discountData.code || !discountData.discount_type || !discountData.discount_value) {
      return ApiError.validation('Missing required fields: code, discount_type, discount_value');
    }

    if (discountData.code.length > 50) {
      return ApiError.validation('Discount code must be 50 characters or less');
    }

    const newCode = await createDiscountCode(discountData);
    return apiSuccess({ discountCode: newCode }, 'Discount code created successfully', 201);
  } catch {
    return ApiError.database('Failed to create discount code');
  }
}

async function putDiscountCodesHandler(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id || typeof id !== 'string') {
      return ApiError.validation('Valid discount code ID is required');
    }

    const updatedCode = await updateDiscountCode(id, updateData);
    return apiSuccess({ discountCode: updatedCode }, 'Discount code updated successfully');
  } catch {
    return ApiError.database('Failed to update discount code');
  }
}

async function deleteDiscountCodesHandler(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id || typeof id !== 'string') {
      return ApiError.validation('Valid discount code ID is required');
    }

    await deleteDiscountCode(id);
    return apiSuccess(null, 'Discount code deleted successfully');
  } catch {
    return ApiError.database('Failed to delete discount code');
  }
}

// Apply bulletproof security to all endpoints
export const GET = rateLimit(50, 15 * 60 * 1000)(requireAdmin(getDiscountCodesHandler));
export const POST = rateLimit(
  10,
  15 * 60 * 1000
)(validateAndSanitize(requireAdmin(postDiscountCodesHandler)));
export const PUT = rateLimit(
  20,
  15 * 60 * 1000
)(validateAndSanitize(requireAdmin(putDiscountCodesHandler)));
export const DELETE = rateLimit(5, 15 * 60 * 1000)(requireAdmin(deleteDiscountCodesHandler));
