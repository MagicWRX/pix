/**
 * Postgres-backed library adapter for the CINE auto-dice engine.
 *
 * The engine (lib/cine-dice.js) expects a `lib` object with:
 *   - dicedRoot()            -> absolute directory chunks are written under
 *   - recordDiceJob({...})   -> finalizes the pre-created job row, returns jobId
 *   - recordDiceChunk({...}) -> inserts one chunk row, returns its id
 *
 * Jobs are pre-created as 'running' by the API handler so the client gets
 * a job id immediately; the engine flips the row to 'done' when ffmpeg
 * finishes. On failure the handler marks it 'failed' (see failDiceJob).
 *
 * Tables live in the `pix2` schema next to the other portable tables;
 * timestamps are ms epochs (BIGINT), matching the migrated schema.
 */
const path = require('node:path');

const DDL_JOBS = `
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
)`;

const DDL_CHUNKS = `
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
)`;

const DDL_INDEX = `
CREATE INDEX IF NOT EXISTS "pix2_dice_chunks_job_idx"
ON "pix2"."dice_chunks" ("job_id", "chunk_index")`;

async function ensureDiceTables(pool) {
  await pool.query(DDL_JOBS);
  await pool.query(DDL_CHUNKS);
  await pool.query(DDL_INDEX);
}

/** Insert a 'running' job row and return its id. */
async function createDiceJob(pool, { userId, sourcePath, sourceFilename, filmKey, chunkSeconds }) {
  const t = Date.now();
  const r = await pool.query(
    `INSERT INTO "pix2"."dice_jobs"
       (user_id, source_path, source_filename, film_key, chunk_seconds, status, progress, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,'running',0,$6,$6)
     RETURNING id`,
    [userId || '', sourcePath, sourceFilename || '', filmKey || '', chunkSeconds, t]);
  return r.rows[0].id;
}

/**
 * Build the engine-facing adapter bound to one pre-created job.
 * recordDiceJob finalizes that row to 'done' (engine calls it once,
 * after ffmpeg finishes and the chunk files are on disk).
 */
function makeDiceLibrary(pool, { jobId, outDir }) {
  return {
    dicedRoot: () => outDir,
    recordDiceJob: async ({ chunkSeconds, chunkCount }) => {
      const t = Date.now();
      await pool.query(
        `UPDATE "pix2"."dice_jobs"
         SET chunk_seconds=$2, chunk_count=$3, status='done', progress=100, updated_at=$4
         WHERE id=$1`,
        [jobId, chunkSeconds, chunkCount, t]);
      return jobId;
    },
    recordDiceChunk: async ({ jobId: jid, chunkIndex, startSeconds, endSeconds, filePath, sizeBytes }) => {
      const r = await pool.query(
        `INSERT INTO "pix2"."dice_chunks"
           (job_id, chunk_index, start_seconds, end_seconds, file_path, size_bytes, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (job_id, chunk_index) DO UPDATE
           SET file_path=EXCLUDED.file_path, size_bytes=EXCLUDED.size_bytes
         RETURNING id`,
        [jid, chunkIndex, startSeconds, endSeconds, filePath, sizeBytes, Date.now()]);
      return r.rows[0].id;
    },
  };
}

/** Mark a job failed — only flips rows still 'running' (never clobbers 'done'). */
async function failDiceJob(pool, jobId, error) {
  await pool.query(
    `UPDATE "pix2"."dice_jobs"
     SET status='failed', error=$2, updated_at=$3
     WHERE id=$1 AND status='running'`,
    [jobId, String(error || 'unknown error').slice(0, 2000), Date.now()]);
}

/** Progress 0..100 while a job runs; ignored once the job is final. */
async function updateDiceProgress(pool, jobId, percent) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  await pool.query(
    `UPDATE "pix2"."dice_jobs"
     SET progress=$2, updated_at=$3
     WHERE id=$1 AND status='running'`,
    [jobId, p, Date.now()]);
}

async function getDiceJob(pool, jobId) {
  const r = await pool.query(
    `SELECT id, user_id, source_path, source_filename, film_key,
            chunk_seconds, chunk_count, duration_seconds, ffmpeg_from,
            status, progress, error, created_at, updated_at
     FROM "pix2"."dice_jobs" WHERE id=$1`,
    [jobId]);
  if (!r.rowCount) return null;
  const j = r.rows[0];
  return {
    id: Number(j.id),
    source_filename: j.source_filename,
    film_key: j.film_key,
    chunk_seconds: j.chunk_seconds,
    chunk_count: Number(j.chunk_count),
    duration_seconds: j.duration_seconds,
    ffmpeg_from: j.ffmpeg_from,
    status: j.status,
    progress: Number(j.progress),
    error: j.error,
    created_at: Number(j.created_at),
    updated_at: Number(j.updated_at),
  };
}

async function getDiceChunks(pool, jobId) {
  const r = await pool.query(
    `SELECT id, chunk_index, start_seconds, end_seconds, file_path, size_bytes
     FROM "pix2"."dice_chunks" WHERE job_id=$1 ORDER BY chunk_index`,
    [jobId]);
  return r.rows.map((c) => ({
    id: Number(c.id),
    chunk_index: Number(c.chunk_index),
    start_seconds: c.start_seconds,
    end_seconds: c.end_seconds,
    file_path: c.file_path,
    size_bytes: Number(c.size_bytes),
  }));
}

/**
 * Resolve a client-supplied source path against the media dir, traversal-safe.
 * Returns the absolute path, or null when it escapes the media dir.
 * Accepts both relative names ("film.mp4") and absolute paths inside the dir.
 */
function resolveDiceSource(mediaDir, rawPath) {
  const p = String(rawPath || '');
  if (!p) return null;
  const abs = path.resolve(mediaDir, p);
  const rel = path.relative(mediaDir, abs);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return abs;
}

module.exports = {
  ensureDiceTables,
  createDiceJob,
  makeDiceLibrary,
  failDiceJob,
  updateDiceProgress,
  getDiceJob,
  getDiceChunks,
  resolveDiceSource,
};
