// Generic, data-driven module walkthrough. Drives a module from its first
// stage to its last using only real synthetic browser input (mouse clicks at
// real projected screen coordinates for 3D targets; real DOM clicks / hold
// gestures / drags for action-bar controls — see testUtils.js for the
// methodology note). Records the 14-point per-stage checklist required by
// the evaluation brief and a module_run_results.csv row.
//
// Known limitation (disclosed): this driver is intentionally generic rather
// than hand-scripted per stage. It cannot know in advance which specific
// sequence of interactions a bespoke stage considers "correct" versus merely
// "possible" — it attempts every available interaction once per pass and
// re-checks. For stages with a narrow correct-input window (for example the
// concrete-pour stages, which score full credit only within a specific
// fill-percentage band), this driver will reach a completion state but is
// not guaranteed to reach the *optimal-scoring* completion state. This is
// recorded per-stage in `observed_behavior`, not hidden.
//
// Application-side finding (source-verified; NOT independently confirmed via
// direct GPU-memory measurement — see the classification note below and
// ../functional_evaluation_report.md, Section 7a/7b): all three simulation
// files (script.js, driven-pile.js, drilled-shaft.js) contain zero
// `.dispose()` calls. Their clearScene3D() removes Three.js meshes from the
// scene graph on every stage transition but never frees the underlying
// geometry/material/texture GPU resources, which Three.js requires an
// explicit .dispose() call to release. During continuous testing, some runs
// stopped progressing after prolonged CPU saturation. Together these
// findings are *consistent with* cumulative resource retention across stage
// transitions; this driver does not claim a conclusively proven GPU memory
// leak (no direct GPU memory measurement was taken), and raw process CPU% is
// NOT by itself used to decide APPLICATION vs AUTOMATION_DRIVER below, since
// this evaluation environment renders WebGL in software (SwiftShader) and
// shows high CPU% even during entirely healthy, fast-completing stages
// (verified directly: 600%+ CPU sustained during a normal first-stage load).
// The actual discriminator used is described next.
//
// Failure classification methodology: when a stage does not progress, this
// driver classifies *why* using evidence, not guesswork:
//   - AUTOMATION_DRIVER: the driver found literally nothing to interact with
//     (no 3D targets, no action-bar controls, no range sliders), OR it
//     attempted interactions that completed normally (no actionability
//     timeouts) but produced no observable STATE change -- i.e. the app was
//     responsive, the driver simply did not find the correct input.
//   - APPLICATION: a majority of the interactions attempted during the
//     stage's own timeout window themselves exceeded testUtils.js's
//     ACTION_TIMEOUT_MS waiting for basic actionability (visible, stable,
//     receiving events) -- i.e. the *page itself* was not responding to
//     standard interaction in a normal time window, which points at the
//     application rather than at the driver's choice of target.
// These two are never combined into one bucket, per the evaluation brief.

const {
  getClickable3DTargets, readAppState, clickAllVisible3DTargets,
  tryActionBarControls, tryRangeSliders, attachDiagnostics, gotoModuleEntry,
} = require('./testUtils');
const { readAllResourceMetrics } = require('./resourceMetrics');

// A stage requiring several hold-gesture sub-completions (e.g. drilling 4
// boreholes, each needing a ~3s continuous hold) can legitimately need more
// than a handful of passes: tryActionBarControls's click-then-1.5s-hold
// fallback makes each pass take ~1.7-2s on its own, and multiple
// sub-completions must land inside a single stage's budget before
// completeStep()'s own follow-up delay is even reachable. The prior budget
// (25s / 12 passes) was observed cutting off runs that had genuinely
// reached 100% on-screen (verified via screenshot) a few hundred ms before
// the driver's own loop gave up.
//
// FROZEN as of the harness finalization documented in
// ../TEST_HARNESS_CHANGELOG.md. Do not change between browser engines
// without documenting why there (per the evaluation brief, Section 3).
const STAGE_TIMEOUT_MS = 60_000;
const MAX_PASSES_PER_STAGE = 24;

async function waitForTaskTitle(page) {
  await page.waitForSelector('#task-title', { timeout: 15_000 });
}

function isEnvironmentFailure(e) {
  if (!e) return false;
  const s = (e.name || '') + ' ' + (e.message || String(e));
  return /Target (page|closed|crashed)|Browser has been closed|has been closed|crashed/i.test(s);
}

