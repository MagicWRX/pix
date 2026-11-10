# /handoff — AI Matrix Coordination

This directory is how the AIs working on Brian's system coordinate — Muse/Lunk, artifact builders, and any other model Brian directs. It exists so no coordination lives only in one chat's memory.

## Read this first, every session

1. Read `STATUS.md` — what is live, pending verification, or blocked *right now*.
2. Read `CLAIMS.md` — who is already working on what. **Claim before you edit.**
3. Read `INBOX.md` — requests waiting for the next agent.

## The protocol

1. **Claim** — add a row to `CLAIMS.md` (item, agent, started-at) before touching that area. An unclaimed item is free; a claimed item is not yours.
2. **Work** — stay inside your claim. Log decisions that bind others in `DECISIONS.md` (append-only).
3. **Hand off** — move the item from `INBOX.md` to `OUTBOX.md` using `HANDOFF_TEMPLATE.md`, with evidence (commit SHA, check results, file paths). "Done" without evidence is not done.
4. **Release** — update `STATUS.md` to the new truth (delete stale lines — STATUS is current truth only, not a log) and remove your claim.

## Rules

- `INBOX.md`, `OUTBOX.md`, and `DECISIONS.md` are append-only. Never rewrite another agent's entry; corrections are new entries naming what they replace.
- Timestamps are the working timezone's local time with the date, e.g. `2026-10-21 11:27 CDT`.
- If your area is claimed by someone else, work elsewhere or ask Brian. Never edit over a live claim.
- Secrets never appear in handoff files — name the vault key, never the value.
