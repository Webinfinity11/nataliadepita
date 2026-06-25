# Setup — Natalia de Pita Gallery

The app is fully built. Everything below requires credentials I don't have
locally, so these are the steps to finish bringing it online.

## 1. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL=          # Neon Postgres connection string
AUTH_SECRET=           # openssl rand -base64 32
BLOB_READ_WRITE_TOKEN= # Vercel Blob token
ADMIN_EMAIL=           # your admin login email
ADMIN_PASSWORD=        # your admin login password
```

- **Neon**: create a project at neon.tech (or via the Vercel Marketplace) and
  copy the connection string.
- **Vercel Blob**: in the Vercel dashboard → Storage → create a Blob store, copy
  its read/write token. (On Vercel, this var is injected automatically.)

## 2. Create the database tables

```bash
npm run db:push
```

## 3. Create the admin user

```bash
npm run seed:admin
```

Then log in at `/admin/login`. (The single `site_settings` row is created
automatically the first time you save the Settings page — no manual seed needed.)

## 4. Run locally

```bash
npm run dev
```

Build the admin content (categories → paintings → featured slider → blog →
settings), or import the old site first (next step).

## 5. (Optional) Import the old WordPress site

Review/adjust the page→category map in `scripts/wp-map.ts`, then:

```bash
npm run migrate:wp
```

This downloads images from nataliadepita.com, uploads them to Blob, and creates
categories + paintings. Migrated titles come from image filenames and will need
a quick tidy-up pass in the admin afterward.

> Note: the old site uses a self-signed TLS cert. The migration script relaxes
> cert verification **only** for requests to that one host (via a scoped undici
> dispatcher); the database and Blob connections keep full TLS verification.

## 6. Deploy

Push to a Vercel project. Set the same env vars in the Vercel dashboard
(`BLOB_READ_WRITE_TOKEN` is auto-provided when you attach a Blob store).

## Verified locally

- `npm run test` — 13 tests pass (slug, validation, auth, sanitize)
- `npm run lint` — clean
- `npm run build` — all routes compile

## Not yet verified (needs the credentials above)

- DB push / admin seed
- Login + admin CRUD flows
- Image uploads to Blob
- The WordPress migration run
