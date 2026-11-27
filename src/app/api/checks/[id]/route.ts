import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { checks, testRuns } from "@/lib/schema";

export async function GET(_request: Request, { params }: RouteContext<"/api/checks/[id]">) {
  const { id } = await params;
  const notFound = () => Response.json({ error: "Check not found." }, { status: 404 });
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return notFound();

  const [check] = await db.select({
    id: checks.id,
    repo: checks.repo,
    branch: checks.branch,
    base: checks.base,
    testCommand: checks.testCommand,
    status: checks.status,
    score: checks.score,
    createdAt: checks.createdAt,
    testRun: {
      command: testRuns.command,
      passed: testRuns.passed,
      failed: testRuns.failed,
      skipped: testRuns.skipped,
      durationMs: testRuns.durationMs,
      output: testRuns.outputTruncated,
    },
  }).from(checks).leftJoin(testRuns, eq(testRuns.checkId, checks.id))
    .where(eq(checks.id, id)).limit(1);

  return check ? Response.json({ ...check, claims: [] }) : notFound();
}
