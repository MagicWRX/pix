# PIX LIVE MIRROR — Handoff for Local Agents

**Issued:** 2026-10-27 (Lunk, SUPA channel)
**Direction of record:** Brian, 2026-10-27 23:26 CDT —
"LOCAL AGENTS put GITHUB for site structure. GAKz need 'pix' schema.
LOCAL Web Server has Postgres server called 'pix' — it will mirror
GAKz pix schema and tables."
**Rides the existing claim:** PIX data migration to GAKz + cutover
(pix-mov handoff CLAIMS, Lunk, ACTIVE since 2026-10-26).

## The topology (locked by this handoff)

| Layer | Home | Role |
|---|---|---|
| Site structure / code | **GitHub — MaggiLunk/pix** (`v1/` = verified complete current source, leg ref `ada57602`) | Local pulls from here. No local source edits; deviations = drift, report them. |
| Data SSOT of record | **GAKz schema `pix`** | 52 tables / 251,679 rows, migrated + verified 2026-10-26 (REPORT.md in this folder locally; census below). GAKz wins every conflict. |
| Live data runtime | **Local Web Server Postgres `pix`** | A **mirror** of GAKz `pix` (schema + tables). The live site reads/writes here for speed; it is a mirror, never a second SSOT. |
| Live target | **https://www.pix.mov** | Already live (placeholder content today). This track replaces the placeholder with the real PIX. |

## Census — what the mirror must match (verified live 2026-10-27 23:26 CDT)

- Tables in GAKz `pix`: **52**
- Total rows: **251,679** (per-table counts: `REPORT.md` in the migration
  folder; Lunk re-verifies on request)
- Spot counts (live tonight): `pix_movie_stats` **13,663** ·
  `pix_wikidata_credits` **202,013** · `pix_classic_clips` **4,623**
- Structure of record: 28 FKs, 52 PKs, 22 sequences (re-seeded)
- `pix_config.secret_value` is **redacted ('') in GAKz by design** — the
  mirror inherits the redaction. Secrets reach the live server by Brian's
  hand / vault path only, never through the mirror, chat, or repo.

## Local's build

1. **Pull** MaggiLunk/pix (site structure from GitHub, as directed).
2. **Create** Postgres database `pix` on the Local Web Server with schema
   `pix` inside it.
3. **Replicate** GAKz `pix` → local `pix`: schema + all 52 tables + data.
   Local already holds a working Postgres connection to GAKz (the pooler
   string) — a schema-scoped dump/restore (`pg_dump --schema=pix`) or an
   equivalent logical copy is the straightforward route. Whatever tool:
   the result must match the census above.
4. **Verify + report:** per-table counts vs the census, the three spot
   counts, FK/PK counts. Any mismatch = **DRIFT** — report it in the
   PIX.MOV handoff INBOX; do not patch over it silently.
5. **Point pix.mov at it:** the site from GitHub, running against the
   local Postgres mirror.
6. **Keep it a mirror — SCHEDULE SET (Lunk, 2026-11-05; Local installs
   and attests):** the down-sync is a recurring job, never a one-time copy.
   - **Cadence: hourly**, on the Local Web Server — a systemd timer
     (`pix-downsync.timer`) or cron equivalent (`17 * * * *`) running one
     scripted down-sync of GAKz `pix` into the mirror. Schema changes flow
     **down only** — GAKz first, mirror second, never the reverse.
   - **Manual trigger:** the same script runs on demand immediately after
     any Lunk catalog crossing (crossings are announced by mail), so a
     crossing never waits for the hour.
   - **Verification every run:** per-table row counts vs the census in
     this handoff, with a result line appended to the sync log on the
     server. Any mismatch = **DRIFT** — report it in the PIX.MOV handoff
     INBOX the same day; never patch over it silently.
   - **User-write tables:** until the write path's first up-sync has run
     (it waits on the read key, below), the down-sync restores
     catalog/reference tables only and leaves user-write tables exactly
     as the live site wrote them — a full restore in that window would
     erase live writes GAKz does not hold yet. Once the up-sync is live
     and GAKz holds the merged state, the full restore is safe.
   - **Attestation:** when the timer is installed and its first
     *scheduled* (not manual) run completes, Local posts a mail row or
     INBOX note saying so. That attestation closes this item.

## Write path — LOCKED (Brian, 2026-10-27 23:49 CDT)

Mirroring down is Local's job (above). The return trip is **Lunk's**:

- Once the Web Server `pix` is fully stood up, Brian/Local issue Lunk a
  **read key** to the mirror DB (through the Secure Vault / connector
  path when the time comes — never in chat, never in the repo).
- With that read access, **Lunk tracks the mirror's user-write tables**
  (votes, seen marks, profiles, lists, and their kin) **and updates
  GAKz `pix`** — the up-sync is agent-mediated by the schema steward,
  not a Local→GAKz write. **Local never writes to GAKz directly.**
- Catalog/reference tables stay **down-only**; on any conflict GAKz wins.
- Until the read key is issued and the first up-sync runs, live-site
  writes exist only in the mirror — a named gap, closed by the key, not
  by either side improvising a path.

## Boundaries

- GAKz is the SSOT of record. The mirror is a runtime copy; BRIDGE's PIX
  **live leg stays DRIFT** until the mirror is verified against the
  census and the write path is locked.
- `public` schema stays dead — on GAKz and on the mirror.
- This track does **not** touch the pix-2 artifact or its `app.db`. The
  artifact cutover program (Phases A–D; Phase B attestation outstanding)
  continues separately — **pix.mov no longer waits on it.** The artifact
  remains a dev/preview surface whose app.db writes diverge from GAKz
  until its own cutover lands; that divergence is already recorded.
- No secrets in chat, files, logs, or the repo — by name only, never value.
- Report back to Lunk (PIX.MOV handoff INBOX or via Brian): mirror build
  result vs census, down-sync mechanism + cadence, the commit pix.mov
  serves, and anything that deviated. When the server is fully stood up,
  also signal Brian/Lunk that the **read key** for Lunk can be issued
  (see Write path — LOCKED above).
