import { randomUUID } from "node:crypto";
import { after, connection } from "next/server";
import { listChecks } from "@/lib/check-reports";
import { db } from "@/lib/db";
import { DIFF_LIMIT, TEST_OUTPUT_LIMIT } from "@/lib/evidence-limits";
import { processCheck } from "@/lib/pipeline";
import { checks, testRuns } from "@/lib/schema";
import { getSessionUser } from "@/lib/session";
import { checkMonthlyLimit } from "@/lib/usage";

const DEFAULT_ORIGIN = "https://agent-done-checker.vercel.app";

// The pipeline runs in after() (two FastRouter calls); give it the full
// Hobby function budget instead of the 15s default.
export const maxDuration = 60;

function error(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && !value.includes("\0") &&
    Buffer.from(value).toString("utf8") === value;
}

function isRequiredText(value: unknown): value is string {
  return isText(value) && value.trim().length > 0;
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) &&
    value >= 0 && value <= 2_147_483_647;
}

function reportOrigin(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.origin;
  } catch {
    // Use the public origin if the request has no usable URL.
  }
  return DEFAULT_ORIGIN;
}

export async function GET() {
  await connection();
  const user = await getSessionUser();
  return Response.json(await listChecks(user?.id), {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Request body must be valid JSON.");
  }

  if (!isObject(body)) return error("Request body must be a JSON object.");
  const { repo, branch, base, testCommand, diff, testRun, truncated } = body;
  const planText = body.planText ?? body.transcript;
  if (!isRequiredText(planText) || !isRequiredText(repo) || !isRequiredText(branch) ||
      !isRequiredText(base) || !isRequiredText(testCommand)) {
    return error("Provide non-empty text for planText (or transcript), repo, branch, base, and testCommand.");
  }
  if (!isText(diff)) return error("Provide diff as text.");
  if (Buffer.byteLength(diff) > DIFF_LIMIT) return error("Diff exceeds 1 MB.", 413);
  if (truncated !== undefined && typeof truncated !== "boolean") {
    return error("The truncated flag must be true or false.");
  }
  if (!isObject(testRun)) return error("Provide a testRun object.");

  const { command, passed, failed, skipped, durationMs, output, exitCode } = testRun;
  if (!isRequiredText(command) || !isText(output)) {
    return error("Provide testRun.command as non-empty text and testRun.output as text.");
  }
  if (Buffer.byteLength(output) > TEST_OUTPUT_LIMIT) return error("Test output exceeds 200 KB.", 413);
  if (!isNonnegativeInteger(passed) || !isNonnegativeInteger(failed) ||
      !isNonnegativeInteger(skipped) || !isNonnegativeInteger(durationMs)) {
    return error("Test counts and durationMs must be integers between 0 and 2147483647.");
  }

  if (exitCode !== undefined && exitCode !== null &&
      (!isNonnegativeInteger(exitCode) || exitCode > 255)) {
    return error("testRun.exitCode must be null or an integer between 0 and 255.");
  }

  const checkId = randomUUID();
  try {
    // Anonymous submissions remain allowed and uncounted in demo mode.
    const user = await getSessionUser();
    if (user) {
      const limit = await checkMonthlyLimit(user.id);
      if (!limit.allowed) {
        return Response.json({ error: limit.message }, { status: 429 });
      }
    }

    // Neon HTTP batches both inserts in one transaction.
    await db.batch([
      db.insert(checks).values({
        id: checkId, userId: user?.id ?? null, repo, branch, base, testCommand,
        planText, diff, diffTruncated: truncated ?? false, status: "received",
      }),
      db.insert(testRuns).values({
        checkId, command, passed, failed, skipped, durationMs, exitCode, outputTruncated: output,
      }),
    ]);
  } catch {
    return error("Could not save the check.", 500);
  }

  after(() => processCheck(checkId));
  return Response.json({ checkId, reportUrl: `${reportOrigin(request.url)}/checks/${checkId}` });
}
