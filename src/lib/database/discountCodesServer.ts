import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DiscountCode {
  id?: number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
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
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching discount codes: ${error.message}`);
  }

  return data || [];
}

export async function createDiscountCode(discountCode: Omit<DiscountCode, 'id' | 'used_count'>): Promise<DiscountCode> {
  const { data, error } = await supabase
    .from('discount_codes')
    .insert([{ ...discountCode, used_count: 0 }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating discount code: ${error.message}`);
  }

  return data;
}

export async function updateDiscountCode(id: number, updates: Partial<DiscountCode>): Promise<DiscountCode> {
  const { data, error } = await supabase
    .from('discount_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating discount code: ${error.message}`);
  }

  return data;
}

export async function deleteDiscountCode(id: number): Promise<void> {
  const { error } = await supabase
    .from('discount_codes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting discount code: ${error.message}`);
  }
}

export async function validateDiscountCode(code: string, orderTotal: number) {
  try {
    const { data: discountData, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !discountData) {
      return {
        valid: false,
        message: 'Invalid discount code'
      };
    }

    // Check expiration
    if (discountData.expires_at && new Date(discountData.expires_at) < new Date()) {
      return {
        valid: false,
        message: 'This discount code has expired'
      };
    }

    // Check usage limit
    if (discountData.usage_limit && discountData.used_count >= discountData.usage_limit) {
      return {
        valid: false,
        message: 'This discount code has reached its usage limit'
      };
    }

    // Check minimum order
    if (orderTotal < discountData.minimum_order) {
      return {
        valid: false,
        message: `Minimum order of $${discountData.minimum_order.toFixed(2)} required for this discount`
      };
    }

    // Calculate discount amount
    let discountAmount: number;
    if (discountData.discount_type === 'percentage') {
      discountAmount = orderTotal * (discountData.discount_value / 100);
    } else {
      discountAmount = discountData.discount_value;
    }

    // Don't let discount exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return {
      valid: true,
      message: 'Discount code applied successfully!',
      discount: {
        code: discountData.code,
        type: discountData.discount_type,
        value: discountData.discount_value,
        amount: discountAmount,
        free_shipping: discountData.free_shipping
      }
    };
  } catch (error) {
    console.error('Error validating discount code:', error);
    return {
      valid: false,
      message: 'Error validating discount code'
    };
  }
}

export async function recordDiscountUsage(discountCodeId: number, orderId: string, customerEmail: string, discountAmount: number): Promise<boolean> {
  try {
    // Record usage
    const { error: usageError } = await supabase
      .from('discount_code_usage')
      .insert({
        discount_code_id: discountCodeId,
        order_id: orderId,
        customer_email: customerEmail,
        discount_amount: discountAmount
      });

    if (usageError) {
      console.error('Error recording discount usage:', usageError);
      return false;
    }

    // Increment used_count
    const { error: updateError } = await supabase.rpc('increment_discount_usage', {
      discount_id: discountCodeId
    });

    if (updateError) {
      console.error('Error updating discount code used_count:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordDiscountUsage:', error);
    return false;
  }
}