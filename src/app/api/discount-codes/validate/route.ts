import { NextRequest, NextResponse } from 'next/server';
import { validateDiscountCode } from '@/lib/database/discountCodes';

export async function POST(request: NextRequest) {
  try {
    const { code, orderTotal } = await request.json();

    if (!code || typeof orderTotal !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await validateDiscountCode(code, orderTotal);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Discount code validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}