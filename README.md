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
