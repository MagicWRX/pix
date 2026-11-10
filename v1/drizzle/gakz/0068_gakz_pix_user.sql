-- =====================================================================
-- gakz/0068_gakz_pix_user.sql — PIX.MOV Phase 2 (Belvedere handoff, Founder GO 2026-11-05)
-- AUTHOR-ONLY. DO NOT APPLY without a separate Founder GO. No database
-- was touched in the authoring of this file: it was generated from
-- read-only GAKz metadata (2026-11-05) and validated by parse only.
-- Target database: the ship DBWRX database `pix` (unless noted).
-- Target database: GAKz. The GAKz counterpart of the ship's pix_user
-- (§2.4): the up-sync TARGET for the 33 user-write tables — same
-- columns and primary keys as pix.<table> of record, plus synced_at
-- (when the row last arrived up). No foreign keys: the boundary rule
-- (§2.3 rule 1) holds on this side too; references are by value.
-- Column defaults are reproduced verbatim from GAKz metadata:
-- sequence defaults (nextval('pix.<...>_seq')) point at the pix
-- schema's sequences of record, which exist in GAKz. Identity /
-- generated-column definitions, if any ever appear on the pix side,
-- follow the pix table of record and must be reconciled at apply.
-- GAKz DDL goes through the vault path with the Founder present.
-- WATERMARK TYPE — FOUNDER RULING 2026-11-05 (option B, convert to
-- date stamps): updated_at on these TARGET tables is timestamptz,
-- even though the GAKz `pix` source tables still carry it as
-- bigint epoch ms — the sources are NOT changed by this file or
-- the ruling. The up-sync converts on write
-- (to_timestamp(v / 1000.0)) when landing rows here. All 33 target
-- tables carry the column: the 15 whose sources have updated_at
-- mirror it with the type converted; the 18 whose sources lack it
-- gain it here, because the ship-side pix_user tables gain it in
-- 0070 at cutover and the up-sync needs somewhere to land it.
-- synced_at stays timestamptz.
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS pix_user;

