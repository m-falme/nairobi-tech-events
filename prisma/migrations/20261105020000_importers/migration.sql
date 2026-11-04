-- CreateEnum
CREATE TYPE "ImportRunStatus" AS ENUM ('running', 'success', 'failed', 'skipped');

-- AlterTable
ALTER TABLE "sources" ADD COLUMN     "key" TEXT;

-- AlterTable
ALTER TABLE "import_runs" ADD COLUMN     "skipped" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ImportRunStatus" NOT NULL DEFAULT 'running';

-- CreateIndex
CREATE UNIQUE INDEX "sources_key_key" ON "sources"("key");

-- CreateIndex
CREATE INDEX "import_runs_source_id_started_at_idx" ON "import_runs"("source_id", "started_at");


-- Backfill status for any runs recorded before this column existed.
UPDATE "import_runs"
SET "status" = CASE WHEN "error" IS NULL THEN 'success'::"ImportRunStatus" ELSE 'failed'::"ImportRunStatus" END
WHERE "finished_at" IS NOT NULL;
