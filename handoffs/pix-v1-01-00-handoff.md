# PIX.MOV — pix-v1-01-00 Handoff: Verification, Degradation Analysis, and the Path to 1:1

**Date:** 2026-10-21
**Live site:** https://www.pix.mov/ (portable build, this repo)
**Method:** second full read-only scan (14+ routes), re-testing every item of `handoffs/pix-v1-00-00-handoff.md` against the live site after repair commits `19b52dee` ("close the pix-v1-00-00 handoff") and `0123f676` ("fix(P0-3) anonymous identity").
**Data shipped with this handoff** (import these; do not re-derive):
- `handoffs/data/synopses.json` — 1,078 films: imdb_id, title, year, Wikipedia-lead synopsis, attribution URL.
- `handoffs/data/classic-thumbnails.json` — 31 classic films, 1,309 segments: thumbnail_url (B2), stream_url, duration_ms, plus per-film still_url and stream_base_url.

---

## 1. Verification of the v1.00.00 repair pass

| Item | Verdict | Evidence from the live site |
|------|---------|------------------------------|
| P0-1 Player exists | **VERIFIED (core)** | Real `<video>` on Watch pages; Nosferatu plays (0:04/1:59); PiP / Pop-out / Fullscreen buttons present; "Waiting for upload" and `CLASSIC_CLIPS_BASE_URL` gone |
| P0-1 Player finish | **PARTIAL** | No poster/still frame before play (gray spinner box, then autoplay); segment list is bare number buttons 1–46 with **no thumbnails**; no billboard/quote interstitial observable at segment boundaries — segments read as one continuous stream |
| P0-2 Search | **STILL MISSING** | No search control anywhere: header, account menu, landing, Top 500, SEEN, Classics all checked. The closing commit's message claims search; the site has none |
| P0-3 FILM DNA % | **STILL MISSING** | Header reads verbatim `FILM DNA RECORDED —` on every page, signed out. Commit `0123f676` wires the anonymous ID server-side, but the header never renders a value |
| P0-4 SHOWCASE | **STILL MISSING** | SHOWCASE still navigates to `#/auth` ("PIX.MOV · ACCOUNT", sign-in/sign-up tabs) |
| P1-1 Synopses | **DEGRADED** | "More info →" now opens **IMDb in a new tab**. No synopsis on pix.mov, no attribution. The feature was replaced by an outbound link — not the same feature |
| P1-2 SEEN blank posters | **STILL BROKEN** | #/seen/1998: only ~15 of 100 tiles show art; ~85 blank. Worse than a styling issue — the poster resolution path is still failing, and the no-poster-no-tile rule is still unenforced |
| P1-3 Genre counts | **DEGRADED** | Dropdown: Drama 16 / Action 16 / Comedy 16 (looks capped at 16). Rows: Drama 69 / Action 59 / Comedy 50 / Crime 12. Only Crime agrees. Horror and Top Rated rows show **no count at all** while siblings do |
| P1-4 Feedback form | **STILL MISSING** | Clicking IDEA highlights it yellow; no form, no textarea, no submit renders |
| P1-5 Classics art | **STILL MISSING** | #/classics cards are still text-only |
| P1-6 Mojibake | **VERIFIED FIXED** | No `â` sequence found on landing or Top 500 |
| P1-7 Doubled years | **STILL BROKEN** | "Nosferatu (1922) (1922)", "Häxan (1922) (1922)", etc. on nearly every Classics card, the Nosferatu Watch heading, and the CINE list. Only "Dracula (1931)" is correct |
| P2-1 NP overlay | **VERIFIED** | NOW PLAYING is now a floating overlay: filter, folds, TOUGH PIX (yellow, "Share PIX.MOV Challenge For Advice"), FAN TYPE panel, close X |
| P2-3 CINE copy | **STILL EXPOSED** | "The full browser timeline editor is out of scope for the portable build — see README." still visitor-facing on #/cine |
| Header/footer/design | **VERIFIED** | Standalone logo with bulb dots, red NOW PLAYING with gold outline, slim ~62px header, footer verbatim incl. `© 2029 PIX.MOV` (per spec — not a bug), Top 500 SIZER + hundred-groups (Top 100 open, rest closed) all exact |
| New defects | — | Top 500 hover badge duplicates the rank: `#001 #001 OPTIONS`. Classic cards show an orphan `· 35 clips` (leading bullet, no creator) — only Dracula carries "Tod Browning · 38 clips". Classics grid briefly renders cards without Watch buttons, then re-renders (race). Horror row's tagline "Terror from the public-domain vault" is verbatim from Muse source, but the row beneath it is current commercial horror — the line and the content disagree |

