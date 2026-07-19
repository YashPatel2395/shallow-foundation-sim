// Appends real evaluation rows, in the exact schema required by the
// evaluation brief, to CSV files in research_evaluation/. Used only when this
// suite is actually executed (it was not executed in the environment this
// suite was authored in — see ../test_environment.md). Running the suite for
// real overwrites the NOT TESTABLE placeholder rows for the corresponding
// browser engine with genuine, timestamped results.
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, '..', '..');

const FUNCTIONAL_COLUMNS = [
  'test_id','stage_id','module','stage_number','stage_title','browser_engine','run_number',
  'test_date','stage_loaded','instructions_visible','required_objects_visible',
  'correct_interaction_completed','incorrect_action_feedback','progress_updated',
  'next_stage_behavior','object_persistence','camera_controls','reset_behavior',
  'console_errors','network_errors','visual_result','overall_result',
  'observed_behavior','expected_behavior','failure_description','screenshot_path','console_log_path',
  // Added for failure-origin reconciliation (research-evaluation branch,
  // post-live-execution finalization pass). See TEST_HARNESS_CHANGELOG.md.
  'failure_origin','application_behavior','driver_behavior','reached_stage','classification_reason',
];

const MODULE_RUN_COLUMNS = [
  'module_run_id','module','browser_engine','run_number','start_time','end_time',
  'duration_seconds','total_stages','completed_stages','failed_stages',
  'recoverable_errors','unrecoverable_errors','console_error_count','network_error_count',
  'missing_asset_count','reset_success','final_state_reached','overall_result','notes',
  // Continuous-session reliability fields (evaluation brief Section 7).
  'partial_pass_stages','not_reached_stages','environment_failure_stages',
  'last_completed_stage','failure_origin','cpu_avg_percent','cpu_max_percent',
  'renderer_geometries_first','renderer_geometries_last',
  'renderer_textures_first','renderer_textures_last',
  'renderer_programs_first','renderer_programs_last',
  'heap_mb_first','heap_mb_last','screenshot_path','cpu_samples_path',
];

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function appendRow(filePath, columns, rowObj) {
  const exists = fs.existsSync(filePath);
  const line = columns.map((c) => csvEscape(rowObj[c])).join(',') + '\n';
  if (!exists) {
    fs.writeFileSync(filePath, columns.join(',') + '\n' + line);
  } else {
    fs.appendFileSync(filePath, line);
  }
}

function appendFunctionalResult(row) {
  appendRow(path.join(OUT_DIR, 'functional_test_results.executed.csv'), FUNCTIONAL_COLUMNS, row);
}

function appendModuleRunResult(row) {
  appendRow(path.join(OUT_DIR, 'module_run_results.executed.csv'), MODULE_RUN_COLUMNS, row);
}

const PERFORMANCE_COLUMNS = [
  'measurement_id','module','stage_id','stage_title','browser_engine','run_number',
  'page_load_ms','module_load_ms','time_to_interactive_ms','average_fps','minimum_fps',
  'maximum_fps','interaction_response_ms','heap_memory_mb','failed_requests',
  'console_warnings','console_errors','measurement_method','limitations',
];

function appendPerformanceResult(row) {
  appendRow(path.join(OUT_DIR, 'performance_results.executed.csv'), PERFORMANCE_COLUMNS, row);
}

module.exports = {
  appendFunctionalResult, appendModuleRunResult, appendPerformanceResult,
  FUNCTIONAL_COLUMNS, MODULE_RUN_COLUMNS, PERFORMANCE_COLUMNS,
};
