import { db, discountCodes, discountUsage } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

export interface DiscountValidationResult {
  valid: boolean;
  message: string;
  discount?: {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
    free_shipping: boolean;
  };
}

// Validate and calculate discount (customer-facing)
export async function validateDiscountCode(
  code: string,
  orderTotal: number
): Promise<DiscountValidationResult> {
  try {
    const discountCode = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.code, code.toUpperCase()),
    });

    if (!discountCode || !discountCode.isActive) {
      return {
        valid: false,
        message: 'Invalid discount code',
      };
    }

    // Check if expired
    if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
      return {
        valid: false,
        message: 'This discount code has expired',
      };
    }

    // Check minimum order requirement
    const minimumOrder = parseFloat(discountCode.minimumOrderAmount || '0');
    if (orderTotal < minimumOrder) {
      return {
        valid: false,
        message: `Minimum order of $${minimumOrder.toFixed(2)} required for this discount`,
      };
    }

    // Check usage limit
    if (discountCode.usageLimit && (discountCode.timesUsed || 0) >= discountCode.usageLimit) {
      return {
        valid: false,
        message: 'This discount code has reached its usage limit',
      };
    }

    // Calculate discount amount
    const discountValue = parseFloat(discountCode.value);
    let discountAmount = 0;
    if (discountCode.type === 'percentage') {
      discountAmount = orderTotal * (discountValue / 100);
    } else {
      discountAmount = Math.min(discountValue, orderTotal);
    }

    return {
      valid: true,
      message: `Discount applied: ${discountCode.description || code}`,
      discount: {
        id: discountCode.id,
        code: discountCode.code,
        type: discountCode.type as 'percentage' | 'fixed',
        value: discountValue,
        amount: discountAmount,
        free_shipping: discountCode.freeShipping || false,
      },
    };
  } catch {
    return {
      valid: false,
      message: 'Error validating discount code',
    };
  }
}

// Record discount code usage (called after successful order)
export async function recordDiscountUsage(
  discountCodeId: string,
  orderId: string,
  customerEmail: string,
  discountAmount: number
): Promise<boolean> {
  try {
    // Record usage
    await db.insert(discountUsage).values({
      discountCodeId: discountCodeId,
      orderId: orderId,
      customerEmail: customerEmail,
      discountAmount: String(discountAmount),
    });

    // Increment used count
    await db
      .update(discountCodes)
      .set({
        timesUsed: sql`${discountCodes.timesUsed} + 1`,
      })
      .where(eq(discountCodes.id, discountCodeId));

    return true;
  } catch {
    return false;
  }
}

// Get discount code by code (for checkout flow)
export async function getDiscountCodeByCode(code: string) {
  try {
    const discountCode = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.code, code.toUpperCase()),
    });

    if (!discountCode) return null;

    return {
      id: discountCode.id,
      code: discountCode.code,
      description: discountCode.description || undefined,
      discount_type: discountCode.type as 'percentage' | 'fixed',
      discount_value: parseFloat(discountCode.value),
      free_shipping: discountCode.freeShipping || false,
      minimum_order: parseFloat(discountCode.minimumOrderAmount || '0'),
      usage_limit: discountCode.usageLimit || undefined,
      used_count: discountCode.timesUsed || 0,
      is_active: discountCode.isActive || false,
      expires_at: discountCode.expiresAt || undefined,
    };
  } catch {
    return null;
  }
}

// Admin CRUD operations moved to JetBeans BaaS
