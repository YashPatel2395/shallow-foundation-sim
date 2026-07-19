#!/usr/bin/env python3
"""
Generates the placeholder result matrices required by the evaluation brief
(functional_test_results.csv, module_run_results.csv, browser_compatibility.csv,
performance_results.csv, error_log.csv) for every stage x browser-engine x run
combination that was PLANNED but could not be executed in this environment.

This script does not fabricate PASS/FAIL outcomes. Every row's overall_result
is NOT TESTABLE (Chromium — a launch was directly attempted and failed; see
../logs/chromium_launch_attempt.log) or NOT TESTED (Firefox, WebKit — no
launch was attempted because the binaries were unavailable and the identical
root cause was already established for Chromium). See ../test_environment.md
for the full evidence chain.

Run manually:
    python3 generate_result_matrices.py

Requires ../stage_inventory.csv to already exist.
"""
import csv
import os
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # research_evaluation/

STAGE_INVENTORY = os.path.join(ROOT, "stage_inventory.csv")

BROWSER_ENGINES = ["chromium", "firefox", "webkit"]
RUNS_PER_ENGINE = 3

CHROMIUM_REASON = (
    "NOT TESTABLE — a real launch of the locally cached Chromium binary via "
    "Playwright was directly attempted and failed at browser process startup "
    "(Mach port rendezvous bootstrap check-in denied by the execution "
    "sandbox: 'bootstrap_check_in ... Permission denied (1100)'). Full "
    "process log: research_evaluation/logs/chromium_launch_attempt.log. "
    "Root cause (socket bind denial) reproduced independently in "
    "research_evaluation/logs/environment_blocker_evidence.log."
)
FIREFOX_WEBKIT_REASON = (
    "NOT TESTED — browser binary not present in this environment's "
    "Playwright cache and could not be installed without outbound network "
    "access that was not verified for the Playwright CDN host. Not attempted "
    "because the Chromium test already established that the identical "
    "OS-level IPC restriction (Mach port bootstrap / socket bind denial, "
    "engine-independent) prevents any browser process from starting here. "
    "See research_evaluation/test_environment.md."
)


def reason_for(engine):
    return CHROMIUM_REASON if engine == "chromium" else FIREFOX_WEBKIT_REASON


def overall_for(engine):
    return "NOT TESTABLE" if engine == "chromium" else "NOT TESTED"


def load_stages():
    if not os.path.exists(STAGE_INVENTORY):
        print(f"ERROR: {STAGE_INVENTORY} does not exist yet. Run stage inventory extraction first.", file=sys.stderr)
        sys.exit(1)
    with open(STAGE_INVENTORY, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path, fieldnames, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"wrote {path} ({len(rows)} rows)")


def build_functional_results(stages):
    fieldnames = [
        "test_id", "stage_id", "module", "stage_number", "stage_title", "browser_engine",
        "run_number", "test_date", "stage_loaded", "instructions_visible",
        "required_objects_visible", "correct_interaction_completed", "incorrect_action_feedback",
        "progress_updated", "next_stage_behavior", "object_persistence", "camera_controls",
        "reset_behavior", "console_errors", "network_errors", "visual_result", "overall_result",
        "observed_behavior", "expected_behavior", "failure_description", "screenshot_path",
        "console_log_path",
    ]
    now = datetime.now(timezone.utc).isoformat()
    rows = []
    for s in stages:
        for engine in BROWSER_ENGINES:
            for run in range(1, RUNS_PER_ENGINE + 1):
                reason = reason_for(engine)
                rows.append({
                    "test_id": f"{s['stage_id']}_{engine}_run{run}",
                    "stage_id": s["stage_id"],
                    "module": s["module"],
                    "stage_number": s["stage_number"],
                    "stage_title": s["stage_title"],
                    "browser_engine": engine,
                    "run_number": run,
                    "test_date": now,
                    "stage_loaded": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "instructions_visible": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "required_objects_visible": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "correct_interaction_completed": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "incorrect_action_feedback": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "progress_updated": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "next_stage_behavior": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "object_persistence": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "camera_controls": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "reset_behavior": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "console_errors": "",
                    "network_errors": "",
                    "visual_result": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "overall_result": overall_for(engine),
                    "observed_behavior": "No browser session was established; no in-application behavior was observed.",
                    "expected_behavior": "Per stage_inventory.csv: " + s.get("completion_condition", ""),
                    "failure_description": reason,
                    "screenshot_path": "",
                    "console_log_path": "",
                })
    write_csv(os.path.join(ROOT, "functional_test_results.csv"), fieldnames, rows)


