CREATE TABLE `pix_actors` (
  `qid` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `source_url` text NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pix_actors_name_idx` ON `pix_actors` (`name`);
--> statement-breakpoint
CREATE TABLE `pix_actor_votes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `winner_qid` text NOT NULL,
  `loser_qid` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`winner_qid`) REFERENCES `pix_actors`(`qid`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`loser_qid`) REFERENCES `pix_actors`(`qid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pix_actor_votes_created_idx` ON `pix_actor_votes` (`created_at`);