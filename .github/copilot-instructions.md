# AI Workspace Context (Template)

This workspace is part of the **Amazing Business** ecosystem.

## SSOT / Architecture
- Workspace registry + ports: `DOCs/BUSINESS/BUSINESS_WORKSPACES.md`
- Tool alignment standards: `DOCs/TOOLS/TOOL_ALIGNMENT_STANDARDS.md`
- AI operating standard: `DOCs/BUSINESS/BUSINESS_AI_OPERATING_STANDARD.md`
- Local AI setup (Ollama on external drive): `DOCs/AI/AI_INFRASTRUCTURE.md`

## Shared Code Protocol
- Before building generic tooling (auth/blog/media), check `SHARED/` first.
- Prefer `@magicwrx/*` packages (no `file:` deps in production).

## Package Guardrails (Mandatory)
- **GitHub Owner:** All repos live under `MagicWRX` (personal account). Do NOT use `MagicWRX-Studio` for new repos/packages.
- **Package Scope:** `@magicwrx/*` — published from `MagicWRX/shared` monorepo via GitHub Packages.
- **Peer Dependencies:** ALL `@magicwrx/*` packages MUST use wide peer dep ranges: `"next": "^14.0.0 || ^15.0.0 || ^16.0.0"`, `"react": "^18.0.0 || ^19.0.0"`.
- **Repository URL:** Always `git+https://github.com/MagicWRX/shared.git` — never `MagicWRX-Studio`.
- **publishConfig:** Always `{"registry": "https://npm.pkg.github.com"}`.
- **Lockfile Safety:** Before committing `package-lock.json`, verify no `"resolved": "../"` local paths exist. Run `wrx validate-lockfile`.
- **No `always-auth`:** Deprecated. Remove from any `.npmrc` file.
- **Versions SSOT:** `DOCs/TOOLS/TOOL_ALIGNMENT_STANDARDS.md` — do not hardcode Next.js/React/Node versions in instructions.

## Local AI (If Needed)
- Ollama runs at `http://127.0.0.1:11434` and stores models on `/Volumes/COSMIC/_AI/ollama_data`.
- Start backend: `./scripts/start_ai_backend.sh`
- Inventory check: `./scripts/ai_inventory.sh`
