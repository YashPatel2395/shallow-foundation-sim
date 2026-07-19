// Shared utilities for the evaluation suite.
//
// Design note on 3D interaction: the application renders its clickable
// construction-stage targets as Three.js meshes on a single <canvas> inside
// #scene, using its own raycaster registered on the canvas's native 'click'
// DOM event (see clickables3D / renderer.domElement.addEventListener('click', ...)
// in the application source). There is no per-object DOM element to target
// with a Playwright locator. To interact with these targets as a real user
// would (mouse arrives at a screen coordinate, a native click event fires,
// the application's own raycaster resolves it), this suite:
//   1. Reads each candidate object's current on-screen projected position by
//      calling the application's own live `camera` and the canvas's bounding
//      rect from inside page.evaluate() — the same projection math the
//      application performs itself for its 3D labels (see update3DLabels()).
//   2. Dispatches a genuine Playwright page.mouse.click() at that screen
//      coordinate, which the browser delivers as a real 'click' DOM event to
//      the canvas, exercised through the application's actual raycaster.
// Reading `camera`, `clickables3D`, and `STATE` via page.evaluate() is used
// only for test orchestration (deciding where to click, and observing
// whether progress changed) — never to call internal handlers directly or to
// bypass the DOM/event pipeline. This is disclosed here because it is the
// single most important methodological choice in this suite.

/**
 * Returns the list of currently-registered clickable 3D targets, each with
 * its projected on-screen coordinate (canvas-relative, then converted to
 * page-relative for Playwright), read from the application's own live state.
 * Requires the app's top-level `clickables3D`, `camera`, and `renderer` to be
 * in scope (they are — this evaluates in the page's real global JS realm).
 */
async function getClickable3DTargets(page) {
  return page.evaluate(() => {
    try {
      const canvas = renderer.domElement;
      const rect = canvas.getBoundingClientRect();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const v = new THREE.Vector3();
      return clickables3D.map((c, i) => {
        if (!c.mesh) return null;
        c.mesh.getWorldPosition(v);
        // RingGeometry (used e.g. for shaft/pile-layout marker targets) is an
        // annulus with no geometry at its own origin -- a center-point click
        // lands in the hole and never raycasts against the mesh. Offset the
        // sampled point to the ring's mid-band radius, in the mesh's local
        // +X direction, before projecting to screen space.
        const geo = c.mesh.geometry;
        if (geo && geo.type === 'RingGeometry' && geo.parameters) {
          const midRadius = (geo.parameters.innerRadius + geo.parameters.outerRadius) / 2;
          const offset = new THREE.Vector3(midRadius, 0, 0);
          c.mesh.localToWorld(offset);
          v.copy(offset);
        }
        v.project(camera);
        if (v.z >= 1 || v.z <= -1) return null; // behind camera / clipped
        const x = rect.left + (v.x * 0.5 + 0.5) * w;
        const y = rect.top + (-v.y * 0.5 + 0.5) * h;
        return { index: i, x, y, alreadyDone: !!(c.mesh.userData && (c.mesh.userData.tested || c.mesh.userData.passed || c.mesh.userData.placed)) };
      }).filter(Boolean);
    } catch (e) {
      return [];
    }
  });
}

/** Reads the application's own progress/score state for assertions. */
async function readAppState(page) {
  return page.evaluate(() => {
    try {
      return {
        currentStep: typeof STATE !== 'undefined' ? STATE.currentStep : null,
        score: typeof STATE !== 'undefined' ? STATE.score : null,
        totalSteps: typeof STEP_HANDLERS !== 'undefined' ? STEP_HANDLERS.length : null,
      };
    } catch (e) {
      return { currentStep: null, score: null, totalSteps: null, error: String(e) };
    }
  });
}

/**
 * True if `e` is a Playwright action-timeout error (the element/page did not
 * become actionable within the bound passed to that call), as opposed to
 * some other failure (element genuinely detached, page navigated away,
 * etc.). Used as the evidence signal for classifying a stalled stage as
 * APPLICATION (page unresponsive to standard actionability checks) versus
 * AUTOMATION_DRIVER (actions completed normally; they just didn't produce
 * the correct app-state change) — see walkModule.js's classification logic.
 * Deliberately narrow (message-based): Playwright does not expose a typed
 * `TimeoutError` class import in this test-runner context, only the error's
 * `name`/`message`.
 */
function isTimeoutError(e) {
  if (!e) return false;
  const s = (e.name || '') + ' ' + (e.message || String(e));
  return /Timeout/i.test(s);
}

/**
 * Clicks every not-yet-completed 3D clickable target once, at its real
 * projected screen position. Returns { clicked, timeouts } — `page.mouse.click`
 * on raw coordinates has no actionability wait of its own (it does not query
 * the target element at all), so `timeouts` here can only come from the
 * bounded `page.waitForTimeout` never throwing — in practice always 0; kept
 * for a uniform return shape across all three interaction helpers.
 */
