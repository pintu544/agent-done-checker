import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { checks, users } from "./schema";

const SOLO_MONTHLY_LIMIT = 10;

const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const resetFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export async function getMonthlyUsage(userId: string): Promise<{
  plan: "solo" | "team";
  used: number;
  limit: number | null;
  monthLabel: string;
  resetLabel: string;
}> {
  const now = new Date();
  const [[user], [usage]] = await Promise.all([
    db.select({ plan: users.plan }).from(users).where(eq(users.id, userId)).limit(1),
    db.select({ used: count() }).from(checks).where(and(
      eq(checks.userId, userId),
      gte(checks.createdAt, sql`date_trunc('month', now(), 'UTC')`),
    )),
  ]);
  const plan = user?.plan === "team" ? "team" : "solo";
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    plan,
    used: usage.used,
    limit: plan === "solo" ? SOLO_MONTHLY_LIMIT : null,
    monthLabel: monthFormat.format(now),
    resetLabel: resetFormat.format(reset),
  };
}

export async function checkMonthlyLimit(userId: string): Promise<
  { allowed: true } | { allowed: false; message: string }
> {
  // Count the user's rows in the current UTC calendar month as the source of truth.
  // The users.checks_used_this_month and users.checks_used_month columns are unused
  // because a separate counter can drift on failed or duplicate writes.
  // Under Neon's HTTP driver, the count and insert are not atomic. Two concurrent
  // POSTs at the limit boundary can both pass this check.
  const { used, limit, monthLabel, resetLabel } = await getMonthlyUsage(userId);
  if (limit === null || used < limit) return { allowed: true };

  return {
    allowed: false,
    message: `You've used all ${limit} free checks for ${monthLabel}. ` +
      `Your limit resets on ${resetLabel}. Upgrade to Team ($20/month) for unlimited checks.`,
  };
}
