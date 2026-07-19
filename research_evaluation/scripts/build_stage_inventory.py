"""
Generates stage_inventory.csv from data manually transcribed via direct source-code
inspection of script.js, driven-pile.js, and drilled-shaft.js (STEPS metadata array
and STEP_HANDLERS interactive-logic array in each file). Re-run to regenerate the CSV
deterministically from this dataset.
"""
import csv

RESET_NOTE = "YES (global reset button in header, calls resetSimulation() -> STATE.score=1000 and startStep(0); not stage-specific)"
CAM_YES = "YES (per-stage camera preset via setCamPreset(n), called automatically by startStep() on every stage transition)"
CAM_YES_PLUS = "YES (per-stage camera preset on entry, PLUS an additional mid-stage camTarget fly-to per interaction)"
SCORE_BASE = "YES (+50 universal stage-completion bonus awarded by completeStep() on every stage; no additional stage-specific score logic observed)"

rows = []

def add(stage_id, module, num, title, desc, action, cond, incorrect, scoring, camera, reset, src, loc):
    rows.append([stage_id, module, num, title, desc, action, cond, incorrect, scoring, camera, reset, src, loc])

# ============================= SHALLOW FOUNDATION (script.js) =============================
M = "Shallow Foundation"
S = "script.js"

add("SF-01", M, 1, "1. Site & Soil Assessment",
    "Test the soil at 5 locations to understand bearing capacity before designing the foundation.",
    "Click each of 5 pulsing orange soil-test markers placed around the site in the 3D scene (raycast click targets only; this stage has no HTML card fallback).",
    "All 5 markers tested (ss.tested === ss.total) reveals a 'Submit Assessment Report' button; clicking it calls completeStep().",
    "NOT APPLICABLE - no incorrect-action path implemented for this stage; every marker click registers as correct and an already-tested marker click is a silent no-op.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2294 (STEP_HANDLERS[0])")

add("SF-02", M, 2, "2. Site Preparation",
    "Clear all debris from the construction site and level the ground.",
    "Click each of 6 debris items (rocks, tree stumps, weed clusters) in the 3D scene to remove them, then click the 'Level Ground' button that appears once all 6 are cleared.",
    "ss.removed === 6 reveals 'Level Ground' button; clicking it plays a sweep animation across the site and calls completeStep() ~400ms after the animation finishes.",
    "NOT APPLICABLE - no incorrect-action path found; every debris click is valid and cannot be repeated on the same item.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2369 (STEP_HANDLERS[1])")

add("SF-03", M, 3, "3. Excavation",
    "Dig the pit to full design depth using the excavator.",
    "Press and hold the '⛏️ DIG' button (mousedown/touchstart) to excavate; the pit depth increases while held and stops increasing on release (mouseup/touchend).",
    "Depth reaches 100% (digging then auto-stops); a '✅ Confirm Excavation' button appears and must be clicked to call completeStep().",
    "NOT APPLICABLE - no penalty or wrong-state path found; holding/releasing the dig button has no failure outcome.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2490 (STEP_HANDLERS[2])")

add("SF-04", M, 4, "4. Formwork Installation",
    "Install wooden formwork panels to contain the concrete pour.",
    "Click each of 4 DOM list entries (.panel-item cards rendered in the action bar, not 3D raycast targets) labeled North/South/East/West Wall; each click also plays a 3D animation of that panel dropping into position.",
    "All 4 panels placed (ss.count === 4) auto-calls completeStep() after an 800ms delay - no confirmation button on this stage.",
    "NOT APPLICABLE - clicking an already-placed panel item is a no-op (early return on ss.placed[key]); no penalty path found.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2608 (STEP_HANDLERS[3])")

