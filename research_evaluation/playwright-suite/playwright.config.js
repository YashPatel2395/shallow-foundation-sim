// Isolated evaluation configuration. Not consumed by the application itself.
// The application has no build step and no dev server script, so this suite
// points directly at the static HTML entry points via file:// URLs rather than
// starting a webServer. (In this evaluation's execution environment, local
// socket binding is denied by the sandbox, so a webServer could not be used
// even for local testing — see ../test_environment.md. file:// avoids that
// requirement entirely because the application performs no fetch() calls.)
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

module.exports = defineConfig({
  testDir: './specs',
  // 600s (10 min): a healthy, fully-interactive run of even the longest
  // (15-stage) module completes in ~3-4 minutes (verified directly). This
  // budget is roughly double that as headroom for a slow-but-genuine run,
  // without waiting indefinitely on a run that has hit the GPU-resource-leak
  // hang documented in lib/walkModule.js — once that hang starts, waiting
  // longer does not resolve it (observed: 6.5+ minutes at 620-655% CPU with
  // zero progress), so a bounded ceiling here is a deliberate choice, not an
  // oversight. Runs that exceed this are recorded as TIMEOUT, not silently
  // retried into a longer and longer budget.
  timeout: 600_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // Pinned to 1: running multiple headless-Chromium/WebGL instances
  // concurrently on this machine causes severe CPU/GPU contention that
  // starves the app's own render/interaction loop, which the generic
  // walkModule.js driver then misreads as the app failing to progress
  // (observed: a Shallow Foundation walkthrough that passes in ~13-47s
  // running alone failed under a 180s timeout when run alongside 3 other
  // workers). This is a property of this evaluation environment, not the
  // application — serial execution removes the artifact and is what
  // produced the results in ../functional_evaluation_report.md.
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: '../functional_test_results.raw.json' }],
  ],
  outputDir: '../logs/playwright-artifacts',
  use: {
    baseURL: 'file://' + REPO_ROOT + '/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // The 'Desktop Safari' entry is a Playwright *device descriptor* (viewport,
    // user agent string, touch emulation) — it does not select the Safari
    // browser engine. This project still runs on Playwright's own WebKit
    // build. Report this project's results as "Playwright WebKit", never as
    // "Safari" — see ../test_environment.md and ../functional_evaluation_report.md.
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
