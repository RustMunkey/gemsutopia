import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/categories - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';
    
    let query = supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        image_url,
        sort_order,
        is_active,
        created_at,
        updated_at
      `)
      .order('sort_order', { ascending: true });
    
    // By default, only show active categories
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data: categories, error } = await query;
    
    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      categories: categories || []
    });
    
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();
    
    const { name, description, image_url, sort_order, is_active } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert([{
        name: name.trim(),
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        sort_order: sort_order || 0,
        is_active: is_active !== undefined ? is_active : true
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating category:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      category
    }, { status: 201 });
    
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}