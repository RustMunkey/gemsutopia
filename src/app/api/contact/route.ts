import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sanitizeInput } from '@/lib/security/sanitize';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();
    
    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Sanitize all inputs to prevent XSS
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedSubject = subject ? sanitizeInput(subject) : '';
    const sanitizedMessage = sanitizeInput(message);
    
    if (!process.env.RESEND_API_KEY || !resend) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    console.log('Sending contact form email to gemsutopia@gmail.com');
    
    const result = await resend.emails.send({
      from: 'Gemsutopia Contact <orders@gemsutopia.com>',
      to: ['gemsutopia@gmail.com'],
      replyTo: sanitizedEmail,
      subject: sanitizedSubject ? `Contact Form: ${sanitizedSubject}` : `Contact Form from ${sanitizedName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Contact Form Submission</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #000; margin-bottom: 5px; }
            .field { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .field-label { font-weight: bold; color: #000; margin-bottom: 5px; }
            .message-content { background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">💎 GEMSUTOPIA</div>
            <p style="margin: 0; color: #666;">New Contact Form Submission</p>
          </div>

          <div class="field">
            <div class="field-label">Customer Name:</div>
            <div>${sanitizedName}</div>
          </div>

          <div class="field">
            <div class="field-label">Email Address:</div>
            <div><a href="mailto:${sanitizedEmail}">${sanitizedEmail}</a></div>
          </div>

          ${sanitizedSubject ? `
          <div class="field">
            <div class="field-label">Subject:</div>
            <div>${sanitizedSubject}</div>
          </div>
          ` : ''}

          <div class="field">
            <div class="field-label">Message:</div>
            <div class="message-content">${sanitizedMessage.replace(/\n/g, '<br>')}</div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            <p><strong>Reply directly to this email</strong> to respond to the customer.</p>
            <p>Received: ${new Date().toLocaleString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Edmonton'
            })} (Mountain Time)</p>
          </div>
        </body>
        </html>
      `
    });

    console.log('Contact form email sent successfully:', result.data?.id);
    return NextResponse.json({ success: true, message: 'Message sent successfully!', id: result.data?.id });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ 
      error: 'Failed to send message', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}