# System Inventory

Source: direct inspection of the repository source files (`index.html`, `driven-pile.html`,
`drilled-shaft.html`, `script.js`, `driven-pile.js`, `drilled-shaft.js`, `style.css`,
`three.min.js`) on branch `research-evaluation`. No file was modified to produce this
document. Every claim below is grounded in a specific file/line reference; where a detail
could not be confirmed with confidence it is marked `UNDETERMINED` with the reason.

## Application framework and libraries

The application is a static, client-rendered site written in vanilla JavaScript, using
[Three.js](https://threejs.org/) for all 3D rendering. There is no bundler, no transpiler,
no npm `package.json`, and no UI framework (no React/Vue/Angular/etc.). Confirmed by:

- No `package.json`, `package-lock.json`, `node_modules/`, or any build-tool config
  (webpack/vite/rollup/tsconfig) exists at the repository root.
- Each HTML entry point loads Three.js and the page's logic via plain classic `<script>`
  tags, e.g. `drilled-shaft.html`:
  ```html
  <script src="three.min.js"></script>
  <script defer src="drilled-shaft.js"></script>
  ```
- No `<script type="module">`, no `fetch()` calls, and no external CDN references were
  found in `script.js`, `driven-pile.js`, or `drilled-shaft.js`.

## Three.js version

`three.min.js` embeds a runtime deprecation warning identifying it as a pre-r160 UMD/global
build (`console.warn('Scripts "build/three.js" and "build/three.min.js" are deprecated with
r150+, and will be removed with r160. ...')`), and the file's own `REVISION` string resolves
to:

```
REVISION = "123"
```

(confirmed via `grep -oE '"REVISION"\s*:\s*"?[0-9]+"?' three.min.js` -> `R123`, repeated 3
times in the minified bundle). The license header separately states `Copyright 2010-2023
Three.js Authors` — this is the license's stated copyright span, not a release date, and is
reported here without conflating the two.

## Project entry points

| File | Role |
|---|---|
| `index.html` | Dashboard (module launcher) and the Shallow Foundation simulation (rendered in the same page via `showShallowFoundationSimulation()`, loads `script.js`) |
| `driven-pile.html` | Driven Pile Foundation simulation (loads `driven-pile.js`) |
| `drilled-shaft.html` | Drilled Shaft Foundation simulation (loads `drilled-shaft.js`) |

## Development and production run commands

No `package.json` exists, so there are no `npm run dev` / `npm run build` / `npm start`
scripts of any kind — none could be found because none are defined. The application requires
no build step. It can be run by either:

1. Opening `index.html` directly in a browser via the `file://` protocol (no server
   required; no code in `script.js`/`driven-pile.js`/`drilled-shaft.js` calls `fetch()`, so a
   `file://` load does not hit browser CORS restrictions the way a fetch-based app would), or
2. Serving the repository root with any static file server, e.g. `python3 -m http.server`,
   and opening `http://localhost:<port>/index.html`.

This evaluation's own attempt to start a static file server inside its sandboxed execution
environment failed for environment-specific reasons unrelated to the application itself; see
`test_environment.md` for the full reproduction and root cause.

## Application routes

Routes are plain multi-page-app navigations (`window.location.href = '...'`), not a
client-side router. From `index.html`'s `<nav>` (lines 12-23) and dashboard cards:

- `index.html` — Dashboard / Shallow Foundation (`Dashboard`, `Shallow Foundation` nav
  buttons stay on this page and toggle an in-page view via `showDashboard()` /
  `showShallowFoundationSimulation()`)
- `index.html -> driven-pile.html` — `Driven Pile` nav button and dashboard "Start
  Simulation" card both navigate here via `window.location.href='driven-pile.html'`
- `index.html -> drilled-shaft.html` — `Drilled Shaft` nav button and dashboard "Start
  Module" card both navigate here via `window.location.href='drilled-shaft.html'`
- Each module page's own `<nav>` links back to `index.html` and across to the other two
  module pages the same way.

No query-string or hash-based deep-linking into a specific stage was found; every route
loads its module from stage 1.

## Module names and stage counts

| Module | JS file | HTML entry | Stage count |
|---|---|---|---|
| Shallow Foundation | `script.js` | `index.html` | 11 |
| Driven Pile Foundation | `driven-pile.js` | `driven-pile.html` | 15 |
| Drilled Shaft Foundation | `drilled-shaft.js` | `drilled-shaft.html` | 15 |
| **Total** | | | **41** |

Counts were obtained by counting entries in each file's `STEPS` metadata array and
cross-checking against the count of `STEP_HANDLERS` interactive-logic entries (see
`stage_inventory.csv` for the full per-stage listing, and "Documented source inconsistencies"
below for a discrepancy found during that cross-check).

## Stage titles in order

**Shallow Foundation (`script.js`, 11 stages):**
1. Site & Soil Assessment
2. Site Preparation
3. Excavation
4. Formwork Installation
5. Reinforcement Placement
6. Concrete Placement
7. Inspection
8. Curing
9. Final Inspection
10. Pillar Construction
11. Backfilling

**Driven Pile Foundation (`driven-pile.js`, 15 stages):**
1. Site Investigation
2. Pile Layout
3. Pile Selection
4. Position Pile
5. Alignment Check
6. Drive Pile
7. Reach Pile Refusal
8. Formwork Installation
9. Reinforcement Placement
10. Concrete Placement
11. Inspection
12. Curing
13. Final Inspection
14. Pillar Construction
15. Backfilling

**Drilled Shaft Foundation (`drilled-shaft.js`, 15 stages):**
1. Site Investigation
2. Shaft Layout
3. Mobilise Drilling Rig
4. Drill Borehole
5. Install Temporary Casing
6. Lower Reinforcement Cage
7. Pour Concrete — Tremie Method
8. Formwork Installation
9. Reinforcement Placement
10. Concrete Placement
11. Inspection
12. Curing
13. Final Inspection
14. Pillar Construction
15. Backfilling

## Interaction required at every stage

Full per-stage detail is in `stage_inventory.csv` (`required_user_action` column). The
41 stages fall into a small set of recurring interaction patterns, reused verbatim (in
several cases byte-identical code) across modules:

- **3D raycast click targets** (`clickables3D.push(...)`) — e.g. soil-boring markers,
  survey-layout rings, inspection checkpoints, final-inspection diamonds.
- **Press-and-hold action buttons** (`mousedown`/`mouseup`/`touchstart`/`touchend` pairs) —
  e.g. `DIG`, `POUR CONCRETE`, `DRILL`, `DRIVE`.
- **DOM task-list clicks** (`.panel-item` elements in the action bar, not raycast-based) —
  e.g. formwork panel installation, rig setup checklist, casing/cage/tremie per-shaft task
  lists.
- **Range sliders** (`<input type="range">`) — the Driven Pile "Alignment Check" stage only.
- **Multiple-choice cards** (`.panel-item` cards with distinct correct/incorrect outcomes) —
  the Driven Pile "Pile Selection" stage only.
- **Day-cycle buttons** with an auto-advancing timer running in parallel — the "Curing"
  stage in every module.

## Completion condition for every stage

Full per-stage detail is in `stage_inventory.csv` (`completion_condition` column). Every
stage ultimately calls the shared `completeStep()` function (defined once per file, identical
implementation in all three), which:

1. Awards a flat **+50 point completion bonus** (`addScore(50, ...)`), floored at 0.
2. Marks the stage's entry in the left-hand checklist as done.
3. Clears any running timers/intervals for the stage.
4. Calls that stage's `cleanup()` handler, if defined.
5. After a 600ms delay, calls `startStep(currentStep + 1)`.

`startStep(n)` then clears the 3D scene's transient objects (`clearScene3D()`), moves the
camera to a per-stage preset (`setCamPreset(n)`), updates the header/checklist/task-panel UI,
and invokes `STEP_HANDLERS[n].enter()` for the new stage. When `n` exceeds the module's stage
count, `startStep()` calls `showResult()` instead, displaying the final score/grade overlay.

## Incorrect-action behavior

There is a shared `penalize(msg)` helper (identical in all three files, e.g.
`drilled-shaft.js:1453`):

```js
function penalize(msg) {
  STATE.score = Math.max(0, STATE.score - 15);
  updateHUD();
  shakeScene();
  showFeedback('wrong', `${msg} (-15 pts)`);
}
```

It deducts a fixed 15 points (floored at 0), triggers a CSS `shake` animation on the 3D scene
container, and shows a red "wrong" message in the feedback toast. `penalize()` is called from
the Concrete Placement / Pillar Construction underfill path and from the Final Inspection
below-80%-average path in every module.

Several other stages implement incorrect-action feedback with a **direct** `STATE.score`
deduction rather than the shared `penalize()` helper, using a different fixed amount:
overfill during concrete pouring (−20 pts), a missed watering day during Curing (−10 pts),
and incorrect pile-type selection in the Driven Pile module's "Pile Selection" stage (−10 or
−20 pts depending on which wrong option is picked). These are documented per-stage in
`stage_inventory.csv`.

