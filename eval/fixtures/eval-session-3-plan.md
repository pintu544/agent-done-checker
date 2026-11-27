# Eval session 3 — Agent Done Checker T-1.3 + T-1.4 (commit 8913133, base a0517c0)
# Real Codex session: FastRouter claim extraction + verdict engine.

1. Added a FastRouter client that calls the chat completions endpoint with the fastrouter/auto model.
2. Claim extraction splits a plan/transcript into individual falsifiable claims, capped at 50.
3. The verdict engine judges each claim in a single LLM call against the diff and test output.
4. Every verdict cites evidence: diff hunks copied verbatim from the diff and/or test names from the test output.
5. A Verified verdict is impossible without a cited hunk or a passing test — enforced in code, not by the LLM alone.
6. A Contradicted verdict requires a cited failing/skipped test or an explicit absence citation.
7. The pipeline stores each extracted claim, then updates it with its verdict and evidence.
8. The check score is verified divided by total claims.
9. Any failure in the pipeline sets the check status to failed.
10. The FastRouter client retries once on empty content and throws after the retry.
