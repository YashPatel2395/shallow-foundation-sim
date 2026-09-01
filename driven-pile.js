/* ============================================================
   DRIVEN PILE FOUNDATION CONSTRUCTION SIMULATION — Three.js 3D
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
    subtasks: ['Test point BH-1', 'Test point BH-2', 'Test point BH-3', 'Test point BH-4', 'Test point BH-5', 'Review soil report'],
    why: 'Site investigation determines if shallow foundations are adequate. Deep foundations are required when soft/weak soils extend to great depth.',
    warning: 'Skipping site investigation leads to foundation failure — one of the most costly construction mistakes.'
  },
  {
    title: '2. Pile Layout',
    desc: 'Mark the exact positions for all 4 piles based on the structural design drawings.',
    subtasks: ['Place pile marker P1', 'Place pile marker P2', 'Place pile marker P3', 'Place pile marker P4'],
    why: 'Pile positions must align with column loads. Incorrect layout misses the load path entirely.',
    warning: 'Layout errors cannot be corrected after driving. Check twice, drive once.'
  },
  {
    title: '3. Position Pile',
    desc: 'Use the crane to lift the concrete pile from storage and position it over the pile marker.',
    subtasks: ['Attach lifting sling', 'Crane lifts pile vertical', 'Guide pile to position'],
    why: 'Correct positioning ensures the pile is driven to the design location under the column.',
    warning: 'Never stand under a suspended pile. Maintain clear exclusion zone during lifting.'
  },
  {
    title: '4. Alignment Check',
    desc: 'Verify the pile is perfectly vertical using theodolite readings from two directions.',
    subtasks: ['Check North-South verticality', 'Check East-West verticality', 'Confirm within ±0.5°'],
    why: 'An out-of-plumb pile induces bending. Tolerance is typically ±1:75 (0.75°).',
    warning: 'Misaligned piles transfer load eccentrically, reducing capacity and causing structural problems.'
  },
  {
    title: '5. Drive Pile',
    desc: 'Operate the drop hammer to drive the pile through soft soils to the bearing layer.',
    subtasks: ['Begin driving in topsoil', 'Drive through soft clay', 'Drive through loose sand', 'Enter dense sand'],
    why: 'Impact energy is transferred through the pile to the tip, which displaces and compresses soil.',
    warning: 'Monitor blow count carefully. Rapid change indicates layer change or obstruction.'
  },
  {
    title: '6. Reach Pile Refusal',
    desc: 'Recognize when the pile has reached the bearing layer and refusal condition is achieved.',
    subtasks: ['Monitor penetration per blow', 'Observe decreasing movement', 'Confirm refusal criteria', 'Record final depth'],
    why: 'Pile refusal indicates the pile tip has reached a strong bearing layer capable of carrying design loads.',
    warning: 'Premature refusal on an obstruction (boulder) must be distinguished from true bearing layer refusal.'
  },
  {
    title: '7. Formwork Installation',
    desc: 'Install wooden formwork panels to contain the concrete pour.',
    subtasks: ['Place North wall panel', 'Place South wall panel', 'Place East wall panel', 'Place West wall panel'],
    why: 'Formwork gives the concrete its final shape and dimensions.',
    warning: 'Misaligned formwork produces an off-centre foundation.'
  },
  {
    title: '8. Reinforcement Placement',
    desc: 'Lay the base rebar mat first, then place the column rebar cage ready for the column.',
    subtasks: ['Place lower mat (8 longitudinal bars)', 'Place cross mat (8 cross bars)', 'Place column rebar (4 corner bars)', 'Reinforcement complete'],
    why: 'Rebar provides tensile strength — base mat resists footing loads, column cage transfers structural loads upward.',
    warning: 'Column rebar must be placed before concrete is poured — it cannot be added afterwards.'
  },
  {
    title: '9. Concrete Placement',
    desc: 'Pour concrete from the ready-mix truck. Hit the 88–98% target zone.',
    subtasks: ['Hold pour button to fill', 'Release in the green zone (88–98%)', 'Avoid overfill'],
    why: 'Correct fill level ensures structural integrity and cover depth.',
    warning: 'Overfill causes honeycombing; underfill reduces load capacity.'
  },
  {
    title: '10. Inspection',
    desc: 'The site inspector checks all critical construction elements.',
    subtasks: ['Click each inspection point', 'Review PASS results', 'Sign off inspection'],
    why: 'Third-party inspection ensures compliance with structural codes.',
    warning: 'Uninspected work cannot proceed legally.'
  },
  {
    title: '11. Curing',
    desc: 'Keep the concrete moist for 7 days to reach full strength.',
    subtasks: ['Water concrete each day', 'Monitor strength gain bar', 'Complete 7-day cycle'],
    why: 'Curing prevents shrinkage cracks and reaches design strength.',
    warning: 'Missing watering days reduces final strength by up to 40%.'
  },
  {
    title: '12. Final Inspection',
    desc: 'Verify 5 quality checkpoints on the completed foundation.',
    subtasks: ['Check all 5 quality points', 'Average score ≥ 80%', 'Proceed to pillar construction'],
    why: 'Final QA confirms the foundation meets design specifications.',
    warning: 'Defective foundation cannot support the structure above.'
  },
  {
    title: '13. Pillar Construction',
    desc: 'Install formwork around the pre-placed column rebar, pour concrete, water and cure it, then strip the formwork.',
    subtasks: ['Install column formwork', 'Pour column concrete', 'Water & cure column concrete', 'Strip formwork'],
    why: 'The column transfers structural loads to the foundation below.',
    warning: 'Column must be centred and plumb for load transfer. Water the concrete immediately after pouring.'
  },
  {
    title: '14. Backfilling',
    desc: 'Refill soil around the finished pillar and compact it — only the column top remains above ground.',
    subtasks: ['Add soil 5 times around pillar', 'Compact 3 times (after 60% fill)', 'Reach 100% fill — pillar base buried'],
    why: 'Backfilling after the pillar protects the underground foundation and sets the finished ground level.',
    warning: 'Never backfill before the pillar concrete has fully cured — movement will misalign the column.'
  }
];

const STEP_META = [
  {
    purpose: 'Determine the subsurface soil profile to select the appropriate foundation type.',
    userAction: 'Click all 5 soil boring markers and review the soil report.',
    tools: ['Soil boring rig', 'SPT sampler', 'Geotechnical lab'],
    qualityCheck: 'All boring locations tested and soil profile documented.',
    commonMistake: 'Insufficient number of borings misses variable soil conditions.',
    learningObjective: 'Deep foundations are needed when bearing soil is too deep for shallow footings.'
  },
  {
    purpose: 'Establish exact pile locations that align with the structural column load paths.',
    userAction: 'Click each target ring to place a survey marker at the design position.',
    tools: ['Total station', 'Survey stakes', 'Steel tape', 'Design drawings'],
    qualityCheck: 'All pile positions within ±25mm of design coordinates.',
    commonMistake: 'Transposing coordinates or measuring from wrong reference point.',
    learningObjective: 'Pile positions must match the structural design load path.'
  },
  {
    purpose: 'Safely lift and position the pile from storage into the driving leads.',
    userAction: 'Attach sling, lift pile vertical, and guide to the driving position.',
    tools: ['Crane', 'Lifting slings', 'Tag lines', 'Pile driving rig'],
    qualityCheck: 'Pile centered in leads and aligned with pile marker below.',
    commonMistake: 'Rushing the lift without proper sling attachment points.',
    learningObjective: 'Safe pile handling prevents worker injury and pile damage.'
  },
  {
    purpose: 'Ensure the pile is perfectly vertical before driving begins.',
    userAction: 'Adjust N-S and E-W tilt sliders until the pile is within 0.5° of vertical.',
    tools: ['Theodolite', 'Inclinometer', 'Plumb line'],
    qualityCheck: 'Pile verticality within ±0.5° in both axes.',
    commonMistake: 'Checking only one axis — pile can be plumb in one direction but tilted in the other.',
    learningObjective: 'Alignment must be checked in two perpendicular directions.'
  },
  {
    purpose: 'Drive the pile through weak soils using repeated hammer impacts.',
    userAction: 'Hold the DRIVE button and watch blow count and penetration per blow.',
    tools: ['Drop hammer', 'Pile driving rig', 'Blow counter', 'Depth gauge'],
    qualityCheck: 'Consistent blow counts that increase with depth as expected.',
    commonMistake: 'Ignoring sudden changes in blow count that may indicate obstructions.',
    learningObjective: 'Penetration resistance increases with soil density and depth.'
  },
  {
    purpose: 'Confirm the pile has reached competent bearing material and cannot penetrate further.',
    userAction: 'Continue driving until refusal criteria are met, then confirm.',
    tools: ['Blow counter', 'Penetration gauge', 'Driving log'],
    qualityCheck: 'Last 10 blows produce less than 25mm total penetration.',
    commonMistake: 'Confusing refusal on a boulder with true bearing layer refusal.',
    learningObjective: 'Pile refusal criteria ensure adequate bearing capacity at the pile tip.'
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
scene.background = new THREE.Color(0x96b0bc);  // overcast construction site sky
scene.fog = new THREE.Fog(0x96b0bc, 45, 95);   // depth haze — distant elements fade naturally

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

// Cancel any camera preset transition the moment the user touches the camera
renderer.domElement.addEventListener('pointerdown', () => { camTarget = null; });
renderer.domElement.addEventListener('wheel',       () => { camTarget = null; }, { passive: true });

// Lighting — outdoor construction site daylight
const ambientLight = new THREE.AmbientLight(0xdce8f0, 1.1);   // cool overcast sky ambient
scene.add(ambientLight);

// Sun — warm, slightly from south-west
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

// Sky bounce — cool blue fill from opposite side
const fillLight = new THREE.DirectionalLight(0x90b8d0, 0.5);
fillLight.position.set(-20, 15, -10);
scene.add(fillLight);

// Ground bounce — warm reflected light from earth below
const groundBounce = new THREE.DirectionalLight(0xc8a870, 0.3);
groundBounce.position.set(0, -15, 5);
scene.add(groundBounce);

// Resize
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
    // Grid lines for precast concrete pile
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
  // Soil layer materials
  topsoil:   new THREE.MeshLambertMaterial({ color: 0x8B6340 }),
  softClay:  new THREE.MeshLambertMaterial({ color: 0x6B8E6E }),
  looseSand: new THREE.MeshLambertMaterial({ color: 0xD4A85A }),
  denseSand: new THREE.MeshLambertMaterial({ color: 0xC4843A }),
  bearing:   new THREE.MeshLambertMaterial({ color: 0x607080 }),
  // Rig materials
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
  // Markers
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
  flashWhite:   new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0, transparent: true, opacity: 0.9 })
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
}

/* ══════════════════════════════════════════════════════════════
   CAMERA PRESETS
══════════════════════════════════════════════════════════════ */

// Camera presets — all oriented to show the underground section prominently.
// Target y=-10 puts the centre of the soil profile in view.
const CAM_PRESETS = [
  { pos: new THREE.Vector3(16,  4, 22), look: new THREE.Vector3(0, -5, 0) },   // 0 investigation (surface + section)
  { pos: new THREE.Vector3(12,  8, 16), look: new THREE.Vector3(0,  0, 0) },   // 1 layout (ground plan)
  { pos: new THREE.Vector3(12,  6, 16), look: new THREE.Vector3(0,  5, 0) },   // 2 position pile (showing rig)
  { pos: new THREE.Vector3(9,   5, 13), look: new THREE.Vector3(0,  4, 0) },   // 3 alignment check
  { pos: new THREE.Vector3(18,  0, 24), look: new THREE.Vector3(0, -8, 0) },   // 4 drive pile (section view)
  { pos: new THREE.Vector3(18, -4, 24), look: new THREE.Vector3(0,-14, 0) },   // 5 pile refusal (deep section)
  { pos: new THREE.Vector3( 5,  6,  7), look: new THREE.Vector3(0,-1.5,0) }, // 6 formwork
  { pos: new THREE.Vector3( 3,  7,  5), look: new THREE.Vector3(0,-1.5,0) }, // 7 reinforcement
  { pos: new THREE.Vector3( 9,  4, 12), look: new THREE.Vector3(0,-1.5,0) }, // 8 concrete
  { pos: new THREE.Vector3( 8,  7, 11), look: new THREE.Vector3(0, 0,  0) }, // 9 inspection
  { pos: new THREE.Vector3( 4,  4,  6), look: new THREE.Vector3(0,-1,  0) }, // 10 curing
  { pos: new THREE.Vector3(10, 10, 13), look: new THREE.Vector3(0, 0,  0) }, // 11 final insp
  { pos: new THREE.Vector3( 8,  2, 11), look: new THREE.Vector3(0,-2,  0) }, // 12 pillar
  { pos: new THREE.Vector3( 7,  5,  9), look: new THREE.Vector3(0,-1,  0) }  // 13 backfill
];

let camTarget = null;

function setCamPreset(n) {
  const p = CAM_PRESETS[Math.min(n, CAM_PRESETS.length - 1)];
  camTarget = { pos: p.pos.clone(), look: p.look.clone() };
}

// Named view presets — names updated to engineering-first terminology
const VIEW_PRESETS = {
  iso:     { pos: new THREE.Vector3(20,  0, 26),  look: new THREE.Vector3(0, -10, 0) }, // Full section 3/4
  top:     { pos: new THREE.Vector3(0,  30,  1),  look: new THREE.Vector3(0,   0, 0) }, // Plan view
  front:   { pos: new THREE.Vector3(0,  -4, 28),  look: new THREE.Vector3(0, -10, 0) }, // Front elevation (full section)
  side:    { pos: new THREE.Vector3(28, -4,  0),  look: new THREE.Vector3(0, -10, 0) }, // Side elevation
  cutaway: { pos: new THREE.Vector3(14, -8, 20),  look: new THREE.Vector3(0, -14, 0) }, // Deep section (bearing layer visible)
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

  // Procedural compacted gravel/mud texture
  const gravelCanvas = document.createElement('canvas');
  gravelCanvas.width = gravelCanvas.height = 512;
  const gc = gravelCanvas.getContext('2d');

  // Base compacted mud color
  gc.fillStyle = '#5a4a35';
  gc.fillRect(0, 0, 512, 512);

  // Gravel stones — varied browns and grays
  const stoneColors = ['#7a6548','#6b5840','#8a7558','#4e3e2a','#9a8768','#3e3028','#857060'];
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const rx = 3 + Math.random() * 9, ry = 2 + Math.random() * 6;
    gc.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
    gc.beginPath();
    gc.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    gc.fill();
  }
  // Tyre track ruts — two parallel dark bands
  gc.fillStyle = 'rgba(30,20,10,0.35)';
  gc.fillRect(60, 0, 30, 512);
  gc.fillRect(160, 0, 25, 512);
  // Mud puddle patches
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

  // Extended 36×36m site footprint — leaves front-right quadrant (x:0→6, z:0→6) open for cutaway
  // Piece 1: Full left (x:-18→0, z:-18→18)
  const m1 = new THREE.Mesh(new THREE.PlaneGeometry(18, 36), surfMat);
  m1.rotation.x = -Math.PI / 2; m1.position.set(-9, 0.005, 0); m1.receiveShadow = true;
  groundGroup.add(m1);

  // Piece 2: Right back (x:0→18, z:-18→0)
  const m2 = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), surfMat);
  m2.rotation.x = -Math.PI / 2; m2.position.set(9, 0.005, -9); m2.receiveShadow = true;
  groundGroup.add(m2);

  // Piece 3: Right front past cutaway (x:6→18, z:0→18)
  const m3 = new THREE.Mesh(new THREE.PlaneGeometry(12, 18), surfMat);
  m3.rotation.x = -Math.PI / 2; m3.position.set(12, 0.005, 9); m3.receiveShadow = true;
  groundGroup.add(m3);

  // Piece 4: Narrow strip (x:0→6, z:6→18)
  const m4 = new THREE.Mesh(new THREE.PlaneGeometry(6, 12), surfMat);
  m4.rotation.x = -Math.PI / 2; m4.position.set(3, 0.005, 12); m4.receiveShadow = true;
  groundGroup.add(m4);

  // Grade-level edge lines — amber hairlines marking the cut face at y≈0
  const edgeMat = new THREE.MeshLambertMaterial({ color: 0xf5a623 });
  const ex = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.05), edgeMat);
  ex.position.set(3, 0.025, 0); groundGroup.add(ex);
  const ez = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 6), edgeMat);
  ez.position.set(0, 0.025, 3); groundGroup.add(ez);
}