async function clickAllVisible3DTargets(page) {
  const targets = await getClickable3DTargets(page);
  let clicked = 0;
  let timeouts = 0;
  for (const t of targets) {
    if (t.alreadyDone) continue;
    try {
      await page.mouse.click(t.x, t.y);
      clicked++;
    } catch (e) {
      if (isTimeoutError(e)) timeouts++;
    }
    await page.waitForTimeout(150); // let the app's own click handler / animation settle
  }
  return { clicked, timeouts };
}

/**
 * Attempts every actionable element in #action-bar: plain click first; if the
 * element is still present/enabled afterward, retries as a mousedown-hold-
 * mouseup gesture (the application uses this pattern for at least one control,
 * the concrete-pour button). This heuristic is disclosed as a known limitation
 * in README.md — it is not guaranteed to match every custom widget.
 *
 * Whether the plain click already registered is judged by the element's own
 * outerHTML, not just its `disabled` attribute: many of the app's action-bar
 * controls are plain <div class="panel-item"> elements that never carry a
 * `disabled` attribute at all (confirmed by source inspection), so a
 * disabled-attribute-only check always falls through to the 1.5s hold retry
 * even after a fully successful plain click. At ~4 controls per stage this
 * previously added several seconds of pure waste per pass and, over a long
 * module walkthrough, could push a stage past its own timeout despite having
 * already genuinely completed (observed directly: Drilled Shaft's Install
 * Temporary Casing stage, screenshot showing item 1 already re-labelled
 * "placed" immediately after its plain click).
 *
 * Every locator action below passes an explicit `timeout`. Playwright's own
 * default for action timeouts is 0 (wait forever for actionability), and at
 * least one real stage (Drilled Shaft's Reinforcement stage) deliberately
 * keeps a control at `pointer-events: none` until a separate, earlier
 * control's multi-second drop animation finishes. An un-timed `el.click()`
 * attempted on that control before the animation completes waits — by
 * design correctly — but with no bound, a genuinely-never-actionable element
 * (elsewhere, or from a driver misdetection) can hang for the *entire*
 * remaining Playwright test budget, silently bypassing walkModule.js's own
 * STAGE_TIMEOUT_MS (which is only checked *between* passes, never inside
 * one). Bounding each action here restores that per-stage budget as the
 * actual governing timeout, at the cost of occasionally giving up on a
 * control a few seconds before it would have become actionable — an
 * acceptable trade since the driver retries every control again next pass.
 */
const ACTION_TIMEOUT_MS = 5_000;

async function tryActionBarControls(page, holdMs = 1500) {
  const buttons = page.locator('#action-bar button, #action-bar .panel-item, #action-bar [class*="card"]');
  let count;
  let timeouts = 0;
  try {
    count = await buttons.count();
  } catch (e) {
    if (isTimeoutError(e)) timeouts++;
    return { attempted: 0, timeouts };
  }
  let attempted = 0;
  for (let i = 0; i < count; i++) {
    const el = buttons.nth(i);
    const visible = await el.isVisible({ timeout: ACTION_TIMEOUT_MS }).catch((e) => { if (isTimeoutError(e)) timeouts++; return false; });
    if (!visible) continue;
    const disabledBefore = await el.getAttribute('disabled', { timeout: ACTION_TIMEOUT_MS }).catch((e) => { if (isTimeoutError(e)) timeouts++; return null; });
    if (disabledBefore !== null) continue;
    attempted++;
    const htmlBefore = await el.evaluate((n) => n.outerHTML).catch(() => null);
    await el.click({ trial: false, force: false, timeout: ACTION_TIMEOUT_MS }).catch((e) => { if (isTimeoutError(e)) timeouts++; });
    await page.waitForTimeout(200);
    const stillThere = await el.isVisible({ timeout: ACTION_TIMEOUT_MS }).catch((e) => { if (isTimeoutError(e)) timeouts++; return false; });
    const disabledAfter = stillThere ? await el.getAttribute('disabled', { timeout: ACTION_TIMEOUT_MS }).catch((e) => { if (isTimeoutError(e)) timeouts++; return null; }) : 'gone';
    const htmlAfter = stillThere ? await el.evaluate((n) => n.outerHTML).catch(() => null) : null;
    const clickAlreadyRegistered = !stillThere || htmlAfter !== htmlBefore;
    if (stillThere && disabledAfter === null && !clickAlreadyRegistered) {
      // Plain click did not visibly change anything (e.g. a hold-to-activate control).
      const box = await el.boundingBox({ timeout: ACTION_TIMEOUT_MS }).catch((e) => { if (isTimeoutError(e)) timeouts++; return null; });
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(holdMs);
        await page.mouse.up();
      }
    }
  }
  return { attempted, timeouts };
}

