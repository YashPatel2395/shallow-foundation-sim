/* ============================================================
   DRILLED SHAFT FOUNDATION CONSTRUCTION SIMULATION — Three.js 3D
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
   CONSTANTS
══════════════════════════════════════════════════════════════ */

const STEPS = [
  {
    title: '1. Site Investigation',
    desc: 'Conduct soil boring tests at 5 locations to determine soil profile and bearing capacity.',
    subtasks: ['Test point BH-1','Test point BH-2','Test point BH-3','Test point BH-4','Test point BH-5','Review soil report'],
    why: 'Drilled shafts require detailed soil knowledge to design shaft diameter, depth, and concrete mix.',
    warning: 'Skipping borings risks drilling into unexpected rock or losing borehole stability.'
  },
  {
    title: '2. Shaft Layout',
    desc: 'Mark the exact positions for all 4 drilled shaft centres using survey equipment.',
    subtasks: ['Place shaft marker S1','Place shaft marker S2','Place shaft marker S3','Place shaft marker S4'],
    why: 'Shaft positions must align with column loads. Incorrect layout misses the load path entirely.',
    warning: 'Layout errors cannot be corrected after drilling. Check twice, drill once.'
  },
  {
    title: '3. Mobilise Drilling Rig',
    desc: 'Position the rotary drilling rig over shaft S1 and complete rig setup checks.',
    subtasks: ['Drive rig to shaft S1','Extend Kelly bar','Attach drill bucket','Confirm rig level'],
    why: 'The rotary drilling rig rotates a cutting tool to remove soil and create the borehole.',
    warning: 'Rig must be perfectly centred over the shaft marker to maintain borehole alignment.'
  },
  {
    title: '4. Drill Borehole',
    desc: 'Rotate the drill bucket to excavate all 4 boreholes to the design depth of 17 m.',
    subtasks: ['Drill shaft S1 to 17 m','Drill shaft S2 to 17 m','Drill shaft S3 to 17 m','Drill shaft S4 to 17 m'],
    why: 'The borehole must reach firm bearing stratum. Spoil is lifted and deposited beside the rig.',
    warning: 'Monitor for borehole collapse in soft soils — install casing immediately if walls begin to slump.'
  },
  {
    title: '5. Install Temporary Casing',
    desc: 'Lower a steel casing into each borehole to prevent collapse during reinforcement and concrete placement.',
    subtasks: ['Lower casing into S1','Lower casing into S2','Lower casing into S3','Lower casing into S4'],
    why: 'Temporary casing supports unstable borehole walls and keeps the hole circular for the rebar cage.',
    warning: 'Casing must reach stable soil — partial casing leaves the lower shaft unprotected.'
  },
  {
    title: '6. Lower Reinforcement Cage',
    desc: 'Lower a pre-assembled steel rebar cage into each cased borehole.',
    subtasks: ['Lower cage into S1','Lower cage into S2','Lower cage into S3','Lower cage into S4'],
    why: 'The rebar cage provides tensile strength to the drilled shaft, enabling it to resist bending and tension.',
    warning: 'Cage must be centred with concrete cover spacers — contact with casing wall causes corrosion.'
  },
  {
    title: '7. Pour Concrete — Tremie Method',
    desc: 'Pour concrete from the bottom of each borehole upward using a tremie pipe. Withdraw casing as concrete rises.',
    subtasks: ['Tremie pour shaft S1 — withdraw casing','Tremie pour shaft S2 — withdraw casing','Tremie pour shaft S3 — withdraw casing','Tremie pour shaft S4 — withdraw casing'],
    why: 'Tremie placement prevents concrete segregation. Casing is withdrawn slowly so concrete always stays above the casing toe.',
    warning: 'Never withdraw casing faster than concrete rises — this collapses the borehole wall into the shaft.'
  },
  {
    title: '8. Formwork Installation',
    desc: 'Install wooden formwork panels to contain the concrete pour.',
    subtasks: ['Place North wall panel', 'Place South wall panel', 'Place East wall panel', 'Place West wall panel'],
    why: 'Formwork gives the concrete its final shape and dimensions.',
    warning: 'Misaligned formwork produces an off-centre foundation.'
  },
  {
    title: '9. Reinforcement Placement',
    desc: 'Lay the base rebar mat first, then place the column rebar cage ready for the column.',
    subtasks: ['Place lower mat (8 longitudinal bars)', 'Place cross mat (8 cross bars)', 'Place column rebar (4 corner bars)', 'Reinforcement complete'],
    why: 'Rebar provides tensile strength — base mat resists footing loads, column cage transfers structural loads upward.',
    warning: 'Column rebar must be placed before concrete is poured — it cannot be added afterwards.'
  },
  {
    title: '10. Concrete Placement',
    desc: 'Pour concrete from the ready-mix truck. Hit the 88–98% target zone.',
    subtasks: ['Hold pour button to fill', 'Release in the green zone (88–98%)', 'Avoid overfill'],
    why: 'Correct fill level ensures structural integrity and cover depth.',
    warning: 'Overfill causes honeycombing; underfill reduces load capacity.'
  },
  {
    title: '11. Inspection',
    desc: 'The site inspector checks all critical construction elements.',
    subtasks: ['Click each inspection point', 'Review PASS results', 'Sign off inspection'],
    why: 'Third-party inspection ensures compliance with structural codes.',
    warning: 'Uninspected work cannot proceed legally.'
  },
  {
    title: '12. Curing',
    desc: 'Keep the concrete moist for 7 days to reach full strength.',
    subtasks: ['Water concrete each day', 'Monitor strength gain bar', 'Complete 7-day cycle'],
    why: 'Curing prevents shrinkage cracks and reaches design strength.',
    warning: 'Missing watering days reduces final strength by up to 40%.'
  },
  {
    title: '13. Final Inspection',
    desc: 'Verify 5 quality checkpoints on the completed foundation.',
    subtasks: ['Check all 5 quality points', 'Average score ≥ 80%', 'Proceed to pillar construction'],
    why: 'Final QA confirms the foundation meets design specifications.',
    warning: 'Defective foundation cannot support the structure above.'
  },
  {
    title: '14. Pillar Construction',
    desc: 'Install formwork around the pre-placed column rebar, pour concrete, water and cure it, then strip the formwork.',
    subtasks: ['Install column formwork', 'Pour column concrete', 'Water & cure column concrete', 'Strip formwork'],
    why: 'The column transfers structural loads to the foundation below.',
    warning: 'Column must be centred and plumb for load transfer. Water the concrete immediately after pouring.'
  },
  {
    title: '15. Backfilling',
    desc: 'Refill soil around the finished pillar and compact it — only the column top remains above ground.',
    subtasks: ['Add soil 5 times around pillar', 'Compact 3 times (after 60% fill)', 'Reach 100% fill — pillar base buried'],
    why: 'Backfilling after the pillar protects the underground foundation and sets the finished ground level.',
    warning: 'Never backfill before the pillar concrete has fully cured — movement will misalign the column.'
  }
];

const STEP_META = [
  {
    purpose: 'Determine the subsurface soil profile to design the drilled shaft diameter and depth.',
    userAction: 'Click all 5 soil boring markers and review the soil report.',
    tools: ['Rotary boring rig','SPT sampler','Geotechnical lab'],
    qualityCheck: 'All boring locations tested; soil profile and groundwater level documented.',
    commonMistake: 'Insufficient borings miss variable soil — unexpected rock can halt drilling mid-shaft.',
    learningObjective: 'Drilled shafts transfer load in both side friction and end bearing — soil knowledge is essential.'
  },
  {
    purpose: 'Establish exact shaft centres aligned with the structural column load paths.',
    userAction: 'Click each target ring to place a survey marker at the design position.',
    tools: ['Total station','Survey stakes','Steel tape','Design drawings'],
    qualityCheck: 'All shaft centres within ±25 mm of design coordinates.',
    commonMistake: 'Transposing coordinates places the shaft outside the column load path.',
    learningObjective: 'Shaft positions define where load is transferred underground — precision matters.'
  },
  {
    purpose: 'Centre the rotary drilling rig over the shaft location and prepare the drill string.',
    userAction: 'Drive the rig to shaft S1, extend the Kelly bar, attach the drill bucket, and confirm level.',
    tools: ['Rotary drilling rig','Kelly bar','Drill bucket','Spirit level'],
    qualityCheck: 'Rig centred within ±20 mm of shaft centre; Kelly bar plumb.',
    commonMistake: 'Rig off-centre causes an inclined borehole — shaft may miss the design footprint.',
    learningObjective: 'The Kelly bar transmits torque and crowd force from rotary head to drill bucket.'
  },
  {
    purpose: 'Excavate the cylindrical borehole to the design depth through all soil layers.',
    userAction: 'Hold DRILL to rotate the bucket and advance to 17 m depth for each of the 4 shafts.',
    tools: ['Drill bucket','Kelly bar','Depth monitor','Bentonite/polymer slurry'],
    qualityCheck: 'All 4 boreholes at 17 m depth; vertical within 1:75; no borehole collapse.',
    commonMistake: 'Stopping short of the bearing layer reduces end-bearing capacity.',
    learningObjective: 'Drill bucket rotation cuts and collects spoil; multiple bucket-lifts build up the full depth.'
  },
  {
    purpose: 'Support unstable borehole walls to maintain a clean cylindrical void for the rebar cage.',
    userAction: 'Lower and seat the steel casing into each borehole.',
    tools: ['Temporary steel casing','Crane','Vibratory hammer (if needed)'],
    qualityCheck: 'Casing seated in stable material; top flush with or slightly above grade.',
    commonMistake: 'Casing too short leaves soft upper soils unsupported — wall collapse contaminates the shaft.',
    learningObjective: 'Casing acts as formwork above; it is withdrawn as concrete fills from below.'
  },
  {
    purpose: 'Place tensile reinforcement so the shaft can carry bending, tension, and column connection loads.',
    userAction: 'Lower the pre-assembled rebar cage into each cased borehole.',
    tools: ['Pre-fabricated rebar cage','Crane','Concrete cover spacers','Plumb bob'],
    qualityCheck: 'Cage centred; cover spacers in place; cage tip at design depth.',
    commonMistake: 'Cage not centred — concrete cover insufficient on one side leading to corrosion.',
    learningObjective: 'Rebar cage must be assembled before lowering; it cannot be spliced in a wet borehole.'
  },
  {
    purpose: 'Form the in-situ concrete shaft by placing concrete from the bottom upward to avoid contamination.',
    userAction: 'Insert tremie pipe, pour concrete to fill each shaft from bottom up, and withdraw casing.',
    tools: ['Tremie pipe','Ready-mix truck','Crane','Concrete pump'],
    qualityCheck: 'Concrete fills to design level; no soil contamination; casing withdrawn smoothly.',
    commonMistake: 'Withdrawing casing too fast sucks soil into the shaft — creates a void or "neck".',
    learningObjective: 'Tremie pipe tip always stays submerged in fresh concrete — prevents water/soil contamination.'
  },
  {
    purpose: 'Create a temporary mold that holds the concrete footing in the correct shape and position.',
    userAction: 'Place and align the footing formwork inside the excavation.',
    tools: ['Wooden formwork boards', 'Alignment markers', 'Footing layout'],
    qualityCheck: 'Formwork must be centered, level, and aligned with the planned foundation location.',
    commonMistake: 'Misaligned formwork causes the foundation to be built in the wrong position.',
    learningObjective: 'Formwork controls the shape and accuracy of concrete placement.'
  },
  {
    purpose: 'Create a full-coverage steel mat so the footing can resist tension and cracking across its entire area.',
    userAction: 'Place the lower longitudinal mat first, then lay the cross mat on top to form the full grid.',
    tools: ['Steel rebars', 'Rebar mat', 'Spacers/chairs', 'Tie wire'],
    qualityCheck: 'All bars must form a regular grid with even spacing; no bars touching the formwork directly.',
    commonMistake: 'Placing cross bars before longitudinal bars gives an unstable grid that shifts during pour.',
    learningObjective: 'A proper two-layer rebar mat covers the full footing area and resists loads in both directions.'
  },
  {
    purpose: 'Pour concrete into the footing formwork to create the structural foundation underground.',
    userAction: 'Pour concrete until the target fill level is reached without underfilling or overfilling.',
    tools: ['Concrete truck', 'Discharge chute', 'Concrete mix', 'Formwork'],
    qualityCheck: 'Concrete should fill the formwork evenly to the required level (88–98%).',
    commonMistake: 'Pouring before reinforcement is complete, or overfilling the formwork.',
    learningObjective: 'Concrete placement must follow reinforcement and formwork preparation.'
  },
  {
    purpose: 'Verify that critical construction elements are correct before the foundation is covered.',
    userAction: 'Inspect excavation depth, formwork alignment, rebar placement, and concrete level.',
    tools: ['Inspector checklist', 'Inspection markers', 'Measuring tools'],
    qualityCheck: 'All inspection items must pass before curing and backfilling proceed.',
    commonMistake: 'Skipping inspection can hide errors that become impossible to fix later.',
    learningObjective: 'Third-party inspection prevents hidden construction defects.'
  },
  {
    purpose: 'Allow concrete to gain strength through proper moisture and time control.',
    userAction: 'Maintain curing by watering the concrete for 7 days to reach required strength.',
    tools: ['Water curing tool', 'Curing timer', 'Strength indicator'],
    qualityCheck: 'Concrete strength must reach the required percentage before backfilling.',
    commonMistake: 'Backfilling or loading concrete too early can damage weak concrete.',
    learningObjective: 'Concrete needs time to develop strength — curing is not optional.'
  },
  {
    purpose: 'Confirm the shallow foundation is complete and ready for above-ground structural work.',
    userAction: 'Review the final foundation condition and approve the completed underground work.',
    tools: ['Final checklist', 'Inspection report', 'Visual foundation review'],
    qualityCheck: 'Foundation must be positioned, cured, and ready for column construction.',
    commonMistake: 'Starting the column before confirming foundation quality risks structural failure.',
    learningObjective: 'Final inspection connects underground foundation work to above-ground construction.'
  },
  {
    purpose: 'Build the reinforced concrete column that transfers building load down to the footing.',
    userAction: 'Place column rebar, install formwork, pour concrete, then strip the formwork.',
    tools: ['Column rebars', 'Stirrups', 'Column formwork', 'Concrete', 'Finishing tools'],
    qualityCheck: 'Column must be vertical, centered on footing, and connected to starter bars.',
    commonMistake: 'A misaligned column transfers load incorrectly and creates structural problems.',
    learningObjective: 'The column connects the above-ground structure to the buried foundation below.'
  },
  {
    purpose: 'Refill soil around the finished pillar and compact to restore ground level, leaving only the column visible.',
    userAction: 'Add soil in layers around the pillar base and compact until ground level is fully restored.',
    tools: ['Backfill soil', 'Plate compactor', 'Soil layer indicator', 'Ground level marker'],
    qualityCheck: 'Soil must be level with surrounding ground; pillar protrudes above at correct height.',
    commonMistake: 'Backfilling before pillar concrete has cured causes column misalignment.',
    learningObjective: 'Backfilling is the final step — it buries the foundation and sets the finished ground level.'
  }
];

const SOIL_RESULTS = [
  { soil: 'Sandy Loam',   bearing: '120 kN/m²', moisture: '18%', note: 'Moderate bearing capacity' },
  { soil: 'Stiff Clay',   bearing: '200 kN/m²', moisture: '22%', note: 'Good for shallow foundations' },
  { soil: 'Dense Gravel', bearing: '300 kN/m²', moisture: '8%',  note: 'Excellent bearing capacity' },
  { soil: 'Silty Sand',   bearing: '90 kN/m²',  moisture: '25%', note: 'Requires deeper footing' },
  { soil: 'Firm Sand',    bearing: '150 kN/m²', moisture: '14%', note: 'Suitable for shallow found.' }
];

const DEBRIS_ITEMS = [
  { type: 'rock',  label: 'Rock'  },
  { type: 'rock',  label: 'Rock'  },
  { type: 'stump', label: 'Stump' },
  { type: 'stump', label: 'Stump' },
  { type: 'weed',  label: 'Weeds' },
  { type: 'weed',  label: 'Weeds' }
];

const INSPECTION_POINTS = [
  { label: 'Pit Depth',      note: 'Depth matches design specification.' },
  { label: 'Rebar Spacing',  note: 'Bar spacing within tolerance.' },
  { label: 'Concrete Level', note: 'Fill level in acceptable range.' },
  { label: 'Alignment',      note: 'Foundation centred on layout.' }
];

