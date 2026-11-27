# GRILL — Agent Done Checker
**Picked 27 Nov 2026** (research + Codex scoring both ranked it #1: research 7.5/10, Codex 7.0/10).
Research: `~/workspace/project-ideas/next-build-research-2026-11-26.md`.
Status: **LOCKED — Pintu answered "Yes to All" 27 Nov 2026 ~08:45 IST, then ordered "Build with codex cli".**

## Q1 — Input: how does the checker learn what the agent claimed?
**Locked:** Agent-agnostic v1. The user pastes the agent's plan/claim text (or drops a transcript file) and points at a repo. The checker reads the git diff and runs the tests itself. First native integration: Codex session-log parsing, since Pintu dogfoods Codex daily.

## Q2 — Verdict model: what does a check conclude?
**Locked:** Per-claim verdict — Verified / Partial / Unverified / Contradicted — plus one overall score (verified claims / total claims). A claim is Verified only when the diff shows the change AND the relevant test passes on a re-run.

## Q3 — Test verification: re-run or trust the agent's log?
**Locked:** Re-run the affected tests ourselves in the repo. Trusting the agent's log is exactly the failure this product exists to catch; the log is used only to know what the agent *claims* it ran.

## Q4 — Delivery shape: what does the user actually open?
**Locked:** Next.js web dashboard (verdict report + check history) plus a small CLI that collects evidence from a repo and uploads it. GitHub PR check deferred to v2.

## Q5 — Stack and hosting
**Locked:** Next.js + TypeScript on Vercel, PostgreSQL on Neon (same as AgentShelf), Stripe for Team $20/mo, Resend for email. This is the rival agentchecker.ai's listed stack exactly, and Pintu's own.

## Q6 — MVP scope: what is explicitly in and out?
**Locked in:** one repo, one branch/task per check; claim extraction from pasted plan/transcript; diff analysis; test re-run; verdict report + history.
**Locked out:** auto-fixing anything, running the coding agent itself, multi-repo org analytics, IDE plugin, GitHub App.

## Q7 — Dogfood target: what is the first real check?
**Locked:** This build's own slices — every slice gets verified by the checker itself. Plus one retrospective demo: re-run the checker over a real past Codex session (e.g. a TogglePilot slice) as the public demo case.

## Q8 — The demo that proves it works
**Locked:** A real agent session where the agent claimed tests pass but actually skipped one (or never ran them). The checker must flag it Contradicted/Unverified — a genuine catch, not a staged one. If no such session exists in his history, manufacture one honestly: run an agent on a task, let it cut a corner, catch it.

## Q9 — Name, repo, pricing in the MVP
**Locked:** Name **Agent Done Checker**, repo `github.com/pintu544/agent-done-checker` (public), tagline "Prove the agent actually did it." Pricing Solo free / Team $20/mo, Stripe billing wired in as the monetisation slice of the MVP (not after launch — the point is a paid product).

## Locked decisions (from research, not re-asked)
- Problem: coding agents claim a task is done when it isn't; teams need independent verification.
- Buyer: teams using coding agents; price anchor Team $20/mo (Ghostlaunch example); rival agentchecker.ai $902 all-time revenue (Stripe-verified 15 Nov 2026) — early/tiny, lane open.
- Effort: 5–8 day MVP. Fits inside the Codex CLI window (available until 3 Dec 2026).
- Biggest risk: agent vendors ship verification natively; buyers must feel the pain enough to pay $20/mo instead of eyeballing diffs.
