-- =====================================================================
-- gakz/0070_gakz_analytics_rollups.sql — PIX.MOV Phase 3 (Belvedere handoff, Founder GO 2026-11-05)
-- AUTHOR-ONLY. DO NOT APPLY without a separate Founder GO. No database
-- was touched in the authoring of this file: it was generated from
-- read-only GAKz metadata (2026-11-05) and validated by parse only.
-- Target database: the ship DBWRX database `pix` (unless noted).
-- Target database: GAKz. §2.4: analytics rollups are RECEIVED here
-- from Local; raw events stay on the Local host and are never synced.
-- So this file carries daily_builds only, as the receive-side table
-- for the steward-mediated up-sync of rollups.
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.daily_builds (
  day         date NOT NULL,
  build_sha12 text NOT NULL,
  sessions    integer NOT NULL DEFAULT 0,
  events      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, build_sha12)
);

-- DOWN-MIGRATION NOTE (authored, not executed):
--   DROP TABLE IF EXISTS analytics.daily_builds;
--   DROP SCHEMA IF EXISTS analytics;  -- only if this file created it
