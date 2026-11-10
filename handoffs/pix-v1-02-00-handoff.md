# PIX.MOV — pix-v1-02-00 Handoff: Three-Way Audit (Muse Source vs GitHub Trunk vs Live Site)

**Date:** 2026-10-21
**Method:** (1) Muse pix-2 source read directly (`reference/pix-2/` in this repo = the same tree); (2) this repo's trunk (`server.js`, `public/app.js` at the synced live build); (3) read-only audit of https://www.pix.mov/ — header forensics, full landing row inventory, click-throughs (FEATURES poster → film page; CLASSICS → Nosferatu watch page).
**Headline:** two structural divergences — the FEATURES row is the wrong feature, and the header is a different header. Both are provable from source, below. The R-series ledger (§4) also records real progress since v1.01.00.

---

## H-1 — FEATURES must be the public-domain classics (Brian-flagged)

**Muse source (the spec):**
- The landing feed's `features` array is typed as classic-film responses (`reference/pix-2/server/src/actions.ts:1272` — `features: z.array(pixClassicFilmResponse)`).
- It is built as `PIX_FEATURE_FILM_KEYS = PIX_CLASSIC_FILMS.map(f => f.filmKey)` (`actions.ts:1390`), read via `readPixClassicFilm` (`actions.ts:2161`) — **the FEATURES shelf is every public-domain classic in the catalog**, each opening its FEATURE PRESENTATION page. A genre-fallback map (`PIX_CLASSIC_GENRE_FALLBACKS`, same file) also weaves classics into the genre rows.

**Trunk (the divergence):** `server.js` contains no features composition at all. The live FEATURES row — tagline "The films the crowd is picking right now", The Phoenician Scheme / Weapons / Tron: Ares / Predator: Badlands — is a portable-side crowd-picks invention wearing the FEATURES name. Clicking its poster lands on a record page (poster, stats, MY SCREENING) with **no video**. There is no FEATURE PRESENTATION row and no classics row anywhere on the live landing; the classics are quarantined on `#/classics`, reachable only via the ATTRACTIONS strip.

**Fix:** implement the feed as specced — a `features` array of classic films (the full playable classic catalog), rendered as the FEATURES row; a FEATURES poster click opens that film's presentation/watch page (the existing `#/classics/<slug>` pages already carry the breadcrumb "CLASSICS · FEATURE PRESENTATION" — wire the row to them). The crowd-picks concept, if kept at all, belongs to the existing Top Rated row — it is not FEATURES. Apply the classics genre-fallback weaving to genre rows per the reference map.

**Probe:** every title in the live FEATURES row is a catalog classic (public-domain, with segments); clicking any FEATURES poster lands on a watch/presentation page with a player — never a record-only film page.

## H-2 — Header: rebuild to the v2 spec (Brian-flagged)

**Spec (from `design/settings.json` + `reference/pix-2/client/src/App.tsx:7944` + `theme.css`):**
- Single fixed line: **62px** (+ safe-area) with a **2px gold bottom border**, solid black.
- Wordmark `PIX` + **light-bulb element** (`<i class="pixmov-bulb">`) + `MOV` — the dot IS a bulb; font clamp(20px, 2.8vw, 30px), weight 900, letter-spacing .07em, gold `#f2b705`, never boxed.
- Chase bulbs: **12 per side**, clamp(5px, .65vw, 8px), 2.16s `steps(1, end)` cycle, .09s delay steps, running along the header's bottom edge from the wordmark reserve to the centered NOW PLAYING button; responsive drops 12→9→6→4→2→(left hidden, 1 right) at 1180/980/760/620/390px; **bulbs never invade the logo's space**; logo + bulbs sit ~4px above the gold bar.
- NOW PLAYING: **centered within the one header line** — red `#ff3b30` fill, 3px black border, 2px gold ring, sized by the existing clamp in settings.
- FILM DNA RECORDED: larger type, **right side** (under the games cluster) — not a small box stacked under the button.

**Live (measured deviations):** a stacked ~85–100px header — logo centered on its own line with a **plain mid-dot** (no bulb element), ~10 bulbs per side, an **extra finer dot row** along the bar on the right that exists in no spec, NOW PLAYING on a second line below the logo, and the FILM DNA readout as a small box beneath it. It reads as a different, taller header that happens to share the palette.

**Fix:** rebuild the header markup/CSS to the spec values above (they are all in `design/settings.json` under `header`; the reference markup is `App.tsx` ~7940–7975, styles in `theme.css` `.pixmov-bulb` / `.header-chase`). Remove the extra dot row and the stacked layout.

**Probe:** rendered header height = 62px + 2px border at desktop width; the wordmark separator is the bulb element; 12 bulbs per side at ≥1180px; NOW PLAYING sits in the header line; no element row exists between the logo line and the gold bar other than the chase runs.

## H-3 — Row system: composition, numbering, counts, first paint, playback

