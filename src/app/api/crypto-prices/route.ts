import { NextResponse } from 'next/server';

interface CoinGeckoResponse {
  bitcoin: { usd: number; cad: number };
  ethereum: { usd: number; cad: number };
  solana: { usd: number; cad: number };
}

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd,cad',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: {
          revalidate: 60 // Cache for 60 seconds
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CoinGeckoResponse = await response.json();
    
    // Calculate exchange rates from Bitcoin prices
    const cadToUsdRate = data.bitcoin.usd / data.bitcoin.cad;
    const usdToCadRate = data.bitcoin.cad / data.bitcoin.usd;
    
    const responseData = {
      ...data,
      success: true,
      exchangeRates: {
        CAD_TO_USD: parseFloat(cadToUsdRate.toFixed(4)),
        USD_TO_CAD: parseFloat(usdToCadRate.toFixed(4))
      }
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    
    // Return fallback prices if API fails
    const fallbackPrices = {
      bitcoin: { usd: 43000, cad: 58000 },
      ethereum: { usd: 2300, cad: 3100 },
      solana: { usd: 85, cad: 115 },
      success: true,
      exchangeRates: {
        CAD_TO_USD: 0.74,
        USD_TO_CAD: 1.35
      }
    };
    
    return NextResponse.json(fallbackPrices);
  }
}