add("SF-05", M, 5, "5. Reinforcement Placement",
    "Lay the base rebar mat first, then place the column rebar cage ready for the column.",
    "Click DOM .panel-item list entries in the action bar (two separate panel-item groupings in source) to place the lower longitudinal mat (8 bars), the cross mat (8 bars), and the column rebar (4 corner bars); confirm via '✅ Reinforcement Complete' button.",
    "All rebar sub-steps placed, then the '✅ Reinforcement Complete' button is clicked, calling completeStep().",
    "NOT APPLICABLE - no incorrect-action path found in this stage.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2678 (STEP_HANDLERS[4])")

add("SF-06", M, 6, "6. Concrete Placement",
    "Pour concrete from the ready-mix truck. Hit the 88-98% target zone.",
    "Press and hold '🚛 POUR CONCRETE' (mousedown/touchstart) to raise the fill percentage; release (mouseup/touchend) to stop pouring and evaluate the result.",
    "On release: if fill% is within 88-98%, a '✅ Confirm Pour' button appears (clicking it calls completeStep()); if >98%, an '⬇️ Proceed (Overfill Noted)' button appears instead (also proceeds to completeStep() when clicked); if <88%, the player must resume pouring.",
    "Underfill (<88% on release): penalize() is called - fixed -15 pts, shakeScene() shake animation, red 'wrong' feedback bar; the pour button remains active to retry. Overfill (>98%): direct -20 pt deduction (STATE.score -= 20), shakeScene(), '⚠️ Overfill! (-20 pts)' message shown - the defect is noted but does not block progression.",
    "YES (stage-specific: -15 underfill penalty via penalize(), -20 overfill penalty via direct STATE.score deduction, plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 2896 (STEP_HANDLERS[5])")

add("SF-07", M, 7, "7. Inspection",
    "The site inspector checks all critical construction elements.",
    "Click each of 4 inspection checkpoints - either its 3D marker in the scene, or the matching card with an 'Inspect' button rendered in the action bar (dual input path). Each click flies the camera to a preset view for that checkpoint.",
    "All 4 checkpoints inspected (ss.checked === 4) reveals '📝 Sign Off Inspection' button; clicking it calls completeStep().",
    "NOT APPLICABLE - every checkpoint click registers PASS; no fail/wrong outcome path found for this mid-construction inspection stage.",
    "YES (+50 completion bonus only; no per-checkpoint score change observed in this stage)",
    CAM_YES_PLUS, RESET_NOTE, S, "line 3011 (STEP_HANDLERS[6])")

add("SF-08", M, 8, "8. Curing",
    "Keep the concrete moist for 7 days to reach full strength.",
    "Click '💧 Water Concrete' (once per in-sim day, button disables after use) then '⏭️ Next Day' to advance the 7-day cycle. A safeInterval also force-advances the day automatically every 3000ms regardless of manual interaction.",
    "After day 7 is passed (ss.day > ss.totalDays), a '✅ Curing Complete' button is shown; clicking it calls completeStep().",
    "Missing a day's watering (auto-advance fires with ss.wateredToday still false): direct -10 pt deduction (STATE.score -= 10, not the shared penalize() function), red 'wrong' feedback ('Missed watering Day N! (-10 pts)'), and that day's strength-bar gain is halved via updateStrength(false).",
    "YES (stage-specific: -10 pt penalty per missed watering day, plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 3162 (STEP_HANDLERS[7])")

add("SF-09", M, 9, "9. Final Inspection",
    "Verify 5 quality checkpoints on the completed foundation.",
    "Click each of 5 glowing blue diamond (OctahedronGeometry) checkpoints placed on the completed slab in the 3D scene (raycast click targets only).",
    "All 5 checkpoints checked; a random 90-100% score is assigned per checkpoint, then the average is computed. If average >= 80%, a '🏗️ Proceed to Pillar' button appears and calls completeStep(). If average < 80%, penalize() fires once and completeStep() is called automatically after a 1500ms delay (stage cannot be blocked indefinitely).",
    "Average score below 80% triggers penalize() (-15 pts, shakeScene(), red 'wrong' feedback 'Average: N% - below threshold.') but the stage still auto-advances 1.5s later rather than requiring correction.",
    "YES (each checkpoint awards a random 90-100 'inspection score' used only for the pass/fail threshold, not added to STATE.score directly; -15 penalize() applies only if the average is below 80%; plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 3292 (STEP_HANDLERS[8])")

