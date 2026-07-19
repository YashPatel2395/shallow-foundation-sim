# Evaluation Suite — Playwright

This suite was written to perform the live functional evaluation described in
`../functional_evaluation_report.md`. It is a genuine, runnable Playwright test
suite — it was **not executed** in the environment it was authored in, because
that environment's sandbox denies the OS-level socket and process primitives
any browser needs to launch (evidence: `../test_environment.md` and
`../logs/`). It is provided so a researcher with an unrestricted environment
can reproduce live results.

## What this suite does

- `specs/shallow-foundation.spec.js`, `specs/driven-pile.spec.js`,
  `specs/drilled-shaft.spec.js` — drive each module from its first stage to
  its last, three times each (`RUNS = [1, 2, 3]`), per browser project. Each
  stage is scored against the 14-point checklist from the evaluation brief as
  far as that checklist is automatable (see "What this suite does not do"
  below), and results are appended to `../functional_test_results.executed.csv`
  and `../module_run_results.executed.csv` in the exact column schema required
  by the brief.
- `specs/camera-and-reset.spec.js` — loads each module's dashboard/first
  stage, exercises the camera preset buttons and an orbit-drag gesture, and
  exercises the global Reset button, independent of full module progression.
- `specs/performance.spec.js` — measures page-load time, time-to-interactive
  (`PerformanceNavigationTiming.domInteractive`), a 3-second `requestAnimationFrame`
  FPS sample, interaction-response latency, and JS heap usage where the
  browser exposes it, for one representative low-complexity stage per module.
  Writes to `../performance_results.executed.csv`.

## Interaction methodology (read this before trusting the results)

The application renders every construction-stage click target as a Three.js
mesh on a single `<canvas>`, using its own raycaster bound to the canvas's
native `click` DOM event. There is no per-object DOM element to target with a
Playwright locator. `lib/testUtils.js` handles this by:

1. Reading each candidate 3D object's *current on-screen projected position*
   from inside `page.evaluate()`, using the application's own live `camera`
   and the canvas's real bounding rectangle — the same projection the
   application performs for its own on-screen labels.
2. Dispatching a real `page.mouse.click(x, y)` at that coordinate, which the
   browser delivers as a genuine `click` event to the canvas, handled by the
   application's actual raycaster — not a shortcut that calls an internal
   handler directly.

Reading `camera`, `clickables3D`, and `STATE` via `page.evaluate()` is used
**only** for orchestration (deciding where to click, and observing whether
`STATE.currentStep` advanced) — it never substitutes for a real event.

For DOM-based controls (action-bar buttons and the card-based fallback UI),
`tryActionBarControls()` performs a real Playwright `.click()`, and — only if
the element is still present and enabled afterward — retries as a
mousedown-hold(1.5s)-mouseup gesture, because at least one stage in this
application (concrete pour) uses a hold-to-fill control rather than a single
click.

## What this suite does not do (disclosed limitations)

- **It does not guarantee optimal-scoring completion.** Some stages (for
  example, concrete-pour stages) award full credit only within a specific
  value band (e.g. 88–98% fill). The generic driver will reach *a* completion
  state but is not scripted to hit that specific band; this is recorded in
  each row's `observed_behavior` field, not hidden.
- **It does not exercise "incorrect action" paths.** Per-stage
  `incorrect_action_feedback` is recorded as `NOT EXERCISED BY GENERIC DRIVER`
  — deliberately triggering a wrong action (e.g. overfilling concrete, closing
  a formwork stage early) requires stage-specific scripting beyond this
  generic pass. This is a known gap for a future, more targeted test pass, not
  a claim that those paths were checked.
- **It does not measure object persistence** (whether previously completed
  construction elements remain visible when a later stage is reached) or
  **stage-specific reset behavior** — `camera-and-reset.spec.js` checks the
  *global* reset button from a module's first stage only. Per-stage object
  persistence would require visually diffing the scene graph or screenshots
  stage-by-stage, which is future work.
- **JS heap measurement is Chromium-only.** `performance.memory` is a
  non-standard API not exposed by Firefox or WebKit; those engines will
  correctly report `NOT SUPPORTED BY BROWSER` rather than a fabricated value.

## How to run

Requires an environment where a browser process can actually be launched
(i.e., not this evaluation's original sandbox — see `../test_environment.md`).

```bash
cd research_evaluation/playwright-suite
npm install
npx playwright install chromium firefox webkit
npm test                 # all three browser engines
npm run test:chromium    # one engine at a time
npm run test:firefox
npm run test:webkit
```

Output:
- `../functional_test_results.executed.csv` — real, timestamped per-stage results.
- `../module_run_results.executed.csv` — real, timestamped per-module-run results.
- `../performance_results.executed.csv` — real performance measurements.
- `../screenshots/<engine>/` — screenshots captured during the run.
- `../logs/playwright-artifacts/` — traces/screenshots on failure (Playwright's own reporter output).
- `../functional_test_results.raw.json` — full Playwright JSON reporter output.

These `.executed.csv` files are intentionally named separately from
`../functional_test_results.csv`, `../module_run_results.csv`, and
`../performance_results.csv` (the NOT TESTABLE placeholder matrices generated
without browser execution — see `../scripts/generate_result_matrices.py`), so
that genuine executed evidence is never silently merged with, or mistaken
for, the placeholder rows.
