-- =====================================================================
-- 0070_pix_user_watermarks.sql — PIX.MOV Phase 2 (Belvedere handoff, Founder GO 2026-11-05)
-- AUTHOR-ONLY. DO NOT APPLY without a separate Founder GO. No database
-- was touched in the authoring of this file: it was generated from
-- read-only GAKz metadata (2026-11-05) and validated by parse only.
-- Target database: the ship DBWRX database `pix` (unless noted).
-- Purpose: the up-sync watermark on every pix_user table (handoff
-- §2.3 rule 2) + replay-safe idempotency keys on the append-only
-- tables (rule 3).
-- WATERMARK TYPE — FOUNDER RULING 2026-11-05 (option B, convert to
-- date stamps): updated_at is timestamptz on EVERY pix_user table.
-- This overrules the first authoring pass of this file, which kept
-- bigint epoch-milliseconds to match the schema's existing
-- convention. Under the ruling:
--   * the 15 user tables that already carry updated_at as bigint
--     epoch ms convert in place, guarded on the column still being
--     bigint so a re-run is a no-op:
--       ALTER COLUMN updated_at TYPE timestamptz
--       USING to_timestamp(updated_at / 1000.0)
--   * the 18 user tables without updated_at gain it directly as
--     timestamptz NOT NULL DEFAULT now();
--   * the 5 app-only tables get the same guarded add-or-convert;
--   * the shared trigger sets NEW.updated_at := now().
-- The conversion executes at cutover, inside the per-schema
-- transaction (see PHASE-2-CUTOVER-PLAN.md), under the separate
-- application GO — never piecemeal: a mixed-type watermark breaks
-- the up-sync comparison, the exact failure the first pass avoided
-- by staying bigint.
-- SCOPE OF THE RULING: updated_at ONLY. created_at is NOT
-- converted — it stays bigint epoch ms everywhere in this pass,
-- exactly as the application writes it (Date.now()). The
-- idempotency indexes below ride on created_at and are unchanged.
-- Converting created_at too is a separate Founder decision.
-- CUTOVER PREREQUISITE (flagged in the plan): the application
-- writes updated_at explicitly (epoch-ms numbers) in its
-- INSERT/UPDATE paths today. From the moment this conversion
-- applies, those write sites must stop supplying updated_at — the
-- column DEFAULT now() covers inserts, the trigger covers
-- updates — in the same maintenance window. An epoch-ms number
-- written into a timestamptz column errors; it does not coerce.
-- =====================================================================
-- One shared trigger function for the whole pix_user schema.
CREATE OR REPLACE FUNCTION pix_user.maintain_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- --- Watermark column + trigger on the 33 user-write tables ---
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'chat_messages') THEN
    EXECUTE 'ALTER TABLE pix_user."chat_messages" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_chat_messages_updated_at ON pix_user."chat_messages"';
    EXECUTE 'CREATE TRIGGER trg_chat_messages_updated_at BEFORE UPDATE ON pix_user."chat_messages" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'chat_threads') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'chat_threads' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."chat_threads" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."chat_threads" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_chat_threads_updated_at ON pix_user."chat_threads"';
    EXECUTE 'CREATE TRIGGER trg_chat_threads_updated_at BEFORE UPDATE ON pix_user."chat_threads" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_accounts') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'cine_accounts' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."cine_accounts" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."cine_accounts" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_cine_accounts_updated_at ON pix_user."cine_accounts"';
    EXECUTE 'CREATE TRIGGER trg_cine_accounts_updated_at BEFORE UPDATE ON pix_user."cine_accounts" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_assets') THEN
    EXECUTE 'ALTER TABLE pix_user."cine_assets" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_cine_assets_updated_at ON pix_user."cine_assets"';
    EXECUTE 'CREATE TRIGGER trg_cine_assets_updated_at BEFORE UPDATE ON pix_user."cine_assets" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_chunked_uploads') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'cine_chunked_uploads' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."cine_chunked_uploads" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."cine_chunked_uploads" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_cine_chunked_uploads_updated_at ON pix_user."cine_chunked_uploads"';
    EXECUTE 'CREATE TRIGGER trg_cine_chunked_uploads_updated_at BEFORE UPDATE ON pix_user."cine_chunked_uploads" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_short_stats') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'cine_short_stats' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."cine_short_stats" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."cine_short_stats" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_cine_short_stats_updated_at ON pix_user."cine_short_stats"';
    EXECUTE 'CREATE TRIGGER trg_cine_short_stats_updated_at BEFORE UPDATE ON pix_user."cine_short_stats" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_social_profiles') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'cine_social_profiles' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."cine_social_profiles" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."cine_social_profiles" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_cine_social_profiles_updated_at ON pix_user."cine_social_profiles"';
    EXECUTE 'CREATE TRIGGER trg_cine_social_profiles_updated_at BEFORE UPDATE ON pix_user."cine_social_profiles" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_upload_parts') THEN
    EXECUTE 'ALTER TABLE pix_user."cine_upload_parts" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_cine_upload_parts_updated_at ON pix_user."cine_upload_parts"';
    EXECUTE 'CREATE TRIGGER trg_cine_upload_parts_updated_at BEFORE UPDATE ON pix_user."cine_upload_parts" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'deployment_snapshots') THEN
    EXECUTE 'ALTER TABLE pix_user."deployment_snapshots" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_deployment_snapshots_updated_at ON pix_user."deployment_snapshots"';
    EXECUTE 'CREATE TRIGGER trg_deployment_snapshots_updated_at BEFORE UPDATE ON pix_user."deployment_snapshots" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'film_dna_events') THEN
    EXECUTE 'ALTER TABLE pix_user."film_dna_events" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_film_dna_events_updated_at ON pix_user."film_dna_events"';
    EXECUTE 'CREATE TRIGGER trg_film_dna_events_updated_at BEFORE UPDATE ON pix_user."film_dna_events" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'film_dna_media_signals') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'film_dna_media_signals' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."film_dna_media_signals" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."film_dna_media_signals" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_film_dna_media_signals_updated_at ON pix_user."film_dna_media_signals"';
    EXECUTE 'CREATE TRIGGER trg_film_dna_media_signals_updated_at BEFORE UPDATE ON pix_user."film_dna_media_signals" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'film_dna_profiles') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'film_dna_profiles' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."film_dna_profiles" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."film_dna_profiles" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_film_dna_profiles_updated_at ON pix_user."film_dna_profiles"';
    EXECUTE 'CREATE TRIGGER trg_film_dna_profiles_updated_at BEFORE UPDATE ON pix_user."film_dna_profiles" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'film_dna_queries') THEN
    EXECUTE 'ALTER TABLE pix_user."film_dna_queries" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_film_dna_queries_updated_at ON pix_user."film_dna_queries"';
    EXECUTE 'CREATE TRIGGER trg_film_dna_queries_updated_at BEFORE UPDATE ON pix_user."film_dna_queries" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'notes') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'notes' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."notes" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."notes" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_notes_updated_at ON pix_user."notes"';
    EXECUTE 'CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON pix_user."notes" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_actor_votes') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_actor_votes" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_actor_votes_updated_at ON pix_user."pix_actor_votes"';
    EXECUTE 'CREATE TRIGGER trg_pix_actor_votes_updated_at BEFORE UPDATE ON pix_user."pix_actor_votes" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_fan_type_events') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_fan_type_events" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_fan_type_events_updated_at ON pix_user."pix_fan_type_events"';
    EXECUTE 'CREATE TRIGGER trg_pix_fan_type_events_updated_at BEFORE UPDATE ON pix_user."pix_fan_type_events" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_fan_type_states') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'pix_fan_type_states' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."pix_fan_type_states" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."pix_fan_type_states" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_fan_type_states_updated_at ON pix_user."pix_fan_type_states"';
    EXECUTE 'CREATE TRIGGER trg_pix_fan_type_states_updated_at BEFORE UPDATE ON pix_user."pix_fan_type_states" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_feedback') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_feedback" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_feedback_updated_at ON pix_user."pix_feedback"';
    EXECUTE 'CREATE TRIGGER trg_pix_feedback_updated_at BEFORE UPDATE ON pix_user."pix_feedback" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_game_results') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_game_results" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_game_results_updated_at ON pix_user."pix_game_results"';
    EXECUTE 'CREATE TRIGGER trg_pix_game_results_updated_at BEFORE UPDATE ON pix_user."pix_game_results" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_movie_posts') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'pix_movie_posts' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."pix_movie_posts" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."pix_movie_posts" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_movie_posts_updated_at ON pix_user."pix_movie_posts"';
    EXECUTE 'CREATE TRIGGER trg_pix_movie_posts_updated_at BEFORE UPDATE ON pix_user."pix_movie_posts" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_movie_review_scores') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'pix_movie_review_scores' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."pix_movie_review_scores" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."pix_movie_review_scores" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_movie_review_scores_updated_at ON pix_user."pix_movie_review_scores"';
    EXECUTE 'CREATE TRIGGER trg_pix_movie_review_scores_updated_at BEFORE UPDATE ON pix_user."pix_movie_review_scores" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_movie_unseen') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_movie_unseen" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_movie_unseen_updated_at ON pix_user."pix_movie_unseen"';
    EXECUTE 'CREATE TRIGGER trg_pix_movie_unseen_updated_at BEFORE UPDATE ON pix_user."pix_movie_unseen" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_movie_votes') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_movie_votes" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_movie_votes_updated_at ON pix_user."pix_movie_votes"';
    EXECUTE 'CREATE TRIGGER trg_pix_movie_votes_updated_at BEFORE UPDATE ON pix_user."pix_movie_votes" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_profiles') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'pix_profiles' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."pix_profiles" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."pix_profiles" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_profiles_updated_at ON pix_user."pix_profiles"';
    EXECUTE 'CREATE TRIGGER trg_pix_profiles_updated_at BEFORE UPDATE ON pix_user."pix_profiles" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_signup_challenges') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_signup_challenges" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_signup_challenges_updated_at ON pix_user."pix_signup_challenges"';
    EXECUTE 'CREATE TRIGGER trg_pix_signup_challenges_updated_at BEFORE UPDATE ON pix_user."pix_signup_challenges" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_tough_shares') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_tough_shares" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_tough_shares_updated_at ON pix_user."pix_tough_shares"';
    EXECUTE 'CREATE TRIGGER trg_pix_tough_shares_updated_at BEFORE UPDATE ON pix_user."pix_tough_shares" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_trending') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_trending" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_trending_updated_at ON pix_user."pix_trending"';
    EXECUTE 'CREATE TRIGGER trg_pix_trending_updated_at BEFORE UPDATE ON pix_user."pix_trending" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_trending_runs') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_trending_runs" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_trending_runs_updated_at ON pix_user."pix_trending_runs"';
    EXECUTE 'CREATE TRIGGER trg_pix_trending_runs_updated_at BEFORE UPDATE ON pix_user."pix_trending_runs" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_user_fan_types') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'pix_user_fan_types' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."pix_user_fan_types" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."pix_user_fan_types" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_user_fan_types_updated_at ON pix_user."pix_user_fan_types"';
    EXECUTE 'CREATE TRIGGER trg_pix_user_fan_types_updated_at BEFORE UPDATE ON pix_user."pix_user_fan_types" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_user_library') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_user_library" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_user_library_updated_at ON pix_user."pix_user_library"';
    EXECUTE 'CREATE TRIGGER trg_pix_user_library_updated_at BEFORE UPDATE ON pix_user."pix_user_library" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_user_list_items') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_user_list_items" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_user_list_items_updated_at ON pix_user."pix_user_list_items"';
    EXECUTE 'CREATE TRIGGER trg_pix_user_list_items_updated_at BEFORE UPDATE ON pix_user."pix_user_list_items" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_user_lists') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'pix_user_lists' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."pix_user_lists" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."pix_user_lists" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_user_lists_updated_at ON pix_user."pix_user_lists"';
    EXECUTE 'CREATE TRIGGER trg_pix_user_lists_updated_at BEFORE UPDATE ON pix_user."pix_user_lists" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'user_dna_strands') THEN
    -- column already present as bigint epoch ms (GAKz metadata 2026-11-05): convert per the Founder ruling; trigger is new
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'user_dna_strands' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."user_dna_strands" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'ALTER TABLE pix_user."user_dna_strands" ALTER COLUMN updated_at SET DEFAULT now()';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_user_dna_strands_updated_at ON pix_user."user_dna_strands"';
    EXECUTE 'CREATE TRIGGER trg_user_dna_strands_updated_at BEFORE UPDATE ON pix_user."user_dna_strands" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;

