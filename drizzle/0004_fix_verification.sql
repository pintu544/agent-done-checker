ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS exit_code integer;
--> statement-breakpoint
ALTER TABLE checks ADD COLUMN IF NOT EXISTS error text;
--> statement-breakpoint
ALTER TABLE checks ADD COLUMN IF NOT EXISTS verdict_diff_truncated boolean NOT NULL DEFAULT false;