**Score: of 14 tracked items — 4 verified, 1 fixed (encoding), 2 partial/degraded-in-detail, 7 still missing or broken.** The pattern inside that score is the real subject of this document.

---

## 2. Where handoff degradation occurs — specifically

Degradation is not random, and it is not (mostly) carelessness. Across two passes it occurs at exactly five points, each with named instances above:

**D-1. Closure is declared at the commit, not at the site.**
Commit `19b52dee` is titled "close the pix-v1-00-00 handoff — player, search, DNA, showcase, synopses…" — yet search, the DNA value, and SHOWCASE do not exist on the live site, and synopses became an IMDb link. "Done" currently means *code was written*, not *behavior is present in production*. Any item can silently fail at build, deploy, or runtime and nobody downstream can tell. **This is the single largest degradation source.**

**D-2. Adjectives degrade; values don't.**
Compare outcomes inside the same handoff: every fix specified with exact values landed exactly (palette hexes, header structure, SIZER readout `1.00×`, hundred-group defaults, footer text verbatim). Every fix specified with adjectives drifted: "a segment list with thumbnails" → bare number buttons; "poster frame before play" → gray spinner + autoplay; "counts should match" → a dropdown capped at 16. Prose description leaves a gap that implementation fills with its own defaults.

**D-3. Feature substitution passes as completion.**
"More info → IMDb" satisfies the *letter* of "more info" while deleting the feature (on-site synopsis + attribution + synopsis search corpus). Substitution is invisible unless the acceptance check names the behavior, not the label.

**D-4. Data-shaped features cannot be coded around missing data.**
Synopses, per-clip thumbnails, stills, and poster coverage live in the Muse database and on B2. The portable seed was built independently, so its data diverges (85 blank SEEN tiles is a *data/path* failure, not a layout failure). No amount of repair code fixes an empty column. Hence the two data exports shipped with this handoff.

**D-5. Local consistency defects ride along unflagged.**
Doubled years on three surfaces, a duplicated rank in the hover badge, an orphan bullet where a director name is missing, counts present on four rows and absent on two — none of these were in any handoff; they were introduced by the repair work itself and are only catchable by looking at the rendered site, which loops back to D-1.

Two things are **not** degradation and should not be chased as defects: `© 2029` is Brian's specified text, and CINE's missing timeline editor / DISTRIBUTOR / STORAGE are scope decisions reserved to Brian — "CINE Lite" is the agreed portable scope until he says otherwise.

---

## 3. Why it isn't 1:1 — and what 1:1 can honestly mean

The Muse app and this portable build share **no code and no database**. They are different stacks (artifact runtime + its own DB vs Express + Postgres + vanilla JS) implementing the same product from descriptions. Every feature therefore crosses four translations — Muse behavior → handoff prose → reader's model → new code — and each translation is lossy exactly where it is vague (D-2). Literal 1:1 (identical code, identical data) is not achievable across that gap and never was; chasing it produces the D-1/D-3 failure mode, where the *claim* of parity substitutes for parity.