def build_module_run_results(stages):
    fieldnames = [
        "module_run_id", "module", "browser_engine", "run_number", "start_time", "end_time",
        "duration_seconds", "total_stages", "completed_stages", "failed_stages",
        "recoverable_errors", "unrecoverable_errors", "console_error_count", "network_error_count",
        "missing_asset_count", "reset_success", "final_state_reached", "overall_result", "notes",
    ]
    modules = {}
    for s in stages:
        modules.setdefault(s["module"], []).append(s)
    now = datetime.now(timezone.utc).isoformat()
    rows = []
    for module, mstages in modules.items():
        prefix = mstages[0]["stage_id"].split("-")[0]
        for engine in BROWSER_ENGINES:
            for run in range(1, RUNS_PER_ENGINE + 1):
                rows.append({
                    "module_run_id": f"{prefix}_{engine}_run{run}",
                    "module": module,
                    "browser_engine": engine,
                    "run_number": run,
                    "start_time": "",
                    "end_time": "",
                    "duration_seconds": "",
                    "total_stages": len(mstages),
                    "completed_stages": 0,
                    "failed_stages": 0,
                    "recoverable_errors": 0,
                    "unrecoverable_errors": 0,
                    "console_error_count": "",
                    "network_error_count": "",
                    "missing_asset_count": "",
                    "reset_success": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "final_state_reached": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
                    "overall_result": overall_for(engine),
                    "notes": reason_for(engine),
                })
    write_csv(os.path.join(ROOT, "module_run_results.csv"), fieldnames, rows)


def build_browser_compatibility(stages):
    fieldnames = [
        "browser_engine", "application_loaded", "shallow_module_completed",
        "driven_pile_module_completed", "drilled_shaft_module_completed",
        "camera_controls_worked", "reset_worked", "missing_assets", "console_error_count",
        "network_error_count", "visual_defects", "major_failures", "overall_compatibility",
    ]
    rows = []
    for engine in BROWSER_ENGINES:
        rows.append({
            "browser_engine": engine,
            "application_loaded": "NO — browser process failed to start" if engine == "chromium" else "NOT TESTED",
            "shallow_module_completed": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
            "driven_pile_module_completed": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
            "drilled_shaft_module_completed": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
            "camera_controls_worked": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
            "reset_worked": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
            "missing_assets": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
            "console_error_count": "",
            "network_error_count": "",
            "visual_defects": "NOT TESTABLE" if engine == "chromium" else "NOT TESTED",
            "major_failures": (
                "Browser process could not be launched in this execution environment (see logs)."
                if engine == "chromium" else
                "Not attempted (binary unavailable; identical root cause pre-confirmed on Chromium)."
            ),
            "overall_compatibility": "NOT TESTED",
        })
    write_csv(os.path.join(ROOT, "browser_compatibility.csv"), fieldnames, rows)


