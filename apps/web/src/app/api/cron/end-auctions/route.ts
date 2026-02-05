import { NextRequest } from 'next/server';
import { db, auctions, bids, orders, orderItems } from '@/lib/db';
import { eq, and, lte, inArray } from 'drizzle-orm';
import { notifyAuctionWon, notifyAuctionLost } from '@/lib/email';
import { apiSuccess, ApiError } from '@/lib/api';
import { invalidateAuctionsCaches } from '@/lib/cache';
import { triggerAuctionEnded, triggerOrderCreated } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

// Generate a unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AUC-${timestamp}-${random}`;
}

// Cron job to process ended auctions
// This should be called periodically (e.g., every minute via Vercel Cron)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (to prevent unauthorized access)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, require authorization
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return ApiError.unauthorized('Invalid cron secret');
      }
    }

    const now = new Date().toISOString();

    // Find all active auctions that have ended
    const endedAuctions = await db.query.auctions.findMany({
      where: and(
        eq(auctions.status, 'active'),
        lte(auctions.endTime, now)
      ),
    });

    if (endedAuctions.length === 0) {
      return apiSuccess({ message: 'No auctions to process', processed: 0 });
    }

    const results = {
      processed: 0,
      sold: 0,
      noSale: 0,
      errors: [] as string[],
    };

    for (const auction of endedAuctions) {
      try {
        const currentBid = parseFloat(auction.currentBid || '0');
        const reservePrice = auction.reservePrice ? parseFloat(auction.reservePrice) : 0;
        const hasReserve = auction.reservePrice !== null;
        const reserveMet = !hasReserve || currentBid >= reservePrice;

        // Get the winning bid
        const winningBid = await db.query.bids.findFirst({
          where: and(eq(bids.auctionId, auction.id), eq(bids.isWinning, true)),
        });

        // Get all bidders for notifications
        const allBids = await db.query.bids.findMany({
          where: eq(bids.auctionId, auction.id),
        });

        // Get unique bidder emails (excluding winner)
        const losingBidders = allBids.filter(
          b => !b.isWinning && b.bidderEmail !== winningBid?.bidderEmail
        );
        const uniqueLosingEmails = [...new Set(losingBidders.map(b => b.bidderEmail))];

        // Get featured image for emails
        const images = Array.isArray(auction.images) ? auction.images : [];
        const featuredImage = images[auction.featuredImageIndex || 0] as string | undefined;

        if (reserveMet && winningBid && currentBid > 0) {
          // RESERVE MET - Process sale
          await db.transaction(async (tx) => {
            // 1. Update auction status
            await tx
              .update(auctions)
              .set({
                status: 'sold',
                isActive: false,
                winnerId: winningBid.userId || null,
                winningBid: auction.currentBid,
                wonAt: now,
                updatedAt: now,
              })
              .where(eq(auctions.id, auction.id));

            // 2. Mark winning bid as 'won'
            await tx
              .update(bids)
              .set({ status: 'won' })
              .where(eq(bids.id, winningBid.id));

            // 3. Create order for the winner
            const orderNumber = generateOrderNumber();
            const [newOrder] = await tx
              .insert(orders)
              .values({
                orderNumber,
                userId: winningBid.userId || null,
                customerEmail: winningBid.bidderEmail,
                customerName: winningBid.bidderName || null,
                subtotal: auction.currentBid!,
                shippingCost: '0', // To be calculated
                taxAmount: '0', // To be calculated
                total: auction.currentBid!,
                status: 'pending',
                paymentStatus: 'pending',
                items: [
                  {
                    type: 'auction',
                    auctionId: auction.id,
                    name: auction.title,
                    image: featuredImage,
                    price: currentBid,
                    quantity: 1,
                  },
                ],
                itemCount: 1,
                metadata: {
                  source: 'auction',
                  auctionId: auction.id,
                  auctionTitle: auction.title,
                  bidCount: auction.bidCount,
                },
              })
              .returning();

            // 4. Create order item
            await tx.insert(orderItems).values({
              orderId: newOrder.id,
              productId: auction.productId || null,
              productName: auction.title,
              productImage: featuredImage || null,
              unitPrice: auction.currentBid!,
              quantity: 1,
              subtotal: auction.currentBid!,
              productDetails: {
                type: 'auction',
                auctionId: auction.id,
                gemstoneType: auction.gemstoneType,
                caratWeight: auction.caratWeight,
              },
            });

            return newOrder;
          });

          // Send winner notification (non-blocking)
          notifyAuctionWon(winningBid.bidderName || 'Winner', winningBid.bidderEmail, {
            auctionId: auction.id,
            title: auction.title,
            imageUrl: featuredImage,
            currentBid,
            userBid: parseFloat(winningBid.amount),
            endTime: auction.endTime,
            currency: 'CAD',
          }).catch(err => console.error('Failed to send winner email:', err));

          // Notify admin of new order
          triggerOrderCreated({
            orderId: auction.id,
            orderNumber: `AUC-${auction.id.slice(-8)}`,
            customerEmail: winningBid.bidderEmail,
            total: currentBid,
            itemCount: 1,
          }).catch(() => {});

          results.sold++;
        } else {
          // RESERVE NOT MET or NO BIDS - No sale
          await db
            .update(auctions)
            .set({
              status: 'no_sale',
              isActive: false,
              updatedAt: now,
            })
            .where(eq(auctions.id, auction.id));

          // Notify the highest bidder they didn't win
          if (winningBid) {
            notifyAuctionLost(winningBid.bidderName || 'Bidder', winningBid.bidderEmail, {
              auctionId: auction.id,
              title: auction.title,
              imageUrl: featuredImage,
              currentBid,
              userBid: parseFloat(winningBid.amount),
              endTime: auction.endTime,
              currency: 'CAD',
            }).catch(err => console.error('Failed to send no-sale email:', err));
          }

          results.noSale++;
        }

        // Notify all losing bidders that auction ended
        for (const email of uniqueLosingEmails) {
          const bidder = losingBidders.find(b => b.bidderEmail === email);
          if (bidder) {
            notifyAuctionLost(bidder.bidderName || 'Bidder', email, {
              auctionId: auction.id,
              title: auction.title,
              imageUrl: featuredImage,
              currentBid,
              userBid: parseFloat(bidder.amount),
              endTime: auction.endTime,
              currency: 'CAD',
            }).catch(() => {});
          }
        }

        // Trigger real-time auction ended event
        triggerAuctionEnded(auction.id, {
          finalBid: currentBid,
          winnerName: winningBid?.bidderName || undefined,
        }).catch(() => {});

        results.processed++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Auction ${auction.id}: ${errorMsg}`);
        console.error(`Failed to process auction ${auction.id}:`, err);
      }
    }

    // Invalidate auction caches
    await invalidateAuctionsCaches();

    return apiSuccess({
      message: `Processed ${results.processed} auctions`,
      ...results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return ApiError.internal('Failed to process ended auctions');
  }
}

// POST endpoint for manual triggering (admin only)
export async function POST(request: NextRequest) {
  // Just redirect to GET handler
  return GET(request);
}
