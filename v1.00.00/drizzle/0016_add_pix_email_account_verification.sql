ALTER TABLE pix_profiles ADD COLUMN email TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE pix_profiles ADD COLUMN email_status TEXT NOT NULL DEFAULT 'none';
--> statement-breakpoint
ALTER TABLE pix_profiles ADD COLUMN verification_code_hash TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE pix_profiles ADD COLUMN verification_expires_at INTEGER;
--> statement-breakpoint
ALTER TABLE pix_profiles ADD COLUMN verified_at INTEGER;
--> statement-breakpoint
CREATE TABLE pix_signup_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  prompt TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX pix_signup_challenges_expiry_idx ON pix_signup_challenges (expires_at);
