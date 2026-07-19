#!/usr/bin/env python3
"""
Computes the exact stage-level reconciliation table and the five required
metrics (A-E) for one browser engine, from the raw executed CSVs.

Usage: python3 compute_reconciliation.py <engine> [functional_csv] [module_csv]
Defaults to research_evaluation/{functional_test_results,module_run_results}.executed.csv
"""
import csv
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

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
    engine = sys.argv[1] if len(sys.argv) > 1 else "chromium"
    functional_csv = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "functional_test_results.executed.csv")
    module_csv = sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, "module_run_results.executed.csv")

    with open(functional_csv, newline="", encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if r.get("browser_engine") == engine]

    counts = {c: 0 for c in CATEGORIES}
    unclassified = []
    for r in rows:
        cat = normalize(r["overall_result"], r.get("failure_origin", ""))
        if cat in counts:
            counts[cat] += 1
        else:
            unclassified.append(cat)
            counts.setdefault(cat, 0)
            counts[cat] += 1

    total = sum(counts.values())
    print(f"=== Stage-level reconciliation: {engine} ===")
    for c in CATEGORIES:
        print(f"  {c:30s} {counts[c]:4d}")
    if unclassified:
        print("  UNCLASSIFIED ROWS FOUND:")
        for u in set(unclassified):
            print(f"    {u}: {unclassified.count(u)}")
    print(f"  {'TOTAL':30s} {total:4d}")
    print()

    # Metrics A-E
    planned = total  # by construction, every planned execution has exactly one row
    observable = sum(counts[c] for c in CATEGORIES if c not in ("NOT TESTABLE",))
    passes = counts["PASS"]
    partial = counts["PARTIAL PASS"]
    fail_app = counts["FAIL — APPLICATION"]
    automation_completed = counts["PASS"] + counts["PARTIAL PASS"] + counts["FAIL — APPLICATION"] + counts["ENVIRONMENT FAILURE"]
    # "executions completed by the test driver" = driver actually attempted/ran this stage
    # (i.e. NOT NOT_TESTABLE and NOT NOT_REACHED, since those never got a driver attempt)
    driver_ran = total - counts["NOT TESTABLE"] - counts["NOT REACHED"]

    print(f"=== Metrics: {engine} ===")
    print(f"A. Planned execution coverage:            {observable}/{planned} = {100*observable/planned:.1f}%" if planned else "A. N/A")
    print(f"B. Confirmed pass rate (of all planned):   {passes}/{planned} = {100*passes/planned:.1f}%" if planned else "B. N/A")
    denom_c = passes + partial + fail_app
    print(f"C. Conditional functional pass rate:       {passes}/{denom_c} = {100*passes/denom_c:.1f}%" if denom_c else "C. N/A (no PASS+PARTIAL+FAIL-APPLICATION rows)")
    print(f"D. Automation success rate (driver ran):    {driver_ran}/{planned} = {100*driver_ran/planned:.1f}%" if planned else "D. N/A")
    print()

    # E. Continuous module completion rate, by module
    if os.path.exists(module_csv):
        with open(module_csv, newline="", encoding="utf-8") as f:
            mrows = [r for r in csv.DictReader(f) if r.get("browser_engine") == engine]
        by_module = {}
        for r in mrows:
            by_module.setdefault(r["module"], []).append(r)
        print(f"E. Continuous module completion rate: {engine}")
        total_attempts = 0
        total_success = 0
        for mod, runs in sorted(by_module.items()):
            succ = sum(1 for r in runs if r["overall_result"] == "PASS")
            total_attempts += len(runs)
            total_success += succ
            print(f"   {mod:30s} {succ}/{len(runs)} = {100*succ/len(runs):.1f}%")
        if total_attempts:
            print(f"   {'ALL MODULES':30s} {total_success}/{total_attempts} = {100*total_success/total_attempts:.1f}%")


if __name__ == "__main__":
    main()
