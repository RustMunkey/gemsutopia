import { NextRequest } from 'next/server';
import { db, referrals, referralConversions, discountCodes, discountUsage } from '@/lib/db';
import { eq, and, count } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

// POST /api/referrals/validate - Validate a referral OR discount code
// This is the unified endpoint for checkout - it handles both types
export async function POST(request: NextRequest) {
  try {
    const { code, customerEmail, orderTotal } = await request.json();

    if (!code) {
      return ApiError.validation('Code is required');
    }

    if (!orderTotal || orderTotal <= 0) {
      return ApiError.validation('Order total is required');
    }

    const normalizedCode = code.trim().toUpperCase();
    const normalizedEmail = customerEmail?.toLowerCase();

    // First, try to find as a referral code
    const referral = await db.query.referrals.findFirst({
      where: and(
        eq(referrals.code, normalizedCode),
        eq(referrals.isActive, true)
      ),
    });

    if (referral) {
      // It's a referral code - validate it

      // Check if it's expired
      if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
        return apiSuccess({
          valid: false,
          type: 'referral',
          message: 'This referral code has expired',
        });
      }

      // Check if customer is trying to use their own referral code
      if (normalizedEmail && referral.referrerEmail === normalizedEmail) {
        return apiSuccess({
          valid: false,
          type: 'referral',
          message: 'You cannot use your own referral code',
        });
      }

      // Check if this customer has already used a referral code before (first-purchase only)
      if (normalizedEmail) {
        const existingConversion = await db.query.referralConversions.findFirst({
          where: eq(referralConversions.referredEmail, normalizedEmail),
        });

        if (existingConversion) {
          return apiSuccess({
            valid: false,
            type: 'referral',
            message: 'Referral codes can only be used on your first purchase',
          });
        }
      }

      // Calculate discount
      const discountValue = parseFloat(referral.referredDiscountValue || '0');
      const discountCap = referral.referredDiscountCap
        ? parseFloat(referral.referredDiscountCap)
        : null;

      let discountAmount = 0;
      if (referral.referredDiscountType === 'percentage') {
        discountAmount = (orderTotal * discountValue) / 100;
        if (discountCap && discountAmount > discountCap) {
          discountAmount = discountCap;
        }
      } else {
        discountAmount = discountValue;
      }

      // Don't exceed order total
      if (discountAmount > orderTotal) {
        discountAmount = orderTotal;
      }

      return apiSuccess({
        valid: true,
        type: 'referral',
        code: referral.code,
        discount: {
          type: referral.referredDiscountType,
          value: discountValue,
          amount: Math.round(discountAmount * 100) / 100,
          description: referral.referredDiscountType === 'percentage'
            ? `${discountValue}% off (referral from ${referral.referrerName || 'a friend'})`
            : `$${discountValue} off (referral from ${referral.referrerName || 'a friend'})`,
        },
        referral: {
          id: referral.id,
          referrerName: referral.referrerName,
        },
        message: 'Referral code applied successfully',
      });
    }

    // Not a referral code - try discount codes
    const discountCode = await db.query.discountCodes.findFirst({
      where: and(
        eq(discountCodes.code, normalizedCode),
        eq(discountCodes.isActive, true)
      ),
    });

    if (!discountCode) {
      return apiSuccess({
        valid: false,
        type: null,
        message: 'Invalid code',
      });
    }

    // Validate discount code
    // Check expiration
    if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
      return apiSuccess({
        valid: false,
        type: 'discount',
        message: 'This discount code has expired',
      });
    }

    // Check start date
    if (discountCode.startsAt && new Date(discountCode.startsAt) > new Date()) {
      return apiSuccess({
        valid: false,
        type: 'discount',
        message: 'This discount code is not yet active',
      });
    }

    // Check global usage limit
    if (discountCode.usageLimit && (discountCode.timesUsed || 0) >= discountCode.usageLimit) {
      return apiSuccess({
        valid: false,
        type: 'discount',
        message: 'This discount code has reached its usage limit',
      });
    }

    // Check per-customer usage limit
    if (normalizedEmail && discountCode.usageLimitPerCustomer) {
      const customerUsageResult = await db
        .select({ count: count() })
        .from(discountUsage)
        .where(and(
          eq(discountUsage.discountCodeId, discountCode.id),
          eq(discountUsage.customerEmail, normalizedEmail)
        ));

      const customerUsage = customerUsageResult[0]?.count || 0;
      if (customerUsage >= discountCode.usageLimitPerCustomer) {
        return apiSuccess({
          valid: false,
          type: 'discount',
          message: 'You have already used this discount code',
        });
      }
    }

    // Check minimum order amount
    const minimumOrder = parseFloat(discountCode.minimumOrderAmount || '0');
    if (orderTotal < minimumOrder) {
      return apiSuccess({
        valid: false,
        type: 'discount',
        message: `Minimum order of $${minimumOrder.toFixed(2)} required for this code`,
      });
    }

    // Calculate discount amount
    const discountValue = parseFloat(discountCode.value);
    const maxDiscount = discountCode.maxDiscountAmount
      ? parseFloat(discountCode.maxDiscountAmount)
      : null;

    let discountAmount = 0;
    if (discountCode.type === 'percentage') {
      discountAmount = (orderTotal * discountValue) / 100;
      if (maxDiscount && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else if (discountCode.type === 'fixed') {
      discountAmount = discountValue;
    }

    // Don't exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    return apiSuccess({
      valid: true,
      type: 'discount',
      code: discountCode.code,
      discount: {
        type: discountCode.type,
        value: discountValue,
        amount: Math.round(discountAmount * 100) / 100,
        freeShipping: discountCode.freeShipping,
        description: discountCode.description || (
          discountCode.type === 'percentage'
            ? `${discountValue}% off`
            : `$${discountValue} off`
        ),
      },
      discountCode: {
        id: discountCode.id,
      },
      message: 'Discount code applied successfully',
    });
  } catch (error) {
    console.error('Validate code error:', error);
    return ApiError.internal('Failed to validate code');
  }
}
