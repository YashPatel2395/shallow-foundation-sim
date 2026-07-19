# Handoff — Research Evaluation Reproduction

## What this is

A functional evaluation of the Foundation Construction Simulation combining source-code
inspection with genuine, executed live-browser testing across all three Playwright-managed
engines (Chromium, Firefox, Playwright WebKit). See `functional_evaluation_report.md` for
the full final writeup and `TEST_HARNESS_CHANGELOG.md` for every correction made to the
test driver before the harness was frozen and this final dataset produced.

**Headline result, all three engines, 369 planned stage-level executions (123 × 3):** 344
PASS, 2 FAIL (both `AUTOMATION_DRIVER` origin — zero `APPLICATION`-origin failures anywhere
in the dataset), 23 NOT REACHED, 0 NOT TESTABLE, 0 ENVIRONMENT FAILURE. 25 of 27 full
continuous-module runs (92.6%) reached genuine completion: Firefox 9/9, WebKit 9/9,
Chromium 7/9 (both Chromium failures were early-stage driver-attributable flakiness, not
resource-related — see the report, Section 5.2). A real, cross-engine-consistent
resource-retention finding (zero `.dispose()` calls in all three simulation files, verified
via Three.js's own `renderer.info` counters growing 6-32× over a session) is documented
with carefully hedged language in Section 6 of the report — not claimed as a conclusively
proven leak, since no direct GPU memory measurement was taken.

## Repository / branch / commit

- Repository: `https://github.com/YashPatel2395/shallow-foundation-sim.git`
- Branch: `research-evaluation`
- Branch point (production commit under evaluation): `a2197eaee88f2debdff45799ffd0066cc32ec3a0`
- Final commit hash: see the bottom of this file — filled in after the finalization commit,
  since a commit cannot self-reference its own hash.

## Reproducing the static-inspection deliverables (no browser required)

```bash
git clone https://github.com/YashPatel2395/shallow-foundation-sim.git
cd shallow-foundation-sim && git checkout research-evaluation && cd research_evaluation
python3 scripts/build_stage_inventory.py       # regenerates stage_inventory.csv / system_inventory.md
python3 scripts/generate_result_matrices.py    # regenerates the placeholder NOT TESTABLE/NOT TESTED CSVs
python3 scripts/generate_results_summary.py    # regenerates results_summary.json
```

Verify no production file was altered by this evaluation:

```bash
git diff origin/master -- script.js driven-pile.js drilled-shaft.js style.css \
  index.html driven-pile.html drilled-shaft.html three.min.js
# expected output: nothing (empty diff)
```

## Reproducing the final live-browser evaluation (all three engines)

```bash
cd research_evaluation/playwright-suite
npm install
npx playwright install chromium firefox webkit

# Run one engine at a time (workers: 1 is required — see TEST_HARNESS_CHANGELOG.md Section 5).
# Delete the top-level *.executed.csv files between engines for a clean per-engine dataset,
# then snapshot into the versioned evidence/ directory:
rm -f ../functional_test_results.executed.csv ../module_run_results.executed.csv \
      ../performance_results.executed.csv ../functional_test_results.raw.json
rm -rf ../logs/playwright-artifacts ../logs/cpu-samples
npx playwright test --project=chromium         # ~25 min
cd .. && python3 scripts/generate_results_summary.py
python3 scripts/assemble_evidence.py chromium <run-start-iso> <run-end-iso>
cd playwright-suite

# repeat the same 5 steps for --project=firefox (~20 min) and --project=webkit (~20 min)
```

After all three engines: `python3 scripts/compute_grand_total.py` from `research_evaluation/`
reproduces the report's grand-total reconciliation table and metrics directly from
`evidence/<engine>/final/*.executed.csv` — every number in the report is traceable this way.

## Known blockers / findings encountered while producing this package

1. **(Historical, resolved)** The environment this package was originally authored in denied
   OS-level socket/process primitives any browser needs to start. Evidence:
   `logs/environment_blocker_evidence.log`, `logs/chromium_launch_attempt.log`. The
   restriction was later lifted in the same environment; all three engines subsequently
   launched and ran successfully.
2. **Nine test-driver bugs/limitations were found and corrected** during the exploratory
   phase before this final dataset was produced — full list with evidence in
   `TEST_HARNESS_CHANGELOG.md`. None involved modifying any production file.
3. **Exact CPU model string is unavailable** (`sysctl -n machdep.cpu.brand_string` denied by
   the sandbox); architecture and core count were obtained by an alternate command and are
   reported in `test_environment.md`.
4. **Chromium renders WebGL in software** in this specific environment (SwiftShader),
   causing 6-16× higher CPU utilization than Firefox/WebKit for identical work on the same
   machine. This is a rendering-backend property of this environment, not an application
   difference — see the report, Section 3 and Section 6, for the full analysis and why it
   was deliberately excluded from the pass/fail classification method.
5. **A source-verified, cross-engine-consistent resource-retention pattern**: zero
   `.dispose()` calls across `script.js`, `driven-pile.js`, `drilled-shaft.js`. Not fixed as
   part of this evaluation (would require modifying production code, which this evaluation
   never does). Reported with hedged, non-overclaiming language — see the report, Section 6.

## What to check on a normal machine to confirm reproducibility

- `stage_inventory.csv` should still have 41 rows after re-running
  `scripts/build_stage_inventory.py` against the same commit.
- All three engines should reach 100% conditional functional pass rate (Metric C in the
  report) — i.e. zero `FAIL — APPLICATION` rows — even if a small number of
  `AUTOMATION_DRIVER`-origin failures occur on a given run (expected, disclosed run-to-run
  variance, not a reproducibility failure of this package).
- Firefox and WebKit should reliably complete all 9 continuous-module runs; Chromium may
  occasionally show 1-2 early-stage driver failures per 9 runs in this specific
  software-WebGL environment.

## Final commit hash

_Filled in after the finalization commit that adds this evidence package — see the
assistant's final summary for this task for the exact hash, since this file cannot
self-reference the commit that includes it._
