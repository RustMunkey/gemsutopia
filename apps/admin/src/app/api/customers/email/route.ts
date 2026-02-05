import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { sendEmail } from '@gemsutopia/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { to, subject, body } = await request.json();

  if (!to || !subject || !body) {
    return NextResponse.json({ error: 'To, subject, and body are required' }, { status: 400 });
  }

  try {
    await sendEmail(
      to,
      subject,
      `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <p>${body.replace(/\n/g, '<br>')}</p>
        <br>
        <p style="color: #666; font-size: 12px;">— Reese @ Gemsutopia</p>
      </div>`
    );

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
