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
    title: '3. Pile Selection',
    desc: 'Choose the appropriate pile type for this medium-rise structure on soft clay over dense sand.',
    subtasks: ['Review pile options', 'Select correct pile type', 'Confirm selection'],
    why: 'Pile type affects cost, installation method, load capacity, and suitability for soil conditions.',
    warning: 'Timber piles decay in alternating wet/dry conditions. Steel piles corrode in aggressive soils.'
  },
  {
    title: '4. Position Pile',
    desc: 'Use the crane to lift the concrete pile from storage and position it over the pile marker.',
    subtasks: ['Attach lifting sling', 'Crane lifts pile vertical', 'Guide pile to position'],
    why: 'Correct positioning ensures the pile is driven to the design location under the column.',
    warning: 'Never stand under a suspended pile. Maintain clear exclusion zone during lifting.'
  },
  {
    title: '5. Alignment Check',
    desc: 'Verify the pile is perfectly vertical using theodolite readings from two directions.',
    subtasks: ['Check North-South verticality', 'Check East-West verticality', 'Confirm within ±0.5°'],
    why: 'An out-of-plumb pile induces bending. Tolerance is typically ±1:75 (0.75°).',
    warning: 'Misaligned piles transfer load eccentrically, reducing capacity and causing structural problems.'
  },
  {
    title: '6. Drive Pile',
    desc: 'Operate the drop hammer to drive the pile through soft soils to the bearing layer.',
    subtasks: ['Begin driving in topsoil', 'Drive through soft clay', 'Drive through loose sand', 'Enter dense sand'],
    why: 'Impact energy is transferred through the pile to the tip, which displaces and compresses soil.',
    warning: 'Monitor blow count carefully. Rapid change indicates layer change or obstruction.'
  },
  {
    title: '7. Reach Pile Refusal',
    desc: 'Recognize when the pile has reached the bearing layer and refusal condition is achieved.',
    subtasks: ['Monitor penetration per blow', 'Observe decreasing movement', 'Confirm refusal criteria', 'Record final depth'],
    why: 'Pile refusal indicates the pile tip has reached a strong bearing layer capable of carrying design loads.',
    warning: 'Premature refusal on an obstruction (boulder) must be distinguished from true bearing layer refusal.'
  },
  {
    title: '8. Cut Pile Head',
    desc: 'Cut the pile at the design cut-off level, removing damaged concrete from driving.',
    subtasks: ['Mark cut-off elevation', 'Cut concrete pile', 'Remove cutoff portion', 'Expose pile reinforcement'],
    why: 'The pile head is always damaged during driving. Cut-off removes damaged concrete and exposes rebar for the pile cap connection.',
    warning: 'Never cut below the design elevation — this reduces embedment into the pile cap.'
  },
  {
    title: '9. Construct Pile Cap',
    desc: 'Build the reinforced concrete pile cap connecting all 4 piles to support the column above.',
    subtasks: ['Place formwork', 'Place pile cap rebar', 'Pour concrete', 'Cure concrete (7 days)', 'Strip formwork'],
    why: 'The pile cap distributes the column load to all 4 piles and provides a rigid structural connection.',
    warning: 'Pile cap must fully embed all pile heads by minimum 75mm for proper structural connection.'
  },
  {
    title: '10. Final Inspection & Report',
    desc: 'Verify all construction elements and generate the final driven pile foundation report.',
    subtasks: ['Check pile layout', 'Verify design depth', 'Confirm blow count record', 'Inspect pile cap', 'Generate report'],
    why: 'Final inspection confirms the as-built foundation meets design specifications and regulatory requirements.',
    warning: 'All records must be signed by a licensed engineer before structure can proceed.'
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
    purpose: 'Select the pile material and type best suited for the soil and loading conditions.',
    userAction: 'Review three pile options and select the most appropriate type.',
    tools: ['Design specifications', 'Soil report', 'Pile catalogues'],
    qualityCheck: 'Selected pile type matches soil conditions and load requirements.',
    commonMistake: 'Choosing based on cost alone without considering durability and soil compatibility.',
    learningObjective: 'Pile selection depends on soil type, groundwater, loads, and durability requirements.'
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
    purpose: 'Remove damaged pile head material and prepare for pile cap connection.',
    userAction: 'Mark the cut-off elevation and cut the pile head.',
    tools: ['Concrete saw', 'Measuring tape', 'Level', 'Demolition hammer'],
    qualityCheck: 'Cut-off level matches design elevation; reinforcement exposed and undamaged.',
    commonMistake: 'Cutting too low reduces structural embedment into the pile cap.',
    learningObjective: 'Pile head trimming removes driving damage and prepares the pile cap connection.'
  },
  {
    purpose: 'Construct a reinforced concrete cap that ties all piles together and supports the column.',
    userAction: 'Place formwork, rebar, pour concrete, cure, and strip formwork.',
    tools: ['Formwork panels', 'Rebar mesh', 'Concrete pump', 'Vibrator', 'Curing compound'],
    qualityCheck: 'Pile cap dimensions, reinforcement, and concrete quality meet specifications.',
    commonMistake: 'Insufficient pile embedment into the cap reduces connection strength.',
    learningObjective: 'The pile cap is the critical link between deep foundation and superstructure.'
  },
  {
    purpose: 'Verify all as-built conditions and generate the final construction record.',
    userAction: 'Inspect 5 checkpoints and generate the completion report.',
    tools: ['Inspection checklist', 'As-built drawings', 'Driving records', 'Test reports'],
    qualityCheck: 'All items pass inspection and documentation is complete.',
    commonMistake: 'Missing driving records make it impossible to verify pile capacity.',
    learningObjective: 'Complete documentation is essential for structural verification and regulatory compliance.'
  }
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
  alignmentEW: 90 + (Math.random() - 0.5) * 3
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
scene.background = new THREE.Color(0x111827);  // engineering dark background

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
controls.maxDistance   = 60;
controls.target.set(0, -10, 0);

