# Nairobi Tech Events

A public board of upcoming Nairobi tech events (hackathons, meetups, workshops, conferences). Wave 1 MVP.

## Run with Docker (one command)

```bash
cp .env.example .env   # set AUTH_SECRET and ADMIN_SEED_PASSWORD first
docker compose up --build
```

Rate limits (admin login failures and public submissions) key off a salted IP hash. Set `TRUSTED_PROXY=true` (or `TRUST_X_FORWARDED_FOR=true`) in production behind Vercel or one reverse proxy so the app uses the rightmost `X-Forwarded-For` hop the proxy added. Leave it unset locally (or when not behind a proxy): forged `X-Forwarded-For` headers are ignored and **every request shares a single `"direct"` bucket**, so a busy shared IP can hit the limit for everyone on that host. Compose passes `TRUSTED_PROXY` through from `.env`.

Before starting, set `AUTH_SECRET` in `.env` (generate one: `openssl rand -base64 32`). `AUTH_TRUST_HOST=true` is needed when self-hosting (Docker, `next start`) so Auth.js trusts the Host header; Compose sets it for the app.

The admin signs in at http://localhost:3000/admin/login with `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`.

The `migrate` service runs `prisma migrate deploy` and the seed (2 sources, 10 sample events, 1 admin hashed from `ADMIN_SEED_PASSWORD`) before the app starts. Open http://localhost:3000.

## Database scripts

```bash
npm run db:migrate   # create/apply migrations in dev
npm run db:deploy    # apply migrations (prod/CI)
npm run db:seed      # seed sample data (needs ADMIN_SEED_PASSWORD)
npm run db:backfill-urls  # fill events.normalized_url on existing rows (seed also does this)
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

## End-to-end tests (Playwright)

The E2E suite (`e2e/`) runs Chromium against a production build and a migrated, seeded Postgres. It covers submit → admin approve → listed → filters, the 404 pages and `/sources`. The browser is blocked from every origin except the app, so the tests make no live external calls.

```bash
npx playwright install chromium            # once
docker compose up -d db                    # or any Postgres 16
export DATABASE_URL=postgresql://events:change-me@localhost:5432/events
export ADMIN_SEED_PASSWORD=change-me-admin-password AUTH_SECRET=dev-only-secret
npm run db:deploy && npm run db:seed
npm run build
npm run test:e2e                           # starts `next start` on :3000
```

Set `E2E_BASE_URL` to test an app that is already running (for example the Docker stack at http://localhost:3000). The submit form is rate-limited to 5 per IP per hour, so reseed or clear `submission_attempts` if you rerun it many times. In CI the `e2e` job does the same with CI-only credentials and uploads the Playwright report and traces if it fails.

## Pages

- `/`: upcoming events with search and filters, plus empty states.
- `/events/[id]`: event detail. It shows "Happening now" or "Ended" for events in progress or in the past (events with no end time count as 2 hours long).
- `/submit`: public submission form, with an "Online event" option where the venue is optional.
- `/sources`: where listings come from (feeds from the `sources` table plus a summary of `SOURCES.md`).
- `/admin`: review queue and sources (admin only).

See `SOURCES.md`, added in [PR #1](https://github.com/m-falme/nairobi-tech-events/pull/1), for how event sources are accessed.
