# TASKS — Agent Done Checker

> Ordered checklist. One task = one verifiable unit. Check off only when acceptance criteria pass.
> Slices are end-to-end and demoable. Slice 1 is the first demoable slice (scaffold included).

## Slice 1 — Core check pipeline (demoable)
- [x] T-1.0: Scaffold: Next.js App Router + TypeScript + Tailwind, `GET /api/health` → { ok: true }; Neon Postgres via Vercel marketplace; Drizzle schema (users, checks, claims, test_runs) + SQL migrations applied via Neon HTTPS SQL API; repo public with description + topics; deploy to Vercel.
      Done means: `gh repo view` shows description + topics; live URL returns 200 on /api/health.
      Unblocks: everything.
      ✅ Verified 27 Nov 2026 ~09:05 IST: Next 16.4.6 build green; /api/health 200 locally + live https://agent-done-checker.vercel.app; Neon agent-done-checker-db via Vercel marketplace, migration 0001 applied (4 tables, 28 cols verified by query); gh repo view shows description + homepage + 7 topics, PUBLIC. Commit 6401fdd.
- [x] T-1.1: CLI collects evidence: read plan/transcript file, run `git diff` (branch vs base), run the test command fresh, upload evidence bundle to POST /api/checks, print report URL.
      Done means: `adc check --plan plan.md --repo .` in a real repo returns a report URL.
      ✅ Verified 27 Nov 2026 ~09:40 IST: CLI run against the tiny-vitest fixture printed http://localhost:3100/checks/5ebe55d5-abb3-4c29-9f01-2db16d3a6dea; test parser read 2 passed / 0 failed / 1 skipped from vitest output. (Codex wrote the CLI; its sandbox could not install tsx — installed tsx + vitest from my shell instead.)
- [x] T-1.2: POST /api/checks intake: validate bundle, store check + diff + test run, status transitions received → extracting → verdicting → done.
      Done means: a posted bundle appears in the DB with status done and no 500s.
      ✅ Verified 27 Nov 2026 ~09:40 IST: check 5ebe55d5 reached status done; empty body → 400, invalid JSON → 400, unknown id → 404, no 500s. Pipeline is a placeholder (zero claims) until T-1.3/T-1.4. Migration 0002 added plan_text/diff/diff_truncated to checks; DESIGN.md updated to match.
- [x] T-1.3: Claim extraction via FastRouter (key 2): plan/transcript text → individual falsifiable claims stored on the check.
      Done means: a 10-claim plan yields ≥8 stored claims, each one falsifiable statement.
      ✅ Verified 27 Nov 2026 ~09:45 IST: 10-claim plan (eval/fixtures/plan-10-claims.md) yielded 9 stored claims via the live pipeline (check f2426f1e), all falsifiable statements. FastRouter key 2 set as encrypted env on Vercel (prod/preview/dev) + .env.local; src/lib/llm.ts (fastrouter/auto, 30s timeout, 1 retry on empty content) + src/lib/extract.ts.
- [x] T-1.4: Verdict engine: each claim → Verified / Partial / Unverified / Contradicted, with cited diff hunks and/or test results; overall score = verified / total.
      Done means: every verdict cites evidence; a Verified claim with no cited hunk or passing test is impossible by construction.
      ✅ Verified 27 Nov 2026 ~09:45 IST: check f2426f1e done, score 1/9 (0.111); 1 verified (comment claim, cites verbatim hunk + passing test), 1 partial, 6 contradicted (claims absent from this diff — defensible), 1 unverified. Construction rule enforced in code in src/lib/verdict.ts (verbatim-substring citation check + downgrade). Defect found + fixed in verification: absence-based Contradicted wrongly fired when the claim's key token (test.skip) was present in the diff as a context line — absence rule now also fails when a dotted identifier/quoted literal from the claim appears in the diff or test output; the claim flipped to Unverified on re-run. Known gap carried to T-1.5: GET /api/checks/[id] still returns claims: [] (Group 2 placeholder) and claims have no position/order column — the report page must read claims from the DB and preserve extraction order.
