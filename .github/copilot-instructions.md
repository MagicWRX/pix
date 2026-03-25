# AI Workspace Context (Template)

This workspace is part of the **Amazing Business** ecosystem.

## SSOT / Architecture
- Workspace registry + ports: `DOCs/BUSINESS/BUSINESS_WORKSPACES.md`
- Tool alignment standards: `DOCs/TOOLS/TOOL_ALIGNMENT_STANDARDS.md`
- AI operating standard: `DOCs/BUSINESS/BUSINESS_AI_OPERATING_STANDARD.md`
- Local AI setup (Ollama on external drive): `ai/docs/AI_INFRASTRUCTURE.md`

## Shared Code Protocol
- Before building generic tooling (auth/blog/media), check `SHARED/` first.
- Prefer `@magicwrxtools/*` packages (no `file:` deps in production).

## Package Guardrails (Mandatory)
- **GitHub Owner:** All repos live under `MagicWRXTools` (organization). Do NOT use `MagicWRX-Studio` for new repos/packages.
- **Package Scope:** `@magicwrxtools/*` — published from `MagicWRXTools/shared` monorepo via GitHub Packages.
- **Peer Dependencies:** ALL `@magicwrxtools/*` packages MUST use wide peer dep ranges: `"next": "^14.0.0 || ^15.0.0 || ^16.0.0"`, `"react": "^18.0.0 || ^19.0.0"`.
- **Repository URL:** Always `git+https://github.com/MagicWRXTools/shared.git` — never `MagicWRX-Studio`.
- **publishConfig:** Always `{"registry": "https://npm.pkg.github.com"}`.
- **Lockfile Safety:** Before committing `package-lock.json`, verify no `"resolved": "../"` local paths exist. Run `wrx validate-lockfile`.
- **No `always-auth`:** Deprecated. Remove from any `.npmrc` file.
- **Versions SSOT:** `DOCs/TOOLS/TOOL_ALIGNMENT_STANDARDS.md` — do not hardcode Next.js/React/Node versions in instructions.

## Local AI (If Needed)
- Ollama runs at `http://127.0.0.1:11434` and stores models on `/Volumes/COSMIC/_AI/ollama_data`.
- Start backend: `./scripts/start_ai_backend.sh`
- Inventory check: `./scripts/ai_inventory.sh`

## Copilot Chat Safety (Critical)
- **No `.env` context in chat:** NEVER include `.env*` file contents in any response, summary, attachment, snippet, or tool output.
- **No `.env` attachments:** NEVER attach `.env*` files to chat messages.
- **Active editor guard:** If the active editor file path matches `.env` or `.env.*`, do NOT continue with chat/file operations until the user switches to a non-secret file.
- **Sanitize outputs:** If commands return secrets, redact values and show only key names/status.
 - **Local machine (Review only):** The local machine is for review only. All development work must be performed on the Hetzner VM via SSH: `ssh -i ~/.ssh/hetzner_magicwrx root@87.99.128.67`. Do not run development or commit work locally.

## 🚨 Ecosystem Anti-Patterns (Binding — ERR-01 through ERR-10)
> **Full reference:** `DOCs/TOOLS/ECOSYSTEM_CLEAN_CODE_PROTOCOL.md`

| Code | Rule | Never do | Always do |
|------|------|----------|-----------|
| ERR-01 | Dynamic `require.resolve` | `require.resolve(\`${pkg}/...\`)` | `path.join(cwd, 'node_modules', pkg, 'package.json')` + `cwd/../` fallback |
| ERR-02 | Vercel file tracing gap | `readFileSync` on `node_modules/**` without tracing | Add `outputFileTracingIncludes` to `next.config.js` |
| ERR-03 | Hardcoded colors | `text-black`, `bg-white`, `text-gray-*`, any hex in JSX | `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card` |
| ERR-04 | Monorepo CWD mismatch | Assume `cwd/node_modules` = root | Always try both `cwd/node_modules` AND `cwd/../node_modules` |
| ERR-05 | `"type"` field in packages | `"type": "module"` or `"type": "commonjs"` | Omit `"type"` entirely in `@magicwrxtools/*` packages |
| ERR-06 | Token family mixing | `hub-*` classes in SHARED tools or non-ADMIN workspaces | Shadcn tokens everywhere; `hub-*` only in ADMIN JSX |
| ERR-07 | Version not published before consumer update | Merge consumer PR before publishing package | Publish to GitHub Packages FIRST, then update consumer |
| ERR-08 | `file:` paths in lockfile | Commit `package-lock.json` without validating | `wrx validate-lockfile` before every push |
| ERR-09 | FOUC on dark mode | Apply theme in `useEffect` only | Inline `<script>` in `<head>` sets `data-theme` before paint |
| ERR-10 | `always-auth=true` in `.npmrc` | `always-auth=true` | Remove it — deprecated in npm v7+ || ERR-11 | CI `actions/setup-node` token mismatch | Only `NODE_AUTH_TOKEN` in npm ci step | Set BOTH `NODE_AUTH_TOKEN` AND `NPM_TOKEN` from same secret |
| ERR-12 | `^0.0.x` consumer pin blocks upstream fix | Assume `^` reaches `0.0.x → 0.y.0` boundary | Update pin to `^0.y.0` when upstream publishes fix || ERR-13 | Deprecated tooling deps (ESLint v8) | Scaffold with `eslint@^8` | Use `eslint@^9` + flat config for all workspaces |
| ERR-14 | Stale consumer dist after SHARED tool update | Assume tool UI updates when SHARED source changes | After `wrx publish <tool>`: run `npm install @magicwrxtools/<tool>@latest` in each consumer + `rm -rf .next` |