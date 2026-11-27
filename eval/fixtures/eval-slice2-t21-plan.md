# Dogfood plan — Slice 2, T-2.1 (Auth.js GitHub OAuth + ownership)
# Faithful claim list of what the T-2.1 slice did (commits 82bf2df, e39b6d5, f138eab, 4bd0600; base d8d9fdd).

- Installed Auth.js v5 (next-auth@beta 5.0.0-beta.32) with the GitHub provider and JWT sessions.
- Created src/auth.ts with a sign-in callback that upserts the user into the users table by github_id.
- The sign-in callback falls back to login@users.noreply.github.com when GitHub hides the user's email.
- Created the Auth.js route handler at src/app/api/auth/[...nextauth]/route.ts.
- Added src/lib/session.ts with getSessionUser, including a test-only ADC_TEST_SESSION_USER_ID override that is disabled in production.
- Enforced ownership in getCheckReport so a non-owner gets null (404) instead of the report.
- Changed listChecks so a signed-in user sees their own checks plus legacy checks with user_id NULL, and a signed-out user sees only legacy NULL checks.
- POST /api/checks attaches the signed-in user's id to new checks and keeps anonymous submissions unowned.
- Added sign-in/sign-out controls (AuthControls) to the home page and the checks list page.
- Added migration 0005 with a users.checks_used_month column and an index on checks(user_id).
- The report page loads the report in the page component and calls notFound() before any JSX streams, with export const instant = false.
