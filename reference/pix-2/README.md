# Reference: the Muse PIX.MOV app source (pix-2) — the source of record

**Snapshot:** 2026-10-21, taken from the live Muse app's working tree.
**Purpose:** parity work on the portable build should port from THIS code — not from prose handoffs. Every value, string, and behavior the portable build needs already exists here exactly.

## What is included

- `client/src/` — the full React/TypeScript client: `App.tsx` (app shell, header, landing, routing), `PixSection.tsx` (NOW PLAYING, channels, Top 500, SEEN, attractions), `PixPlayerKit.tsx` (film + Shorts players: segments, billboard, PiP/fullscreen/pop-out), `PixMoviePage.tsx`, `PixProfileSection.tsx` (profile, SHOWCASE, lists), `PixLists.tsx`, `PixPosterImage.tsx`, `SafeSpaceNotice.tsx`, `theme.css` (the complete stylesheet — the pix-design package is an extract of this), `pixPosterManifest.ts` + `pixMarqueeArchiveManifest.ts` (poster data maps), `api.ts` (typed RPC bridge).
- `server/src/` — `actions.ts` (every server action: votes, triage, consent/BISCUIT gating, FILM DNA, fan type, feedback, moderation, CINE, distributor…), `schema.ts` (the database schema of record), `privileged.ts` + `server/.generated/privileged.contract.ts` (founder-backend actions).
- Root configs: `package.json`, `tsconfig.base.json`, `space.json`, `VERSION.md`, `bunfig.toml`.

## What is excluded, and why

- **`app.db` (the live database, ~47 MB)** — never committed. It holds user data (profiles, votes, demographics). Data the portable build needs travels as curated exports under `handoffs/data/` (e.g. synopses, classic thumbnails).
- **`client/src/assets/` (~1.3 GB, 12,277 poster/image files)** — bundled artwork is data, not code; the portable build runs its own poster pipeline. `pixPosterManifest.ts` (included) maps films to their assets.
- **node_modules, build output, audits, platform dirs** (`.space-build`, `.harness`) — Muse runtime machinery, not product source.
- **drizzle/ migrations** — derived from `server/src/schema.ts`, which is included and is the truth.

## The one honest limit

This app runs on the Muse artifact runtime: the client/server bridge (`api.ts`) and server actions import **`@hatch/space-sdk`** / `@space/privileged` — Muse platform modules that don't exist outside Muse. So this source is **the specification, not a runnable drop-in**: it cannot be cloned onto a standalone server and executed as-is. What it eliminates is the translation loss — instead of re-implementing behavior from descriptions, port the logic directly: copy values, copy strings, copy state machines, and re-express only the platform seams (RPC actions → REST endpoints, hosted DB → Postgres) in the portable stack.

## How to use it for a parity fix

1. Find the behavior in the handoff's probe.
2. Read the implementing code here (start: `PixSection.tsx` / `PixPlayerKit.tsx` / `server/src/actions.ts`).
3. Port the logic; where this code reads a constant, the portable build uses the same constant.
4. Verify with the handoff's probe against the live site — closure is the probe, not the port.
