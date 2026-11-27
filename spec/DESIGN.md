# DESIGN — Agent Done Checker

> Architecture and contracts. Written after SPEC.md is stable (grill locked 27 Nov 2026).

## Architecture
Monorepo, two parts. **Web app**: Next.js App Router + TypeScript on Vercel — dashboard plus API route handlers. **CLI** (`cli/`, Node + TypeScript, run via npx/tsx in MVP): runs in the user's repo, reads the plan/transcript file, runs `git diff`, runs the test command fresh, uploads the evidence bundle to `POST /api/checks`, prints the verdict URL. **Server**: extracts claims with an LLM, matches each claim to diff hunks and test results, stores verdicts in Neon Postgres, serves the report at `/checks/[id]`. Auth via Auth.js GitHub OAuth (Slice 2). Billing via Stripe Checkout + webhooks (Slice 3).

## Data Model
- users (id, github_id, email, plan ['solo'|'team'], checks_used_this_month, stripe_customer_id)
- checks (id, user_id NULL in Slice 1, repo, branch, base, test_command, plan_text, diff, diff_truncated, status ['received'|'extracting'|'verdicting'|'done'|'failed'], score, created_at)
- claims (id, check_id, text, verdict ['verified'|'partial'|'unverified'|'contradicted'], evidence JSON {diff_hunks[], tests[]})
- test_runs (id, check_id, command, passed, failed, skipped, duration_ms, output_truncated TEXT ≤200KB)

## API Contracts
- POST /api/checks — body { planText | transcript, repo, branch, base, testCommand, diff, testRun } → { checkId, reportUrl }. Claim extraction runs async; client polls.
- GET /api/checks/[id] → full report { score, claims[] with verdict + evidence, testRun }.
- GET /api/checks → list, newest first (auth from Slice 2; open in Slice 1 demo mode).
- GET /api/health → { ok: true }.
- POST /api/stripe/checkout, POST /api/stripe/webhook (Slice 3).

## Key Decisions
- Next.js route handlers, no standalone Express — one Vercel deployment, less ops (rejected: separate Express API — extra service, no MVP gain).
- Drizzle ORM + Neon serverless (HTTP) driver — raw TCP Postgres fails from this VM; Neon HTTP works (rejected: Prisma — engine downloads fail via the proxy).
- Migrations as SQL files applied via the Neon HTTPS SQL API (AgentShelf pattern) — drizzle-kit migrate needs TCP.
- FastRouter (key 2, verified live) for claim extraction + verdict reasoning — no new LLM vendor (rejected: direct OpenAI key — another vendor, another bill).
- CLI collects evidence locally and re-runs tests on the user's machine — the server never needs repo access or a sandbox in MVP (rejected: server-side clone + run — sandboxing + compute cost, v2).
- Auth.js GitHub OAuth — the audience is already on GitHub (rejected: email magic link — extra deliverability work).
- Stripe Checkout — standard, no custom billing UI.
- UI: Impeccable skill for the report page and dashboard; verify with screenshots.

## Risks
1. Claim→diff matching quality (LLM may over-credit vague claims) — de-risk: a verdict requires cited evidence; eval set of 5 real sessions including one genuine skip, scored before Slice 1 closes; the genuine skip MUST be flagged Contradicted or Unverified.
2. Test re-run cost/time on big suites — de-risk: test command is user-specified; `--tests` flag scopes to affected tests; 10-minute timeout per check.
3. Neon/Vercel free-tier limits — de-risk: diff 1 MB cap, test output 200 KB cap, per-plan check limits from Slice 2.
