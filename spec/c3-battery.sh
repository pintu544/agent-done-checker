#!/bin/bash
# C3 verification battery — all runs against local dev server :3100
set -u
ADC="$HOME/workspace/agent-done-checker"
CLI="npx tsx $ADC/cli/src/index.ts check"
API="http://localhost:3100"
LOG="$HOME/workspace/agent-done-checker/spec/c3-battery.log"
: > "$LOG"

run() {
  local name="$1"; shift
  echo "=== $name ===" | tee -a "$LOG"
  (cd "$ADC" && timeout 420 $CLI "$@" --api "$API" 2>&1 | tee -a "$LOG")
  echo "" | tee -a "$LOG"
}

run "1 fixture vitest (plan-10-claims)" \
  --plan "$ADC/eval/fixtures/plan-10-claims.md" --repo "$HOME/workspace/adc-eval-tiny" \
  --base b5e411e --test-command "npx vitest run --maxWorkers=1"

run "2 fixture vitest (plan-10-claims)" \
  --plan "$ADC/eval/fixtures/plan-10-claims.md" --repo "$HOME/workspace/adc-eval-tiny" \
  --base b5e411e --test-command "npx vitest run --maxWorkers=1"

run "3 fixture vitest (plan-10-claims)" \
  --plan "$ADC/eval/fixtures/plan-10-claims.md" --repo "$HOME/workspace/adc-eval-tiny" \
  --base b5e411e --test-command "npx vitest run --maxWorkers=1"

run "4 file-add .txt + .md" \
  --plan "$ADC/eval/fixtures/qa-c3-fileadd.md" --repo "$HOME/workspace/adc-qa-c3" \
  --base HEAD --test-command "npx vitest run --maxWorkers=1"

run "5 adversarial traps" \
  --plan "$ADC/eval/fixtures/qa-c3-traps.md" --repo "$HOME/workspace/adc-eval-tiny" \
  --base b5e411e --test-command "npx vitest run --maxWorkers=1"

run "6 build-only node --check (M1 regression)" \
  --plan "$ADC/eval/fixtures/plan-10-claims.md" --repo "$HOME/workspace/adc-eval-tiny" \
  --base b5e411e --test-command "node --check arithmetic.test.mjs"

run "7 preservation claim" \
  --plan "$ADC/eval/fixtures/qa-c3-preservation.md" --repo "$HOME/workspace/adc-eval-tiny" \
  --base b5e411e --test-command "npx vitest run --maxWorkers=1"

echo "BATTERY DONE" | tee -a "$LOG"
