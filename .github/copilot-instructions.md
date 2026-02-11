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

## Local AI (If Needed)
- Ollama runs at `http://127.0.0.1:11434` and stores models on `/Volumes/COSMIC/_AI/ollama_data`.
- Start backend: `./scripts/start_ai_backend.sh`
- Inventory check: `./scripts/ai_inventory.sh`
