# EVAL — Slice 2 (27 Nov 2026)

> Dogfood gate T-2.4: the checker verifies its own Slice 2 work, and Slice 1
> is re-verified the same way. Dogfood runs executed against the local
> production server (http://localhost:3100, `next start`, live Neon DB +
> FastRouter key 2) from git worktrees checked out at each slice commit
> (worktrees removed after the runs; `next typegen` + symlinked node_modules
> made `npx tsc --noEmit` pass in each). Check IDs below are the record —
> open them at https://agent-done-checker.vercel.app/checks/<id>.

## Verdict: DOGFOOD PASSES

- Every Slice 2 task scores ≥ 0.75 on its own faithful plan; T-2.3 scores
  1.00 (10/10 Verified). No false Verified anywhere; no Contradicted claim
  on genuinely completed work.
- Slice 1 re-verification (C4 battery, 8 runs) is identical to the C4 round:
  the skip claim is Contradicted in all 5 runs that contain it, scores 0.10
  on all four fixture/build-only runs. No Slice 1 regression from Slice 2.

## Dogfood runs (Slice 2 slices, test command `npx tsc --noEmit`)

| # | Slice | Worktree @ | Base | Check | Claims | Verified | Partial | Unverified | Contradicted | Score |
|---|-------|-----------|------|-------|--------|----------|---------|------------|--------------|-------|
| 1 | T-2.1 Auth + ownership | `4bd0600` | `d8d9fdd` | `037db5e2-f9c3-4caa-bf27-3fdef8e934e9` | 11 | 10 | 1 | 0 | 0 | 0.91 |
| 2 | T-2.2 Counter | `b8b3654` | `4bd0600` | `7e663071-86bf-483c-980b-0cd3c470d758` | 8 | 6 | 2 | 0 | 0 | 0.75 |
| 3 | T-2.3 Codex-log parser | `9c7ce52` | `b8b3654` | `aead7ae0-f58e-412f-bf44-b8595c19c64d` | 10 | 10 | 0 | 0 | 0 | 1.00 |

