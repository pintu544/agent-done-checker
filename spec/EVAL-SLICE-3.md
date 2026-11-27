# EVAL — Slice 3 (27 Nov 2026)

> Billing + launch (code part: T-3.1 + T-3.2 + verdict-slice fix).
> T-3.3 (demo video) is NOT part of this slice — produced separately.
> Runs executed against the local dev/prod servers (http://localhost:3100)
> with the live Neon DB + FastRouter key 2, and against production
> https://agent-done-checker.vercel.app where noted.
> Check IDs below are the record — open them at
> https://agent-done-checker.vercel.app/checks/<id>.

## Verdict: T-3.1 DONE, T-3.2 DONE, verdict-slice fix LANDED (partial gain)

- T-3.1: plan flip + cap lift demonstrated end-to-end (local + live
  webhook). Real test-mode $20/mo Checkout Session created via the route
  and verified via the Stripe API; its URL serves a Checkout page (200).
- T-3.2: landing page live with a working checkout link (API-level;
  the signed-in browser click is a parent/browser step — see below).
- Verdict-slice fix: mechanically verified (ranked slice now carries the
  src/ hunks and excludes the lockfile), but the fef505cd scenario still
  scores 0.00 — the remaining failure is LLM strictness, not slice
  absence. See "Verdict-slice fix" below. The fix stays in: it is safe,
  small, and the C4 battery is identical to the C4 round (no regression).

## T-3.1 — Stripe Checkout + webhook (commit c679398)

Stripe facts established first (via the Stripe API, test mode):
- No $20/month Price exists in test mode (nearest: $19 and $79 USD
  monthly). The checkout uses inline `price_data` ($20.00/mo USD).
- No webhook endpoint points at the live app URL. The only endpoint in
  the account is `we_1URvn3…` → `https://tokentrace-api.azurewebsites.net/api/webhooks/stripe`
  (a different project). The stored `STRIPE_WEBHOOK_SECRET` (whsec_…)
  therefore cannot be verified against any endpoint from the API —
  **dashboard step for Pintu:** create a webhook endpoint for
  `https://agent-done-checker.vercel.app/api/stripe/webhook` (events
  `checkout.session.completed`, `customer.subscription.deleted`) and put
  its signing secret into Doppler + Vercel as STRIPE_WEBHOOK_SECRET.
  Until then, no real Stripe→Vercel delivery can occur; that delivery
  is NOT claimed here. The locally-signed tests below prove the code
  path with the stored secret.
- Stripe keys set on Vercel (production + preview + development) as
  sensitive secrets: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET. Also appended to `.env.local` for local dev.
- stripe 22.6.2 installed. `src/lib/stripe.ts` uses
  `Stripe.createFetchHttpClient()`: stripe-node's default raw-https
  client cannot reach api.stripe.com from this VM (egress proxy blocks
  direct TLS — `StripeConnectionError`, SSL `wrong version number`,
  retried 2×); global fetch honours the proxy env (verified 200 via
  fetch first). On Vercel there is no proxy env, so fetch goes direct.

Test user: `d66dda7e-1249-4f52-aedf-da105c2c1c42` (seeded solo, 10 checks
in November 2026 — scripts/seed-t31-user.mjs).

| # | Probe | Result |
|---|-------|--------|
| 1 | Pre-flip 11th check POST (local dev, as test user) | 429 `You've used all 10 free checks for November 2026… Upgrade to Team ($20/month)…` |
| 2 | Locally-signed `checkout.session.completed` → local webhook (scripts/test-stripe-webhook.mjs) | 200 `{received:true}`; row flips plan solo→team, `stripe_customer_id=cus_test_t31webhook` |
| 3 | Replay of the same signed event → local webhook | 200, still team (idempotent) |
| 4 | Bad signature → local webhook | 400 `{error:"Invalid Stripe signature."}` |
| 5 | Post-flip 11th check POST (local dev, as test user) | 200, check `773b1d67-e624-49b1-b2fc-9aaeca3ab5c0` — cap lifted |
| 6 | Locally-signed `customer.subscription.deleted` → local webhook | 200; plan team→solo, customer id retained |
| 7 | Signed-out POST /api/stripe/checkout (live + local prod server) | 401 `{error:"Sign in with GitHub to upgrade to Team."}` |
| 8 | Signed-in checkout with Stripe keys unset (local dev) | 503 `{error:"Billing is not configured yet. Please try again later."}` |
| 9 | Webhook with Stripe keys unset (local prod server) | 503, same message |
| 10 | Real test-mode Checkout Session via the route (local dev, signed-in test user) | 200 `{url: https://checkout.stripe.com/g/pay/cs_test_a06E…}`; Stripe API confirms session `cs_test_a06E…`: mode subscription, status open, customer `cus_Vhj6jTpSPLhiNH`, `client_reference_id` = test user, amount_total 2000 USD, line item $20.00/mo recurring; the Checkout URL returns HTTP 200 |
| 11 | Same locally-signed webhook → LIVE webhook endpoint | 200; row flips to team with the real customer id; bad signature → 400 |
| 12 | Locally-signed `customer.subscription.deleted` (real customer id) → LIVE webhook | 200; plan team→solo, customer id retained. Test user left clean (solo). |

Remaining (not a code gap): a real Stripe→Vercel delivery has not been
observed because no dashboard endpoint exists for the live URL (see
above); completing a test-mode checkout as a signed-in user in the
browser is the final live proof and needs the dashboard endpoint first.

## T-3.2 — Landing page + pricing + README (commit d5a9cf3)

- Home rebuilt (Impeccable, mode Persuade, incumbent Geist + zinc
  world — no PRODUCT.md exists, so no decision-page round was possible
  in this subagent; the page content is exactly the brief-pinned content
  and the build is code-led on the incumbent system).
- Hero: "Prove the agent actually did it". Proof section "It caught a
  real skip" links the live report
  https://agent-done-checker.vercel.app/checks/6645fa27-b395-42f4-a84a-8aca76394835
  (score 0.10; skip claim "Marked the division test as skipped with
  test.skip." Contradicted; comment claim the only Verified) — wording
  verified verbatim against the live API response for that check.
- How-it-works (CLI → verdicts → report), pricing (Solo free 10/mo as
  a plain row; Team $20/mo unlimited as the committed panel with the
  Upgrade button), footer with repo link + live demo link.
- Upgrade button (`src/app/upgrade-button.tsx`, client island): POST
  /api/stripe/checkout → redirect to the Stripe URL; alreadyTeam →
  /checks; 401 → "Sign in with GitHub to upgrade to Team." + link to
  /checks sign-in; 503/502 → plain-English error; pending state.
  `?checkout=cancelled` renders "Checkout cancelled — you're still on
  the Solo plan." (verified in the served HTML).
- No video link anywhere (verified: 0 matches for youtube/youtu.be/
  "demo video" in the served home HTML).
- README Status rewritten (live demo link, Slices 1–3 done, pricing,
  CLI usage with the real `--plan` / `--codex-log` / `--api` flags).
- Screenshot-verified on the local production server
  (`next start`, port 3100): desktop 1440px + mobile 390px, both render
  correctly with no overflow; Impeccable detector clean (`[]`) over
  `src/app/page.tsx`, `src/app/upgrade-button.tsx`, `src/app/layout.tsx`.
  Shots: `/tmp/adc-s3-shots/home-desktop.png`, `home-mobile.png`.
- Remaining: clicking Upgrade as a signed-in user in the browser and
  landing on a real Stripe Checkout page — the API-level proof (probe
  10 above) covers the route; the click itself is a parent/browser step.

## Verdict-slice fix (commit d246855)

Problem (EVAL-SLICE-2): `verdict.ts` sliced `diff.slice(0, 30_000)` for
the LLM prompt; on large diffs the first 30 KB is dominated by
package-lock, so src/ hunks fall outside — check fef505cd scored 0.00
(all Unverified) on real T-2.2 work.

Fix (`src/lib/verdict.ts`, `rankVerdictDiff`, exported for testing):
per-file diff sections are ranked — src/cli/test files first, other
code next, docs/config next, lockfiles/generated last (stable sort,
diff order kept within a rank) — then sliced to 30,000 chars. The
30,000 limit, the `verdictDiffTruncated` flag, and the deterministic
C1–C4 rules (which read the FULL diff) are unchanged; only the LLM
prompt payload is ranked. The diffNote now reads "Diff truncated to
its most relevant 30,000 characters — source files first."
`git diff d8d9fdd -- src/lib/verdict.ts` shows ONLY the slice logic
changed (2 replaced lines + the new helper); the rule code is untouched.

Synthetic unit checks (all pass, `npx tsx`): lockfile-first 44 KB diff
keeps the src hunk and starts with the src section; small diffs are
returned byte-identical; a no-header long diff falls back to a plain
slice; a preamble before the first header is kept first.

### fef505cd re-run (was 0.00)

Two runs, both against the local server (live Neon DB + FastRouter key 2),
same Codex log file (`~/.codex/sessions/2026/11/27/rollout-2026-11-27T06-18-25-01a21ba7-a4bb-7b72-8936-785d945991d7.jsonl`, 365 KB),
base `d8d9fdd`, test command `npx tsc --noEmit`:

| Run | Check | Claims | Score | Verdicts |
|-----|-------|--------|-------|----------|
| A — exact original scope: worktree at T-2.2 commit `b8b3654`, diff d8d9fdd..b8b3654 = 39,259 chars | `c9c81a8e-abe6-4437-9f7e-a03d6833f40f` | 3 | 0.00 | 3 Unverified |
| B — current HEAD scope: diff d8d9fdd..HEAD = 86,103 chars | `0cb1d92d-a537-4896-a5b8-cdc039e5d433` | 3 | 0.00 | 3 Unverified |

Mechanism check (on the STORED diffs, via `rankVerdictDiff`): in BOTH
runs the ranked slice the LLM received contains `src/lib/usage.ts`,
`getMonthlyUsage`, `checkMonthlyLimit`, and excludes `package-lock.json`.
In run A the slice contains every relevant src/ file (usage.ts, route.ts,
page.tsx, session.ts, auth.ts). The fix works as designed — the failure
moved from "evidence absent from the slice" to "evidence present but
uncredited": the LLM returned Unverified with "the diff does not show…"
reasons for claims whose hunks are in its input (run B's cited hunk for
the usage.ts claim even stitches lines from `cli/src/codex-log.ts`).
That is the known Slice 1 finding #1 (verdict strictness varies run to
run; the model contradicts evidence in front of it), and the
deterministic rules by design only downgrade/contradict — they never
upgrade an Unverified to Verified. Extraction also varied (3 claims
both runs vs 5 in the original fef505cd). Score recorded as 0.00, not
claimed as fixed. Residual for v2: claim-aware ranking, or a larger
verdict budget, or a deterministic upgrade when a claim's named file +
identifiers are present in the slice.

### C4 battery re-run (no regression)

`spec/c4-battery.sh` re-run after all Slice 3 code landed (log
`/tmp/c4-battery-slice3.log`, local prod server, port 3100). The
`/tmp/adc-qa3-c4` and `/tmp/adc-qa3-exts` fixture repos had been wiped
from the 512 MB /tmp tmpfs, so both were recreated per the EVAL-SLICE-1
construction (C4 probe: base `357cf89d` with `// logs go to events.log`
as diff context for a genuinely added 100-line events.log; exts: base
`6b0a0d40`, five 20-line files); `spec/c4-battery.sh` SHAs updated to
the new bases.

| Run | Check | Claims | Verified | Partial | Unverified | Contradicted | Score | Skip claim |
|-----|-------|--------|----------|---------|------------|--------------|-------|-----------|
| r1 fixture vitest | `36ef1cff` | 10 | 1 | 3 | 5 | 1 | 0.10 | Contradicted |
| r2 fixture vitest | `22f5b571` | 10 | 1 | 3 | 5 | 1 | 0.10 | Contradicted |
| r3 fixture vitest | `75ee1100` | 10 | 1 | 3 | 5 | 1 | 0.10 | Contradicted |
| r4 C4 probe | `4bbf31db` | 2 | 2 | 0 | 0 | 0 | 1.00 | — |
| r5 exts | `08e78369` | 5 | 5 | 0 | 0 | 0 | 1.00 | — |
| r6 traps | `b4b691ee` | 5 | 1 | 0 | 3 | 1 | 0.20 | Contradicted |
| r7 preservation | `ecb86783` | 2 | 1 | 1 | 0 | 0 | 0.50 | Partial ("Kept…") |
| r8 build-only | `2d3d278c` | 10 | 1 | 2 | 6 | 1 | 0.10 | Contradicted |

Identical to the C4 round in every run (scores 0.10/1.00/1.00/0.20/
0.50/0.10, skip Contradicted in all 5 runs containing it). The
deterministic C1–C4 rules are unregressed by the slice change.

## Known gaps (unchanged from Slice 2)

- M4 — untracked files are invisible to `git diff`.
- Vercel 60s budget for large checks untested on production (the
  production pipeline for large checks is still unverified).
- Live GitHub sign-in is now VERIFIED (27 Nov ~12:54 IST, jm251 —
  parent agent's run, recorded in TASKS.md T-2.1); the OAuth app + env
  are no longer a Slice 3 blocker.
- The fef505cd residual above (model not crediting present evidence).
