import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, gte, lt, sql } from 'drizzle-orm';

// SQL injection prevention utilities
export class SecureDatabase {
  private static instance: SecureDatabase;

  static getInstance(): SecureDatabase {
    if (!SecureDatabase.instance) {
      SecureDatabase.instance = new SecureDatabase();
    }
    return SecureDatabase.instance;
  }

  // Secure query using Drizzle - already parameterized by design
  async secureSelect<T extends keyof typeof schema>(
    tableName: T,
    filters: Record<string, unknown> = {},
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      const table = schema[tableName];
      if (!table) {
        throw new Error(`Table '${tableName}' not found`);
      }

      // Drizzle queries are parameterized by default
      // Build conditions array
      const conditions = Object.entries(filters)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
          const column = (table as unknown as Record<string, unknown>)[key];
          if (!column) {
            throw new Error(`Column '${key}' not found in table '${tableName}'`);
          }
          return eq(column as Parameters<typeof eq>[0], value);
        });

      // Use the query builder with the table
      const query = db.query[tableName as keyof typeof db.query];
      if (!query) {
        throw new Error(`Query builder for '${tableName}' not found`);
      }

      return await (
        query as unknown as { findMany: (options: Record<string, unknown>) => Promise<unknown[]> }
      ).findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: options.limit ? Math.min(options.limit, 1000) : undefined,
        offset: options.offset ? Math.max(options.offset, 0) : undefined,
      });
    } catch {
      throw new Error('Database query failed');
    }
  }

  // Sanitize value for additional safety
  sanitizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      // Remove potentially dangerous content
      return value
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/expression\s*\(/gi, '') // Remove CSS expressions
        .trim()
        .substring(0, 10000); // Limit length
    }

    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }

    if (typeof value === 'boolean') {
      return Boolean(value);
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item)).slice(0, 1000);
    }

    if (typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
        const safeKey = k.replace(/[^a-zA-Z0-9_]/g, '');
        if (safeKey) {
          sanitized[safeKey] = this.sanitizeValue(v);
        }
      });
      return sanitized;
    }

    return value;
  }

  // Check if field is dangerous and should be blocked
  isDangerousField(fieldName: string): boolean {
    const dangerousFields = [
      'password',
      'secret',
      'token',
      'key',
      'admin',
      'role',
      'permission',
      'auth',
      'session',
    ];

    const lowerField = fieldName.toLowerCase();
    return dangerousFields.some(dangerous => lowerField.includes(dangerous));
  }

  // Check if field is a system field that shouldn't be updated directly
  isSystemField(fieldName: string): boolean {
    const systemFields = [
      'id',
      'created_at',
      'createdAt',
      'updated_at',
      'updatedAt',
      'user_id',
      'userId',
      'auth_id',
      'authId',
    ];

    return systemFields.includes(fieldName);
  }

  // Get the database instance for advanced operations
  getDB() {
    return db;
  }
}

// Export singleton instance
export const secureDB = SecureDatabase.getInstance();
