# Nairobi Tech Events

A public board of upcoming Nairobi tech events (hackathons, meetups, workshops, conferences). Wave 1 MVP.

## Run with Docker

```bash
cp .env.example .env   # edit values
docker compose up --build
```

Before starting, set `AUTH_SECRET` in `.env` (generate one: `openssl rand -base64 32`). `AUTH_TRUST_HOST=true` is needed when self-hosting (Docker, `next start`) so Auth.js trusts the Host header; Compose sets it for the app.

The admin signs in at http://localhost:3000/admin/login with `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`.

The `migrate` service runs `prisma migrate deploy` and the seed (2 sources, 10 sample events, 1 admin hashed from `ADMIN_SEED_PASSWORD`) before the app starts. Open http://localhost:3000.

## Database scripts

```bash
npm run db:migrate   # create/apply migrations in dev
npm run db:deploy    # apply migrations (prod/CI)
npm run db:seed      # seed sample data (needs ADMIN_SEED_PASSWORD)
```

## Run locally without Docker

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build
```

See `SOURCES.md`, added in [PR #1](https://github.com/m-falme/nairobi-tech-events/pull/1), for how event sources are accessed.
