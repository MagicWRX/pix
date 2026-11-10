# PIX.MOV Phase 2 + 3 — Cutover Plan (authored, NOT executed)

**Status:** groundwork only. Every file named here is **author-only** under the
Belvedere handoff (Founder GO 2026-11-05 for authoring; a *separate* Founder GO
gates any application). No database was touched in the authoring of these files:
they were generated from read-only GAKz metadata captured 2026-11-05 and
validated by parse (pglast) only. Local applies to DBWRX under a gate; GAKz DDL
goes through the vault path with the Founder present.

## What was authored

### Ship series — `v1/drizzle/`

| File | Contents |
|---|---|
| `0068_pix_ops.sql` | Schema `pix_ops`: `deployments` (with `manifest jsonb`), `verify_runs`, `build_hits`; checksum helpers `pix_ops.table_checksum`, `pix_ops.checksum_manifest`, `pix_ops.row_count_max_updated` |
| `0069_pix_user_moves.sql` | Schema `pix_user`; drops the 11 cross-boundary FKs; moves the 33 user-write tables; guarded moves for the 5 app-only tables |
| `0070_pix_user_watermarks.sql` | Shared `pix_user.maintain_updated_at()` trigger + `updated_at` watermark on all 38 tables — `timestamptz` fleet-wide per the Founder ruling of 2026-11-05 (15 bigint columns convert in place); idempotency indexes on the append-only tables |
| `0071_pix_compat_views.sql` | `pix_compat.<t>` views + old-name `pix.<t>` views over `pix_user.<t>` |
| `0072_consent.sql` | Phase 3: schema `consent` exactly per handoff §3.1 |
| `0073_analytics.sql` | Phase 3: schema `analytics` per §3.2 (partitioned `events` + `daily_builds`) |

### GAKz counterparts — `v1/drizzle/gakz/`

| File | Contents |
|---|---|
| `0068_gakz_pix_user.sql` | Schema `pix_user` in GAKz: the 33 user tables, same columns/PKs as `pix.<t>` of record, plus `synced_at`; `updated_at` as `timestamptz` on all 33 (ruling 2026-11-05 — sources stay bigint, up-sync converts on write); no FKs (boundary rule holds) |
| `0069_gakz_consent.sql` | Schema `consent` in GAKz — the consent record **of record** (§2.4) |
| `0070_gakz_analytics_rollups.sql` | `analytics.daily_builds` only — rollups are received here; raw events stay on the Local host |

### Scripts — `scripts/`

| File | Contents |
|---|---|
| `rollup-daily-builds.sql` | Yesterday-UTC rollup into `analytics.daily_builds` (idempotent upsert). Local schedules it; not scheduled by this work |
| `retention-analytics.sql` | 90-day raw-event retention (§3.2). Rollups are never touched. Local schedules it; not scheduled by this work |

## Measured facts the DDL rests on (GAKz `pix`, 2026-11-05)

- 52 base tables, 52 PKs, **28 FKs**, 0 check constraints, 0 triggers.
- FK split: **11 cross-boundary** (all user → catalog: `film_dna_media_signals→pix_movie_stats`, `pix_actor_votes→pix_actors` ×2, `pix_movie_posts→pix_movie_stats`, `pix_movie_review_scores→pix_movie_stats`, `pix_tough_shares→pix_movie_stats` ×2, `pix_trending→pix_movie_stats`, `pix_user_fan_types→pix_fan_types`, `pix_user_library→pix_movie_stats`, `pix_user_list_items→pix_movie_stats`) — dropped by 0069.
- **9 user → user FKs** survive the move (both endpoints land in `pix_user`): `chat_messages→chat_threads`, `cine_short_stats→cine_assets`, `cine_upload_parts→cine_chunked_uploads`, `film_dna_events→film_dna_profiles`, `film_dna_media_signals→film_dna_profiles`, `film_dna_queries→film_dna_profiles`, `notes→notes`, `pix_movie_posts→pix_profiles`, `pix_user_list_items→pix_user_lists`.
- **8 catalog → catalog FKs** are untouched.
- `updated_at` already exists on **15** of the 33 user tables — as `bigint`
  epoch ms on all 15; **18** gain it in 0070 (`chat_messages, cine_assets, cine_upload_parts, deployment_snapshots, film_dna_events, film_dna_queries, pix_actor_votes, pix_fan_type_events, pix_feedback, pix_game_results, pix_movie_unseen, pix_movie_votes, pix_signup_challenges, pix_tough_shares, pix_trending, pix_trending_runs, pix_user_library, pix_user_list_items`). Per the Founder ruling of 2026-11-05, all 33 end as `timestamptz`: the 15 convert, the 18 are added in the new type.
