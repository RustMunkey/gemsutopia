import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

// GET /api/auctions - Get all auctions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const status = searchParams.get('status');

    // If includeInactive is requested, verify admin token
    if (includeInactive && !verifyAdminToken(request)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required to include inactive auctions' },
        { status: 401 }
      );
    }

    console.log('GET /api/auctions - includeInactive:', includeInactive);

    // Use admin client if requesting inactive auctions (admin only)
    // Update auction statuses before fetching
    const now = new Date().toISOString();
    
    // Update pending auctions to active if start time has passed
    await supabaseAdmin
      .from('auctions')
      .update({ status: 'active' })
      .eq('status', 'pending')
      .lte('start_time', now)
      .gt('end_time', now);
    
    // Update active auctions to ended if end time has passed  
    await supabaseAdmin
      .from('auctions')
      .update({ status: 'ended' })
      .eq('status', 'active')
      .lte('end_time', now);

    const client = includeInactive ? supabaseAdmin : supabase;
    
    let query = client
      .from('auctions')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: auctions, error } = await query;

    if (error) {
      console.error('Error fetching auctions:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch auctions' },
        { status: 500 }
      );
    }

    console.log(`Returning ${auctions?.length || 0} auctions`);

    return NextResponse.json({
      success: true,
      auctions: auctions || [],
      count: auctions?.length || 0
    });

  } catch (error) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}

// POST /api/auctions - Create new auction (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      console.log('Unauthorized auction creation attempt');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log('Received auction creation data:', data);

    // Validate required fields
    if (!data.title || !data.starting_bid || !data.start_time || !data.end_time) {
      return NextResponse.json(
        { success: false, message: 'Title, starting bid, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const startingBid = parseFloat(data.starting_bid);
    const reservePrice = data.reserve_price ? parseFloat(data.reserve_price) : null;

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

    // Validate dates
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);

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

    // Determine initial status based on start time
    const now = new Date();
    let initialStatus = 'pending';
    if (startTime <= now && endTime > now) {
      initialStatus = 'active';
    } else if (endTime <= now) {
      initialStatus = 'ended';
    }

    // Prepare auction data
    const auctionData = {
      title: data.title,
      description: data.description || null,
      images: data.images || [],
      video_url: data.video_url || null,
      featured_image_index: data.featured_image_index || 0,
      starting_bid: startingBid,
      current_bid: startingBid, // Initialize current bid to starting bid
      reserve_price: reservePrice,
      bid_count: 0,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: initialStatus,
      is_active: data.is_active !== false,
      metadata: data.metadata || {}
    };

    console.log('Prepared auction data for database:', auctionData);

    const { data: newAuction, error } = await supabaseAdmin
      .from('auctions')
      .insert([auctionData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating auction:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        auctionData: auctionData
      });
      return NextResponse.json(
        { success: false, message: `Failed to create auction: ${error.message || error.details || 'Unknown error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Auction created successfully',
      auction: newAuction
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating auction:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create auction' },
      { status: 500 }
    );
  }
}