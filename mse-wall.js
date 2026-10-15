/* ============================================================
   MSE (MECHANICALLY STABILIZED EARTH) WALL CONSTRUCTION SIMULATION
   THREE is loaded globally from three.min.js
   ============================================================ */

/* ══════════════════════════════════════════════════════════════
   INLINE ORBIT CONTROLS
══════════════════════════════════════════════════════════════ */

class OrbitControls {
  constructor(camera, domElement) {
    this.camera         = camera;
    this.domElement     = domElement;
    this.target         = new THREE.Vector3();
    this.enableDamping  = false;
    this.dampingFactor  = 0.05;
    this.maxPolarAngle  = Math.PI;
    this.minDistance    = 1;
    this.maxDistance    = Infinity;

    this._sph      = new THREE.Spherical();
    this._dSph     = { theta: 0, phi: 0 };
    this._scale    = 1;
    this._down     = false;
    this._panDown  = false;
    this._px = 0; this._py = 0;
    this._ppx = 0; this._ppy = 0;
    this._panDeltaX = 0; this._panDeltaY = 0;

    const el = domElement;
    el.addEventListener('pointerdown', e => {
      const isRotate = e.button === 0 && !e.shiftKey;
      const isPan    = e.button === 2 || (e.button === 0 && e.shiftKey);
      if (isRotate) {
        this._down = true; this._px = e.clientX; this._py = e.clientY;
        el.setPointerCapture(e.pointerId);
      } else if (isPan) {
        this._panDown = true; this._ppx = e.clientX; this._ppy = e.clientY;
        el.setPointerCapture(e.pointerId);
      }
    });
    el.addEventListener('pointermove', e => {
      if (this._down) {
        const r = el.getBoundingClientRect();
        this._dSph.theta -= 2 * Math.PI * (e.clientX - this._px) / r.width  * 0.8;
        this._dSph.phi   -= 2 * Math.PI * (e.clientY - this._py) / r.height * 0.8;
        this._px = e.clientX; this._py = e.clientY;
      }
      if (this._panDown) {
        this._panDeltaX += e.clientX - this._ppx;
        this._panDeltaY += e.clientY - this._ppy;
        this._ppx = e.clientX; this._ppy = e.clientY;
      }
    });
    el.addEventListener('pointerup',    () => { this._down = false; this._panDown = false; });
    el.addEventListener('pointerleave', () => { this._down = false; this._panDown = false; });
    el.addEventListener('wheel', e => {
      e.preventDefault();
      this._scale *= e.deltaY > 0 ? 1.1 : (1 / 1.1);
    }, { passive: false });
    el.addEventListener('contextmenu', e => e.preventDefault());
  }

  update() {
    const off = new THREE.Vector3().copy(this.camera.position).sub(this.target);
    this._sph.setFromVector3(off);
    this._sph.theta += this._dSph.theta;
    this._sph.phi   += this._dSph.phi;
    this._sph.phi    = Math.max(0.05, Math.min(this.maxPolarAngle, this._sph.phi));
    this._sph.radius = Math.max(this.minDistance,
                        Math.min(this.maxDistance, this._sph.radius * this._scale));
    this._sph.makeSafe();

    if (this._panDeltaX !== 0 || this._panDeltaY !== 0) {
      const panSpeed = this._sph.radius * 0.0012;
      const right = new THREE.Vector3();
      right.crossVectors(
        new THREE.Vector3().copy(this.camera.position).sub(this.target).normalize(),
        this.camera.up
      ).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      this.target.addScaledVector(right, -this._panDeltaX * panSpeed);
      this.target.addScaledVector(up,     this._panDeltaY * panSpeed);
      this._panDeltaX = 0; this._panDeltaY = 0;
    }

    if (this.enableDamping) {
      this._dSph.theta *= (1 - this.dampingFactor);
      this._dSph.phi   *= (1 - this.dampingFactor);
      this._scale      += (1 - this._scale) * this.dampingFactor;
    } else {
      this._dSph.theta = 0; this._dSph.phi = 0; this._scale = 1;
    }
    off.setFromSpherical(this._sph);
    this.camera.position.copy(this.target).add(off);
    this.camera.lookAt(this.target);
  }
}

/* ══════════════════════════════════════════════════════════════
   CONSTANTS -- STEP CONTENT
   The wall grows in repeating courses (panel row -> strip
   reinforcement -> backfill lift), so the per-course steps are
   generated from a template instead of hand-authored three times.
══════════════════════════════════════════════════════════════ */

const N_COURSES = 3;
const REINFORCEMENT_LAYERS_PER_COURSE = 3;
const SOIL_LIFTS_PER_COURSE = 3;

function courseStepDefs(courseNum, startIndex) {
  const seat = courseNum === 1 ? 'on the leveling pad' : `on top of Course ${courseNum - 1}`;
  return [
    {
      title: `${startIndex + 1}. Course ${courseNum} — Place & Brace Facing Panels`,
      desc: `Set the Course ${courseNum} precast facing panels ${seat}, and prop each one plumb with temporary bracing.`,
      subtasks: ['Place facing panels', 'Install temporary bracing'],
      why: "The facing is not structural -- it is thin precast concrete that only has to hold its shape until the reinforced soil behind it takes over. Bracing holds it plumb until then.",
      warning: 'An unbraced panel row can lean or topple before there is any backfill behind it to hold it upright.'
    },
    {
      title: `${startIndex + 2}. Course ${courseNum} — Lay Base Strip Reinforcement`,
      desc: `Lay the first of three steel-strip layers for Course ${courseNum}, hooking every strip onto its panel connector.`,
      subtasks: ['Lay reinforcement layer 1 of 3'],
      why: "The strip-to-panel connection ties the facing to the reinforced soil mass -- without it the panels are just an unsupported, free-standing skin.",
      warning: "A strip that isn't properly hooked to its connector carries no load at all, no matter how well it is buried."
    },
    {
      title: `${startIndex + 3}. Course ${courseNum} — Reinforce, Backfill & Compact`,
      desc: `Build Course ${courseNum} in three compacted soil lifts, installing another strip layer before lifts 2 and 3, then strike the temporary bracing.`,
      subtasks: ['Add soil lift 1', 'Compact soil lift 1', 'Install reinforcement layer 2', 'Add soil lift 2', 'Compact soil lift 2', 'Install reinforcement layer 3', 'Add soil lift 3', 'Compact soil lift 3'],
      why: "Compaction develops the friction between the soil and the strips -- an MSE wall's strength comes from this friction, not from the concrete facing.",
      warning: 'Under-compacted backfill lets the strips pull through the soil instead of gripping it -- a silent, hard-to-detect failure mode.'
    }
  ];
}

function courseStepMeta(courseNum) {
  return [
    {
      purpose: `Erect the Course ${courseNum} facing panels plumb and stable before any reinforcement or fill goes in behind them.`,
      userAction: `Place the Course ${courseNum} panels, then install temporary bracing.`,
      tools: ['Precast facing panels', 'Timber braces', 'Crane / manual set'],
      qualityCheck: 'Panels plumb and evenly jointed; bracing holds them firmly in place.',
      commonMistake: 'Skipping bracing because the panel "looks" stable standing on its own.',
      learningObjective: 'MSE facing panels carry no load on their own -- bracing is what keeps them in place until the reinforced soil takes over.'
    },
    {
      purpose: `Connect the reinforced soil system to the Course ${courseNum} facing so load transfers from the panels into the strips.`,
      userAction: 'Lay the base strip layer and hook every strip onto its panel connector.',
      tools: ['Steel strip reinforcement', 'Panel connector loops'],
      qualityCheck: 'Every base-layer strip seated on its connector and running perpendicular to the wall face.',
      commonMistake: 'Laying strips loosely without confirming the connector hook is fully engaged.',
      learningObjective: 'The strip-to-panel connection, not the concrete facing, is what actually resists the retained soil pressure.'
    },
    {
      purpose: `Densify the Course ${courseNum} backfill so it grips the strip reinforcement by friction.`,
      userAction: 'Place and compact three soil lifts, adding the next reinforcement layer before each higher lift.',
      tools: ['Select granular backfill', 'Plate / roller compactor'],
      qualityCheck: 'Three reinforcement elevations are connected and each loose lift is compacted before the next is placed; bracing is removed only after lift 3.',
      commonMistake: 'Compacting too close to the panel face with heavy equipment, which can shove the panels out of alignment.',
      learningObjective: "An MSE wall gets its strength from compacted soil friction on the strips, not from the facing panels resisting pressure directly."
    }
  ];
}

function supervisedCourseStepDef(courseNum, stepNumber) {
  return {
    title: `${stepNumber}. Course ${courseNum} — Supervised Automated Cycle`,
    desc: `Use the Course 1 method as the crew builds Course ${courseNum} automatically. Monitor the sequence and release work at the quality hold point.`,
    subtasks: ['Start the automated course cycle', 'Approve the quality hold point', 'Monitor 3 reinforcement layers and 3 compacted lifts'],
    why: 'Real construction crews repeat established work while the engineer supervises quality gates. You already learned the hands-on sequence in Course 1; now your job changes from installer to supervisor.',
    warning: 'Automation does not remove quality control — panels, connections, and lift compaction still have to be verified before the crew proceeds.'
  };
}

function supervisedCourseStepMeta(courseNum) {
  return {
    purpose: `Build Course ${courseNum} efficiently by repeating the proven Course 1 method under active quality supervision.`,
    userAction: 'Start the crew, observe the sequence, and answer the quality hold-point question before backfilling is released.',
    tools: ['Precast facing panels', 'Steel strip reinforcement', 'Loader', 'Roller compactor', 'QA hold-point checklist'],
    qualityCheck: 'Panel row braced and plumb, all three strip elevations connected, and each of the three soil lifts compacted before the next course.',
    commonMistake: 'Treating repetitive work as automatic approval and missing a bad connection or under-compacted lift.',
    learningObjective: 'Repetitive construction is managed through production cycles plus deliberate quality gates, not by repeating every manual action yourself.'
  };
}

const STEPS = [
  {
    title: '1. Site Investigation',
    desc: 'Conduct soil boring tests at 5 locations along the wall alignment to assess foundation bearing capacity and identify a suitable select backfill source for the reinforced soil zone.',
    subtasks: ['Test point BH-1', 'Test point BH-2', 'Test point BH-3', 'Test point BH-4', 'Test point BH-5', 'Review soil report'],
    why: 'An MSE wall depends on friction between the backfill and the strip reinforcement -- the foundation soil and the backfill source must both be confirmed before design.',
    warning: 'Using fine, poorly-draining soil as reinforced backfill defeats the friction mechanism the whole wall relies on.'
  },
  {
    title: '2. Wall Alignment & Footprint Layout',
    desc: 'Stake out the wall face alignment and the full reinforced-soil-zone footprint -- much wider than the wall itself -- at three points along the run.',
    subtasks: ['Place stake — Start', 'Place stake — Mid', 'Place stake — End'],
    why: 'Unlike a cantilever wall, an MSE wall needs the ground behind the face excavated and reinforced for the full strip length, not just a footing trench.',
    warning: 'Staking only the wall face and ignoring the reinforced-zone width leaves no room on site for the reinforcement layers.'
  },
  {
    title: '3. Subgrade Excavation',
    desc: 'Excavate the full reinforced-zone footprint down to subgrade level, ready for the leveling pad.',
    subtasks: ['Excavate to subgrade level'],
    why: 'A firm, level subgrade under the leveling pad keeps the first course of panels seated true -- any error here carries up through every course above it.',
    warning: 'Over-excavating and backfilling loosely under the pad invites the whole wall to settle unevenly.'
  },
  {
    title: '4. Leveling Pad',
    desc: 'Cast a thin, unreinforced concrete leveling pad along the wall alignment to seat the first course of facing panels.',
    subtasks: ['Hold to pour leveling pad'],
    why: 'The leveling pad is not structural -- it exists purely to give the first row of panels a level, consistent seat to stand on.',
    warning: 'A crooked leveling pad throws every panel course above it out of alignment.'
  },
  ...courseStepDefs(1, 4),
  supervisedCourseStepDef(2, 8),
  supervisedCourseStepDef(3, 9),
  {
    title: '10. Crest Coping & Grading',
    desc: 'Place the coping cap along the top course and grade the crest backfill to finished level.',
    subtasks: ['Place coping cap', 'Grade crest to finish level'],
    why: 'Coping protects the top panel edge and gives the crest a clean, finished line; final grading sheds water away from the wall face instead of into it.',
    warning: 'An ungraded crest lets water pond right behind the top course, defeating the whole point of using free-draining backfill.'
  },
  {
    title: '11. Upper Road & Surface Finish',
    desc: 'Compact the upper-grade subbase and pave the two-lane road supported by the completed reinforced-soil mass.',
    subtasks: ['Compact upper-road subbase', 'Pave two-lane asphalt road'],
    why: 'The upper road is the usable space the MSE wall creates — reinforced soil makes a steep grade change practical without consuming land with a broad natural slope.',
    warning: 'Paving before the reinforced fill has reached full compaction risks settlement and cracking in the finished road.'
  },
  {
    title: '12. Road Opening & Final Inspection',
    desc: 'Open the completed upper road to traffic, then verify 5 quality checkpoints on the MSE wall supporting it.',
    subtasks: ['Open upper road to traffic', 'Check all 5 quality points', 'Average score ≥ 80%', 'Sign off construction'],
    why: 'Live traffic makes the completed system’s purpose clear: the panels provide the face, while the reinforced soil mass supports the working road above.',
    warning: 'The road must not open until facing alignment, strip connections, lift compaction, drainage, and roadway support all pass inspection.'
  }
];

