CREATE TABLE `pix_classic_films` (
	`film_key` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`release_year` integer NOT NULL,
	`bucket_name` text NOT NULL,
	`path_prefix` text NOT NULL,
	`stream_base_url` text DEFAULT '' NOT NULL,
	`total_segments` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pix_classic_clips` (
	`film_key` text NOT NULL,
	`segment_number` integer NOT NULL,
	`title` text NOT NULL,
	`file_name` text NOT NULL,
	`stream_url` text DEFAULT '' NOT NULL,
	`duration_ms` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`film_key`, `segment_number`),
	FOREIGN KEY (`film_key`) REFERENCES `pix_classic_films`(`film_key`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pix_classic_clips_file_idx` ON `pix_classic_clips` (`file_name`);
--> statement-breakpoint
CREATE INDEX `pix_classic_clips_film_order_idx` ON `pix_classic_clips` (`film_key`,`segment_number`);
--> statement-breakpoint
INSERT INTO `pix_classic_films` (`film_key`, `title`, `release_year`, `bucket_name`, `path_prefix`, `stream_base_url`, `total_segments`, `updated_at`) VALUES ('dracula-1931', 'Dracula', 1931, 'public-domain', 'pix/dracula-1931/clips', '', 38, unixepoch('now') * 1000);
--> statement-breakpoint
INSERT INTO `pix_classic_clips` (`film_key`, `segment_number`, `title`, `file_name`, `stream_url`, `duration_ms`, `created_at`, `updated_at`) VALUES
('dracula-1931', 1, 'Segment 01', 'dracula-1931-clip-01.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 2, 'Segment 02', 'dracula-1931-clip-02.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 3, 'Segment 03', 'dracula-1931-clip-03.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 4, 'Segment 04', 'dracula-1931-clip-04.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 5, 'Segment 05', 'dracula-1931-clip-05.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 6, 'Segment 06', 'dracula-1931-clip-06.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 7, 'Segment 07', 'dracula-1931-clip-07.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 8, 'Segment 08', 'dracula-1931-clip-08.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 9, 'Segment 09', 'dracula-1931-clip-09.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 10, 'Segment 10', 'dracula-1931-clip-10.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 11, 'Segment 11', 'dracula-1931-clip-11.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 12, 'Segment 12', 'dracula-1931-clip-12.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 13, 'Segment 13', 'dracula-1931-clip-13.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 14, 'Segment 14', 'dracula-1931-clip-14.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 15, 'Segment 15', 'dracula-1931-clip-15.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 16, 'Segment 16', 'dracula-1931-clip-16.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 17, 'Segment 17', 'dracula-1931-clip-17.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 18, 'Segment 18', 'dracula-1931-clip-18.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 19, 'Segment 19', 'dracula-1931-clip-19.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 20, 'Segment 20', 'dracula-1931-clip-20.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 21, 'Segment 21', 'dracula-1931-clip-21.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 22, 'Segment 22', 'dracula-1931-clip-22.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 23, 'Segment 23', 'dracula-1931-clip-23.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 24, 'Segment 24', 'dracula-1931-clip-24.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 25, 'Segment 25', 'dracula-1931-clip-25.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 26, 'Segment 26', 'dracula-1931-clip-26.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 27, 'Segment 27', 'dracula-1931-clip-27.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 28, 'Segment 28', 'dracula-1931-clip-28.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 29, 'Segment 29', 'dracula-1931-clip-29.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 30, 'Segment 30', 'dracula-1931-clip-30.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 31, 'Segment 31', 'dracula-1931-clip-31.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 32, 'Segment 32', 'dracula-1931-clip-32.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 33, 'Segment 33', 'dracula-1931-clip-33.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 34, 'Segment 34', 'dracula-1931-clip-34.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 35, 'Segment 35', 'dracula-1931-clip-35.mp4', '', 119036, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 36, 'Segment 36', 'dracula-1931-clip-36.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 37, 'Segment 37', 'dracula-1931-clip-37.mp4', '', 119035, unixepoch('now') * 1000, unixepoch('now') * 1000),
('dracula-1931', 38, 'Segment 38', 'dracula-1931-clip-38.mp4', '', 63396, unixepoch('now') * 1000, unixepoch('now') * 1000);
