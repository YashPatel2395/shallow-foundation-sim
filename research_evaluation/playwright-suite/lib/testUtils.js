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

/** Clicks every not-yet-completed 3D clickable target once, at its real projected screen position. */
async function clickAllVisible3DTargets(page) {
  const targets = await getClickable3DTargets(page);
  let clicked = 0;
  for (const t of targets) {
    if (t.alreadyDone) continue;
    await page.mouse.click(t.x, t.y);
    clicked++;
    await page.waitForTimeout(150); // let the app's own click handler / animation settle
  }
  return clicked;
}

/**
 * Attempts every actionable element in #action-bar: plain click first; if the
 * element is still present/enabled afterward, retries as a mousedown-hold-
 * mouseup gesture (the application uses this pattern for at least one control,
 * the concrete-pour button). This heuristic is disclosed as a known limitation
 * in README.md — it is not guaranteed to match every custom widget.
 */
async function tryActionBarControls(page, holdMs = 1500) {
  const buttons = page.locator('#action-bar button, #action-bar .panel-item, #action-bar [class*="card"]');
  const count = await buttons.count();
  let attempted = 0;
  for (let i = 0; i < count; i++) {
    const el = buttons.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    const disabledBefore = await el.getAttribute('disabled').catch(() => null);
    if (disabledBefore !== null) continue;
    attempted++;
    await el.click({ trial: false, force: false }).catch(() => {});
    await page.waitForTimeout(200);
    const stillThere = await el.isVisible().catch(() => false);
    const disabledAfter = stillThere ? await el.getAttribute('disabled').catch(() => null) : 'gone';
    if (stillThere && disabledAfter === null) {
      // Plain click may not have registered (e.g. a hold-to-activate control).
      const box = await el.boundingBox().catch(() => null);
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(holdMs);
        await page.mouse.up();
      }
    }
  }
  return attempted;
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
  attachDiagnostics,
};