1. **R14 enforcement (decision already recorded):** the Horror row is still 100% modern commercial horror under the tagline "Terror from the public-domain vault". Compose the Horror channel from the public-domain catalog per the recorded decision (the tagline is correct Muse copy; the content is what's wrong). *Probe:* every Horror-row title is a PD-catalog film.
2. **Row numbering:** Top Rated renders with **no number** (sequence runs 01, —, 03, 04…); the `#/classics` page is numbered **07**, duplicating the Crime row's 07. *Fix:* Top Rated = 02; the Classics page takes no landing-row number (it is the PIX LIBRARY page) or the next number in its own sequence — never a duplicate. *Probe:* landing numbers are 01–07 exactly once each; no page header repeats one.
3. **Classics catalog completion:** `#/classics` lists **25** titles; the Muse verified-live catalog is **35** films (36 rows incl. parked Plan 9, which stays non-playable). The playable set in this repo's exports (`handoffs/data/classic-thumbnails.json`, 31 films with thumbnails + stills) plus the remaining verified-live titles from the reference catalog closes the gap. *Probe:* `#/classics` count = the verified-live playable count; Plan 9 absent from playable rows.
4. **Genre counts still unstable (R7 reopened):** between the last two audits the headings moved Action 59→75, Drama 69→40, Comedy 50→54, Crime 12→19 with no matching catalog change, rows render 16 tiles regardless, and the dropdown comparison remains unverified. One server-side count per genre, used by dropdown + headings (v1.01.00 §4 rule 5). *Probe:* two cold loads report identical counts, and dropdown == heading for all six genres.
5. **Blank tiles on first paint:** FEATURES and Action rows showed black/blank tiles that lazy-loaded in later. A tile never paints without art: hold the tile (skeleton in the poster's aspect with the gold trim is acceptable) until its image loads, or preload the first viewport of each row. *Probe:* cold load, first screenshot of the landing shows zero black rectangles in any row.
6. **Playback stall:** the Nosferatu watch page sat at **buffering, total time 0:00**, for the full ~10s observation while claiming "46 playable" (an earlier audit saw the same player run, so this is a load reliability defect, not a missing player). *Fix:* segment 1 must reach a real duration promptly; a segment that fails or stalls surfaces a visible error/retry state — never an infinite spinner beside the word "playable". *Probe:* cold load of `#/classics/nosferatu-1922` shows a non-zero duration and playing frames within 3s; deliberately breaking a segment URL shows the error state.
7. **Cross-row duplication:** the same commercial titles repeat across marquee + FEATURES + Top Rated + genre rows (The Faculty ×3, Phoenician Scheme ×3, etc.). H-1 + R14 remove most of this by giving rows distinct pools (classics vs crowd vs genre); where pools legitimately overlap, a film should not *lead* two rows in the same render.

---

## 4. R-series ledger — updated from this audit

| Item | Status now | Note |
|------|-----------|------|
| R1 Search | PARTIAL | Header search button exists (top-right); result quality not yet probed — next pass searches "dracula" and a synopsis phrase |
| R2 FILM DNA % | **VERIFIED** | Header renders `FILM DNA RECORDED 0.00%` signed-out (was "—"); post-vote increase still to probe |
| R3 SHOWCASE | OPEN | Not re-exercised this pass |
| R4 Synopses | **VERIFIED** | Film page shows the synopsis on-site with "Synopsis via the source article →" attribution; the IMDb-only substitution is gone |
| R5 Player finish | PARTIAL | Segment thumbnail strip now exists; poster/still pre-play frame + billboard unconfirmed; playback stall → H-3.6 |
| R6 SEEN posters | OPEN | Not re-exercised this pass |
| R7 Genre counts | **REOPENED** | Values unstable between audits → H-3.4 |
| R8 Feedback form | OPEN | Not re-exercised this pass |
| R9 Classics art | PARTIAL | Classics cards show stills/title cards; spec order is poster → still → thumb |
| R10 Title formatter | **VERIFIED (classics)** | No doubled years anywhere in this pass (cards + Watch heading clean); keep the formatter shared |
| R11 Rank badge | UNVERIFIED | Film-page badge renders once; Top 500 hover badge not re-tested |
| R12 Classic byline | OPEN | Orphan `· NN clips` persists on director-less cards |
| R13 Copy purge | OPEN | Not re-exercised this pass |
| R14 Horror = PD | OPEN → H-3.1 | Decision recorded; content not yet changed |
| R15 Render race | OPEN → H-3.5 | Blank first-paint tiles still observed |

**New this pass:** H-1 (FEATURES composition), H-2 (header rebuild), H-3.2 (numbering), H-3.3 (classics catalog 25 vs 35).

## 5. Acceptance

H-1 and H-2 probes pass on the live site; H-3 probes pass; a follow-up audit re-exercises the OPEN ledger items (R3, R6, R8, R13) so the ledger can finally empty. Closure remains: probe output on the live site, verified by re-scan — per SSOT.md.