Plans: `eval/fixtures/eval-slice2-t21-plan.md`, `eval-slice2-t22-plan.md`,
`eval-slice2-t23-plan.md` (faithful claim lists of each slice's actual work).

### Run 1 detail (T-2.1, 0.91)

10/11 Verified, including the Auth.js install, the sign-in upsert, the
hidden-email noreply fallback, the `[...nextauth]` route, the test-only
session override, ownership in `getCheckReport`/`listChecks`, AuthControls,
migration 0005, and the blocking report page with `instant = false`. The
single Partial is "POST /api/checks attaches the signed-in user's id to new
checks and keeps anonymous submissions unowned" — the code change is in the
diff, but "keeps anonymous submissions unowned" is an absence behaviour the
diff alone cannot show. Defensible Partial, not a build defect.
`verdictDiffTruncated=true` (the T-2.1 diff is large — package-lock from the
next-auth install dominates the first 30 KB) yet 10/11 still Verified: the
verdict slice evidently still contained the src/ hunks that matter.

### Run 2 detail (T-2.2, 0.75)

6/8 Verified (usage.ts, UTC-month count, 429 before insert, 429 message
wording, usage line, seed scripts). The 2 Partials are both behaviour /
absence claims: "Team plan users have no cap" and "Anonymous submissions
remain allowed and uncounted" — both true in code, neither directly
evidenced by a diff hunk plus a passing test. Extraction also dropped 2 of
the 10 plan items ("counter columns intentionally unused" and "CLI was not
changed") — the latter is unprovable from a diff by construction; the
former is a real extraction recall gap, already known from Slice 1
(extraction granularity varies).

### Run 3 detail (T-2.3, 1.00)

10/10 Verified — every parser claim (JSONL schema, dedupe by id, skip
rules, malformed-line tolerance, 30 KB cap, `--codex-log` exclusivity, both
error messages, README docs) verified against the small, focused diff.

## Slice 1 re-verification (C4 battery, 27 Nov ~13:50 IST)

`spec/c4-battery.sh` re-run after all Slice 2 code landed
(log `/tmp/c4-battery-slice2.log`):

| Run | Check | Claims | Verified | Partial | Unverified | Contradicted | Score | Skip claim |
|-----|-------|--------|----------|---------|------------|--------------|-------|------------|
| r1 fixture vitest | `8b666ace` | 10 | 1 | 3 | 5 | 1 | 0.10 | Contradicted |
| r2 fixture vitest | `e420b168` | 10 | 1 | 3 | 5 | 1 | 0.10 | Contradicted |
| r3 fixture vitest | `349ad4b9` | 10 | 1 | 3 | 5 | 1 | 0.10 | Contradicted |
| r4 C4 probe | `cebf8c04` | 2 | 2 | 0 | 0 | 0 | 1.00 | — |
| r5 exts | `15daf862` | 5 | 5 | 0 | 0 | 0 | 1.00 | — |
| r6 traps | `78a0f3f9` | 5 | 1 | 0 | 3 | 1 | 0.20 | Contradicted |
| r7 preservation | `02a5ba76` | 2 | 1 | 1 | 0 | 0 | 0.50 | Partial ("Kept…") |
| r8 build-only | `6461c3b5` | 10 | 1 | 2 | 6 | 1 | 0.10 | Contradicted |

Identical to the C4 round in every run. The deterministic C1–C4 rules
carried the gate-critical verdicts; `src/lib/verdict.ts` was not touched
by any Slice 2 change.

## The checker catching something real in its own build

One real finding, from the T-2.3 end-to-end check (not a dogfood worktree
run): check `fef505cd-a538-4b6d-929a-9bac600ce523` — the real T-2.2 Codex
session log fed to the CLI (`--codex-log`, base `d8d9fdd`, test command
`npx tsc --noEmit`) produced 5 faithful claims but scored **0.00, all
Unverified, with `verdictDiffTruncated=true`**. The T-2.1+T-2.2 diff is
large and the 30 KB verdict slice does not contain the `usage.ts` hunks,
so the engine honestly refused to credit true claims. This is the known
Slice 1 limitation #4 (30 KB diff truncation can mislead verdicts), now
reproduced on the product's own work: the engine degrades to Unverified
rather than inventing evidence, which is the safe direction, but a large
real diff still scores 0.00. No code change was made for it in Slice 2 —
it is out of scope (M4 / Vercel-budget class) and is recorded here for
Slice 3 / v2: raise the verdict slice, or rank diff files so `src/` hunks
are considered before lockfiles.

## Dashboard polish (T-2.4, Impeccable — mode Operate)

- Home: "View checks" + sign-in in one wrapping action row.
- Checks list: usage line integrated into the header (tabular numerals),
  8-unit gap before the table/empty state, neutral row hover + keyboard
  focus state, repo link emphasis on hover/focus; mobile grid unchanged.
- Report page: AuthControls under the heading; new `not-found.tsx` for
  the report route so a signed-out owner reaching a 404 can sign in;
  claim headings have more space above than below (craft floor).
- Impeccable detector clean (`[]`) over all four changed files.
- Screenshot-verified on the local production server (headless Chromium):
  home, checks list, report `8b666ace`, 404 page — all render correctly
  (shots in `/tmp/adc-shots/`).

## Known limitations (not blockers for Slice 2)

- The 30 KB verdict slice still punishes large diffs (see the finding
  above); the report page flags it (`verdictDiffTruncated`).
- Extraction dropped 2/10 items on the T-2.2 plan (recall gap, known).
- The 3 dogfood Partials are all behaviour/absence claims — the engine
  cannot Verify what the diff cannot show; Partial is the honest verdict.
- Live GitHub handshake still unverified (no OAuth app — Pintu's step,
  see TASKS.md T-2.1); the usage line on `/checks` is only visible when
  signed in, so it could not be screenshot-verified without a session.
