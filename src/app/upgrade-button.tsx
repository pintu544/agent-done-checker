"use client";

import { useState } from "react";

export function UpgradeButton() {
  const [pending, setPending] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST" });
      if (response.status === 401) {
        setNeedsSignIn(true);
      } else if (response.ok) {
        const data = await response.json();
        if (data?.alreadyTeam === true) {
          window.location.href = "/checks";
          return;
        }
        if (typeof data?.url === "string" && data.url) {
          window.location.href = data.url;
          return;
        }
        setError("Could not start checkout. Please try again.");
      } else if (response.status === 503) {
        setError("Billing is temporarily unavailable. Please try again later.");
      } else {
        setError("Could not start checkout. Please try again.");
      }
    } catch {
      setError("Could not start checkout. Please try again.");
    }

    setPending(false);
  }

  return (
    <>
      {!needsSignIn && (
        <button
          className="cursor-pointer rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white enabled:hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-emerald-800 disabled:cursor-wait dark:focus-visible:outline-emerald-300"
          type="button"
          onClick={startCheckout}
          disabled={pending}
        >
          {pending ? "Starting checkout…" : "Upgrade to Team"}
        </button>
      )}
      <div role="status" className="max-w-prose text-sm text-zinc-700 dark:text-zinc-300">
        {needsSignIn && (
          <p>
            Sign in with GitHub to upgrade to Team.{" "}
            <a className="adc-link font-medium" href="/checks">Go to sign in</a>
          </p>
        )}
        {error && <p className="mt-2">{error}</p>}
      </div>
    </>
  );
}
