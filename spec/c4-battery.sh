#!/bin/bash
cd ~/workspace/agent-done-checker
run() {
  local name="$1"; shift
  echo "=== $name ==="
  npx tsx cli/src/index.ts check "$@" --api http://localhost:3100
  echo ""
}
run r1-fixture --plan eval/fixtures/plan-10-claims.md --repo ~/workspace/adc-eval-tiny --base b5e411e --test-command "npx vitest run --maxWorkers=1"
run r2-fixture --plan eval/fixtures/plan-10-claims.md --repo ~/workspace/adc-eval-tiny --base b5e411e --test-command "npx vitest run --maxWorkers=1"
run r3-fixture --plan eval/fixtures/plan-10-claims.md --repo ~/workspace/adc-eval-tiny --base b5e411e --test-command "npx vitest run --maxWorkers=1"
run r4-c4probe --plan /tmp/adc-qa3-c4/plan.md --repo /tmp/adc-qa3-c4 --base 75c993669c72403011560cd74b975944bbd71c40 --test-command "node --check arithmetic.test.mjs"
run r5-exts --plan /tmp/adc-qa3-exts/plan.md --repo /tmp/adc-qa3-exts --base 9b512800fcee6d3bf7f819cda52f90c9663c9453 --test-command "node --check index.js"
run r6-traps --plan eval/fixtures/qa-c3-traps.md --repo ~/workspace/adc-eval-tiny --base b5e411e --test-command "npx vitest run --maxWorkers=1"
run r7-preservation --plan eval/fixtures/qa-c3-preservation.md --repo ~/workspace/adc-eval-tiny --base b5e411e --test-command "npx vitest run --maxWorkers=1"
run r8-buildonly --plan eval/fixtures/plan-10-claims.md --repo ~/workspace/adc-eval-tiny --base b5e411e --test-command "node --check arithmetic.test.mjs"
echo "BATTERY DONE"
