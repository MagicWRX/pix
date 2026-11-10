/**
 * PIX.MOV (portable) — Movie-vs-Movie taste game + SHOWCASE + classic-film player.
 *
 * Stack: Express + Postgres (pg) + Supabase Auth with mandatory MFA (TOTP).
 * Data model: the `pix2` schema from the Supabase migration (year decks,
 * pix_movie_stats, votes, film DNA, fan types).
 *
 * - Public reads: decks, matchups, posters, classics, landing page.
 * - Writes (votes, unseen marks) and SHOWCASE require a signed-in user
 *   with a verified MFA factor.
 * - Posters: served from ./public/posters/<poster_key> when present;
 *   otherwise resolved at runtime via the key-free IMDb suggestion API
 *   (cached). Movies with no resolvable poster are skipped in matchups —
 *   PIX never shows a matchup without real poster artwork.
 *
 * Run:  npm install && cp .env.example .env && node server.js
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const { diceFilm, isDicing, MAX_CHUNK_SECONDS } = require('./lib/cine-dice');
const diceLib = require('./lib/dice-library');

/* ---------------- build version (version refresh) ----------------
 * assetSha256 is the sha256 of the served public/app.js, hashed at boot
 * from the file on disk — never hardcoded. version / build / commit /
 * deployedAt come from the generated version.json beside this file when
 * present: commit is the git head the build was cut from, and deployedAt
 * is written by the deploy step (null until then — never fabricated
 * here). If version.json is absent the endpoint still answers, with the
 * live hash and the remaining fields null. */
function bootAssetSha256() {
  try {
    const { createHash } = require('crypto');
    return createHash('sha256')
      .update(fs.readFileSync(path.join(__dirname, 'public', 'app.js')))
      .digest('hex');
  } catch { return null; }
}
const ASSET_SHA256 = bootAssetSha256();
const BUILD_INFO = (() => {
  const info = { version: null, build: null, commit: null, deployedAt: null };
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(__dirname, 'version.json'), 'utf8'));
    for (const k of Object.keys(info)) if (parsed[k] != null) info[k] = parsed[k];
  } catch { /* version.json absent — fields stay null */ }
  return info;
})();

const app = express();

/* LAUNCH WINDOW (Founder, 2026-11-06): the game and the discovery pools
   load only films from the past 40 years. One constant, enforced on
   /api/decks, /api/genres and every /api/matchup path. Lists (Top 500,
   spawned lists) and the classics streaming catalogue are deliberate
   destinations and are NOT windowed. */
const LAUNCH_YEAR_MIN = new Date().getFullYear() - 40;
/* The PIX MIX starting deck (Founder, 2026-11-08): TOP MOVIES OF THE PAST
   TEN YEARS — release year >= current year - 10, ranked by PIX wins (the
   site's own ranking of record), pool = the top 250 of that window. */
const TEN_YEAR_MIN = new Date().getFullYear() - 10;
const TEN_YEAR_POOL = 250;
app.use(express.json({ limit: '2mb' }));

/* ---------------- text hygiene ----------------
 * Some legacy rows were ingested through a Windows-1252 → UTF-8 pass, and the
 * design package's own strings carry the same artefacts. Repair the unambiguous
 * double-encoded sequences on the way out. Legitimate accents (é, â in French
 * titles) are untouched because they never match these exact byte patterns. */
const MOJIBAKE = [
  [/\u00e2\u20ac\u201c/g, '\u2013'],   // E2 80 93 -> en dash
  [/\u00e2\u20ac\u201d/g, '\u2014'],   // E2 80 94 -> em dash
  [/\u00e2\u20ac\u2122/g, '\u2019'],   // E2 80 99 -> right single quote
  [/\u00e2\u20ac\u0153/g, '\u201c'],   // E2 80 9C -> left double quote
  [/\u00e2\u20ac[\u009d\u0093]/g, '\u201d'],
  [/\u00c2\u00b7/g, '\u00b7'],        // C2 B7 -> middle dot
  [/\u00c3\u00a9/g, '\u00e9'],
  [/\u00c3\u00a8/g, '\u00e8'],
  [/\u00c3\u00a0/g, '\u00e0'],
  [/\u00c3\u00a7/g, '\u00e7'],
  [/\u00c3\u00b4/g, '\u00f4'],
];
const NEEDS_REPAIR = /\u00e2\u20ac|\u00c2\u00b7|\u00c3[\u00a0-\u00bf]/;
function repairText(v) {
  if (typeof v !== 'string' || !NEEDS_REPAIR.test(v)) return v;
  let out = v;
  for (const [re, to] of MOJIBAKE) out = out.replace(re, to);
  return out;
}
function repairDeep(v, depth = 0) {
  if (depth > 8 || v === null || typeof v !== 'object') return repairText(v);
  if (Array.isArray(v)) return v.map((x) => repairDeep(x, depth + 1));
  const out = {};
  for (const [k, val] of Object.entries(v)) out[k] = repairDeep(val, depth + 1);
  return out;
}
/* JSON API responses are UTF-8 by contract; static assets keep their own types. */
app.use((req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => {
    res.set('Content-Type', 'application/json; charset=utf-8');
    return json(repairDeep(body));
  };
  next();
});

/* ---------------- runtime config ---------------- */
const PORT = process.env.PORT || 3000;
const CLIPS_BASE = (process.env.CLASSIC_CLIPS_BASE_URL || '').replace(/\/+$/, '');

/* Auto-dice: films to cut live in DICE_MEDIA_DIR; chunks land in DICE_OUTPUT_DIR. */
const DICE_MEDIA_DIR = path.resolve(process.env.DICE_MEDIA_DIR || path.join(__dirname, 'media'));
const DICE_OUTPUT_DIR = path.resolve(process.env.DICE_OUTPUT_DIR || path.join(__dirname, 'data', 'diced'));
for (const d of [DICE_MEDIA_DIR, DICE_OUTPUT_DIR]) {
  try { fs.mkdirSync(d, { recursive: true }); } catch { /* surfaces loudly at use */ }
}
let diceBusy = false; // closes the check-then-start race before the engine sets activeDice

/* ---------------- supabase + postgres ---------------- */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.warn('[pix] WARNING: SUPABASE_URL / ANON_KEY / SERVICE_KEY not all set — auth and data will fail until .env is configured.');
}
const supaAdmin = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL is required by hosted Postgres and unsupported by the local DBWRX leg;
  // PGSSL=disable turns it off explicitly, default stays secure for cloud.
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
});
pool.on('error', (e) => console.error('[pix] pg pool error', e.message));

/* ---------------- helpers ---------------- */
const qi = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const nowMs = () => Date.now();

/* Auth lookup with a hard timeout (1.00.32). Since the 2026-11-08 redeploy
 * the host's route to the Supabase auth endpoint intermittently HANGS — it
 * does not error, it never answers — and an unraced getUser hangs every
 * token-carrying request with it. Measured live 2026-11-08: anonymous
 * requests answer in ~1s while ANY request with a Bearer token hangs past
 * 30s, so every signed-in page froze (the client attaches the token to every
 * API call). Race the lookup: on timeout the callers degrade exactly as they
 * already do on an auth error — reads fall back to anonymous, writes fail
 * fast with 401 instead of hanging. The host-side route fix is Local's leg
 * (crossing row for 1.00.32); this keeps the site usable until it lands. */
const AUTH_TIMEOUT_MS = 2500;
async function getUserFast(token) {
  let timer;
  try {
    return await Promise.race([
      supaAdmin.auth.getUser(token),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('auth lookup timeout')), AUTH_TIMEOUT_MS); }),
    ]);
  } finally { clearTimeout(timer); }
}

async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ ok: false, error: 'sign in required' });
  if (!supaAdmin) return res.status(503).json({ ok: false, error: 'auth not configured' });
  try {
    const { data: { user }, error } = await getUserFast(token);
    if (error || !user) return res.status(401).json({ ok: false, error: 'invalid token' });
    const factors = user.factors || user.app_metadata?.factors || [];
    const mfaOk = factors.some((f) => f && (f.status === 'verified'));
    if (!mfaOk) return res.status(403).json({ ok: false, error: 'MFA required: enroll and verify an authenticator factor' });
    req.user = user;
    /* Local-auth provisioning: hosted Supabase created film_dna_profiles from an
     * auth.users trigger. On the ship auth lives in the DBWRX `postgres` database
     * while app data lives in `pix`, so no trigger can fire and every write would
     * fail the film_dna_* foreign keys. Ensure the row exists on first touch. */
    try {
      const t = nowMs();
      await pool.query(
        `INSERT INTO "pix2"."film_dna_profiles" (user_id, created_at, updated_at)
         VALUES ($1,$2,$2) ON CONFLICT (user_id) DO NOTHING`, [user.id, t]);
    } catch (e) { console.error('[pix] profile provision failed', e.message); }
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'token verification failed' });
  }
}

/* Optional auth: identifies the reader when a token is present, without
 * gating the route. Used by /api/matchup so the triage rule (a decided film
 * never resurfaces for that user) can be enforced on a public endpoint. */
async function optionalAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || !supaAdmin) return next();
  try {
    const { data: { user } } = await getUserFast(token);
    if (user) req.user = user;
  } catch (e) { /* anonymous read */ }
  next();
}

/* Anonymous identity: a visitor who has not signed in still accrues FILM DNA
 * (handoff P0-3 accept: "vote once, reload — the header shows a real
 * percentage"). The client sends a stable local id as X-Pix-Anon; the server
 * treats it as a viewer id and provisions the profile row on first touch. */
const ANON_RE = /^anon_[0-9a-fA-F-]{8,40}$/;
function anonViewer(req) {
  const raw = String(req.headers['x-pix-anon'] || '').trim();
  return ANON_RE.test(raw) ? raw : null;
}

/* Resolves the viewer without ever 401-ing: a verified Supabase user (MFA not
 * required for read/write of your own taste data) or the anonymous id. */
async function identityAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token && supaAdmin) {
    try {
      const { data: { user } } = await getUserFast(token);
      if (user) { req.user = user; req.viewerId = user.id; return next(); }
    } catch { /* retry once below */ }
    /* The host auth route hangs intermittently — the 2.5s race in
       getUserFast exists because of it (1.00.32). One retry rescues a
       signed-in fan's identity writes (seen / votes / interest) that
       would otherwise fall through to the anon-or-400 path and never
       reach their own record (Founder report 2026-11-10: SEEN not
       recording). The double failure is logged, never silent. */
    try {
      const { data: { user } } = await getUserFast(token);
      if (user) { req.user = user; req.viewerId = user.id; return next(); }
      console.error('[pix] identityAuth: bearer presented but no user returned (twice)');
    } catch (e) {
      console.error('[pix] identityAuth: bearer auth failed twice:', e.message);
    }
  }
  const anon = anonViewer(req);
  if (!anon) return res.status(400).json({ ok: false, error: 'viewer identity required' });
  req.viewerId = anon;
  try {
    const t = nowMs();
    await pool.query(
      `INSERT INTO "pix2"."film_dna_profiles" (user_id, created_at, updated_at)
       VALUES ($1,$2,$2) ON CONFLICT (user_id) DO NOTHING`, [anon, t]);
  } catch (e) { console.error('[pix] anon profile provision failed', e.message); }
  next();
}

async function tableExists(schema, table) {
  try {
    const r = await pool.query(
      'SELECT 1 FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2',
      [schema, table]);
    return r.rowCount > 0;
  } catch { return false; }
}

/* ---------------- posters ----------------
 * 1. ./public/posters/<poster_key> (owner-copied webp files) — fastest.
 * 2. IMDb suggestion API (key-free), cached in memory.
 * 3. null — caller skips the movie. Never a fabricated image. */
const posterCache = new Map(); // imdb_id -> url|null
const POSTER_DIR = path.join(__dirname, 'public', 'posters');

async function resolvePoster(imdbId, posterKey) {
  if (posterKey) {
    const local = path.join(POSTER_DIR, path.basename(posterKey));
    if (fs.existsSync(local)) return '/posters/' + path.basename(posterKey);
  }
  if (posterCache.has(imdbId)) return posterCache.get(imdbId);
  let url = null;
  try {
    // IMDb's suggestion endpoint keys on the FIRST character only ("t" for tt…),
    // not the first two — a two-char prefix 404s every lookup.
    const prefix = String(imdbId).slice(0, 1).toLowerCase();
    const r = await fetch(`https://v2.sg.media-imdb.com/suggestion/${prefix}/${imdbId}.json`, {
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'pix-portable/1.0' },
    });
    if (r.ok) {
      const j = await r.json();
      const hit = (j.d || []).find((d) => d.id === imdbId) || (j.d || [])[0];
      url = hit?.i?.imageUrl || null;
    }
  } catch { /* offline or blocked — caller skips */ }
  posterCache.set(imdbId, url);
  return url;
}

function movieJson(m, posterUrl) {
  return {
    imdb_id: m.imdb_id, title: m.title, release_year: m.release_year,
    genre: m.genre, synopsis: m.synopsis || '', source_url: m.source_url || '',
    wins: m.wins, losses: m.losses, appearances: m.appearances,
    poster: posterUrl,
  };
}

/* ---------------- public config + static ---------------- */
/* Build identity of the bundle actually being served. No auth. The
 * client beacon polls this to detect a newer build (see app.js). */
app.get('/api/version', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    ok: true,
    version: BUILD_INFO.version,
    build: BUILD_INFO.build,
    commit: BUILD_INFO.commit,
    assetSha256: ASSET_SHA256,
    deployedAt: BUILD_INFO.deployedAt,
  });
});

