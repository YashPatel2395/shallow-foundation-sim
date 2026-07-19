# Functional Evaluation Report — Foundation Construction Simulation

## 1. Evaluation objective

To perform a reproducible functional evaluation of a browser-based, three-module
3D construction-sequence simulation (Shallow Foundation, Driven Pile Foundation, Drilled
Shaft Foundation), producing measurable, traceable evidence of the application's
implemented behavior: what each stage requires, how completion and incorrect actions are
handled, whether stages function across browser engines, and what could and could not be
directly observed given the execution environment available for this evaluation. This
report does not evaluate engineering accuracy, code quality, or educational value. It
evaluates functional behavior and content coverage against what the source code
implements.

## 2. System evaluated

A static, unbundled web application (vanilla JavaScript + Three.js r123, no framework, no
build step, no `package.json`) consisting of three simulation modules and a dashboard:

| Module | Entry point | Logic file | Stages |
|---|---|---|---|
| Shallow Foundation | `index.html` | `script.js` | 11 |
| Driven Pile Foundation | `driven-pile.html` | `driven-pile.js` | 15 |
| Drilled Shaft Foundation | `drilled-shaft.html` | `drilled-shaft.js` | 15 |
| **Total** | | | **41** |

Full architectural detail — libraries, routes, scoring model, reset behavior, camera
system, progress navigation, asset inventory, and object-persistence mechanics — is in
`system_inventory.md`. That document, and this report, are both derived from direct
source-code inspection; neither represents an executed browser test unless explicitly
stated as such.

The evaluation was performed against commit `a2197eaee88f2debdff45799ffd0066cc32ec3a0` on
a dedicated `research-evaluation` git branch, with no production file modified as part of
this evaluation (verified — see Section 12).

## 3. Test environment

Full detail, including exact OS/CPU/memory/software versions and command-level evidence,
is in `test_environment.md`. Summary: macOS 26.3.1, arm64e, 8 logical processors, 16 GB
memory, Node.js v24.18.0, Python 3.12.10, Playwright (Python) 1.59.0 with a locally cached
Chromium 1217 build (Firefox and WebKit builds not present).

**The environment's execution sandbox denies the OS-level socket and process-IPC
primitives (`bind()` for TCP and Unix-domain sockets; Mach port bootstrap check-in) that
any Chromium-family browser process requires to start, whether or not a local server is
involved.** This was directly confirmed, not assumed: `python3 -m http.server` fails at
`socket.bind()`, and a direct Playwright launch of the locally cached Chromium binary
against the application via `file://` (no server, headless, `--no-sandbox`) fails during
browser-process startup with a Mach IPC permission error. Full logs:
`logs/environment_blocker_evidence.log`, `logs/chromium_launch_attempt.log`.

This is the single governing constraint on this evaluation and is treated as such
throughout this report.

## 4. Browser engines tested

