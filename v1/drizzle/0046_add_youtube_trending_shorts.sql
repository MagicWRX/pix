ALTER TABLE `pix_trending` RENAME TO `pix_trending_legacy`;
--> statement-breakpoint
CREATE TABLE `pix_trending` (
  `source` text NOT NULL,
  `provider_id` text NOT NULL,
  `tmdb_id` integer,
  `imdb_id` text REFERENCES `pix_movie_stats`(`imdb_id`) ON DELETE CASCADE,
  `title` text,
  `channel_title` text,
  `duration_seconds` integer,
  `published_at` integer,
  `rank` integer NOT NULL,
  `date_pulled` integer NOT NULL,
  PRIMARY KEY (`source`, `provider_id`)
);
--> statement-breakpoint
INSERT INTO `pix_trending` (`source`, `provider_id`, `tmdb_id`, `imdb_id`, `rank`, `date_pulled`)
SELECT `source`, CAST(`tmdb_id` AS text), `tmdb_id`, `imdb_id`, `rank`, `date_pulled`
FROM `pix_trending_legacy`;
--> statement-breakpoint
DROP TABLE `pix_trending_legacy`;
--> statement-breakpoint
CREATE INDEX `pix_trending_rank_idx` ON `pix_trending` (`source`, `rank`);
--> statement-breakpoint
CREATE INDEX `pix_trending_pulled_idx` ON `pix_trending` (`date_pulled`);