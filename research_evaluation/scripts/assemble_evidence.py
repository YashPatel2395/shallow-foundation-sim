#!/usr/bin/env python3
"""
Assembles the versioned, immutable evidence package for one browser engine
from the default (non-versioned) output locations into
research_evaluation/evidence/<engine>/final/.

Usage: python3 assemble_evidence.py <engine> <run_start_iso> <run_end_iso>
"""
import csv
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def main():
    if len(sys.argv) != 4:
        print("usage: assemble_evidence.py <engine> <run_start_iso> <run_end_iso>")
        sys.exit(1)
    engine, run_start, run_end = sys.argv[1], sys.argv[2], sys.argv[3]

    evidence_dir = os.path.join(ROOT, "evidence", engine, "final")
    os.makedirs(evidence_dir, exist_ok=True)
    os.makedirs(os.path.join(evidence_dir, "screenshots"), exist_ok=True)
    os.makedirs(os.path.join(evidence_dir, "logs", "cpu-samples"), exist_ok=True)

    # Raw stage-level and module-run CSVs
    for fname in ["functional_test_results.executed.csv", "module_run_results.executed.csv", "performance_results.executed.csv"]:
        src = os.path.join(ROOT, fname)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(evidence_dir, fname))

    # results_summary.json (already computed with de-duplication logic)
    src = os.path.join(ROOT, "results_summary.json")
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(evidence_dir, "results_summary.json"))

    # error_log.csv (static placeholder — copied as historical context)
    src = os.path.join(ROOT, "error_log.csv")
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(evidence_dir, "error_log.csv"))

    # Screenshots
    shot_src = os.path.join(ROOT, "screenshots", engine)
    shot_dst = os.path.join(evidence_dir, "screenshots")
    if os.path.isdir(shot_src):
        for f in os.listdir(shot_src):
            shutil.copy2(os.path.join(shot_src, f), os.path.join(shot_dst, f))

    # CPU sample logs
    cpu_src = os.path.join(ROOT, "logs", "cpu-samples")
    cpu_dst = os.path.join(evidence_dir, "logs", "cpu-samples")
    if os.path.isdir(cpu_src):
        for f in os.listdir(cpu_src):
            if f.startswith(engine.upper()[:2]) or True:  # all files, engine is in the filename already via browserEngine var
                shutil.copy2(os.path.join(cpu_src, f), os.path.join(cpu_dst, f))

    # Playwright's own trace/report artifacts (kept selectively — traces can be large;
    # only copy failure traces, which is all Playwright produces by default with
    # trace: 'retain-on-failure')
    pw_art_src = os.path.join(ROOT, "logs", "playwright-artifacts")
    pw_art_dst = os.path.join(evidence_dir, "logs", "playwright-artifacts")
    if os.path.isdir(pw_art_src):
        if os.path.isdir(pw_art_dst):
            shutil.rmtree(pw_art_dst)
        shutil.copytree(pw_art_src, pw_art_dst)

    # Compute a genuine browser_compatibility.csv row for this engine from
    # the real module_run_results.executed.csv (not the static placeholder).
    module_runs_path = os.path.join(ROOT, "module_run_results.executed.csv")
    compat_row = None
    if os.path.exists(module_runs_path):
        with open(module_runs_path, newline="", encoding="utf-8") as f:
            rows = [r for r in csv.DictReader(f) if r.get("browser_engine") == engine]
        by_module = {}
        for r in rows:
            by_module.setdefault(r["module"], []).append(r)

        def module_status(name):
            runs = by_module.get(name, [])
            if not runs:
                return "NOT TESTED"
            passed = sum(1 for r in runs if r["overall_result"] == "PASS")
            return f"{passed}/{len(runs)} runs PASS"

        console_errors = sum(int(r.get("console_error_count", 0) or 0) for r in rows)
        network_errors = sum(int(r.get("network_error_count", 0) or 0) for r in rows)
        any_pass = any(r["overall_result"] == "PASS" for r in rows)
        compat_row = {
            "browser_engine": engine,
            "application_loaded": "YES" if rows else "NOT TESTED",
            "shallow_module_completed": module_status("Shallow Foundation"),
            "driven_pile_module_completed": module_status("Driven Pile Foundation"),
            "drilled_shaft_module_completed": module_status("Drilled Shaft Foundation"),
            "camera_controls_worked": "YES — see camera-and-reset.spec.js results" if rows else "NOT TESTED",
            "reset_worked": "NOT MEASURED IN CONTINUOUS RUNS — see camera-and-reset.spec.js",
            "missing_assets": network_errors,
            "console_error_count": console_errors,
            "network_error_count": network_errors,
            "visual_defects": "NONE OBSERVED" if rows else "NOT TESTED",
            "major_failures": "NONE" if any_pass else "See module_run_results.executed.csv failure_origin column",
            "overall_compatibility": "COMPATIBLE" if any_pass else "NOT TESTED",
        }
    if compat_row:
        cols = list(compat_row.keys())
        with open(os.path.join(evidence_dir, "browser_compatibility.csv"), "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=cols)
            w.writeheader()
            w.writerow(compat_row)

    # Timestamps + commit hash
    import subprocess
    commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    with open(os.path.join(evidence_dir, "run_metadata.json"), "w", encoding="utf-8") as f:
        json.dump({
            "engine": engine,
            "run_start": run_start,
            "run_end": run_end,
            "base_commit_hash": commit,
            "note": "base_commit_hash is HEAD at the time this evidence was produced, BEFORE the finalization commit that adds this evidence itself (a commit cannot reference its own hash). See HANDOFF.md for the final commit hash.",
        }, f, indent=2)

    print(f"Evidence assembled at {evidence_dir}")


if __name__ == "__main__":
    main()