/* ---------------- Phase 3 scaffold: consent + analytics ----------------
 * Flag-gated and INERT by default (handoff §3.1–3.3). Both flags read
 * from env and default OFF; with a flag off, its endpoints answer the
 * standard envelope with code 'feature_disabled' and HTTP 404 — the
 * feature is visibly absent, not silently half-on. The endpoints speak
 * to the `consent` / `analytics` schemas authored in
 * v1/drizzle/0072_consent.sql / 0073_analytics.sql; until that DDL is
 * applied under the Founder's gate, the flag-on paths fail safe with
 * code 'store_unavailable' — never a crash, never a raw DB error.
 * No client behaviour is wired to any of this yet: the BISCUIT modal
 * and the public client are untouched by this scaffold. */
const { createHash } = require('crypto');
const PIX_CONSENT_ENABLED = /^(1|true)$/i.test(process.env.PIX_CONSENT_ENABLED || '');
const PIX_EVENTS_ENABLED = /^(1|true)$/i.test(process.env.PIX_EVENTS_ENABLED || '');
/* Hashing salt for stored consent/event hashes (PIX_HASH_SALT env).
 * Raw IPs are NEVER stored — only sha256(salt | value). Rotating the
 * salt orphans hash comparisons for older rows; hashes are evidence
 * aids, not join keys (see v1/drizzle/PHASE-2-CUTOVER-PLAN.md). */
const PIX_HASH_SALT = process.env.PIX_HASH_SALT || '';
function hashForRecord(v) {
  if (v == null || v === '') return null;
  return createHash('sha256').update(PIX_HASH_SALT + '|' + String(v)).digest('hex');
}
function featureDisabled(res) {
  return res.status(404).json({ ok: false, error: 'disabled', code: 'feature_disabled' });
}
function apiFail(res, status, error, code) {
  return res.status(status).json({ ok: false, error, code });
}
/* Consent subject: the signed-in user when optionalAuth identified
 * one, else the anonymous id the client already sends as X-Pix-Anon.
 * Exactly one of the pair is set; both null means no identity. */
function consentSubject(req) {
  if (req.user && req.user.id) return { subjectId: String(req.user.id), anonSessionId: null };
  return { subjectId: null, anonSessionId: anonViewer(req) };
}
async function currentPolicyVersion() {
  const r = await pool.query(
    'SELECT version FROM "consent"."policy_versions" ORDER BY effective_at DESC LIMIT 1');
  return r.rowCount ? r.rows[0].version : null;
}

app.get('/api/consent', optionalAuth, asyncH(async (req, res) => {
  if (!PIX_CONSENT_ENABLED) return featureDisabled(res);
  if (!(await tableExists('consent', 'records')) || !(await tableExists('consent', 'policy_versions'))) {
    return apiFail(res, 503, 'consent store unavailable', 'store_unavailable');
  }
  try {
    const policyVersion = await currentPolicyVersion();
    const { subjectId, anonSessionId } = consentSubject(req);
    let decision = null;
    if (subjectId || anonSessionId) {
      const r = await pool.query(
        `SELECT essential, pix_save, ads, policy_version, decided_at
           FROM "consent"."records"
          WHERE ($1::text IS NOT NULL AND subject_id = $1)
             OR ($2::text IS NOT NULL AND anon_session_id = $2)
          ORDER BY decided_at DESC LIMIT 1`, [subjectId, anonSessionId]);
      if (r.rowCount) decision = r.rows[0];
    }
    return res.json({ ok: true, policyVersion, decided: !!decision, decision });
  } catch {
    return apiFail(res, 500, 'consent lookup failed', 'internal');
  }
}));

app.post('/api/consent', optionalAuth, asyncH(async (req, res) => {
  if (!PIX_CONSENT_ENABLED) return featureDisabled(res);
  if (!(await tableExists('consent', 'records')) || !(await tableExists('consent', 'policy_versions'))) {
    return apiFail(res, 503, 'consent store unavailable', 'store_unavailable');
  }
  const { subjectId, anonSessionId } = consentSubject(req);
  if (!subjectId && !anonSessionId) {
    return apiFail(res, 400, 'viewer identity required', 'identity_required');
  }
  try {
    /* Append-only: a decision (or a change) is a new row, never an
     * UPDATE. The policy version comes from the request when given,
     * else the current published one; with none published there is
     * nothing lawful to record against — the first policy_versions
     * row is the Founder's to publish. */
    const body = req.body || {};
    const policyVersion = (typeof body.policy_version === 'string' && body.policy_version)
      ? body.policy_version : await currentPolicyVersion();
    if (!policyVersion) {
      return apiFail(res, 409, 'no consent policy published', 'no_policy_published');
    }
    const ipRaw = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const r = await pool.query(
      `INSERT INTO "consent"."records"
         (subject_id, anon_session_id, policy_version, essential, pix_save, ads, user_agent_hash, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, decided_at`,
      [subjectId, anonSessionId, policyVersion,
       body.essential !== false, body.pix_save === true, body.ads === true,
       hashForRecord(req.headers['user-agent']), hashForRecord(ipRaw)]);
    return res.status(201).json({ ok: true, id: r.rows[0].id, decidedAt: r.rows[0].decided_at });
  } catch {
    return apiFail(res, 500, 'consent record failed', 'internal');
  }
}));

app.post('/api/events', asyncH(async (req, res) => {
  if (!PIX_EVENTS_ENABLED) return featureDisabled(res);
  if (!(await tableExists('analytics', 'events'))) {
    return apiFail(res, 503, 'analytics store unavailable', 'store_unavailable');
  }
  const batch = Array.isArray(req.body) ? req.body : (req.body && req.body.events);
  if (!Array.isArray(batch)) {
    return apiFail(res, 400, 'events array required', 'bad_request');
  }
  const buildSha12 = String(req.headers['x-pix-build'] || '').slice(0, 64) || null;
  /* Consent gate (§3.2): an event carrying subject_hash requires a
   * consent record with pix_save = true. Clients record consent under
   * the same hashed subject id they send here (hashes are never
   * reversed server-side). When the consent store is off or absent,
   * subject-carrying events are refused and only anonymous aggregate
   * events are accepted. */
  let consentReady = false;
  if (PIX_CONSENT_ENABLED) {
    consentReady = (await tableExists('consent', 'records'));
  }
  let accepted = 0;
  let rejected = 0;
  try {
    for (const ev of batch.slice(0, 100)) {
      if (!ev || typeof ev !== 'object' || !ev.idempotency_key) { rejected++; continue; }
      const subjectHash = ev.subject_hash ? String(ev.subject_hash) : null;
      if (subjectHash) {
        if (!consentReady) { rejected++; continue; }
        const c = await pool.query(
          `SELECT pix_save FROM "consent"."records"
            WHERE subject_id = $1 OR anon_session_id = $1
            ORDER BY decided_at DESC LIMIT 1`, [subjectHash]);
        if (!c.rowCount || c.rows[0].pix_save !== true) { rejected++; continue; }
      }
      const occurredAt = ev.occurred_at || ev.ts || new Date().toISOString();
      const ins = await pool.query(
        `INSERT INTO "analytics"."events"
           (occurred_at, build_sha12, surface, action, subject_hash, props, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (idempotency_key, occurred_at) DO NOTHING`,
        [occurredAt, buildSha12 || String(ev.build_sha12 || 'unknown'),
         ev.surface ? String(ev.surface).slice(0, 120) : null,
         ev.action ? String(ev.action).slice(0, 120) : null,
         subjectHash, ev.props ?? null, String(ev.idempotency_key)]);
      accepted += ins.rowCount;
      if (!ins.rowCount) rejected++;
    }
  } catch {
    return apiFail(res, 500, 'event ingest failed', 'internal');
  }
  return res.status(202).json({ ok: true, accepted, rejected });
}));

/* Health (§3.3 — added by this scaffold; NOT flag-gated). db reflects
 * the actual probe; catalogFilms is null whenever the catalog cannot
 * be counted — never a hardcoded 'up'. */
app.get('/api/health', asyncH(async (req, res) => {
  let db = 'down';
  let catalogFilms = null;
  try {
    const c = await pool.query('SELECT COUNT(*)::int AS c FROM "pix2"."pix_movie_stats"');
    catalogFilms = c.rows[0].c;
    db = 'up';
  } catch { /* probe failed — db stays 'down', catalogFilms stays null */ }
  return res.json({
    ok: true,
    version: BUILD_INFO.version,
    db,
    catalogFilms,
    uptime: Math.floor(process.uptime()),
  });
}));

app.get('/api/config', asyncH(async (req, res) => {
  let catalogFilms = 0;
  try {
    const c = await pool.query('SELECT COUNT(*)::int AS c FROM "pix2"."pix_movie_stats"');
    catalogFilms = c.rows[0].c;
  } catch { /* catalog not ready yet — header shows 0.00% */ }
  res.json({ ok: true, catalogFilms, supabaseUrl: SUPABASE_URL || null, supabaseAnonKey: SUPABASE_ANON_KEY || null });
}));

/* Search — title (substring/prefix) + synopsis. Public, poster-backed only. */
app.get('/api/search', asyncH(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ ok: true, q, films: [], total: 0 });
  const like = '%' + q.replace(/[%_\\]/g, (m) => '\\' + m) + '%';
  const r = await pool.query(
    `SELECT imdb_id, title, release_year, genre, poster_key, synopsis,
            CASE WHEN title ILIKE $1 THEN 0 ELSE 1 END AS rank_kind
     FROM "pix2"."pix_movie_stats"
     WHERE title ILIKE $1 OR synopsis ILIKE $1
     ORDER BY rank_kind, wins DESC, appearances DESC
     LIMIT 60`, [like]);
  const films = r.rows.map((m) => ({
    imdb_id: m.imdb_id, title: m.title, release_year: m.release_year, genre: m.genre, poster_key: m.poster_key,
    poster_hint: `/api/poster?imdb=${encodeURIComponent(m.imdb_id)}&key=${encodeURIComponent(m.poster_key || '')}`,
    snippet: m.synopsis ? String(m.synopsis).slice(0, 180) : '',
  }));
  res.json({ ok: true, q, films, total: films.length });
}));

/* Talk to PIX — the chat widget's channel (1:1 Pass 6; Founder ruling A
 * on mail row 54, 2026-11-05). There is no live chat service on this
 * backend, so messages land in the feedback store as type 'chat' with
 * the visitor's identity when signed in, and the panel says so plainly:
 * PIX reads everything; replies come by email. No pretend conversation. */
app.post('/api/chat', optionalAuth, asyncH(async (req, res) => {
  const body = String((req.body || {}).body || '').trim();
  if (body.length < 1) return res.status(400).json({ ok: false, error: 'write a message first' });
  if (body.length > 2000) return res.status(400).json({ ok: false, error: 'message too long' });
  await pool.query(
    `CREATE TABLE IF NOT EXISTS "pix2"."pix_feedback" (
       id bigserial PRIMARY KEY,
       type text NOT NULL,
       body text NOT NULL,
       subject_user text NOT NULL DEFAULT '',
       contact text NOT NULL DEFAULT '',
       reporter_id uuid NULL,
       reporter_email text NOT NULL DEFAULT '',
       created_at bigint NOT NULL DEFAULT (extract(epoch FROM now())*1000)::bigint
     )`);
  await pool.query('ALTER TABLE "pix2"."pix_feedback" ADD COLUMN IF NOT EXISTS page text NOT NULL DEFAULT \'\'');
  const page = String((req.body || {}).page || '').slice(0, 80);
  const r = await pool.query(
    `INSERT INTO "pix2"."pix_feedback" (type, body, subject_user, contact, reporter_id, reporter_email, page)
     VALUES ('chat', $1, '', '', $2, $3, $4) RETURNING id, created_at`,
    [body, req.user ? req.user.id : null, req.user ? (req.user.email || '') : '', page]);
  res.json({ ok: true, id: r.rows[0].id });
}));

