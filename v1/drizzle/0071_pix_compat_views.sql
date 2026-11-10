-- =====================================================================
-- 0071_pix_compat_views.sql — PIX.MOV Phase 2 (Belvedere handoff, Founder GO 2026-11-05)
-- AUTHOR-ONLY. DO NOT APPLY without a separate Founder GO. No database
-- was touched in the authoring of this file: it was generated from
-- read-only GAKz metadata (2026-11-05) and validated by parse only.
-- Target database: the ship DBWRX database `pix` (unless noted).
-- Purpose: compatibility views for the cutover (§2.5 step 3). Every
-- moved table gets (a) a view under schema pix_compat, and (b) once
-- its table has left schema pix, a view under its OLD name pix.<t>
-- pointing at pix_user.<t>, so the running app keeps working between
-- cutover steps. Both sets are authored here; (b) is created only
-- when the pix.<t> name is free (guarded below).
-- READ-ONLY is by grant, not by view mechanics: a single-table view
-- is updatable in Postgres. The cutover plan's apply checklist grants
-- SELECT only on these views; do not grant INSERT/UPDATE/DELETE.
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS pix_compat;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'chat_messages') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."chat_messages" AS SELECT * FROM pix_user."chat_messages"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'chat_messages') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."chat_messages" AS SELECT * FROM pix_user."chat_messages"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'chat_threads') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."chat_threads" AS SELECT * FROM pix_user."chat_threads"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'chat_threads') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."chat_threads" AS SELECT * FROM pix_user."chat_threads"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_accounts') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."cine_accounts" AS SELECT * FROM pix_user."cine_accounts"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_accounts') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."cine_accounts" AS SELECT * FROM pix_user."cine_accounts"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_assets') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."cine_assets" AS SELECT * FROM pix_user."cine_assets"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_assets') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."cine_assets" AS SELECT * FROM pix_user."cine_assets"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_chunked_uploads') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."cine_chunked_uploads" AS SELECT * FROM pix_user."cine_chunked_uploads"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_chunked_uploads') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."cine_chunked_uploads" AS SELECT * FROM pix_user."cine_chunked_uploads"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_short_stats') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."cine_short_stats" AS SELECT * FROM pix_user."cine_short_stats"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_short_stats') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."cine_short_stats" AS SELECT * FROM pix_user."cine_short_stats"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_social_profiles') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."cine_social_profiles" AS SELECT * FROM pix_user."cine_social_profiles"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_social_profiles') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."cine_social_profiles" AS SELECT * FROM pix_user."cine_social_profiles"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'cine_upload_parts') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."cine_upload_parts" AS SELECT * FROM pix_user."cine_upload_parts"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_upload_parts') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."cine_upload_parts" AS SELECT * FROM pix_user."cine_upload_parts"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'deployment_snapshots') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."deployment_snapshots" AS SELECT * FROM pix_user."deployment_snapshots"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'deployment_snapshots') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."deployment_snapshots" AS SELECT * FROM pix_user."deployment_snapshots"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'film_dna_events') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."film_dna_events" AS SELECT * FROM pix_user."film_dna_events"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'film_dna_events') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."film_dna_events" AS SELECT * FROM pix_user."film_dna_events"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'film_dna_media_signals') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."film_dna_media_signals" AS SELECT * FROM pix_user."film_dna_media_signals"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'film_dna_media_signals') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."film_dna_media_signals" AS SELECT * FROM pix_user."film_dna_media_signals"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'film_dna_profiles') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."film_dna_profiles" AS SELECT * FROM pix_user."film_dna_profiles"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'film_dna_profiles') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."film_dna_profiles" AS SELECT * FROM pix_user."film_dna_profiles"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'film_dna_queries') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."film_dna_queries" AS SELECT * FROM pix_user."film_dna_queries"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'film_dna_queries') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."film_dna_queries" AS SELECT * FROM pix_user."film_dna_queries"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'notes') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."notes" AS SELECT * FROM pix_user."notes"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'notes') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."notes" AS SELECT * FROM pix_user."notes"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_actor_votes') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_actor_votes" AS SELECT * FROM pix_user."pix_actor_votes"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_actor_votes') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_actor_votes" AS SELECT * FROM pix_user."pix_actor_votes"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_fan_type_events') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_fan_type_events" AS SELECT * FROM pix_user."pix_fan_type_events"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_fan_type_events') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_fan_type_events" AS SELECT * FROM pix_user."pix_fan_type_events"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_fan_type_states') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_fan_type_states" AS SELECT * FROM pix_user."pix_fan_type_states"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_fan_type_states') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_fan_type_states" AS SELECT * FROM pix_user."pix_fan_type_states"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_feedback') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_feedback" AS SELECT * FROM pix_user."pix_feedback"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_feedback') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_feedback" AS SELECT * FROM pix_user."pix_feedback"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_game_results') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_game_results" AS SELECT * FROM pix_user."pix_game_results"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_game_results') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_game_results" AS SELECT * FROM pix_user."pix_game_results"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_movie_posts') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_movie_posts" AS SELECT * FROM pix_user."pix_movie_posts"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_movie_posts') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_movie_posts" AS SELECT * FROM pix_user."pix_movie_posts"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_movie_review_scores') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_movie_review_scores" AS SELECT * FROM pix_user."pix_movie_review_scores"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_movie_review_scores') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_movie_review_scores" AS SELECT * FROM pix_user."pix_movie_review_scores"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_movie_unseen') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_movie_unseen" AS SELECT * FROM pix_user."pix_movie_unseen"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_movie_unseen') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_movie_unseen" AS SELECT * FROM pix_user."pix_movie_unseen"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_movie_votes') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_movie_votes" AS SELECT * FROM pix_user."pix_movie_votes"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_movie_votes') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_movie_votes" AS SELECT * FROM pix_user."pix_movie_votes"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_profiles') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_profiles" AS SELECT * FROM pix_user."pix_profiles"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_profiles') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_profiles" AS SELECT * FROM pix_user."pix_profiles"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_signup_challenges') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_signup_challenges" AS SELECT * FROM pix_user."pix_signup_challenges"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_signup_challenges') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_signup_challenges" AS SELECT * FROM pix_user."pix_signup_challenges"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_tough_shares') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_tough_shares" AS SELECT * FROM pix_user."pix_tough_shares"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_tough_shares') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_tough_shares" AS SELECT * FROM pix_user."pix_tough_shares"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_trending') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_trending" AS SELECT * FROM pix_user."pix_trending"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_trending') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_trending" AS SELECT * FROM pix_user."pix_trending"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_trending_runs') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_trending_runs" AS SELECT * FROM pix_user."pix_trending_runs"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_trending_runs') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_trending_runs" AS SELECT * FROM pix_user."pix_trending_runs"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_user_fan_types') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_user_fan_types" AS SELECT * FROM pix_user."pix_user_fan_types"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_user_fan_types') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_user_fan_types" AS SELECT * FROM pix_user."pix_user_fan_types"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_user_library') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_user_library" AS SELECT * FROM pix_user."pix_user_library"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_user_library') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_user_library" AS SELECT * FROM pix_user."pix_user_library"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_user_list_items') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_user_list_items" AS SELECT * FROM pix_user."pix_user_list_items"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_user_list_items') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_user_list_items" AS SELECT * FROM pix_user."pix_user_list_items"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_user_lists') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_user_lists" AS SELECT * FROM pix_user."pix_user_lists"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_user_lists') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_user_lists" AS SELECT * FROM pix_user."pix_user_lists"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'user_dna_strands') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."user_dna_strands" AS SELECT * FROM pix_user."user_dna_strands"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'user_dna_strands') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."user_dna_strands" AS SELECT * FROM pix_user."user_dna_strands"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'dice_chunks') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."dice_chunks" AS SELECT * FROM pix_user."dice_chunks"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'dice_chunks') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."dice_chunks" AS SELECT * FROM pix_user."dice_chunks"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'dice_jobs') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."dice_jobs" AS SELECT * FROM pix_user."dice_jobs"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'dice_jobs') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."dice_jobs" AS SELECT * FROM pix_user."dice_jobs"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_cine_bin') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_cine_bin" AS SELECT * FROM pix_user."pix_cine_bin"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_cine_bin') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_cine_bin" AS SELECT * FROM pix_user."pix_cine_bin"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_reviews') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_reviews" AS SELECT * FROM pix_user."pix_reviews"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_reviews') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_reviews" AS SELECT * FROM pix_user."pix_reviews"';
    END IF;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix_user'::regnamespace AND relname = 'pix_tough_picks') THEN
    EXECUTE 'CREATE OR REPLACE VIEW pix_compat."pix_tough_picks" AS SELECT * FROM pix_user."pix_tough_picks"';
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_tough_picks') THEN
      EXECUTE 'CREATE OR REPLACE VIEW pix."pix_tough_picks" AS SELECT * FROM pix_user."pix_tough_picks"';
    END IF;
  END IF;
END $$;

-- DOWN-MIGRATION NOTE (authored, not executed): DROP VIEW IF EXISTS
-- pix."<t>" and pix_compat."<t>" for each moved table (only the views
-- this file created), then DROP SCHEMA IF EXISTS pix_compat. At full
-- rollback the views come down BEFORE the tables move back (0069's
-- down note), so no name ever collides.
