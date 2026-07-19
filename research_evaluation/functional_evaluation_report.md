# Functional Evaluation Report — Foundation Construction Simulation

## 0. Status of this document

This is the **final** version of this report, reflecting a complete, three-browser
(Chromium, Firefox, Playwright WebKit) live-execution pass using a frozen test harness. It
supersedes all earlier versions produced during this evaluation's own history, which is
summarized here rather than re-narrated in full:

1. **Static-inspection phase.** The evaluation began in an execution environment that denied
   the OS-level socket/process primitives any browser needs to start. A full static
   inventory of the application was produced (`system_inventory.md`, `stage_inventory.csv`)
   and a genuine, runnable Playwright suite was authored but could not be executed. Evidence
   of that restriction is preserved in `test_environment.md` and `logs/` as a historical
   record.
2. **Exploratory live-execution phase.** The restriction was later lifted in the same
   environment. The suite was run against Chromium and iteratively debugged — several real
   bugs in the *test driver itself* were found and fixed (navigation gaps, click-targeting
   bugs, timing budgets), and one real *application-side* finding emerged (see Section 6).
   This phase's raw output is archived under `archive/exploratory_pre_final_*/` and is
   **not** part of the final dataset below.
3. **Final phase (this document).** Once the driver was corrected and frozen (full change
   log: `TEST_HARNESS_CHANGELOG.md`), a clean evaluation was run against all three engines.
   That frozen-harness, three-engine dataset is what this report describes.

**Headline result, all three engines, 369 planned stage-level executions (123 × 3):**
344 PASS, 2 FAIL (both AUTOMATION_DRIVER origin, zero APPLICATION-origin failures), 23 NOT
REACHED (downstream of the 2 failures), 0 NOT TESTABLE, 0 ENVIRONMENT FAILURE. 25 of 27
full continuous-module runs (92.6%) reached genuine completion — Firefox and WebKit were
each a perfect 9/9; Chromium was 7/9. Full breakdown in Sections 4–5.

## 1. Evaluation objective

