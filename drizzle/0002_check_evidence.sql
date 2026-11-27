ALTER TABLE "checks"
  ADD COLUMN IF NOT EXISTS "plan_text" text,
  ADD COLUMN IF NOT EXISTS "diff" text,
  ADD COLUMN IF NOT EXISTS "diff_truncated" boolean NOT NULL DEFAULT false;
