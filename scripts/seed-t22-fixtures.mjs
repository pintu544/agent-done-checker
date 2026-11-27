// Seed T-2.2 limit fixtures: one solo + one team user, 10 checks each in the
// current UTC month. Usage: node scripts/seed-t22-fixtures.mjs
// Prints the two user UUIDs; re-running is idempotent for the users, and adds
// 10 more checks per run (use fresh UUIDs via env SOLO_ID / TEAM_ID to reset).
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const envFile = readFileSync("/home/hatch/workspace/agent-done-checker/.env.local", "utf8");
const match = envFile.match(/^DATABASE_URL=(.+)$/m);
if (!match) throw new Error("DATABASE_URL not found in .env.local");
const databaseUrl = match[1].trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
const sql = neon(databaseUrl);

const soloId = process.env.SOLO_ID ?? randomUUID();
const teamId = process.env.TEAM_ID ?? randomUUID();

await sql.query(`INSERT INTO users (id, github_id, email, plan) VALUES
  ('${soloId}', 't22-solo-${soloId.slice(0, 8)}', '${soloId}@example.test', 'solo'),
  ('${teamId}', 't22-team-${teamId.slice(0, 8)}', '${teamId}@example.test', 'team')
  ON CONFLICT (github_id) DO NOTHING;`);
for (const userId of [soloId, teamId]) {
  await sql.query(`INSERT INTO checks (user_id, repo, branch, base, test_command, status, created_at)
    SELECT '${userId}', 't22-fixture', 'main', 'main', 'true', 'done', now()
    FROM generate_series(1, 10);`);
}
console.log(`SOLO_ID=${soloId}`);
console.log(`TEAM_ID=${teamId}`);
