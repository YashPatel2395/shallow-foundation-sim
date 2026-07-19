# Test Harness Changelog

This document records every correction made to the **evaluation driver**
(`research_evaluation/playwright-suite/`) between the first live-Chromium
execution attempt and the finalized harness used to produce the evidence
under `research_evaluation/evidence/`. It exists to make one fact auditable:
every change below is a change to *how this evaluation observes the
application*, never a change to the application itself.

**No production file was modified to produce any result in this evaluation.**
Verify at any time:

```bash
git diff origin/master -- script.js driven-pile.js drilled-shaft.js style.css \
  index.html driven-pile.html drilled-shaft.html three.min.js
# expected output: nothing
```

All changes below live entirely under `research_evaluation/playwright-suite/`.
Base commit for this changelog: `55174cb56b83e56a5531c9b35faabf8790b807f8`
(branch `research-evaluation`).

## Harness freeze

As of this document's commit, the driver logic and timing constants below are
**frozen** for the remainder of this evaluation. The same harness version is
used for Chromium, Firefox, and WebKit unless a browser-specific change is
unavoidable — any such exception will be appended to this changelog with an
explicit "browser-specific exception" heading, not silently folded into the
main narrative above it.

---

## 1. Shallow Foundation SPA navigation gap

**File:** `lib/testUtils.js` (`gotoModuleEntry`)

**Symptom:** Every walkthrough attempt against Shallow Foundation
(`index.html`) timed out waiting for `#task-title` to become visible — 100%
failure rate, 0 stages ever reached.

**Root cause:** Unlike Driven Pile and Drilled Shaft (each a dedicated HTML
page), Shallow Foundation is a section inside `index.html`'s single-page-app
dashboard (`#shallowSimView`), hidden by `class="hidden"` until the
application's own `showShallowFoundationSimulation()` runs — normally
triggered by a nav-button or card-button click. A bare `page.goto('index.html')`
lands on the dashboard view, where `#task-title` exists in the DOM but stays
hidden forever, since nothing had ever clicked into the simulation.

**Fix:** `gotoModuleEntry(page, entryUrl)` now clicks `#nav-btn-shallow`
immediately after navigating, but only for `entryUrl === 'index.html'`. This
is a driver-side navigation completeness fix, not an application defect —
the dashboard is a genuinely separate, valid view of the real app.

**Classification if unfixed:** Would present as 123/123 Shallow Foundation
executions AUTOMATION_DRIVER FAIL — the application was never even
reachable, so no application-side signal was involved at all.

---

## 2. `RingGeometry` dead-center click targets

**File:** `lib/testUtils.js` (`getClickable3DTargets`)

**Symptom:** Drilled Shaft's "Shaft Layout" stage, and the structurally
identical stage in Driven Pile, never registered a single successful click
on their survey-marker targets.

**Root cause:** Both stages render their clickable markers as
`THREE.RingGeometry(0.3, 0.5, 16)` meshes — an annulus with **no geometry
between radius 0 and 0.3**. The driver's click-targeting logic computed each
mesh's exact world-space origin and clicked there; for a ring, that point is
in the hole, so the raycast the application performs against the click never
hits the mesh. Confirmed by direct source inspection of both `drilled-shaft.js`
and `driven-pile.js` (identical code pattern, independently verified in each
file).

**Fix:** When a target's geometry type is `RingGeometry`, the sampled click
point is offset to the ring's mid-band radius (`(innerRadius + outerRadius) / 2`)
along the mesh's local +X axis before projecting to screen space, instead of
using the mesh origin.

**Classification if unfixed:** AUTOMATION_DRIVER FAIL on the affected stages
— a real user clicking anywhere on the visible ring band would have no
trouble; this was purely a driver targeting defect.

---

## 3. Redundant hold-gesture retries

**File:** `lib/testUtils.js` (`tryActionBarControls`)

