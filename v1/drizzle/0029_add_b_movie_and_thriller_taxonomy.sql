INSERT INTO pix_horror_tags (tag_key, label, description, sort_order, created_at) VALUES
  ('drive-in-classics', 'Drive-In Classics', 'Horror staples closely associated with drive-in exhibition.', 84, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('scream-queens', 'Scream Queens', 'Horror films centered on defining scream-queen performances.', 85, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('practical-effects-showcases', 'Practical Effects Showcases', 'Makeup, creature, gore, and transformation effects achieved principally in camera.', 86, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('rubber-suit-monsters', 'Rubber-Suit Monsters', 'Creature films built around performers in monster suits.', 87, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('atomic-age-horror', 'Atomic Age Horror', 'Cold War, radiation, science, and mutation horror of the atomic era.', 88, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('exploitation', 'Exploitation', 'Horror shaped by exploitation-cinema subjects, production, or distribution.', 89, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('schlock', 'Schlock', 'Deliberately or exuberantly disreputable low-budget horror spectacle.', 90, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('shot-on-video', 'Shot-on-Video', 'Horror produced primarily on consumer or professional video rather than film.', 91, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('regional-horror', 'Regional Horror', 'Independent horror whose identity is rooted in a specific region and local production culture.', 92, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('cult-classics', 'Cult Classics', 'Horror with enduring, devoted cult audiences.', 93, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('b-movie-sci-fi', 'B-Movie Sci-Fi', 'Low-budget science-fiction horror and creature pictures.', 94, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('drive-in-double-feature', 'Drive-In Double Feature', 'Films suited to the classic two-picture drive-in program.', 95, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('low-budget-legends', 'Low-Budget Legends', 'Landmark horror made with unusually limited production resources.', 96, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('stop-motion-monsters', 'Stop-Motion Monsters', 'Creature features whose monsters are realized substantially through stop-motion animation.', 97, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('so-bad-its-good', 'So-Bad-It''s-Good', 'Notorious genre pleasures celebrated for conspicuous flaws and excess.', 98, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('guilty-pleasures', 'Guilty Pleasures', 'Frequently rewatched horror pleasures embraced despite critical reputation.', 99, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('video-store-gems', 'Video Store Gems', 'Genre favorites whose afterlife was built through VHS and video-store discovery.', 100, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('late-night-cable', 'Late-Night Cable', 'Horror closely associated with late-night television and cable discovery.', 101, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('b-movie-kings', 'B-Movie Kings', 'Films associated with defining male stars, directors, and producers of B cinema.', 102, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('drive-in-fare', 'Drive-In Fare', 'Accessible exploitation, monster, and horror fare made for drive-in crowds.', 103, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(tag_key) DO UPDATE SET label = excluded.label, description = excluded.description, sort_order = excluded.sort_order;
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'drive-in-classics', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Blob','The Fly','Night of the Living Dead','The Texas Chain Saw Massacre','The Hills Have Eyes','The Evil Dead','Halloween','Killer Klowns from Outer Space');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'scream-queens', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Halloween','A Nightmare on Elm Street','Scream','The Texas Chain Saw Massacre','The Fog','Prom Night','Friday the 13th','The Descent');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'practical-effects-showcases', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Thing','An American Werewolf in London','The Fly','The Evil Dead','Alien','Aliens','The Blob','The Howling','Re-Animator','The Return of the Living Dead');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'rubber-suit-monsters', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Godzilla','Gojira','Creature from the Black Lagoon','The Creature from the Black Lagoon','The Deadly Spawn','Killer Klowns from Outer Space');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'atomic-age-horror', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Godzilla','Gojira','The Blob','Invasion of the Body Snatchers','Them!','The Fly','The Incredible Shrinking Man','The Beast from 20,000 Fathoms');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'exploitation', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Texas Chain Saw Massacre','The Hills Have Eyes','I Spit on Your Grave','Cannibal Holocaust','The Last House on the Left','The Devils Rejects','The Devil''s Rejects');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'schlock', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Attack of the Killer Tomatoes!','The Toxic Avenger','Re-Animator','The Stuff','Killer Klowns from Outer Space','Basket Case','Maximum Overdrive');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'shot-on-video', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Video Dead','Things','Boardinghouse','Sledgehammer','Video Violence','Truth or Dare?: A Critical Madness');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'regional-horror', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Texas Chain Saw Massacre','Night of the Living Dead','The Evil Dead','The Town That Dreaded Sundown','Carnival of Souls','The Legend of Boggy Creek');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'cult-classics', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Evil Dead','The Return of the Living Dead','Re-Animator','Killer Klowns from Outer Space','The Wicker Man','Suspiria','The Thing','Fright Night','Phantasm','The Rocky Horror Picture Show');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'b-movie-sci-fi', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Blob','The Fly','Killer Klowns from Outer Space','The Stuff','The Deadly Spawn','Night of the Creeps','Chopping Mall');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'drive-in-double-feature', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Blob','The Fly','Night of the Living Dead','The Texas Chain Saw Massacre','The Hills Have Eyes','Killer Klowns from Outer Space','The Evil Dead');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'low-budget-legends', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Night of the Living Dead','The Texas Chain Saw Massacre','Halloween','The Evil Dead','The Blair Witch Project','Paranormal Activity','Carnival of Souls');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'stop-motion-monsters', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Beast from 20,000 Fathoms','It Came from Beneath the Sea','Jason and the Argonauts','The Valley of Gwangi','The Black Scorpion');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'so-bad-its-good', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Troll 2','Plan 9 from Outer Space','Birdemic: Shock and Terror','Manos: The Hands of Fate','Maximum Overdrive','The Wicker Man');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'guilty-pleasures', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Killer Klowns from Outer Space','Maximum Overdrive','Leprechaun','House of Wax','Final Destination','The Babysitter','Happy Death Day');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'video-store-gems', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Return of the Living Dead','Re-Animator','The Blob','Society','Fright Night','The Lost Boys','Night of the Creeps','The Gate');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'late-night-cable', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Basket Case','Re-Animator','Killer Klowns from Outer Space','Night of the Comet','The Lost Boys','Maximum Overdrive','Fright Night');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'b-movie-kings', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Masque of the Red Death','The Raven','House of Usher','The Little Shop of Horrors','The Abominable Dr. Phibes','Re-Animator','The Fly');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_horror_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'drive-in-fare', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Blob','The Fly','Night of the Living Dead','The Texas Chain Saw Massacre','The Hills Have Eyes','The Evil Dead','Killer Klowns from Outer Space','The Stuff');
--> statement-breakpoint
CREATE TABLE pix_thriller_tags (
  tag_key text PRIMARY KEY NOT NULL,
  label text NOT NULL,
  description text DEFAULT '' NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX pix_thriller_tags_label_idx ON pix_thriller_tags (label);
--> statement-breakpoint
CREATE TABLE pix_movie_thriller_tags (
  imdb_id text NOT NULL,
  tag_key text NOT NULL,
  wave_number integer NOT NULL,
  created_at integer NOT NULL,
  PRIMARY KEY (imdb_id, tag_key),
  FOREIGN KEY (imdb_id) REFERENCES pix_movie_stats(imdb_id) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (tag_key) REFERENCES pix_thriller_tags(tag_key) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX pix_movie_thriller_tags_wave_idx ON pix_movie_thriller_tags (wave_number, tag_key);
--> statement-breakpoint
CREATE INDEX pix_movie_thriller_tags_tag_idx ON pix_movie_thriller_tags (tag_key, imdb_id);
--> statement-breakpoint
INSERT INTO pix_thriller_tags (tag_key, label, description, sort_order, created_at) VALUES
  ('thriller', 'Thriller', 'The complete poster-backed thriller catalog.', 1, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('action-thriller', 'Action Thriller', 'Thrillers driven by physical action, pursuit, combat, or spectacle.', 2, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('crime-thriller', 'Crime Thriller', 'Thrillers centered on crime, investigation, or criminal networks.', 3, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('mystery-thriller', 'Mystery Thriller', 'Thrillers structured around an investigation or concealed truth.', 4, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('psychological-thriller', 'Psychological Thriller', 'Thrillers driven by perception, obsession, identity, or manipulation.', 5, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('sci-fi-thriller', 'Sci-Fi Thriller', 'Thrillers built around speculative science or technology.', 6, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('horror-thriller', 'Horror Thriller', 'Films where thriller structure and horror danger substantially overlap.', 7, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('political-thriller', 'Political Thriller', 'Thrillers centered on government, state power, journalism, or political conflict.', 8, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('spy-thriller', 'Spy Thriller', 'Espionage, intelligence, and covert-operation thrillers.', 9, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('conspiracy-thriller', 'Conspiracy Thriller', 'Thrillers built around hidden networks and institutional secrets.', 10, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('survival-thriller', 'Survival Thriller', 'Thrillers where endurance and escape are the central engines.', 11, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('neo-noir', 'Neo-Noir', 'Modern noir thrillers shaped by moral ambiguity, crime, and stylized fatalism.', 12, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('revenge-thriller', 'Revenge Thriller', 'Thrillers driven by retaliation and personal justice.', 13, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('heist-thriller', 'Heist Thriller', 'Thrillers centered on planning, executing, or escaping a robbery.', 14, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('serial-killer-thriller', 'Serial-Killer Thriller', 'Thrillers focused on serial murder and pursuit.', 15, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('domestic-thriller', 'Domestic Thriller', 'Thrillers rooted in relationships, homes, and intimate betrayal.', 16, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('war-thriller', 'War Thriller', 'Thrillers built around wartime operations and danger.', 17, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('legal-thriller', 'Legal Thriller', 'Thrillers centered on courts, lawyers, trials, or legal jeopardy.', 18, CAST(strftime('%s','now') AS INTEGER) * 1000)
ON CONFLICT(tag_key) DO UPDATE SET label = excluded.label, description = excluded.description, sort_order = excluded.sort_order;
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'thriller', 1, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE genre LIKE '%Thriller%' AND poster_key <> '';
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'action-thriller', 1, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE genre LIKE '%Thriller%' AND genre LIKE '%Action%' AND poster_key <> '';
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'crime-thriller', 1, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE genre LIKE '%Thriller%' AND genre LIKE '%Crime%' AND poster_key <> '';
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'mystery-thriller', 1, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE genre LIKE '%Thriller%' AND genre LIKE '%Mystery%' AND poster_key <> '';
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'sci-fi-thriller', 1, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE genre LIKE '%Thriller%' AND genre LIKE '%Sci-Fi%' AND poster_key <> '';
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'horror-thriller', 1, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE genre LIKE '%Thriller%' AND genre LIKE '%Horror%' AND poster_key <> '';
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'war-thriller', 1, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE genre LIKE '%Thriller%' AND genre LIKE '%War%' AND poster_key <> '';
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'psychological-thriller', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Get Out','The Killing of a Sacred Deer','Gerald''s Game','Thelma','mother!','Split','Black Swan','Gone Girl','Prisoners','Shutter Island','Nocturnal Animals','The Gift');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'political-thriller', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Post','Argo','Tinker Tailor Soldier Spy','All the President''s Men','The Parallax View','Munich','The Manchurian Candidate','Enemy of the State');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'spy-thriller', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Atomic Blonde','The Foreigner','Tinker Tailor Soldier Spy','Munich','Skyfall','Casino Royale','Mission: Impossible - Fallout','A Most Wanted Man');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'conspiracy-thriller', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('The Parallax View','All the President''s Men','Enemy of the State','The Manchurian Candidate','Three Days of the Condor','The Post');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'survival-thriller', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Dunkirk','Gravity','127 Hours','The Revenant','A Quiet Place','Don''t Breathe','The Shallows','Buried','Fall');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'neo-noir', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Blade Runner 2049','Good Time','Drive','Nightcrawler','Nocturnal Animals','Gone Girl','John Wick: Chapter 2');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'revenge-thriller', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('John Wick: Chapter 2','In the Fade','You Were Never Really Here','Oldboy','The Foreigner','Promising Young Woman');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'heist-thriller', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Good Time','Baby Driver','Heat','Inside Man','The Town','Widows','Den of Thieves');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'serial-killer-thriller', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Se7en','Zodiac','The Silence of the Lambs','The Snowman','The Girl with the Dragon Tattoo','Memories of Murder');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'domestic-thriller', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('Gone Girl','A Simple Favor','The Gift','Gerald''s Game','The Invisible Man','What Lies Beneath');
--> statement-breakpoint
INSERT OR IGNORE INTO pix_movie_thriller_tags (imdb_id, tag_key, wave_number, created_at)
SELECT imdb_id, 'legal-thriller', 2, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM pix_movie_stats WHERE title IN ('A Few Good Men','The Firm','Primal Fear','Michael Clayton','The Lincoln Lawyer','Dark Waters');
