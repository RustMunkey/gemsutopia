import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { bid_amount } = await request.json();

    // Validate input
    if (!bid_amount || typeof bid_amount !== 'number' || bid_amount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid bid amount'
      }, { status: 400 });
    }

    // Get the current auction details
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single();

    if (auctionError || !auction) {
      return NextResponse.json({
        success: false,
        message: 'Auction not found'
      }, { status: 404 });
    }

    // Check if auction is active and hasn't ended
    const now = new Date();
    const endTime = new Date(auction.end_time);

    if (!auction.is_active || auction.status !== 'active' || endTime <= now) {
      return NextResponse.json({
        success: false,
        message: 'Auction is not active or has ended'
      }, { status: 400 });
    }

    // Check if bid amount is higher than current bid
    const minBidAmount = auction.current_bid + 1;
    if (bid_amount < minBidAmount) {
      return NextResponse.json({
        success: false,
        message: `Bid must be at least $${minBidAmount.toFixed(2)}`
      }, { status: 400 });
    }

    // Start a transaction to update auction and create bid record
    const { data: updatedAuction, error: updateError } = await supabase
      .from('auctions')
      .update({
        current_bid: bid_amount,
        bid_count: auction.bid_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating auction:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Failed to place bid'
      }, { status: 500 });
    }

    // TODO: In a real implementation, you would also:
    // 1. Create a bid record in a separate 'bids' table
    // 2. Track the bidder's information
    // 3. Send notifications to other bidders
    // 4. Implement bidding history

    return NextResponse.json({
      success: true,
      message: 'Bid placed successfully',
      auction: updatedAuction
    });

  } catch (error) {
    console.error('Bid placement error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}