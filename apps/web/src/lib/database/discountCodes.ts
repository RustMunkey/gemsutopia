import { db, discountCodes, discountUsage } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';

export interface DiscountCode {
  id?: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  free_shipping: boolean;
  minimum_order: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DiscountValidationResult {
  valid: boolean;
  message: string;
  discount?: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
    free_shipping: boolean;
  };
}

// Get all discount codes
export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  try {
    const codes = await db.query.discountCodes.findMany({
      orderBy: [desc(discountCodes.createdAt)],
    });

    return codes.map(code => ({
      id: code.id,
      code: code.code,
      description: code.description || undefined,
      discount_type: code.type as 'percentage' | 'fixed',
      discount_value: parseFloat(code.value),
      free_shipping: code.freeShipping || false,
      minimum_order: parseFloat(code.minimumOrderAmount || '0'),
      usage_limit: code.usageLimit || undefined,
      used_count: code.timesUsed || 0,
      is_active: code.isActive || false,
      expires_at: code.expiresAt || undefined,
      created_at: code.createdAt || undefined,
      updated_at: code.updatedAt || undefined,
    }));
  } catch {
    return [];
  }
}

// Create a new discount code
export async function createDiscountCode(
  discountCode: Omit<DiscountCode, 'id' | 'used_count' | 'created_at' | 'updated_at'>
): Promise<DiscountCode | null> {
  try {
    const [newCode] = await db
      .insert(discountCodes)
      .values({
        code: discountCode.code.toUpperCase(),
        description: discountCode.description || null,
        type: discountCode.discount_type,
        value: String(discountCode.discount_value),
        freeShipping: discountCode.free_shipping,
        minimumOrderAmount: String(discountCode.minimum_order),
        usageLimit: discountCode.usage_limit || null,
        timesUsed: 0,
        isActive: discountCode.is_active,
        expiresAt: discountCode.expires_at || null,
      })
      .returning();

    if (!newCode) return null;

    return {
      id: newCode.id,
      code: newCode.code,
      description: newCode.description || undefined,
      discount_type: newCode.type as 'percentage' | 'fixed',
      discount_value: parseFloat(newCode.value),
      free_shipping: newCode.freeShipping || false,
      minimum_order: parseFloat(newCode.minimumOrderAmount || '0'),
      usage_limit: newCode.usageLimit || undefined,
      used_count: newCode.timesUsed || 0,
      is_active: newCode.isActive || false,
      expires_at: newCode.expiresAt || undefined,
      created_at: newCode.createdAt || undefined,
      updated_at: newCode.updatedAt || undefined,
    };
  } catch {
    return null;
  }
}

// Update a discount code
export async function updateDiscountCode(
  id: string,
  updates: Partial<DiscountCode>
): Promise<boolean> {
  try {
    const updateData: Partial<typeof discountCodes.$inferInsert> = {};

    if (updates.code !== undefined) updateData.code = updates.code.toUpperCase();
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.discount_type !== undefined) updateData.type = updates.discount_type;
    if (updates.discount_value !== undefined) updateData.value = String(updates.discount_value);
    if (updates.free_shipping !== undefined) updateData.freeShipping = updates.free_shipping;
    if (updates.minimum_order !== undefined)
      updateData.minimumOrderAmount = String(updates.minimum_order);
    if (updates.usage_limit !== undefined) updateData.usageLimit = updates.usage_limit;
    if (updates.is_active !== undefined) updateData.isActive = updates.is_active;
    if (updates.expires_at !== undefined) updateData.expiresAt = updates.expires_at;

    await db.update(discountCodes).set(updateData).where(eq(discountCodes.id, id));

    return true;
  } catch {
    return false;
  }
}

// Delete a discount code
export async function deleteDiscountCode(id: string): Promise<boolean> {
  try {
    await db.delete(discountCodes).where(eq(discountCodes.id, id));
    return true;
  } catch {
    return false;
  }
}

// Validate and calculate discount
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

// Record discount code usage
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

// Get discount code by code
export async function getDiscountCodeByCode(code: string): Promise<DiscountCode | null> {
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
      created_at: discountCode.createdAt || undefined,
      updated_at: discountCode.updatedAt || undefined,
    };
  } catch {
    return null;
  }
}
