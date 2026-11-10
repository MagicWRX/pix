CREATE TABLE `user_dna_strands` (
  `strand_key` text PRIMARY KEY NOT NULL,
  `media_type` text NOT NULL,
  `media_id` text NOT NULL,
  `title` text NOT NULL,
  `knowledge` text DEFAULT 'unknown' NOT NULL,
  `wins` integer DEFAULT 0 NOT NULL,
  `losses` integer DEFAULT 0 NOT NULL,
  `why` text DEFAULT '' NOT NULL,
  `source_game_key` text NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_dna_media_idx` ON `user_dna_strands` (`media_type`,`media_id`);
--> statement-breakpoint
CREATE INDEX `user_dna_game_idx` ON `user_dna_strands` (`source_game_key`,`updated_at`);
--> statement-breakpoint
CREATE TABLE `pix_game_results` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `game_key` text NOT NULL,
  `game_title` text NOT NULL,
  `winner_imdb_id` text NOT NULL,
  `loser_imdb_id` text NOT NULL,
  `why` text DEFAULT '' NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pix_game_results_game_idx` ON `pix_game_results` (`game_key`,`created_at`);