-- --- Same treatment for the 5 app-only tables, when present ---
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'dice_chunks') THEN
    EXECUTE 'ALTER TABLE pix_user."dice_chunks" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'dice_chunks' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."dice_chunks" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'DROP TRIGGER IF EXISTS trg_dice_chunks_updated_at ON pix_user."dice_chunks"';
    EXECUTE 'CREATE TRIGGER trg_dice_chunks_updated_at BEFORE UPDATE ON pix_user."dice_chunks" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'dice_jobs') THEN
    EXECUTE 'ALTER TABLE pix_user."dice_jobs" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'dice_jobs' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."dice_jobs" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'DROP TRIGGER IF EXISTS trg_dice_jobs_updated_at ON pix_user."dice_jobs"';
    EXECUTE 'CREATE TRIGGER trg_dice_jobs_updated_at BEFORE UPDATE ON pix_user."dice_jobs" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_cine_bin') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_cine_bin" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'pix_cine_bin' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."pix_cine_bin" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_cine_bin_updated_at ON pix_user."pix_cine_bin"';
    EXECUTE 'CREATE TRIGGER trg_pix_cine_bin_updated_at BEFORE UPDATE ON pix_user."pix_cine_bin" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_reviews') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_reviews" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'pix_reviews' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."pix_reviews" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_reviews_updated_at ON pix_user."pix_reviews"';
    EXECUTE 'CREATE TRIGGER trg_pix_reviews_updated_at BEFORE UPDATE ON pix_user."pix_reviews" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_tough_picks') THEN
    EXECUTE 'ALTER TABLE pix_user."pix_tough_picks" ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'pix_user' AND table_name = 'pix_tough_picks' AND column_name = 'updated_at' AND data_type = 'bigint') THEN
      EXECUTE 'ALTER TABLE pix_user."pix_tough_picks" ALTER COLUMN updated_at TYPE timestamptz USING to_timestamp(updated_at / 1000.0)';
    END IF;
    EXECUTE 'DROP TRIGGER IF EXISTS trg_pix_tough_picks_updated_at ON pix_user."pix_tough_picks"';
    EXECUTE 'CREATE TRIGGER trg_pix_tough_picks_updated_at BEFORE UPDATE ON pix_user."pix_tough_picks" FOR EACH ROW EXECUTE FUNCTION pix_user.maintain_updated_at()';
  END IF;
