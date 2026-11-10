-- =====================================================================
-- 0069_pix_user_moves.sql — PIX.MOV Phase 2 (Belvedere handoff, Founder GO 2026-11-05)
-- AUTHOR-ONLY. DO NOT APPLY without a separate Founder GO. No database
-- was touched in the authoring of this file: it was generated from
-- read-only GAKz metadata (2026-11-05) and validated by parse only.
-- Target database: the ship DBWRX database `pix` (unless noted).
-- Purpose: create schema pix_user; drop the cross-boundary foreign keys
-- (user -> catalog, handoff §2.3 rule 1: references become by-value);
-- move the 33 user-write tables out of schema pix into pix_user.
-- The 9 foreign keys BETWEEN user tables move with their tables and
-- stay valid. The 8 catalog->catalog FKs are untouched. Sequences owned
-- by moved tables follow them (Postgres SET SCHEMA behaviour).
-- The 5 app-only tables live only in the ship's pix2 schema, which the
-- authoring side cannot read: their moves are guarded DO blocks that
-- take each table from pix or pix2, whichever holds it, and skip
-- silently if it is absent (flagged in PHASE-2-CUTOVER-PLAN.md).
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS pix_user;

-- --- Step 1: drop the 11 cross-boundary FKs (user -> catalog) ---
ALTER TABLE pix.film_dna_media_signals DROP CONSTRAINT IF EXISTS fk_film_dna_media_signals_0;  -- was: FOREIGN KEY (imdb_id) REFERENCES pix.pix_movie_stats(imdb_id) ON DELETE CASCADE
ALTER TABLE pix.pix_actor_votes DROP CONSTRAINT IF EXISTS fk_pix_actor_votes_0;  -- was: FOREIGN KEY (loser_qid) REFERENCES pix.pix_actors(qid) ON DELETE CASCADE
ALTER TABLE pix.pix_actor_votes DROP CONSTRAINT IF EXISTS fk_pix_actor_votes_1;  -- was: FOREIGN KEY (winner_qid) REFERENCES pix.pix_actors(qid) ON DELETE CASCADE
ALTER TABLE pix.pix_movie_posts DROP CONSTRAINT IF EXISTS fk_pix_movie_posts_1;  -- was: FOREIGN KEY (imdb_id) REFERENCES pix.pix_movie_stats(imdb_id) ON DELETE CASCADE
ALTER TABLE pix.pix_movie_review_scores DROP CONSTRAINT IF EXISTS fk_pix_movie_review_scores_0;  -- was: FOREIGN KEY (imdb_id) REFERENCES pix.pix_movie_stats(imdb_id) ON DELETE CASCADE
ALTER TABLE pix.pix_tough_shares DROP CONSTRAINT IF EXISTS fk_pix_tough_shares_0;  -- was: FOREIGN KEY (right_imdb_id) REFERENCES pix.pix_movie_stats(imdb_id) ON DELETE CASCADE
ALTER TABLE pix.pix_tough_shares DROP CONSTRAINT IF EXISTS fk_pix_tough_shares_1;  -- was: FOREIGN KEY (left_imdb_id) REFERENCES pix.pix_movie_stats(imdb_id) ON DELETE CASCADE
ALTER TABLE pix.pix_trending DROP CONSTRAINT IF EXISTS fk_pix_trending_0;  -- was: FOREIGN KEY (imdb_id) REFERENCES pix.pix_movie_stats(imdb_id) ON DELETE CASCADE
ALTER TABLE pix.pix_user_fan_types DROP CONSTRAINT IF EXISTS fk_pix_user_fan_types_0;  -- was: FOREIGN KEY (type_key) REFERENCES pix.pix_fan_types(type_key) ON DELETE CASCADE
ALTER TABLE pix.pix_user_library DROP CONSTRAINT IF EXISTS fk_pix_user_library_0;  -- was: FOREIGN KEY (imdb_id) REFERENCES pix.pix_movie_stats(imdb_id) ON DELETE CASCADE
ALTER TABLE pix.pix_user_list_items DROP CONSTRAINT IF EXISTS fk_pix_user_list_items_0;  -- was: FOREIGN KEY (imdb_id) REFERENCES pix.pix_movie_stats(imdb_id) ON DELETE CASCADE

