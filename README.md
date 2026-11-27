# Agent Done Checker

**Prove the agent actually did it.** Coding agents claim a task is done when it isn't — this verifies what the agent really did: plan vs git diff vs test runs, and flags skipped tests and unverified work.

- Paste the agent's plan (or drop a transcript) → CLI collects the git diff, re-runs the tests fresh, and uploads the evidence.
- Every claim gets a verdict: **Verified / Partial / Unverified / Contradicted**, with the diff hunks and test results cited as evidence.
- Dashboard shows the score and the full report per check.

## Status

Live demo: [Agent Done Checker](https://agent-done-checker.vercel.app)

Slices 1–3 are done:

- Slice 1 shipped the core check pipeline.
- Slice 2 added accounts, the Solo usage counter, and Codex session log parsing.
- Slice 3 added Stripe billing and the landing page.

Solo is free with 10 checks/month. Team is $20/month for unlimited checks, billed via Stripe Checkout.

## Run a check

From the repository you want to check:

```sh
adc check --plan plan.md --repo .
```

For a Codex session log, use `adc check --codex-log <session-file> --repo .`. Add `--api <url>` to use a custom API base URL.

## Spec-driven

GRILL → SPEC → DESIGN → TASKS → approval → implement, slice by slice, with a relentless QA pass per slice.
