import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      data: null,
      message: 'Logged out successfully',
    },
    { status: 200 }
  );

  // Clear the httpOnly admin cookie
  response.cookies.delete('admin-token');

  return response;
}
