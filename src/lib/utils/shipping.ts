/**
 * Dynamic Shipping Calculator
 * Handles currency-specific shipping rates with combined shipping logic
 */

export interface ShippingSettings {
  enableShipping: boolean;
  internationalShipping: boolean;
  singleItemShippingCAD: number;
  singleItemShippingUSD: number;
  combinedShippingCAD: number;
  combinedShippingUSD: number;
  combinedShippingEnabled: boolean;
  combinedShippingThreshold: number;
}

export interface ShippingCalculation {
  shippingCost: number;
  currency: 'CAD' | 'USD';
  isCombinedShipping: boolean;
  itemCount: number;
  breakdown: {
    description: string;
    amount: number;
  }[];
}

/**
 * Calculate shipping cost based on cart items, currency, and shipping settings
 */
export function calculateShipping(
  itemCount: number,
  currency: 'CAD' | 'USD',
  settings: ShippingSettings
): ShippingCalculation {
  // If shipping is disabled, return zero cost
  if (!settings.enableShipping) {
    return {
      shippingCost: 0,
      currency,
      isCombinedShipping: false,
      itemCount,
      breakdown: [{ description: 'Free shipping', amount: 0 }]
    };
  }

  // No items, no shipping
  if (itemCount === 0) {
    return {
      shippingCost: 0,
      currency,
      isCombinedShipping: false,
      itemCount,
      breakdown: []
    };
  }

  const isCombinedShipping = settings.combinedShippingEnabled && itemCount >= settings.combinedShippingThreshold;
  
  let shippingCost: number;
  let description: string;

  if (isCombinedShipping) {
    // Use combined shipping rate
    shippingCost = currency === 'CAD' ? settings.combinedShippingCAD : settings.combinedShippingUSD;
    description = `Combined shipping for ${itemCount} items`;
  } else {
    // Use single item shipping rate (applies to all items individually)
    const singleRate = currency === 'CAD' ? settings.singleItemShippingCAD : settings.singleItemShippingUSD;
    shippingCost = singleRate * itemCount;
    description = itemCount === 1 
      ? 'Standard shipping for 1 item'
      : `Standard shipping for ${itemCount} items (${formatCurrency(singleRate, currency)} each)`;
  }

  return {
    shippingCost,
    currency,
    isCombinedShipping,
    itemCount,
    breakdown: [{ description, amount: shippingCost }]
  };
}

/**
 * Get shipping rate preview for settings display
 */
export function getShippingRatePreview(settings: ShippingSettings) {
  const examples = [
    {
      itemCount: 1,
      cadRate: calculateShipping(1, 'CAD', settings),
      usdRate: calculateShipping(1, 'USD', settings),
    },
    {
      itemCount: 5,
      cadRate: calculateShipping(5, 'CAD', settings),
      usdRate: calculateShipping(5, 'USD', settings),
    },
    {
      itemCount: 10,
      cadRate: calculateShipping(10, 'CAD', settings),
      usdRate: calculateShipping(10, 'USD', settings),
    }
  ];

  return examples;
}

/**
 * Validate shipping settings
 */
export function validateShippingSettings(settings: Partial<ShippingSettings>): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];

  if (settings.singleItemShippingCAD !== undefined && settings.singleItemShippingCAD < 0) {
    errors.push('Single item shipping rate (CAD) cannot be negative');
  }

  if (settings.singleItemShippingUSD !== undefined && settings.singleItemShippingUSD < 0) {
    errors.push('Single item shipping rate (USD) cannot be negative');
  }

  if (settings.combinedShippingCAD !== undefined && settings.combinedShippingCAD < 0) {
    errors.push('Combined shipping rate (CAD) cannot be negative');
  }

  if (settings.combinedShippingUSD !== undefined && settings.combinedShippingUSD < 0) {
    errors.push('Combined shipping rate (USD) cannot be negative');
  }

  if (settings.combinedShippingThreshold !== undefined && settings.combinedShippingThreshold < 2) {
    errors.push('Combined shipping threshold must be at least 2 items');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: 'CAD' | 'USD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Convert CAD to USD or vice versa using live exchange rates
 * Falls back to static rate if API fails
 */
export async function convertCurrency(
  amount: number, 
  fromCurrency: 'CAD' | 'USD', 
  toCurrency: 'CAD' | 'USD'
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  try {
    // Try to get live exchange rate from your existing crypto-prices API
    const response = await fetch('/api/crypto-prices');
    const data = await response.json();
    
    if (data.success && data.exchangeRates) {
      const rate = fromCurrency === 'CAD' 
        ? data.exchangeRates.CAD_TO_USD 
        : data.exchangeRates.USD_TO_CAD;
      
      if (rate && rate > 0) {
        return parseFloat((amount * rate).toFixed(2));
      }
    }
  } catch (error) {
    console.warn('Failed to fetch live exchange rate, using fallback');
  }
  
  // Fallback to approximate exchange rates
  const fallbackRates = {
    CAD_TO_USD: 0.74,
    USD_TO_CAD: 1.35
  };
  
  const rate = fromCurrency === 'CAD' 
    ? fallbackRates.CAD_TO_USD 
    : fallbackRates.USD_TO_CAD;
    
  return parseFloat((amount * rate).toFixed(2));
}

/**
 * Get shipping rates in both currencies for display
 */
export async function getShippingRatesInBothCurrencies(
  itemCount: number,
  settings: ShippingSettings
): Promise<{
  cad: ShippingCalculation;
  usd: ShippingCalculation;
  convertedFromCAD?: boolean;
  convertedFromUSD?: boolean;
}> {
  const cadRate = calculateShipping(itemCount, 'CAD', settings);
  const usdRate = calculateShipping(itemCount, 'USD', settings);
  
  // Convert CAD settings to USD dynamically if needed
  const convertedUSDCost = await convertCurrency(cadRate.shippingCost, 'CAD', 'USD');
  const convertedCADCost = await convertCurrency(usdRate.shippingCost, 'USD', 'CAD');
  
  return {
    cad: cadRate,
    usd: {
      ...usdRate,
      shippingCost: convertedUSDCost
    },
    convertedFromCAD: Math.abs(convertedUSDCost - usdRate.shippingCost) > 0.01,
    convertedFromUSD: Math.abs(convertedCADCost - cadRate.shippingCost) > 0.01
  };
}

/**
 * Get shipping settings from API (for client-side use)
 */
export async function fetchShippingSettings(): Promise<ShippingSettings | null> {
  try {
    const response = await fetch('/api/shipping-settings');
    if (!response.ok) {
      throw new Error('Failed to fetch shipping settings');
    }
    
    const data = await response.json();
    return data.settings;
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    return null;
  }
}

/**
 * API endpoint to get shipping settings (public, no auth needed)
 */
export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  enableShipping: true,
  internationalShipping: true,
  singleItemShippingCAD: 18.50,
  singleItemShippingUSD: 14.50,
  combinedShippingCAD: 20.00,
  combinedShippingUSD: 15.50,
  combinedShippingEnabled: true,
  combinedShippingThreshold: 2,
};