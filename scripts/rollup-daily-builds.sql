-- =====================================================================
-- rollup-daily-builds.sql — PIX.MOV Phase 3 (authored, NOT scheduled)
-- AUTHOR-ONLY: authored under the Belvedere handoff §3.2. Local
-- schedules this (daily, after UTC midnight) against the ship DBWRX
-- database `pix` once the Phase 3 DDL has been applied under the
-- Founder's gate. Nothing here has been run.
-- Recomputes yesterday's (UTC) analytics.daily_builds rows from
-- analytics.events; safe to re-run (upsert on the PK).
-- SESSIONS SEMANTICS (honest): sessions = COUNT(DISTINCT subject_hash)
-- — identified sessions only. Cookieless aggregate events carry no
-- subject_hash by design and count toward events, never sessions.
-- =====================================================================

INSERT INTO analytics.daily_builds (day, build_sha12, sessions, events)
SELECT (occurred_at AT TIME ZONE 'UTC')::date AS day,
       build_sha12,
       COUNT(DISTINCT subject_hash) AS sessions,
       COUNT(*) AS events
  FROM analytics.events
 WHERE occurred_at >= date_trunc('day', now() AT TIME ZONE 'UTC') - interval '1 day'
   AND occurred_at <  date_trunc('day', now() AT TIME ZONE 'UTC')
 GROUP BY 1, 2
ON CONFLICT (day, build_sha12)
DO UPDATE SET sessions = EXCLUDED.sessions, events = EXCLUDED.events;
