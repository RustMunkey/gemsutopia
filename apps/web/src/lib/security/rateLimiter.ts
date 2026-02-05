import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client (optional - falls back to memory if not configured)
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Create rate limiter: 5 requests per 10 minutes, with sliding window
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      analytics: true,
      prefix: 'admin_login',
    });
  }
} catch {
  // Redis not configured, falling back to in-memory rate limiting
}

// In-memory fallback (for development or if Redis fails)
interface AttemptRecord {
  attempts: number;
  firstAttempt: number;
  bannedUntil?: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const BAN_DURATION = 15 * 60 * 1000; // 15 minutes
const RESET_WINDOW = 10 * 60 * 1000; // 10 minutes to reset counter

// Check rate limit - uses Redis if available, otherwise in-memory
export async function checkRateLimitAsync(ip: string): Promise<{
  allowed: boolean;
  remainingAttempts?: number;
  bannedUntil?: number;
}> {
  // Try Redis rate limiting first
  if (ratelimit) {
    try {
      const result = await ratelimit.limit(ip);
      if (!result.success) {
        return {
          allowed: false,
          remainingAttempts: 0,
          bannedUntil: result.reset,
        };
      }
      return {
        allowed: true,
        remainingAttempts: result.remaining,
      };
    } catch {
      // Redis rate limit error, falling back to memory
    }
  }

  // Fall back to in-memory
  return checkRateLimitMemory(ip);
}

// Synchronous rate limit check (for backward compatibility)
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts?: number;
  bannedUntil?: number;
} {
  // If Redis is not configured, use memory immediately
  if (!ratelimit) {
    return checkRateLimitMemory(ip);
  }

  // For sync calls, check memory first to allow immediate blocking
  // The async version should be preferred for accuracy
  return checkRateLimitMemory(ip);
}

function checkRateLimitMemory(ip: string): {
  allowed: boolean;
  remainingAttempts?: number;
  bannedUntil?: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  // No previous attempts
  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if ban has expired
  if (record.bannedUntil && now > record.bannedUntil) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Currently banned
  if (record.bannedUntil && now <= record.bannedUntil) {
    return { allowed: false, bannedUntil: record.bannedUntil };
  }

  // Check if attempts should be reset (10 min window)
  if (now - record.firstAttempt > RESET_WINDOW) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if max attempts reached
  if (record.attempts >= MAX_ATTEMPTS) {
    record.bannedUntil = now + BAN_DURATION;
    return { allowed: false, bannedUntil: record.bannedUntil };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.attempts };
}

// Record failed attempt (updates both Redis and memory)
export async function recordFailedAttemptAsync(ip: string): Promise<void> {
  // Redis handles this automatically via the rate limit check
  // But we also update memory for immediate blocking
  recordFailedAttemptMemory(ip);
}

export function recordFailedAttempt(ip: string): void {
  recordFailedAttemptMemory(ip);
}

function recordFailedAttemptMemory(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    loginAttempts.set(ip, {
      attempts: 1,
      firstAttempt: now,
    });
  } else {
    // Check if we should reset the window
    if (now - record.firstAttempt > RESET_WINDOW) {
      loginAttempts.set(ip, {
        attempts: 1,
        firstAttempt: now,
      });
    } else {
      record.attempts++;
      if (record.attempts >= MAX_ATTEMPTS) {
        record.bannedUntil = now + BAN_DURATION;
      }
    }
  }
}

// Record successful login (clears rate limit)
export async function recordSuccessfulLoginAsync(ip: string): Promise<void> {
  // Clear in-memory record
  loginAttempts.delete(ip);

  // Reset Redis counter if available
  if (redis) {
    try {
      await redis.del(`admin_login:${ip}`);
    } catch {
      // Error clearing Redis rate limit
    }
  }
}

export function recordSuccessfulLogin(ip: string): void {
  loginAttempts.delete(ip);

  // Fire and forget Redis clear
  if (redis) {
    redis.del(`admin_login:${ip}`).catch(() => {
      // Error clearing Redis rate limit
    });
  }
}

// Get remaining ban time in milliseconds
export function getRemainingBanTime(bannedUntil: number): number {
  return Math.max(0, bannedUntil - Date.now());
}

// Check if Redis is configured and working
export async function isRedisConfigured(): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

// Export Redis client for other uses (caching, etc.)
export { redis };
