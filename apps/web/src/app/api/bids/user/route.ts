import { NextRequest } from 'next/server';
import { db, bids, auctions } from '@/lib/db';
import { eq, desc, or } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bids/user - Get bids for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required to view bids');
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const status = searchParams.get('status'); // Filter by auction status: active, won, lost, all

    // Find bids by user ID or by email (for bids placed before account creation)
    const userBids = await db.query.bids.findMany({
      where: or(
        eq(bids.userId, session.user.id),
        eq(bids.bidderEmail, session.user.email)
      ),
      with: {
        auction: true,
      },
      orderBy: [desc(bids.createdAt)],
      limit,
      offset,
    });

    // Transform and filter bids
    let transformedBids = userBids.map(bid => {
      const auctionStatus = getAuctionStatusForUser(bid.auction, bid, session.user.id, session.user.email);

      return {
        id: bid.id,
        amount: parseFloat(bid.amount),
        maxBid: bid.maxBid ? parseFloat(bid.maxBid) : null,
        isAutoBid: bid.isAutoBid,
        isWinning: bid.isWinning,
        createdAt: bid.createdAt,
        auction: {
          id: bid.auction.id,
          title: bid.auction.title,
          slug: bid.auction.slug,
          image: bid.auction.images?.[0] || null,
          currentBid: parseFloat(bid.auction.currentBid || '0'),
          startingBid: parseFloat(bid.auction.startingBid),
          currency: bid.auction.currency || 'CAD',
          endTime: bid.auction.extendedEndTime || bid.auction.endTime,
          status: bid.auction.status,
          isActive: bid.auction.isActive,
          bidCount: bid.auction.bidCount || 0,
        },
        userStatus: auctionStatus, // 'winning', 'outbid', 'won', 'lost', 'pending'
      };
    });

    // Filter by status if provided
    if (status && status !== 'all') {
      transformedBids = transformedBids.filter(bid => {
        switch (status) {
          case 'active':
            return bid.auction.status === 'active' || bid.auction.status === 'pending';
          case 'winning':
            return bid.userStatus === 'winning';
          case 'won':
            return bid.userStatus === 'won';
          case 'lost':
            return bid.userStatus === 'lost' || bid.userStatus === 'outbid';
          default:
            return true;
        }
      });
    }

    // Get summary stats
    const stats = {
      totalBids: userBids.length,
      activeBids: transformedBids.filter(b => b.auction.status === 'active').length,
      wonAuctions: transformedBids.filter(b => b.userStatus === 'won').length,
      currentlyWinning: transformedBids.filter(b => b.userStatus === 'winning').length,
    };

    return apiSuccess({
      bids: transformedBids,
      stats,
      total: transformedBids.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching user bids:', error);
    return ApiError.internal('Failed to fetch bids');
  }
}

function getAuctionStatusForUser(
  auction: any,
  bid: any,
  userId: string,
  userEmail: string
): 'winning' | 'outbid' | 'won' | 'lost' | 'pending' {
  const isUserHighestBidder =
    auction.highestBidderId === userId ||
    auction.winnerId === userId;

  // Auction ended
  if (auction.status === 'ended' || auction.status === 'sold') {
    if (auction.winnerId === userId) {
      return 'won';
    }
    return 'lost';
  }

  // Auction still active
  if (auction.status === 'active') {
    if (bid.isWinning || isUserHighestBidder) {
      return 'winning';
    }
    return 'outbid';
  }

  // Pending auction
  return 'pending';
}
