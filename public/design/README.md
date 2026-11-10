# PIX.MOV Design Package

The PIX.MOV design as **files** — palette, component styles, behavioral
settings, and markup patterns — extracted from the Muse app's real build
(the `pix-2` artifact's client source) so any build of PIX.MOV, including
the portable self-host build, can consume the design directly instead of
re-deriving it from prose.

**Version:** see `VERSION` (starts at 1.0.0).

## What's in here

| File | Contents |
|---|---|
| `tokens.css` | Design tokens as CSS custom properties: locked Classic PIX palette, surfaces, header/marquee/channel geometry, NP overlay dimensions, SIZER range, billboard values. |
| `theme.css` | Component styles for the signature elements, commented by section: header + bulb wordmark + chase bulbs, poster marquee, FEATURES grid, channel loop rows, ATTRACTIONS bar, landing row chrome (fold/drag), NOW PLAYING overlay + game states, poster foldouts + verdict states, Top 500 + SIZER, film pages, player + BILLBOARD, footer, BISCUIT launcher. |
| `settings.json` | Behavioral settings as data: marquee rows/speeds/pool, channel loop speeds and hold zones, NP overlay widths, billboard (5s, quote set, ad precedence), SIZER steps, hover-type map, verdict map, channel taglines, footer text, BISCUIT contract. |
| `components.md` | Annotated markup patterns for the signature elements, drawn from the real build, so an implementer can reproduce structure, not just style. |
| `VERSION` | Package version. |
| `.gitignore` | Standard ignores. |

## How a build consumes it

1. **Link the CSS, tokens first:**
   ```html
   <link rel="stylesheet" href="tokens.css">
   <link rel="stylesheet" href="theme.css">
   ```
   `theme.css` references the `--pix-*` custom properties defined in
   `tokens.css`; class names match the Muse build, so markup written
   against `components.md` styles correctly as-is.
2. **Read `settings.json`** for anything a number drives: animation speeds,
   the SIZER step function, billboard timing and the 38-quote set, channel
   control placement, consent fields. Treat it as the single source for
   those values — don't re-hardcode them.
3. **Follow `components.md`** for DOM structure and the behavior contracts
   attached to each pattern (what a click does, what must never render,
   what persists per user).

## Provenance

Values were **extracted from source** wherever the shipped build expresses
them. Where a value exists only as Brian's stated spec, the file says so
inline (`SPEC` comments in CSS, `specSource`/`specNote` keys in JSON). Known
spec-vs-source differences are recorded, not smoothed over — e.g. the
marquee pool (spec 100, source fetches 60) and the 3/4 poster display scale
(spec statement; source expresses size per surface + SIZER).

## What this package is not

- **Not the app.** No application logic, no database, no server code, no
  secrets. Engines (loop/marquee motion, triage permanence, consent
  enforcement, player capability fallbacks) are described in
  `settings.json` / `components.md` §8 but must be implemented by the
  consuming build.
- **Not a defect fix.** The live portable build's known defects (D1–D8 —
  duplicated years in classic titles, poster failures on Top 500 / NOW
  PLAYING, developer copy on public pages, mojibake, SHOWCASE routing, the
  missing footer, missing clip counts, gray loading flashes) are catalogued
  in the restoration handoff:
  `~/workspace/goals/pix-mov-live-deployment/files/pixmov-design-restoration-handoff.md`.
  Design files alone don't fix those — most are data and routing bugs.

## Versioning

Bump `VERSION` and note the change here whenever tokens, styles, or
settings change meaningfully. The package versions independently of the
apps that consume it.

- **1.0.0** — initial extraction from the Muse pix-2 build (2026-10-21).
