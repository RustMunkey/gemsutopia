import { NextResponse } from 'next/server';
import { getSiteInfo } from '@/lib/utils/siteInfo';

export async function GET() {
  try {
    // Return public site information (no auth required)
    const siteInfo = await getSiteInfo();
    return NextResponse.json(siteInfo);
  } catch (error) {
    console.error('Site info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site info' }, 
      { status: 500 }
    );
  }
}