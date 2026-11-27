import { neon } from "@neondatabase/serverless";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));
const migrations = new URL("../drizzle/", import.meta.url);
let currentFile;

try {
  if (!process.env.DATABASE_URL && existsSync(envFile)) {
    loadEnvFile(envFile);
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(process.env.DATABASE_URL);
  const entries = await readdir(migrations, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();

  for (const file of files) {
    currentFile = file;
    const source = await readFile(new URL(file, migrations), "utf8");
    // Separate statements with Drizzle's breakpoint marker for Neon HTTP batching.
    const statements = source.split(/^--> statement-breakpoint\s*$/m)
      .map((statement) => statement.trim())
      .filter(Boolean);
    await sql.transaction(statements.map((statement) => sql.query(statement)));
    console.log(`Applied ${file}`);
  }
} catch (error) {
  if (currentFile) {
    console.error(`Failed to apply ${currentFile}`);
  } else if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
  } else {
    console.error("Failed to initialize migrations");
  }
  process.exitCode = 1;
}