END $$;

-- --- Idempotency keys on the append-only tables (rule 3) ---
-- Key shape per table, from its real columns: (subject, object,
-- action, occurred_at). occurred_at is the table's created_at —
-- bigint epoch ms in this schema; there is no separate occurred_at
-- column. Replay is safe only when the writer replays the ORIGINAL
-- created_at; writers that stamp a fresh created_at on retry defeat
-- the key (flagged in the plan). Nullable key columns use
-- NULLS NOT DISTINCT (Postgres 15+) so NULL objects still dedupe.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'film_dna_events') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_film_dna_events_idem ON pix_user.film_dna_events (user_id, signal_type, primary_imdb_id, secondary_imdb_id, created_at) NULLS NOT DISTINCT';
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_fan_type_events') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_pix_fan_type_events_idem ON pix_user.pix_fan_type_events (user_id, signal_type, primary_imdb_id, secondary_imdb_id, created_at) NULLS NOT DISTINCT';
  END IF;
END $$;
-- pix_game_results has no subject column: (action, object pair, occurred_at) is its closest natural key.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_game_results') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_pix_game_results_idem ON pix_user.pix_game_results (game_key, winner_imdb_id, loser_imdb_id, created_at)';
  END IF;
END $$;
-- pix_movie_votes has no subject column (anonymous by design): (object pair, occurred_at) is its closest natural key.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_movie_votes') THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS ux_pix_movie_votes_idem ON pix_user.pix_movie_votes (winner_imdb_id, loser_imdb_id, created_at)';
  END IF;
END $$;
-- pix_movie_unseen: NO index authored. Its primary key is (imdb_id)
-- alone, so the table is already insert-once on its natural key;
-- a second unique index would only duplicate the PK.

-- DOWN-MIGRATION NOTE (authored, not executed): drop the four
-- ux_*_idem indexes, drop each trg_<table>_updated_at trigger, drop
-- function pix_user.maintain_updated_at. To reverse the watermark
-- type conversion itself: on each table that carried updated_at as
-- bigint, ALTER TABLE pix_user.<t> ALTER COLUMN updated_at TYPE
-- bigint USING (extract(epoch FROM updated_at) * 1000)::bigint and
-- ALTER COLUMN updated_at DROP DEFAULT (the pre-ruling columns had
-- no default), then restore the epoch-ms body of
-- pix_user.maintain_updated_at if the triggers are kept. The added
-- updated_at columns on the 18 tables that lacked one are NOT
-- dropped on rollback: they carry watermark history once the
-- up-sync runs.