// Lighting — tuned for a dark engineering environment
// Bright enough to read soil colors and concrete clearly, no harsh shadows

const ambientLight = new THREE.AmbientLight(0xd0d8e8, 0.9);
scene.add(ambientLight);

// Primary key light — from upper front-right, illuminates the cutaway face
const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.8);
keyLight.position.set(20, 30, 20);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width  = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near   = 0.5;
keyLight.shadow.camera.far    = 100;
keyLight.shadow.camera.left   = -30;
keyLight.shadow.camera.right  =  30;
keyLight.shadow.camera.top    =  30;
keyLight.shadow.camera.bottom = -30;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

// Fill light — from left, softens shadows on underground section
const fillLight = new THREE.DirectionalLight(0xb0c8e0, 0.6);
fillLight.position.set(-15, 10, 5);
scene.add(fillLight);

// Rim light — from below/behind to separate soil layers
const rimLight = new THREE.DirectionalLight(0x506070, 0.4);
rimLight.position.set(0, -20, -10);
scene.add(rimLight);

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
}

/* ══════════════════════════════════════════════════════════════
   CAMERA PRESETS
══════════════════════════════════════════════════════════════ */

// Camera presets — all oriented to show the underground section prominently.
// Target y=-10 puts the centre of the soil profile in view.
const CAM_PRESETS = [
  { pos: new THREE.Vector3(16,  4, 22), look: new THREE.Vector3(0, -5, 0) },   // 0 investigation (surface + section)
  { pos: new THREE.Vector3(12,  8, 16), look: new THREE.Vector3(0,  0, 0) },   // 1 layout (ground plan)
  { pos: new THREE.Vector3(14,  4, 18), look: new THREE.Vector3(0,  0, 0) },   // 2 pile selection
  { pos: new THREE.Vector3(12,  6, 16), look: new THREE.Vector3(0,  5, 0) },   // 3 position pile (showing rig)
  { pos: new THREE.Vector3(9,   5, 13), look: new THREE.Vector3(0,  4, 0) },   // 4 alignment check
  { pos: new THREE.Vector3(18,  0, 24), look: new THREE.Vector3(0, -8, 0) },   // 5 drive pile (section view)
  { pos: new THREE.Vector3(18, -4, 24), look: new THREE.Vector3(0,-14, 0) },   // 6 pile refusal (deep section)
  { pos: new THREE.Vector3(10,  2, 14), look: new THREE.Vector3(0,  0, 0) },   // 7 cut pile head
  { pos: new THREE.Vector3(14,  0, 18), look: new THREE.Vector3(0, -2, 0) },   // 8 pile cap
  { pos: new THREE.Vector3(16, -2, 20), look: new THREE.Vector3(0, -5, 0) }    // 9 final inspection
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

  // Compacted construction site surface — dark earth, no grass.
  // Leaves front-right quadrant (x:0→6, z:0→6) open for soil cutaway.
  const surfMat = new THREE.MeshLambertMaterial({ color: 0x2e2820 });
  surfMat.polygonOffset      = true;
  surfMat.polygonOffsetFactor = -1;
  surfMat.polygonOffsetUnits  = -1;

  // Piece 1: Full left (x:-10→0, z:-10→10)
  const m1 = new THREE.Mesh(new THREE.PlaneGeometry(10, 20), surfMat);
  m1.rotation.x = -Math.PI / 2; m1.position.set(-5, 0.005, 0); m1.receiveShadow = true;
  groundGroup.add(m1);

  // Piece 2: Right back (x:0→10, z:-10→0)
  const m2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), surfMat);
  m2.rotation.x = -Math.PI / 2; m2.position.set(5, 0.005, -5); m2.receiveShadow = true;
  groundGroup.add(m2);

  // Piece 3: Right front past cutaway (x:6→10, z:0→10)
  const m3 = new THREE.Mesh(new THREE.PlaneGeometry(4, 10), surfMat);
  m3.rotation.x = -Math.PI / 2; m3.position.set(8, 0.005, 5); m3.receiveShadow = true;
  groundGroup.add(m3);

  // Piece 4: Narrow strip (x:0→6, z:6→10)
  const m4 = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), surfMat);
  m4.rotation.x = -Math.PI / 2; m4.position.set(3, 0.005, 8); m4.receiveShadow = true;
  groundGroup.add(m4);

  // Grade-level edge lines — amber hairlines marking the cut face at y≈0
  const edgeMat = new THREE.MeshLambertMaterial({ color: 0xf5a623 });
  const ex = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.05), edgeMat);
  ex.position.set(3, 0.025, 0); groundGroup.add(ex);
  const ez = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 6), edgeMat);
  ez.position.set(0, 0.025, 3); groundGroup.add(ez);
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
  // Precast concrete cylinder pile — 400 mm diameter, 20 m long
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
  buildSoilLayers();
  buildGradeLine();
  startStep(0);
  animate();
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
  STATE.score = 1000;
  STATE.penalties = 0;
  STATE.drivenDepth = 0;
  STATE.totalBlows = 0;
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

  // Particle update
  updateParticles(dt);

  update3DLabels();
  controls.update();
  renderer.render(scene, camera);
}

