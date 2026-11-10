# PIX.MOV — Deep Audit & MOSAIC Dissection/Reassembly Review

**Date:** 2026-10-28
**Sources:** pix-2 artifact inspection `38e13d39-91b6-4f56-bb77-d233741da5de` · MOSAIC artifact inspection `6ad5a86d-bbb8-4c09-b591-ac6ba65f64a1` · fleet records (SUPA LOG, BRIDGE seed, BIZ-MODEL)
**Premise (Brian, 2026-10-28):** the PIX.MOV artifact in the Muse file system is the most accurate representation of the founder's vision. GitHub, GAKz, BRIDGE and MOSAIC are in place; the live https://pix.mov site does not match the vision.

---

## 1. What the vision artifact actually is (pix-2 inventory)

- Fullstack TypeScript artifact, slug `pix-2`. Client entry `client/dist/index.html`; `client/src/App.tsx` ≈ 8,030 lines + `theme.css` ≈ 3,749 lines; server `server/src/actions.ts` ≈ 6,251 lines, `schema.ts` ≈ 737 lines; 67 Drizzle migrations (0001–0067).
- **24 hash-routed sections:** pix · dna · pix-profile · screening · feature · seen · sort · views · top500 · grossers · budgets · watchlist · lists · tough · attractions · feedback · privacy · agreements · cine · section-dream-log · section-posters · section-monsters · section-notes · section-publish.
- **112 published actions** across game/catalogue, user state (seen/interest/triage/FILM DNA), lists/community, account/consent (email signup + verification, BISCUIT consent, demographics, profile/avatar, Safe Space), media/CINE (B2 streaming, chunked uploads, checkout), and founder/integration (ads, B2 config, integration keys, library.db backup/sync, GAKz status).
- **Data (isolated app.db copy):** 52 application tables. Catalogue scale: 13,663 movie stats + 13,663 Wikidata films + 202,013 credits; 132 decks / 11,908 entries; 94 classic films / 4,623 clips; 100 PD films; 1,032 flagged words. **Real user data present and preserved:** 1 profile, 112 game results/votes, 3 user lists, 2 TOUGH shares, 3 movie posts, 21 notes, 5 CINE assets, 1 CINE account, 9 signup challenges.
- **Assets:** per-film poster WebPs, per-year poster archives + marquee archives (1896–2026), 5 MUSIC loops, CINE desktop/source ZIPs. Posters resolve via `pixPosterManifest.ts` / `pixMarqueeArchiveManifest.ts` / `pixPosterColors.ts`. **Preservation rule: posters/media stay referenced assets — never copies embedded in MOSAIC payloads.**
- **Theme:** Classic PIX tokens in `theme.css` (`--yellow #f2b705`, `--orange #ff8a00`, `--red #ff3b30`, `--electric-blue #00a8ff`) on the locked 98%-black / gold-trim system.
- **GAKz bridge:** built (`server/src/gakz.ts`, PostgREST to GAKz `pix`) but **OFF by shipped default**; live capture 2026-10-27: `bridge_enabled: false`, no key configured, production reads local SQLite. Template work must not flip the flag or require the key. Phase B attestation still outstanding (audit-service timeouts); Brian's key entry stays on hold.

## 2. What MOSAIC already holds (the dissection exists)

- Static/client-only artifact `dashboard-grid-mosaic`; persistence is localStorage; no server actions.
- **≈91 PIX.MOV blocks + ≈20 CINE blocks**, all GRID Column → Row → Control, `COMP-*` roots, `.pix-*`/`.cine-*` rules carried by `STARTER_CSS`; shared PIX header + site footer.
- **15 PIX page templates** already composed from those blocks: Landing, ATTRACTIONS, Top 500, Money, Seen Archive, Views, Watchlist, Users Lists, Film Page, FEATURE PRESENTATION, TOUGH PIX, SHOWCASE, Sign-up, Legal—Privacy, Feedback. Full catalogue: 20 loadable page templates + insert-only PIX header.
- **Honest limit:** the page templates are **visual shells** — placeholder ◆/SVG poster art, hard-coded sample films/grosses/Seen counts, header wordmark literally "BRAND", Privacy copy is placeholder text. No builder calls a pix-2 action or reads GAKz `pix`. Sample content must never be presented or published as PIX.MOV's real catalogue, rankings, or counts.

## 3. Coverage gaps against the 24 sections

