// Seed T-2.1 ownership fixtures (test users + checks) via Neon HTTPS SQL API.
// Usage: node scripts/seed-t21-fixtures.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const envFile = readFileSync("/home/hatch/workspace/agent-done-checker/.env.local", "utf8");
const match = envFile.match(/^DATABASE_URL=(.+)$/m);
if (!match) throw new Error("DATABASE_URL not found in .env.local");
const databaseUrl = match[1].trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
const sql = neon(databaseUrl);

await sql.query(`INSERT INTO users (id, github_id, email) VALUES
  ('10000000-0000-4000-8000-000000000001', 't21-owner', 'owner@example.test'),
  ('10000000-0000-4000-8000-000000000002', 't21-other', 'other@example.test')
  ON CONFLICT (github_id) DO NOTHING;`);
await sql.query(`INSERT INTO checks (id, user_id, repo, branch, base, test_command, status) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner-fixture', 'main', 'main', 'true', 'done'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'other-fixture', 'main', 'main', 'true', 'done'),
  ('20000000-0000-4000-8000-000000000003', NULL, 'public-fixture', 'main', 'main', 'true', 'done')
  ON CONFLICT (id) DO NOTHING;`);
console.log("T-2.1 fixtures seeded");
