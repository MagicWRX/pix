# PIX-SITE — TRUE MOSAIC BUILD + BACKEND WIRING — Handoff for Local Agents

**Issued:** 2026-10-28 (Lunk, on Brian's direct order)
**Amended:** 2026-10-29 — **MVP LAUNCH SCOPE locked by Brian** (new
section below; Workstream A/B and Report back amended to match) and the
structure ref updated to `mosaic-live-v3`.
**Companion record:** `PIX-SITE-AUDIT.md` (this repo, root) — §8 carries the
founder verdict this handoff executes.
**Target:** **https://www.pix.mov** — the live site, rebuilt true.

## Why this exists

Brian's verdict (2026-10-28): the MOSAIC reassembly of PIX.MOV (PIX-SITE,
17 pages) *"lacks the gentle finesse of the Artifact version — the css
functions appear to be lost and possibly need a runthrough 'DESIGNER' to
perfect."* PIX-SITE as shipped is **Stage 1: visual shells** — placeholder
poster art, hard-coded sample films and counts, no data, no behaviour.
This handoff is the **True Build**: Stages 2 + 3 (real content, real
behaviour) plus the finesse pass that restores what the dissection lost.

## Launch scope — the MVP cut (LOCKED by Brian, 2026-10-29)

- **Parity target is 1:1.** pix.mov live must be a **1:1 copy of the
  pix-2 artifact** — the artifact is the product, not a reference or an
  inspiration. Any place the live site differs from the artifact is
  **drift**, reported with both values.
- **The artifact is ahead of the MVP.** The artifact holds the full
  vision; the launch cut is deliberately *less* than the full build:
  - **CINE is hidden at launch.** Every CINE instance on the live site
    (the CINE Workspace page, CINE surfaces, CINE entry points) is
    **built but not shown and not linked** in the MVP. Unhiding is a
    post-launch step on Brian's word. The artifact and the PIX-SITE
    assembly keep CINE — the vision doesn't change; only the live MVP
    hides it.
  - **The launch gate is user accounts.** Signup + email verification
    working end-to-end on the live site (through the mirror write
    path) is the must-pass. **Once accounts work, Brian launches** —
    the launch exists so he can get **Google Ads approval**
    (MONETIZATION Leg 1, ADVERTISING). Everything else in Workstream A
    stays in the build order, but accounts are the critical path and
    are reported **first**.
  - **Public-domain streaming must display.** The classic / public-
    domain streaming films (the `classic_clips` catalogue — 4,623
    rows) must be **visible and playable** on the live site at
    launch. Today they do not display; treat that as a launch blocker
    on par with accounts.
- **Design parity is part of 1:1** (Workstream B additions, both named
  by Brian 2026-10-29): **the light bulbs** and **the PIX.MOV logo**
  on the live site do not match the artifact today. Both are named
  items on the finesse checklist wherever they appear (the header at
  minimum): the bulbs reproduce the artifact's bulb design (the
  BULB-CHASE design data — halo + glass + highlight, chase phases,
  per the pix-design / `theme.css` values), and the logo/wordmark
  matches the artifact's exactly.

## Sources of record (pull only from these)

