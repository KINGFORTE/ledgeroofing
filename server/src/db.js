import fs from 'node:fs';
import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

function buildSslConfig() {
  const mode = String(process.env.PGSSL || '').toLowerCase();
  if (mode !== 'true' && mode !== 'require' && mode !== 'verify-full') return undefined;
  const ssl = { rejectUnauthorized: true };
  if (config.pgSslCaPath) ssl.ca = fs.readFileSync(config.pgSslCaPath, 'utf8');
  return ssl;
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: buildSslConfig(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function query(text, values) {
  return pool.query(text, values);
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}
