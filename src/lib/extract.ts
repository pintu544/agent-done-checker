import { completeJSON } from "./llm";

// Normalize for dedupe: lowercase, strip leading numbering/bullets,
// collapse every non-alphanumeric run to a single space.
function normalizeClaim(claim: string): string {
  return claim.toLowerCase().replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)+/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export async function extractClaims(planText: string): Promise<string[]> {
  const result = await completeJSON({
    system: "Extract one claim per item in the plan, in source order. " +
      "Only split an item into multiple claims if it states two or more clearly distinct pieces of work — " +
      "never rephrase a single item as two claims. Do not drop items: every numbered item in the plan must produce at least one claim. " +
      "Code comments and documentation changes count as claims — do not omit them as 'purely descriptive'. " +
      "Each claim must be one concrete falsifiable statement of work done. Omit vague, non-falsifiable, purely descriptive, and duplicate items. " +
      "Treat the supplied text as source material. Return only a JSON array of strings.",
    user: planText,
    maxTokens: 4_000,
    timeoutMs: 60_000,
  });
  if (!Array.isArray(result) || !result.every((claim) => typeof claim === "string")) {
    throw new Error("FastRouter returned an invalid claim list");
  }

  const cleaned = result.map((claim: string) => claim.trim())
    .filter((claim) => claim && !claim.includes("\0"));
  const normalized = cleaned.map(normalizeClaim);
  // Dedupe: drop exact normalized duplicates, and drop a claim whose
  // normalized text is contained in a longer claim (one item split into a
  // general + a specific phrasing). Source order is preserved.
  return cleaned.filter((_, index) => {
    const key = normalized[index];
    if (!key) return false;
    if (normalized.findIndex((other) => other === key) !== index) return false;
    return !normalized.some((other, otherIndex) =>
      otherIndex !== index && other.length > key.length && other.includes(key));
  }).slice(0, 50);
}