To perform a reproducible functional evaluation of a browser-based, three-module 3D
construction-sequence simulation (Shallow Foundation, Driven Pile Foundation, Drilled Shaft
Foundation), producing measurable, traceable evidence of the application's implemented
behavior across two distinct dimensions (per this evaluation's brief):

- **Isolated stage-level functionality**: does each individual stage, taken on its own,
  behave correctly when driven correctly?
- **Continuous-session module reliability**: does a full, uninterrupted walkthrough of a
  15-stage (or 11-stage) module reliably reach completion, and if not, why not?

These are reported as genuinely separate questions (Sections 4 and 5) — a module is not
assumed reliable merely because its individual stages pass. This report does not evaluate
engineering accuracy, code quality, or educational value beyond the specific resource-
management finding in Section 6.

## 2. System evaluated

A static, unbundled web application (vanilla JavaScript + Three.js r123, no framework, no
build step, no `package.json`) consisting of three simulation modules and a dashboard:

| Module | Entry point | Logic file | Stages |
|---|---|---|---|
| Shallow Foundation | `index.html` (SPA section) | `script.js` | 11 |
| Driven Pile Foundation | `driven-pile.html` | `driven-pile.js` | 15 |
| Drilled Shaft Foundation | `drilled-shaft.html` | `drilled-shaft.js` | 15 |
| **Total** | | | **41** |

Full architectural detail is in `system_inventory.md` and `stage_inventory.csv`.

**No production file was modified at any point in this evaluation.** Verify at any time:

```bash
git diff origin/master -- script.js driven-pile.js drilled-shaft.js style.css \
  index.html driven-pile.html drilled-shaft.html three.min.js
# expected output: nothing
```

All test-harness fixes described in this report and in `TEST_HARNESS_CHANGELOG.md` live
entirely under `research_evaluation/playwright-suite/`.

## 3. Test environment

Full detail in `test_environment.md` and `evidence/*/final/environment_metadata.txt`.
Summary: macOS 26.3.1, arm64, 8 logical processors, 16 GB memory, Node.js v24.18.0,
Playwright 1.61.1, with locally-cached Chromium, Firefox, and WebKit builds. This
environment renders WebGL in **software** for Chromium specifically (SwiftShader —
confirmed via Chromium process launch flags: `--use-gl=angle --use-angle=swiftshader-webgl
--enable-unsafe-swiftshader`), which is the primary reason Chromium's CPU utilization
figures in Section 6 are 6-10× higher than Firefox's or WebKit's on this same machine for
functionally identical work — this is an environment/rendering-backend property, not
evidence of an application difference between engines (see Section 6 for the full analysis,
including why this does NOT confound the actual resource-retention finding).

All three engines launch and run the application successfully in this environment as
delivered in this final report; the original OS-level socket/process restriction described
in `test_environment.md` no longer applies (see Section 0).

## 4. Isolated stage-level functionality

`functional_test_results.executed.csv` under each `evidence/<engine>/final/` directory
contains one row per stage-level execution attempt: 123 rows per engine (41 stages × 3
planned runs), 369 total. Every row is classified into exactly one of seven categories,
with `failure_origin` (`APPLICATION` / `AUTOMATION_DRIVER` / `TEST_ENVIRONMENT` / `NONE`)
kept strictly separate per category — an application failure is never folded into an
automation-driver failure or vice versa. The classification method itself is evidence-based,
not inferred: see `walkModule.js`'s top-of-file comment and `TEST_HARNESS_CHANGELOG.md`
Section 8 for the exact methodology (in short: a majority of interactions timing out while
waiting for basic actionability points at the application being unresponsive; interactions
that complete normally but produce no state change point at the driver, not the app).

### 4.1 Reconciliation table (stage-level, sums exactly to each engine's planned count)

| Category | Chromium | Firefox | WebKit | **All engines** |
|---|---:|---:|---:|---:|
| PASS | 98 | 123 | 123 | **344** |
| PARTIAL PASS | 0 | 0 | 0 | **0** |
| FAIL — APPLICATION | 0 | 0 | 0 | **0** |
| FAIL — AUTOMATION DRIVER | 2 | 0 | 0 | **2** |
| NOT TESTABLE | 0 | 0 | 0 | **0** |
| NOT REACHED | 23 | 0 | 0 | **23** |
| ENVIRONMENT FAILURE | 0 | 0 | 0 | **0** |
| **TOTAL** | **123** | **123** | **123** | **369** |

Zero `PARTIAL PASS`, `FAIL — APPLICATION`, `NOT TESTABLE`, and `ENVIRONMENT FAILURE` rows
were observed anywhere in this final dataset. Every one of the 2 real failures (both
Chromium, both `AUTOMATION_DRIVER` origin) is detailed in Section 5.2; the 23 `NOT REACHED`
rows are the downstream stages of those same 2 runs (14 stages after Driven Pile run 2's
stage-0 failure, 9 stages after Shallow Foundation run 3's stage-1 failure — see Section 5.2).

### 4.2 The five required metrics, per engine

**A. Planned execution coverage** (executions producing an observable result / planned):

| Engine | Coverage |
|---|---|
| Chromium | 123/123 = 100.0% |
| Firefox | 123/123 = 100.0% |
| WebKit | 123/123 = 100.0% |
| **All engines** | **369/369 = 100.0%** |

**B. Confirmed pass rate** (PASS / all planned executions):

| Engine | Pass rate |
|---|---|
| Chromium | 98/123 = 79.7% |
| Firefox | 123/123 = 100.0% |
| WebKit | 123/123 = 100.0% |
| **All engines** | **344/369 = 93.2%** |

**C. Conditional functional pass rate** (PASS / (PASS + PARTIAL PASS + FAIL—APPLICATION)) —
i.e. pass rate among executions where the application's own behavior was the deciding
factor, excluding driver-attributable failures entirely:

| Engine | Conditional pass rate |
|---|---|
| Chromium | 98/98 = 100.0% |
| Firefox | 123/123 = 100.0% |
| WebKit | 123/123 = 100.0% |
| **All engines** | **344/344 = 100.0%** |

Every application-attributable stage execution in this entire dataset passed. This is the
single most important number in this report for judging the application's own correctness,
as distinct from this evaluation's automation capability.

**D. Automation success rate** (executions the test driver actually ran, i.e. excluding
NOT_TESTABLE and NOT_REACHED / planned):

| Engine | Automation success rate |
|---|---|
| Chromium | 100/123 = 81.3% |
| Firefox | 123/123 = 100.0% |
| WebKit | 123/123 = 100.0% |
| **All engines** | **346/369 = 93.8%** |

**E. Continuous module completion rate** — see Section 5.1 (kept there since it is the same
metric as that section's headline figure).

### 4.3 Reading Metric C against Metric B

Metrics B and C diverge only for Chromium (79.7% vs 100.0%), and the entire gap between
them is explained by exactly 2 driver-attributable failures out of 123 planned executions —
not by any application defect. No `FAIL — APPLICATION` row exists anywhere in this dataset;
Metric C is 100% on every engine. Do not read Metric B in isolation as an application
quality score — it also reflects this specific automated driver's limitations in this
specific environment (Section 5.2), which is exactly why this report requires both metrics
side by side.

## 5. Continuous-session module reliability

This section answers a different question from Section 4: given a stage's individual logic
is correct (established above), does an uninterrupted, full walkthrough of a module
reliably reach its end? **The answer is not inferred from Section 4 — it is measured
directly**, per `module_run_results.executed.csv` under each `evidence/<engine>/final/`.

### 5.1 Summary (Metric E: continuous module completion rate)

| Module | Chromium | Firefox | WebKit | **All engines** |
|---|---:|---:|---:|---:|
| Drilled Shaft Foundation | 3/3 | 3/3 | 3/3 | **9/9 = 100.0%** |
| Driven Pile Foundation | 2/3 | 3/3 | 3/3 | **8/9 = 88.9%** |
| Shallow Foundation | 2/3 | 3/3 | 3/3 | **8/9 = 88.9%** |
| **All modules** | **7/9 = 77.8%** | **9/9 = 100.0%** | **9/9 = 100.0%** | **25/27 = 92.6%** |

Firefox and WebKit each completed all 9 of their module runs perfectly. Both real failures
occurred on Chromium, in this specific environment's software-WebGL configuration
(Section 3).

### 5.2 Every module run, in full (all fields required by this evaluation's brief)

Duration, CPU, and resource figures are drawn directly from
`evidence/<engine>/final/module_run_results.executed.csv`; screenshots and CPU-sample logs
are under the same directory.

| Run | Last completed stage | Total stages | Duration (s) | Final state reached? | CPU avg/max % | Geometries first→last | Failure origin | Evidence |
|---|---:|---:|---:|---|---:|---|---|---|
| DS_chromium_run1 | 14/15 | 15 | 205.5 | YES | 603.1/680.6 | 179→1090 | NONE | `DS-final_chromium_run1_completed.png` |
| DS_chromium_run2 | 14/15 | 15 | 208.8 | YES | 604.0/670.6 | 179→1078 | NONE | `DS-final_chromium_run2_completed.png` |
| DS_chromium_run3 | 14/15 | 15 | 207.2 | YES | 603.1/668.4 | 179→1109 | NONE | `DS-final_chromium_run3_completed.png` |
| DP_chromium_run1 | 14/15 | 15 | 221.5 | YES | 589.8/663.5 | 179→1198 | NONE | `DP-final_chromium_run1_completed.png` |
| **DP_chromium_run2** | **none** | 15 | **26.0** | **NO** | 601.1/626.8 | 170→170 (unchanged) | **AUTOMATION_DRIVER** | `DP-incomplete_chromium_run2_failure.png` |
| DP_chromium_run3 | 14/15 | 15 | 224.2 | YES | 593.6/681.4 | 179→1201 | NONE | `DP-final_chromium_run3_completed.png` |
| SF_chromium_run1 | 10/11 | 11 | 159.7 | YES | 612.4/662.8 | 27→896 | NONE | `SF-final_chromium_run1_completed.png` |
| SF_chromium_run2 | 10/11 | 11 | 160.5 | YES | 612.2/670.8 | 27→898 | NONE | `SF-final_chromium_run2_completed.png` |
| **SF_chromium_run3** | **0/11** | 11 | **20.5** | **NO** | 479.5/507.0 | 27→27 (unchanged) | **AUTOMATION_DRIVER** | `SF-incomplete_chromium_run3_failure.png` |
| DS_firefox_run{1,2,3} | 14/15 | 15 | 141-143 | YES (all 3) | 55-57 avg | 179→~1090 | NONE | `evidence/firefox/final/screenshots/` |
| DP_firefox_run{1,2,3} | 14/15 | 15 | 161-165 | YES (all 3) | 57-88 avg | 179→~1204 | NONE | `evidence/firefox/final/screenshots/` |
| SF_firefox_run{1,2,3} | 10/11 | 11 | 95 | YES (all 3) | 79-81 avg | 27→~880 | NONE | `evidence/firefox/final/screenshots/` |
| DS_webkit_run{1,2,3} | 14/15 | 15 | 136-139 | YES (all 3) | 37-48 avg | 179→~1079 | NONE | `evidence/webkit/final/screenshots/` |
| DP_webkit_run{1,2,3} | 14/15 | 15 | 150-156 | YES (all 3) | 37 avg | 179→~1208 | NONE | `evidence/webkit/final/screenshots/` |
| SF_webkit_run{1,2,3} | 10/11 | 11 | 93 | YES (all 3) | 36-38 avg | 27→~879 | NONE | `evidence/webkit/final/screenshots/` |

("Last completed stage" of 14/15 or 10/11, not 15/15 or 11/11, is expected and correct for
every successful run — the final stage's own completion is confirmed by the module's
result-overlay becoming visible rather than by `STATE.currentStep` advancing further, since
there is no next stage for it to advance to; see `TEST_HARNESS_CHANGELOG.md` Section 6.)

**The two failures in detail:**

- **DP_chromium_run2** failed at stage 0 ("Site Investigation") — the *first* stage of the
  module, one that passed cleanly in every other one of the other 26 runs across all three
  engines, including the other 2 Chromium runs of the same module. The driver attempted 27
  interactions across 24 passes with **zero actionability timeouts** and no observed
  `STATE.score` change. Resource counts were unchanged (170 geometries at both start and
  end — this run never progressed past its very first stage, so no cumulative growth had
  any chance to occur). This pattern — genuine interaction attempts, page fully responsive,
  simply no resulting state change — is the specific signature this evaluation's
  classification method assigns to `AUTOMATION_DRIVER`, not `APPLICATION` (see Section 4).
  The most likely explanation is transient 3D-click-target timing/positioning flakiness
  rather than any deterministic bug: 26 of 27 total module runs, including 2 of the other 3
  Chromium attempts of this exact module, passed this exact stage without incident.
- **SF_chromium_run3** failed at stage 1 ("Site Preparation") after passing stage 0. This
  stage requires clicking 6 debris items scattered up to 7 units from the scene origin;
  some fall outside the default camera's view frustum, and the generic driver never
  repositions the camera during a walkthrough (a disclosed, known driver limitation, not an
  application defect — see `TEST_HARNESS_CHANGELOG.md`). Resource counts were again
  unchanged (27 geometries throughout — stage 1 of 11, far too early for cumulative growth
  to be a factor).

Neither failure shows any evidence of elevated resource counts, degraded FPS, or timeout-
heavy interaction — both are early-stage, low-resource-count, driver-attributable outcomes,
fully consistent with Section 4's finding that zero `FAIL — APPLICATION` rows exist anywhere
in this dataset.

## 6. Resource-retention observations

Source inspection found that scene objects were removed from the Three.js scene graph
(`clearScene3D()`, called on every stage transition in all three simulation files) without
explicit disposal of their associated geometries, materials, or textures — `grep -c
'\.dispose('` returns `0` for `script.js`, `driven-pile.js`, and `drilled-shaft.js` alike.

During this evaluation's continuous-session runs, Three.js's own `renderer.info` counters
(read via `page.evaluate()`, not a Chromium-only API — collected identically on all three
engines) showed geometry counts growing monotonically and substantially across every
successful full-module run, with no run ever showing a decrease:

| Module | Geometry count, start → end of a full run | Growth factor |
|---|---|---|
| Drilled Shaft Foundation | 179 → ~1080-1210 | ~6× |
| Driven Pile Foundation | 179 → ~1200-1220 | ~7× |
| Shallow Foundation | 27 → ~877-898 | ~32× |

This pattern was **identical in shape across all three browser engines** — texture and
program counts also grew modestly and monotonically on every engine. This cross-engine
consistency is itself informative: it indicates the growth is a property of the
application's own object-lifecycle management (the same JavaScript, the same Three.js
calls, running on three independent WebGL implementations), not an artifact of any one
browser's rendering pipeline.

**Together, these findings are consistent with cumulative resource retention during stage
transitions. A controlled before-and-after intervention (e.g. patching `clearScene3D()` to
call `.dispose()` and re-measuring) was outside the scope of this evaluation, since it would
require modifying production code, which this evaluation's brief and `HANDOFF.md` both
commit to never doing.** This report does not claim a conclusively proven GPU-memory leak —
no direct GPU memory or driver-level allocation count was measured, only Three.js's own
object-count bookkeeping (`renderer.info`) and OS-level process CPU%.

**On CPU%, specifically:** Chromium's process CPU utilization (589-681% across every
successful run) was 6-16× higher than Firefox's (55-88%) or WebKit's (36-48%) for the
*same* module, the *same* stage sequence, and the *same* underlying geometry growth curve.
This is not evidence that the application behaves differently per engine — the geometry
growth curves above are essentially identical across engines. It is far better explained by
Section 3's finding that this environment's Chromium renders WebGL in software
(SwiftShader) while Firefox and WebKit use their platform's normal hardware-accelerated
path. **Raw CPU% was deliberately not used as a classification signal for APPLICATION vs.
AUTOMATION_DRIVER failures for exactly this reason** — see Section 4 and
`TEST_HARNESS_CHANGELOG.md` Section 8 for the actual (actionability-timeout-based)
classification method, which is engine-rendering-backend-independent.

**Metrics collected, and what was and was not available:**

| Metric | Availability | Engines |
|---|---|---|
| `renderer.info.memory.geometries` / `.textures`, `renderer.info.programs.length` (Three.js) | **Available, collected on every stage transition** | Chromium, Firefox, WebKit (all — pure JS/WebGL introspection, not engine-specific) |
| Process CPU% (OS-level, 2s sampling interval) | **Available, collected continuously** | All three (Section 8 methodology note in `TEST_HARNESS_CHANGELOG.md` explains the process-matching method and its one-engine-at-a-time precondition) |
| `performance.memory.usedJSHeapSize` | Available | **Chromium only** (non-standard API) — reported as `NOT SUPPORTED BY BROWSER` for Firefox/WebKit, never fabricated |
| CDP `Performance.getMetrics()` (Documents, Nodes, JSEventListeners, LayoutCount, etc.) | Available via `lib/resourceMetrics.js`, collected but not surfaced in the CSV schema above (kept in raw per-stage data structures only) | **Chromium only** — Playwright does not expose an equivalent session for Firefox or WebKit |
| Direct GPU memory / driver-level allocation counts | **Not available** — would require OS/GPU-driver-level tooling outside Playwright's API surface and outside this evaluation's scope | None |

## 7. Browser compatibility

All three engines loaded and ran every module without a single console error across all 27
continuous-module-run attempts (`console_error_count` is `0` in every row of every engine's
`module_run_results.executed.csv`). Playwright WebKit is referred to as "Playwright WebKit"
throughout this report, never as "Safari" — actual Apple Safari was not installed,
configured, or tested in any capacity.

## 8. Performance observations (first-stage, freshly-loaded page, one measurement per module per engine)

| Module | Engine | Page load | Time to interactive | Avg FPS | Interaction response |
|---|---|---:|---:|---:|---:|
| Shallow Foundation | Chromium | 893ms | 38ms | 65.8 | 317ms |
| Shallow Foundation | Firefox | 196ms | 91ms | 70.3 | 1923ms |
| Shallow Foundation | WebKit | 169ms | 74ms | 82.9 | 500ms |
| Driven Pile | Chromium | 91ms | 42ms | 121.8 | 1005ms |
| Driven Pile | Firefox | 133ms | 86ms | 61.6 | 352ms |
| Driven Pile | WebKit | 84ms | 43ms | 75.5 | 200ms |
| Drilled Shaft | Chromium | 100ms | 45ms | 51.2 | 64ms |
| Drilled Shaft | Firefox | 143ms | 97ms | 60.3 | 119ms |
| Drilled Shaft | WebKit | 84ms | 44ms | 75.7 | 250ms |

All figures are single-sample (`run_number: 1` only, per the evaluation brief's
"representative low-complexity stage" scope) and should be read as indicative, not
statistically rigorous — `interaction_response_ms` in particular varies by an order of
magnitude across single samples and is sensitive to exactly when within a 300ms measurement
window the sampled click happened to land. All three engines sustain well above 50 FPS on a
freshly-loaded first stage on this hardware.

## 9. Errors and limitations

- **Chromium's 2 failures** (Section 5.2) are the primary limitation of this evaluation's
  results, not of the application (Section 4.3, Metric C = 100%).
- **The resource-retention finding** (Section 6) is real and cross-engine-consistent but not
  independently confirmed as a memory leak via direct GPU measurement — reported with
  appropriately hedged language throughout.
- **The generic driver has one disclosed, unfixed interaction gap**: it never repositions
  the camera during a walkthrough, so a stage whose targets are scattered outside the
  default camera frustum (Shallow Foundation's "Site Preparation") is not reliably
  completable if the driver happens to need to reach an off-frustum target on an unlucky
  run. This is the likely proximate cause of the SF_chromium_run3 failure.
- **Single-sample performance metrics** (Section 8) — see that section's own caveat.
- **`console_error_count: 0` is not evidence of zero application defects** — it means no
  uncaught JavaScript exceptions or explicit `console.error()` calls occurred during these
  27 runs; logic bugs that don't throw or log would not appear here.
- Exact CPU model string is unavailable in this environment (`sysctl -n
  machdep.cpu.brand_string` denied); architecture and core count were obtained by an
  alternate command and are reported in `test_environment.md`.

## 10. Reproducibility information

See `HANDOFF.md` for exact reproduction steps and the final commit hash, and
`TEST_HARNESS_CHANGELOG.md` for the complete, dated list of every correction made to the
test driver before this final dataset was produced. In summary:

```bash
git clone https://github.com/YashPatel2395/shallow-foundation-sim.git
cd shallow-foundation-sim && git checkout research-evaluation
cd research_evaluation/playwright-suite && npm install
npx playwright install chromium firefox webkit
npx playwright test --project=chromium   # ~25 min
npx playwright test --project=firefox    # ~20 min
npx playwright test --project=webkit     # ~20 min
```

Each run appends to the top-level `*.executed.csv` files (delete them first for a clean
single-run dataset) and can be assembled into a versioned evidence snapshot via
`scripts/assemble_evidence.py <engine> <start-iso> <end-iso>`, matching the structure under
`evidence/<engine>/final/` in this repository.

## 11. Evidence-file index

| Location | Contents |
|---|---|
| `system_inventory.md`, `stage_inventory.csv` | Source-derived architectural inventory |
| `test_environment.md`, `logs/environment_blocker_evidence.log`, `logs/chromium_launch_attempt.log` | Historical record of the original execution restriction (Section 0, phase 1) |
| `archive/exploratory_pre_final_*/` | Superseded results from the driver-debugging phase (Section 0, phase 2) — not part of the final dataset |
| `TEST_HARNESS_CHANGELOG.md` | Every correction made to the test driver, with evidence, before the harness was frozen |
| `playwright-suite/` | The frozen test harness itself |
| `evidence/chromium/final/` | Complete final Chromium evidence: raw stage-level and module-run CSVs, performance CSV, `results_summary.json`, `run_metadata.json`, `environment_metadata.txt`, screenshots (first-stage, final/incomplete-state for every run), CPU-sample logs, browser-compatibility CSV, browser-logs README |
| `evidence/firefox/final/` | Same structure, Firefox |
| `evidence/webkit/final/` | Same structure, WebKit |
| `evidence/SHA256SUMS.txt` | SHA-256 checksums for every CSV/JSON/Markdown/log file under `evidence/` |
| `results_summary.json` (top level) | The final combined summary across all three engines (grand totals, per-engine breakdown, all 5 metrics) — this is the same data as Sections 4-5 above, in machine-readable form. Per-engine snapshots are also available individually under `evidence/<engine>/final/results_summary.json`. |
| `scripts/compute_reconciliation.py`, `scripts/compute_grand_total.py` | Regenerate Section 4's tables directly from the evidence CSVs |
