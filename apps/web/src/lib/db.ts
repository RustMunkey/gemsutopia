// Re-export database client and schema from the shared package
export { db, type Database } from '@gemsutopia/database';
export * from '@gemsutopia/database';

// Additional exports for Drizzle SQL builder
import { sql as drizzleSql } from 'drizzle-orm';
export { drizzleSql };

// App-specific: Raw SQL client for legacy queries
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _neonSql: NeonQueryFunction<false, false> | null = null;

function getNeonSql(): NeonQueryFunction<false, false> {
  if (_neonSql) return _neonSql;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  _neonSql = neon(url);
  return _neonSql;
}

// Export raw SQL client for legacy queries (lazy initialized)
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getNeonSql()(strings, ...values);
}

// Legacy query helpers (for backward compatibility during migration)
// Note: These use raw SQL via Neon tagged templates
export async function query<T = unknown>(queryText: string, params?: unknown[]): Promise<T[]> {
  try {
    const neonSql = getNeonSql();

    // For simple queries without params, just execute directly
    if (!params || params.length === 0) {
      const result = await neonSql`${drizzleSql.raw(queryText)}`;
      return result as T[];
    }

    // For parameterized queries, use raw SQL with parameter substitution
    // Replace $1, $2, etc with actual values (escaped)
    let processedQuery = queryText;
    params.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      const value =
        typeof param === 'string'
          ? `'${param.replace(/'/g, "''")}'`
          : param === null
            ? 'NULL'
            : String(param);
      processedQuery = processedQuery.replace(placeholder, value);
    });

    const result = await neonSql`${drizzleSql.raw(processedQuery)}`;
    return result as T[];
  } catch (error) {
    throw error;
  }
}

export async function queryOne<T = unknown>(
  queryText: string,
  params?: unknown[]
): Promise<T | null> {
  const results = await query<T>(queryText, params);
  return results[0] || null;
}
