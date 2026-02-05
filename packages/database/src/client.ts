import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import postgres from 'postgres';
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type DbInstance = NeonHttpDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

// Lazy-initialized database instance (prevents build-time connection)
let _db: DbInstance | null = null;

function isNeonUrl(url: string): boolean {
  return url.includes('neon.tech');
}

// Get the database instance (lazy initialization)
export function getDb(): DbInstance {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (isNeonUrl(url)) {
    // Production: Use Neon HTTP driver (serverless-optimized)
    const sql = neon(url);
    _db = drizzleNeon(sql, { schema });
  } else {
    // Local development: Use postgres.js driver (standard TCP)
    const sql = postgres(url);
    _db = drizzlePostgres(sql, { schema });
  }

  return _db;
}

// For backwards compatibility - use getDb() for lazy init
export const db = new Proxy({} as DbInstance, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Type exports
export type Database = DbInstance;
