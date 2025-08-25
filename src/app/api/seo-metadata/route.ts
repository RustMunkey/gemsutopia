import { NextResponse } from 'next/server';
import { getSEOMetadata } from '@/lib/utils/seoMetadata';

export async function GET() {
  try {
    // Return public SEO metadata (no auth required)
    return NextResponse.json(getSEOMetadata());
  } catch (error) {
    console.error('SEO metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEO metadata' }, 
      { status: 500 }
    );
  }
}