**Symptom:** Multi-item action-bar stages (e.g. Drilled Shaft's "Install
Temporary Casing," four `<div class="panel-item">` controls) took far longer
than necessary per pass, occasionally pushing a stage past its own timeout
despite having already completed on-screen.

**Root cause:** The original fallback logic re-attempted a 1.5s
mousedown-hold on every control whose plain click didn't leave it with an
HTML `disabled` attribute. Many of the application's action-bar controls are
plain `<div>` elements that **never** carry a real `disabled` attribute, even
after being marked complete (confirmed by source inspection) — so the "did
the plain click already work" check always fell through to the hold retry,
even when the click had already fully succeeded.

**Fix:** Each control's `outerHTML` is captured before and after the plain
click; the hold-gesture fallback is now skipped whenever anything visibly
changed, not only when the (frequently absent) `disabled` attribute changed.

**Classification impact:** This was pure wasted time, not a source of
incorrect classification on its own — but by shortening per-pass duration
substantially, it reduced the number of stages that would otherwise cross
into APPLICATION-classified timeout territory (see item 4) for reasons
unrelated to the application's own responsiveness.

---

## 4. Unbounded Playwright action timeouts

**Files:** `lib/testUtils.js` (`tryActionBarControls`, `tryRangeSliders`),
introducing `ACTION_TIMEOUT_MS = 5_000`

**Symptom:** A single stage could hang for the *entire remaining test
budget* (minutes), completely bypassing the driver's own per-stage timeout.

**Root cause:** Playwright's default action timeout is `0` — wait forever
for actionability. At least one real stage (Drilled Shaft's "Reinforcement")
deliberately keeps a control at `pointer-events: none` until a separate,
earlier control's multi-second drop animation finishes — an un-timed
`el.click()` attempted before that animation completes waits correctly, by
design, but with no bound at all, any control that becomes actionable
*very* slowly (or never) consumes the whole remaining budget in one call.
`walkModule.js`'s own `STAGE_TIMEOUT_MS` is checked only *between* passes,
never inside one, so an unbounded action defeats it entirely.

**Fix:** Every `isVisible`, `getAttribute`, `click`, `boundingBox`, and
`press` call in `tryActionBarControls`/`tryRangeSliders` now passes an
explicit `{ timeout: ACTION_TIMEOUT_MS }` (5000ms). Timeouts are also now
individually counted and returned (`{ attempted, timeouts }` instead of a
bare count) — this count is the primary evidence signal the failure
classifier (`walkModule.js`) uses to distinguish an APPLICATION-caused stall
from an AUTOMATION_DRIVER one; see `functional_evaluation_report.md` for the
full methodology.

---

## 5. Overall test / per-stage timeout budgets

**Files:** `playwright-suite/playwright.config.js` (`timeout`, `workers`),
`lib/walkModule.js` (`STAGE_TIMEOUT_MS`, `MAX_PASSES_PER_STAGE`)

**History (each step was a real, observed necessity, not pre-emptive
tuning):**

| Setting | Original | Final (frozen) | Why |
|---|---|---|---|
| Playwright global test timeout | 90,000ms | **600,000ms** | A 15-stage module walkthrough, even fully healthy, can legitimately take 3-4+ minutes; the original 90s default killed runs mid-progress (verified: a run reached step 4/11 with a real, increasing score before being force-closed). |
| `STAGE_TIMEOUT_MS` | 25,000ms | **60,000ms** | A stage requiring several hold-gesture sub-completions (e.g. drilling 4 boreholes, each needing a ~3s continuous hold) legitimately needs more than a handful of passes; a run was observed reaching 100% completion on-screen (verified via screenshot) a few hundred ms before the driver's old budget gave up. |
| `MAX_PASSES_PER_STAGE` | 12 | **24** | Paired with the `STAGE_TIMEOUT_MS` increase above, for the same reason. |
| Playwright `workers` | (default, parallel) | **1** | Running multiple headless-Chromium instances concurrently on this hardware causes severe CPU/GPU contention (confirmed: identical Shallow Foundation runs that passed in 13-47s alone failed under a 180s timeout when run alongside 3 other workers). This is a property of the evaluation *environment*, not the application. |

**These five values are frozen as of this changelog.** They are not
re-tuned per browser engine; if Firefox or WebKit genuinely require a
different value, that exception is documented in a dedicated section below
this line, not by silently editing the table above.

---

## 6. Last-stage completion bookkeeping

**File:** `lib/walkModule.js`

**Symptom:** The final stage of an otherwise fully-completed module run was
being recorded as `FAIL`, even when the module's own completion overlay was
visible on screen and every earlier stage had passed cleanly.

**Root cause:** The driver's progress check was `STATE.currentStep !==
thisStage` — but a module's *last* stage has no "next" step index for
`currentStep` to advance to; completion is instead signaled by the
application showing its result overlay (`#result-overlay`). The overlay
check previously only ran *after* the inner retry loop had already given up,
by which point the stage had already been recorded as a failure.

**Fix:** The overlay-visibility check now runs inside the retry loop itself,
immediately after each pass, and is treated as equivalent to
`currentStep` advancing.

**Classification impact:** Without this fix, every fully-successful module
run would still show one spurious FAIL row (its last stage) in the
reconciliation table, undercounting genuine PASS results by exactly the
number of successful full-module runs. This is a correctness fix to the
scoring bookkeeping, not a change in what interaction is attempted.

---

## 7. Driven Pile "Alignment Check" — native slider automation (new capability, not a fix)

**File:** `lib/testUtils.js` (`tryRangeSliders`, new function)

Prior to this pass, Driven Pile's "Alignment Check" stage — two native
`<input type="range">` sliders (N-S tilt, E-W tilt; `min=87 max=93 step=0.1`,
completion requires both within ±0.5° of 90) — was entirely outside this
driver's capability: it only knew how to click 3D targets and action-bar
controls, never how to operate a slider. This was disclosed as an
AUTOMATION_DRIVER limitation rather than worked around.

This pass adds `tryRangeSliders(page)`: a genuine mouse drag from each
slider's current thumb position to its own min/max midpoint (a heuristic
that uses no application-specific knowledge beyond the slider's own
attributes — verified by source inspection to be correct for this stage,
since 90 is exactly the midpoint of 87 and 93), followed by a small
real-keyboard-arrow-key fine-tuning pass to correct for the native thumb's
CSS radius inset. Verified directly: 5/5 forced-out-of-tolerance test runs
landed at exactly 90.0°/90.0° and completed the stage. This is now a
supported, reliable interaction in the driver; the stage is no longer a
disclosed limitation.

---

## 8. Failure-origin classification framework (new capability)

**Files:** `lib/walkModule.js`, `lib/testUtils.js`, `lib/resultWriter.js`,
all three walkthrough specs

Every non-PASS stage result is now classified into exactly one
`failure_origin` (`APPLICATION`, `AUTOMATION_DRIVER`, `TEST_ENVIRONMENT`, or
`NONE`), using evidence rather than inference:

- **AUTOMATION_DRIVER**: no interactive targets were found at all, or
  interactions completed with zero actionability timeouts but produced no
  observable `STATE` change (the app was responsive; the driver simply did
  not find the correct input).
- **APPLICATION**: a majority of attempted interactions themselves exceeded
  `ACTION_TIMEOUT_MS` waiting for basic actionability — the page itself was
  unresponsive, not merely mis-targeted.
- **TEST_ENVIRONMENT**: the run was ended by a genuine environment-level
  failure (browser/page crash, context closed unexpectedly), detected
  separately from normal stage-progression logic.
- **NONE**: the stage passed, or (for `NOT_REACHED` rows) nothing was
  attempted because an earlier stage in the same run already ended the walkthrough.

Explicitly **not** used as a classification signal on its own: raw process
CPU percentage. This evaluation environment renders WebGL in software
(SwiftShader — confirmed via Chromium process flags), and shows 600%+ CPU
even during entirely healthy, fast-completing stages. CPU and
GPU-resource-count measurements are still collected and reported (see
Section 8 of `functional_evaluation_report.md`) as descriptive evidence, but
the APPLICATION/AUTOMATION_DRIVER split above is decided by the
actionability-timeout signal, which is specific to actual page
unresponsiveness rather than baseline rendering cost.

---

## 9. Auto-advanced stage misclassified as NOT_REACHED

**File:** `lib/walkModule.js`

**Discovered:** during validation of the first complete clean Chromium run
against the frozen harness (i.e. before that run's results were accepted as
final) — Driven Pile run 3 showed `overall_result: PASS`,
`final_state_reached: YES`, `completed_stages: 14/15`, but also
`not_reached_stages: 1`, which is self-contradictory: a run cannot both
fully complete *and* have a stage it never reached.

**Root cause:** the outer per-stage loop reads `STATE.currentStep` once per
iteration and attempts whatever stage that is. If a stage requires zero
driver interaction and the application auto-advances past it (e.g. within
the same wait window as the *previous* stage's own completion detection),
the outer loop's next read already shows `currentStep` two or more stages
ahead — the skipped stage never gets its own iteration, and the original
NOT_REACHED-filling logic (item 6 above covers only the *last-stage*
bookkeeping case) recorded it as NOT_REACHED, even though the run
demonstrably passed through it on the way to a later, confirmed PASS.

**Fix:** a gap stage is now recorded as NOT_REACHED / ENVIRONMENT_FAILURE
only if its `stage_number` is *at or above* the highest stage_number this
run confirmed as PASS. Gap stages *below* that watermark are recorded as
PASS with `driver_behavior` explicitly noting they were auto-advanced and
not independently observed as their own driver iteration — the evidence for
this classification is the later confirmed PASS itself (reaching stage N
is only possible by first passing through stage N-1).

**Consequence for the evidence package:** the Chromium evaluation was
re-run in full after this fix, and only the post-fix run is included under
`evidence/chromium/final/`. This fix was applied *before* any run was
accepted as final, not as a browser-specific exception to an already-frozen
result set — it does not reopen the freeze declared above.

---

## Browser-specific exceptions

*(None as of this changelog. Any exception required for Firefox or WebKit
will be appended here with its own dated heading, the exact value changed,
and the evidence that made it necessary — never a silent edit to the frozen
values in Section 5.)*
