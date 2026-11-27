# SPEC — Agent Done Checker

> Requirements. Testable, implementation-free. One page. Grill locked 27 Nov 2026 ("Yes to All").

## Problem
Coding agents claim a task is done when it isn't — skipped tests, unverified work, partial changes presented as complete. Teams using Codex, Claude Code, Kiro or Cursor have no independent check: they eyeball diffs or re-run tests by hand, and the failure is silent. The checker verifies what the agent actually did — plan vs git diff vs test runs — and says so with evidence.

## Users
- Solo dev using a coding agent daily — wants a verdict before trusting the agent's "done".
- Small dev-team lead — wants every agent-finished task verified before merge or review.
- Team workspace owner (Slice 3) — pays $20/mo for unlimited checks.

## Functional Requirements
- FR-1: The system SHALL accept a check consisting of agent claims (pasted plan text or a transcript file) plus a target git repo and branch, and produce a verdict report.
- FR-2: The system SHALL extract individual verifiable claims from the agent's text, each claim being one falsifiable statement of work done.
- FR-3: The system SHALL compute the git diff for the checked branch against its base and hold it as evidence.
- FR-4: The system SHALL re-run the repo's test command fresh and record per-test pass/fail/skip — never trusting the agent's log for what ran.
- FR-5: The system SHALL assign each claim a verdict — Verified / Partial / Unverified / Contradicted — citing the diff hunks and/or test results behind it.
- FR-6: The system SHALL show an overall score (verified claims / total claims) and the full report on a dashboard page.
- FR-7: The system SHALL persist checks and their reports so a user can revisit history.
- FR-8: The system SHALL parse Codex session logs natively as a claim source (Slice 2).
- FR-9: The system SHALL enforce plan limits — Solo free 10 checks/month, Team $20/mo unlimited — via Stripe (Slice 3).
- FR-10: The CLI SHALL collect evidence locally (diff + fresh test run), upload an evidence bundle to the API, and print the verdict report URL on completion.

## Non-Functional Requirements
- NFR-1: A check on a repo with ≤500 changed lines completes end-to-end in < 5 minutes (p95), excluding the repo's own test-suite runtime.
- NFR-2: A Verified claim without a cited diff hunk or passing test is a defect, not a pass.
- NFR-3: Uploaded transcripts, diffs and test output are private to the owning user; no cross-user access, ever.
- NFR-4: The web app SHALL deploy on Vercel + Neon with zero manual server ops; diff text capped at 1 MB and raw test output at 200 KB per check.

## Out of Scope
- Auto-fixing code; running the coding agent; multi-repo org analytics; IDE plugin; GitHub App / PR check (v2); generating tests.
