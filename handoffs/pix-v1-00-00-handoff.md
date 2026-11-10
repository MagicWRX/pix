# PIX.MOV — pix-v1-00-00 Handoff: Live-Site Gap Checklist with Code Fixes

**Date:** 2026-10-21
**Live site:** https://www.pix.mov/ (portable build, this repo)
**Method:** full read-only feature scan of 14 routes on 2026-10-21, compared feature-by-feature against the Muse PIX.MOV app (the design/product source of truth).
**Companion sources of truth:**
- Design files + settings: GitHub repo `MaggiLunk/pix-design` (tokens.css, theme.css, settings.json — billboard quote set lives there, components.md).
- Product/compliance docs: `LEGAL.md` (PIX.MOV Legal & Compliance v1.1.1) and `ANALYTICS.md` (v1.0.1) in the pix-network doc set.
- Earlier restoration handoff (design spec + defects D1–D8): superseded by this document where they overlap.

## Scan summary

Much of the Muse surface has crossed over since the last review — marquee rows, FEATURES, genre channels with tag lines + glide controls, fold + drag rows, ATTRACTIONS bar with GENRES dropdown, footer, BISCUIT consent with Privacy/Agreements pages, Top 500 mechanics (SIZER, hover options, click = seen, hundred-groups), film pages (MY SCREENING, REVIEW, back, add-to-list), Feedback page. Credit where due.

What remains, in priority order:

| # | Item | Severity | One-line |
|---|------|----------|----------|
| P0-1 | Classic-film player missing entirely | **Critical** | Watch pages show a "Waiting for upload" placeholder; nothing can stream |
| P0-2 | No search anywhere | High | No title search, no synopsis search — a core PIX discovery path |
| P0-3 | FILM DNA % never renders | High | Header shows "FILM DNA RECORDED —" with no value on every page |
| P0-4 | SHOWCASE routes to sign-in | High | No public profile page exists |
| P1-1 | Synopses don't render | Medium | Film page "More info →" reveals nothing |
| P1-2 | Blank posters in SEEN year drill-in | Medium | e.g. 1998 tiles render dark/blank despite the no-poster-no-slot rule |
| P1-3 | Genre counts disagree | Medium | GENRES dropdown says Drama (16); the Drama row says 67 films |
| P1-4 | Feedback type buttons render no form | Medium | IDEA/ISSUE/REPORT/APPEAL show nothing on click |
| P1-5 | Classics page is text-only cards | Medium | No posters/stills, while other surfaces have art |
| P1-6 | Mojibake in titles | Medium | "Chainsaw Man â– The Movie", "Demon Slayer â– …" (en dash corrupted) |
| P1-7 | Duplicated years on Classics | Medium | "Nosferatu (1922) (1922)" still on #/classics |
| P2-1 | NOW PLAYING is a full page | Low | Muse spec is a floating overlay (60% desktop / 90% phone) |
| P2-2 | SEEN opens on the grid directly | Low | Muse pattern: poster-sized black entry tile with yellow trim first |
| P2-3 | CINE dev copy + scope | Low | "see README" copy exposed; editor/Distributor/Storage are scope items |
| P2-4 | Auth card lacks safe-space line | Low | Safe-space text only in footer, not on the sign-up card/dialogue |

---

## P0-1 — Build the classic-film player (CRITICAL)

