import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
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

export interface DiscountValidationResult {
  valid: boolean;
  message: string;
  discount?: {
    code: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    amount: number; // Calculated discount amount
    free_shipping: boolean;
  };
}

// Get all discount codes
export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching discount codes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllDiscountCodes:', error);
    return [];
  }
}

// Create a new discount code
export async function createDiscountCode(discountCode: Omit<DiscountCode, 'id' | 'used_count' | 'created_at' | 'updated_at'>): Promise<DiscountCode | null> {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        ...discountCode,
        used_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating discount code:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createDiscountCode:', error);
    return null;
  }
}

// Update a discount code
export async function updateDiscountCode(id: number, updates: Partial<DiscountCode>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('discount_codes')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating discount code:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateDiscountCode:', error);
    return false;
  }
}

// Delete a discount code
export async function deleteDiscountCode(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting discount code:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDiscountCode:', error);
    return false;
  }
}

// Validate and calculate discount
export async function validateDiscountCode(code: string, orderTotal: number): Promise<DiscountValidationResult> {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return {
        valid: false,
        message: 'Invalid discount code'
      };
    }

    const discountCode = data as DiscountCode;

    // Check if expired
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return {
        valid: false,
        message: 'This discount code has expired'
      };
    }

    // Check minimum order requirement
    if (discountCode.minimum_order && orderTotal < discountCode.minimum_order) {
      return {
        valid: false,
        message: `Minimum order of $${discountCode.minimum_order.toFixed(2)} required for this discount`
      };
    }

    // Check usage limit
    if (discountCode.usage_limit && discountCode.used_count >= discountCode.usage_limit) {
      return {
        valid: false,
        message: 'This discount code has reached its usage limit'
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountCode.discount_type === 'percentage') {
      discountAmount = orderTotal * (discountCode.discount_value / 100);
    } else {
      discountAmount = Math.min(discountCode.discount_value, orderTotal);
    }

    return {
      valid: true,
      message: `Discount applied: ${discountCode.description || code}`,
      discount: {
        code: discountCode.code,
        type: discountCode.discount_type,
        value: discountCode.discount_value,
        amount: discountAmount,
        free_shipping: discountCode.free_shipping
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

// Record discount code usage
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

    // Increment used count
    const { error: updateError } = await supabase
      .from('discount_codes')
      .update({ 
        used_count: supabase.rpc('increment_used_count', { discount_id: discountCodeId })
      })
      .eq('id', discountCodeId);

    if (updateError) {
      console.error('Error updating discount usage count:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordDiscountUsage:', error);
    return false;
  }
}

// Get discount code by code
export async function getDiscountCodeByCode(code: string): Promise<DiscountCode | null> {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      return null;
    }

    return data as DiscountCode;
  } catch (error) {
    console.error('Error in getDiscountCodeByCode:', error);
    return null;
  }
}