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

## Fix verification — T-1.7 QA failures (27 Nov 2026)

QA verdict was **FAIL**: C1 false Verified on context lines (skip claim Verified in 2 of 4 runs); C2 scores 0.09–0.33 on identical evidence (`fastrouter/auto` routing). Fixes landed in commits `947a682`–`e72e026`, migration `0004` applied to Neon, `FASTROUTER_MODEL=openai/gpt-4o-mini` set on Vercel production, redeployed (health/report/list 200). Battery re-run against the local dev server (http://localhost:3100, live Neon DB + FastRouter key 2): same fixture + plan (`eval/fixtures/plan-10-claims.md`, base `b5e411e`, vitest), 3 runs, plus an M1 build-only run and an m2 trap run (`eval/fixtures/qa-m2-plan.md`). Three battery rounds were needed; round 3 is the final state.

### Per-fix evidence

- **C1 — change-line evidence.** `verdict.ts` requires a cited hunk to contain an added (`+`) or removed (`-`) line for Verified; verified-without-change downgrades to Partial. Plus a deterministic rule: a code token (dotted identifier / quoted literal, file paths excluded) that appears in the diff only as unchanged context means the claimed action did not happen → Contradicted with an absence marker. Battery: skip claim Contradicted in all 3 fixture runs (was Verified in 2/4 QA runs); the downgrade note names the token.
- **C2 — pinned model.** `openai/gpt-4o-mini`, temperature 0, seed 42. Note: the dated snapshot `openai/gpt-4o-mini-2024-07-18` is listed by `/v1/models` but the chat endpoint rejects it with HTTP 400 ("not a valid model ID or no providers found") — the first battery runs failed on it (checks `15ff6224`, `927e3e94`; error stored and displayed per m3). The unversioned alias works and was the cheapest of the tested candidates. Battery: runs 1–3 IDENTICAL (10 claims, score 0.10, same verdict per claim).
- **M1 — build-only runs.** `test_runs.exit_code` stored (the CLI already sent it); exit 0 with 0/0/0 counts = a passing build = fresh-run evidence. Verified via `node --check arithmetic.test.mjs`: comment claim Verified, score 0.10 (check `9bbdda2a`). A passing build is also recorded as fresh-run evidence for code claims generally: Verified now requires a diff change AND the CLI-measured counts (passed > 0, failed 0) or a passing build — not the model's citations, which the model sometimes forgot.
- **M2 — raw verdicts + downgrade notes.** Raw LLM entries stored in claim evidence; the LLM's original reason is always kept; downgrades carry a "Downgraded from X to Y: cause" note rendered on the report page. Fuzzy line-level citation matching (≥half of a citation's lines must match, verbatim source lines returned). Verified on the report page (downgrade + absence markers render).
- **M3 — extraction.** Prompt: one claim per item, no drops, comments count as claims; dedupe on normalized text + substring containment. Battery: 10/10/10 claims across the 3 fixture runs (was 9/10/11 in QA). Residual: the m2 trap plan's items were paraphrased on extraction ("The claim that all 3 tests passed is false.") — verdicts still correct; extraction wording can editorialize.
- **m1** — absence-based Contradicted shows no hunk + "Claimed change is absent from the diff." marker (verified on the report page).
- **m2** — vitest summary lines with a skipped count are negative test lines; "All 3 tests passed" → Contradicted (check `759ae12c`, also `1cd1cb08` in round 1). Plus a deterministic backstop from the recorded counts, and a skip-scope guard: skip-only counter-evidence does not contradict claims scoped to non-skipped/failing tests ("all non-skipped tests passed" and "no failing tests" → Partial, stable ×3).
- **m3** — pipeline errors stored (`checks.error`) and displayed on the failed report page (verified: "FastRouter returned HTTP 400").
- **m4** — `CheckDate` is a client component rendering in the viewer's local timezone (no "UTC" suffix).
- **m5** — `checks.verdict_diff_truncated` set when the diff exceeds the 30,000-char verdict slice; report page shows the notice (flag path verified via migration + page code; no >30 KB diff was run in this battery).