const STEP_META = [
  {
    purpose: 'Determine foundation bearing capacity and confirm a select granular source is available for the reinforced backfill.',
    userAction: 'Click all 5 soil boring markers and review the soil report.',
    tools: ['Soil boring rig', 'SPT sampler', 'Geotechnical lab'],
    qualityCheck: 'All boring locations tested; bearing capacity and backfill friction angle documented.',
    commonMistake: 'Checking only foundation bearing and never confirming the backfill source has adequate friction and drainage.',
    learningObjective: 'An MSE wall design depends on two separate soil questions: what the ground below can bear, and what the fill behind it can grip.'
  },
  {
    purpose: 'Establish the wall face alignment and the full reinforced-soil-zone footprint before excavation.',
    userAction: 'Click each stake point to mark the alignment and footprint.',
    tools: ['Total station', 'Survey stakes', 'Steel tape', 'Design drawings'],
    qualityCheck: 'Alignment within ±25mm of design coordinates; footprint width matches the design strip length.',
    commonMistake: 'Staking only the wall face line, the way a cantilever wall footing would be staked.',
    learningObjective: "An MSE wall's footprint is defined by strip length, not wall thickness -- it needs far more room behind the face than a concrete wall does."
  },
  {
    purpose: 'Excavate the full reinforced-zone footprint to a clean, level subgrade.',
    userAction: 'Hold EXCAVATE to dig to design subgrade level.',
    tools: ['Excavator', 'Laser level', 'Depth gauge'],
    qualityCheck: 'Subgrade at design level across the full footprint width, not just under the wall face.',
    commonMistake: 'Excavating only a narrow trench at the wall line and leaving the rest of the reinforced zone untouched.',
    learningObjective: 'Every square meter of the reinforced soil zone needs the same prepared subgrade as the wall face itself.'
  },
  {
    purpose: 'Give the first course of facing panels a clean, level surface to seat on.',
    userAction: 'Hold to pour the unreinforced leveling pad.',
    tools: ['Plain cement concrete', 'Screed board'],
    qualityCheck: 'Pad level and cured before the first panel course is set.',
    commonMistake: 'Setting panels directly on graded soil, letting the first course tilt out of level.',
    learningObjective: 'Like a blinding layer under a footing, the leveling pad is not structural -- it only exists to give the first course a true starting line.'
  },
  ...courseStepMeta(1),
  supervisedCourseStepMeta(2),
  supervisedCourseStepMeta(3),
  {
    purpose: 'Finish the crest of the wall so it sheds water and presents a clean top edge.',
    userAction: 'Place the coping cap, then grade the crest backfill to finished level.',
    tools: ['Precast coping units', 'Grading rake', 'Compactor'],
    qualityCheck: 'Coping continuous along the crest; backfill graded to shed water away from the wall face.',
    commonMistake: 'Leaving the crest flat or sloped toward the wall, so runoff drains straight down behind the panels.',
    learningObjective: 'A wall built correctly below grade can still fail from water intrusion if the crest above it is not finished to shed water away.'
  },
  {
    purpose: 'Build the upper roadway that the completed reinforced-soil structure was designed to support.',
    userAction: 'Compact the upper-road subbase, then pave the two-lane asphalt surface.',
    tools: ['Compactor', 'Asphalt paver', 'Subbase aggregate'],
    qualityCheck: 'Subbase compacted to spec; pavement level and safely set back behind the coping and guardrail.',
    commonMistake: 'Paving over incompletely compacted reinforced fill and assuming the asphalt will bridge later settlement.',
    learningObjective: 'MSE walls frequently create roadway width at an upper grade that a natural slope could not provide.'
  },
  {
    purpose: 'Commission the upper road and confirm the full MSE system safely supports active traffic.',
    userAction: 'Observe live traffic, then click each inspection point and review the pass/fail results.',
    tools: ['Inspection checklist', 'Level', 'Connection records', 'Density records', 'Road level survey'],
    qualityCheck: 'All 5 checkpoints pass with an average score of 80% or higher, including roadway support.',
    commonMistake: 'Judging the wall only by how straight the facing looks, without checking what is buried behind it.',
    learningObjective: 'An MSE wall is a reinforced soil structure supporting real infrastructure, so buried construction quality controls surface performance.'
  }
];

const SOIL_RESULTS = [
  { soil: 'Sandy Gravel',     bearing: '220 kN/m²', moisture: '9%',  note: 'Excellent select backfill source' },
  { soil: 'Silty Clay',       bearing: '140 kN/m²', moisture: '23%', note: 'Too fine and poor-draining for reinforced backfill' },
  { soil: 'Well-Graded Sand', bearing: '260 kN/m²', moisture: '11%', note: 'Ideal reinforced-zone backfill, high friction angle' },
  { soil: 'Soft Silt',        bearing: '90 kN/m²',  moisture: '27%', note: 'Weak subgrade -- remove and replace before pad' },
  { soil: 'Dense Gravel',     bearing: '300 kN/m²', moisture: '6%',  note: 'Strong foundation soil, drains freely' }
];

const FINAL_CHECKS = [
  { label: 'Panel Alignment',    note: 'Facing plumb within tolerance, joints tight along the run.' },
  { label: 'Strip Connections',  note: 'All 9 reinforcement layers fully engaged at their panel connectors.' },
  { label: 'Lift Compaction',    note: 'Each backfill lift meets target density behind the panels.' },
  { label: 'Crest Drainage',     note: 'Crest graded to shed water away from the wall face.' },
  { label: 'Roadway Support',    note: 'Upper road is level, supported, and safely protected at the wall crest.' }
];

/* ══════════════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════════════ */

const STATE = {
  currentStep: 0,
  score: 1000,
  penalties: 0,
  stepState: {},
  intervals: [],
  timeouts: []
};

/* ══════════════════════════════════════════════════════════════
   DOM REFS
══════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const DOM = {
  scoreVal:      () => $('score-val'),
  stepCur:       () => $('step-cur'),
  taskTitle:     () => $('task-title'),
  taskDesc:      () => $('task-desc'),
  taskSubs:      () => $('task-subtasks'),
  taskWhy:       () => $('task-why'),
  taskWarn:      () => $('task-warning'),
  checklist:     () => $('checklist'),
  scene:         () => $('scene'),
  actionBar:     () => $('action-bar'),
  feedbackBar:   () => $('feedback-bar'),
  resultOverlay: () => $('result-overlay'),
  resultScore:   () => $('result-score'),
  resultGrade:   () => $('result-grade')
};

/* ══════════════════════════════════════════════════════════════
   THREE.JS SETUP
══════════════════════════════════════════════════════════════ */

const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x96b0bc);
scene.fog = new THREE.Fog(0x96b0bc, 45, 95);

const sceneEl = DOM.scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneEl.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(15, 6, -8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.85;
controls.minDistance   = 3;
controls.maxDistance   = 80;
controls.target.set(0, 1.5, 1.5);

renderer.domElement.addEventListener('pointerdown', () => { camTarget = null; });
renderer.domElement.addEventListener('wheel',       () => { camTarget = null; }, { passive: true });

const ambientLight = new THREE.AmbientLight(0xdce8f0, 1.1);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff0d8, 2.2);
keyLight.position.set(25, 40, 20);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width  = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near   = 0.5;
keyLight.shadow.camera.far    = 120;
keyLight.shadow.camera.left   = -35;
keyLight.shadow.camera.right  =  35;
keyLight.shadow.camera.top    =  35;
keyLight.shadow.camera.bottom = -35;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x90b8d0, 0.5);
fillLight.position.set(-20, 15, -10);
scene.add(fillLight);

const groundBounce = new THREE.DirectionalLight(0xc8a870, 0.3);
groundBounce.position.set(0, -15, 5);
scene.add(groundBounce);

