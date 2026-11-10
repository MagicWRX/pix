INSERT INTO pix_movie_stats (
  imdb_id, title, release_year, genre, poster_key, source_url, poster_source_url,
  synopsis, synopsis_source_url, attributes_json, wins, losses, appearances,
  unseen_count, game_appearances_json, last_played_at, created_at, updated_at
)
SELECT
  'tt0102926', title, release_year, genre, '1991-tt0102926.webp',
  'https://www.imdb.com/title/tt0102926/', poster_source_url,
  synopsis, synopsis_source_url, attributes_json, wins, losses, appearances,
  unseen_count, game_appearances_json, last_played_at, created_at,
  CAST(strftime('%s','now') AS INTEGER) * 1000
FROM pix_movie_stats
WHERE imdb_id = 'tt0110413' AND title = 'The Silence of the Lambs'
ON CONFLICT(imdb_id) DO UPDATE SET
  title = excluded.title,
  release_year = excluded.release_year,
  genre = excluded.genre,
  poster_key = excluded.poster_key,
  source_url = excluded.source_url,
  poster_source_url = excluded.poster_source_url,
  attributes_json = excluded.attributes_json,
  updated_at = excluded.updated_at;
--> statement-breakpoint
UPDATE pix_movie_deck_entries
SET imdb_id = 'tt0102926'
WHERE imdb_id = 'tt0110413'
  AND deck_key = 'year-1991'
  AND EXISTS (SELECT 1 FROM pix_movie_stats WHERE imdb_id = 'tt0102926');
--> statement-breakpoint
DELETE FROM pix_movie_stats
WHERE imdb_id = 'tt0110413'
  AND title = 'The Silence of the Lambs'
  AND NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE imdb_id = 'tt0110413');