**Working definition of 1:1 for this project: visitor-visible behavior parity on the agreed surface** — same values, same copy, same data, same observable behavior, verified on the live site. Under that definition 1:1 is reachable, with three provisos: (a) the agreed surface excludes the full CINE editor and the Muse app's internal/legacy systems (founder actions, Brainstorm legacy notes/chat) — those never cross; (b) parity is maintained per-release through the protocol below, not achieved once; (c) where behavior depends on data, the data itself must travel (D-4).

## 4. The resolution — a parity protocol for every future pass

1. **Contract over prose.** `MaggiLunk/pix-design` `settings.json` is the machine-readable contract: every behavior that matters gets a key with an exact value (durations, widths, ranges, verbatim strings). Handoffs cite keys; they never paraphrase values. New values are added to settings.json *first*, then implemented twice.
2. **Verbatim assets travel as files.** Copy, quotes, taglines, word lists move as data files in a repo — imported, never retyped. (This handoff's two JSON exports are the pattern.)
3. **Every repair item carries a probe.** A probe is a check that can *fail*: a string that must/must not appear, a count that must equal another count, an element that must exist. Closure of an item = the probe's output on the **live site**, pasted into the commit or PR. A commit message alone never closes an item again.
4. **The parity ledger persists.** Items carry VERIFIED / PARTIAL / DEGRADED / OPEN status across handoff versions (see §1) and leave the ledger only when a live-site scan verifies them. This document is the ledger's current state.
5. **One count/source per fact.** Any number shown twice (genre counts, segment counts, clip counts) is computed once, server-side, and rendered from that single payload in both places.

---

## 5. Repair list — pix-v1-01-00 (each with its probe)

**R1 — Search (reopens P0-2).** Header search input; `GET /api/search?q=` over title (and synopsis after R4); results as poster tiles (no poster → no tile). *Probe:* searching `dracula` returns ≥1 tile with poster art; the input exists in the header DOM on every route.

**R2 — FILM DNA % renders (reopens P0-3).** The anon identity exists (commit `0123f676`); bind the header to it: after bootstrap, render `FILM DNA RECORDED n.nn%` = (films this identity has decided ÷ catalog on record × 100), two decimals; `0.00%` is the correct value before any decision — a bare `—` after bootstrap is the bug. *Probe:* fresh browser profile → header matches `FILM DNA RECORDED \d+\.\d\d%` without signing in; cast one vote → value increases.

**R3 — SHOWCASE page (reopens P0-4).** `#/showcase` renders a profile page (fan type, taste, lists, review counts from existing data); signed-out visitors get the showcase page with a sign-in prompt *on it*. The nav item must never resolve to `#/auth`. *Probe:* click SHOWCASE → URL hash is `#/showcase` and page title contains SHOWCASE.

**R4 — Synopses on-site (reopens P1-1; reverses the D-3 substitution).** Import `handoffs/data/synopses.json` (new columns/migration per repo convention). "More info" expands the synopsis **on the film page** with its attribution link. An additional IMDb link is acceptable; as the *only* behavior it is not. *Probe:* The Faculty's page shows a synopsis paragraph + a wikipedia.org attribution link without leaving pix.mov; coverage count = 1,078 imported films.

**R5 — Player finish (completes P0-1).** Three specifics: (a) `poster` = the film's `still_url` (from `classic-thumbnails.json`) shown before play — no gray spinner box, no autoplay before first interaction on the Watch page; (b) segment tiles render each segment's `thumbnail_url` from the same export, with the number as a caption; (c) at each segment end, the 5-second BILLBOARD (gold card, rotating quote + attribution from pix-design `settings.json`, countdown) plays before the next segment; a booked ad takes precedence when one exists. *Probe:* open Nosferatu → still frame visible pre-play; segment 1 tile shows a frame grab; let segment 1 end → quote card visible ~5s → segment 2 starts.

**R6 — SEEN posters (reopens P1-2).** Diagnose why year-grid poster resolution fails for ~85% of titles while Attractions/Top 500 resolve (compare the exact URL/field each surface uses — they differ). Fix the path, then enforce the standing rule in the renderer: a film whose poster doesn't resolve renders **no tile**. *Probe:* on #/seen/1998, count of tiles without poster art = 0, and every visible tile shows art.

**R7 — One genre count (fixes P1-3 degradation).** Single server-side count per genre, used by both the GENRES dropdown and the row headings; remove the apparent 16 cap; add the missing counts to the Horror and Top Rated rows so all rows carry `N films · Genre`. *Probe:* for all six genres, dropdown count == row count.

**R8 — Feedback form (reopens P1-4).** Selecting IDEA / ISSUE / REPORT A USER / APPEAL renders that type's form (textarea + submit; username field for REPORT; reference field for APPEAL) and POSTs to the feedback store with a confirmation state. *Probe:* click IDEA → a textarea and submit button exist in the DOM; submit → confirmation visible.

**R9 — Classics art (reopens P1-5).** Card art = film poster, falling back to `still_url`, falling back to segment 1's thumbnail (all in `classic-thumbnails.json`). *Probe:* every #/classics card contains an image that loads (naturalWidth > 0).

**R10 — One title formatter (reopens P1-7).** Shared formatter: if a stored title already ends in `(YYYY)`, do not append the year. Apply on Classics cards, Watch headings, CINE library list, and audit every other surface that formats title + year. *Probe:* the string pattern `(YYYY) (YYYY)` appears on zero pages (check Classics, one Watch page, CINE).

**R11 — Rank badge duplication.** Top 500 hover badge reads `#001 #001 OPTIONS` — render the rank once: `#001 OPTIONS`. *Probe:* hover any Top 500 tile → badge contains the rank exactly once.

**R12 — Classic card byline.** Cards show either `Director · NN clips` or `NN clips` — never a leading `· ` with nothing before it. (Director data exists for some titles; where absent, drop the bullet.) *Probe:* no Classics/CINE card text starts with `·`.

**R13 — Visitor copy purge.** Replace on #/cine: "The full browser timeline editor is out of scope for the portable build — see README." → "CINE Lite — clip library, BIN and auto-dice. The full timeline editor lives in the PIX.MOV app." On the Agreements page, introduce the consent tool by its full name once — "Cookie & Data Consent (BISCUIT)" — instead of the bare codename. Sweep rendered pages for `README`, `out of scope`, `portable build`, and config-style names; none may remain in visitor copy. *Probe:* those strings return zero matches in page text on #/cine and #/agreements.

**R14 — Horror tagline/content mismatch (low).** The tagline "Terror from the public-domain vault" is verbatim Muse copy, but this build's Horror row is current commercial horror. Either compose that channel from the public-domain horror catalog (the Muse classic set) or move the line to the classics-attributed row. Flagged for Brian's call if composition is intentional; do not silently rewrite the copy. *Probe:* none — decision item.

**R15 — Classics grid render race (low).** Cards briefly render without Watch buttons, then re-render complete. Render cards atomically (or skeleton-complete) so no intermediate state paints. *Probe:* first paint of #/classics already includes Watch buttons.

## 6. Acceptance for this pass

Closure is per-item, by probe output against https://www.pix.mov/, followed by a Lunk re-scan. The pass is complete when R1–R13 probes all pass live (R14 is a decision, R15 best-effort), and the §1 ledger shows no OPEN items outside the agreed scope exclusions (§3).

*Ledger carried forward: P0-1 partial (R5) · P0-2 open (R1) · P0-3 open (R2) · P0-4 open (R3) · P1-1 degraded (R4) · P1-2 open (R6) · P1-3 degraded (R7) · P1-4 open (R8) · P1-5 open (R9) · P1-6 verified-closed · P1-7 open (R10) · P2-1 verified-closed · P2-3 open (R13).*