add("SF-10", M, 10, "10. Pillar Construction",
    "Install formwork around the pre-placed column rebar, pour concrete, water and cure it, then strip the formwork.",
    "Multi-phase stage: click DOM .panel-item entries to install column formwork, press-and-hold '🚛 POUR COLUMN' to fill concrete (same 88-98% target-zone mechanic as SF-06), click '💧 Water Column Concrete', then a strip-formwork action; finishes with a '🪣 Proceed to Backfilling' button.",
    "All phases complete (formwork installed -> concrete poured in target zone -> watered -> formwork stripped), then the final button is clicked, calling completeStep().",
    "Same underfill/overfill penalty mechanics as SF-06 apply to the column pour sub-phase: penalize() (-15 pts) on underfill, direct -20 pt deduction on overfill, both with shakeScene() and red feedback.",
    "YES (stage-specific pour-quality penalties as above, plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 3366 (STEP_HANDLERS[9])")

add("SF-11", M, 11, "11. Backfilling",
    "Refill soil around the finished pillar and compact it - only the column top remains above ground.",
    "Click '🪣 Add Soil' 5 times to backfill around the pillar; once fill exceeds 60%, click '🔨 Compact' 3 times; finishes with a '🏆 Construction Complete!' button.",
    "Fill reaches 100% and required compaction cycles are done, then the final button is clicked, calling completeStep() -> since this is the last stage, startStep(n+1) exceeds STEPS.length and triggers showResult() (final score/grade overlay).",
    "A 'wrong' feedback / shakeScene() path exists in this stage's source (matched by automated scan) consistent with a compaction-order rule (e.g. compacting before the 60% fill threshold); the exact rule text was not independently re-verified line-by-line in this pass.",
    "YES (+50 completion bonus; this is also the final stage, after which the Final Score and a text grade are displayed on the result overlay)",
    CAM_YES, RESET_NOTE, S, "line 3688 (STEP_HANDLERS[10])")

# ============================= DRIVEN PILE FOUNDATION (driven-pile.js) =============================
M = "Driven Pile Foundation"
S = "driven-pile.js"
NOTE_NUM = " NOTE: the inline STEP_HANDLERS comment label for this array position is stale (see system_inventory.md, 'Documented source inconsistencies') - the array position and STEPS-array content still align correctly 1:1."

add("DP-01", M, 1, "1. Site Investigation",
    "Conduct soil boring tests at 5 locations to determine soil profile and bearing capacity.",
    "Click each of 5 pulsing boring markers (BH-1..BH-5) in the 3D scene, or use the matching card with a 'Test' button in the action bar (dual input path).",
    "All 5 borings tested (ss.tested >= ss.total), then 'Submit Soil Report' button clicked, calling completeStep().",
    "NOT APPLICABLE - no incorrect-action path implemented; an already-tested marker/card is a no-op.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2968 (STEP_HANDLERS[0])")

add("DP-02", M, 2, "2. Pile Layout",
    "Mark the exact positions for all 4 piles based on the structural design drawings.",
    "Click each of 4 pulsing ring-shaped survey-marker targets (P1-P4) in the 3D scene (raycast click targets; a generous invisible hit-disc covers the ring's hollow center).",
    "All 4 markers placed (ss.placed >= ss.total), auto-calls completeStep() after a 1200ms delay - no confirmation button.",
    "NOT APPLICABLE - no incorrect-action path found; an already-placed marker click is a no-op.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 3071 (STEP_HANDLERS[1])")

