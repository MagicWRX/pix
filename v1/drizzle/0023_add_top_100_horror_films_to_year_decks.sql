INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2017', '2017 Movies', 2017, 100, 1, 9, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2016', '2016 Movies', 2016, 100, 1, 10, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2015', '2015 Movies', 2015, 100, 1, 11, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2014', '2014 Movies', 2014, 100, 1, 12, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2013', '2013 Movies', 2013, 100, 1, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2011', '2011 Movies', 2011, 100, 1, 15, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2009', '2009 Movies', 2009, 100, 1, 17, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2008', '2008 Movies', 2008, 100, 1, 18, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2007', '2007 Movies', 2007, 100, 1, 19, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2006', '2006 Movies', 2006, 100, 1, 20, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2005', '2005 Movies', 2005, 100, 1, 21, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2004', '2004 Movies', 2004, 100, 1, 22, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2003', '2003 Movies', 2003, 100, 1, 23, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2002', '2002 Movies', 2002, 100, 1, 24, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-2001', '2001 Movies', 2001, 100, 1, 25, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1999', '1999 Movies', 1999, 100, 1, 27, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1998', '1998 Movies', 1998, 100, 1, 28, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1997', '1997 Movies', 1997, 100, 1, 29, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1996', '1996 Movies', 1996, 100, 1, 30, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1994', '1994 Movies', 1994, 100, 1, 32, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1992', '1992 Movies', 1992, 100, 1, 34, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1991', '1991 Movies', 1991, 100, 1, 35, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1990', '1990 Movies', 1990, 100, 1, 36, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1988', '1988 Movies', 1988, 100, 1, 38, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1987', '1987 Movies', 1987, 100, 1, 39, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1986', '1986 Movies', 1986, 100, 1, 40, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1985', '1985 Movies', 1985, 100, 1, 41, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1984', '1984 Movies', 1984, 100, 1, 42, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1983', '1983 Movies', 1983, 100, 1, 43, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1982', '1982 Movies', 1982, 100, 1, 44, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1981', '1981 Movies', 1981, 100, 1, 45, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1980', '1980 Movies', 1980, 100, 1, 46, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1978', '1978 Movies', 1978, 100, 1, 48, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1977', '1977 Movies', 1977, 100, 1, 49, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1976', '1976 Movies', 1976, 100, 1, 50, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1975', '1975 Movies', 1975, 100, 1, 51, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1974', '1974 Movies', 1974, 100, 1, 52, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1973', '1973 Movies', 1973, 100, 1, 53, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1971', '1971 Movies', 1971, 100, 1, 55, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1968', '1968 Movies', 1968, 100, 1, 58, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1965', '1965 Movies', 1965, 100, 1, 61, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1964', '1964 Movies', 1964, 100, 1, 62, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1963', '1963 Movies', 1963, 100, 1, 63, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1962', '1962 Movies', 1962, 100, 1, 64, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1961', '1961 Movies', 1961, 100, 1, 65, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1960', '1960 Movies', 1960, 100, 1, 66, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_decks (deck_key, label, release_year, target_size, active, sort_order, created_at, updated_at)
VALUES ('year-1955', '1955 Movies', 1955, 100, 1, 71, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(deck_key) DO UPDATE SET label = excluded.label, release_year = excluded.release_year, active = excluded.active, sort_order = excluded.sort_order, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_stats (
  imdb_id, title, release_year, genre, poster_key, source_url, poster_source_url,
  synopsis, synopsis_source_url, attributes_json, wins, losses, appearances,
  unseen_count, game_appearances_json, created_at, updated_at
) VALUES
  ('tt0070047', 'The Exorcist', 1973, 'Horror, Supernatural, Drama', '1973-tt0070047.webp', 'https://www.imdb.com/title/tt0070047/', 'https://mrwallpaper.com/images/thumbnail/the-exorcist-long-movie-poster-flv97upwgzjzf2k1.jpg', '', '', '{"releaseYear":1973,"horrorCanonRank":1,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0054215', 'Psycho', 1960, 'Horror, Thriller, Psychological', '1960-tt0054215.webp', 'https://www.imdb.com/title/tt0054215/', 'http://asanoyukiyasu.com/wp-content/uploads/2021/07/hitchcock8.jpg', '', '', '{"releaseYear":1960,"horrorCanonRank":2,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0072271', 'The Texas Chain Saw Massacre', 1974, 'Horror, Slasher, Thriller', '1974-tt0072271.webp', 'https://www.imdb.com/title/tt0072271/', 'https://leonardo.osnova.io/422659bb-79d7-5601-98b9-c5461f84e11b/', '', '', '{"releaseYear":1974,"horrorCanonRank":3,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0081505', 'The Shining', 1980, 'Horror, Psychological, Supernatural', '1980-tt0081505.webp', 'https://www.imdb.com/title/tt0081505/', 'https://i.pinimg.com/236x/33/3a/8a/333a8aea2773976891b5260169493680.jpg', '', '', '{"releaseYear":1980,"horrorCanonRank":4,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0078748', 'Alien', 1979, 'Horror, Sci-Fi, Thriller', '1979-tt0078748.webp', 'https://www.imdb.com/title/tt0078748/', '', '', '', '{"releaseYear":1979,"horrorCanonRank":5,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0063522', 'Rosemary''s Baby', 1968, 'Horror, Psychological, Thriller', '1968-tt0063522.webp', 'https://www.imdb.com/title/tt0063522/', 'https://dyn1.heritagestatic.com/ha?p=3-1-3-0-2-31302278&it=product', '', '', '{"releaseYear":1968,"horrorCanonRank":6,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0077651', 'Halloween', 1978, 'Horror, Slasher, Thriller', '1978-tt0077651.webp', 'https://www.imdb.com/title/tt0077651/', 'https://juzzaweb.co.uk/images/posters/movie/halloween-1978.webp', '', '', '{"releaseYear":1978,"horrorCanonRank":7,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0063350', 'Night of the Living Dead', 1968, 'Horror, Zombie, Thriller', '1968-tt0063350.webp', 'https://www.imdb.com/title/tt0063350/', 'https://www.movieposters.com/cdn/shop/files/nightoftheliving2_480x.progressive.jpg?v=1697041879', '', '', '{"releaseYear":1968,"horrorCanonRank":8,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0073195', 'Jaws', 1975, 'Horror, Thriller, Adventure', '1975-tt0073195.webp', 'https://www.imdb.com/title/tt0073195/', 'https://www.picclickimg.com/lUAAAOSwE8xh04yS/1975-Jaws-Movie-Poster-Print-Martin-Brody-Quint-Great.webp', '', '', '{"releaseYear":1975,"horrorCanonRank":9,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0084787', 'The Thing', 1982, 'Horror, Sci-Fi, Body Horror', '1982-tt0084787.webp', 'https://www.imdb.com/title/tt0084787/', 'https://i.pinimg.com/originals/73/88/c4/7388c4158417048176e613b26cb81d44.jpg', '', '', '{"releaseYear":1982,"horrorCanonRank":10,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0076786', 'Suspiria', 1977, 'Horror, Supernatural, Giallo', '1977-tt0076786.webp', 'https://www.imdb.com/title/tt0076786/', 'https://www.picclickimg.com/CcAAAOSwzvBimi-s/Suspiria-Film-1977-Poster-Poster-Poster-45X32Cm-Horror.webp', '', '', '{"releaseYear":1977,"horrorCanonRank":11,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0074285', 'Carrie', 1976, 'Horror, Supernatural, Drama', '1976-tt0074285.webp', 'https://www.imdb.com/title/tt0074285/', 'https://flxt.tmsimg.com/assets/p825_p_v10_ac.jpg', '', '', '{"releaseYear":1976,"horrorCanonRank":12,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0070917', 'The Wicker Man', 1973, 'Horror, Folk Horror, Mystery', '1973-tt0070917.webp', 'https://www.imdb.com/title/tt0070917/', 'https://cdn4.volusion.store/prakm-mcyzp/v/vspfiles/photos/DM010-2.jpg?v-cache=1714040731', '', '', '{"releaseYear":1973,"horrorCanonRank":13,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0069995', 'Don''t Look Now', 1973, 'Horror, Psychological, Drama', '1973-tt0069995.webp', 'https://www.imdb.com/title/tt0069995/', 'https://images.theposterdb.com/prod/public/images/posters/optimized/movies/90581/m8O131g4NpHXShOzMGOiRzEliM0AXZkJEuUYuONu.webp', '', '', '{"releaseYear":1973,"horrorCanonRank":14,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0110413', 'The Silence of the Lambs', 1991, 'Horror, Thriller, Crime', '1991-tt0110413.webp', 'https://www.imdb.com/title/tt0110413/', 'https://image.tmdb.org/t/p/original/IooakoQqnDux7ztudNqh96pQK2.jpg', '', '', '{"releaseYear":1991,"horrorCanonRank":15,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt5052448', 'Get Out', 2017, 'Horror, Thriller, Social Thriller', '2017-tt5052448.webp', 'https://www.imdb.com/title/tt5052448/', 'https://media.thecherrypicks.com/images/get_out-poster.max-400x600.format-jpeg.jpegquality-70.jpg', '', '', '{"releaseYear":2017,"horrorCanonRank":16,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0082933', 'Possession', 1981, 'Horror, Psychological, Drama', '1981-tt0082933.webp', 'https://www.imdb.com/title/tt0082933/', 'https://image.tmdb.org/t/p/w780/gA6XabL1MfSu9ey2OoB3fI9k3rm.jpg', '', '', '{"releaseYear":1981,"horrorCanonRank":17,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0048424', 'The Night of the Hunter', 1955, 'Horror, Thriller, Crime', '1955-tt0048424.webp', 'https://www.imdb.com/title/tt0048424/', 'https://image.tmdb.org/t/p/original/jlbz5L4bVjZWv8NoE3KOt4WRMYU.jpg', '', '', '{"releaseYear":1955,"horrorCanonRank":18,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0046911', 'Les Diaboliques', 1955, 'Horror, Thriller, Mystery', '1955-tt0046911.webp', 'https://www.imdb.com/title/tt0046911/', 'https://www.kinot.fi/app/uploads/2023/03/Les_Diaboliques_1955_poster.jpg', '', '', '{"releaseYear":1955,"horrorCanonRank":19,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0053459', 'Eyes Without a Face', 1960, 'Horror, Drama, Thriller', '1960-tt0053459.webp', 'https://www.imdb.com/title/tt0053459/', 'https://m.media-amazon.com/images/I/71OmUfQPK9L.jpg', '', '', '{"releaseYear":1960,"horrorCanonRank":20,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0054167', 'Peeping Tom', 1960, 'Horror, Psychological, Thriller', '1960-tt0054167.webp', 'https://www.imdb.com/title/tt0054167/', 'https://cdn.fstatic.com/media/movies/photos/2016/03/a-tortura-do-medo_t8367.jpg', '', '', '{"releaseYear":1960,"horrorCanonRank":21,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0055018', 'The Innocents', 1961, 'Horror, Supernatural, Gothic', '1961-tt0055018.webp', 'https://www.imdb.com/title/tt0055018/', 'https://forums.superherohype.com/proxy.php?image=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2Foriginal%2F33Gfavpf9nx0TxN6852NMTsxKRR.jpg&hash=9799eb15812260c1646bd4ede9d59bcc', '', '', '{"releaseYear":1961,"horrorCanonRank":22,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0077745', 'Invasion of the Body Snatchers', 1978, 'Horror, Sci-Fi, Thriller', '1978-tt0077745.webp', 'https://www.imdb.com/title/tt0077745/', 'https://cdn.posteritati.com/posters/000/000/076/603/invasion-of-the-body-snatchers-md-web.jpg', '', '', '{"releaseYear":1978,"horrorCanonRank":23,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0077402', 'Dawn of the Dead', 1978, 'Horror, Zombie, Action', '1978-tt0077402.webp', 'https://www.imdb.com/title/tt0077402/', 'https://media.posterlounge.com/img/products/710000/707950/707950_poster_l.jpg', '', '', '{"releaseYear":1978,"horrorCanonRank":24,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0075005', 'The Omen', 1976, 'Horror, Supernatural, Thriller', '1976-tt0075005.webp', 'https://www.imdb.com/title/tt0075005/', 'https://sinematavsiye.com/_next/image?url=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2Fw342%2FmDcjjEu1fMNmsXi4l4D8IftlTix.jpg&w=384&q=75', '', '', '{"releaseYear":1976,"horrorCanonRank":25,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0058279', 'Kwaidan', 1964, 'Horror, Anthology, Folk Horror', '1964-tt0058279.webp', 'https://www.imdb.com/title/tt0058279/', 'https://japanposter.co.uk/cdn/shop/files/IMG_0797_1200x1200.jpg?v=1731099428', '', '', '{"releaseYear":1964,"horrorCanonRank":26,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0059646', 'Repulsion', 1965, 'Horror, Psychological, Drama', '1965-tt0059646.webp', 'https://www.imdb.com/title/tt0059646/', 'https://cdn11.bigcommerce.com/s-8nvs2trnzz/products/674/images/1108/2601__90982.1695096728.386.513.jpg?c=1', '', '', '{"releaseYear":1965,"horrorCanonRank":27,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0057129', 'The Haunting', 1963, 'Horror, Supernatural, Gothic', '1963-tt0057129.webp', 'https://www.imdb.com/title/tt0057129/', 'https://rellimzone.com/images/movies/the-haunting-1963-movie-poster.png', '', '', '{"releaseYear":1963,"horrorCanonRank":28,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0056869', 'The Birds', 1963, 'Horror, Thriller, Natural Horror', '1963-tt0056869.webp', 'https://www.imdb.com/title/tt0056869/', 'https://photos1.blogger.com/blogger/5704/2104/1600/the%20birds.jpg', '', '', '{"releaseYear":1963,"horrorCanonRank":29,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0054067', 'Black Sunday', 1960, 'Horror, Gothic, Supernatural', '1960-tt0054067.webp', 'https://www.imdb.com/title/tt0054067/', 'https://images.fineartamerica.com/images/artworkimages/medium/3/black-sunday-kirsten-phillips-transparent.png', '', '', '{"releaseYear":1960,"horrorCanonRank":30,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0086541', 'Videodrome', 1983, 'Horror, Sci-Fi, Body Horror', '1983-tt0086541.webp', 'https://www.imdb.com/title/tt0086541/', 'https://i.ebayimg.com/images/g/AfEAAOSw-x5mXKVv/s-l600.webp', '', '', '{"releaseYear":1983,"horrorCanonRank":31,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0091064', 'The Fly', 1986, 'Horror, Sci-Fi, Body Horror', '1986-tt0091064.webp', 'https://www.imdb.com/title/tt0091064/', 'https://p2.bahamut.com.tw/HOME/creationCover/57/0006030357_B.JPG', '', '', '{"releaseYear":1986,"horrorCanonRank":32,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0087800', 'A Nightmare on Elm Street', 1984, 'Horror, Slasher, Supernatural', '1984-tt0087800.webp', 'https://www.imdb.com/title/tt0087800/', 'https://m.media-amazon.com/images/S/pv-target-images/30dcb8526170cb484d1cd2f19e0cba19633ed5b6df30de86d4b9732bcd833a6e.jpg', '', '', '{"releaseYear":1984,"horrorCanonRank":33,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0083907', 'The Evil Dead', 1981, 'Horror, Supernatural, Thriller', '1981-tt0083907.webp', 'https://www.imdb.com/title/tt0083907/', 'https://indiewrapmag.com/wp-content/uploads/2023/04/1-1990664190.jpeg', '', '', '{"releaseYear":1981,"horrorCanonRank":34,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0092991', 'Evil Dead II', 1987, 'Horror, Comedy, Supernatural', '1987-tt0092991.webp', 'https://www.imdb.com/title/tt0092991/', 'https://media-cache.cinematerial.com/p/500x/wddhrow6/evil-dead-ii-movie-poster.jpg?v=1456356208', '', '', '{"releaseYear":1987,"horrorCanonRank":35,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0093177', 'Hellraiser', 1987, 'Horror, Body Horror, Supernatural', '1987-tt0093177.webp', 'https://www.imdb.com/title/tt0093177/', 'https://images.plex.tv/photo?size=medium-360&scale=2&url=https%3A%2F%2Fmetadata-static.plex.tv%2F2%2Fgracenote%2F283eefe94b7a8fe1f02bf8512c182b88.jpg', '', '', '{"releaseYear":1987,"horrorCanonRank":36,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0089885', 'Re-Animator', 1985, 'Horror, Sci-Fi, Comedy', '1985-tt0089885.webp', 'https://www.imdb.com/title/tt0089885/', 'https://images.theposterdb.com/prod/public/images/posters/optimized/movies/22308/EO2YUtKBu9AEIbW6asZewOul2k5xLWoHJg33IYwK.webp', '', '', '{"releaseYear":1985,"horrorCanonRank":37,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0084516', 'Poltergeist', 1982, 'Horror, Supernatural, Thriller', '1982-tt0084516.webp', 'https://www.imdb.com/title/tt0084516/', 'https://www.cafedvd.com/images/items/6237th_.jpg', '', '', '{"releaseYear":1982,"horrorCanonRank":38,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0082010', 'An American Werewolf in London', 1981, 'Horror, Comedy, Werewolf', '1981-tt0082010.webp', 'https://www.imdb.com/title/tt0082010/', 'https://imagetmdb.nackhui.com/t/p/w780/60ZkILF0ynLeXsKhVfXO36Kyshr.jpg', '', '', '{"releaseYear":1981,"horrorCanonRank":39,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0080749', 'The Fog', 1980, 'Horror, Supernatural, Thriller', '1980-tt0080749.webp', 'https://www.imdb.com/title/tt0080749/', 'https://i.pinimg.com/736x/e1/35/23/e135237dbc64434cf42f0fc614b96d41.jpg', '', '', '{"releaseYear":1980,"horrorCanonRank":40,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0074486', 'Eraserhead', 1977, 'Horror, Surreal, Body Horror', '1977-tt0074486.webp', 'https://www.imdb.com/title/tt0074486/', 'https://cf.girlsaskguys.com/a31188/211d8a1c-b18f-4cf2-91b3-166448294ff5.jpg', '', '', '{"releaseYear":1977,"horrorCanonRank":41,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0076162', 'House', 1977, 'Horror, Comedy, Surreal', '1977-tt0076162.webp', 'https://www.imdb.com/title/tt0076162/', 'https://cdn.posteritati.com/posters/000/000/073/437/house-md-web.jpg', '', '', '{"releaseYear":1977,"horrorCanonRank":42,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0073582', 'Deep Red', 1975, 'Horror, Giallo, Thriller', '1975-tt0073582.webp', 'https://www.imdb.com/title/tt0073582/', 'https://cdn11.bigcommerce.com/s-yzgoj/products/2633250/images/5597390/apixpdcdf__57984.1626357350.500.659.jpg?c=2', '', '', '{"releaseYear":1975,"horrorCanonRank":43,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0074811', 'The Tenant', 1976, 'Horror, Psychological, Drama', '1976-tt0074811.webp', 'https://www.imdb.com/title/tt0074811/', 'https://thumbscore.net/posters/11482.jpg', '', '', '{"releaseYear":1976,"horrorCanonRank":44,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0077914', 'Martin', 1977, 'Horror, Vampire, Drama', '1977-tt0077914.webp', 'https://www.imdb.com/title/tt0077914/', 'https://up.picr.de/31450695tt.jpg', '', '', '{"releaseYear":1977,"horrorCanonRank":45,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0073650', 'Salò, or the 120 Days of Sodom', 1975, 'Horror, Drama, Art House', '1975-tt0073650.webp', 'https://www.imdb.com/title/tt0073650/', 'https://image.tmdb.org/t/p/w300_and_h450_bestv2/k2l7HRhEWn3mFv3QL3ogw5nOmfk.jpg', '', '', '{"releaseYear":1975,"horrorCanonRank":46,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0066993', 'The Devils', 1971, 'Horror, Historical, Drama', '1971-tt0066993.webp', 'https://www.imdb.com/title/tt0066993/', 'https://m.media-amazon.com/images/I/A1tgeg2geQL.jpg', '', '', '{"releaseYear":1971,"horrorCanonRank":47,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0055830', 'Carnival of Souls', 1962, 'Horror, Supernatural, Psychological', '1962-tt0055830.webp', 'https://www.imdb.com/title/tt0055830/', 'https://mfi.mediafilm.ca/multimedias/Carnival_of_Souls__Aff_.jpg', '', '', '{"releaseYear":1962,"horrorCanonRank":48,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0080516', 'The Changeling', 1980, 'Horror, Supernatural, Mystery', '1980-tt0080516.webp', 'https://www.imdb.com/title/tt0080516/', 'https://i.pinimg.com/originals/7b/a5/b9/7ba5b9479ac24dfd495fea113214ba6c.jpg', '', '', '{"releaseYear":1980,"horrorCanonRank":49,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0096163', 'The Vanishing', 1988, 'Horror, Thriller, Mystery', '1988-tt0096163.webp', 'https://www.imdb.com/title/tt0096163/', 'https://pbcdnw.aoneroom.com/image/2026/01/27/1d0612bf1950dcc87e11e3c728a48b90.jpg', '', '', '{"releaseYear":1988,"horrorCanonRank":50,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0094964', 'Dead Ringers', 1988, 'Horror, Psychological, Body Horror', '1988-tt0094964.webp', 'https://www.imdb.com/title/tt0094964/', 'https://www.merchfuse.com/wp-content/uploads/2026/01/Dead-Ringers-Mondo-2018.webp', '', '', '{"releaseYear":1988,"horrorCanonRank":51,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0099763', 'Henry: Portrait of a Serial Killer', 1986, 'Horror, Crime, Drama', '1986-tt0099763.webp', 'https://www.imdb.com/title/tt0099763/', 'https://flixnet.to/wp-content/uploads/2021/06/7hQr8BgylKB0mdwvdnBK5lNqVcx.jpg', '', '', '{"releaseYear":1986,"horrorCanonRank":52,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0092563', 'Angel Heart', 1987, 'Horror, Mystery, Neo-Noir', '1987-tt0092563.webp', 'https://www.imdb.com/title/tt0092563/', 'https://canvas-lb.tubitv.com/opts/TuEo0ziHESET3A==/d11057ac-d700-481b-a0a1-3d468f012912/CJgDEMcEOgUxLjEuOQ==', '', '', '{"releaseYear":1987,"horrorCanonRank":53,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0093605', 'Near Dark', 1987, 'Horror, Neo-Western, Vampire', '1987-tt0093605.webp', 'https://www.imdb.com/title/tt0093605/', 'http://thetelltalemind.com/wp-content/uploads/2021/10/near-dark-1.jpg', '', '', '{"releaseYear":1987,"horrorCanonRank":54,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0078908', 'The Brood', 1979, 'Horror, Body Horror, Psychological', '1979-tt0078908.webp', 'https://www.imdb.com/title/tt0078908/', '', '', '', '{"releaseYear":1979,"horrorCanonRank":55,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0099871', 'Jacob''s Ladder', 1990, 'Horror, Psychological, Mystery', '1990-tt0099871.webp', 'https://www.imdb.com/title/tt0099871/', 'https://image.tmdb.org/t/p/original/8mK0eam3Qw1OG7ZuxS5o1WCfrVv.jpg?v=9f08e7cb', '', '', '{"releaseYear":1990,"horrorCanonRank":56,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0100157', 'Misery', 1990, 'Horror, Thriller, Psychological', '1990-tt0100157.webp', 'https://www.imdb.com/title/tt0100157/', 'https://i.ebayimg.com/images/g/1~UAAOSwo4pYd-Aj/s-l400.jpg', '', '', '{"releaseYear":1990,"horrorCanonRank":57,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0062885', 'The Devil Rides Out', 1968, 'Horror, Occult, Thriller', '1968-tt0062885.webp', 'https://www.imdb.com/title/tt0062885/', 'https://m3u8proxy.dramaflix.workers.dev/?url=https://image.tmdb.org/t/p/original/rxRSG12lNjsIRFo5iVPNCovcGM1.jpg', '', '', '{"releaseYear":1968,"horrorCanonRank":58,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0103874', 'Bram Stoker''s Dracula', 1992, 'Horror, Gothic, Romance', '1992-tt0103874.webp', 'https://www.imdb.com/title/tt0103874/', 'https://dyn1.heritagestatic.com/ha?p=8-6-8-7-8687772&it=product', '', '', '{"releaseYear":1992,"horrorCanonRank":59,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0117571', 'Scream', 1996, 'Horror, Slasher, Mystery', '1996-tt0117571.webp', 'https://www.imdb.com/title/tt0117571/', 'https://www.syndetics.com/index.aspx?isbn=&issn=/LC.JPG&client=dentonpl&type=xw12&upc=031398135906&oclc=714897706', '', '', '{"releaseYear":1996,"horrorCanonRank":60,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0185937', 'The Blair Witch Project', 1999, 'Horror, Found Footage, Mystery', '1999-tt0185937.webp', 'https://www.imdb.com/title/tt0185937/', 'https://image.tgimovie.com/title/the-blair-witch-project/the-blair-witch-project.jpg?t=1&s=1', '', '', '{"releaseYear":1999,"horrorCanonRank":61,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0178868', 'Ringu', 1998, 'Horror, Supernatural, Mystery', '1998-tt0178868.webp', 'https://www.imdb.com/title/tt0178868/', 'https://m.media-amazon.com/images/M/MV5BZTI3ZjZlN2MtYWI1Zi00YTc3LWI4ZDQtZTdkNTBiNzVhMjY4XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg', '', '', '{"releaseYear":1998,"horrorCanonRank":62,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0235198', 'Audition', 1999, 'Horror, Psychological, Thriller', '1999-tt0235198.webp', 'https://www.imdb.com/title/tt0235198/', 'https://cdn.oz.veezi.com/media/data/v2/get/FilmPosterGraphic/k6d42d02trdwt4tvwg0x300vc8/ST00004451', '', '', '{"releaseYear":1999,"horrorCanonRank":63,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0167404', 'The Sixth Sense', 1999, 'Horror, Supernatural, Drama', '1999-tt0167404.webp', 'https://www.imdb.com/title/tt0167404/', 'https://imgix.bustle.com/uploads/image/2017/10/26/d8d87aac-ddb5-45b3-9cf9-7e68a8600b03-p23611_p_v8_ah.jpg?w=632&h=948&fit=crop&crop=faces', '', '', '{"releaseYear":1999,"horrorCanonRank":64,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0119167', 'Funny Games', 1997, 'Horror, Thriller, Psychological', '1997-tt0119167.webp', 'https://www.imdb.com/title/tt0119167/', 'https://onderhond.com/img/posters/funny-games-1997.jpg', '', '', '{"releaseYear":1997,"horrorCanonRank":65,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0156887', 'Perfect Blue', 1997, 'Horror, Psychological, Anime', '1997-tt0156887.webp', 'https://www.imdb.com/title/tt0156887/', 'https://cdn.posteritati.com/posters/000/000/071/028/perfect-blue-sm-web.jpg', '', '', '{"releaseYear":1997,"horrorCanonRank":66,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0113409', 'In the Mouth of Madness', 1994, 'Horror, Cosmic Horror, Mystery', '1994-tt0113409.webp', 'https://www.imdb.com/title/tt0113409/', 'https://www.joblo.com/wp-content/uploads/1995/02/1995-in-the-mouth-of-madness-poster1-400x600.jpg', '', '', '{"releaseYear":1994,"horrorCanonRank":67,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0230600', 'The Others', 2001, 'Horror, Supernatural, Gothic', '2001-tt0230600.webp', 'https://www.imdb.com/title/tt0230600/', 'http://ftertexter.se/wp-content/uploads/2023/12/Skarmbild-2023-12-01-084630-2.png', '', '', '{"releaseYear":2001,"horrorCanonRank":68,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0256009', 'The Devil''s Backbone', 2001, 'Horror, Gothic, Drama', '2001-tt0256009.webp', 'https://www.imdb.com/title/tt0256009/', 'https://image.tmdb.org/t/p/original/iJo17X7XjPwTJx7EwDdUJQgA9Uc.jpg', '', '', '{"releaseYear":2001,"horrorCanonRank":69,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0286751', 'Pulse', 2001, 'Horror, Supernatural, Techno-Horror', '2001-tt0286751.webp', 'https://www.imdb.com/title/tt0286751/', 'https://dyn1.heritagestatic.com/ha?p=2-2-0-7-7-22077703&w=850&h=600&it=product', '', '', '{"releaseYear":2001,"horrorCanonRank":70,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0239376', 'Trouble Every Day', 2001, 'Horror, Body Horror, Drama', '2001-tt0239376.webp', 'https://www.imdb.com/title/tt0239376/', 'https://tuchuang.org.cn/imgs/2025/12/10/9f59d48f42771bb7.webp', '', '', '{"releaseYear":2001,"horrorCanonRank":71,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0289043', '28 Days Later', 2002, 'Horror, Zombie, Thriller', '2002-tt0289043.webp', 'https://www.imdb.com/title/tt0289043/', 'https://www.fatguysatthemovies.com/wp-content/uploads/2015/08/28dayslater_fatguys_lg.jpg', '', '', '{"releaseYear":2002,"horrorCanonRank":72,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt7557108', 'Saint Maud', 2019, 'Horror, Psychological, Folk Horror', '2019-tt7557108.webp', 'https://www.imdb.com/title/tt7557108/', 'https://vygrnews.com/uploader/7e8de03f13f009af9204c414d1d3903fee85177af8acdffbd852a477604be5f0_1750935984.jpg', '', '', '{"releaseYear":2019,"horrorCanonRank":73,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0338095', 'High Tension', 2003, 'Horror, Slasher, Thriller', '2003-tt0338095.webp', 'https://www.imdb.com/title/tt0338095/', 'https://thenewbev.com/wp-content/uploads/2021/08/High-Tension-poster.jpg', '', '', '{"releaseYear":2003,"horrorCanonRank":74,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0365376', 'A Tale of Two Sisters', 2003, 'Horror, Psychological, Supernatural', '2003-tt0365376.webp', 'https://www.imdb.com/title/tt0365376/', 'https://images.theposterdb.com/prod/public/images/posters/optimized/movies/65687/4bMphAatxuYwSzqprLvB23DkthbDt4Z33JJ4Jlvk.webp', '', '', '{"releaseYear":2003,"horrorCanonRank":75,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0365748', 'Shaun of the Dead', 2004, 'Horror, Comedy, Zombie', '2004-tt0365748.webp', 'https://www.imdb.com/title/tt0365748/', 'https://cdn.prod.website-files.com/68221b5953c2915f47159690/69943f56255b61b332b74901_shaun-of-the-dead-2004_2731b11b11.jpg', '', '', '{"releaseYear":2004,"horrorCanonRank":76,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0435625', 'The Descent', 2005, 'Horror, Survival, Creature', '2005-tt0435625.webp', 'https://www.imdb.com/title/tt0435625/', 'https://image.tmdb.org/t/p/w300/3dT9xu8pGeHFlOxScWQP8KPGYw8.jpg', '', '', '{"releaseYear":2005,"horrorCanonRank":77,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt5215952', 'The Wailing', 2016, 'Horror, Folk Horror, Mystery', '2016-tt5215952.webp', 'https://www.imdb.com/title/tt5215952/', 'https://cdn.anisearch.jp/images/article/cover/136/136230_400.webp', '', '', '{"releaseYear":2016,"horrorCanonRank":78,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0468492', 'The Host', 2006, 'Horror, Creature, Comedy', '2006-tt0468492.webp', 'https://www.imdb.com/title/tt0468492/', 'https://onesheet.org/api/download?key=posters%2Fmodern%2F2006%2Fthe-host-2006-us-imax.jpg&name=the-host-2006-5.jpg', '', '', '{"releaseYear":2006,"horrorCanonRank":79,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt1038988', '[REC]', 2007, 'Horror, Found Footage, Zombie', '2007-tt1038988.webp', 'https://www.imdb.com/title/tt1038988/', 'https://images.theposterdb.com/prod/public/images/posters/optimized/movies/23441/4uvrjf8Y1TxtFWHF2Wno0d9U9j4gnIPJfDwHC0ev.jpg', '', '', '{"releaseYear":2007,"horrorCanonRank":80,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0884328', 'The Mist', 2007, 'Horror, Cosmic Horror, Survival', '2007-tt0884328.webp', 'https://www.imdb.com/title/tt0884328/', 'https://image.chilimovie.com/cos/20260825/300px/c4UgUKZjM0Qzy5t4hAXSOFHYsnb.jpg', '', '', '{"releaseYear":2007,"horrorCanonRank":81,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0464141', 'The Orphanage', 2007, 'Horror, Supernatural, Gothic', '2007-tt0464141.webp', 'https://www.imdb.com/title/tt0464141/', 'https://i.pinimg.com/236x/23/1f/3c/231f3c65cb77346a7c3bdbd58bfdb63d.jpg', '', '', '{"releaseYear":2007,"horrorCanonRank":82,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt1139797', 'Let the Right One In', 2008, 'Horror, Vampire, Romance', '2008-tt1139797.webp', 'https://www.imdb.com/title/tt1139797/', 'https://static.greatbigcanvas.com/images/print_rolled_posterpaper/movie-goods/let-the-right-one-in-2008,mg0083515.jpg', '', '', '{"releaseYear":2008,"horrorCanonRank":83,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt1127180', 'Drag Me to Hell', 2009, 'Horror, Supernatural, Comedy', '2009-tt1127180.webp', 'https://www.imdb.com/title/tt1127180/', 'https://assets.scriptslug.com/live/img/x/posters/2137/drag-me-to-hell-2009_2731b11b11.jpg', '', '', '{"releaseYear":2009,"horrorCanonRank":84,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt0870984', 'Antichrist', 2009, 'Horror, Psychological, Folk Horror', '2009-tt0870984.webp', 'https://www.imdb.com/title/tt0870984/', 'https://outlawvern.com/wp-content/uploads/2022/07/Antichrist-poster.jpg', '', '', '{"releaseYear":2009,"horrorCanonRank":85,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt4062536', 'Green Room', 2015, 'Horror, Thriller, Survival', '2015-tt4062536.webp', 'https://www.imdb.com/title/tt4062536/', 'https://www.tvyayinakisi.com/wp-content/uploads/2025/09/dehset-kapani-green-room-2015-691x1024.webp', '', '', '{"releaseYear":2015,"horrorCanonRank":86,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt2400463', 'The Invitation', 2015, 'Horror, Psychological, Thriller', '2015-tt2400463.webp', 'https://www.imdb.com/title/tt2400463/', 'https://media.endlesspopcorn.com/2020/12/the-invitation-tt2400463-poster-2605725313-20201231165146-600x900.jpg.webp', '', '', '{"releaseYear":2015,"horrorCanonRank":87,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt1259521', 'The Cabin in the Woods', 2011, 'Horror, Comedy, Meta', '2011-tt1259521.webp', 'https://www.imdb.com/title/tt1259521/', 'https://m.media-amazon.com/images/S/pv-target-images/22d006d696fc6bd2b651be22a849cb183decaed494ef7eeba01f3576ac46b10b.jpg', '', '', '{"releaseYear":2011,"horrorCanonRank":88,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt1457767', 'The Conjuring', 2013, 'Horror, Supernatural, Thriller', '2013-tt1457767.webp', 'https://www.imdb.com/title/tt1457767/', 'https://moviesbase-a.netlify.app/_next/image?url=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2Fw500%2FwVYREutTvI2tmxr6ujrHT704wGF.jpg&w=640&q=75', '', '', '{"releaseYear":2013,"horrorCanonRank":89,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt1441395', 'Under the Skin', 2013, 'Horror, Sci-Fi, Art House', '2013-tt1441395.webp', 'https://www.imdb.com/title/tt1441395/', 'https://image.tmdb.org/t/p/original/kg0A8J54R73z0ooYkcGWFyq4jLC.jpg?size=300-0', '', '', '{"releaseYear":2013,"horrorCanonRank":90,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt2321549', 'The Babadook', 2014, 'Horror, Psychological, Supernatural', '2014-tt2321549.webp', 'https://www.imdb.com/title/tt2321549/', 'https://images.theposterdb.com/prod/public/images/posters/optimized/movies/112899/RgGdEIlV2ymJVMbPNstLfjbpYYdGCIgOGLVgXQ6h.webp', '', '', '{"releaseYear":2014,"horrorCanonRank":91,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt3235888', 'It Follows', 2014, 'Horror, Supernatural, Thriller', '2014-tt3235888.webp', 'https://www.imdb.com/title/tt3235888/', 'http://wesleyanargus.com/2015/04/09/it-follows-review/it-follows-poster/', '', '', '{"releaseYear":2014,"horrorCanonRank":92,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt4263482', 'The Witch', 2015, 'Horror, Folk Horror, Historical', '2015-tt4263482.webp', 'https://www.imdb.com/title/tt4263482/', 'https://avatars.mds.yandex.net/get-entity_search/9721020/687364956/S168x252_2x', '', '', '{"releaseYear":2015,"horrorCanonRank":93,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt5700672', 'Train to Busan', 2016, 'Horror, Zombie, Action', '2016-tt5700672.webp', 'https://www.imdb.com/title/tt5700672/', 'https://lh3.googleusercontent.com/cxXj21jscVGi7rXLHNreJ_ylmc6BLybClarXH2_NZdf6_mzNbooU6lQfM5W0VNALyc56Iu5HCnCFpaj0FWWX2QDBx9bRsclFGXkVoUUYb78bvdCuMpnbzRd0R9Qm-OKj7k9Twd8=s0', '', '', '{"releaseYear":2016,"horrorCanonRank":94,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt7784604', 'Hereditary', 2018, 'Horror, Supernatural, Family Drama', '2018-tt7784604.webp', 'https://www.imdb.com/title/tt7784604/', '', '', '', '{"releaseYear":2018,"horrorCanonRank":95,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt6644200', 'A Quiet Place', 2018, 'Horror, Thriller, Sci-Fi', '2018-tt6644200.webp', 'https://www.imdb.com/title/tt6644200/', '', '', '', '{"releaseYear":2018,"horrorCanonRank":96,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt6857112', 'Us', 2019, 'Horror, Thriller, Home Invasion', '2019-tt6857112.webp', 'https://www.imdb.com/title/tt6857112/', '', '', '', '{"releaseYear":2019,"horrorCanonRank":97,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt8772262', 'Midsommar', 2019, 'Horror, Folk Horror, Drama', '2019-tt8772262.webp', 'https://www.imdb.com/title/tt8772262/', '', '', '', '{"releaseYear":2019,"horrorCanonRank":98,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt7984734', 'The Lighthouse', 2019, 'Horror, Psychological, Drama', '2019-tt7984734.webp', 'https://www.imdb.com/title/tt7984734/', '', '', '', '{"releaseYear":2019,"horrorCanonRank":99,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('tt1051906', 'The Invisible Man', 2020, 'Horror, Sci-Fi, Thriller', '2020-tt1051906.webp', 'https://www.imdb.com/title/tt1051906/', '', '', '', '{"releaseYear":2020,"horrorCanonRank":100,"horrorCanon":"Top 100 Horror 1950–2026"}', 0, 0, 0, 0, '{}', CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(imdb_id) DO UPDATE SET
  title = excluded.title, release_year = excluded.release_year, genre = excluded.genre,
  poster_key = excluded.poster_key,
  source_url = CASE WHEN excluded.source_url <> '' THEN excluded.source_url ELSE pix_movie_stats.source_url END,
  poster_source_url = CASE WHEN excluded.poster_source_url <> '' THEN excluded.poster_source_url ELSE pix_movie_stats.poster_source_url END,
  attributes_json = excluded.attributes_json, updated_at = excluded.updated_at;
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1973', 'tt0070047', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1973'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1973' AND imdb_id = 'tt0070047');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1960', 'tt0054215', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1960'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1960' AND imdb_id = 'tt0054215');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1974', 'tt0072271', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1974'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1974' AND imdb_id = 'tt0072271');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1980', 'tt0081505', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1980'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1980' AND imdb_id = 'tt0081505');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1979', 'tt0078748', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1979'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1979' AND imdb_id = 'tt0078748');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1968', 'tt0063522', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1968'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1968' AND imdb_id = 'tt0063522');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1978', 'tt0077651', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1978'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1978' AND imdb_id = 'tt0077651');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1968', 'tt0063350', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1968'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1968' AND imdb_id = 'tt0063350');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1975', 'tt0073195', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1975'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1975' AND imdb_id = 'tt0073195');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1982', 'tt0084787', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1982'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1982' AND imdb_id = 'tt0084787');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1977', 'tt0076786', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1977'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1977' AND imdb_id = 'tt0076786');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1976', 'tt0074285', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1976'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1976' AND imdb_id = 'tt0074285');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1973', 'tt0070917', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1973'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1973' AND imdb_id = 'tt0070917');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1973', 'tt0069995', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1973'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1973' AND imdb_id = 'tt0069995');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1991', 'tt0110413', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1991'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1991' AND imdb_id = 'tt0110413');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2017', 'tt5052448', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2017'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2017' AND imdb_id = 'tt5052448');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1981', 'tt0082933', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1981'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1981' AND imdb_id = 'tt0082933');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1955', 'tt0048424', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1955'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1955' AND imdb_id = 'tt0048424');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1955', 'tt0046911', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1955'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1955' AND imdb_id = 'tt0046911');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1960', 'tt0053459', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1960'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1960' AND imdb_id = 'tt0053459');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1960', 'tt0054167', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1960'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1960' AND imdb_id = 'tt0054167');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1961', 'tt0055018', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1961'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1961' AND imdb_id = 'tt0055018');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1978', 'tt0077745', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1978'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1978' AND imdb_id = 'tt0077745');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1978', 'tt0077402', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1978'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1978' AND imdb_id = 'tt0077402');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1976', 'tt0075005', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1976'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1976' AND imdb_id = 'tt0075005');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1964', 'tt0058279', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1964'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1964' AND imdb_id = 'tt0058279');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1965', 'tt0059646', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1965'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1965' AND imdb_id = 'tt0059646');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1963', 'tt0057129', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1963'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1963' AND imdb_id = 'tt0057129');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1963', 'tt0056869', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1963'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1963' AND imdb_id = 'tt0056869');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1960', 'tt0054067', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1960'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1960' AND imdb_id = 'tt0054067');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1983', 'tt0086541', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1983'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1983' AND imdb_id = 'tt0086541');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1986', 'tt0091064', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1986'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1986' AND imdb_id = 'tt0091064');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1984', 'tt0087800', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1984'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1984' AND imdb_id = 'tt0087800');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1981', 'tt0083907', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1981'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1981' AND imdb_id = 'tt0083907');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1987', 'tt0092991', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1987'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1987' AND imdb_id = 'tt0092991');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1987', 'tt0093177', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1987'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1987' AND imdb_id = 'tt0093177');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1985', 'tt0089885', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1985'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1985' AND imdb_id = 'tt0089885');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1982', 'tt0084516', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1982'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1982' AND imdb_id = 'tt0084516');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1981', 'tt0082010', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1981'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1981' AND imdb_id = 'tt0082010');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1980', 'tt0080749', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1980'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1980' AND imdb_id = 'tt0080749');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1977', 'tt0074486', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1977'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1977' AND imdb_id = 'tt0074486');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1977', 'tt0076162', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1977'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1977' AND imdb_id = 'tt0076162');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1975', 'tt0073582', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1975'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1975' AND imdb_id = 'tt0073582');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1976', 'tt0074811', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1976'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1976' AND imdb_id = 'tt0074811');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1977', 'tt0077914', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1977'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1977' AND imdb_id = 'tt0077914');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1975', 'tt0073650', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1975'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1975' AND imdb_id = 'tt0073650');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1971', 'tt0066993', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1971'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1971' AND imdb_id = 'tt0066993');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1962', 'tt0055830', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1962'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1962' AND imdb_id = 'tt0055830');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1980', 'tt0080516', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1980'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1980' AND imdb_id = 'tt0080516');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1988', 'tt0096163', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1988'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1988' AND imdb_id = 'tt0096163');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1988', 'tt0094964', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1988'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1988' AND imdb_id = 'tt0094964');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1986', 'tt0099763', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1986'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1986' AND imdb_id = 'tt0099763');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1987', 'tt0092563', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1987'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1987' AND imdb_id = 'tt0092563');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1987', 'tt0093605', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1987'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1987' AND imdb_id = 'tt0093605');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1979', 'tt0078908', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1979'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1979' AND imdb_id = 'tt0078908');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1990', 'tt0099871', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1990'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1990' AND imdb_id = 'tt0099871');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1990', 'tt0100157', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1990'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1990' AND imdb_id = 'tt0100157');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1968', 'tt0062885', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1968'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1968' AND imdb_id = 'tt0062885');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1992', 'tt0103874', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1992'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1992' AND imdb_id = 'tt0103874');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1996', 'tt0117571', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1996'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1996' AND imdb_id = 'tt0117571');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1999', 'tt0185937', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1999'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1999' AND imdb_id = 'tt0185937');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1998', 'tt0178868', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1998'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1998' AND imdb_id = 'tt0178868');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1999', 'tt0235198', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1999'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1999' AND imdb_id = 'tt0235198');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1999', 'tt0167404', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1999'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1999' AND imdb_id = 'tt0167404');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1997', 'tt0119167', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1997'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1997' AND imdb_id = 'tt0119167');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1997', 'tt0156887', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1997'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1997' AND imdb_id = 'tt0156887');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-1994', 'tt0113409', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-1994'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-1994' AND imdb_id = 'tt0113409');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2001', 'tt0230600', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2001'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2001' AND imdb_id = 'tt0230600');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2001', 'tt0256009', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2001'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2001' AND imdb_id = 'tt0256009');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2001', 'tt0286751', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2001'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2001' AND imdb_id = 'tt0286751');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2001', 'tt0239376', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2001'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2001' AND imdb_id = 'tt0239376');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2002', 'tt0289043', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2002'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2002' AND imdb_id = 'tt0289043');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2019', 'tt7557108', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2019'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2019' AND imdb_id = 'tt7557108');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2003', 'tt0338095', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2003'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2003' AND imdb_id = 'tt0338095');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2003', 'tt0365376', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2003'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2003' AND imdb_id = 'tt0365376');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2004', 'tt0365748', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2004'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2004' AND imdb_id = 'tt0365748');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2005', 'tt0435625', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2005'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2005' AND imdb_id = 'tt0435625');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2016', 'tt5215952', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2016'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2016' AND imdb_id = 'tt5215952');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2006', 'tt0468492', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2006'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2006' AND imdb_id = 'tt0468492');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2007', 'tt1038988', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2007'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2007' AND imdb_id = 'tt1038988');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2007', 'tt0884328', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2007'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2007' AND imdb_id = 'tt0884328');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2007', 'tt0464141', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2007'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2007' AND imdb_id = 'tt0464141');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2008', 'tt1139797', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2008'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2008' AND imdb_id = 'tt1139797');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2009', 'tt1127180', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2009'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2009' AND imdb_id = 'tt1127180');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2009', 'tt0870984', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2009'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2009' AND imdb_id = 'tt0870984');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2015', 'tt4062536', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2015'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2015' AND imdb_id = 'tt4062536');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2015', 'tt2400463', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2015'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2015' AND imdb_id = 'tt2400463');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2011', 'tt1259521', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2011'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2011' AND imdb_id = 'tt1259521');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2013', 'tt1457767', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2013'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2013' AND imdb_id = 'tt1457767');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2013', 'tt1441395', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2013'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2013' AND imdb_id = 'tt1441395');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2014', 'tt2321549', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2014'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2014' AND imdb_id = 'tt2321549');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2014', 'tt3235888', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2014'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2014' AND imdb_id = 'tt3235888');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2015', 'tt4263482', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2015'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2015' AND imdb_id = 'tt4263482');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2016', 'tt5700672', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2016'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2016' AND imdb_id = 'tt5700672');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2018', 'tt7784604', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2018'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2018' AND imdb_id = 'tt7784604');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2018', 'tt6644200', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2018'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2018' AND imdb_id = 'tt6644200');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2019', 'tt6857112', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2019'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2019' AND imdb_id = 'tt6857112');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2019', 'tt8772262', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2019'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2019' AND imdb_id = 'tt8772262');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2019', 'tt7984734', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2019'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2019' AND imdb_id = 'tt7984734');
--> statement-breakpoint
INSERT INTO pix_movie_deck_entries (deck_key, imdb_id, position, created_at)
SELECT 'year-2020', 'tt1051906', COALESCE((SELECT MAX(position) FROM pix_movie_deck_entries WHERE deck_key = 'year-2020'), 0) + 1, CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM pix_movie_deck_entries WHERE deck_key = 'year-2020' AND imdb_id = 'tt1051906');
