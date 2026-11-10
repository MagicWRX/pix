DROP TABLE entries;
--> statement-breakpoint
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  entity_key TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  note_date TEXT,
  tags TEXT NOT NULL DEFAULT '',
  sort_order INTEGER,
  parent_note_id INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (parent_note_id) REFERENCES notes(id) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX notes_entity_key_idx ON notes (entity_key);
--> statement-breakpoint
CREATE INDEX notes_kind_idx ON notes (kind);
--> statement-breakpoint
CREATE INDEX notes_dream_date_idx ON notes (note_date DESC, created_at DESC);
--> statement-breakpoint
CREATE INDEX notes_parent_idx ON notes (parent_note_id);
--> statement-breakpoint
INSERT INTO notes (id, kind, entity_key, title, body, note_date, tags, sort_order, parent_note_id, created_at, updated_at) VALUES
(10, 'section', 'section-notes', 'Notes', '', NULL, 'section', 1, NULL, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(11, 'section', 'section-dream-log', 'Dream Log', '', NULL, 'section', 2, NULL, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(12, 'section', 'section-monsters', 'Monsters', '', NULL, 'section', 3, NULL, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(13, 'section', 'section-posters', 'Posters', '', NULL, 'section', 4, NULL, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(20, 'scratchpad', 'scratchpad', 'Scratchpad', '', NULL, 'notes', 1, 10, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(100, 'monster', 'monster-gargon', 'Gargon', '', NULL, 'monster,kaiju', 1, 12, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(101, 'monster', 'monster-kragath', 'Kragath', '', NULL, 'monster,kaiju', 2, 12, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(102, 'monster', 'monster-morvax', 'Morvax', '', NULL, 'monster,kaiju', 3, 12, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(103, 'monster', 'monster-vulkar', 'Vulkar', '', NULL, 'monster,kaiju', 4, 12, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(200, 'poster', 'rampage-of-the-titan', 'Rampage of the Titan', '', NULL, 'poster,monster:Gargon', 1, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(201, 'poster', 'rampage-of-the-titan-v2', 'Rampage of the Titan — v2 simplified', 'Simplified variant', NULL, 'poster,monster:Gargon', 2, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(202, 'poster', 'rampage-of-the-titan-v3', 'Rampage of the Titan — v3 bold / minimal', 'Bold / minimal variant', NULL, 'poster,monster:Gargon', 3, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(203, 'poster', 'terror-of-kragath', 'Terror of Kragath', '', NULL, 'poster,monster:Kragath', 4, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(204, 'poster', 'the-wrath-of-morvax', 'The Wrath of Morvax', '', NULL, 'poster,monster:Morvax', 5, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(205, 'poster', 'vulkar-two-heads-of-terror', 'Vulkar: Two Heads of Terror', 'Pulp sci-fi', NULL, 'poster,monster:Vulkar', 6, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(206, 'poster', 'vulkar-two-heads-of-terror-cartoon', 'Vulkar: Two Heads of Terror — cartoon', 'Hanna-Barbera style', NULL, 'poster,monster:Vulkar', 7, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(207, 'poster', 'vulkar-two-heads-of-terror-motu', 'Vulkar: Two Heads of Terror — MOTU', 'Masters of the Universe / Filmation style', NULL, 'poster,monster:Vulkar', 8, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(208, 'poster', 'vulkar-two-heads-of-terror-frazetta', 'Vulkar: Two Heads of Terror — Frazetta', 'Frazetta / Heavy Metal style', NULL, 'poster,monster:Vulkar', 9, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(209, 'poster', 'vulkar-two-heads-of-terror-moebius', 'Vulkar: Two Heads of Terror — Moebius', 'Moebius style', NULL, 'poster,monster:Vulkar', 10, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(210, 'poster', 'neon-city-sample', 'Neon City Sample', '', NULL, 'poster,sample,environment', 11, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
(211, 'poster', 'mountain-lake-sample', 'Mountain Lake Sample', '', NULL, 'poster,sample,environment', 12, 13, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000);