/* ── Construction site elements ─────────────────────────────────
   Added once at init; positioned at site edges visible from the
   default camera (18, 2, 24) without blocking the cutaway section.
───────────────────────────────────────────────────────────────── */
let siteGroup = null;

function buildSiteElements() {
  if (siteGroup) { scene.remove(siteGroup); }
  siteGroup = new THREE.Group();
  scene.add(siteGroup);

  const matBarrier  = new THREE.MeshLambertMaterial({ color: 0xd0d0d0 });   // concrete K-rail
  const matBarrierS = new THREE.MeshLambertMaterial({ color: 0xb0b0b0 });   // barrier side
  const matTrailer  = new THREE.MeshLambertMaterial({ color: 0x4a7c9e });   // portakabin blue
  const matRoof     = new THREE.MeshLambertMaterial({ color: 0x3a6080 });
  const matWindow   = new THREE.MeshLambertMaterial({ color: 0x8ec4e8, transparent: true, opacity: 0.7 });
  const matSpoil    = new THREE.MeshLambertMaterial({ color: 0x7a5c35 });   // excavated earth
  const matRebar    = new THREE.MeshLambertMaterial({ color: 0x607d8b });
  const matAggreg   = new THREE.MeshLambertMaterial({ color: 0xb8a882 });   // aggregate/sand pile
  const matHoardDk  = new THREE.MeshLambertMaterial({ color: 0x1a3a5c, side: THREE.DoubleSide });
  const matHoardLt  = new THREE.MeshLambertMaterial({ color: 0xf5a623 });   // hoarding stripe

  // ── Jersey K-barriers along the left and back perimeter ──────
  // Each barrier: 1.0m tall, 0.4m wide, 1.2m long, slightly tapered top
  function addBarrier(x, z, rotY) {
    const g = new THREE.Group();
    // Base slab
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.5), matBarrier);
    base.position.y = 0.15; g.add(base);
    // Upper tapered body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.36), matBarrier);
    body.position.y = 0.6; g.add(body);
    // Top cap
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.24), matBarrierS);
    top.position.y = 0.96; g.add(top);
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    siteGroup.add(g);
  }

  // Back row (z = -15): x from -14 to +14
  for (let x = -14; x <= 14; x += 2.2) addBarrier(x, -15, 0);
  // Left row (x = -15): z from -14 to +14
  for (let z = -13; z <= 14; z += 2.2) addBarrier(-15, z, Math.PI / 2);

  // ── Site hoarding board (back-left corner signage) ────────────
  const hBoard = new THREE.Mesh(new THREE.BoxGeometry(8, 2.5, 0.12), matHoardDk);
  hBoard.position.set(-8, 1.25, -15.1);
  siteGroup.add(hBoard);
  // Amber stripe along top of hoarding
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(8, 0.35, 0.14), matHoardLt);
  stripe.position.set(-8, 2.4, -15.08);
  siteGroup.add(stripe);

  // ── Portakabin / site office — back-right corner ──────────────
  // x=10, z=-12
  const cabin = new THREE.Group();
  cabin.position.set(12, 0, -12);
  // Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.4, 2.5), matTrailer);
  walls.position.y = 1.2; cabin.add(walls);
  // Roof (flat)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.12, 2.7), matRoof);
  roof.position.y = 2.46; cabin.add(roof);
  // Windows (2)
  const winG = new THREE.BoxGeometry(0.9, 0.8, 0.1);
  const w1 = new THREE.Mesh(winG, matWindow); w1.position.set(-1.4, 1.3, 1.26); cabin.add(w1);
  const w2 = new THREE.Mesh(winG, matWindow); w2.position.set( 0.4, 1.3, 1.26); cabin.add(w2);
  // Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.1), matBarrierS);
  door.position.set(1.5, 0.9, 1.26); cabin.add(door);
  siteGroup.add(cabin);

  // ── Spoil heap (excavated earth) — front-right ───────────────
  // SphereGeometry squished to form a mound; x=14, z=10
  const spoilGeo = new THREE.SphereGeometry(2.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const spoil = new THREE.Mesh(spoilGeo, matSpoil);
  spoil.position.set(14, 0, 12);
  spoil.scale.set(1.2, 0.55, 0.9);
  spoil.castShadow = true;
  siteGroup.add(spoil);
  // Second smaller mound alongside
  const spoil2 = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    matSpoil
  );
  spoil2.position.set(16.2, 0, 10.5);
  spoil2.scale.set(1, 0.45, 0.85);
  siteGroup.add(spoil2);

  // ── Aggregate / sand pile — left side mid ─────────────────────
  const sandGeo = new THREE.SphereGeometry(1.8, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const sandPile = new THREE.Mesh(sandGeo, matAggreg);
  sandPile.position.set(-12, 0, 6);
  sandPile.scale.set(1.1, 0.5, 0.9);
  sandPile.castShadow = true;
  siteGroup.add(sandPile);

  // ── Rebar stockpile — left side near hoarding ────────────────
  // Bundle of rebar bars laid horizontally
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

  // ── Concrete pipe / culvert segments stacked — right mid ──────
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

  // ── Safety cones — scattered around the work zone ─────────────
  const coneMat = new THREE.MeshLambertMaterial({ color: 0xff5500 });
  const coneWhite = new THREE.MeshLambertMaterial({ color: 0xffffff });
  function addCone(x, z) {
    const cg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 8), coneMat);
    body.position.y = 0.28; cg.add(body);
    // White reflective band
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.06, 8), coneWhite);
    band.position.y = 0.22; cg.add(band);
    // Base plate
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

  // ── Steel I-beam sections leaning on barrier (back-right) ─────
  const beamMat = new THREE.MeshLambertMaterial({ color: 0x546e7a });
  for (let i = 0; i < 4; i++) {
    const beam = new THREE.Group();
    // Web
    const web = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.5, 0.18), beamMat);
    beam.add(web);
    // Top flange
    const tf = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.18), beamMat);
    tf.position.y = 1.73; beam.add(tf);
    // Bottom flange
    const bf = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.18), beamMat);
    bf.position.y = -1.73; beam.add(bf);
    // Lean it slightly
    beam.rotation.z = 0.15;
    beam.position.set(8 + i * 0.3, 1.75 - i * 0.02, -13.5);
    siteGroup.add(beam);
  }
}

function buildSoilLayers() {
  while (soilLayerGroup.children.length) soilLayerGroup.remove(soilLayerGroup.children[0]);

  const fullSize = 12;   // 12m × 12m footprint
  const half     = fullSize / 2;   // 6

  // Soil layer definitions with engineering colors
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

    // Left half: x –6→0, z –6→+6
    const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(half, h, fullSize), mat);
    leftMesh.position.set(-half / 2, cy, 0);
    leftMesh.receiveShadow = true;
    soilLayerGroup.add(leftMesh);

    // Back-right quarter: x 0→+6, z –6→0
    const brMesh = new THREE.Mesh(new THREE.BoxGeometry(half, h, half), mat);
    brMesh.position.set(half / 2, cy, -half / 2);
    brMesh.receiveShadow = true;
    soilLayerGroup.add(brMesh);

    // Thin boundary line at top of each layer (except surface — amber edge handles that)
    if (l.yTop < 0) {
      const lineMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      // Across the left half face
      const bl = new THREE.Mesh(new THREE.BoxGeometry(half, 0.04, fullSize), lineMat);
      bl.position.set(-half / 2, l.yTop, 0);
      soilLayerGroup.add(bl);
      // Across the back-right quarter
      const br2 = new THREE.Mesh(new THREE.BoxGeometry(half, 0.04, half), lineMat);
      br2.position.set(half / 2, l.yTop, -half / 2);
      soilLayerGroup.add(br2);
    }

    // Engineering label sprite on the exposed cutaway face
    const W = 380, H = 80;
    const lc = document.createElement('canvas');
    lc.width = W; lc.height = H;
    const ctx = lc.getContext('2d');

    // Background
    ctx.fillStyle = 'rgba(17,24,37,0.92)';
    ctx.fillRect(0, 0, W, H);

    // Left color strip matching soil layer
    ctx.fillStyle = l.hex;
    ctx.fillRect(0, 0, 8, H);

    // Layer name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(l.label, 20, 32);

    // Depth range
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px monospace';
    ctx.fillText(l.range, 20, 58);

    // SPT value on right
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

  // Depth scale ruler on the cutaway edge (x=6, z=0)
  const rulerMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.05, 22, 0.05), rulerMat);
  ruler.position.set(6.05, -11, 0);
  soilLayerGroup.add(ruler);

  for (let d = 0; d <= 22; d += 2) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.05), rulerMat);
    tick.position.set(6.2, -d, 0);
    soilLayerGroup.add(tick);

    // Depth label every 4m
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

  // Ground Level marker
  const glc = document.createElement('canvas');
  glc.width = 320; glc.height = 48;
  const glctx = glc.getContext('2d');
  glctx.fillStyle = '#f5a623';
  glctx.fillRect(0, 0, 320, 48);
  glctx.fillStyle = '#111827';
  glctx.font = 'bold 24px monospace';
  glctx.textAlign = 'center';
  glctx.fillText('▶ GROUND LEVEL  ±0.0m', 160, 32);
  const glsp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glc), transparent: true, depthTest: false }));
  glsp.scale.set(3.6, 0.54, 1);
  glsp.position.set(9.2, 0.4, -1.5);
  soilLayerGroup.add(glsp);
}

// Decorative trees removed — engineering visualization does not need landscaping

// Site fencing removed — not educational, creates visual noise

/* ══════════════════════════════════════════════════════════════
   3D BUILDERS
══════════════════════════════════════════════════════════════ */

function buildDrivingRig(x, z) {
  const rig = new THREE.Group();

  // Tracks — two long flat boxes
  const trackGeo = new THREE.BoxGeometry(1.2, 0.5, 5);
  const trackL = new THREE.Mesh(trackGeo, MAT.trackDark);
  trackL.position.set(-1.2, 0.25, z - 1);
  trackL.castShadow = true;
  rig.add(trackL);

  const trackR = new THREE.Mesh(trackGeo, MAT.trackDark);
  trackR.position.set(1.2, 0.25, z - 1);
  trackR.castShadow = true;
  rig.add(trackR);

  // Track rollers
  for (let side = -1; side <= 1; side += 2) {
    for (let i = -2; i <= 2; i++) {
      const roller = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8),
        MAT.darkGray
      );
      roller.rotation.z = Math.PI / 2;
      roller.position.set(side * 1.2, 0.22, z - 1 + i * 0.9);
      rig.add(roller);
    }
  }

  // Track shoes (treads)
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 10; i++) {
      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.08, 0.12),
        MAT.darkGray
      );
      shoe.position.set(side * 1.2, 0.52, z - 3.2 + i * 0.5);
      rig.add(shoe);
    }
  }

  // Cab (crane body) — sits on top of tracks
  const cabBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.8, 3),
    MAT.rigYellow
  );
  cabBody.position.set(0, 1.4, z - 1);
  cabBody.castShadow = true;
  rig.add(cabBody);

  // Cab roof
  const cabRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.15, 1.6),
    MAT.rigDarkYellow
  );
  cabRoof.position.set(-0.3, 2.4, z + 0.3);
  rig.add(cabRoof);

  // Cab window
  const cabWindow = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.8, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 })
  );
  cabWindow.position.set(0, 2.0, z + 0.56);
  rig.add(cabWindow);

  // Engine compartment
  const engine = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.2, 1.5),
    MAT.rigDarkYellow
  );
  engine.position.set(0, 1.1, z - 2.3);
  engine.castShadow = true;
  rig.add(engine);

  // Exhaust pipe
  const exhaust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6),
    MAT.darkGray
  );
  exhaust.position.set(1.0, 2.2, z - 2.3);
  rig.add(exhaust);

  // Mast — tall vertical structure
  const mastGeo = new THREE.BoxGeometry(0.4, 18, 0.4);
  const mast = new THREE.Mesh(mastGeo, MAT.rigYellow);
  mast.position.set(x, 9.5, z);
  mast.castShadow = true;
  rig.add(mast);

  // Mast top cap
  const mastCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.3, 0.8),
    MAT.rigDarkYellow
  );
  mastCap.position.set(x, 18.65, z);
  rig.add(mastCap);

  // Sheave at top
  const sheave = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12),
    MAT.darkGray
  );
  sheave.rotation.x = Math.PI / 2;
  sheave.position.set(x, 18.3, z);
  rig.add(sheave);

  // Leads (guide rails) — two thin vertical bars on either side
  const leadGeo = new THREE.BoxGeometry(0.12, 18, 0.12);
  const leadL = new THREE.Mesh(leadGeo, MAT.cabGray);
  leadL.position.set(x - 0.5, 9.5, z);
  leadL.castShadow = true;
  rig.add(leadL);

  const leadR = new THREE.Mesh(leadGeo, MAT.cabGray);
  leadR.position.set(x + 0.5, 9.5, z);
  leadR.castShadow = true;
  rig.add(leadR);

  // Cross braces on leads
  for (let cy = 2; cy < 18; cy += 3) {
    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.08, 0.08),
      MAT.cabGray
    );
    brace.position.set(x, cy, z);
    rig.add(brace);
  }

  // Backstay cables (angled supports from mast top to cab)
  const cableGeo = new THREE.CylinderGeometry(0.03, 0.03, 14, 4);
  const cableL = new THREE.Mesh(cableGeo, MAT.darkGray);
  cableL.position.set(x - 0.8, 11, z - 2);
  cableL.rotation.z = 0.15;
  cableL.rotation.x = 0.3;
  rig.add(cableL);

  const cableR = new THREE.Mesh(cableGeo, MAT.darkGray);
  cableR.position.set(x + 0.8, 11, z - 2);
  cableR.rotation.z = -0.15;
  cableR.rotation.x = 0.3;
  rig.add(cableR);

  // Hammer — heavy block that slides on leads
  const hammerGroup = new THREE.Group();
  const hammerBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.5, 1.0),
    MAT.hammerGray
  );
  hammerBody.castShadow = true;
  hammerGroup.add(hammerBody);

  // Hammer cap
  const hammerCap = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.2, 1.1),
    MAT.darkGray
  );
  hammerCap.position.y = 0.85;
  hammerGroup.add(hammerCap);

  // Hammer hook connection
  const hook = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6),
    MAT.darkGray
  );
  hook.position.y = 1.3;
  hammerGroup.add(hook);

  // Hammer anvil/cushion at bottom
  const cushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.2, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x884400 })
  );
  cushion.position.y = -0.85;
  hammerGroup.add(cushion);

  hammerGroup.position.set(x, 16, z);
  rig.add(hammerGroup);
  OBJ.hammer = hammerGroup;

  // Impact flash — hidden until needed
  const flashGeo = new THREE.SphereGeometry(0.6, 8, 8);
  const flash = new THREE.Mesh(flashGeo, MAT.flashWhite.clone());
  flash.visible = false;
  flash.position.set(x, 0, z);
  rig.add(flash);
  OBJ.impactFlash = flash;

  rig.position.x = 0;
  return rig;
}

function buildPile(horizontal) {
  // Precast concrete cylinder pile — 400 mm diameter, 20 m long (pre-cut to design length; no head cutting needed)
  const pileGroup = new THREE.Group();

  // Concrete shaft — CylinderGeometry for proper round pile
  const pileGeo = new THREE.CylinderGeometry(0.22, 0.22, 20, 20);
  const pileMesh = new THREE.Mesh(pileGeo, MAT.concrete);
  pileMesh.castShadow = true;
  pileMesh.receiveShadow = true;
  pileGroup.add(pileMesh);

  // 4 longitudinal rebar stubs visible at pile top (embedded later into pile cap)
  for (let dx = -1; dx <= 1; dx += 2) {
    for (let dz = -1; dz <= 1; dz += 2) {
      const rebar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6),
        MAT.rebarSteel
      );
      rebar.position.set(dx * 0.1, 10.02, dz * 0.1);
      pileGroup.add(rebar);
    }
  }

  // Steel driving shoe at pile tip
  const tipGeo = new THREE.ConeGeometry(0.22, 0.55, 20);
  const tip = new THREE.Mesh(tipGeo, MAT.steel);
  tip.position.y = -10.28;
  pileGroup.add(tip);

  if (horizontal) {
    pileGroup.rotation.z = Math.PI / 2;
    pileGroup.position.set(6, 0.25, 3);
  }

  return pileGroup;
}

