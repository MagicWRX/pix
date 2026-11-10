CREATE TABLE `pix_movie_stats` (
  `imdb_id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `release_year` integer NOT NULL,
  `genre` text NOT NULL,
  `poster_key` text NOT NULL,
  `source_url` text NOT NULL,
  `wins` integer DEFAULT 0 NOT NULL,
  `losses` integer DEFAULT 0 NOT NULL,
  `appearances` integer DEFAULT 0 NOT NULL,
  `unseen_count` integer DEFAULT 0 NOT NULL,
  `game_appearances_json` text DEFAULT '{}' NOT NULL,
  `last_played_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pix_movie_stats_year_idx` ON `pix_movie_stats` (`release_year`,`title`);
--> statement-breakpoint
CREATE INDEX `pix_movie_stats_updated_idx` ON `pix_movie_stats` (`updated_at`);
