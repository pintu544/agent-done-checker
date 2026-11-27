ALTER TABLE users ADD COLUMN IF NOT EXISTS checks_used_month TEXT;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS checks_user_id_idx ON checks (user_id);
