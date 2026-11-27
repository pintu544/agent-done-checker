# Agent Done Checker CLI

Install the root dependencies with `npm install`. Run `npm run adc -- check --plan plan.md --repo /path/to/repo` from the project root, or use the `adc` binary after linking the CLI package from this checkout.

- `--plan <file>` reads a plan or transcript relative to your current directory. Use `--plan-text '<text>'` for inline evidence.
- `--repo <path>` points to the Git working tree where the diff and tests run.
- `--base <ref>` defaults to `main`.
- `--test-command '<command>'` defaults to `npm test` and runs in a POSIX shell with a 10-minute timeout.
- `--api <url>` overrides `ADC_API_URL`, which defaults to `https://agent-done-checker.vercel.app`.

The CLI uploads the plan, Git diff, and fresh test output. A completed test command that exits nonzero is recorded as evidence. The CLI prints the report URL once the upload succeeds.

## Codex session logs

Use `--codex-log <file>` as the claim source for a check.

```sh
adc check --codex-log ~/.codex/sessions/2026/11/27/rollout-....jsonl --repo .
```

The parser reads user prompts, agent replies, tool calls, and short tool output excerpts. It skips reasoning and encrypted content, environment context, and injected instructions.