Per the CSV cross-check, **22 of the 41 stages have no incorrect-action path at all** — every
click in those stages is treated as correct, or an already-completed click target is simply a
no-op with no penalty. This is stated per-row in `stage_inventory.csv` as `NOT APPLICABLE`
rather than assumed; it is a source-code-inspection finding, not a test result.

## Scoring / evaluation behavior

`STATE.score` starts at **1000** (set in `resetSimulation()`), not 0 — the model is a
starting budget that stage completions add to (uncapped upward within the mechanics observed)
and penalties subtract from, floored at 0 (`Math.max(0, ...)` guards on every score mutation
found). `updateHUD()` writes the live score into `#score-val` in the header on every change.

On completing the module's final stage, `showResult()` populates `#result-overlay` with the
final score and a text grade computed by `getGrade()` (identical thresholds found in all
three files, e.g. `drilled-shaft.js:1608`):

```js
function getGrade() {
  if (STATE.score >= 900)      return 'Master Shaft Driller!';   // grade text is module-specific wording
  else if (STATE.score >= 700) return 'Skilled Engineer';
  else if (STATE.score >= 500) return 'Apprentice Builder';
  else                          return 'Foundation Trainee - try again!';
}
```

The result overlay also renders a static "Construction Report" table (design depth, method,
pass/fail status) and two hard-coded external reference links (FHWA and ADSC-IAFD sites).

