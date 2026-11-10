CREATE TABLE `pix_fan_types` (
  `type_key` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,
  `description` text NOT NULL,
  `genre_weights_json` text DEFAULT '{}' NOT NULL,
  `era_weights_json` text DEFAULT '{}' NOT NULL,
  `tag_weights_json` text DEFAULT '{}' NOT NULL,
  `exploration_bias` integer DEFAULT 10 NOT NULL,
  `active` integer DEFAULT true NOT NULL,
  `sort_order` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pix_fan_types_label_idx` ON `pix_fan_types` (`label`);
--> statement-breakpoint
CREATE INDEX `pix_fan_types_order_idx` ON `pix_fan_types` (`active`,`sort_order`);
--> statement-breakpoint
CREATE TABLE `pix_user_fan_types` (
  `user_id` text NOT NULL,
  `type_key` text NOT NULL,
  `score` integer DEFAULT 0 NOT NULL,
  `confidence` integer DEFAULT 0 NOT NULL,
  `signal_count` integer DEFAULT 0 NOT NULL,
  `direct_selected` integer DEFAULT false NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY (`user_id`,`type_key`),
  FOREIGN KEY (`type_key`) REFERENCES `pix_fan_types`(`type_key`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pix_user_fan_types_user_idx` ON `pix_user_fan_types` (`user_id`,`score`);
--> statement-breakpoint
CREATE TABLE `pix_fan_type_states` (
  `user_id` text PRIMARY KEY NOT NULL,
  `consecutive_unseen` integer DEFAULT 0 NOT NULL,
  `question_answered` integer DEFAULT false NOT NULL,
  `focus_kind` text DEFAULT 'none' NOT NULL,
  `focus_value` text DEFAULT '' NOT NULL,
  `answered_at` integer,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pix_fan_type_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL,
  `signal_type` text NOT NULL,
  `primary_imdb_id` text,
  `secondary_imdb_id` text,
  `focus_kind` text DEFAULT 'none' NOT NULL,
  `focus_value` text DEFAULT '' NOT NULL,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pix_fan_type_events_user_idx` ON `pix_fan_type_events` (`user_id`,`created_at`);
--> statement-breakpoint
INSERT INTO `pix_fan_types` (`type_key`,`label`,`description`,`genre_weights_json`,`era_weights_json`,`tag_weights_json`,`exploration_bias`,`active`,`sort_order`,`created_at`,`updated_at`) VALUES
('horror-hound','Horror Hound','Chases fear across subgenres, from slashers to psychological dread.','{"Horror":6,"Thriller":2,"Mystery":1}','{}','{"horror":6,"slasher":3,"supernatural":3,"psychological":2}',8,1,10,1791741600000,1791741600000),
('blockbuster-chaser','Blockbuster Chaser','Wants big-screen momentum, spectacle, and crowd favorites.','{"Action":5,"Adventure":5,"Sci-Fi":3,"Fantasy":2}','{}','{"blockbuster":7,"franchise":3,"high-votes":3}',6,1,20,1791741600000,1791741600000),
('prestige-hunter','Prestige Hunter','Leans toward awards, festival discoveries, and exacting craft.','{"Drama":5,"Biography":3,"History":2}','{}','{"academy-winner":8,"festival":5,"highly-rated":4}',8,1,30,1791741600000,1791741600000),
('nostalgist','Nostalgist','Returns to the decades and movie memories that feel like home.','{"Family":2,"Comedy":2,"Adventure":2}','{"1970s":3,"1980s":6,"1990s":6,"2000s":3}','{"classic":3,"franchise":2}',7,1,40,1791741600000,1791741600000),
('comfort-watcher','Comfort Watcher','Looks for warmth, familiarity, humor, and rewatchable feeling.','{"Comedy":6,"Romance":4,"Family":5,"Animation":3,"Musical":2}','{}','{"feel-good":6,"rewatchable":5}',5,1,50,1791741600000,1791741600000),
('deep-cut-cinephile','Deep-Cut Cinephile','Seeks overlooked work, international voices, and less obvious picks.','{"Film-Noir":3,"Documentary":3,"Drama":2}','{"1920s":2,"1930s":2,"1940s":2,"1950s":2,"1960s":2}','{"low-votes":5,"international":5,"festival":3}',12,1,60,1791741600000,1791741600000),
('explorer','Explorer','Prefers deliberate variety and a steady route beyond familiar lanes.','{}','{}','{"variety":8,"international":2}',30,1,70,1791741600000,1791741600000),
('global-voyager','Global Voyager','Follows movies across countries, languages, and filmmaking traditions.','{"Drama":2,"Comedy":1,"Thriller":1}','{}','{"international":8,"festival":2}',18,1,80,1791741600000,1791741600000);
