export async function completeJSON({
  system,
  user,
  maxTokens,
  timeoutMs = 30_000,
}: {
  system: string;
  user: string;
  maxTokens: number;
  // fastrouter/auto routes to different models per call, so latency varies
  // a lot: a 30s cap timed out twice on a 19-claim verdict call whose
  // identical payload then completed in ~20s. Verdict calls (large diff +
  // many claims) get 120s, extraction 60s.
  timeoutMs?: number;
}): Promise<unknown> {
  const apiKey = process.env.FASTROUTER_API_KEY;
  if (!apiKey) throw new Error("FASTROUTER_API_KEY is not set");

  let failure = "FastRouter request failed";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      failure = "FastRouter request failed";
      const response = await fetch("https://api.fastrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.FASTROUTER_MODEL || "fastrouter/auto",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        failure = `FastRouter returned HTTP ${response.status}`;
        continue;
      }

      failure = "FastRouter returned invalid JSON";
      const result = await response.json();
      const content = result?.choices?.[0]?.message?.content;
      const json = typeof content === "string"
        ? content.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, "$1").trim()
        : "";
      if (!json) {
        failure = "FastRouter returned empty content";
        continue;
      }
      return JSON.parse(json);
    } catch (error) {
      // Keep the underlying cause (timeout vs network) in the message;
      // loggable errors omit provider response bodies and request headers.
      failure = `FastRouter request failed: ${error instanceof Error ? error.name : "unknown error"}`;
    }
  }
  throw new Error(failure);
}