## Reset behavior

`resetSimulation()` (identical structure in all three files, e.g. `drilled-shaft.js:1634`) is
an **in-memory** reset — it does **not** reload the page. It: hides the result overlay if
visible; removes a small, explicitly-named set of persistent meshes (`OBJ.persistentCap`,
`OBJ.persistentColumn`, `OBJ.columnRebarMeshes`, `OBJ.columnStirrupGroup`) if present; resets
`STATE.score` to 1000 and clears several module-specific progress counters
(`drivenDepth`/`drilledDepth`/`totalBlows`/`excavationComplete`); re-randomizes the Driven
Pile module's initial tilt values; and finally calls `startStep(0)` to rebuild stage 1 from
scratch. It is wired to a `↺ Reset` button in each module's header
(`onclick="resetSimulation()"`) — a single global action, not scoped to the current stage.

## Camera controls

All three modules share an identical camera architecture:

- A Three.js `OrbitControls` instance provides free pan/zoom/orbit at all times; `controls.update()`
  runs every animation frame regardless of the current stage.
- Each module defines a `CAM_PRESETS` array with **one preset camera position + look-at
  target per stage** (e.g. `drilled-shaft.js:685-701`, 15 entries). `startStep(n)`
  unconditionally calls `setCamPreset(n)` on every stage transition, so the camera
  automatically flies to a stage-appropriate framing whenever a new stage begins — this
  applies to all 41 stages, not just some.
- A handful of stages (the mid-construction "Inspection" stage in every module) additionally
  reassign `camTarget` **during** the stage itself, flying the camera to a specific
  checkpoint's preset view each time the player interacts with that checkpoint — layered on
  top of the per-stage preset described above.
- Each module's HTML also exposes manual camera preset buttons in a `#cam-controls` toolbar
  (`Section` / `Elevation` / `Deep` / `Plan` labels observed in `drilled-shaft.html`, wired to
  a `setCameraView(...)` function) plus a `↺ Reset` camera button and a zoom `<input
  type="range">` slider (`#zoom-slider`, range 4-75). These manual controls coexist with, and
  can be overridden by, the automatic per-stage `camTarget` fly-to described above.

## Progress-navigation behavior

Advancement is strictly sequential and forward-only. `completeStep()` is the only code path
found that changes `STATE.currentStep`, and it always increments by exactly 1
(`startStep(currentStep + 1)`). No back-navigation, stage-jump, or stage-skip control was
found in any of the three JS files or their HTML — the left-hand checklist (`#checklist`)
visually lists all stages with `done`/`active` states but its list items were not found to
carry click handlers that jump the current stage. `resetSimulation()` is the only way found
to return to stage 1 once past it, and it restarts the whole module rather than jumping to an
arbitrary stage.