add("DP-03", M, 3, "3. Pile Selection",
    "Choose the appropriate pile type for this medium-rise structure on soft clay over dense sand.",
    "Click one of 3 DOM .panel-item option cards (Timber Pile / Steel H-Pile / Concrete Pile), each describing trade-offs.",
    "Selecting the correct option (Concrete Pile) marks it selected, awards score, then auto-calls completeStep() ~2700ms later (1500ms then a further 1200ms delay chain).",
    "Selecting an incorrect option (Timber Pile or Steel H-Pile): card border turns red, direct STATE.score deduction (20 pts for Timber, 10 pts for Steel H-Pile, option-specific 'penalty' values, not the shared penalize() function), shakeScene(), red 'wrong' feedback with the specific reason and point loss shown; the card border resets after 1500ms so the player can try again.",
    "YES (stage-specific: +20 pts via addScore() on the correct choice; -10 or -20 pts depending on which incorrect option is chosen; plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 3171 (STEP_HANDLERS[2])")

add("DP-04", M, 4, "4. Position Pile",
    "Use the crane to lift the concrete pile from storage and position it over the pile marker.",
    "Click a 3-step sequential action list in the action bar with buttons/labels 'Attach Sling', 'Lift Pile', 'Guide to Position' (matches the 3 subtasks listed in STEPS metadata), each triggering a corresponding crane animation.",
    "All 3 sequential actions completed, then completeStep() is called.",
    "NOT APPLICABLE - no incorrect-action path was found via automated scan of this stage (no penalize() or STATE.score reference in this block); this reflects a sequential build-only stage.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 3253 (STEP_HANDLERS[3])")

add("DP-05", M, 5, "5. Alignment Check",
    "Verify the pile is perfectly vertical using theodolite readings from two directions.",
    "Drag two HTML <input type=\"range\"> sliders (N-S Tilt and E-W Tilt, range 87-93 degrees, step 0.1) until a circular bubble-level indicator shows both axes within tolerance.",
    "Both axes within +-0.5 degrees of 90 (vertical) simultaneously (ss.nsOk && ss.ewOk) triggers an automatic completeStep() call 1500ms later - no manual confirm button.",
    "NOT APPLICABLE in the penalty sense - there is no score penalty for being out of tolerance; the live status text and the bubble-level indicator simply turn red/list which axis is out of tolerance ('N-S out of tolerance' / 'E-W out of tolerance') until the player corrects it.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 3362 (STEP_HANDLERS[4])")

add("DP-06", M, 6, "6. Drive Pile",
    "Operate the drop hammer to drive the pile through soft soils to the bearing layer.",
    "Press and hold the 'DRIVE' button (mousedown/touchstart) to trigger repeated hammer-drop animation cycles that increase driven depth and blow count; release to pause.",
    "Pile is driven through the topsoil/soft-clay/loose-sand layers toward the dense-sand bearing layer to a depth/blow-count threshold, then completeStep() is called to proceed to the refusal-monitoring stage.",
    "NOT APPLICABLE - no incorrect-action path found in this stage via automated scan; the mechanic is purely a hold-to-progress interaction.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 3519 (STEP_HANDLERS[5])")

add("DP-07", M, 7, "7. Reach Pile Refusal",
    "Recognize when the pile has reached the bearing layer and refusal condition is achieved.",
    "Continue holding/pressing 'DRIVE' to keep driving; the app tracks a decreasing penetration-per-blow sequence (hard-coded sequence from 25mm down to 1mm per blow) and blow count; once refusal criteria are met a 'Confirm Refusal' button becomes available.",
    "Refusal criteria met (penetration-per-blow drops to the low end of the hard-coded sequence), then 'Confirm Refusal' button is clicked, calling completeStep().",
    "NOT APPLICABLE - no penalty path found via automated scan of this stage; premature-refusal-vs-obstruction distinction is described only in the STEPS warning text, not enforced as a scored decision in this handler.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 3759 (STEP_HANDLERS[6]) - inline comment reads '6: Pile Refusal'" + NOTE_NUM)

add("DP-08", M, 8, "8. Formwork Installation",
    "Install wooden formwork panels to contain the concrete pour.",
    "Click each of 4 DOM .panel-item entries (North/South/East/West Wall) in the action bar; identical mechanic to SF-04.",
    "All 4 panels placed (ss.count === 4), auto-calls completeStep() after an 800ms delay.",
    "NOT APPLICABLE - no incorrect-action path found; identical mechanic to SF-04.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 3974 (STEP_HANDLERS[7]) - inline comment reads '10: Formwork'" + NOTE_NUM)

