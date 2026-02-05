import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiError.unauthorized('Invalid or missing token');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string; name: string };
      return apiSuccess({
        valid: true,
        email: decoded.email,
        name: decoded.name,
      });
    } catch {
      return ApiError.unauthorized('Invalid token');
    }
  } catch {
    return ApiError.internal();
  }
}
