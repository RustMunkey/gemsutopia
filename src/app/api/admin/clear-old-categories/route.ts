import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyAdminToken(request: NextRequest): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// POST /api/admin/clear-old-categories - Clear old category field values from all products
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Clearing old category field values from all products...');

    // Update all products to clear the old category field
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ category: 'uncategorized' }) // Set to default value to satisfy NOT NULL constraint
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This condition ensures we update all products

    if (error) {
      console.error('Error clearing old categories:', error);
      return NextResponse.json(
        { success: false, message: `Failed to clear categories: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Successfully cleared old category values from all products');

    return NextResponse.json({
      success: true,
      message: 'Successfully cleared old category field values from all products',
      updatedCount: data?.length || 'all products'
    });

  } catch (error) {
    console.error('Clear categories error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}