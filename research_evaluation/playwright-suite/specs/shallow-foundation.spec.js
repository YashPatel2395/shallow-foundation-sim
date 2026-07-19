const { test, expect } = require('@playwright/test');
const { walkModule } = require('../lib/walkModule');
const { appendModuleRunResult, appendFunctionalResult } = require('../lib/resultWriter');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SCREENSHOT_DIR = path.resolve(__dirname, '..', '..', 'screenshots');

const RUNS = [1, 2, 3];

for (const runNumber of RUNS) {
  test(`Shallow Foundation module — full walkthrough (run ${runNumber})`, async ({ page }, testInfo) => {
    const browserEngine = testInfo.project.name;
    const shotDir = path.join(SCREENSHOT_DIR, browserEngine);
    fs.mkdirSync(shotDir, { recursive: true });

    const result = await walkModule(page, {
      entryUrl: 'index.html',
      moduleName: 'Shallow Foundation',
      stagePrefix: 'SF',
    });

    // Dashboard + first-stage evidence (only meaningful if stage 0 was reached)
    if (result.stageResults.length > 0) {
      await page.screenshot({ path: path.join(shotDir, `SF-01_${browserEngine}_run${runNumber}_first_stage.png`), fullPage: true }).catch(() => {});
    }
    if (result.finalStateReached) {
      await page.screenshot({ path: path.join(shotDir, `SF-final_${browserEngine}_run${runNumber}_completed.png`), fullPage: true }).catch(() => {});
    } else {
      await page.screenshot({ path: path.join(shotDir, `SF-incomplete_${browserEngine}_run${runNumber}_failure.png`), fullPage: true }).catch(() => {});
    }

    appendModuleRunResult({
      module_run_id: `SF_${browserEngine}_run${runNumber}`,
      module: 'Shallow Foundation',
      browser_engine: browserEngine,
      run_number: runNumber,
      start_time: result.startTime.toISOString(),
      end_time: result.endTime.toISOString(),
      duration_seconds: result.durationSeconds.toFixed(1),
      total_stages: result.totalStages,
      completed_stages: result.completedStages,
      failed_stages: result.failedStages,
      recoverable_errors: result.recoverableErrors,
      unrecoverable_errors: result.unrecoverableErrors,
      console_error_count: result.consoleErrorCount,
      network_error_count: result.networkErrorCount,
      missing_asset_count: result.networkErrorCount,
      reset_success: 'NOT MEASURED IN THIS RUN',
      final_state_reached: result.finalStateReached ? 'YES' : 'NO',
      overall_result: result.finalStateReached ? 'PASS' : (result.completedStages > 0 ? 'PARTIAL PASS' : 'FAIL'),
      notes: `${result.stageResults.length} stage(s) reached out of ${result.totalStages ?? 'unknown'} declared in STEP_HANDLERS.`,
    });

    result.stageResults.forEach((r, i) => {
      appendFunctionalResult({
        test_id: `SF-${String(i + 1).padStart(2, '0')}_${browserEngine}_run${runNumber}`,
        stage_id: `SF-${String(i + 1).padStart(2, '0')}`,
        module: 'Shallow Foundation',
        stage_number: r.stage_number,
        stage_title: '',
        browser_engine: browserEngine,
        run_number: runNumber,
        test_date: new Date().toISOString(),
        stage_loaded: r.stage_loaded,
        instructions_visible: r.instructions_visible,
        required_objects_visible: r.required_objects_visible,
        correct_interaction_completed: r.correct_interaction_completed,
        incorrect_action_feedback: 'NOT EXERCISED BY GENERIC DRIVER',
        progress_updated: r.progress_updated,
        next_stage_behavior: r.progress_updated === 'YES' ? 'Advanced automatically on completion' : 'Did not advance',
        object_persistence: 'NOT MEASURED IN THIS RUN',
        camera_controls: 'NOT MEASURED IN THIS RUN — see camera-controls.spec.js',
        reset_behavior: 'NOT MEASURED IN THIS RUN',
        console_errors: r.console_errors_during_stage,
        network_errors: '',
        visual_result: 'See screenshot_path',
        overall_result: r.overall_result,
        observed_behavior: r.observed_behavior,
        expected_behavior: 'Stage completes and STATE.currentStep advances after the correct interaction is performed.',
        failure_description: r.overall_result === 'FAIL' ? r.observed_behavior : '',
        screenshot_path: '',
        console_log_path: '',
      });
    });

    expect(result.stageResults.length, 'at least the first stage should have loaded').toBeGreaterThan(0);
  });
}
