// Two-Factor Authentication using EMAIL (Redis-backed)
import { redis } from '@/lib/cache';
import { sendEmail } from '@/lib/email';

interface TwoFactorCode {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
  ip: string;
}

// Redis key prefix
const TWO_FACTOR_PREFIX = '2fa:';

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const CODE_EXPIRY_SECONDS = 10 * 60; // 10 minutes in seconds for Redis TTL
const MAX_CODE_ATTEMPTS = 3;

// Generate 6-digit verification code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure token for code verification
function generateCodeToken(): string {
  return crypto.randomUUID();
}

// Send verification code via email
export async function sendVerificationCode(
  email: string,
  ip: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!redis) {
    return { success: false, error: '2FA store unavailable' };
  }

  try {
    const code = generateCode();
    const token = generateCodeToken();
    const expiresAt = Date.now() + CODE_EXPIRY_MS;

    const codeData: TwoFactorCode = {
      code,
      email,
      expiresAt,
      attempts: 0,
      ip,
    };

    // Store in Redis with TTL
    await redis.set(`${TWO_FACTOR_PREFIX}${token}`, codeData, { ex: CODE_EXPIRY_SECONDS });

    // Send email with verification code
    const emailResult = await sendCodeEmail(email, code);

    if (!emailResult.success) {
      // Clean up the code if email failed
      await redis.del(`${TWO_FACTOR_PREFIX}${token}`);
      return { success: false, error: emailResult.error || 'Failed to send verification email' };
    }

    return { success: true, token };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification code',
    };
  }
}

// Verify the code entered by user
export async function verifyCode(
  token: string,
  inputCode: string,
  ip: string
): Promise<{
  success: boolean;
  email?: string;
  error?: string;
  remainingAttempts?: number;
}> {
  if (!redis) {
    return { success: false, error: '2FA store unavailable' };
  }

  const pendingCode = await redis.get<TwoFactorCode>(`${TWO_FACTOR_PREFIX}${token}`);

  if (!pendingCode) {
    return { success: false, error: 'Invalid or expired verification token' };
  }

  // Check expiration
  if (Date.now() > pendingCode.expiresAt) {
    await redis.del(`${TWO_FACTOR_PREFIX}${token}`);
    return { success: false, error: 'Verification code expired' };
  }

  // Check IP (prevent token stealing)
  if (pendingCode.ip !== ip) {
    await redis.del(`${TWO_FACTOR_PREFIX}${token}`);
    return { success: false, error: 'Security violation detected' };
  }

  // Check attempts
  if (pendingCode.attempts >= MAX_CODE_ATTEMPTS) {
    await redis.del(`${TWO_FACTOR_PREFIX}${token}`);
    return { success: false, error: 'Too many failed attempts' };
  }

  // Verify code
  if (pendingCode.code !== inputCode.trim()) {
    pendingCode.attempts++;
    const remaining = MAX_CODE_ATTEMPTS - pendingCode.attempts;

    if (remaining === 0) {
      await redis.del(`${TWO_FACTOR_PREFIX}${token}`);
      return { success: false, error: 'Too many failed attempts' };
    }

    // Update attempts count in Redis
    const ttl = Math.max(1, Math.floor((pendingCode.expiresAt - Date.now()) / 1000));
    await redis.set(`${TWO_FACTOR_PREFIX}${token}`, pendingCode, { ex: ttl });

    return {
      success: false,
      error: `Invalid code. ${remaining} attempts remaining.`,
      remainingAttempts: remaining,
    };
  }

  // Success! Clean up the used code
  await redis.del(`${TWO_FACTOR_PREFIX}${token}`);

  return { success: true, email: pendingCode.email };
}

// Send verification code via email using Resend
async function sendCodeEmail(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
          Verification Code
        </h1>
        <p style="color: #666; font-size: 16px; margin: 0 0 30px 0; text-align: center;">
          Use the following code to complete your sign-in:
        </p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 30px 0;">
          <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; font-family: monospace;">
            ${code}
          </span>
        </div>
        <p style="color: #999; font-size: 14px; margin: 0; text-align: center;">
          This code expires in 10 minutes.<br>
          If you didn't request this code, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
          &copy; ${new Date().getFullYear()} Gemsutopia. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, 'Your Gemsutopia Verification Code', html);
}

// Admin function: Get 2FA stats
export async function getTwoFactorStats(): Promise<{
  activeCodes: string;
  totalPendingCodes: string;
}> {
  // With Redis, we'd need to scan keys to count - not recommended for production
  return {
    activeCodes: 'N/A',
    totalPendingCodes: 'N/A',
  };
}

// Revoke a specific code
export async function revokeCode(token: string): Promise<boolean> {
  if (!redis) return false;
  const result = await redis.del(`${TWO_FACTOR_PREFIX}${token}`);
  return result > 0;
}

// Check if 2FA store is available
export function is2FAAvailable(): boolean {
  return redis !== null;
}
