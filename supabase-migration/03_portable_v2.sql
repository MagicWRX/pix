-- PIX portable v2: new tables for USERS LISTS, TOUGH PIX sharing, COMB grossers,
-- film reviews, and the CINE Lite BIN registry.
-- Run in the Supabase SQL editor AFTER the main 7-schema migration.
-- All tables are idempotent (IF NOT EXISTS).

-- USERS LISTS: user-created named movie lists, shareable via share_key.
CREATE TABLE IF NOT EXISTS "pix2"."pix_user_lists" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "is_public" BOOLEAN NOT NULL DEFAULT TRUE,
    "share_key" TEXT NOT NULL UNIQUE,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS "pix2_pix_user_lists_user_idx" ON "pix2"."pix_user_lists" ("user_id");

CREATE TABLE IF NOT EXISTS "pix2"."pix_user_list_items" (
    "id" BIGSERIAL PRIMARY KEY,
    "list_id" BIGINT NOT NULL REFERENCES "pix2"."pix_user_lists"("id") ON DELETE CASCADE,
    "imdb_id" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "position" BIGINT NOT NULL DEFAULT 0,
    "added_at" BIGINT NOT NULL,
    UNIQUE ("list_id", "imdb_id")
);
CREATE INDEX IF NOT EXISTS "pix2_pix_user_list_items_list_idx" ON "pix2"."pix_user_list_items" ("list_id");

-- TOUGH PIX sharing: a shared VS matchup with a unique link; friends open it
-- (anonymous allowed) and pick; the sender sees pick counts.
CREATE TABLE IF NOT EXISTS "pix2"."pix_tough_shares" (
    "id" BIGSERIAL PRIMARY KEY,
    "share_key" TEXT NOT NULL UNIQUE,
    "creator_user_id" TEXT,
    "a_imdb_id" TEXT NOT NULL,
    "b_imdb_id" TEXT NOT NULL,
    "deck_key" TEXT NOT NULL DEFAULT '',
    "created_at" BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS "pix2"."pix_tough_picks" (
    "id" BIGSERIAL PRIMARY KEY,
    "share_id" BIGINT NOT NULL REFERENCES "pix2"."pix_tough_shares"("id") ON DELETE CASCADE,
    "picker_user_id" TEXT,
    "picked_imdb_id" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS "pix2_pix_tough_picks_share_idx" ON "pix2"."pix_tough_picks" ("share_id");

-- COMB grossers: biggest-financial-success feed (populated from COMB's findings).
-- Empty by default; import COMB's Top 100 with the documented columns.
CREATE TABLE IF NOT EXISTS "pix2"."pix_comb_grossers" (
    "rank" BIGINT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "release_year" BIGINT,
    "worldwide_gross" NUMERIC,
    "source_label" TEXT NOT NULL DEFAULT '',
    "imdb_id" TEXT,
    "checked_at" TEXT NOT NULL DEFAULT ''
);

-- Film reviews: community reviews shown on film pages + Friends' Reviews row.
CREATE TABLE IF NOT EXISTS "pix2"."pix_reviews" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "user_label" TEXT NOT NULL DEFAULT 'A PIX fan',
    "imdb_id" TEXT NOT NULL,
    "rating" BIGINT,
    "body" TEXT NOT NULL DEFAULT '',
    "created_at" BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS "pix2_pix_reviews_imdb_idx" ON "pix2"."pix_reviews" ("imdb_id", "created_at" DESC);

-- CINE Lite BIN: simple server-side registry of a user's work-in-progress files.
-- (The full browser timeline editor is out of scope for the portable; see README.)
CREATE TABLE IF NOT EXISTS "pix2"."pix_cine_bin" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS "pix2_pix_cine_bin_user_idx" ON "pix2"."pix_cine_bin" ("user_id");
