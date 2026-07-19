# Handoff — Research Evaluation Reproduction

## What this is

An isolated, source-inspection-based functional evaluation of the Foundation Construction
Simulation, plus a real (author-tested-for-syntax-only, not executed) Playwright suite
that a researcher with an unrestricted environment can run to obtain genuine live-browser
results. See `functional_evaluation_report.md` for the full report and
`test_environment.md` for exactly why live browser execution could not be performed in the
environment this package was produced in.

## Repository / branch / commit

- Repository: `https://github.com/YashPatel2395/shallow-foundation-sim.git`
- Branch: `research-evaluation`
- Branch point (production commit under evaluation): `a2197eaee88f2debdff45799ffd0066cc32ec3a0`
- Final substantive commit of this evaluation package on `research-evaluation`:
  `ede8c0fb8bf22cbdf076d714a4f0826bcb644b85` ("research: add reproducibility report and
  handoff") — this commit contains the complete evaluation package (stage inventory,
  environment record, Playwright suite, all result matrices, the report, and this file).
  One additional housekeeping commit follows immediately after, whose only change is
  recording this hash in the two lines above; its own hash is reported in the assistant's
  final summary for this task rather than self-referenced here, since a commit cannot
  contain its own hash.

## Reproducing the static-inspection deliverables (no browser required)

These require only Python 3 and the repository checkout:

```bash
git clone https://github.com/YashPatel2395/shallow-foundation-sim.git
cd shallow-foundation-sim
git checkout research-evaluation
cd research_evaluation

# Regenerate stage_inventory.csv / system_inventory.md from source, if desired:
python3 scripts/build_stage_inventory.py   # written by the original inspection pass

# Regenerate the placeholder NOT TESTABLE / NOT TESTED result matrices from stage_inventory.csv:
python3 scripts/generate_result_matrices.py

# Regenerate results_summary.json from the CSVs (must be run after the above):
python3 scripts/generate_results_summary.py
```

Verify no production file was altered by this evaluation:

```bash
git diff origin/master -- script.js driven-pile.js drilled-shaft.js style.css \
  index.html driven-pile.html drilled-shaft.html three.min.js
# expected output: nothing (empty diff)
```

## Reproducing the live-browser evaluation (requires an unrestricted environment)

The environment this package was authored in denies the OS-level socket/IPC primitives
any browser needs to start (full evidence in `test_environment.md` and `logs/`). To get
genuine PASS/FAIL results in place of the `NOT TESTABLE`/`NOT TESTED` placeholders:

```bash
cd research_evaluation/playwright-suite
npm install
npx playwright install chromium firefox webkit
npm test
```

This produces `functional_test_results.executed.csv`, `module_run_results.executed.csv`,
and `performance_results.executed.csv` in `research_evaluation/`, plus screenshots under
`research_evaluation/screenshots/<engine>/` and Playwright's own trace/report artifacts
under `research_evaluation/logs/playwright-artifacts/`. These are named separately from the
placeholder CSVs by design (see `playwright-suite/README.md`) so genuine evidence is never
merged with, or mistaken for, the placeholder rows generated without execution.

After a real run, re-generate `results_summary.json` (it will automatically pick up the
`*.executed.csv` files if present):

```bash
cd research_evaluation/scripts
python3 generate_results_summary.py
```

## Known blockers encountered while producing this package

1. **Local socket binding (TCP and Unix-domain) is denied by the execution sandbox this
   package was authored in**, which prevents both hosting the application via a local HTTP
   server and Chromium's own internal process-singleton IPC. Evidence:
   `logs/environment_blocker_evidence.log`.
2. **A direct Playwright Chromium launch attempt failed** for the same underlying reason
   (Mach port bootstrap check-in denied). Evidence: `logs/chromium_launch_attempt.log`.
3. **Firefox and WebKit browser binaries were not present** and were not installed, since
   installing them would not have changed the outcome in (1)/(2) — the restriction is
   engine-independent (OS-level process/IPC denial, not a missing-binary problem).
4. **Exact CPU model string is unavailable** (`sysctl -n machdep.cpu.brand_string` denied
   by the same sandbox); architecture and core count were obtained by an alternate command
   and are reported in `test_environment.md`.

None of these blockers are properties of the application under evaluation — they are
properties of the specific execution environment this package was produced in, and are
expected to not apply on a typical development machine or CI runner.

## What to check on a normal machine to confirm reproducibility

- `stage_inventory.csv` should still have 41 rows after re-running
  `scripts/build_stage_inventory.py` against the same commit — if the source changes,
  re-running this script is how the inventory should be kept current, not hand-editing.
- The Playwright suite should be able to load `index.html`, `driven-pile.html`, and
  `drilled-shaft.html` via `file://` (no dev server needed — the application makes no
  `fetch()` calls).

## Final commit hash

Final substantive commit on `research-evaluation` containing the complete evaluation
package: `ede8c0fb8bf22cbdf076d714a4f0826bcb644b85`. See the note under "Repository /
branch / commit" above for why this is the commit cited here rather than the housekeeping
commit that records it.
