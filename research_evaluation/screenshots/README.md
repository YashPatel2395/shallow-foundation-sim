# Screenshot evidence directories

`chromium/`, `firefox/`, and `webkit/` are intentionally empty in this delivery: no
browser session was established in this evaluation's execution environment (see
`../test_environment.md`), so no screenshots were captured.

If `../playwright-suite/` is run in an unrestricted environment, it populates these
directories with real screenshots following the naming convention specified in the
evaluation brief, e.g. `SF-01_chromium_run1_first_stage.png`,
`DP-final_firefox_run2_completed.png`.
