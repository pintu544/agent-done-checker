export function parseTestCounts(output: string) {
  const counts = { passed: 0, failed: 0, skipped: 0 };
  const lines = output.split(/\r?\n/);

  // Vitest and Jest both report a Tests summary. Vitest also reports Test Files.
  const summary = lines.findLast((line) => /^\s*Tests(?:\s*:|\s+)/i.test(line) &&
    /\b\d+\s+(?:passed|failed|skipped|pending|todo)\b/i.test(line));
  const summaries = summary ? [summary] : lines.filter((line) =>
    /^\s*\d+\s+(?:passing|failing|pending)\b/i.test(line));
  for (const line of summaries) {
    for (const [, amount, label] of line.matchAll(/\b(\d+)\s+(passed|passing|failed|failing|skipped|pending|todo)\b/gi)) {
      switch (label.toLowerCase()) {
        case "passed":
        case "passing":
          counts.passed = Number(amount);
          break;
        case "failed":
        case "failing":
          counts.failed = Number(amount);
          break;
        default:
          counts.skipped += Number(amount);
      }
    }
  }
  return counts;
}
