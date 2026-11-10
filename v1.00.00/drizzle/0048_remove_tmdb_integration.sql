DELETE FROM pix_config WHERE service = 'tmdb';
--> statement-breakpoint
DELETE FROM pix_trending WHERE source IN ('tmdb_day', 'tmdb_week', 'tmdb_now_playing');
--> statement-breakpoint
DELETE FROM pix_trending_runs;
