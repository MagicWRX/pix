CREATE TABLE `cine_chunked_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`total_size_bytes` integer NOT NULL,
	`total_chunks` integer NOT NULL,
	`duration_seconds` integer,
	`received_chunks` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'uploading' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cine_chunked_uploads_status_idx` ON `cine_chunked_uploads` (`status`,`created_at`);
--> statement-breakpoint
CREATE TABLE `cine_upload_parts` (
	`upload_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`data_base64` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`upload_id`, `chunk_index`),
	FOREIGN KEY (`upload_id`) REFERENCES `cine_chunked_uploads`(`id`) ON UPDATE no action ON DELETE cascade
);