add("DP-09", M, 9, "9. Reinforcement Placement",
    "Lay the base rebar mat first, then place the column rebar cage ready for the column.",
    "Click DOM .panel-item entries (two separate groupings) to place the lower mat (8 bars), cross mat (8 bars), and column rebar (4 corner bars); confirm via '✅ Reinforcement Complete' button. Identical mechanic to SF-05.",
    "All rebar sub-steps placed, then '✅ Reinforcement Complete' clicked, calling completeStep().",
    "NOT APPLICABLE - no incorrect-action path found; identical mechanic to SF-05.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 4045 (STEP_HANDLERS[8]) - inline comment reads '11: Reinforcement'" + NOTE_NUM)

add("DP-10", M, 10, "10. Concrete Placement",
    "Pour concrete from the ready-mix truck. Hit the 88-98% target zone.",
    "Press and hold '🚛 POUR CONCRETE' to fill; release to evaluate. Identical mechanic to SF-06.",
    "Fill 88-98% on release -> '✅ Confirm Pour' button -> completeStep(); >98% -> '⬇️ Proceed (Overfill Noted)' button also leads to completeStep(); <88% requires resuming the pour.",
    "Underfill: penalize() (-15 pts, shake, red feedback). Overfill: direct -20 pt deduction, shake, red feedback; stage still allowed to proceed. Identical mechanic to SF-06.",
    "YES (stage-specific -15/-20 pour-quality penalties, plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 4264 (STEP_HANDLERS[9]) - inline comment reads '12: Concrete Placement'" + NOTE_NUM)

add("DP-11", M, 11, "11. Inspection",
    "The site inspector checks all critical construction elements.",
    "Click each of 4 inspection checkpoints (3D marker in scene OR matching action-bar card with 'Inspect' button); camera flies to a preset view per checkpoint. Identical mechanic to SF-07.",
    "All 4 checked -> '📝 Sign Off Inspection' button -> completeStep().",
    "NOT APPLICABLE - every checkpoint click registers PASS; no fail path found. Identical mechanic to SF-07.",
    "YES (+50 completion bonus only)",
    CAM_YES_PLUS, RESET_NOTE, S, "line 4380 (STEP_HANDLERS[10]) - inline comment reads '13: Inspection'" + NOTE_NUM)

add("DP-12", M, 12, "12. Curing",
    "Keep the concrete moist for 7 days to reach full strength.",
    "Click '💧 Water Concrete' then '⏭️ Next Day' each in-sim day (7-day cycle); a safeInterval also auto-advances every 3000ms. Identical mechanic to SF-08.",
    "After day 7 passes, '✅ Curing Complete' button -> completeStep().",
    "Missing a day's watering: direct -10 pt deduction, red 'wrong' feedback, halved strength gain for that day. Identical mechanic to SF-08.",
    "YES (stage-specific -10 pt penalty per missed day, plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 4532 (STEP_HANDLERS[11]) - inline comment reads '14: Curing'" + NOTE_NUM)

add("DP-13", M, 13, "13. Final Inspection",
    "Verify 5 quality checkpoints on the completed foundation.",
    "Click each of 5 glowing blue diamond checkpoints in the 3D scene. Identical mechanic to SF-09.",
    "All 5 checked, random 90-100% score each, averaged; average >=80% -> '🏗️ Proceed to Pillar' button -> completeStep(); average <80% -> penalize() fires once, then completeStep() auto-called 1500ms later regardless.",
    "Average below 80%: penalize() (-15 pts, shake, red feedback), but the stage still auto-advances rather than blocking. Identical mechanic to SF-09.",
    "YES (random per-checkpoint 90-100 inspection score used for the pass/fail threshold only; -15 penalize() if average <80%; plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 4663 (STEP_HANDLERS[12]) - inline comment reads '15: Final Inspection'" + NOTE_NUM)

