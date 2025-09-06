import { createClient } from '@supabase/supabase-js';

// Create a secure database client that always uses parameterized queries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase configuration');
}

// Create secure client
const secureSupabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL injection prevention utilities
export class SecureDatabase {
  private static instance: SecureDatabase;
  private client = secureSupabase;

  static getInstance(): SecureDatabase {
    if (!SecureDatabase.instance) {
      SecureDatabase.instance = new SecureDatabase();
    }
    return SecureDatabase.instance;
  }

  // Secure query builder that prevents SQL injection
  async secureSelect(table: string, columns: string[] = ['*'], filters: Record<string, any> = {}, options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
  } = {}) {
    try {
      let query = this.client
        .from(table)
        .select(columns.join(', '));

      // Apply filters securely using Supabase's built-in parameterization
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Validate column name to prevent injection
          const safeColumn = this.sanitizeColumnName(key);
          query = query.eq(safeColumn, value);
        }
      });

      // Apply ordering
      if (options.orderBy) {
        const safeOrderColumn = this.sanitizeColumnName(options.orderBy);
        query = query.order(safeOrderColumn, { ascending: options.ascending ?? false });
      }

      // Apply pagination
      if (options.limit || options.offset) {
        const safeLimit = Math.min(options.limit || 1000, 1000);
        const safeOffset = Math.max(options.offset || 0, 0);
        query = query.range(safeOffset, safeOffset + safeLimit - 1);
      }

      return await query;
    } catch (error) {
      console.error('Secure database query failed:', error);
      throw new Error('Database query failed');
    }
  }

  // Secure insert that validates and sanitizes data
  async secureInsert(table: string, data: Record<string, any>) {
    try {
      // Validate table name
      const safeTable = this.sanitizeTableName(table);
      
      // Remove any potentially dangerous fields
      const sanitizedData = this.sanitizeInsertData(data);
      
      return await this.client
        .from(safeTable)
        .insert([sanitizedData])
        .select();
    } catch (error) {
      console.error('Secure database insert failed:', error);
      throw new Error('Database insert failed');
    }
  }

  // Secure update with proper validation
  async secureUpdate(table: string, data: Record<string, any>, filters: Record<string, any>) {
    try {
      const safeTable = this.sanitizeTableName(table);
      const sanitizedData = this.sanitizeUpdateData(data);
      
      let query = this.client
        .from(safeTable)
        .update(sanitizedData);

      // Apply filters securely
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const safeColumn = this.sanitizeColumnName(key);
          query = query.eq(safeColumn, value);
        }
      });

      return await query.select();
    } catch (error) {
      console.error('Secure database update failed:', error);
      throw new Error('Database update failed');
    }
  }

  // Sanitize table names to prevent injection
  private sanitizeTableName(tableName: string): string {
    // Only allow alphanumeric characters and underscores
    const cleaned = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Whitelist of allowed tables
    const allowedTables = [
      'orders',
      'products',
      'categories',
      'reviews',
      'users',
      'site_settings',
      'discount_codes',
      'featured_products',
      'gem_facts',
      'quotes',
      'faq',
      'pages',
      'page_content'
    ];

    if (!allowedTables.includes(cleaned)) {
      throw new Error(`Table '${tableName}' is not allowed`);
    }

    return cleaned;
  }

  // Sanitize column names to prevent injection
  private sanitizeColumnName(columnName: string): string {
    // Only allow alphanumeric characters, underscores, and dots (for joins)
    const cleaned = columnName.replace(/[^a-zA-Z0-9_\.]/g, '');
    
    if (cleaned.length === 0) {
      throw new Error(`Invalid column name: ${columnName}`);
    }

    return cleaned;
  }

  // Sanitize data for insert operations
  private sanitizeInsertData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Skip dangerous fields
      if (this.isDangerousField(key)) {
        console.warn(`Skipping dangerous field: ${key}`);
        return;
      }

      // Sanitize the key and value
      const safeKey = this.sanitizeColumnName(key);
      sanitized[safeKey] = this.sanitizeValue(value);
    });

    return sanitized;
  }

  // Sanitize data for update operations (more restrictive)
  private sanitizeUpdateData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Skip system fields that should never be updated directly
      if (this.isSystemField(key) || this.isDangerousField(key)) {
        console.warn(`Skipping protected field: ${key}`);
        return;
      }

      const safeKey = this.sanitizeColumnName(key);
      sanitized[safeKey] = this.sanitizeValue(value);
    });

    return sanitized;
  }

  // Check if field is dangerous and should be blocked
  private isDangerousField(fieldName: string): boolean {
    const dangerousFields = [
      'password',
      'secret',
      'token',
      'key',
      'admin',
      'role',
      'permission',
      'auth',
      'session'
    ];

    const lowerField = fieldName.toLowerCase();
    return dangerousFields.some(dangerous => lowerField.includes(dangerous));
  }

  // Check if field is a system field that shouldn't be updated directly
  private isSystemField(fieldName: string): boolean {
    const systemFields = [
      'id',
      'created_at',
      'updated_at',
      'user_id',
      'auth_id'
    ];

    return systemFields.includes(fieldName.toLowerCase());
  }

  // Sanitize individual values
  private sanitizeValue(value: any): any {
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
      const sanitized: any = {};
      Object.entries(value).forEach(([k, v]) => {
        const safeKey = k.replace(/[^a-zA-Z0-9_]/g, '');
        if (safeKey) {
          sanitized[safeKey] = this.sanitizeValue(v);
        }
      });
      return sanitized;
    }

    return value;
  }

  // Get the raw client for advanced operations (use with caution)
  getRawClient() {
    console.warn('Raw database client accessed - ensure proper security measures');
    return this.client;
  }
}

// Export singleton instance
export const secureDB = SecureDatabase.getInstance();

// Legacy export for existing code
export { secureSupabase };