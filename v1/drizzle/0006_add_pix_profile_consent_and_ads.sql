CREATE TABLE `pix_profiles` (
  `id` integer PRIMARY KEY NOT NULL,
  `display_name` text DEFAULT 'Anonymous' NOT NULL,
  `mode` text DEFAULT 'anonymous' NOT NULL,
  `cookie_decision` text DEFAULT 'pending' NOT NULL,
  `personalization` integer DEFAULT 0 NOT NULL,
  `ad_measurement` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pix_ads` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `body` text DEFAULT '' NOT NULL,
  `placement` text DEFAULT 'matchup' NOT NULL,
  `cta_label` text DEFAULT '' NOT NULL,
  `cta_url` text,
  `active` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pix_ads_active_idx` ON `pix_ads` (`active`,`updated_at`);