-- --- Step 2: move the 33 user-write tables pix -> pix_user ---
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'chat_messages') THEN
    ALTER TABLE pix."chat_messages" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'chat_threads') THEN
    ALTER TABLE pix."chat_threads" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_accounts') THEN
    ALTER TABLE pix."cine_accounts" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_assets') THEN
    ALTER TABLE pix."cine_assets" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_chunked_uploads') THEN
    ALTER TABLE pix."cine_chunked_uploads" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_short_stats') THEN
    ALTER TABLE pix."cine_short_stats" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_social_profiles') THEN
    ALTER TABLE pix."cine_social_profiles" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'cine_upload_parts') THEN
    ALTER TABLE pix."cine_upload_parts" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'deployment_snapshots') THEN
    ALTER TABLE pix."deployment_snapshots" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'film_dna_events') THEN
    ALTER TABLE pix."film_dna_events" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'film_dna_media_signals') THEN
    ALTER TABLE pix."film_dna_media_signals" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'film_dna_profiles') THEN
    ALTER TABLE pix."film_dna_profiles" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'film_dna_queries') THEN
    ALTER TABLE pix."film_dna_queries" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'notes') THEN
    ALTER TABLE pix."notes" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_actor_votes') THEN
    ALTER TABLE pix."pix_actor_votes" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_fan_type_events') THEN
    ALTER TABLE pix."pix_fan_type_events" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_fan_type_states') THEN
    ALTER TABLE pix."pix_fan_type_states" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_feedback') THEN
    ALTER TABLE pix."pix_feedback" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_game_results') THEN
    ALTER TABLE pix."pix_game_results" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_movie_posts') THEN
    ALTER TABLE pix."pix_movie_posts" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_movie_review_scores') THEN
    ALTER TABLE pix."pix_movie_review_scores" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_movie_unseen') THEN
    ALTER TABLE pix."pix_movie_unseen" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_movie_votes') THEN
    ALTER TABLE pix."pix_movie_votes" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_profiles') THEN
    ALTER TABLE pix."pix_profiles" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_signup_challenges') THEN
    ALTER TABLE pix."pix_signup_challenges" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_tough_shares') THEN
    ALTER TABLE pix."pix_tough_shares" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_trending') THEN
    ALTER TABLE pix."pix_trending" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_trending_runs') THEN
    ALTER TABLE pix."pix_trending_runs" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_user_fan_types') THEN
    ALTER TABLE pix."pix_user_fan_types" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_user_library') THEN
    ALTER TABLE pix."pix_user_library" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_user_list_items') THEN
    ALTER TABLE pix."pix_user_list_items" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_user_lists') THEN
    ALTER TABLE pix."pix_user_lists" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'user_dna_strands') THEN
    ALTER TABLE pix."user_dna_strands" SET SCHEMA pix_user;
  END IF;
END $$;

-- --- Step 3: move the 5 app-only tables (guarded; source schema unreadable at authoring) ---
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'dice_chunks') THEN
    ALTER TABLE pix."dice_chunks" SET SCHEMA pix_user;
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix2'::regnamespace AND relname = 'dice_chunks') THEN
    ALTER TABLE pix2."dice_chunks" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'dice_jobs') THEN
    ALTER TABLE pix."dice_jobs" SET SCHEMA pix_user;
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix2'::regnamespace AND relname = 'dice_jobs') THEN
    ALTER TABLE pix2."dice_jobs" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_cine_bin') THEN
    ALTER TABLE pix."pix_cine_bin" SET SCHEMA pix_user;
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix2'::regnamespace AND relname = 'pix_cine_bin') THEN
    ALTER TABLE pix2."pix_cine_bin" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_reviews') THEN
    ALTER TABLE pix."pix_reviews" SET SCHEMA pix_user;
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix2'::regnamespace AND relname = 'pix_reviews') THEN
    ALTER TABLE pix2."pix_reviews" SET SCHEMA pix_user;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix'::regnamespace AND relname = 'pix_tough_picks') THEN
    ALTER TABLE pix."pix_tough_picks" SET SCHEMA pix_user;
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'pix2'::regnamespace AND relname = 'pix_tough_picks') THEN
    ALTER TABLE pix2."pix_tough_picks" SET SCHEMA pix_user;
  END IF;
END $$;

-- DOWN-MIGRATION NOTE (authored, not executed): move each table back
-- (ALTER TABLE pix_user."<t>" SET SCHEMA pix;) in reverse order, then
-- re-add the 11 cross-boundary FKs exactly as recorded in Step 1's
-- comments, then DROP SCHEMA pix_user. The app-only tables return to
-- whichever schema they were taken from — record that at apply time.
