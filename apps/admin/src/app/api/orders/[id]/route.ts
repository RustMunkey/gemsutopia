import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, orders } from '@gemsutopia/database';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { orderItems: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ data: order });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (body.status !== undefined) updateData.status = body.status;
  if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus;
  if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber;
  if (body.carrier !== undefined) updateData.carrier = body.carrier;
  if (body.carrierTrackingUrl !== undefined) updateData.carrierTrackingUrl = body.carrierTrackingUrl;
  if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
  if (body.shippingMethod !== undefined) updateData.shippingMethod = body.shippingMethod;

  if (body.status === 'shipped' && !body.shippedAt) {
    updateData.shippedAt = new Date().toISOString();
  }
  if (body.status === 'delivered' && !body.deliveredAt) {
    updateData.deliveredAt = new Date().toISOString();
  }

  const [updated] = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();

  if (!updated) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