function onResize() {
  const w = sceneEl.clientWidth  || 480;
  const h = sceneEl.clientHeight || 400;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

/* ══════════════════════════════════════════════════════════════
   PROCEDURAL TEXTURES
══════════════════════════════════════════════════════════════ */

function makeCanvasTexture(drawFn, size) {
  size = size || 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const TEX = {
  grass: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#4a8c2a';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = 4 + Math.random() * 14;
      ctx.fillStyle = `hsl(${110 + Math.random() * 20},${50 + Math.random() * 20}%,${20 + Math.random() * 15}%)`;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill();
    }
  }),
  dirt: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#8B6340';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = 3 + Math.random() * 10;
      ctx.fillStyle = `hsl(30,${35 + Math.random() * 20}%,${22 + Math.random() * 18}%)`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }),
  siteSoil: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#b89362';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 240; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = 0.7 + Math.random() * 2.6;
      const light = 38 + Math.random() * 24;
      ctx.fillStyle = `hsl(${30 + Math.random() * 8},${25 + Math.random() * 20}%,${light}%)`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }),
  backfill: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#a77c49';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 330; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = 0.8 + Math.random() * 3.2;
      const light = 27 + Math.random() * 25;
      ctx.fillStyle = `hsl(${27 + Math.random() * 9},${30 + Math.random() * 24}%,${light}%)`;
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.4, r, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill();
    }
  }),
  concrete: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#b8b8b8';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    for (let i = 0; i < s; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
    }
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = 1 + Math.random() * 3;
      const g = Math.floor(140 + Math.random() * 60);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }),
  wood: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#c8902a';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 4 + Math.random() * 5) {
      ctx.strokeStyle = `rgba(80,40,0,${0.15 + Math.random() * 0.25})`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i + (Math.random() - 0.5) * 6); ctx.stroke();
    }
  }),
  panel: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#d8d8d6';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(105,105,100,0.55)';
    ctx.lineWidth = 3;
    for (let d = -s; d < s * 2; d += 16) {
      ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d - s, s); ctx.stroke();
    }
    ctx.strokeStyle = '#858581';
    ctx.lineWidth = 5;
    ctx.strokeRect(2.5, 2.5, s - 5, s - 5);
  }),
  asphalt: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#2b2b2e';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * s, y = Math.random() * s, r = 1 + Math.random() * 2;
      ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.05})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#e8c74a';
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 14]);
    ctx.beginPath(); ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2); ctx.stroke();
  }),
  gravel: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#9e9e8a';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = 2 + Math.random() * 6;
      const g = Math.floor(120 + Math.random() * 90);
      ctx.fillStyle = `rgb(${g},${g},${g - 10})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  })
};

TEX.grass.repeat.set(4, 4);
TEX.dirt.repeat.set(2, 2);
TEX.siteSoil.repeat.set(5, 5);
TEX.backfill.repeat.set(3, 2);
TEX.concrete.repeat.set(2, 4);
TEX.wood.repeat.set(1, 3);
TEX.panel.repeat.set(1, 1);
TEX.asphalt.repeat.set(3, 1);
TEX.gravel.repeat.set(2, 2);

/* ══════════════════════════════════════════════════════════════
   MATERIALS
══════════════════════════════════════════════════════════════ */

const MAT = {
  grass:      new THREE.MeshLambertMaterial({ color: 0xffffff, map: TEX.grass, side: THREE.DoubleSide }),
  concrete:   new THREE.MeshLambertMaterial({ map: TEX.concrete }),
  pcc:        new THREE.MeshLambertMaterial({ color: 0xaaaaaa, map: TEX.concrete }),
  panelFace:  new THREE.MeshLambertMaterial({ map: TEX.panel }),
  connector:  new THREE.MeshLambertMaterial({ color: 0x111111 }),
  steelStrip: new THREE.MeshLambertMaterial({ color: 0x4b5560 }),
  wood:       new THREE.MeshLambertMaterial({ map: TEX.wood }),
  dirt:       new THREE.MeshLambertMaterial({ map: TEX.dirt }),
  siteSoil:   new THREE.MeshLambertMaterial({ map: TEX.siteSoil, side: THREE.DoubleSide }),
  backfill:   new THREE.MeshLambertMaterial({ color: 0xc28b52, map: TEX.backfill }),
  gravel:     new THREE.MeshLambertMaterial({ map: TEX.gravel }),
  asphalt:    new THREE.MeshLambertMaterial({ map: TEX.asphalt }),
  darkGray:   new THREE.MeshLambertMaterial({ color: 0x37474f }),
  machineYellow: new THREE.MeshLambertMaterial({ color: 0xd99b13 }),
  machineGlass:  new THREE.MeshLambertMaterial({ color: 0x7696a8, transparent: true, opacity: 0.8 }),
  tire:          new THREE.MeshLambertMaterial({ color: 0x191919 }),
  voidDark:   new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
  markerOrange: new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.4 }),
  markerGreen:  new THREE.MeshStandardMaterial({ color: 0x00cc44, emissive: 0x00aa22, emissiveIntensity: 0.3 }),
  diamondBlue:  new THREE.MeshStandardMaterial({ color: 0x2196f3, emissive: 0x1565c0, emissiveIntensity: 0.4 })
};

/* ══════════════════════════════════════════════════════════════
   SCENE OBJECT MANAGEMENT
══════════════════════════════════════════════════════════════ */

let stepObjects   = [];
let clickables3D  = [];
const particlePool = [];

const OBJ = {};

function addStep(obj) {
  scene.add(obj);
  stepObjects.push(obj);
  return obj;
}

function clearScene3D() {
  stepObjects.forEach(o => scene.remove(o));
  stepObjects = [];
  clickables3D = [];
  clearActiveLabels();
  delete OBJ.compactor;
  delete OBJ.loader;
  delete OBJ.digSpoil;
  delete OBJ.pccSlab;
  delete OBJ.roadVehicles;
}

/* ══════════════════════════════════════════════════════════════
   CAMERA PRESETS
   The default vantage rises with the wall as courses are added, then
   settles into a wide finishing shot for the last 3 steps.
══════════════════════════════════════════════════════════════ */

const CAM_SITE  = { pos: new THREE.Vector3(25, 8.0, -12), look: new THREE.Vector3(0, 0.5, 1.6) };
const CAM_NEAR  = { pos: new THREE.Vector3(24, 7.0,   9), look: new THREE.Vector3(0, 0.8, 1.8) };
const CAM_MID   = { pos: new THREE.Vector3(25, 8.0,   9), look: new THREE.Vector3(0, 1.7, 1.9) };
const CAM_TALL  = { pos: new THREE.Vector3(26, 9.5,   9), look: new THREE.Vector3(0, 2.6, 2.0) };
const CAM_WIDE  = { pos: new THREE.Vector3(25, 13.0, -15), look: new THREE.Vector3(0, 2.4, 5.2) };

const CAM_PRESETS = [
  CAM_SITE, CAM_SITE, CAM_SITE, CAM_SITE,      // 0-3 site / layout / excavation / pad
  CAM_NEAR, CAM_NEAR, CAM_NEAR,               // 4-6 course 1
  CAM_MID,                                     // 7 supervised course 2
  CAM_TALL,                                    // 8 supervised course 3
  CAM_WIDE, CAM_WIDE, CAM_WIDE                // 9-11 coping / pavement / inspection
];

let camTarget = null;

function setCamPreset(n) {
  const p = CAM_PRESETS[Math.min(n, CAM_PRESETS.length - 1)];
  camTarget = { pos: p.pos.clone(), look: p.look.clone() };
}

const VIEW_PRESETS = {
  iso:     { pos: new THREE.Vector3(25, 10, -14), look: new THREE.Vector3(0, 1.8, 2.4) },
  top:     { pos: new THREE.Vector3(0, 36, 2),   look: new THREE.Vector3(0, 0, 2.4) },
  front:   { pos: new THREE.Vector3(0, 5, -28),  look: new THREE.Vector3(0, 1.8, 1.6) },
  cutaway: { pos: new THREE.Vector3(25, 8, 9),   look: new THREE.Vector3(0, 1.8, 2.0) }
};

window.setCameraView = function(name) {
  const p = VIEW_PRESETS[name];
  if (p) camTarget = { pos: p.pos.clone(), look: p.look.clone() };
};

window.resetCamera = function() {
  setCamPreset(STATE.currentStep);
  controls.target.set(0, 1.5, 1.6);
};

/* ══════════════════════════════════════════════════════════════
   RAYCASTING
══════════════════════════════════════════════════════════════ */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getClickable(hitObj) {
  return clickables3D.find(c => {
    if (c.mesh === hitObj) return true;
    let p = hitObj.parent;
    while (p) { if (p === c.mesh) return true; p = p.parent; }
    return false;
  });
}

renderer.domElement.addEventListener('click', evt => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x =  ((evt.clientX - rect.left) / rect.width)  * 2 - 1;
  mouse.y = -((evt.clientY - rect.top)  / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickables3D.map(c => c.mesh), true);
  if (hits.length > 0) {
    const found = getClickable(hits[0].object);
    if (found) found.onHit();
  }
});

renderer.domElement.addEventListener('pointermove', evt => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x =  ((evt.clientX - rect.left) / rect.width)  * 2 - 1;
  mouse.y = -((evt.clientY - rect.top)  / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickables3D.map(c => c.mesh), true);
  renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'default';
});

/* ══════════════════════════════════════════════════════════════
   3D HTML LABELS
══════════════════════════════════════════════════════════════ */

const labelsContainer = document.getElementById('labels-3d');
let activeLabels = [];

function create3DLabel(mesh, text, cls) {
  const div = document.createElement('div');
  div.className = 'label-3d' + (cls ? ' ' + cls : '');
  div.textContent = text;
  labelsContainer.appendChild(div);
  activeLabels.push({ mesh, element: div });
  return div;
}

function clearActiveLabels() {
  activeLabels.forEach(l => l.element.remove());
  activeLabels = [];
}

function update3DLabels() {
  const canvas = renderer.domElement;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const _v = new THREE.Vector3();
  activeLabels.forEach(l => {
    l.mesh.getWorldPosition(_v);
    _v.project(camera);
    const x = (_v.x *  0.5 + 0.5) * w;
    const y = (_v.y * -0.5 + 0.5) * h;
    if (_v.z < 1) {
      l.element.style.left    = x + 'px';
      l.element.style.top     = (y - 34) + 'px';
      l.element.style.display = '';
    } else {
      l.element.style.display = 'none';
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   3D POPUP — single fixed dock, never covers other markers/buttons
══════════════════════════════════════════════════════════════ */

let activePopupTimer = null;

function show3DPopup(mesh, html, duration) {
  const dock = document.getElementById('info-popup-dock');
  if (!dock) return;

  if (activePopupTimer) clearTimeout(activePopupTimer);
  dock.innerHTML = '';

  const popup = document.createElement('div');
  popup.className = 'info-popup-card';
  popup.innerHTML = html;
  dock.appendChild(popup);
  requestAnimationFrame(() => popup.classList.add('show'));

  activePopupTimer = setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => { if (popup.parentNode) popup.remove(); }, 200);
    activePopupTimer = null;
  }, duration || 2500);
}

/* ══════════════════════════════════════════════════════════════
   PARTICLES
══════════════════════════════════════════════════════════════ */

function spawnParticles(originVec, mat, count) {
  const geo = new THREE.SphereGeometry(0.06, 4, 4);
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(originVec);
    m.userData.vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      0.1 + Math.random() * 0.2,
      (Math.random() - 0.5) * 0.3
    );
    m.userData.life = 1.0;
    scene.add(m);
    stepObjects.push(m);
    particlePool.push(m);
  }
}

function updateParticles(dt) {
  for (let i = particlePool.length - 1; i >= 0; i--) {
    const p = particlePool[i];
    p.userData.life -= dt * 1.5;
    if (p.userData.life <= 0) {
      scene.remove(p);
      particlePool.splice(i, 1);
      const si = stepObjects.indexOf(p);
      if (si > -1) stepObjects.splice(si, 1);
    } else {
      p.position.addScaledVector(p.userData.vel, dt * 60 * dt);
      if (p.material.transparent) p.material.opacity = p.userData.life;
    }
  }
}

/* ══════════════════════════════════════════════════════════════
   WALL GEOMETRY CONSTANTS
   Wall runs along X, centred on the origin. Z=0 is the exposed
   (toe) face; +Z runs back into the reinforced soil zone, same
   toe/heel convention as the Retaining Wall module.
══════════════════════════════════════════════════════════════ */

// Match the site-scale retaining-wall module: a 30 m wall fills most of the
// 36 m-wide property while leaving visible termination space at both ends.
const WALL_LENGTH   = 30;
const WALL_X0       = -WALL_LENGTH / 2;
const WALL_X1       =  WALL_LENGTH / 2;

const PANEL_W       = 2.0;
const PANEL_COUNT   = WALL_LENGTH / PANEL_W;      // 15
const PANEL_H       = 1.5;
const PANEL_THICK   = 0.18;

const STRIP_LENGTH  = 3.0;
const STRIP_SPACING = 0.6;

const TOE_GRADE_Y   = 0;                          // finished grade, exposed/toe side
const SUBGRADE_Y    = -0.35;                       // excavated formation level
const PAD_THICK     = 0.15;
const PAD_TOP_Y     = SUBGRADE_Y + PAD_THICK;      // -0.20

function COURSE_BASE_Y(c) { return PAD_TOP_Y + c * PANEL_H; }
function REINFORCEMENT_LAYER_Y(c, layerIndex) {
  return COURSE_BASE_Y(c) + 0.1 + layerIndex * (PANEL_H / SOIL_LIFTS_PER_COURSE);
}

const WALL_TOP_Y       = PAD_TOP_Y + N_COURSES * PANEL_H;   // 4.30
const RETAINED_GRADE_Y = WALL_TOP_Y;                        // crest grade once finished

const PANEL_Z0 = 0;
const PANEL_Z1 = PANEL_THICK;

const TRENCH_MARGIN_FRONT = 0.8;
const TRENCH_Z0 = PANEL_Z0 - TRENCH_MARGIN_FRONT;
const TRENCH_Z1 = PANEL_Z1 + STRIP_LENGTH + 0.4;

/* ══════════════════════════════════════════════════════════════
   GROUND / SITE
══════════════════════════════════════════════════════════════ */

let groundGroup = new THREE.Group();
scene.add(groundGroup);

const GROUND_HALF = 18;
const HOLE_X0 = WALL_X0 - 0.5;
const HOLE_X1 = WALL_X1 + 0.5;
const HOLE_Z0 = TRENCH_Z0;
const HOLE_Z1 = TRENCH_Z1;

// The retained side is the toe of an existing bank the wall holds back --
// same device used in the Retaining Wall module. The rise starts right at
// the reinforced-zone margin so the finished backfill ties into existing
// grade with no visible gap.
const RAMP_Z0  = HOLE_Z1 + 0.05;
const RAMP_RUN = 2.2;
const RAMP_Z1  = RAMP_Z0 + RAMP_RUN;

function buildSlopedQuad(z0, y0, z1, y1) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array([
    -GROUND_HALF, y0, z0,
     GROUND_HALF, y0, z0,
     GROUND_HALF, y1, z1,
    -GROUND_HALF, y1, z1
  ]);
  const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, MAT.siteSoil);
  mesh.receiveShadow = true;
  return mesh;
}

function addHillside() {
  groundGroup.add(buildSlopedQuad(RAMP_Z0, TOE_GRADE_Y, RAMP_Z1, RETAINED_GRADE_Y));
  const plateau = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_HALF * 2, GROUND_HALF - RAMP_Z1), MAT.siteSoil);
  plateau.rotation.x = -Math.PI / 2;
  plateau.position.set(0, RETAINED_GRADE_Y - 0.01, (RAMP_Z1 + GROUND_HALF) / 2);
  plateau.receiveShadow = true;
  groundGroup.add(plateau);
}

function buildGround() {
  while (groundGroup.children.length) groundGroup.remove(groundGroup.children[0]);
  const flat = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_HALF * 2, GROUND_HALF + RAMP_Z0), MAT.siteSoil);
  flat.rotation.x = -Math.PI / 2;
  flat.position.set(0, TOE_GRADE_Y - 0.01, (-GROUND_HALF + RAMP_Z0) / 2);
  flat.receiveShadow = true;
  groundGroup.add(flat);
  addHillside();
}

function buildGroundWithTrench() {
  while (groundGroup.children.length) groundGroup.remove(groundGroup.children[0]);

  function piece(w, d, cx, cz) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.siteSoil);
    m.rotation.x = -Math.PI / 2;
    m.position.set(cx, TOE_GRADE_Y - 0.01, cz);
    m.receiveShadow = true;
    groundGroup.add(m);
  }

  piece(HOLE_X0 - (-GROUND_HALF), GROUND_HALF + RAMP_Z0, (-GROUND_HALF + HOLE_X0) / 2, (-GROUND_HALF + RAMP_Z0) / 2);
  piece(GROUND_HALF - HOLE_X1,    GROUND_HALF + RAMP_Z0, (HOLE_X1 + GROUND_HALF) / 2, (-GROUND_HALF + RAMP_Z0) / 2);
  piece(HOLE_X1 - HOLE_X0, HOLE_Z0 - (-GROUND_HALF), (HOLE_X0 + HOLE_X1) / 2, (-GROUND_HALF + HOLE_Z0) / 2);
  piece(HOLE_X1 - HOLE_X0, RAMP_Z0 - HOLE_Z1,         (HOLE_X0 + HOLE_X1) / 2, (HOLE_Z1 + RAMP_Z0) / 2);

  addHillside();
}

let siteGroup = null;

function buildSiteElements() {
  if (siteGroup) scene.remove(siteGroup);
  siteGroup = new THREE.Group();
  scene.add(siteGroup);

  const matBarrier  = new THREE.MeshLambertMaterial({ color: 0xd0d0d0 });
  const matBarrierS = new THREE.MeshLambertMaterial({ color: 0xb0b0b0 });

  function addBarrier(x, z, rotY) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.5), matBarrier);
    base.position.y = 0.15; g.add(base);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.36), matBarrier);
    body.position.y = 0.6; g.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.24), matBarrierS);
    top.position.y = 0.96; g.add(top);
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    siteGroup.add(g);
  }
  for (let x = WALL_X0 - 3; x <= WALL_X1 + 3; x += 2.2) addBarrier(x, TRENCH_Z1 + 10, 0);

  const coneMat = new THREE.MeshLambertMaterial({ color: 0xff5500 });
  const coneWhite = new THREE.MeshLambertMaterial({ color: 0xffffff });
  function addCone(x, z) {
    const cg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 8), coneMat);
    body.position.y = 0.28; cg.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.06, 8), coneWhite);
    band.position.y = 0.22; cg.add(band);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 8), coneMat);
    base.position.y = 0.02; cg.add(base);
    cg.position.set(x, 0, z);
    siteGroup.add(cg);
  }
  addCone(WALL_X0 - 1, TRENCH_Z0 - 1);
  addCone(WALL_X1 + 1, TRENCH_Z0 - 1);
  addCone(0, TRENCH_Z1 + 1.5);
}

/* ══════════════════════════════════════════════════════════════
   MSE ELEMENT BUILDERS
══════════════════════════════════════════════════════════════ */

// A cylinder strut running between two arbitrary points -- reused for the
// panel bracing struts.
function strutBetween(p1, p2, mat, radius) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 6), mat);
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

function buildTrenchVoid() {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH + 1, 0.06, TRENCH_Z1 - TRENCH_Z0), MAT.siteSoil);
  floor.position.set(0, SUBGRADE_Y, (TRENCH_Z0 + TRENCH_Z1) / 2);
  g.add(floor);
  const front = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH + 1, TOE_GRADE_Y - SUBGRADE_Y, 0.06), MAT.dirt);
  front.position.set(0, (TOE_GRADE_Y + SUBGRADE_Y) / 2, TRENCH_Z0);
  g.add(front);
  const back = front.clone();
  back.position.z = TRENCH_Z1;
  g.add(back);
  const endL = new THREE.Mesh(new THREE.BoxGeometry(0.06, TOE_GRADE_Y - SUBGRADE_Y, TRENCH_Z1 - TRENCH_Z0), MAT.dirt);
  endL.position.set(WALL_X0 - 0.5, (TOE_GRADE_Y + SUBGRADE_Y) / 2, (TRENCH_Z0 + TRENCH_Z1) / 2);
  g.add(endL);
  const endR = endL.clone();
  endR.position.x = WALL_X1 + 0.5;
  g.add(endR);
  return g;
}

function addLevelingPadMesh() {
  const pad = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, PAD_THICK, PANEL_THICK + 0.5), MAT.pcc);
  pad.position.set(0, SUBGRADE_Y + PAD_THICK / 2, PANEL_THICK / 2);
  return addStep(pad);
}

// Steps from Course 1 onward only ever fill part of the excavated
// reinforced-zone hole with pad/panels/strips/backfill -- whatever part
// isn't covered yet would otherwise show bare sky through the ground's
// cut-out. Filling the void first, then building on top of it, keeps that
// hole visually solid at every step, the same trick used for poured
// concrete in the Retaining Wall module.
function addSubgradeFill() {
  addStep(buildTrenchVoid());
  addLevelingPadMesh();
}

// Stagger alternate courses by half a panel.  This makes the real object
// joints -- rather than lines painted into a texture -- read like the
// interlocking MSE facing shown in the reference.
function panelSpecsForCourse(c) {
  if (c % 2 === 0) {
    return Array.from({ length: PANEL_COUNT }, (_, i) => ({
      x: WALL_X0 + PANEL_W / 2 + i * PANEL_W,
      width: PANEL_W
    }));
  }

  const specs = [{ x: WALL_X0 + PANEL_W / 4, width: PANEL_W / 2 }];
  for (let x = WALL_X0 + PANEL_W / 2; x < WALL_X1 - PANEL_W / 2; x += PANEL_W) {
    specs.push({ x: x + PANEL_W / 2, width: PANEL_W });
  }
  specs.push({ x: WALL_X1 - PANEL_W / 4, width: PANEL_W / 2 });
  return specs;
}

function connectorOffsets(width) {
  return width < PANEL_W * 0.75 ? [0] : [-width * 0.24, width * 0.24];
}

function reinforcementXsForCourse(c) {
  const xs = [];
  panelSpecsForCourse(c).forEach(spec => {
    connectorOffsets(spec.width).forEach(dx => xs.push(spec.x + dx));
  });
  return xs;
}

// A course's row of facing panels. Each real panel carries visible black
// connector straps and loops at exactly the same coordinates as its strips.
function buildPanelsForCourse(c) {
  const group = new THREE.Group();
  const panels = [];
  const yCenter = COURSE_BASE_Y(c) + PANEL_H / 2;

  panelSpecsForCourse(c).forEach(spec => {
    const pg = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(spec.width - 0.055, PANEL_H - 0.055, PANEL_THICK), MAT.panelFace);
    body.castShadow = true;
    pg.add(body);

    for (let layerIndex = 0; layerIndex < REINFORCEMENT_LAYERS_PER_COURSE; layerIndex++) {
      const connectorY = REINFORCEMENT_LAYER_Y(c, layerIndex) - yCenter;
      connectorOffsets(spec.width).forEach(dx => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.26, 0.055), MAT.connector);
        strap.position.set(dx, connectorY + 0.13, PANEL_THICK / 2 + 0.035);
        pg.add(strap);

        const loop = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.025, 6, 12, Math.PI), MAT.connector);
        loop.rotation.x = Math.PI / 2;
        loop.rotation.z = Math.PI;
        loop.position.set(dx, connectorY, PANEL_THICK / 2 + 0.075);
        pg.add(loop);
      });
    }

    pg.position.set(spec.x, yCenter, PANEL_THICK / 2);
    pg.visible = false;
    group.add(pg);
    panels.push(pg);
  });

  function reveal(pct) {
    const n = Math.round(panels.length * pct);
    panels.forEach((p, i) => { p.visible = i < n; });
  }
  return { group, panels, reveal };
}

// Temporary props -- one per panel, leaning back into the area about to be
// filled, anchored at the grade the panel was erected on. Struck (hidden)
// once that course's backfill is compacted enough to hold the panel itself.
function buildBracesForCourse(c, panels) {
  const group = new THREE.Group();
  const braces = [];
  const baseY = COURSE_BASE_Y(c);

  panels.forEach(pg => {
    const px = pg.position.x;
    const top = new THREE.Vector3(px, baseY + PANEL_H * 0.8, PANEL_Z1);
    const foot = new THREE.Vector3(px, baseY, PANEL_Z1 + 1.1);
    const brace = strutBetween(top, foot, MAT.wood, 0.025);
    brace.visible = false;
    group.add(brace);
    braces.push(brace);
  });

  function reveal(pct) {
    const n = Math.round(braces.length * pct);
    braces.forEach((b, i) => { b.visible = i < n; });
  }
  function hideAll() { braces.forEach(b => { b.visible = false; }); }
  return { group, braces, reveal, hideAll };
}

// Three reinforcement elevations per course -- flat steel strips hooked to
// matching panel connectors and embedded between successive compacted lifts.
function buildStripsForCourse(c) {
  const group = new THREE.Group();
  const bars = [];
  const layers = [];

  for (let layerIndex = 0; layerIndex < REINFORCEMENT_LAYERS_PER_COURSE; layerIndex++) {
    const layerBars = [];
    const y = REINFORCEMENT_LAYER_Y(c, layerIndex);
    reinforcementXsForCourse(c).forEach(x => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.025, STRIP_LENGTH), MAT.steelStrip);
      bar.position.set(x, y, PANEL_Z1 + STRIP_LENGTH / 2 + 0.04);
      bar.visible = false;
      group.add(bar);
      bars.push(bar);
      layerBars.push(bar);
    });
    layers.push(layerBars);
  }

  function reveal(pct) {
    const n = Math.round(bars.length * pct);
    bars.forEach((b, i) => { b.visible = i < n; });
  }
  function revealLayer(layerIndex, pct) {
    const layerBars = layers[layerIndex] || [];
    const n = Math.round(layerBars.length * pct);
    layerBars.forEach((b, i) => { b.visible = i < n; });
  }
  return { group, bars, layers, reveal, revealLayer };
}

// A course's backfill has three successive lift states: loose granular piles
// delivered by a loader, then a compacted mass that grows as the roller passes.
// Its retained-side depth increases by course so the top of each lift meets
// the existing hillside instead of ending as a detached rectangular block.
function buildFillForCourse(c) {
  const baseY = COURSE_BASE_Y(c);
  const courseTop = baseY + PANEL_H;
  const hillsideReach = RAMP_RUN * Math.max(0, courseTop / RETAINED_GRADE_Y);
  const depthZ = STRIP_LENGTH + 0.5 + hillsideReach;
  const group = new THREE.Group();
  const compacted = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH + 0.35, 0.02, depthZ), MAT.backfill);
  compacted.position.set(0, baseY + 0.01, PANEL_Z1 + depthZ / 2 - 0.1);
  compacted.castShadow = true;
  compacted.receiveShadow = true;
  compacted.visible = false;
  group.add(compacted);

  const looseGroup = new THREE.Group();
  group.add(looseGroup);
  let compactedPct = 0;
  let looseMounds = [];

  function setPct(pct) {
    compactedPct = Math.max(0, Math.min(100, pct));
    compacted.visible = compactedPct > 0;
    if (compactedPct <= 0) return;
    const h = Math.max(0.02, PANEL_H * compactedPct / 100);
    compacted.scale.y = h / 0.02;
    compacted.position.y = baseY + h / 2;
  }

  function clearLoose() {
    while (looseGroup.children.length) looseGroup.remove(looseGroup.children[0]);
    looseMounds = [];
  }

  function showLooseLift(liftNumber) {
    clearLoose();
    const surfaceY = baseY + PANEL_H * (liftNumber - 1) / SOIL_LIFTS_PER_COURSE;
    const xs = [];
    for (let x = WALL_X0 + 0.8; x <= WALL_X1 - 0.8; x += 1.45) xs.push(x);
    looseMounds = xs.map((x, i) => {
      const radius = 0.48 + (i % 3) * 0.08;
      const mound = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        MAT.backfill
      );
      mound.scale.set(1.35, 0.72 + (i % 2) * 0.12, 1.0);
      mound.position.set(x, surfaceY + 0.015, PANEL_Z1 + 0.9 + (i % 3) * 0.7);
      mound.castShadow = true;
      mound.visible = false;
      mound.userData.startScale = mound.scale.clone();
      looseGroup.add(mound);
      return mound;
    });
  }

  function revealLoose(progress) {
    looseMounds.forEach((mound, i) => {
      mound.visible = progress >= i / looseMounds.length;
    });
  }

  function spreadLoose(liftNumber, progress) {
    const liftPct = 100 / SOIL_LIFTS_PER_COURSE;
    const startPct = (liftNumber - 1) * liftPct;
    setPct(startPct + liftPct * progress);
    looseMounds.forEach(mound => {
      const s = Math.max(0.08, 1 - progress * 0.92);
      mound.scale.set(
        mound.userData.startScale.x * (1 + progress * 0.5),
        mound.userData.startScale.y * s,
        mound.userData.startScale.z * (1 + progress * 0.35)
      );
      mound.material.opacity = 1;
    });
  }

  function surfaceY() {
    return baseY + PANEL_H * compactedPct / 100;
  }

  return {
    mesh: group,
    setPct,
    clearLoose,
    showLooseLift,
    revealLoose,
    spreadLoose,
    surfaceY,
    depthZ
  };
}

function buildLoaderModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.7), MAT.machineYellow);
  body.position.y = 0.48; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.58, 0.62), MAT.machineGlass);
  cab.position.set(-0.2, 0.9, 0); g.add(cab);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.64), MAT.machineYellow);
  hood.position.set(0.48, 0.72, 0); g.add(hood);
  [-0.4, 0.4].forEach(x => [-0.42, 0.42].forEach(z => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.16, 14), MAT.tire);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.25, z); g.add(wheel);
  }));
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.09, 0.12), MAT.machineYellow);
  arm.position.set(0.75, 0.55, 0); arm.rotation.z = -0.28; g.add(arm);
  const bucket = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.82), MAT.darkGray);
  bucket.position.set(1.18, 0.28, 0); bucket.rotation.z = -0.18; g.add(bucket);
  g.userData.bucket = bucket;
  g.scale.setScalar(0.82);
  return g;
}

function buildCompactorModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.42, 0.62), MAT.machineYellow);
  body.position.set(-0.1, 0.63, 0); g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.48, 0.5), MAT.machineGlass);
  cab.position.set(-0.22, 1.0, 0); g.add(cab);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 18), MAT.darkGray);
  drum.rotation.x = Math.PI / 2;
  drum.position.set(0.55, 0.34, 0); g.add(drum);
  const rearWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.72, 16), MAT.tire);
  rearWheel.rotation.x = Math.PI / 2;
  rearWheel.position.set(-0.48, 0.3, 0); g.add(rearWheel);
  g.userData.drum = drum;
  g.scale.setScalar(0.82);
  return g;
}

function rebuildCourseFull(k) {
  const p = buildPanelsForCourse(k); p.reveal(1); addStep(p.group);
  const s = buildStripsForCourse(k); s.reveal(1); addStep(s.group);
  const f = buildFillForCourse(k);   f.setPct(100); addStep(f.mesh);
}

function addCopingMesh() {
  const cap = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH + 0.2, 0.16, PANEL_THICK + 0.3), MAT.concrete);
  cap.position.set(0, WALL_TOP_Y + 0.08, PANEL_THICK / 2);
  return addStep(cap);
}

const ROAD_LENGTH = WALL_LENGTH + 2;
const ROAD_WIDTH = 5.2;
// The finished roadway crosses the reinforced fill before tying into the
// pre-existing upper plateau, making the wall's land-support function clear.
const ROAD_NEAR_EDGE_Z = PANEL_Z1 + 0.8;
const ROAD_CENTER_Z = ROAD_NEAR_EDGE_Z + ROAD_WIDTH / 2;
const ROAD_Y = RETAINED_GRADE_Y + 0.04;

function buildRoadVehicle(color, x, z, direction, speed) {
  const vehicle = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x9cc9df });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.36, 0.64), bodyMat);
  body.position.y = 0.34;
  body.castShadow = true;
  vehicle.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.3, 0.55), glassMat);
  cabin.position.set(-0.08 * direction, 0.64, 0);
  cabin.castShadow = true;
  vehicle.add(cabin);

  [-0.43, 0.43].forEach(wx => {
    [-0.34, 0.34].forEach(wz => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.11, 12), MAT.tire);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.18, wz);
      vehicle.add(wheel);
    });
  });

  vehicle.position.set(x, ROAD_Y + 0.04, z);
  vehicle.rotation.y = direction < 0 ? Math.PI : 0;
  vehicle.userData.direction = direction;
  vehicle.userData.speed = speed;
  return vehicle;
}

function buildOperationalRoad() {
  const roadGroup = new THREE.Group();

  const asphalt = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LENGTH, 0.08, ROAD_WIDTH), MAT.asphalt);
  asphalt.position.set(0, ROAD_Y, ROAD_CENTER_Z);
  asphalt.receiveShadow = true;
  roadGroup.add(asphalt);

  const shoulderMat = new THREE.MeshLambertMaterial({ color: 0x8e9397 });
  [-1, 1].forEach(side => {
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LENGTH, 0.055, 0.38), shoulderMat);
    shoulder.position.set(0, ROAD_Y + 0.045, ROAD_CENTER_Z + side * (ROAD_WIDTH / 2 - 0.19));
    roadGroup.add(shoulder);
  });

  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf4f4ef });
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf5c542 });
  [-1, 1].forEach(side => {
    const edgeLine = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LENGTH - 0.4, 0.018, 0.07), whiteMat);
    edgeLine.position.set(0, ROAD_Y + 0.09, ROAD_CENTER_Z + side * (ROAD_WIDTH / 2 - 0.55));
    roadGroup.add(edgeLine);
  });
  for (let x = -ROAD_LENGTH / 2 + 1; x < ROAD_LENGTH / 2 - 0.5; x += 2.5) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.02, 0.09), yellowMat);
    dash.position.set(x, ROAD_Y + 0.095, ROAD_CENTER_Z);
    roadGroup.add(dash);
  }

  const railMat = new THREE.MeshLambertMaterial({ color: 0xc7cdd1 });
  const railZ = ROAD_CENTER_Z - ROAD_WIDTH / 2 - 0.22;
  for (let x = -ROAD_LENGTH / 2 + 0.5; x <= ROAD_LENGTH / 2 - 0.5; x += 2) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.08), railMat);
    post.position.set(x, ROAD_Y + 0.34, railZ);
    roadGroup.add(post);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LENGTH, 0.12, 0.12), railMat);
  rail.position.set(0, ROAD_Y + 0.62, railZ);
  roadGroup.add(rail);

  const vehicles = [
    buildRoadVehicle(0xd84343, -10, ROAD_CENTER_Z - 1.25,  1, 3.2),
    buildRoadVehicle(0x2f74c0,   7, ROAD_CENTER_Z - 1.25,  1, 2.7),
    buildRoadVehicle(0xf0b429,  11, ROAD_CENTER_Z + 1.25, -1, 3.0),
    buildRoadVehicle(0xeeeeee,  -3, ROAD_CENTER_Z + 1.25, -1, 2.5)
  ];
  vehicles.forEach(vehicle => roadGroup.add(vehicle));
  OBJ.roadVehicles = vehicles;

  return addStep(roadGroup);
}

function addPavementMesh() {
  return buildOperationalRoad();
}

/* ══════════════════════════════════════════════════════════════
   GAME ENGINE
══════════════════════════════════════════════════════════════ */

function init() {
  onResize();
  buildChecklist();
  buildGround();
  buildSiteElements();
  initZoomSlider();
  startStep(0);
  animate();
}

function initZoomSlider() {
  const slider = document.getElementById('zoom-slider');
  if (!slider) return;
  slider.addEventListener('input', () => {
    camTarget = null;
    const dist = parseFloat(slider.value);
    const dir  = new THREE.Vector3()
      .subVectors(camera.position, controls.target)
      .normalize();
    camera.position.copy(controls.target).addScaledVector(dir, dist);
  });
}

function buildChecklist() {
  const ol = DOM.checklist();
  ol.innerHTML = '';
  STEPS.forEach((s, i) => {
    const li = document.createElement('li');
    li.id = `cl-${i}`;
    li.textContent = s.title.replace(/^\d+\.\s*/, '');
    ol.appendChild(li);
  });
}

function startStep(n) {
  if (n >= STEPS.length) { showResult(); return; }
  STATE.currentStep = n;
  STATE.stepState = {};
  clearAllTimers();
  clearScene3D();

  if (n >= 2) buildGroundWithTrench();
  else buildGround();

  updateHUD();
  renderChecklist();
  renderTaskPanel(n);
  const ab = DOM.actionBar();
  ab.innerHTML = '';
  ab.style.pointerEvents = '';
  setCamPreset(n);
  STEP_HANDLERS[n].enter();
}

function completeStep() {
  const n = STATE.currentStep;
  addScore(50, `Step ${n + 1} complete! +50 bonus`);
  const li = $(`cl-${n}`);
  if (li) { li.classList.remove('step-active'); li.classList.add('step-done'); }
  clearAllTimers();
  if (STEP_HANDLERS[n].cleanup) STEP_HANDLERS[n].cleanup();
  setTimeout(() => startStep(n + 1), 600);
}

function addScore(pts, msg) {
  STATE.score = Math.max(0, STATE.score + pts);
  updateHUD();
  if (msg) showFeedback('correct', msg);
}

function penalize(msg) {
  STATE.score = Math.max(0, STATE.score - 15);
  updateHUD();
  shakeScene();
  showFeedback('wrong', `${msg} (-15 pts)`);
}

function shakeScene() {
  const s = DOM.scene();
  s.classList.remove('shake');
  void s.offsetWidth;
  s.classList.add('shake');
}

function updateHUD() {
  DOM.scoreVal().textContent = STATE.score;
  DOM.stepCur().textContent  = STATE.currentStep + 1;
}

function renderChecklist() {
  STEPS.forEach((_, i) => {
    const li = $(`cl-${i}`);
    if (!li) return;
    li.className = '';
    if (i < STATE.currentStep)  li.classList.add('step-done');
    if (i === STATE.currentStep) li.classList.add('step-active');
  });
}

function renderTaskPanel(n) {
  const s = STEPS[n];
  const m = STEP_META[n];

  DOM.taskTitle().textContent = s.title;
  DOM.taskDesc().textContent  = s.desc;

  const ul = DOM.taskSubs();
  ul.innerHTML = '';
  s.subtasks.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });

  DOM.taskWhy().textContent  = s.why     ? '💡 ' + s.why     : '';
  DOM.taskWarn().textContent = s.warning ? '⚠️ ' + s.warning : '';

  const metaEl = $('task-metadata');
  if (metaEl && m) {
    const toolChips = m.tools.map(t =>
      `<span class="meta-tool-chip">${t}</span>`
    ).join('');

    metaEl.innerHTML = `
      <div class="meta-section">
        <div class="meta-label">Purpose</div>
        <div class="meta-val">${m.purpose}</div>
      </div>
      <div class="meta-section">
        <div class="meta-label">Materials / Tools</div>
        <div class="meta-tools">${toolChips}</div>
      </div>
      <div class="meta-section quality">
        <div class="meta-label">Quality Check</div>
        <div class="meta-val">${m.qualityCheck}</div>
      </div>
      <div class="meta-section mistake">
        <div class="meta-label">Common Mistake</div>
        <div class="meta-val">${m.commonMistake}</div>
      </div>
      <div class="meta-section learning">
        <div class="meta-label">Learning Objective</div>
        <div class="meta-val">${m.learningObjective}</div>
      </div>
    `;
  }
}

function markSubtask(index) {
  const li = DOM.taskSubs().querySelectorAll('li')[index];
  if (li) li.classList.add('done');
}

function showFeedback(type, msg) {
  const bar = DOM.feedbackBar();
  bar.className = type;
  bar.textContent = msg;
  bar.classList.remove('hidden');
  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => bar.classList.add('hidden'), 2800);
}
let feedbackTimer = null;

function safeInterval(fn, ms) {
  const id = setInterval(fn, ms);
  STATE.intervals.push(id);
  return id;
}

function safeTimeout(fn, ms) {
  const id = setTimeout(fn, ms);
  STATE.timeouts.push(id);
  return id;
}

function clearAllTimers() {
  STATE.intervals.forEach(clearInterval);
  STATE.timeouts.forEach(clearTimeout);
  STATE.intervals = [];
  STATE.timeouts  = [];
}

function showResult() {
  const rc = $('result-card');
  if (rc) {
    rc.innerHTML = `
      <div id="result-icon">⛰️</div>
      <h2>MSE Wall Complete!</h2>
      <p>Full-length reinforced soil wall complete and supporting a fully operational upper road.</p>
      <div id="result-score-line">Final Score: <span id="result-score">${STATE.score}</span></div>
      <div id="result-grade">${getGrade()}</div>
      <div class="pile-report">
        <h3 style="color:#f5a623;margin-bottom:10px;">Construction Report</h3>
        <table style="width:100%;text-align:left;font-size:0.85rem;">
          <tr><td style="color:#aaa;">Wall Type:</td><td>Mechanically Stabilized Earth (MSE) Wall</td></tr>
          <tr><td style="color:#aaa;">Wall Length:</td><td>${WALL_LENGTH.toFixed(1)}m</td></tr>
          <tr><td style="color:#aaa;">Wall Height:</td><td>${WALL_TOP_Y.toFixed(1)}m over ${N_COURSES} courses</td></tr>
          <tr><td style="color:#aaa;">Facing:</td><td>Precast panels, temporarily braced</td></tr>
          <tr><td style="color:#aaa;">Reinforcement:</td><td style="color:#27ae60;">Steel strips, ${N_COURSES * REINFORCEMENT_LAYERS_PER_COURSE} layers</td></tr>
          <tr><td style="color:#aaa;">Backfill:</td><td style="color:#27ae60;">${SOIL_LIFTS_PER_COURSE} compacted lifts per course</td></tr>
          <tr><td style="color:#aaa;">Supported Use:</td><td style="color:#27ae60;">Two-lane operational road</td></tr>
          <tr><td style="color:#aaa;">Status:</td><td style="color:#27ae60;font-weight:700;">PASS</td></tr>
        </table>
      </div>
      <div class="result-actions" style="margin-top:20px;">
        <button id="result-replay" onclick="location.reload()">Play Again</button>
        <button id="result-dashboard-btn" onclick="window.location.href='index.html'">Back to Dashboard</button>
      </div>
    `;
  }
  DOM.resultOverlay().classList.remove('hidden');
}

function getGrade() {
  if (STATE.score >= 900)      return 'Master MSE Wall Builder!';
  else if (STATE.score >= 700) return 'Skilled Engineer';
  else if (STATE.score >= 500) return 'Apprentice Builder';
  else                          return 'Foundation Trainee - try again!';
}

function makeBtn(label, cls, onClick) {
  const b = document.createElement('button');
  b.className = 'btn ' + cls;
  b.innerHTML = label;
  b.addEventListener('click', onClick);
  return b;
}

function el(tag, cls, html) {
  const d = document.createElement(tag);
  if (cls) d.className = cls;
  if (html !== undefined) d.innerHTML = html;
  return d;
}

function resetSimulation() {
  const ro = $('result-overlay');
  if (ro) ro.classList.add('hidden');
  STATE.score = 1000;
  STATE.penalties = 0;
  startStep(0);
}

/* ══════════════════════════════════════════════════════════════
   ANIMATION LOOP
══════════════════════════════════════════════════════════════ */

function animate() {
  requestAnimationFrame(animate);
  const dt      = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  if (camTarget) {
    camera.position.lerp(camTarget.pos, 0.04);
    controls.target.lerp(camTarget.look, 0.04);
    if (camera.position.distanceTo(camTarget.pos) < 0.02 &&
        controls.target.distanceTo(camTarget.look) < 0.02) {
      camTarget = null;
    }
  }

  clickables3D.forEach(c => {
    if (c.pulse && c.mesh) {
      const s = 1 + 0.18 * Math.sin(elapsed * 3 + (c.phase || 0));
      c.mesh.scale.setScalar(s);
    }
  });

  if (OBJ.roadVehicles) {
    const limit = ROAD_LENGTH / 2 + 1.2;
    OBJ.roadVehicles.forEach(vehicle => {
      vehicle.position.x += vehicle.userData.direction * vehicle.userData.speed * dt;
      if (vehicle.position.x > limit) vehicle.position.x = -limit;
      if (vehicle.position.x < -limit) vehicle.position.x = limit;
    });
  }

  updateParticles(dt);

  const _zs = document.getElementById('zoom-slider');
  if (_zs && document.activeElement !== _zs) {
    _zs.value = Math.round(camera.position.distanceTo(controls.target));
  }

  update3DLabels();
  controls.update();
  renderer.render(scene, camera);
}

/* ══════════════════════════════════════════════════════════════
   STEP HANDLERS
══════════════════════════════════════════════════════════════ */

// One course's three interactive steps (place & brace / lay strips /
// backfill & compact), generated for course index c (0-based).
function makeCourseHandlers(c) {
  const label = c + 1;

  return [
    /* Place & Brace Facing Panels */
    {
      enter() {
        addSubgradeFill();
        for (let k = 0; k < c; k++) rebuildCourseFull(k);

        const cur = buildPanelsForCourse(c);
        addStep(cur.group);
        const braces = buildBracesForCourse(c, cur.panels);
        addStep(braces.group);

        const ab = DOM.actionBar();
        ab.innerHTML = '';
        ab.appendChild(el('div', 'step-instruction', `Place Course ${label} facing panels, then brace them plumb`));

        const placeBtn = makeBtn(`Place Course ${label} Panels`, 'btn-primary', () => {
          placeBtn.disabled = true;
          let t = 0;
          const iv = safeInterval(() => {
            t += 0.09;
            cur.reveal(Math.min(1, t));
            if (t >= 1) {
              clearInterval(iv);
              markSubtask(0);
              showFeedback('correct', `Course ${label} panels placed.`);
              braceBtn.disabled = false;
            }
          }, 90);
        });
        ab.appendChild(placeBtn);

        const braceBtn = makeBtn('Install Bracing', 'btn-primary', () => {
          braceBtn.disabled = true;
          let t = 0;
          const iv = safeInterval(() => {
            t += 0.12;
            braces.reveal(Math.min(1, t));
            if (t >= 1) {
              clearInterval(iv);
              markSubtask(1);
              showFeedback('correct', `Course ${label} panels braced plumb.`);
              safeTimeout(() => completeStep(), 1000);
            }
          }, 80);
        });
        braceBtn.disabled = true;
        ab.appendChild(braceBtn);
      },
      cleanup() {}
    },

    /* Lay Strip Reinforcement */
    {
      enter() {
        addSubgradeFill();
        for (let k = 0; k < c; k++) rebuildCourseFull(k);

        const cur = buildPanelsForCourse(c); cur.reveal(1); addStep(cur.group);
        const braces = buildBracesForCourse(c, cur.panels); braces.reveal(1); addStep(braces.group);
        const strips = buildStripsForCourse(c); addStep(strips.group);

        const ab = DOM.actionBar();
        ab.innerHTML = '';
        ab.appendChild(el('div', 'step-instruction', `Hook Course ${label} base reinforcement layer to the lowest panel connectors`));

        const btn = makeBtn('Lay Reinforcement Layer 1 of 3', 'btn-primary', () => {
          btn.disabled = true;
          let t = 0;
          const iv = safeInterval(() => {
            t += 0.06;
            strips.revealLayer(0, Math.min(1, t));
            if (t >= 1) {
              clearInterval(iv);
              markSubtask(0);
              showFeedback('correct', `Course ${label} reinforcement layer 1/3 laid and connected.`);
              safeTimeout(() => completeStep(), 1000);
            }
          }, 40);
        });
        ab.appendChild(btn);
      },
      cleanup() {}
    },

    /* Backfill & Compact Lift */
    {
      enter() {
        const ss = STATE.stepState;
        ss.fillCount = 0;
        ss.compactCount = 0;
        ss.fillPct = 0;
        ss.reinforcementCount = 1;
        ss.busy = false;

        addSubgradeFill();
        for (let k = 0; k < c; k++) rebuildCourseFull(k);

        const cur = buildPanelsForCourse(c); cur.reveal(1); addStep(cur.group);
        const braces = buildBracesForCourse(c, cur.panels); braces.reveal(1); addStep(braces.group);
        const strips = buildStripsForCourse(c); strips.revealLayer(0, 1); addStep(strips.group);
        const fill = buildFillForCourse(c); addStep(fill.mesh);

        const ab = DOM.actionBar();
        ab.innerHTML = '';
        const instr = el('div', 'step-instruction', `Build Course ${label} in three reinforced, compacted lifts`);
        ab.appendChild(instr);

        const fillWrap = el('div', 'fill-meter-wrap');
        const fillTrack = el('div', 'fill-meter-track');
        const fillBar = el('div', 'fill-meter-bar');
        fillBar.id = 'course-fill-bar';
        fillBar.style.background = 'linear-gradient(to right,#8a6038,#b18450,#d0aa72)';
        fillBar.style.width = '0%';
        fillTrack.appendChild(fillBar);
        fillWrap.appendChild(fillTrack);
        ab.appendChild(fillWrap);

        const loader = buildLoaderModel();
        loader.visible = false;
        addStep(loader);
        OBJ.loader = loader;

        const compactor = buildCompactorModel();
        compactor.visible = false;
        addStep(compactor);
        OBJ.compactor = compactor;

        function fillSubtaskIndex(liftNumber) {
          return (liftNumber - 1) * 3;
        }

        function reinforcementSubtaskIndex(layerNumber) {
          return (layerNumber - 1) * 3 - 1;
        }

        function animateDelivery(liftNumber) {
          ss.busy = true;
          fill.showLooseLift(liftNumber);
          loader.visible = true;
          loader.position.set(WALL_X0 - 1.4, fill.surfaceY() + 0.02, PANEL_Z1 + 1.65);
          instr.textContent = `Loader delivering loose soil for lift ${liftNumber}`;
          showFeedback('info', `Placing loose backfill lift ${liftNumber}/${SOIL_LIFTS_PER_COURSE}...`);

          let t = 0;
          const iv = safeInterval(() => {
            t = Math.min(1, t + 0.022);
            const eased = t * t * (3 - 2 * t);
            loader.position.x = THREE.MathUtils.lerp(WALL_X0 - 1.4, WALL_X1 + 1.1, eased);
            loader.position.z = PANEL_Z1 + 1.55 + 0.18 * Math.sin(t * Math.PI * 4);
            if (loader.userData.bucket) loader.userData.bucket.rotation.z = -0.18 - 0.22 * Math.sin(t * Math.PI);
            fill.revealLoose(eased);
            if (Math.random() < 0.18) {
              spawnParticles(new THREE.Vector3(loader.position.x + 0.8, loader.position.y + 0.25, loader.position.z), MAT.backfill, 1);
            }

            if (t >= 1) {
              clearInterval(iv);
              loader.visible = false;
              ss.fillCount = liftNumber;
              ss.busy = false;
              markSubtask(fillSubtaskIndex(liftNumber));
              fillBtn.disabled = true;
              compactBtn.disabled = false;
              compactBtn.textContent = `Compact Lift ${liftNumber}`;
              instr.textContent = `Loose lift ${liftNumber} placed — compact it before adding another lift`;
              showFeedback('correct', `Loose lift ${liftNumber}/${SOIL_LIFTS_PER_COURSE} placed. Compact it before proceeding.`);
            }
          }, 40);
        }

        function animateCompaction(liftNumber) {
          ss.busy = true;
          STATE.stepState.compacting = true;
          compactor.visible = true;
          const targetSurfaceY = COURSE_BASE_Y(c) + PANEL_H * liftNumber / SOIL_LIFTS_PER_COURSE + 0.02;
          compactor.position.set(WALL_X0 - 0.8, targetSurfaceY, PANEL_Z1 + 1.1);
          instr.textContent = `Roller compacting lift ${liftNumber} — two visible passes`;
          showFeedback('info', `Compacting lift ${liftNumber}/${SOIL_LIFTS_PER_COURSE}...`);

          let t = 0;
          const iv = safeInterval(() => {
            t = Math.min(1, t + 0.018);
            const leg = t < 0.5 ? t * 2 : (1 - t) * 2;
            compactor.position.x = THREE.MathUtils.lerp(WALL_X0 - 0.7, WALL_X1 + 0.7, leg);
            compactor.position.z = t < 0.5 ? PANEL_Z1 + 1.15 : PANEL_Z1 + 2.25;
            if (compactor.userData.drum) compactor.userData.drum.rotation.y -= 0.24;
            fill.spreadLoose(liftNumber, t);
            const liftPct = 100 / SOIL_LIFTS_PER_COURSE;
            fillBar.style.width = (liftPct * (liftNumber - 1) + liftPct * t) + '%';

            if (t >= 1) {
              clearInterval(iv);
              const completedPct = liftNumber * 100 / SOIL_LIFTS_PER_COURSE;
              fill.setPct(completedPct);
              fill.clearLoose();
              compactor.visible = false;
              STATE.stepState.compacting = false;
              ss.compactCount = liftNumber;
              ss.fillPct = completedPct;
              ss.busy = false;
              markSubtask(fillSubtaskIndex(liftNumber) + 1);
              compactBtn.disabled = true;

              if (liftNumber < SOIL_LIFTS_PER_COURSE) {
                const nextLayer = liftNumber + 1;
                reinforceBtn.textContent = `Lay Reinforcement Layer ${nextLayer} of ${REINFORCEMENT_LAYERS_PER_COURSE}`;
                reinforceBtn.disabled = false;
                instr.textContent = `Lift ${liftNumber} compacted — connect reinforcement layer ${nextLayer} before adding more soil`;
                showFeedback('correct', `Lift ${liftNumber} compacted. Install reinforcement layer ${nextLayer} next.`);
              } else {
                braces.hideAll();
                instr.textContent = `Course ${label} has three reinforced, compacted lifts — temporary bracing removed`;
                showFeedback('correct', `Course ${label} completed with three reinforcement layers -- bracing struck.`);
                safeTimeout(() => completeStep(), 1300);
              }
            }
          }, 35);
        }

        function animateReinforcement(layerNumber) {
          ss.busy = true;
          reinforceBtn.disabled = true;
          instr.textContent = `Connecting reinforcement layer ${layerNumber} of ${REINFORCEMENT_LAYERS_PER_COURSE}`;
          let t = 0;
          const iv = safeInterval(() => {
            t = Math.min(1, t + 0.06);
            strips.revealLayer(layerNumber - 1, t);
            if (t >= 1) {
              clearInterval(iv);
              ss.reinforcementCount = layerNumber;
              ss.busy = false;
              markSubtask(reinforcementSubtaskIndex(layerNumber));
              fillBtn.textContent = `Add Soil Lift ${layerNumber}`;
              fillBtn.disabled = false;
              instr.textContent = `Reinforcement layer ${layerNumber} connected — place soil lift ${layerNumber}`;
              showFeedback('correct', `Reinforcement layer ${layerNumber}/${REINFORCEMENT_LAYERS_PER_COURSE} connected.`);
            }
          }, 40);
        }

        const fillBtn = makeBtn('Add Soil Lift 1', 'btn-primary', () => {
          if (ss.busy || ss.fillCount >= SOIL_LIFTS_PER_COURSE || ss.fillCount !== ss.compactCount || ss.reinforcementCount <= ss.fillCount) return;
          fillBtn.disabled = true;
          animateDelivery(ss.fillCount + 1);
        });
        ab.appendChild(fillBtn);

        const reinforceBtn = makeBtn('Lay Reinforcement Layer 2 of 3', 'btn-primary', () => {
          if (ss.busy || ss.reinforcementCount >= REINFORCEMENT_LAYERS_PER_COURSE || ss.compactCount < ss.reinforcementCount) return;
          animateReinforcement(ss.reinforcementCount + 1);
        });
        reinforceBtn.disabled = true;
        ab.appendChild(reinforceBtn);

        const compactBtn = makeBtn('Compact Lift 1', 'btn-primary', () => {
          if (ss.busy || ss.fillCount === 0 || ss.compactCount >= ss.fillCount) return;
          compactBtn.disabled = true;
          animateCompaction(ss.fillCount);
        });
        compactBtn.disabled = true;
        ab.appendChild(compactBtn);
      },
      cleanup() {
        STATE.stepState.compacting = false;
        if (OBJ.loader) OBJ.loader.visible = false;
        if (OBJ.compactor) OBJ.compactor.visible = false;
      }
    }
  ];
}

// Courses 2 and 3 reuse the method the learner performed hands-on in
// Course 1. The crew carries out the repetitive production work while the
// learner acts as the supervising engineer at a deliberate QA hold point.
function makeSupervisedCourseHandler(c) {
  const label = c + 1;
  const question = c === 1
    ? {
        prompt: 'Supervisor hold point: what must be confirmed before backfill covers the reinforcement?',
        answers: [
          ['Every strip is hooked to its panel connector and runs perpendicular to the face', true],
          ['The facing color matches the previous course', false],
          ['The loader can reach the entire wall in one pass', false]
        ]
      }
    : {
        prompt: 'Supervisor hold point: why must the crew compact each lift before placing the next?',
        answers: [
          ['To develop soil-strip friction and prevent weak, settling pockets', true],
          ['To make the concrete facing carry the soil pressure', false],
          ['To eliminate the need for strip reinforcement', false]
        ]
      };

  return {
    enter() {
      const ss = STATE.stepState;
      ss.running = false;

      addSubgradeFill();
      for (let k = 0; k < c; k++) rebuildCourseFull(k);

      const panels = buildPanelsForCourse(c); addStep(panels.group);
      const braces = buildBracesForCourse(c, panels.panels); addStep(braces.group);
      const strips = buildStripsForCourse(c); addStep(strips.group);
      const fill = buildFillForCourse(c); addStep(fill.mesh);

      const loader = buildLoaderModel(); loader.visible = false; addStep(loader); OBJ.loader = loader;
      const compactor = buildCompactorModel(); compactor.visible = false; addStep(compactor); OBJ.compactor = compactor;

      const ab = DOM.actionBar();
      ab.innerHTML = '';
      const instr = el('div', 'step-instruction', `Course ${label} is ready for a supervised production cycle`);
      ab.appendChild(instr);

      const progressWrap = el('div', 'fill-meter-wrap');
      const progressTrack = el('div', 'fill-meter-track');
      const progressBar = el('div', 'fill-meter-bar');
      progressBar.style.background = 'linear-gradient(to right,#4d7ea8,#27ae60)';
      progressBar.style.width = '0%';
      progressTrack.appendChild(progressBar);
      progressWrap.appendChild(progressTrack);
      ab.appendChild(progressWrap);

      const qaWrap = el('div', 'supervisor-gate');
      ab.appendChild(qaWrap);

      function setProgress(message, pct) {
        instr.textContent = message;
        progressBar.style.width = `${pct}%`;
      }

      function animateFraction(duration, onFrame, onDone) {
        let elapsedMs = 0;
        const iv = safeInterval(() => {
          elapsedMs += 40;
          const t = Math.min(1, elapsedMs / duration);
          onFrame(t);
          if (t >= 1) {
            clearInterval(iv);
            onDone();
          }
        }, 40);
      }

      function automatePanels() {
        setProgress(`Crew placing and bracing Course ${label} panels...`, 5);
        animateFraction(1200, t => {
          panels.reveal(t);
          braces.reveal(Math.max(0, (t - 0.35) / 0.65));
          progressBar.style.width = `${5 + t * 25}%`;
        }, automateStrips);
      }

      function automateStrips() {
        setProgress(`Crew connecting Course ${label} reinforcement layer 1/3...`, 32);
        animateFraction(1100, t => {
          strips.revealLayer(0, t);
          progressBar.style.width = `${32 + t * 23}%`;
        }, showQualityGate);
      }

      function showQualityGate() {
        setProgress(`Course ${label} paused at the engineer's quality hold point`, 58);
        qaWrap.innerHTML = '';
        const prompt = el('div', 'step-instruction', question.prompt);
        prompt.style.color = '#f5a623';
        qaWrap.appendChild(prompt);

        question.answers.forEach(([answer, correct]) => {
          const btn = makeBtn(answer, 'btn-primary', () => {
            if (!correct) {
              penalize('That check would not release the course for backfilling. Review the load path and try again.');
              return;
            }
            Array.from(qaWrap.querySelectorAll('button')).forEach(b => { b.disabled = true; });
            markSubtask(1);
            showFeedback('correct', `Course ${label} quality gate approved — crew released to backfill.`);
            qaWrap.innerHTML = '<div class="step-instruction" style="color:#27ae60;">✓ Hold point approved — three-layer reinforcement and compaction cycle underway</div>';
            safeTimeout(() => automateLift(1), 500);
          });
          btn.style.fontSize = '0.75rem';
          qaWrap.appendChild(btn);
        });
      }

      function automateLift(liftNumber) {
        fill.showLooseLift(liftNumber);
        loader.visible = true;
        loader.position.set(WALL_X0 - 1.2, fill.surfaceY() + 0.02, PANEL_Z1 + 1.6);
        const baseProgress = [60, 74, 88][liftNumber - 1];
        setProgress(`Loader placing Course ${label} soil lift ${liftNumber}/${SOIL_LIFTS_PER_COURSE}...`, baseProgress);

        animateFraction(900, t => {
          loader.position.x = THREE.MathUtils.lerp(WALL_X0 - 1.2, WALL_X1 + 1.1, t);
          fill.revealLoose(t);
          progressBar.style.width = `${baseProgress + t * 4}%`;
        }, () => {
          loader.visible = false;
          automateCompaction(liftNumber, baseProgress + 4);
        });
      }

      function automateReinforcement(layerNumber) {
        const baseProgress = layerNumber === 2 ? 72 : 86;
        setProgress(`Crew connecting Course ${label} reinforcement layer ${layerNumber}/${REINFORCEMENT_LAYERS_PER_COURSE}...`, baseProgress);
        animateFraction(750, t => {
          strips.revealLayer(layerNumber - 1, t);
          progressBar.style.width = `${baseProgress + t * 2}%`;
        }, () => {
          showFeedback('correct', `Course ${label} reinforcement layer ${layerNumber}/${REINFORCEMENT_LAYERS_PER_COURSE} connected.`);
          safeTimeout(() => automateLift(layerNumber), 250);
        });
      }

      function automateCompaction(liftNumber, baseProgress) {
        compactor.visible = true;
        STATE.stepState.compacting = true;
        const surfaceY = COURSE_BASE_Y(c) + PANEL_H * liftNumber / SOIL_LIFTS_PER_COURSE + 0.02;
        compactor.position.set(WALL_X0 - 0.8, surfaceY, PANEL_Z1 + 1.1);
        setProgress(`Roller compacting Course ${label} lift ${liftNumber}/${SOIL_LIFTS_PER_COURSE}...`, baseProgress);

        animateFraction(1100, t => {
          const leg = t < 0.5 ? t * 2 : (1 - t) * 2;
          compactor.position.x = THREE.MathUtils.lerp(WALL_X0 - 0.7, WALL_X1 + 0.7, leg);
          compactor.position.z = t < 0.5 ? PANEL_Z1 + 1.15 : PANEL_Z1 + 2.25;
          if (compactor.userData.drum) compactor.userData.drum.rotation.y -= 0.24;
          fill.spreadLoose(liftNumber, t);
          progressBar.style.width = `${baseProgress + t * 8}%`;
        }, () => {
          fill.setPct(liftNumber * 100 / SOIL_LIFTS_PER_COURSE);
          fill.clearLoose();
          compactor.visible = false;
          STATE.stepState.compacting = false;
          if (liftNumber < SOIL_LIFTS_PER_COURSE) {
            safeTimeout(() => automateReinforcement(liftNumber + 1), 350);
          } else {
            braces.hideAll();
            progressBar.style.width = '100%';
            markSubtask(2);
            setProgress(`Course ${label} complete — 3 reinforcement layers and 3 compacted lifts accepted`, 100);
            showFeedback('correct', `Course ${label} three-layer production cycle completed under your supervision.`);
            safeTimeout(() => completeStep(), 1400);
          }
        });
      }

      const startBtn = makeBtn(`Start Course ${label} Crew`, 'btn-primary', () => {
        if (ss.running) return;
        ss.running = true;
        startBtn.disabled = true;
        startBtn.style.display = 'none';
        markSubtask(0);
        showFeedback('info', `Course ${label} crew started — monitor the sequence.`);
        automatePanels();
      });
      qaWrap.appendChild(startBtn);
    },
    cleanup() {
      STATE.stepState.compacting = false;
      if (OBJ.loader) OBJ.loader.visible = false;
      if (OBJ.compactor) OBJ.compactor.visible = false;
    }
  };
}

