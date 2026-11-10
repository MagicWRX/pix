-- PIX portable: classic films + clips (Dracula 1931, 38 segments).
-- Run in the Supabase SQL editor AFTER the main 7-schema migration.
-- Clip stream URLs resolve from the server's CLASSIC_CLIPS_BASE_URL;
-- stream_url is a per-clip override (empty = not yet uploaded).

CREATE TABLE IF NOT EXISTS "pix2"."pix_classic_films" (
    "film_key" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "release_year" BIGINT NOT NULL,
    "director" TEXT NOT NULL DEFAULT '',
    "synopsis" TEXT NOT NULL DEFAULT '',
    "path_prefix" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS "pix2"."pix_classic_clips" (
    "id" BIGSERIAL PRIMARY KEY,
    "film_key" TEXT NOT NULL REFERENCES "pix2"."pix_classic_films"("film_key"),
    "segment" BIGINT NOT NULL,
    "filename" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration_sec" DOUBLE PRECISION,
    "size_bytes" BIGINT NOT NULL,
    "stream_url" TEXT NOT NULL DEFAULT '',
    "created_at" BIGINT NOT NULL,
    UNIQUE ("film_key", "segment")
);
CREATE INDEX IF NOT EXISTS "pix2_pix_classic_clips_film_idx" ON "pix2"."pix_classic_clips" ("film_key", "segment");

INSERT INTO "pix2"."pix_classic_films" ("film_key","title","release_year","director","synopsis","path_prefix","created_at")
VALUES ('dracula-1931', 'Dracula', 1931, 'Tod Browning', 'Bela Lugosi stars as Count Dracula in the 1931 Universal classic. Presented here in 38 segments.', 'pix/dracula-1931/clips', 1791945600000)
ON CONFLICT (film_key) DO NOTHING;

INSERT INTO "pix2"."pix_classic_clips" ("film_key","segment","filename","title","duration_sec","size_bytes","stream_url","created_at")
VALUES
('dracula-1931', 1, 'dracula-1931-clip-01.mp4', 'Dracula (1931) - Part 1 of 38', 119.04, 42264104, '', 1791945600000),
('dracula-1931', 2, 'dracula-1931-clip-02.mp4', 'Dracula (1931) - Part 2 of 38', 119.03, 59098094, '', 1791945600000),
('dracula-1931', 3, 'dracula-1931-clip-03.mp4', 'Dracula (1931) - Part 3 of 38', 119.03, 46171617, '', 1791945600000),
('dracula-1931', 4, 'dracula-1931-clip-04.mp4', 'Dracula (1931) - Part 4 of 38', 119.03, 66057352, '', 1791945600000),
('dracula-1931', 5, 'dracula-1931-clip-05.mp4', 'Dracula (1931) - Part 5 of 38', 119.04, 35219260, '', 1791945600000),
('dracula-1931', 6, 'dracula-1931-clip-06.mp4', 'Dracula (1931) - Part 6 of 38', 119.04, 31857993, '', 1791945600000),
('dracula-1931', 7, 'dracula-1931-clip-07.mp4', 'Dracula (1931) - Part 7 of 38', 119.04, 22577253, '', 1791945600000),
('dracula-1931', 8, 'dracula-1931-clip-08.mp4', 'Dracula (1931) - Part 8 of 38', 119.03, 32853718, '', 1791945600000),
('dracula-1931', 9, 'dracula-1931-clip-09.mp4', 'Dracula (1931) - Part 9 of 38', 119.03, 49976808, '', 1791945600000),
('dracula-1931', 10, 'dracula-1931-clip-10.mp4', 'Dracula (1931) - Part 10 of 38', 119.03, 62438548, '', 1791945600000),
('dracula-1931', 11, 'dracula-1931-clip-11.mp4', 'Dracula (1931) - Part 11 of 38', 119.03, 55035259, '', 1791945600000),
('dracula-1931', 12, 'dracula-1931-clip-12.mp4', 'Dracula (1931) - Part 12 of 38', 119.04, 46464423, '', 1791945600000),
('dracula-1931', 13, 'dracula-1931-clip-13.mp4', 'Dracula (1931) - Part 13 of 38', 119.04, 24296122, '', 1791945600000),
('dracula-1931', 14, 'dracula-1931-clip-14.mp4', 'Dracula (1931) - Part 14 of 38', 119.04, 49396373, '', 1791945600000),
('dracula-1931', 15, 'dracula-1931-clip-15.mp4', 'Dracula (1931) - Part 15 of 38', 119.03, 32270492, '', 1791945600000),
('dracula-1931', 16, 'dracula-1931-clip-16.mp4', 'Dracula (1931) - Part 16 of 38', 119.03, 67924742, '', 1791945600000),
('dracula-1931', 17, 'dracula-1931-clip-17.mp4', 'Dracula (1931) - Part 17 of 38', 119.03, 36834073, '', 1791945600000),
('dracula-1931', 18, 'dracula-1931-clip-18.mp4', 'Dracula (1931) - Part 18 of 38', 119.03, 41547775, '', 1791945600000),
('dracula-1931', 19, 'dracula-1931-clip-19.mp4', 'Dracula (1931) - Part 19 of 38', 119.04, 38766026, '', 1791945600000),
('dracula-1931', 20, 'dracula-1931-clip-20.mp4', 'Dracula (1931) - Part 20 of 38', 119.04, 50728138, '', 1791945600000),
('dracula-1931', 21, 'dracula-1931-clip-21.mp4', 'Dracula (1931) - Part 21 of 38', 119.04, 45092627, '', 1791945600000),
('dracula-1931', 22, 'dracula-1931-clip-22.mp4', 'Dracula (1931) - Part 22 of 38', 119.03, 37017271, '', 1791945600000),
('dracula-1931', 23, 'dracula-1931-clip-23.mp4', 'Dracula (1931) - Part 23 of 38', 119.03, 41978052, '', 1791945600000),
('dracula-1931', 24, 'dracula-1931-clip-24.mp4', 'Dracula (1931) - Part 24 of 38', 119.03, 38821092, '', 1791945600000),
('dracula-1931', 25, 'dracula-1931-clip-25.mp4', 'Dracula (1931) - Part 25 of 38', 119.04, 33479566, '', 1791945600000),
('dracula-1931', 26, 'dracula-1931-clip-26.mp4', 'Dracula (1931) - Part 26 of 38', 119.04, 50791820, '', 1791945600000),
('dracula-1931', 27, 'dracula-1931-clip-27.mp4', 'Dracula (1931) - Part 27 of 38', 119.04, 44992461, '', 1791945600000),
('dracula-1931', 28, 'dracula-1931-clip-28.mp4', 'Dracula (1931) - Part 28 of 38', 119.04, 43246508, '', 1791945600000),
('dracula-1931', 29, 'dracula-1931-clip-29.mp4', 'Dracula (1931) - Part 29 of 38', 119.03, 33343858, '', 1791945600000),
('dracula-1931', 30, 'dracula-1931-clip-30.mp4', 'Dracula (1931) - Part 30 of 38', 119.03, 42340642, '', 1791945600000),
('dracula-1931', 31, 'dracula-1931-clip-31.mp4', 'Dracula (1931) - Part 31 of 38', 119.03, 38286871, '', 1791945600000),
('dracula-1931', 32, 'dracula-1931-clip-32.mp4', 'Dracula (1931) - Part 32 of 38', 119.04, 42081971, '', 1791945600000),
('dracula-1931', 33, 'dracula-1931-clip-33.mp4', 'Dracula (1931) - Part 33 of 38', 119.04, 52345994, '', 1791945600000),
('dracula-1931', 34, 'dracula-1931-clip-34.mp4', 'Dracula (1931) - Part 34 of 38', 119.04, 38190460, '', 1791945600000),
('dracula-1931', 35, 'dracula-1931-clip-35.mp4', 'Dracula (1931) - Part 35 of 38', 119.04, 33918393, '', 1791945600000),
('dracula-1931', 36, 'dracula-1931-clip-36.mp4', 'Dracula (1931) - Part 36 of 38', 119.03, 36431087, '', 1791945600000),
('dracula-1931', 37, 'dracula-1931-clip-37.mp4', 'Dracula (1931) - Part 37 of 38', 119.03, 44430499, '', 1791945600000),
('dracula-1931', 38, 'dracula-1931-clip-38.mp4', 'Dracula (1931) - Part 38 of 38', 63.4, 20641614, '', 1791945600000)
ON CONFLICT (film_key, segment) DO NOTHING;
