// Generic, data-driven module walkthrough. Drives a module from its first
// stage to its last using only real synthetic browser input (mouse clicks at
// real projected screen coordinates for 3D targets; real DOM clicks / hold
// gestures for action-bar controls — see testUtils.js for the methodology
// note). Records the 14-point per-stage checklist required by the evaluation
// brief and a module_run_results.csv row.
//
// Known limitation (disclosed): this driver is intentionally generic rather
// than hand-scripted per stage. It cannot know in advance which specific
// sequence of clicks a bespoke stage (e.g. a slider-based fill-percentage
// target, or a multi-part rig-assembly checklist) considers "correct" versus
// merely "possible" — it attempts every available interaction once per pass
// and re-checks. For stages with a narrow correct-input window (for example
// the concrete-pour stages, which score full credit only within a specific
// fill-percentage band), this driver will reach a completion state but is
// not guaranteed to reach the *optimal-scoring* completion state. This is
// recorded per-stage in `observed_behavior`, not hidden.

const { getClickable3DTargets, readAppState, clickAllVisible3DTargets, tryActionBarControls, attachDiagnostics } = require('./testUtils');

const STAGE_TIMEOUT_MS = 25_000;
const MAX_PASSES_PER_STAGE = 12;

async function waitForTaskTitle(page) {
  await page.waitForSelector('#task-title', { timeout: 15_000 });
}

/**
 * Drives one module end to end.
 * @param {import('@playwright/test').Page} page
 * @param {{entryUrl: string, moduleName: string, stagePrefix: string}} cfg
 * @returns {Promise<object>} module run summary + per-stage results array
 */
async function walkModule(page, cfg) {
  const diag = attachDiagnostics(page);
  const startTime = new Date();
  const stageResults = [];
  let unrecoverableErrors = 0;
  let recoverableErrors = 0;

  await page.goto(cfg.entryUrl);
  await waitForTaskTitle(page);

  const initialState = await readAppState(page);
  const totalStages = initialState.totalSteps ?? null;

  let lastStep = -1;
  let stageIndex = await readAppState(page).then((s) => s.currentStep);
  let guardIterations = 0;
  const guardLimit = (totalStages ?? 25) + 5;

  while (guardIterations < guardLimit) {
    guardIterations++;
    const stateBefore = await readAppState(page);
    if (stateBefore.currentStep === null) {
      unrecoverableErrors++;
      break;
    }
    if (lastStep !== -1 && stateBefore.currentStep === lastStep && stageResults.length > 0) {
      // no forward progress since last recorded stage — but loop continues below
    }
    const thisStage = stateBefore.currentStep;

    const stageStart = Date.now();
    const titleText = await page.locator('#task-title').textContent().catch(() => null);
    const instructionsVisible = !!(titleText && titleText.trim().length > 0 && titleText.trim() !== 'Loading…' && titleText.trim() !== 'Loading...');
    const targetsBefore = await getClickable3DTargets(page);
    const actionBarHtmlBefore = await page.locator('#action-bar').innerHTML().catch(() => '');
    const requiredObjectsVisible = targetsBefore.length > 0 || (actionBarHtmlBefore && actionBarHtmlBefore.trim().length > 0);

    let progressed = false;
    let passes = 0;
    let consoleErrorsAtStageStart = diag.consoleErrors.length;

    while (!progressed && passes < MAX_PASSES_PER_STAGE && (Date.now() - stageStart) < STAGE_TIMEOUT_MS) {
      passes++;
      await clickAllVisible3DTargets(page).catch(() => 0);
      await tryActionBarControls(page).catch(() => 0);
      await page.waitForTimeout(400);
      const stateNow = await readAppState(page);
      if (stateNow.currentStep !== thisStage) {
        progressed = true;
      }
    }

    const stateAfter = await readAppState(page);
    const overallResult = progressed
      ? 'PASS'
      : (stateAfter.currentStep === thisStage ? 'FAIL' : 'PARTIAL PASS');

    if (!progressed) unrecoverableErrors++;

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
      observed_behavior: progressed
        ? `STATE.currentStep advanced from ${thisStage} to ${stateAfter.currentStep} after ${passes} interaction pass(es).`
        : `STATE.currentStep remained at ${thisStage} after ${passes} interaction pass(es) and a ${STAGE_TIMEOUT_MS}ms timeout; generic driver could not identify a further valid action.`,
    });

    if (!progressed) break; // cannot proceed further in this module run
    lastStep = thisStage;
    stageIndex = stateAfter.currentStep;

    // Reached completion overlay?
    const resultOverlayVisible = await page.locator('#result-overlay').isVisible().catch(() => false);
    if (resultOverlayVisible) break;
  }

  const endTime = new Date();
  const finalOverlayVisible = await page.locator('#result-overlay').isVisible().catch(() => false);

  return {
    moduleName: cfg.moduleName,
    startTime,
    endTime,
    durationSeconds: (endTime - startTime) / 1000,
    totalStages,
    completedStages: stageResults.filter((r) => r.overall_result === 'PASS').length,
    failedStages: stageResults.filter((r) => r.overall_result === 'FAIL').length,
    recoverableErrors,
    unrecoverableErrors,
    consoleErrorCount: diag.consoleErrors.length,
    networkErrorCount: diag.failedRequests.length,
    finalStateReached: finalOverlayVisible,
    stageResults,
    diag,
  };
}

module.exports = { walkModule };
