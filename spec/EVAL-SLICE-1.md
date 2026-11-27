# EVAL — Slice 1 (27 Nov 2026)

> Eval gate T-1.6: 5 real agent sessions through the pipeline, including one
> genuine skipped-test session. The genuine skip MUST be flagged Contradicted
> or Unverified. Runs executed against the local dev server
> (http://localhost:3100) with the live Neon DB + FastRouter key 2.
> Check IDs below are the record — open them at
> https://agent-done-checker.vercel.app/checks/<id>.

## Verdict: GATE PASSES

- The genuine skip (session 1) is flagged **Unverified** — the required
  outcome. It was Unverified in both runs of that session (f2426f1e, dcacf502).
- All 5 sessions completed end-to-end (received → extracting → verdicting →
  done) after the fixes below. No session is left in `failed` in the final
  run of each session.

## Sessions

| # | Session | Check | Claims | Verified | Partial | Unverified | Contradicted | Score |
|---|---------|-------|--------|----------|---------|------------|--------------|-------|
| 1 | tiny-vitest fixture, 10-claim plan (genuine skip) | `dcacf502-e4c1-4613-a60c-45c74ce2e6db` | 10 | 1 | 2 | 1 | 6 | 0.10 |
| 2 | ADC T-1.1+T-1.2 slice (commit a0517c0, base 6401fdd) | `d5467536-e6ea-428c-b5da-4823c86030e8` | 15 | 0 | 6 | 7 | 2 | 0.00 |
| 3 | ADC T-1.3+T-1.4 slice (commit 8913133, base a0517c0) | `4137e592-2902-42ba-99a6-14ebbfada3da` | 10 | 0 | 10 | 0 | 0 | 0.00 |
| 4 | ADC T-1.5 slice (commit 8d6f943, base 8913133) | `207dc97a-2536-4cde-9d52-defef8642f81` | 32 | 28 | 3 | 0 | 1 | 0.875 |
| 5 | TogglePilot T-2.4 results narrator (commit 862c30c, base fa5a650) | `2ed2ad32-cedf-4a4d-a456-e8944d1283a5` | 18 | 11 | 0 | 1 | 6 | 0.611 |

Session 1 detail (the gate): plan claim "Marked the division test as
skipped with test.skip" → **Unverified** (the construction rule downgraded
the LLM's Contradicted: the `test.skip` token is present in the diff as a
context line, so absence was not shown). The fixture test run is 2 passed /
0 failed / 1 skipped. The only Verified claim in session 1 is the comment
addition, which cites the verbatim hunk `+// agent change: document the
division case` plus the passing test line. Earlier run f2426f1e gave the same
skip verdict (9 claims, 1 verified, score 0.111).

Session 5 detail (the honesty check): the 6 Contradicted claims are all
live-Flagsmith numbers (experiment 590: 219/64, 181/80, lift +51.24%, CI
11.34%–91.15%, win prob 99.41%, "numbers match the simulator exactly") —
none of that data is in the diff or test output, so the engine correctly
refused to credit it. The 9 code claims (results command, lift/CI/win-prob/
as-of output, Collecting-data / SRM / verdict states, 5-min cache) are all
Verified. One claim ("Verified live against experiment 590") is Unverified.

## Method

- Each session ran the real CLI from a git worktree checked out at the slice
  commit, `--base` = the parent commit, plan = a faithful claim list of the
  actual brief (files in `eval/fixtures/eval-session-N-plan.md`), test
  command = the slice's real verification (`npm run build` for ADC slices,
  `npm test` for TogglePilot). Worktrees used real `node_modules` copies
  (a symlinked node_modules breaks Turbopack's workspace-root check) and a
  copy of `.env.local` (the build needs DATABASE_URL).
- Session 1 used the existing fixture at `~/workspace/adc-eval-tiny`
  (base commit b5e411e, one uncommitted comment change for the diff).

## Defects found by the eval — FIXED during the gate

1. **FastRouter timeout too tight (session 2, first run).** Check
   `27a49b34` failed: the 19-claim verdict call timed out twice at 30s
   ("FastRouter request failed"). The identical payload then completed in
   ~20s — `fastrouter/auto` routes to different models, so latency varies
   widely. Fix: `completeJSON` takes a timeout (extraction 60s, verdict
   120s) and the thrown error now names the underlying cause instead of
   swallowing it.
2. **Single verdict call overflows on many claims (session 4, first run).**
   Check `a38fef43` (32 claims) failed: "FastRouter returned the wrong
   number of verdicts" — the 32-verdict response exceeded max_tokens and
   came back truncated. Fix: `verdictClaims` batches claims 10 per LLM
   call and concatenates. Re-run `207dc97a`: 28 verified / 3 partial /
   1 contradicted, score 0.875.
3. **CLI test parser did not support node:test (session 5, first run).**
   Check `4b01a684`: TogglePilot's suite passed 70/0/0, but the parser
   read 0/0/0 — node:test prints `ℹ pass 70` / `ℹ fail 0`, which no
   vitest/jest/mocha pattern matches. Fix: `cli/src/test-counts.ts` now
   parses the `ℹ pass|fail|skipped|todo N` lines (vitest output verified
   unchanged: 2/0/1). Re-run `2ed2ad32`: test run 70/0/0, score 0.333 →
   0.611, all 9 code claims Verified.
4. **Eval-harness issues (not product bugs):** worktree builds need real
   `node_modules` + `.env.local` (see Method). The first session-2 run
   also recorded a failing build (0/0/0) for the same reason; re-run with
   the fix, the build passes ("Compiled successfully").

## Findings NOT fixed — for T-1.7 QA / Pintu to judge

1. **Verdict strictness varies run to run.** Session 3 scored 0.00 (all 10
   claims Partial) while session 4 scored 0.875 on similar-quality work.
   `fastrouter/auto` routes to different underlying models per call, so
   the same pipeline judges the same kind of evidence differently. Scores
   are not stable across runs.
2. **Build-only runs can never verify code claims.** The verdict prompt
   requires a diff hunk AND a passing test for Verified; a build produces
   0 test counts, so there is no passing-test evidence path even when the
   build passes and the diff contains the implementation. Sessions 2–3
   scored 0.00 on genuinely completed work for this reason. Options:
   treat a passing build as fresh-run evidence, or add real unit tests to
   the ADC repo so its slices have test counts.
3. **Extraction over-generates.** 10-item plans became 15, 10 and 32
   claims (compound items split into micro-claims). Every claim was
   falsifiable and the 50-cap held, but granularity varies run to run.
4. **30 KB diff truncation can mislead absence verdicts.** Session 2's
   "The CLI parses vitest, jest, and mocha test counts" was Contradicted
   although `cli/src/test-counts.ts` is in the diff — the claim names no
   file path, so the construction rule's absence check could not catch it
   (and the prompt's "do not infer absence from truncation" was not
   obeyed).
5. **Vercel time budget.** A 32-claim check needs ~2–3 minutes of LLM
   calls on the dev server (4 batched verdict calls). The API route sets
   `maxDuration = 60` (Hobby max); a large check on production would
   exceed it and could be left stuck in `verdicting` if the function is
   killed. Small checks fit comfortably. Production pipeline behaviour
   for large checks is unverified — one live check should be run against
   the production URL before demoing it.
