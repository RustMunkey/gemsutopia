import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gem-admin-super-secret-jwt-key-2024-change-this-in-production';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// GET /api/auctions/[id] - Get single auction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: auction, error } = await supabaseAdmin
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching auction:', error);
      return NextResponse.json(
        { success: false, message: 'Auction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      auction: auction
    });

  } catch (error) {
    console.error('Error fetching auction:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch auction' },
      { status: 500 }
    );
  }
}

// PUT /api/auctions/[id] - Update auction (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Get existing auction first
    const { data: existingAuction, error: fetchError } = await supabaseAdmin
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Auction not found' },
        { status: 404 }
      );
    }

    // Validate numeric fields if provided
    const startingBid = data.starting_bid ? parseFloat(data.starting_bid) : existingAuction.starting_bid;
    const reservePrice = data.reserve_price !== undefined ? 
      (data.reserve_price ? parseFloat(data.reserve_price) : null) : 
      existingAuction.reserve_price;

    if (startingBid < 0) {
      return NextResponse.json(
        { success: false, message: 'Starting bid must be greater than or equal to 0' },
        { status: 400 }
      );
    }

    if (reservePrice && reservePrice < startingBid) {
      return NextResponse.json(
        { success: false, message: 'Reserve price must be greater than or equal to starting bid' },
        { status: 400 }
      );
    }

    // Validate dates if provided
    const startTime = data.start_time ? new Date(data.start_time) : new Date(existingAuction.start_time);
    const endTime = data.end_time ? new Date(data.end_time) : new Date(existingAuction.end_time);

    if (endTime <= startTime) {
      return NextResponse.json(
        { success: false, message: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check if auction duration is reasonable (max 1 month)
    const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    if (endTime.getTime() - startTime.getTime() > maxDuration) {
      return NextResponse.json(
        { success: false, message: 'Auction duration cannot exceed 30 days' },
        { status: 400 }
      );
    }

    // Update status based on new times if changed
    let newStatus = data.status || existingAuction.status;
    if (data.start_time || data.end_time) {
      const now = new Date();
      if (startTime <= now && endTime > now) {
        newStatus = 'active';
      } else if (endTime <= now) {
        newStatus = 'ended';
      } else if (startTime > now) {
        newStatus = 'pending';
      }
    }

    // Prepare update data - only include fields that are provided
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.video_url !== undefined) updateData.video_url = data.video_url;
    if (data.featured_image_index !== undefined) updateData.featured_image_index = data.featured_image_index;
    if (data.starting_bid !== undefined) updateData.starting_bid = startingBid;
    if (data.reserve_price !== undefined) updateData.reserve_price = reservePrice;
    if (data.start_time !== undefined) updateData.start_time = startTime.toISOString();
    if (data.end_time !== undefined) updateData.end_time = endTime.toISOString();
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    
    updateData.status = newStatus;

    const { data: updatedAuction, error } = await supabaseAdmin
      .from('auctions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating auction:', error);
      return NextResponse.json(
        { success: false, message: `Failed to update auction: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Auction updated successfully',
      auction: updatedAuction
    });

  } catch (error) {
    console.error('Error updating auction:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update auction' },
      { status: 500 }
    );
  }
}

// DELETE /api/auctions/[id] - Delete auction (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if auction exists and has no bids before allowing deletion
    const { data: auction, error: fetchError } = await supabaseAdmin
      .from('auctions')
      .select('bid_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, message: 'Auction not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if auction has bids (for data integrity)
    if (auction.bid_count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete auction with existing bids. Consider setting it as inactive instead.' 
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('auctions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error deleting auction:', error);
      return NextResponse.json(
        { success: false, message: `Failed to delete auction: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Auction deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting auction:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete auction' },
      { status: 500 }
    );
  }
}