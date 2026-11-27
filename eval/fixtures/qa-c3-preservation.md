# C3 preservation-claim plan

The division test is skipped with test.skip in the base commit (b5e411e);
the agent deliberately left it that way. A preservation claim must never
come back Contradicted. Fixture repo ~/workspace/adc-eval-tiny, base b5e411e, vitest.

1. Kept the division test skipped.
2. Added a comment documenting the division case in arithmetic.test.mjs.
