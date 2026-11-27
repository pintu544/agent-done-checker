# 10-claim plan — T-1.3 extraction check (eval fixture)

Used to verify claim extraction: a 10-claim plan must yield >= 8 stored claims,
each one falsifiable statement. Claims refer to the tiny-vitest fixture repo.

1. Added an addition test asserting that 2 + 3 equals 5.
2. Added a multiplication test asserting that 2 * 3 equals 6.
3. Added a division test asserting that 6 / 3 equals 2.
4. Marked the division test as skipped with test.skip.
5. Configured the test script as `vitest run --maxWorkers=1` in package.json.
6. Ran the full test suite and all non-skipped tests passed.
7. Added a comment documenting the division case in arithmetic.test.mjs.
8. Set the package type to module in package.json.
9. Pinned vitest to version 3.2.4 as a devDependency.
10. Verified the suite runs with no failing tests.
