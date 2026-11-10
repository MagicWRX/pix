// CINE dice / auto-cut engine (ported for the PIX.MOV portable web server).
//
// Dices a film into fixed-length chunks with the ffmpeg segment muxer in
// copy mode: no re-encoding, so even a 1.5 GB film slices in seconds. The
// trade-off is that cut boundaries land on keyframes — chunk edges snap to
// the nearest keyframe, within a fraction of a second of the requested
// length.
//
// No ffmpeg is bundled with the app. The binary resolves in this order:
//   1. the `ffmpeg-static` npm package (installed by `npm install`),
//   2. a system `ffmpeg` found on PATH.
// If neither exists the call fails with a clear, actionable message.
//
// Chunks are written to <DICE_OUTPUT_DIR>/<film>-<timestamp>/ and every
// job + chunk is recorded in Postgres (see dice-library.js), so chunks
// trace back to their source film. The module takes an explicit library
// object and touches nothing server-specific, so it can be unit-tested
// with plain node.
//
// Portable adaptation note: the Electron original called
// lib.recordDiceJob / lib.recordDiceChunk synchronously against
// better-sqlite3. The Postgres adapter is async, so those two call sites
// are awaited here (see below). Everything else is unchanged.
const path = require("node:path");
const fs = require("node:fs");
const { spawn, spawnSync } = require("node:child_process");
const readline = require("node:readline");

const MAX_CHUNK_SECONDS = 24 * 60 * 60; // 24h sanity cap
const MAX_CHUNKS = 5000;

let activeDice = null;

/** True while a dice job is running (the API refuses a second job meanwhile). */
function isDicing() {
  return activeDice !== null;
}

function resolveFfmpegPath() {
  // 1. ffmpeg-static package binary (per-platform, installed by npm).
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const bundled = require("ffmpeg-static");
    if (bundled && typeof bundled === "string" && fs.existsSync(bundled)) {
      return { ffmpegPath: bundled, from: "ffmpeg-static" };
    }
  } catch {
    /* not installed — fall through to PATH */
  }
  // 2. System ffmpeg on PATH.
  try {
    const probe = spawnSync("ffmpeg", ["-hide_banner", "-version"], {
      encoding: "utf8",
      timeout: 8000,
    });
    if (probe && !probe.error && probe.status === 0) {
      return { ffmpegPath: "ffmpeg", from: "PATH" };
    }
  } catch {
    /* not on PATH either */
  }
  throw new Error(
    "ffmpeg is not installed. Run `npm install` (ffmpeg-static is a dependency) " +
      "or install a system ffmpeg on PATH."
  );
}

function parseDurationText(stderrText) {
  const match = /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(stderrText);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const total = hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(total) && total > 0 ? total : null;
}

/** Read a media file's duration via `ffmpeg -i` (no ffprobe needed). */
function probeDuration(ffmpegPath, filePath) {
  return new Promise((resolve) => {
    const child = spawn(ffmpegPath, ["-hide_banner", "-i", filePath], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 65536) stderr = stderr.slice(-65536);
    });
    child.on("error", () => resolve(null));
    child.on("close", () => resolve(parseDurationText(stderr)));
  });
}

function safeStem(filename) {
  const stem = path.basename(filename).replace(/\.[^.]+$/, "");
  const safe = stem.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || "film";
}

function timestampTag() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/**
 * Dice a film into fixed-length chunks.
 *
 * Two modes:
 * - Fixed mode: chunkSeconds (> 0). Fast single-pass ffmpeg segment muxer.
 * - Marks mode: cutPoints (array of seconds). Cuts at the exact positions.
 *   One ffmpeg pass per segment, still stream-copy (cuts snap to nearby
 *   keyframes as usual).
 *
 * @param {object} options
 * @param {object} options.lib            library adapter (dicedRoot + DB writers)
 * @param {string} options.sourcePath     absolute path of the film to dice
 * @param {string} options.sourceFilename display name of the film
 * @param {number|null} options.sourceImportId  imports.id when dicing a library clip
 * @param {number} [options.chunkSeconds] requested chunk length in seconds (fixed mode)
 * @param {number[]} [options.cutPoints]  explicit cut positions in seconds (marks mode)
 * @param {(p:{percent:number,done:boolean})=>void} [options.onProgress]
 * @returns {Promise<{jobId:number,chunkSeconds:number,durationSeconds:number,chunks:Array}>}
 */
