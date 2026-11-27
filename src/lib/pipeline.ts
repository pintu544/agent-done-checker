import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { checks } from "./schema";

export async function processCheck(checkId: string) {
  const transitions = [
    ["received", "extracting"],
    ["extracting", "verdicting"],
    ["verdicting", "done"],
  ] as const;

  try {
    // Slice 1 placeholder. Claim extraction and verdicts are implemented later.
    for (const [from, to] of transitions) {
      const [updated] = await db.update(checks).set({ status: to })
        .where(and(eq(checks.id, checkId), eq(checks.status, from)))
        .returning({ id: checks.id });
      if (!updated) return;
    }
  } catch {
    await db.update(checks).set({ status: "failed" }).where(and(
      eq(checks.id, checkId),
      inArray(checks.status, ["received", "extracting", "verdicting"]),
    ));
  }
}
