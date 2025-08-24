// Tax rates for different locations
export interface TaxRate {
  federal: number;
  provincial?: number;
  state?: number;
  total: number;
  name: string;
}

// Canadian provincial tax rates (2024)
const CANADIAN_TAX_RATES: Record<string, TaxRate> = {
  'AB': { federal: 0.05, provincial: 0.00, total: 0.05, name: 'GST' }, // Alberta - GST only
  'BC': { federal: 0.05, provincial: 0.07, total: 0.12, name: 'GST + PST' }, // British Columbia
  'MB': { federal: 0.05, provincial: 0.07, total: 0.12, name: 'GST + PST' }, // Manitoba
  'NB': { federal: 0.15, total: 0.15, name: 'HST' }, // New Brunswick - HST
  'NL': { federal: 0.15, total: 0.15, name: 'HST' }, // Newfoundland and Labrador
  'NT': { federal: 0.05, total: 0.05, name: 'GST' }, // Northwest Territories
  'NS': { federal: 0.15, total: 0.15, name: 'HST' }, // Nova Scotia
  'NU': { federal: 0.05, total: 0.05, name: 'GST' }, // Nunavut
  'ON': { federal: 0.13, total: 0.13, name: 'HST' }, // Ontario - HST
  'PE': { federal: 0.15, total: 0.15, name: 'HST' }, // Prince Edward Island
  'QC': { federal: 0.05, provincial: 0.09975, total: 0.14975, name: 'GST + QST' }, // Quebec
  'SK': { federal: 0.05, provincial: 0.06, total: 0.11, name: 'GST + PST' }, // Saskatchewan
  'YT': { federal: 0.05, total: 0.05, name: 'GST' }, // Yukon
};

