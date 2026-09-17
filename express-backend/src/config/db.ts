import { Pool, QueryResult, QueryResultRow } from 'pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load environmental configuration
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

// PostgreSQL Connection Pool for AWS RDS
export const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err: Error) => {
  console.error('[AWS RDS DB] Idle client error:', err.message);
});


/**
 * Direct SQL Query execution helper
 */
export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log(`[SQL Query] (${duration}ms) ${text}`, params || '');
  }
  return res;
}


// ============================================================================
// AWS S3 Storage Adapter
// ============================================================================

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const DEFAULT_S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'monthly-grocery-media-prod';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

const storageAdapter = {
  createBucket: async (_bucketName: string, _options?: any) => {
    return { data: { name: _bucketName }, error: null };
  },
  from: (bucket: string) => ({
    upload: async (filePath: string, fileBody: Buffer | Uint8Array | string, options?: { contentType?: string; upsert?: boolean }) => {
      const cleanPath = filePath.replace(/^\/+/, '');
      const s3Key = `${bucket}/${cleanPath}`;
      try {
        const bodyBuffer = typeof fileBody === 'string' ? Buffer.from(fileBody, 'base64') : Buffer.from(fileBody);
        const cmd = new PutObjectCommand({
          Bucket: DEFAULT_S3_BUCKET,
          Key: s3Key,
          Body: bodyBuffer,
          ContentType: options?.contentType || 'image/jpeg',
        });
        await s3Client.send(cmd);
        return { data: { path: s3Key }, error: null };
      } catch (err: any) {
        console.error(`[AWS S3] Upload failed for ${s3Key}:`, err.message);
        return { data: null, error: err };
      }
    },
    getPublicUrl: (filePath: string) => {
      const cleanPath = filePath.replace(/^\/+/, '');
      const s3Key = `${bucket}/${cleanPath}`;
      const publicUrl = `https://${DEFAULT_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
      return { data: { publicUrl } };
    },
  }),
};

// ============================================================================
// AWS RDS Query Builder Helper (Chainable PostgreSQL Adapter)
// ============================================================================

interface QueryFilter {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'ILIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';
  value: any;
}

interface OrderBy {
  column: string;
  ascending: boolean;
}

export class TableQueryBuilder {
  private tableName: string;
  private mode: 'SELECT' | 'INSERT' | 'UPDATE' | 'UPSERT' | 'DELETE' = 'SELECT';
  private selectedColumns: string = '*';
  private filters: QueryFilter[] = [];
  private orFilters: string[] = [];
  private orderClauses: OrderBy[] = [];
  private limitCount?: number;
  private offsetCount?: number;
  private isSingleResult: boolean = false;
  private isMaybeSingleResult: boolean = false;
  private payloadData: any = null;
  private onConflictCols: string[] = ['id'];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*'): this {
    this.selectedColumns = columns === '*' ? '*' : columns;
    return this;
  }

  insert(data: any): this {
    this.mode = 'INSERT';
    this.payloadData = data;
    return this;
  }

  upsert(data: any, options?: { onConflict?: string }): this {
    this.mode = 'UPSERT';
    this.payloadData = data;
    if (options?.onConflict) {
      this.onConflictCols = options.onConflict.split(',').map(c => c.trim());
    }
    return this;
  }

  update(data: any): this {
    this.mode = 'UPDATE';
    this.payloadData = data;
    return this;
  }

  delete(): this {
    this.mode = 'DELETE';
    return this;
  }

  eq(column: string, value: any): this {
    if (value === null || value === undefined) {
      this.filters.push({ column, operator: 'IS NULL', value: null });
    } else {
      this.filters.push({ column, operator: '=', value });
    }
    return this;
  }

  neq(column: string, value: any): this {
    if (value === null || value === undefined) {
      this.filters.push({ column, operator: 'IS NOT NULL', value: null });
    } else {
      this.filters.push({ column, operator: '!=', value });
    }
    return this;
  }

  gt(column: string, value: any): this {
    this.filters.push({ column, operator: '>', value });
    return this;
  }

  gte(column: string, value: any): this {
    this.filters.push({ column, operator: '>=', value });
    return this;
  }

  lt(column: string, value: any): this {
    this.filters.push({ column, operator: '<', value });
    return this;
  }

  lte(column: string, value: any): this {
    this.filters.push({ column, operator: '<=', value });
    return this;
  }

  like(column: string, pattern: string): this {
    this.filters.push({ column, operator: 'LIKE', value: pattern });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.filters.push({ column, operator: 'ILIKE', value: pattern });
    return this;
  }

  in(column: string, values: any[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      this.filters.push({ column: '1', operator: '=', value: 0 });
    } else {
      this.filters.push({ column, operator: 'IN', value: values });
    }
    return this;
  }

  or(orExpression: string): this {
    this.orFilters.push(orExpression);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = { ascending: true }): this {
    this.orderClauses.push({
      column,
      ascending: options.ascending !== false,
    });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetCount = from;
    this.limitCount = Math.max(0, to - from + 1);
    return this;
  }

  single(): this {
    this.isSingleResult = true;
    this.limitCount = 1;
    return this;
  }

  maybeSingle(): this {
    this.isMaybeSingleResult = true;
    this.limitCount = 1;
    return this;
  }

  private buildWhereClause(params: any[]): string {
    const conditions: string[] = [];

    for (const f of this.filters) {
      if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') {
        conditions.push(`"${f.column}" ${f.operator}`);
      } else if (f.operator === 'IN') {
        const inParams = f.value.map((v: any) => {
          params.push(v);
          return `$${params.length}`;
        });
        conditions.push(`"${f.column}" IN (${inParams.join(', ')})`);
      } else {
        params.push(f.value);
        conditions.push(`"${f.column}" ${f.operator} $${params.length}`);
      }
    }

    // Process OR expressions: e.g. "name.ilike.%q%,description.ilike.%q%"
    for (const rawOr of this.orFilters) {
      const parts = rawOr.split(',').map(p => p.trim());
      const orClauses: string[] = [];
      for (const part of parts) {
        const segs = part.split('.');
        if (segs.length >= 3) {
          const col = segs[0];
          const op = segs[1].toUpperCase();
          const val = segs.slice(2).join('.');
          params.push(val);
          orClauses.push(`"${col}" ${op} $${params.length}`);
        }
      }
      if (orClauses.length > 0) {
        conditions.push(`(${orClauses.join(' OR ')})`);
      }
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  /**
   * Execution dispatcher when awaited
   */
  async then(resolve?: (val: { data: any; error: any }) => any, reject?: (err: any) => any) {
    try {
      const res = await this.execute();
      return resolve ? resolve(res) : res;
    } catch (err: any) {
      const errRes = { data: null, error: err };
      return resolve ? resolve(errRes) : errRes;
    }
  }

  private async execute(): Promise<{ data: any; error: any }> {
    if (this.mode === 'INSERT' || this.mode === 'UPSERT') {
      return this.executeInsertOrUpsert();
    }
    if (this.mode === 'UPDATE') {
      return this.executeUpdate();
    }
    if (this.mode === 'DELETE') {
      return this.executeDelete();
    }
    return this.executeSelect();
  }

  private async executeSelect(): Promise<{ data: any; error: any }> {
    const params: any[] = [];
    const whereSql = this.buildWhereClause(params);
    let orderSql = '';
    if (this.orderClauses.length > 0) {
      const orders = this.orderClauses.map(o => `"${o.column}" ${o.ascending ? 'ASC' : 'DESC'}`);
      orderSql = `ORDER BY ${orders.join(', ')}`;
    }

    let limitSql = '';
    if (this.limitCount !== undefined) {
      limitSql = `LIMIT ${this.limitCount}`;
    }
    let offsetSql = '';
    if (this.offsetCount !== undefined) {
      offsetSql = `OFFSET ${this.offsetCount}`;
    }

    // Clean any Supabase/PostgREST nested relationship patterns like "relation_table (...)" across multiple lines
    let rawCols = this.selectedColumns;
    if (rawCols.includes('(')) {
      rawCols = rawCols.replace(/\b\w+\s*\([^)]*\)/gs, '').replace(/,\s*,/g, ',').trim().replace(/^,|,$/g, '');
      if (!rawCols) rawCols = '*';
    }

    const selectSql = rawCols === '*' 
      ? '*' 
      : rawCols.split(',').map(c => c.trim()).filter(Boolean).map(c => c === '*' || c.includes(' ') ? c : `"${c}"`).join(', ');

    const sql = `SELECT ${selectSql} FROM "${this.tableName}" ${whereSql} ${orderSql} ${limitSql} ${offsetSql};`.trim();



    try {
      const res = await query(sql, params);
      let resultData: any = res.rows;
      if (this.isSingleResult) {
        if (res.rows.length === 0) {
          const err = new Error(`Row not found in table "${this.tableName}"`);
          return { data: null, error: err };
        }
        resultData = res.rows[0];
      } else if (this.isMaybeSingleResult) {
        resultData = res.rows.length > 0 ? res.rows[0] : null;
      }
      return { data: resultData, error: null };
    } catch (err: any) {
      console.error(`[DB Error] SELECT on "${this.tableName}":`, err.message);
      return { data: null, error: err };
    }
  }

  private async executeInsertOrUpsert(): Promise<{ data: any; error: any }> {
    const rows = Array.isArray(this.payloadData) ? this.payloadData : [this.payloadData];
    if (rows.length === 0) return { data: [], error: null };

    try {
      const insertedRows: any[] = [];
      for (const row of rows) {
        const keys = Object.keys(row).filter(k => row[k] !== undefined);
        const colNames = keys.map(k => `"${k}"`).join(', ');
        const params: any[] = [];
        const placeholders = keys.map(k => {
          let val = row[k];
          if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
            val = JSON.stringify(val);
          }
          params.push(val);
          return `$${params.length}`;
        }).join(', ');

        let conflictSql = '';
        if (this.mode === 'UPSERT') {
          const conflictTarget = this.onConflictCols.map(c => `"${c}"`).join(', ');
          const updateSets = keys
            .filter(k => !this.onConflictCols.includes(k))
            .map(k => `"${k}" = EXCLUDED."${k}"`);
          
          if (updateSets.length > 0) {
            conflictSql = ` ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateSets.join(', ')}`;
          } else {
            conflictSql = ` ON CONFLICT (${conflictTarget}) DO NOTHING`;
          }
        }

        const sql = `INSERT INTO "${this.tableName}" (${colNames}) VALUES (${placeholders})${conflictSql} RETURNING *;`;
        const res = await query(sql, params);
        if (res.rows.length > 0) {
          insertedRows.push(res.rows[0]);
        }
      }
      const data = Array.isArray(this.payloadData) ? insertedRows : (insertedRows[0] || null);
      return { data, error: null };
    } catch (err: any) {
      console.error(`[DB Error] ${this.mode} on "${this.tableName}":`, err.message);
      return { data: null, error: err };
    }
  }

  private async executeUpdate(): Promise<{ data: any; error: any }> {
    const keys = Object.keys(this.payloadData || {}).filter(k => this.payloadData[k] !== undefined);
    if (keys.length === 0) return { data: null, error: null };

    const params: any[] = [];
    const setClauses = keys.map(k => {
      let val = this.payloadData[k];
      if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
        val = JSON.stringify(val);
      }
      params.push(val);
      return `"${k}" = $${params.length}`;
    });

    const whereSql = this.buildWhereClause(params);
    const sql = `UPDATE "${this.tableName}" SET ${setClauses.join(', ')} ${whereSql} RETURNING *;`;

    try {
      const res = await query(sql, params);
      const data = this.isSingleResult ? (res.rows[0] || null) : res.rows;
      return { data, error: null };
    } catch (err: any) {
      console.error(`[DB Error] UPDATE on "${this.tableName}":`, err.message);
      return { data: null, error: err };
    }
  }

  private async executeDelete(): Promise<{ data: any; error: any }> {
    const params: any[] = [];
    const whereSql = this.buildWhereClause(params);
    const sql = `DELETE FROM "${this.tableName}" ${whereSql} RETURNING *;`;

    try {
      const res = await query(sql, params);
      return { data: res.rows, error: null };
    } catch (err: any) {
      console.error(`[DB Error] DELETE from "${this.tableName}":`, err.message);
      return { data: null, error: err };
    }
  }
}

// ============================================================================
// Native Auth Adapter for Profiles
// ============================================================================

const authAdmin = {
  async createUser(params: { phone?: string; email?: string; phone_confirm?: boolean; user_metadata?: Record<string, any> }) {
    const id = randomUUID();
    const phone = params.phone || '';
    const name = params.user_metadata?.full_name || params.user_metadata?.name || '';
    const role = params.user_metadata?.role || 'customer';
    const email = params.email || params.user_metadata?.email || '';
    const avatarUrl = params.user_metadata?.avatar_url || '';

    try {
      const res = await query(
        `INSERT INTO profiles (id, phone, name, role, email, avatar_url, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, name = EXCLUDED.name, role = EXCLUDED.role, email = EXCLUDED.email
         RETURNING *;`,
        [id, phone, name, role, email, avatarUrl]
      );
      const row = res.rows[0];
      return {
        data: {
          user: {
            id: row.id,
            phone: row.phone,
            email: row.email,
            user_metadata: {
              full_name: row.name,
              name: row.name,
              role: row.role,
              email: row.email,
              avatar_url: row.avatar_url || '',
            } as any,
          },
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async getUserById(id: string) {
    try {
      const res = await query('SELECT * FROM profiles WHERE id = $1 LIMIT 1;', [id]);
      if (res.rows.length === 0) return { data: null, error: new Error('User not found') };
      const row = res.rows[0];
      return {
        data: {
          user: {
            id: row.id,
            phone: row.phone,
            email: row.email,
            user_metadata: {
              full_name: row.name,
              name: row.name,
              role: row.role,
              email: row.email,
              avatar_url: row.avatar_url || '',
            } as any,
          },
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async updateUserById(id: string, params: { user_metadata?: Record<string, any>; email?: string; phone?: string }) {
    try {
      const name = params.user_metadata?.full_name || params.user_metadata?.name;
      const role = params.user_metadata?.role;
      const avatarUrl = params.user_metadata?.avatar_url;
      const updates: string[] = ['updated_at = NOW()'];
      const values: any[] = [id];

      if (name !== undefined) {
        values.push(name);
        updates.push(`name = $${values.length}`);
      }
      if (role !== undefined) {
        values.push(role);
        updates.push(`role = $${values.length}`);
      }
      if (avatarUrl !== undefined) {
        values.push(avatarUrl);
        updates.push(`avatar_url = $${values.length}`);
      }
      if (params.email !== undefined) {
        values.push(params.email);
        updates.push(`email = $${values.length}`);
      }
      if (params.phone !== undefined) {
        values.push(params.phone);
        updates.push(`phone = $${values.length}`);
      }

      const res = await query(
        `UPDATE profiles SET ${updates.join(', ')} WHERE id = $1 RETURNING *;`,
        values
      );
      const row = res.rows[0];
      return {
        data: row ? {
          user: {
            id: row.id,
            phone: row.phone,
            email: row.email,
            user_metadata: {
              full_name: row.name,
              name: row.name,
              role: row.role,
              email: row.email,
              avatar_url: row.avatar_url || '',
            } as any,
          }
        } : null,
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async deleteUser(id: string) {
    try {
      await query('DELETE FROM profiles WHERE id = $1;', [id]);
      return { data: { id }, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async listUsers() {
    try {
      const res = await query('SELECT * FROM profiles ORDER BY created_at DESC;');
      const users = res.rows.map((row: any) => ({

        id: row.id,
        phone: row.phone,
        email: row.email,
        user_metadata: {
          full_name: row.name,
          name: row.name,
          role: row.role,
          email: row.email,
          avatar_url: row.avatar_url || '',
        } as any,
      }));
      return { data: { users }, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },
};


/**
 * Unified AWS RDS Database & S3 Storage Interface
 */
export const db = {
  from(tableName: string) {
    return new TableQueryBuilder(tableName);
  },
  auth: {
    admin: authAdmin,
  },
  storage: storageAdapter,
  query,
  pool,
};

// Aliased as supabase for seamless compatibility
export const supabase = db;
