CREATE TABLE IF NOT EXISTS `pix_config` (
  `service` text PRIMARY KEY NOT NULL,
  `secret_value` text NOT NULL,
  `configured_at` integer NOT NULL,
  `configured_by_viewer_key` text NOT NULL,
  `status` text NOT NULL DEFAULT 'configured',
  `status_detail` text NOT NULL DEFAULT '',
  `last_checked_at` integer
);
