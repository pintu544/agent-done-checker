import Link from "next/link";
import { Suspense } from "react";
import { AuthControls } from "./auth-controls";
import { UpgradeButton } from "./upgrade-button";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-zinc-200 py-5 dark:border-zinc-800">
        <span className="font-semibold">Agent Done Checker</span>
        <nav aria-label="Main" className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link className="adc-link" href="/checks">View checks</Link>
          <Suspense fallback={null}>
            <AuthControls />
          </Suspense>
        </nav>
      </header>

      <main>
        <section className="pt-16 pb-14 sm:pt-24 sm:pb-20">
          <h1 className="max-w-[17ch] text-5xl leading-none font-semibold tracking-[-0.02em] sm:text-7xl">
            Prove the agent actually did it
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Paste what your coding agent claims, point at the repo — the checker reads the git diff, re-runs the tests fresh, and verdicts every claim with the evidence cited.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a className="rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-emerald-800 dark:focus-visible:outline-emerald-300" href="#proof">
              See a real catch
            </a>
            <Link className="adc-link text-sm font-medium" href="/checks">View checks</Link>
          </div>
        </section>

        <section id="proof" className="scroll-mt-6 border-t border-zinc-200 pt-10 pb-12 sm:pt-14 dark:border-zinc-800">
          <h2 className="text-3xl font-semibold tracking-tight">It caught a real skip</h2>
          <p className="mt-3 max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
            The agent claimed its tests passed but had skipped one. The checker flagged the skip claim as Contradicted. The comment addition was the only Verified claim.
          </p>
          <a
            className="group mt-6 block rounded-lg border border-zinc-200 bg-zinc-50 hover:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-500"
            href="https://agent-done-checker.vercel.app/checks/6645fa27-b395-42f4-a84a-8aca76394835"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-zinc-200 px-4 py-3 text-sm sm:px-5 dark:border-zinc-800">
              <span className="adc-link font-medium group-hover:decoration-current">Open the live report</span>
              <span className="font-mono">Score 0.10</span>
            </div>
            <ul className="divide-y divide-zinc-200 px-4 text-sm sm:px-5 dark:divide-zinc-800">
              <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
                <span className="max-w-prose">Marked the division test as skipped with <code>test.skip</code>.</span>
                <span className="rounded bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100">Contradicted</span>
              </li>
              <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
                <span className="max-w-prose">Added a comment documenting the division case in <code className="wrap-anywhere">arithmetic.test.mjs</code>.</span>
                <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Verified</span>
              </li>
            </ul>
          </a>
        </section>

        <section className="border-t border-zinc-200 pt-10 pb-12 sm:pt-14 dark:border-zinc-800">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-5 list-decimal space-y-6 pl-6 marker:font-mono marker:text-zinc-600 dark:marker:text-zinc-400">
            <li className="pl-1">
              <h3 className="font-semibold">CLI collects the evidence</h3>
              <p className="mt-2 max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
                The CLI gathers the plan, the git diff, and a fresh test run. Use <code>--codex-log</code> for a Codex session log.
              </p>
              <pre className="mt-4 max-w-prose overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-900" tabIndex={0}><code>adc check --plan plan.md --repo .</code></pre>
            </li>
            <li className="pl-1">
              <h3 className="font-semibold">Every claim gets a verdict</h3>
              <p className="mt-2 max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
                Verified / Partial / Unverified / Contradicted, each citing the diff hunks and test lines behind it.
              </p>
            </li>
            <li className="pl-1">
              <h3 className="font-semibold">Open the report</h3>
              <p className="mt-2 max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">
                See the score and per-claim evidence at <code>/checks/[id]</code>.
              </p>
            </li>
          </ol>
        </section>

        <section className="border-t border-zinc-200 pt-10 pb-12 sm:pt-14 dark:border-zinc-800">
          <h2 className="text-3xl font-semibold tracking-tight">Pricing</h2>
          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
            <h3 className="font-semibold">Solo <span className="ml-1 font-normal">Free</span></h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">10 checks/month</p>
          </div>
          <div className="mt-3 rounded-lg border border-zinc-300 bg-zinc-50 p-4 sm:p-5 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-semibold">Team <span className="ml-1 font-normal">$20/month</span></h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Unlimited checks</p>
            </div>
            <div className="mt-5">
              <UpgradeButton />
              <p className="mt-3 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
                Team is billed monthly via Stripe Checkout.
              </p>
              <Suspense fallback={null}>
                <CheckoutNotice searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-3 border-t border-zinc-200 pt-6 pb-10 text-sm dark:border-zinc-800">
        <Link className="adc-link max-w-prose" href="/checks">
          Try it on your own repo — run the CLI, or browse recent checks
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <a className="adc-link" href="https://github.com/pintu544/agent-done-checker">GitHub repo</a>
          <span className="text-zinc-600 dark:text-zinc-400">Solo free · Team $20/mo</span>
        </div>
      </footer>
    </div>
  );
}

async function CheckoutNotice({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { checkout } = await searchParams;
  if (checkout !== "cancelled") return null;

  return (
    <p className="mt-3 max-w-prose text-sm text-zinc-600 dark:text-zinc-400">
      Checkout cancelled — you&apos;re still on the Solo plan.
    </p>
  );
}
