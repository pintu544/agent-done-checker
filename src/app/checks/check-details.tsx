"use client";

import { useSyncExternalStore } from "react";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

// Format after hydration so the displayed date uses the browser timezone.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function CheckDate({ date }: { date: Date }) {
  const isClient = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  return <time dateTime={date.toISOString()}>{isClient ? dateFormat.format(date) : null}</time>;
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize dark:bg-zinc-800">
      {status}
    </span>
  );
}
