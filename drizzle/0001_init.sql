CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id TEXT NOT NULL CONSTRAINT users_github_id_unique UNIQUE,
    email TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'solo',
    checks_used_this_month INTEGER NOT NULL DEFAULT 0,
    stripe_customer_id TEXT,
    CONSTRAINT users_plan_check CHECK (plan IN ('solo', 'team'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID CONSTRAINT checks_user_id_users_id_fk REFERENCES users (id),
    repo TEXT NOT NULL,
    branch TEXT NOT NULL,
    base TEXT NOT NULL,
    test_command TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received',
    score DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT checks_status_check CHECK (status IN ('received', 'extracting', 'verdicting', 'done', 'failed'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id UUID NOT NULL CONSTRAINT claims_check_id_checks_id_fk REFERENCES checks (id),
    text TEXT NOT NULL,
    verdict TEXT NOT NULL,
    evidence JSONB NOT NULL,
    CONSTRAINT claims_verdict_check CHECK (verdict IN ('verified', 'partial', 'unverified', 'contradicted'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id UUID NOT NULL CONSTRAINT test_runs_check_id_checks_id_fk REFERENCES checks (id),
    command TEXT NOT NULL,
    passed INTEGER NOT NULL,
    failed INTEGER NOT NULL,
    skipped INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    output_truncated TEXT NOT NULL,
    CONSTRAINT test_runs_output_truncated_check CHECK (octet_length(output_truncated) <= 204800)
);
