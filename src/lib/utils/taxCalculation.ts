export interface TaxRate {
  federal: number;
  provincial?: number;
  state?: number;
  local?: number;
  total: number;
  name: string;
}

export interface TaxCalculationResult {
  amount: number;
  rate: TaxRate;
}

export async function calculateTax(
  subtotal: number, 
  country: string, 
  state: string,
  city?: string,
  zipCode?: string,
  address?: string,
  paymentMethod?: string,
  currency?: 'CAD' | 'USD'
): Promise<TaxCalculationResult> {
  try {
    // Crypto payments are tax-free
    if (paymentMethod && ['bitcoin', 'ethereum', 'solana', 'crypto'].includes(paymentMethod.toLowerCase())) {
      return {
        amount: 0,
        rate: {
          federal: 0,
          total: 0,
          name: 'Tax Free (Crypto)'
        }
      };
    }

    const response = await fetch('/api/tax-calculation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subtotal,
        country,
        state,
        city,
        zipCode,
        address,
        paymentMethod,
        currency
      })
    });

    if (!response.ok) {
      throw new Error('Tax calculation failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Tax calculation error:', error);
    // Fallback to no tax if API fails
    return {
      amount: 0,
      rate: {
        federal: 0,
        total: 0,
        name: 'Tax'
      }
    };
  }
}

// Synchronous version for when we already have the rate
export function calculateTaxSync(subtotal: number, taxRate: number): TaxCalculationResult {
  const amount = subtotal * taxRate;
  
  return {
    amount,
    rate: {
      federal: 0,
      total: taxRate,
      name: 'Tax'
    }
  };
}

// Helper for product creation - adds tax-inclusive pricing
export async function addTaxToProduct(
  basePrice: number,
  currency: 'CAD' | 'USD' = 'CAD',
  defaultLocation?: { country: string; state: string; }
): Promise<{ priceWithTax: number; taxAmount: number; taxRate: TaxRate }> {
  try {
    // Default locations for tax calculation
    const location = defaultLocation || (currency === 'CAD' 
      ? { country: 'Canada', state: 'ON' } // Ontario for CAD
      : { country: 'United States', state: 'CA' }); // California for USD

    const taxResult = await calculateTax(
      basePrice,
      location.country,
      location.state,
      undefined,
      undefined,
      undefined,
      'card', // Assume card payment (not crypto)
      currency
    );

    return {
      priceWithTax: basePrice + taxResult.amount,
      taxAmount: taxResult.amount,
      taxRate: taxResult.rate
    };
  } catch (error) {
    console.error('Error adding tax to product:', error);
    return {
      priceWithTax: basePrice,
      taxAmount: 0,
      taxRate: { federal: 0, total: 0, name: 'No Tax' }
    };
  }
}

// Quick check if crypto payment should be tax-free
export function isCryptoPayment(paymentMethod?: string): boolean {
  return paymentMethod ? ['bitcoin', 'ethereum', 'solana', 'crypto'].includes(paymentMethod.toLowerCase()) : false;
}