**Observed:** every classic Watch page (e.g. #/classics/nosferatu-1922) shows only "· 46 segments" and the text: *"Waiting for upload. 46 segments catalogued. They stream here once the files are on the configured clip host (CLASSIC_CLIPS_BASE_URL)."* There is no video element, no segment list, no controls. The visitor-facing copy also exposes an internal config name — remove that regardless of anything else here.

**Reality:** the films are NOT waiting for upload. 35+ public-domain films (1,600+ clips) are live on Backblaze B2 in bucket `PIXMOV` under `public-domain/<genre>/<year>/<slug>/clips/clip-NN.mp4`, public base `https://s3.us-east-005.backblazeb2.com/PIXMOV`. Per-clip frame grabs exist at the mirrored `/thumbs/` path (.jpg), and newer films carry a `still_url`. The portable DB seed already catalogues the films and segment counts — the player was never wired to the host.

**Fix (portable codebase):**
1. **Config (`.env` / `.env.example`, read in `server.js`):** set `CLASSIC_CLIPS_BASE_URL=https://s3.us-east-005.backblazeb2.com/PIXMOV` (no trailing slash). The clip URL for a segment is then `{BASE}/{prefix}clip-{NN}.mp4` where `prefix` = `public-domain/<genre>/<year>/<slug>/clips/` — store/derive the prefix per film server-side; never print the env var name to the client.
2. **Server (`server.js`):** the classics endpoints should return, per film: `segments: [{ n, url, thumb_url, duration_sec }]`, `still_url`, `poster_url`. If segment rows don't exist in the portable DB for a film, generate them from the catalogued segment count + the film's prefix (the naming is uniform: zero-padded `clip-01.mp4` … with each film's real durations where the seed has them).
3. **Client (`public/app.js`, Watch view):** replace the placeholder branch with a real player:
   - `<video controls playsinline preload="metadata">` with `poster = still_url || poster_url`.
   - A segment list under the player: one tile per segment using `thumb_url` (fall back to still, then poster) — images, never a `<video>` per tile.
   - On segment end: show the **BILLBOARD** for exactly 5 seconds (full-player gold card, rotating famous quote + attribution, 5s countdown — the 38-quote set is in pix-design `settings.json`), then load and play the next segment. If a real ad is ever booked for the slot, the ad takes precedence over the quote.
   - Controls: **Picture-in-Picture** (`requestPictureInPicture()`, plus the iOS Safari fallback `webkitSetPresentationMode('picture-in-picture')`), **Fullscreen** (`requestFullscreen()`, plus iOS `webkitEnterFullscreen()`), **Pop-out** (`documentPictureInPicture` where available). Each control hides itself when unsupported.
4. **Copy:** delete the "Waiting for upload…" text everywhere. A film with zero playable segments should show "This title is being prepared." — no internal names, ever.

**Accept:** Nosferatu plays segment 1 from B2; at segment end a 5s quote billboard appears and segment 2 auto-plays; PiP works on desktop Chrome and iPhone Safari; the segment list shows thumbnails; the string `CLASSIC_CLIPS_BASE_URL` appears nowhere in rendered output.

## P0-2 — Add search (title + synopsis)

**Observed:** no search control exists anywhere (header, landing, film pages, Top 500, SEEN, CINE). Muse PIX has title search and the synopsis strand (natural-language desire matched against synopses/attributes) — it's a primary discovery path in the PIX Vision.

**Fix:**
1. **Server:** `GET /api/search?q=` returning films matching title (prefix/substring) and, once P1-1 lands, synopsis text (SQL `LIKE`/FTS over the synopsis column), each result `{ imdb_id, title, year, poster_url }`. Keep it behind the same anonymous/session identity as the rest of the API.
2. **Client:** a search box in the header (magnifier affordance, expands on focus) rendering results as poster rows using the standard hover system; Enter opens a results view at `#/search/<q>`. No poster → no result tile (poster rule).

**Accept:** searching "dracula" returns the 1931 film with poster; searching a desire phrase (e.g. "haunted house") returns synopsis matches after P1-1.

## P0-3 — FILM DNA percentage renders "—"

**Observed:** the header shows `FILM DNA RECORDED —` on every page; no percentage anywhere. Definition (locked): **FILM DNA RECORDED X.XX% = films the identity has rated ÷ films on record × 100**, shown to two decimals.

**Fix:** in the bootstrap/`/api/me` payload (`server.js`), compute `film_dna_pct` for the current identity (anonymous ID or account): numerator = distinct films with a vote/triage/seen decision by this identity; denominator = catalog films on record. Render in `public/app.js` header as `FILM DNA RECORDED 12.34%`. The em dash is acceptable only before the identity exists (first paint) — it must resolve immediately after bootstrap, for anonymous visitors too (their decisions accrue from the first vote).

**Accept:** as an anonymous visitor, vote once, reload — the header shows a real percentage, not "—".

## P0-4 — SHOWCASE must be a page, not the sign-in form

**Observed:** the SHOWCASE nav item navigates to `#/auth`. Muse spec: SHOWCASE is the user's **public profile page** — fan type, taste summary, what they know and like (their film-buff identity on display).

**Fix:** add a `#/showcase` route + view (`public/app.js` + a server endpoint for the public profile payload). Signed-out visitors see either a prompt to sign in *from the showcase page* or a public founder/featured showcase — but the nav item must not BE the auth page. Signed-in: render fan type (from the fan-type state), taste signals, lists, and review counts from existing profile data.

**Accept:** clicking SHOWCASE never lands on `#/auth`; a signed-in user sees their fan type and taste on a page titled SHOWCASE.

---

## P1-1 — Synopses exist but never render

**Observed:** on a film page, "More info →" is present but reveals no synopsis (only the poster tagline shows). Muse PIX carries per-film synopses with attribution: a fast pass imported **1,078 Wikipedia-lead synopses with source URLs** into the Muse database (of 13,662 catalog films).

**Fix:** (1) Add a `synopsis` + `synopsis_source_url` column for films in the portable DB (new SQL file under `supabase-migration/`, following the existing numbering) and import the same Wikipedia-lead set — originals untouched, attribution URL stored per film. (2) Render the synopsis on the film page (the "More info →" toggle expands it, with the attribution link). This also unlocks the synopsis half of P0-2.

**Accept:** The Faculty's page shows a real synopsis with a source link when "More info" is opened.

## P1-2 — Blank posters inside SEEN year drill-in

**Observed:** `#/seen/1998` renders several tiles dark/blank (Blade, BASEketball, Bride of Chucky, Buffalo '66, Can't Hardly Wait) — while other surfaces show posters fine. Standing rule: **a slot never displays without a real poster** (no poster → no tile), so blank tiles are doubly wrong.

**Fix:** compare the poster URL generation for the year-grid route against a working surface (Attractions/Top 500) — the bug is in that code path (path/prefix or field name). Fix the path; then enforce the rule in the year-grid renderer: filter out films whose poster fails to resolve rather than rendering an empty tile.

**Accept:** #/seen/1998 shows only poster-backed tiles, zero blank rectangles.

## P1-3 — Genre counts disagree between dropdown and rows

**Observed:** the GENRES dropdown lists Drama (16), Action (16), Comedy (16), Crime (12), Horror (16), Top Rated (20) — the landing rows say Drama 67 films, Action 59, Comedy 50. Two different count sources (the dropdown appears to count one subset, the rows another).

**Fix:** one count function, server-side, used by both the dropdown payload and the row headings (`server.js` sections endpoint). Decide the semantics once — films in that genre's row — and use it in both places in `public/app.js`.

**Accept:** for every genre, dropdown count == row heading count.

## P1-4 — Feedback type buttons render no form

**Observed:** on `#/feedback`, clicking IDEA (and by symmetry ISSUE / REPORT A USER / APPEAL) renders no form. Muse behavior: each type opens its form; submissions are stored (the Muse build's `submitPixFeedback` is verified working).

**Fix:** in `public/app.js` feedback view, render the form under the selected type (textarea + submit; REPORT A USER adds a username field; APPEAL references the flagged content). POST to the feedback endpoint (add it in `server.js` if the portable build lacks one — table: type, body, reporter identity, created_at). Show a confirmation state after submit.

**Accept:** IDEA → form appears → submit → confirmation; the row exists server-side.

## P1-5 — Classics page: give it the art

**Observed:** `#/classics` is 25 text-only cards. The films have posters (Muse catalog), frame grabs per clip, and `still_url` for newer titles.

**Fix:** render each classic card with its poster (fall back to `still_url`, then a frame grab from clip 1's `/thumbs/` mirror). Card keeps title/year/clip-count and the Watch action. This is the PIX LIBRARY face of the site — it should look like one.

**Accept:** #/classics cards show artwork for all 25 titles; no text-only cards remain.

## P1-6 — Mojibake (encoding) in titles

**Observed:** "Chainsaw Man â– The Movie: Reze Arc", "Demon Slayer: Kimetsu no Yaiba â– Infinity Castle" on landing and Top 500 — an en dash double-encoded.

**Fix:** find where titles were written/read with mismatched encodings (ingest wrote UTF-8, something read Latin-1, or vice versa). Fix at the data layer: normalize the stored titles to correct UTF-8, set charset end-to-end (DB connection, HTTP headers `charset=utf-8`, HTML meta). Then scan the catalog for the `â` byte pattern and repair every hit, not just the two observed.

**Accept:** zero titles containing `â` anywhere in the catalog; both named titles show a proper en dash.

## P1-7 — Duplicated years on Classics (carry-over defect D1)

**Observed:** `#/classics` still shows "Nosferatu (1922) (1922)", "Cabinet of Dr. Caligari (1920) (1920)" — stored titles contain the year and the card appends it again. (Landing channel cards appear fixed; Classics was missed.)

**Fix:** one shared title formatter in `public/app.js`: if the title already ends with `(YYYY)`, don't append the year. Apply it on #/classics and audit every other surface that formats `title + (year)`.

**Accept:** no surface shows a doubled year.

---

## P2 items — design alignment and scope

- **P2-1 NOW PLAYING presentation.** Live renders NP as a full page at `#/play` with a close (X) back to landing — functionally complete (filter, folds, FAN TYPE, TOUGH PIX all present). Muse spec is a floating overlay at 60% width desktop / 90% phone over the landing page. Align when convenient; do not break the working page to do it — the overlay can wrap the same view.
- **P2-2 SEEN entry.** Live opens `#/seen` directly on the year grid (with SIZER — good). Muse pattern enters through a poster-sized black tile with yellow trim ("SEEN" archive tile) on the landing/profile surfaces. Add the tile where those surfaces link to SEEN; the grid itself is fine.
- **P2-3 CINE.** Tabs present: Clip library (works, leads to Watch pages — will light up once P0-1 lands), My BIN and Auto-dice (sign-in gated, acceptable). Still exposed: *"The full browser timeline editor is out of scope for the portable build — see README."* — replace with visitor copy ("CINE Lite — the full editor lives in the PIX.MOV app"). The full timeline editor, DISTRIBUTOR, and STORAGE are **scope decisions for Brian**, recorded as absent here — do not build or promise them from this handoff.
- **P2-4 Auth safe-space.** The safe-space line appears in the footer site-wide (good). Muse also shows the safe-space agreement on the sign-up card itself, with flagged-word checking on usernames at creation (the Muse build checks a ~1,032-word list against usernames, list titles, reviews, discussions). Add the agreement line + link to the sign-up card; username flag-check parity is a follow-up once the list is shared into this repo.

## Verified present — do not regress

Landing marquee (3 crawling rows) · FEATURES exactly 6 · genre channels with tag lines and FILM PAGE / REVIEW / DISCUSS / MARK SEEN card actions · channel glide + pause controls · row fold chevrons · drag reorder + move up/down buttons · ATTRACTIONS bar with GENRES dropdown (colors per spec: gold GENRES, black/gold-outline others) · footer on all routes (© 2029 PIX.MOV as specified — flagged before, ship as written) · BISCUIT consent dialog (Essential / Save my PIX data / Ad measurement, Decline/Accept) · Privacy Policy + Agreements pages · Cookie & Data Consent footer button · NOW PLAYING: EDIT FILTER (mix/single/span), interest folds (WANT TO SEE / MAYBE / NO THANKS / HAVEN'T SEEN IT), HAVEN'T WATCHED EITHER — NEW PAIR, hover green check, FAN TYPE panel, TOUGH PIX with "Share PIX.MOV Challenge For Advice" · Top 500: SIZER (1.00× readout), hover-only #NNN OPTIONS, click = mark seen, hundred-group accordion (Top 100 open) · SEEN: year grid 2026→1895 with real counts, year drill-in, SIZER · Film pages: MY SCREENING, REVIEW with PIX.MOV ranking + W/L record, ‹ BACK, + ADD TO LIST · Feedback page shell with prioritized report copy · Auth with MFA-required note.

## Working order

1. P0-1 player (unblocks Classics, CINE library, and the entire classic-film value proposition)
2. P0-3 FILM DNA % and P0-4 SHOWCASE (small, high-visibility)
3. P1-6 + P1-7 (data hygiene, one pass), P1-2, P1-3, P1-4, P1-5
4. P1-1 synopses, then the synopsis half of P0-2 search (title search can ship with P0-2 immediately)
5. P2 alignment items last

## Acceptance for this handoff

- [ ] A classic film streams end-to-end on desktop and iPhone, with the 5s quote billboard between segments and working PiP/fullscreen/pop-out
- [ ] Header search returns poster-backed results; the string `CLASSIC_CLIPS_BASE_URL` appears in no rendered page
- [ ] FILM DNA % shows a real value for an anonymous visitor after one vote
- [ ] SHOWCASE opens a profile page; synopses render with attribution; zero blank poster tiles; zero `â` mojibake; zero doubled years
- [ ] Genre counts match everywhere; feedback forms submit; Classics cards carry art
