-- Normalised URL (host without www, no trailing slash, no #hash, no utm_*)
-- for indexed duplicate checks. Nullable so the migration is instant;
-- existing rows are backfilled by `npm run db:backfill-urls` (also run by
-- `prisma db seed`), which uses the same normaliser as the app.
ALTER TABLE "events" ADD COLUMN "normalized_url" TEXT;

-- CreateIndex
CREATE INDEX "events_normalized_url_idx" ON "events"("normalized_url");
