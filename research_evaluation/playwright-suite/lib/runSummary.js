// Shared aggregation helpers for module_run_results rows, used by all three
// walkthrough specs so the continuous-session reliability fields (evaluation
// brief Section 7) are computed identically everywhere.

function summarizeResourceSamples(resourceSamples) {
  const empty = {
    renderer_geometries_first: null, renderer_geometries_last: null,
    renderer_textures_first: null, renderer_textures_last: null,
    renderer_programs_first: null, renderer_programs_last: null,
    heap_mb_first: null, heap_mb_last: null,
  };
  if (!resourceSamples || resourceSamples.length === 0) return empty;
  const first = resourceSamples[0];
  const last = resourceSamples[resourceSamples.length - 1];
  const g = (s) => (s.rendererInfo && s.rendererInfo.available) ? s.rendererInfo.geometries : null;
  const t = (s) => (s.rendererInfo && s.rendererInfo.available) ? s.rendererInfo.textures : null;
  const p = (s) => (s.rendererInfo && s.rendererInfo.available) ? s.rendererInfo.programs : null;
  const fmtHeap = (v) => (v === null || v === undefined) ? null : Number(v.toFixed(1));
  return {
    renderer_geometries_first: g(first), renderer_geometries_last: g(last),
    renderer_textures_first: t(first), renderer_textures_last: t(last),
    renderer_programs_first: p(first), renderer_programs_last: p(last),
    heap_mb_first: fmtHeap(first.heapMB), heap_mb_last: fmtHeap(last.heapMB),
  };
}

function lastCompletedStage(stageResults) {
  const passed = stageResults.filter((r) => r.overall_result === 'PASS').map((r) => r.stage_number);
  return passed.length ? Math.max(...passed) : null;
}

/** The failure_origin of whatever stage actually stopped this run (NONE if the run fully passed). */
function runFailureOrigin(stageResults) {
  const attempted = stageResults.filter((r) => r.overall_result !== 'NOT REACHED');
  const last = attempted[attempted.length - 1];
  if (!last) return 'NONE';
  return last.overall_result === 'PASS' ? 'NONE' : last.failure_origin;
}

module.exports = { summarizeResourceSamples, lastCompletedStage, runFailureOrigin };
