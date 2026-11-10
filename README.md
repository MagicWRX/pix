# PIX.MOV (portable)

Movie-vs-Movie taste game + SHOWCASE profiles + classic-film player.
You own this code: Node.js/Express + Postgres, Supabase Auth with MFA.

## What it is

A clean-room portable rebuild of the PIX web app (foundation, not a
pixel-perfect clone). Data lives in your Supabase Postgres, in the `pix2`
schema produced by the Supabase migration (year decks, `pix_movie_stats`,
votes, film DNA, fan types).

- **Landing** (`/`): NOW PLAYING entry, attractions, SEEN archive, users'
  lists, classics.
- **Movie vs Movie** (`#/play`): two posters, tap the one you liked better.
  "Haven't seen it" marks a film unseen and replaces only that poster.
  Year filter: Mix all years, single year, or a year span (e.g. 1980–1989).
  **TOUGH PIX** button shares the current VS as a unique link — anyone,
  even anonymous, can open it and pick; pick counts are shown.
  Votes require sign-in + authenticator MFA.
- **TOP 500** (`#/top500`): community-ranked by wins, 100 per page.
- **SEEN** (`#/seen`): year cards 2026 → earliest, each opening that year's
  full poster set.
- **ATTRACTIONS** (`#/attractions`): Row 1 Top 500 · Row 2 biggest financial
  success (COMB grossers feed) · Row 3 the discovery game · Row 4 community
  reviews.
- **USERS LISTS** (`#/lists`): create named lists ("Slasher Season", …),
  add films from any film page, share via link. Shown on your profile.
- **Film pages** (`#/film/:imdb`): poster, stats, synopsis, reviews; write
  your own review (signed in).
- **SHOWCASE** (`#/showcase`): your public film-buff profile — fan type,
  vote/unseen counts, top taste signals. Read-only v1.
- **Classics** (`#/classics`): all public-domain features (24 films,
  972 clips), each with a sequential clip player reading from
  `pix2.pix_classic_clips` (see `supabase-migration/`).
- **CINE Lite** (`#/cine`): scoped portable subset — personal BIN registry,
  classic clip library, and the auto-dice engine. The full browser timeline
  editor (multi-track cuts/trims, AUTO STITCH) is intentionally out of scope
  here; the desktop app remains the full editor.
- **Posters**: drop the `*.webp` files into `public/posters/` (named by
  `poster_key`, e.g. `2025-tt13964560.webp`). Until then the server
  resolves posters at runtime via the key-free IMDb suggestion API and
  skips movies with no resolvable poster — matchups never show fake art.

## Deploy on your server

Prerequisites: a Linux server (Ubuntu 24.04 works), a domain pointed at it
(A record), and a Supabase project.

1. `npm install`
2. `cp .env.example .env` and fill in:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
   - `DATABASE_URL` (Supabase → Project Settings → Database → connection
     string; the pooled 6543 string is fine)
   - `CLASSIC_CLIPS_BASE_URL` — public base for classic clips, e.g.
     `https://f002.backblazeb2.com/file/public-domain`. Leave empty until
     the clips are uploaded; the player shows "waiting for upload".
   - `DICE_MEDIA_DIR` — where films to auto-cut live (default `./media`).
     Drop full-length MP4s here, then dice them via the API.
   - `DICE_OUTPUT_DIR` — where diced chunks land (default `./data/diced`,
     as `<film>-<timestamp>/` folders).
   - `PORT` (default 3000)
3. Run the migrations in the Supabase SQL editor, in order:
   - the main 7-schema migration (`~/your_files/supabase-migration/`, files
     `01_*` through `07_*`),
   - then this repo's `supabase-migration/01_pix_classics.sql`,
     `02_dice_jobs.sql`, `03_portable_v2.sql`, `04_classics_all.sql`.
   - `04_classics_all.sql` seeds 24 public-domain films / 972 clips
     (Plan 9 from Outer Space is excluded — rights disputed).
   - `pix2.pix_comb_grossers` ships empty; import COMB's Top 100 with
     columns (rank, title, release_year, worldwide_gross, source_label,
     imdb_id) to light up ATTRACTIONS Row 2.
