// Resource-retention metrics collection, added to investigate the
// application-side finding described in walkModule.js (zero .dispose() calls
// across all three simulation files). None of this reads or writes anything
// beyond standard page-context introspection and Chrome DevTools Protocol
// (CDP) session calls; nothing here modifies application behavior.
//
// Three independent signals, each with different browser-engine coverage:
//   1. Three.js's own renderer.info (geometries/textures/programs in GPU
//      memory) -- works in ANY browser engine, since it's plain JS/WebGL
//      introspection the application's own Three.js instance already
//      tracks internally. This is the most direct evidence available
//      without modifying production code: a rising count across stage
//      transitions, with no corresponding drop, is what "objects removed
//      from the scene graph without disposal" looks like from the outside.
//   2. performance.memory.usedJSHeapSize -- Chromium-only, non-standard.
//   3. CDP Performance.getMetrics() -- Chromium-only (Playwright does not
//      expose an equivalent CDP session for Firefox or WebKit).
// Unavailable metrics are reported as null with a reason, never fabricated.

async function readRendererInfo(page) {
  return page.evaluate(() => {
    try {
      if (typeof renderer === 'undefined' || !renderer.info) return { available: false, reason: 'no global `renderer` (Three.js WebGLRenderer) in scope' };
      return {
        available: true,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        programs: renderer.info.programs ? renderer.info.programs.length : null,
      };
    } catch (e) {
      return { available: false, reason: String(e) };
    }
  }).catch((e) => ({ available: false, reason: String(e) }));
}

async function readHeapMB(page) {
  return page.evaluate(() => {
    if (performance.memory && typeof performance.memory.usedJSHeapSize === 'number') {
      return performance.memory.usedJSHeapSize / (1024 * 1024);
    }
    return null;
  }).catch(() => null);
}

/**
 * Opens (or reuses) a CDP session for the page and returns a snapshot of
 * Chromium's own Performance.getMetrics() domain. Returns
 * { available: false, reason } on any non-Chromium engine or failure.
 */
async function readCdpMetrics(page) {
  try {
    const session = await page.context().newCDPSession(page);
    await session.send('Performance.enable');
    const { metrics } = await session.send('Performance.getMetrics');
    await session.detach().catch(() => {});
    const byName = {};
    for (const m of metrics) byName[m.name] = m.value;
    return {
      available: true,
      jsHeapUsedSizeMB: byName.JSHeapUsedSize ? byName.JSHeapUsedSize / (1024 * 1024) : null,
      documents: byName.Documents ?? null,
      nodes: byName.Nodes ?? null,
      jsEventListeners: byName.JSEventListeners ?? null,
      layoutCount: byName.LayoutCount ?? null,
      recalcStyleCount: byName.RecalcStyleCount ?? null,
      taskDurationSec: byName.TaskDuration ?? null,
    };
  } catch (e) {
    return { available: false, reason: 'CDP session unavailable on this engine: ' + String(e.message || e) };
  }
}

async function readAllResourceMetrics(page) {
  const [rendererInfo, heapMB, cdp] = await Promise.all([
    readRendererInfo(page),
    readHeapMB(page),
    readCdpMetrics(page),
  ]);
  return { rendererInfo, heapMB, cdp, sampledAt: new Date().toISOString() };
}

module.exports = { readRendererInfo, readHeapMB, readCdpMetrics, readAllResourceMetrics };
