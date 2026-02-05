import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, auctions, bids } from '@gemsutopia/database';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const auction = await db.query.auctions.findFirst({
    where: eq(auctions.id, id),
    with: { bids: { orderBy: [desc(bids.amount)], limit: 10 } },
  });

  if (!auction) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
  }

  return NextResponse.json({ data: auction });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  const stringFields = ['title', 'description', 'gemstoneType', 'cut', 'clarity', 'color', 'origin', 'certification'];
  for (const field of stringFields) {
    if (body[field] !== undefined) updateData[field] = body[field] || null;
  }

  if (body.title) {
    updateData.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (body.images !== undefined) updateData.images = body.images;
  if (body.startingBid !== undefined) updateData.startingBid = String(body.startingBid);
  if (body.reservePrice !== undefined) updateData.reservePrice = body.reservePrice ? String(body.reservePrice) : null;
  if (body.buyNowPrice !== undefined) updateData.buyNowPrice = body.buyNowPrice ? String(body.buyNowPrice) : null;
  if (body.bidIncrement !== undefined) updateData.bidIncrement = String(body.bidIncrement);
  if (body.caratWeight !== undefined) updateData.caratWeight = body.caratWeight ? String(body.caratWeight) : null;
  if (body.startTime !== undefined) updateData.startTime = body.startTime;
  if (body.endTime !== undefined) updateData.endTime = body.endTime;
  if (body.autoExtend !== undefined) updateData.autoExtend = body.autoExtend;
  if (body.extendMinutes !== undefined) updateData.extendMinutes = body.extendMinutes;
  if (body.extendThresholdMinutes !== undefined) updateData.extendThresholdMinutes = body.extendThresholdMinutes;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  const [updated] = await db.update(auctions).set(updateData).where(eq(auctions.id, id)).returning();

  if (!updated) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const [deleted] = await db.delete(auctions).where(eq(auctions.id, id)).returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
  }

  return NextResponse.json({ data: { success: true } });
}
