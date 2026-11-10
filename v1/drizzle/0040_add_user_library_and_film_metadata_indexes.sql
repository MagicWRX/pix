CREATE TABLE `pix_user_library` (
  `user_id` text NOT NULL,
  `imdb_id` text NOT NULL,
  `created_at` integer NOT NULL,
  PRIMARY KEY (`user_id`, `imdb_id`),
  FOREIGN KEY (`imdb_id`) REFERENCES `pix_movie_stats`(`imdb_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pix_user_library_created_idx` ON `pix_user_library` (`user_id`, `created_at`);
