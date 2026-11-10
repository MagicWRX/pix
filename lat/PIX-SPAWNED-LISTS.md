# PIX SPAWNED LISTS — editorial lists in PIX format, feeding FILM DNA

**Version:** v0.1.01 — PROPOSED 2026-11-06 (Brian's brief, PIX.MOV chat); §7 amended the same day by the LANGUAGE GOVERNANCE lock (`core.language-governance`, `~/workspace/supa/LANGUAGE-GOVERNANCE.md` v1.00.00).
**Status:** awaits the Founder's lock on §2 (the slate) and §7 (GURU) before build.
**Companions:** `~/workspace/pix-network/NETWORK_DESIGN.md` v1.2.0 (the taste network this feeds) · GAKz `pix` schema (data of record).

## 1 · What a Spawned List is

A **Spawned List** is an editorial ranking published elsewhere (a magazine, a critics' poll, a ratings institution), re-published inside PIX.MOV **in PIX format**:

- Ranked poster panels, exactly like every PIX surface — hover/focus opens the standard fold (SEEN ✓ / WANT TO SEE / MAYBE / NO THANKS / NEVER HEARD OF IT), rank number on the panel, staged poster loading.
- The list carries its **provenance on its face**: source name, edition/year, and a **link back to the original page**. PIX never presents another publication's ranking as its own.
- Every interaction on a spawned list writes the **same pipes** as every other PIX surface — seen set, `film_dna_media_signals`, votes, `film_dna_events`. A list is a rating surface; rating surfaces are how FILM DNA is recorded. That is the point of spawning them.

Spawned lists are **not** user lists and not PIX's own rankings (OUR TOP 500 / COMB stay PIX-native). Three list kinds, kept distinct everywhere:

| Kind | Owner | Examples |
|---|---|---|
| PIX-native | PIX | OUR TOP 500, COMB grossers, TOUGH calls |
| **Spawned** | the source publication (PIX hosts) | this document |
| User | the fan | their lists, CSV imports |

## 2 · The slate — a dozen (PROPOSED, Founder locks)

| # | List | Source | Kind |
|---|---|---|---|
| 1 | 100 Best Horror Movies of All Time | Rolling Stone | horror |
| 2 | Top 100 Horror Movies | Rotten Tomatoes | horror |
| 3 | 100 Best Classic Movies | Rotten Tomatoes | classics |
| 4 | 100 Years…100 Movies (10th Anniversary) | AFI | all time |
| 5 | The Greatest Films of All Time (2022 poll) | Sight & Sound / BFI | all time |
| 6 | 100 Greatest Movies | Empire | all time |
| 7 | Official Top 250 Narrative Features | Letterboxd | all time |
| 8 | Great Movies | RogerEbert.com | classics/canon |
| 9 | 100 Best Comedies | Rotten Tomatoes | comedy |
| 10 | 100 Best Science Fiction Movies | Rotten Tomatoes | sci-fi |
| 11 | 100 Essential Films | National Film Registry (Library of Congress) | classics |
| 12 | 100 Best Horror Films | Time Out | horror |

Rules for every list: the ranking is entered **as published** (rank order is the source's, never re-sorted by PIX); the edition is named (lists change between editions — the edition is part of the record); films resolve to the catalogue by IMDb id where known, else title + year (the same join the classics posters use); **an unresolved film is named on the list's build report, never silently dropped or faked**.

## 3 · Data model (GAKz `pix`, new tables — DDL on build order)

- `pix_spawned_lists` — id, slug, title, source_name, source_url, edition, category, published_count, created_at. 
- `pix_spawned_list_items` — list_id, rank, imdb_id (nullable), title_as_published, release_year, resolved (bool). Unique (list_id, rank).
- List membership is itself a **label** (§5): a film on three horror lists carries that as provenance-weighted signal, distinct from a fan's opinion of it.

User lists stay in `pix_user_lists` / `pix_user_list_items` (already live). CSV imports (§6) land there too, with `source='import'` provenance on the items' batch.

## 4 · How it renders (the portable build)

- The Lists section gains a **SPAWNED** shelf: one row per spawned list (source + edition + count), opening the list page: ranked poster grid in the standard card (rank badge, hover fold, staged posters), header carrying source attribution + link-back.
- The hover fold is the same component as Top 500 / NOW PLAYING — no second interaction dialect. What a fan marks on a spawned list is marked everywhere (one seen set, one signals table).

## 5 · Feelings VOCAB — labels, tags, and the fan's DB

Brian's rule: *the link between feelings and understanding must be carefully recorded to each user's DB.* The mechanism is a **curated VOCAB**, never free text (free text forks every term into spelling variants):

- **Film-side labels** (what a film IS): genre tags (the `pix_horror_tags` / `pix_thriller_tags` seed generalises), mood labels (Feel-good, Dark, Cozy, Brutal, Dreamlike, Tense, Melancholy, Triumphant… — the curated 12–16 mood set proposed 2026-10-20), theme labels, and **list-membership labels** (§3).
- **Fan-side records** (what a fan FELT/DID): the WHY panel already records `why_tag` (Story / Performance / Feeling / Craft / Rewatch value) per vote into `pix_vote_reasons`; interest verdicts land in `film_dna_media_signals`; everything appends to `film_dna_events`; the digested per-fan state lives in `film_dna_profiles` + `user_dna_strands`. Mood-orchestration ("what do I feel like tonight") reads the fan's strand weights against film-side mood labels — that is the query `film_dna_queries` exists for.
- New fan-side term: a fan may tag a film with a mood **for themselves** ("this one is my comfort film") — recorded per user, never written back onto the film's public labels. Public labels change only through the VOCAB process (§7).

## 6 · User lists + CSV import

- Fans create lists in the Lists section (exists). **Import**: upload a CSV (Letterboxd / IMDb / plain title,year exports) → columns mapped (imdb id wins; else title + year) → resolved films land in the new list; **unresolved rows are reported back line-by-line**, never guessed. Export mirrors import (a fan's list leaves as CSV with imdb ids).
- A user's public list can be **followed**; following is a DNA signal too (weaker than rating, stronger than a view).

## 7 · GURU — the FACTORY steward (charter WIDENED fleet-wide by the 2026-11-06 LANGUAGE GOVERNANCE lock)

A FACTORY agent chartered to keep the foundational structure honest. **As of the Founder's language-governance ruling (2026-11-06, later the same day), GURU's charter is fleet-wide, not PIX-only:** it stewards `core.language-governance` — VOCAB registry, taxonomy, speciation, acquisition — across all properties and the Control Plane (see `~/workspace/supa/LANGUAGE-GOVERNANCE.md` §8). The PIX-lists duties below are its first beat under that wider charter:

- Owns the **list schema + provenance rules** (editions, link-backs, no-fake-resolution rule) and audits spawned lists against them.
- Owns the **VOCAB registry**: new labels/tags enter only through GURU review (one spelling, one meaning, mapped synonyms), so the feelings layer never forks.
- Owns **match quality**: catalogue resolution rates per list/import, unresolved queues, poster coverage.
- Owns the **taste-twin thresholds** (§8) and reports drift.
- GURU is a *steward*, not a creator: it proposes, the Founder (or the steward process) disposes. Birth number = next free FACTORY position at build time (PX/PIXMAGE holds the earlier proposal at 19, unbuilt — order is the Founder's call).

## 8 · Taste twins

- Similarity is computed over the shared signal space: PIX MIX votes (win/loss per film), seen set, interest verdicts — weighted votes > verdicts > seen.
- A **taste twin** = similarity above threshold **and** enough overlap to mean something (minimum co-rated films; the threshold pair is GURU-kept, §7). USER 1 ≈ USER 29462 is the canonical case: near-identical picks.
- What twins get: recommendations drawn from the twin's loved-but-unseen films, and **opt-in** conversation (both fans consent; PIX's standing privacy rule — fan data serves games and entertainment help, aggregations are Global/Country/State-Province with a personal overlay, nobody's raw record is exposed).
- Twin computation is a batch job over `film_dna_events` aggregates, not a per-page query.

## 9 · Build order (on the Founder's lock)

1. DDL: `pix_spawned_lists` + `pix_spawned_list_items` (+ labels generalisation of the horror/thriller tag tables).
2. First three lists end-to-end (one horror, one classics, one all-time — prove the pipe), Lists-page SPAWNED shelf + list page in the portable.
3. The remaining nine, each with its resolution report.
4. CSV import for user lists.
5. Mood VOCAB v1 (curated set) on film pages + the fan-side mood tag.
6. Taste-twin batch + first twin surfaces (recommendations only; conversation later, opt-in).
7. GURU charter into FACTORY (on its own lock).

## 10 · Open questions for the Founder

1. The slate (§2) — lock as-is, swap, or cut?
2. GURU (§7) — charter now, or after the lists prove out?
3. Mood set — the 12–16 curated moods from the 2026-10-20 proposal as v1?
4. IMDb Top 250 deliberately **excluded** from the slate (their terms restrict reuse of their data; editorial lists with link-backs are the clean set). Founder to confirm the exclusion stands.