| pix-2 section | MOSAIC state |
|---|---|
| FILM DNA (`dna`) | Blocks exist (Film DNA, DNA Comparison, Fan Type Panel, Film DNA Search, Mini) — **still no dedicated page in the shipped assembly**; the Audit & Map page states this openly. **Open.** |
| Sort / Movie vs Movie (`sort`) | No standalone page; the VS matchup lives inside TOUGH PIX. **Open — named, not hidden.** |
| MY SCREENING (`screening`) | Static block inside the Film page only. **Open.** |
| Budgets (`budgets`) | Folded into the single Money page with Grossers. **Accepted for v1; named.** |
| Agreements (`agreements`) | **Folded into Legal — Privacy** in the shipped assembly (no separate page). **Open if Brian wants it standalone.** |
| Embedded CINE (`cine`) | **Included** — CINE Workspace ships as page 17 of PIX-SITE (and remains a standalone page template). |
| Dream Log · Posters · Monsters · Notes · Publish | No MOSAIC counterparts. These are the Story/Brainstorm-side sections. **Excluded from PIX-SITE pending Brian's founder call** (Brainstorm is a separate app; the sections are not silently dropped and not silently imported). |

## 4. The reassembly model (PIX-SITE)

PIX-SITE is MOSAIC's first **SITE-level template**, kept separate from the page-template path so loading it can never replace the current page:

