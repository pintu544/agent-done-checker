import { desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { checks, claims, testRuns } from "./schema";

export function listChecks() {
  return db.select({
    id: checks.id,
    repo: checks.repo,
    branch: checks.branch,
    status: checks.status,
    score: checks.score,
    createdAt: checks.createdAt,
  }).from(checks).orderBy(desc(checks.createdAt), desc(checks.id)).limit(50);
}

export async function getCheckReport(id: string, includeTestOutput = false) {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return null;

  const [check] = await db.select({
    id: checks.id,
    repo: checks.repo,
    branch: checks.branch,
    base: checks.base,
    testCommand: checks.testCommand,
    diffTruncated: checks.diffTruncated,
    verdictDiffTruncated: checks.verdictDiffTruncated,
    error: checks.error,
    status: checks.status,
    score: checks.score,
    createdAt: checks.createdAt,
    testRun: {
      command: testRuns.command,
      passed: testRuns.passed,
      failed: testRuns.failed,
      skipped: testRuns.skipped,
      exitCode: testRuns.exitCode,
      durationMs: testRuns.durationMs,
      output: includeTestOutput ? testRuns.outputTruncated : sql<null>`null`,
    },
  }).from(checks).leftJoin(testRuns, eq(testRuns.checkId, checks.id))
    .where(eq(checks.id, id)).limit(1);

  if (!check) return null;

  const checkClaims = await db.select({
    id: claims.id,
    text: claims.text,
    verdict: claims.verdict,
    evidence: claims.evidence,
  }).from(claims).where(eq(claims.checkId, id)).orderBy(claims.position, claims.id);

  return { ...check, claims: checkClaims };
}
