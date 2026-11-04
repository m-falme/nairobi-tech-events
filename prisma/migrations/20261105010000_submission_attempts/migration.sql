-- CreateTable
CREATE TABLE "submission_attempts" (
    "id" UUID NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submission_attempts_ip_hash_created_at_idx" ON "submission_attempts"("ip_hash", "created_at");

