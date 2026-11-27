# Eval session 2 — Agent Done Checker T-1.1 + T-1.2 (commit a0517c0, base 6401fdd)
# Real Codex session: CLI evidence collection + POST /api/checks intake.

1. Added a CLI that reads a plan/transcript file and collects evidence from the repo.
2. The CLI runs git diff of the branch against the base ref.
3. The CLI runs the test command fresh and parses vitest/jest/mocha counts.
4. The CLI uploads the evidence bundle to POST /api/checks and prints the report URL.
5. POST /api/checks validates the bundle and rejects an empty body with 400.
6. POST /api/checks rejects invalid JSON with 400.
7. POST /api/checks stores the check plus its diff and test run in the database.
8. The check status transitions received → extracting → verdicting → done.
9. GET /api/checks/[id] returns 404 for an unknown id.
10. A CLI run against the tiny-vitest fixture printed a report URL and the parser read 2 passed, 0 failed, 1 skipped.
