// One-off: seed a solo user with exactly 9 checks this month (boundary test).
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const envFile = readFileSync("/home/hatch/workspace/agent-done-checker/.env.local", "utf8");
const match = envFile.match(/^DATABASE_URL=(.+)$/m);
const databaseUrl = match[1].trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
const sql = neon(databaseUrl);
const id = randomUUID();
await sql.query(`INSERT INTO users (id, github_id, email, plan) VALUES
  ('${id}', 't22-boundary-${id.slice(0, 8)}', '${id}@example.test', 'solo');`);
await sql.query(`INSERT INTO checks (user_id, repo, branch, base, test_command, status, created_at)
  SELECT '${id}', 't22-fixture', 'main', 'main', 'true', 'done', now()
  FROM generate_series(1, 9);`);
console.log(`BOUNDARY_ID=${id}`);
