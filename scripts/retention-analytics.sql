-- =====================================================================
-- retention-analytics.sql — PIX.MOV Phase 3 (authored, NOT scheduled)
-- AUTHOR-ONLY: authored under the Belvedere handoff §3.2. Local
-- schedules this (daily) against the ship DBWRX database `pix` once
-- the Phase 3 DDL has been applied under the Founder's gate.
-- Policy: raw events retained 90 days; rollups (analytics.daily_builds)
-- retained indefinitely — this script never touches daily_builds.
-- =====================================================================

-- The default partition is a normal table under the partitioned
-- parent, so one DELETE covers every partition that exists; if Local
-- later stands up monthly partitions, dropping an expired partition
-- outright is the faster equivalent and is Local's ops choice.
DELETE FROM analytics.events
 WHERE occurred_at < now() - interval '90 days';
