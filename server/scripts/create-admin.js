import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

const [name, email, password] = process.argv.slice(2);
if (!name || !email || !password || password.length < 12) {
  console.error('Usage: npm run create-admin -- "Full Name" staff@example.com "A-long-unique-password"');
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO staff_users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'owner') RETURNING id, name, email, role`,
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );
    const { rows: channels } = await pool.query("SELECT id FROM conversations WHERE type = 'channel' AND name = 'general' LIMIT 1");
    if (channels[0]) {
      await pool.query('INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [channels[0].id, rows[0].id]);
    }
    console.log(`Created owner account for ${rows[0].email}.`);
  } catch (error) {
    console.error(error.code === '23505' ? 'An account with that email already exists.' : error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