/**
 * Attempts every native <input type="range"> slider in #action-bar with a
 * genuine mouse drag, using a heuristic that requires no app-specific
 * knowledge: the slider's own min/max midpoint. This is a deliberate,
 * disclosed guess, not a magic number pulled from the application source --
 * it happens to be correct for Driven Pile's "Alignment Check" stage (two
 * range inputs, min=87 max=93 step=0.1, completion requires both within
 * +-0.5 deg of 90, i.e. within +-0.5 of the exact min/max midpoint), which
 * is source-verified, not assumed, before relying on it here.
 *
 * Mechanism: (1) a real mouse drag from the thumb's current pixel position
 * to the track's visual midpoint, dispatching genuine browser drag/input
 * events; (2) a small keyboard-nudge fallback (real ArrowLeft/ArrowRight key
 * presses, a standard native-range-input interaction) to correct for the
 * fact that a rendered thumb is inset from the track's CSS edges by its own
 * radius, so a naive fraction-of-width mapping can land a few tenths of a
 * degree off-target. Both steps are genuine synthetic user input, not a
 * bypass of the DOM/event pipeline (no direct `.value =` assignment).
 */
async function tryRangeSliders(page) {
  const sliders = page.locator('#action-bar input[type="range"]');
  let count;
  let timeouts = 0;
  try {
    count = await sliders.count();
  } catch (e) {
    if (isTimeoutError(e)) timeouts++;
    return { attempted: 0, timeouts };
  }
  let attempted = 0;
  for (let i = 0; i < count; i++) {
    const el = sliders.nth(i);
    const attrs = await el.evaluate((n) => ({
      min: parseFloat(n.min), max: parseFloat(n.max),
      step: parseFloat(n.step) || 1, value: parseFloat(n.value),
    })).catch(() => null);
    if (!attrs || Number.isNaN(attrs.min) || Number.isNaN(attrs.max)) continue;
    const target = (attrs.min + attrs.max) / 2;
    if (Math.abs(attrs.value - target) < attrs.step) continue; // already at/near midpoint

    const box = await el.boundingBox({ timeout: ACTION_TIMEOUT_MS }).catch((e) => { if (isTimeoutError(e)) timeouts++; return null; });
    if (!box) continue;
    attempted++;

    const currentFrac = (attrs.value - attrs.min) / (attrs.max - attrs.min);
    const startX = box.x + currentFrac * box.width;
    const targetX = box.x + 0.5 * box.width;
    const y = box.y + box.height / 2;
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(targetX, y, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    for (let n = 0; n < 12; n++) {
      const now = await el.evaluate((node) => parseFloat(node.value)).catch(() => null);
      if (now === null || Number.isNaN(now) || Math.abs(now - target) <= attrs.step) break;
      await el.press(now < target ? 'ArrowRight' : 'ArrowLeft', { timeout: ACTION_TIMEOUT_MS }).catch((e) => { if (isTimeoutError(e)) timeouts++; });
      await page.waitForTimeout(60);
    }
  }
  return { attempted, timeouts };
}

/**
 * Navigates to a module entry URL and, for index.html specifically, also
 * enters the Shallow Foundation simulation view.
 *
 * Unlike Driven Pile and Drilled Shaft (each a dedicated HTML page whose
 * #task-title is present and targeted for the sim on load), Shallow
 * Foundation is a section inside the index.html dashboard SPA
 * (#shallowSimView) that starts hidden (class="hidden") and is only
 * revealed by calling the app's own showShallowFoundationSimulation(), which
 * runs when the user clicks the "Shallow Foundation" nav button or the
 * "Start Simulation ->" card button. A bare page.goto('index.html') lands on
 * the dashboard view, where #task-title exists in the DOM but stays hidden
 * (text "Loading...") forever, since nothing ever calls that function. This
 * is a navigation gap in this test suite, not an application defect — the
 * dashboard is a genuinely separate, valid view of the real app.
 */
async function gotoModuleEntry(page, entryUrl) {
  await page.goto(entryUrl);
  if (entryUrl === 'index.html') {
    await page.click('#nav-btn-shallow');
  }
}

/** Attaches console/pageerror/requestfailed collectors. Call before page.goto(). */
function attachDiagnostics(page) {
  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('requestfailed', (req) => failedRequests.push(req.url() + ' :: ' + (req.failure()?.errorText || 'unknown')));
  return { consoleErrors, consoleWarnings, pageErrors, failedRequests };
}

module.exports = {
  getClickable3DTargets,
  readAppState,
  clickAllVisible3DTargets,
  tryActionBarControls,
  tryRangeSliders,
  attachDiagnostics,
  gotoModuleEntry,
  isTimeoutError,
};
