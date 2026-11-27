import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { extractClaims } from "./extract";
import { checks, claims, testRuns } from "./schema";
import { verdictClaims } from "./verdict";

export async function processCheck(checkId: string) {
  const checkAt = (status: typeof checks.$inferSelect.status) =>
    and(eq(checks.id, checkId), eq(checks.status, status));

  try {
    const [check] = await db.update(checks).set({ status: "extracting" })
      .where(checkAt("received"))
      .returning({ planText: checks.planText, diff: checks.diff });
    if (!check) return;

    if (check.diff !== null) {
      // Keep this limit in sync with the verdict diff slice in verdict.ts.
      await db.update(checks).set({ verdictDiffTruncated: check.diff.length > 30_000 })
        .where(checkAt("extracting"));
    }

    const [testRun] = await db.select({
      command: testRuns.command,
      passed: testRuns.passed,
      failed: testRuns.failed,
      skipped: testRuns.skipped,
      exitCode: testRuns.exitCode,
      output: testRuns.outputTruncated,
    }).from(testRuns).where(eq(testRuns.checkId, checkId)).limit(1);
    if (!testRun || check.planText === null || check.diff === null) {
      throw new Error("Check is missing its plan, diff, or test run");
    }

    const claimTexts = await extractClaims(check.planText);
    const rows = claimTexts.map((text, position) => ({
      id: randomUUID(),
      checkId,
      position,
      text,
      verdict: "unverified" as const,
      evidence: { diff_hunks: [], tests: [] },
    }));
    if (rows.length) await db.insert(claims).values(rows);

    const [advanced] = await db.update(checks).set({ status: "verdicting" })
      .where(checkAt("extracting")).returning({ id: checks.id });
    if (!advanced) return;

    const verdicts = await verdictClaims({ claims: claimTexts, diff: check.diff, testRun });
    const verified = verdicts.filter(({ verdict }) => verdict === "verified").length;
    const updates = verdicts.map(({ verdict, evidence, reason }, index) =>
      db.update(claims).set({ verdict, evidence: { ...evidence, reason } }).where(eq(claims.id, rows[index].id)));
    const finish = db.update(checks).set({
      status: "done",
      score: rows.length ? verified / rows.length : null,
    }).where(checkAt("verdicting"));

    // Publish the verdicts and score together.
    await db.batch([finish, ...updates]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Check processing failed", checkId, message);
    try {
      await db.update(checks).set({ status: "failed", error: message.slice(0, 1000) }).where(and(
        eq(checks.id, checkId),
        inArray(checks.status, ["received", "extracting", "verdicting"]),
      ));
    } catch (statusError) {
      console.error("Could not mark check failed", checkId,
        statusError instanceof Error ? statusError.message : String(statusError));
    }
  }
}
