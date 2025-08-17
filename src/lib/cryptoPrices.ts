interface CryptoPrices {
  bitcoin: { usd: number; cad: number };
  ethereum: { usd: number; cad: number };
  solana: { usd: number; cad: number };
}

interface CoinGeckoResponse {
  bitcoin: { usd: number; cad: number };
  ethereum: { usd: number; cad: number };
  solana: { usd: number; cad: number };
}

export async function fetchCryptoPrices(): Promise<CryptoPrices> {
  try {
    const response = await fetch('/api/crypto-prices', {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache' // Ensure fresh prices
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CryptoPrices = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    
    // Fallback to approximate prices if API fails
    return {
      bitcoin: { usd: 43000, cad: 58000 },
      ethereum: { usd: 2300, cad: 3100 },
      solana: { usd: 85, cad: 115 }
    };
  }
}

export function calculateCryptoAmount(
  fiatAmount: number,
  cryptoSymbol: 'BTC' | 'ETH' | 'SOL',
  currency: 'USD' | 'CAD',
  prices: CryptoPrices
): number {
  const currencyKey = currency.toLowerCase() as 'usd' | 'cad';
  
  switch (cryptoSymbol) {
    case 'BTC':
      return fiatAmount / prices.bitcoin[currencyKey];
    case 'ETH':
      return fiatAmount / prices.ethereum[currencyKey];
    case 'SOL':
      return fiatAmount / prices.solana[currencyKey];
    default:
      throw new Error(`Unsupported crypto symbol: ${cryptoSymbol}`);
  }
}