- The ship's `pix` schema is the census-exact mirror of GAKz `pix`, so the same
  statements describe the DBWRX target.

## Deviations from the handoff sketches (named, with reasons)

1. **`updated_at` type: timestamptz — by Founder ruling (2026-11-05), not
   the first pass's bigint.** The first authoring pass kept `bigint` epoch ms
   to match the schema's existing convention (every `updated_at`/`created_at`
   in this schema is bigint epoch ms; the server writes `Date.now()`), and
   flagged conversion as a separate Founder decision. The Founder was shown
   both options and ruled **option B: convert everything to date stamps**.
   0070 now converts the 15 existing bigint columns in place
   (`USING to_timestamp(updated_at / 1000.0)`, guarded on the column still
   being bigint) and adds the column as `timestamptz` to the 18 tables that
   lack it, all inside the cutover transaction (see *Watermark conversion*
   below). The GAKz `pix_user` targets (gakz/0068) carry `updated_at` as
   timestamptz on all 33 tables; the GAKz `pix` sources stay bigint and the
   up-sync converts on write.
2. **`analytics.events` idempotency key: `UNIQUE (idempotency_key, occurred_at)`.**
   Postgres requires a unique constraint on a partitioned table to include the
   partition key; `idempotency_key UNIQUE` alone cannot be created on a
   `PARTITION BY RANGE (occurred_at)` table. Replays carry the original
   `occurred_at`, so replay-safety holds, and the server arbitrates
   `ON CONFLICT (idempotency_key, occurred_at)`.
3. **Compat views exist in two places.** §2.2 names a `pix_compat` schema;
   preserving *old names* only works if `pix.<t>` also resolves. 0071 creates
   both `pix_compat.<t>` and (once the name is free) `pix.<t>` views.
   Read-only is enforced by **grant** (SELECT only) at apply time — a
   single-table view is updatable in Postgres by default; the apply checklist
   below includes the grant step.

## Watermark conversion (Founder ruling 2026-11-05 — option B)

**What converts:** `updated_at` only. The 15 user tables carrying it as
`bigint` epoch ms convert in place inside 0070
(`ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)`,
guarded on the column still being bigint, so the step is re-runnable); the 18
tables without it gain `updated_at timestamptz NOT NULL DEFAULT now()`; the 5
app-only tables get the same guarded add-or-convert; the shared trigger body
becomes `NEW.updated_at := now()`. On the GAKz side, the `pix_user` targets
carry `updated_at` as `timestamptz` from creation (gakz/0068) while the
`pix` sources stay `bigint` — the up-sync converts on write.

**What does NOT convert:** `created_at` stays `bigint` epoch ms everywhere
in this pass. It is the application's own write path (`Date.now()`), and the
idempotency indexes in 0070 ride on it unchanged. Converting `created_at`
too is a separate Founder decision, not part of this ruling.

**Where it sits in the sequence:** inside the gated cutover (step 4 below),
as part of the 0070 step — after the 0069 moves, inside the same
one-transaction-per-schema discipline. It is never applied piecemeal or
ahead of the moves: a mixed-type watermark breaks the up-sync comparison.

**Prerequisite in the same window:** the application writes `updated_at`
explicitly (epoch-ms numbers) in its INSERT/UPDATE paths today. From the
moment of conversion those write sites must stop supplying the column —
`DEFAULT now()` covers inserts, the trigger covers updates. An epoch-ms
number written into a `timestamptz` column errors; it does not coerce. This
app-side adjustment belongs to the cutover window, not to this authoring
pass (which changes no application code).

**Verification (added to the step-3 rehearsal checklist):** before-images of
`updated_at` for a sample of rows per converted table, taken pre-conversion
on the rehearsal copy; after conversion, each sampled row's converted value
must equal `to_timestamp(before_image / 1000.0)` exactly; **zero NULL
watermarks** on every `pix_user` table after the step; every `pix_user`
`updated_at` reports `data_type = 'timestamp with time zone'`.

## Idempotency keys on the append-only tables (0070)

