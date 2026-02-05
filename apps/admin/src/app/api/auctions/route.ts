import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, auctions } from '@gemsutopia/database';
import { eq, desc, and, sql, gte, lte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filter = request.nextUrl.searchParams.get('filter');
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '25');
  const offset = (page - 1) * limit;

  const now = new Date().toISOString();
  const conditions = [];

  if (filter === 'active') {
    conditions.push(eq(auctions.status, 'active'));
  } else if (filter === 'upcoming') {
    conditions.push(eq(auctions.status, 'scheduled'));
  } else if (filter === 'ended') {
    conditions.push(sql`${auctions.status} IN ('ended', 'sold', 'no_sale')`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [allAuctions, countResult] = await Promise.all([
    db.query.auctions.findMany({
      where,
      orderBy: [desc(auctions.createdAt)],
      limit,
      offset,
    }),
    db.select({ count: sql<string>`COUNT(*)` }).from(auctions).where(where),
  ]);

  return NextResponse.json({
    data: allAuctions,
    pagination: {
      page,
      limit,
      total: parseInt(countResult[0]?.count || '0'),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    title, description, images, startingBid, reservePrice, buyNowPrice,
    bidIncrement, startTime, endTime, autoExtend, extendMinutes,
    extendThresholdMinutes, gemstoneType, caratWeight, cut, clarity,
    color, origin, certification,
  } = body;

  if (!title || !startingBid || !startTime || !endTime) {
    return NextResponse.json({ error: 'Title, starting bid, start time, and end time are required' }, { status: 400 });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const start = new Date(startTime);
  const status = start <= new Date() ? 'active' : 'scheduled';

  const [created] = await db.insert(auctions).values({
    title,
    slug,
    description: description || null,
    images: images?.length ? images : [''],
    startingBid: String(startingBid),
    reservePrice: reservePrice ? String(reservePrice) : null,
    buyNowPrice: buyNowPrice ? String(buyNowPrice) : null,
    bidIncrement: String(bidIncrement || 1),
    startTime,
    endTime,
    autoExtend: autoExtend ?? true,
    extendMinutes: extendMinutes ?? 5,
    extendThresholdMinutes: extendThresholdMinutes ?? 5,
    status,
    isActive: true,
    gemstoneType: gemstoneType || null,
    caratWeight: caratWeight ? String(caratWeight) : null,
    cut: cut || null,
    clarity: clarity || null,
    color: color || null,
    origin: origin || null,
    certification: certification || null,
  }).returning();

  return NextResponse.json({ data: created }, { status: 201 });
}
