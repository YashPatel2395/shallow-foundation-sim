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
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
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
