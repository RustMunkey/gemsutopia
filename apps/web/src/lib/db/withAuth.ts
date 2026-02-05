/**
 * Database Auth Context Wrapper
 *
 * This module provides helpers to set authentication context for RLS policies.
 * Call setAuthContext() at the start of database operations to enable RLS
 * to properly filter data based on the current user.
 */

import { db, drizzleSql } from '@/lib/db';

interface AuthContext {
  userId?: string | null;
  email?: string | null;
  isAdmin?: boolean;
}

/**
 * Set the authentication context for RLS policies.
 * This must be called at the start of any database operation that needs RLS.
 *
 * @param context - The authentication context
 * @param context.userId - The current user's UUID
 * @param context.email - The current user's email
 * @param context.isAdmin - Whether the user is an admin
 */
export async function setAuthContext(context: AuthContext): Promise<void> {
  const { userId, email, isAdmin = false } = context;

  await db.execute(
    drizzleSql`SELECT set_auth_context(
      ${userId || null}::uuid,
      ${email || null}::text,
      ${isAdmin}::boolean
    )`
  );
}

/**
 * Clear the authentication context.
 * Call this after database operations complete or on error.
 */
export async function clearAuthContext(): Promise<void> {
  await db.execute(drizzleSql`SELECT clear_auth_context()`);
}

/**
 * Execute a database operation with authentication context.
 * Automatically sets and clears the auth context.
 *
 * @param context - The authentication context
 * @param operation - The async database operation to execute
 * @returns The result of the operation
 *
 * @example
 * ```ts
 * const orders = await withAuthContext(
 *   { userId: session.user.id, email: session.user.email },
 *   async () => {
 *     return db.query.orders.findMany();
 *   }
 * );
 * ```
 */
export async function withAuthContext<T>(
  context: AuthContext,
  operation: () => Promise<T>
): Promise<T> {
  try {
    await setAuthContext(context);
    const result = await operation();
    return result;
  } finally {
    await clearAuthContext();
  }
}

/**
 * Execute a database operation with admin context.
 * Bypasses RLS for admin operations.
 *
 * @param operation - The async database operation to execute
 * @returns The result of the operation
 */
export async function withAdminContext<T>(operation: () => Promise<T>): Promise<T> {
  return withAuthContext({ isAdmin: true }, operation);
}

/**
 * Helper to extract auth context from Better Auth session
 */
export function getAuthContextFromSession(session: {
  user?: { id: string; email: string } | null;
} | null): AuthContext {
  if (!session?.user) {
    return { userId: null, email: null, isAdmin: false };
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    isAdmin: false, // Admin status should be checked separately via admin JWT
  };
}

/**
 * Type for database operations that require auth context
 */
export type AuthenticatedDbOperation<T> = (context: AuthContext) => Promise<T>;
