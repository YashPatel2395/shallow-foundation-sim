# Browser logs

Zero console errors and zero console warnings were recorded across all 9
Chromium module-run attempts (`console_error_count` / implicit warning count
in `module_run_results.executed.csv` — every row shows `0`), so there is no
non-empty console log to include.

`logs/playwright-artifacts/` is empty for the same underlying reason
Playwright's own `trace: 'retain-on-failure'` did not fire for either of the
two real module-level failures in this run (Driven Pile run 2, Shallow
Foundation run 3): each spec's own Playwright `test()` assertion only checks
that at least one stage was attempted (a deliberately weak assertion — see
`playwright-suite/README.md`), which both of those runs satisfy despite
failing at the module level. Playwright itself therefore considered both
tests "passed" and never captured a trace. The real, module-level failure
evidence for those two runs is the `screenshots/*-incomplete_*_failure.png`
files plus the full per-stage detail in `functional_test_results.executed.csv`
and `module_run_results.executed.csv` (`failure_origin`, `classification_reason`
columns) — not a Playwright trace.