function buildPileCapMesh() {
  // Pile cap: 6.5 x 1.2 x 6.5 m, center buried at y = -0.6 (spans y=-1.2 to y=0)
  const capGroup = new THREE.Group();
  const capGeo = new THREE.BoxGeometry(6.5, 1.2, 6.5);
  const cap = new THREE.Mesh(capGeo, MAT.concrete);
  cap.castShadow = true;
  cap.receiveShadow = true;
  cap.position.y = -0.6;  // centered below grade
  capGroup.add(cap);

  // Small pedestal above cap where column will sit
  const ped = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.4, 1.2),
    MAT.concrete
  );
  ped.position.y = 0.2;  // sits on top of cap, at grade level
  capGroup.add(ped);

  return capGroup;
}

function buildPilesForStep() {
  const depth    = STATE.drivenDepth > 0 ? STATE.drivenDepth : 17;
  const PIT_DEPTH  = 5.0;   // excavation depth
  const STUB      = 0.4;    // how far pile top sits above pit floor (below rebar mat)
  // Pile top sits at y = -(PIT_DEPTH - STUB) = -4.6
  // Pile spans from y = -depth to y = -4.6
  const pileTop = -(PIT_DEPTH - STUB);          // -4.6
  const pileLen = depth - PIT_DEPTH + STUB;      // e.g. 17 - 5 + 0.4 = 12.4

  const positions = [[-2.5,-2.5],[2.5,-2.5],[-2.5,2.5],[2.5,2.5]];
  positions.forEach(([px, pz]) => {
    const grp = new THREE.Group();

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, pileLen, 16), MAT.concreteDark);
    shaft.castShadow = true;
    grp.add(shaft);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 16), MAT.steel);
    tip.position.y = -(pileLen / 2) - 0.25;
    grp.add(tip);

    // Short rebar stubs just above the pile top (into the future rebar mat)
    for (let dx = -1; dx <= 1; dx += 2) {
      for (let dz = -1; dz <= 1; dz += 2) {
        const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), MAT.rebarSteel);
        r.position.set(dx * 0.09, pileLen / 2 + 0.25, dz * 0.09);
        grp.add(r);
      }
    }

    // Position group: top of shaft at pileTop (y=-4.6)
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

  // Slider → camera: keep direction, change radius
  slider.addEventListener('input', () => {
    camTarget = null;   // stop any in-flight preset transition
    const dist = parseFloat(slider.value);
    const dir  = new THREE.Vector3()
      .subVectors(camera.position, controls.target)
      .normalize();
    camera.position.copy(controls.target).addScaledVector(dir, dist);
  });

  // Slider value is refreshed in the animate loop (see below)
}

// Thin amber line marking ground level across the cutaway opening — engineering grade marker
function buildGradeLine() {
  const mat = new THREE.MeshLambertMaterial({ color: 0xf5a623, emissive: 0xf5a623, emissiveIntensity: 0.35 });
  // Line across the full cutaway front face (x: -6→+6, z=0)
  const hLine = new THREE.Mesh(new THREE.BoxGeometry(12, 0.06, 0.06), mat);
  hLine.position.set(0, 0, 0);
  scene.add(hLine);
  persistObjs.push(hLine);
  // Line across the right side face (z: -6→0, x=6)
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

  // For shallow foundation steps (6+), hide pile cutaway and show already-excavated pit
  if (n >= 6) {
    soilLayerGroup.visible = false;
    STATE.excavationComplete = true;   // pit is already dug when shallow steps begin
    buildGroundWithHole();
  } else {
    soilLayerGroup.visible = true;
  }

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
    const actualDepth = STATE.drivenDepth.toFixed(1);
    rc.innerHTML = `
      <div id="result-icon">🏗️</div>
      <h2>Driven Pile Foundation Complete!</h2>
      <p>All 4 piles driven to bearing layer with pile cap constructed.</p>
      <div id="result-score-line">Final Score: <span id="result-score">${STATE.score}</span></div>
      <div id="result-grade">${getGrade()}</div>
      <div class="pile-report">
        <h3 style="color:#f5a623;margin-bottom:10px;">Construction Report</h3>
        <table style="width:100%;text-align:left;font-size:0.85rem;">
          <tr><td style="color:#aaa;">Pile Type:</td><td>Precast Concrete</td></tr>
          <tr><td style="color:#aaa;">Pile Size:</td><td>500mm x 500mm</td></tr>
          <tr><td style="color:#aaa;">Design Depth:</td><td>17.0m</td></tr>
          <tr><td style="color:#aaa;">Actual Depth:</td><td>${actualDepth}m</td></tr>
          <tr><td style="color:#aaa;">Total Blows:</td><td>${STATE.totalBlows}</td></tr>
          <tr><td style="color:#aaa;">Refusal Criterion:</td><td style="color:#27ae60;">&lt;25mm/10 blows - ACHIEVED</td></tr>
          <tr><td style="color:#aaa;">Alignment Error:</td><td style="color:#27ae60;">&lt;0.5° - PASS</td></tr>
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
        1. <a href="https://www.fhwa.dot.gov/engineering/geotech/foundations/driven_piles/" target="_blank">FHWA - Driven Pile Foundations</a><br/>
        2. <a href="https://www.piledrivers.org/" target="_blank">Pile Driving Contractors Association</a>
      </div>
    `;
  }
  DOM.resultOverlay().classList.remove('hidden');
}

function getGrade() {
  if (STATE.score >= 900)      return 'Master Pile Driver!';
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
  // Remove any scene-level persistent objects before resetting
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

  // Camera lerp — smoothly move to preset
  if (camTarget) {
    camera.position.lerp(camTarget.pos, 0.04);
    controls.target.lerp(camTarget.look, 0.04);
    // Stop lerping when close enough
    if (camera.position.distanceTo(camTarget.pos) < 0.02 &&
        controls.target.distanceTo(camTarget.look) < 0.02) {
      camTarget = null;
    }
  }

  // Pulse clickable markers
  clickables3D.forEach(c => {
    if (c.pulse && c.mesh) {
      const s = 1 + 0.18 * Math.sin(elapsed * 3 + (c.phase || 0));
      c.mesh.scale.setScalar(s);
    }
  });

  // Hammer animation during driving
  if (OBJ.hammerAnimating && OBJ.hammer) {
    // Handled in the step handler via intervals
  }

  // Excavator arm dig animation
  if (OBJ.excavatorArm && STATE.stepState.digging) {
    OBJ.excavatorArm.rotation.z   = -0.62 + 0.38 * Math.sin(elapsed * 3.2);
    if (OBJ.excavatorStick)  OBJ.excavatorStick.rotation.z  = 0.48 + 0.22 * Math.sin(elapsed * 3.2 + 0.5);
    if (OBJ.excavatorBucket) OBJ.excavatorBucket.rotation.z = -0.42 - 0.3 * Math.sin(elapsed * 3.2 + 1.1);
    if (OBJ.excavatorUpper) OBJ.excavatorUpper.rotation.y = 0.18 * Math.sin(elapsed * 0.45);
  }

  // Truck drum rotation
  if (OBJ.truckDrum) {
    OBJ.truckDrum.rotation.y += 0.018;
  }

  // Inspector bob
  if (OBJ.inspector) {
    OBJ.inspector.position.y = 0 + 0.05 * Math.sin(elapsed * 1.5);
  }

  // Particle update
  updateParticles(dt);

  // Keep zoom slider thumb in sync with actual camera distance
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

  // Use cloned materials with polygonOffset to prevent z-fighting
  const grassMat = MAT.grass.clone();
  grassMat.polygonOffset = true; grassMat.polygonOffsetFactor = 2; grassMat.polygonOffsetUnits = 2;
  const dirtMat = MAT.dirt.clone();
  dirtMat.polygonOffset = true; dirtMat.polygonOffsetFactor = 1; dirtMat.polygonOffsetUnits = 1;

  // 8×8m pit hole centred at origin — large enough for 6.5×6.5m pile cap + working space
  const half = 4.0;
  const total = 15;
  const edge = total - half; // 11

  // 4 grass pieces surrounding the pit hole
  const pieces = [
    { w: total * 2, d: edge,  x:    0,    z: -(half + edge / 2) }, // North
    { w: total * 2, d: edge,  x:    0,    z:  (half + edge / 2) }, // South
    { w: edge,      d: half * 2, x: -(half + edge / 2), z: 0    }, // West
    { w: edge,      d: half * 2, x:  (half + edge / 2), z: 0    }  // East
  ];
  pieces.forEach(p => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.d), grassMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, 0.002, p.z);
    m.receiveShadow = true;
    groundGroup.add(m);
  });

  // Pit walls — 8×8 opening, 5 units deep
  const wallThick = 0.25;
  const wallDefs = [
    { w: half * 2,  h: 5, d: wallThick, x:  0,                   y: -2.5, z: -(half + wallThick / 2) }, // N
    { w: half * 2,  h: 5, d: wallThick, x:  0,                   y: -2.5, z:  (half + wallThick / 2) }, // S
    { w: wallThick, h: 5, d: half * 2,  x: -(half + wallThick/2), y: -2.5, z:  0                     }, // W
    { w: wallThick, h: 5, d: half * 2,  x:  (half + wallThick/2), y: -2.5, z:  0                     }  // E
  ];
  wallDefs.forEach(w => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), dirtMat);
    m.position.set(w.x, w.y, w.z);
    m.receiveShadow = true; m.castShadow = true;
    groundGroup.add(m);
  });

  // Pit floor — near grade while excavating, at full depth once done
  const pitY = STATE.excavationComplete ? -5.0 : -0.1;
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(half * 2 - 0.1, 0.15, half * 2 - 0.1), dirtMat);
  floorMesh.position.set(0, pitY, 0);
  floorMesh.receiveShadow = true;
  groundGroup.add(floorMesh);
  OBJ.pitFloor = floorMesh;
}

function buildPitStructure() {
  // Reuses existing groundGroup hole. Just provides semantic label.
}

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

  // Main mound
  const mound = new THREE.Mesh(
    new THREE.SphereGeometry(1.6 * p + 0.25, 9, 6),
    MAT.dirt.clone()
  );
  mound.scale.y = 0.45;
  mound.castShadow = true;
  sg.add(mound);

  // Smaller secondary mound
  const mound2 = new THREE.Mesh(
    new THREE.SphereGeometry((0.9 * p + 0.15), 7, 5),
    MAT.dirt.clone()
  );
  mound2.scale.y = 0.4;
  mound2.position.set(1.2 * p, 0, 0.4 * p);
  mound2.castShadow = true;
  sg.add(mound2);

  // Scattered rocks on pile
  for (let i = 0; i < 4; i++) {
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1 + Math.random() * 0.09, 0),
      new THREE.MeshLambertMaterial({ color: 0x78909c })
    );
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

  // Vertical pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 5.5, 6),
    MAT.rulerWhite
  );
  pole.position.y = -2.75;
  rg.add(pole);

  // Tick marks at 0m, 0.5m … 5m
  for (let d = 0; d <= 5; d += 0.5) {
    const isMajor = d % 1 === 0;
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(isMajor ? 0.36 : 0.22, 0.05, 0.05),
      d === 5 ? MAT.rulerRed : MAT.rulerWhite
    );
    tick.position.y = -d;
    rg.add(tick);
  }

  addStep(rg);
  OBJ.depthRuler = rg;
  return rg;
}

function buildPourStream() {
  const streamMat = new THREE.MeshLambertMaterial({
    color: 0xbdbdbd, transparent: true, opacity: 0.75
  });
  // Main stream cylinder
  const stream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.16, 2.8, 6),
    streamMat
  );
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

  // Engine block
  const eng = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.58, 0.65), RED);
  eng.position.y = 0.55;
  eng.castShadow = true;
  cg.add(eng);

  // Engine hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), GRY);
  hood.position.y = 0.88;
  cg.add(hood);

  // Base plate (vibrating plate)
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 1.1), GRY);
  plate.position.y = 0.06;
  plate.castShadow = true;
  cg.add(plate);

  // Handle bar
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), GRY);
  bar.rotation.x = -Math.PI / 4;
  bar.position.set(0, 0.9, -0.6);
  cg.add(bar);
  const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), GRY);
  crossBar.rotation.z = Math.PI / 2;
  crossBar.position.set(0, 1.62, -1.0);
  cg.add(crossBar);

  cg.position.set(x, 0, z);
  addStep(cg);
  OBJ.compactor = cg;
  return cg;
}

