import { NextRequest } from 'next/server';
import { db, auctions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { notifyAuctionWon, notifyAuctionLost } from '@/lib/email';
import { apiSuccess, ApiError } from '@/lib/api';
import { invalidateAuctionsCaches } from '@/lib/cache';
import { triggerAuctionEnded } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { buy_now_price, buyer_email, buyer_name } = await request.json();

    // Validate input
    if (!buy_now_price || typeof buy_now_price !== 'number' || buy_now_price <= 0) {
      return ApiError.validation('Invalid buy now price');
    }

    // Get the current auction details
    const auction = await db.query.auctions.findFirst({
      where: eq(auctions.id, id),
    });

    if (!auction) {
      return ApiError.notFound('Auction');
    }

    // Check if auction is active and hasn't ended
    const now = new Date();
    const endTime = new Date(auction.endTime);

    if (!auction.isActive || auction.status !== 'active' || endTime <= now) {
      return ApiError.badRequest('Auction is not active or has ended');
    }

    // Validate Buy Now price logic
    const currentBidValue = parseFloat(auction.currentBid || '0');
    const reservePriceValue = auction.reservePrice ? parseFloat(auction.reservePrice) : null;
    let expectedBuyNowPrice: number;

    if (!reservePriceValue) {
      // No reserve: Buy Now = current bid + $10
      expectedBuyNowPrice = currentBidValue + 10;
    } else if (currentBidValue < reservePriceValue) {
      // Reserve not met: Buy Now = reserve price
      expectedBuyNowPrice = reservePriceValue;
    } else {
      // Reserve met: Buy Now = current bid + $10
      expectedBuyNowPrice = currentBidValue + 10;
    }

    // Allow small floating point differences
    if (Math.abs(buy_now_price - expectedBuyNowPrice) > 0.01) {
      return ApiError.validation(`Invalid buy now price. Expected $${expectedBuyNowPrice.toFixed(2)}`);
    }

    // Check reserve price requirement for instant purchase
    if (reservePriceValue && buy_now_price < reservePriceValue) {
      return ApiError.validation(`Buy now price must meet reserve price of $${reservePriceValue.toFixed(2)}`);
    }

    // Get previous bidder info (if any) before updating
    const existingMetadata = (auction.metadata as Record<string, unknown>) || {};
    const previousBidderEmail = existingMetadata.lastBidderEmail as string | undefined;
    const previousBidderName = existingMetadata.lastBidderName as string | undefined;
    const previousBidAmount = parseFloat(auction.currentBid || '0');

    // End the auction and set the final price
    const [updatedAuction] = await db
      .update(auctions)
      .set({
        currentBid: String(buy_now_price),
        status: 'ended',
        isActive: false,
        endTime: new Date().toISOString(), // Mark as ended now
        updatedAt: new Date().toISOString(),
        metadata: {
          ...existingMetadata,
          ended_by_buy_now: true,
          buy_now_price: buy_now_price,
          winnerEmail: buyer_email || null,
          winnerName: buyer_name || null,
        },
      })
      .where(eq(auctions.id, id))
      .returning();

    if (!updatedAuction) {
      return ApiError.internal('Failed to complete buy now purchase');
    }

    // Invalidate auctions cache (auction ended)
    await invalidateAuctionsCaches();

    // Trigger real-time auction ended event via Pusher (non-blocking)
    triggerAuctionEnded(id, {
      finalBid: buy_now_price,
      winnerName: buyer_name,
      endedByBuyNow: true,
    }).catch(() => {
      // Pusher event failed - don't block response
    });

    // Get featured image for email
    const images = Array.isArray(auction.images) ? auction.images : [];
    const featuredImageIndex = auction.featuredImageIndex || 0;
    const featuredImage = images[featuredImageIndex] as string | undefined;

    // Send auction won notification to buyer (non-blocking)
    if (buyer_email) {
      notifyAuctionWon(buyer_name || 'Winner', buyer_email, {
        auctionId: auction.id,
        title: auction.title,
        imageUrl: featuredImage,
        currentBid: buy_now_price,
        userBid: buy_now_price,
        endTime: new Date().toISOString(),
        currency: 'CAD',
      }).catch(() => {
        // Email sending failed - don't block response
      });
    }

    // Notify previous bidder that auction ended (if they exist and aren't the buyer)
    if (previousBidderEmail && previousBidderEmail !== buyer_email && previousBidAmount > 0) {
      notifyAuctionLost(previousBidderName || 'Bidder', previousBidderEmail, {
        auctionId: auction.id,
        title: auction.title,
        imageUrl: featuredImage,
        currentBid: buy_now_price,
        userBid: previousBidAmount,
        endTime: new Date().toISOString(),
        currency: 'CAD',
      }).catch(() => {
        // Email sending failed - don't block response
      });
    }

    return apiSuccess(
      { auction: updatedAuction, final_price: buy_now_price },
      'Purchase completed successfully'
    );
  } catch {
    return ApiError.internal('Failed to process buy now purchase');
  }
}
