// Legacy shim: redirects all previous supabase imports to the pure AWS RDS PostgreSQL client
export { db, supabase, pool, query } from './db';