function buildFormwork3D() {
  const panels = [
    { w: 5,    h: 5, d: 0.14, x:  0,     y: -2.5, z: -2.43 }, // N
    { w: 5,    h: 5, d: 0.14, x:  0,     y: -2.5, z:  2.43 }, // S
    { w: 0.14, h: 5, d: 4.72, x: -2.43,  y: -2.5, z:  0    }, // W
    { w: 0.14, h: 5, d: 4.72, x:  2.43,  y: -2.5, z:  0    }  // E
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
  // Vertical bars
  corners.forEach(([x, z]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, height, 6), MAT.steel);
    m.position.set(x, baseY + height / 2, z);
    m.castShadow = true;
    addStep(m);
  });
  // Horizontal stirrups every 0.8 units
  const stirrupMat = MAT.steel;
  const stirrupY = [];
  for (let y = baseY + 0.3; y < baseY + height - 0.1; y += 0.8) stirrupY.push(y);
  stirrupY.forEach(y => {
    // 4 sides of the square stirrup
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
  // 11 bars per direction at 0.4 unit spacing — tight square-cell grid like real shallow foundation
  const barPositions = [-2.0, -1.6, -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6, 2.0];
  const barLen = 4.5;
  const yLow  = -4.90;   // lower mat
  const yHigh = -4.83;   // upper mat crossing on top

  // Concrete spacer chairs — small blocks that lift the lower mat off the pit floor
  // Placed at a 3×3 grid of positions across the mat
  const chairXZ = [-1.5, 0, 1.5];
  const chairMat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });
  chairXZ.forEach(cx => {
    chairXZ.forEach(cz => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.10, 0.13), chairMat);
      c.position.set(cx, -4.95, cz);
      addStep(c);
    });
  });

  // Lower mat: bars running along X axis (spaced in Z)
  barPositions.forEach(z => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, barLen, 8), MAT.steel);
    m.rotation.z = Math.PI / 2;
    m.position.set(0, yLow, z);
    m.castShadow = true;
    addStep(m);
  });

  // Upper mat: bars running along Z axis (spaced in X) — rotation.x = PI/2 so they lie flat
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

  // ── John Deere colour palette ─────────────────────────────
  const JDyellow  = new THREE.MeshStandardMaterial({ color: 0xf0d000, roughness: 0.55, metalness: 0.10 });
  const JDyellowD = new THREE.MeshStandardMaterial({ color: 0xc8ac00, roughness: 0.60, metalness: 0.12 });
  const JDblack   = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.55, metalness: 0.40 });
  const JDdkGray  = new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.50, metalness: 0.55 });
  const chrome    = new THREE.MeshStandardMaterial({ color: 0xb8c4c8, roughness: 0.18, metalness: 0.90 });
  const glass     = new THREE.MeshStandardMaterial({ color: 0x9dd4e8, roughness: 0.04, metalness: 0.05, transparent: true, opacity: 0.50 });
  const rubber    = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.94, metalness: 0.00 });
  const steelMid  = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.52, metalness: 0.62 });

  /* ── UNDERCARRIAGE ──────────────────────────────────────── */

  // Centre X-frame
  const xBeam = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.38, 3.80), JDblack);
  xBeam.position.y = 0.54;
  xBeam.castShadow = true;
  g.add(xBeam);
  [-1.15, 1.15].forEach(z => {
    const br = new THREE.Mesh(new THREE.BoxGeometry(3.10, 0.22, 0.46), JDblack);
    br.position.set(0, 0.54, z);
    g.add(br);
  });

  const makeTrack = zOff => {
    const tg = new THREE.Group();
    tg.position.z = zOff;

    // Main rubber belt
    const belt = new THREE.Mesh(new THREE.BoxGeometry(4.50, 0.30, 0.72), rubber);
    belt.position.y = 0.24;
    belt.castShadow = true;
    tg.add(belt);

    // Track shoes (segmented links on belt surface)
    for (let i = -7; i <= 7; i++) {
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.76), JDblack);
      shoe.position.set(i * 0.30, 0.40, 0);
      tg.add(shoe);
    }
    // Track grouser ridges on each shoe
    for (let i = -7; i <= 7; i++) {
      const gr = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.78), JDdkGray);
      gr.position.set(i * 0.30, 0.47, 0);
      tg.add(gr);
    }

    // Drive sprocket (rear) — large toothed wheel
    const sprR = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.66, 12), JDblack);
    sprR.rotation.x = Math.PI / 2;
    sprR.position.set(1.90, 0.36, 0);
    sprR.castShadow = true;
    tg.add(sprR);
    for (let t = 0; t < 10; t++) {
      const a = (t / 10) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.20, 0.62), JDdkGray);
      tooth.position.set(1.90 + Math.cos(a) * 0.43, 0.36 + Math.sin(a) * 0.43, 0);
      tooth.rotation.z = a;
      tg.add(tooth);
    }
    const sprHub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.70, 8), chrome);
    sprHub.rotation.x = Math.PI / 2;
    sprHub.position.set(1.90, 0.36, 0);
    tg.add(sprHub);

    // Front idler wheel
    const idler = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.62, 14), JDdkGray);
    idler.rotation.x = Math.PI / 2;
    idler.position.set(-1.90, 0.32, 0);
    idler.castShadow = true;
    tg.add(idler);
    const idlerHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.66, 8), chrome);
    idlerHub.rotation.x = Math.PI / 2;
    idlerHub.position.set(-1.90, 0.32, 0);
    tg.add(idlerHub);

    // Bottom rollers (6 — more than before for realism)
    [-1.2, -0.72, -0.24, 0.24, 0.72, 1.2].forEach(x => {
      const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.160, 0.160, 0.56, 12), JDblack);
      rl.rotation.x = Math.PI / 2;
      rl.position.set(x, 0.160, 0);
      tg.add(rl);
    });

    // Top carrier rollers (2)
    [-0.55, 0.65].forEach(x => {
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.52, 10), JDdkGray);
      cr.rotation.x = Math.PI / 2;
      cr.position.set(x, 0.66, 0);
      tg.add(cr);
    });

    // Track guard plate
    const guard = new THREE.Mesh(new THREE.BoxGeometry(4.30, 0.10, 0.80), JDblack);
    guard.position.y = 0.78;
    tg.add(guard);
    // Front & rear guard lips
    [-2.15, 2.15].forEach(x => {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.80), JDblack);
      lip.position.set(x, 0.67, 0);
      tg.add(lip);
    });

    return tg;
  };
  g.add(makeTrack(-1.65));
  g.add(makeTrack( 1.65));

  /* ── UPPER STRUCTURE ────────────────────────────────────── */
  const upper = new THREE.Group();
  upper.position.y = 0.82;
  g.add(upper);

  // Slewing ring
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.16, 18), JDdkGray);
  ring.position.y = -0.08;
  upper.add(ring);

  // Main deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.80, 0.14, 2.30), JDyellowD);
  deck.position.set(-0.10, 0.07, 0);
  deck.castShadow = true;
  upper.add(deck);

  // Engine/body compartment — longer and taller (JD body is substantial)
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.88, 1.80), JDyellow);
  body.position.set(-0.42, 0.58, 0);
  body.castShadow = true;
  upper.add(body);
  // Body top hood (slightly darker panel)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.14, 1.74), JDyellowD);
  hood.position.set(-0.42, 1.09, 0);
  upper.add(hood);
  // Side louvers (engine cooling vents)
  for (let i = 0; i < 7; i++) {
    const lv = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 1.40), JDblack);
    lv.position.set(-1.33, 0.22 + i * 0.11, 0);
    upper.add(lv);
  }
  // Rear grille bars
  for (let r = 0; r < 5; r++) {
    const gb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 1.70), JDblack);
    gb.position.set(-0.44, 0.26 + r * 0.13, 0.92);
    upper.add(gb);
  }

  // Exhaust stack with heat-shield
  const exStack = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.15, 10), JDdkGray);
  exStack.position.set(-1.0, 1.60, -0.62);
  upper.add(exStack);
  const exCap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.08, 0.12, 10), JDdkGray);
  exCap.position.set(-1.0, 2.22, -0.62);
  upper.add(exCap);
  const exShield = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.90, 0.22), JDblack);
  exShield.position.set(-1.0, 1.55, -0.62);
  upper.add(exShield);

  // Hydraulic tank (right side, yellow)
  const htank = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.90, 0.68), JDyellow);
  htank.position.set(-0.90, 0.58, 0.95);
  upper.add(htank);
  const htCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.07, 8), chrome);
  htCap.position.set(-0.90, 1.07, 0.95);
  upper.add(htCap);

  // Counterweight — large curved black block at rear (JD counterweights are very prominent)
  const cwt = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.78, 2.40), JDblack);
  cwt.position.set(-1.50, 0.46, 0);
  cwt.castShadow = true;
  upper.add(cwt);
  // Counterweight face (rounded front edge suggestion)
  const cwtFront = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.74, 2.36), JDdkGray);
  cwtFront.position.set(-0.97, 0.44, 0);
  upper.add(cwtFront);
  // Yellow warning stripe on counterweight
  const cwtStripe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 2.34), JDyellow);
  cwtStripe.position.set(-2.04, 0.72, 0);
  upper.add(cwtStripe);

  // Access steps
  [0.25, 0.55].forEach(y => {
    const stp = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 0.30), chrome);
    stp.position.set(0.62, y + 0.14, 1.08);
    upper.add(stp);
  });
  // Grab handle
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.04), chrome);
  handle.position.set(0.80, 0.70, 1.08);
  upper.add(handle);

  /* ── CAB (JD style: large rectangular cab, black roof, big glass) ── */
  const cab = new THREE.Group();
  cab.position.set(0.45, 0.14, -0.28);
  upper.add(cab);

  // Cab lower body (yellow)
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.50, 1.18), JDyellow);
  cabBody.position.y = 0.25;
  cab.add(cabBody);

  // ROPS pillars — 4 corner posts (black)
  [[-0.55, -0.55], [-0.55, 0.55], [0.55, -0.55], [0.55, 0.55]].forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.45, 0.10), JDblack);
    post.position.set(x, 0.93, z);
    post.castShadow = true;
    cab.add(post);
  });

  // Cab roof (black, flat with slight overhang)
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.12, 1.30), JDblack);
  cabRoof.position.y = 1.72;
  cabRoof.castShadow = true;
  cab.add(cabRoof);

  // Work lights on roof corners
  [[-0.30, -0.30], [-0.30, 0.30], [0.30, -0.30], [0.30, 0.30]].forEach(([x, z]) => {
    const lt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xffffdd, emissive: 0xffff88, emissiveIntensity: 0.6, roughness: 0.1 }));
    lt.position.set(x, 1.78, z);
    cab.add(lt);
  });

  // Large front glass (full-height windshield)
  const fGlass = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.10, 1.04), glass);
  fGlass.position.set(0.57, 0.80, 0);
  cab.add(fGlass);
  // Front glass frame (black border)
  const fFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.16, 1.10), JDblack);
  fFrame.position.set(0.60, 0.80, 0);
  cab.add(fFrame);
  // (glass sits in front of frame visually)
  fGlass.position.x = 0.58;

  // Side glass panels
  const sGlassL = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.85, 0.07), glass);
  sGlassL.position.set(0.02, 0.80, -0.60);
  cab.add(sGlassL);
  const sGlassR = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.85, 0.07), glass);
  sGlassR.position.set(0.02, 0.80, 0.60);
  cab.add(sGlassR);

  // Rear glass (smaller)
  const rGlass = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.62, 0.95), glass);
  rGlass.position.set(-0.58, 0.92, 0);
  cab.add(rGlass);

  // Wiper
  const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.78), JDdkGray);
  wiper.position.set(0.60, 0.55, -0.08);
  wiper.rotation.z = 0.25;
  cab.add(wiper);

  /* ── ARM ASSEMBLY ───────────────────────────────────────── */
  const armBase = new THREE.Group();
  armBase.position.set(1.00, 0.80, 0);
  upper.add(armBase);

  // Boom foot bracket (wider than before)
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.50, 1.00), JDblack);
  bracket.position.y = 0.25;
  armBase.add(bracket);

  // Boom pivot — steeper angle for active-digging look
  const boomPivot = new THREE.Group();
  boomPivot.position.y = 0.50;
  boomPivot.rotation.z = -0.55;   // boom angled up ~55°
  armBase.add(boomPivot);

  // Boom body — wider, two-section, proper yellow JD arm
  const boomSect1 = new THREE.Mesh(new THREE.BoxGeometry(0.40, 1.80, 0.34), JDyellow);
  boomSect1.position.y = 0.90;
  boomSect1.castShadow = true;
  boomPivot.add(boomSect1);
  const boomSect2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.60, 0.28), JDyellow);
  boomSect2.position.set(0, 2.55, 0);
  boomPivot.add(boomSect2);

  // Boom hydraulic cylinder (thick, prominent)
  const hcBh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 1.70, 10), steelMid);
  hcBh.position.set(0.28, 0.82, 0);
  hcBh.rotation.z = 0.20;
  boomPivot.add(hcBh);
  const hcBr = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.90, 8), chrome);
  hcBr.position.set(0.33, 1.62, 0);
  hcBr.rotation.z = 0.20;
  boomPivot.add(hcBr);

  // Stick pivot — angle forward/down for digging pose
  const stickPivot = new THREE.Group();
  stickPivot.position.set(0.04, 3.50, 0);
  stickPivot.rotation.z = 0.55;   // stick angled forward
  boomPivot.add(stickPivot);

  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.10, 0.24), JDyellow);
  stick.position.y = 1.05;
  stick.castShadow = true;
  stickPivot.add(stick);

  // Stick cylinder
  const hcSh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.25, 10), steelMid);
  hcSh.position.set(0.22, 0.60, 0);
  hcSh.rotation.z = 0.14;
  stickPivot.add(hcSh);
  const hcSr = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.70, 8), chrome);
  hcSr.position.set(0.25, 1.18, 0);
  hcSr.rotation.z = 0.14;
  stickPivot.add(hcSr);

  // Bucket pivot — curled down for active-scooping pose
  const bucketPivot = new THREE.Group();
  bucketPivot.position.set(0, 2.10, 0);
  bucketPivot.rotation.z = -0.60;   // bucket curled into digging position
  stickPivot.add(bucketPivot);

  // Bucket — wider, deeper, more realistic JD bucket shape
  // Side cheek plates (yellow)
  [-0.52, 0.52].forEach(z => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.72, 0.09), JDyellow);
    side.position.set(-0.02, 0.06, z);
    side.castShadow = true;
    bucketPivot.add(side);
  });
  // Back plate (black/steel)
  const bkBack = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.70, 1.04), JDblack);
  bkBack.position.set(-0.52, 0.06, 0);
  bucketPivot.add(bkBack);
  // Bottom floor
  const bkFloor = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.10, 1.04), JDblack);
  bkFloor.rotation.z = 0.30;
  bkFloor.position.set(0.06, -0.22, 0);
  bucketPivot.add(bkFloor);
  // Second floor section (curved profile)
  const bkFloor2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.10, 1.04), JDdkGray);
  bkFloor2.rotation.z = -0.25;
  bkFloor2.position.set(0.42, -0.28, 0);
  bucketPivot.add(bkFloor2);
  // Cutting edge (heavy steel lip)
  const cutEdge = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 1.06), steelMid);
  cutEdge.position.set(0.56, -0.26, 0);
  bucketPivot.add(cutEdge);
  // Bucket teeth (5 — wider spacing)
  for (let t = -2; t <= 2; t++) {
    const adp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.15), JDblack);
    adp.position.set(0.62, -0.24, t * 0.20);
    bucketPivot.add(adp);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.26, 4), steelMid);
    tip.rotation.z = -Math.PI / 2;
    tip.position.set(0.82, -0.24, t * 0.20);
    bucketPivot.add(tip);
  }

  // Bucket cylinder
  const hcKh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.65, 8), steelMid);
  hcKh.position.set(0.22, 0.55, 0);
  hcKh.rotation.z = 0.55;
  bucketPivot.add(hcKh);
  const hcKr = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.35, 7), chrome);
  hcKr.position.set(0.34, 0.28, 0);
  hcKr.rotation.z = 0.55;
  bucketPivot.add(hcKr);

  g.position.set(-5.5, 0, -3.0);
  g.rotation.y = 0.35;

  addStep(g);
  OBJ.excavatorArm    = boomPivot;
  OBJ.excavatorStick  = stickPivot;
  OBJ.excavatorBucket = bucketPivot;
  OBJ.excavatorUpper  = upper;
  return g;
}

