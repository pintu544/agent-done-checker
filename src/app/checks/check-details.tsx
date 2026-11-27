const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function CheckDate({ date }: { date: Date }) {
  return <time dateTime={date.toISOString()}>{dateFormat.format(date)} UTC</time>;
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize dark:bg-zinc-800">
      {status}
    </span>
  );
}
