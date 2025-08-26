import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const country = searchParams.get('country') || 'Canada';
    
    if (!query || query.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    // Use OpenStreetMap Nominatim API (free, no API key required)
    const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      addressdetails: '1',
      countrycodes: country === 'Canada' ? 'ca' : 'us'
    });
    
    const response = await fetch(`${nominatimUrl}?${params}`, {
      headers: {
        'User-Agent': 'GemSutopia/1.0 (contact@gemsutopia.com)'
      }
    });
    
    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return NextResponse.json({ suggestions: [] });
    }
    
    const results = await response.json();
    const suggestions = results.map((result: any) => result.display_name).slice(0, 5);
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Address suggestions API error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}