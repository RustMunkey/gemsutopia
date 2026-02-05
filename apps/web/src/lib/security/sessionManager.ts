// Advanced session management and security (Redis-backed)
import { redis } from '@/lib/cache';

interface SessionData {
  email: string;
  ip: string;
  userAgent: string;
  loginTime: number;
  lastActivity: number;
  sessionId: string;
}

interface SecuritySettings {
  maxSessionDuration: number; // 24 hours default
  inactivityTimeout: number; // 30 minutes default
  allowMultipleSessions: boolean;
  requireReauthForSensitive: boolean;
}

// Redis key prefixes
const SESSION_PREFIX = 'session:';
const USER_SESSIONS_PREFIX = 'user_sessions:';

const DEFAULT_SETTINGS: SecuritySettings = {
  maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  allowMultipleSessions: false, // Only one session per user
  requireReauthForSensitive: true, // Re-auth for sensitive actions
};

// Session TTL in seconds (24 hours)
const SESSION_TTL = 24 * 60 * 60;

// Generate secure session ID
function generateSessionId(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

// Create new session
export async function createSession(
  email: string,
  ip: string,
  userAgent: string
): Promise<string> {
  const sessionId = generateSessionId();
  const now = Date.now();

  // Check if multiple sessions are allowed
  if (!DEFAULT_SETTINGS.allowMultipleSessions) {
    await terminateAllUserSessions(email);
  }

  const sessionData: SessionData = {
    email,
    ip,
    userAgent,
    loginTime: now,
    lastActivity: now,
    sessionId,
  };

  if (redis) {
    // Store session data with TTL
    await redis.set(`${SESSION_PREFIX}${sessionId}`, sessionData, { ex: SESSION_TTL });

    // Track user sessions in a set
    await redis.sadd(`${USER_SESSIONS_PREFIX}${email}`, sessionId);
    await redis.expire(`${USER_SESSIONS_PREFIX}${email}`, SESSION_TTL);
  }

  return sessionId;
}

// Validate session
export async function validateSession(
  sessionId: string,
  currentIP: string,
  currentUserAgent: string
): Promise<{
  valid: boolean;
  email?: string;
  reason?: string;
  requiresReauth?: boolean;
}> {
  if (!redis) {
    return { valid: false, reason: 'Session store unavailable' };
  }

  const session = await redis.get<SessionData>(`${SESSION_PREFIX}${sessionId}`);

  if (!session) {
    return { valid: false, reason: 'Session not found' };
  }

  const now = Date.now();

  // Check session expiration
  if (now - session.loginTime > DEFAULT_SETTINGS.maxSessionDuration) {
    await terminateSession(sessionId);
    return { valid: false, reason: 'Session expired' };
  }

  // Check inactivity timeout
  if (now - session.lastActivity > DEFAULT_SETTINGS.inactivityTimeout) {
    await terminateSession(sessionId);
    return { valid: false, reason: 'Session timed out due to inactivity' };
  }

  // Check for session hijacking (IP change)
  if (session.ip !== currentIP) {
    await terminateSession(sessionId);
    return { valid: false, reason: 'Suspicious activity: IP address changed' };
  }

  // Check for session hijacking (User Agent change)
  if (session.userAgent !== currentUserAgent) {
    await terminateSession(sessionId);
    return { valid: false, reason: 'Suspicious activity: Browser/device changed' };
  }

  // Update last activity
  session.lastActivity = now;
  await redis.set(`${SESSION_PREFIX}${sessionId}`, session, { ex: SESSION_TTL });

  return { valid: true, email: session.email };
}

// Terminate specific session
export async function terminateSession(sessionId: string): Promise<boolean> {
  if (!redis) return false;

  const session = await redis.get<SessionData>(`${SESSION_PREFIX}${sessionId}`);
  if (!session) return false;

  // Remove from user sessions set
  await redis.srem(`${USER_SESSIONS_PREFIX}${session.email}`, sessionId);

  // Delete session data
  await redis.del(`${SESSION_PREFIX}${sessionId}`);

  return true;
}

// Terminate all sessions for a user
export async function terminateAllUserSessions(email: string): Promise<number> {
  if (!redis) return 0;

  const sessionIds = await redis.smembers<string[]>(`${USER_SESSIONS_PREFIX}${email}`);
  if (!sessionIds || sessionIds.length === 0) return 0;

  let terminated = 0;
  for (const sessionId of sessionIds) {
    await redis.del(`${SESSION_PREFIX}${sessionId}`);
    terminated++;
  }

  // Clear the user sessions set
  await redis.del(`${USER_SESSIONS_PREFIX}${email}`);

  return terminated;
}

// Clean up expired sessions (run periodically) - Redis TTL handles most cleanup
export async function cleanupExpiredSessions(): Promise<number> {
  // With Redis TTL, sessions auto-expire. This is now a no-op but kept for API compatibility.
  // Could be used for logging/monitoring if needed.
  return 0;
}

// Get active sessions for user (admin view)
export async function getUserSessions(email: string): Promise<SessionData[]> {
  if (!redis) return [];

  const sessionIds = await redis.smembers<string[]>(`${USER_SESSIONS_PREFIX}${email}`);
  if (!sessionIds || sessionIds.length === 0) return [];

  const sessions: SessionData[] = [];
  for (const sessionId of sessionIds) {
    const session = await redis.get<SessionData>(`${SESSION_PREFIX}${sessionId}`);
    if (session) {
      sessions.push(session);
    }
  }

  return sessions;
}

// Get security stats (for admin dashboard)
export async function getSecurityStats(): Promise<{
  activeSessions: number;
  activeUsers: string;
  settings: SecuritySettings;
}> {
  // Note: Counting all sessions in Redis would require scanning keys
  // For production, consider maintaining a counter or using a different approach
  return {
    activeSessions: -1, // Unknown without key scan
    activeUsers: 'N/A', // Unknown without key scan
    settings: DEFAULT_SETTINGS,
  };
}

// Update security settings (admin only)
export function updateSecuritySettings(newSettings: Partial<SecuritySettings>): void {
  Object.assign(DEFAULT_SETTINGS, newSettings);
}

// Check if session store is available
export function isSessionStoreAvailable(): boolean {
  return redis !== null;
}