/* Feedback — IDEA / ISSUE / REPORT / APPEAL. Stored in pix2.pix_feedback. */
const FEEDBACK_TYPES = new Set(['idea', 'issue', 'report', 'appeal']);
app.post('/api/feedback', optionalAuth, asyncH(async (req, res) => {
  const type = String((req.body || {}).type || '').toLowerCase();
  const body = String((req.body || {}).body || '').trim();
  const subjectUser = String((req.body || {}).subject_user || '').trim();
  const contact = String((req.body || {}).contact || '').trim();
  if (!FEEDBACK_TYPES.has(type)) return res.status(400).json({ ok: false, error: 'unknown feedback type' });
  if (body.length < 4) return res.status(400).json({ ok: false, error: 'tell us a little more' });
  await pool.query(
    `CREATE TABLE IF NOT EXISTS "pix2"."pix_feedback" (
       id bigserial PRIMARY KEY,
       type text NOT NULL,
       body text NOT NULL,
       subject_user text NOT NULL DEFAULT '',
       contact text NOT NULL DEFAULT '',
       reporter_id uuid NULL,
       reporter_email text NOT NULL DEFAULT '',
       created_at bigint NOT NULL DEFAULT (extract(epoch FROM now())*1000)::bigint
     )`);
  await pool.query('ALTER TABLE "pix2"."pix_feedback" ADD COLUMN IF NOT EXISTS page text NOT NULL DEFAULT \'\'');
  const page = String((req.body || {}).page || '').slice(0, 80);
  const r = await pool.query(
    `INSERT INTO "pix2"."pix_feedback" (type, body, subject_user, contact, reporter_id, reporter_email, page)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
    [type, body.slice(0, 8000), subjectUser.slice(0, 120), contact.slice(0, 200),
      req.user ? req.user.id : null, req.user ? (req.user.email || '') : '', page]);
  res.json({ ok: true, id: String(r.rows[0].id), received_at: Number(r.rows[0].created_at) });
}));
app.use('/posters', express.static(POSTER_DIR));
/* Static cache discipline (1.00.35): the app shell (HTML/JS/CSS) must
   revalidate on every load — app.js was reaching browsers under a
   4-hour public cache (CDN default), so a served fix could sit unloaded
   on a fan's machine for hours while /api/version already reported the
   new build. no-cache + ETag keeps unchanged files a cheap 304. */
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
}));

/* ---------------- decks ---------------- */
app.get('/api/decks', asyncH(async (req, res) => {
  const r = await pool.query(
    `SELECT d.deck_key, d.label, d.release_year,
            (SELECT COUNT(*)::int FROM "pix2"."pix_movie_deck_entries" e WHERE e.deck_key = d.deck_key) AS movies
     FROM "pix2"."pix_movie_decks" d
     WHERE d.active = 1 AND d.release_year >= ${LAUNCH_YEAR_MIN}
     ORDER BY d.release_year DESC`);
  res.json({ ok: true, decks: r.rows });
}));

/* ---------------- genres (game scope source) ---------------- */
app.get('/api/genres', asyncH(async (req, res) => {
  const r = await pool.query(
    `SELECT genre, COUNT(*)::int AS movies FROM "pix2"."pix_movie_stats"
      WHERE genre IS NOT NULL AND genre <> '' AND release_year >= ${LAUNCH_YEAR_MIN}
      GROUP BY genre ORDER BY movies DESC LIMIT 24`);
  res.json({ ok: true, genres: r.rows.map((g) => ({ label: g.genre, movies: g.movies })) });
}));

/* ---------------- matchup ----------------
 * Two random movies from a deck, both with resolvable posters.
 * Spec: selecting a poster records the vote and immediately shows two new. */
app.get('/api/matchup', optionalAuth, asyncH(async (req, res) => {
  const deckKey = String(req.query.deck || 'year-2025');
  const mode = String(req.query.mode || '');
  const genre = String(req.query.genre || '');
  const yf = Number(req.query.year_from), yt = Number(req.query.year_to);
  /* Triage permanence (settings.json → nowPlaying.triageRule): any decision the
   * signed-in user has recorded — seen, unseen, want to see, maybe, no thanks —
   * permanently removes that film from their rotation. Only real posters render. */
  const viewer = req.user?.id || anonViewer(req);
  const decided = viewer
    ? ' AND NOT EXISTS (SELECT 1 FROM "pix2"."film_dna_media_signals" d\n         WHERE d.user_id = $U AND d.imdb_id = s.imdb_id\n           AND (d.knowledge <> \'unknown\' OR d.interest <> \'none\'))'
    : '';

  /* Year-filter mode (v2): mode=mix (all years) or year_from/year_to (span).
   * Samples straight from pix_movie_stats so any range works. */
  let cand;
  let deckLabel = deckKey;
  if (mode === 'top10') {
    deckLabel = 'past-ten-years' + (genre ? `-genre-${genre}` : '');
    const params = [];
    /* 1.00.31 hotfix: this branch must ALWAYS open a WHERE. The triage
       (decided) clause appends AND NOT EXISTS, and with no genre filter
       there was no WHERE for it to attach to — a SQL syntax error for
       every identified viewer, so the game 500'd and never dealt. */
    let gwhere = ' WHERE TRUE';
    if (genre) { params.push(genre); gwhere = ` WHERE s.genre = $1`; }
    /* Fallback ladder (1.00.36): the pool is the top 250 by wins, and
       the triage rule removes every film the fan has decided — the
       heaviest fan (the Founder) decided nearly all 250 and the game
       dead-ended on 'not enough movies in range' (his 2026-11-10 crash
       report: an error message where the matchup belongs). A fan with
       more opinions must never get a dead game: first widen the pool to
       the whole ten-year window, then — only if he has decided even
       that — serve from the window anyway (recycling beats a dead
       game; his marks themselves are untouched). */
    const topSql = (poolLimit, dec) => `SELECT s.imdb_id, s.title, s.release_year, s.genre, s.synopsis, s.source_url,
              s.wins, s.losses, s.appearances, s.poster_key
       FROM (SELECT * FROM "pix2"."pix_movie_stats"
              WHERE release_year >= ${TEN_YEAR_MIN} ORDER BY wins DESC LIMIT ${poolLimit}) s
       ${gwhere}${dec}
       ORDER BY random() LIMIT 10`.replace('$U', '$' + (params.length + 1));
    cand = await pool.query(topSql(TEN_YEAR_POOL, decided), viewer ? [...params, viewer] : params);
    if (cand.rowCount < 2 && viewer) {
      cand = await pool.query(topSql(100000, decided), [...params, viewer]);
      if (cand.rowCount < 2) {
        console.error('[pix] matchup top10: decided-pool exhausted for a viewer — serving the window without the triage filter');
        cand = await pool.query(topSql(100000, ''), params);
      }
    }
    if (cand.rowCount < 2) return res.status(404).json({ ok: false, error: 'not enough movies in range' });
  } else if (mode === 'mix' || (Number.isFinite(yf) && Number.isFinite(yt))) {
    const lo = Math.max(Math.min(yf, yt), LAUNCH_YEAR_MIN), hi = Math.max(yf, yt);
    let where = mode === 'mix' ? `WHERE s.release_year >= ${LAUNCH_YEAR_MIN}` : 'WHERE s.release_year BETWEEN $1 AND $2';
    const params = mode === 'mix' ? [] : [lo, hi];
    if (genre) { params.push(genre); where += ` AND s.genre = $${params.length}`; }
    deckLabel = (mode === 'mix' ? 'mix-all' : `years-${lo}-${hi}`) + (genre ? `-genre-${genre}` : '');
    const mixSql = (dec) => `SELECT s.imdb_id, s.title, s.release_year, s.genre, s.synopsis, s.source_url,
              s.wins, s.losses, s.appearances, s.poster_key
       FROM "pix2"."pix_movie_stats" s ${where}${dec}
       ORDER BY random() LIMIT 10`.replace('$U', '$' + (params.length + 1));
    cand = await pool.query(mixSql(decided), viewer ? [...params, viewer] : params);
    if (cand.rowCount < 2 && viewer) {
      console.error('[pix] matchup mix/years: decided-pool exhausted for a viewer — serving without the triage filter');
      cand = await pool.query(mixSql(''), params);
    }
    if (cand.rowCount < 2) return res.status(404).json({ ok: false, error: 'not enough movies in range' });
  } else {
    const deck = await pool.query('SELECT deck_key FROM "pix2"."pix_movie_decks" WHERE deck_key=$1 AND active=1', [deckKey]);
    if (!deck.rowCount) return res.status(404).json({ ok: false, error: 'unknown deck' });

    const deckSql = (dec) => `SELECT s.imdb_id, s.title, s.release_year, s.genre, s.synopsis, s.source_url,
              s.wins, s.losses, s.appearances, s.poster_key
       FROM "pix2"."pix_movie_deck_entries" e
       JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = e.imdb_id
       WHERE e.deck_key = $1 AND s.release_year >= ${LAUNCH_YEAR_MIN}${dec}
       ORDER BY random() LIMIT 10`;
    cand = await pool.query(deckSql(decided.replace('$U', '$2')), viewer ? [deckKey, viewer] : [deckKey]);
    if (cand.rowCount < 2 && viewer) {
      console.error('[pix] matchup deck: decided-pool exhausted for a viewer — serving without the triage filter');
      cand = await pool.query(deckSql(''), [deckKey]);
    }
    if (cand.rowCount < 2) return res.status(404).json({ ok: false, error: 'deck is empty' });
  }

  const posters = await Promise.all(cand.rows.map((m) => resolvePoster(m.imdb_id, m.poster_key)));
  const withPosters = cand.rows.filter((_, i) => posters[i]).slice(0, 2);
  if (withPosters.length < 2) {
    return res.status(503).json({ ok: false, error: 'could not resolve posters for a matchup right now' });
  }
  res.json({
    ok: true,
    deck: deckLabel,
    a: movieJson(withPosters[0], posters[cand.rows.indexOf(withPosters[0])]),
    b: movieJson(withPosters[1], posters[cand.rows.indexOf(withPosters[1])]),
  });
}));

/* Poster redirect for <img> tags (handy for direct embedding). */
app.get('/api/poster', asyncH(async (req, res) => {
  const imdb = String(req.query.imdb || '');
  const key = String(req.query.key || '');
  if (!imdb) return res.status(400).json({ ok: false, error: 'imdb required' });
  let url = await resolvePoster(imdb, key);
  if (!url) return res.status(404).json({ ok: false, error: 'no poster available' });
  /* size=sm — the staged loader's middle step: IMDb media URLs carry a
     ._V1_ size segment; rewrite it to a small poster. Local poster files
     and other sources have no smaller variant and serve as-is. */
  if (String(req.query.size || '') === 'sm' && url.includes('._V1_')) {
    url = url.replace(/\._V1_.*?(\.(?:jpg|png))/i, '._V1_UX160_CR0,0,160,240_AL_$1');
  }
  res.redirect(url.startsWith('/') ? url : url);
}));

/* ---------------- votes (auth + MFA) ---------------- */
/* pix_movie_votes predates per-fan picks — it carried no user_id, so a
   friend's past picks cannot be attributed (and are never backfilled).
   From 1.00.29 the vote records who picked, guarded like every other
   additive column in this file. */
let votesUserColCache = null;
async function votesHaveUserCol() {
  if (votesUserColCache !== null) return votesUserColCache;
  try {
    await pool.query('ALTER TABLE "pix2"."pix_movie_votes" ADD COLUMN IF NOT EXISTS user_id text');
    await pool.query('ALTER TABLE "pix2"."pix_movie_votes" ADD COLUMN IF NOT EXISTS id bigserial');
    votesUserColCache = true;
  } catch { votesUserColCache = false; }
  return votesUserColCache;
}

app.post('/api/vote', identityAuth, asyncH(async (req, res) => {
  const { winner_imdb_id: w, loser_imdb_id: l, deck_key: deckKey } = req.body || {};
  const whyTag = WHY_TAGS.has(String((req.body || {}).why_tag || '')) ? String(req.body.why_tag) : '';
  const whyDetail = String((req.body || {}).why_detail || '').slice(0, 500);
  if (!w || !l || w === l) return res.status(400).json({ ok: false, error: 'winner and loser required' });
  const userId = req.viewerId;
  const t = nowMs();
  const vuc = await votesHaveUserCol();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const both = await client.query(
      'SELECT imdb_id, genre FROM "pix2"."pix_movie_stats" WHERE imdb_id = ANY($1)', [[w, l]]);
    if (both.rowCount !== 2) { await client.query('ROLLBACK'); return res.status(404).json({ ok: false, error: 'movie not found' }); }
    const genreOf = new Map(both.rows.map((r) => [r.imdb_id, r.genre]));

    if (vuc) {
      await client.query(
        'INSERT INTO "pix2"."pix_movie_votes" (winner_imdb_id, loser_imdb_id, created_at, user_id) VALUES ($1,$2,$3,$4)',
        [w, l, t, userId]);
    } else {
      await client.query(
        'INSERT INTO "pix2"."pix_movie_votes" (winner_imdb_id, loser_imdb_id, created_at) VALUES ($1,$2,$3)',
        [w, l, t]);
    }
    /* The WHY (1:1 Pass 4): the artifact holds the pick for one beat —
     * "Why did it win?" — and saves the reason with the vote. Stored in
     * its own table, created on first use (the pix_feedback pattern). */
    if (whyTag || whyDetail) {
      await client.query(
        `CREATE TABLE IF NOT EXISTS "pix2"."pix_vote_reasons" (
           id bigserial PRIMARY KEY,
           user_id text NULL,
           winner_imdb_id text NOT NULL,
           loser_imdb_id text NOT NULL,
           why_tag text NOT NULL DEFAULT '',
           why_detail text NOT NULL DEFAULT '',
           created_at bigint NOT NULL
         )`);
      await client.query(
        `INSERT INTO "pix2"."pix_vote_reasons" (user_id, winner_imdb_id, loser_imdb_id, why_tag, why_detail, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`, [userId, w, l, whyTag, whyDetail, t]);
    }
    await client.query(
      `UPDATE "pix2"."pix_movie_stats"
       SET wins = wins + CASE WHEN imdb_id=$1 THEN 1 ELSE 0 END,
           losses = losses + CASE WHEN imdb_id=$2 THEN 1 ELSE 0 END,
           appearances = appearances + 1, last_played_at=$3, updated_at=$3
       WHERE imdb_id = ANY($4)`, [w, l, t, [w, l]]);

    // film DNA signals
    await client.query(
      `INSERT INTO "pix2"."film_dna_events" (user_id, signal_type, primary_imdb_id, secondary_imdb_id, game_key, created_at)
       VALUES ($1,'vote',$2,$3,$4,$5)`, [userId, w, l, deckKey || 'movie-vs-movie', t]);
    for (const [id, kind] of [[w, 'win'], [l, 'loss']]) {
      await client.query(
        `INSERT INTO "pix2"."film_dna_media_signals"
           (user_id, imdb_id, wins, losses, updated_at)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id, imdb_id) DO UPDATE SET
           wins = "pix2"."film_dna_media_signals".wins + $3,
           losses = "pix2"."film_dna_media_signals".losses + $4,
           updated_at = $5`,
        [userId, id, kind === 'win' ? 1 : 0, kind === 'loss' ? 1 : 0, t]);
    }
    await client.query(
      `INSERT INTO "pix2"."film_dna_profiles" (user_id, vote_count, created_at, updated_at)
       VALUES ($1,1,$2,$2)
       ON CONFLICT (user_id) DO UPDATE SET
         vote_count = "pix2"."film_dna_profiles".vote_count + 1, updated_at=$2`, [userId, t]);

    // fan-type event (blend scoring is a scheduled job; events are the raw material)
    await client.query(
      `INSERT INTO "pix2"."pix_fan_type_events" (user_id, signal_type, primary_imdb_id, secondary_imdb_id, created_at)
       VALUES ($1,'vote',$2,$3,$4)`, [userId, w, l, t]);
    await client.query(
      `INSERT INTO "pix2"."pix_fan_type_states" (user_id, updated_at)
       VALUES ($1,$2)
       ON CONFLICT (user_id) DO UPDATE SET consecutive_unseen=0, updated_at=$2`, [userId, t]);

    await client.query('COMMIT');
    res.json({ ok: true, winner_genre: genreOf.get(w) });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

/* ---------------- unseen marks (auth + MFA) ----------------
 * Marks one poster unseen; only that poster is replaced by the client. */
app.post('/api/unseen', identityAuth, asyncH(async (req, res) => {
  const { imdb_id: id } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: 'imdb_id required' });
  const userId = req.viewerId;
  const t = nowMs();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const exists = await client.query('SELECT 1 FROM "pix2"."pix_movie_stats" WHERE imdb_id=$1', [id]);
    if (!exists.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ ok: false, error: 'movie not found' }); }
    const ins = await client.query(
      'INSERT INTO "pix2"."pix_movie_unseen" (imdb_id, created_at) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING 1',
      [id, t]);
    if (ins.rowCount) {
      await client.query('UPDATE "pix2"."pix_movie_stats" SET unseen_count = unseen_count + 1, updated_at=$2 WHERE imdb_id=$1', [id, t]);
    }
    await client.query(
      `INSERT INTO "pix2"."film_dna_media_signals" (user_id, imdb_id, knowledge, unseen_count, updated_at)
       VALUES ($1,$2,'unseen',1,$3)
       ON CONFLICT (user_id, imdb_id) DO UPDATE SET
         unseen_count = "pix2"."film_dna_media_signals".unseen_count + 1,
         knowledge='unseen', updated_at=$3`, [userId, id, t]);
    await client.query(
      `INSERT INTO "pix2"."film_dna_profiles" (user_id, unseen_count, created_at, updated_at)
       VALUES ($1,1,$2,$2)
       ON CONFLICT (user_id) DO UPDATE SET
         unseen_count = "pix2"."film_dna_profiles".unseen_count + 1, updated_at=$2`, [userId, t]);
    await client.query(
      `INSERT INTO "pix2"."pix_fan_type_events" (user_id, signal_type, primary_imdb_id, created_at)
       VALUES ($1,'unseen',$2,$3)`, [userId, id, t]);
    await client.query(
      `INSERT INTO "pix2"."pix_fan_type_states" (user_id, consecutive_unseen, updated_at)
       VALUES ($1,1,$2)
       ON CONFLICT (user_id) DO UPDATE SET
         consecutive_unseen = "pix2"."pix_fan_type_states".consecutive_unseen + 1, updated_at=$2`, [userId, t]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

/* ---------------- SEEN / INTEREST / FILM DNA -------------
 * Written against pix2.film_dna_media_signals (knowledge ∈ unknown|unseen|seen,
 * interest ∈ want_to_see|maybe|not_interested|never_heard_of_it|none). */
const INTEREST = new Set(['want_to_see', 'maybe', 'not_interested', 'never_heard_of_it', 'none']);
const WHY_TAGS = new Set(['Story', 'Performance', 'Feeling', 'Craft', 'Rewatch value']);

app.get('/api/seen/mine', identityAuth, asyncH(async (req, res) => {
  const r = await pool.query(
    `SELECT imdb_id, knowledge, interest FROM "pix2"."film_dna_media_signals"
     WHERE user_id=$1 AND (knowledge <> 'unknown' OR interest <> 'none')`, [req.viewerId]);
  const seen = [], interest = {};
  r.rows.forEach((x) => {
    if (x.knowledge === 'seen') seen.push(x.imdb_id);
    if (x.interest && x.interest !== 'none') interest[x.imdb_id] = x.interest;
  });
  res.json({ ok: true, seen, interest });
}));

app.post('/api/seen', identityAuth, asyncH(async (req, res) => {
  const { imdb_id: id, seen } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: 'imdb_id required' });
  const exists = await pool.query('SELECT 1 FROM "pix2"."pix_movie_stats" WHERE imdb_id=$1', [id]);
  if (!exists.rowCount) return res.status(404).json({ ok: false, error: 'movie not found' });
  const knowledge = seen === false ? 'unknown' : 'seen';
  await pool.query(
    `INSERT INTO "pix2"."film_dna_media_signals" (user_id, imdb_id, knowledge, updated_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, imdb_id) DO UPDATE SET knowledge=$3, updated_at=$4`,
    [req.viewerId, id, knowledge, nowMs()]);
  res.json({ ok: true, imdb_id: id, knowledge });
}));

app.post('/api/interest', identityAuth, asyncH(async (req, res) => {
  const { imdb_id: id, interest } = req.body || {};
  if (!id || !INTEREST.has(interest)) {
    return res.status(400).json({ ok: false, error: 'imdb_id and a valid interest are required' });
  }
  const exists = await pool.query('SELECT 1 FROM "pix2"."pix_movie_stats" WHERE imdb_id=$1', [id]);
  if (!exists.rowCount) return res.status(404).json({ ok: false, error: 'movie not found' });
  await pool.query(
    `INSERT INTO "pix2"."film_dna_media_signals" (user_id, imdb_id, interest, updated_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, imdb_id) DO UPDATE SET interest=$3, updated_at=$4`,
    [req.viewerId, id, interest, nowMs()]);
  res.json({ ok: true, imdb_id: id, interest });
}));

/* ---------------- REACTION VOCAB (Founder dictation 2026-11-06) ----------------
 * Per-fan reaction labels from the hover fold (HATED IT / LOVED IT /
 * HORROR lens groups), feeding FILM DNA. The label set is governed
 * (lat.vocabulary) and validated here — no free text is ever stored.
 * Storage follows the signals pattern: one row per (viewer, film, label)
 * in pix2.pix_user_reactions, created on first use. */
const REACTION_LABELS = new Set(['Boring', 'Stupid', 'Bad acting',
  'One of my favorites', 'Fun', 'Great Action', 'Very Romantic',
  'Super Scary', 'Gory', 'Great Villain',
  /* HOVERS kit (Founder lock 2026-11-07): the REWATCH axis + the
     FAVORITE state — same store, same validation, no free text. */
  'Rewatch all the time', 'Want to see again', 'Once was good enough', 'Favorite']);

app.get('/api/reactions/mine', identityAuth, asyncH(async (req, res) => {
  await pool.query(`CREATE TABLE IF NOT EXISTS "pix2"."pix_user_reactions" (
    user_id text NOT NULL, imdb_id text NOT NULL, label text NOT NULL, created_at bigint NOT NULL,
    PRIMARY KEY (user_id, imdb_id, label))`);
  const r = await pool.query(
    'SELECT imdb_id, label FROM "pix2"."pix_user_reactions" WHERE user_id=$1 ORDER BY created_at', [req.viewerId]);
  const reactions = {};
  r.rows.forEach((x) => { (reactions[x.imdb_id] = reactions[x.imdb_id] || []).push(x.label); });
  res.json({ ok: true, reactions });
}));

app.post('/api/reactions', identityAuth, asyncH(async (req, res) => {
  const { imdb_id: id, label, on } = req.body || {};
  if (!id || !REACTION_LABELS.has(label)) {
    return res.status(400).json({ ok: false, error: 'imdb_id and a governed reaction label are required' });
  }
  const exists = await pool.query('SELECT 1 FROM "pix2"."pix_movie_stats" WHERE imdb_id=$1', [id]);
  if (!exists.rowCount) return res.status(404).json({ ok: false, error: 'movie not found' });
  await pool.query(`CREATE TABLE IF NOT EXISTS "pix2"."pix_user_reactions" (
    user_id text NOT NULL, imdb_id text NOT NULL, label text NOT NULL, created_at bigint NOT NULL,
    PRIMARY KEY (user_id, imdb_id, label))`);
  if (on === false) {
    await pool.query('DELETE FROM "pix2"."pix_user_reactions" WHERE user_id=$1 AND imdb_id=$2 AND label=$3',
      [req.viewerId, id, label]);
  } else {
    await pool.query(
      `INSERT INTO "pix2"."pix_user_reactions" (user_id, imdb_id, label, created_at)
       VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, imdb_id, label) DO NOTHING`,
      [req.viewerId, id, label, nowMs()]);
  }
  const r = await pool.query(
    'SELECT label FROM "pix2"."pix_user_reactions" WHERE user_id=$1 AND imdb_id=$2 ORDER BY created_at',
    [req.viewerId, id]);
  res.json({ ok: true, imdb_id: id, labels: r.rows.map((x) => x.label) });
}));

/* ---------------- moods (IN THE MOOD FOR…) ----------------
 * HOVERS Utility B (PIX-HOVERS.md; Founder lock 2026-11-07). The mood
 * set is the curated taxonomy locked 2026-10-19 (PIX Topology v1.0.6),
 * registered in lat.vocabulary — validated here, no free text. Filings
 * are per-fan taste data in pix2.pix_user_moods (created on first use,
 * the reactions pattern); the film-page fingerprint aggregates them. */
const MOOD_LABELS = new Set(['Feel-good', 'Dark', 'Thrilling', 'Romantic', 'Nostalgic',
  'Mind-bending', 'Cozy', 'Intense', 'Funny', 'Sad', 'Epic', 'Chill', 'Scary',
  'Inspiring', 'Weird', 'Heartwarming']);
const MOODS_SQL = `CREATE TABLE IF NOT EXISTS \"pix2\".\"pix_user_moods\" (
    user_id text NOT NULL, imdb_id text NOT NULL, mood text NOT NULL, created_at bigint NOT NULL,
    PRIMARY KEY (user_id, imdb_id, mood))`;

app.get('/api/moods/mine', identityAuth, asyncH(async (req, res) => {
  await pool.query(MOODS_SQL);
  const r = await pool.query(
    'SELECT imdb_id, mood FROM "pix2"."pix_user_moods" WHERE user_id=$1 ORDER BY created_at', [req.viewerId]);
  const moods = {};
  r.rows.forEach((x) => { (moods[x.imdb_id] = moods[x.imdb_id] || []).push(x.mood); });
  res.json({ ok: true, moods });
}));

app.post('/api/moods', identityAuth, asyncH(async (req, res) => {
  const { imdb_id: id, mood, on } = req.body || {};
  if (!id || !MOOD_LABELS.has(mood)) {
    return res.status(400).json({ ok: false, error: 'imdb_id and a governed mood label are required' });
  }
  const exists = await pool.query('SELECT 1 FROM "pix2"."pix_movie_stats" WHERE imdb_id=$1', [id]);
  if (!exists.rowCount) return res.status(404).json({ ok: false, error: 'movie not found' });
  await pool.query(MOODS_SQL);
  if (on === false) {
    await pool.query('DELETE FROM "pix2"."pix_user_moods" WHERE user_id=$1 AND imdb_id=$2 AND mood=$3',
      [req.viewerId, id, mood]);
  } else {
    await pool.query(
      `INSERT INTO "pix2"."pix_user_moods" (user_id, imdb_id, mood, created_at)
       VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, imdb_id, mood) DO NOTHING`,
      [req.viewerId, id, mood, nowMs()]);
  }
  const r = await pool.query(
    'SELECT mood FROM "pix2"."pix_user_moods" WHERE user_id=$1 AND imdb_id=$2 ORDER BY created_at',
    [req.viewerId, id]);
  res.json({ ok: true, imdb_id: id, moods: r.rows.map((x) => x.mood) });
}));

/* the community mood fingerprint for one film (public counts) */
app.get('/api/moods/fingerprint', asyncH(async (req, res) => {
  const id = String(req.query.imdb || '');
  if (!id) return res.status(400).json({ ok: false, error: 'imdb required' });
  await pool.query(MOODS_SQL);
  const r = await pool.query(
    `SELECT mood, COUNT(*)::int AS n FROM "pix2"."pix_user_moods"
      WHERE imdb_id=$1 GROUP BY mood ORDER BY n DESC, mood`, [id]);
  res.json({ ok: true, imdb_id: id, counts: r.rows });
}));

/* the viewer's own shelf for one mood — loopCard-ready film rows */
app.get('/api/moods/shelf', identityAuth, asyncH(async (req, res) => {
  const mood = String(req.query.mood || '');
  if (!MOOD_LABELS.has(mood)) return res.status(400).json({ ok: false, error: 'governed mood required' });
  await pool.query(MOODS_SQL);
  const r = await pool.query(
    `SELECT s.imdb_id, s.title, s.release_year, s.genre, s.synopsis, s.source_url,
            s.wins, s.losses, s.appearances, s.poster_key
       FROM "pix2"."pix_user_moods" mu
       JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = mu.imdb_id
      WHERE mu.user_id = $1 AND mu.mood = $2
      ORDER BY mu.created_at DESC`, [req.viewerId, mood]);
  const posters = await Promise.all(r.rows.map((m) => resolvePoster(m.imdb_id, m.poster_key)));
  res.json({ ok: true, mood, films: r.rows.map((m, i) => movieJson(m, posters[i])) });
}));

/* ---------------- PIX STATS (HOVERS) ----------------
 * The read side of the kit: what fans collectively marked, aggregated
 * from the same stores the folds write to (signals, reactions, moods).
 * Counts only — no invented percentages; the client renders a segment
 * only when its count is real. PIX STATS is registered in
 * lat.vocabulary. */
const RX_SQL = `CREATE TABLE IF NOT EXISTS "pix2"."pix_user_reactions" (
    user_id text NOT NULL, imdb_id text NOT NULL, label text NOT NULL, created_at bigint NOT NULL,
    PRIMARY KEY (user_id, imdb_id, label))`;
const LOVED_LABELS = ['One of my favorites', 'Fun', 'Great Action', 'Very Romantic'];
const HATED_LABELS = ['Boring', 'Stupid', 'Bad acting'];
async function statsForFilms(ids) {
  const sig = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE knowledge='seen')::int AS seen,
            COUNT(*) FILTER (WHERE interest='want_to_see')::int AS want,
            COUNT(*) FILTER (WHERE interest='maybe')::int AS maybe,
            COUNT(*) FILTER (WHERE interest='not_interested')::int AS no
       FROM "pix2"."film_dna_media_signals" WHERE imdb_id = ANY($1)`, [ids]);
  await pool.query(RX_SQL);
  await pool.query(MOODS_SQL);
  const rx = await pool.query(
    'SELECT label, COUNT(*)::int AS n FROM "pix2"."pix_user_reactions" WHERE imdb_id = ANY($1) GROUP BY label ORDER BY n DESC', [ids]);
  const by = {};
  rx.rows.forEach((r) => { by[r.label] = r.n; });
  const md = await pool.query(
    `SELECT mood, COUNT(*)::int AS n FROM "pix2"."pix_user_moods"
      WHERE imdb_id = ANY($1) GROUP BY mood ORDER BY n DESC, mood LIMIT 3`, [ids]);
  return {
    ...sig.rows[0],
    favorites: by['Favorite'] || 0,
    loved: LOVED_LABELS.reduce((a, l) => a + (by[l] || 0), 0),
    hated: HATED_LABELS.reduce((a, l) => a + (by[l] || 0), 0),
    rewatch: { all: by['Rewatch all the time'] || 0, again: by['Want to see again'] || 0, once: by['Once was good enough'] || 0 },
    moods: md.rows,
  };
}
app.get('/api/stats/film', asyncH(async (req, res) => {
  const id = String(req.query.imdb || '');
  if (!id) return res.status(400).json({ ok: false, error: 'imdb required' });
  res.json({ ok: true, imdb_id: id, stats: await statsForFilms([id]) });
}));
app.get('/api/stats/list', asyncH(async (req, res) => {
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'bad id' });
  const items = await pool.query('SELECT imdb_id FROM "pix2"."pix_user_list_items" WHERE list_id=$1', [id]);
  const ids = items.rows.map((r) => r.imdb_id);
  const stats = ids.length ? await statsForFilms(ids) : { seen: 0, want: 0, maybe: 0, no: 0, favorites: 0, loved: 0, hated: 0, rewatch: { all: 0, again: 0, once: 0 }, moods: [] };
  res.json({ ok: true, list_id: id, films: ids.length, stats });
}));

