import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { subtotal, country, state, city, zipCode, address, paymentMethod, currency } = await request.json();

    if (!subtotal || !country || !state) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Crypto payments are tax-free
    if (paymentMethod && ['bitcoin', 'ethereum', 'solana', 'crypto'].includes(paymentMethod.toLowerCase())) {
      return NextResponse.json({
        amount: 0,
        rate: {
          federal: 0,
          total: 0,
          name: 'Tax Free (Crypto)'
        }
      });
    }

    const normalizedCountry = country.toLowerCase();
    const normalizedState = state.toUpperCase();

    // Currency-aware country detection
    // If USD currency is selected, prioritize US tax rules
    // If CAD currency is selected, prioritize Canadian tax rules
    let effectiveCountry = normalizedCountry;
    if (currency === 'USD' && (normalizedCountry === 'canada' || normalizedCountry === 'ca')) {
      // User has Canadian address but wants USD pricing - still use Canadian taxes
      effectiveCountry = 'canada';
    } else if (currency === 'CAD' && (normalizedCountry === 'united states' || normalizedCountry === 'us' || normalizedCountry === 'usa')) {
      // User has US address but wants CAD pricing - still use US taxes
      effectiveCountry = 'united states';
    }

    let taxRate;
    
    try {
      if (effectiveCountry === 'canada' || effectiveCountry === 'ca') {
        taxRate = await getCanadianTaxRate(normalizedState, city, zipCode, address);
      } else if (effectiveCountry === 'united states' || effectiveCountry === 'us' || effectiveCountry === 'usa') {
        taxRate = await getUSTaxRate(normalizedState, city, zipCode, address);
      } else {
        // Default to no tax for other countries
        taxRate = {
          federal: 0,
          total: 0,
          name: 'No Tax'
        };
      }
    } catch (error) {
      console.error('Tax API error:', error);
      // Fallback to basic rates if API fails
      taxRate = getFallbackTaxRate(effectiveCountry, normalizedState);
    }

    const amount = subtotal * taxRate.total;

    return NextResponse.json({
      amount,
      rate: taxRate
    });

  } catch (error) {
    console.error('Tax calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getCanadianTaxRate(
  province: string,
  city?: string,
  postalCode?: string,
  address?: string
) {
  // Use accurate Canadian rates (these are government-set and rarely change)
  return getFallbackCanadianTax(province);
}

async function getUSTaxRate(
  state: string,
  city?: string,
  zipCode?: string,
  address?: string
) {
  try {
    // Try multiple free APIs for better coverage
    
    // Option 1: SalesTax API (free tier: 1,000 calls/month)
    if (zipCode) {
      try {
        const response = await fetch(`https://api.salestax.com/v2/tax/${zipCode}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          const totalRate = parseFloat(data.totalRate || '0') / 100;
          
          return {
            federal: 0,
            state: totalRate,
            total: totalRate,
            name: 'Tax'
          };
        }
      } catch (apiError) {
        console.log('SalesTax API failed, trying backup...');
      }
      
      // Option 2: Zip-codes.com free API
      try {
        const response = await fetch(`https://api.zip-codes.com/ZipCodesAPI.svc/1.0/QuickGetZipCodeDetails/${zipCode}?key=FREE`);
        
        if (response.ok) {
          const data = await response.json();
          const stateCode = data.State;
          if (stateCode) {
            return getFallbackUSTax(stateCode);
          }
        }
      } catch (apiError) {
        console.log('Zip-codes API failed, using state fallback...');
      }
    }
    
    // Fallback to accurate 2024 state rates
    return getFallbackUSTax(state);
    
  } catch (error) {
    console.error('US tax calculation error:', error);
    return getFallbackUSTax(state);
  }
}

function getFallbackTaxRate(country: string, state: string) {
  if (country === 'canada' || country === 'ca') {
    return getFallbackCanadianTax(state);
  } else if (country === 'united states' || country === 'us' || country === 'usa') {
    return getFallbackUSTax(state);
  }
  
  return { federal: 0, total: 0, name: 'No Tax' };
}

function getFallbackCanadianTax(province: string) {
  const rates: Record<string, any> = {
    'AB': { federal: 0.05, total: 0.05, name: 'GST' },
    'BC': { federal: 0.05, provincial: 0.07, total: 0.12, name: 'GST + PST' },
    'MB': { federal: 0.05, provincial: 0.07, total: 0.12, name: 'GST + PST' },
    'NB': { federal: 0.15, total: 0.15, name: 'HST' },
    'NL': { federal: 0.15, total: 0.15, name: 'HST' },
    'NT': { federal: 0.05, total: 0.05, name: 'GST' },
    'NS': { federal: 0.15, total: 0.15, name: 'HST' },
    'NU': { federal: 0.05, total: 0.05, name: 'GST' },
    'ON': { federal: 0.13, total: 0.13, name: 'HST' },
    'PE': { federal: 0.15, total: 0.15, name: 'HST' },
    'QC': { federal: 0.05, provincial: 0.09975, total: 0.14975, name: 'GST + QST' },
    'SK': { federal: 0.05, provincial: 0.06, total: 0.11, name: 'GST + PST' },
    'YT': { federal: 0.05, total: 0.05, name: 'GST' }
  };

  return rates[province] || { federal: 0.05, total: 0.05, name: 'GST' };
}

function getFallbackUSTax(state: string) {
  const rates: Record<string, any> = {
    // All 50 US States + DC + Territories with 2024 tax rates
    'AL': { federal: 0, state: 0.04, total: 0.04, name: 'Tax' },
    'AK': { federal: 0, state: 0.00, total: 0.00, name: 'Tax' },
    'AZ': { federal: 0, state: 0.056, total: 0.056, name: 'Tax' },
    'AR': { federal: 0, state: 0.065, total: 0.065, name: 'Tax' },
    'CA': { federal: 0, state: 0.0725, total: 0.0725, name: 'Tax' },
    'CO': { federal: 0, state: 0.029, total: 0.029, name: 'Tax' },
    'CT': { federal: 0, state: 0.0635, total: 0.0635, name: 'Tax' },
    'DE': { federal: 0, state: 0.00, total: 0.00, name: 'Tax' },
    'FL': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    'GA': { federal: 0, state: 0.04, total: 0.04, name: 'Tax' },
    'HI': { federal: 0, state: 0.04, total: 0.04, name: 'Tax' },
    'ID': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    'IL': { federal: 0, state: 0.0625, total: 0.0625, name: 'Tax' },
    'IN': { federal: 0, state: 0.07, total: 0.07, name: 'Tax' },
    'IA': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    'KS': { federal: 0, state: 0.065, total: 0.065, name: 'Tax' },
    'KY': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    'LA': { federal: 0, state: 0.0445, total: 0.0445, name: 'Tax' },
    'ME': { federal: 0, state: 0.055, total: 0.055, name: 'Tax' },
    'MD': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    'MA': { federal: 0, state: 0.0625, total: 0.0625, name: 'Tax' },
    'MI': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    'MN': { federal: 0, state: 0.06875, total: 0.06875, name: 'Tax' },
    'MS': { federal: 0, state: 0.07, total: 0.07, name: 'Tax' },
    'MO': { federal: 0, state: 0.04225, total: 0.04225, name: 'Tax' },
    'MT': { federal: 0, state: 0.00, total: 0.00, name: 'Tax' },
    'NE': { federal: 0, state: 0.055, total: 0.055, name: 'Tax' },
    'NV': { federal: 0, state: 0.0685, total: 0.0685, name: 'Tax' },
    'NH': { federal: 0, state: 0.00, total: 0.00, name: 'Tax' },
    'NJ': { federal: 0, state: 0.06625, total: 0.06625, name: 'Tax' },
    'NM': { federal: 0, state: 0.05125, total: 0.05125, name: 'Tax' },
    'NY': { federal: 0, state: 0.08, total: 0.08, name: 'Tax' },
    'NC': { federal: 0, state: 0.0475, total: 0.0475, name: 'Tax' },
    'ND': { federal: 0, state: 0.05, total: 0.05, name: 'Tax' },
    'OH': { federal: 0, state: 0.0575, total: 0.0575, name: 'Tax' },
    'OK': { federal: 0, state: 0.045, total: 0.045, name: 'Tax' },
    'OR': { federal: 0, state: 0.00, total: 0.00, name: 'Tax' },
    'PA': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    'RI': { federal: 0, state: 0.07, total: 0.07, name: 'Tax' },
    'SC': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    'SD': { federal: 0, state: 0.045, total: 0.045, name: 'Tax' },
    'TN': { federal: 0, state: 0.07, total: 0.07, name: 'Tax' },
    'TX': { federal: 0, state: 0.0625, total: 0.0625, name: 'Tax' },
    'UT': { federal: 0, state: 0.061, total: 0.061, name: 'Tax' },
    'VT': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    'VA': { federal: 0, state: 0.053, total: 0.053, name: 'Tax' },
    'WA': { federal: 0, state: 0.065, total: 0.065, name: 'Tax' },
    'WV': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    'WI': { federal: 0, state: 0.05, total: 0.05, name: 'Tax' },
    'WY': { federal: 0, state: 0.04, total: 0.04, name: 'Tax' },
    'DC': { federal: 0, state: 0.06, total: 0.06, name: 'Tax' },
    // US Territories
    'PR': { federal: 0, state: 0.105, total: 0.105, name: 'Tax' },
    'VI': { federal: 0, state: 0.04, total: 0.04, name: 'Tax' },
    'GU': { federal: 0, state: 0.04, total: 0.04, name: 'Tax' },
    'AS': { federal: 0, state: 0.00, total: 0.00, name: 'Tax' },
    'MP': { federal: 0, state: 0.00, total: 0.00, name: 'Tax' }
  };

  return rates[state] || { federal: 0, state: 0.05, total: 0.05, name: 'Tax' };
}