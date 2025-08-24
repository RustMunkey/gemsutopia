import { NextRequest, NextResponse } from 'next/server';
import TaxJar from 'taxjar';

const client = new TaxJar({
  apiKey: process.env.TAXJAR_API_KEY || 'test',
  apiUrl: process.env.NODE_ENV === 'production' 
    ? TaxJar.DEFAULT_API_URL 
    : TaxJar.SANDBOX_API_URL
});

export async function POST(request: NextRequest) {
  try {
    const { subtotal, country, state, city, zipCode, address } = await request.json();

    if (!subtotal || !country || !state) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedCountry = country.toLowerCase();
    const normalizedState = state.toUpperCase();

    let taxRate;
    
    try {
      if (normalizedCountry === 'canada' || normalizedCountry === 'ca') {
        taxRate = await calculateCanadianTax(normalizedState, city, zipCode, address);
      } else if (normalizedCountry === 'united states' || normalizedCountry === 'us' || normalizedCountry === 'usa') {
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
      taxRate = getFallbackTaxRate(normalizedCountry, normalizedState);
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
    'AL': { federal: 0, state: 0.04, total: 0.04, name: 'State Sales Tax' },
    'AK': { federal: 0, state: 0.00, total: 0.00, name: 'No Sales Tax' },
    'AZ': { federal: 0, state: 0.056, total: 0.056, name: 'State Sales Tax' },
    'AR': { federal: 0, state: 0.065, total: 0.065, name: 'State Sales Tax' },
    'CA': { federal: 0, state: 0.0725, total: 0.0725, name: 'State Sales Tax' },
    'CO': { federal: 0, state: 0.029, total: 0.029, name: 'State Sales Tax' },
    'CT': { federal: 0, state: 0.0635, total: 0.0635, name: 'State Sales Tax' },
    'DE': { federal: 0, state: 0.00, total: 0.00, name: 'No Sales Tax' },
    'FL': { federal: 0, state: 0.06, total: 0.06, name: 'State Sales Tax' },
    'GA': { federal: 0, state: 0.04, total: 0.04, name: 'State Sales Tax' }
    // Add more states as needed...
  };

  return rates[state] || { federal: 0, state: 0.05, total: 0.05, name: 'State Sales Tax' };
}