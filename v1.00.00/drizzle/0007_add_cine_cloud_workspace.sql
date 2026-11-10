CREATE TABLE `cine_accounts` (
  `id` integer PRIMARY KEY NOT NULL,
  `plan` text DEFAULT 'free' NOT NULL,
  `quota_bytes` integer DEFAULT 500000000 NOT NULL,
  `stripe_session_id` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cine_assets` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `mime_type` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `storage_key` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cine_assets_status_idx` ON `cine_assets` (`status`,`created_at`);
