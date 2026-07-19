# Test Environment

This document records the exact machine, software, and repository state used for this
evaluation, and the environment-level constraint that determined how much of the planned
evaluation could actually be executed.

## System

| Item | Value | How obtained |
|---|---|---|
| Operating system | macOS 26.3.1 (a), build 25D771280a | `sw_vers` |
| Kernel | Darwin 25.3.0, arm64, xnu-12377.91.3~2, RELEASE_ARM64_T8122 | `uname -a` |
| CPU architecture | arm64e (Apple Silicon) | `uname -m`, `hostinfo` |
| Logical/physical processors | 8 / 8 | `hostinfo` |
| Primary memory | 16.00 GB | `hostinfo` ("Primary memory available: 16.00 gigabytes") |
| Exact CPU model string | UNDETERMINED | `sysctl -n machdep.cpu.brand_string` returned `Operation not permitted` in this execution environment; the sandbox restricts this specific query. Not required for functional evaluation; recorded as a limitation, not inferred or guessed. |
| Screen resolution used | NOT TESTABLE | No browser could be launched (see "Browser-launch constraint" below), so no rendered viewport/resolution was ever established. Not fabricated. |

## Software

| Item | Value | Command |
|---|---|---|
| Node.js | v24.18.0 | `node -v` |
| npm | 11.16.0 | `npm -v` |
| Python | 3.12.10 | `python3 --version` |
| Git | 2.48.1 | `git --version` |
| Playwright (Python package) | 1.59.0 | `playwright --version` |
| Playwright browser cache | Chromium 1217, chromium_headless_shell 1217, ffmpeg 1011 present. Firefox and WebKit browser binaries **not present** (`~/Library/Caches/ms-playwright/` contains no `firefox-*` or `webkit-*` directory) and could not be installed (see below). | `ls ~/Library/Caches/ms-playwright/` |
| Application package manager | None. No `package.json` exists at the repository root. The application is a static, unbundled site (plain HTML + `<script>` tags + a vendored `three.min.js`). | `ls package.json` → "No such file or directory" |

## Repository state

| Item | Value |
|---|---|
| Repository | shallow-foundation-sim (local path `/Users/yashpatel/Documents/CIVIL`) |
| Remote | `https://github.com/YashPatel2395/shallow-foundation-sim.git` |
| Evaluation branch | `research-evaluation` |
| Branch point / commit under test | `a2197eaee88f2debdff45799ffd0066cc32ec3a0` (tip of `master`/`origin/master` at branch-creation time) |
| Application build mode | N/A — no build step exists. Source files are served/opened as-is. |
| Date/time of testing | 2026-07-18, testing session beginning 22:40 EDT |

Note on working-tree state at branch creation: at the time this evaluation began, the
repository's tracked working tree also contained uncommitted modifications to
`drilled-shaft.js`, `driven-pile.js`, `script.js`, and `style.css` from prior, unrelated
interactive-usability edits (not part of this evaluation). Those changes were set aside with
`git stash` before `research-evaluation` was branched, so that the branch point is byte-identical
to commit `a2197ea` for all production files. The stash was left in place on `master` and is not
part of this branch. This evaluation was run exclusively against commit `a2197ea`.

## Browser-launch constraint (primary limitation of this evaluation)

Before attempting the functional test plan, the environment's ability to launch any browser
was verified directly. All three of the following were reproduced and logged:

1. **TCP socket bind fails.** `python3 -m http.server` — the standard way to serve the static
   application for browser testing — fails immediately with
   `PermissionError: [Errno 1] Operation not permitted` at `socket.bind()`. See
   `research_evaluation/logs/environment_blocker_evidence.log`, Test 1 and Test 3.
2. **Unix-domain socket bind also fails**, with the same `PermissionError`. See the same log,
   Test 2b. This matters because Chromium's own internal `ProcessSingleton` mechanism binds a
   local Unix-domain socket as part of normal startup, independent of any web server.
3. **A direct Playwright launch of the locally cached Chromium binary fails** even when
   targeting the application via `file://` (no server involved at all) and passing
   `--no-sandbox`. The browser process itself crashes during startup with:
   `FATAL:base/apple/mach_port_rendezvous_mac.cc:159] Check failed: kr == KERN_SUCCESS.
   bootstrap_check_in ... Permission denied (1100)`. Full process log:
   `research_evaluation/logs/chromium_launch_attempt.log`.

**Conclusion, stated precisely:** the execution sandbox this evaluation ran in denies the
underlying OS primitives (`bind()` for both TCP and Unix-domain sockets, and Mach IPC
bootstrap check-in) that any Chromium-family browser process requires just to start,
regardless of headless mode, regardless of whether a server is involved. This was confirmed
with direct, reproducible evidence against Chromium specifically. Firefox and WebKit binaries
were not present locally and could not be installed (`playwright install firefox webkit`
requires outbound network access to Playwright's CDN, which was not verified reachable and
was not pursued further once it was established that a successfully-downloaded browser binary
would fail to launch for the same OS-level IPC reason as Chromium). Firefox and WebKit are
therefore **NOT TESTED** in this evaluation, distinct from Chromium's **NOT TESTABLE** status,
which was reached only after direct, reproduced launch failures. No claim is made, anywhere in
this evaluation's output, that Firefox, WebKit, or actual Safari were executed.

Outbound git operations to the configured GitHub remote (`git ls-remote`) did succeed during
environment probing, which indicates the restriction is specifically on local socket
bind/listen (server hosting, inter-process singleton coordination), not on all outbound network
traffic. This is documented for completeness; it does not change the browser-launch conclusion
above, since browser launch failed on Mach IPC bootstrap, not on network connectivity.

## Practical effect on this evaluation

Because no browser could be started, **Phases 3 through 8 of the planned evaluation (live
functional stage testing, complete-module runs, browser-compatibility testing, and runtime
performance measurement) could not be executed in this environment.** This is reported
honestly throughout this evaluation package as `NOT TESTABLE` (for Chromium, where a launch
was directly attempted and failed) or `NOT TESTED` (for Firefox and WebKit, where no launch
was attempted because the binaries were unavailable and the same root cause was already
established). No test result in this package represents a simulated, inferred, or assumed
browser execution outcome.

What **was** produced instead, and is a legitimate, load-bearing part of this evaluation:

- A complete, source-code-derived stage inventory (`stage_inventory.csv`,
  `system_inventory.md`) — genuine static analysis, clearly labeled as such.
- A real, runnable Playwright test suite (`research_evaluation/playwright-suite/`) that
  performs the full 14-point per-stage check plan described in the evaluation brief. It was
  written to the same standard as if it were going to be run, but it was **not executed** here.
  It is provided so a researcher with an unrestricted environment can reproduce live results.
- Fully-populated result CSVs for every planned stage × browser × run combination, with
  `overall_result = NOT TESTABLE` / `NOT TESTED` and a precise reason in every row — not blank
  files, and not fabricated pass/fail values.
