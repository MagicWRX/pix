-- =====================================================================
-- gakz/0069_gakz_consent.sql — PIX.MOV Phase 3 (Belvedere handoff, Founder GO 2026-11-05)
-- AUTHOR-ONLY. DO NOT APPLY without a separate Founder GO. No database
-- was touched in the authoring of this file: it was generated from
-- read-only GAKz metadata (2026-11-05) and validated by parse only.
-- Target database: the ship DBWRX database `pix` (unless noted).
-- Target database: GAKz (this file's home) — GAKz is the consent
-- record OF RECORD (§2.4). The ship keeps the operational copy
-- (0072_consent.sql); steward-mediated sync carries decisions here.
-- GAKz DDL goes through the vault path with the Founder present.
-- =====================================================================
-- Consent recorded server-side (§3.1): decisions are append-only —
-- a change writes a NEW row, never an UPDATE. Raw IP is never stored:
-- the server stores sha256(salt | ip) only; the salt lives in the
-- server env (PIX_HASH_SALT) and its rotation is an ops note in the
-- cutover plan (rotating it orphans hash comparisons for pre-rotation
-- rows; hashes are evidence aids, not join keys).
-- NO seed policy row is authored: inventing a policy version is not
-- the Builder's call. The first consent.policy_versions row is the
-- Founder's to publish; until it exists, POST /api/consent answers
-- code 'no_policy_published' and records nothing.

CREATE SCHEMA IF NOT EXISTS consent;

CREATE TABLE IF NOT EXISTS consent.policy_versions (
  version      text PRIMARY KEY,
  effective_at timestamptz NOT NULL,
  summary_url  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent.records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id      text NULL,
  anon_session_id text NULL,
  policy_version  text REFERENCES consent.policy_versions (version),
  essential       boolean NOT NULL DEFAULT true,
  pix_save        boolean NOT NULL DEFAULT false,
  ads             boolean NOT NULL DEFAULT false,
  decided_at      timestamptz NOT NULL DEFAULT now(),
  user_agent_hash text,
  ip_hash         text,
  CONSTRAINT consent_records_subject_required
    CHECK (subject_id IS NOT NULL OR anon_session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_consent_records_subject
  ON consent.records (subject_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_records_anon
  ON consent.records (anon_session_id, decided_at DESC);

-- DOWN-MIGRATION NOTE (authored, not executed): as 0072's, with the
-- same evidence warning — consent.records is never dropped silently.