| Engine | Status | Basis |
|---|---|---|
| Chromium (Playwright-managed) | **NOT TESTABLE** | A real launch was directly attempted and failed with reproducible evidence (Section 3). |
| Firefox (Playwright-managed) | **NOT TESTED** | Browser binary not present in this environment and not installed (would require outbound network access to Playwright's CDN that was not pursued, since the Chromium result already established an engine-independent OS-level launch restriction). No launch was attempted. |
| Playwright WebKit | **NOT TESTED** | Same basis as Firefox. Referred to throughout this evaluation as "Playwright WebKit," never as "Safari" — actual Apple Safari was not installed, configured, or tested in any capacity. |

No claim in this report, or in any generated CSV/JSON file, states that a browser session
was actually established, that a stage was actually rendered, or that a click was actually
delivered to the running application, except where explicitly labeled as output of the
provided (but unexecuted, in this environment) Playwright suite under
`playwright-suite/`, run separately by a researcher with an unrestricted environment (see
Section 12).

## 5. Evaluation procedure

1. **Static inspection** (executed in this environment): read `STEPS` metadata and
   `STEP_HANDLERS` interactive-logic arrays in all three JS files; cross-referenced counts,
   titles, and comment-header numbering; traced shared helpers (`completeStep()`,
   `penalize()`, `resetSimulation()`, `setCamPreset()`, `clearScene3D()`, `getGrade()`).
   Output: `system_inventory.md`, `stage_inventory.csv`.
2. **Environment capability probing** (executed in this environment): verified whether a
   local server or a real browser process could be started at all, with direct reproduction
   rather than assumption. Output: `test_environment.md`, `logs/`.
3. **Test-suite authoring** (executed in this environment; the suite itself was not run):
   wrote a real, data-driven Playwright suite implementing the 14-point per-stage checklist
   as far as it is automatable, using a documented methodology for interacting with
   canvas-rendered 3D click targets. Output: `playwright-suite/`.
4. **Result-matrix generation** (executed in this environment, computed, not
   hand-typed): generated the full planned stage × browser-engine × run-number matrix
   required by the brief, with every row honestly marked `NOT TESTABLE` (Chromium) or `NOT
   TESTED` (Firefox, WebKit) and a precise reason, rather than left blank or fabricated.
   Output: `functional_test_results.csv`, `module_run_results.csv`,
   `browser_compatibility.csv`, `performance_results.csv`, `error_log.csv`, generated by
   `scripts/generate_result_matrices.py`.
5. **Summary computation** (executed in this environment): `results_summary.json`
   computed strictly from the CSVs above by `scripts/generate_results_summary.py` — every
   number is traceable to a raw file; none was hand-typed into the summary.

Steps 1, 2, 4, and 5 above are genuine executed work products of this evaluation. Step 3
produced a genuine, runnable artifact whose *execution* is deferred to an unrestricted
environment; that deferral is disclosed everywhere its output would otherwise appear.

## 6. Stage inventory

Full inventory (41 rows, one per stage) is in `stage_inventory.csv`, with columns for
required user action, completion condition, incorrect-action behavior, scoring presence,
camera behavior, reset support, and exact source location. Stage titles in order, and the
recurring interaction-pattern taxonomy across all 41 stages, are summarized in
`system_inventory.md` under "Stage titles in order" and "Interaction required at every
stage."

Two source-level findings surfaced during this inventory pass (both are code-documentation
observations, not runtime bugs — see `system_inventory.md`, "Documented source
inconsistencies," for full detail and exact line references):

- In `driven-pile.js`, the `STEP_HANDLERS` array's inline comment labels (e.g. `/* 15:
  Final Inspection */`) are numerically stale from array position 7 onward relative to true
  0-indexed array position, while the actual array itself is correctly ordered and 1:1
  aligned with the `STEPS` metadata array (verified by content, not by comment text).
- 22 of the 41 stages implement no incorrect-action path at all — every interaction in
  those stages is accepted as correct, or is a no-op if repeated. This is a coverage
  observation about the application, recorded per-stage in `stage_inventory.csv`, not a
  defect judgment.

## 7. Functional testing results

`functional_test_results.csv` contains 369 rows (41 stages × 3 browser engines × 3 planned
runs), the full matrix required by the evaluation brief. **Every row's `overall_result` is
`NOT TESTABLE` or `NOT TESTED`, per Sections 3–4 above — zero rows report `PASS`,
`PARTIAL PASS`, or `FAIL`, because zero browser sessions were established in this
environment.** Each row carries a specific `failure_description` explaining why (the
Chromium launch-failure evidence, or the Firefox/WebKit non-installation basis), rather
than a generic placeholder.

If `playwright-suite/` is executed in an unrestricted environment, it appends genuine,
timestamped results to `functional_test_results.executed.csv` in the same column schema,
kept in a separate file so real evidence is never merged with, or mistaken for, these
placeholder rows.

## 8. Complete-module results

`module_run_results.csv` contains 27 rows (3 modules × 3 engines × 3 planned runs), same
disposition as Section 7: every `overall_result` is `NOT TESTABLE`/`NOT TESTED`, with
`total_stages` populated from the real per-module stage count and all outcome-dependent
fields (`completed_stages`, `duration_seconds`, etc.) left empty rather than fabricated.
`playwright-suite/` produces genuine `module_run_results.executed.csv` rows if run.

## 9. Browser compatibility results

`browser_compatibility.csv` contains one row per engine. Chromium's `application_loaded`
field states plainly that the browser process failed to start, with the direct evidence
citation; Firefox and WebKit are marked not tested. `overall_compatibility` is `NOT TESTED`
for all three engines — this evaluation makes no compatibility claim, positive or
negative, for any engine, and in particular makes no claim about actual Apple Safari.

## 10. Performance observations

`performance_results.csv` contains one placeholder row per module × engine (9 rows) for
the required representative low-complexity stage, with all measurement fields empty and
`measurement_method` stating plainly that no measurement was taken. `playwright-suite/specs/performance.spec.js`
implements real, browser-API-grounded measurement (navigation timing, a 3-second
`requestAnimationFrame` FPS sample, interaction-response latency, and JS heap usage where
the engine exposes it — explicitly not fabricated for engines that don't, since
`performance.memory` is a non-standard, Chromium-only API) and will produce genuine
`performance_results.executed.csv` rows if run in an unrestricted environment.

## 11. Errors and limitations

**Primary limitation:** no live browser execution occurred in this evaluation's execution
environment (Section 3). This is the dominant limitation and governs Sections 7–10.

`error_log.csv` records exactly two entries, both environment-level (browser/socket launch
failures encountered while setting up testing — `ENV-001`, `ENV-002`, both `CRITICAL`
severity), and explicitly **not** application-level runtime errors, because no application
code executed in a browser. The log states this distinction directly rather than implying
an error-free application by omission.

Additional, smaller limitations, each disclosed at the point it matters:

- Exact CPU model string is unavailable (`sysctl -n machdep.cpu.brand_string` denied by the
  sandbox); processor architecture and core count were obtained by another means and are
  reported. Screen resolution is `NOT TESTABLE` (no rendered viewport was ever established).
- `playwright-suite`'s generic interaction driver (Section 5, step 3) does not exercise
  incorrect-action paths and does not guarantee optimal-scoring completion for stages with a
  narrow correct-input band (e.g. concrete-pour fill percentage); it also does not measure
  per-stage object persistence. These are disclosed in `playwright-suite/README.md` as
  scoped-out, not silently skipped.
- Object persistence between stages (Section 6, and `system_inventory.md`) was
  characterized from source only; the inventory notes explicitly that confirming every
  stage's rebuild call actually fires as intended would require live browser testing this
  evaluation could not perform.

## 12. Reproducibility information

See `HANDOFF.md` for exact, copy-pasteable reproduction steps from a clean checkout,
including the branch name and final commit hash. In summary: check out
`research-evaluation`, confirm `git diff origin/master -- script.js driven-pile.js
drilled-shaft.js style.css index.html driven-pile.html drilled-shaft.html three.min.js`
is empty (no production file was modified by this evaluation), then run
`playwright-suite/` in an environment capable of launching a real browser process.

## 13. Summary tables

See `results_summary.json` for the full computed summary (all values traceable to the raw
CSVs per Section 5, step 5). Headline figures as delivered in this package:

| Metric | Value |
|---|---|
| Total modules | 3 |
| Total stages (source-derived) | 41 |
| Total planned stage-test executions | 369 |
| Executed passes / partial passes / failures | 0 / 0 / 0 |
| Not testable / not tested executions | 369 |
| Stage pass rate | 0% (no execution occurred — not a quality finding) |
| Module run attempts / successful | 27 / 0 |
| Critical (environment-level) failures logged | 2 |

## 14. Evidence-file index

| File | Produced by | Contents |
|---|---|---|
| `system_inventory.md` | Source inspection | Full architectural inventory |
| `stage_inventory.csv` | Source inspection | 41-row per-stage inventory |
| `test_environment.md` | Direct environment probing | Machine/software facts + browser-launch blocker evidence |
| `logs/environment_blocker_evidence.log` | Direct execution | Socket-bind failure reproduction |
| `logs/chromium_launch_attempt.log` | Direct execution | Full Playwright/Chromium launch failure trace |
| `scripts/browser_launch_probe.py` | — | The probe script that produced the log above |
| `scripts/generate_result_matrices.py` | — | Generates the five placeholder result CSVs from `stage_inventory.csv` |
| `scripts/generate_results_summary.py` | — | Computes `results_summary.json` from the CSVs |
| `functional_test_results.csv` | Generated (placeholder) | 369-row planned test matrix, all NOT TESTABLE/NOT TESTED |
| `module_run_results.csv` | Generated (placeholder) | 27-row planned module-run matrix |
| `browser_compatibility.csv` | Generated (placeholder) | 3-row per-engine compatibility matrix |
| `performance_results.csv` | Generated (placeholder) | 9-row planned performance matrix |
| `error_log.csv` | Generated | 2 environment-level CRITICAL entries |
| `results_summary.json` | Computed | Aggregate figures, traceable to the CSVs above |
| `playwright-suite/` | Authored, not executed | Real, runnable Playwright suite + methodology README |
| `screenshots/{chromium,firefox,webkit}/` | — | Empty in this delivery (no browser session ran); populated if the suite is later executed |
| `HANDOFF.md` | — | Reproduction instructions and final commit hash |

No claim in this report exceeds what is stated in this index. Where a deliverable is a
placeholder rather than executed evidence, it is labeled as such both here and at its
point of use in Sections 7–10.
