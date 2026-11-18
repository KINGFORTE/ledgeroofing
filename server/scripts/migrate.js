import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const schema = await fs.readFile(path.join(dirname, '..', 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Database schema is up to date.');
} finally {
  await pool.end();
}