async function diceFilm(options) {
  const { lib, sourcePath, sourceFilename, sourceImportId, chunkSeconds, cutPoints, onProgress } = options || {};
  if (activeDice) {
    throw new Error("A dice job is already running — wait for it to finish first.");
  }
  const marksMode = Array.isArray(cutPoints) && cutPoints.length > 0;
  const chunk = Number(chunkSeconds);
  if (!marksMode && (!Number.isFinite(chunk) || chunk <= 0)) {
    throw new Error("Pick a chunk length greater than zero (e.g. 1:59, 119, 9s, 30m).");
  }
  if (!marksMode && chunk > MAX_CHUNK_SECONDS) {
    throw new Error("Chunk length is capped at 24 hours.");
  }
  if (typeof sourcePath !== "string" || !sourcePath) {
    throw new Error("Pick a film to dice first.");
  }
  let stat;
  try {
    stat = fs.statSync(sourcePath);
  } catch {
    throw new Error(`The source film is missing: ${sourcePath}`);
  }
  if (!stat.isFile()) throw new Error("The dice source is not a file.");

  const { ffmpegPath, from } = resolveFfmpegPath();

  // Take the single-job guard synchronously here (before the first await
  // below) so two racing callers can't both slip past the check at the top.
  const job = { startTime: Date.now() };
  activeDice = job;
  try {
    const duration = await probeDuration(ffmpegPath, sourcePath);
    if (duration === null) {
      throw new Error(`Could not read the duration of “${sourceFilename || path.basename(sourcePath)}”.`);
    }

    // Build the segment list: [{ start, end }].
    let segments;
    let jobChunkSeconds;
  if (marksMode) {
    const cleaned = [];
    for (const raw of cutPoints) {
      const p = Number(raw);
      if (!Number.isFinite(p) || p <= 0.5 || p >= duration - 0.5) continue;
      if (cleaned.length > 0 && p - cleaned[cleaned.length - 1] < 1) continue;
      cleaned.push(p);
    }
    cleaned.sort((a, b) => a - b);
    if (cleaned.length === 0) {
      throw new Error("No usable cut marks — drag a mark inside the film first.");
    }
    const bounds = [0, ...cleaned, duration];
    segments = [];
    for (let i = 0; i < bounds.length - 1; i += 1) {
      segments.push({ start: bounds[i], end: bounds[i + 1] });
    }
    jobChunkSeconds = duration / segments.length; // mean, for the job record
  } else {
    const count = Math.ceil(duration / chunk);
    segments = [];
    for (let i = 0; i < count; i += 1) {
      segments.push({ start: i * chunk, end: Math.min((i + 1) * chunk, duration) });
    }
    jobChunkSeconds = chunk;
  }
  if (segments.length > MAX_CHUNKS) {
    throw new Error(
      `That would make ${segments.length.toLocaleString()} chunks (cap: ${MAX_CHUNKS.toLocaleString()}). Use fewer cut marks or a longer chunk length.`
    );
  }

  const stem = safeStem(sourceFilename || path.basename(sourcePath));
  // Dice footage lives under the server's dice output dir: <DICE_OUTPUT_DIR>/<stem>-<timestamp>/
  const diceBase = typeof lib.dicedRoot === "function" ? lib.dicedRoot() : path.join(lib.pixDir, "diced");
  const outDir = path.join(diceBase, `${stem}-${timestampTag()}`);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = (index) => path.join(outDir, `${stem}_chunk${String(index).padStart(3, "0")}.mp4`);

  const emit = (percent, done) => {
    if (job !== activeDice) return;
    try {
      onProgress && onProgress({ percent, done });
    } catch {
      /* listener errors must not break the job */
    }
  };
  emit(0, false);

  try {
    if (marksMode) {
      await runMarkCuts(ffmpegPath, sourcePath, segments, outFile, emit);
    } else {
      const pattern = path.join(outDir, `${stem}_chunk%03d.mp4`);
      const args = [
        "-hide_banner",
        "-nostats",
        "-y",
        "-i",
        sourcePath,
        "-c",
        "copy",
        "-f",
        "segment",
        "-segment_time",
        String(chunk),
        "-reset_timestamps",
        "1",
        "-progress",
        "pipe:1",
        pattern,
      ];
      await runSegmentMuxer(ffmpegPath, args, duration, emit);
    }
    emit(100, true); // still the active job here, so the "done" event goes out
  } finally {
    if (activeDice === job) activeDice = null;
  }

  // Collect the chunks the muxer wrote.
  const prefix = `${stem}_chunk`;
  const files = fs
    .readdirSync(outDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".mp4"))
    .sort();
  if (files.length === 0) {
    throw new Error("ffmpeg finished but wrote no chunks — the source may be unreadable.");
  }

  // PORTABLE ADAPTATION: the Postgres adapter is async, so the two writer
  // calls are awaited here (the Electron original called them synchronously).
  const jobId = await lib.recordDiceJob({
    sourceImportId: sourceImportId ?? null,
    sourcePath,
    sourceFilename: sourceFilename || path.basename(sourcePath),
    chunkSeconds: jobChunkSeconds,
    chunkCount: files.length,
  });
  const chunks = [];
  for (let index = 0; index < files.length; index += 1) {
    const name = files[index];
    const filePath = path.join(outDir, name);
    const sizeBytes = fs.statSync(filePath).size;
    const seg = segments[Math.min(index, segments.length - 1)];
    const startSeconds = seg.start;
    const endSeconds = seg.end;
    const id = await lib.recordDiceChunk({
      jobId,
      chunkIndex: index,
      startSeconds,
      endSeconds,
      filePath,
      sizeBytes,
    });
    chunks.push({ id, job_id: jobId, chunk_index: index, start_seconds: startSeconds, end_seconds: endSeconds, file_path: filePath, size_bytes: sizeBytes });
  }

  return { jobId, chunkSeconds: jobChunkSeconds, durationSeconds: duration, ffmpegFrom: from, chunks };
  } catch (err) {
    if (activeDice === job) activeDice = null;
    throw err;
  }
}

