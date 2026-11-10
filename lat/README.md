# PIX-MOV

**The Viewer — Taste Network & Movie vs Movie** — the LAT package for PIX.MOV: its ranked LIST of top items to surface, DASHBOARD Control Plane + CRUD, Vocabulary, Topology Map + manifest, Version Dock, and `/handoff` coordination.

**Working doc:** [PIX-MOV.md](PIX-MOV.md) — **v1.01.00** (live doc)
**Source of truth:** `library.documents.pixmov` in library.db; this folder holds the latest export.
**LAT status:** full LAT (12/12) from v1.00.00 — LAT Batch 2. Repo/push status: see PIX-MOV.md header.

## The Overall Rule

Every update is pushed to GitHub with the latest version **in the same pass**, using Muse — version + timestamp bumped, library.db refreshed, INDEX updated, push read back and verified. Full rule: PIX-MOV.md §10. Where the repo is undecided/uncreated, the package is reported *local-only, push pending* — never as shipped.

## Layout

| File | What it is |
|---|---|
| `PIX-MOV.md` | The living LAT doc. |
| `VERSION` | Current version, matching the doc. |
| `README.md` | This file. |
| `handoff/` | AI matrix coordination (7 files). |
| `template/` | `topology-manifest.json` — the Topology Map as data. |

**RULEBOOK:** This repo follows the system RULEBOOK (one standard for all agents, repos, DB entries, and versioning) — kept in `MaggiLunk/LAT` at `RULEBOOK/RULEBOOK.md`. Load it first; never copy it.
