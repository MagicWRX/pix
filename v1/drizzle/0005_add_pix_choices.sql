CREATE TABLE `pix_movie_votes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `winner_imdb_id` text NOT NULL,
  `loser_imdb_id` text NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pix_movie_votes_created_idx` ON `pix_movie_votes` (`created_at`);
--> statement-breakpoint
CREATE TABLE `pix_movie_unseen` (
  `imdb_id` text PRIMARY KEY NOT NULL,
  `created_at` integer NOT NULL
);