add("DP-14", M, 14, "14. Pillar Construction",
    "Install formwork around the pre-placed column rebar, pour concrete, water and cure it, then strip the formwork.",
    "Multi-phase: click .panel-item to install column formwork, hold '🚛 POUR COLUMN' (88-98% target zone), click '💧 Water Column Concrete', strip formwork; finishes with '🪣 Proceed to Backfilling' button. Identical mechanic to SF-10.",
    "All phases complete, final button clicked, calling completeStep().",
    "Same underfill/overfill pour penalties as SF-10/DP-10 apply to the column pour sub-phase.",
    "YES (stage-specific pour-quality penalties, plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 4738 (STEP_HANDLERS[13]) - inline comment reads '16: Pillar Construction'" + NOTE_NUM)

add("DP-15", M, 15, "15. Backfilling",
    "Refill soil around the finished pillar and compact it - only the column top remains above ground.",
    "Click '🪣 Add Soil' 5 times, then '🔨 Compact' 3 times once fill exceeds 60%; finishes with '🏆 Construction Complete!' button. Identical mechanic to SF-11.",
    "Fill reaches 100% and compaction cycles complete, final button clicked -> completeStep() -> since this is the last stage, showResult() displays the final score/grade overlay.",
    "A 'wrong' feedback / shakeScene() path exists in source consistent with a compaction-order rule; exact trigger condition not independently re-verified line-by-line in this pass.",
    "YES (+50 completion bonus; final stage, Final Score and text grade displayed on the result overlay)",
    CAM_YES, RESET_NOTE, S, "line 5062 (STEP_HANDLERS[14]) - inline comment reads '17: Backfilling'" + NOTE_NUM)

# ============================= DRILLED SHAFT FOUNDATION (drilled-shaft.js) =============================
M = "Drilled Shaft Foundation"
S = "drilled-shaft.js"

add("DS-01", M, 1, "1. Site Investigation",
    "Conduct soil boring tests at 5 locations to determine soil profile and bearing capacity.",
    "Click each of 5 pulsing boring markers (BH-1..BH-5) in the 3D scene, or use the matching card with a 'Test' button in the action bar (dual input path). Identical mechanic to DP-01.",
    "All 5 borings tested, 'Submit Soil Report' button clicked, calling completeStep().",
    "NOT APPLICABLE - no incorrect-action path implemented.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2128 (STEP_HANDLERS[0])")

add("DS-02", M, 2, "2. Shaft Layout",
    "Mark the exact positions for all 4 drilled shaft centres using survey equipment.",
    "Click each of 4 pulsing ring-shaped survey-marker targets (S1-S4) in the 3D scene (raycast click targets; a generous invisible hit-disc covers the ring's hollow center). Identical mechanic to DP-02.",
    "All 4 markers placed, auto-calls completeStep() after a 1200ms delay.",
    "NOT APPLICABLE - no incorrect-action path found.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2222 (STEP_HANDLERS[1])")

add("DS-03", M, 3, "3. Mobilise Drilling Rig",
    "Position the rotary drilling rig over shaft S1 and complete rig setup checks.",
    "Click a 4-item DOM .panel-item task list in the action bar: 'Drive rig to shaft S1', 'Extend Kelly bar', 'Attach drill bucket', 'Confirm rig level' - each item marks itself done on click.",
    "All 4 rig-setup tasks completed (ss.done >= ss.total) reveals a 'Begin Drilling' button; clicking it calls completeStep().",
    "NOT APPLICABLE - clicking an already-completed task item is a no-op; no penalty path found.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2316 (STEP_HANDLERS[2])")

