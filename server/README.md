# Ledge Roofing API and staff workspace backend

This service is deployed separately from the Vercel website. It runs on the Hostinger VPS and owns staff authentication, projects/blogs, uploads, and live workspace messaging.

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

The contact form posts to `POST /api/contact` on this API; SMTP delivery also runs on the VPS. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `CONTACT_TO_EMAIL` in the VPS `.env` only. Do not use `VITE_` prefixes for mail credentials. If the SMTP provider restricts sending IPs, authorize the VPS outbound IP. Vercel only needs the public `VITE_API_URL` pointing to this API.

The API supports invite-only staff provisioning: the owner can create accounts in the staff area and receives a one-time temporary password to hand to the new staff member. New users must change it after signing in. Public website media is served from `uploads/public`; private chat attachments are stored separately and require an authenticated member of that conversation to download them.

## API outline

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/content/project`, `GET /api/content/blog` (published items, public)
- Authenticated create/edit/publish routes under `/api/content/:type`
- `/api/workspace` for staff, channels, DMs, messages, uploads and reactions
- Socket.IO events for live messages, typing indicators, and online presence
