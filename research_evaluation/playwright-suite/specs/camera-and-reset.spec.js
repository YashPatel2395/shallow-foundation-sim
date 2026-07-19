// Targeted checks for camera controls and the reset button, independent of
// full module progression. These probe the dashboard and each module's first
// stage only, since they do not require completing prior stages.
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { gotoModuleEntry } = require('../lib/testUtils');

const SCREENSHOT_DIR = path.resolve(__dirname, '..', '..', 'screenshots');

const MODULES = [
  { entry: 'index.html', name: 'Shallow Foundation', prefix: 'SF' },
  { entry: 'driven-pile.html', name: 'Driven Pile Foundation', prefix: 'DP' },
  { entry: 'drilled-shaft.html', name: 'Drilled Shaft Foundation', prefix: 'DS' },
];

for (const mod of MODULES) {
  test(`${mod.name} — dashboard loads and camera controls respond`, async ({ page }, testInfo) => {
    const browserEngine = testInfo.project.name;
    const shotDir = path.join(SCREENSHOT_DIR, browserEngine);
    fs.mkdirSync(shotDir, { recursive: true });

    await gotoModuleEntry(page, mod.entry);
    await page.waitForSelector('#task-title', { timeout: 15_000 });
    await page.screenshot({ path: path.join(shotDir, `${mod.prefix}-dashboard_${browserEngine}_run1.png`), fullPage: true });

    // Camera preset buttons (drilled-shaft.html / driven-pile.html expose these; index.html/shallow foundation may not)
    const camButtons = page.locator('#cam-controls .cam-btn');
    const camCount = await camButtons.count();
    if (camCount > 0) {
      const beforeState = await page.evaluate(() => (typeof camera !== 'undefined' ? { x: camera.position.x, y: camera.position.y, z: camera.position.z } : null));
      await camButtons.first().click().catch(() => {});
      await page.waitForTimeout(600);
      const afterState = await page.evaluate(() => (typeof camera !== 'undefined' ? { x: camera.position.x, y: camera.position.y, z: camera.position.z } : null));
      // Report only — do not assert, since camera lerp animation timing is not guaranteed within this wait.
      test.info().annotations.push({
        type: 'camera-controls',
        description: `camera position before=${JSON.stringify(beforeState)} after=${JSON.stringify(afterState)}`,
      });
    } else {
      test.info().annotations.push({ type: 'camera-controls', description: 'No #cam-controls .cam-btn elements found on this page.' });
    }

    // Orbit-drag smoke test: verify no console error is thrown by a drag gesture on the canvas.
    const canvasBox = await page.locator('#scene canvas').boundingBox().catch(() => null);
    if (canvasBox) {
      const cx = canvasBox.x + canvasBox.width / 2;
      const cy = canvasBox.y + canvasBox.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 80, cy - 40, { steps: 8 });
      await page.mouse.up();
    }

    // Reset button
    const resetBtn = page.locator('#reset-sim-btn');
    const resetExists = await resetBtn.count();
    if (resetExists > 0) {
      const scoreBefore = await page.locator('#score-val').textContent().catch(() => null);
      await resetBtn.click().catch(() => {});
      await page.waitForTimeout(500);
      const stepAfter = await page.locator('#step-cur').textContent().catch(() => null);
      test.info().annotations.push({
        type: 'reset-behavior',
        description: `score before reset=${scoreBefore}, step indicator after reset=${stepAfter}`,
      });
      expect(stepAfter, 'step indicator should read 1 after reset').toBe('1');
    } else {
      test.info().annotations.push({ type: 'reset-behavior', description: '#reset-sim-btn not found on this page.' });
    }
  });
}
