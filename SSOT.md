# PIX — Single Source of Truth

**Governance:** this repo follows the LAT system and the RULEBOOK (`MaggiLunk/LAT` → `RULEBOOK/RULEBOOK.md`); its LAT package is in `lat/`, drift-gated by the LAT REGISTRY.

This repo is the ONE home for PIX.MOV work. It replaced the split across
`MaggiLunk/pixmov` (portable build + handoffs) and `MaggiLunk/pix-design`
(design package). **Both legacy repos were DELETED by Brian on 2026-10-26**
(probe-verified 404 the same day) so this repo is unmistakably the sole
source — design elements included. Their contents live on here; only their
per-repo commit histories were retired with them.

## Layout

- **Repo root** — the portable build: the deployable app that serves pix.mov
  (`server.js`, `public/`, `lib/`, `supabase-migration/`, package files).
  The local agent works here. This is the trunk.
- **`v1/`** — the Muse artifact's full source of record, versioned per
  `VERSION.md` (generations get directories; minor versions advance inside
  `/v1/`). Supersedes `reference/pix-2/` as the source home.
- **`VERSION.md`** — the VERSION system: current version, the log, the
  honest-change rule, and the three-stamp sync check (footer → log → live).
- **`reference/pix-2/`** — the initial snapshot of the Muse app's source (the product's
  source of record). Read-only for the local agent: port FROM it, never edit
  it. Lunk refreshes the snapshot in the same push as every handoff, so it
  cannot silently drift from the Muse app again.
- **`design/`** — the design package: `tokens.css`, `theme.css`,
  `settings.json` (the machine-readable behavior contract), `components.md`.
- **`handoffs/`** — the parity ledger: versioned handoffs with per-item
  status and pass/fail probes, plus `handoffs/data/` exports (synopses,
  thumbnails, future data) that travel as files, never re-derived.

## Rules

1. One repo for everything PIX.MOV. No parallel copies.
2. An item is closed only when its probe passes on the live site —
   commit messages do not close items.
3. Data moves as export files under `handoffs/data/`. The Muse app's live
   database (`app.db`) and its bundled poster assets are never committed.
4. Exact values live in `design/settings.json`. Handoffs cite keys and
   reference code; they do not paraphrase values.
