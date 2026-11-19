import { query } from './db.js';

export async function markAttendance(userId) {
  await query(
    `INSERT INTO attendance_records (user_id, attendance_date)
     VALUES ($1, (NOW() AT TIME ZONE 'Africa/Lagos')::date)
     ON CONFLICT (user_id, attendance_date) DO NOTHING`,
    [userId]
  );
}