1. Separate site-template registry; Templates shows **PIX.MOV — Full Site (`pix-site`)** under SITE TEMPLATES. `pix-site` is **not** added to `TEMPLATE_IDS`/`PIX_PAGE_IDS`.
2. Ordered `PIX_SITE_PAGES` manifest — **as shipped (17 pages):** 1 PIX-SITE — Audit & Map (a map of this audit: what maps, what folds, what's open) → 2 Landing → 3 ATTRACTIONS → 4 Top 500 → 5 Money → 6 Seen → 7 Views → 8 Watchlist → 9 Users Lists → 10 Film → 11 FEATURE PRESENTATION → 12 TOUGH PIX → 13 SHOWCASE → 14 Sign-up → 15 Legal — Privacy (Agreements folded in) → 16 Feedback → 17 CINE Workspace.
3. **As shipped,** the loader is `loadPixSite(ed)`, dispatched from `requestTemplateLoad()` before the `TEMPLATE_IDS` check (no generic `loadSiteTemplate` exists): autosave is suspended during assembly; the current site is stored first via `createSite()`; if a site named `PIX.MOV — pix-site` already exists it **switches to it instead of duplicating**; each page is built while selected/mounted with its own `store()` (frame styles are per-page), then page 1 is re-selected. No replace-confirm — nothing is discarded.
4. Provenance — **as shipped,** the pre-existing per-payload stamp carries it: `mosaicTemplateId = 'pix-site'`, and `detectTemplateId()` returns `'pix-site'` for it. No new `mosaicSiteTemplateId` field was introduced — functionally equivalent, and it keeps saved payloads and the GAKz `mosaic.*` import keying off one field. Do not rename these identifiers in a cleanup: saved payloads and duplicate-detection key off the exact site name `PIX.MOV — pix-site` and the stamp values.
5. The shared header builder's wordmark still reads "BRAND" by default; the assembly did not special-case it. **Open cosmetic item** — a PIX.MOV wordmark inside the PIX-SITE assembly remains a small follow-up edit if Brian wants it.
6. Preservation: all 20 existing page templates + insert-only header keep working through the original replace-with-confirm path; existing localStorage sites/pages untouched; the GAKz `mosaic.*` import of record (1 project, 1 page) untouched; instantiated pages autosave as ordinary site content and travel with Sites/Pages EXPORT-DATA unchanged.

## 5. What "perfect" honestly means — three stages

- **Stage 1 — visual/structural reassembly (this pass):** pages, blocks, shell, Classic PIX theme, order, provenance — achievable in MOSAIC source now.
- **Stage 2 — real content:** real posters and catalogue values **bound**, not hard-coded — needs the MOSAIC D13 CMS FIELD / COLLECTION / RECORD PAGE binding path and a poster-key resolution decision (MOSAIC assets vs PIX/GAKz side).
- **Stage 3 — behaviour:** voting, seen-marking, lists, signup/verification, BISCUIT consent, Safe Space moderation, playback/Billboard flow, uploads, checkout — cannot live in a GrapesJS template; belongs to the live renderer / GAKz socket / pix-2 action runtime (Route 1 + PIX Phase C).

Stage 1 must never be reported as functional parity or as the live site. PIX.MOV's live leg stays **DRIFT** until the Local mirror verifies against the census (52 tables / 251,679 rows) and the first Lunk up-sync runs.

## 6. Evidence limits

- No live https://pix.mov capture was taken in either inspection; the mismatch is Brian's statement + standing fleet records.
- No pixel-level side-by-side render diff per page; the 15 PIX templates were not individually click-tested in the inspection render capture.
- GAKz/GitHub figures are the fleet record of 2026-10-27, not re-queried by the inspections; pix-2 counts are from its isolated app.db copy.

## 7. Build result — SHIPPED + source-verified 2026-10-28

- **PIX-SITE is live in the MOSAIC artifact** (build `34c08255-8846-482e-84f9-8050e67142ed`), verified by artifact inspection `4afefa39-40ec-4595-b8b2-88e215fb7af5` against the live source. Brian finds it at **MOSAIC → Templates → `PIX-SITE — PIX.MOV Full Site (17 pages)`**.
- Catalogue now holds **23 entries**: 2 SITE templates (`pix-site`, `saas-site`), 20 page templates, 1 insert-only PIX header. The 20 page templates and their replace-with-confirm flow are untouched; `pix-site` sits outside `TEMPLATE_IDS`, so loading it never replaces a page.
- Load semantics (source-verified): stores the current site first, creates-or-switches (never duplicates, never discards), per-page stores during assembly, lands on page 1 (Audit & Map), status line confirms "17 pages … the previous site stays saved under TEMPLATE → SITES."
- Process note, honestly recorded: the PIX-SITE edit dispatched from this chat failed at the platform submit step; the feature landed in the live build through the fleet's parallel SAAS pass (live version v2, which built `pix-site` + `saas-site` together). The outcome is verified in the live source either way — but the submit fault is the same one that has the pix-2 poster-gradient Phase 1 stuck, and it is not fixed.
- **Not verified:** no runtime click-through of loading PIX-SITE was performed by any probe. **Brian's click-through is the verification of record:** open MOSAIC → Templates → PIX-SITE, load it, confirm the 17-page `PIX.MOV — pix-site` site appears in TEMPLATE → SITES with pages in order, reload and confirm it persists.
- Stage boundary stands: this is **Stage 1** (visual/structural). Real content (Stage 2, CMS bindings) and behaviour (Stage 3, renderer/GAKz socket) are the follow-on stages from the SaaS conversation — not claimed here.

## 8. Founder verdict + direction — 2026-10-28 15:07 CDT

**Brian's verdict on the shipped Stage 1 reassembly, in his words:** "the MOSAIC version lacks the gentle finesse of the Artifact version. The css functions appear to be lost and possibly need a runthrough 'DESIGNER' to perfect."

- **Finding (founder-stated):** the MOSAIC page templates carry the Classic PIX look as flat class rules, but the artifact's CSS *behaviour* did not survive the dissection — the finesse lives in pix-2's `theme.css` (≈3,749 lines: interactive states, transitions, hover/grow treatment, glow and marquee motion, per-state styling) and in component-level styling logic that `STARTER_CSS` shells do not reproduce. This is a quality gap in the Stage 1 shells, not a data or structure gap.
- **Direction (Brian, same message):** the finesse is to be restored by a **DESIGNER run-through** — the artifact's design states and motion are to be re-expressed as MOSAIC **DESIGNER** design data (designs, DESIGN-STATEs, MOTION presets) and primitive-level rules, not pasted CSS — and the result carried into a **True MOSAIC build**: PIX-SITE wired to its real backend (GAKz `pix` data via Local's mirror + the pix-2 action runtime) instead of sample content.
- **Execution (Brian, same message):** GitHub push of this audit + the True Build handoff to MaggiLunk/pix, and a Local Agent prompt for **backend wiring + the True MOSAIC build**. Handoff of record: `PIX-SITE-TRUE-BUILD-HANDOFF.md` (MaggiLunk/pix, repo root).
- Stage boundary unchanged: Stage 1 stays shipped-and-honest; the True Build is Stages 2 + 3 plus this finesse pass. Brian's click-through remains the verification of record at every stage.
