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

export async function getDiscountCodes(): Promise<DiscountCode[]> {
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
}

export async function createDiscountCode(
  discountCode: Omit<DiscountCode, 'id' | 'used_count'>
): Promise<DiscountCode> {
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

  if (!newCode) {
    throw new Error('Failed to create discount code');
  }

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
}

export async function updateDiscountCode(
  id: string,
  updates: Partial<DiscountCode>
): Promise<DiscountCode> {
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

  const [updated] = await db
    .update(discountCodes)
    .set(updateData)
    .where(eq(discountCodes.id, id))
    .returning();

  if (!updated) {
    throw new Error('Failed to update discount code');
  }

  return {
    id: updated.id,
    code: updated.code,
    description: updated.description || undefined,
    discount_type: updated.type as 'percentage' | 'fixed',
    discount_value: parseFloat(updated.value),
    free_shipping: updated.freeShipping || false,
    minimum_order: parseFloat(updated.minimumOrderAmount || '0'),
    usage_limit: updated.usageLimit || undefined,
    used_count: updated.timesUsed || 0,
    is_active: updated.isActive || false,
    expires_at: updated.expiresAt || undefined,
    created_at: updated.createdAt || undefined,
    updated_at: updated.updatedAt || undefined,
  };
}

export async function deleteDiscountCode(id: string): Promise<void> {
  await db.delete(discountCodes).where(eq(discountCodes.id, id));
}

export async function validateDiscountCode(code: string, orderTotal: number) {
  try {
    const discountCode = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.code, code.trim().toUpperCase()),
    });

    if (!discountCode || !discountCode.isActive) {
      return {
        valid: false,
        message: 'Invalid discount code',
      };
    }

    // Check expiration
    if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
      return {
        valid: false,
        message: 'This discount code has expired',
      };
    }

    // Check usage limit
    if (discountCode.usageLimit && (discountCode.timesUsed || 0) >= discountCode.usageLimit) {
      return {
        valid: false,
        message: 'This discount code has reached its usage limit',
      };
    }

    // Check minimum order
    const minimumOrder = parseFloat(discountCode.minimumOrderAmount || '0');
    if (orderTotal < minimumOrder) {
      return {
        valid: false,
        message: `Minimum order of $${minimumOrder.toFixed(2)} required for this discount`,
      };
    }

    // Calculate discount amount
    const discountValue = parseFloat(discountCode.value);
    let discountAmount: number;
    if (discountCode.type === 'percentage') {
      discountAmount = orderTotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }

    // Don't let discount exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return {
      valid: true,
      message: 'Discount code applied successfully!',
      discount: {
        code: discountCode.code,
        type: discountCode.type,
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

    // Increment used_count
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
