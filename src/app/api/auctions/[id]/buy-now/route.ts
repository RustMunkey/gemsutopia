import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';



export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { buy_now_price } = await request.json();

    // Validate input
    if (!buy_now_price || typeof buy_now_price !== 'number' || buy_now_price <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid buy now price'
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

    // Validate Buy Now price logic
    let expectedBuyNowPrice: number;

    if (!auction.reserve_price) {
      // No reserve: Buy Now = current bid + $10
      expectedBuyNowPrice = auction.current_bid + 10;
    } else if (auction.current_bid < auction.reserve_price) {
      // Reserve not met: Buy Now = reserve price
      expectedBuyNowPrice = auction.reserve_price;
    } else {
      // Reserve met: Buy Now = current bid + $10
      expectedBuyNowPrice = auction.current_bid + 10;
    }

    // Allow small floating point differences
    if (Math.abs(buy_now_price - expectedBuyNowPrice) > 0.01) {
      return NextResponse.json({
        success: false,
        message: `Invalid buy now price. Expected $${expectedBuyNowPrice.toFixed(2)}`
      }, { status: 400 });
    }

    // Check reserve price requirement for instant purchase
    if (auction.reserve_price && buy_now_price < auction.reserve_price) {
      return NextResponse.json({
        success: false,
        message: `Buy now price must meet reserve price of $${auction.reserve_price.toFixed(2)}`
      }, { status: 400 });
    }

    // End the auction and set the final price
    const { data: updatedAuction, error: updateError } = await supabase
      .from('auctions')
      .update({
        current_bid: buy_now_price,
        status: 'ended',
        is_active: false,
        end_time: new Date().toISOString(), // Mark as ended now
        updated_at: new Date().toISOString(),
        metadata: {
          ...auction.metadata,
          ended_by_buy_now: true,
          buy_now_price: buy_now_price
        }
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error ending auction:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Failed to complete buy now purchase'
      }, { status: 500 });
    }

    // TODO: In a real implementation, you would also:
    // 1. Create a purchase record
    // 2. Process payment
    // 3. Send confirmation emails
    // 4. Update inventory
    // 5. Notify other bidders that auction ended

    return NextResponse.json({
      success: true,
      message: 'Purchase completed successfully',
      auction: updatedAuction,
      final_price: buy_now_price
    });

  } catch (error) {
    console.error('Buy now error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}