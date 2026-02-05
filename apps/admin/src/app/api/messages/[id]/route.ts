import { NextResponse, NextRequest } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db, contactSubmissions } from '@gemsutopia/database';
import { sendEmail } from '@gemsutopia/email';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { message: replyMessage } = body as { message: string };

  if (!replyMessage?.trim()) {
    return NextResponse.json({ error: 'Reply message is required' }, { status: 400 });
  }

  const [submission] = await db
    .select()
    .from(contactSubmissions)
    .where(eq(contactSubmissions.id, id))
    .limit(1);

  if (!submission) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  const subject = `Re: ${submission.subject || 'Your inquiry'} - Gemsutopia`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 24px; background: #1a1a2e; color: #fff; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Gemsutopia</h2>
      </div>
      <div style="padding: 24px; background: #fff; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 14px; line-height: 1.6;">Hi ${submission.name},</p>
        <div style="color: #333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${replyMessage}</div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">
          In response to your message:<br/>
          <em style="color: #666;">"${submission.message.slice(0, 200)}${submission.message.length > 200 ? '...' : ''}"</em>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; margin: 0;">
          Gemsutopia &mdash; Premium Canadian Gemstones<br/>
          <a href="https://gemsutopia.ca" style="color: #6366f1;">gemsutopia.ca</a>
        </p>
      </div>
    </div>
  `;

  const result = await sendEmail(submission.email, subject, html);

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
  }

  await db
    .update(contactSubmissions)
    .set({
      status: 'replied',
      repliedAt: new Date().toISOString(),
      replyMessage,
    })
    .where(eq(contactSubmissions.id, id));

  return NextResponse.json({ data: { success: true } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const validStatuses = ['new', 'read', 'replied', 'spam', 'archived'];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const [updated] = await db
    .update(contactSubmissions)
    .set({ status })
    .where(eq(contactSubmissions.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id));

  return NextResponse.json({ success: true });
}
