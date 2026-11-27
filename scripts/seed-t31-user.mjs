// Seed a T-3.1 test user: solo plan with 10 checks in the current UTC month,
// so the 11th POST is 429 before the plan flip and 200 after it.
// Usage: node scripts/seed-t31-user.mjs [USER_ID]
// Prints USER_ID. Re-running with the same id is idempotent for the user
// (checks are topped up to 10 for the month).
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const envFile = readFileSync("/home/hatch/workspace/agent-done-checker/.env.local", "utf8");
const databaseUrl = envFile.match(/^DATABASE_URL=(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = neon(databaseUrl);

const userId = process.env.USER_ID ?? randomUUID();
await sql.query(`INSERT INTO users (id, github_id, email, plan) VALUES
  ('${userId}', 't31-${userId.slice(0, 8)}', '${userId}@example.test', 'solo')
  ON CONFLICT (github_id) DO NOTHING;`);
const [{ n }] = await sql.query(
  "SELECT count(*)::int AS n FROM checks WHERE user_id = $1 AND created_at >= date_trunc('month', now(), 'UTC')",
  [userId]);
for (let i = n; i < 10; i++) {
  await sql.query(`INSERT INTO checks (user_id, repo, branch, base, test_command, status, created_at)
    VALUES ('${userId}', 't31-fixture', 'main', 'main', 'true', 'done', now());`);
}
console.log(`USER_ID=${userId}`);
