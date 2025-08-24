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
  address?: string
): Promise<TaxCalculationResult> {
  try {
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
        address
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