/** Marks mode: one stream-copy pass per segment, cutting at explicit positions. */
function runMarkCuts(ffmpegPath, sourcePath, segments, outFile, emit) {
  return (async () => {
    for (let i = 0; i < segments.length; i += 1) {
      const { start, end } = segments[i];
      await runOneCut(ffmpegPath, ["-hide_banner", "-nostats", "-y", "-ss", String(start), "-to", String(end), "-i", sourcePath, "-c", "copy", outFile(i)]);
      emit(Math.min(99, Math.round(((i + 1) / segments.length) * 100)), false);
    }
  })();
}

function runOneCut(ffmpegPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderrTail = "";
    child.stderr.on("data", (data) => {
      stderrTail += data.toString();
      if (stderrTail.length > 8192) stderrTail = stderrTail.slice(-8192);
    });
    child.on("error", (err) => {
      reject(new Error(`Could not start ffmpeg: ${err.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else {
        const detail = stderrTail.trim().split("\n").slice(-4).join(" ").slice(0, 300);
        reject(new Error(`ffmpeg failed (exit ${code})${detail ? `: ${detail}` : ""}`));
      }
    });
  });
}

function runSegmentMuxer(ffmpegPath, args, duration, emit) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    const totalUs = Math.max(1, Math.round(duration * 1_000_000));
    const rl = readline.createInterface({ input: child.stdout });
    let stderrTail = "";
    let sawEnd = false;

    rl.on("line", (line) => {
      const match = /^out_time_us=(\d+)$/.exec(line.trim());
      if (match) {
        const percent = Math.min(99, Math.round((Number(match[1]) / totalUs) * 100));
        emit(percent, false);
      } else if (line.trim() === "progress=end") {
        sawEnd = true;
      }
    });
    child.stderr.on("data", (data) => {
      stderrTail += data.toString();
      if (stderrTail.length > 8192) stderrTail = stderrTail.slice(-8192);
    });
    child.on("error", (err) => {
      reject(new Error(`Could not start ffmpeg: ${err.message}`));
    });
    child.on("close", (code) => {
      rl.close();
      if (code === 0 && sawEnd) resolve();
      else {
        const detail = stderrTail.trim().split("\n").slice(-4).join(" ").slice(0, 300);
        reject(new Error(`ffmpeg failed (exit ${code})${detail ? `: ${detail}` : ""}`));
      }
    });
  });
}

module.exports = {
  diceFilm,
  isDicing,
  resolveFfmpegPath,
  probeDuration,
  parseDurationText,
  safeStem,
  MAX_CHUNK_SECONDS,
  MAX_CHUNKS,
};
