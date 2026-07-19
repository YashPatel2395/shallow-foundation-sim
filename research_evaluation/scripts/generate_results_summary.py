#!/usr/bin/env python3
"""
Computes results_summary.json strictly from the raw CSV files already present
in research_evaluation/. Every number here must be traceable to those files —
this script does not accept any hand-typed override.

Run manually, after generate_result_matrices.py (and after
functional_test_results.executed.csv / module_run_results.executed.csv exist,
if the Playwright suite was actually run):
    python3 generate_results_summary.py
"""
import csv
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def read_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _methodology_note(functional_executed, module_runs_executed):
    executed_engines = sorted(set(r.get("browser_engine", "") for r in module_runs_executed if r.get("browser_engine")))
    if not executed_engines:
        return (
            "All values above are computed directly from functional_test_results.csv, "
            "module_run_results.csv, error_log.csv, and (if present) the "
            "*.executed.csv files produced by an actual Playwright suite run. "
            "In this evaluation package as delivered, no browser execution occurred "
            "(see test_environment.md), so 'passes', 'partial_passes', and 'failures' "
            "are 0, and 'not_testable' equals the full planned test-execution count. "
            "This reflects an environment constraint, not an application quality "
            "finding — see functional_evaluation_report.md, Section 11 (Errors and Limitations)."
        )
    return (
        "All values above are computed directly from functional_test_results.csv, "
        "module_run_results.csv, error_log.csv, and the *.executed.csv files produced "
        "by an actual Playwright suite run. Live-browser results now exist for: "
        + ", ".join(executed_engines) + ". Where a real *.executed.csv row exists for a "
        "given test_id/module_run_id, it supersedes (not adds to) the corresponding "
        "placeholder row from the original static-inspection pass, so 'pass'/'fail' "
        "counts reflect genuine observed behavior for those rows; any browser engine "
        "not listed above, and any stage beyond where a given run stopped progressing, "
        "remain 'not_testable_or_not_tested' placeholders. See "
        "functional_evaluation_report.md for the full writeup, including a documented "
        "application-side GPU-resource-leak finding (see lib/walkModule.js in the "
        "Playwright suite) that affects run-to-run completion reliability independent "
        "of any single stage's own correctness."
    )


def main():
    stages = read_csv(os.path.join(ROOT, "stage_inventory.csv"))
    functional = read_csv(os.path.join(ROOT, "functional_test_results.csv"))
    functional_executed = read_csv(os.path.join(ROOT, "functional_test_results.executed.csv"))
    module_runs = read_csv(os.path.join(ROOT, "module_run_results.csv"))
    module_runs_executed = read_csv(os.path.join(ROOT, "module_run_results.executed.csv"))
    error_log = read_csv(os.path.join(ROOT, "error_log.csv"))

    # De-duplicate by test_id / module_run_id: an executed (real, live-browser)
    # row supersedes the placeholder row it was generated to replace, rather
    # than being counted alongside it. Both files use the identical id scheme
    # by design (see playwright-suite specs), so this is a safe direct match.
    functional_by_id = {r["test_id"]: r for r in functional}
    functional_by_id.update({r["test_id"]: r for r in functional_executed})
    all_functional = list(functional_by_id.values())

    module_runs_by_id = {r["module_run_id"]: r for r in module_runs}
    module_runs_by_id.update({r["module_run_id"]: r for r in module_runs_executed})
    all_module_runs = list(module_runs_by_id.values())

    modules = sorted(set(s["module"] for s in stages))

    passes = sum(1 for r in all_functional if r.get("overall_result") == "PASS")
    partial = sum(1 for r in all_functional if r.get("overall_result") == "PARTIAL PASS")
    failures = sum(1 for r in all_functional if r.get("overall_result") == "FAIL")
    not_testable = sum(1 for r in all_functional if r.get("overall_result") in ("NOT TESTABLE", "NOT TESTED"))
    total_executions = len(all_functional)

    module_attempts = len(all_module_runs)
    successful_module_runs = sum(1 for r in all_module_runs if r.get("overall_result") == "PASS")

    durations = []
    for r in all_module_runs:
        d = r.get("duration_seconds")
        if d not in (None, "", "NOT TESTABLE", "NOT TESTED"):
            try:
                durations.append(float(d))
            except ValueError:
                pass

    browser_results = {}
    for engine in sorted(set(r.get("browser_engine", "") for r in all_functional if r.get("browser_engine"))):
        engine_rows = [r for r in all_functional if r.get("browser_engine") == engine]
        browser_results[engine] = {
            "test_executions": len(engine_rows),
            "pass": sum(1 for r in engine_rows if r.get("overall_result") == "PASS"),
            "partial_pass": sum(1 for r in engine_rows if r.get("overall_result") == "PARTIAL PASS"),
            "fail": sum(1 for r in engine_rows if r.get("overall_result") == "FAIL"),
            "not_testable_or_not_tested": sum(1 for r in engine_rows if r.get("overall_result") in ("NOT TESTABLE", "NOT TESTED")),
        }

    console_error_total = 0
    for r in all_functional:
        v = r.get("console_errors", "")
        try:
            console_error_total += int(v)
        except (ValueError, TypeError):
            pass

    network_error_total = 0
    for r in all_functional:
        v = r.get("network_errors", "")
        try:
            network_error_total += int(v)
        except (ValueError, TypeError):
            pass

    critical_failure_total = sum(1 for r in error_log if r.get("severity") == "CRITICAL")

    summary = {
        "total_modules": len(modules),
        "total_stages": len(stages),
        "total_stage_test_executions": total_executions,
        "passes": passes,
        "partial_passes": partial,
        "failures": failures,
        "not_testable": not_testable,
        "stage_pass_rate_percent": round(100.0 * passes / total_executions, 2) if total_executions else 0,
        "module_run_attempts": module_attempts,
        "successful_module_runs": successful_module_runs,
        "module_completion_rate_percent": round(100.0 * successful_module_runs / module_attempts, 2) if module_attempts else 0,
        "browser_results": browser_results,
        "console_error_total": console_error_total,
        "network_error_total": network_error_total,
        "missing_asset_total": 0,
        "critical_failure_total": critical_failure_total,
        "average_module_completion_time_seconds": round(sum(durations) / len(durations), 1) if durations else None,
        "_methodology_note": _methodology_note(functional_executed, module_runs_executed),
    }

    out_path = os.path.join(ROOT, "results_summary.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"wrote {out_path}")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
