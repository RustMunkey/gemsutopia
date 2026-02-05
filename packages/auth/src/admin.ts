import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db, adminSessions, adminAuditLog } from '@gemsutopia/database';
import { eq, and, gt } from 'drizzle-orm';
import { setCache, getCache, deleteCache, CACHE_KEYS } from '@gemsutopia/cache';
import { ALLOWED_ADMINS, ADMIN_SESSION_DURATION, ADMIN_SESSION_REFRESH_THRESHOLD } from './constants';

const DEV_SECRET = 'gemsutopia-dev-jwt-secret';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? DEV_SECRET : '');

// Types
export interface AdminUser {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  googleId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AdminTokenPayload {
  sessionId: string;
  email: string;
  googleId: string;
  iat: number;
  exp: number;
}

// Check if email is an allowed admin
export function isAllowedAdmin(email: string): boolean {
  return ALLOWED_ADMINS.includes(email.toLowerCase() as (typeof ALLOWED_ADMINS)[number]);
}

// DEV ONLY: Create a dev session for bypassing auth
// TODO: Remove this function before production deployment
export async function createDevAdminSession(): Promise<string> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dev bypass not available in production');
  }

  const devSession = {
    sessionId: 'dev-session-' + Date.now(),
    email: 'asher@neoengine.dev',
    googleId: 'dev-google-id',
  };

  const token = jwt.sign(devSession, JWT_SECRET, {
    expiresIn: '7d',
  });

  return token;
}

// Hash token for storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Create admin session after Google SSO
export async function createAdminSession(
  user: AdminUser,
  ipAddress?: string,
  userAgent?: string
): Promise<{ session: AdminSession; token: string }> {
  if (!isAllowedAdmin(user.email)) {
    throw new Error('Unauthorized: Email not in admin whitelist');
  }

  const expiresAt = new Date(Date.now() + ADMIN_SESSION_DURATION);

  // Create session in database
  const [session] = await db.insert(adminSessions).values({
    adminEmail: user.email.toLowerCase(),
    adminName: user.name,
    googleId: user.googleId,
    tokenHash: '', // Will update after generating token
    ipAddress,
    userAgent,
    expiresAt: expiresAt.toISOString(),
  }).returning();

  // Generate JWT token
  const tokenPayload: Omit<AdminTokenPayload, 'iat' | 'exp'> = {
    sessionId: session.id,
    email: user.email.toLowerCase(),
    googleId: user.googleId,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: Math.floor(ADMIN_SESSION_DURATION / 1000),
  });

  // Update session with token hash
  const tokenHash = hashToken(token);
  await db.update(adminSessions)
    .set({ tokenHash })
    .where(eq(adminSessions.id, session.id));

  // Cache session for fast lookups
  const sessionData: AdminSession = {
    id: session.id,
    email: user.email.toLowerCase(),
    name: user.name,
    googleId: user.googleId,
    createdAt: session.createdAt!,
    expiresAt: expiresAt.toISOString(),
  };

  await setCache(
    `${CACHE_KEYS.ADMIN_SESSION}:${session.id}`,
    sessionData,
    Math.floor(ADMIN_SESSION_DURATION / 1000)
  );

  // Log login action
  await logAdminAction(user.email, 'login', undefined, undefined, { ipAddress, userAgent });

  return { session: sessionData, token };
}

// Validate admin token and return session
export async function validateAdminToken(token: string): Promise<AdminSession | null> {
  try {
    // Verify JWT
    const payload = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;

    // DEV BYPASS: If sessionId starts with 'dev-session-', return a mock session
    // TODO: Remove this before production deployment
    if (process.env.NODE_ENV !== 'production' && payload.sessionId?.startsWith('dev-session-')) {
      return {
        id: payload.sessionId,
        email: payload.email || 'asher@neoengine.dev',
        name: 'Dev Admin',
        googleId: payload.googleId || 'dev-google-id',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    // Check cache first
    const cached = await getCache<AdminSession>(`${CACHE_KEYS.ADMIN_SESSION}:${payload.sessionId}`);
    if (cached) {
      // Check if session is expired
      if (new Date(cached.expiresAt) < new Date()) {
        await deleteCache(`${CACHE_KEYS.ADMIN_SESSION}:${payload.sessionId}`);
        return null;
      }
      return cached;
    }

    // Check database
    const [session] = await db.select()
      .from(adminSessions)
      .where(and(
        eq(adminSessions.id, payload.sessionId),
        eq(adminSessions.tokenHash, hashToken(token)),
        gt(adminSessions.expiresAt, new Date().toISOString())
      ))
      .limit(1);

    if (!session) {
      return null;
    }

    // Update last active time
    await db.update(adminSessions)
      .set({ lastActiveAt: new Date().toISOString() })
      .where(eq(adminSessions.id, session.id));

    // Cache for future lookups
    const sessionData: AdminSession = {
      id: session.id,
      email: session.adminEmail,
      name: session.adminName || '',
      googleId: session.googleId || '',
      createdAt: session.createdAt!,
      expiresAt: session.expiresAt,
    };

    await setCache(
      `${CACHE_KEYS.ADMIN_SESSION}:${session.id}`,
      sessionData,
      Math.floor(ADMIN_SESSION_DURATION / 1000)
    );

    return sessionData;
  } catch {
    return null;
  }
}

// Check if session needs refresh
export function shouldRefreshSession(session: AdminSession): boolean {
  const expiresAt = new Date(session.expiresAt);
  const refreshThreshold = new Date(Date.now() + ADMIN_SESSION_REFRESH_THRESHOLD);
  return expiresAt < refreshThreshold;
}

// Invalidate admin session (logout)
export async function invalidateAdminSession(sessionId: string, email: string): Promise<void> {
  // Delete from database
  await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));

  // Delete from cache
  await deleteCache(`${CACHE_KEYS.ADMIN_SESSION}:${sessionId}`);

  // Log logout action
  await logAdminAction(email, 'logout');
}

// Invalidate all sessions for an admin (logout all devices)
export async function invalidateAllAdminSessions(email: string): Promise<void> {
  const sessions = await db.select({ id: adminSessions.id })
    .from(adminSessions)
    .where(eq(adminSessions.adminEmail, email.toLowerCase()));

  for (const session of sessions) {
    await deleteCache(`${CACHE_KEYS.ADMIN_SESSION}:${session.id}`);
  }

  await db.delete(adminSessions)
    .where(eq(adminSessions.adminEmail, email.toLowerCase()));

  await logAdminAction(email, 'logout', undefined, undefined, { allDevices: true });
}

// Log admin action to audit log
export async function logAdminAction(
  adminEmail: string,
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'export' | 'import' | 'view' | 'bulk_action',
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  previousValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(adminAuditLog).values({
      adminEmail: adminEmail.toLowerCase(),
      action,
      resourceType,
      resourceId,
      details: details || {},
      previousValues,
      newValues,
      ipAddress: details?.ipAddress as string | undefined,
      userAgent: details?.userAgent as string | undefined,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// Get admin audit log
export async function getAdminAuditLog(
  filters?: {
    adminEmail?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit = 100,
  offset = 0
) {
  // Build query with filters
  let query = db.select().from(adminAuditLog);

  if (filters?.adminEmail) {
    query = query.where(eq(adminAuditLog.adminEmail, filters.adminEmail.toLowerCase())) as typeof query;
  }

  return query.limit(limit).offset(offset);
}
