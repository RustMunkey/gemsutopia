import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify admin JWT token
function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: featuredProducts, error } = await supabase
      .from('featured_products')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching featured products:', error);
      return NextResponse.json({ error: 'Failed to fetch featured products' }, { status: 500 });
    }

    return NextResponse.json(featuredProducts);
  } catch (error) {
    console.error('Error in GET /api/admin/featured-products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      description,
      image_url,
      card_color,
      price,
      original_price,
      product_id,
      sort_order,
      is_active
    } = body;

    if (!name || !type || !image_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('featured_products')
      .insert({
        name,
        type,
        description,
        image_url,
        card_color,
        price: price ? parseFloat(price) : null,
        original_price: original_price ? parseFloat(original_price) : null,
        product_id: product_id ? parseInt(product_id) : null,
        sort_order: sort_order || 0,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating featured product:', error);
      return NextResponse.json({ error: 'Failed to create featured product' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/featured-products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      type,
      description,
      image_url,
      card_color,
      price,
      original_price,
      product_id,
      sort_order,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (card_color !== undefined) updateData.card_color = card_color;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (original_price !== undefined) updateData.original_price = original_price ? parseFloat(original_price) : null;
    if (product_id !== undefined) updateData.product_id = product_id ? parseInt(product_id) : null;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('featured_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating featured product:', error);
      return NextResponse.json({ error: 'Failed to update featured product' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/featured-products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('featured_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting featured product:', error);
      return NextResponse.json({ error: 'Failed to delete featured product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/featured-products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}