add("DS-04", M, 4, "4. Drill Borehole",
    "Rotate the drill bucket to excavate all 4 boreholes to the design depth of 17 m.",
    "Press and hold the 'DRILL' button (mousedown/touchstart) to increase drill depth percentage for the currently active shaft; a stats display shows depth and progress %.",
    "Drill depth reaches 100% for the tracked shaft (SHAFT_DEPTH * depthPct / 100 = 17m at 100%), then completeStep() is called.",
    "NOT APPLICABLE - no penalty path found via automated scan; purely a hold-to-progress mechanic.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2362 (STEP_HANDLERS[3])")

add("DS-05", M, 5, "5. Install Temporary Casing",
    "Lower a steel casing into each borehole to prevent collapse during reinforcement and concrete placement.",
    "Click a DOM .panel-item task list entry per shaft ('Lower casing into S1' .. 'S4', matching the 4 STEPS subtasks) to trigger the casing-lowering animation for that shaft.",
    "All 4 casings lowered, then completeStep() is called.",
    "NOT APPLICABLE - no incorrect-action path found via automated scan.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2509 (STEP_HANDLERS[4])")

add("DS-06", M, 6, "6. Lower Reinforcement Cage",
    "Lower a pre-assembled steel rebar cage into each cased borehole.",
    "Click a DOM .panel-item task list entry per shaft ('Lower cage into S1' .. 'S4') to trigger the cage-lowering animation for that shaft.",
    "All 4 cages lowered, then completeStep() is called.",
    "NOT APPLICABLE - no incorrect-action path found via automated scan.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2579 (STEP_HANDLERS[5])")

add("DS-07", M, 7, "7. Pour Concrete - Tremie Method",
    "Pour concrete from the bottom of each borehole upward using a tremie pipe. Withdraw casing as concrete rises.",
    "Click a DOM .panel-item task list entry per shaft ('Tremie pour shaft S1 - withdraw casing' .. 'S4') to trigger the tremie-pour-and-casing-withdrawal animation for that shaft.",
    "All 4 shafts tremie-poured, then completeStep() is called.",
    "NOT APPLICABLE - no incorrect-action path found via automated scan; the STEPS warning text describes a withdrawal-speed hazard, but it is not modeled as a scored decision in this handler.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2648 (STEP_HANDLERS[6])")

add("DS-08", M, 8, "8. Formwork Installation",
    "Install wooden formwork panels to contain the concrete pour.",
    "Click each of 4 DOM .panel-item entries (North/South/East/West Wall). Identical mechanic to SF-04/DP-08.",
    "All 4 panels placed, auto-calls completeStep() after an 800ms delay.",
    "NOT APPLICABLE - no incorrect-action path found.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2754 (STEP_HANDLERS[7])")

add("DS-09", M, 9, "9. Reinforcement Placement",
    "Lay the base rebar mat first, then place the column rebar cage ready for the column.",
    "Click DOM .panel-item entries (two groupings) to place the lower mat (8 bars), cross mat (8 bars), and column rebar (4 corner bars); confirm via '✅ Reinforcement Complete' button. Identical mechanic to SF-05/DP-09.",
    "All rebar sub-steps placed, then '✅ Reinforcement Complete' clicked, calling completeStep().",
    "NOT APPLICABLE - no incorrect-action path found.",
    SCORE_BASE, CAM_YES, RESET_NOTE, S, "line 2824 (STEP_HANDLERS[8])")

add("DS-10", M, 10, "10. Concrete Placement",
    "Pour concrete from the ready-mix truck. Hit the 88-98% target zone.",
    "Press and hold '🚛 POUR CONCRETE' to fill; release to evaluate. Identical mechanic to SF-06/DP-10.",
    "88-98% on release -> '✅ Confirm Pour' -> completeStep(); >98% -> '⬇️ Proceed (Overfill Noted)' also leads to completeStep(); <88% requires resuming.",
    "Underfill: penalize() (-15 pts, shake, red feedback). Overfill: direct -20 pt deduction, shake, red feedback; stage still proceeds.",
    "YES (stage-specific -15/-20 pour-quality penalties, plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 3025 (STEP_HANDLERS[9])")

