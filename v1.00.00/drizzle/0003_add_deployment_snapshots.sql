CREATE TABLE `deployment_snapshots` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `status` text NOT NULL,
  `content_json` text NOT NULL,
  `poster_count` integer NOT NULL,
  `monster_count` integer NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `deployment_snapshots_created_idx` ON `deployment_snapshots` (`created_at`);
