# Ledge Roofing website and staff workspace

The public React/Vite website stays deployed on Vercel. Staff sign in at `/staff` on the same domain. A separate Node.js API, PostgreSQL database, Socket.IO messaging service, and private chat-file storage run on the Hostinger VPS.

## Local website development

```sh
npm install
npm run dev
```

Without a configured API, public projects and blog pages use the existing built-in content. To connect to a running local API, set `VITE_API_URL=http://localhost:4000/api` in the root `.env.local` file.

## Backend setup

See [`server/README.md`](server/README.md) for local PostgreSQL setup, first-owner creation, and VPS deployment. The API requires PostgreSQL and Node.js 20+.

## Deployment checklist

1. Deploy `server/` to the Hostinger VPS and create a PostgreSQL database.
2. Configure a DNS name such as `api.ledgeroofing.org`, HTTPS reverse proxy, persistent `UPLOAD_DIR`, and the server variables from `server/.env.example`.
3. Set `FRONTEND_ORIGIN` to the exact Vercel production domain (include any `www`/apex domain staff use).
4. Run the backend schema migration and create the first owner account.
5. Set Vercel's `VITE_API_URL` to the HTTPS API URL ending in `/api`, then redeploy the frontend.
6. Test login, invite a staff member, publish a draft project/blog, and verify it appears on the public site.

Do not commit `.env` files, database credentials, JWT secrets, or uploaded chat files.

## Security configuration

- Frontend: set `VITE_API_URL` (see `.env.example`). This value is public by design; it must contain no secrets.
- Backend: see `server/.env.example` for all variables. `JWT_SECRET` must be at least 32 random characters. `FCM_SERVICE_ACCOUNT_PATH` and all private keys stay on the VPS.
- Database TLS: leave `PGSSL` unset for local development. For hosted PostgreSQL set `PGSSL=require` (verification is always enforced) and optionally `PGSSL_CA=/path/to/provider-ca.pem`.
- Session model: access tokens last 15 minutes, refresh tokens last 7 days and rotate on every use. Refresh tokens are stored only as SHA-256 hashes. Each token is tied to a specific session ID: logout revokes only that device, while password changes and staff deactivation revoke every session.
- Vercel preview origins are denied unless `ALLOW_VERCEL_PREVIEWS=true` is set explicitly. Cross-site state-changing requests are rejected when the browser sends `Sec-Fetch-Site: cross-site`.
- Run `npm run migrate` in `server/` after upgrading so `session_version`, `refresh_tokens` and `drawing_submission_assignments` exist.
- Rate limits are shared through Redis when `REDIS_URL` is set (keys use the `ledge:rl:` prefix). If Redis is unset or unreachable, the API falls back to in-memory limits.
- Drawing submissions use assigned access: owners/admins see all submissions and manage assignments; other staff see and open only submissions assigned to them.
- Owners/admins can reset a staff password. The temporary password is emailed, all existing sessions are revoked, and the user must choose a new password at next sign-in. Admin creation remains owner-only.
- All browser requests should use HTTPS. State-changing requests are rejected when the `Origin` header is not in `FRONTEND_ORIGIN` (or an explicitly allowed Vercel preview domain).
- Uploaded public files are checked against both extension and content signature before being served.
- Run `npm test` in `server/` for focused authentication and validation checks.

## Import existing website content

The staff content manager can edit the projects and articles already on the public site. To idempotently seed those existing records and copy their media into the API upload store, run from the repository root after configuring the API environment:

```sh
API_ENV_FILE=/path/to/server/.env npm run seed:website-content
```

On the Hostinger VPS, use the protected API environment file path. The script inserts only missing content records.
