import { NextRequest, NextResponse } from 'next/server';
import TaxJar from 'taxjar';

const client = new TaxJar({
  apiKey: process.env.TAXJAR_API_KEY || 'test',
  apiUrl: TaxJar.DEFAULT_API_URL // Always use live production data
});

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
        taxRate = await calculateCanadianTax(normalizedState, city, zipCode, address);
      } else if (effectiveCountry === 'united states' || effectiveCountry === 'us' || effectiveCountry === 'usa') {
        taxRate = await calculateUSTax(normalizedState, city, zipCode, address);
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

async function calculateCanadianTax(
  province: string,
  city?: string,
  postalCode?: string,
  address?: string
) {
  try {
    const params: any = {
      country: 'CA',
      state: province
    };

    if (city) params.city = city;
    if (postalCode) params.zip = postalCode;
    if (address) params.street = address;

    const response = await client.ratesForLocation(postalCode || 'M5V3A8', params);
    
    const rate = response.rate;
    const federal = parseFloat(rate.combined_rate?.toString() || '0') || 0;
    
    // Determine tax name based on province
    let taxName = 'GST';
    if (['ON', 'NB', 'NL', 'NS', 'PE'].includes(province)) {
      taxName = 'HST';
    } else if (['BC', 'SK', 'MB', 'QC'].includes(province)) {
      taxName = 'GST + PST';
    }

    return {
      federal,
      total: federal,
      name: taxName
    };
  } catch (error) {
    console.error('Canadian tax calculation error:', error);
    return getFallbackCanadianTax(province);
  }
}

async function calculateUSTax(
  state: string,
  city?: string,
  zipCode?: string,
  address?: string
) {
  try {
    const params: any = {
      country: 'US',
      state: state
    };

    if (city) params.city = city;
    if (address) params.street = address;

    const response = await client.ratesForLocation(zipCode || '90210', params);
    
    const rate = response.rate;
    const stateRate = parseFloat(rate.state_rate?.toString() || '0') || 0;
    const localRate = parseFloat(rate.combined_district_rate?.toString() || '0') || 0;
    const totalRate = parseFloat(rate.combined_rate?.toString() || '0') || 0;

    return {
      federal: 0, // US doesn't have federal sales tax
      state: stateRate,
      local: localRate,
      total: totalRate,
      name: totalRate === 0 ? 'No Sales Tax' : 'Sales Tax'
    };
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
    'AL': { federal: 0, state: 0.04, total: 0.04, name: 'State Sales Tax' },
    'AK': { federal: 0, state: 0.00, total: 0.00, name: 'No Sales Tax' },
    'AZ': { federal: 0, state: 0.056, total: 0.056, name: 'State Sales Tax' },
    'AR': { federal: 0, state: 0.065, total: 0.065, name: 'State Sales Tax' },
    'CA': { federal: 0, state: 0.0725, total: 0.0725, name: 'State Sales Tax' },
    'CO': { federal: 0, state: 0.029, total: 0.029, name: 'State Sales Tax' },
    'CT': { federal: 0, state: 0.0635, total: 0.0635, name: 'State Sales Tax' },
    'DE': { federal: 0, state: 0.00, total: 0.00, name: 'No Sales Tax' },
    'FL': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'GA': { federal: 0, state: 0.04, total: 0.04, name: 'State Sales Tax' },
    'HI': { federal: 0, state: 0.04, total: 0.04, name: 'State Sales Tax' },
    'ID': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'IL': { federal: 0, state: 0.0625, total: 0.0625, name: 'State Sales Tax' },
    'IN': { federal: 0, state: 0.07, total: 0.07, name: 'State Sales Tax' },
    'IA': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'KS': { federal: 0, state: 0.065, total: 0.065, name: 'State Sales Tax' },
    'KY': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'LA': { federal: 0, state: 0.0445, total: 0.0445, name: 'State Sales Tax' },
    'ME': { federal: 0, state: 0.055, total: 0.055, name: 'State Sales Tax' },
    'MD': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'MA': { federal: 0, state: 0.0625, total: 0.0625, name: 'State Sales Tax' },
    'MI': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'MN': { federal: 0, state: 0.06875, total: 0.06875, name: 'State Sales Tax' },
    'MS': { federal: 0, state: 0.07, total: 0.07, name: 'State Sales Tax' },
    'MO': { federal: 0, state: 0.04225, total: 0.04225, name: 'State Sales Tax' },
    'MT': { federal: 0, state: 0.00, total: 0.00, name: 'No Sales Tax' },
    'NE': { federal: 0, state: 0.055, total: 0.055, name: 'State Sales Tax' },
    'NV': { federal: 0, state: 0.0685, total: 0.0685, name: 'State Sales Tax' },
    'NH': { federal: 0, state: 0.00, total: 0.00, name: 'No Sales Tax' },
    'NJ': { federal: 0, state: 0.06625, total: 0.06625, name: 'State Sales Tax' },
    'NM': { federal: 0, state: 0.05125, total: 0.05125, name: 'State Sales Tax' },
    'NY': { federal: 0, state: 0.08, total: 0.08, name: 'State Sales Tax' },
    'NC': { federal: 0, state: 0.0475, total: 0.0475, name: 'State Sales Tax' },
    'ND': { federal: 0, state: 0.05, total: 0.05, name: 'State Sales Tax' },
    'OH': { federal: 0, state: 0.0575, total: 0.0575, name: 'State Sales Tax' },
    'OK': { federal: 0, state: 0.045, total: 0.045, name: 'State Sales Tax' },
    'OR': { federal: 0, state: 0.00, total: 0.00, name: 'No Sales Tax' },
    'PA': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'RI': { federal: 0, state: 0.07, total: 0.07, name: 'State Sales Tax' },
    'SC': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'SD': { federal: 0, state: 0.045, total: 0.045, name: 'State Sales Tax' },
    'TN': { federal: 0, state: 0.07, total: 0.07, name: 'State Sales Tax' },
    'TX': { federal: 0, state: 0.0625, total: 0.0625, name: 'State Sales Tax' },
    'UT': { federal: 0, state: 0.061, total: 0.061, name: 'State Sales Tax' },
    'VT': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'VA': { federal: 0, state: 0.053, total: 0.053, name: 'State Sales Tax' },
    'WA': { federal: 0, state: 0.065, total: 0.065, name: 'State Sales Tax' },
    'WV': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'WI': { federal: 0, state: 0.05, total: 0.05, name: 'State Sales Tax' },
    'WY': { federal: 0, state: 0.04, total: 0.04, name: 'State Sales Tax' },
    'DC': { federal: 0, state: 0.06, total: 0.06, name: 'District Sales Tax' },
    // US Territories
    'PR': { federal: 0, state: 0.105, total: 0.105, name: 'Sales Tax' },
    'VI': { federal: 0, state: 0.04, total: 0.04, name: 'Sales Tax' },
    'GU': { federal: 0, state: 0.04, total: 0.04, name: 'Sales Tax' },
    'AS': { federal: 0, state: 0.00, total: 0.00, name: 'No Sales Tax' },
    'MP': { federal: 0, state: 0.00, total: 0.00, name: 'No Sales Tax' }
  };

  return rates[state] || { federal: 0, state: 0.05, total: 0.05, name: 'State Sales Tax' };
}