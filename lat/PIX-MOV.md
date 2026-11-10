# PIX.MOV — The Viewer — Taste Network & Movie vs Movie

**Version:** 1.01.00
**Updated:** 2026-10-21
**Status:** LIVE DOC — every update carries a timestamp + version bump, is registered in library.db (`library.documents.pixmov`), and is **pushed to GitHub in the same pass** (see §10, the Overall Rule).
**Repo (RESOLVED by Brian 2026-10-22):** `MaggiLunk/pix` is a **governed code repo** under the RULEBOOK (§6.5): this LAT package lives **in-repo at `lat/`** — never on the code root — the root README carries the RULEBOOK pointer, and the LAT REGISTRY gates this repo for drift like every other. First push landed in the resolution pass; the local source of this package stays `~/workspace/pix-mov/`, refreshed into `pix` → `lat/` on every bump.
**Template:** This package is a **LAT — LUNK Artifact Template** (WEBSERVER.md §8), built in **LAT Batch 2** (LAT REGISTRY v1.02.00 §5). **Index:** PIX.MOV INDEX.

---

## 1. What PIX.MOV is

**PIX.MOV** (locked term, always in full capitals) is the viewer: the taste network whose key game is **Movie vs Movie** — year-based decks of poster-backed films — feeding **FILM DNA**, similar-likes suggestions (never an algorithmic For You Page), **SHOWCASE** profiles, Shorts, and the classic-film catalog. Vision of record: PIX is the single source of truth for entertainment media. Sibling docs stay authoritative for their slices: PIX Vision, PIX Product Direction, PIX Topology, NETWORK_DESIGN.

**Locked principles**

1. **Poster or it doesn't play.** A matchup displays only with real poster art — never a still passed off as a poster, never an invented title. Sparse years show honest lower counts.
2. **Triage is permanent.** Any triage decision (seen / unseen / maybe / want-to-see / not interested / never heard of it) removes that film from NOW PLAYING rotation for that user — it never resurfaces.
3. **Taste, not demographics.** Voluntarily shared demographics are used only for games + helping the user choose entertainment — never anything else.
4. **First-party signals.** Trending Now runs on votes, matchup activity, views, and CINE shorts stats. TMDB is out (licensing); no external taste graph.
5. **Data in the DB.** Year-deck movies, poster references, and stats live in the database, keyed by stable IMDb ID — nothing hard-coded in source.

---

## 2. THE LIST — the top items PIX.MOV needs surfaced

Ranked by *"if this is wrong and you can't see it, you are blind."* Tier 1 (1–5) is non-negotiable. **These rankings are the Batch 2 draft from LAT REGISTRY §4 — Brian's re-ranking replaces them.**

| # | Item (Vocabulary) | What it surfaces | Red condition |
|---|---|---|---|
| 1 | **NOW PLAYING** **Tier 1** | The Movie vs Movie matchup — two posters, pick the one you liked better; a pick records the vote and immediately deals two new choices | A film reappearing after triage, or a matchup shown without poster art |
| 2 | **CATALOG** **Tier 1** | Every poster-backed film, year decks (uncapped per year), per-movie stats | A deck count that disagrees with the DB |
| 3 | **FILM DNA** **Tier 1** | Per-user taste signature learned from every vote, unseen mark, and synopsis search; signal counts + strongest genre cues on show | DNA updating from anything except the user's own actions |
| 4 | **SHORTS** **Tier 1** | Clips ≤2 min; a locked 5s full-page SLOT-SHORTS ad after each short, then the next clip | A short over 2 min, or an ad that isn't the locked 5s format |
| 5 | **SHOWCASE** **Tier 1** | The user's public profile (locked term): fan type, taste, what they know and like | SHOWCASE showing anything the user didn't choose to show |
| 6 | **TRENDING NOW** | First-party trending (votes/activity/views/shorts stats), seeded from real game votes | Any external-API data presented as trending |
| 7 | **SYNOPSIS SEARCH** | Natural-language desire matched against per-movie attributes, with streaming/purchase links; taste history (consented) breaks ties, skipping unseen films | A result the user already triaged |
| 8 | **TOP 500** | The ranked 500 — options hidden until hover; clicking a poster marks Seen/Watched; film-page link lives in Options (with Review, Discuss, Remove-from-seen) | Clicking a poster navigating away (it must mark seen) |
| 9 | **USERS LISTS** | User lists — created only in the User Profile, public or private at the user's choice, titles editable; no preset list types | A preset list type offered at creation |
| 10 | **CONNECTIONS** | The taste network: ratings, recommendations, comments cross-pollinating between similar users; fan-type system (Horror Hound, Prestige Hunter, …) asked once after ~8 consecutive never-seen marks | Recommendations from an algorithmic FYP instead of similar likes |
| 11 | **ACCOUNT / PRIVACY** | Anonymous play; Privacy Policy with accept/decline; signup = email + 6-digit code + human verification (codes stored as expiring hashes; outbound email not yet connected, code shows as a labelled preview) | A code stored in plaintext, or play blocked for anonymous users |
| 12 | **SETTINGS / KEYS** | Server-side API config (pix_config) with per-service status; keys never exposed to the client | A key value reaching the client, ever |

