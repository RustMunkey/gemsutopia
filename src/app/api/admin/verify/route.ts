import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';



const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string; name: string };
      return NextResponse.json({
        valid: true,
        email: decoded.email,
        name: decoded.name
      });
    } catch {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}