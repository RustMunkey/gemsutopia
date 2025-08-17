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
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    
    // Return fallback prices if API fails
    const fallbackPrices = {
      bitcoin: { usd: 43000, cad: 58000 },
      ethereum: { usd: 2300, cad: 3100 },
      solana: { usd: 85, cad: 115 }
    };
    
    return NextResponse.json(fallbackPrices);
  }
}