// US state tax rates (approximate averages - in practice you'd use a real tax API)
const US_TAX_RATES: Record<string, TaxRate> = {
  'AL': { state: 0.04, total: 0.04, name: 'State Sales Tax' }, // Alabama
  'AK': { state: 0.00, total: 0.00, name: 'No Sales Tax' }, // Alaska
  'AZ': { state: 0.056, total: 0.056, name: 'State Sales Tax' }, // Arizona
  'AR': { state: 0.065, total: 0.065, name: 'State Sales Tax' }, // Arkansas
  'CA': { state: 0.0725, total: 0.0725, name: 'State Sales Tax' }, // California
  'CO': { state: 0.029, total: 0.029, name: 'State Sales Tax' }, // Colorado
  'CT': { state: 0.0635, total: 0.0635, name: 'State Sales Tax' }, // Connecticut
  'DE': { state: 0.00, total: 0.00, name: 'No Sales Tax' }, // Delaware
  'FL': { state: 0.06, total: 0.06, name: 'State Sales Tax' }, // Florida
  'GA': { state: 0.04, total: 0.04, name: 'State Sales Tax' }, // Georgia
  'HI': { state: 0.04, total: 0.04, name: 'State Sales Tax' }, // Hawaii
  'ID': { state: 0.06, total: 0.06, name: 'State Sales Tax' }, // Idaho
  'IL': { state: 0.0625, total: 0.0625, name: 'State Sales Tax' }, // Illinois
  'IN': { state: 0.07, total: 0.07, name: 'State Sales Tax' }, // Indiana
  'IA': { state: 0.06, total: 0.06, name: 'State Sales Tax' }, // Iowa
  'KS': { state: 0.065, total: 0.065, name: 'State Sales Tax' }, // Kansas
  'KY': { state: 0.06, total: 0.06, name: 'State Sales Tax' }, // Kentucky
  'LA': { state: 0.0445, total: 0.0445, name: 'State Sales Tax' }, // Louisiana
  'ME': { state: 0.055, total: 0.055, name: 'State Sales Tax' }, // Maine
  'MD': { state: 0.06, total: 0.06, name: 'State Sales Tax' }, // Maryland
  'MA': { state: 0.0625, total: 0.0625, name: 'State Sales Tax' }, // Massachusetts
  'MI': { state: 0.06, total: 0.06, name: 'State Sales Tax' }, // Michigan
  'MN': { state: 0.06875, total: 0.06875, name: 'State Sales Tax' }, // Minnesota
  'MS': { state: 0.07, total: 0.07, name: 'State Sales Tax' }, // Mississippi
  'MO': { state: 0.0423, total: 0.0423, name: 'State Sales Tax' }, // Missouri
  'MT': { state: 0.00, total: 0.00, name: 'No Sales Tax' }, // Montana
  'NE': { state: 0.055, total: 0.055, name: 'State Sales Tax' }, // Nebraska
  'NV': { state: 0.0685, total: 0.0685, name: 'State Sales Tax' }, // Nevada
  'NH': { state: 0.00, total: 0.00, name: 'No Sales Tax' }, // New Hampshire
  'NJ': { state: 0.06625, total: 0.06625, name: 'State Sales Tax' }, // New Jersey
  'NM': { state: 0.05, total: 0.05, name: 'State Sales Tax' }, // New Mexico
  'NY': { state: 0.04, total: 0.04, name: 'State Sales Tax' }, // New York (base rate)
  'NC': { state: 0.0475, total: 0.0475, name: 'State Sales Tax' }, // North Carolina
  'ND': { state: 0.05, total: 0.05, name: 'State Sales Tax' }, // North Dakota
  'OH': { state: 0.0575, total: 0.0575, name: 'State Sales Tax' }, // Ohio
  'OK': { state: 0.045, total: 0.045, name: 'State Sales Tax' }, // Oklahoma
  'OR': { state: 0.00, total: 0.00, name: 'No Sales Tax' }, // Oregon
  'PA': { state: 0.06, total: 0.06, name: 'State Sales Tax' }, // Pennsylvania
  'RI': { state: 0.07, total: 0.07, name: 'State Sales Tax' }, // Rhode Island
  'SC': { state: 0.06, total: 0.06, name: 'State Sales Tax' }, // South Carolina
  'SD': { state: 0.045, total: 0.045, name: 'State Sales Tax' }, // South Dakota
  'TN': { state: 0.07, total: 0.07, name: 'State Sales Tax' }, // Tennessee
  'TX': { state: 0.0625, total: 0.0625, name: 'State Sales Tax' }, // Texas
  'UT': { state: 0.047, total: 0.047, name: 'State Sales Tax' }, // Utah
  'VT': { state: 0.06, total: 0.06, name: 'State Sales Tax' }, // Vermont
  'VA': { state: 0.053, total: 0.053, name: 'State Sales Tax' }, // Virginia
  'WA': { state: 0.065, total: 0.065, name: 'State Sales Tax' }, // Washington
  'WV': { state: 0.06, total: 0.06, name: 'State Sales Tax' }, // West Virginia
  'WI': { state: 0.05, total: 0.05, name: 'State Sales Tax' }, // Wisconsin
  'WY': { state: 0.04, total: 0.04, name: 'State Sales Tax' }, // Wyoming
};

export function calculateTaxRate(country: string, state: string): TaxRate {
  // Normalize inputs
  const normalizedCountry = country.toUpperCase();
  const normalizedState = state.toUpperCase();

  if (normalizedCountry === 'CA' || normalizedCountry === 'CANADA') {
    return CANADIAN_TAX_RATES[normalizedState] || CANADIAN_TAX_RATES['ON']; // Default to Ontario
  } else if (normalizedCountry === 'US' || normalizedCountry === 'USA' || normalizedCountry === 'UNITED STATES') {
    return US_TAX_RATES[normalizedState] || { state: 0.06, total: 0.06, name: 'State Sales Tax' }; // Default 6%
  } else {
    // International - no tax for now
    return { total: 0, name: 'International (Tax-free)' };
  }
}

export function calculateTax(subtotal: number, country: string, state: string): { amount: number; rate: TaxRate } {
  const rate = calculateTaxRate(country, state);
  return {
    amount: subtotal * rate.total,
    rate
  };
}