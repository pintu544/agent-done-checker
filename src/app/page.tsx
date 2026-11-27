import Link from "next/link";
import { Suspense } from "react";
import { AuthControls } from "./auth-controls";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
      <h1 className="text-4xl font-semibold tracking-tight">Agent Done Checker</h1>
      <p className="mt-4 max-w-prose text-lg text-zinc-600 dark:text-zinc-400">
        Prove the agent actually did it — verify what a coding agent actually did: plan vs git diff vs test runs.
      </p>
      <Link className="adc-link mt-6 inline-block font-medium" href="/checks">View checks</Link>
      <div className="mt-4">
        <Suspense fallback={null}>
          <AuthControls />
        </Suspense>
      </div>
      <section className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-xl font-semibold">How it works</h2>
        <p className="mt-2 max-w-prose text-zinc-600 dark:text-zinc-400">
          Run the CLI from your repository to collect the git diff and run the tests.
          Open the report URL it prints to see which plan claims the evidence supports.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-900"><code>adc check --plan plan.md --repo .</code></pre>
      </section>
    </main>
  );
}
