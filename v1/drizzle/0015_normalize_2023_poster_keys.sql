UPDATE pix_movie_stats
SET poster_key = '2023-' || imdb_id || '.webp',
    updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE release_year = 2023
  AND poster_key LIKE '2023-%';