4. Keep it alive with systemd. Example unit
   (`/etc/systemd/system/pixmov.service`):
   ```
   [Unit]
   Description=PIX.MOV portable
   After=network.target
   [Service]
   User=www-data
   WorkingDirectory=/opt/pix-portable
   ExecStart=/usr/bin/node server.js
   Restart=always
   EnvironmentFile=/opt/pix-portable/.env
   [Install]
   WantedBy=multi-user.target
   ```
   Then `systemctl enable --now pixmov`. (pm2 works too: `pm2 start server.js --name pixmov`.)
5. TLS + reverse proxy with Caddy (automatic HTTPS):
   ```
   pix.mov {
       reverse_proxy 127.0.0.1:3000
   }
   ```
   Or nginx with certbot — proxy_pass to 127.0.0.1:3000 and add your cert.

First user: sign up in the app, then enroll the authenticator (TOTP).
Votes and SHOWCASE require a verified MFA factor — same rule as the
DB Interface.

## API (v2 additions)

Public: `GET /api/top500?limit=&offset=`, `GET /api/seen/years`,
`GET /api/seen/:year`, `GET /api/attractions`, `GET /api/grossers`,
`GET /api/film/:imdb`, `GET /api/reviews/latest`, `GET /api/lists`,
`GET /api/lists/:id`, `GET /api/lists/shared/:shareKey`,
`GET /api/tough/:key`, `POST /api/tough/:key/pick` (anonymous allowed).

Auth (Bearer <redacted> + verified MFA): `POST /api/vote`,
`POST /api/unseen`, `GET /api/showcase`, `POST /api/reviews`
`{imdb_id, rating?, body}`, `POST /api/lists` `{name, description?}`,
`GET /api/lists/mine`, `POST /api/lists/:id/items` `{imdb_id, note?}`,
`DELETE /api/lists/:id/items/:imdb`, `POST /api/tough/share`
`{a_imdb_id, b_imdb_id}`, `POST /api/dice`, `GET /api/dice/:jobId`,
`GET /api/cine/bin`, `POST /api/cine/bin`, `DELETE /api/cine/bin/:id`.

Matchup year filter: `GET /api/matchup?mode=mix` or
`GET /api/matchup?year_from=1980&year_to=1989` (single year = same value
twice). The legacy `?deck=year-2025` form still works.

First user: sign up in the app, then enroll the authenticator (TOTP).
Votes and SHOWCASE require a verified MFA factor — same rule as the
DB Interface.

## Auto Dice

CINE's auto-cut engine, ported for the server (`lib/cine-dice.js`): drop
a film into `DICE_MEDIA_DIR`, then dice it into fixed-length chunks with
no re-encoding (ffmpeg stream-copy; cuts snap to keyframes, same as the
desktop app). `npm install` pulls the `ffmpeg-static` binary for your
platform — no manual ffmpeg install needed (a system ffmpeg on PATH is
used as fallback). One dice job runs at a time; every job and chunk is
recorded in `pix2.dice_jobs` / `pix2.dice_chunks`, so chunks trace back
to their source film.

## Notes

- No secrets are committed. `.env` is gitignored.
- The fan-type blend updater is intentionally a future scheduled job:
  votes record `pix_fan_type_events`; scoring reads them.
- Timestamps are ms epochs (BIGINT), matching the migrated schema.

## Governance — LAT + RULEBOOK

This repo is a **governed code repo** under the LAT system. The standard it follows — for agents, repos, DB entries, and versioning — is the **RULEBOOK**, kept in `MaggiLunk/LAT` at `RULEBOOK/RULEBOOK.md`. Load it first; this repo never copies or forks the rules. This repo's own LAT package lives in [`lat/`](lat/) and is gated for drift by the LAT REGISTRY: when the RULEBOOK changes, `lat/` is refreshed in the same pass.
