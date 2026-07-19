// Process-level CPU sampling, added to give the FAIL classification logic
// (see resultWriter.js / walkModule.js) direct evidence for distinguishing
// an application-side stall (browser process pegged, unresponsive) from a
// driver-side one (browser responsive; the driver simply found no correct
// interaction). This is Node-side OS process inspection via `ps`, entirely
// external to the browser and to the application under test.
//
// Attribution method: Playwright's Node `Browser` object does not expose a
// `.process()` accessor in this Playwright version (verified directly), so
// exact PID tracking isn't available. Instead this sums %CPU across every
// OS process whose command line contains the Playwright browser cache path
// (`ms-playwright`), which is a safe proxy specifically because this
// evaluation's protocol runs one browser engine at a time, serially
// (`workers: 1` in playwright.config.js) -- there is never more than one
// browser's process tree alive during a sampling window. This would NOT be
// a safe method in a parallel/multi-browser run, and is documented as such.

const { exec } = require('child_process');

function psSnapshot() {
  return new Promise((resolve) => {
    exec("ps -eo pid,%cpu,command", { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      const lines = stdout.split('\n').slice(1);
      const rows = [];
      for (const line of lines) {
        const m = line.trim().match(/^(\d+)\s+([\d.]+)\s+(.*)$/);
        if (!m) continue;
        const [, pid, cpu, command] = m;
        if (command.includes('ms-playwright')) {
          rows.push({ pid: Number(pid), cpuPercent: Number(cpu), command });
        }
      }
      resolve(rows);
    });
  });
}

/**
 * Starts background sampling. Returns a handle: `.samples` (array of
 * {timestampMs, totalCpuPercent, processCount}, growing live), `.stop()`
 * (clears the interval and returns the final samples array), and
 * `.mark(label)` (records a labelled marker, e.g. a stage index, aligned to
 * the nearest sample so post-hoc analysis can attribute CPU load to a
 * specific stage).
 */
function startCpuSampling(intervalMs = 2000) {
  const samples = [];
  const markers = [];
  const timer = setInterval(async () => {
    const rows = await psSnapshot();
    const totalCpuPercent = rows.reduce((sum, r) => sum + r.cpuPercent, 0);
    samples.push({ timestampMs: Date.now(), totalCpuPercent, processCount: rows.length });
  }, intervalMs);
  if (timer.unref) timer.unref();
  return {
    samples,
    markers,
    mark(label) {
      markers.push({ timestampMs: Date.now(), label });
    },
    stop() {
      clearInterval(timer);
      return { samples, markers };
    },
  };
}

/** Summarizes samples within [startMs, endMs) -- used to attribute CPU load to one stage's wall-clock window. */
function summarizeWindow(samples, startMs, endMs) {
  const inWindow = samples.filter((s) => s.timestampMs >= startMs && s.timestampMs < endMs);
  if (inWindow.length === 0) return { sampleCount: 0, avgCpuPercent: null, maxCpuPercent: null };
  const values = inWindow.map((s) => s.totalCpuPercent);
  return {
    sampleCount: inWindow.length,
    avgCpuPercent: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
    maxCpuPercent: Math.round(Math.max(...values) * 10) / 10,
  };
}

module.exports = { startCpuSampling, summarizeWindow, psSnapshot };