/* ---------------- NOW SHOWING (streaming availability) ----------------
 * Founder brief 2026-11-07: what is showing on Amazon, linked from the
 * film page. Truth = TMDB watch/providers (JustWatch data), scanned
 * into pix.pix_streaming_availability on the GAKz side and mirrored
 * down (catalogue data, down-only). Guarded like the other unmirrored
 * tables: no table / no rows -> no block on the page, never a fake. */
app.get('/api/streaming', asyncH(async (req, res) => {
  const id = String(req.query.imdb || '');
  if (!id) return res.status(400).json({ ok: false, error: 'imdb required' });
  if (!(await tableExists('pix2', 'pix_streaming_availability'))) return res.json({ ok: true, offers: [] });
  const r = await pool.query(
    `SELECT provider, offer_type, link_url, checked_at
       FROM "pix2"."pix_streaming_availability"
      WHERE imdb_id=$1 AND region='US'
      ORDER BY CASE offer_type WHEN 'stream' THEN 0 WHEN 'rent' THEN 1 ELSE 2 END`, [id]);
  res.json({ ok: true, offers: r.rows });
}));

/* ---------------- watchlist (the Want to See queue) ----------------
 * 1:1 Pass 3 (2026-11-05): the artifact's Watchlist section, fed by the
 * viewer's own want_to_see signals. */