## Assets used by each module

No external image, texture, audio, or 3D-model files (`.jpg`/`.png`/`.gltf`/`.glb`/`.mp3`/
`.wav`, etc.) are referenced anywhere in `script.js`, `driven-pile.js`, `drilled-shaft.js`, or
their HTML files (confirmed via a repository-wide grep for those extensions across those six
files — zero matches). All 3D visuals are procedurally generated Three.js primitive
geometries (`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`, `OctahedronGeometry`,
`RingGeometry`, etc.) and procedurally generated canvas textures (`makeCanvasTexture(...)`,
used e.g. for the curing-blanket stripe pattern). The only external library file loaded by
any module is `three.min.js` itself. Unrelated top-level repository files (`Archive.zip`,
several screenshots, a PDF, standalone physics-demo HTML files such as `ball_drop_3d.html`)
exist in the repository root but are not referenced by, or loaded from, any of the three
simulation modules.

## Whether completed construction elements persist between stages

This required tracing `addStep()` vs. the module-level `stepObjects` / `persistObjs` arrays
and `clearScene3D()` (all identical across the three files, e.g. `drilled-shaft.js:614-661`):

- `addStep(obj)` adds a mesh to the scene **and** pushes it onto the `stepObjects` array.
- Every stage transition (`startStep(n)`) calls `clearScene3D()`, which removes **every**
  object in `stepObjects` from the scene and empties the array, also clearing
  `clickables3D` and a long list of named `OBJ.*` references (rig, hammer, formwork,
  excavator parts, drilling rig, boreholes, casings, rebar cages, etc.).
- Therefore, in the strict sense, individual Three.js mesh **instances** created during one
  stage do **not** survive into the next stage — they are destroyed every transition.
- The application compensates for this by having later stages **re-build** a visual
  representation of already-completed prior work at the start of their `enter()` function.
  The clearest example is `buildShaftsForStep()` in `drilled-shaft.js`, which is called at
  the start of 8 later stages (Formwork Installation onward) to reconstruct the 4 completed
  drilled shafts from earlier stages as a visual backdrop. A separate, smaller set of meshes
  (`OBJ.persistentCap`, `OBJ.persistentColumn`, `OBJ.columnRebarMeshes`,
  `OBJ.columnStirrupGroup`) is deliberately kept **outside** the `clearScene3D()`
  deletion list and is only ever removed by `resetSimulation()`, meaning the pile
  cap/column, once built, is not rebuilt on every subsequent stage transition the way the
  shafts are — it is treated as genuinely persistent scene state.
- Net effect observed from the source: from the player's perspective the construction
  appears cumulative across stages (prior completed elements remain visible), but the
  mechanism is a mix of (a) true persistence for the pile-cap/column objects and (b)
  destroy-and-rebuild-from-scratch for most other elements (piles/shafts, rigs, formwork,
  rebar), driven by explicit rebuild calls placed at the top of each later stage's `enter()`.
  A stage that omits the corresponding rebuild call would visually lose that element; this
  evaluation did not exhaustively verify that every stage that should call a rebuild
  function does so — that would require the functional (browser) testing that this
  evaluation was unable to execute (see `test_environment.md`).

## Documented source inconsistencies found during inspection

- **`driven-pile.js` `STEP_HANDLERS` comment numbering is stale from array position 7
  onward.** The array has exactly 15 entries, positionally 1:1 aligned with the 15 `STEPS`
  metadata entries (title/content matches at every position — confirmed by reading both
  arrays in full). However, the inline comment labels above each block
  (`/* ─── N: Name ─── */`) read `0, 1, 2, 3, 4, 5, 6`, then jump straight to `10, 11, 12,
  13, 14, 15, 16, 17` — skipping 7, 8, and 9 and staying offset by +3 relative to true
  0-indexed array position for the rest of the file. This does not affect runtime behavior
  (JavaScript array iteration does not read comment text), but it is a real, verifiable
  documentation defect in the source, listed here as a finding rather than corrected. Exact
  line numbers and the stale label text are recorded per-row in `stage_inventory.csv` for
  the affected `DP-07` through `DP-15` rows. `drilled-shaft.js` and `script.js` do not have
  this issue — their comment numbering is sequential and matches array position exactly.
