import { io } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCheckReport } from "@/lib/check-reports";
import { CheckDate, StatusBadge } from "../check-details";

const verdictStyles = {
  verified: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  partial: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  unverified: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  contradicted: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export default function CheckPage({ params }: PageProps<"/checks/[id]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <Link className="adc-link text-sm" href="/checks">All checks</Link>
      <Suspense fallback={<p className="mt-6" role="status">Loading report…</p>}>
        <Report params={params} />
      </Suspense>
    </main>
  );
}

async function Report({ params }: Pick<PageProps<"/checks/[id]">, "params">) {
  const { id } = await params;
  await io();
  const check = await getCheckReport(id);
  if (!check) notFound();

  const counts = { verified: 0, partial: 0, unverified: 0, contradicted: 0 };
  for (const claim of check.claims) counts[claim.verdict]++;
  const processing = check.status !== "done" && check.status !== "failed";
  const testRun = check.testRun;

  return (
    <>
      <header className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight wrap-anywhere">{check.repo}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm wrap-anywhere sm:grid-cols-4 [&_dt]:text-zinc-600 dark:[&_dt]:text-zinc-400 [&_dd]:mt-1">
          <div><dt>Branch</dt><dd>{check.branch}</dd></div>
          <div><dt>Base</dt><dd>{check.base}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge status={check.status} /></dd></div>
          <div><dt>Created</dt><dd><CheckDate date={check.createdAt} /></dd></div>
          <div className="col-span-full"><dt>Test command</dt><dd><code>{check.testCommand}</code></dd></div>
        </dl>
      </header>

      {processing && <p role="status" className="mt-6 text-sm">Check still processing — refresh to update</p>}
      {check.status === "failed" && (
        <p className="mt-6 text-sm wrap-anywhere">
          This check failed during processing{check.error && `: ${check.error}`}
        </p>
      )}
      {check.verdictDiffTruncated && (
        <p className="mt-6 text-sm">Verdict based on the first 30,000 characters of the diff — the full diff was longer.</p>
      )}

      <section aria-label="Verification score" className="mt-8 border-y border-zinc-200 py-6 dark:border-zinc-800">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">{counts.verified} / {check.claims.length}</span>
          <span className="text-lg">verified{check.score !== null && ` (${Math.round(check.score * 100)}%)`}</span>
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
          <li>{counts.verified} verified</li>
          <li>{counts.partial} partial</li>
          <li>{counts.unverified} unverified</li>
          <li>{counts.contradicted} contradicted</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Test run</h2>
        {testRun ? (
          <>
            <p className="mt-2 text-sm wrap-anywhere"><code>{testRun.command}</code></p>
            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm tabular-nums [&_dt]:text-zinc-600 dark:[&_dt]:text-zinc-400">
              <div><dt>Passed</dt><dd>{testRun.passed}</dd></div>
              <div><dt>Failed</dt><dd>{testRun.failed}</dd></div>
              <div><dt>Skipped</dt><dd>{testRun.skipped}</dd></div>
              <div><dt>Duration</dt><dd>{testRun.durationMs.toLocaleString("en")} ms</dd></div>
            </dl>
          </>
        ) : <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No test run recorded.</p>}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Claims</h2>
        {check.claims.length ? (
          <ul className="mt-3 space-y-3">
            {check.claims.map(({ id, verdict, text, evidence }) => {
              const hunks = evidence.diff_hunks.filter((hunk): hunk is string => typeof hunk === "string");
              const tests = evidence.tests.filter((test): test is string => typeof test === "string");
              return (
                <li key={id} className="rounded-xl border border-zinc-200 p-4 wrap-anywhere sm:p-5 dark:border-zinc-800">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${verdictStyles[verdict]}`}>
                    {verdict}
                  </span>
                  <h3 className="mt-2 max-w-prose whitespace-pre-wrap font-medium">{text}</h3>
                  {evidence.absence === true && (
                    <p className="mt-2 text-sm">Claimed change is absent from the diff.</p>
                  )}
                  {hunks.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium">Cited diff hunks</h4>
                      <pre tabIndex={0} aria-label="Cited diff hunks" className="mt-2 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900"><code>{hunks.join("\n")}</code></pre>
                    </div>
                  )}
                  {tests.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium">Cited tests</h4>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                        {tests.map((test, index) => <li key={index}><code>{test}</code></li>)}
                      </ul>
                    </div>
                  )}
                  {!hunks.length && !tests.length && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No cited evidence.</p>}
                  {evidence.reason?.trim() && (
                    <p className="mt-3 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium">Reason</span> · {evidence.reason}
                    </p>
                  )}
                  {evidence.downgrade?.trim() && (
                    <p className="mt-3 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium">Downgrade</span> · {evidence.downgrade}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No claims recorded.</p>}
      </section>
    </>
  );
}
