CREATE TABLE IF NOT EXISTS `pix_trending` (
  `source` text NOT NULL,
  `tmdb_id` integer NOT NULL,
  `imdb_id` text NOT NULL REFERENCES `pix_movie_stats`(`imdb_id`) ON DELETE CASCADE,
  `rank` integer NOT NULL,
  `date_pulled` integer NOT NULL,
  PRIMARY KEY (`source`, `tmdb_id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `pix_trending_rank_idx` ON `pix_trending` (`source`, `rank`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `pix_trending_pulled_idx` ON `pix_trending` (`date_pulled`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pix_trending_runs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `status` text NOT NULL,
  `detail` text NOT NULL DEFAULT '',
  `matched_count` integer NOT NULL DEFAULT 0,
  `pulled_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `pix_trending_runs_pulled_idx` ON `pix_trending_runs` (`pulled_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `cine_short_stats` (
  `asset_id` integer PRIMARY KEY NOT NULL REFERENCES `cine_assets`(`id`) ON DELETE CASCADE,
  `views` integer NOT NULL DEFAULT 0,
  `plays` integer NOT NULL DEFAULT 0,
  `completions` integer NOT NULL DEFAULT 0,
  `total_watch_ms` integer NOT NULL DEFAULT 0,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `cine_short_stats_rank_idx` ON `cine_short_stats` (`plays`, `completions`, `views`);