app.get('/api/watchlist', identityAuth, asyncH(async (req, res) => {
  const r = await pool.query(
    `SELECT s.imdb_id, s.title, s.release_year, s.genre, s.synopsis, s.source_url,
            s.wins, s.losses, s.appearances, s.poster_key
       FROM "pix2"."film_dna_media_signals" d
       JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = d.imdb_id
      WHERE d.user_id = $1 AND d.interest = 'want_to_see'
      ORDER BY d.updated_at DESC`, [req.viewerId]);
  const posters = await Promise.all(r.rows.map((m) => resolvePoster(m.imdb_id, m.poster_key)));
  res.json({ ok: true, queue: r.rows.map((m, i) => movieJson(m, posters[i])) });
}));

/* ---------------- story notes ----------------
 * The Story sections (Dream Log / Poster Gallery / Monsters / Notes /
 * Publish) all read this one archive, each filtering by kind exactly as
 * the artifact's components do. Guarded like grossers: an unmirrored
 * table answers an honest empty archive, never an error. */
app.get('/api/notes', optionalAuth, asyncH(async (req, res) => {
  if (!(await tableExists('pix2', 'notes'))) return res.json({ ok: true, notes: [] });
  const r = await pool.query(
    `SELECT id, kind, entity_key, title, body, note_date, tags, sort_order
       FROM "pix2"."notes"
      ORDER BY sort_order ASC NULLS LAST, note_date DESC NULLS LAST, id ASC
      LIMIT 200`);
  res.json({ ok: true, notes: r.rows });
}));

/* FILM DNA RECORDED X.XX% = rated films / films on record × 100 (settings.json → header). */
app.get('/api/dna', optionalAuth, asyncH(async (req, res) => {
  const viewer = req.user?.id || anonViewer(req);
  const total = pool.query('SELECT COUNT(*)::int AS c FROM "pix2"."pix_movie_stats"');
  const rated = viewer
    ? pool.query(`SELECT COUNT(*)::int AS c FROM "pix2"."film_dna_media_signals"
                  WHERE user_id=$1 AND (wins + losses) > 0`, [viewer])
    : Promise.resolve({ rows: [{ c: 0 }] });
  const [ratedR, totalR] = await Promise.all([rated, total]);
  const filmsRated = ratedR.rows[0]?.c || 0;
  const onRecord = totalR.rows[0]?.c || 0;
  res.json({ ok: true, filmsRated, onRecord,
    pct: onRecord ? Number(((filmsRated / onRecord) * 100).toFixed(2)) : 0 });
}));

/* ---------------- SHOWCASE (auth + MFA, read-only v1) ----------------
 * The user's public film-buff profile: fan type, taste summary. */
app.get('/api/showcase', requireAuth, asyncH(async (req, res) => {
  const userId = req.user.id;
  const fan = await pool.query(
    `SELECT utf.type_key, ft.label, ft.description, utf.score, utf.confidence, utf.signal_count
     FROM "pix2"."pix_user_fan_types" utf
     JOIN "pix2"."pix_fan_types" ft ON ft.type_key = utf.type_key
     WHERE utf.user_id=$1 ORDER BY utf.score DESC LIMIT 1`, [userId]);
  const prof = await pool.query(
    'SELECT vote_count, unseen_count, genre_weights_json FROM "pix2"."film_dna_profiles" WHERE user_id=$1', [userId]);
  const seen = await pool.query(
    `SELECT COUNT(*)::int AS c FROM "pix2"."film_dna_media_signals"
     WHERE user_id=$1 AND (wins + losses) > 0`, [userId]);

  let topGenres = [];
  try {
    const gw = JSON.parse(prof.rows[0]?.genre_weights_json || '{}');
    topGenres = Object.entries(gw).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g, w]) => ({ genre: g, weight: w }));
  } catch { /* keep empty */ }

  res.json({
    ok: true,
    showcase: {
      user: req.user.email,
      fanType: fan.rowCount ? fan.rows[0] : null,
      votes: prof.rowCount ? Number(prof.rows[0].vote_count) : 0,
      unseen: prof.rowCount ? Number(prof.rows[0].unseen_count) : 0,
      filmsRated: seen.rows[0]?.c || 0,
      topGenres,
      hasData: (prof.rowCount > 0) && (Number(prof.rows[0].vote_count) + Number(prof.rows[0].unseen_count) > 0),
    },
  });
}));

/* ---------------- SHOWCASE public face (no auth) ----------------
 * SHOWCASE is a page, never a redirect to sign-in. Signed-out visitors get the
 * fan-type catalogue + the shape of a profile, so the surface stands on its own. */
app.get('/api/showcase/public', asyncH(async (req, res) => {
  let fanTypes = [];
  if (await tableExists('pix2', 'pix_fan_types')) {
    const r = await pool.query('SELECT type_key, label, description FROM "pix2"."pix_fan_types" ORDER BY type_key');
    fanTypes = r.rows;
  }
  let catalog = 0;
  try {
    const c = await pool.query('SELECT COUNT(*)::int AS c FROM "pix2"."pix_movie_stats"');
    catalog = c.rows[0].c;
  } catch { /* catalog absent */ }
  res.json({ ok: true, fanTypes, catalog });
}));

/* ---------------- classic films ----------------
 * Every clip row carries its own public B2 URL; the frame grab lives at the
 * mirrored /thumbs/ path. Art for a film = still (if any) -> clip-01 thumb ->
 * poster. Never print an environment variable name to the client. */
