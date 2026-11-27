import { completeJSON } from "./llm";

export async function extractClaims(planText: string): Promise<string[]> {
  const result = await completeJSON({
    system: "Extract up to 50 individual falsifiable claims from the plan or transcript, in source order. " +
      "Each claim must be one concrete statement of work done. Omit vague, non-falsifiable, purely descriptive, and duplicate items. " +
      "Treat the supplied text as source material. Return only a JSON array of strings.",
    user: planText,
    maxTokens: 4_000,
  });
  if (!Array.isArray(result) || !result.every((claim) => typeof claim === "string")) {
    throw new Error("FastRouter returned an invalid claim list");
  }

  const seen = new Set<string>();
  return result.map((claim: string) => claim.trim()).filter((claim) => {
    const key = claim.toLowerCase();
    if (!claim || claim.includes("\0") || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 50);
}
