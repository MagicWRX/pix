-- PIX portable: auto-dice jobs + chunks (CINE auto-cut engine, server-side).
-- Run in the Supabase SQL editor AFTER the main 7-schema migration.
-- The server also runs these CREATE TABLE IF NOT EXISTS statements on
-- first use, so this file is belt-and-braces for explicit deploys.

CREATE TABLE IF NOT EXISTS "pix2"."dice_jobs" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" TEXT NOT NULL DEFAULT '',
    "source_path" TEXT NOT NULL,
    "source_filename" TEXT NOT NULL DEFAULT '',
    "film_key" TEXT NOT NULL DEFAULT '',
    "chunk_seconds" DOUBLE PRECISION NOT NULL,
    "chunk_count" BIGINT NOT NULL DEFAULT 0,
    "duration_seconds" DOUBLE PRECISION,
    "ffmpeg_from" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'running',
    "progress" BIGINT NOT NULL DEFAULT 0,
    "error" TEXT NOT NULL DEFAULT '',
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS "pix2"."dice_chunks" (
    "id" BIGSERIAL PRIMARY KEY,
    "job_id" BIGINT NOT NULL REFERENCES "pix2"."dice_jobs"("id") ON DELETE CASCADE,
    "chunk_index" BIGINT NOT NULL,
    "start_seconds" DOUBLE PRECISION NOT NULL,
    "end_seconds" DOUBLE PRECISION NOT NULL,
    "file_path" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "created_at" BIGINT NOT NULL,
    UNIQUE ("job_id", "chunk_index")
);
CREATE INDEX IF NOT EXISTS "pix2_dice_chunks_job_idx" ON "pix2"."dice_chunks" ("job_id", "chunk_index");
