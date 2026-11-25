import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  resendApiKey: process.env.RESEND_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || '',
  mailFromName: process.env.MAIL_FROM_NAME || 'Ledge Roofing Workspace',
  contactToEmail: process.env.CONTACT_TO_EMAIL || '',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@ledgeroofing.org',
  turnHost: process.env.TURN_HOST || '',
  turnPort: Number(process.env.TURN_PORT || 3478),
  turnSecret: process.env.TURN_SECRET || '',
  attendanceTimeZone: process.env.ATTENDANCE_TIME_ZONE || 'Africa/Lagos',
  fcmProjectId: process.env.FCM_PROJECT_ID || '',
  fcmServiceAccountPath: process.env.FCM_SERVICE_ACCOUNT_PATH || '',
  apiPublicOrigin: process.env.API_PUBLIC_ORIGIN || 'https://api.ledgeroofing.org',
  pgSslCaPath: process.env.PGSSL_CA || '',
  redisUrl: process.env.REDIS_URL || '',
  allowVercelPreviews: process.env.ALLOW_VERCEL_PREVIEWS === 'true',
  production: process.env.NODE_ENV === 'production',
};
