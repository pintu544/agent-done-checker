import { readFile } from "node:fs/promises";

const LOG_LIMIT = 30_000;
const TRUNCATION_MARKER = "\n[Codex log truncated to 30,000 characters]";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
}

function textParts(value: unknown): string {
  if (!Array.isArray(value)) return "";

  const parts: string[] = [];
  for (const valuePart of value) {
    const part = asRecord(valuePart);
    if ((part?.type === "input_text" || part?.type === "output_text") &&
        typeof part.text === "string") {
      parts.push(part.text);
    }
  }
  return parts.join("\n");
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function formatItem(item: Record<string, unknown>): string {
  switch (item.type) {
    case "message": {
      if (item.role === "user") {
        const prompt = textParts(item.content)
          .replace(/<environment_context>[\s\S]*?<\/environment_context>/g, "")
          .trim();
        return prompt && !prompt.startsWith("# AGENTS.md instructions for")
          ? "Task: " + prompt
          : "";
      }
      if (item.role === "assistant") {
        const reply = textParts(item.content).trim();
        return reply ? "Agent: " + reply : "";
      }
      return "";
    }
    case "custom_tool_call":
      if (typeof item.name !== "string" || typeof item.input !== "string") return "";
      return "Ran " + oneLine(item.name) + ": " + oneLine(item.input).slice(0, 200);
    case "custom_tool_call_output": {
      const output = oneLine(textParts(item.output)).slice(0, 500);
      return output ? "Output: " + output : "";
    }
    default:
      return "";
  }
}

export function parseCodexLogText(text: string): string {
  const seen = new Set<string>();
  const entries: string[] = [];
  let sessionId = "";
  let cwd = "";

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;

    let record: Record<string, unknown> | undefined;
    try {
      record = asRecord(JSON.parse(line));
    } catch {
      continue;
    }
    const payload = asRecord(record?.payload);
    if (!payload) continue;

    if (record?.type === "session_meta") {
      if (!sessionId && typeof payload.session_id === "string") sessionId = oneLine(payload.session_id);
      if (!cwd && typeof payload.cwd === "string") cwd = oneLine(payload.cwd);
      continue;
    }

    const item = record?.type === "response_item" ? payload
      : record?.type === "event_msg" && payload.type === "item_completed" ? asRecord(payload.item)
      : undefined;
    if (!item) continue;

    const id = typeof item.id === "string" && item.id ? item.id : undefined;
    if (id !== undefined && seen.has(id)) continue;

    const entry = formatItem(item);
    if (!entry) continue;
    entries.push(entry);
    if (id !== undefined) seen.add(id);
  }

  if (!entries.length) return "";
  const header = "Codex session" + (sessionId ? " " + sessionId : "") + (cwd ? " in " + cwd : "");
  const result = [header, ...entries].join("\n");
  if (result.length <= LOG_LIMIT) return result;

  const boundary = result.lastIndexOf("\n", LOG_LIMIT - TRUNCATION_MARKER.length);
  return result.slice(0, Math.max(0, boundary)) + TRUNCATION_MARKER;
}

export async function readCodexLog(path: string): Promise<string> {
  const text = await readFile(path, "utf8").catch(() => {
    throw new Error('Could not read the Codex log file "' + path + '".');
  });
  return parseCodexLogText(text);
}