const STEP_HANDLERS = [

  /* ─────────────────── 0: Site Investigation ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.tested = 0;
      ss.total = 5;

      const markerPositions = [
        new THREE.Vector3(WALL_X0 + 0.5, 0.01, TRENCH_Z0 - 1.5),
        new THREE.Vector3(WALL_X0 + 2.8, 0.01, TRENCH_Z1 + 1.5),
        new THREE.Vector3(0,             0.01, TRENCH_Z0 - 1.5),
        new THREE.Vector3(WALL_X1 - 2.8, 0.01, TRENCH_Z1 + 1.5),
        new THREE.Vector3(WALL_X1 - 0.5, 0.01, TRENCH_Z0 - 1.5)
      ];

      const markerGeo   = new THREE.BoxGeometry(0.7, 0.06, 0.7);
      const markerEdges = new THREE.EdgesGeometry(markerGeo);
      const markers = [];

      markerPositions.forEach((pos, i) => {
        const g = new THREE.Group();
        const plate = new THREE.Mesh(markerGeo, MAT.markerOrange.clone());
        plate.position.y = 0.03;
        plate.castShadow = true;
        g.add(plate);
        const outline = new THREE.LineSegments(
          markerEdges,
          new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
        );
        outline.position.y = 0.03;
        g.add(outline);
        g.position.copy(pos);
        g.position.y = 0;
        addStep(g);
        create3DLabel(g, `BH-${i + 1}`, '');
        markers.push({ g, plate });

        const entry = { mesh: g, pulse: true, phase: i * 1.2, onHit() { testBorehole(i); } };
        clickables3D.push(entry);
      });

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click each test point to run a soil boring (BH-1 to BH-5)</div>';

      const items = [];
      markerPositions.forEach((pos, i) => {
        const item = el('div', 'panel-item');
        item.innerHTML = `<div class="item-icon">🪨</div><div class="item-label">Test point BH-${i + 1}</div>`;
        item.addEventListener('click', () => testBorehole(i));
        items.push(item);
        ab.appendChild(item);
      });

      function testBorehole(i) {
        const { g, plate } = markers[i];
        if (g.userData.tested) return;
        g.userData.tested = true;
        plate.material = MAT.markerGreen.clone();
        const entry = clickables3D.find(c => c.mesh === g);
        if (entry) entry.pulse = false;
        g.scale.setScalar(1);

        const item = items[i];
        item.classList.add('placed');
        item.innerHTML += '<div style="color:var(--green-ok);font-size:.85rem;margin-top:2px;">✓ Tested</div>';

        ss.tested++;
        markSubtask(i);

        const data = SOIL_RESULTS[i];
        const html = `<strong>BH-${i + 1}</strong><span class="info-chip">${data.soil}</span>` +
          `<span class="info-chip">Bearing <b>${data.bearing}</b></span>` +
          `<span class="info-chip">Moisture <b>${data.moisture}</b></span>` +
          `<span style="opacity:.75;font-size:.7rem;">${data.note}</span>`;
        show3DPopup(g, html, 2500);

        showFeedback('info', `Soil sample BH-${i + 1}: ${data.soil}`);

        if (ss.tested >= ss.total) {
          showFeedback('info', 'All borings complete! Submit the soil report.');
          ab.innerHTML = '';
          const submitBtn = makeBtn('Submit Soil Report', 'btn-primary', () => {
            markSubtask(5);
            showFeedback('correct', 'Foundation and backfill soils confirmed suitable for an MSE wall.');
            safeTimeout(() => completeStep(), 1500);
          });
          ab.appendChild(submitBtn);
        }
      }
    },
    cleanup() {}
  },

  /* ─────────────────── 1: Wall Alignment & Footprint Layout ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.placed = 0;
      ss.total = 3;
      ss.demoStarted = false;

      const stakePositions = [
        new THREE.Vector3(WALL_X0, 0.01, PANEL_Z1),
        new THREE.Vector3(0,        0.01, PANEL_Z1),
        new THREE.Vector3(WALL_X1, 0.01, PANEL_Z1)
      ];
      const labels = ['Start', 'Mid', 'End'];

      const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(WALL_LENGTH + 0.2, 0.05, TRENCH_Z1 - TRENCH_Z0));
      const outlineMat = new THREE.LineBasicMaterial({ color: 0xf5a623 });
      const outlineMesh = new THREE.LineSegments(outlineGeo, outlineMat);
      outlineMesh.position.set(0, 0.03, (TRENCH_Z0 + TRENCH_Z1) / 2);
      addStep(outlineMesh);

      const rings = [];
      const entries = [];

      stakePositions.forEach((pos, i) => {
        const ringGeo = new THREE.RingGeometry(0.28, 0.45, 16);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.5, side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(pos);
        ring.position.y = 0.03;
        addStep(ring);
        rings.push(ring);

        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.07, 12),
          new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6, side: THREE.DoubleSide })
        );
        dot.rotation.x = -Math.PI / 2;
        dot.position.copy(pos);
        dot.position.y = 0.04;
        addStep(dot);

        create3DLabel(ring, labels[i], '');

        const entry = { mesh: ring, pulse: true, phase: i * 1.5, onHit() { triggerDemo(i); } };
        entries.push(entry);
        clickables3D.push(entry);
      });

      function triggerDemo(i) {
        if (rings[i].userData.placed || ss.demoStarted) return;
        ss.demoStarted = true;
        ab.style.pointerEvents = 'none';
        placeStake(i);
        autoCompleteRest(i);
      }

      function placeStake(i) {
        const pos = stakePositions[i];
        const ring = rings[i];
        if (ring.userData.placed) return;
        ring.userData.placed = true;
        entries[i].pulse = false;
        ring.scale.setScalar(1);
        ring.material = MAT.markerGreen.clone();
        ring.material.emissive.setHex(0x00aa22);

        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.7, 6), MAT.darkGray);
        stake.position.copy(pos);
        stake.position.y = 0.7;
        addStep(stake);

        let sY = 0.7;
        const iv = safeInterval(() => {
          sY -= 0.05;
          stake.position.y = sY;
          if (sY <= 0.15) {
            clearInterval(iv);
            spawnParticles(new THREE.Vector3(pos.x, 0.05, pos.z), MAT.dirt, 5);
          }
        }, 30);

        ss.placed++;
        markSubtask(i);
        markItemDone(i);
        showFeedback('correct', `Stake placed — ${labels[i]}!`);

        if (ss.placed >= ss.total) {
          showFeedback('correct', 'Wall alignment and reinforced-zone footprint set out!');
          safeTimeout(() => completeStep(), 1200);
        }
      }

      function autoCompleteRest(demoIndex) {
        const rest = [0, 1, 2].filter(idx => idx !== demoIndex);
        rest.forEach((i, order) => {
          safeTimeout(() => placeStake(i), 400 * (order + 1));
        });
      }

      function markItemDone(i) {
        const item = items[i];
        item.classList.add('placed');
        item.innerHTML += '<div style="color:var(--green-ok);font-size:.85rem;margin-top:2px;">✓ Placed</div>';
      }

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click one stake point to mark the alignment — the rest will follow the same way</div>';

      const items = [];
      labels.forEach((label, i) => {
        const item = el('div', 'panel-item');
        item.innerHTML = `<div class="item-icon">📍</div><div class="item-label">Place stake — ${label}</div>`;
        item.addEventListener('click', () => triggerDemo(i));
        items.push(item);
        ab.appendChild(item);
      });
    },
    cleanup() {}
  },

  /* ─────────────────── 2: Subgrade Excavation ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.depthPct = 0;
      ss.digging = false;

      const trench = buildTrenchVoid();
      trench.visible = false;
      addStep(trench);
      OBJ.trenchVoid = trench;

      const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(WALL_LENGTH + 1, 0.02, TRENCH_Z1 - TRENCH_Z0));
      const outline = new THREE.LineSegments(outlineGeo, new THREE.LineBasicMaterial({ color: 0xf5a623 }));
      outline.position.set(0, 0.02, (TRENCH_Z0 + TRENCH_Z1) / 2);
      addStep(outline);

      const ab = DOM.actionBar();
      ab.innerHTML = '';

      const statsDiv = el('div', 'blow-display', '');
      statsDiv.innerHTML = `
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center;">
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Subgrade Depth</div>
            <div id="dig-depth" style="color:#f5a623;font-size:1.2rem;font-weight:700;">0.0m</div>
          </div>
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Progress</div>
            <div id="dig-pct" style="color:#27ae60;font-size:1.2rem;font-weight:700;">0%</div>
          </div>
        </div>
      `;
      ab.appendChild(statsDiv);

      const digBtn = makeBtn('EXCAVATE', 'btn-primary', () => {});
      digBtn.style.cssText += 'font-size:1.1rem;padding:12px 40px;background:#c49900;color:#fff;';
      let digInterval = null;
      const maxDepth = TOE_GRADE_Y - SUBGRADE_Y;

      function doDig() {
        if (ss.depthPct >= 100) return;
        ss.depthPct = Math.min(100, ss.depthPct + 2);
        const depth = (maxDepth * ss.depthPct / 100).toFixed(1);
        const dEl = $('dig-depth'); if (dEl) dEl.textContent = depth + 'm';
        const pEl = $('dig-pct');   if (pEl) pEl.textContent = Math.round(ss.depthPct) + '%';

        trench.visible = true;
        trench.scale.y = Math.max(0.02, ss.depthPct / 100);

        if (OBJ.digSpoil) {
          scene.remove(OBJ.digSpoil);
          const si = stepObjects.indexOf(OBJ.digSpoil);
          if (si > -1) stepObjects.splice(si, 1);
        }
        const p = ss.depthPct / 100;
        const mound = new THREE.Mesh(new THREE.SphereGeometry(0.3 + 1.6 * p, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), MAT.dirt);
        mound.scale.set(1.2, 0.5, 1);
        mound.position.set(WALL_X1 + 2.5, 0, TRENCH_Z1 + 1.5);
        mound.castShadow = true;
        addStep(mound);
        OBJ.digSpoil = mound;

        if (Math.random() < 0.4) {
          spawnParticles(new THREE.Vector3((Math.random() - 0.5) * WALL_LENGTH, 0.2, TRENCH_Z0), MAT.dirt, 2);
        }

        if (ss.depthPct >= 100) {
          ss.digging = false;
          if (digInterval) { clearInterval(digInterval); digInterval = null; }
          trench.scale.y = 1;
          markSubtask(0);
          showFeedback('correct', 'Subgrade excavated across the full reinforced-zone footprint!');
          safeTimeout(() => completeStep(), 1000);
        }
      }

      digBtn.addEventListener('mousedown', () => {
        if (ss.depthPct >= 100) return;
        ss.digging = true;
        digInterval = safeInterval(doDig, 60);
        doDig();
      });
      digBtn.addEventListener('mouseup',    () => { ss.digging = false; if (digInterval) { clearInterval(digInterval); digInterval = null; } });
      digBtn.addEventListener('mouseleave', () => { ss.digging = false; if (digInterval) { clearInterval(digInterval); digInterval = null; } });

      ab.appendChild(digBtn);
    },
    cleanup() {
      STATE.stepState.digging = false;
    }
  },

  /* ─────────────────── 3: Leveling Pad ─── */
  {
    enter() {
      const trench = buildTrenchVoid();
      addStep(trench);
      OBJ.trenchVoid = trench;

      const ab = DOM.actionBar();
      ab.innerHTML = '';
      const statsDiv = el('div', 'blow-display', '');
      statsDiv.innerHTML = `
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center;">
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Pad Poured</div>
            <div id="pad-pour-pct" style="color:#27ae60;font-size:1.2rem;font-weight:700;">0%</div>
          </div>
        </div>
      `;
      ab.appendChild(statsDiv);
      const fillWrap = el('div', 'fill-meter-wrap');
      const fillTrack = el('div', 'fill-meter-track');
      const fillBar = el('div', 'fill-meter-bar');
      fillBar.id = 'pad-pour-bar';
      fillBar.style.background = 'linear-gradient(to right,#616161,#9e9e9e,#bdbdbd)';
      fillBar.style.width = '0%';
      fillTrack.appendChild(fillBar);
      fillWrap.appendChild(fillTrack);
      ab.appendChild(fillWrap);

      const pourBtn = makeBtn('HOLD TO POUR', 'btn-primary', () => {});
      pourBtn.style.cssText += 'font-size:1.1rem;padding:12px 40px;background:#757575;color:#fff;margin-top:10px;';
      ab.appendChild(pourBtn);

      let fillPct = 0, pouring = false, iv = null, padFill = null;

      function tick() {
        if (fillPct >= 100) return;
        if (trench.visible) trench.visible = false;
        fillPct = Math.min(100, fillPct + 2.2);
        if (!padFill) {
          padFill = new THREE.Mesh(new THREE.BoxGeometry(0.1, PAD_THICK, PANEL_THICK + 0.5), MAT.pcc);
          padFill.position.set(WALL_X0, SUBGRADE_Y + PAD_THICK / 2, PANEL_THICK / 2);
          addStep(padFill);
        }
        const len = WALL_LENGTH * fillPct / 100;
        padFill.scale.x = len / 0.1;
        padFill.position.x = WALL_X0 + len / 2;

        const bar = $('pad-pour-bar'); if (bar) bar.style.width = fillPct + '%';
        const pct = $('pad-pour-pct'); if (pct) pct.textContent = Math.round(fillPct) + '%';

        if (fillPct >= 100) {
          pouring = false;
          if (iv) { clearInterval(iv); iv = null; }
          markSubtask(0);
          showFeedback('correct', 'Leveling pad poured along the full wall alignment!');
          pourBtn.disabled = true;
          pourBtn.textContent = 'POURED';
          safeTimeout(() => completeStep(), 1200);
        }
      }
      pourBtn.addEventListener('mousedown', () => { if (fillPct >= 100 || pouring) return; pouring = true; iv = safeInterval(tick, 60); tick(); });
      pourBtn.addEventListener('mouseup',    () => { pouring = false; if (iv) { clearInterval(iv); iv = null; } });
      pourBtn.addEventListener('mouseleave', () => { pouring = false; if (iv) { clearInterval(iv); iv = null; } });
    },
    cleanup() {}
  },

  /* ─────────────────── 4-6: Course 1 ─── */
  ...makeCourseHandlers(0),

  /* ─────────────────── 7: Course 2 supervised production cycle ─── */
  makeSupervisedCourseHandler(1),

  /* ─────────────────── 8: Course 3 supervised production cycle ─── */
  makeSupervisedCourseHandler(2),

  /* ─────────────────── 9: Crest Coping & Grading ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.coped = false;
      ss.graded = false;

      addSubgradeFill();
      for (let k = 0; k < N_COURSES; k++) rebuildCourseFull(k);

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Place the coping cap, then grade the crest to finished level</div>';

      const copeBtn = makeBtn('Place Coping Cap', 'btn-primary', () => {
        if (ss.coped) return;
        ss.coped = true;
        copeBtn.disabled = true;
        addCopingMesh();
        markSubtask(0);
        showFeedback('correct', 'Coping cap placed along the crest.');
        gradeBtn.disabled = false;
      });
      ab.appendChild(copeBtn);

      const gradeBtn = makeBtn('Grade Crest to Finish', 'btn-primary', () => {
        if (ss.graded || !ss.coped) return;
        ss.graded = true;
        gradeBtn.disabled = true;
        const crestDepth = RAMP_Z1 - PANEL_Z1 + 0.2;
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(WALL_LENGTH + 0.3, 0.04, crestDepth),
          MAT.siteSoil
        );
        cap.position.set(0, WALL_TOP_Y + 0.02, PANEL_Z1 + crestDepth / 2 - 0.1);
        cap.rotation.x = -0.02;
        addStep(cap);
        markSubtask(1);
        showFeedback('correct', 'Crest graded to shed water away from the wall face.');
        safeTimeout(() => completeStep(), 1200);
      });
      gradeBtn.disabled = true;
      ab.appendChild(gradeBtn);
    },
    cleanup() {}
  },

  /* ─────────────────── 10: Upper Road & Surface Finish ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.subbase = false;
      ss.paved = false;

      addSubgradeFill();
      for (let k = 0; k < N_COURSES; k++) rebuildCourseFull(k);
      addCopingMesh();

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Compact the upper-road subbase, then pave the supported roadway</div>';

      const subBtn = makeBtn('Compact Upper-Road Subbase', 'btn-primary', () => {
        if (ss.subbase) return;
        ss.subbase = true;
        subBtn.disabled = true;
        const sub = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LENGTH, 0.08, ROAD_WIDTH), MAT.gravel);
        sub.position.set(0, RETAINED_GRADE_Y + 0.01, ROAD_CENTER_Z);
        addStep(sub);
        OBJ.compactor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.35, 12), MAT.darkGray);
        OBJ.compactor.position.set(0, ROAD_Y + 0.3, ROAD_CENTER_Z - 1.2);
        addStep(OBJ.compactor);
        STATE.stepState.compacting = true;
        safeTimeout(() => { STATE.stepState.compacting = false; }, 700);
        markSubtask(0);
        showFeedback('correct', 'Upper-road subbase compacted over the reinforced soil mass.');
        paveBtn.disabled = false;
      });
      ab.appendChild(subBtn);

      const paveBtn = makeBtn('Pave Asphalt Surface', 'btn-primary', () => {
        if (ss.paved || !ss.subbase) return;
        ss.paved = true;
        paveBtn.disabled = true;
        addPavementMesh();
        markSubtask(1);
        showFeedback('correct', 'Upper roadway paved and opened across the completed wall alignment.');
        safeTimeout(() => completeStep(), 1200);
      });
      paveBtn.disabled = true;
      ab.appendChild(paveBtn);
    },
    cleanup() { STATE.stepState.compacting = false; }
  },

  /* ─────────────────── 11: Road Opening & Final Inspection ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.checked = 0;
      ss.scores = [];

      addSubgradeFill();
      for (let k = 0; k < N_COURSES; k++) rebuildCourseFull(k);
      addCopingMesh();
      addPavementMesh();
      markSubtask(0);
      showFeedback('correct', 'Upper road opened — live traffic is now supported by the reinforced soil structure.');

      const checkPositions = [
        new THREE.Vector3(WALL_X0 + 1,   WALL_TOP_Y + 0.9, PANEL_Z1 / 2),
        new THREE.Vector3(WALL_X0 + 3.5, WALL_TOP_Y + 0.4, PANEL_Z1 / 2),
        new THREE.Vector3(0,             WALL_TOP_Y + 0.9, PANEL_Z1 / 2),
        new THREE.Vector3(WALL_X1 - 3.5, WALL_TOP_Y + 0.4, PANEL_Z1 / 2),
        new THREE.Vector3(WALL_X1 - 1,   WALL_TOP_Y + 0.9, PANEL_Z1 / 2)
      ];

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Road open above — inspect the MSE system supporting live traffic</div>';

      checkPositions.forEach((pos, i) => {
        const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), MAT.diamondBlue.clone());
        m.position.copy(pos);
        addStep(m);
        create3DLabel(m, FINAL_CHECKS[i].label, '');

        clickables3D.push({
          mesh: m,
          pulse: true,
          phase: i * 1.1,
          onHit() {
            if (m.userData.passed) return;
            m.userData.passed = true;
            m.material.color.set(0x4caf50);
            m.material.emissive.set(0x2e7d32);
            ss.checked++;

            const score = 90 + Math.floor(Math.random() * 11);
            ss.scores.push(score);
            const chk = FINAL_CHECKS[i];

            show3DPopup(m,
              `<strong>${chk.label}</strong><span style="color:#f5a623;font-weight:700;">${score}%</span><span style="font-size:.7rem;opacity:.8;">${chk.note}</span>`,
              2200
            );
            markSubtask(1);
            showFeedback('correct', `${chk.label}: ${score}%`);

            if (ss.checked === FINAL_CHECKS.length) {
              const avg = Math.round(ss.scores.reduce((a, b) => a + b, 0) / ss.scores.length);
              safeTimeout(() => {
                ab.innerHTML = '';
                if (avg >= 80) {
                  markSubtask(2);
                  markSubtask(3);
                  ab.appendChild(el('div', 'step-instruction', `Average score ${avg}% — PASS. Construction signed off.`));
                  showFeedback('correct', `Final inspection passed at ${avg}%!`);
                  safeTimeout(() => completeStep(), 1500);
                } else {
                  ab.appendChild(el('div', 'step-instruction', `Average score ${avg}% — below 80% threshold.`));
                  showFeedback('wrong', `Inspection average ${avg}% did not meet the 80% threshold.`);
                  safeTimeout(() => completeStep(), 1500);
                }
              }, 800);
            }
          }
        });
      });
    },
    cleanup() {}
  }
];

/* ══════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(init, 50);
});
