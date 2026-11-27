# Agent Done Checker

**Prove the agent actually did it.** Coding agents claim a task is done when it isn't — this verifies what the agent really did: plan vs git diff vs test runs, and flags skipped tests and unverified work.

- Paste the agent's plan (or drop a transcript) → CLI collects the git diff, re-runs the tests fresh, and uploads the evidence.
- Every claim gets a verdict: **Verified / Partial / Unverified / Contradicted**, with the diff hunks and test results cited as evidence.
- Dashboard shows the score and the full report per check.

Pricing: Solo free (10 checks/mo) / Team $20/mo.

## Status

Slice 1 (core check pipeline) is being built with Codex CLI. Spec pack in `spec/` — GRILL, SPEC, DESIGN, TASKS — approved by Pintu 27 Nov 2026.

## Spec-driven

GRILL → SPEC → DESIGN → TASKS → approval → implement, slice by slice, with a relentless QA pass per slice.
