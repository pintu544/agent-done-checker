import Link from "next/link";
import { Suspense } from "react";
import { AuthControls } from "../../auth-controls";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <Link className="adc-link text-sm" href="/checks">All checks</Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">404</h1>
      <div className="mt-4">
        <Suspense fallback={null}>
          <AuthControls />
        </Suspense>
      </div>
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">This page could not be found.</p>
    </main>
  );
}