---

## 3. The Control Plane — DASHBOARD design + CRUD

PIX.MOV surfaces as a **DASHBOARD workspace** (Columns, Cards, Tool Boxes, FLOATs, Tool Rows — DASHBOARD.md is the system of record):

- **COL-A PLAY:** CARD-NOW-PLAYING · CARD-SHORTS · CARD-TRENDING-NOW
- **COL-B DISCOVER:** CARD-CATALOG · CARD-SYNOPSIS-SEARCH · CARD-TOP-500 · CARD-USERS-LISTS
- **COL-C YOU:** CARD-SHOWCASE · CARD-FILM-DNA · CARD-CONNECTIONS · CARD-ACCOUNT · CARD-SETTINGS

Every Card FOLDS / UNFOLDS, POPS into a FLOAT with FLOAT-TABS, and drags by its GRIP only. Every Card header carries its Vocabulary label, an honest status dot tied to its Red condition (§2), and a LAST-READ timestamp.

### CRUD per Card

| Card | CREATE | READ | UPDATE | DELETE / destructive |
|---|---|---|---|---|
| **NOW PLAYING** | Deal a pair | Vote / triage state per film | — (a pick *is* the update) | Triage is permanent, never a delete that resurfaces the film |
| **CATALOG** | Add a film (poster-backed, IMDb-ID keyed) | Decks, counts, per-movie stats | Poster reference, deck membership | Remove only with its stats disposition named |
| **FILM DNA** | — (learned) | Signature, signal counts, genre cues | Recompute from user actions | User can reset — named + confirmed |
| **USERS LISTS** | Create in Profile only | Lists (own + public) | Title, public/private | Delete own list (confirm) |
| **ACCOUNT** | Sign up (email + code + human check) | Account, consent state | Profile / SHOWCASE choices | Account deletion is a named, confirmed flow |

**Guardrails (all Cards):** destructive verbs sit behind a confirmation that names the record; secret fields are masked write-only; a blocked action names its reason in plain words; every write lands in an AUDIT row.

---

## 4. Topology Map

```
PIX.MOV Control Plane (this doc, a DASHBOARD workspace)
  └─ renders TOPOMAP from template/topology-manifest.json (the map as data)
  └─ speaks to the artifact below it — the diagrams in the sibling topology docs are exports, not sources
```

The machine-readable manifest in `template/` lists every item in §2 as a node with its column, so editing the manifest changes the map. The artifact's own internal topology stays in its sibling docs (named in §1).

---

## 5. Vocabulary

**Issue formula: ADDRESS + VERB/STATE + what's wrong** — e.g. *"CARD-NOW-PLAYING is STALE."* Places: `PLANE` · `COL-A/B/C` · `CARD-<ITEM>` · `BOX-<ITEM>` · `ROW-<ITEM>-<ROW>` · `FLOAT / FLOAT-TAB-<ITEM>` · `VDOCK` · `TOPOMAP`. Inherited verbs: GRIP · FOLD/UNFOLD · POP · DOCK · SNAP · TEAR-OFF · SPLIT · EDGE · MEASURE · CRUD.

**This artifact's labels:** **NOW PLAYING (NP)** · **MOVIE VS MOVIE (MM)** · **FILM DNA** · **SHOWCASE** · **CATALOG / AVAILABLE CATALOG** · **PIX LIBRARY** · **WATCHED** · **TOUGH PIX** · **ATTRACTIONS** · **MY SCREENING** · **REVIEW** · **FEATURE PRESENTATION**

---

## 6. The Version Dock — VDOCK