const FINAL_CHECKS = [
  { label: 'Foundation Level',   note: 'Surface within ±2mm tolerance.' },
  { label: 'Concrete Finish',    note: 'Smooth, void-free surface.' },
  { label: 'Drainage Clearance', note: 'Adequate fall for drainage.' },
  { label: 'Dimensions',         note: 'Width and length match drawings.' },
  { label: 'Bearing Surface',    note: 'Even contact with soil below.' }
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
  timeouts: [],
  drivenDepth: 0,
  drilledDepth: 0,
  totalBlows: 0,
  alignmentNS: 90 + (Math.random() - 0.5) * 3,
  alignmentEW: 90 + (Math.random() - 0.5) * 3,
  excavationComplete: false
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
camera.position.set(18, 2, 24);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.85;
controls.minDistance   = 3;
controls.maxDistance   = 80;
controls.target.set(0, -10, 0);

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
  steel: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#607d8b';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = 2 + Math.random() * 6;
      const b = Math.floor(80 + Math.random() * 60);
      ctx.fillStyle = `rgb(${b},${b + 10},${b + 20})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  })
};

TEX.grass.repeat.set(4, 4);
TEX.dirt.repeat.set(2, 2);
TEX.concrete.repeat.set(2, 4);
TEX.wood.repeat.set(1, 3);
TEX.steel.repeat.set(2, 4);

/* ══════════════════════════════════════════════════════════════
   MATERIALS
══════════════════════════════════════════════════════════════ */

const MAT = {
  grass:    new THREE.MeshLambertMaterial({ map: TEX.grass }),
  concrete: new THREE.MeshLambertMaterial({ map: TEX.concrete }),
  concreteDark: new THREE.MeshLambertMaterial({ color: 0x888888, map: TEX.concrete }),
  wood:     new THREE.MeshLambertMaterial({ map: TEX.wood }),
  steel:    new THREE.MeshLambertMaterial({ map: TEX.steel }),
  yellow:   new THREE.MeshLambertMaterial({ color: 0xf5a623 }),
  darkGray: new THREE.MeshLambertMaterial({ color: 0x37474f }),
  black:    new THREE.MeshLambertMaterial({ color: 0x111111 }),
  orange:   new THREE.MeshLambertMaterial({ color: 0xd84315 }),
  red:      new THREE.MeshLambertMaterial({ color: 0xc62828 }),
  blue:     new THREE.MeshLambertMaterial({ color: 0x1565c0 }),
  green:    new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
  white:    new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
  topsoil:   new THREE.MeshLambertMaterial({ color: 0x8B6340 }),
  softClay:  new THREE.MeshLambertMaterial({ color: 0x6B8E6E }),
  looseSand: new THREE.MeshLambertMaterial({ color: 0xD4A85A }),
  denseSand: new THREE.MeshLambertMaterial({ color: 0xC4843A }),
  bearing:   new THREE.MeshLambertMaterial({ color: 0x607080 }),
  rigYellow: new THREE.MeshLambertMaterial({ color: 0xe8b800 }),
  rigDarkYellow: new THREE.MeshLambertMaterial({ color: 0xc49900 }),
  cabGray:   new THREE.MeshLambertMaterial({ color: 0x3a3a3a }),
  hammerGray: new THREE.MeshLambertMaterial({ color: 0x555555 }),
  trackDark: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
  dirt:     new THREE.MeshLambertMaterial({ map: TEX.dirt }),
  skin:     new THREE.MeshLambertMaterial({ color: 0xffcc99 }),
  concreteCured: new THREE.MeshLambertMaterial({ color: 0x757575, map: TEX.concrete }),
  cabOrange: new THREE.MeshLambertMaterial({ color: 0xe65100 }),
  steelBright:  new THREE.MeshLambertMaterial({ color: 0xb0bec5 }),
  rulerWhite:   new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
  rulerRed:     new THREE.MeshLambertMaterial({ color: 0xf44336 }),
  markerOrange: new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.4 }),
  markerGreen:  new THREE.MeshStandardMaterial({ color: 0x00cc44, emissive: 0x00aa22, emissiveIntensity: 0.3 }),
  inspOrange:   new THREE.MeshStandardMaterial({ color: 0xf39c12, emissive: 0xd4880a, emissiveIntensity: 0.3, transparent: true, opacity: 0.9 }),
  inspGreen:    new THREE.MeshStandardMaterial({ color: 0x27ae60, emissive: 0x1e8449, emissiveIntensity: 0.3 }),
  diamondBlue:  new THREE.MeshStandardMaterial({ color: 0x2196f3, emissive: 0x1565c0, emissiveIntensity: 0.4 }),
  diamondGreen: new THREE.MeshStandardMaterial({ color: 0x4caf50, emissive: 0x2e7d32, emissiveIntensity: 0.3 }),
  cutLine:      new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 0.6, transparent: true, opacity: 0.8 }),
  formworkWood: new THREE.MeshLambertMaterial({ color: 0xc8902a }),
  rebarSteel:   new THREE.MeshLambertMaterial({ color: 0x607d8b }),
  concreteWet:  new THREE.MeshLambertMaterial({ color: 0x9e9e9e, transparent: true, opacity: 0.92 }),
  waterBlue:    new THREE.MeshLambertMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.7 }),
  flashWhite:   new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0, transparent: true, opacity: 0.9 }),
  boreholeDark: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
  casingSteel:  new THREE.MeshLambertMaterial({ color: 0x607d8b, transparent: true, opacity: 0.85 })
};

/* ══════════════════════════════════════════════════════════════
   SCENE OBJECT MANAGEMENT
══════════════════════════════════════════════════════════════ */

let stepObjects   = [];
let persistObjs   = [];
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
  delete OBJ.hammer;
  delete OBJ.pile;
  delete OBJ.pileGroup;
  delete OBJ.rig;
  delete OBJ.impactFlash;
  delete OBJ.pileCap;
  delete OBJ.formwork;
  delete OBJ.particles;
  delete OBJ.excavatorArm;
  delete OBJ.excavatorBucket;
  delete OBJ.excavatorStick;
  delete OBJ.excavatorUpper;
  delete OBJ.truckDrum;
  delete OBJ.truckChuteGroup;
  delete OBJ.inspector;
  delete OBJ.pitFloor;
  delete OBJ.concreteFill;
  delete OBJ.backfillMesh;
  delete OBJ.curingBlanket;
  delete OBJ.columnConcrete;
  delete OBJ.columnFW;
  delete OBJ.soilPile;
  delete OBJ.depthRuler;
  delete OBJ.pourStream;
  delete OBJ.compactor;
  delete OBJ.curingConcrete;
  delete OBJ.excavPitViz;
  delete OBJ.backfillMeshes;
  delete OBJ.drillingRig;
  delete OBJ.boreholes;
  delete OBJ.casings;
  delete OBJ.rebarCages;
}

/* ══════════════════════════════════════════════════════════════
   CAMERA PRESETS
══════════════════════════════════════════════════════════════ */

const CAM_PRESETS = [
  { pos: new THREE.Vector3(16,  4, 22), look: new THREE.Vector3(0, -5, 0) },   // 0 investigation
  { pos: new THREE.Vector3(12,  8, 16), look: new THREE.Vector3(0,  0, 0) },   // 1 layout
  { pos: new THREE.Vector3(14,  4, 18), look: new THREE.Vector3(0,  2, 0) },   // 2 mobilise rig
  { pos: new THREE.Vector3(18,  0, 24), look: new THREE.Vector3(0, -8, 0) },   // 3 drill borehole
  { pos: new THREE.Vector3(14,  2, 18), look: new THREE.Vector3(0, -4, 0) },   // 4 install casing
  { pos: new THREE.Vector3(14,  2, 18), look: new THREE.Vector3(0, -4, 0) },   // 5 lower cage
  { pos: new THREE.Vector3(18, -2, 24), look: new THREE.Vector3(0,-10, 0) },   // 6 pour concrete
  { pos: new THREE.Vector3( 5,  6,  7), look: new THREE.Vector3(0,-1.5,0) },   // 7 formwork
  { pos: new THREE.Vector3( 3,  7,  5), look: new THREE.Vector3(0,-1.5,0) },   // 8 reinforcement
  { pos: new THREE.Vector3( 9,  4, 12), look: new THREE.Vector3(0,-1.5,0) },   // 9 concrete
  { pos: new THREE.Vector3( 8,  7, 11), look: new THREE.Vector3(0, 0,  0) },   // 10 inspection
  { pos: new THREE.Vector3( 4,  4,  6), look: new THREE.Vector3(0,-1,  0) },   // 11 curing
  { pos: new THREE.Vector3(10, 10, 13), look: new THREE.Vector3(0, 0,  0) },   // 12 final insp
  { pos: new THREE.Vector3( 8,  2, 11), look: new THREE.Vector3(0,-2,  0) },   // 13 pillar
  { pos: new THREE.Vector3( 7,  5,  9), look: new THREE.Vector3(0,-1,  0) }    // 14 backfill
];

let camTarget = null;

function setCamPreset(n) {
  const p = CAM_PRESETS[Math.min(n, CAM_PRESETS.length - 1)];
  camTarget = { pos: p.pos.clone(), look: p.look.clone() };
}

const VIEW_PRESETS = {
  iso:     { pos: new THREE.Vector3(20,  0, 26),  look: new THREE.Vector3(0, -10, 0) },
  top:     { pos: new THREE.Vector3(0,  30,  1),  look: new THREE.Vector3(0,   0, 0) },
  front:   { pos: new THREE.Vector3(0,  -4, 28),  look: new THREE.Vector3(0, -10, 0) },
  side:    { pos: new THREE.Vector3(28, -4,  0),  look: new THREE.Vector3(0, -10, 0) },
  cutaway: { pos: new THREE.Vector3(14, -8, 20),  look: new THREE.Vector3(0, -14, 0) },
};

window.setCameraView = function(name) {
  const p = VIEW_PRESETS[name];
  if (p) camTarget = { pos: p.pos.clone(), look: p.look.clone() };
};

window.resetCamera = function() {
  setCamPreset(STATE.currentStep);
  controls.target.set(0, -10, 0);
};

/* ══════════════════════════════════════════════════════════════
   PERSISTENT SCENE OBJECTS
══════════════════════════════════════════════════════════════ */

let groundGroup = new THREE.Group();
scene.add(groundGroup);

let soilLayerGroup = new THREE.Group();
scene.add(soilLayerGroup);

function buildGround() {
  while (groundGroup.children.length) groundGroup.remove(groundGroup.children[0]);

  const gravelCanvas = document.createElement('canvas');
  gravelCanvas.width = gravelCanvas.height = 512;
  const gc = gravelCanvas.getContext('2d');

  gc.fillStyle = '#5a4a35';
  gc.fillRect(0, 0, 512, 512);

  const stoneColors = ['#7a6548','#6b5840','#8a7558','#4e3e2a','#9a8768','#3e3028','#857060'];
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const rx = 3 + Math.random() * 9, ry = 2 + Math.random() * 6;
    gc.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
    gc.beginPath();
    gc.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    gc.fill();
  }
  gc.fillStyle = 'rgba(30,20,10,0.35)';
  gc.fillRect(60, 0, 30, 512);
  gc.fillRect(160, 0, 25, 512);
  for (let i = 0; i < 6; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const r = 15 + Math.random() * 30;
    const grd = gc.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(25,15,5,0.5)');
    grd.addColorStop(1, 'rgba(25,15,5,0)');
    gc.fillStyle = grd;
    gc.beginPath(); gc.arc(x, y, r, 0, Math.PI * 2); gc.fill();
  }

  const gravelTex = new THREE.CanvasTexture(gravelCanvas);
  gravelTex.wrapS = gravelTex.wrapT = THREE.RepeatWrapping;
  gravelTex.repeat.set(3, 3);

  const surfMat = new THREE.MeshLambertMaterial({ map: gravelTex });
  surfMat.polygonOffset      = true;
  surfMat.polygonOffsetFactor = -1;
  surfMat.polygonOffsetUnits  = -1;

  const m1 = new THREE.Mesh(new THREE.PlaneGeometry(18, 36), surfMat);
  m1.rotation.x = -Math.PI / 2; m1.position.set(-9, 0.005, 0); m1.receiveShadow = true;
  groundGroup.add(m1);

  const m2 = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), surfMat);
  m2.rotation.x = -Math.PI / 2; m2.position.set(9, 0.005, -9); m2.receiveShadow = true;
  groundGroup.add(m2);

  const m3 = new THREE.Mesh(new THREE.PlaneGeometry(12, 18), surfMat);
  m3.rotation.x = -Math.PI / 2; m3.position.set(12, 0.005, 9); m3.receiveShadow = true;
  groundGroup.add(m3);

  const m4 = new THREE.Mesh(new THREE.PlaneGeometry(6, 12), surfMat);
  m4.rotation.x = -Math.PI / 2; m4.position.set(3, 0.005, 12); m4.receiveShadow = true;
  groundGroup.add(m4);

  const edgeMat = new THREE.MeshLambertMaterial({ color: 0xf5a623 });
  const ex = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.05), edgeMat);
  ex.position.set(3, 0.025, 0); groundGroup.add(ex);
  const ez = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 6), edgeMat);
  ez.position.set(0, 0.025, 3); groundGroup.add(ez);
}

let siteGroup = null;

function buildSiteElements() {
  if (siteGroup) { scene.remove(siteGroup); }
  siteGroup = new THREE.Group();
  scene.add(siteGroup);

  const matBarrier  = new THREE.MeshLambertMaterial({ color: 0xd0d0d0 });
  const matBarrierS = new THREE.MeshLambertMaterial({ color: 0xb0b0b0 });
  const matTrailer  = new THREE.MeshLambertMaterial({ color: 0x4a7c9e });
  const matRoof     = new THREE.MeshLambertMaterial({ color: 0x3a6080 });
  const matWindow   = new THREE.MeshLambertMaterial({ color: 0x8ec4e8, transparent: true, opacity: 0.7 });
  const matSpoil    = new THREE.MeshLambertMaterial({ color: 0x7a5c35 });
  const matRebar    = new THREE.MeshLambertMaterial({ color: 0x607d8b });
  const matAggreg   = new THREE.MeshLambertMaterial({ color: 0xb8a882 });
  const matHoardDk  = new THREE.MeshLambertMaterial({ color: 0x1a3a5c, side: THREE.DoubleSide });
  const matHoardLt  = new THREE.MeshLambertMaterial({ color: 0xf5a623 });

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

  for (let x = -14; x <= 14; x += 2.2) addBarrier(x, -15, 0);
  for (let z = -13; z <= 14; z += 2.2) addBarrier(-15, z, Math.PI / 2);

  const hBoard = new THREE.Mesh(new THREE.BoxGeometry(8, 2.5, 0.12), matHoardDk);
  hBoard.position.set(-8, 1.25, -15.1);
  siteGroup.add(hBoard);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(8, 0.35, 0.14), matHoardLt);
  stripe.position.set(-8, 2.4, -15.08);
  siteGroup.add(stripe);

  const cabin = new THREE.Group();
  cabin.position.set(12, 0, -12);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.4, 2.5), matTrailer);
  walls.position.y = 1.2; cabin.add(walls);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.12, 2.7), matRoof);
  roof.position.y = 2.46; cabin.add(roof);
  const winG = new THREE.BoxGeometry(0.9, 0.8, 0.1);
  const w1 = new THREE.Mesh(winG, matWindow); w1.position.set(-1.4, 1.3, 1.26); cabin.add(w1);
  const w2 = new THREE.Mesh(winG, matWindow); w2.position.set( 0.4, 1.3, 1.26); cabin.add(w2);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.1), matBarrierS);
  door.position.set(1.5, 0.9, 1.26); cabin.add(door);
  siteGroup.add(cabin);

  const spoilGeo = new THREE.SphereGeometry(2.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const spoil = new THREE.Mesh(spoilGeo, matSpoil);
  spoil.position.set(14, 0, 12);
  spoil.scale.set(1.2, 0.55, 0.9);
  spoil.castShadow = true;
  siteGroup.add(spoil);
  const spoil2 = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    matSpoil
  );
  spoil2.position.set(16.2, 0, 10.5);
  spoil2.scale.set(1, 0.45, 0.85);
  siteGroup.add(spoil2);

  const sandGeo = new THREE.SphereGeometry(1.8, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const sandPile = new THREE.Mesh(sandGeo, matAggreg);
  sandPile.position.set(-12, 0, 6);
  sandPile.scale.set(1.1, 0.5, 0.9);
  sandPile.castShadow = true;
  siteGroup.add(sandPile);

  const rebarBundle = new THREE.Group();
  rebarBundle.position.set(-11, 0.1, -8);
  for (let row = 0; row < 3; row++) {
    const cols = 5 - row;
    for (let col = 0; col < cols; col++) {
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 4.5, 6),
        matRebar
      );
      bar.rotation.z = Math.PI / 2;
      bar.position.set(col * 0.18 - (cols * 0.18) / 2, row * 0.1, 0);
      rebarBundle.add(bar);
    }
  }
  siteGroup.add(rebarBundle);

  const pipeMat = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });
  for (let i = 0; i < 3; i++) {
    const pipe = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.12, 8, 18),
      pipeMat
    );
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(15, 0.13 + i * 0.25, 0);
    pipe.castShadow = true;
    siteGroup.add(pipe);
  }

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
  addCone(7.5, 1.5);
  addCone(1.5, 7.5);
  addCone(9,   8);
  addCone(-6,  9);
  addCone(11, -2);

  const beamMat = new THREE.MeshLambertMaterial({ color: 0x546e7a });
  for (let i = 0; i < 4; i++) {
    const beam = new THREE.Group();
    const web = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.5, 0.18), beamMat);
    beam.add(web);
    const tf = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.18), beamMat);
    tf.position.y = 1.73; beam.add(tf);
    const bf = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.18), beamMat);
    bf.position.y = -1.73; beam.add(bf);
    beam.rotation.z = 0.15;
    beam.position.set(8 + i * 0.3, 1.75 - i * 0.02, -13.5);
    siteGroup.add(beam);
  }
}

function buildSoilLayers() {
  while (soilLayerGroup.children.length) soilLayerGroup.remove(soilLayerGroup.children[0]);

  const fullSize = 12;
  const half     = fullSize / 2;

  const layers = [
    { yTop:  0,  yBot: -2,  color: 0x6b4f2e, hex: '#6b4f2e', label: 'Topsoil',       range: '0 – 2 m',  spt: 'N = 4'  },
    { yTop: -2,  yBot: -6,  color: 0x4a7053, hex: '#4a7053', label: 'Soft Clay',      range: '2 – 6 m',  spt: 'N = 3'  },
    { yTop: -6,  yBot: -11, color: 0xb8864a, hex: '#b8864a', label: 'Loose Sand',     range: '6 – 11 m', spt: 'N = 12' },
    { yTop: -11, yBot: -16, color: 0x9a6020, hex: '#9a6020', label: 'Dense Sand',     range: '11 – 16 m', spt: 'N = 35' },
    { yTop: -16, yBot: -22, color: 0x3a4e5e, hex: '#3a4e5e', label: 'Bearing Layer',  range: '16 – 22 m', spt: 'N > 50' }
  ];

  layers.forEach(l => {
    const h  = l.yTop - l.yBot;
    const cy = (l.yTop + l.yBot) / 2;
    const mat = new THREE.MeshLambertMaterial({ color: l.color });

    const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(half, h, fullSize), mat);
    leftMesh.position.set(-half / 2, cy, 0);
    leftMesh.receiveShadow = true;
    soilLayerGroup.add(leftMesh);

    const brMesh = new THREE.Mesh(new THREE.BoxGeometry(half, h, half), mat);
    brMesh.position.set(half / 2, cy, -half / 2);
    brMesh.receiveShadow = true;
    soilLayerGroup.add(brMesh);

    if (l.yTop < 0) {
      const lineMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const bl = new THREE.Mesh(new THREE.BoxGeometry(half, 0.04, fullSize), lineMat);
      bl.position.set(-half / 2, l.yTop, 0);
      soilLayerGroup.add(bl);
      const br2 = new THREE.Mesh(new THREE.BoxGeometry(half, 0.04, half), lineMat);
      br2.position.set(half / 2, l.yTop, -half / 2);
      soilLayerGroup.add(br2);
    }

    const W = 380, H = 80;
    const lc = document.createElement('canvas');
    lc.width = W; lc.height = H;
    const ctx = lc.getContext('2d');

    ctx.fillStyle = 'rgba(17,24,37,0.92)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = l.hex;
    ctx.fillRect(0, 0, 8, H);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(l.label, 20, 32);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px monospace';
    ctx.fillText(l.range, 20, 58);

    ctx.fillStyle = '#f5a623';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(l.spt, W - 12, 45);

    const tex = new THREE.CanvasTexture(lc);
    const sp  = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(4.2, 0.88, 1);
    sp.position.set(8.0, cy, -half / 2);
    soilLayerGroup.add(sp);
  });

  const rulerMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.05, 22, 0.05), rulerMat);
  ruler.position.set(6.05, -11, 0);
  soilLayerGroup.add(ruler);

  for (let d = 0; d <= 22; d += 2) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.05), rulerMat);
    tick.position.set(6.2, -d, 0);
    soilLayerGroup.add(tick);

    if (d % 4 === 0) {
      const dc = document.createElement('canvas');
      dc.width = 96; dc.height = 36;
      const dctx = dc.getContext('2d');
      dctx.fillStyle = '#94a3b8';
      dctx.font = 'bold 22px monospace';
      dctx.textAlign = 'left';
      dctx.fillText(`${d}m`, 4, 26);
      const dsp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(dc), transparent: true, depthTest: false }));
      dsp.scale.set(0.9, 0.34, 1);
      dsp.position.set(6.85, -d, 0);
      soilLayerGroup.add(dsp);
    }
  }

  const glc = document.createElement('canvas');
  glc.width = 320; glc.height = 48;
  const glctx = glc.getContext('2d');
  glctx.fillStyle = '#f5a623';
  glctx.fillRect(0, 0, 320, 48);
  glctx.fillStyle = '#111827';
  glctx.font = 'bold 24px monospace';
  glctx.textAlign = 'center';
  glctx.fillText('\u25b6 GROUND LEVEL  \u00b10.0m', 160, 32);
  const glsp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glc), transparent: true, depthTest: false }));
  glsp.scale.set(3.6, 0.54, 1);
  glsp.position.set(9.2, 0.4, -1.5);
  soilLayerGroup.add(glsp);
}

/* ══════════════════════════════════════════════════════════════
   3D BUILDERS
══════════════════════════════════════════════════════════════ */

function buildDrillingRig3D(x, z) {
  const rig = new THREE.Group();
  // Crawler base
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.6, 5), MAT.rigDarkYellow);
  base.position.y = 0.3; rig.add(base);
  // Mast (vertical leader)
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.55, 18, 0.55), MAT.rigYellow);
  mast.position.set(0, 9.3, -1.5); rig.add(mast);
  // Rotary head
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), MAT.rigDarkYellow);
  head.position.set(0, 17.5, -1.5); rig.add(head);
  rig.userData.rotaryHead = head;
  // Kelly bar (square section, hangs from head)
  const kelly = new THREE.Mesh(new THREE.BoxGeometry(0.22, 12, 0.22), MAT.steel);
  kelly.position.set(0, 11, -1.5); rig.add(kelly);
  rig.userData.kellyBar = kelly;
  // Drill bucket
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.9, 12), MAT.rigDarkYellow);
  bucket.position.set(0, 4.6, -1.5); rig.add(bucket);
  rig.userData.drillBucket = bucket;
  // Bucket teeth (4 small boxes)
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), MAT.steel);
    tooth.position.set(Math.cos(ang) * 0.3, 4.1, -1.5 + Math.sin(ang) * 0.3);
    rig.add(tooth);
  }
  // Hydraulic arm bracing
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 3), MAT.cabGray);
  brace.position.set(0, 6, 0); rig.add(brace);

  rig.position.set(x || 0, 0, z || 0);
  return rig;
}

function buildDrivingRig(x, z) {
  const rig = new THREE.Group();

  const trackGeo = new THREE.BoxGeometry(1.2, 0.5, 5);
  const trackL = new THREE.Mesh(trackGeo, MAT.trackDark);
  trackL.position.set(-1.2, 0.25, z - 1); trackL.castShadow = true; rig.add(trackL);
  const trackR = new THREE.Mesh(trackGeo, MAT.trackDark);
  trackR.position.set(1.2, 0.25, z - 1); trackR.castShadow = true; rig.add(trackR);

  for (let side = -1; side <= 1; side += 2) {
    for (let i = -2; i <= 2; i++) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8), MAT.darkGray);
      roller.rotation.z = Math.PI / 2; roller.position.set(side * 1.2, 0.22, z - 1 + i * 0.9); rig.add(roller);
    }
  }

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 10; i++) {
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.12), MAT.darkGray);
      shoe.position.set(side * 1.2, 0.52, z - 3.2 + i * 0.5); rig.add(shoe);
    }
  }

  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 3), MAT.rigYellow);
  cabBody.position.set(0, 1.4, z - 1); cabBody.castShadow = true; rig.add(cabBody);

  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 1.6), MAT.rigDarkYellow);
  cabRoof.position.set(-0.3, 2.4, z + 0.3); rig.add(cabRoof);

  const cabWindow = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 }));
  cabWindow.position.set(0, 2.0, z + 0.56); rig.add(cabWindow);

  const engine = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.5), MAT.rigDarkYellow);
  engine.position.set(0, 1.1, z - 2.3); engine.castShadow = true; rig.add(engine);

  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), MAT.darkGray);
  exhaust.position.set(1.0, 2.2, z - 2.3); rig.add(exhaust);

  const mastGeo = new THREE.BoxGeometry(0.4, 18, 0.4);
  const mastM = new THREE.Mesh(mastGeo, MAT.rigYellow);
  mastM.position.set(x, 9.5, z); mastM.castShadow = true; rig.add(mastM);

  const mastCap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.8), MAT.rigDarkYellow);
  mastCap.position.set(x, 18.65, z); rig.add(mastCap);

  const sheave = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12), MAT.darkGray);
  sheave.rotation.x = Math.PI / 2; sheave.position.set(x, 18.3, z); rig.add(sheave);

  const leadGeo = new THREE.BoxGeometry(0.12, 18, 0.12);
  const leadL = new THREE.Mesh(leadGeo, MAT.cabGray);
  leadL.position.set(x - 0.5, 9.5, z); leadL.castShadow = true; rig.add(leadL);
  const leadR = new THREE.Mesh(leadGeo, MAT.cabGray);
  leadR.position.set(x + 0.5, 9.5, z); leadR.castShadow = true; rig.add(leadR);

  for (let cy = 2; cy < 18; cy += 3) {
    const braceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.08), MAT.cabGray);
    braceMesh.position.set(x, cy, z); rig.add(braceMesh);
  }

  const cableGeo = new THREE.CylinderGeometry(0.03, 0.03, 14, 4);
  const cableL = new THREE.Mesh(cableGeo, MAT.darkGray);
  cableL.position.set(x - 0.8, 11, z - 2); cableL.rotation.z = 0.15; cableL.rotation.x = 0.3; rig.add(cableL);
  const cableR = new THREE.Mesh(cableGeo, MAT.darkGray);
  cableR.position.set(x + 0.8, 11, z - 2); cableR.rotation.z = -0.15; cableR.rotation.x = 0.3; rig.add(cableR);

  const hammerGroup = new THREE.Group();
  const hammerBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 1.0), MAT.hammerGray);
  hammerBody.castShadow = true; hammerGroup.add(hammerBody);
  const hammerCapM = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 1.1), MAT.darkGray);
  hammerCapM.position.y = 0.85; hammerGroup.add(hammerCapM);
  const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), MAT.darkGray);
  hook.position.y = 1.3; hammerGroup.add(hook);
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), new THREE.MeshLambertMaterial({ color: 0x884400 }));
  cushion.position.y = -0.85; hammerGroup.add(cushion);
  hammerGroup.position.set(x, 16, z); rig.add(hammerGroup);
  OBJ.hammer = hammerGroup;

  const flashGeo = new THREE.SphereGeometry(0.6, 8, 8);
  const flash = new THREE.Mesh(flashGeo, MAT.flashWhite.clone());
  flash.visible = false; flash.position.set(x, 0, z); rig.add(flash);
  OBJ.impactFlash = flash;

  rig.position.x = 0;
  return rig;
}

function buildPile(horizontal) {
  const pileGroup = new THREE.Group();
  const pileGeo = new THREE.CylinderGeometry(0.22, 0.22, 20, 20);
  const pileMesh = new THREE.Mesh(pileGeo, MAT.concrete);
  pileMesh.castShadow = true; pileMesh.receiveShadow = true;
  pileGroup.add(pileMesh);
  for (let dx = -1; dx <= 1; dx += 2) {
    for (let dz = -1; dz <= 1; dz += 2) {
      const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), MAT.rebarSteel);
      rebar.position.set(dx * 0.1, 10.02, dz * 0.1); pileGroup.add(rebar);
    }
  }
  const tipGeo = new THREE.ConeGeometry(0.22, 0.55, 20);
  const tip = new THREE.Mesh(tipGeo, MAT.steel);
  tip.position.y = -10.28; pileGroup.add(tip);
  if (horizontal) {
    pileGroup.rotation.z = Math.PI / 2;
    pileGroup.position.set(6, 0.25, 3);
  }
  return pileGroup;
}

function buildPileCapMesh() {
  const capGroup = new THREE.Group();
  const capGeo = new THREE.BoxGeometry(6.5, 1.2, 6.5);
  const cap = new THREE.Mesh(capGeo, MAT.concrete);
  cap.castShadow = true; cap.receiveShadow = true;
  cap.position.y = -0.6;
  capGroup.add(cap);
  const ped = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), MAT.concrete);
  ped.position.y = 0.2;
  capGroup.add(ped);
  return capGroup;
}

function buildShaftsForStep() {
  const depth    = STATE.drilledDepth > 0 ? STATE.drilledDepth : 17;
  const PIT_DEPTH  = 5.0;
  const STUB      = 0.4;
  const pileTop = -(PIT_DEPTH - STUB);
  const pileLen = depth - PIT_DEPTH + STUB;

  const positions = [[-2.5,-2.5],[2.5,-2.5],[-2.5,2.5],[2.5,2.5]];
  positions.forEach(([px, pz]) => {
    const grp = new THREE.Group();

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, pileLen, 16), MAT.concreteDark);
    shaft.castShadow = true;
    grp.add(shaft);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 16), MAT.steel);
    tip.position.y = -(pileLen / 2) - 0.25;
    grp.add(tip);

    for (let dx = -1; dx <= 1; dx += 2) {
      for (let dz = -1; dz <= 1; dz += 2) {
        const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), MAT.rebarSteel);
        r.position.set(dx * 0.09, pileLen / 2 + 0.25, dz * 0.09);
        grp.add(r);
      }
    }

    grp.position.set(px, pileTop - pileLen / 2, pz);
    addStep(grp);
  });
}

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
   3D POPUP
══════════════════════════════════════════════════════════════ */

function show3DPopup(mesh, html, duration) {
  const vec = new THREE.Vector3();
  mesh.getWorldPosition(vec);
  vec.project(camera);
  const canvas = renderer.domElement;
  const x = (vec.x * 0.5 + 0.5) * canvas.clientWidth  + canvas.getBoundingClientRect().left;
  const y = (-vec.y * 0.5 + 0.5) * canvas.clientHeight + canvas.getBoundingClientRect().top;
  const popup = document.createElement('div');
  popup.className = 'soil-popup fade-in';
  popup.style.cssText = `left:${x}px;top:${y - 90}px;`;
  popup.innerHTML = html;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), duration || 2500);
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
   GAME ENGINE
══════════════════════════════════════════════════════════════ */

function init() {
  onResize();
  buildChecklist();
  buildGround();
  buildSiteElements();
  buildSoilLayers();
  buildGradeLine();
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

function buildGradeLine() {
  const mat = new THREE.MeshLambertMaterial({ color: 0xf5a623, emissive: 0xf5a623, emissiveIntensity: 0.35 });
  const hLine = new THREE.Mesh(new THREE.BoxGeometry(12, 0.06, 0.06), mat);
  hLine.position.set(0, 0, 0);
  scene.add(hLine);
  persistObjs.push(hLine);
  const vLine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 6), mat);
  vLine.position.set(6, 0, -3);
  scene.add(vLine);
  persistObjs.push(vLine);
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

  if (n >= 7) {
    soilLayerGroup.visible = false;
    STATE.excavationComplete = true;
    buildGroundWithHole();
  } else {
    soilLayerGroup.visible = true;
  }

  updateHUD();
  renderChecklist();
  renderTaskPanel(n);
  DOM.actionBar().innerHTML = '';
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

  DOM.taskWhy().textContent  = s.why     ? '\ud83d\udca1 ' + s.why     : '';
  DOM.taskWarn().textContent = s.warning ? '\u26a0\ufe0f ' + s.warning : '';

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

/* ══════════════════════════════════════════════════════════════
   FEEDBACK / TIMERS / RESULT
══════════════════════════════════════════════════════════════ */

let feedbackTimer = null;

function showFeedback(type, msg) {
  const bar = DOM.feedbackBar();
  bar.className = type;
  bar.textContent = msg;
  bar.classList.remove('hidden');
  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => bar.classList.add('hidden'), 2800);
}

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
    const actualDepth = (STATE.drilledDepth || STATE.drivenDepth).toFixed(1);
    rc.innerHTML = `
      <div id="result-icon">\ud83c\udfd7\ufe0f</div>
      <h2>Drilled Shaft Foundation Complete!</h2>
      <p>All 4 shafts drilled to bearing layer with pile cap constructed.</p>
      <div id="result-score-line">Final Score: <span id="result-score">${STATE.score}</span></div>
      <div id="result-grade">${getGrade()}</div>
      <div class="pile-report">
        <h3 style="color:#f5a623;margin-bottom:10px;">Construction Report</h3>
        <table style="width:100%;text-align:left;font-size:0.85rem;">
          <tr><td style="color:#aaa;">Shaft Type:</td><td>Drilled Shaft (Bored Pile)</td></tr>
          <tr><td style="color:#aaa;">Shaft Diameter:</td><td>900mm</td></tr>
          <tr><td style="color:#aaa;">Design Depth:</td><td>17.0m</td></tr>
          <tr><td style="color:#aaa;">Actual Depth:</td><td>${actualDepth}m</td></tr>
          <tr><td style="color:#aaa;">Construction Method:</td><td>Rotary Drill + Tremie Concrete</td></tr>
          <tr><td style="color:#aaa;">Temporary Casing:</td><td style="color:#27ae60;">Installed &amp; Withdrawn</td></tr>
          <tr><td style="color:#aaa;">Rebar Cage:</td><td style="color:#27ae60;">Placed</td></tr>
          <tr><td style="color:#aaa;">Pile Cap:</td><td style="color:#27ae60;">Completed</td></tr>
          <tr><td style="color:#aaa;">Status:</td><td style="color:#27ae60;font-weight:700;">PASS</td></tr>
        </table>
      </div>
      <div class="result-actions" style="margin-top:20px;">
        <button id="result-replay" onclick="location.reload()">Play Again</button>
        <button id="result-dashboard-btn" onclick="window.location.href='index.html'">Back to Dashboard</button>
      </div>
      <div id="result-refs">
        <strong>References:</strong><br/>
        1. <a href="https://www.fhwa.dot.gov/engineering/geotech/foundations/drilled_shafts/" target="_blank">FHWA - Drilled Shaft Foundations</a><br/>
        2. <a href="https://www.adsc-iafd.com/" target="_blank">ADSC - International Association of Foundation Drilling</a>
      </div>
    `;
  }
  DOM.resultOverlay().classList.remove('hidden');
}

function getGrade() {
  if (STATE.score >= 900)      return 'Master Shaft Driller!';
  else if (STATE.score >= 700) return 'Skilled Engineer';
  else if (STATE.score >= 500) return 'Apprentice Builder';
  else                          return 'Foundation Trainee - try again!';
}

/* ══════════════════════════════════════════════════════════════
   UTILITY
══════════════════════════════════════════════════════════════ */

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
  if (OBJ.persistentCap) {
    scene.remove(OBJ.persistentCap);
    delete OBJ.persistentCap;
  }
  if (OBJ.persistentColumn) {
    scene.remove(OBJ.persistentColumn);
    delete OBJ.persistentColumn;
  }
  if (OBJ.columnRebarMeshes) {
    OBJ.columnRebarMeshes.forEach(m => scene.remove(m));
    delete OBJ.columnRebarMeshes;
  }
  if (OBJ.columnStirrupGroup) {
    scene.remove(OBJ.columnStirrupGroup);
    delete OBJ.columnStirrupGroup;
  }
  STATE.score = 1000;
  STATE.penalties = 0;
  STATE.drivenDepth = 0;
  STATE.drilledDepth = 0;
  STATE.totalBlows = 0;
  STATE.excavationComplete = false;
  STATE.alignmentNS = 90 + (Math.random() - 0.5) * 3;
  STATE.alignmentEW = 90 + (Math.random() - 0.5) * 3;
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

  if (OBJ.hammerAnimating && OBJ.hammer) {
    // Handled in the step handler via intervals
  }

  if (OBJ.excavatorArm && STATE.stepState.digging) {
    OBJ.excavatorArm.rotation.z   = -0.62 + 0.38 * Math.sin(elapsed * 3.2);
    if (OBJ.excavatorStick)  OBJ.excavatorStick.rotation.z  = 0.48 + 0.22 * Math.sin(elapsed * 3.2 + 0.5);
    if (OBJ.excavatorBucket) OBJ.excavatorBucket.rotation.z = -0.42 - 0.3 * Math.sin(elapsed * 3.2 + 1.1);
    if (OBJ.excavatorUpper) OBJ.excavatorUpper.rotation.y = 0.18 * Math.sin(elapsed * 0.45);
  }

  if (OBJ.truckDrum) {
    OBJ.truckDrum.rotation.y += 0.018;
  }

  if (OBJ.inspector) {
    OBJ.inspector.position.y = 0 + 0.05 * Math.sin(elapsed * 1.5);
  }

  // Rotate drill bucket during drilling
  if (OBJ.drillingRig && STATE.stepState.drilling) {
    const bucket = OBJ.drillingRig.userData.drillBucket;
    if (bucket) bucket.rotation.y += 0.15;
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


/* ══════════════════════════════════════════════════════════════
   3D SCENE BUILDERS (copied from shallow foundation)
══════════════════════════════════════════════════════════════ */

function buildFlatGround() {
  while (groundGroup.children.length) groundGroup.remove(groundGroup.children[0]);
  const geo = new THREE.PlaneGeometry(30, 30);
  const mat = MAT.grass.clone();
  mat.polygonOffset = true; mat.polygonOffsetFactor = 1; mat.polygonOffsetUnits = 1;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.002;
  mesh.receiveShadow = true;
  groundGroup.add(mesh);
}

function buildGroundWithHole() {
  while (groundGroup.children.length) groundGroup.remove(groundGroup.children[0]);

  const grassMat = MAT.grass.clone();
  grassMat.polygonOffset = true; grassMat.polygonOffsetFactor = 2; grassMat.polygonOffsetUnits = 2;
  const dirtMat = MAT.dirt.clone();
  dirtMat.polygonOffset = true; dirtMat.polygonOffsetFactor = 1; dirtMat.polygonOffsetUnits = 1;

  const half = 4.0;
  const total = 15;
  const edge = total - half;

  const pieces = [
    { w: total * 2, d: edge,  x:    0,    z: -(half + edge / 2) },
    { w: total * 2, d: edge,  x:    0,    z:  (half + edge / 2) },
    { w: edge,      d: half * 2, x: -(half + edge / 2), z: 0    },
    { w: edge,      d: half * 2, x:  (half + edge / 2), z: 0    }
  ];
  pieces.forEach(p => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.d), grassMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, 0.002, p.z);
    m.receiveShadow = true;
    groundGroup.add(m);
  });

  const wallThick = 0.25;
  const wallDefs = [
    { w: half * 2,  h: 5, d: wallThick, x:  0,                   y: -2.5, z: -(half + wallThick / 2) },
    { w: half * 2,  h: 5, d: wallThick, x:  0,                   y: -2.5, z:  (half + wallThick / 2) },
    { w: wallThick, h: 5, d: half * 2,  x: -(half + wallThick/2), y: -2.5, z:  0                     },
    { w: wallThick, h: 5, d: half * 2,  x:  (half + wallThick/2), y: -2.5, z:  0                     }
  ];
  wallDefs.forEach(w => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), dirtMat);
    m.position.set(w.x, w.y, w.z);
    m.receiveShadow = true; m.castShadow = true;
    groundGroup.add(m);
  });

  const pitY = STATE.excavationComplete ? -5.0 : -0.1;
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(half * 2 - 0.1, 0.15, half * 2 - 0.1), dirtMat);
  floorMesh.position.set(0, pitY, 0);
  floorMesh.receiveShadow = true;
  groundGroup.add(floorMesh);
  OBJ.pitFloor = floorMesh;
}

function buildPitStructure() {}

function buildSoilPile(progress) {
  if (OBJ.soilPile) {
    scene.remove(OBJ.soilPile);
    const si = stepObjects.indexOf(OBJ.soilPile);
    if (si > -1) stepObjects.splice(si, 1);
    OBJ.soilPile = null;
  }
  if (progress <= 0.05) return;
  const sg = new THREE.Group();
  const p = Math.min(progress, 1);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(1.6 * p + 0.25, 9, 6), MAT.dirt.clone());
  mound.scale.y = 0.45; mound.castShadow = true; sg.add(mound);
  const mound2 = new THREE.Mesh(new THREE.SphereGeometry((0.9 * p + 0.15), 7, 5), MAT.dirt.clone());
  mound2.scale.y = 0.4; mound2.position.set(1.2 * p, 0, 0.4 * p); mound2.castShadow = true; sg.add(mound2);
  for (let i = 0; i < 4; i++) {
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + Math.random() * 0.09, 0), new THREE.MeshLambertMaterial({ color: 0x78909c }));
    const angle = (i / 4) * Math.PI * 2;
    const r = 0.5 * p;
    rock.position.set(Math.cos(angle) * r, 0.3 * p, Math.sin(angle) * r);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    sg.add(rock);
  }
  sg.position.set(-4.2, 0, 0.5);
  addStep(sg);
  OBJ.soilPile = sg;
}

function buildDepthRuler() {
  const rg = new THREE.Group();
  rg.position.set(3.4, 0, -2.8);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.5, 6), MAT.rulerWhite);
  pole.position.y = -2.75; rg.add(pole);
  for (let d = 0; d <= 5; d += 0.5) {
    const isMajor = d % 1 === 0;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(isMajor ? 0.36 : 0.22, 0.05, 0.05), d === 5 ? MAT.rulerRed : MAT.rulerWhite);
    tick.position.y = -d; rg.add(tick);
  }
  addStep(rg);
  OBJ.depthRuler = rg;
  return rg;
}

function buildPourStream() {
  const streamMat = new THREE.MeshLambertMaterial({ color: 0xbdbdbd, transparent: true, opacity: 0.75 });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 2.8, 6), streamMat);
  stream.position.set(-4.0, -0.3, -2.2);
  stream.rotation.z = 0.28;
  stream.visible = false;
  addStep(stream);
  OBJ.pourStream = stream;
  return stream;
}

function buildCompactor3D(x, z) {
  const cg = new THREE.Group();
  const RED = new THREE.MeshLambertMaterial({ color: 0xc62828 });
  const GRY = MAT.darkGray;
  const eng = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.58, 0.65), RED);
  eng.position.y = 0.55; eng.castShadow = true; cg.add(eng);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), GRY);
  hood.position.y = 0.88; cg.add(hood);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 1.1), GRY);
  plate.position.y = 0.06; plate.castShadow = true; cg.add(plate);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), GRY);
  bar.rotation.x = -Math.PI / 4; bar.position.set(0, 0.9, -0.6); cg.add(bar);
  const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), GRY);
  crossBar.rotation.z = Math.PI / 2; crossBar.position.set(0, 1.62, -1.0); cg.add(crossBar);
  cg.position.set(x, 0, z);
  addStep(cg);
  OBJ.compactor = cg;
  return cg;
}

function buildFormwork3D() {
  const panels = [
    { w: 5,    h: 5, d: 0.14, x:  0,     y: -2.5, z: -2.43 },
    { w: 5,    h: 5, d: 0.14, x:  0,     y: -2.5, z:  2.43 },
    { w: 0.14, h: 5, d: 4.72, x: -2.43,  y: -2.5, z:  0    },
    { w: 0.14, h: 5, d: 4.72, x:  2.43,  y: -2.5, z:  0    }
  ];
  panels.forEach(p => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), MAT.wood);
    m.position.set(p.x, p.y, p.z);
    m.castShadow = true; m.receiveShadow = true;
    addStep(m);
  });
}

function buildRebar3D() {
  createFootingRebarGrid();
}

function createColumnRebarCage(baseY, height) {
  const corners = [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]];
  corners.forEach(([x, z]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, height, 6), MAT.steel);
    m.position.set(x, baseY + height / 2, z);
    m.castShadow = true;
    addStep(m);
  });
  const stirrupMat = MAT.steel;
  const stirrupY = [];
  for (let y = baseY + 0.3; y < baseY + height - 0.1; y += 0.8) stirrupY.push(y);
  stirrupY.forEach(y => {
    [
      { len: 1.1, axis: 'x', x: 0,    z: -0.55 },
      { len: 1.1, axis: 'x', x: 0,    z:  0.55 },
      { len: 1.1, axis: 'z', x: -0.55, z: 0 },
      { len: 1.1, axis: 'z', x:  0.55, z: 0 }
    ].forEach(s => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, s.len, 5), stirrupMat);
      if (s.axis === 'x') m.rotation.z = Math.PI / 2;
      else                 m.rotation.x = Math.PI / 2;
      m.position.set(s.x, y, s.z);
      addStep(m);
    });
  });
}

function createFootingRebarGrid() {
  const barPositions = [-2.0, -1.6, -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6, 2.0];
  const barLen = 4.5;
  const yLow  = -4.90;
  const yHigh = -4.83;
  const chairXZ = [-1.5, 0, 1.5];
  const chairMat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });
  chairXZ.forEach(cx => {
    chairXZ.forEach(cz => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.10, 0.13), chairMat);
      c.position.set(cx, -4.95, cz);
      addStep(c);
    });
  });
  barPositions.forEach(z => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, barLen, 8), MAT.steel);
    m.rotation.z = Math.PI / 2;
    m.position.set(0, yLow, z);
    m.castShadow = true;
    addStep(m);
  });
  barPositions.forEach(x => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, barLen, 8), MAT.steel);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, yHigh, 0);
    m.castShadow = true;
    addStep(m);
  });
}

function buildConcreteSlab3D(yPos, alpha) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 4.8), MAT.concreteCured);
  m.position.set(0, yPos !== undefined ? yPos : -4.85, 0);
  m.castShadow = true; m.receiveShadow = true;
  if (alpha !== undefined) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = alpha; }
  addStep(m);
  return m;
}

function buildExcavator3D() {
  const g = new THREE.Group();
  const JDyellow  = new THREE.MeshStandardMaterial({ color: 0xf0d000, roughness: 0.55, metalness: 0.10 });
  const JDyellowD = new THREE.MeshStandardMaterial({ color: 0xc8ac00, roughness: 0.60, metalness: 0.12 });
  const JDblack   = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.55, metalness: 0.40 });
  const JDdkGray  = new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.50, metalness: 0.55 });
  const chrome    = new THREE.MeshStandardMaterial({ color: 0xb8c4c8, roughness: 0.18, metalness: 0.90 });
  const rubber    = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.94, metalness: 0.00 });
  const steelMid  = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.52, metalness: 0.62 });

  const xBeam = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.38, 3.80), JDblack);
  xBeam.position.y = 0.54; xBeam.castShadow = true; g.add(xBeam);

  g.position.set(-5.5, 0, -3.0);
  g.rotation.y = 0.35;
  addStep(g);
  return g;
}

function buildConcreteTruck3D() {
  const g = new THREE.Group();
  const cabPaint  = new THREE.MeshStandardMaterial({ color: 0xe65100, roughness: 0.68, metalness: 0.06 });
  const drumPaint = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.60, metalness: 0.18 });
  const chassisM  = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.55, metalness: 0.50 });
  const chrome    = new THREE.MeshStandardMaterial({ color: 0xbdbdbd, roughness: 0.16, metalness: 0.90 });
  const rubber    = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.92, metalness: 0.00 });
  const glass2    = new THREE.MeshStandardMaterial({ color: 0x90caf9, roughness: 0.05, metalness: 0.10, transparent: true, opacity: 0.58 });
  const bladeMat  = new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.55, metalness: 0.30 });

  [-0.74, 0.74].forEach(z => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.24, 0.24), chassisM);
    rail.position.set(0.1, 0.68, z); rail.castShadow = true; g.add(rail);
  });
  [-2.2, -0.5, 0.9, 2.4].forEach(x => {
    const cm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 1.48), chassisM);
    cm.position.set(x, 0.68, 0); g.add(cm);
  });
  const belly = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.12, 1.52), chassisM);
  belly.position.set(0.1, 0.60, 0); g.add(belly);

  const makeAxleWheel = (x, z, isDual) => {
    const wg = new THREE.Group();
    wg.position.set(x, 0.5, z);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.32, 16), rubber);
    tire.rotation.x = Math.PI / 2; tire.castShadow = true; wg.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.34, 12), chrome);
    rim.rotation.x = Math.PI / 2; wg.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.36, 8), chrome);
    hub.rotation.x = Math.PI / 2; wg.add(hub);
    if (isDual) {
      const zOff = z < 0 ? -0.33 : 0.33;
      const t2 = tire.clone(); t2.position.z = zOff; wg.add(t2);
      const r2 = rim.clone();  r2.position.z = zOff; wg.add(r2);
    }
    return wg;
  };
  const stAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.1, 8), chassisM);
  stAxle.rotation.x = Math.PI / 2; stAxle.position.set(-2.4, 0.52, 0); g.add(stAxle);
  g.add(makeAxleWheel(-2.4, -1.08, false));
  g.add(makeAxleWheel(-2.4,  1.08, false));
  [0.9, 1.85].forEach(x => {
    const dAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.4, 8), chassisM);
    dAxle.rotation.x = Math.PI / 2; dAxle.position.set(x, 0.52, 0); g.add(dAxle);
    g.add(makeAxleWheel(x, -1.22, true));
    g.add(makeAxleWheel(x,  1.22, true));
  });

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.75, 2.0), cabPaint);
  hood.position.set(-3.15, 1.28, 0); hood.castShadow = true; g.add(hood);

  const cabBox = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.58, 2.0), cabPaint);
  cabBox.position.set(-2.05, 1.79, 0); cabBox.castShadow = true; g.add(cabBox);

  const DRUM = new THREE.Group();
  DRUM.position.set(0.85, 2.0, 0);
  DRUM.rotation.z = -0.20;
  g.add(DRUM);
  const drumBody = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.60, 3.6, 20), drumPaint);
  drumBody.castShadow = true; DRUM.add(drumBody);
  const fCone = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.92, 0.65, 18), drumPaint);
  fCone.position.y = 2.12; DRUM.add(fCone);
  OBJ.truckDrum = DRUM;

  const CHUTE = new THREE.Group();
  CHUTE.position.set(2.85, 1.2, 0);
  g.add(CHUTE);
  const uChute = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 2.1), chassisM);
  uChute.rotation.x = 0.52; uChute.position.set(0, 0.12, 0.7); CHUTE.add(uChute);
  OBJ.truckChuteGroup = CHUTE;

  g.position.set(-6.2, 0, -4.8);
  g.rotation.y = 0.42;
  addStep(g);
  return g;
}

function buildInspector3D(x, z) {
  const g = new THREE.Group();
  const vestMat = new THREE.MeshLambertMaterial({ color: 0xf5a623 });
  const vestSt  = new THREE.MeshLambertMaterial({ color: 0xe65100 });
  const helmMat = new THREE.MeshLambertMaterial({ color: 0xffeb3b });
  const pantMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  const bootMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const clipMat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });

  [-0.15, 0.15].forEach(xOff => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 0.22), pantMat);
    leg.position.set(xOff, 0.29, 0); leg.castShadow = true; g.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.3), bootMat);
    boot.position.set(xOff, 0.06, 0.05); g.add(boot);
  });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.38), vestMat);
  torso.position.y = 0.94; torso.castShadow = true; g.add(torso);
  const stripeM = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), vestSt);
  stripeM.position.set(0, 0.88, 0.2); g.add(stripeM);
  [-0.4, 0.4].forEach((xOff) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), vestMat);
    arm.position.set(xOff, 0.84, 0); arm.castShadow = true; g.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), MAT.skin);
    hand.position.set(xOff, 0.56, 0); g.add(hand);
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.24), clipMat);
  board.position.set(0.42, 0.72, 0.12); board.rotation.x = 0.3; g.add(board);
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.2), new THREE.MeshLambertMaterial({ color: 0xfafafa }));
  paper.position.set(0.44, 0.72, 0.12); paper.rotation.x = 0.3; g.add(paper);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.18, 6), MAT.skin);
  neck.position.y = 1.35; g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), MAT.skin);
  head.position.y = 1.62; head.castShadow = true; g.add(head);
  const hatDome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), helmMat);
  hatDome.position.y = 1.78; g.add(hatDome);
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.06, 10), helmMat);
  hatBrim.position.y = 1.76; g.add(hatBrim);

  g.position.set(x, 0, z);
  g.rotation.y = -Math.PI * 0.25;
  addStep(g);
  OBJ.inspector = g;
  return g;
}

/* ── Shaft position constants ────────────────────────────── */
const SHAFT_POSITIONS = [
  { x: -2.5, z: -2.5, label: 'S1' },
  { x:  2.5, z: -2.5, label: 'S2' },
  { x: -2.5, z:  2.5, label: 'S3' },
  { x:  2.5, z:  2.5, label: 'S4' }
];
const SHAFT_DEPTH = 17;

/* ── Helper: build a rebar cage mesh group ──────────────── */
function buildRebarCage3D() {
  const cage = new THREE.Group();
  // 6 vertical bars arranged in circle r=0.2
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 15, 6), MAT.rebarSteel);
    bar.position.set(Math.cos(ang) * 0.2, 0, Math.sin(ang) * 0.2);
    cage.add(bar);
  }
  // 8 horizontal rings at 2m intervals
  for (let r = 0; r < 8; r++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 6, 16), MAT.rebarSteel);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -7 + r * 2;
    cage.add(ring);
  }
  return cage;
}


const STEP_HANDLERS = [

  /* ─────────────────── 0: Site Investigation ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.tested = 0;
      ss.total = 5;
      ss.reportSubmitted = false;

      const markerPositions = [
        new THREE.Vector3(-4, 0.01, -4),
        new THREE.Vector3(4,  0.01, -4),
        new THREE.Vector3(0,  0.01,  0),
        new THREE.Vector3(-4, 0.01,  4),
        new THREE.Vector3(4,  0.01,  4)
      ];

      const soilData = [
        { depth: '0-2m', soil: 'Topsoil', spt: 'N=4', note: 'Loose, organic' },
        { depth: '2-6m', soil: 'Soft Clay', spt: 'N=3', note: 'Very soft, high moisture' },
        { depth: '6-11m', soil: 'Loose Sand', spt: 'N=12', note: 'Medium density' },
        { depth: '11-16m', soil: 'Dense Sand', spt: 'N=35', note: 'Dense, good bearing' },
        { depth: '16m+', soil: 'Rock/Gravel', spt: 'N>50', note: 'Refusal - bearing layer' }
      ];

      const poleGeo   = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
      const sphereGeo = new THREE.SphereGeometry(0.22, 8, 8);

      markerPositions.forEach((pos, i) => {
        const g = new THREE.Group();

        const pole = new THREE.Mesh(poleGeo, MAT.darkGray);
        pole.position.y = 0.4;
        pole.castShadow = true;
        g.add(pole);

        const sphere = new THREE.Mesh(sphereGeo, MAT.markerOrange.clone());
        sphere.position.y = 0.9;
        sphere.castShadow = true;
        g.add(sphere);

        g.position.copy(pos);
        addStep(g);

        create3DLabel(g, `BH-${i + 1}`, '');

        clickables3D.push({
          mesh: g,
          pulse: true,
          phase: i * 1.2,
          onHit() {
            if (g.userData.tested) return;
            g.userData.tested = true;
            sphere.material = MAT.markerGreen.clone();
            this.pulse = false;
            g.scale.setScalar(1);
            ss.tested++;
            markSubtask(i);

            const html = `<strong>BH-${i + 1} Soil Profile</strong><br>` +
              soilData.map(d => `${d.depth}: ${d.soil}<br>&nbsp;&nbsp;SPT ${d.spt} - ${d.note}`).join('<br>');
            show3DPopup(g, html, 3000);

            if (ss.tested >= ss.total) {
              showFeedback('info', 'All borings complete! Submit the soil report.');
              const ab = DOM.actionBar();
              ab.innerHTML = '';
              const submitBtn = makeBtn('Submit Soil Report', 'btn-primary', () => {
                markSubtask(5);
                showFeedback('correct', 'Soil Profile: 2m Topsoil, 4m Soft Clay, 5m Loose Sand, 5m Dense Sand, Rock. DRILLED SHAFT FOUNDATION REQUIRED.');
                safeTimeout(() => {
                  ab.innerHTML = '<div class="step-instruction" style="color:#27ae60;">Recommendation: DRILLED SHAFT FOUNDATION REQUIRED. Shallow foundations not suitable — bearing layer at 16m depth.</div>';
                  safeTimeout(() => completeStep(), 2000);
                }, 1500);
              });
              ab.appendChild(submitBtn);
            }
          }
        });
      });

      const rigGroup = new THREE.Group();
      const rigBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.8), MAT.yellow);
      rigBase.position.y = 0.15; rigGroup.add(rigBase);
      const rigMast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6), MAT.darkGray);
      rigMast.position.set(0, 1.4, 0); rigGroup.add(rigMast);
      rigGroup.position.set(7, 0, 0);
      addStep(rigGroup);

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click each pulsing boring marker (BH-1 to BH-5) to conduct soil tests</div>';
    },
    cleanup() {}
  },

  /* ─────────────────── 1: Shaft Layout ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.placed = 0;
      ss.total = 4;

      const shaftPositions = [
        new THREE.Vector3(-2.5, 0.01, -2.5),
        new THREE.Vector3(2.5,  0.01, -2.5),
        new THREE.Vector3(-2.5, 0.01,  2.5),
        new THREE.Vector3(2.5,  0.01,  2.5)
      ];

      const labels = ['S1', 'S2', 'S3', 'S4'];

      const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(6.5, 0.05, 6.5));
      const outlineMat = new THREE.LineBasicMaterial({ color: 0xf5a623 });
      const outlineMesh = new THREE.LineSegments(outlineGeo, outlineMat);
      outlineMesh.position.y = 0.03;
      addStep(outlineMesh);

      shaftPositions.forEach((pos, i) => {
        const ringGeo = new THREE.RingGeometry(0.3, 0.5, 16);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.5,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(pos);
        ring.position.y = 0.03;
        addStep(ring);

        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.08, 12),
          new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6, side: THREE.DoubleSide })
        );
        dot.rotation.x = -Math.PI / 2;
        dot.position.copy(pos);
        dot.position.y = 0.04;
        addStep(dot);

        create3DLabel(ring, labels[i], '');

        clickables3D.push({
          mesh: ring,
          pulse: true,
          phase: i * 1.5,
          onHit() {
            if (ring.userData.placed) return;
            ring.userData.placed = true;
            this.pulse = false;
            ring.scale.setScalar(1);

            ring.material = MAT.markerGreen.clone();
            ring.material.emissive.setHex(0x00aa22);

            const spike = new THREE.Mesh(
              new THREE.CylinderGeometry(0.03, 0.02, 0.8, 6),
              MAT.rebarSteel
            );
            spike.position.copy(pos);
            spike.position.y = 0.8;
            addStep(spike);

            let spikeY = 0.8;
            const spikeInterval = safeInterval(() => {
              spikeY -= 0.05;
              spike.position.y = spikeY;
              if (spikeY <= 0.2) {
                clearInterval(spikeInterval);
                spawnParticles(new THREE.Vector3(pos.x, 0.05, pos.z), MAT.topsoil, 6);
              }
            }, 30);

            ss.placed++;
            markSubtask(i);
            showFeedback('correct', `Shaft marker ${labels[i]} placed!`);

            if (ss.placed >= ss.total) {
              showFeedback('correct', 'All shaft markers placed! Layout complete.');
              safeTimeout(() => completeStep(), 1200);
            }
          }
        });
      });

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click each pulsing target ring to place a survey marker at shaft positions S1-S4</div>';
    },
    cleanup() {}
  },

  /* ─────────────────── 2: Mobilise Drilling Rig ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.done = 0;
      ss.total = 4;

      const rig = buildDrillingRig3D(0, 0);
      addStep(rig);
      OBJ.drillingRig = rig;

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Complete rig setup by clicking each task below</div>';

      const tasks = [
        { label: 'Drive rig to shaft S1', icon: '\ud83d\ude9c' },
        { label: 'Extend Kelly bar', icon: '\u2195\ufe0f' },
        { label: 'Attach drill bucket', icon: '\ud83e\udea3' },
        { label: 'Confirm rig level', icon: '\ud83d\udccf' }
      ];

      tasks.forEach((t, i) => {
        const item = el('div', 'panel-item');
        item.innerHTML = `<div class="item-icon">${t.icon}</div><div class="item-label">${t.label}</div>`;
        item.addEventListener('click', () => {
          if (item.classList.contains('placed')) return;
          item.classList.add('placed');
          item.innerHTML += '<div style="color:var(--green-ok);font-size:.85rem;margin-top:2px;">\u2713 Done</div>';
          ss.done++;
          markSubtask(i);
          showFeedback('correct', `${t.label} complete!`);

          if (ss.done >= ss.total) {
            showFeedback('correct', 'Rig mobilised! Ready to drill.');
            safeTimeout(() => {
              DOM.actionBar().innerHTML = '';
              DOM.actionBar().appendChild(makeBtn('Begin Drilling', 'btn btn-green', () => completeStep()));
            }, 800);
          }
        });
        ab.appendChild(item);
      });
    },
    cleanup() {}
  },

  /* ─────────────────── 3: Drill Borehole ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.currentShaft = 0;
      ss.drilling = false;

      const rig = buildDrillingRig3D(0, 0);
      addStep(rig);
      OBJ.drillingRig = rig;

      // Store borehole meshes for later steps
      ss.boreholeMeshes = [];

      function drillShaft(idx) {
        if (idx >= 4) {
          STATE.drilledDepth = SHAFT_DEPTH;
          showFeedback('correct', 'All 4 boreholes drilled to 17m! Drilling complete.');
          safeTimeout(() => completeStep(), 1200);
          return;
        }

        const sp = SHAFT_POSITIONS[idx];
        ss.currentShaft = idx;
        ss.depthPct = 0;
        ss.drilling = false;

        // Move rig over shaft position
        OBJ.drillingRig.position.set(sp.x, 0, sp.z);

        const ab = DOM.actionBar();
        ab.innerHTML = '';

        const statsDiv = el('div', 'blow-display', '');
        statsDiv.innerHTML = `
          <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center;">
            <div style="text-align:center;">
              <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Current Shaft</div>
              <div style="color:#f5a623;font-size:1.2rem;font-weight:700;">${sp.label}</div>
            </div>
            <div style="text-align:center;">
              <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Depth</div>
              <div id="drill-depth" style="color:#fff;font-size:1.2rem;font-weight:700;">0.0m</div>
            </div>
            <div style="text-align:center;">
              <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Progress</div>
              <div id="drill-pct" style="color:#27ae60;font-size:1.2rem;font-weight:700;">0%</div>
            </div>
          </div>
        `;
        ab.appendChild(statsDiv);

        const drillBtn = makeBtn('DRILL', 'btn-primary', () => {});
        drillBtn.style.cssText += 'font-size:1.1rem;padding:12px 40px;background:#c49900;color:#fff;';

        let drillInterval = null;

        function doDrill() {
          if (ss.depthPct >= 100) return;
          ss.depthPct = Math.min(100, ss.depthPct + 2);
          const currentDepth = (SHAFT_DEPTH * ss.depthPct / 100).toFixed(1);
          const depthEl = $('drill-depth');
          const pctEl = $('drill-pct');
          if (depthEl) depthEl.textContent = currentDepth + 'm';
          if (pctEl) pctEl.textContent = Math.round(ss.depthPct) + '%';

          // Animate kelly bar descending
          if (OBJ.drillingRig) {
            const kelly = OBJ.drillingRig.userData.kellyBar;
            const bucket = OBJ.drillingRig.userData.drillBucket;
            const head = OBJ.drillingRig.userData.rotaryHead;
            if (kelly) kelly.position.y = 11 - (ss.depthPct / 100) * 10;
            if (bucket) {
              bucket.position.y = 4.6 - (ss.depthPct / 100) * 10;
              bucket.rotation.y += 0.3;
            }
            if (head) head.position.y = 17.5 - (ss.depthPct / 100) * 5;
          }

          // Spawn spoil particles
          if (Math.random() < 0.3) {
            spawnParticles(new THREE.Vector3(sp.x + 1, 0.3, sp.z), MAT.topsoil, 2);
          }

          if (ss.depthPct >= 100) {
            ss.drilling = false;
            if (drillInterval) { clearInterval(drillInterval); drillInterval = null; }

            // Show completed borehole
            const borehole = new THREE.Mesh(
              new THREE.CylinderGeometry(0.28, 0.28, SHAFT_DEPTH, 12),
              MAT.boreholeDark
            );
            borehole.position.set(sp.x, -SHAFT_DEPTH / 2, sp.z);
            addStep(borehole);
            ss.boreholeMeshes.push(borehole);

            // Reset rig visuals
            if (OBJ.drillingRig) {
              const kelly = OBJ.drillingRig.userData.kellyBar;
              const bucket = OBJ.drillingRig.userData.drillBucket;
              const head = OBJ.drillingRig.userData.rotaryHead;
              if (kelly) kelly.position.y = 11;
              if (bucket) bucket.position.y = 4.6;
              if (head) head.position.y = 17.5;
            }

            markSubtask(idx);
            showFeedback('correct', `${sp.label} drilled to ${SHAFT_DEPTH}m!`);

            // Build spoil pile
            buildSoilPile((idx + 1) / 4);

            safeTimeout(() => drillShaft(idx + 1), 800);
          }
        }

        drillBtn.addEventListener('mousedown', () => {
          if (ss.depthPct >= 100) return;
          ss.drilling = true;
          STATE.stepState.drilling = true;
          drillInterval = safeInterval(doDrill, 60);
          doDrill();
        });

        drillBtn.addEventListener('mouseup', () => {
          ss.drilling = false;
          STATE.stepState.drilling = false;
          if (drillInterval) { clearInterval(drillInterval); drillInterval = null; }
        });

        drillBtn.addEventListener('mouseleave', () => {
          ss.drilling = false;
          STATE.stepState.drilling = false;
          if (drillInterval) { clearInterval(drillInterval); drillInterval = null; }
        });

        ab.appendChild(drillBtn);
      }

      drillShaft(0);
    },
    cleanup() {
      STATE.stepState.drilling = false;
    }
  },

  /* ─────────────────── 4: Install Temporary Casing ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.installed = 0;

      // Move rig to side
      const rig = buildDrillingRig3D(6, 0);
      addStep(rig);
      OBJ.drillingRig = rig;

      // Show boreholes
      SHAFT_POSITIONS.forEach(sp => {
        const borehole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, SHAFT_DEPTH, 12),
          MAT.boreholeDark
        );
        borehole.position.set(sp.x, -SHAFT_DEPTH / 2, sp.z);
        addStep(borehole);
      });

      ss.casingMeshes = [];

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click each shaft to lower a steel casing into the borehole</div>';

      SHAFT_POSITIONS.forEach((sp, i) => {
        const item = el('div', 'panel-item');
        item.innerHTML = `<div class="item-icon">\u2b07\ufe0f</div><div class="item-label">Lower casing into ${sp.label}</div>`;
        item.addEventListener('click', () => {
          if (item.classList.contains('placed')) return;
          item.classList.add('placed');
          item.innerHTML += '<div style="color:var(--green-ok);font-size:.85rem;margin-top:2px;">\u2713 Installed</div>';

          // Create casing mesh
          const casing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.30, 0.30, SHAFT_DEPTH, 16, 1, true),
            MAT.casingSteel
          );
          casing.position.set(sp.x, 5, sp.z);
          addStep(casing);
          ss.casingMeshes.push(casing);

          // Animate casing descending
          let cy = 5;
          const targetY = -SHAFT_DEPTH / 2;
          const iv = safeInterval(() => {
            cy -= 0.4;
            casing.position.y = cy;
            if (cy <= targetY) {
              clearInterval(iv);
              casing.position.y = targetY;
            }
          }, 30);

          ss.installed++;
          markSubtask(i);
          showFeedback('correct', `Casing installed in ${sp.label}!`);

          if (ss.installed >= 4) {
            showFeedback('correct', 'All casings installed!');
            safeTimeout(() => completeStep(), 1200);
          }
        });
        ab.appendChild(item);
      });
    },
    cleanup() {}
  },

  /* ─────────────────── 5: Lower Reinforcement Cage ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.lowered = 0;

      // Show boreholes with casings
      SHAFT_POSITIONS.forEach(sp => {
        const borehole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, SHAFT_DEPTH, 12),
          MAT.boreholeDark
        );
        borehole.position.set(sp.x, -SHAFT_DEPTH / 2, sp.z);
        addStep(borehole);

        const casing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.30, 0.30, SHAFT_DEPTH, 16, 1, true),
          MAT.casingSteel
        );
        casing.position.set(sp.x, -SHAFT_DEPTH / 2, sp.z);
        addStep(casing);
      });

      ss.cageMeshes = [];

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click each shaft to lower a rebar cage into the casing</div>';

      SHAFT_POSITIONS.forEach((sp, i) => {
        const item = el('div', 'panel-item');
        item.innerHTML = `<div class="item-icon">\u2699\ufe0f</div><div class="item-label">Lower cage into ${sp.label}</div>`;
        item.addEventListener('click', () => {
          if (item.classList.contains('placed')) return;
          item.classList.add('placed');
          item.innerHTML += '<div style="color:var(--green-ok);font-size:.85rem;margin-top:2px;">\u2713 Lowered</div>';

          // Create rebar cage
          const cage = buildRebarCage3D();
          cage.position.set(sp.x, 5, sp.z);
          addStep(cage);
          ss.cageMeshes.push(cage);

          // Animate cage descending
          let cy = 5;
          const targetY = -8;
          const iv = safeInterval(() => {
            cy -= 0.3;
            cage.position.y = cy;
            if (cy <= targetY) {
              clearInterval(iv);
              cage.position.y = targetY;
            }
          }, 30);

          ss.lowered++;
          markSubtask(i);
          showFeedback('correct', `Rebar cage lowered into ${sp.label}!`);

          if (ss.lowered >= 4) {
            showFeedback('correct', 'All rebar cages placed!');
            safeTimeout(() => completeStep(), 1200);
          }
        });
        ab.appendChild(item);
      });
    },
    cleanup() {}
  },

  /* ─────────────────── 6: Pour Concrete — Tremie Method ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.poured = 0;

      // Show boreholes with casings and rebar cages
      SHAFT_POSITIONS.forEach(sp => {
        const borehole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, SHAFT_DEPTH, 12),
          MAT.boreholeDark
        );
        borehole.position.set(sp.x, -SHAFT_DEPTH / 2, sp.z);
        addStep(borehole);

        const casing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.30, 0.30, SHAFT_DEPTH, 16, 1, true),
          MAT.casingSteel
        );
        casing.position.set(sp.x, -SHAFT_DEPTH / 2, sp.z);
        addStep(casing);
        // Store casing for withdrawal animation
        sp._casing = casing;

        const cage = buildRebarCage3D();
        cage.position.set(sp.x, -8, sp.z);
        addStep(cage);
      });

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click each shaft to pour concrete via tremie and withdraw casing</div>';

      SHAFT_POSITIONS.forEach((sp, i) => {
        const item = el('div', 'panel-item');
        item.innerHTML = `<div class="item-icon">\ud83d\udee2</div><div class="item-label">Tremie pour ${sp.label}</div>`;
        item.addEventListener('click', () => {
          if (item.classList.contains('placed')) return;
          item.classList.add('placed');
          item.innerHTML += '<div style="color:var(--green-ok);font-size:.85rem;margin-top:2px;">\u2713 Poured</div>';

          // Tremie pipe
          const tremie = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, SHAFT_DEPTH + 2, 8),
            MAT.darkGray
          );
          tremie.position.set(sp.x, -SHAFT_DEPTH / 2 + 1, sp.z);
          addStep(tremie);

          // Concrete fill growing from bottom
          const concFill = new THREE.Mesh(
            new THREE.CylinderGeometry(0.26, 0.26, 0.01, 12),
            MAT.concreteDark
          );
          concFill.position.set(sp.x, -SHAFT_DEPTH, sp.z);
          addStep(concFill);

          let fillH = 0.01;
          const maxH = SHAFT_DEPTH;
          const casing = sp._casing;
          let casingRiseY = -SHAFT_DEPTH / 2;

          const iv = safeInterval(() => {
            fillH = Math.min(maxH, fillH + 0.5);
            concFill.scale.y = fillH / 0.01;
            concFill.position.y = -SHAFT_DEPTH + fillH / 2;

            // Withdraw casing as concrete rises
            if (casing) {
              casingRiseY += 0.25;
              casing.position.y = casingRiseY;
              if (casing.material.opacity > 0.1) {
                casing.material = casing.material.clone();
                casing.material.opacity = Math.max(0.1, 0.85 - (fillH / maxH) * 0.75);
              }
            }

            if (fillH >= maxH) {
              clearInterval(iv);
              // Remove tremie
              scene.remove(tremie);
              const ti = stepObjects.indexOf(tremie);
              if (ti > -1) stepObjects.splice(ti, 1);
              // Hide casing (fully withdrawn)
              if (casing) casing.visible = false;

              ss.poured++;
              markSubtask(i);
              showFeedback('correct', `${sp.label} concrete poured, casing withdrawn!`);

              if (ss.poured >= 4) {
                STATE.drilledDepth = SHAFT_DEPTH;
                showFeedback('correct', 'All shafts complete! Concrete placed in all 4 drilled shafts.');
                safeTimeout(() => completeStep(), 1200);
              }
            }
          }, 40);
        });
        ab.appendChild(item);
      });
    },
    cleanup() {
      // Clean up temporary _casing references
      SHAFT_POSITIONS.forEach(sp => { delete sp._casing; });
    }
  },

  /* ─────────────────── 7: Formwork ─── */
  {
    enter() {
      buildShaftsForStep();
      const ss = STATE.stepState;
      ss.placed = { north: false, south: false, east: false, west: false };
      ss.count  = 0;

      const panels3D = {
        north: { w: 5,    h: 5, d: 0.14, x:  0,    y: -2.5, z: -2.43, startY: 4 },
        south: { w: 5,    h: 5, d: 0.14, x:  0,    y: -2.5, z:  2.43, startY: 4 },
        west:  { w: 0.14, h: 5, d: 4.72, x: -2.43, y: -2.5, z:  0,    startY: 4 },
        east:  { w: 0.14, h: 5, d: 4.72, x:  2.43, y: -2.5, z:  0,    startY: 4 }
      };

      const panelMeshes = {};
      Object.entries(panels3D).forEach(([key, p]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, p.d), MAT.wood);
        m.position.set(p.x, p.startY, p.z);
        m.castShadow = true; m.receiveShadow = true;
        addStep(m);
        panelMeshes[key] = m;
      });

      const panelDefs = [
        { key: 'north', icon: '\ud83e\udeb5', label: 'North Wall' },
        { key: 'south', icon: '\ud83e\udeb5', label: 'South Wall' },
        { key: 'east',  icon: '\ud83e\udeb5', label: 'East Wall'  },
        { key: 'west',  icon: '\ud83e\udeb5', label: 'West Wall'  }
      ];

      const actionBar = DOM.actionBar();
      actionBar.innerHTML = '<span style="color:#e0c87a;font-size:.78rem;width:100%;text-align:center;display:block;margin-bottom:4px;">Click a panel to install it in the pit</span>';

      panelDefs.forEach((p, idx) => {
        const item = el('div', 'panel-item');
        item.innerHTML = `<div class="item-icon">${p.icon}</div><div class="item-label">${p.label}</div>`;

        item.addEventListener('click', () => {
          if (ss.placed[p.key]) return;
          ss.placed[p.key] = true;
          ss.count++;
          item.classList.add('placed');
          item.innerHTML += '<div style="color:var(--green-ok);font-size:.85rem;margin-top:2px;">\u2713 Placed</div>';

          const mesh = panelMeshes[p.key];
          const target = panels3D[p.key];
          let t = 0;
          const startY = mesh.position.y;
          const iv = setInterval(() => {
            t = Math.min(1, t + 0.05);
            mesh.position.y = startY + (target.y - startY) * t;
            if (t >= 1) clearInterval(iv);
          }, 16);

          markSubtask(idx);
          showFeedback('correct', `${p.label} panel installed!`);

          if (ss.count === 4) {
            showFeedback('correct', 'All formwork installed!');
            safeTimeout(completeStep, 800);
          }
        });

        actionBar.appendChild(item);
      });
    },
    cleanup() {}
  },

  /* ─────────────────── 8: Reinforcement ─── */
  {
    enter() {
      buildShaftsForStep();
      const ss = STATE.stepState;
      ss.lowerDone = false;
      ss.upperDone = false;

      buildFormwork3D();

      const matPositions = [-2.0, -1.6, -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6, 2.0];
      const barLen = 4.5;

      const chairXZ = [-1.5, 0, 1.5];
      const chairMat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });
      const chairs = [];
      chairXZ.forEach(cx => {
        chairXZ.forEach(cz => {
          const c = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.10, 0.13), chairMat);
          c.position.set(cx, 6, cz);
          addStep(c);
          chairs.push(c);
        });
      });

      const lowerBars = matPositions.map((z, i) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, barLen, 8), MAT.steel);
        m.rotation.z = Math.PI / 2;
        m.position.set(0, 6 + i * 0.25, z);
        m.castShadow = true;
        addStep(m);
        return m;
      });

      const upperBars = matPositions.map((x, i) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, barLen, 8), MAT.steel);
        m.rotation.x = Math.PI / 2;
        m.position.set(x, 6 + i * 0.25, 0);
        m.castShadow = true;
        addStep(m);
        return m;
      });

      function dropBars(bars, targetY, onDone) {
        bars.forEach((m, i) => {
          safeTimeout(() => {
            const startY = m.position.y;
            let t = 0;
            const iv = setInterval(() => {
              t = Math.min(1, t + 0.05);
              const ease = 1 - Math.pow(1 - t, 3);
              m.position.y = startY + (targetY - startY) * ease;
              if (t >= 1) {
                m.position.y = targetY;
                clearInterval(iv);
                if (i === bars.length - 1) onDone();
              }
            }, 16);
          }, i * 80);
        });
      }

      const actionBar = DOM.actionBar();
      actionBar.innerHTML = '<span style="color:#e0c87a;font-size:.78rem;width:100%;text-align:center;display:block;margin-bottom:4px;">Place lower mat first, then cross mat on top</span>';

      const lowerItem = el('div', 'panel-item');
      lowerItem.innerHTML = `
        <div class="item-icon" style="font-family:monospace;font-size:1.1rem;color:#78909c;">\u2550\u2550\u2550</div>
        <div class="item-label">Lower Mat<br><span style="font-size:.68rem;color:#aaa;">8 longitudinal bars (base layer)</span></div>
      `;
      lowerItem.addEventListener('click', () => {
        if (ss.lowerDone) return;
        ss.lowerDone = true;
        lowerItem.classList.add('placed');
        lowerItem.innerHTML += '<div style="color:var(--green-ok);font-size:.8rem;margin-top:2px;">\u2713 Placed</div>';
        markSubtask(0);
        showFeedback('info', 'Placing spacer chairs, then lower mat\u2026');
        dropBars(chairs, -4.95, () => {
          dropBars(lowerBars, -4.90, () => {
            showFeedback('correct', 'Lower mat in place! Now place the cross mat.');
            upperItem.style.opacity = '1';
            upperItem.style.pointerEvents = 'auto';
          });
        });
      });

      const upperItem = el('div', 'panel-item');
      upperItem.style.opacity = '0.4';
      upperItem.style.pointerEvents = 'none';
      upperItem.innerHTML = `
        <div class="item-icon" style="font-family:monospace;font-size:1.1rem;color:#78909c;">\u229e\u229e\u229e</div>
        <div class="item-label">Cross Mat<br><span style="font-size:.68rem;color:#aaa;">8 cross bars (top layer)</span></div>
      `;
      upperItem.addEventListener('click', () => {
        if (ss.upperDone || !ss.lowerDone) return;
        ss.upperDone = true;
        upperItem.classList.add('placed');
        upperItem.innerHTML += '<div style="color:var(--green-ok);font-size:.8rem;margin-top:2px;">\u2713 Placed</div>';
        markSubtask(1);
        showFeedback('info', 'Cross mat dropping into pit\u2026');
        dropBars(upperBars, -4.83, () => {
          showFeedback('correct', '\u2705 Base rebar grid complete! Now place column rebar.');
          safeTimeout(phase_columnRebar, 600);
        });
      });

      function phase_columnRebar() {
        ss.colRebarPlaced = 0;
        const COL_H  = 6;
        const COL_CY = -1.2;
        const COL_BOT = COL_CY - COL_H / 2;
        const colXZ  = [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]];

        const colRebarMeshes = colXZ.map(([x, z]) => {
          const m = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, COL_H, 6),
            MAT.steel
          );
          m.position.set(x, COL_CY, z);
          m.visible = false;
          m.castShadow = true;
          scene.add(m);
          return m;
        });
        OBJ.columnRebarMeshes = colRebarMeshes;

        const stirrupGroup = new THREE.Group();
        stirrupGroup.visible = false;
        scene.add(stirrupGroup);
        OBJ.columnStirrupGroup = stirrupGroup;
        [-3.9, -3.1, -2.3, -1.5, -0.7, 0.1].forEach(y => {
          [
            { len: 1.1, axis: 'x', x:  0,     z: -0.55 },
            { len: 1.1, axis: 'x', x:  0,     z:  0.55 },
            { len: 1.1, axis: 'z', x: -0.55,  z:  0    },
            { len: 1.1, axis: 'z', x:  0.55,  z:  0    }
          ].forEach(s => {
            const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, s.len, 5), MAT.steel);
            if (s.axis === 'x') sm.rotation.z = Math.PI / 2;
            else                 sm.rotation.x = Math.PI / 2;
            sm.position.set(s.x, y, s.z);
            stirrupGroup.add(sm);
          });
        });

        const targetGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
        const targetMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, emissive: 0xd4880a, emissiveIntensity: 0.5 });
        const colTargets = colXZ.map(([x, z]) => {
          const m = new THREE.Mesh(targetGeo, targetMat.clone());
          m.position.set(x, COL_BOT + 0.4, z);
          addStep(m);
          return m;
        });

        const actionBar = DOM.actionBar();
        actionBar.innerHTML = '<span style="color:#e0c87a;font-size:.82rem;width:100%;text-align:center;display:block;">Click 4 corner spots to insert column rebar</span>';

        clickables3D.push(...colTargets.map((m, i) => ({
          mesh: m,
          pulse: true,
          phase: i * 0.9,
          onHit() {
            if (m.userData.done) return;
            m.userData.done = true;
            m.material.color.set(0x27ae60);
            m.material.emissive.set(0x1e8449);
            ss.colRebarPlaced++;

            const rb = colRebarMeshes[i];
            rb.visible = true;
            rb.scale.y = 0.001;
            let t = 0;
            const iv = setInterval(() => {
              t = Math.min(1, t + 0.04);
              rb.scale.y = t;
              if (t >= 1) clearInterval(iv);
            }, 16);

            showFeedback('info', `Column rebar ${ss.colRebarPlaced}/4 inserted.`);
            if (ss.colRebarPlaced === 4) {
              stirrupGroup.visible = true;
              colTargets.forEach(tgt => scene.remove(tgt));
              clickables3D = clickables3D.filter(c => !colTargets.includes(c.mesh));
              markSubtask(2);
              showFeedback('correct', '\u2705 All column rebar placed! Reinforcement complete.');
              safeTimeout(() => {
                markSubtask(3);
                DOM.actionBar().innerHTML = '';
                DOM.actionBar().appendChild(makeBtn('\u2705 Reinforcement Complete', 'btn btn-green', () => completeStep()));
              }, 800);
            }
          }
        })));
      }

      actionBar.appendChild(lowerItem);
      actionBar.appendChild(upperItem);
    },
    cleanup() {}
  },

  /* ─────────────────── 9: Concrete Placement ─── */
  {
    enter() {
      buildShaftsForStep();
      const ss = STATE.stepState;
      ss.fillPct  = 0;
      ss.pouring  = false;
      ss.complete = false;
      ss.pourIv   = null;

      buildFormwork3D();
      buildRebar3D();
      buildConcreteTruck3D();
      buildPourStream();

      const fillMat = MAT.concrete.clone();
      const fillMesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.01, 4.6), fillMat);
      fillMesh.position.set(0, -4.99, 0);
      addStep(fillMesh);
      OBJ.concreteFill = fillMesh;

      const actionBar = DOM.actionBar();
      actionBar.innerHTML = '';

      const meterWrap = el('div', 'fill-meter-wrap');
      meterWrap.appendChild(el('div', '', '<span style="color:#fff;">Concrete Fill Level</span>'));
      const track = el('div', 'fill-meter-track');
      const bar   = el('div', 'fill-meter-bar');
      bar.id = 'conc-meter-bar';
      const tZone = el('div', 'fill-target-zone');
      tZone.style.left = '88%'; tZone.style.width = '10%';
      track.appendChild(bar); track.appendChild(tZone);
      const pctLbl = el('div', '', '0%');
      pctLbl.id = 'conc-pct-label';
      pctLbl.style.color = '#fff';
      meterWrap.appendChild(track); meterWrap.appendChild(pctLbl);
      actionBar.appendChild(meterWrap);

      const pourBtn = makeBtn('\ud83d\ude9b POUR CONCRETE', 'btn btn-primary', null);
      pourBtn.id = 'pour-btn';
      actionBar.appendChild(pourBtn);
      actionBar.appendChild(el('span', '', '<span style="color:#aaa;font-size:.76rem;">Hold button \u2022 Target: 88\u201398%</span>'));

      function updateFillVisual() {
        const pct = ss.fillPct;
        const b = $('conc-meter-bar');
        const p = $('conc-pct-label');
        if (b) b.style.width = pct + '%';
        if (p) p.textContent = Math.round(pct) + '%';
        if (OBJ.concreteFill) {
          const h = Math.max(0.01, 0.35 * pct / 100);
          OBJ.concreteFill.scale.y = h / 0.01;
          OBJ.concreteFill.position.y = -5 + h / 2;
        }
      }

      function startPour() {
        if (ss.complete || ss.fillPct >= 100) return;
        ss.pouring = true;
        pourBtn.style.background = '#d4880a';
        if (OBJ.pourStream) OBJ.pourStream.visible = true;
        ss.pourIv = setInterval(() => {
          ss.fillPct = Math.min(100, ss.fillPct + 1.5);
          updateFillVisual();
          if (Math.random() < 0.35) {
            spawnParticles(new THREE.Vector3(-3.8, 0.3, -2.0), MAT.concreteWet.clone(), 1);
          }
          if (ss.fillPct >= 100) stopPour();
        }, 80);
      }

      function stopPour() {
        ss.pouring = false;
        if (ss.pourIv) { clearInterval(ss.pourIv); ss.pourIv = null; }
        if (OBJ.pourStream) OBJ.pourStream.visible = false;
        pourBtn.style.background = '';
        if (ss.complete) return;
        const pct = ss.fillPct;
        if (pct < 88) {
          penalize('Underfill \u2014 pour more concrete!');
        } else if (pct > 98) {
          STATE.score = Math.max(0, STATE.score - 20);
          updateHUD(); shakeScene();
          showFeedback('wrong', '\u26a0\ufe0f Overfill! (\u221220 pts)');
          ss.complete = true;
          pourBtn.disabled = true;
          safeTimeout(() => {
            DOM.actionBar().innerHTML = '';
            DOM.actionBar().appendChild(makeBtn('\u2b07\ufe0f Proceed (Overfill Noted)', 'btn btn-secondary', () => completeStep()));
          }, 1200);
        } else {
          ss.complete = true;
          pourBtn.disabled = true;
          STATE.score += 20; updateHUD();
          markSubtask(0); markSubtask(1);
          showFeedback('correct', `\ud83c\udf89 Perfect pour at ${Math.round(pct)}%! +20 bonus!`);
          safeTimeout(() => {
            DOM.actionBar().innerHTML = '';
            DOM.actionBar().appendChild(makeBtn('\u2705 Confirm Pour', 'btn btn-green', () => completeStep()));
          }, 1000);
        }
      }

      pourBtn.addEventListener('mousedown', startPour);
      pourBtn.addEventListener('mouseup',   stopPour);
      pourBtn.addEventListener('mouseleave', stopPour);
      pourBtn.addEventListener('touchstart', e => { e.preventDefault(); startPour(); }, { passive: false });
      pourBtn.addEventListener('touchend',   stopPour);
    },
    cleanup() {
      if (STATE.stepState.pourIv) clearInterval(STATE.stepState.pourIv);
    }
  },

  /* ─────────────────── 10: Inspection ─── */
  {
    enter() {
      buildShaftsForStep();
      const ss = STATE.stepState;
      ss.checked   = 0;
      ss.checkedSet = new Set();

      buildFormwork3D();
      buildRebar3D();
      buildConcreteSlab3D();
      buildInspector3D(4.5, 4.5);

      const inspDefs = [
        {
          pos:   new THREE.Vector3(0, -4.2, 0),
          label: 'Pit Depth',
          icon:  '\ud83d\udccf',
          note:  '5.0m depth \u2014 within design specification',
          camPos:  new THREE.Vector3(-6, 0.5, 6.5),
          camLook: new THREE.Vector3(0, -2.5, 0)
        },
        {
          pos:   new THREE.Vector3(2.0, -2.0, 2.0),
          label: 'Formwork Alignment',
          icon:  '\ud83d\udcd0',
          note:  'Plumb \u00b13mm, square within 5mm \u2713',
          camPos:  new THREE.Vector3(6, 1.5, 8),
          camLook: new THREE.Vector3(0, -2.5, 0)
        },
        {
          pos:   new THREE.Vector3(-1.2, -4.35, -1.2),
          label: 'Rebar Cover & Spacing',
          icon:  '\u2699\ufe0f',
          note:  '72mm bar spacing, 50mm edge cover \u2713',
          camPos:  new THREE.Vector3(1, 1, 8),
          camLook: new THREE.Vector3(0, -4.2, 0)
        },
        {
          pos:   new THREE.Vector3(0, -0.5, 0),
          label: 'Concrete Fill Level',
          icon:  '\ud83d\udd32',
          note:  '93% fill \u2014 within the 88\u201398% target zone \u2713',
          camPos:  new THREE.Vector3(6, 5, 9),
          camLook: new THREE.Vector3(0, -0.5, 0)
        }
      ];

      const markerMeshes = [];
      const labelEls     = [];
      inspDefs.forEach((def, i) => {
        const mat = new THREE.MeshStandardMaterial({
          color: 0xf39c12, emissive: 0xe07000, emissiveIntensity: 0.55,
          transparent: true, opacity: 0.88
        });
        const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.46), mat);
        marker.position.copy(def.pos);
        marker.position.y += 0.55;
        addStep(marker);
        markerMeshes.push(marker);

        const lbl = create3DLabel(marker, def.label, 'insp-label');
        labelEls.push(lbl);

        clickables3D.push({
          mesh:  marker,
          pulse: true,
          phase: i * 0.75,
          onHit() { runInspection(i); }
        });
      });

      const ab = DOM.actionBar();
      ab.innerHTML = '';
      ab.appendChild(el('div', 'step-instruction',
        '\ud83d\udd0d Click an inspection point in the scene <strong>or</strong> press Inspect below'));

      const cardsWrap = el('div', '');
      cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:5px;width:100%;margin-top:4px;';

      const cardEls = inspDefs.map((def, i) => {
        const card = el('div', '');
        card.style.cssText = [
          'background:rgba(255,255,255,0.07)',
          'border:1px solid rgba(245,166,35,0.45)',
          'border-radius:6px',
          'padding:7px 10px',
          'cursor:pointer',
          'display:flex',
          'align-items:center',
          'gap:8px',
          'transition:background .15s'
        ].join(';');
        card.innerHTML = `
          <span style="font-size:1.1rem;flex-shrink:0">${def.icon}</span>
          <div style="flex:1;min-width:0">
            <div style="color:#f5a623;font-weight:700;font-size:.78rem">${def.label}</div>
            <div style="color:#888;font-size:.7rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${def.note}</div>
          </div>
          <button class="btn btn-secondary" style="padding:3px 10px;font-size:.73rem;white-space:nowrap;flex-shrink:0">Inspect</button>
        `;
        card.addEventListener('click', () => runInspection(i));
        card.addEventListener('mouseenter', () => { if (!ss.checkedSet.has(i)) card.style.background = 'rgba(245,166,35,0.12)'; });
        card.addEventListener('mouseleave', () => { if (!ss.checkedSet.has(i)) card.style.background = 'rgba(255,255,255,0.07)'; });
        cardsWrap.appendChild(card);
        return card;
      });
      ab.appendChild(cardsWrap);

      function runInspection(i) {
        if (ss.checkedSet.has(i)) return;
        ss.checkedSet.add(i);
        ss.checked++;

        const marker = markerMeshes[i];
        marker.material.color.set(0x27ae60);
        marker.material.emissive.set(0x1e8449);
        marker.material.emissiveIntensity = 0.3;
        labelEls[i].classList.add('passed');

        const card = cardEls[i];
        card.style.background  = 'rgba(39,174,96,0.12)';
        card.style.borderColor = 'rgba(39,174,96,0.5)';
        const btn = card.querySelector('button');
        if (btn) { btn.textContent = '\u2713 PASS'; btn.style.cssText += ';background:#27ae60;color:#fff;cursor:default'; btn.disabled = true; }

        const def = inspDefs[i];
        camTarget = { pos: def.camPos.clone(), look: def.camLook.clone() };

        showFeedback('correct', `${def.label}: PASS \u2713`);
        markSubtask(i < 4 ? i : 3);

        if (ss.checked === inspDefs.length) {
          markSubtask(3);
          safeTimeout(() => {
            ab.innerHTML = '';
            ab.appendChild(makeBtn('\ud83d\udcdd Sign Off Inspection', 'btn btn-green', () => completeStep()));
            showFeedback('correct', 'All 4 inspections passed! Sign off to proceed.');
          }, 700);
        }
      }
    },
    cleanup() {}
  },

  /* ─────────────────── 11: Curing ─── */
  {
    enter() {
      buildShaftsForStep();
      const ss = STATE.stepState;
      ss.day          = 1;
      ss.totalDays    = 7;
      ss.strength     = 0;
      ss.wateredToday = false;
      ss.missedDays   = 0;
      ss.complete     = false;

      buildFormwork3D();
      buildRebar3D();

      const concMat = MAT.concrete.clone();
      const concMesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 4.8, 4.6), concMat);
      concMesh.position.set(0, -2.6, 0);
      addStep(concMesh);
      OBJ.curingConcrete = concMesh;

      const blanketTex = makeCanvasTexture((ctx, s) => {
        ctx.fillStyle = '#1565c0';
        ctx.fillRect(0, 0, s, s);
        for (let x = 0; x < s; x += 12) {
          ctx.fillStyle = 'rgba(100,160,220,0.5)';
          ctx.fillRect(x, 0, 6, s);
        }
      });
      blanketTex.repeat.set(1, 1);

      const blanketMat = new THREE.MeshLambertMaterial({ map: blanketTex, transparent: true, opacity: 0.8 });
      const blanket = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), blanketMat);
      blanket.rotation.x = -Math.PI / 2;
      blanket.position.set(0, 0.01, 0);
      addStep(blanket);
      OBJ.curingBlanket = blanket;

      function renderActionBar() {
        const ab = DOM.actionBar();
        ab.innerHTML = '';
        const dayCounter = el('div', 'day-counter', `Day ${ss.day} / ${ss.totalDays}`);
        dayCounter.id = 'day-counter';
        ab.appendChild(dayCounter);

        const strengthWrap = el('div', 'fill-meter-wrap');
        strengthWrap.appendChild(el('div', '', '<span style="color:#fff;font-size:.75rem;">Concrete Strength</span>'));
        const sTrack = el('div', 'fill-meter-track');
        const sBar   = el('div', 'fill-meter-bar');
        sBar.id = 'strength-bar';
        sBar.style.background = 'linear-gradient(to right,#1e8449,#27ae60,#58d68d)';
        sBar.style.width = ss.strength + '%';
        sTrack.appendChild(sBar);
        const sPct = el('div', '', Math.round(ss.strength) + '%');
        sPct.id = 'strength-pct';
        sPct.style.color = '#aef';
        strengthWrap.appendChild(sTrack);
        strengthWrap.appendChild(sPct);
        ab.appendChild(strengthWrap);

        const waterBtn = makeBtn('\ud83d\udca7 Water Concrete', 'btn btn-primary', () => {
          if (ss.wateredToday) { showFeedback('info', 'Already watered today.'); return; }
          ss.wateredToday = true;
          waterBtn.disabled = true;
          showFeedback('correct', `Day ${ss.day} watered!`);
          updateStrength(true);
          for (let i = 0; i < 20; i++) {
            spawnParticles(
              new THREE.Vector3((Math.random() - 0.5) * 3, 1, (Math.random() - 0.5) * 3),
              MAT.waterBlue.clone(), 1
            );
          }
        });
        waterBtn.id = 'water-btn';
        ab.appendChild(waterBtn);

        if (ss.day < ss.totalDays) {
          ab.appendChild(makeBtn('\u23ed\ufe0f Next Day', 'btn btn-secondary', advanceDay));
        }
      }

      function updateStrength(watered) {
        const gain = watered ? (100 / ss.totalDays) : (100 / ss.totalDays / 2);
        ss.strength = Math.min(100, ss.strength + gain);
        const b = $('strength-bar'); const p = $('strength-pct');
        if (b) b.style.width = ss.strength + '%';
        if (p) p.textContent = Math.round(ss.strength) + '%';
        markSubtask(0);
        if (OBJ.curingConcrete) {
          const darkness = 0.4 + (ss.strength / 100) * 0.3;
          OBJ.curingConcrete.material.color.setScalar(darkness);
        }
      }

      function advanceDay() {
        if (!ss.wateredToday) {
          ss.missedDays++;
          STATE.score = Math.max(0, STATE.score - 10);
          updateHUD();
          showFeedback('wrong', `Missed watering Day ${ss.day}! (\u221210 pts)`);
          updateStrength(false);
        }
        ss.day++;
        ss.wateredToday = false;
        if (ss.day > ss.totalDays) { finishCuring(); return; }
        renderActionBar();
      }

      function finishCuring() {
        ss.complete = true;
        markSubtask(1); markSubtask(2);
        showFeedback('correct', `Curing complete! ${Math.round(ss.strength)}% strength.`);
        DOM.actionBar().innerHTML = '';
        DOM.actionBar().appendChild(makeBtn('\u2705 Curing Complete', 'btn btn-green', () => completeStep()));
      }

      ss.autoIv = safeInterval(() => {
        if (!ss.complete && ss.day <= ss.totalDays) advanceDay();
      }, 3000);

      renderActionBar();
    },
    cleanup() {
      if (STATE.stepState.autoIv) clearInterval(STATE.stepState.autoIv);
    }
  },

  /* ─────────────────── 12: Final Inspection ─── */
  {
    enter() {
      buildShaftsForStep();
      const ss = STATE.stepState;
      ss.checked = 0;
      ss.scores  = [];

      buildConcreteSlab3D();
      buildInspector3D(4, 3);

      const checkPositions = [
        new THREE.Vector3(-1.5, 0.2, -1.5),
        new THREE.Vector3( 1.5, 0.2,  1.5),
        new THREE.Vector3(-1.5, 0.2,  1.5),
        new THREE.Vector3( 1.5, 0.2, -1.5),
        new THREE.Vector3( 0,   0.2,  0)
      ];

      const diamondGeo = new THREE.OctahedronGeometry(0.28);

      checkPositions.forEach((pos, i) => {
        const mat = MAT.diamondBlue.clone();
        const m = new THREE.Mesh(diamondGeo, mat);
        m.position.copy(pos);
        m.castShadow = true;
        addStep(m);

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
              `<strong>${chk.label}</strong><br><span style="color:#f5a623;font-weight:700;font-size:.9rem;">${score}%</span><br><span style="font-size:.65rem;opacity:.8;">${chk.note}</span>`,
              2200
            );
            markSubtask(i < 4 ? i : 4);
            showFeedback('correct', `${chk.label}: ${score}%`);

            if (ss.checked === FINAL_CHECKS.length) {
              const avg = Math.round(ss.scores.reduce((a, b) => a + b, 0) / ss.scores.length);
              safeTimeout(() => {
                DOM.actionBar().innerHTML = '';
                if (avg >= 80) {
                  DOM.actionBar().appendChild(
                    makeBtn(`\ud83c\udfd7\ufe0f Proceed to Pillar (Avg: ${avg}%)`, 'btn btn-green', () => completeStep())
                  );
                  showFeedback('correct', `Average score: ${avg}% \u2014 excellent!`);
                } else {
                  showFeedback('wrong', `Average: ${avg}% \u2014 below threshold.`);
                  penalize('Quality below 80%.');
                  safeTimeout(() => completeStep(), 1500);
                }
              }, 600);
            }
          }
        });
      });

      DOM.actionBar().innerHTML = '<span style="color:#e0c87a;font-size:.85rem;">Click each glowing blue diamond checkpoint to verify</span>';
    },
    cleanup() {}
  },

  /* ─────────────────── 13: Pillar Construction ─── */
  {
    enter() {
      buildShaftsForStep();
      const ss = STATE.stepState;
      ss.fwPlaced      = 0;
      ss.concPct       = 0;
      ss.concreteComplete = false;
      ss.fwStripped    = 0;
      ss.waterClicks   = 0;
      ss.phase         = 'formwork';

      const COL_H   = 6;
      const COL_CY  = -1.2;
      const COL_BOT = COL_CY - COL_H / 2;
      const COL_TOP = COL_CY + COL_H / 2;
      const COL_W   = 0.8;
      const COL_D   = 0.8;

      buildConcreteSlab3D();

      groundGroup.children.forEach(child => {
        child.traverse(obj => {
          if (!obj.isMesh) return;
          obj.material = obj.material.clone();
          obj.material.transparent = true;
          obj.material.opacity     = 0.2;
          obj.material.depthWrite  = false;
        });
      });

      const colRebarMeshes = OBJ.columnRebarMeshes || [];
      const stirrupGroup   = OBJ.columnStirrupGroup || null;

      const fwHalves = [];
      [-1, 1].forEach(side => {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, COL_H, COL_D + 0.14),
          MAT.wood
        );
        m.position.set(side * (COL_W / 2 + 0.06), COL_CY, 0);
        m.visible = false;
        m.castShadow = true;
        addStep(m);
        fwHalves.push(m);
      });

      const colMat = MAT.concrete.clone();
      const colMesh = new THREE.Mesh(new THREE.BoxGeometry(COL_W, 0.01, COL_D), colMat);
      colMesh.position.set(0, COL_BOT, 0);
      colMesh.visible = false;
      addStep(colMesh);
      OBJ.columnConcrete = colMesh;

      const pillarMat = new THREE.MeshLambertMaterial({ color: 0x616161, map: TEX.concrete });
      const pillarMesh = new THREE.Mesh(new THREE.BoxGeometry(COL_W, COL_H, COL_D), pillarMat);
      pillarMesh.position.set(0, COL_CY, 0);
      pillarMesh.visible = false;
      pillarMesh.castShadow = true;
      addStep(pillarMesh);

      const capMesh = new THREE.Mesh(
        new THREE.BoxGeometry(COL_W + 0.3, 0.2, COL_D + 0.3),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
      );
      capMesh.position.set(0, COL_TOP + 0.1, 0);
      capMesh.visible = false;
      capMesh.castShadow = true;
      addStep(capMesh);

      showFeedback('info', 'Column rebar is in place from the Reinforcement step. Install formwork now.');
      safeTimeout(phase_formwork, 600);

      function phase_formwork() {
        ss.phase = 'formwork';
        DOM.actionBar().innerHTML = '';
        DOM.actionBar().innerHTML = '<span style="color:#e0c87a;font-size:.82rem;">Click both formwork halves to clamp around the rebar</span>';

        const halves = [
          { label: 'Left Half', idx: 0 },
          { label: 'Right Half', idx: 1 }
        ];
        halves.forEach(h => {
          const item = el('div', 'panel-item');
          item.innerHTML = `<div class="item-icon">\ud83e\udeb5</div><div class="item-label">${h.label}</div>`;
          item.addEventListener('click', () => {
            if (item.classList.contains('placed')) return;
            item.classList.add('placed');
            item.innerHTML += '<div style="color:var(--green-ok);font-size:.8rem;margin-top:2px;">\u2713</div>';
            ss.fwPlaced++;
            markSubtask(0);
            fwHalves[h.idx].visible = true;
            showFeedback('info', `${h.label} installed.`);
            if (ss.fwPlaced === 2) {
              showFeedback('correct', 'Formwork installed! Pour column concrete.');
              safeTimeout(phase_pour, 600);
            }
          });
          DOM.actionBar().appendChild(item);
        });
      }

      function phase_pour() {
        ss.phase = 'pour';
        DOM.actionBar().innerHTML = '';

        const mWrap = el('div', 'fill-meter-wrap');
        mWrap.appendChild(el('div', '', '<span style="color:#fff;">Column Fill Level</span>'));
        const mTr = el('div', 'fill-meter-track');
        const mBr = el('div', 'fill-meter-bar'); mBr.id = 'col-bar';
        const tz  = el('div', 'fill-target-zone'); tz.style.left = '88%'; tz.style.width = '10%';
        mTr.appendChild(mBr); mTr.appendChild(tz);
        const mPct = el('div', '', '0%'); mPct.id = 'col-pct'; mPct.style.color = '#fff';
        mWrap.appendChild(mTr); mWrap.appendChild(mPct);
        DOM.actionBar().appendChild(mWrap);

        colMesh.visible = true;

        const pourBtn = makeBtn('\ud83d\ude9b POUR COLUMN', 'btn btn-primary', null);
        DOM.actionBar().appendChild(pourBtn);
        DOM.actionBar().appendChild(el('span', '', '<span style="color:#aaa;font-size:.76rem;">Hold \u2022 Target 88\u201398%</span>'));

        let pourIv = null;

        function startPour() {
          if (ss.concreteComplete) return;
          pourBtn.style.background = '#d4880a';
          pourIv = setInterval(() => {
            ss.concPct = Math.min(100, ss.concPct + 1.5);
            const b = $('col-bar'); const p = $('col-pct');
            if (b) b.style.width = ss.concPct + '%';
            if (p) p.textContent = Math.round(ss.concPct) + '%';
            const h = Math.max(0.01, COL_H * ss.concPct / 100);
            if (colMesh) {
              colMesh.scale.y = h / 0.01;
              colMesh.position.y = COL_BOT + h / 2;
            }
            if (ss.concPct >= 100) stopPour();
          }, 80);
          STATE.intervals.push(pourIv);
        }

        function stopPour() {
          if (pourIv) { clearInterval(pourIv); pourIv = null; }
          pourBtn.style.background = '';
          if (ss.concreteComplete) return;
          const pct = ss.concPct;
          if (pct < 88) {
            penalize('Column underfilled!');
          } else if (pct > 98) {
            STATE.score = Math.max(0, STATE.score - 20); updateHUD(); shakeScene();
            showFeedback('wrong', '\u26a0\ufe0f Column overfilled! (\u221220 pts)');
            ss.concreteComplete = true;
            pourBtn.disabled = true;
            safeTimeout(phase_water, 1200);
          } else {
            ss.concreteComplete = true;
            pourBtn.disabled = true;
            STATE.score += 20; updateHUD();
            markSubtask(1);
            showFeedback('correct', `Column poured at ${Math.round(pct)}%! +20 bonus! Now water the concrete.`);
            safeTimeout(phase_water, 1000);
          }
        }

        pourBtn.addEventListener('mousedown', startPour);
        pourBtn.addEventListener('mouseup',   stopPour);
        pourBtn.addEventListener('mouseleave', stopPour);
        pourBtn.addEventListener('touchstart', e => { e.preventDefault(); startPour(); }, { passive: false });
        pourBtn.addEventListener('touchend',   stopPour);
      }

      function phase_water() {
        ss.phase = 'water';
        const WATER_DAYS = 3;
        ss.waterClicks = 0;

        function renderWaterUI() {
          const ab = DOM.actionBar();
          ab.innerHTML = '';

          const dayLbl = el('div', 'day-counter', `Curing Day ${ss.waterClicks + 1} / ${WATER_DAYS}`);
          ab.appendChild(dayLbl);

          const wrap = el('div', 'fill-meter-wrap');
          wrap.appendChild(el('div', '', '<span style="color:#fff;font-size:.75rem;">Column Concrete Strength</span>'));
          const tr = el('div', 'fill-meter-track');
          const br = el('div', 'fill-meter-bar');
          br.id = 'col-strength-bar';
          br.style.background = 'linear-gradient(to right,#1565c0,#42a5f5)';
          br.style.width = (ss.waterClicks / WATER_DAYS * 100) + '%';
          tr.appendChild(br);
          const pct = el('div', '', Math.round(ss.waterClicks / WATER_DAYS * 100) + '%');
          pct.id = 'col-strength-pct'; pct.style.color = '#aef';
          wrap.appendChild(tr); wrap.appendChild(pct);
          ab.appendChild(wrap);

          const waterBtn = makeBtn('\ud83d\udca7 Water Column Concrete', 'btn btn-primary', () => {
            ss.waterClicks++;
            const b = $('col-strength-bar'); const p = $('col-strength-pct');
            if (b) b.style.width = (ss.waterClicks / WATER_DAYS * 100) + '%';
            if (p) p.textContent = Math.round(ss.waterClicks / WATER_DAYS * 100) + '%';
            for (let i = 0; i < 15; i++) {
              spawnParticles(
                new THREE.Vector3((Math.random() - 0.5) * 1.2, COL_TOP + 0.2, (Math.random() - 0.5) * 1.2),
                MAT.waterBlue.clone(), 1
              );
            }
            showFeedback('correct', `Column watered \u2014 Day ${ss.waterClicks}/${WATER_DAYS}.`);
            if (ss.waterClicks >= WATER_DAYS) {
              markSubtask(2);
              waterBtn.disabled = true;
              showFeedback('correct', '\u2705 Column concrete cured! Strip the formwork.');
              safeTimeout(phase_strip, 900);
            } else {
              renderWaterUI();
            }
          });
          ab.appendChild(waterBtn);
        }

        renderWaterUI();
      }

      function phase_strip() {
        ss.phase = 'strip';
        DOM.actionBar().innerHTML = '';
        DOM.actionBar().innerHTML = '<span style="color:#e0c87a;font-size:.82rem;">Click the formwork panels to strip them</span>';

        fwHalves.forEach((half, i) => {
          half.userData.stripped = false;
          clickables3D.push({
            mesh: half,
            pulse: true,
            phase: i * 1.5,
            onHit() {
              if (half.userData.stripped) return;
              half.userData.stripped = true;
              ss.fwStripped++;
              showFeedback('info', 'Formwork panel removed.');
              let t = 1;
              const iv = setInterval(() => {
                t -= 0.05;
                half.material.transparent = true;
                half.material.opacity = Math.max(0, t);
                if (t <= 0) { half.visible = false; clearInterval(iv); }
              }, 16);

              if (ss.fwStripped === 2) {
                markSubtask(3);
                if (colMesh) colMesh.visible = false;
                colRebarMeshes.forEach(r => r.visible = false);
                pillarMesh.visible = true;
                capMesh.visible    = true;

                pillarMesh.scale.y = 0.001;
                capMesh.scale.y    = 0.001;
                let t2 = 0;
                const iv2 = setInterval(() => {
                  t2 = Math.min(1, t2 + 0.04);
                  pillarMesh.scale.y = t2;
                  capMesh.scale.y    = t2;
                  if (t2 >= 1) clearInterval(iv2);
                }, 16);

                showFeedback('correct', '\ud83c\udf89 Pillar complete! Now backfill around it.');
                safeTimeout(() => {
                  DOM.actionBar().innerHTML = '';
                  DOM.actionBar().appendChild(
                    makeBtn('\ud83e\udea3 Proceed to Backfilling', 'btn btn-green', () => completeStep())
                  );
                }, 1200);
              }
            }
          });
        });
      }

      safeTimeout(() => {}, 200);
    },
    cleanup() {
      groundGroup.children.forEach(child => {
        child.traverse(obj => {
          if (!obj.isMesh) return;
          obj.material.transparent = false;
          obj.material.opacity     = 1.0;
          obj.material.depthWrite  = true;
        });
      });
      if (OBJ.columnRebarMeshes) {
        OBJ.columnRebarMeshes.forEach(m => scene.remove(m));
        delete OBJ.columnRebarMeshes;
      }
      if (OBJ.columnStirrupGroup) {
        scene.remove(OBJ.columnStirrupGroup);
        delete OBJ.columnStirrupGroup;
      }
    }
  },

  /* ─────────────────── 14: Backfilling ─── */
  {
    enter() {
      buildShaftsForStep();
      const ss = STATE.stepState;
      ss.fillClicks    = 0;
      ss.compactClicks = 0;
      ss.fillPct       = 0;
      ss.compactPct    = 0;
      ss.maxFill       = 5;
      ss.maxCompact    = 3;

      const COL_H  = 6;
      const COL_CY = -1.2;
      const COL_TOP = COL_CY + COL_H / 2;
      const COL_W  = 0.8;
      const COL_D  = 0.8;

      buildConcreteSlab3D();
      buildCompactor3D(4.5, 1.5);

      const pillarMat = new THREE.MeshLambertMaterial({ color: 0x616161, map: TEX.concrete });
      const pillarMesh = new THREE.Mesh(new THREE.BoxGeometry(COL_W, COL_H, COL_D), pillarMat);
      pillarMesh.position.set(0, COL_CY, 0);
      pillarMesh.castShadow = true;
      addStep(pillarMesh);

      const capMesh = new THREE.Mesh(
        new THREE.BoxGeometry(COL_W + 0.3, 0.2, COL_D + 0.3),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
      );
      capMesh.position.set(0, COL_TOP + 0.1, 0);
      capMesh.castShadow = true;
      addStep(capMesh);

      const PIT  = 4.0;
      const CW2  = COL_W / 2 + 0.05;
      const CD2  = COL_D / 2 + 0.05;
      const bfDirtMat = MAT.dirt.clone();
      const bfPieces = [
        [PIT * 2,        PIT - CD2,     0,           -(CD2 + (PIT - CD2) / 2)],
        [PIT * 2,        PIT - CD2,     0,            (CD2 + (PIT - CD2) / 2)],
        [PIT - CW2,      CD2 * 2,      -(CW2 + (PIT - CW2) / 2), 0],
        [PIT - CW2,      CD2 * 2,       (CW2 + (PIT - CW2) / 2), 0]
      ];
      const bfMeshes = bfPieces.map(([w, d, cx, cz]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, d), bfDirtMat);
        m.position.set(cx, -5, cz);
        m.receiveShadow = true;
        addStep(m);
        return m;
      });
      OBJ.backfillMeshes = bfMeshes;

      const ab = DOM.actionBar();
      ab.innerHTML = '';

      function makeMeter(label, id, bg) {
        const w = el('div', 'fill-meter-wrap');
        w.appendChild(el('div', '', `<span style="color:#fff;font-size:.75rem;">${label}</span>`));
        const tr = el('div', 'fill-meter-track');
        const br = el('div', 'fill-meter-bar');
        br.id = id + '-bar'; br.style.background = bg; br.style.width = '0%';
        tr.appendChild(br);
        const pl = el('div', '', '0%');
        pl.id = id + '-pct'; pl.style.color = '#fff';
        w.appendChild(tr); w.appendChild(pl);
        return w;
      }

      const fillWrap = makeMeter('Backfill', 'bf-fill', 'linear-gradient(to right,#2980b9,#27ae60)');
      const compWrap = makeMeter('Compaction', 'bf-comp', 'linear-gradient(to right,#8e44ad,#c0392b)');
      ab.appendChild(fillWrap);
      ab.appendChild(compWrap);

      const btnRow = el('div', '');
      btnRow.style.cssText = 'display:flex;gap:8px;';

      const soilBtn = makeBtn('\ud83e\udea3 Add Soil', 'btn btn-primary', () => {
        if (ss.fillClicks >= ss.maxFill) return;
        ss.fillClicks++;
        ss.fillPct = Math.round((ss.fillClicks / ss.maxFill) * 100);
        const b = $('bf-fill-bar'); const p = $('bf-fill-pct');
        if (b) b.style.width = ss.fillPct + '%';
        if (p) p.textContent = ss.fillPct + '%';

        const h = Math.max(0.01, 5 * ss.fillPct / 100);
        bfMeshes.forEach(m => {
          m.scale.y = h / 0.01;
          m.position.y = -5 + h / 2;
        });

        showFeedback('info', `Backfill: ${ss.fillPct}%`);
        markSubtask(0);
        if (ss.fillPct >= 60) compactBtn.disabled = false;
        checkComplete();
      });

      const compactBtn = makeBtn('\ud83d\udd28 Compact', 'btn btn-secondary', () => {
        if (ss.fillPct < 60) { showFeedback('wrong', 'Need 60% fill first!'); return; }
        if (ss.compactClicks >= ss.maxCompact) return;
        ss.compactClicks++;
        ss.compactPct = Math.round((ss.compactClicks / ss.maxCompact) * 100);
        const b = $('bf-comp-bar'); const p = $('bf-comp-pct');
        if (b) b.style.width = ss.compactPct + '%';
        if (p) p.textContent = ss.compactPct + '%';
        shakeScene();
        if (OBJ.compactor) {
          let t = 0;
          const iv = setInterval(() => {
            t++;
            OBJ.compactor.position.y = Math.sin(t * 1.2) * 0.06;
            if (t > 20) { clearInterval(iv); if (OBJ.compactor) OBJ.compactor.position.y = 0; }
          }, 30);
        }
        showFeedback('info', `Compaction: ${ss.compactPct}%`);
        markSubtask(1);
        checkComplete();
      });
      compactBtn.disabled = true;

      btnRow.appendChild(soilBtn);
      btnRow.appendChild(compactBtn);
      ab.appendChild(btnRow);

      function checkComplete() {
        if (ss.fillPct >= 100 && ss.compactPct >= 100) {
          markSubtask(2);
          showFeedback('correct', '\ud83c\udf89 Backfilling complete! Only the pillar top stands above ground.');
          ab.innerHTML = '';
          ab.appendChild(makeBtn('\ud83c\udfc6 Construction Complete!', 'btn btn-green', () => completeStep()));
        }
      }
    },
    cleanup() {}
  }



]; // end STEP_HANDLERS

/* ══════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(init, 50);
});
