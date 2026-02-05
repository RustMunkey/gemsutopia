import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { Redis } from '@upstash/redis';
import {
  sendEmail,
  verificationEmailTemplate,
  passwordResetEmailTemplate,
} from './email';

// Initialize Redis for session caching (optional)
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch {
  // Redis not configured for sessions
}

// Create secondary storage adapter for Redis session caching
const createRedisSessionStorage = () => {
  if (!redis) return undefined;

  return {
    get: async (key: string) => {
      try {
        const value = await redis!.get(key);
        return value as string | null;
      } catch {
        return null;
      }
    },
    set: async (key: string, value: string, ttl?: number) => {
      try {
        if (ttl) {
          await redis!.set(key, value, { ex: ttl });
        } else {
          await redis!.set(key, value);
        }
      } catch {
        // Silently fail - will fall back to DB
      }
    },
    delete: async (key: string) => {
      try {
        await redis!.del(key);
      } catch {
        // Silently fail
      }
    },
  };
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  baseURL: baseUrl,
  secondaryStorage: createRedisSessionStorage(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        user.email,
        'Reset Your Gemsutopia Password',
        passwordResetEmailTemplate({
          userName: user.name || 'Valued Customer',
          resetUrl: url,
        })
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(
        user.email,
        'Verify Your Gemsutopia Account',
        verificationEmailTemplate({
          userName: user.name || 'Valued Customer',
          verificationUrl: url,
        })
      );
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        required: false,
      },
      lastName: {
        type: 'string',
        required: false,
      },
      phone: {
        type: 'string',
        required: false,
      },
    },
  },
  trustedOrigins: [baseUrl],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