function thumbFor(streamUrl, filename) {
  if (!streamUrl) return null;
  return streamUrl.replace(/\/clips\//, '/thumbs/').replace(/\.mp4$/i, '.jpg');
}
function filmArt(film, clips) {
  const first = clips.find((c) => c.stream_url) || clips[0] || null;
  const sorted = [...clips].sort((a, b) => Number(a.segment) - Number(b.segment));
  const firstSeg = sorted.find((c) => c.stream_url) || first;
  return (firstSeg && thumbFor(firstSeg.stream_url, firstSeg.filename)) || null;
}

app.get('/api/classics', asyncH(async (req, res) => {
  if (!(await tableExists('pix2', 'pix_classic_films'))) return res.json({ ok: true, films: [] });
  /* Column guard (1.00.28): the mirror's classic-films table does not carry
     every GAKz column — naming f.still_url unconditionally made this endpoint
     500 on the served mirror, which starved the landing FEATURES shelf and
     the #/classics page (Founder report, 2026-11-07). Probe once and build
     the two expressions the mirror can actually answer; a missing still
     falls back to the film's derived art, a missing path to one shelf. */
  const colRows = await pool.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'pix2' AND table_name = 'pix_classic_films'`);
  const haveCol = new Set(colRows.rows.map((r) => r.column_name));
  const stillExpr = haveCol.has('still_url') ? 'f.still_url' : 'NULL::text AS still_url';
  const genreExpr = haveCol.has('path_prefix')
    ? "split_part(f.path_prefix, '/', 2) AS genre" : "'Classics' AS genre";
  const films = await pool.query(
    `SELECT f.film_key, f.title, f.release_year, f.director, f.synopsis, ${stillExpr},
            ${genreExpr},
            p.imdb_id AS poster_imdb, p.poster_key AS poster_key
       FROM "pix2"."pix_classic_films" f
       LEFT JOIN LATERAL (
         SELECT s.imdb_id, s.poster_key
           FROM "pix2"."pix_movie_stats" s
          WHERE s.release_year = f.release_year
            AND lower(btrim(split_part(s.title, ' (', 1))) = lower(btrim(f.title))
          ORDER BY s.wins DESC NULLS LAST
          LIMIT 1
       ) p ON true
      ORDER BY f.release_year`);
  let clips = [];
  if (await tableExists('pix2', 'pix_classic_clips')) {
    const c = await pool.query(
      'SELECT film_key, segment, filename, stream_url FROM "pix2"."pix_classic_clips" ORDER BY film_key, segment');
    clips = c.rows;
  }
  const byFilm = new Map();
  clips.forEach((c) => { if (!byFilm.has(c.film_key)) byFilm.set(c.film_key, []); byFilm.get(c.film_key).push(c); });
  const out = films.rows.map((f) => {
    const own = byFilm.get(f.film_key) || [];
    return { ...f, segments: own.length, playable: own.filter((c) => c.stream_url).length,
      art_url: f.still_url || filmArt(f, own) };
  });
  res.json({ ok: true, films: out });
}));

app.get('/api/classics/:filmKey', asyncH(async (req, res) => {
  const filmKey = req.params.filmKey;
  if (!(await tableExists('pix2', 'pix_classic_films'))) return res.status(404).json({ ok: false, error: 'not found' });
  const f = await pool.query('SELECT * FROM "pix2"."pix_classic_films" WHERE film_key=$1', [filmKey]);
  if (!f.rowCount) return res.status(404).json({ ok: false, error: 'not found' });
  const clips = await pool.query(
    'SELECT segment, filename, title, duration_sec, size_bytes, stream_url FROM "pix2"."pix_classic_clips" WHERE film_key=$1 ORDER BY segment',
    [filmKey]);
  const film = f.rows[0];
  /* The poster's real source is the catalogue (pix_movie_stats), matched
     by title + year — the classic-films table carries no poster of its
     own, and a stream still is not a poster (Founder fix, 2026-11-05). */
  const pm = await pool.query(
    `SELECT imdb_id, poster_key FROM "pix2"."pix_movie_stats"
      WHERE release_year = $1
        AND lower(btrim(split_part(title, ' (', 1))) = lower(btrim($2))
      ORDER BY wins DESC NULLS LAST LIMIT 1`, [film.release_year, film.title]);
  if (pm.rowCount) { film.poster_imdb = pm.rows[0].imdb_id; film.poster_key = pm.rows[0].poster_key; }
  const out = clips.rows.map((c) => ({
    n: Number(c.segment), segment: Number(c.segment), filename: c.filename, title: c.title,
    duration_sec: c.duration_sec, size_bytes: Number(c.size_bytes),
    // Per-clip URL wins; otherwise compose from the configured public base.
    url: c.stream_url || (CLIPS_BASE && film.path_prefix ? `${CLIPS_BASE}/${String(film.path_prefix).replace(/^\/+/, '')}${c.filename}` : null),
    thumb_url: thumbFor(c.stream_url || (CLIPS_BASE && film.path_prefix
      ? `${CLIPS_BASE}/${String(film.path_prefix).replace(/^\/+/, '')}${c.filename}` : null), c.filename),
  }));
  res.json({
    ok: true,
    film: {
      ...film,
      art_url: film.still_url || filmArt(film, clips.rows),
      still_url: film.still_url || filmArt(film, clips.rows),
      poster_url: film.poster_imdb ? `/api/poster?imdb=${encodeURIComponent(film.poster_imdb)}&key=${encodeURIComponent(film.poster_key || '')}` : '',
      clips_configured: out.some((c) => c.url),
    },
    clips: out,
    segments: out,
  });
}));

/* ---------------- spawned lists (1.00.34) ----------------
 * Editorial rankings re-published in PIX format (PIX-SPAWNED-LISTS.md):
 * the data of record lives in GAKz pix.pix_spawned_lists/_items and the
 * ship mirror carries the same tables in pix2 (Local's bridge leg).
 * Guarded exactly like /api/classics: until the mirror tables exist the
 * shelf answers empty — never a 500. Items join the catalogue on imdb_id
 * for posters; an unresolved item carries its published title only and
 * the client renders it as an honest title panel, never a fake poster. */
app.get('/api/spawned-lists', asyncH(async (req, res) => {
  if (!(await tableExists('pix2', 'pix_spawned_lists')) || !(await tableExists('pix2', 'pix_spawned_list_items')))
    return res.json({ ok: true, lists: [] });
  const r = await pool.query(
    `SELECT l.id, l.slug, l.title, l.source_name, l.source_url, l.edition, l.category, l.published_count,
            COUNT(i.id)::int AS items, COUNT(i.imdb_id)::int AS resolved
       FROM "pix2"."pix_spawned_lists" l
       LEFT JOIN "pix2"."pix_spawned_list_items" i ON i.list_id = l.id
      GROUP BY l.id ORDER BY l.id`);
  res.json({ ok: true, lists: r.rows });
}));

app.get('/api/spawned-lists/:slug', asyncH(async (req, res) => {
  if (!(await tableExists('pix2', 'pix_spawned_lists')) || !(await tableExists('pix2', 'pix_spawned_list_items')))
    return res.status(404).json({ ok: false, error: 'list not found' });
  const l = await pool.query('SELECT * FROM "pix2"."pix_spawned_lists" WHERE slug=$1', [String(req.params.slug)]);
  if (!l.rowCount) return res.status(404).json({ ok: false, error: 'list not found' });
  const items = await pool.query(
    `SELECT i.rank, i.imdb_id, i.title_as_published, i.release_year, i.resolved,
            s.title AS cat_title, s.poster_key, s.genre, s.wins
       FROM "pix2"."pix_spawned_list_items" i
       LEFT JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = i.imdb_id
      WHERE i.list_id=$1 ORDER BY i.rank`, [l.rows[0].id]);
  res.json({ ok: true, list: l.rows[0], items: items.rows });
}));

/* ---------------- auto-dice (auth + MFA) ----------------
 * CINE's auto-cut engine, server-side. Dice a film file already sitting in
 * DICE_MEDIA_DIR into fixed-length stream-copy chunks (no re-encoding;
 * cuts snap to keyframes, same as the desktop app). One job at a time.
 * POST returns 202 with the job id immediately; poll GET for progress. */
app.post('/api/dice', requireAuth, asyncH(async (req, res) => {
  const { source_path: rawPath, chunk_seconds: rawChunk, film_key: rawKey } = req.body || {};
  const chunkSeconds = Number(rawChunk);
  if (!Number.isFinite(chunkSeconds) || chunkSeconds < 1 || chunkSeconds > MAX_CHUNK_SECONDS) {
    return res.status(400).json({ ok: false, error: `chunk_seconds must be between 1 and ${MAX_CHUNK_SECONDS}` });
  }
  const abs = diceLib.resolveDiceSource(DICE_MEDIA_DIR, rawPath);
  if (!abs) return res.status(400).json({ ok: false, error: 'source_path must be a file inside DICE_MEDIA_DIR' });
  let stat = null;
  try { stat = fs.statSync(abs); } catch { /* -> 404 below */ }
  if (!stat || !stat.isFile()) return res.status(404).json({ ok: false, error: 'source file not found in DICE_MEDIA_DIR' });
  if (diceBusy || isDicing()) return res.status(409).json({ ok: false, error: 'a dice job is already running' });

  diceBusy = true;
  try {
    await diceLib.ensureDiceTables(pool);
    const jobId = await diceLib.createDiceJob(pool, {
      userId: req.user.id,
      sourcePath: abs,
      sourceFilename: path.basename(abs),
      filmKey: String(rawKey || ''),
      chunkSeconds,
    });

    // Run in the background; the engine finalizes the job row to 'done'.
    const lib = diceLib.makeDiceLibrary(pool, { jobId, outDir: DICE_OUTPUT_DIR });
    let lastProgress = -1;
    diceFilm({
      lib,
      sourcePath: abs,
      sourceFilename: path.basename(abs),
      sourceImportId: null,
      chunkSeconds,
      onProgress: ({ percent }) => {
        const p = Math.max(0, Math.min(100, Math.round(percent)));
        if (p !== lastProgress) {
          lastProgress = p;
          diceLib.updateDiceProgress(pool, jobId, p).catch(() => {});
        }
      },
    })
      .catch((e) => diceLib.failDiceJob(pool, jobId, e && e.message ? e.message : String(e)))
      .finally(() => { diceBusy = false; });

    res.status(202).json({ ok: true, job_id: jobId });
  } catch (e) {
    diceBusy = false;
    throw e;
  }
}));

app.get('/api/dice/:jobId', requireAuth, asyncH(async (req, res) => {
  const jobId = Number(req.params.jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) return res.status(400).json({ ok: false, error: 'bad job id' });
  const job = await diceLib.getDiceJob(pool, jobId);
  if (!job) return res.status(404).json({ ok: false, error: 'job not found' });
  const chunks = job.status === 'done' ? await diceLib.getDiceChunks(pool, jobId) : [];
  res.json({ ok: true, job, chunks });
}));

/* ---------------- TOP 500 ----------------
 * Ranked by community wins (then appearances). Posters resolve client-side
 * via /api/poster so the list stays fast. */
app.get('/api/top500', asyncH(async (req, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const total = await pool.query('SELECT COUNT(*)::int AS c FROM "pix2"."pix_movie_stats"');
  const r = await pool.query(
    `SELECT imdb_id, title, release_year, genre, wins, losses, appearances, poster_key, source_url,
            ROW_NUMBER() OVER (ORDER BY wins DESC, appearances DESC) AS rank
     FROM "pix2"."pix_movie_stats"
     ORDER BY wins DESC, appearances DESC
     LIMIT $1 OFFSET $2`, [limit, offset]);
  res.json({ ok: true, total: total.rows[0].c, films: r.rows });
}));

/* ---------------- SEEN archive ----------------
 * Year cards 2026 -> earliest, each opening that year's poster set. */
app.get('/api/seen/years', asyncH(async (req, res) => {
  const r = await pool.query(
    `SELECT release_year AS year, COUNT(*)::int AS movies
     FROM "pix2"."pix_movie_stats"
     WHERE release_year IS NOT NULL
     GROUP BY release_year ORDER BY release_year DESC`);
  res.json({ ok: true, years: r.rows });
}));

app.get('/api/seen/:year', asyncH(async (req, res) => {
  const year = Number(req.params.year);
  if (!Number.isInteger(year)) return res.status(400).json({ ok: false, error: 'bad year' });
  const r = await pool.query(
    `SELECT imdb_id, title, release_year, genre, wins, poster_key, source_url
     FROM "pix2"."pix_movie_stats"
     WHERE release_year = $1
     ORDER BY wins DESC, title ASC
     LIMIT 2000`, [year]);
  res.json({ ok: true, year, movies: r.rows });
}));

/* ---------------- ATTRACTIONS ----------------
 * Row 1: Top 500 (preview). Row 2: biggest financial success (COMB grossers).
 * Row 3: discovery game (NOW PLAYING). Row 4: friends/community reviews. */
app.get('/api/attractions', asyncH(async (req, res) => {
  const top = await pool.query(
    `SELECT imdb_id, title, release_year, wins, poster_key FROM "pix2"."pix_movie_stats"
     ORDER BY wins DESC LIMIT 12`);
  let grossers = [];
  if (await tableExists('pix2', 'pix_comb_grossers')) {
    const g = await pool.query(
      'SELECT rank, title, release_year, worldwide_gross, source_label, imdb_id FROM "pix2"."pix_comb_grossers" ORDER BY rank LIMIT 12');
    grossers = g.rows;
  }
  let reviews = [];
  if (await tableExists('pix2', 'pix_reviews')) {
    const rv = await pool.query(
      `SELECT r.id, r.imdb_id, r.rating, r.body, r.user_label, r.created_at, s.title
       FROM "pix2"."pix_reviews" r
       LEFT JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = r.imdb_id
       ORDER BY r.created_at DESC LIMIT 6`);
    reviews = rv.rows;
  }
  res.json({ ok: true, rows: { top500: top.rows, grossers, reviews } });
}));

app.get('/api/grossers', asyncH(async (req, res) => {
  if (!(await tableExists('pix2', 'pix_comb_grossers'))) return res.json({ ok: true, grossers: [] });
  const r = await pool.query(
    'SELECT rank, title, release_year, worldwide_gross, source_label, imdb_id FROM "pix2"."pix_comb_grossers" ORDER BY rank LIMIT 200');
  res.json({ ok: true, grossers: r.rows });
}));

/* ---------------- film pages ---------------- */
app.get('/api/film/:imdb', optionalAuth, asyncH(async (req, res) => {
  const imdb = String(req.params.imdb);
  const m = await pool.query('SELECT * FROM "pix2"."pix_movie_stats" WHERE imdb_id=$1', [imdb]);
  if (!m.rowCount) return res.status(404).json({ ok: false, error: 'film not found' });
  let reviews = [];
  if (await tableExists('pix2', 'pix_reviews')) {
    await pool.query('ALTER TABLE "pix2"."pix_reviews" ADD COLUMN IF NOT EXISTS stance text');
    await pool.query('ALTER TABLE "pix2"."pix_reviews" ADD COLUMN IF NOT EXISTS why_tag text');
    await pool.query(RX_SQL);
    const rv = await pool.query(
      `SELECT r.id, r.user_id, r.user_label, r.rating, r.body, r.created_at, r.stance, r.why_tag,
        (SELECT CASE
           WHEN EXISTS (SELECT 1 FROM "pix2"."pix_user_reactions" x WHERE x.user_id=r.user_id AND x.imdb_id=r.imdb_id AND x.label='Favorite') THEN '★ Favorite'
           WHEN EXISTS (SELECT 1 FROM "pix2"."pix_user_reactions" x WHERE x.user_id=r.user_id AND x.imdb_id=r.imdb_id AND x.label IN ('One of my favorites','Fun','Great Action','Very Romantic')) THEN 'Loved it'
           WHEN EXISTS (SELECT 1 FROM "pix2"."pix_user_reactions" x WHERE x.user_id=r.user_id AND x.imdb_id=r.imdb_id AND x.label IN ('Boring','Stupid','Bad acting')) THEN 'Hated it'
           WHEN EXISTS (SELECT 1 FROM "pix2"."film_dna_media_signals" sg WHERE sg.user_id=r.user_id AND sg.imdb_id=r.imdb_id AND sg.knowledge='seen') THEN 'Seen it'
           ELSE NULL END) AS verdict
       FROM "pix2"."pix_reviews" r WHERE r.imdb_id=$1 ORDER BY r.created_at DESC LIMIT 50`,
      [imdb]);
    reviews = rv.rows;
  }
  /* MY SCREENING is personal: the viewer's own entry, verdict and record.
     Anonymous visitors get mine = null and see REVIEW only. */
  let mine = null;
  if (req.user) {
    const own = (await tableExists('pix2', 'pix_reviews'))
      ? await pool.query(
        `SELECT id, rating, body, created_at FROM "pix2"."pix_reviews"
         WHERE imdb_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 1`, [imdb, req.user.id])
      : { rows: [] };
    const sig = await pool.query(
      `SELECT knowledge, interest FROM "pix2"."film_dna_media_signals"
       WHERE user_id=$1 AND imdb_id=$2 LIMIT 1`, [req.user.id, imdb]);
    mine = {
      review: own.rows[0] || null,
      knowledge: sig.rows[0]?.knowledge || 'unknown',
      interest: sig.rows[0]?.interest || 'none',
    };
  }
  let rank = null;
  const rk = await pool.query(
    `SELECT rank FROM (SELECT imdb_id, ROW_NUMBER() OVER (ORDER BY wins DESC, appearances DESC) AS rank
       FROM "pix2"."pix_movie_stats") t WHERE imdb_id=$1 AND rank <= 500`, [imdb]);
  rank = rk.rows[0]?.rank ?? null;
  const movie = m.rows[0];
  res.json({
    ok: true,
    film: { ...movie, poster_hint: `/api/poster?imdb=${encodeURIComponent(movie.imdb_id)}&key=${encodeURIComponent(movie.poster_key || '')}` },
    reviews,
    mine,
    rank,
  });
}));

/* ---------------- reviews ---------------- */
app.get('/api/reviews/latest', asyncH(async (req, res) => {
  if (!(await tableExists('pix2', 'pix_reviews'))) return res.json({ ok: true, reviews: [] });
  const r = await pool.query(
    `SELECT r.id, r.imdb_id, r.rating, r.body, r.user_label, r.created_at, s.title, s.release_year
     FROM "pix2"."pix_reviews" r
     LEFT JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = r.imdb_id
     ORDER BY r.created_at DESC LIMIT 30`);
  res.json({ ok: true, reviews: r.rows });
}));

const STANCE_LABELS = new Set(['Agree', 'Same here', 'Hard disagree']);
app.post('/api/reviews', requireAuth, asyncH(async (req, res) => {
  const { imdb_id: imdb, rating, body, stance, why_tag: whyTagRaw } = req.body || {};
  const whyTag = WHY_TAGS.has(String(whyTagRaw || '')) ? String(whyTagRaw) : null;
  if (!imdb) return res.status(400).json({ ok: false, error: 'imdb_id required' });
  const st = stance == null || stance === '' ? null : String(stance);
  if (st !== null && !STANCE_LABELS.has(st)) return res.status(400).json({ ok: false, error: 'governed stance required' });
  if (st === null && rating == null && !String(body || '').trim() && !whyTag) {
    return res.status(400).json({ ok: false, error: 'pick a stance, a rating, or write a line' });
  }
  const r8 = rating == null ? null : Math.max(1, Math.min(5, Number(rating)));
  if (rating != null && !Number.isInteger(r8)) return res.status(400).json({ ok: false, error: 'rating 1-5' });
  const exists = await pool.query('SELECT 1 FROM "pix2"."pix_movie_stats" WHERE imdb_id=$1', [imdb]);
  if (!exists.rowCount) return res.status(404).json({ ok: false, error: 'film not found' });
  const label = (req.user.email || 'A PIX fan').split('@')[0];
  await pool.query('ALTER TABLE "pix2"."pix_reviews" ADD COLUMN IF NOT EXISTS stance text');
  await pool.query('ALTER TABLE "pix2"."pix_reviews" ADD COLUMN IF NOT EXISTS why_tag text');
  const ins = await pool.query(
    'INSERT INTO "pix2"."pix_reviews" (user_id, user_label, imdb_id, rating, body, created_at, stance, why_tag) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    [req.user.id, label, imdb, r8, String(body || '').slice(0, 4000), nowMs(), st, whyTag]);
  res.json({ ok: true, id: ins.rows[0].id });
}));

/* ---------------- USERS LISTS ---------------- */
const crypto = require('crypto');
const newShareKey = () => crypto.randomBytes(8).toString('hex');

app.get('/api/lists/mine', requireAuth, asyncH(async (req, res) => {
  if (!(await tableExists('pix2', 'pix_user_lists'))) return res.json({ ok: true, lists: [] });
  const r = await pool.query(
    `SELECT l.id, l.name, l.share_key,
            (SELECT COUNT(*)::int FROM "pix2"."pix_user_list_items" i WHERE i.list_id = l.id) AS items
     FROM "pix2"."pix_user_lists" l
     WHERE l.user_id=$1 ORDER BY l.updated_at DESC`, [req.user.id]);
  res.json({ ok: true, lists: r.rows });
}));

app.get('/api/lists', asyncH(async (req, res) => {
  if (!(await tableExists('pix2', 'pix_user_lists'))) return res.json({ ok: true, lists: [] });
  const r = await pool.query(
    `SELECT l.id, l.user_id, l.user_label, l.name, l.description, l.is_public, l.share_key, l.created_at, l.updated_at,
            (SELECT COUNT(*)::int FROM "pix2"."pix_user_list_items" i WHERE i.list_id = l.id) AS items
     FROM "pix2"."pix_user_lists" l
     WHERE l.is_public = TRUE
     ORDER BY l.updated_at DESC LIMIT 100`);
  res.json({ ok: true, lists: r.rows });
}));

app.post('/api/lists', requireAuth, asyncH(async (req, res) => {
  const { name, description, is_public } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: 'name required' });
  const t = nowMs();
  /* USER PERSONA (1.00.24): a list carries its maker's name — the same
     email-prefix label reviews stamp — so lists link back to a person. */
  await pool.query('ALTER TABLE "pix2"."pix_user_lists" ADD COLUMN IF NOT EXISTS user_label text');
  const label = (req.user.email || 'A PIX fan').split('@')[0];
  const ins = await pool.query(
    `INSERT INTO "pix2"."pix_user_lists" (user_id, user_label, name, description, is_public, share_key, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7) RETURNING id, share_key`,
    [req.user.id, label, String(name).slice(0, 120), String(description || '').slice(0, 1000), is_public !== false, newShareKey(), t]);
  res.json({ ok: true, id: ins.rows[0].id, share_key: ins.rows[0].share_key });
}));

app.get('/api/lists/:id', asyncH(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'bad id' });
  const l = await pool.query('SELECT * FROM "pix2"."pix_user_lists" WHERE id=$1', [id]);
  if (!l.rowCount) return res.status(404).json({ ok: false, error: 'list not found' });
  const list = l.rows[0];
  if (!list.user_label && (await tableExists('pix2', 'pix_reviews'))) {
    const rv = await pool.query('SELECT user_label FROM "pix2"."pix_reviews" WHERE user_id=$1 AND user_label IS NOT NULL ORDER BY created_at DESC LIMIT 1', [list.user_id]);
    if (rv.rowCount) list.user_label = rv.rows[0].user_label;
  }
  const items = await pool.query(
    `SELECT i.imdb_id, i.note, i.position, i.added_at, s.title, s.release_year, s.genre, s.poster_key, s.wins
     FROM "pix2"."pix_user_list_items" i
     LEFT JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = i.imdb_id
     WHERE i.list_id=$1 ORDER BY i.position, i.added_at`, [id]);
  res.json({ ok: true, list, items: items.rows });
}));

app.get('/api/lists/shared/:shareKey', asyncH(async (req, res) => {
  const l = await pool.query('SELECT * FROM "pix2"."pix_user_lists" WHERE share_key=$1', [req.params.shareKey]);
  if (!l.rowCount) return res.status(404).json({ ok: false, error: 'list not found' });
  const items = await pool.query(
    `SELECT i.imdb_id, i.note, i.position, i.added_at, s.title, s.release_year, s.genre, s.poster_key, s.wins
     FROM "pix2"."pix_user_list_items" i
     LEFT JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = i.imdb_id
     WHERE i.list_id=$1 ORDER BY i.position, i.added_at`, [l.rows[0].id]);
  res.json({ ok: true, list: l.rows[0], items: items.rows });
}));

/* ---------------- FAN SHOWCASE (USER PERSONA, 1.00.24) ----------------
 * A fan's public face: their name + their PUBLIC lists (private lists
 * stay private — the 2026-10-20 ruling). The label resolves from their
 * lists first, then their reviews, then the honest fallback. */
/* ---------------- friends (1.00.29) ----------------
   Add a fan from their showcase; your FRIENDS FEED shows their PIX MIX
   picks (this over that) and their posts, and you answer with the governed
   COMMENT STANCE chips plus an optional line. Adds are one-tap (LOW
   FRICTION ruling); feedback only flows to fans you have added, and only
   on activity that is really theirs. */
const FRIENDS_SQL = `CREATE TABLE IF NOT EXISTS "pix2"."pix_friends" (
   user_id text NOT NULL, friend_id text NOT NULL, created_at bigint NOT NULL,
   PRIMARY KEY (user_id, friend_id))`;
const FRIEND_FEEDBACK_SQL = `CREATE TABLE IF NOT EXISTS "pix2"."pix_friend_feedback" (
   id bigserial PRIMARY KEY,
   from_user_id text NOT NULL, to_user_id text NOT NULL,
   kind text NOT NULL, ref_id text NOT NULL,
   stance text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '',
   created_at bigint NOT NULL)`;
let friendsReady = false;
async function ensureFriends() {
  if (friendsReady) return;
  await pool.query(FRIENDS_SQL);
  await pool.query(FRIEND_FEEDBACK_SQL);
  friendsReady = true;
}
async function fanLabel(uid) {
  try {
    const l = await pool.query(
      'SELECT user_label FROM "pix2"."pix_user_lists" WHERE user_id = $1 AND user_label IS NOT NULL ORDER BY created_at DESC LIMIT 1', [uid]);
    if (l.rows[0] && l.rows[0].user_label) return l.rows[0].user_label;
    const r = await pool.query(
      'SELECT user_label FROM "pix2"."pix_reviews" WHERE user_id = $1 AND user_label IS NOT NULL ORDER BY created_at DESC LIMIT 1', [uid]);
    if (r.rows[0] && r.rows[0].user_label) return r.rows[0].user_label;
  } catch { /* labels are decoration; absence is honest */ }
  return 'A PIX fan';
}
async function myFriendIds(me) {
  const r = await pool.query('SELECT friend_id FROM "pix2"."pix_friends" WHERE user_id = $1', [me]);
  return r.rows.map((x) => x.friend_id);
}

app.post('/api/friends', requireAuth, asyncH(async (req, res) => {
  await ensureFriends();
  const fid = String((req.body || {}).friend_id || '');
  if (!fid || fid.length > 80) return res.status(400).json({ ok: false, error: 'friend required' });
  if (fid === req.viewerId) return res.status(400).json({ ok: false, error: 'that is you' });
  await pool.query(
    'INSERT INTO "pix2"."pix_friends" (user_id, friend_id, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [req.viewerId, fid, nowMs()]);
  res.json({ ok: true });
}));

app.post('/api/friends/remove', requireAuth, asyncH(async (req, res) => {
  await ensureFriends();
  const fid = String((req.body || {}).friend_id || '');
  await pool.query('DELETE FROM "pix2"."pix_friends" WHERE user_id = $1 AND friend_id = $2', [req.viewerId, fid]);
  res.json({ ok: true });
}));

app.get('/api/friends/mine', requireAuth, asyncH(async (req, res) => {
  await ensureFriends();
  const r = await pool.query(
    'SELECT friend_id, created_at FROM "pix2"."pix_friends" WHERE user_id = $1 ORDER BY created_at DESC', [req.viewerId]);
  const friends = [];
  for (const row of r.rows) friends.push({ user_id: row.friend_id, label: await fanLabel(row.friend_id), created_at: row.created_at });
  res.json({ ok: true, friends });
}));

app.get('/api/friends/feed', requireAuth, asyncH(async (req, res) => {
  await ensureFriends();
  const ids = await myFriendIds(req.viewerId);
  if (!ids.length) return res.json({ ok: true, items: [] });
  const labels = {};
  for (const id of ids) labels[id] = await fanLabel(id);
  const items = [];
  if (await votesHaveUserCol()) {
    const v = await pool.query(
      `SELECT v.id, v.user_id, v.winner_imdb_id, v.loser_imdb_id, v.created_at,
              w.title AS w_title, w.release_year AS w_year, w.poster_key AS w_poster, w.genre AS w_genre,
              l.title AS l_title, l.release_year AS l_year, l.poster_key AS l_poster, l.genre AS l_genre
         FROM "pix2"."pix_movie_votes" v
         JOIN "pix2"."pix_movie_stats" w ON w.imdb_id = v.winner_imdb_id
         JOIN "pix2"."pix_movie_stats" l ON l.imdb_id = v.loser_imdb_id
        WHERE v.user_id = ANY($1)
        ORDER BY v.created_at DESC LIMIT 30`, [ids]);
    for (const r of v.rows) items.push({
      kind: 'pick', id: String(r.id), user_id: r.user_id, label: labels[r.user_id] || 'A PIX fan',
      created_at: Number(r.created_at),
      winner: { imdb_id: r.winner_imdb_id, title: r.w_title, release_year: r.w_year, poster_key: r.w_poster, genre: r.w_genre },
      loser: { imdb_id: r.loser_imdb_id, title: r.l_title, release_year: r.l_year, poster_key: r.l_poster, genre: r.l_genre },
    });
  }
  if (await tableExists('pix2', 'pix_reviews')) {
    const p = await pool.query(
      `SELECT r.id, r.user_id, r.user_label, r.imdb_id, r.rating, r.body, r.stance, r.created_at,
              s.title AS f_title, s.release_year AS f_year, s.poster_key AS f_poster, s.genre AS f_genre
         FROM "pix2"."pix_reviews" r
         LEFT JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = r.imdb_id
        WHERE r.user_id = ANY($1)
        ORDER BY r.created_at DESC LIMIT 20`, [ids]);
    for (const r of p.rows) items.push({
      kind: 'post', id: String(r.id), user_id: r.user_id,
      label: r.user_label || labels[r.user_id] || 'A PIX fan',
      created_at: Number(r.created_at),
      film: { imdb_id: r.imdb_id, title: r.f_title || r.imdb_id, release_year: r.f_year, poster_key: r.f_poster, genre: r.f_genre },
      rating: r.rating, body: r.body || '', stance: r.stance || '',
    });
  }
  const counts = await pool.query(
    `SELECT kind, ref_id, COUNT(*)::int AS n FROM "pix2"."pix_friend_feedback"
      WHERE to_user_id = ANY($1) GROUP BY kind, ref_id`, [ids]);
  const countOf = new Map(counts.rows.map((r) => [`${r.kind}:${r.ref_id}`, r.n]));
  const mine = await pool.query(
    `SELECT kind, ref_id, stance FROM "pix2"."pix_friend_feedback"
      WHERE from_user_id = $2 AND to_user_id = ANY($1)`, [ids, req.viewerId]);
  const mineOf = new Map(mine.rows.map((r) => [`${r.kind}:${r.ref_id}`, r.stance]));
  for (const it of items) {
    it.feedback_count = countOf.get(`${it.kind}:${it.id}`) || 0;
    it.my_stance = mineOf.get(`${it.kind}:${it.id}`) || '';
  }
  items.sort((x, y) => y.created_at - x.created_at);
  res.json({ ok: true, items: items.slice(0, 40) });
}));

app.post('/api/friends/feedback', requireAuth, asyncH(async (req, res) => {
  await ensureFriends();
  const b = req.body || {};
  const to = String(b.to_user_id || '');
  const kind = String(b.kind || '');
  const ref = String(b.ref_id || '');
  const stance = STANCE_LABELS.has(String(b.stance || '')) ? String(b.stance) : '';
  const body = String(b.body || '').trim().slice(0, 500);
  if (!to || (kind !== 'pick' && kind !== 'post') || !ref) {
    return res.status(400).json({ ok: false, error: 'activity required' });
  }
  if (!stance && !body) {
    return res.status(400).json({ ok: false, error: 'pick a stance or write a line' });
  }
  const ids = await myFriendIds(req.viewerId);
  if (!ids.includes(to)) return res.status(403).json({ ok: false, error: 'add them as a friend first' });
  let owned = false;
  if (kind === 'pick' && (await votesHaveUserCol())) {
    const v = await pool.query('SELECT 1 FROM "pix2"."pix_movie_votes" WHERE id = $1 AND user_id = $2', [Number(ref) || -1, to]);
    owned = v.rowCount > 0;
  } else if (kind === 'post' && (await tableExists('pix2', 'pix_reviews'))) {
    const v = await pool.query('SELECT 1 FROM "pix2"."pix_reviews" WHERE id = $1 AND user_id = $2', [Number(ref) || -1, to]);
    owned = v.rowCount > 0;
  }
  if (!owned) return res.status(404).json({ ok: false, error: 'activity not found' });
  await pool.query(
    `INSERT INTO "pix2"."pix_friend_feedback" (from_user_id, to_user_id, kind, ref_id, stance, body, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [req.viewerId, to, kind, ref, stance, body, nowMs()]);
  res.json({ ok: true });
}));

app.get('/api/friends/feedback/mine', requireAuth, asyncH(async (req, res) => {
  await ensureFriends();
  const r = await pool.query(
    `SELECT id, from_user_id, kind, ref_id, stance, body, created_at
       FROM "pix2"."pix_friend_feedback" WHERE to_user_id = $1
      ORDER BY created_at DESC LIMIT 40`, [req.viewerId]);
  const out = [];
  for (const row of r.rows) {
    const item = {
      id: row.id, from_user_id: row.from_user_id, from_label: await fanLabel(row.from_user_id),
      kind: row.kind, stance: row.stance, body: row.body, created_at: Number(row.created_at),
      context: '',
    };
    if (row.kind === 'pick' && (await votesHaveUserCol())) {
      const v = await pool.query(
        `SELECT w.title AS wt, l.title AS lt FROM "pix2"."pix_movie_votes" v
          JOIN "pix2"."pix_movie_stats" w ON w.imdb_id = v.winner_imdb_id
          JOIN "pix2"."pix_movie_stats" l ON l.imdb_id = v.loser_imdb_id
         WHERE v.id = $1`, [Number(row.ref_id) || -1]);
      if (v.rows[0]) item.context = `${v.rows[0].wt} over ${v.rows[0].lt}`;
    } else if (row.kind === 'post') {
      const v = await pool.query(
        `SELECT s.title AS t FROM "pix2"."pix_reviews" r
          LEFT JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = r.imdb_id WHERE r.id = $1`, [Number(row.ref_id) || -1]);
      if (v.rows[0]) item.context = `your post on ${v.rows[0].t || 'a film'}`;
    }
    if (row.kind === 'pick' && !item.context) item.context = 'your pick';
    if (row.kind === 'post' && !item.context) item.context = 'your post';
    out.push(item);
  }
  res.json({ ok: true, items: out });
}));

app.get('/api/fans/:userId', asyncH(async (req, res) => {
  const uid = String(req.params.userId || '');
  if (!uid) return res.status(400).json({ ok: false, error: 'user required' });
  if (!(await tableExists('pix2', 'pix_user_lists'))) return res.json({ ok: true, fan: { user_id: uid, label: 'A PIX fan' }, lists: [] });
  await pool.query('ALTER TABLE "pix2"."pix_user_lists" ADD COLUMN IF NOT EXISTS user_label text').catch(() => {});
  const r = await pool.query(
    `SELECT l.id, l.name, l.description, l.created_at, l.updated_at, l.user_label,
            (SELECT COUNT(*)::int FROM "pix2"."pix_user_list_items" i WHERE i.list_id = l.id) AS items
     FROM "pix2"."pix_user_lists" l
     WHERE l.user_id=$1 AND l.is_public = TRUE ORDER BY l.updated_at DESC LIMIT 100`, [uid]);
  let label = (r.rows.find((x) => x.user_label) || {}).user_label || null;
  if (!label && (await tableExists('pix2', 'pix_reviews'))) {
    const rv = await pool.query('SELECT user_label FROM "pix2"."pix_reviews" WHERE user_id=$1 AND user_label IS NOT NULL ORDER BY created_at DESC LIMIT 1', [uid]);
    if (rv.rowCount) label = rv.rows[0].user_label;
  }
  /* The fan's movie reviews ride the showcase (Founder, 2026-11-08): a
     review — with the fan's own WHY reason — belongs to the individual
     fan's showcase, not to the game. Latest 12, public like their lists. */
  let fanReviews = [];
  if (await tableExists('pix2', 'pix_reviews')) {
    await pool.query('ALTER TABLE "pix2"."pix_reviews" ADD COLUMN IF NOT EXISTS stance text');
    await pool.query('ALTER TABLE "pix2"."pix_reviews" ADD COLUMN IF NOT EXISTS why_tag text');
    const rv = await pool.query(
      `SELECT r.id, r.imdb_id, r.rating, r.body, r.stance, r.why_tag, r.created_at,
              s.title AS f_title, s.release_year AS f_year, s.poster_key AS f_poster, s.genre AS f_genre
         FROM "pix2"."pix_reviews" r
         LEFT JOIN "pix2"."pix_movie_stats" s ON s.imdb_id = r.imdb_id
        WHERE r.user_id = $1 ORDER BY r.created_at DESC LIMIT 12`, [uid]);
    fanReviews = rv.rows;
  }
  res.json({ ok: true, fan: { user_id: uid, label: label || 'A PIX fan' }, lists: r.rows, reviews: fanReviews });
}));

app.post('/api/lists/:id/items', requireAuth, asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const { imdb_id: imdb, note } = req.body || {};
  if (!Number.isInteger(id) || !imdb) return res.status(400).json({ ok: false, error: 'list id and imdb_id required' });
  const own = await pool.query('SELECT 1 FROM "pix2"."pix_user_lists" WHERE id=$1 AND user_id=$2', [id, req.user.id]);
  if (!own.rowCount) return res.status(403).json({ ok: false, error: 'not your list' });
  const exists = await pool.query('SELECT 1 FROM "pix2"."pix_movie_stats" WHERE imdb_id=$1', [imdb]);
  if (!exists.rowCount) return res.status(404).json({ ok: false, error: 'film not found' });
  const pos = await pool.query('SELECT COALESCE(MAX(position),-1)+1 AS p FROM "pix2"."pix_user_list_items" WHERE list_id=$1', [id]);
  await pool.query(
    `INSERT INTO "pix2"."pix_user_list_items" (list_id, imdb_id, note, position, added_at)
     VALUES ($1,$2,$3,$4,$5) ON CONFLICT (list_id, imdb_id) DO UPDATE SET note=$3`,
    [id, imdb, String(note || '').slice(0, 500), pos.rows[0].p, nowMs()]);
  await pool.query('UPDATE "pix2"."pix_user_lists" SET updated_at=$2 WHERE id=$1', [id, nowMs()]);
  res.json({ ok: true });
}));

