CREATE TABLE `film_dna_profiles` (
  `user_id` text PRIMARY KEY NOT NULL,
  `signature_version` integer DEFAULT 1 NOT NULL,
  `vote_count` integer DEFAULT 0 NOT NULL,
  `unseen_count` integer DEFAULT 0 NOT NULL,
  `query_count` integer DEFAULT 0 NOT NULL,
  `genre_weights_json` text DEFAULT '{}' NOT NULL,
  `era_weights_json` text DEFAULT '{}' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `film_dna_media_signals` (
  `user_id` text NOT NULL REFERENCES `film_dna_profiles`(`user_id`) ON DELETE CASCADE,
  `imdb_id` text NOT NULL REFERENCES `pix_movie_stats`(`imdb_id`) ON DELETE CASCADE,
  `knowledge` text DEFAULT 'unknown' NOT NULL,
  `wins` integer DEFAULT 0 NOT NULL,
  `losses` integer DEFAULT 0 NOT NULL,
  `unseen_count` integer DEFAULT 0 NOT NULL,
  `query_match_count` integer DEFAULT 0 NOT NULL,
  `reasons_json` text DEFAULT '[]' NOT NULL,
  `source_game_key` text DEFAULT '' NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY(`user_id`, `imdb_id`)
);
--> statement-breakpoint
CREATE INDEX `film_dna_media_user_idx` ON `film_dna_media_signals` (`user_id`, `updated_at`);
--> statement-breakpoint
CREATE TABLE `film_dna_queries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL REFERENCES `film_dna_profiles`(`user_id`) ON DELETE CASCADE,
  `query_text` text NOT NULL,
  `matched_imdb_ids_json` text DEFAULT '[]' NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `film_dna_queries_user_idx` ON `film_dna_queries` (`user_id`, `created_at`);
--> statement-breakpoint
CREATE TABLE `film_dna_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL REFERENCES `film_dna_profiles`(`user_id`) ON DELETE CASCADE,
  `signal_type` text NOT NULL,
  `primary_imdb_id` text,
  `secondary_imdb_id` text,
  `game_key` text DEFAULT '' NOT NULL,
  `query_text` text DEFAULT '' NOT NULL,
  `metadata_json` text DEFAULT '{}' NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `film_dna_events_user_idx` ON `film_dna_events` (`user_id`, `created_at`);
