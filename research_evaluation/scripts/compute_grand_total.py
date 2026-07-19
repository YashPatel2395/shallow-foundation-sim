#!/usr/bin/env python3
"""
Computes the grand-total reconciliation table and metrics across all three
browser engines, reading directly from the versioned evidence packages
(research_evaluation/evidence/<engine>/final/functional_test_results.executed.csv
and .../module_run_results.executed.csv) rather than the transient top-level
files (which only ever hold one engine's data at a time by this evaluation's
own protocol -- see TEST_HARNESS_CHANGELOG.md).
"""
import csv
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINES = ["chromium", "firefox", "webkit"]

CATEGORIES = [
    "PASS", "PARTIAL PASS", "FAIL — APPLICATION", "FAIL — AUTOMATION DRIVER",
    "NOT TESTABLE", "NOT REACHED", "ENVIRONMENT FAILURE",
]


def normalize(result, origin):
    if result == "PASS":
        return "PASS"
    if result == "PARTIAL PASS":
        return "PARTIAL PASS"
    if result == "FAIL" and origin == "APPLICATION":
        return "FAIL — APPLICATION"
    if result == "FAIL" and origin == "AUTOMATION_DRIVER":
        return "FAIL — AUTOMATION DRIVER"
    if result in ("NOT TESTABLE", "NOT TESTED"):
        return "NOT TESTABLE"
    if result == "NOT REACHED":
        return "NOT REACHED"
    if result == "ENVIRONMENT FAILURE":
        return "ENVIRONMENT FAILURE"
    return f"UNCLASSIFIED ({result} / {origin})"


def main():
    all_rows = []
    all_module_rows = []
    for engine in ENGINES:
        fpath = os.path.join(ROOT, "evidence", engine, "final", "functional_test_results.executed.csv")
        mpath = os.path.join(ROOT, "evidence", engine, "final", "module_run_results.executed.csv")
        if os.path.exists(fpath):
            with open(fpath, newline="", encoding="utf-8") as f:
                all_rows.extend(csv.DictReader(f))
        if os.path.exists(mpath):
            with open(mpath, newline="", encoding="utf-8") as f:
                all_module_rows.extend(csv.DictReader(f))

    counts = {c: 0 for c in CATEGORIES}
    for r in all_rows:
        cat = normalize(r["overall_result"], r.get("failure_origin", ""))
        counts.setdefault(cat, 0)
        counts[cat] += 1

    total = sum(counts.values())
    print(f"=== GRAND TOTAL stage-level reconciliation (all {len(ENGINES)} engines) ===")
    for c in CATEGORIES:
        print(f"  {c:30s} {counts[c]:4d}")
    print(f"  {'TOTAL':30s} {total:4d}  (expected {123*len(ENGINES)})")
    print()

    passes = counts["PASS"]
    partial = counts["PARTIAL PASS"]
    fail_app = counts["FAIL — APPLICATION"]
    driver_ran = total - counts["NOT TESTABLE"] - counts["NOT REACHED"]
    denom_c = passes + partial + fail_app

    print("=== GRAND TOTAL metrics ===")
    print(f"A. Planned execution coverage:            {total - counts['NOT TESTABLE']}/{total} = {100*(total-counts['NOT TESTABLE'])/total:.1f}%")
    print(f"B. Confirmed pass rate (of all planned):   {passes}/{total} = {100*passes/total:.1f}%")
    print(f"C. Conditional functional pass rate:       {passes}/{denom_c} = {100*passes/denom_c:.1f}%" if denom_c else "C. N/A")
    print(f"D. Automation success rate (driver ran):    {driver_ran}/{total} = {100*driver_ran/total:.1f}%")
    print()

    print("=== Per-engine module completion rate ===")
    by_engine_module = {}
    for r in all_module_rows:
        key = (r["browser_engine"], r["module"])
        by_engine_module.setdefault(key, []).append(r)
    grand_success = 0
    grand_attempts = 0
    for engine in ENGINES:
        eng_success = 0
        eng_attempts = 0
        for module in ["Drilled Shaft Foundation", "Driven Pile Foundation", "Shallow Foundation"]:
            runs = by_engine_module.get((engine, module), [])
            succ = sum(1 for r in runs if r["overall_result"] == "PASS")
            eng_success += succ
            eng_attempts += len(runs)
            print(f"   {engine:10s} {module:28s} {succ}/{len(runs)}")
        grand_success += eng_success
        grand_attempts += eng_attempts
        print(f"   {engine:10s} {'ALL MODULES':28s} {eng_success}/{eng_attempts} = {100*eng_success/eng_attempts:.1f}%" if eng_attempts else "")
    print(f"\n   GRAND TOTAL ALL ENGINES/MODULES: {grand_success}/{grand_attempts} = {100*grand_success/grand_attempts:.1f}%" if grand_attempts else "")


if __name__ == "__main__":
    main()
