CREATE TABLE `pix_user_lists` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL,
  `name` text NOT NULL,
  `share_code` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pix_user_lists_share_code_idx` ON `pix_user_lists` (`share_code`);
--> statement-breakpoint
CREATE INDEX `pix_user_lists_user_idx` ON `pix_user_lists` (`user_id`, `created_at`);
--> statement-breakpoint
CREATE TABLE `pix_user_list_items` (
  `list_id` integer NOT NULL REFERENCES `pix_user_lists`(`id`) ON DELETE cascade,
  `imdb_id` text NOT NULL REFERENCES `pix_movie_stats`(`imdb_id`) ON DELETE cascade,
  `created_at` integer NOT NULL,
  PRIMARY KEY (`list_id`, `imdb_id`)
);
--> statement-breakpoint
CREATE INDEX `pix_user_list_items_list_idx` ON `pix_user_list_items` (`list_id`, `created_at`);
--> statement-breakpoint
CREATE TABLE `pix_tough_shares` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `left_imdb_id` text NOT NULL REFERENCES `pix_movie_stats`(`imdb_id`) ON DELETE cascade,
  `right_imdb_id` text NOT NULL REFERENCES `pix_movie_stats`(`imdb_id`) ON DELETE cascade,
  `pick_count` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pix_tough_shares_user_idx` ON `pix_tough_shares` (`user_id`, `created_at`);
