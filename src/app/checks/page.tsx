import { count, inArray } from "drizzle-orm";
import { io } from "next/cache";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { listChecks } from "@/lib/check-reports";
import { db } from "@/lib/db";
import { claims } from "@/lib/schema";
import { getSessionUser } from "@/lib/session";
import { getMonthlyUsage } from "@/lib/usage";
import { AuthControls } from "../auth-controls";
import { CheckDate, StatusBadge } from "./check-details";

export default function ChecksPage() {
  const heading = (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Checks</h1>
      <div className="mt-4">
        <Suspense fallback={null}>
          <AuthControls />
        </Suspense>
      </div>
    </>
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <Link className="adc-link text-sm" href="/">Agent Done Checker</Link>
      <Suspense fallback={
        <>
          <header className="mt-6">{heading}</header>
          <p className="mt-8" role="status">Loading checks…</p>
        </>
      }>
        <ChecksList heading={heading} />
      </Suspense>
    </main>
  );
}

async function ChecksList({ heading }: { heading: ReactNode }) {
  await io();
  const user = await getSessionUser();
  const [checks, usage] = await Promise.all([
    listChecks(user?.id),
    user ? getMonthlyUsage(user.id) : null,
  ]);
  const header = (
    <header className="mt-6">
      {heading}
      {usage && (
        <p className="mt-2 text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
          {usage.plan === "team"
            ? "Team plan — unlimited checks"
            : `${usage.used} of ${usage.limit} free checks used in ${usage.monthLabel} — resets ${usage.resetLabel}`}
        </p>
      )}
    </header>
  );

  if (!checks.length) {
    return (
      <>
        {header}
        <p className="mt-8 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          No checks yet — run <code>adc check --plan plan.md --repo .</code> from your repository.
        </p>
      </>
    );
  }

  const scoredIds = checks.filter(({ score }) => score !== null).map(({ id }) => id);
  const counts = scoredIds.length
    ? await db.select({ id: claims.checkId, total: count() }).from(claims)
      .where(inArray(claims.checkId, scoredIds)).groupBy(claims.checkId)
    : [];
  const totals = new Map(counts.map(({ id, total }) => [id, total]));

  return (
    <>
      {header}
      <table className="mt-8 w-full table-fixed border-collapse text-left text-sm max-md:block">
      <thead className="max-md:sr-only">
        <tr className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <th scope="col" className="w-2/5 py-3 pr-4 font-medium">Repository / Branch</th>
          <th scope="col" className="py-3 pr-4 font-medium">Status</th>
          <th scope="col" className="py-3 pr-4 font-medium">Verified</th>
          <th scope="col" className="w-1/4 py-3 font-medium">Created</th>
        </tr>
      </thead>
      <tbody className="max-md:block">
        {checks.map(({ id, repo, branch, status, score, createdAt }) => {
          const total = totals.get(id) ?? 0;
          return (
            <tr key={id} className="group border-b border-zinc-200 hover:bg-zinc-100 focus-within:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:focus-within:bg-zinc-900 max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-2 max-md:py-4">
              <th scope="row" className="py-4 pr-4 font-normal wrap-anywhere max-md:col-span-2 max-md:p-0">
                <Link href={`/checks/${id}`} className="adc-link font-medium group-hover:decoration-current focus-visible:decoration-current">{repo}</Link>
                <span className="mt-1 block text-zinc-600 dark:text-zinc-400">{branch}</span>
              </th>
              <td className="py-4 pr-4 max-md:p-0"><StatusBadge status={status} /></td>
              <td className="py-4 pr-4 tabular-nums max-md:p-0">
                {score === null ? "—" : `${Math.round(score * total)} / ${total} (${Math.round(score * 100)}%)`}
              </td>
              <td className="py-4 text-zinc-600 tabular-nums dark:text-zinc-400 max-md:col-span-2 max-md:p-0">
                <CheckDate date={createdAt} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </>
  );
}
