import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, rateLimit, validateAndSanitize } from '@/lib/auth/adminAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔐 SECURE GET - Admin auth required + Rate limited
async function getStatsHandler() {
  try {
    const { data: stats, error } = await supabase
      .from('stats')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching stats:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch stats',
        code: 'DATABASE_ERROR' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /api/admin/stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// 🔐 SECURE POST - Admin auth + Rate limit + Input validation
async function postStatsHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      value,
      description,
      icon,
      data_source,
      is_real_time,
      sort_order,
      is_active
    } = body;

    // Input validation
    if (!title || !value) {
      return NextResponse.json({ 
        error: 'Missing required fields: title and value',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (typeof title !== 'string' || title.length > 200) {
      return NextResponse.json({ 
        error: 'Title must be a string with max 200 characters',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('stats')
      .insert({
        title: title.trim(),
        value: String(value).trim(),
        description: description?.trim(),
        icon: icon?.trim(),
        data_source: data_source || 'manual',
        is_real_time: Boolean(is_real_time),
        sort_order: Number(sort_order) || 0,
        is_active: is_active !== undefined ? Boolean(is_active) : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating stat:', error);
      return NextResponse.json({ 
        error: 'Failed to create stat',
        code: 'DATABASE_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Stat created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/admin/stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// 🔐 SECURE PUT - Admin auth + Rate limit + Input validation  
async function putStatsHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id || typeof id !== 'number') {
      return NextResponse.json({ 
        error: 'Valid stat ID is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Sanitize update fields
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          updateData[key] = value.trim();
        } else {
          updateData[key] = value;
        }
      }
    }

    const { data, error } = await supabase
      .from('stats')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating stat:', error);
      return NextResponse.json({ 
        error: 'Failed to update stat',
        code: 'DATABASE_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Stat updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// 🔐 SECURE DELETE - Admin auth + Rate limit + Input validation
async function deleteStatsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ 
        error: 'Valid stat ID is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('stats')
      .delete()
      .eq('id', Number(id));

    if (error) {
      console.error('Error deleting stat:', error);
      return NextResponse.json({ 
        error: 'Failed to delete stat',
        code: 'DATABASE_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Stat deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// Apply security middleware to all endpoints
export const GET = rateLimit(50, 15 * 60 * 1000)(requireAdmin(getStatsHandler));
export const POST = rateLimit(10, 15 * 60 * 1000)(validateAndSanitize(requireAdmin(postStatsHandler)));
export const PUT = rateLimit(20, 15 * 60 * 1000)(validateAndSanitize(requireAdmin(putStatsHandler)));
export const DELETE = rateLimit(5, 15 * 60 * 1000)(requireAdmin(deleteStatsHandler));