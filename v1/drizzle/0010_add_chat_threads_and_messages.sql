CREATE TABLE `chat_threads` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `kind` text NOT NULL,
  `title` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chat_threads_updated_idx` ON `chat_threads` (`updated_at`);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `thread_id` integer NOT NULL,
  `sender` text NOT NULL,
  `body` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chat_messages_thread_idx` ON `chat_messages` (`thread_id`, `created_at`);