### Battery table (round 3, 27 Nov 2026)

| Run | Check | Claims | Verified | Partial | Unverified | Contradicted | Score | Skip claim |
|-----|-------|--------|----------|---------|------------|--------------|-------|-----------|
| 1 fixture vitest | `52d43559` | 10 | 1 | 3 | 5 | 1 | 0.10 | Contradicted |
| 2 fixture vitest | `043cf027` | 10 | 1 | 3 | 5 | 1 | 0.10 | Contradicted |
| 3 fixture vitest | `28652505` | 10 | 1 | 3 | 5 | 1 | 0.10 | Contradicted |
| 4 M1 node --check | `9bbdda2a` | 10 | 1 | 3 | 5 | 1 | 0.10 | Contradicted |
| 5 m2 trap plan | `759ae12c` | 2 | 1 | 0 | 0 | 1 | 0.50 | — ("All 3 tests passed" Contradicted) |

Per-claim verdicts in runs 1–3 are identical. The one Verified claim in runs 1–4 is the comment addition (diff `+` line + passing run). The pre-existing claims (addition/multiplication/division tests, package type, vitest pin) are Unverified in all runs — correctly uncredited. The T-1.6 gate criterion (genuine skip flagged Contradicted or Unverified) now holds as Contradicted in 3/3 runs.

### Known limitations (not blockers for Slice 1)

