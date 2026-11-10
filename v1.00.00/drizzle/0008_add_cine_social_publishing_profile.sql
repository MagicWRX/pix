CREATE TABLE `cine_social_profiles` (
  `platform` text PRIMARY KEY NOT NULL,
  `account_label` text DEFAULT '' NOT NULL,
  `format` text DEFAULT 'vertical' NOT NULL,
  `enabled` integer DEFAULT false NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cine_social_profiles_enabled_idx` ON `cine_social_profiles` (`enabled`,`updated_at`);
