# Dogfood plan — Slice 2, T-2.2 (Solo counter, 10 checks/month)
# Faithful claim list of what the T-2.2 slice did (commit b8b3654; base 4bd0600).

- Created src/lib/usage.ts with getMonthlyUsage and checkMonthlyLimit functions.
- getMonthlyUsage counts the user's checks in the current UTC calendar month from the checks table.
- The users counter columns (checks_used_this_month, checks_used_month) are intentionally not used for enforcement.
- POST /api/checks calls checkMonthlyLimit before inserting and returns HTTP 429 with a plain-English message when a Solo user has used all 10 checks.
- The 429 message names the limit, the month, and the reset date (1 December 2026).
- Team plan users have no cap: checkMonthlyLimit always allows them.
- The checks list page shows a usage line for signed-in users ("N of 10 free checks used in November 2026 — resets 1 December 2026", or "Team plan — unlimited checks").
- Anonymous submissions remain allowed and uncounted in demo mode.
- The CLI was not changed: API errors already print verbatim to stderr and exit 1.
- Added seed scripts scripts/seed-t22-fixtures.mjs and scripts/seed-t22-boundary.mjs for limit testing.
