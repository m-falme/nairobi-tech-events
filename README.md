# Nairobi Tech Events

A public board of upcoming Nairobi tech events (hackathons, meetups, workshops, conferences). Wave 1 MVP.

## Run with Docker

```bash
cp .env.example .env   # edit values
docker compose up --build
```

Open http://localhost:3000.

## Run locally without Docker

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

See `SOURCES.md` (PR 0) for how event sources are accessed.