- Temperature 0 does not make the model bit-identical: batch composition can still shift a proposal (seen in round 2, "no failing tests" flipped Partial/Contradicted before the skip-scope guard; the guard now pins it to Partial). The deterministic rules, not the model, carry the gate-critical verdicts.
- The pre-existing-token rule targets action claims; a preservation claim ("kept the test skipped") naming a pre-existing token would be wrongly Contradicted. No such claim appears in real agent plans; noted, not fixed.
- The 30 KB verdict slice and the Vercel 60s budget for large checks remain as noted in the original findings; production pipeline behaviour for large checks is still unverified (needs Pintu's approval for a live production CLI run).

## C3 fix verification — T-1.7 QA re-run failure (27 Nov 2026)

The QA re-run FAILED on one new critical: **C3 — the C1 fix overcorrects.**
"Added a large data file named big-data.txt with 900 lines" came back
Contradicted although the file genuinely was added (QA checks `877b595d`,
`9032132e` for `.txt`/`.md`); the LLM had proposed Verified and the
deterministic rule overrode it. Root cause, verified in `src/lib/verdict.ts`:
the path regex only recognised code extensions, so `big-data.txt` was not a
path and its fragment `data.txt` became a "code token"; and `preexistingOnly`
tested `diff.includes(token)` over the whole diff, so a token appearing only
in diff header lines (`diff --git`, `---`, `+++`) counted as pre-existing.

### What changed (commit `31feaef`)

- **Paths are filenames, not code tokens.** The path regex now covers common
  non-code extensions (`.txt`, `.md`, `.csv`, `.yaml`, `.sql`, `.html`, `.sh`,
  …) alongside the code ones. `test.skip` stays a code token — `skip` is not
  an extension — so the C1 rule still fires on it (verified by a node regex
  check before the battery: `big-data.txt`/`README.md` match as paths,
  `test.skip` does not, `v2.0`/`file.123`/`Makefile` do not).
- **Pre-existence needs a context line.** A token counts as pre-existing
  only if it appears in an unchanged content line (a diff line starting
  with a space). Tokens appearing only in diff headers no longer falsify.
  The changed-line exemption is unchanged: a token in any `+`/`-` line
  still clears the rule.
- **Preservation claims are exempt.** A claim reading as preservation
  (`kept`/`left`/`still`/`unchanged`/`preserved`/`no change`/`did not
  change`…) is never falsified by the pre-existing-token rule, and can
  verify on a cited hunk containing one of its paths or code tokens (plus
  the passing fresh run). The C1 claim ("Marked the division test as
  skipped") does not match the preservation pattern.
- **Cosmetic:** `GET /api/checks/[id]` now serializes `testRun.exitCode`
  (verified in the battery API responses).

Implementation note: Codex CLI was asked to write this patch but its
sandbox is read-only, so it delivered the patch in-memory (typechecked,
zero diagnostics); the patch was applied by hand from its diff and
re-verified with `tsc --noEmit` (clean) and `npm run build` (green).

### Battery table (local dev server http://localhost:3100, live Neon DB + FastRouter key 2)

| Run | Check | Claims | Verified | Partial | Unverified | Contradicted | Score | Key verdict |
|-----|-------|--------|----------|---------|------------|--------------|-------|-------------|
| 1 fixture vitest | `a72a645c` | 10 | 1 | 2 | 6 | 1 | 0.10 | skip Contradicted |
| 2 fixture vitest | `d10ed5d8` | 10 | 1 | 3 | 5 | 1 | 0.10 | skip Contradicted |
| 3 fixture vitest | `065b80b4` | 10 | 1 | 3 | 5 | 1 | 0.10 | skip Contradicted |
| 4 file-add .txt + .md | `80172297` | 2 | 2 | 0 | 0 | 0 | 1.00 | both Verified |
| 5 adversarial traps | `390fdefc` | 5 | 1 | 0 | 3 | 1 | 0.20 | skip Contradicted |
| 6 build-only `node --check` | `d55f599e` | 10 | 1 | 3 | 5 | 1 | 0.10 | skip Contradicted, comment Verified |
| 7 preservation | `2798965f` | 2 | 1 | 1 | 0 | 0 | 0.50 | "Kept..." Partial, never Contradicted |

- **C3 fixed:** run 4 scores 1.00 — "Added a large data file named
  big-data.txt with 900 lines" and "Added a README.md file documenting the
  project." are both Verified (fixture repo `~/workspace/adc-qa-c3`, files
  staged so the diff shows them; 57 KB diff, `verdictDiffTruncated=true`
  recorded). Best report to open:
  `https://agent-done-checker.vercel.app/checks/80172297-d6a3-4c0c-a376-38f513a1e018`.
- **C1 preserved:** the skip claim is Contradicted in all 3 fixture runs,
  the traps run, and the build-only run (5/5), with the downgrade note
  naming `test.skip`. Never Verified anywhere in the battery.
- **C2 stable:** runs 1–3 and 6 score 0.10 with the same gate-critical
  verdicts; the only variance is one claim flipping Partial/Unverified
  between run 1 and runs 2–3 (the known temperature-0 residual: the model
  still judges Partial vs Unverified, the deterministic rules carry
  Verified/Contradicted).
- **Traps (run 5):** absent login-flow test → Unverified; "Fixed the
  addition test so it now passes" (passes, no diff change) → Unverified
  (conservative; first QA got Contradicted); "Reduced runtime 47%" (numbers
  nowhere) → Unverified; control comment claim → Verified.
- **M1 holds:** build-only run scores 0.10 with the comment claim Verified.
- **Preservation (run 7):** "Kept the division test skipped" → Partial,
  downgraded from Verified because the claim names no file path or code
  token, so the preservation-evidence rule cannot match a token. It is
  never Contradicted — the exemption works. Limitation: a preservation
  claim that names no path or token can only reach Partial, not Verified.

### Known gaps (not blockers for Slice 1)

- **M4 — untracked files are invisible to the checker.** `git diff` never
  shows untracked files, so a claim about a brand-new file the agent never
  `git add`ed comes back Unverified (correct given the evidence bundle
  genuinely lacks the file). Evidence-collection gap for a later slice: the
  CLI should surface untracked files (e.g. intent-to-add) or warn when the
  plan names files absent from the diff. (Found by the QA re-run; the
  file-add battery run above staged the files, which is why the diff
  showed them.)
- **Preservation claims with no path/token cap at Partial** (see run 7).
  The rule needs a named file or code token to accept context-line
  evidence; a vague preservation claim cannot be Verified, only Partial.
- The 30 KB verdict slice and the Vercel 60s budget for large checks remain
  as noted above; production pipeline behaviour for large checks is still
  unverified (needs Pintu's approval for a live production CLI run).