- [x] T-1.5: Report page /checks/[id] + checks list: score, per-claim verdicts with evidence, test run summary. UI via the Impeccable skill, verified with a screenshot.
      Done means: opening the report URL in a browser shows the score, all claims, and their evidence.
      ✅ Verified 27 Nov 2026 ~10:00 IST: /checks list (3 checks, newest first), /checks/[id] report (score 1/10, all 10 claims in extraction order with badges, cited hunks + tests, real reasons), home landing — all screenshot-verified in Chromium; Impeccable detector clean ([]). Migration 0003 (claims.position) applied to Neon. GET /api/checks/[id] now returns real claims; GET /api/checks lists newest first (cap 50); unknown id → 404. Fixes made during verification: layout reverted from Codex's devtools-font localFont hack to next/font/google Geist (production-correct); contradicted verdicts no longer display passing test lines as counter-evidence; reason line hidden when absent; per-line hunk fragments joined into one block. Impeccable notes: no PRODUCT.md exists — brief was spec/DESIGN.md + T-1.5, mode Operate, incumbent Tailwind v4 + Geist is the visual authority; /impeccable init offered as follow-up. Known gap: checks created before migration 0003 (5ebe55d5, c45f5200, f2426f1e) have position 0 on all claims, so their claim order is UUID order, not extraction order — new checks are ordered correctly.
- [x] T-1.6: Eval gate: 5 real agent sessions (incl. one genuine skipped-test session) run through the pipeline; the genuine skip MUST be flagged Contradicted or Unverified.
      Done means: eval results filed in spec/ with the skip correctly flagged; anything else is a Slice 1 failure.
      ✅ Verified 27 Nov 2026 ~10:45 IST: GATE PASSES — spec/EVAL-SLICE-1.md filed. 5 sessions: (1) tiny-vitest fixture dcacf502, skip claim Unverified ✅, score 0.10; (2) ADC T-1.1+T-1.2 d5467536, 15 claims, score 0.00; (3) ADC T-1.3+T-1.4 4137e592, 10 claims all Partial, score 0.00; (4) ADC T-1.5 207dc97a, 32 claims, 28 verified, score 0.875; (5) TogglePilot T-2.4 2ed2ad32, 18 claims, 11 verified, score 0.611, live-data claims correctly Contradicted. Defects found + fixed during the gate: FastRouter timeout 30s→60s/120s; verdict calls batched in 10s (32-claim check failed with "wrong number of verdicts" before); CLI parser now handles node:test `ℹ pass/fail` summaries (70 passing tests read as 0/0/0 before). Open findings for T-1.7: verdict strictness varies run to run (fastrouter/auto routes to different models); build-only runs can never verify code claims (prompt needs hunk + passing test, builds have 0 counts); extraction over-generates (10 items → up to 32 claims); 30KB diff truncation can mislead absence verdicts; a 32-claim check needs ~2–3 min of LLM calls vs the 60s Vercel Hobby budget — production behaviour for large checks unverified.
- [ ] T-1.7: Relentless QA pass (fresh subagent, adversarial) + fix all criticals; Pintu confirms the slice in the browser.
      Done means: QA report filed, criticals fixed, Pintu's confirmation received.

## Slice 2 — Accounts, history, Codex logs
- [ ] T-2.1: Auth.js GitHub OAuth; checks belong to users; a user sees only their own checks.
      Done means: signed-out user cannot open another user's report URL.
- [ ] T-2.2: Check history + Solo free counter (10 checks/month, enforced).
      Done means: 11th check in a month is refused with a plain-English limit message.
- [ ] T-2.3: Codex session-log parser as a native claim source (no pasting).
      Done means: a real Codex session log file produces claims without manual paste.
- [ ] T-2.4: Dashboard polish (Impeccable skill) + dogfood: verify this build's own slices with the checker.
      Done means: Slice 1 + Slice 2 code verified by the product itself; report filed.

## Slice 3 — Billing + launch
- [ ] T-3.1: Stripe Checkout + webhook; Team $20/mo unlimited; Solo free limits enforced server-side.
      Done means: a test-mode $20 checkout upgrades the account and lifts the cap.
- [ ] T-3.2: Landing page + pricing (Solo free / Team $20/mo) + README with live demo link.
      Done means: landing page live on the Vercel URL with working checkout link.
- [ ] T-3.3: Demo video: the genuine catch (Q8) recorded end-to-end, public on YouTube; repo metadata re-verified.
      Done means: video public, README + landing carry the link, `gh repo view` clean.
