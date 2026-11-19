# Ledge Roofing API and staff workspace backend

This service runs on the Hostinger VPS and backs the Vercel website, staff authentication, projects/blogs, uploads, task management, notifications, and small-group video meetings.

## Local setup

1. Install Node.js 20+ and Docker Desktop.
2. From this directory, run `docker compose up -d` to start PostgreSQL.
3. Copy `.env.example` to `.env`; set a random `JWT_SECRET` with at least 32 characters.
4. Run `npm install`, then `npm run migrate`.
5. Create the first owner with a password read from stdin: `read -rsp "Initial password: " OWNER_PASSWORD; printf '\n'; printf '%s\n' "$OWNER_PASSWORD" | npm run create-admin -- "Your Name" you@example.com --password-stdin; unset OWNER_PASSWORD`. The owner must change it on first login.
6. Run `npm run dev`. The API listens on `http://localhost:4000`.

The Vite site uses `VITE_API_URL=http://localhost:4000/api` locally. In Vercel, set it to the HTTPS API origin, for example `https://api.ledgeroofing.org/api`, and add the exact Vercel website origin to `FRONTEND_ORIGIN` on the VPS. Set `NODE_ENV=production` so staff session cookies use `Secure` and `SameSite=None`.

## Hostinger VPS deployment

Use a supported Node.js LTS release and PostgreSQL 15+. Keep the API behind HTTPS (for example `api.ledgeroofing.org` via Nginx), run it with a process manager such as systemd or PM2, and keep `.env`, database backups, and `uploads/` outside Git. Set `UPLOAD_DIR` to persistent storage. Restrict PostgreSQL to localhost/private networking and back up both the database and uploaded files.

The contact form posts to `POST /api/contact` on this API; Resend Email API delivery also runs on the VPS. Set `RESEND_API_KEY`, the Resend-verified `MAIL_FROM`, and `CONTACT_TO_EMAIL` in the VPS `.env` only. Vercel only needs the public `VITE_API_URL` pointing to this API.

Staff profiles include an editable bio and photo. Attendance is automatically marked on each staff member’s first authenticated visit per day (Africa/Lagos by default); only that staff member and owners/admins can view the attendance calendar.

The staff workspace includes tasks, email/browser-push notifications, and small-group WebRTC meetings. Push requires `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in the VPS `.env`. TURN relay uses `TURN_HOST`, `TURN_PORT`, and `TURN_SECRET`; allow inbound UDP/TCP 3478 and UDP relay ports 49160–49200 on the VPS firewall. Keep all private keys and shared secrets out of Git and Vercel.

The API supports invite-only staff provisioning: the owner can create accounts in the staff area and receives a one-time temporary password to hand to the new staff member. New users must change it after signing in. Public website media is served from `uploads/public`; private chat attachments are stored separately and require an authenticated member of that conversation to download them.

## API outline

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/content/project`, `GET /api/content/blog` (published items, public)
- Authenticated create/edit/publish routes under `/api/content/:type`
- `/api/workspace/tasks` for assignments, status, comments, and notifications
- `/api/workspace/meetings` for scheduled calls and authenticated WebRTC signaling
- `/api/workspace/notifications` for in-app alerts and browser push subscriptions
- `/api/contact` for contact-form emails sent from the VPS
- Socket.IO events for live messages, typing, presence, tasks, notifications, and WebRTC signaling