add("DS-11", M, 11, "11. Inspection",
    "The site inspector checks all critical construction elements.",
    "Click each of 4 inspection checkpoints (3D marker OR matching action-bar card with 'Inspect' button); camera flies to a preset view per checkpoint. Identical mechanic to SF-07/DP-11.",
    "All 4 checked -> '📝 Sign Off Inspection' button -> completeStep().",
    "NOT APPLICABLE - every checkpoint click registers PASS.",
    "YES (+50 completion bonus only)",
    CAM_YES_PLUS, RESET_NOTE, S, "line 3139 (STEP_HANDLERS[10])")

add("DS-12", M, 12, "12. Curing",
    "Keep the concrete moist for 7 days to reach full strength.",
    "Click '💧 Water Concrete' then '⏭️ Next Day' each in-sim day (7-day cycle); safeInterval auto-advances every 3000ms. Identical mechanic to SF-08/DP-12.",
    "After day 7 passes, '✅ Curing Complete' button -> completeStep().",
    "Missing a day's watering: direct -10 pt deduction, red 'wrong' feedback, halved strength gain for that day.",
    "YES (stage-specific -10 pt penalty per missed day, plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 3284 (STEP_HANDLERS[11])")

add("DS-13", M, 13, "13. Final Inspection",
    "Verify 5 quality checkpoints on the completed foundation.",
    "Click each of 5 glowing blue diamond checkpoints in the 3D scene. Identical mechanic to SF-09/DP-13.",
    "All 5 checked, random 90-100% score each, averaged; average >=80% -> '🏗️ Proceed to Pillar' -> completeStep(); average <80% -> penalize() fires once, completeStep() still auto-called 1500ms later.",
    "Average below 80%: penalize() (-15 pts, shake, red feedback), but stage still auto-advances.",
    "YES (random per-checkpoint 90-100 inspection score for pass/fail threshold only; -15 penalize() if average <80%; plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 3411 (STEP_HANDLERS[12])")

add("DS-14", M, 14, "14. Pillar Construction",
    "Install formwork around the pre-placed column rebar, pour concrete, water and cure it, then strip the formwork.",
    "Multi-phase: click .panel-item to install column formwork, hold '🚛 POUR COLUMN' (88-98% target zone), click '💧 Water Column Concrete', strip formwork; finishes with '🪣 Proceed to Backfilling' button. Identical mechanic to SF-10/DP-14.",
    "All phases complete, final button clicked, calling completeStep().",
    "Same underfill/overfill pour penalties as DS-10 apply to the column pour sub-phase.",
    "YES (stage-specific pour-quality penalties, plus the universal +50 completion bonus)",
    CAM_YES, RESET_NOTE, S, "line 3486 (STEP_HANDLERS[13])")

add("DS-15", M, 15, "15. Backfilling",
    "Refill soil around the finished pillar and compact it - only the column top remains above ground.",
    "Click '🪣 Add Soil' 5 times, then '🔨 Compact' 3 times once fill exceeds 60%; finishes with '🏆 Construction Complete!' button. Identical mechanic to SF-11/DP-15.",
    "Fill reaches 100% and compaction cycles complete, final button clicked -> completeStep() -> showResult() displays the final score/grade overlay (last stage).",
    "A 'wrong' feedback / shakeScene() path exists in source consistent with a compaction-order rule; exact trigger condition not independently re-verified line-by-line in this pass.",
    "YES (+50 completion bonus; final stage, Final Score and text grade displayed on the result overlay)",
    CAM_YES, RESET_NOTE, S, "line 3786 (STEP_HANDLERS[14])")

HEADER = ["stage_id","module","stage_number","stage_title","stage_description",
          "required_user_action","completion_condition","incorrect_action_behavior",
          "scoring_present","camera_interaction_present","reset_supported",
          "source_file","source_line_or_function"]

out_path = "/Users/yashpatel/Documents/CIVIL/research_evaluation/stage_inventory.csv"
with open(out_path, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(HEADER)
    w.writerows(rows)

print(f"Wrote {len(rows)} rows to {out_path}")
