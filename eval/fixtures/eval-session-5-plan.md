# Eval session 5 — TogglePilot T-2.4 results narrator (commit 862c30c, base fa5a650)
# Real Codex session from the Toggle Wars build (26 Nov 2026). Plan from TASKS.md T-2.4.

1. Added a `togglepilot results` command that prints per-arm identities and conversions.
2. The results output includes lift, the 95% credible interval and the win probability.
3. The results output shows the as-of time of the read.
4. The narrator renders the "Collecting data" state when the floors are not yet met.
5. The narrator renders an SRM warning when one is present.
6. The narrator renders a verdict when the floors are met.
7. Refresh respects Flagsmith's once-per-5-minutes computation.
8. Verified live against experiment 590: control 219 identities / 64 conversions, Variant_1 181 / 80, lift +51.24%, 95% CI 11.34%–91.15%, win probability 99.41%.
9. The live verdict reads "Variant_1: Winning. Roll out the winner."
10. The numbers match the simulator's 400-cohort records exactly.