/**
 * Drives one module end to end.
 * @param {import('@playwright/test').Page} page
 * @param {{entryUrl: string, moduleName: string, stagePrefix: string}} cfg
 * @param {{cpuSampler?: {mark(label:string):void}}} [opts]
 * @returns {Promise<object>} module run summary + per-stage results array
 */
async function walkModule(page, cfg, opts = {}) {
  const diag = attachDiagnostics(page);
  const startTime = new Date();
  const stageResults = [];
  const resourceSamples = [];
  let unrecoverableErrors = 0;
  let recoverableErrors = 0;
  let environmentFailureReason = null;
  let totalStages = null;

  try {
    await gotoModuleEntry(page, cfg.entryUrl);
    await waitForTaskTitle(page);

    const initialState = await readAppState(page);
    totalStages = initialState.totalSteps ?? null;

    let guardIterations = 0;
    const guardLimit = (totalStages ?? 25) + 5;

    while (guardIterations < guardLimit) {
      guardIterations++;
      const stateBefore = await readAppState(page);
      if (stateBefore.currentStep === null) {
        unrecoverableErrors++;
        break;
      }
      const thisStage = stateBefore.currentStep;
      if (opts.cpuSampler) opts.cpuSampler.mark(`${cfg.stagePrefix}-stage${thisStage}-start`);

      const stageStart = Date.now();
      const scoreBefore = stateBefore.score;
      const titleText = await page.locator('#task-title').textContent().catch(() => null);
      const instructionsVisible = !!(titleText && titleText.trim().length > 0 && titleText.trim() !== 'Loading…' && titleText.trim() !== 'Loading...');
      const targetsBefore = await getClickable3DTargets(page);
      const actionBarHtmlBefore = await page.locator('#action-bar').innerHTML().catch(() => '');
      const requiredObjectsVisible = targetsBefore.length > 0 || (actionBarHtmlBefore && actionBarHtmlBefore.trim().length > 0);

      let progressed = false;
      let passes = 0;
      let totalAttempts = 0;
      let totalTimeouts = 0;
      const consoleErrorsAtStageStart = diag.consoleErrors.length;

      while (!progressed && passes < MAX_PASSES_PER_STAGE && (Date.now() - stageStart) < STAGE_TIMEOUT_MS) {
        passes++;
        const r3d = await clickAllVisible3DTargets(page).catch(() => ({ clicked: 0, timeouts: 0 }));
        const rab = await tryActionBarControls(page).catch(() => ({ attempted: 0, timeouts: 0 }));
        const rsl = await tryRangeSliders(page).catch(() => ({ attempted: 0, timeouts: 0 }));
        totalAttempts += (r3d.clicked || 0) + (rab.attempted || 0) + (rsl.attempted || 0);
        totalTimeouts += (r3d.timeouts || 0) + (rab.timeouts || 0) + (rsl.timeouts || 0);
        await page.waitForTimeout(400);
        const stateNow = await readAppState(page);
        if (stateNow.currentStep !== thisStage) {
          progressed = true;
        } else {
          // The *last* stage of a module has nothing further for
          // STATE.currentStep to advance to -- its completion is signaled by
          // the result overlay instead. Checking this here (not only after
          // the loop) avoids misrecording a genuinely-complete final stage
          // as FAIL merely because currentStep never changes for it.
          const overlayVisible = await page.locator('#result-overlay').isVisible().catch(() => false);
          if (overlayVisible) progressed = true;
        }
      }

      const stateAfter = await readAppState(page);
      const scoreAfter = stateAfter.score;
      const resMetrics = await readAllResourceMetrics(page).catch(() => null);
      if (resMetrics) resourceSamples.push({ stage: thisStage, ...resMetrics });

      let overallResult;
      let failureOrigin;
      let classificationReason;
      const timeoutRatio = totalAttempts > 0 ? totalTimeouts / totalAttempts : (totalTimeouts > 0 ? 1 : 0);

      if (progressed) {
        overallResult = 'PASS';
        failureOrigin = 'NONE';
        classificationReason = `STATE.currentStep advanced from ${thisStage} to ${stateAfter.currentStep} (or the module completion overlay became visible) after ${passes} interaction pass(es).`;
      } else if (totalAttempts === 0 && totalTimeouts === 0) {
        overallResult = 'FAIL';
        failureOrigin = 'AUTOMATION_DRIVER';
        classificationReason = 'No clickable 3D targets, action-bar controls, or range sliders were found for this stage within the stage timeout; the driver had no interaction to attempt.';
      } else if (timeoutRatio >= 0.5) {
        overallResult = 'FAIL';
        failureOrigin = 'APPLICATION';
        classificationReason = `${totalTimeouts} of ${totalAttempts} attempted actions exceeded their actionability timeout (page did not become interactable in time), indicating the page itself was unresponsive rather than the driver targeting the wrong element. Source inspection found scene objects removed without explicit Three.js disposal; this is consistent with, but not independently confirmed as, cumulative resource retention. See classification methodology note at the top of this file.`;
      } else if (scoreAfter !== null && scoreBefore !== null && scoreAfter !== scoreBefore) {
        overallResult = 'PARTIAL PASS';
        failureOrigin = 'AUTOMATION_DRIVER';
        classificationReason = `Driver attempted ${totalAttempts} interaction(s) (0 actionability timeouts) and observed partial progress (STATE.score changed from ${scoreBefore} to ${scoreAfter}), but STATE.currentStep did not advance within the ${STAGE_TIMEOUT_MS}ms stage timeout.`;
      } else {
        overallResult = 'FAIL';
        failureOrigin = 'AUTOMATION_DRIVER';
        classificationReason = `Driver attempted ${totalAttempts} interaction(s) with no actionability timeouts and no observed STATE.score change; the correct interaction for this stage was not identified by the generic driver.`;
      }

      if (overallResult !== 'PASS') unrecoverableErrors++;

      stageResults.push({
        stage_number: thisStage,
        module: cfg.moduleName,
        stage_loaded: 'YES',
        instructions_visible: instructionsVisible ? 'YES' : 'NO',
        required_objects_visible: requiredObjectsVisible ? 'YES' : 'NO',
        correct_interaction_completed: progressed ? 'YES' : 'NOT CONFIRMED',
        progress_updated: progressed ? 'YES' : 'NO',
        console_errors_during_stage: diag.consoleErrors.length - consoleErrorsAtStageStart,
        overall_result: overallResult,
        passes_attempted: passes,
        failure_origin: failureOrigin,
        application_behavior: progressed
          ? `STATE.score ${scoreBefore} -> ${scoreAfter}; currentStep advanced (or overlay shown).`
          : `STATE.score ${scoreBefore} -> ${scoreAfter}; currentStep unchanged at ${thisStage}.`,
        driver_behavior: `${totalAttempts} interaction attempt(s) across ${passes} pass(es); ${totalTimeouts} hit the actionability timeout.`,
        reached_stage: thisStage,
        classification_reason: classificationReason,
        observed_behavior: progressed
          ? `STATE.currentStep advanced from ${thisStage} to ${stateAfter.currentStep} after ${passes} interaction pass(es).`
          : `STATE.currentStep remained at ${thisStage} after ${passes} interaction pass(es) and a ${STAGE_TIMEOUT_MS}ms timeout; ${classificationReason}`,
      });

      if (overallResult !== 'PASS') break; // cannot proceed further in this module run

      // Reached completion overlay?
      const resultOverlayVisible = await page.locator('#result-overlay').isVisible().catch(() => false);
      if (resultOverlayVisible) break;
    }
  } catch (e) {
    if (isEnvironmentFailure(e)) {
      environmentFailureReason = String(e.message || e);
    } else {
      throw e;
    }
  }

  const endTime = new Date();
  const finalOverlayVisible = await page.locator('#result-overlay').isVisible().catch(() => false);

  // Fill in placeholder rows for any declared stage this run never attempted
  // as its own outer-loop iteration. Two distinct cases, not conflated:
  //
  //   1. AUTO-ADVANCED (recorded as PASS): a gap stage below the highest
  //      stage_number this run actually PASSED. This happens when a stage
  //      requires zero driver interaction and completes automatically
  //      within the SAME wait window as the previous stage's own
  //      completion detection -- the outer loop's next read of
  //      STATE.currentStep already shows it two or more stages ahead, so
  //      the skipped stage never gets its own iteration. The run genuinely
  //      passed through this stage on the way to a later, confirmed PASS;
  //      recording it as NOT_REACHED would be inaccurate (the run did not
  //      end there) and would misclassify a real PASS as an unexplained gap
  //      in the reconciliation accounting.
  //   2. NOT_REACHED / ENVIRONMENT_FAILURE: a gap stage above the highest
  //      PASSED stage_number -- the run genuinely ended before reaching it
  //      (either the driver gave up on an earlier stage, or an
  //      environment-level failure occurred).
  if (totalStages !== null) {
    const attemptedStageNumbers = new Set(stageResults.map((r) => r.stage_number));
    const passedStageNumbers = stageResults.filter((r) => r.overall_result === 'PASS').map((r) => r.stage_number);
    const highestPassed = passedStageNumbers.length ? Math.max(...passedStageNumbers) : -1;
    for (let s = 0; s < totalStages; s++) {
      if (attemptedStageNumbers.has(s)) continue;
      if (s < highestPassed) {
        stageResults.push({
          stage_number: s,
          module: cfg.moduleName,
          stage_loaded: 'YES',
          instructions_visible: 'NOT INDEPENDENTLY OBSERVED',
          required_objects_visible: 'NOT INDEPENDENTLY OBSERVED',
          correct_interaction_completed: 'YES (AUTO-ADVANCED)',
          progress_updated: 'YES',
          console_errors_during_stage: 0,
          overall_result: 'PASS',
          passes_attempted: 0,
          failure_origin: 'NONE',
          application_behavior: 'STATE.currentStep advanced past this stage automatically, with no interaction required, between two outer-loop reads.',
          driver_behavior: 'No interaction was attempted for this specific stage index; it was already behind STATE.currentStep by the time the driver next checked, because it required none.',
          reached_stage: s,
          classification_reason: `This run reached and later confirmed-passed stage ${highestPassed}, which is only possible by advancing through stage ${s} first; recorded as PASS (auto-advanced) rather than NOT_REACHED.`,
          observed_behavior: `Stage ${s} was not independently observed as its own driver iteration, but the run's confirmed progress to stage ${highestPassed} proves it was reached and passed automatically.`,
        });
        continue;
      }
      const isEnvFailure = environmentFailureReason !== null;
      stageResults.push({
        stage_number: s,
        module: cfg.moduleName,
        stage_loaded: 'NO',
        instructions_visible: 'NOT REACHED',
        required_objects_visible: 'NOT REACHED',
        correct_interaction_completed: 'NOT REACHED',
        progress_updated: 'NOT REACHED',
        console_errors_during_stage: 0,
        overall_result: isEnvFailure ? 'ENVIRONMENT FAILURE' : 'NOT REACHED',
        passes_attempted: 0,
        failure_origin: isEnvFailure ? 'TEST_ENVIRONMENT' : 'NONE',
        application_behavior: 'NOT REACHED — this run ended before this stage was entered.',
        driver_behavior: isEnvFailure
          ? `Run terminated by an environment-level failure: ${environmentFailureReason}`
          : 'NOT REACHED — no interaction was attempted for this stage in this run.',
        reached_stage: null,
        classification_reason: isEnvFailure
          ? `Environment-level failure ended the run before this stage: ${environmentFailureReason}`
          : 'This run ended at an earlier stage; this stage was never attempted.',
        observed_behavior: isEnvFailure ? `Environment failure: ${environmentFailureReason}` : 'Not reached in this run.',
      });
    }
    stageResults.sort((a, b) => a.stage_number - b.stage_number);
  }

  return {
    moduleName: cfg.moduleName,
    startTime,
    endTime,
    durationSeconds: (endTime - startTime) / 1000,
    totalStages,
    completedStages: stageResults.filter((r) => r.overall_result === 'PASS').length,
    failedStages: stageResults.filter((r) => r.overall_result === 'FAIL').length,
    partialStages: stageResults.filter((r) => r.overall_result === 'PARTIAL PASS').length,
    notReachedStages: stageResults.filter((r) => r.overall_result === 'NOT REACHED').length,
    environmentFailureStages: stageResults.filter((r) => r.overall_result === 'ENVIRONMENT FAILURE').length,
    recoverableErrors,
    unrecoverableErrors,
    environmentFailureReason,
    consoleErrorCount: diag.consoleErrors.length,
    networkErrorCount: diag.failedRequests.length,
    finalStateReached: finalOverlayVisible,
    stageResults,
    resourceSamples,
    diag,
  };
}

module.exports = { walkModule };
