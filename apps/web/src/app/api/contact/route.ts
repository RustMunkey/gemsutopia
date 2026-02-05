import { NextRequest } from 'next/server';
import { sanitizeInput } from '@/lib/security/sanitize';
import { notifyContactFormSubmitted } from '@/lib/email';
import { apiSuccess, ApiError } from '@/lib/api';
import { log } from '@/lib/logger';
import { db, contactSubmissions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return ApiError.validation('Name, email, and message are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ApiError.validation('Invalid email format');
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      log.error('Contact form submission failed: RESEND_API_KEY not configured');
      return ApiError.internal('Email service not configured. Please contact support directly at gemsutopia@gmail.com');
    }

    // Sanitize all inputs to prevent XSS
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedSubject = subject ? sanitizeInput(subject) : 'General Inquiry';
    const sanitizedMessage = sanitizeInput(message);

    // Store in database
    try {
      await db.insert(contactSubmissions).values({
        name: sanitizedName,
        email: sanitizedEmail,
        subject: sanitizedSubject,
        message: sanitizedMessage,
        status: 'new',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      });
    } catch (dbError) {
      log.error('Failed to store contact submission', dbError);
    }

    log.info('Processing contact form submission', {
      from: sanitizedEmail,
      subject: sanitizedSubject,
    });

    // Send emails to both customer and admin
    const result = await notifyContactFormSubmitted(
      sanitizedName,
      sanitizedEmail,
      sanitizedSubject,
      sanitizedMessage
    );

    // Log the results for debugging
    if (!result.admin.success) {
      log.error('Failed to send admin notification', new Error(result.admin.error || 'Unknown error'));
    }
    if (!result.customer.success) {
      log.error('Failed to send customer confirmation', new Error(result.customer.error || 'Unknown error'));
    }

    if (!result.admin.success && !result.customer.success) {
      return ApiError.internal(`Failed to send message: ${result.admin.error || result.customer.error || 'Unknown error'}`);
    }

    log.info('Contact form submitted successfully', {
      adminEmailSent: result.admin.success,
      customerEmailSent: result.customer.success,
    });

    return apiSuccess(null, 'Message sent successfully! Check your email for confirmation.');
  } catch (error) {
    log.error('Contact form error', error);
    return ApiError.internal('Failed to send message');
  }
}
