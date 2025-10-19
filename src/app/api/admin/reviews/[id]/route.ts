import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase';

import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';



const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Verify admin token
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

// PUT /api/admin/reviews/[id] - Update review (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Prepare update data (only include fields that are provided)
    const updateData: Record<string, unknown> = {};
    
    if (data.is_approved !== undefined) updateData.is_approved = data.is_approved;
    if (data.is_featured !== undefined) updateData.is_featured = data.is_featured;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.customer_name !== undefined) updateData.customer_name = data.customer_name;
    if (data.rating !== undefined) updateData.rating = parseInt(data.rating);
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;

    const { data: updatedReview, error } = await supabaseAdmin
      .from('reviews')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/[id] - Delete review (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // Permanent delete
      const { error } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('id', resolvedParams.id);

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to delete review' },
          { status: 500 }
        );
      }
    } else {
      // Soft delete (mark as inactive)
      const { error } = await supabaseAdmin
        .from('reviews')
        .update({ is_active: false })
        .eq('id', resolvedParams.id);

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to deactivate review' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Review deleted permanently' : 'Review deactivated'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete review' },
      { status: 500 }
    );
  }
}