CREATE TABLE IF NOT EXISTS pix_user."chat_messages" (
  "id" bigint DEFAULT nextval('pix.chat_messages_id_seq'::regclass) NOT NULL,
  "thread_id" bigint NOT NULL,
  "sender" text NOT NULL,
  "body" text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."chat_threads" (
  "id" bigint DEFAULT nextval('pix.chat_threads_id_seq'::regclass) NOT NULL,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."cine_accounts" (
  "id" bigint DEFAULT nextval('pix.cine_accounts_id_seq'::regclass) NOT NULL,
  "plan" text DEFAULT 'free'::text NOT NULL,
  "quota_bytes" bigint DEFAULT 500000000 NOT NULL,
  "stripe_session_id" text,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."cine_assets" (
  "id" bigint DEFAULT nextval('pix.cine_assets_id_seq'::regclass) NOT NULL,
  "name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" bigint NOT NULL,
  "storage_key" text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "created_at" bigint NOT NULL,
  "duration_seconds" bigint,
  "thumbnail_url" text DEFAULT ''::text NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."cine_chunked_uploads" (
  "id" text NOT NULL,
  "asset_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "total_size_bytes" bigint NOT NULL,
  "total_chunks" bigint NOT NULL,
  "duration_seconds" bigint,
  "received_chunks" text DEFAULT '[]'::text NOT NULL,
  "status" text DEFAULT 'uploading'::text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."cine_short_stats" (
  "asset_id" bigint DEFAULT nextval('pix.cine_short_stats_asset_id_seq'::regclass) NOT NULL,
  "views" bigint DEFAULT 0 NOT NULL,
  "plays" bigint DEFAULT 0 NOT NULL,
  "completions" bigint DEFAULT 0 NOT NULL,
  "total_watch_ms" bigint DEFAULT 0 NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("asset_id")
);

CREATE TABLE IF NOT EXISTS pix_user."cine_social_profiles" (
  "platform" text NOT NULL,
  "account_label" text DEFAULT ''::text NOT NULL,
  "format" text DEFAULT 'vertical'::text NOT NULL,
  "enabled" bigint DEFAULT 0 NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("platform")
);

CREATE TABLE IF NOT EXISTS pix_user."cine_upload_parts" (
  "upload_id" text NOT NULL,
  "chunk_index" bigint NOT NULL,
  "data_base64" text NOT NULL,
  "size_bytes" bigint NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("upload_id", "chunk_index")
);

CREATE TABLE IF NOT EXISTS pix_user."deployment_snapshots" (
  "id" bigint DEFAULT nextval('pix.deployment_snapshots_id_seq'::regclass) NOT NULL,
  "status" text NOT NULL,
  "content_json" text NOT NULL,
  "poster_count" bigint NOT NULL,
  "monster_count" bigint NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."film_dna_events" (
  "id" bigint DEFAULT nextval('pix.film_dna_events_id_seq'::regclass) NOT NULL,
  "user_id" text NOT NULL,
  "signal_type" text NOT NULL,
  "primary_imdb_id" text,
  "secondary_imdb_id" text,
  "game_key" text DEFAULT ''::text NOT NULL,
  "query_text" text DEFAULT ''::text NOT NULL,
  "metadata_json" text DEFAULT '{}'::text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."film_dna_media_signals" (
  "user_id" text NOT NULL,
  "imdb_id" text NOT NULL,
  "knowledge" text DEFAULT 'unknown'::text NOT NULL,
  "wins" bigint DEFAULT 0 NOT NULL,
  "losses" bigint DEFAULT 0 NOT NULL,
  "unseen_count" bigint DEFAULT 0 NOT NULL,
  "query_match_count" bigint DEFAULT 0 NOT NULL,
  "reasons_json" text DEFAULT '[]'::text NOT NULL,
  "source_game_key" text DEFAULT ''::text NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "interest" text DEFAULT 'none'::text NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("user_id", "imdb_id")
);

CREATE TABLE IF NOT EXISTS pix_user."film_dna_profiles" (
  "user_id" text NOT NULL,
  "signature_version" bigint DEFAULT 1 NOT NULL,
  "vote_count" bigint DEFAULT 0 NOT NULL,
  "unseen_count" bigint DEFAULT 0 NOT NULL,
  "query_count" bigint DEFAULT 0 NOT NULL,
  "genre_weights_json" text DEFAULT '{}'::text NOT NULL,
  "era_weights_json" text DEFAULT '{}'::text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS pix_user."film_dna_queries" (
  "id" bigint DEFAULT nextval('pix.film_dna_queries_id_seq'::regclass) NOT NULL,
  "user_id" text NOT NULL,
  "query_text" text NOT NULL,
  "matched_imdb_ids_json" text DEFAULT '[]'::text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."notes" (
  "id" bigint DEFAULT nextval('pix.notes_id_seq'::regclass) NOT NULL,
  "kind" text NOT NULL,
  "entity_key" text,
  "title" text NOT NULL,
  "body" text DEFAULT ''::text NOT NULL,
  "note_date" text,
  "tags" text DEFAULT ''::text NOT NULL,
  "sort_order" bigint,
  "parent_note_id" bigint,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_actor_votes" (
  "id" bigint DEFAULT nextval('pix.pix_actor_votes_id_seq'::regclass) NOT NULL,
  "winner_qid" text NOT NULL,
  "loser_qid" text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_fan_type_events" (
  "id" bigint DEFAULT nextval('pix.pix_fan_type_events_id_seq'::regclass) NOT NULL,
  "user_id" text NOT NULL,
  "signal_type" text NOT NULL,
  "primary_imdb_id" text,
  "secondary_imdb_id" text,
  "focus_kind" text DEFAULT 'none'::text NOT NULL,
  "focus_value" text DEFAULT ''::text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_fan_type_states" (
  "user_id" text NOT NULL,
  "consecutive_unseen" bigint DEFAULT 0 NOT NULL,
  "question_answered" bigint DEFAULT 0 NOT NULL,
  "focus_kind" text DEFAULT 'none'::text NOT NULL,
  "focus_value" text DEFAULT ''::text NOT NULL,
  "answered_at" bigint,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_feedback" (
  "id" bigint DEFAULT nextval('pix.pix_feedback_id_seq'::regclass) NOT NULL,
  "kind" text NOT NULL,
  "message" text NOT NULL,
  "reported_user" text DEFAULT ''::text NOT NULL,
  "author_profile_id" bigint,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_game_results" (
  "id" bigint DEFAULT nextval('pix.pix_game_results_id_seq'::regclass) NOT NULL,
  "game_key" text NOT NULL,
  "game_title" text NOT NULL,
  "winner_imdb_id" text NOT NULL,
  "loser_imdb_id" text NOT NULL,
  "why" text DEFAULT ''::text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_movie_posts" (
  "id" bigint DEFAULT nextval('pix.pix_movie_posts_id_seq'::regclass) NOT NULL,
  "imdb_id" text NOT NULL,
  "author_profile_id" bigint DEFAULT 1 NOT NULL,
  "kind" text NOT NULL,
  "parent_id" bigint,
  "title" text DEFAULT ''::text NOT NULL,
  "body" text NOT NULL,
  "relevance_count" bigint DEFAULT 0 NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_movie_review_scores" (
  "imdb_id" text NOT NULL,
  "scope" text NOT NULL,
  "scope_code" text DEFAULT '*'::text NOT NULL,
  "average_score" bigint NOT NULL,
  "rating_count" bigint DEFAULT 0 NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("imdb_id", "scope", "scope_code")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_movie_unseen" (
  "imdb_id" text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("imdb_id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_movie_votes" (
  "id" bigint DEFAULT nextval('pix.pix_movie_votes_id_seq'::regclass) NOT NULL,
  "winner_imdb_id" text NOT NULL,
  "loser_imdb_id" text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_profiles" (
  "id" bigint DEFAULT nextval('pix.pix_profiles_id_seq'::regclass) NOT NULL,
  "display_name" text DEFAULT 'Anonymous'::text NOT NULL,
  "mode" text DEFAULT 'anonymous'::text NOT NULL,
  "cookie_decision" text DEFAULT 'pending'::text NOT NULL,
  "personalization" bigint DEFAULT 0 NOT NULL,
  "ad_measurement" bigint DEFAULT 0 NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "gender" text DEFAULT ''::text NOT NULL,
  "age_range" text DEFAULT ''::text NOT NULL,
  "race_ethnicity" text DEFAULT ''::text NOT NULL,
  "faith" text DEFAULT ''::text NOT NULL,
  "country" text DEFAULT ''::text NOT NULL,
  "region" text DEFAULT ''::text NOT NULL,
  "email" text DEFAULT ''::text NOT NULL,
  "email_status" text DEFAULT 'none'::text NOT NULL,
  "verification_code_hash" text DEFAULT ''::text NOT NULL,
  "verification_expires_at" bigint,
  "verified_at" bigint,
  "avatar_blob_key" text,
  "attractions_row_order" text DEFAULT ''::text NOT NULL,
  "cine_bin_dock" text DEFAULT ''::text NOT NULL,
  "landing_layout" text DEFAULT ''::text NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_signup_challenges" (
  "id" text NOT NULL,
  "prompt" text NOT NULL,
  "answer_hash" text NOT NULL,
  "expires_at" bigint NOT NULL,
  "used_at" bigint,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_tough_shares" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "left_imdb_id" text NOT NULL,
  "right_imdb_id" text NOT NULL,
  "pick_count" bigint DEFAULT 0 NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_trending" (
  "source" text NOT NULL,
  "provider_id" text NOT NULL,
  "tmdb_id" bigint,
  "imdb_id" text,
  "title" text,
  "channel_title" text,
  "duration_seconds" bigint,
  "published_at" bigint,
  "rank" bigint NOT NULL,
  "date_pulled" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("source", "provider_id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_trending_runs" (
  "id" bigint DEFAULT nextval('pix.pix_trending_runs_id_seq'::regclass) NOT NULL,
  "status" text NOT NULL,
  "detail" text DEFAULT ''::text NOT NULL,
  "matched_count" bigint DEFAULT 0 NOT NULL,
  "pulled_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_user_fan_types" (
  "user_id" text NOT NULL,
  "type_key" text NOT NULL,
  "score" bigint DEFAULT 0 NOT NULL,
  "confidence" bigint DEFAULT 0 NOT NULL,
  "signal_count" bigint DEFAULT 0 NOT NULL,
  "direct_selected" bigint DEFAULT 0 NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("user_id", "type_key")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_user_library" (
  "user_id" text NOT NULL,
  "imdb_id" text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("user_id", "imdb_id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_user_list_items" (
  "list_id" bigint NOT NULL,
  "imdb_id" text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("list_id", "imdb_id")
);

CREATE TABLE IF NOT EXISTS pix_user."pix_user_lists" (
  "id" bigint DEFAULT nextval('pix.pix_user_lists_id_seq'::regclass) NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "share_code" text NOT NULL,
  "created_at" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "visibility" text DEFAULT 'private'::text NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS pix_user."user_dna_strands" (
  "strand_key" text NOT NULL,
  "media_type" text NOT NULL,
  "media_id" text NOT NULL,
  "title" text NOT NULL,
  "knowledge" text DEFAULT 'unknown'::text NOT NULL,
  "wins" bigint DEFAULT 0 NOT NULL,
  "losses" bigint DEFAULT 0 NOT NULL,
  "why" text DEFAULT ''::text NOT NULL,
  "source_game_key" text NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "interest" text DEFAULT 'none'::text NOT NULL,
  "synced_at" timestamptz,
  PRIMARY KEY ("strand_key")
);

-- DOWN-MIGRATION NOTE (authored, not executed): DROP TABLE IF EXISTS
-- pix_user."<t>" for each table above, then DROP SCHEMA pix_user.
-- Once up-synced rows exist here, this schema is a data record:
-- export before any drop, never delete silently.