app.delete('/api/lists/:id/items/:imdb', requireAuth, asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const own = await pool.query('SELECT 1 FROM "pix2"."pix_user_lists" WHERE id=$1 AND user_id=$2', [id, req.user.id]);
  if (!own.rowCount) return res.status(403).json({ ok: false, error: 'not your list' });
  await pool.query('DELETE FROM "pix2"."pix_user_list_items" WHERE list_id=$1 AND imdb_id=$2', [id, req.params.imdb]);
  res.json({ ok: true });
}));

/* ---------------- TOUGH PIX sharing ----------------
 * Share a VS matchup with a unique link; anyone (even anonymous) can open it
 * and pick; the sender sees pick counts on their profile. */
app.post('/api/tough/share', requireAuth, asyncH(async (req, res) => {
  const { a_imdb_id: a, b_imdb_id: b, deck_key: dk } = req.body || {};
  if (!a || !b || a === b) return res.status(400).json({ ok: false, error: 'two different films required' });
  const both = await pool.query('SELECT COUNT(*)::int AS c FROM "pix2"."pix_movie_stats" WHERE imdb_id = ANY($1)', [[a, b]]);
  if (both.rows[0].c !== 2) return res.status(404).json({ ok: false, error: 'film not found' });
  const key = newShareKey();
  const ins = await pool.query(
    `INSERT INTO "pix2"."pix_tough_shares" (share_key, creator_user_id, a_imdb_id, b_imdb_id, deck_key, created_at)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [key, req.user.id, a, b, String(dk || ''), nowMs()]);
  res.json({ ok: true, share_key: key, url: '#/tough/' + key });
}));

app.get('/api/tough/:key', asyncH(async (req, res) => {
  const s = await pool.query('SELECT * FROM "pix2"."pix_tough_shares" WHERE share_key=$1', [req.params.key]);
  if (!s.rowCount) return res.status(404).json({ ok: false, error: 'share not found' });
  const sh = s.rows[0];
  const films = await pool.query(
    'SELECT imdb_id, title, release_year, genre, poster_key, wins FROM "pix2"."pix_movie_stats" WHERE imdb_id = ANY($1)',
    [[sh.a_imdb_id, sh.b_imdb_id]]);
  const picks = await pool.query(
    `SELECT picked_imdb_id, COUNT(*)::int AS c FROM "pix2"."pix_tough_picks" WHERE share_id=$1 GROUP BY picked_imdb_id`,
    [sh.id]);
  res.json({ ok: true, share: sh, films: films.rows, picks: picks.rows });
}));

app.post('/api/tough/:key/pick', asyncH(async (req, res) => {
  const s = await pool.query('SELECT id, a_imdb_id, b_imdb_id FROM "pix2"."pix_tough_shares" WHERE share_key=$1', [req.params.key]);
  if (!s.rowCount) return res.status(404).json({ ok: false, error: 'share not found' });
  const { picked_imdb_id: pick } = req.body || {};
  if (pick !== s.rows[0].a_imdb_id && pick !== s.rows[0].b_imdb_id) {
    return res.status(400).json({ ok: false, error: 'pick must be one of the two films' });
  }
  // Optional auth: identify the picker when signed in, stay anonymous otherwise.
  let picker = null;
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token && supaAdmin) {
    try {
      const { data: { user } } = await getUserFast(token);
      picker = user ? user.id : null;
    } catch { /* anonymous */ }
  }
  await pool.query(
    'INSERT INTO "pix2"."pix_tough_picks" (share_id, picker_user_id, picked_imdb_id, created_at) VALUES ($1,$2,$3,$4)',
    [s.rows[0].id, picker, pick, nowMs()]);
  res.json({ ok: true });
}));

/* ---------------- CINE Lite BIN ----------------
 * Scoped subset of CINE for the portable: a personal work-in-progress
 * registry + the classic clip library + the auto-dice engine (above).
 * The full browser timeline editor is out of scope — see README. */
app.get('/api/cine/bin', requireAuth, asyncH(async (req, res) => {
  if (!(await tableExists('pix2', 'pix_cine_bin'))) return res.json({ ok: true, items: [] });
  const r = await pool.query(
    'SELECT id, filename, size_bytes, note, created_at FROM "pix2"."pix_cine_bin" WHERE user_id=$1 ORDER BY created_at DESC',
    [req.user.id]);
  res.json({ ok: true, items: r.rows.map((x) => ({ ...x, size_bytes: Number(x.size_bytes) })) });
}));

app.post('/api/cine/bin', requireAuth, asyncH(async (req, res) => {
  const { filename, size_bytes, note } = req.body || {};
  if (!filename) return res.status(400).json({ ok: false, error: 'filename required' });
  const ins = await pool.query(
    'INSERT INTO "pix2"."pix_cine_bin" (user_id, filename, size_bytes, note, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [req.user.id, String(filename).slice(0, 255), Number(size_bytes) || 0, String(note || '').slice(0, 500), nowMs()]);
  res.json({ ok: true, id: ins.rows[0].id });
}));

app.delete('/api/cine/bin/:id', requireAuth, asyncH(async (req, res) => {
  await pool.query('DELETE FROM "pix2"."pix_cine_bin" WHERE id=$1 AND user_id=$2', [Number(req.params.id), req.user.id]);
  res.json({ ok: true });
}));

/* Unknown /api/* paths answer the standard JSON envelope, never the
 * Express HTML default (1:1 Pass 2, 2026-11-05 — Local's carry-forward).
 * Registered after every API route; static + page routes are untouched. */
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: 'not found', code: 'not_found' });
});

/* ---------------- errors + boot ---------------- */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[pix]', err.message);
  res.status(500).json({ ok: false, error: 'server error' });
});

async function boot() {
  try {
    await pool.query('SELECT 1');
    console.log('[pix] postgres reachable');
  } catch (e) {
    console.warn('[pix] WARNING: postgres unreachable:', e.message);
  }
  app.listen(PORT, () => console.log(`[pix] listening on :${PORT}`));
}
boot();
