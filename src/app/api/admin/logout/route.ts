import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  
  // Clear the httpOnly admin cookie
  response.cookies.delete('admin-token');
  
  return response;
}