/* ══════════════════════════════════════════════════════════════
   STEP HANDLERS
══════════════════════════════════════════════════════════════ */

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

        const label = create3DLabel(g, `BH-${i + 1}`, '');

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
                showFeedback('correct', 'Soil Profile: 2m Topsoil, 4m Soft Clay, 5m Loose Sand, 5m Dense Sand, Rock. DRIVEN PILE FOUNDATION REQUIRED.');
                safeTimeout(() => {
                  ab.innerHTML = '<div class="step-instruction" style="color:#27ae60;">Recommendation: DRIVEN PILE FOUNDATION REQUIRED. Shallow foundations not suitable — bearing layer at 16m depth.</div>';
                  safeTimeout(() => completeStep(), 2000);
                }, 1500);
              });
              ab.appendChild(submitBtn);
            }
          }
        });
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

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click each pulsing boring marker (BH-1 to BH-5) to conduct soil tests</div>';
    },
    cleanup() {}
  },

  /* ─────────────────── 1: Pile Layout ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.placed = 0;
      ss.total = 4;

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

        // Center dot
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.08, 12),
          new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6, side: THREE.DoubleSide })
        );
        dot.rotation.x = -Math.PI / 2;
        dot.position.copy(pos);
        dot.position.y = 0.04;
        addStep(dot);

        const labelEl = create3DLabel(ring, labels[i], '');

        clickables3D.push({
          mesh: ring,
          pulse: true,
          phase: i * 1.5,
          onHit() {
            if (ring.userData.placed) return;
            ring.userData.placed = true;
            this.pulse = false;
            ring.scale.setScalar(1);

            // Replace ring with survey stake
            ring.material = MAT.markerGreen.clone();
            ring.material.emissive.setHex(0x00aa22);

            // Animate a spike going into ground
            const spike = new THREE.Mesh(
              new THREE.CylinderGeometry(0.03, 0.02, 0.8, 6),
              MAT.rebarSteel
            );
            spike.position.copy(pos);
            spike.position.y = 0.8;
            addStep(spike);

            // Animate spike descending
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
            showFeedback('correct', `Pile marker ${labels[i]} placed!`);

            if (ss.placed >= ss.total) {
              showFeedback('correct', 'All pile markers placed! Layout complete.');
              safeTimeout(() => completeStep(), 1200);
            }
          }
        });
      });

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click each pulsing target ring to place a survey marker at pile positions P1-P4</div>';
    },
    cleanup() {}
  },

  /* ─────────────────── 2: Pile Selection ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.selected = false;

      // Show the rig in background
      const rig = buildDrivingRig(0, -1);
      rig.position.set(0, 0, 0);
      addStep(rig);
      OBJ.rig = rig;

      markSubtask(0); // Review pile options

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Select the best pile type for soft clay over dense sand conditions:</div>';

      const optionsRow = el('div', '', '');
      optionsRow.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;';

      const options = [
        {
          icon: '🪵', name: 'Timber Pile',
          desc: 'Natural, cheap. Suitable for permanent wet conditions only. Decays in dry cycles.',
          correct: false, penalty: 20,
          feedback: 'Incorrect — timber piles decay in variable moisture conditions.'
        },
        {
          icon: '⚙️', name: 'Steel H-Pile',
          desc: 'High capacity, slender. Expensive. Can corrode in aggressive soils.',
          correct: false, penalty: 10,
          feedback: 'Acceptable but not optimal for this soil profile.'
        },
        {
          icon: '🧱', name: 'Concrete Pile',
          desc: 'Precast, durable, standard choice. Excellent for soft clay over dense sand conditions.',
          correct: true, penalty: 0,
          feedback: 'Correct! Precast concrete pile is the standard choice for this application.'
        }
      ];

      options.forEach(opt => {
        const card = el('div', 'panel-item', '');
        card.style.cssText = 'min-width:140px;max-width:180px;cursor:pointer;';
        card.innerHTML = `
          <span class="item-icon">${opt.icon}</span>
          <span class="item-label" style="font-size:0.82rem;">${opt.name}</span>
          <span style="font-size:0.68rem;color:#ccc;text-align:center;line-height:1.3;margin-top:4px;">${opt.desc}</span>
        `;

        card.addEventListener('click', () => {
          if (ss.selected) return;

          if (opt.correct) {
            ss.selected = true;
            card.classList.add('selected');
            card.style.borderColor = '#27ae60';
            markSubtask(1);
            addScore(20, opt.feedback);
            safeTimeout(() => {
              markSubtask(2);
              showFeedback('correct', 'Pile selection confirmed. Proceeding to positioning.');
              safeTimeout(() => completeStep(), 1200);
            }, 1500);
          } else {
            card.style.borderColor = '#e74c3c';
            STATE.score = Math.max(0, STATE.score - opt.penalty);
            updateHUD();
            shakeScene();
            showFeedback('wrong', `${opt.feedback} (-${opt.penalty} pts)`);
            safeTimeout(() => { card.style.borderColor = 'rgba(255,255,255,0.2)'; }, 1500);
          }
        });

        optionsRow.appendChild(card);
      });

      ab.appendChild(optionsRow);
    },
    cleanup() {}
  },

  /* ─────────────────── 3: Position Pile ─── */
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

  /* ─────────────────── 4: Alignment Check ─── */
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

  /* ─────────────────── 5: Drive Pile ─── */
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

        // Phase 1: Hammer rises (300ms)
        if (OBJ.hammer) {
          OBJ.hammer.position.y = hammerStartY;
        }
        const riseTarget = hammerStartY + 2;
        let riseT = 0;
        const riseInterval = safeInterval(() => {
          riseT += 0.06;
          if (riseT >= 1) {
            clearInterval(riseInterval);
            if (OBJ.hammer) OBJ.hammer.position.y = riseTarget;

            // Phase 2: Hammer falls (150ms)
            let fallT = 0;
            const fallInterval = safeInterval(() => {
              fallT += 0.12;
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
        }, 500);
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

  /* ─────────────────── 6: Pile Refusal ─── */
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
          riseT += 0.06;
          if (riseT >= 1) {
            clearInterval(riseInterval);
            if (OBJ.hammer) OBJ.hammer.position.y = riseTarget;

            let fallT = 0;
            const fallInterval = safeInterval(() => {
              fallT += 0.12;
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
        }, 500);
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

  /* ─────────────────── 7: Cut Pile Head ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.cut = false;

      // Build rig in background
      const rig = buildDrivingRig(0, -1);
      rig.position.x = 5; // move rig to side
      addStep(rig);

      // Build pile at driven depth — the pile top sticks above ground
      const pileTopY = 10 - STATE.drivenDepth + 10; // top of pile
      const pile = buildPile(false);
      pile.position.set(0, 8 - STATE.drivenDepth, 0);
      addStep(pile);
      OBJ.pileGroup = pile;

      // Cut line at y=0.5 (design elevation 500mm above ground)
      const cutLineGeo = new THREE.BoxGeometry(1.5, 0.05, 1.5);
      const cutLine = new THREE.Mesh(cutLineGeo, MAT.cutLine);
      cutLine.position.set(0, 0.5, 0);
      addStep(cutLine);

      // Label for cut line
      create3DLabel(cutLine, 'Cut-off: +0.5m', '');

      // Portion of pile above cut line (to be removed) — tinted red to mark removal zone
      const aboveHeight = pileTopY - 0.5;
      if (aboveHeight > 0) {
        const abovePile = new THREE.Mesh(
          new THREE.CylinderGeometry(0.23, 0.23, aboveHeight, 16),
          new THREE.MeshLambertMaterial({ color: 0xcc5555, transparent: true, opacity: 0.55 })
        );
        abovePile.position.set(0, 0.5 + aboveHeight / 2, 0);
        addStep(abovePile);
        OBJ.abovePile = abovePile;
      }

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Mark the cut-off elevation and cut the pile head</div>';

      // Mark button
      const markBtn = makeBtn('Mark Cut-off Elevation', 'btn-primary', () => {
        markSubtask(0);
        // Pulse the cut line
        cutLine.material.emissiveIntensity = 1.0;
        showFeedback('info', 'Cut-off elevation marked at +0.5m above ground.');
        safeTimeout(() => {
          ab.innerHTML = '';
          const cutBtn = makeBtn('Cut Pile Head', 'btn-primary', () => {
            markSubtask(1);
            // Animate the above portion fading out
            if (OBJ.abovePile) {
              let fadeT = 0;
              const fadeInterval = safeInterval(() => {
                fadeT += 0.05;
                if (fadeT >= 1) {
                  clearInterval(fadeInterval);
                  scene.remove(OBJ.abovePile);
                  const si = stepObjects.indexOf(OBJ.abovePile);
                  if (si > -1) stepObjects.splice(si, 1);

                  markSubtask(2);
                  spawnParticles(new THREE.Vector3(0, 0.5, 0), MAT.concrete, 10);
                  showFeedback('correct', 'Pile head cut! Concrete removed.');

                  safeTimeout(() => {
                    // Show exposed rebar stubs at cut level, ready to embed into pile cap
                    for (let dx = -1; dx <= 1; dx += 2) {
                      for (let dz = -1; dz <= 1; dz += 2) {
                        const rebar = new THREE.Mesh(
                          new THREE.CylinderGeometry(0.022, 0.022, 0.65, 6),
                          MAT.rebarSteel
                        );
                        rebar.position.set(dx * 0.1, 0.825, dz * 0.1);
                        addStep(rebar);
                      }
                    }
                    markSubtask(3);
                    showFeedback('correct', 'Pile reinforcement exposed! Pile head at design elevation: +0.5m');
                    ab.innerHTML = '';
                    ab.appendChild(makeBtn('Continue', 'btn-green', () => completeStep()));
                  }, 800);
                  return;
                }
                OBJ.abovePile.material.opacity = 0.5 * (1 - fadeT);
                OBJ.abovePile.position.y += 0.02;
              }, 30);
            } else {
              markSubtask(2);
              markSubtask(3);
              showFeedback('correct', 'Pile head at design elevation.');
              safeTimeout(() => completeStep(), 1200);
            }
          });
          ab.appendChild(cutBtn);
        }, 1000);
      });
      ab.appendChild(markBtn);
    },
    cleanup() {
      delete OBJ.abovePile;
    }
  },

  /* ─────────────────── 8: Construct Pile Cap ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.phase = 0;
      ss.formworkPlaced = 0;
      ss.rebarPlaced = false;
      ss.pourLevel = 0;
      ss.cureClicks = 0;
      ss.formworkStripped = false;

      // Show 4 pile stubs sticking up
      const pilePositions = [
        [-2.5, 0, -2.5], [2.5, 0, -2.5],
        [-2.5, 0, 2.5],  [2.5, 0, 2.5]
      ];

      // Show a shallow excavation pit (below-grade concrete mat)
      const pitGeo = new THREE.BoxGeometry(7.5, 0.08, 7.5);
      const pit = new THREE.Mesh(pitGeo, new THREE.MeshLambertMaterial({ color: 0x9e8060 }));
      pit.position.set(0, -0.52, 0);
      pit.receiveShadow = true;
      addStep(pit);

      pilePositions.forEach(([px, py, pz]) => {
        // Cylinder stub — 400 mm diameter, 600 mm exposed above excavation floor
        const stub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.6, 16),
          MAT.concrete
        );
        stub.position.set(px, -0.2, pz);   // center at y=-0.2: spans y=-0.5 to y=0.1
        stub.castShadow = true;
        addStep(stub);

        // Starter rebar stubs protruding from pile head, to be embedded into pile cap
        for (let dx = -1; dx <= 1; dx += 2) {
          for (let dz = -1; dz <= 1; dz += 2) {
            const rebar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6),
              MAT.rebarSteel
            );
            rebar.position.set(px + dx * 0.1, 0.23, pz + dz * 0.1);
            addStep(rebar);
          }
        }
      });

      const ab = DOM.actionBar();

      function showPhase() {
        ab.innerHTML = '';

        if (ss.phase === 0) {
          // Formwork placement
          ab.innerHTML = '<div class="step-instruction">Place formwork panels around the pile group</div>';
          const panelNames = ['North Panel', 'South Panel', 'East Panel', 'West Panel'];
          const panelIcons = ['⬆️', '⬇️', '➡️', '⬅️'];

          const panelRow = el('div', '', '');
          panelRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;';

          panelNames.forEach((name, i) => {
            const item = el('div', 'panel-item', '');
            item.innerHTML = `<span class="item-icon">${panelIcons[i]}</span><span class="item-label">${name}</span>`;
            item.addEventListener('click', () => {
              if (item.classList.contains('placed')) return;
              item.classList.add('placed');
              ss.formworkPlaced++;

              // Add 3D formwork panel
              const fwDefs = [
                { w: 7.2, h: 1.6, d: 0.15, x: 0,    y: -0.3, z: -3.6 },  // N
                { w: 7.2, h: 1.6, d: 0.15, x: 0,    y: -0.3, z:  3.6 },  // S
                { w: 0.15, h: 1.6, d: 7.0, x:  3.6, y: -0.3, z: 0 },     // E
                { w: 0.15, h: 1.6, d: 7.0, x: -3.6, y: -0.3, z: 0 }      // W
              ];
              const def = fwDefs[i];
              const fw = new THREE.Mesh(
                new THREE.BoxGeometry(def.w, def.h, def.d),
                MAT.formworkWood
              );
              fw.position.set(def.x, def.y, def.z);
              fw.castShadow = true;
              addStep(fw);

              showFeedback('correct', `${name} placed!`);

              if (ss.formworkPlaced >= 4) {
                markSubtask(0);
                showFeedback('correct', 'All formwork panels in place!');
                ss.phase = 1;
                safeTimeout(showPhase, 800);
              }
            });
            panelRow.appendChild(item);
          });
          ab.appendChild(panelRow);

        } else if (ss.phase === 1) {
          // Rebar placement
          ab.innerHTML = '<div class="step-instruction">Place the pile cap reinforcement grid</div>';
          const rebarBtn = makeBtn('Place Pile Cap Rebar', 'btn-primary', () => {
            ss.rebarPlaced = true;
            markSubtask(1);

            // Add rebar grid
            const rebarGroup = new THREE.Group();
            for (let i = -3; i <= 3; i++) {
              // X-direction bars
              const barX = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 6.5, 6),
                MAT.rebarSteel
              );
              // Bottom mat bars (X-direction)
              barX.rotation.z = Math.PI / 2;
              barX.position.set(0, -1.0, i * 0.7);
              rebarGroup.add(barX);

              // Top mat bars (Z-direction)
              const barZ = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 6.5, 6),
                MAT.rebarSteel
              );
              barZ.rotation.x = Math.PI / 2;
              barZ.position.set(i * 0.7, -0.5, 0);
              rebarGroup.add(barZ);
            }
            addStep(rebarGroup);

            showFeedback('correct', 'Pile cap rebar placed!');
            ss.phase = 2;
            safeTimeout(showPhase, 800);
          });
          ab.appendChild(rebarBtn);

        } else if (ss.phase === 2) {
          // Concrete pour
          ab.innerHTML = '<div class="step-instruction">Pour concrete into the pile cap formwork</div>';

          // Concrete fill mesh
          const fillMesh = new THREE.Mesh(
            new THREE.BoxGeometry(6.8, 0.01, 6.8),
            MAT.concreteWet
          );
          fillMesh.position.set(0, -1.1, 0);  // starts at bottom of cap excavation
          addStep(fillMesh);
          OBJ.pileFill = fillMesh;

          // Fill meter
          const meterWrap = el('div', 'fill-meter-wrap', '');
          meterWrap.innerHTML = `
            Concrete Level: <span id="cap-fill-pct">0%</span>
            <div class="fill-meter-track">
              <div class="fill-meter-bar" id="cap-fill-bar" style="width:0%;"></div>
              <div class="fill-target-zone" style="left:85%;width:13%;"></div>
            </div>
          `;
          ab.appendChild(meterWrap);

          const pourBtn = makeBtn('Pour Concrete', 'btn-primary', () => {});
          pourBtn.style.cssText += 'background:#9e9e9e;';

          let pourInterval = null;

          pourBtn.addEventListener('mousedown', () => {
            pourInterval = safeInterval(() => {
              if (ss.pourLevel >= 100) return;
              ss.pourLevel += 2;
              if (ss.pourLevel > 100) ss.pourLevel = 100;

              const bar = $('cap-fill-bar');
              const pct = $('cap-fill-pct');
              if (bar) bar.style.width = ss.pourLevel + '%';
              if (pct) pct.textContent = ss.pourLevel + '%';

              // Grow fill mesh
              const h = Math.max(0.01, 1.8 * ss.pourLevel / 100);
              fillMesh.scale.y = h / 0.01;
              fillMesh.position.y = -1.1 + h / 2;

              if (ss.pourLevel >= 85 && ss.pourLevel <= 98) {
                // In target zone
              }
            }, 80);
          });

          pourBtn.addEventListener('mouseup', () => {
            if (pourInterval) { clearInterval(pourInterval); pourInterval = null; }
            if (ss.pourLevel >= 85 && ss.pourLevel <= 100) {
              markSubtask(2);
              showFeedback('correct', 'Concrete pour complete! ' + ss.pourLevel + '%');
              ss.phase = 3;
              safeTimeout(showPhase, 800);
            } else if (ss.pourLevel > 0 && ss.pourLevel < 85) {
              showFeedback('wrong', 'Underfill! Keep pouring to reach 85%+ target.');
            }
          });

          pourBtn.addEventListener('mouseleave', () => {
            if (pourInterval) { clearInterval(pourInterval); pourInterval = null; }
          });

          ab.appendChild(pourBtn);

        } else if (ss.phase === 3) {
          // Curing
          ab.innerHTML = '<div class="step-instruction">Water the concrete to cure (7-day cycle)</div>';

          const dayDisplay = el('div', 'day-counter', 'Day 0 / 7');
          dayDisplay.id = 'cure-day';
          ab.appendChild(dayDisplay);

          const waterBtn = makeBtn('Water Concrete', 'btn-primary', () => {
            ss.cureClicks++;
            const dayEl = $('cure-day');
            if (dayEl) dayEl.textContent = `Day ${Math.min(ss.cureClicks, 7)} / 7`;

            // Blue water effect
            if (OBJ.pileFill) {
              OBJ.pileFill.material = MAT.waterBlue.clone();
              safeTimeout(() => {
                if (OBJ.pileFill) OBJ.pileFill.material = MAT.concreteWet;
              }, 500);
            }

            showFeedback('info', `Day ${ss.cureClicks} watering complete.`);

            if (ss.cureClicks >= 7) {
              markSubtask(3);
              showFeedback('correct', 'Curing complete! Concrete at full strength.');
              // Darken concrete
              if (OBJ.pileFill) {
                OBJ.pileFill.material = MAT.concreteDark;
              }
              ss.phase = 4;
              safeTimeout(showPhase, 800);
            }
          });
          waterBtn.style.cssText += 'background:#4fc3f7;color:#112640;';
          ab.appendChild(waterBtn);

        } else if (ss.phase === 4) {
          // Strip formwork
          ab.innerHTML = '<div class="step-instruction">Strip the formwork to reveal the finished pile cap</div>';

          const stripBtn = makeBtn('Strip Formwork', 'btn-primary', () => {
            markSubtask(4);

            // Remove formwork panels (find them in stepObjects by checking geometry)
            const toRemove = [];
            stepObjects.forEach(obj => {
              if (obj.material === MAT.formworkWood) {
                toRemove.push(obj);
              }
            });
            toRemove.forEach(obj => {
              scene.remove(obj);
              const idx = stepObjects.indexOf(obj);
              if (idx > -1) stepObjects.splice(idx, 1);
            });

            // Add finished pile cap (below grade)
            const capGroup = new THREE.Group();
            const cap = new THREE.Mesh(
              new THREE.BoxGeometry(6.5, 1.2, 6.5),
              MAT.concreteDark
            );
            cap.position.y = -0.6;  // centered below grade
            cap.castShadow = true;
            cap.receiveShadow = true;
            capGroup.add(cap);

            // Small pedestal above cap where column will sit
            const ped = new THREE.Mesh(
              new THREE.BoxGeometry(1.2, 0.4, 1.2),
              MAT.concreteDark
            );
            ped.position.y = 0.2;  // sits on top of cap, at grade level
            capGroup.add(ped);
            addStep(capGroup);

            spawnParticles(new THREE.Vector3(0, 0.2, 0), MAT.yellow, 12);
            showFeedback('correct', 'Formwork stripped! Pile cap complete.');
            safeTimeout(() => completeStep(), 1500);
          });
          ab.appendChild(stripBtn);
        }
      }

      showPhase();
    },
    cleanup() {
      delete OBJ.pileFill;
    }
  },

  /* ─────────────────── 9: Final Inspection & Report ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.checked = 0;
      ss.total = 5;
      ss.reportGenerated = false;

      // Show finished pile cap — centered below grade (cap bottom at y=-1.2, top at y=0)
      const capGroup = new THREE.Group();
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 1.2, 6.5),
        MAT.concreteDark
      );
      cap.position.y = -0.6;
      cap.castShadow = true;
      capGroup.add(cap);
      // Small pedestal above at grade level for column connection
      const ped = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), MAT.concreteDark);
      ped.position.y = 0.18;
      capGroup.add(ped);
      addStep(capGroup);

      // Show 4 cylinder pile stubs beneath cap
      const pilePositions = [
        [-2.5, 0, -2.5], [2.5, 0, -2.5],
        [-2.5, 0, 2.5],  [2.5, 0, 2.5]
      ];
      pilePositions.forEach(([px, py, pz]) => {
        const stub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.6, 16),
          MAT.concrete
        );
        stub.position.set(px, -0.2, pz);
        addStep(stub);
      });

      // Inspection diamonds
      const inspPositions = [
        new THREE.Vector3(-2, 2.2, -2),
        new THREE.Vector3(2,  2.2, -2),
        new THREE.Vector3(0,  2.2,  0),
        new THREE.Vector3(-2, 2.2,  2),
        new THREE.Vector3(2,  2.2,  2)
      ];

      const inspLabels = [
        'Pile Layout',
        'Design Depth',
        'Blow Count Record',
        'Pile Cap Quality',
        'Overall Alignment'
      ];

      const inspResults = [
        `Layout: 4 piles at design positions - PASS`,
        `Depth: ${STATE.drivenDepth.toFixed(1)}m (design: 17.0m) - PASS`,
        `Total Blows: ${STATE.totalBlows} - Records complete - PASS`,
        `Pile cap: 6.5m x 6.5m x 1.8m, concrete cured - PASS`,
        `Alignment: <0.5 degrees all piles - PASS`
      ];

      inspPositions.forEach((pos, i) => {
        const diaGeo = new THREE.OctahedronGeometry(0.25, 0);
        const dia = new THREE.Mesh(diaGeo, MAT.diamondBlue.clone());
        dia.position.copy(pos);
        dia.castShadow = true;
        addStep(dia);

        const label = create3DLabel(dia, inspLabels[i], 'insp-label');

        clickables3D.push({
          mesh: dia,
          pulse: true,
          phase: i * 1.3,
          onHit() {
            if (dia.userData.checked) return;
            dia.userData.checked = true;
            dia.material = MAT.diamondGreen.clone();
            this.pulse = false;
            dia.scale.setScalar(1);

            // Update label
            label.classList.add('passed');

            ss.checked++;
            markSubtask(i);
            showFeedback('correct', inspResults[i]);

            show3DPopup(dia, `<strong>${inspLabels[i]}</strong><br>${inspResults[i]}`, 2500);

            if (ss.checked >= ss.total) {
              safeTimeout(() => {
                showFeedback('info', 'All inspections passed! Generate the final report.');
                const ab = DOM.actionBar();
                ab.innerHTML = '';
                const reportBtn = makeBtn('Generate Report', 'btn-green', () => {
                  ss.reportGenerated = true;
                  showFeedback('correct', 'Report generated! Driven pile foundation construction complete.');
                  safeTimeout(() => completeStep(), 1500);
                });
                ab.appendChild(reportBtn);
              }, 1000);
            }
          }
        });
      });

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click each inspection diamond to verify construction quality</div>';
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