def build_performance_results(stages):
    fieldnames = [
        "measurement_id", "module", "stage_id", "stage_title", "browser_engine", "run_number",
        "page_load_ms", "module_load_ms", "time_to_interactive_ms", "average_fps", "minimum_fps",
        "maximum_fps", "interaction_response_ms", "heap_memory_mb", "failed_requests",
        "console_warnings", "console_errors", "measurement_method", "limitations",
    ]
    # One representative stage per module (first stage) x engine, per the brief's minimum ask.
    modules_first_stage = {}
    for s in stages:
        modules_first_stage.setdefault(s["module"], s)  # first occurrence = stage 1
    rows = []
    for module, s in modules_first_stage.items():
        for engine in BROWSER_ENGINES:
            rows.append({
                "measurement_id": f"{s['stage_id']}_{engine}_perf",
                "module": module,
                "stage_id": s["stage_id"],
                "stage_title": s["stage_title"],
                "browser_engine": engine,
                "run_number": 1,
                "page_load_ms": "", "module_load_ms": "", "time_to_interactive_ms": "",
                "average_fps": "", "minimum_fps": "", "maximum_fps": "",
                "interaction_response_ms": "", "heap_memory_mb": "", "failed_requests": "",
                "console_warnings": "", "console_errors": "",
                "measurement_method": "No measurement was taken — no browser session could be established.",
                "limitations": reason_for(engine),
            })
    write_csv(os.path.join(ROOT, "performance_results.csv"), fieldnames, rows)


def build_error_log():
    fieldnames = [
        "error_id", "module", "stage_id", "browser_engine", "run_number", "error_type",
        "severity", "message", "source", "reproducible", "reproduction_steps",
        "effect_on_completion", "screenshot_path", "log_path",
    ]
    rows = [
        {
            "error_id": "ENV-001",
            "module": "N/A (environment-level, not application-level)",
            "stage_id": "",
            "browser_engine": "chromium",
            "run_number": "",
            "error_type": "Browser launch failure",
            "severity": "CRITICAL",
            "message": (
                "FATAL:base/apple/mach_port_rendezvous_mac.cc:159] Check failed: kr == "
                "KERN_SUCCESS. bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer."
                "<pid>: Permission denied (1100)"
            ),
            "source": "Playwright-launched Chromium process (chrome-headless-shell), not the application under test",
            "reproducible": "YES — reproduced twice, consistent failure",
            "reproduction_steps": (
                "1. playwright.sync_api.sync_playwright().chromium.launch(headless=True, "
                "args=['--no-sandbox']). 2. Observe process crash at startup before any page "
                "navigation occurs."
            ),
            "effect_on_completion": "Blocks all live functional/compatibility/performance testing (Phases 3-8) in this environment.",
            "screenshot_path": "",
            "log_path": "research_evaluation/logs/chromium_launch_attempt.log",
        },
        {
            "error_id": "ENV-002",
            "module": "N/A (environment-level, not application-level)",
            "stage_id": "",
            "browser_engine": "N/A",
            "run_number": "",
            "error_type": "Socket bind denial",
            "severity": "CRITICAL",
            "message": "PermissionError: [Errno 1] Operation not permitted at socket.bind() for both AF_INET and AF_UNIX sockets.",
            "source": "Python socket module / http.server, invoked directly as a diagnostic (not part of the application)",
            "reproducible": "YES — reproduced for TCP bind, Unix-domain bind, and python3 -m http.server",
            "reproduction_steps": "See research_evaluation/logs/environment_blocker_evidence.log for exact commands and output.",
            "effect_on_completion": "Root cause of ENV-001; also prevents hosting the application via a local HTTP server for testing.",
            "screenshot_path": "",
            "log_path": "research_evaluation/logs/environment_blocker_evidence.log",
        },
    ]
    write_csv(os.path.join(ROOT, "error_log.csv"), fieldnames, rows)
    print("NOTE: error_log.csv contains only environment-level blockers encountered while "
          "attempting to set up testing. No application-level runtime errors are recorded, "
          "because no application code was ever executed in a browser in this environment. "
          "This is not evidence of an error-free application — it is an absence of observation, "
          "reported as such throughout this evaluation package.")


def main():
    stages = load_stages()
    print(f"Loaded {len(stages)} stages from {STAGE_INVENTORY}")
    build_functional_results(stages)
    build_module_run_results(stages)
    build_browser_compatibility(stages)
    build_performance_results(stages)
    build_error_log()


if __name__ == "__main__":
    main()