| What | Where | Pin |
|---|---|---|
| Vision source (the artifact's code) | MaggiLunk/pix, `v1/` | commit `ada57602` (verified complete current source of pix-2) |
| Site structure (17-page assembly) | MOSAIC PIX-SITE, in the MOSAIC build on MaggiLunk/MOSAIC | ref `mosaic-live-v3` @ `297f69ea` |
| Data SSOT | GAKz schema `pix` | census 2026-10-27: **52 tables / 251,679 rows** (movie_stats 13,663 · wikidata_credits 202,013 · classic_clips 4,623) |
| Mirror pattern | `PIX-LIVE-MIRROR-HANDOFF.md` | this repo, root |

The Muse artifact `pix-2` is the vision of record; `v1/` is its source
on GitHub. If the source and this handoff disagree, the source wins and
the disagreement is reported as drift.

## Workstream A — Backend wiring

1. **Mirror:** stand up (or verify) the Web Server Postgres database
   `pix` as a mirror of GAKz `pix` — schema + tables, idempotent
   down-sync (stable IDs + watermarks), **GAKz wins every conflict**.
   Verify against the census above and report the numbers you get.
2. **Serve:** pix.mov is served from that stack — site structure from
   `v1/`, data from the mirror. No third-party host panel is involved.
3. **Wire the behaviour** the shells only picture: NOW PLAYING
   (vote records and immediately deals the next pair; any expressed
   opinion — Maybe / Not Interested / Want to Watch / Never Heard of It —
   permanently removes that film from game rotation), seen → WATCHED,
   AVAILABLE CATALOG, Top 500, user lists (public/private, created in
   Profile), SHOWCASE, TOUGH PIX shares, FILM DNA signals, **signup +
   email verification (the MVP launch gate — see Launch scope)**, the
   **BISCUIT single consent gate**, Safe Space moderation, **B2
   classic-clips playback — the public-domain streaming films must
   display and play at launch**, and the CINE surfaces **(built, but
   HIDDEN at launch per the MVP cut)**.
4. **Posters are referenced, never embedded:** resolve by manifest key
   (`pixPosterManifest` / marquee archives), exactly as `v1/` does.
5. **Write path (LOCKED 2026-10-27):** user writes land in the **mirror
   only**. Lunk tracks the mirror's user-write tables and up-syncs to
   GAKz `pix`. **Local never writes GAKz directly.** Catalog/reference
   data is down-only.

## Workstream B — The finesse pass (DESIGNER run-through)

The finesse lives in `v1/`'s `theme.css` (≈3,749 lines) and the
component styling logic — tokens, interactive states, transitions,
poster hover (grow a few percent + yellow border), glow, marquee (MM)
motion, per-device rules. The MOSAIC shells flattened this into static
class rules; that is the loss Brian named.

- **Inventory first:** list every behaviour `theme.css` + the components
  actually implement, page by page across the 17 PIX-SITE pages.
- **Re-express as design data, not pasted CSS:** each behaviour becomes
  MOSAIC **DESIGNER** material — designs with DESIGN-STATEs and MOTION
  presets, plus primitive-level rules — in the build the live site
  renders from, so the finesse is data the system owns (themes as DB
  data, per the MOSAIC model), not a one-off stylesheet fork.
- **Acceptance:** a per-page side-by-side behaviour checklist against
  the artifact version (the `v1/` source running as reference): every
  inventoried behaviour marked *reproduced*, or *named as not
  reproducible here* with the reason. Nothing is silently dropped.
  **Named parity items (Brian, 2026-10-29): the light bulbs and the
  PIX.MOV logo** — checklist lines of their own wherever they appear
  (header at minimum); today's live versions do not match the
  artifact, and closing that gap is part of the 1:1 parity target.
- Locked look, unchanged: 98% black page background, solid black header
  and VS game, golden yellow `#FFD400` trim, poster-sized black boxes
  with yellow trim, description on/off (off = floats over the poster).

## Honesty rails (both workstreams)

- **Placeholder content never ships.** Sample films, sample counts, and
  placeholder copy in the shells are replaced by bound real data — or
  the page does not publish. The shared header wordmark reads
  **PIX.MOV**, never "BRAND", on the live site.
- **Named gaps stay named — do not improvise them:** the Story-side
  sections (Dream Log, Posters, Monsters, Notes, Publish) are
  **excluded pending Brian's founder call**; a standalone FILM DNA page,
  a standalone Sort page, and a standalone MY SCREENING page are open
  gaps — build them only on Brian's word.
- **Real user data is preserved.** pix-2's store holds real profiles,
  votes, lists, shares, notes and CINE assets. Nothing in this build
  overwrites real data with template samples.
- The pix-2 GAKz bridge flag and Phase B attestation are a **separate
  program** — this build wires through the mirror; do not flip the
  artifact's bridge flag or depend on the key being typed there.

## Report back (verified facts only)

- **First: the launch gate** — account hook-up status (signup + email
  verification end-to-end on the live site) and the **public-domain
  streaming display** status. These two gate Brian's launch (Google
  Ads approval).
- Mirror verification: table count + row counts for the census tables,
  expected vs actual.
- Which of the 17 pages are live with bound data; which are not, and why.
- The finesse checklist: per page, behaviours reproduced vs named gaps
  — including the **bulb** and **logo** parity verdicts.
- Confirmation that **CINE is built but hidden** on the live MVP (no
  CINE surface shown or linked).
- Anything that deviated, stated as drift with both values.

After the report, Lunk runs the three-way scan (live pix.mov vs GitHub
`v1/` + the MOSAIC build vs the vision record). PIX.MOV's live leg stays
**DRIFT** until the mirror verifies against the census **and** the first
Lunk up-sync runs. Brian's click-through is the verification of record.
