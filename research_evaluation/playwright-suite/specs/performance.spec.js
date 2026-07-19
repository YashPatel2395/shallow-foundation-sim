// Performance observations (evaluation brief Phase 6). Measures only what
// browser-exposed APIs actually provide; does not invent values for
// unsupported metrics (e.g. performance.memory / JS heap size is a
// Chromium-only, non-standard API — Firefox and WebKit report "NOT SUPPORTED
// BY BROWSER", not a fabricated number).
const { test } = require('@playwright/test');
const { appendPerformanceResult } = require('../lib/resultWriter');
const { attachDiagnostics, gotoModuleEntry } = require('../lib/testUtils');

const REPRESENTATIVE_STAGES = [
  { entry: 'index.html', module: 'Shallow Foundation', stageId: 'SF-01', stageTitle: 'First stage (low-complexity: site/soil assessment)' },
  { entry: 'driven-pile.html', module: 'Driven Pile Foundation', stageId: 'DP-01', stageTitle: 'First stage (low-complexity: site investigation)' },
  { entry: 'drilled-shaft.html', module: 'Drilled Shaft Foundation', stageId: 'DS-01', stageTitle: 'First stage (low-complexity: site investigation)' },
];

async function sampleFps(page, durationMs = 3000) {
  return page.evaluate((duration) => new Promise((resolve) => {
    const samples = [];
    let last = performance.now();
    let frames = 0;
    const start = last;
    function tick(now) {
      frames++;
      const dt = now - last;
      if (dt > 0) samples.push(1000 / dt);
      last = now;
      if (now - start < duration) {
        requestAnimationFrame(tick);
      } else {
        resolve(samples);
      }
    }
    requestAnimationFrame(tick);
  }), durationMs);
}

for (const rep of REPRESENTATIVE_STAGES) {
  test(`Performance sample — ${rep.module} first stage`, async ({ page }, testInfo) => {
    const browserEngine = testInfo.project.name;
    const diag = attachDiagnostics(page);

    const navStart = Date.now();
    await gotoModuleEntry(page, rep.entry);
    await page.waitForSelector('#task-title', { timeout: 15_000 });
    const pageLoadMs = Date.now() - navStart;

    const nav = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation');
      if (entries && entries[0]) {
        const e = entries[0];
        return { domInteractive: e.domInteractive, loadEventEnd: e.loadEventEnd, startTime: e.startTime };
      }
      return null;
    });
    const timeToInteractiveMs = nav ? Math.round(nav.domInteractive) : null;

    // interaction-response: time from a synthetic click to the app's next visible DOM mutation in #action-bar
    const actionBarBefore = await page.locator('#action-bar').innerHTML().catch(() => '');
    const interactStart = Date.now();
    const canvasBox = await page.locator('#scene canvas').boundingBox().catch(() => null);
    if (canvasBox) {
      await page.mouse.click(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    }
    await page.waitForTimeout(300);
    const interactionResponseMs = Date.now() - interactStart;

    const fpsSamples = await sampleFps(page, 3000).catch(() => []);
    const avgFps = fpsSamples.length ? (fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length) : null;
    const minFps = fpsSamples.length ? Math.min(...fpsSamples) : null;
    const maxFps = fpsSamples.length ? Math.max(...fpsSamples) : null;

    const heap = await page.evaluate(() => {
      if (performance.memory && typeof performance.memory.usedJSHeapSize === 'number') {
        return performance.memory.usedJSHeapSize / (1024 * 1024);
      }
      return null;
    });

    appendPerformanceResult({
      measurement_id: `${rep.stageId}_${browserEngine}_perf`,
      module: rep.module,
      stage_id: rep.stageId,
      stage_title: rep.stageTitle,
      browser_engine: browserEngine,
      run_number: 1,
      page_load_ms: pageLoadMs,
      module_load_ms: pageLoadMs,
      time_to_interactive_ms: timeToInteractiveMs ?? 'NOT SUPPORTED BY BROWSER',
      average_fps: avgFps !== null ? avgFps.toFixed(1) : 'MEASUREMENT FAILED',
      minimum_fps: minFps !== null ? minFps.toFixed(1) : 'MEASUREMENT FAILED',
      maximum_fps: maxFps !== null ? maxFps.toFixed(1) : 'MEASUREMENT FAILED',
      interaction_response_ms: interactionResponseMs,
      heap_memory_mb: heap !== null ? heap.toFixed(1) : 'NOT SUPPORTED BY BROWSER',
      failed_requests: diag.failedRequests.length,
      console_warnings: diag.consoleWarnings.length,
      console_errors: diag.consoleErrors.length,
      measurement_method: 'page_load_ms via Date.now() delta around page.goto(); time_to_interactive_ms via PerformanceNavigationTiming.domInteractive; FPS via requestAnimationFrame delta sampling over 3000ms; heap via performance.memory.usedJSHeapSize where supported (Chromium only, non-standard API).',
      limitations: heap === null ? 'JS heap size not exposed by this browser engine (performance.memory is a non-standard, Chromium-only API).' : '',
    });
  });
}
