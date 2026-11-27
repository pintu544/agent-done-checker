import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  githubId: text("github_id").notNull().unique(),
  email: text().notNull(),
  plan: text({ enum: ["solo", "team"] }).notNull().default("solo"),
  checksUsedThisMonth: integer("checks_used_this_month").notNull().default(0),
  checksUsedMonth: text("checks_used_month"),
  stripeCustomerId: text("stripe_customer_id"),
}, (table) => [
  check("users_plan_check", sql`${table.plan} IN ('solo', 'team')`),
]);

export const checks = pgTable("checks", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  repo: text().notNull(),
  branch: text().notNull(),
  base: text().notNull(),
  testCommand: text("test_command").notNull(),
  planText: text("plan_text"),
  diff: text(),
  diffTruncated: boolean("diff_truncated").notNull().default(false),
  verdictDiffTruncated: boolean("verdict_diff_truncated").notNull().default(false),
  error: text(),
  status: text({ enum: ["received", "extracting", "verdicting", "done", "failed"] })
    .notNull().default("received"),
  score: doublePrecision(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("checks_user_id_idx").on(table.userId),
  check("checks_status_check", sql`${table.status} IN ('received', 'extracting', 'verdicting', 'done', 'failed')`),
]);

export const claims = pgTable("claims", {
  id: uuid().defaultRandom().primaryKey(),
  checkId: uuid("check_id").notNull().references(() => checks.id),
  position: integer().notNull().default(0),
  text: text().notNull(),
  verdict: text({ enum: ["verified", "partial", "unverified", "contradicted"] }).notNull(),
  evidence: jsonb().$type<{
    diff_hunks: unknown[];
    tests: unknown[];
    reason?: string;
    raw?: unknown;
    downgrade?: string;
    absence?: boolean;
  }>().notNull(),
}, (table) => [
  check("claims_verdict_check", sql`${table.verdict} IN ('verified', 'partial', 'unverified', 'contradicted')`),
]);

export const testRuns = pgTable("test_runs", {
  id: uuid().defaultRandom().primaryKey(),
  checkId: uuid("check_id").notNull().references(() => checks.id),
  command: text().notNull(),
  passed: integer().notNull(),
  failed: integer().notNull(),
  skipped: integer().notNull(),
  durationMs: integer("duration_ms").notNull(),
  exitCode: integer("exit_code"),
  outputTruncated: text("output_truncated").notNull(),
}, (table) => [
  check("test_runs_output_truncated_check", sql`octet_length(${table.outputTruncated}) <= 204800`),
]);