function buildConcreteTruck3D() {
  const g = new THREE.Group();

  // ── PBR materials ──────────────────────────────────────────
  const cabPaint  = new THREE.MeshStandardMaterial({ color: 0xe65100, roughness: 0.68, metalness: 0.06 });
  const drumPaint = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.60, metalness: 0.18 });
  const chassisM  = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.55, metalness: 0.50 });
  const chrome    = new THREE.MeshStandardMaterial({ color: 0xbdbdbd, roughness: 0.16, metalness: 0.90 });
  const rubber    = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.92, metalness: 0.00 });
  const glass2    = new THREE.MeshStandardMaterial({ color: 0x90caf9, roughness: 0.05, metalness: 0.10, transparent: true, opacity: 0.58 });
  const bladeMat  = new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.55, metalness: 0.30 });
  const GRAY = chassisM;

  /* ── CHASSIS FRAME ──────────────────────────────────────── */
  // Longitudinal frame rails
  [-0.74, 0.74].forEach(z => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.24, 0.24), chassisM);
    rail.position.set(0.1, 0.68, z);
    rail.castShadow = true;
    g.add(rail);
  });
  // Cross members
  [-2.2, -0.5, 0.9, 2.4].forEach(x => {
    const cm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 1.48), chassisM);
    cm.position.set(x, 0.68, 0);
    g.add(cm);
  });
  const belly = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.12, 1.52), chassisM);
  belly.position.set(0.1, 0.60, 0);
  g.add(belly);

  /* ── WHEELS (steer + 2 drive axles with dual rears) ─────── */
  const makeAxleWheel = (x, z, isDual) => {
    const wg = new THREE.Group();
    wg.position.set(x, 0.5, z);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.32, 16), rubber);
    tire.rotation.x = Math.PI / 2;
    tire.castShadow = true;
    wg.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.34, 12), chrome);
    rim.rotation.x = Math.PI / 2;
    wg.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.36, 8), chrome);
    hub.rotation.x = Math.PI / 2;
    wg.add(hub);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 6), chrome);
      lug.rotation.x = Math.PI / 2;
      lug.position.set(Math.cos(a) * 0.21, 0, Math.sin(a) * 0.21);
      wg.add(lug);
    }
    if (isDual) {
      const zOff = z < 0 ? -0.33 : 0.33;
      const t2 = tire.clone(); t2.position.z = zOff; wg.add(t2);
      const r2 = rim.clone();  r2.position.z = zOff; wg.add(r2);
    }
    return wg;
  };
  // Steer axle
  const stAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.1, 8), chassisM);
  stAxle.rotation.x = Math.PI / 2;
  stAxle.position.set(-2.4, 0.52, 0);
  g.add(stAxle);
  g.add(makeAxleWheel(-2.4, -1.08, false));
  g.add(makeAxleWheel(-2.4,  1.08, false));
  // Drive axles
  [0.9, 1.85].forEach(x => {
    const dAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.4, 8), chassisM);
    dAxle.rotation.x = Math.PI / 2;
    dAxle.position.set(x, 0.52, 0);
    g.add(dAxle);
    g.add(makeAxleWheel(x, -1.22, true));
    g.add(makeAxleWheel(x,  1.22, true));
  });

  /* ── ENGINE HOOD (conventional truck) ───────────────────── */
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.75, 2.0), cabPaint);
  hood.position.set(-3.15, 1.28, 0);
  hood.castShadow = true;
  g.add(hood);
  // Hood top slope
  const hoodSlope = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 2.0), cabPaint);
  hoodSlope.position.set(-2.23, 1.72, 0);
  hoodSlope.rotation.z = 0.18;
  g.add(hoodSlope);
  // Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 1.78), chassisM);
  grille.position.set(-4.05, 1.25, 0);
  g.add(grille);
  for (let r = 0; r < 5; r++) {
    const gbar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 1.75), chrome);
    gbar.position.set(-4.05, 1.02 + r * 0.12, 0);
    g.add(gbar);
  }
  // Chrome bumper
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 2.1), chrome);
  bumper.position.set(-4.12, 0.82, 0);
  g.add(bumper);
  // Headlights
  [-0.78, 0.78].forEach(z => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.32),
      new THREE.MeshStandardMaterial({ color: 0xfffff0, emissive: 0xffff88, emissiveIntensity: 0.45, roughness: 0.1 }));
    hl.position.set(-4.1, 1.42, z);
    g.add(hl);
    // Turn indicator
    const ind = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff4400, emissiveIntensity: 0.3 }));
    ind.position.set(-4.1, 1.18, z);
    g.add(ind);
  });

  /* ── CAB BOX ─────────────────────────────────────────────── */
  const cabBox = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.58, 2.0), cabPaint);
  cabBox.position.set(-2.05, 1.79, 0);
  cabBox.castShadow = true;
  g.add(cabBox);
  // Cab roof
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.12, 2.06), chassisM);
  cabRoof.position.set(-2.05, 2.64, 0);
  g.add(cabRoof);
  // Windscreen (angled forward)
  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.9, 1.62), glass2);
  windscreen.position.set(-1.11, 2.0, 0);
  g.add(windscreen);
  // Side windows
  [-1.02, 1.02].forEach(z => {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.68, 0.055), glass2);
    sw.position.set(-2.05, 2.04, z);
    g.add(sw);
  });
  // Rear cab window
  const rearWin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 1.45), glass2);
  rearWin.position.set(-2.98, 2.04, 0);
  g.add(rearWin);
  // Door seam lines
  [-0.82, 0.82].forEach(z => {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.5, 0.035), chassisM);
    seam.position.set(-1.12, 1.82, z);
    g.add(seam);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.28), chrome);
    handle.position.set(-1.12, 1.68, z);
    g.add(handle);
  });
  // Side mirror
  const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.05), chassisM);
  mirrorArm.position.set(-1.14, 2.4, -1.12);
  g.add(mirrorArm);
  const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.28), chassisM);
  mirrorHead.position.set(-1.27, 2.4, -1.12);
  g.add(mirrorHead);
  // Cab air horns
  const hornPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 7), chrome);
  hornPipe.position.set(-1.8, 2.77, -0.55);
  g.add(hornPipe);
  const hornBell = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.04, 0.14, 9), chrome);
  hornBell.position.set(-1.8, 3.03, -0.55);
  g.add(hornBell);
  // Exhaust stack
  const exPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.3, 10), chrome);
  exPipe.position.set(-1.78, 2.1, 0.8);
  g.add(exPipe);
  const exCap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.1, 10), chassisM);
  exCap.position.set(-1.78, 2.78, 0.8);
  g.add(exCap);
  // Warning beacon on roof
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.55 }));
  beacon.position.set(-2.05, 2.8, 0);
  g.add(beacon);
  // Steps on cab
  [0.34, 0.65].forEach(y => {
    const stp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.28), chrome);
    stp.position.set(-1.12, y + 0.66, -0.92);
    g.add(stp);
  });

  /* ── WATER TANK ──────────────────────────────────────────── */
  const wTankBody = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.55, 14), chassisM);
  wTankBody.rotation.z = Math.PI / 2;
  wTankBody.position.set(-0.85, 1.3, 0);
  wTankBody.castShadow = true;
  g.add(wTankBody);
  const wTankCap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.09, 8), chrome);
  wTankCap.position.set(-0.85, 1.7, 0);
  g.add(wTankCap);

  /* ── MIXER DRUM ─────────────────────────────────────────── */
  const DRUM = new THREE.Group();
  DRUM.position.set(0.85, 2.0, 0);
  DRUM.rotation.z = -0.20;   // tilted: front high, rear low
  g.add(DRUM);

  // Main drum body (tapered cylinder)
  const drumBody = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.60, 3.6, 20), drumPaint);
  drumBody.castShadow = true;
  DRUM.add(drumBody);

  // Front discharge cone + ring
  const fCone = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.92, 0.65, 18), drumPaint);
  fCone.position.y = 2.12;
  DRUM.add(fCone);
  const disRing = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.065, 8, 18), chrome);
  disRing.position.y = 2.46;
  disRing.rotation.x = Math.PI / 2;
  DRUM.add(disRing);

  // Rear end cap
  const rearCap = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.22, 16), drumPaint);
  rearCap.position.y = -1.91;
  DRUM.add(rearCap);

  // Drum support rolling rings (2 bands)
  [0.6, -0.8].forEach(y => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.075, 8, 22), chassisM);
    band.position.y = y;
    band.rotation.x = Math.PI / 2;
    DRUM.add(band);
  });

  // Helical mixing blades (3 starts, continuous helix)
  for (let blade = 0; blade < 3; blade++) {
    const phaseOffset = (blade / 3) * Math.PI * 2;
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      const y = -1.7 + t * 3.4;
      const r = 0.61 + (1 - t) * 0.29;   // taper
      const angle = phaseOffset + t * Math.PI * 3.5;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.09), bladeMat);
      fin.position.set(Math.cos(angle) * (r + 0.04), y, Math.sin(angle) * (r + 0.04));
      fin.lookAt(new THREE.Vector3(0, y, 0));
      DRUM.add(fin);
    }
  }

  // Drum longitudinal stiffener ribs
  for (let r = 0; r < 5; r++) {
    const a = (r / 5) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.07, 3.4, 0.07), chassisM);
    rib.position.set(Math.cos(a) * 0.94, 0, Math.sin(a) * 0.94);
    DRUM.add(rib);
  }

  OBJ.truckDrum = DRUM;

  /* ── DISCHARGE CHUTE SYSTEM ─────────────────────────────── */
  const CHUTE = new THREE.Group();
  CHUTE.position.set(2.85, 1.2, 0);
  g.add(CHUTE);

  // Pivot bracket
  const pivBrk = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), chassisM);
  pivBrk.position.y = 0.28;
  CHUTE.add(pivBrk);

  // Upper chute segment
  const uChute = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 2.1), chassisM);
  uChute.rotation.x = 0.52;
  uChute.position.set(0, 0.12, 0.7);
  CHUTE.add(uChute);
  [-0.15, 0.15].forEach(x => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 2.1), chassisM);
    w.rotation.x = 0.52;
    w.position.set(x, 0.12, 0.7);
    CHUTE.add(w);
  });

  // Lower chute segment (folded further down)
  const lChute = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 1.3), chassisM);
  lChute.rotation.x = 0.95;
  lChute.position.set(0, -0.42, 1.68);
  CHUTE.add(lChute);

  // Chute handle (operator grabs this)
  const cHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 7), chrome);
  cHandle.rotation.z = Math.PI / 2;
  cHandle.position.set(0, 0.36, 0.3);
  CHUTE.add(cHandle);

  OBJ.truckChuteGroup = CHUTE;

  /* ── DRUM SUPPORT A-FRAME STRUTS ────────────────────────── */
  [[-1.1, 1.08], [-1.1, -1.08], [1.5, 1.08], [1.5, -1.08]].forEach(([x, z]) => {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 1.45, 8), chassisM);
    strut.position.set(x, 1.32, z);
    strut.lookAt(new THREE.Vector3(x * 0.2, 2.6, 0));
    g.add(strut);
  });

  // Top cross beam connecting A-frames
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.22), chassisM);
  topBeam.position.set(0.2, 2.55, 0);
  g.add(topBeam);

  g.position.set(-6.2, 0, -4.8);
  g.rotation.y = 0.42;
  addStep(g);
  return g;
}

