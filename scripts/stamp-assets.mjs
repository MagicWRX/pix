#!/usr/bin/env node
/**
 * stamp-assets.mjs — content-versioned asset URLs for the PIX.MOV trunk.
 *
 * Rewrites every static-asset reference in public/index.html to carry
 * ?v=<sha12>, where sha12 is the first 12 hex characters of that file's
 * own sha256. The URL therefore identifies the exact bytes: a stale
 * cache becomes structurally impossible, and the URL doubles as the
 * audit key. Also stamps window.PIX_BUILD (the app.js sha12) into the
 * page so the client build beacon (X-Pix-Build) knows its own build.
 *
 * Deterministic: same bytes => same URL. No timestamps, no random,
 * no build counter. Idempotent: re-running over a stamped index.html
 * produces zero changes. Fails loudly (exit 1) if a referenced file is
 * missing or index.html does not reference a named asset.
 *
 * Run before every commit that touches a static asset:  npm run stamp
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const indexPath = join(publicDir, 'index.html');

/* Every static asset index.html must reference, in page order. */
const ASSETS = [
  'styles.css',
  'design/tokens.css',
  'design/theme.css',
  'design/app-glue.css',
  'app.js',
];

function fail(msg) {
  console.error(`stamp-assets: ERROR: ${msg}`);
  process.exit(1);
}

function sha12Of(file) {
  const bytes = readFileSync(file);
  return createHash('sha256').update(bytes).digest('hex').slice(0, 12);
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

if (!existsSync(indexPath)) fail(`missing ${indexPath}`);
let html = readFileSync(indexPath, 'utf8');
const original = html;

const stamps = new Map();
for (const asset of ASSETS) {
  const file = join(publicDir, asset);
  if (!existsSync(file)) fail(`referenced asset missing on disk: public/${asset}`);
  stamps.set(asset, sha12Of(file));
}

for (const asset of ASSETS) {
  const re = new RegExp(`(href|src)=(["'])${escapeRe(asset)}(?:\\?v=[^"']*)?\\2`, 'g');
  if (!re.test(html)) fail(`public/index.html does not reference ${asset}`);
  html = html.replace(re, `$1=$2${asset}?v=${stamps.get(asset)}$2`);
}

/* window.PIX_BUILD — the client's own build identity (app.js sha12). */
const build = stamps.get('app.js');
if (/window\.PIX_BUILD\s*=\s*"[0-9a-f]*"/.test(html)) {
  html = html.replace(/window\.PIX_BUILD\s*=\s*"[0-9a-f]*"/, `window.PIX_BUILD = "${build}"`);
} else {
  const anchor = new RegExp(`(<script\\s+src=["']app\\.js\\?v=${build}["']>)`);
  if (!anchor.test(html)) fail('could not locate the app.js script tag to stamp PIX_BUILD before');
  html = html.replace(anchor, `<script>window.PIX_BUILD = "${build}";</script>\n$1`);
}

for (const asset of ASSETS) console.log(`${asset}?v=${stamps.get(asset)}`);
console.log(`window.PIX_BUILD="${build}"`);

if (html !== original) {
  writeFileSync(indexPath, html);
  console.log('index.html: stamped (changed)');
} else {
  console.log('index.html: already stamped (no change)');
}