| Table | Key authored | Notes |
|---|---|---|
| `film_dna_events` | `(user_id, signal_type, primary_imdb_id, secondary_imdb_id, created_at) NULLS NOT DISTINCT` | `created_at` is bigint epoch ms (the table's occurred-at of record) |
| `pix_fan_type_events` | `(user_id, signal_type, primary_imdb_id, secondary_imdb_id, created_at) NULLS NOT DISTINCT` | same |
| `pix_game_results` | `(game_key, winner_imdb_id, loser_imdb_id, created_at)` | **gap:** no subject column exists; this is the closest natural key |
| `pix_movie_votes` | `(winner_imdb_id, loser_imdb_id, created_at)` | **gap:** no subject column (anonymous by design); closest natural key |
| `pix_movie_unseen` | — none authored — | Its PK is `(imdb_id)` alone: already insert-once on its natural key |

All five tables lack a separate `occurred_at` column, so every key rides on
`created_at`. **Replay is safe only when the writer replays the original
`created_at`**; a retry that stamps a fresh timestamp defeats the key. Writers
must be held to that at the gated apply.

## Flagged gaps

- **The 5 app-only tables** (`dice_chunks, dice_jobs, pix_cine_bin, pix_reviews,
  pix_tough_picks`) exist only in the ship's `pix2` schema, which the authoring
  side cannot read. Their moves (0069), watermark treatment (0070), and views
  (0071) are guarded DO blocks that take each table from `pix` or `pix2`,
  whichever holds it, and skip silently if absent. Their shapes, PKs, and any
  FKs they carry are **unverified from here** and must be measured on the ship
  during rehearsal.
- **Application `updated_at` write sites:** `server.js` supplies
  `updated_at` explicitly (epoch-ms numbers) in its INSERT/UPDATE paths.
  Those writes are incompatible with the converted column from the moment
  0070 applies. Dropping the field from the write sites (letting
  `DEFAULT now()` + the trigger own the column) is a **cutover-window
  prerequisite**, deliberately not part of this authoring pass — but the
  cutover must not proceed without it scheduled in the same window.
- **Drizzle journal:** `v1/drizzle/meta/_journal.json` was not updated by this
  authoring pass. At the gated apply, register 0068–0073 in the journal (via
  drizzle-kit or by hand) in the same step as the first application, so the
  migration history and the files never disagree.
- **First consent policy version:** no seed row is authored anywhere — a policy
  version is the Founder's to publish. Until `consent.policy_versions` has a
  row, `POST /api/consent` answers `no_policy_published` and records nothing.
- **PIX_HASH_SALT rotation:** consent/event hashing uses
  `sha256(PIX_HASH_SALT | value)` server-side. Rotating the salt orphans hash
  comparisons for earlier rows; hashes are evidence aids, not join keys.
  Rotation, if ever needed, is an ops decision recorded in `pix_ops.verify_runs`.

## Cutover procedure (for the later GO — §2.5)

1. **Rehearse on a restored copy only** — a `pix_rehearsal`-style clone of the
   ship database. Never rehearse on the served database.
2. **Before-images:** per-table row counts for all 52 + 5 tables; FK count
   (28) and PK count (52) in schema `pix`; `pix_ops.checksum_manifest('pix')`
   once 0068 is applied to the rehearsal copy.
3. **Apply in order** 0068 → 0069 → 0070 → 0071 (ship), in the rehearsal. Then
   verify measured post-conditions:
   - per-table row counts identical before/after, per table;
   - PK count preserved per table;
   - FK count across the boundary: 28 total → **0 cross-boundary**
     (17 remain: 9 user→user inside `pix_user`, 8 catalog→catalog inside `pix`);
   - every `pix_user` table has `updated_at` + its trigger, and every
     `updated_at` is `timestamptz` (the watermark-conversion spot checks
     above pass: sampled converted values equal
     `to_timestamp(before_image / 1000.0)`, zero NULL watermarks);
   - the four `ux_*_idem` indexes exist;
   - checksum manifest for schema `pix` still covers exactly the 19 catalog
     tables, values unchanged for untouched tables.
4. **Cutover (gated, live):** one transaction per schema, in the same order,
   with the `pix_compat` / old-name views created **first** in their step so
   the running app keeps working between steps. Register the drizzle journal
   entries in the same pass. Grant SELECT-only on the compat views.
5. **Rollback posture:** keep the pre-move schema dump for **14 days**.
   `pix2` is **not** dropped until **seven clean days** after cutover.
6. **Attestation:** Local attests only against measured post-conditions in the
   live database (the step-3 checklist re-run live) — never against a claim.
7. **Phase 3 activation is separate from cutover:** applying 0072/0073 does not
   enable anything. The server flags `PIX_CONSENT_ENABLED` / `PIX_EVENTS_ENABLED`
   stay off until the Founder enables them; the first `consent.policy_versions`
   row is published by the Founder in the same window.

## Phase 3 evidence — what is NOT claimed here

The scaffold's local contract tests cover flag-off inertness and fail-safe
envelopes only. The full Phase 3 evidence from the handoff — a consent row
written and read back, an analytics rollup produced, a retention dry-run —
requires the gated DDL application and is **not** claimed by this pass.
