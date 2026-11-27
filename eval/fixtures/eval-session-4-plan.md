# Eval session 4 — Agent Done Checker T-1.5 (commit 8d6f943, base 8913133)
# Real Codex session: report page /checks/[id] + checks list + landing.

1. Added a position column to claims so the report shows claims in extraction order.
2. GET /api/checks/[id] returns the real claims ordered by position instead of an empty list.
3. GET /api/checks lists checks newest first, capped at 50.
4. The /checks list page shows one row per check with repo, branch, status, score and created date.
5. The /checks/[id] report page shows the score as verified/total with a percentage and counts per verdict.
6. The report page shows the test run summary: command, passed, failed, skipped and duration.
7. Each claim on the report page shows its verdict badge, text, cited diff hunks, cited tests and reason.
8. A check still processing shows a refresh note; a failed check shows a failure note.
9. The home page is a minimal landing with the product description and a link to /checks.
10. The report UI follows the Impeccable Operate mode: restrained colour, verdict badges as the only strong colour.
