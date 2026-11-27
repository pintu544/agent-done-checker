#!/usr/bin/env tsx
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs, stripVTControlCharacters } from "node:util";
import { DIFF_LIMIT, TEST_OUTPUT_LIMIT } from "../../src/lib/evidence-limits";
import { parseTestCounts } from "./test-counts";

const DEFAULT_API = "https://agent-done-checker.vercel.app";
const MARKER = Buffer.from("[truncated]");
const TEST_TIMEOUT = 10 * 60 * 1000;
const USAGE = "Usage: adc check (--plan <file> | --plan-text <text>) --repo <path> " +
  "[--base <ref>] [--test-command <command>] [--api <url>]";

type CaptureOptions = {
  limit: number;
  timeout?: number;
  keepTail?: boolean;
};

function capture(file: string, args: string[], cwd: string, options: CaptureOptions) {
  return new Promise<{ output: string; truncated: boolean; exitCode: number | null }>((done, reject) => {
    const useProcessGroup = options.timeout !== undefined && process.platform !== "win32";
    const child = spawn(file, args, {
      cwd,
      detached: useProcessGroup,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const buffer = Buffer.alloc(options.limit);
    let length = 0;
    let truncated = false;
    let timedOut = false;

    child.stdout.on("data", (chunk: Buffer) => {
      truncated ||= length + chunk.length > buffer.length;
      if (options.keepTail && chunk.length >= buffer.length) {
        chunk.copy(buffer, 0, chunk.length - buffer.length);
        length = buffer.length;
        return;
      }
      if (options.keepTail && length + chunk.length > buffer.length) {
        const drop = length + chunk.length - buffer.length;
        buffer.copyWithin(0, drop, length);
        length -= drop;
      }
      length += chunk.copy(buffer, length);
    });

    const timer = options.timeout === undefined ? undefined : setTimeout(() => {
      timedOut = true;
      if (useProcessGroup && child.pid !== undefined) {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ESRCH") reject(error);
        }
      } else {
        child.kill("SIGKILL");
      }
      child.stdout.destroy();
      reject(new Error("The test command exceeded the 10-minute timeout."));
    }, options.timeout);

    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (exitCode, signal) => {
      clearTimeout(timer);
      if (timedOut) return;
      if (signal) {
        reject(new Error(`${file} was terminated by ${signal}.`));
        return;
      }

      let output = buffer.toString("utf8", 0, length).replaceAll("\0", "\uFFFD");
      truncated ||= Buffer.byteLength(output) > options.limit;
      if (truncated) {
        const bytes = Buffer.from(output);
        const budget = options.limit - MARKER.length - 1;
        if (options.keepTail) {
          let start = Math.max(0, bytes.length - budget);
          while ((bytes[start] & 0xc0) === 0x80) start++;
          output = `${MARKER}\n${bytes.toString("utf8", start)}`;
        } else {
          let end = Math.min(bytes.length, budget);
          while ((bytes[end] & 0xc0) === 0x80) end--;
          output = `${bytes.toString("utf8", 0, end)}\n${MARKER}`;
        }
      }
      done({ output, truncated, exitCode });
    });
  });
}

async function git(args: string[], repo: string, message: string) {
  const result = await capture("git", args, repo, { limit: DIFF_LIMIT }).catch(() => {
    throw new Error(message);
  });
  if (result.exitCode !== 0) throw new Error(message);
  return result;
}

async function main() {
  const [action, ...args] = process.argv.slice(2);
  if (action === "--help" || action === "-h") {
    console.log(USAGE);
    return;
  }
  if (action !== "check") throw new Error(USAGE);

  const { values } = parseArgs({
    args,
    options: {
      plan: { type: "string" },
      "plan-text": { type: "string" },
      repo: { type: "string" },
      base: { type: "string", default: "main" },
      "test-command": { type: "string", default: "npm test" },
      api: { type: "string", default: process.env.ADC_API_URL ?? DEFAULT_API },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(USAGE);
    return;
  }

  const { plan, "plan-text": inline, base, "test-command": testCommand } = values;
  if ((plan === undefined) === (inline === undefined) || !values.repo?.trim() ||
      !base.trim() || !testCommand.trim()) {
    throw new Error(USAGE);
  }

  const repo = resolve(values.repo);
  const planText = plan === undefined ? inline! : await readFile(resolve(plan), "utf8").catch(() => {
    throw new Error(`Could not read the plan file "${plan}".`);
  });
  if (!planText.trim() || planText.includes("\0")) {
    throw new Error("Provide a non-empty plan or transcript as plain text.");
  }

  let endpoint: URL;
  try {
    endpoint = new URL(`${values.api.replace(/\/+$/, "")}/api/checks`);
    if (!["http:", "https:"].includes(endpoint.protocol) ||
        endpoint.search || endpoint.hash || endpoint.username || endpoint.password) {
      throw new Error();
    }
  } catch {
    throw new Error("Provide an HTTP or HTTPS API base URL.");
  }

  const worktree = await git(["rev-parse", "--is-inside-work-tree"], repo,
    `"${repo}" is not a Git working tree.`);
  if (worktree.output.trim() !== "true") throw new Error(`"${repo}" is not a Git working tree.`);
  const revision = await git(["rev-parse", "--verify", "--end-of-options", `${base}^{commit}`], repo,
    `Base ref "${base}" does not resolve to a commit in "${repo}".`);
  const branch = await git(["rev-parse", "--abbrev-ref", "HEAD"], repo, "Could not determine the current Git branch.");
  const diff = await git(["diff", "--no-ext-diff", "--no-textconv", revision.output.trim(), "--"], repo,
    "Could not collect the Git diff.");

  const started = performance.now();
  const run = await capture("/bin/sh", ["-c", `exec 2>&1\n${testCommand}`], repo, {
    limit: TEST_OUTPUT_LIMIT,
    timeout: TEST_TIMEOUT,
    keepTail: true,
  });
  const durationMs = Math.round(performance.now() - started);
  const counts = parseTestCounts(stripVTControlCharacters(run.output));
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planText,
      repo,
      branch: branch.output.trim(),
      base,
      testCommand,
      diff: diff.output,
      ...(diff.truncated ? { truncated: true } : {}),
      testRun: { command: testCommand, ...counts, durationMs, output: run.output, exitCode: run.exitCode },
    }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => {
    throw new Error(`Could not reach the check API at ${endpoint.origin}.`);
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(typeof result?.error === "string" ? result.error : `Upload failed (HTTP ${response.status}).`);
  }
  if (typeof result?.reportUrl !== "string" || !result.reportUrl.trim()) {
    throw new Error("The check API did not return a report URL.");
  }
  console.log(result.reportUrl);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "The check could not be submitted.");
  process.exitCode = 1;
});
