# CINE polish snapshot and tool roadmap

Snapshot: `snapshots/cine-2026-10-15-pre-polish/`

Captured before the 2026-10-15 visual polish pass: `App.tsx`, `theme.css`, and `VERSION.md`.

## Planned monetization

- **Distributor paywall (goal, not yet active)** — the DISTRIBUTOR tool will
  eventually sit behind the paid CINE plan. It stays available to everyone
  for now. The gate is already architected in `client/src/App.tsx` via
  `cineFeatureFlags.distributorPaywall` (currently `false`): flipping it to
  `true` renders the tool's locked state for viewers whose workspace plan
  is not `paid`, with no other code changes needed.

## Tools CINE still needs

1. **Undo / redo history** — visible edit history with reversible timeline operations.
2. **Razor + ripple delete** — split at the playhead and close timeline gaps automatically.
3. **Keyframe editor** — graph controls for position, scale, opacity, audio, and effects.
4. **Audio mixer** — per-track meters, gain, pan, mute/solo, fades, and loudness normalization.
5. **Color workspace** — scopes, exposure/contrast/white-balance controls, and reusable looks.
6. **Captions** — transcript import, subtitle timing, style controls, and SRT/VTT export.
7. **Transitions browser** — searchable transitions with duration and preview.
8. **Proxy + relink manager** — status, relink, regenerate, and offline-media handling.
9. **Render queue** — background jobs, presets, progress, pause/resume, and failure recovery.
10. **Autosave + project versions** — named checkpoints and recovery after a crash.
11. **Media search and smart bins** — filter by type, duration, profile, tag, and usage.
12. **Keyboard shortcut map** — discoverable, editable shortcuts for professional editing speed.
