import { NextRequest } from 'next/server';
import { db, auctions, bids } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { notifyBidPlaced, notifyOutbid } from '@/lib/email';
import { apiSuccess, ApiError } from '@/lib/api';
import { invalidateAuctionsCaches } from '@/lib/cache';
import { triggerBidPlaced } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { bid_amount, bidder_email, bidder_name, user_id } = await request.json();

    // Validate input
    if (!bid_amount || typeof bid_amount !== 'number' || bid_amount <= 0) {
      return ApiError.validation('Invalid bid amount');
    }

    if (!bidder_email) {
      return ApiError.validation('Email is required to place a bid');
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

    // Calculate minimum bid using auction's bid increment
    const currentBidValue = parseFloat(auction.currentBid || '0');
    const bidIncrement = parseFloat(auction.bidIncrement || '1');
    const minBidAmount = auction.bidCount === 0
      ? parseFloat(auction.startingBid)
      : currentBidValue + bidIncrement;

    if (bid_amount < minBidAmount) {
      return ApiError.validation(
        `Bid must be at least $${minBidAmount.toFixed(2)} (current bid + $${bidIncrement.toFixed(2)} increment)`
      );
    }

    // Get the current winning bid (if any)
    const currentWinningBid = await db.query.bids.findFirst({
      where: and(eq(bids.auctionId, id), eq(bids.isWinning, true)),
    });

    // Check reserve price status
    const reservePrice = auction.reservePrice ? parseFloat(auction.reservePrice) : null;
    const reserveMet = reservePrice === null || bid_amount >= reservePrice;
    const reserveWasMet = reservePrice === null || currentBidValue >= reservePrice;

    // Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // 1. Mark previous winning bid as outbid
      if (currentWinningBid) {
        await tx
          .update(bids)
          .set({ isWinning: false, status: 'outbid' })
          .where(eq(bids.id, currentWinningBid.id));
      }

      // 2. Insert the new bid
      const [newBid] = await tx
        .insert(bids)
        .values({
          auctionId: id,
          userId: user_id || null,
          bidderEmail: bidder_email,
          bidderName: bidder_name || null,
          amount: String(bid_amount),
          isWinning: true,
          status: 'winning',
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') || null,
          userAgent: request.headers.get('user-agent') || null,
        })
        .returning();

      // 3. Check if we need to auto-extend the auction
      let newEndTime = auction.endTime;
      if (auction.autoExtend) {
        const thresholdMs = (auction.extendThresholdMinutes || 5) * 60 * 1000;
        const timeUntilEnd = endTime.getTime() - now.getTime();

        if (timeUntilEnd < thresholdMs && timeUntilEnd > 0) {
          const extendMs = (auction.extendMinutes || 5) * 60 * 1000;
          newEndTime = new Date(endTime.getTime() + extendMs).toISOString();
        }
      }

      // 4. Update auction with new bid info
      const [updatedAuction] = await tx
        .update(auctions)
        .set({
          currentBid: String(bid_amount),
          bidCount: (auction.bidCount || 0) + 1,
          highestBidderId: user_id || null,
          endTime: newEndTime,
          extendedEndTime: newEndTime !== auction.endTime ? newEndTime : auction.extendedEndTime,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(auctions.id, id))
        .returning();

      return { newBid, updatedAuction, newEndTime };
    });

    if (!result.updatedAuction) {
      return ApiError.internal('Failed to place bid');
    }

    // Invalidate auctions cache
    await invalidateAuctionsCaches();

    // Trigger real-time bid update via Pusher (non-blocking)
    triggerBidPlaced(id, {
      bidAmount: bid_amount,
      bidCount: result.updatedAuction.bidCount || 1,
      bidderName: bidder_name,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    // Get featured image for email
    const images = Array.isArray(auction.images) ? auction.images : [];
    const featuredImageIndex = auction.featuredImageIndex || 0;
    const featuredImage = images[featuredImageIndex] as string | undefined;

    // Send bid confirmation to current bidder (non-blocking)
    notifyBidPlaced(bidder_name || 'Bidder', bidder_email, {
      auctionId: auction.id,
      title: auction.title,
      imageUrl: featuredImage,
      currentBid: bid_amount,
      userBid: bid_amount,
      endTime: result.newEndTime,
      currency: 'CAD',
    }).catch(() => {});

    // Send outbid notification to previous bidder (non-blocking)
    if (currentWinningBid && currentWinningBid.bidderEmail !== bidder_email) {
      notifyOutbid(currentWinningBid.bidderName || 'Bidder', currentWinningBid.bidderEmail, {
        auctionId: auction.id,
        title: auction.title,
        imageUrl: featuredImage,
        currentBid: bid_amount,
        userBid: parseFloat(currentWinningBid.amount),
        endTime: result.newEndTime,
        currency: 'CAD',
      }).catch(() => {});
    }

    // Return response with reserve status
    return apiSuccess({
      auction: result.updatedAuction,
      bid: result.newBid,
      reserveMet,
      reserveJustMet: reserveMet && !reserveWasMet,
      timeExtended: result.newEndTime !== auction.endTime,
      newEndTime: result.newEndTime !== auction.endTime ? result.newEndTime : undefined,
    }, reserveMet ? 'Bid placed successfully - Reserve met!' : 'Bid placed successfully - Reserve not yet met');
  } catch (error) {
    console.error('Bid placement error:', error);
    return ApiError.internal('Failed to place bid');
  }
}

// GET endpoint to fetch bid history for an auction
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all bids for this auction, ordered by most recent
    const bidHistory = await db.query.bids.findMany({
      where: eq(bids.auctionId, id),
      orderBy: [desc(bids.createdAt)],
      limit,
    });

    // Map to safe response (hide some fields)
    const safeBids = bidHistory.map(bid => ({
      id: bid.id,
      amount: bid.amount,
      bidderName: bid.bidderName || 'Anonymous',
      // Mask email: show first 2 chars + *** + domain
      bidderEmail: bid.bidderEmail.replace(/^(.{2}).*@/, '$1***@'),
      isWinning: bid.isWinning,
      status: bid.status,
      createdAt: bid.createdAt,
    }));

    return apiSuccess({ bids: safeBids, count: safeBids.length });
  } catch {
    return ApiError.internal('Failed to fetch bid history');
  }
}