function buildInspector3D(x, z) {
  const g = new THREE.Group();

  const vestMat = new THREE.MeshLambertMaterial({ color: 0xf5a623 }); // hi-vis vest
  const vestSt  = new THREE.MeshLambertMaterial({ color: 0xe65100 }); // safety stripes
  const helmMat = new THREE.MeshLambertMaterial({ color: 0xffeb3b }); // yellow hard hat
  const pantMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 }); // dark pants
  const bootMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); // boots
  const clipMat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e }); // clipboard

  // Legs
  [-0.15, 0.15].forEach(xOff => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 0.22), pantMat);
    leg.position.set(xOff, 0.29, 0);
    leg.castShadow = true;
    g.add(leg);
    // Boot
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.3), bootMat);
    boot.position.set(xOff, 0.06, 0.05);
    g.add(boot);
  });

  // Torso (hi-vis vest)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.38), vestMat);
  torso.position.y = 0.94;
  torso.castShadow = true;
  g.add(torso);

  // Hi-vis stripe on vest
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), vestSt);
  stripe.position.set(0, 0.88, 0.2);
  g.add(stripe);

  // Arms
  [-0.4, 0.4].forEach((xOff, side) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), vestMat);
    arm.position.set(xOff, 0.84, 0);
    arm.castShadow = true;
    g.add(arm);
    // Hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), MAT.skin);
    hand.position.set(xOff, 0.56, 0);
    g.add(hand);
  });

  // Clipboard in right hand
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.24), clipMat);
  board.position.set(0.42, 0.72, 0.12);
  board.rotation.x = 0.3;
  g.add(board);
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.2),
    new THREE.MeshLambertMaterial({ color: 0xfafafa }));
  paper.position.set(0.44, 0.72, 0.12);
  paper.rotation.x = 0.3;
  g.add(paper);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.18, 6), MAT.skin);
  neck.position.y = 1.35;
  g.add(neck);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), MAT.skin);
  head.position.y = 1.62;
  head.castShadow = true;
  g.add(head);

  // Hard hat — dome + brim
  const hatDome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), helmMat);
  hatDome.position.y = 1.78;
  g.add(hatDome);
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.06, 10), helmMat);
  hatBrim.position.y = 1.76;
  g.add(hatBrim);

  g.position.set(x, 0, z);
  g.rotation.y = -Math.PI * 0.25; // face toward pit
  addStep(g);
  OBJ.inspector = g;
  return g;
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

      const markerGeo   = new THREE.BoxGeometry(1.0, 0.06, 1.0);
      const markerEdges = new THREE.EdgesGeometry(markerGeo);
      const markers = [];

      markerPositions.forEach((pos, i) => {
        const g = new THREE.Group();

        const plate = new THREE.Mesh(markerGeo, MAT.markerOrange.clone());
        plate.position.y = 0.03;
        plate.castShadow = true;
        plate.receiveShadow = true;
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

        const entry = {
          mesh: g,
          pulse: true,
          phase: i * 1.2,
          onHit() { testBorehole(i); }
        };
        clickables3D.push(entry);
      });

      // Add boring rig model at center
      const rigGroup = new THREE.Group();
      const rigBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.3, 0.8),
        MAT.yellow
      );
      rigBase.position.y = 0.15;
      rigGroup.add(rigBase);
      const rigMast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6),
        MAT.darkGray
      );
      rigMast.position.set(0, 1.4, 0);
      rigGroup.add(rigMast);
      rigGroup.position.set(7, 0, 0);
      addStep(rigGroup);

      // Reliable checklist buttons -- the primary way to run each boring
      // test. Clicking the pulsing 3D marker still works too, but nothing
      // requires precisely hitting a moving target.
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

        const html = `<strong>BH-${i + 1}</strong><div class="info-popup-row">` +
          soilData.map(d => `<span class="info-chip">${d.depth} ${d.soil} <b>${d.spt}</b></span>`).join('') +
          `</div>`;
        show3DPopup(g, html, 3000);

        if (ss.tested >= ss.total) {
          showFeedback('info', 'All borings complete! Submit the soil report.');
          ab.innerHTML = '';
          const submitBtn = makeBtn('Submit Soil Report', 'btn-primary', () => {
            markSubtask(5);
            showFeedback('correct', 'Soil Profile: 2m Topsoil, 4m Soft Clay, 5m Loose Sand, 5m Dense Sand, Rock. DRIVEN PILE FOUNDATION REQUIRED.');
            safeTimeout(() => {
              ab.innerHTML = '<div class="step-instruction" style="color:#27ae60;">Recommendation: DRIVEN PILE FOUNDATION REQUIRED. Shallow foundations not suitable — bearing layer at 16m depth.</div>';
              safeTimeout(() => completeStep(), 2000);
            }, 1500);
          });
          ab.appendChild(submitBtn);
        }
      }
    },
    cleanup() {}
  },

  /* ─────────────────── 1: Pile Layout ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.placed = 0;
      ss.total = 4;
      ss.demoStarted = false;

      const pilePositions = [
        new THREE.Vector3(-2.5, 0.01, -2.5),
        new THREE.Vector3(2.5,  0.01, -2.5),
        new THREE.Vector3(-2.5, 0.01,  2.5),
        new THREE.Vector3(2.5,  0.01,  2.5)
      ];

      const labels = ['P1', 'P2', 'P3', 'P4'];

      // Draw pile cap outline on ground
      const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(6.5, 0.05, 6.5));
      const outlineMat = new THREE.LineBasicMaterial({ color: 0xf5a623 });
      const outlineMesh = new THREE.LineSegments(outlineGeo, outlineMat);
      outlineMesh.position.y = 0.03;
      addStep(outlineMesh);

      const rings = [];
      const entries = [];

      pilePositions.forEach((pos, i) => {
        // Target ring
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
        rings.push(ring);

        // Center dot
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.08, 12),
          new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6, side: THREE.DoubleSide })
        );
        dot.rotation.x = -Math.PI / 2;
        dot.position.copy(pos);
        dot.position.y = 0.04;
        addStep(dot);

        create3DLabel(ring, labels[i], '');

        const entry = {
          mesh: ring,
          pulse: true,
          phase: i * 1.5,
          onHit() { triggerDemo(i); }
        };
        entries.push(entry);
        clickables3D.push(entry);
      });

      // Shared by both the 3D ring click and the reliable DOM button below --
      // clicking either starts the full demo on that pile.
      function triggerDemo(i) {
        if (rings[i].userData.placed || ss.demoStarted) return;
        ss.demoStarted = true;
        ab.style.pointerEvents = 'none';
        placeMarker(i);
        autoCompleteRest(i);
      }

      // Places the marker at pile i -- the visible spike-drop animation.
      function placeMarker(i) {
        const pos = pilePositions[i];
        const ring = rings[i];
        if (ring.userData.placed) return;
        ring.userData.placed = true;
        entries[i].pulse = false;
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
        markItemDone(i);
        showFeedback('correct', `Pile marker ${labels[i]} placed!`);

        if (ss.placed >= ss.total) {
          showFeedback('correct', 'All pile markers placed! Layout complete.');
          safeTimeout(() => completeStep(), 1200);
        }
      }

      // The process has now been demonstrated once in full. The remaining
      // pile markers are placed the same way -- staggered so it still reads.
      function autoCompleteRest(demoIndex) {
        const rest = [0, 1, 2, 3].filter(idx => idx !== demoIndex);
        rest.forEach((i, order) => {
          safeTimeout(() => placeMarker(i), 400 * (order + 1));
        });
      }

      function markItemDone(i) {
        const item = items[i];
        item.classList.add('placed');
        item.innerHTML += '<div style="color:var(--green-ok);font-size:.85rem;margin-top:2px;">✓ Placed</div>';
      }

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click one pile to place a survey marker -- the rest will follow the same way</div>';

      const items = [];
      labels.forEach((label, i) => {
        const item = el('div', 'panel-item');
        item.innerHTML = `<div class="item-icon">📍</div><div class="item-label">Place pile marker ${label}</div>`;
        item.addEventListener('click', () => triggerDemo(i));
        items.push(item);
        ab.appendChild(item);
      });
    },
    cleanup() {}
  },

  /* ─────────────────── 2: Position Pile ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.phase = 0; // 0=attach, 1=lift, 2=guide

      // Build rig
      const rig = buildDrivingRig(0, -1);
      addStep(rig);
      OBJ.rig = rig;

      // Build pile lying horizontal on ground (storage area)
      const pile = buildPile(true);
      addStep(pile);
      OBJ.pileGroup = pile;

      // Highlight rope/sling on the pile
      const sling = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.03, 8, 16),
        MAT.yellow
      );
      sling.position.set(6, 0.8, 3);
      sling.rotation.x = Math.PI / 2;
      sling.visible = false;
      addStep(sling);
      OBJ.sling = sling;

      const ab = DOM.actionBar();
      ab.innerHTML = '';

      function showPhase() {
        ab.innerHTML = '';
        if (ss.phase === 0) {
          ab.innerHTML = '<div class="step-instruction">Attach the lifting sling to the pile</div>';
          ab.appendChild(makeBtn('Attach Sling', 'btn-primary', () => {
            OBJ.sling.visible = true;
            // Highlight pile
            OBJ.pileGroup.children[0].material = new THREE.MeshLambertMaterial({
              map: TEX.concrete, emissive: 0x333300, emissiveIntensity: 0.3
            });
            markSubtask(0);
            showFeedback('correct', 'Sling attached! Ready to lift.');
            ss.phase = 1;
            safeTimeout(showPhase, 800);
          }));
        } else if (ss.phase === 1) {
          ab.innerHTML = '<div class="step-instruction">Lift the pile from horizontal to vertical</div>';
          ab.appendChild(makeBtn('Lift Pile', 'btn-primary', () => {
            // Animate pile rotating from horizontal to vertical
            let t = 0;
            const liftInterval = safeInterval(() => {
              t += 0.02;
              if (t >= 1) {
                clearInterval(liftInterval);
                OBJ.pileGroup.rotation.z = 0;
                OBJ.pileGroup.position.set(6, 10, 3);
                OBJ.sling.visible = false;
                markSubtask(1);
                showFeedback('correct', 'Pile is vertical! Guide to position.');
                ss.phase = 2;
                safeTimeout(showPhase, 800);
                return;
              }
              // Smooth rotation from PI/2 to 0
              const angle = (Math.PI / 2) * (1 - t);
              OBJ.pileGroup.rotation.z = angle;
              // Move upward and toward center
              OBJ.pileGroup.position.x = 6 - 3 * t;
              OBJ.pileGroup.position.y = 0.3 + 10 * t;
              OBJ.pileGroup.position.z = 3 - 1.5 * t;
              OBJ.sling.position.x = OBJ.pileGroup.position.x;
              OBJ.sling.position.y = OBJ.pileGroup.position.y + 2;
              OBJ.sling.position.z = OBJ.pileGroup.position.z;
            }, 30);
          }));
        } else if (ss.phase === 2) {
          ab.innerHTML = '<div class="step-instruction">Guide the pile to the driving position</div>';
          ab.appendChild(makeBtn('Guide to Position', 'btn-primary', () => {
            // Animate pile moving to center position
            let t = 0;
            const startX = OBJ.pileGroup.position.x;
            const startZ = OBJ.pileGroup.position.z;
            const moveInterval = safeInterval(() => {
              t += 0.03;
              if (t >= 1) {
                clearInterval(moveInterval);
                OBJ.pileGroup.position.set(0, 10, 0);
                OBJ.pileGroup.rotation.z = 0;
                // Snap effect
                spawnParticles(new THREE.Vector3(0, 0.1, 0), MAT.yellow, 8);
                markSubtask(2);
                showFeedback('correct', 'Pile in position! Ready for alignment check.');
                safeTimeout(() => completeStep(), 1200);
                return;
              }
              OBJ.pileGroup.position.x = startX + (0 - startX) * t;
              OBJ.pileGroup.position.z = startZ + (0 - startZ) * t;
            }, 30);
          }));
        }
      }

      showPhase();
    },
    cleanup() {
      delete OBJ.sling;
    }
  },

  /* ─────────────────── 3: Alignment Check ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.nsOk = false;
      ss.ewOk = false;

      // Build rig + pile
      const rig = buildDrivingRig(0, -1);
      addStep(rig);
      OBJ.rig = rig;

      // Build vertical pile with slight random tilt
      const pile = buildPile(false);
      pile.position.set(0, 10, 0);

      // Apply initial tilt
      const nsOffset = (STATE.alignmentNS - 90) * (Math.PI / 180);
      const ewOffset = (STATE.alignmentEW - 90) * (Math.PI / 180);
      pile.rotation.x = nsOffset;
      pile.rotation.z = ewOffset;

      addStep(pile);
      OBJ.pileGroup = pile;

      const ab = DOM.actionBar();
      ab.innerHTML = '';

      // Alignment indicator display
      const alignDiv = el('div', '', '');
      alignDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;';

      // Angle display
      const angleDisplay = el('div', '', '');
      angleDisplay.style.cssText = 'color:#f5a623;font-size:0.9rem;font-weight:700;text-align:center;';
      angleDisplay.id = 'angle-display';
      alignDiv.appendChild(angleDisplay);

      // Level indicator (circular)
      const levelWrap = el('div', 'alignment-indicator', '');
      levelWrap.innerHTML = `
        <div style="width:100px;height:100px;border-radius:50%;border:3px solid #546e7a;position:relative;background:rgba(0,0,0,0.3);margin:0 auto;">
          <div style="position:absolute;top:50%;left:50%;width:4px;height:4px;background:#f5a623;border-radius:50%;transform:translate(-50%,-50%);"></div>
          <div id="level-bubble" style="position:absolute;width:14px;height:14px;border-radius:50%;background:#e74c3c;transform:translate(-50%,-50%);transition:left 0.15s,top 0.15s;"></div>
          <div style="position:absolute;top:50%;left:50%;width:20px;height:20px;border:2px solid rgba(39,174,96,0.5);border-radius:50%;transform:translate(-50%,-50%);"></div>
        </div>
      `;
      alignDiv.appendChild(levelWrap);

      // Slider row
      const sliderRow = el('div', '', '');
      sliderRow.style.cssText = 'display:flex;gap:20px;align-items:center;flex-wrap:wrap;justify-content:center;';

      // N-S slider
      const nsWrap = el('div', '', '');
      nsWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
      nsWrap.innerHTML = '<span style="color:#ccc;font-size:0.75rem;font-weight:700;">N-S Tilt</span>';
      const nsSlider = document.createElement('input');
      nsSlider.type = 'range';
      nsSlider.min = '87';
      nsSlider.max = '93';
      nsSlider.step = '0.1';
      nsSlider.value = STATE.alignmentNS.toFixed(1);
      nsSlider.style.cssText = 'width:120px;accent-color:#f5a623;';
      nsWrap.appendChild(nsSlider);
      sliderRow.appendChild(nsWrap);

      // E-W slider
      const ewWrap = el('div', '', '');
      ewWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
      ewWrap.innerHTML = '<span style="color:#ccc;font-size:0.75rem;font-weight:700;">E-W Tilt</span>';
      const ewSlider = document.createElement('input');
      ewSlider.type = 'range';
      ewSlider.min = '87';
      ewSlider.max = '93';
      ewSlider.step = '0.1';
      ewSlider.value = STATE.alignmentEW.toFixed(1);
      ewSlider.style.cssText = 'width:120px;accent-color:#f5a623;';
      ewWrap.appendChild(ewSlider);
      sliderRow.appendChild(ewWrap);

      alignDiv.appendChild(sliderRow);

      // Status
      const statusDiv = el('div', '', '');
      statusDiv.id = 'align-status';
      statusDiv.style.cssText = 'color:#e74c3c;font-size:0.82rem;font-weight:700;text-align:center;';
      alignDiv.appendChild(statusDiv);

      ab.appendChild(alignDiv);

      function updateAlignment() {
        const ns = parseFloat(nsSlider.value);
        const ew = parseFloat(ewSlider.value);
        STATE.alignmentNS = ns;
        STATE.alignmentEW = ew;

        // Update pile tilt
        const nsRad = (ns - 90) * (Math.PI / 180);
        const ewRad = (ew - 90) * (Math.PI / 180);
        OBJ.pileGroup.rotation.x = nsRad;
        OBJ.pileGroup.rotation.z = ewRad;

        // Update display
        const ad = $('angle-display');
        if (ad) ad.innerHTML = `N-S: ${ns.toFixed(1)}° &nbsp;|&nbsp; E-W: ${ew.toFixed(1)}°`;

        // Update level bubble
        const bubble = $('level-bubble');
        if (bubble) {
          const bx = 50 + (ew - 90) * 15;
          const by = 50 + (ns - 90) * 15;
          bubble.style.left = Math.max(10, Math.min(90, bx)) + '%';
          bubble.style.top = Math.max(10, Math.min(90, by)) + '%';
          const inTolerance = Math.abs(ns - 90) <= 0.5 && Math.abs(ew - 90) <= 0.5;
          bubble.style.background = inTolerance ? '#27ae60' : '#e74c3c';
        }

        // Check tolerance
        ss.nsOk = Math.abs(ns - 90) <= 0.5;
        ss.ewOk = Math.abs(ew - 90) <= 0.5;

        if (ss.nsOk && !ss.nsMarked) {
          ss.nsMarked = true;
          markSubtask(0);
        }
        if (ss.ewOk && !ss.ewMarked) {
          ss.ewMarked = true;
          markSubtask(1);
        }

        const status = $('align-status');
        if (ss.nsOk && ss.ewOk) {
          if (status) status.innerHTML = '<span style="color:#27ae60;">Within tolerance - ALIGNED</span>';
          if (!ss.completed) {
            ss.completed = true;
            markSubtask(2);
            showFeedback('correct', 'Pile aligned within +-0.5 degrees! Ready to drive.');
            safeTimeout(() => completeStep(), 1500);
          }
        } else {
          if (status) {
            const parts = [];
            if (!ss.nsOk) parts.push('N-S out of tolerance');
            if (!ss.ewOk) parts.push('E-W out of tolerance');
            status.textContent = parts.join(' | ');
          }
        }
      }

      nsSlider.addEventListener('input', updateAlignment);
      ewSlider.addEventListener('input', updateAlignment);
      updateAlignment();
    },
    cleanup() {}
  },

  /* ─────────────────── 4: Drive Pile ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.driving = false;
      ss.depth = 0; // meters driven (tip starts at y=0)
      ss.blows = 0;
      ss.currentLayer = 'Topsoil';
      ss.hammerCycleActive = false;
      ss.layerMarked = { topsoil: false, clay: false, sand: false, dense: false };

      // Build rig
      const rig = buildDrivingRig(0, -1);
      addStep(rig);
      OBJ.rig = rig;

      // Build vertical pile: tip at y=-2, top at y=18 (within mast height)
      const pile = buildPile(false);
      pile.position.set(0, 8, 0); // center: tip at y=-2, top at y=18
      addStep(pile);
      OBJ.pileGroup = pile;

      // Position hammer at top of pile
      if (OBJ.hammer) {
        OBJ.hammer.position.y = 18 + 0.8; // just above pile top
      }

      const ab = DOM.actionBar();
      ab.innerHTML = '';

      // Driving stats display
      const statsDiv = el('div', 'blow-display', '');
      statsDiv.id = 'drive-stats';
      statsDiv.innerHTML = `
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center;">
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Depth</div>
            <div id="drive-depth" style="color:#f5a623;font-size:1.2rem;font-weight:700;">0.0m</div>
          </div>
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Blow Count</div>
            <div id="drive-blows" style="color:#fff;font-size:1.2rem;font-weight:700;">0</div>
          </div>
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Pen./Blow</div>
            <div id="drive-pen" style="color:#fff;font-size:1.2rem;font-weight:700;">--</div>
          </div>
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Current Layer</div>
            <div id="drive-layer" style="color:#8B6340;font-size:0.9rem;font-weight:700;">Topsoil</div>
          </div>
        </div>
      `;
      ab.appendChild(statsDiv);

      // Drive button (hold to drive)
      const driveBtn = makeBtn('DRIVE', 'btn-primary', () => {});
      driveBtn.style.cssText += 'font-size:1.1rem;padding:12px 40px;background:#c62828;color:#fff;';
      driveBtn.id = 'drive-btn';

      let driveInterval = null;

      function getPenetration(depth) {
        if (depth < 2) return 200 + Math.random() * 50;       // Topsoil
        if (depth < 6) return 150 + Math.random() * 50;       // Soft Clay
        if (depth < 11) return 80 + Math.random() * 40;       // Loose Sand
        if (depth < 16) return 30 + Math.random() * 30;       // Dense Sand
        return 8 + Math.random() * 17;                         // Bearing Layer
      }

      function getLayerName(depth) {
        if (depth < 2) return 'Topsoil';
        if (depth < 6) return 'Soft Clay';
        if (depth < 11) return 'Loose Sand';
        if (depth < 16) return 'Dense Sand';
        return 'Bearing Layer';
      }

      function getLayerColor(name) {
        const colors = {
          'Topsoil': '#8B6340',
          'Soft Clay': '#6B8E6E',
          'Loose Sand': '#D4A85A',
          'Dense Sand': '#C4843A',
          'Bearing Layer': '#607080'
        };
        return colors[name] || '#fff';
      }

      function doBlowCycle() {
        if (ss.hammerCycleActive) return;
        if (ss.depth >= 11) {
          // Step 6 done — enters dense sand, transition to step 7
          clearInterval(driveInterval);
          driveInterval = null;
          return;
        }

        ss.hammerCycleActive = true;
        const hammerStartY = OBJ.pileGroup.position.y + 10 + 0.8;

        // Phase 1: Hammer rises
        if (OBJ.hammer) {
          OBJ.hammer.position.y = hammerStartY;
        }
        const riseTarget = hammerStartY + 2;
        let riseT = 0;
        const riseInterval = safeInterval(() => {
          riseT += 0.20;          // fast rise
          if (riseT >= 1) {
            clearInterval(riseInterval);
            if (OBJ.hammer) OBJ.hammer.position.y = riseTarget;

            // Phase 2: Hammer falls
            let fallT = 0;
            const fallInterval = safeInterval(() => {
              fallT += 0.35;      // fast fall
              if (fallT >= 1) {
                clearInterval(fallInterval);
                if (OBJ.hammer) OBJ.hammer.position.y = hammerStartY;

                // Impact!
                const pen = getPenetration(ss.depth);
                const penMeters = pen / 1000;
                ss.depth += penMeters;
                ss.blows++;

                // Move pile down
                OBJ.pileGroup.position.y = 8 - ss.depth;

                // Impact flash
                if (OBJ.impactFlash) {
                  OBJ.impactFlash.visible = true;
                  OBJ.impactFlash.position.y = OBJ.pileGroup.position.y + 10;
                  safeTimeout(() => {
                    if (OBJ.impactFlash) OBJ.impactFlash.visible = false;
                  }, 100);
                }

                // Spawn impact particles
                spawnParticles(
                  new THREE.Vector3(0, Math.max(0, OBJ.pileGroup.position.y + 10), 0),
                  MAT.topsoil, 4
                );

                // Update stats
                const depthEl = $('drive-depth');
                const blowsEl = $('drive-blows');
                const penEl = $('drive-pen');
                const layerEl = $('drive-layer');
                if (depthEl) depthEl.textContent = ss.depth.toFixed(1) + 'm';
                if (blowsEl) blowsEl.textContent = ss.blows;
                if (penEl) penEl.textContent = Math.round(pen) + 'mm';

                // Check layer change
                const newLayer = getLayerName(ss.depth);
                if (newLayer !== ss.currentLayer) {
                  ss.currentLayer = newLayer;
                  if (layerEl) {
                    layerEl.textContent = newLayer;
                    layerEl.style.color = getLayerColor(newLayer);
                  }
                  showFeedback('info', `Entered ${newLayer} at ${ss.depth.toFixed(1)}m depth`);

                  // Mark subtasks
                  if (newLayer === 'Soft Clay' && !ss.layerMarked.clay) {
                    ss.layerMarked.clay = true;
                    markSubtask(0); // topsoil done
                    markSubtask(1);
                  }
                  if (newLayer === 'Loose Sand' && !ss.layerMarked.sand) {
                    ss.layerMarked.sand = true;
                    markSubtask(2);
                  }
                  if (newLayer === 'Dense Sand' && !ss.layerMarked.dense) {
                    ss.layerMarked.dense = true;
                    markSubtask(3);
                  }
                }

                // Update hammer position to track pile top
                if (OBJ.hammer) {
                  OBJ.hammer.position.y = OBJ.pileGroup.position.y + 10 + 0.8;
                }

                // Check if we've entered Dense Sand -> step 6 complete
                if (ss.depth >= 11) {
                  STATE.drivenDepth = ss.depth;
                  STATE.totalBlows = ss.blows;
                  clearInterval(driveInterval);
                  driveInterval = null;
                  showFeedback('correct', 'Entered Dense Sand! Transitioning to pile refusal monitoring.');
                  safeTimeout(() => completeStep(), 1500);
                }

                ss.hammerCycleActive = false;
              } else {
                if (OBJ.hammer) {
                  OBJ.hammer.position.y = riseTarget - (riseTarget - hammerStartY) * fallT;
                }
              }
            }, 20);
            return;
          }
          if (OBJ.hammer) {
            OBJ.hammer.position.y = hammerStartY + (riseTarget - hammerStartY) * riseT;
          }
        }, 20);
      }

      driveBtn.addEventListener('mousedown', () => {
        if (ss.depth >= 11) return;
        ss.driving = true;
        if (!ss.layerMarked.topsoil) {
          ss.layerMarked.topsoil = true;
          markSubtask(0);
        }
        driveInterval = safeInterval(() => {
          if (ss.driving) doBlowCycle();
        }, 180);
        doBlowCycle();
      });

      driveBtn.addEventListener('mouseup', () => {
        ss.driving = false;
        if (driveInterval) { clearInterval(driveInterval); driveInterval = null; }
      });

      driveBtn.addEventListener('mouseleave', () => {
        ss.driving = false;
        if (driveInterval) { clearInterval(driveInterval); driveInterval = null; }
      });

      ab.appendChild(driveBtn);
    },
    cleanup() {
      OBJ.hammerAnimating = false;
    }
  },

  /* ─────────────────── 5: Pile Refusal ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.driving = false;
      ss.depth = STATE.drivenDepth;
      ss.blows = STATE.totalBlows;
      ss.recentBlows = [];
      ss.refusalAchieved = false;
      ss.hammerCycleActive = false;

      // Build rig
      const rig = buildDrivingRig(0, -1);
      addStep(rig);
      OBJ.rig = rig;

      // Build pile at current driven position
      const pile = buildPile(false);
      pile.position.set(0, 8 - ss.depth, 0);
      addStep(pile);
      OBJ.pileGroup = pile;

      // Position hammer
      if (OBJ.hammer) {
        OBJ.hammer.position.y = pile.position.y + 10 + 0.8;
      }

      const ab = DOM.actionBar();
      ab.innerHTML = '';

      // Stats display
      const statsDiv = el('div', 'blow-display', '');
      statsDiv.innerHTML = `
        <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:center;">
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Depth</div>
            <div id="ref-depth" style="color:#f5a623;font-size:1.1rem;font-weight:700;">${ss.depth.toFixed(1)}m</div>
          </div>
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Blow Count</div>
            <div id="ref-blows" style="color:#fff;font-size:1.1rem;font-weight:700;">${ss.blows}</div>
          </div>
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Pen./Blow</div>
            <div id="ref-pen" style="color:#fff;font-size:1.1rem;font-weight:700;">--</div>
          </div>
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Last 10 Blows</div>
            <div id="ref-last10" style="color:#fff;font-size:1.1rem;font-weight:700;">--</div>
          </div>
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Layer</div>
            <div id="ref-layer" style="color:#C4843A;font-size:0.85rem;font-weight:700;">Dense Sand</div>
          </div>
        </div>
      `;
      ab.appendChild(statsDiv);

      // Penetration sequence for refusal
      const penSequence = [25, 20, 15, 12, 10, 8, 6, 5, 4, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1];
      let penIndex = 0;

      function doRefusalBlow() {
        if (ss.hammerCycleActive || ss.refusalAchieved) return;
        ss.hammerCycleActive = true;

        const hammerStartY = OBJ.pileGroup.position.y + 10 + 0.8;
        if (OBJ.hammer) OBJ.hammer.position.y = hammerStartY;

        const riseTarget = hammerStartY + 2;
        let riseT = 0;
        const riseInterval = safeInterval(() => {
          riseT += 0.20;          // fast rise (matches step 5 speed)
          if (riseT >= 1) {
            clearInterval(riseInterval);
            if (OBJ.hammer) OBJ.hammer.position.y = riseTarget;

            let fallT = 0;
            const fallInterval = safeInterval(() => {
              fallT += 0.35;      // fast fall
              if (fallT >= 1) {
                clearInterval(fallInterval);
                if (OBJ.hammer) OBJ.hammer.position.y = hammerStartY;

                // Impact
                const pen = penSequence[Math.min(penIndex, penSequence.length - 1)];
                penIndex++;
                const penMeters = pen / 1000;
                ss.depth += penMeters;
                ss.blows++;
                ss.recentBlows.push(pen);
                if (ss.recentBlows.length > 10) ss.recentBlows.shift();

                // Move pile
                OBJ.pileGroup.position.y = 8 - ss.depth;

                // Flash
                if (OBJ.impactFlash) {
                  OBJ.impactFlash.visible = true;
                  OBJ.impactFlash.position.y = OBJ.pileGroup.position.y + 10;
                  safeTimeout(() => { if (OBJ.impactFlash) OBJ.impactFlash.visible = false; }, 100);
                }

                spawnParticles(
                  new THREE.Vector3(0, Math.max(0, OBJ.pileGroup.position.y + 10), 0),
                  MAT.denseSand, 3
                );

                // Update hammer position
                if (OBJ.hammer) OBJ.hammer.position.y = OBJ.pileGroup.position.y + 10 + 0.8;

                // Update stats
                const depthEl = $('ref-depth');
                const blowsEl = $('ref-blows');
                const penEl = $('ref-pen');
                const last10El = $('ref-last10');
                const layerEl = $('ref-layer');
                if (depthEl) depthEl.textContent = ss.depth.toFixed(1) + 'm';
                if (blowsEl) blowsEl.textContent = ss.blows;
                if (penEl) penEl.textContent = pen + 'mm';

                // Last 10 blows total
                const last10Total = ss.recentBlows.reduce((a, b) => a + b, 0);
                if (last10El) {
                  last10El.textContent = ss.recentBlows.length >= 10
                    ? last10Total + 'mm'
                    : `${ss.recentBlows.length}/10 blows`;
                }

                // Update layer display
                if (ss.depth >= 16) {
                  if (layerEl) {
                    layerEl.textContent = 'Bearing Layer';
                    layerEl.style.color = '#607080';
                  }
                }

                markSubtask(0); // monitoring penetration
                if (pen <= 8) markSubtask(1); // decreasing movement

                // Check refusal: last 10 blows < 25mm total
                if (ss.recentBlows.length >= 10 && last10Total < 25) {
                  ss.refusalAchieved = true;
                  markSubtask(2);
                  STATE.drivenDepth = ss.depth;
                  STATE.totalBlows = ss.blows;

                  // Show refusal banner
                  showFeedback('correct', 'PILE REFUSAL ACHIEVED! Last 10 blows: ' + last10Total + 'mm total.');

                  const bannerDiv = el('div', 'refusal-banner', '');
                  bannerDiv.innerHTML = `
                    <div style="background:rgba(39,174,96,0.2);border:2px solid #27ae60;border-radius:8px;padding:12px;margin-top:10px;text-align:center;">
                      <div style="color:#27ae60;font-size:1.2rem;font-weight:700;">PILE REFUSAL ACHIEVED</div>
                      <div style="color:#ccc;font-size:0.8rem;margin-top:4px;">
                        Final Depth: ${ss.depth.toFixed(1)}m | Total Blows: ${ss.blows} | Last 10 Blows: ${last10Total}mm
                      </div>
                    </div>
                  `;
                  ab.appendChild(bannerDiv);

                  // Add confirm button
                  const confirmBtn = makeBtn('Confirm Refusal', 'btn-green', () => {
                    markSubtask(3);
                    showFeedback('correct', 'Refusal confirmed! Pile at final depth.');
                    safeTimeout(() => completeStep(), 1200);
                  });
                  confirmBtn.style.marginTop = '8px';
                  ab.appendChild(confirmBtn);
                }

                ss.hammerCycleActive = false;
              } else {
                if (OBJ.hammer) {
                  OBJ.hammer.position.y = riseTarget - (riseTarget - hammerStartY) * fallT;
                }
              }
            }, 20);
            return;
          }
          if (OBJ.hammer) {
            OBJ.hammer.position.y = hammerStartY + (riseTarget - hammerStartY) * riseT;
          }
        }, 20);
      }

      // Drive button
      const driveBtn = makeBtn('DRIVE', 'btn-primary', () => {});
      driveBtn.style.cssText += 'font-size:1.1rem;padding:12px 40px;background:#c62828;color:#fff;';

      let driveInterval = null;

      driveBtn.addEventListener('mousedown', () => {
        if (ss.refusalAchieved) return;
        ss.driving = true;
        driveInterval = safeInterval(() => {
          if (ss.driving && !ss.refusalAchieved) doRefusalBlow();
        }, 180);
        doRefusalBlow();
      });

      driveBtn.addEventListener('mouseup', () => {
        ss.driving = false;
        if (driveInterval) { clearInterval(driveInterval); driveInterval = null; }
      });

      driveBtn.addEventListener('mouseleave', () => {
        ss.driving = false;
        if (driveInterval) { clearInterval(driveInterval); driveInterval = null; }
      });

      ab.appendChild(driveBtn);
    },
    cleanup() {}
  },
  /* ─────────────────── 6: Formwork ─── */
  {
    enter() {
      buildPilesForStep();
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
        { key: 'north', icon: '🪵', label: 'North Wall' },
        { key: 'south', icon: '🪵', label: 'South Wall' },
        { key: 'east',  icon: '🪵', label: 'East Wall'  },
        { key: 'west',  icon: '🪵', label: 'West Wall'  }
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
          item.innerHTML += '<div style="color:var(--green-ok);font-size:.85rem;margin-top:2px;">✓ Placed</div>';

          // Animate panel flying down into pit
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

  /* ─────────────────── 7: Reinforcement ─── */
  {
    enter() {
      buildPilesForStep();
      const ss = STATE.stepState;
      ss.lowerDone = false;
      ss.upperDone = false;

      buildFormwork3D();

      /*
       * Dense 11×11 rebar mat — tight 0.4-unit square cells with concrete spacer chairs.
       * Lower mat: 11 bars running along X (spaced in Z), land at y=-4.90
       * Upper mat: 11 bars running along Z (spaced in X), land at y=-4.83
       * Spacer chairs drop first, then lower mat cascades, then upper mat cascades.
       */
      const matPositions = [-2.0, -1.6, -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6, 2.0];
      const barLen = 4.5;

      // Spacer chairs (9 blocks — placed before lower mat)
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

      // Lower mat meshes (bars along X, spaced in Z)
      const lowerBars = matPositions.map((z, i) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, barLen, 8), MAT.steel);
        m.rotation.z = Math.PI / 2;
        m.position.set(0, 6 + i * 0.25, z);
        m.castShadow = true;
        addStep(m);
        return m;
      });

      // Upper mat meshes (bars along Z, spaced in X) — rotation.x = PI/2 so they lie flat
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
              // ease-out: fast start, slow landing
              const ease = 1 - Math.pow(1 - t, 3);
              m.position.y = startY + (targetY - startY) * ease;
              if (t >= 1) {
                m.position.y = targetY;
                clearInterval(iv);
                if (i === bars.length - 1) onDone();
              }
            }, 16);
          }, i * 80);  // 80ms stagger per bar
        });
      }

      const actionBar = DOM.actionBar();
      actionBar.innerHTML = '<span style="color:#e0c87a;font-size:.78rem;width:100%;text-align:center;display:block;margin-bottom:4px;">Place lower mat first, then cross mat on top</span>';

      // Lower mat button
      const lowerItem = el('div', 'panel-item');
      lowerItem.innerHTML = `
        <div class="item-icon" style="font-family:monospace;font-size:1.1rem;color:#78909c;">═══</div>
        <div class="item-label">Lower Mat<br><span style="font-size:.68rem;color:#aaa;">8 longitudinal bars (base layer)</span></div>
      `;
      lowerItem.addEventListener('click', () => {
        if (ss.lowerDone) return;
        ss.lowerDone = true;
        lowerItem.classList.add('placed');
        lowerItem.innerHTML += '<div style="color:var(--green-ok);font-size:.8rem;margin-top:2px;">✓ Placed</div>';
        markSubtask(0);
        showFeedback('info', 'Placing spacer chairs, then lower mat…');
        // Drop chairs first, then cascade bars after a short delay
        dropBars(chairs, -4.95, () => {
          dropBars(lowerBars, -4.90, () => {
            showFeedback('correct', 'Lower mat in place! Now place the cross mat.');
            upperItem.style.opacity = '1';
            upperItem.style.pointerEvents = 'auto';
          });
        });
      });

      // Upper mat button (locked until lower mat is placed)
      const upperItem = el('div', 'panel-item');
      upperItem.style.opacity = '0.4';
      upperItem.style.pointerEvents = 'none';
      upperItem.innerHTML = `
        <div class="item-icon" style="font-family:monospace;font-size:1.1rem;color:#78909c;">⊞⊞⊞</div>
        <div class="item-label">Cross Mat<br><span style="font-size:.68rem;color:#aaa;">8 cross bars (top layer)</span></div>
      `;
      upperItem.addEventListener('click', () => {
        if (ss.upperDone || !ss.lowerDone) return;
        ss.upperDone = true;
        upperItem.classList.add('placed');
        upperItem.innerHTML += '<div style="color:var(--green-ok);font-size:.8rem;margin-top:2px;">✓ Placed</div>';
        markSubtask(1);
        showFeedback('info', 'Cross mat dropping into pit…');
        dropBars(upperBars, -4.83, () => {
          showFeedback('correct', '✅ Base rebar grid complete! Now place column rebar.');
          safeTimeout(phase_columnRebar, 600);
        });
      });

      function phase_columnRebar() {
        ss.colRebarPlaced = 0;
        const COL_H  = 6;
        const COL_CY = -1.2;
        const COL_BOT = COL_CY - COL_H / 2;  // -4.2
        const colXZ  = [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]];

        // Column rebar bars (hidden until clicked) — added directly to scene so they
        // persist across step changes (not via addStep which gets cleared each step).
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

        // Stirrups (shown after all 4 bars placed) — also persistent
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

        // Click targets on footing level
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

            // Grow rebar upward
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
              showFeedback('correct', '✅ All column rebar placed! Reinforcement complete.');
              safeTimeout(() => {
                markSubtask(3);
                DOM.actionBar().innerHTML = '';
                DOM.actionBar().appendChild(makeBtn('✅ Reinforcement Complete', 'btn btn-green', () => completeStep()));
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

  /* ─────────────────── 8: Concrete Placement ─── */
  {
    enter() {
      buildPilesForStep();
      const ss = STATE.stepState;
      ss.fillPct  = 0;
      ss.pouring  = false;
      ss.complete = false;
      ss.pourIv   = null;

      buildFormwork3D();
      buildRebar3D();
      buildConcreteTruck3D();
      buildPourStream();

      // Concrete fill mesh (grows upward from pit floor)
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

      const pourBtn = makeBtn('🚛 POUR CONCRETE', 'btn btn-primary', null);
      pourBtn.id = 'pour-btn';
      actionBar.appendChild(pourBtn);
      actionBar.appendChild(el('span', '', '<span style="color:#aaa;font-size:.76rem;">Hold button • Target: 88–98%</span>'));

      function updateFillVisual() {
        const pct = ss.fillPct;
        const b = $('conc-meter-bar');
        const p = $('conc-pct-label');
        if (b) b.style.width = pct + '%';
        if (p) p.textContent = Math.round(pct) + '%';
        // Scale fill mesh height: max 0.35 at 100% (fills footing slab only, not the whole pit)
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
          penalize('Underfill — pour more concrete!');
        } else if (pct > 98) {
          STATE.score = Math.max(0, STATE.score - 20);
          updateHUD(); shakeScene();
          showFeedback('wrong', '⚠️ Overfill! (−20 pts)');
          ss.complete = true;
          pourBtn.disabled = true;
          safeTimeout(() => {
            DOM.actionBar().innerHTML = '';
            DOM.actionBar().appendChild(makeBtn('⬇️ Proceed (Overfill Noted)', 'btn btn-secondary', () => completeStep()));
          }, 1200);
        } else {
          ss.complete = true;
          pourBtn.disabled = true;
          STATE.score += 20; updateHUD();
          markSubtask(0); markSubtask(1);
          showFeedback('correct', `🎉 Perfect pour at ${Math.round(pct)}%! +20 bonus!`);
          safeTimeout(() => {
            DOM.actionBar().innerHTML = '';
            DOM.actionBar().appendChild(makeBtn('✅ Confirm Pour', 'btn btn-green', () => completeStep()));
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

  /* ─────────────────── 9: Inspection ─── */
  {
    enter() {
      buildPilesForStep();
      const ss = STATE.stepState;
      ss.checked   = 0;
      ss.checkedSet = new Set();

      buildFormwork3D();
      buildRebar3D();
      buildConcreteSlab3D();   // footing at pit floor y=-4.85
      buildInspector3D(4.5, 4.5);

      /* ── Inspection definitions ─────────────────────────── */
      const inspDefs = [
        {
          pos:   new THREE.Vector3(0, -4.2, 0),
          label: 'Pit Depth',
          icon:  '📏',
          note:  '5.0m depth — within design specification',
          camPos:  new THREE.Vector3(-6, 0.5, 6.5),
          camLook: new THREE.Vector3(0, -2.5, 0)
        },
        {
          pos:   new THREE.Vector3(2.0, -2.0, 2.0),
          label: 'Formwork Alignment',
          icon:  '📐',
          note:  'Plumb ±3mm, square within 5mm ✓',
          camPos:  new THREE.Vector3(6, 1.5, 8),
          camLook: new THREE.Vector3(0, -2.5, 0)
        },
        {
          pos:   new THREE.Vector3(-1.2, -4.35, -1.2),
          label: 'Rebar Cover & Spacing',
          icon:  '⚙️',
          note:  '72mm bar spacing, 50mm edge cover ✓',
          camPos:  new THREE.Vector3(1, 1, 8),
          camLook: new THREE.Vector3(0, -4.2, 0)
        },
        {
          pos:   new THREE.Vector3(0, -0.5, 0),
          label: 'Concrete Fill Level',
          icon:  '🔲',
          note:  '93% fill — within the 88–98% target zone ✓',
          camPos:  new THREE.Vector3(6, 5, 9),
          camLook: new THREE.Vector3(0, -0.5, 0)
        }
      ];

      /* ── 3D markers (large OctahedronGeometry, easy to click) ── */
      const markerMeshes = [];
      const labelEls     = [];
      inspDefs.forEach((def, i) => {
        const mat = new THREE.MeshStandardMaterial({
          color: 0xf39c12, emissive: 0xe07000, emissiveIntensity: 0.55,
          transparent: true, opacity: 0.88
        });
        const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.46), mat);
        marker.position.copy(def.pos);
        marker.position.y += 0.55;  // float above reference point
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

      /* ── HTML inspection cards in action bar ─────────────── */
      const ab = DOM.actionBar();
      ab.innerHTML = '';
      ab.appendChild(el('div', 'step-instruction',
        '🔍 Click an inspection point in the scene <strong>or</strong> press Inspect below'));

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

      /* ── Shared inspection function ──────────────────────── */
      function runInspection(i) {
        if (ss.checkedSet.has(i)) return;
        ss.checkedSet.add(i);
        ss.checked++;

        // Update 3D marker to green
        const marker = markerMeshes[i];
        marker.material.color.set(0x27ae60);
        marker.material.emissive.set(0x1e8449);
        marker.material.emissiveIntensity = 0.3;
        labelEls[i].classList.add('passed');

        // Update HTML card
        const card = cardEls[i];
        card.style.background  = 'rgba(39,174,96,0.12)';
        card.style.borderColor = 'rgba(39,174,96,0.5)';
        const btn = card.querySelector('button');
        if (btn) { btn.textContent = '✓ PASS'; btn.style.cssText += ';background:#27ae60;color:#fff;cursor:default'; btn.disabled = true; }

        // Fly camera to inspect area
        const def = inspDefs[i];
        camTarget = { pos: def.camPos.clone(), look: def.camLook.clone() };

        showFeedback('correct', `${def.label}: PASS ✓`);
        markSubtask(i < 4 ? i : 3);

        if (ss.checked === inspDefs.length) {
          markSubtask(3);
          safeTimeout(() => {
            ab.innerHTML = '';
            ab.appendChild(makeBtn('📝 Sign Off Inspection', 'btn btn-green', () => completeStep()));
            showFeedback('correct', 'All 4 inspections passed! Sign off to proceed.');
          }, 700);
        }
      }
    },
    cleanup() {}
  },

  /* ─────────────────── 10: Curing ─── */
  {
    enter() {
      buildPilesForStep();
      const ss = STATE.stepState;
      ss.day          = 1;
      ss.totalDays    = 7;
      ss.strength     = 0;
      ss.wateredToday = false;
      ss.missedDays   = 0;
      ss.complete     = false;

      buildFormwork3D();
      buildRebar3D();

      // Concrete slab filling the pit (grows darker as it cures)
      const concMat = MAT.concrete.clone();
      const concMesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 4.8, 4.6), concMat);
      concMesh.position.set(0, -2.6, 0);   // center of 4.8-unit tall fill starting at y=-5
      addStep(concMesh);
      OBJ.curingConcrete = concMesh;

      // Curing blanket draped over the pit opening at ground level
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

        const waterBtn = makeBtn('💧 Water Concrete', 'btn btn-primary', () => {
          if (ss.wateredToday) { showFeedback('info', 'Already watered today.'); return; }
          ss.wateredToday = true;
          waterBtn.disabled = true;
          showFeedback('correct', `Day ${ss.day} watered!`);
          updateStrength(true);
          // Water particle effect
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
          ab.appendChild(makeBtn('⏭️ Next Day', 'btn btn-secondary', advanceDay));
        }
      }

      function updateStrength(watered) {
        const gain = watered ? (100 / ss.totalDays) : (100 / ss.totalDays / 2);
        ss.strength = Math.min(100, ss.strength + gain);
        const b = $('strength-bar'); const p = $('strength-pct');
        if (b) b.style.width = ss.strength + '%';
        if (p) p.textContent = Math.round(ss.strength) + '%';
        markSubtask(0);
        // Darken concrete
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
          showFeedback('wrong', `Missed watering Day ${ss.day}! (−10 pts)`);
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
        DOM.actionBar().appendChild(makeBtn('✅ Curing Complete', 'btn btn-green', () => completeStep()));
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

  /* ─────────────────── 11: Final Inspection ─── */
  {
    enter() {
      buildPilesForStep();
      const ss = STATE.stepState;
      ss.checked = 0;
      ss.scores  = [];

      buildConcreteSlab3D();   // footing visible at pit floor
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
              `<strong>${chk.label}</strong><span style="color:#f5a623;font-weight:700;">${score}%</span><span style="font-size:.7rem;opacity:.8;">${chk.note}</span>`,
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
                    makeBtn(`🏗️ Proceed to Pillar (Avg: ${avg}%)`, 'btn btn-green', () => completeStep())
                  );
                  showFeedback('correct', `Average score: ${avg}% — excellent!`);
                } else {
                  showFeedback('wrong', `Average: ${avg}% — below threshold.`);
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

  /* ─────────────────── 12: Pillar Construction ─── */
  {
    enter() {
      buildPilesForStep();
      const ss = STATE.stepState;
      ss.fwPlaced      = 0;
      ss.concPct       = 0;
      ss.concreteComplete = false;
      ss.fwStripped    = 0;
      ss.waterClicks   = 0;
      ss.phase         = 'formwork';

      /*
       * Ground level = y 0.  Pit is 5 units deep.
       * Column height = 6.  Center at y = -1.2  →  spans y = -4.2 to y = +1.8
       * Underground : 4.2 units  (70 %)
       * Above ground: 1.8 units  (30 %)
       */
      const COL_H   = 6;
      const COL_CY  = -1.2;          // centre y
      const COL_BOT = COL_CY - COL_H / 2;   // -4.2  (pour start)
      const COL_TOP = COL_CY + COL_H / 2;   //  1.8  (cap sits here)
      const COL_W   = 0.8;           // column width  (X)
      const COL_D   = 0.8;           // column depth  (Z) — square section

      // Foundation slab visible at pit floor
      buildConcreteSlab3D();

      // Make ground, pit walls and grass 80% transparent so the underground
      // column construction is clearly visible through the surrounding geometry
      groundGroup.children.forEach(child => {
        child.traverse(obj => {
          if (!obj.isMesh) return;
          obj.material = obj.material.clone();
          obj.material.transparent = true;
          obj.material.opacity     = 0.2;
          obj.material.depthWrite  = false;
        });
      });

      // Column rebar cage — persistent objects placed during the Reinforcement step,
      // still in the scene. Reference them from OBJ to hide after formwork strip.
      const colRebarMeshes = OBJ.columnRebarMeshes || [];
      const stirrupGroup   = OBJ.columnStirrupGroup || null;

      // Column formwork (2 flat panels, left & right of rectangular column)
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

      // Column concrete mesh — rectangular, grows upward from COL_BOT
      const colMat = MAT.concrete.clone();
      const colMesh = new THREE.Mesh(new THREE.BoxGeometry(COL_W, 0.01, COL_D), colMat);
      colMesh.position.set(0, COL_BOT, 0);
      colMesh.visible = false;
      addStep(colMesh);
      OBJ.columnConcrete = colMesh;

      // Final pillar mesh — rectangular column
      const pillarMat = new THREE.MeshLambertMaterial({ color: 0x616161, map: TEX.concrete });
      const pillarMesh = new THREE.Mesh(new THREE.BoxGeometry(COL_W, COL_H, COL_D), pillarMat);
      pillarMesh.position.set(0, COL_CY, 0);
      pillarMesh.visible = false;
      pillarMesh.castShadow = true;
      addStep(pillarMesh);

      // Pillar cap — slightly wider than column, sits at top
      const capMesh = new THREE.Mesh(
        new THREE.BoxGeometry(COL_W + 0.3, 0.2, COL_D + 0.3),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
      );
      capMesh.position.set(0, COL_TOP + 0.1, 0);
      capMesh.visible = false;
      capMesh.castShadow = true;
      addStep(capMesh);

      // Start directly at formwork phase (rebar already placed in Step 5)
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
          item.innerHTML = `<div class="item-icon">🪵</div><div class="item-label">${h.label}</div>`;
          item.addEventListener('click', () => {
            if (item.classList.contains('placed')) return;
            item.classList.add('placed');
            item.innerHTML += '<div style="color:var(--green-ok);font-size:.8rem;margin-top:2px;">✓</div>';
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

        const pourBtn = makeBtn('🚛 POUR COLUMN', 'btn btn-primary', null);
        DOM.actionBar().appendChild(pourBtn);
        DOM.actionBar().appendChild(el('span', '', '<span style="color:#aaa;font-size:.76rem;">Hold • Target 88–98%</span>'));

        let pourIv = null;

        function startPour() {
          if (ss.concreteComplete) return;
          pourBtn.style.background = '#d4880a';
          pourIv = setInterval(() => {
            ss.concPct = Math.min(100, ss.concPct + 1.5);
            const b = $('col-bar'); const p = $('col-pct');
            if (b) b.style.width = ss.concPct + '%';
            if (p) p.textContent = Math.round(ss.concPct) + '%';
            // Grow upward from COL_BOT
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
            showFeedback('wrong', '⚠️ Column overfilled! (−20 pts)');
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

          const waterBtn = makeBtn('💧 Water Column Concrete', 'btn btn-primary', () => {
            ss.waterClicks++;
            const b = $('col-strength-bar'); const p = $('col-strength-pct');
            if (b) b.style.width = (ss.waterClicks / WATER_DAYS * 100) + '%';
            if (p) p.textContent = Math.round(ss.waterClicks / WATER_DAYS * 100) + '%';
            // Water particle effect on column top
            for (let i = 0; i < 15; i++) {
              spawnParticles(
                new THREE.Vector3((Math.random() - 0.5) * 1.2, COL_TOP + 0.2, (Math.random() - 0.5) * 1.2),
                MAT.waterBlue.clone(), 1
              );
            }
            showFeedback('correct', `Column watered — Day ${ss.waterClicks}/${WATER_DAYS}.`);
            if (ss.waterClicks >= WATER_DAYS) {
              markSubtask(2);
              waterBtn.disabled = true;
              showFeedback('correct', '✅ Column concrete cured! Strip the formwork.');
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
              // Animate fade out
              let t = 1;
              const iv = setInterval(() => {
                t -= 0.05;
                half.material.transparent = true;
                half.material.opacity = Math.max(0, t);
                if (t <= 0) { half.visible = false; clearInterval(iv); }
              }, 16);

              if (ss.fwStripped === 2) {
                markSubtask(3);
                // Hide temp concrete mesh, show final pillar
                if (colMesh) colMesh.visible = false;
                colRebarMeshes.forEach(r => r.visible = false);
                pillarMesh.visible = true;
                capMesh.visible    = true;

                // Animate pillar scale from 0
                pillarMesh.scale.y = 0.001;
                capMesh.scale.y    = 0.001;
                let t2 = 0;
                const iv2 = setInterval(() => {
                  t2 = Math.min(1, t2 + 0.04);
                  pillarMesh.scale.y = t2;
                  capMesh.scale.y    = t2;
                  if (t2 >= 1) clearInterval(iv2);
                }, 16);

                showFeedback('correct', '🎉 Pillar complete! Now backfill around it.');
                safeTimeout(() => {
                  DOM.actionBar().innerHTML = '';
                  DOM.actionBar().appendChild(
                    makeBtn('🪣 Proceed to Backfilling', 'btn btn-green', () => completeStep())
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
      // Restore ground opacity — ground is rebuilt on next startStep() anyway,
      // but this keeps things clean if the step is re-entered
      groundGroup.children.forEach(child => {
        child.traverse(obj => {
          if (!obj.isMesh) return;
          obj.material.transparent = false;
          obj.material.opacity     = 1.0;
          obj.material.depthWrite  = true;
        });
      });
      // Remove the persistent column rebar (placed in Reinforcement step, kept alive until now)
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

  /* ─────────────────── 13: Backfilling ─── */
  {
    enter() {
      buildPilesForStep();
      const ss = STATE.stepState;
      ss.fillClicks    = 0;
      ss.compactClicks = 0;
      ss.fillPct       = 0;
      ss.compactPct    = 0;
      ss.maxFill       = 5;
      ss.maxCompact    = 3;

      /*
       * Show the completed pillar standing in the open pit, then fill soil
       * around it until only the above-ground portion (y=0 to y=+1.8) is visible.
       */
      const COL_H  = 6;
      const COL_CY = -1.2;
      const COL_TOP = COL_CY + COL_H / 2;  // +1.8
      const COL_W  = 0.8;
      const COL_D  = 0.8;

      buildConcreteSlab3D();   // footing at pit floor
      buildCompactor3D(4.5, 1.5);

      // Completed rectangular pillar (visual only — result of step 10)
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

      // Backfill — 4 dirt slabs surrounding the column so the column stays visible
      // as the fill rises. Pit is 8×8 m (half=4), column section is COL_W×COL_D.
      const PIT  = 4.0;  // half-width of pit
      const CW2  = COL_W / 2 + 0.05;  // half col width + gap
      const CD2  = COL_D / 2 + 0.05;  // half col depth + gap
      const bfDirtMat = MAT.dirt.clone();
      // [width, depth, cx, cz]
      const bfPieces = [
        [PIT * 2,        PIT - CD2,     0,           -(CD2 + (PIT - CD2) / 2)],  // North
        [PIT * 2,        PIT - CD2,     0,            (CD2 + (PIT - CD2) / 2)],  // South
        [PIT - CW2,      CD2 * 2,      -(CW2 + (PIT - CW2) / 2), 0],             // West
        [PIT - CW2,      CD2 * 2,       (CW2 + (PIT - CW2) / 2), 0]              // East
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

      const soilBtn = makeBtn('🪣 Add Soil', 'btn btn-primary', () => {
        if (ss.fillClicks >= ss.maxFill) return;
        ss.fillClicks++;
        ss.fillPct = Math.round((ss.fillClicks / ss.maxFill) * 100);
        const b = $('bf-fill-bar'); const p = $('bf-fill-pct');
        if (b) b.style.width = ss.fillPct + '%';
        if (p) p.textContent = ss.fillPct + '%';

        // Grow all 4 backfill pieces from pit bottom (y=-5) to grade (y=0)
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

      const compactBtn = makeBtn('🔨 Compact', 'btn btn-secondary', () => {
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
          showFeedback('correct', '🎉 Backfilling complete! Only the pillar top stands above ground.');
          ab.innerHTML = '';
          ab.appendChild(makeBtn('🏆 Construction Complete!', 'btn btn-green', () => completeStep()));
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
