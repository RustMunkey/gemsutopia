import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { bids, auctions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { apiSuccess, ApiError } from '@/lib/api';

// GET - Fetch user's bids
export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return ApiError.unauthorized('Login required');
    }

    const userBids = await db
      .select({
        id: bids.id,
        amount: bids.amount,
        maxBid: bids.maxBid,
        status: bids.status,
        isWinning: bids.isWinning,
        createdAt: bids.createdAt,
        auctionId: bids.auctionId,
        auctionTitle: auctions.title,
        auctionStatus: auctions.status,
        auctionEndTime: auctions.endTime,
        currentBid: auctions.currentBid,
      })
      .from(bids)
      .leftJoin(auctions, eq(bids.auctionId, auctions.id))
      .where(eq(bids.userId, session.user.id))
      .orderBy(desc(bids.createdAt))
      .limit(50);

    // Count active bids (where auction is still active)
    const activeBids = userBids.filter(
      b => b.auctionStatus === 'active' && b.status === 'active'
    );

    return apiSuccess({
      bids: userBids,
      total: activeBids.length,
    });
  } catch (error) {
    console.error('Error fetching user bids:', error);
    return ApiError.internal('Failed to fetch bids');
  }
}
