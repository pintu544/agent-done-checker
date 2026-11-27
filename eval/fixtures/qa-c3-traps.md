# C3 adversarial traps — same traps as the T-1.7 QA re-run

Fixture repo ~/workspace/adc-eval-tiny, base b5e411e, vitest.

1. Added a test for the login flow.
2. Fixed the addition test so it now passes.
3. Marked the division test as skipped with test.skip.
4. Reduced runtime 47%, 12s to 6.4s.
5. Added a comment documenting the division case in arithmetic.test.mjs.
