-- 001_trailer_scraper.sql
-- pix.mov — Movie trailer scraper tables
-- Categories, videos (trailers), video versions (transcoded variants)

-- ─── Categories (Phase 1 reuse) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug      TEXT NOT NULL UNIQUE,
  name      TEXT NOT NULL,
  emoji     TEXT DEFAULT '',
  color     TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO categories (slug, name, emoji, color, sort_order) VALUES
  ('action', 'Action', '💥', '#ef4444', 1),
  ('comedy', 'Comedy', '😂', '#f59e0b', 2),
  ('drama', 'Drama', '🎭', '#8b5cf6', 3),
  ('sci-fi', 'Sci-Fi', '🚀', '#06b6d4', 4),
  ('horror', 'Horror', '👻', '#dc2626', 5),
  ('indie', 'Indie', '🎬', '#f97316', 6),
  ('animation', 'Animation', '🐭', '#3b82f6', 7),
  ('documentary', 'Documentary', '📽️', '#22c55e', 8)
ON CONFLICT (slug) DO NOTHING;

-- ─── Videos Table ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS videos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT DEFAULT '',

  -- Metadata
  release_year  INTEGER,
  genre        TEXT DEFAULT '',
  studio       TEXT DEFAULT '',
  duration_secs INTEGER DEFAULT 0,

  -- Trailer type: teaser, official, clip, behind-the-scenes
  trailer_type TEXT NOT NULL DEFAULT 'official',

  -- Category
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Source attribution
  source_name  TEXT DEFAULT '',    -- e.g. "Warner Bros. Pictures"
  source_url   TEXT DEFAULT '',    -- e.g. "https://youtube.com/watch?v=..."
  source_type  TEXT DEFAULT 'youtube',  -- youtube, apple, imdb, tmdb

  -- Thumbnail
  thumbnail_url TEXT DEFAULT '',
  thumbnail_b2_key TEXT DEFAULT '',

  -- Transcoded versions manifest (stored as JSONB array)
  -- [{ "resolution": "1080p", "url": "...", "b2_key": "...", "size_bytes": 0 }]
  versions     JSONB NOT NULL DEFAULT '[]',

  -- Flags
  is_featured  BOOLEAN DEFAULT FALSE,
  view_count   INTEGER DEFAULT 0,
  featured_order INTEGER DEFAULT 0,

  -- Status
  status       TEXT NOT NULL DEFAULT 'published'
                 CHECK (status IN ('draft', 'published', 'archived')),

  owner_id     UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos(is_featured, featured_order) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_videos_source_type ON videos(source_type);

-- ─── Video Versions (individual transcoded files, alternative to JSONB manifest) ──

CREATE TABLE IF NOT EXISTS video_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id     UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  resolution   TEXT NOT NULL,        -- 1080p, 720p, 480p, source
  file_url     TEXT NOT NULL,
  b2_key       TEXT NOT NULL,
  size_bytes   BIGINT DEFAULT 0,
  format       TEXT DEFAULT 'mp4',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (video_id, resolution)
);

CREATE INDEX IF NOT EXISTS idx_video_versions_video ON video_versions(video_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_versions ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_videos" ON videos FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "public_read_versions" ON video_versions FOR SELECT TO anon, authenticated USING (true);

-- Service role all access
CREATE POLICY "service_role_all_categories" ON categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_videos" ON videos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_versions" ON video_versions FOR ALL TO service_role USING (true) WITH CHECK (true);
