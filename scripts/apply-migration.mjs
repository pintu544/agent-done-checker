// Apply a drizzle SQL migration file via the Neon HTTPS SQL API.
// Usage: node scripts/apply-migration.mjs <sql-file>
// DATABASE_URL is read from ~/workspace/agent-done-checker/.env.local (never printed).
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const envFile = readFileSync("/home/hatch/workspace/agent-done-checker/.env.local", "utf8");
const match = envFile.match(/^DATABASE_URL=(.+)$/m);
if (!match) throw new Error("DATABASE_URL not found in .env.local");
const databaseUrl = match[1].trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
const sqlFile = process.argv[2];
if (!sqlFile) throw new Error("Usage: apply-migration.mjs <sql-file>");
const sqlText = readFileSync(sqlFile, "utf8");
const statements = sqlText.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
const sql = neon(databaseUrl);
for (const statement of statements) {
  await sql.query(statement);
  console.log("OK:", statement.slice(0, 80).replace(/\s+/g, " "));
}
console.log(`Applied ${statements.length} statement(s) from ${sqlFile}`);
