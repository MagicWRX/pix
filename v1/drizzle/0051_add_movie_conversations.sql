CREATE TABLE `pix_movie_posts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `imdb_id` text NOT NULL,
  `author_profile_id` integer DEFAULT 1 NOT NULL,
  `kind` text NOT NULL,
  `parent_id` integer,
  `title` text DEFAULT '' NOT NULL,
  `body` text NOT NULL,
  `relevance_count` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`imdb_id`) REFERENCES `pix_movie_stats`(`imdb_id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`author_profile_id`) REFERENCES `pix_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pix_movie_posts_movie_idx` ON `pix_movie_posts` (`imdb_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `pix_movie_posts_parent_idx` ON `pix_movie_posts` (`parent_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `pix_movie_posts_relevance_idx` ON `pix_movie_posts` (`imdb_id`,`relevance_count`);