A VDOCK strip docked at the top of the Control Plane, expandable to VDOCK-FULL (version history, GitHub push status, `/handoff` status). **VDOCK items for PIX.MOV:** `VDOCK-DOC` · `VDOCK-APP` · `VDOCK-SCHEMA` · `VDOCK-GIT` · `VDOCK-CATALOG (live catalog film count)`. A mismatch (VDOCK-DOC ≠ repo VERSION, VDOCK-GIT ≠ the running SHA) renders in the Red condition. **Status: spec of record here; the in-UI strip is a follow-on build, not claimed built in this pass.**

---

## 7. /handoff

`handoff/` ships in this package from its first version (README protocol, STATUS, CLAIMS, INBOX, OUTBOX, DECISIONS, HANDOFF_TEMPLATE) — same protocol as WEBSERVER.md §7. Claim before you edit; "done" without evidence isn't done.

---

## 8. Domain notes

- **App model (Brian, 2026-10-12): PIX.MOV is one app with three parts** — PIX (this doc, the viewer), CINE (the editor that feeds it), DB Interface (Founder oversight). Brainstorm is a separate app, never mixed in.
- **Design (locked):** Classic PIX palette — golden yellow primary, Orange #FF8A00, Red #FF3B30, Electric Blue #00A8FF accents; page background 98% black; posters/shorts at 3/4 size with padding; new pages are poster-sized black boxes with yellow trim.
- **Fan types** are a DB-backed taxonomy learned from votes/skips/saves with confidence scores; era is one signal, not the whole model.
- **Open / unverified on record:** the 2026-10-18 browser/app sync incident (app not loading, missing comments) is unresolved; Shorts clip→ad→next interaction awaits Brian's click-through.

---

## 9. Build order

1. LAT package (this pass) — doc, README/VERSION, Vocabulary, Topology manifest, VDOCK spec, /handoff, library.db key `library.documents.pixmov`, INDEX rows.
2. ~~Repo placement~~ — RESOLVED 2026-10-22: governed code repo, package at `MaggiLunk/pix` → `lat/` (RULEBOOK §6.5). Drift gate: a RULEBOOK bump flags this package until refreshed.
3. VDOCK strip + TOPOMAP-from-manifest in the app UI, batched with click-through fixes.
4. Close the open items in §8 as they resolve — each close is a version bump + push in the same pass.

---

## 10. The Overall Rule — GitHub push on every update

Every update: version + timestamp bump → library.db refresh + history row → INDEX update → GitHub push in the same pass → read-back verify → sync record in `~/workspace/pix-mov.muse-github-snapshot-sync.json` (beside the folder, never inside it). No update is "done" until the push is verified; if the repo is unreachable or undecided, the update is reported as *local-only, push pending* — never silently treated as shipped. The Muse GitHub App cannot create repos; Brian creates them.

---

## 11. Verification checklist

**Data-verified (2026-10-21, Batch 2 pass):**
- [x] §2 LIST ranked from LAT REGISTRY §4 for this artifact, each item with a Red condition and a CRUD row or a named place in §3.
- [x] Vocabulary (§5) covers every §2 item; VDOCK items (§6) declared.
- [x] `template/topology-manifest.json` parses and names the same items as §2.
- [x] `/handoff` contains all seven §7 files; STATUS.md reflects the true push status.
- [x] library.db registration (`library.documents.pixmov`) + INDEX entries in this pass.

**Click-through verified (Brian — pending):**
- [ ] §2 rankings — Brian may re-rank.
- [ ] COL grouping in §3 reads right.
- [ ] VDOCK carries the items Brian actually glances at.

---

## 12. Version history

| Version | Date | Change |
|---|---|---|
| 1.00.00 | 2026-10-21 | Created in **LAT Batch 2** (Brian's go, via LAT REGISTRY §5). First full LAT package for PIX.MOV: the ranked LIST (§2), DASHBOARD Control Plane + CRUD (§3), Topology Map + manifest (§4), Vocabulary (§5), VDOCK spec (§6), `/handoff` (§7), library.db registration + INDEX. Sibling docs named in §1 remain authoritative for their slices; this doc is the LAT of record that ties them together. |
| 1.01.00 | 2026-10-22 | **Placement resolved + first push:** Brian ruled the `pix` SSOT follows the LAT system across the board — this package now lives in-repo at `MaggiLunk/pix` → `lat/`, root README carries the RULEBOOK pointer, LAT REGISTRY gates the repo for drift (RULEBOOK §6.5 added the same day). §1/§12 updated. |

*Next update: bump the version, add a row here, refresh `library.documents.pixmov`, and push — all in the same pass.*
