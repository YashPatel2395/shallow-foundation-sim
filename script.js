/* ============================================================
   SHALLOW FOUNDATION CONSTRUCTION SIMULATION — Three.js 3D
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

    // Apply pan along camera right and up vectors
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
    title: '1. Site & Soil Assessment',
    desc: 'Test the soil at 5 locations to understand bearing capacity before designing the foundation.',
    subtasks: ['Click each pulsing marker to test', 'Review soil data in popup', 'Submit assessment report'],
    why: 'Soil bearing capacity determines foundation depth and width.',
    warning: 'Never skip soil tests — unstable soil causes foundation failure.'
  },
  {
    title: '2. Site Preparation',
    desc: 'Clear all debris from the construction site and level the ground.',
    subtasks: ['Remove 6 debris items (click each)', 'Click "Level Ground" to grade site'],
    why: 'A clean, level surface ensures accurate layout and excavation.',
    warning: 'Debris left under foundations causes voids and settlement.'
  },
  {
    title: '3. Excavation',
    desc: 'Dig the pit to full design depth using the excavator.',
    subtasks: ['Hold ⛏️ DIG to excavate', 'Reach 100% depth', 'Confirm completion'],
    why: 'Excavation exposes firm bearing soil beneath loose topsoil.',
    warning: 'Insufficient depth = foundation on weak soil.'
  },
  {
    title: '4. Formwork Installation',
    desc: 'Install wooden formwork panels to contain the concrete pour.',
    subtasks: ['Place North wall panel', 'Place South wall panel', 'Place East wall panel', 'Place West wall panel'],
    why: 'Formwork gives the concrete its final shape and dimensions.',
    warning: 'Misaligned formwork produces an off-centre foundation.'
  },
  {
    title: '5. Reinforcement Placement',
    desc: 'Place steel rebar cage inside the formwork (longitudinal bars first, then cross bars).',
    subtasks: ['Place 4 longitudinal bars', 'Place 4 cross bars', 'Order matters!'],
    why: 'Rebar provides tensile strength — concrete alone is brittle.',
    warning: 'Cross bars before longitudinal bars = structural weakness.'
  },
  {
    title: '6. Concrete Placement',
    desc: 'Pour concrete from the ready-mix truck. Hit the 88–98% target zone.',
    subtasks: ['Hold pour button to fill', 'Release in the green zone (88–98%)', 'Avoid overfill'],
    why: 'Correct fill level ensures structural integrity and cover depth.',
    warning: 'Overfill causes honeycombing; underfill reduces load capacity.'
  },
  {
    title: '7. Inspection',
    desc: 'The site inspector checks all critical construction elements.',
    subtasks: ['Click each inspection point', 'Review PASS results', 'Sign off inspection'],
    why: 'Third-party inspection ensures compliance with structural codes.',
    warning: 'Uninspected work cannot proceed legally.'
  },
  {
    title: '8. Curing',
    desc: 'Keep the concrete moist for 7 days to reach full strength.',
    subtasks: ['Water concrete each day', 'Monitor strength gain bar', 'Complete 7-day cycle'],
    why: 'Curing prevents shrinkage cracks and reaches design strength.',
    warning: 'Missing watering days reduces final strength by up to 40%.'
  },
  {
    title: '9. Backfilling',
    desc: 'Refill soil around the footing and compact it to prevent settlement.',
    subtasks: ['Add soil 5 times', 'Compact 3 times (after 60% fill)', 'Reach 100% fill & compaction'],
    why: 'Compacted backfill prevents lateral movement of the foundation.',
    warning: 'Loose backfill allows foundation to shift under load.'
  },
  {
    title: '10. Final Inspection',
    desc: 'Verify 5 quality checkpoints on the completed foundation.',
    subtasks: ['Check all 5 quality points', 'Average score ≥ 80%', 'Proceed to pillar construction'],
    why: 'Final QA confirms the foundation meets design specifications.',
    warning: 'Defective foundation cannot support the structure above.'
  },
  {
    title: '11. Pillar Construction',
    desc: 'Build the reinforced concrete column on the completed foundation.',
    subtasks: ['Place column rebar (4 bars)', 'Install column formwork', 'Pour column concrete', 'Strip formwork'],
    why: 'The column transfers structural loads to the foundation below.',
    warning: 'Column must be centred and plumb for load transfer.'
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
  eventRefs: []
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
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 30, 80);

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
camera.position.set(10, 8, 14);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.72;  // allow looking slightly below ground
controls.minDistance   = 3;
controls.maxDistance   = 60;
controls.target.set(0, 0, 0);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.0);
sunLight.position.set(15, 25, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width  = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far  = 80;
sunLight.shadow.camera.left   = -20;
sunLight.shadow.camera.right  =  20;
sunLight.shadow.camera.top    =  20;
sunLight.shadow.camera.bottom = -20;
sunLight.shadow.bias = -0.001;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x5a6e3a, 0.4);
scene.add(hemiLight);

const fillLight = new THREE.DirectionalLight(0xffd0a0, 0.45);
fillLight.position.set(-12, 8, -6);
scene.add(fillLight);

// Resize
function onResize() {
  const w = sceneEl.clientWidth  || 480;
  const h = sceneEl.clientHeight || 400;
  renderer.setSize(w, h);        // true by default — Three.js sets canvas CSS too
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

/* ══════════════════════════════════════════════════════════════
   PROCEDURAL TEXTURES
══════════════════════════════════════════════════════════════ */

function makeCanvasTexture(drawFn, size = 256) {
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
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      const r = 1 + Math.random() * 3;
      const g = Math.floor(120 + Math.random() * 60);
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

// Set texture repeat
TEX.grass.repeat.set(4, 4);
TEX.dirt.repeat.set(2, 2);
TEX.concrete.repeat.set(2, 2);
TEX.wood.repeat.set(1, 3);
TEX.steel.repeat.set(2, 4);

/* ══════════════════════════════════════════════════════════════
   MATERIALS
══════════════════════════════════════════════════════════════ */

const MAT = {
  grass:    new THREE.MeshLambertMaterial({ map: TEX.grass }),
  dirt:     new THREE.MeshLambertMaterial({ map: TEX.dirt }),
  concrete: new THREE.MeshLambertMaterial({ map: TEX.concrete }),
  concreteCured: new THREE.MeshLambertMaterial({ color: 0x757575, map: TEX.concrete }),
  wood:     new THREE.MeshLambertMaterial({ map: TEX.wood }),
  steel:    new THREE.MeshLambertMaterial({ map: TEX.steel }),
  yellow:   new THREE.MeshLambertMaterial({ color: 0xf5a623 }),
  darkGray: new THREE.MeshLambertMaterial({ color: 0x37474f }),
  black:    new THREE.MeshLambertMaterial({ color: 0x111111 }),
  orange:   new THREE.MeshLambertMaterial({ color: 0xd84315 }),
  skin:     new THREE.MeshLambertMaterial({ color: 0xffcc99 }),
  blue:     new THREE.MeshLambertMaterial({ color: 0x1565c0 }),
  green:    new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
  markerOrange: new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.4 }),
  markerGreen:  new THREE.MeshStandardMaterial({ color: 0x00cc44, emissive: 0x00aa22, emissiveIntensity: 0.3 }),
  inspOrange:   new THREE.MeshStandardMaterial({ color: 0xf39c12, emissive: 0xd4880a, emissiveIntensity: 0.3, transparent: true, opacity: 0.9 }),
  inspGreen:    new THREE.MeshStandardMaterial({ color: 0x27ae60, emissive: 0x1e8449, emissiveIntensity: 0.3 }),
  diamondBlue:  new THREE.MeshStandardMaterial({ color: 0x2196f3, emissive: 0x1565c0, emissiveIntensity: 0.4 }),
  diamondGreen: new THREE.MeshStandardMaterial({ color: 0x4caf50, emissive: 0x2e7d32, emissiveIntensity: 0.3 }),
  waterBlue:    new THREE.MeshLambertMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.7 }),
  steelBright:  new THREE.MeshLambertMaterial({ color: 0xb0bec5 }),
  trackDark:    new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
  cabOrange:    new THREE.MeshLambertMaterial({ color: 0xe65100 }),
  concreteWet:  new THREE.MeshLambertMaterial({ color: 0x9e9e9e, transparent: true, opacity: 0.92 }),
  rulerWhite:   new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
  rulerRed:     new THREE.MeshLambertMaterial({ color: 0xf44336 })
};

/* ══════════════════════════════════════════════════════════════
   SCENE OBJECT MANAGEMENT
══════════════════════════════════════════════════════════════ */

let stepObjects   = [];   // cleared on step change
let persistObjs   = [];   // permanent
let clickables3D  = [];   // { mesh, onHit, pulse, phase }

// OBJ holds named references for animation loop
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
  // Clear named step refs
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
  delete OBJ.particles;
  delete OBJ.soilPile;
  delete OBJ.depthRuler;
  delete OBJ.pourStream;
  delete OBJ.compactor;
}

/* ══════════════════════════════════════════════════════════════
   CAMERA PRESETS
══════════════════════════════════════════════════════════════ */

const CAM_PRESETS = [
  { pos: new THREE.Vector3(10,  8, 14), look: new THREE.Vector3(0, 0,  0) }, // 0 soil
  { pos: new THREE.Vector3(12,  7, 16), look: new THREE.Vector3(0, 0,  0) }, // 1 prep
  { pos: new THREE.Vector3( 8,  5, 10), look: new THREE.Vector3(0,-1,  0) }, // 2 excav
  { pos: new THREE.Vector3( 5,  6,  7), look: new THREE.Vector3(0,-1.5,0) }, // 3 formwork
  { pos: new THREE.Vector3( 3,  7,  5), look: new THREE.Vector3(0,-1.5,0) }, // 4 rebar
  { pos: new THREE.Vector3( 9,  4, 12), look: new THREE.Vector3(0,-1.5,0) }, // 5 concrete
  { pos: new THREE.Vector3( 8,  7, 11), look: new THREE.Vector3(0, 0,  0) }, // 6 inspection
  { pos: new THREE.Vector3( 4,  4,  6), look: new THREE.Vector3(0,-1,  0) }, // 7 curing
  { pos: new THREE.Vector3( 7,  5,  9), look: new THREE.Vector3(0,-1,  0) }, // 8 backfill
  { pos: new THREE.Vector3(10, 10, 13), look: new THREE.Vector3(0, 0,  0) }, // 9 final insp
  { pos: new THREE.Vector3( 9,  5, 13), look: new THREE.Vector3(0, 3,  0) }  // 10 pillar
];

let camTarget = null;

function setCamPreset(n) {
  const p = CAM_PRESETS[Math.min(n, CAM_PRESETS.length - 1)];
  camTarget = { pos: p.pos.clone(), look: p.look.clone() };
}

/* Named view presets for the camera-control overlay buttons */
const VIEW_PRESETS = {
  iso:   { pos: new THREE.Vector3(10,  8, 10),  look: new THREE.Vector3(0, 0, 0) },
  top:   { pos: new THREE.Vector3(0,  20, 0.1), look: new THREE.Vector3(0, 0, 0) },
  front: { pos: new THREE.Vector3(0,   3, 15),  look: new THREE.Vector3(0, 0, 0) },
  side:  { pos: new THREE.Vector3(15,  3,  0),  look: new THREE.Vector3(0, 0, 0) }
};

window.setCameraView = function(name) {
  const p = VIEW_PRESETS[name];
  if (p) camTarget = { pos: p.pos.clone(), look: p.look.clone() };
};

window.resetCamera = function() {
  setCamPreset(STATE.currentStep);
  controls.target.set(0, 0, 0);
};

/* ══════════════════════════════════════════════════════════════
   PERSISTENT SCENE OBJECTS
══════════════════════════════════════════════════════════════ */

// Flat ground (steps 0-1), replaced with hole version for step 2+
let groundGroup = new THREE.Group();
scene.add(groundGroup);

function buildFlatGround() {
  while (groundGroup.children.length) groundGroup.remove(groundGroup.children[0]);
  const geo = new THREE.PlaneGeometry(30, 30);
  const mesh = new THREE.Mesh(geo, MAT.grass);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  groundGroup.add(mesh);
}

function buildGroundWithHole() {
  while (groundGroup.children.length) groundGroup.remove(groundGroup.children[0]);

  const grassMat = MAT.grass;
  const dirtMat  = MAT.dirt;

  // 4 grass pieces around a 5×5 pit hole (pit spans ±2.5 in X and Z)
  // North: z ∈ [-15, -2.5] → width 30, depth 12.5, centre z = -8.75
  // South: z ∈ [ 2.5, 15]  → width 30, depth 12.5, centre z =  8.75
  // West:  x ∈ [-15, -2.5], z ∈ [-2.5, 2.5] → width 12.5, depth 5, centre x = -8.75
  // East:  x ∈ [ 2.5, 15],  z ∈ [-2.5, 2.5] → width 12.5, depth 5, centre x =  8.75
  const pieces = [
    { w: 30,   d: 12.5, x:     0, z: -8.75 },
    { w: 30,   d: 12.5, x:     0, z:  8.75 },
    { w: 12.5, d: 5,    x: -8.75, z:  0    },
    { w: 12.5, d: 5,    x:  8.75, z:  0    }
  ];
  pieces.forEach(p => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.d), grassMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, 0, p.z);
    m.receiveShadow = true;
    groundGroup.add(m);
  });

  // Pit walls — 5×5 opening, 3 units deep
  const half = 2.5;
  const wallThick = 0.2;
  const wallDefs = [
    { w: 5,         h: 3, d: wallThick, x:  0,           y: -1.5, z: -(half + wallThick / 2) }, // N
    { w: 5,         h: 3, d: wallThick, x:  0,           y: -1.5, z:  (half + wallThick / 2) }, // S
    { w: wallThick, h: 3, d: 5,         x: -(half + wallThick / 2), y: -1.5, z: 0             }, // W
    { w: wallThick, h: 3, d: 5,         x:  (half + wallThick / 2), y: -1.5, z: 0             }  // E
  ];
  wallDefs.forEach(w => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), dirtMat);
    m.position.set(w.x, w.y, w.z);
    m.receiveShadow = true; m.castShadow = true;
    groundGroup.add(m);
  });

  // Pit floor
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.12, 4.9), dirtMat);
  floorMesh.position.set(0, -3.06, 0);
  floorMesh.receiveShadow = true;
  groundGroup.add(floorMesh);
  OBJ.pitFloor = floorMesh;
}

// Trees
function buildTrees() {
  const positions = [
    [-12, 0, -12], [12, 0, -12], [-12, 0, 12], [12, 0, 12], [0, 0, -13], [-13, 0, 0]
  ];
  positions.forEach(([x, y, z]) => {
    const g = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 1, 8),
      new THREE.MeshLambertMaterial({ color: 0x5d3a1a })
    );
    trunk.position.y = 0.5;
    trunk.castShadow = true;
    g.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 3, 8),
      new THREE.MeshLambertMaterial({ color: 0x2d6a0a })
    );
    leaves.position.y = 3;
    leaves.castShadow = true;
    g.add(leaves);

    g.position.set(x, y, z);
    scene.add(g);
    persistObjs.push(g);
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

// Hover cursor
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
  setTimeout(() => popup.remove(), duration || 2200);
}

/* ══════════════════════════════════════════════════════════════
   GAME ENGINE
══════════════════════════════════════════════════════════════ */

function init() {
  onResize();           // set correct renderer dimensions before first render
  buildChecklist();
  buildFlatGround();
  buildTrees();

  // Persistent construction site grid
  const gridHelper = new THREE.GridHelper(24, 24, 0x444444, 0x2a2a2a);
  gridHelper.position.y = 0.02;
  scene.add(gridHelper);
  persistObjs.push(gridHelper);

  startStep(0);
  animate();
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

  // Switch ground
  if (n < 2) buildFlatGround();
  else       buildGroundWithHole();

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
  showFeedback('wrong', `⚠️ ${msg} (−15 pts)`);
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
  DOM.resultScore().textContent = STATE.score;
  let grade = '';
  if (STATE.score >= 900)      grade = '⭐⭐⭐ Master Builder!';
  else if (STATE.score >= 700) grade = '⭐⭐ Skilled Engineer';
  else if (STATE.score >= 500) grade = '⭐ Apprentice Builder';
  else                          grade = 'Foundation Trainee — try again!';
  DOM.resultGrade().textContent = grade;
  DOM.resultOverlay().classList.remove('hidden');
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

/* ══════════════════════════════════════════════════════════════
   3D SCENE BUILDERS (shared helpers)
══════════════════════════════════════════════════════════════ */

function buildPitStructure() {
  // Reuses existing groundGroup hole. Just provides semantic label.
}

/* Soil pile that grows as excavation progresses (0–1) */
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

/* Depth ruler beside the pit */
function buildDepthRuler() {
  const rg = new THREE.Group();
  rg.position.set(3.4, 0, -2.8);

  // Vertical pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6),
    MAT.rulerWhite
  );
  pole.position.y = -1.75;
  rg.add(pole);

  // Tick marks at 0m, 0.5m, 1m, 1.5m, 2m, 2.5m, 3m
  for (let d = 0; d <= 3; d += 0.5) {
    const isMajor = d % 1 === 0;
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(isMajor ? 0.36 : 0.22, 0.05, 0.05),
      d === 3 ? MAT.rulerRed : MAT.rulerWhite
    );
    tick.position.y = -d;
    rg.add(tick);
  }

  addStep(rg);
  OBJ.depthRuler = rg;
  return rg;
}

/* Concrete pour stream visual */
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

/* Plate compactor for backfill step */
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
    { w: 5,    h: 3, d: 0.14, x: 0,      y: -1.5, z: -2.43 }, // N
    { w: 5,    h: 3, d: 0.14, x: 0,      y: -1.5, z:  2.43 }, // S
    { w: 0.14, h: 3, d: 4.72, x: -2.43,  y: -1.5, z: 0     }, // W
    { w: 0.14, h: 3, d: 4.72, x:  2.43,  y: -1.5, z: 0     }  // E
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

/* Column rebar cage: 4 vertical bars + stirrups */
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

/* Realistic footing reinforcement — 6×6 bar grid at pit floor */
function createFootingRebarGrid() {
  const barPositions = [-1.8, -1.08, -0.36, 0.36, 1.08, 1.8];
  const barLen = 4.2;
  const yLow  = -2.65;
  const yHigh = -2.58;

  // Bars running along X axis (spaced in Z)
  barPositions.forEach(z => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, barLen, 6), MAT.steel);
    m.rotation.z = Math.PI / 2;
    m.position.set(0, yLow, z);
    m.castShadow = true;
    addStep(m);
  });

  // Bars running along Z axis (spaced in X), sitting slightly higher
  barPositions.forEach(x => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, barLen, 6), MAT.steel);
    m.position.set(x, yHigh, 0);
    m.castShadow = true;
    addStep(m);
  });
}

function buildConcreteSlab3D(yPos, alpha) {
  // Foundation slab at bottom of pit
  const m = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 4.8), MAT.concreteCured);
  m.position.set(0, yPos !== undefined ? yPos : -3.0, 0);
  m.castShadow = true; m.receiveShadow = true;
  if (alpha !== undefined) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = alpha; }
  addStep(m);
  return m;
}

function buildExcavator3D() {
  const g = new THREE.Group();

  // ── PBR materials (MeshStandardMaterial) ─────────────────────
  const paint    = new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.65, metalness: 0.08 });
  const paintDk  = new THREE.MeshStandardMaterial({ color: 0xd48a10, roughness: 0.68, metalness: 0.08 });
  const steel    = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.50, metalness: 0.70 });
  const steelMid = new THREE.MeshStandardMaterial({ color: 0x424242, roughness: 0.55, metalness: 0.60 });
  const chrome   = new THREE.MeshStandardMaterial({ color: 0xb0bec5, roughness: 0.18, metalness: 0.88 });
  const glass    = new THREE.MeshStandardMaterial({ color: 0x7ec8e3, roughness: 0.04, metalness: 0.10, transparent: true, opacity: 0.55 });
  const rubber   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.92, metalness: 0.00 });
  const TRK = rubber;
  const YEL = paint;
  const GRAY = steel;

  /* ── UNDERCARRIAGE ─────────────────────────────────────── */

  // X-frame centre beam
  const xBeam = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.36, 4.0), steel);
  xBeam.position.y = 0.52;
  xBeam.castShadow = true;
  g.add(xBeam);
  // Cross braces
  [-1.1, 1.1].forEach(z => {
    const br = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.2, 0.44), steel);
    br.position.set(0, 0.52, z);
    g.add(br);
  });

  const makeTrackAssy = zOff => {
    const tg = new THREE.Group();
    tg.position.z = zOff;

    // Rubber track belt (lower wrap)
    const belt = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.26, 0.60), rubber);
    belt.position.y = 0.22;
    belt.castShadow = true;
    tg.add(belt);

    // Segmented track links visible on top of belt
    for (let i = -6; i <= 6; i++) {
      const link = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.08, 0.64), steel);
      link.position.set(i * 0.31, 0.37, 0);
      tg.add(link);
    }

    // Drive sprocket (rear) — star-tooth wheel
    const sprBod = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.58, 10), steel);
    sprBod.rotation.x = Math.PI / 2;
    sprBod.position.set(1.78, 0.34, 0);
    sprBod.castShadow = true;
    tg.add(sprBod);
    for (let t = 0; t < 10; t++) {
      const a = (t / 10) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.56), steelMid);
      tooth.position.set(1.78 + Math.cos(a) * 0.41, 0.34 + Math.sin(a) * 0.41, 0);
      tooth.rotation.z = a;
      tg.add(tooth);
    }
    const sprHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.62, 8), chrome);
    sprHub.rotation.x = Math.PI / 2;
    sprHub.position.set(1.78, 0.34, 0);
    tg.add(sprHub);

    // Front idler (smooth wheel)
    const idler = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.56, 14), steelMid);
    idler.rotation.x = Math.PI / 2;
    idler.position.set(-1.78, 0.30, 0);
    idler.castShadow = true;
    tg.add(idler);
    const idlerHub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.60, 8), chrome);
    idlerHub.rotation.x = Math.PI / 2;
    idlerHub.position.set(-1.78, 0.30, 0);
    tg.add(idlerHub);

    // Bottom track rollers (5)
    [-1.1, -0.55, 0, 0.55, 1.1].forEach(x => {
      const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.52, 12), steel);
      rl.rotation.x = Math.PI / 2;
      rl.position.set(x, 0.155, 0);
      tg.add(rl);
    });

    // Top carrier rollers (2)
    [-0.5, 0.6].forEach(x => {
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.48, 10), steel);
      cr.rotation.x = Math.PI / 2;
      cr.position.set(x, 0.62, 0);
      tg.add(cr);
    });

    // Track guard / fender (covers top of track)
    const guard = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.09, 0.70), steel);
    guard.position.y = 0.74;
    tg.add(guard);
    // Guard front/rear lips
    [-2.0, 2.0].forEach(x => {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.70), steel);
      lip.position.set(x, 0.64, 0);
      tg.add(lip);
    });

    // Rear mud guard
    const mudG = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.35, 0.65), rubber);
    mudG.position.set(2.06, 0.45, 0);
    tg.add(mudG);

    return tg;
  };
  g.add(makeTrackAssy(-1.58));
  g.add(makeTrackAssy( 1.58));

  /* ── UPPER BODY ─────────────────────────────────────────── */
  const upper = new THREE.Group();
  upper.position.y = 0.79;
  g.add(upper);

  // Slewing ring
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.14, 16), steel);
  ring.position.y = -0.07;
  upper.add(ring);

  // Deck plate
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.13, 2.2), paintDk);
  deck.position.set(-0.05, 0.065, 0);
  deck.castShadow = true;
  upper.add(deck);

  // Engine compartment (rear-left)
  const engComp = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.75, 1.65), paint);
  engComp.position.set(-0.38, 0.51, 0);
  engComp.castShadow = true;
  upper.add(engComp);
  // Engine hood (top)
  const engHood = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.13, 1.58), paintDk);
  engHood.position.set(-0.38, 0.92, 0);
  upper.add(engHood);
  // Engine louvers on side (rows of slats)
  for (let i = 0; i < 6; i++) {
    const louver = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 1.28), steel);
    louver.position.set(-1.17, 0.22 + i * 0.11, 0);
    upper.add(louver);
  }
  // Grille mesh on engine face
  for (let r = 0; r < 4; r++) {
    const gBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.55), steel);
    gBar.position.set(-0.4, 0.3 + r * 0.14, 0.84);
    upper.add(gBar);
  }

  // Exhaust stack (with cap)
  const exStack = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 10), steel);
  exStack.position.set(-0.95, 1.45, -0.58);
  upper.add(exStack);
  const exCap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.07, 0.1, 10), steel);
  exCap.position.set(-0.95, 1.98, -0.58);
  upper.add(exCap);

  // Hydraulic oil tank (distinct right-side box)
  const oilTank = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.82, 0.66), paint);
  oilTank.position.set(-0.88, 0.52, 0.9);
  upper.add(oilTank);
  const oilCap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 8), chrome);
  oilCap.position.set(-0.88, 0.96, 0.9);
  upper.add(oilCap);

  // Counterweight — heavy cast block at rear
  const cwtMain = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.66, 2.12), steel);
  cwtMain.position.set(-1.32, 0.4, 0);
  cwtMain.castShadow = true;
  upper.add(cwtMain);
  const cwtFace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.62, 2.08), steelMid);
  cwtFace.position.set(-1.79, 0.38, 0);
  upper.add(cwtFace);
  // Warning stripe on cwt
  const cwtStripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 2.06), paint);
  cwtStripe.position.set(-1.8, 0.7, 0);
  upper.add(cwtStripe);

  // Fuel filler cap
  const fuelCap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.06, 8), chrome);
  fuelCap.position.set(-0.22, 0.94, 0.65);
  upper.add(fuelCap);

  // Steps (access ladder on right)
  [0.3, 0.6].forEach(y => {
    const stp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.28), chrome);
    stp.position.set(0.58, y + 0.13, 1.02);
    upper.add(stp);
  });

  /* ── CAB ─────────────────────────────────────────────────── */
  const cab = new THREE.Group();
  cab.position.set(0.48, 0.13, 0.22);
  upper.add(cab);

  // Cab frame (rear post + floor)
  const cabFloor = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.09, 1.22), paintDk);
  cab.add(cabFloor);
  const rearPost = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.3, 1.22), steel);
  rearPost.position.set(-0.53, 0.65, 0);
  cab.add(rearPost);
  // Front corner posts (ROPS)
  [-0.57, 0.57].forEach(z => {
    const fp = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.3, 0.09), steel);
    fp.position.set(0.53, 0.65, z);
    fp.castShadow = true;
    cab.add(fp);
  });
  // Roof with slight overhang
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.3), paintDk);
  cabRoof.position.y = 1.35;
  cabRoof.castShadow = true;
  cab.add(cabRoof);
  // Roof lights
  [-0.24, 0.24].forEach(z => {
    const wl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffff44, emissiveIntensity: 0.35, roughness: 0.1 }));
    wl.position.set(0.52, 1.42, z);
    cab.add(wl);
  });

  // Glass panels
  const fGlass = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.9, 1.0), glass);
  fGlass.position.set(0.55, 0.65, 0);
  cab.add(fGlass);
  const sGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.07), glass);
  sGlassL.position.set(0.06, 0.72, -0.59);
  cab.add(sGlassL);
  const sGlassR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.07), glass);
  sGlassR.position.set(0.06, 0.72, 0.59);
  cab.add(sGlassR);
  const rGlass = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.55, 0.88), glass);
  rGlass.position.set(-0.51, 0.82, 0);
  cab.add(rGlass);

  // Wiper blade
  const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.72), steel);
  wiper.position.set(0.57, 0.62, -0.12);
  wiper.rotation.z = 0.3;
  cab.add(wiper);
  // Door handle
  const dHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.24), chrome);
  dHandle.position.set(0.57, 0.42, 0);
  cab.add(dHandle);

  /* ── ARM ASSEMBLY ───────────────────────────────────────── */
  const armBase = new THREE.Group();
  armBase.position.set(0.92, 0.78, 0);
  upper.add(armBase);

  // Boom foot bracket
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.44, 0.92), steel);
  bracket.position.y = 0.22;
  armBase.add(bracket);

  // Boom pivot group
  const boomPivot = new THREE.Group();
  boomPivot.position.y = 0.44;
  boomPivot.rotation.z = -0.62;
  armBase.add(boomPivot);

  // Boom body (two-section look: wider at base, narrowing toward tip)
  const boomBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.65, 0.3), paint);
  boomBase.position.y = 0.82;
  boomBase.castShadow = true;
  boomPivot.add(boomBase);
  const boomTip = new THREE.Mesh(new THREE.BoxGeometry(0.29, 1.4, 0.24), paint);
  boomTip.position.set(0.0, 2.1, 0);
  boomPivot.add(boomTip);

  // Boom hydraulic cylinder (housing + chrome rod)
  const hcB_hous = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 10), steelMid);
  hcB_hous.position.set(0.26, 0.75, 0);
  hcB_hous.rotation.z = 0.22;
  boomPivot.add(hcB_hous);
  const hcB_rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), chrome);
  hcB_rod.position.set(0.30, 1.42, 0);
  hcB_rod.rotation.z = 0.22;
  boomPivot.add(hcB_rod);
  // Clevis at top of cylinder
  const hcB_eye = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 5, 8), steel);
  hcB_eye.position.set(0.33, 1.85, 0);
  hcB_eye.rotation.x = Math.PI / 2;
  boomPivot.add(hcB_eye);

  // Stick pivot group
  const stickPivot = new THREE.Group();
  stickPivot.position.set(0.05, 3.2, 0);
  stickPivot.rotation.z = 0.48;
  boomPivot.add(stickPivot);

  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.9, 0.22), paint);
  stick.position.y = 0.95;
  stick.castShadow = true;
  stickPivot.add(stick);

  const hcS_hous = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 10), steelMid);
  hcS_hous.position.set(0.2, 0.55, 0);
  hcS_hous.rotation.z = 0.16;
  stickPivot.add(hcS_hous);
  const hcS_rod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.6, 8), chrome);
  hcS_rod.position.set(0.22, 1.06, 0);
  hcS_rod.rotation.z = 0.16;
  stickPivot.add(hcS_rod);

  // Bucket pivot group
  const bucketPivot = new THREE.Group();
  bucketPivot.position.set(0, 1.9, 0);
  bucketPivot.rotation.z = -0.42;
  stickPivot.add(bucketPivot);

  // Bucket — proper U-profile: back plate + bottom plate + two side plates
  const bkSideMat = paint;
  // Left & right cheek plates
  [-0.44, 0.44].forEach(z => {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.07), bkSideMat);
    plate.position.set(-0.02, 0.08, z);
    plate.castShadow = true;
    bucketPivot.add(plate);
  });
  // Back plate
  const bkBack = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.62, 0.88), steel);
  bkBack.position.set(-0.46, 0.08, 0);
  bucketPivot.add(bkBack);
  // Curved bottom (approximated by two angled boxes)
  const bkBot = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.88), steel);
  bkBot.rotation.z = 0.35;
  bkBot.position.set(0.04, -0.16, 0);
  bucketPivot.add(bkBot);
  // Cutting edge (sharp steel lip)
  const cutEdge = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.9), steelMid);
  cutEdge.position.set(0.46, -0.19, 0);
  bucketPivot.add(cutEdge);
  // Bucket teeth: base adapter + conical tip
  for (let t = -2; t <= 2; t++) {
    const adp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.14), steel);
    adp.position.set(0.5, -0.18, t * 0.17);
    bucketPivot.add(adp);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 4), steelMid);
    tip.rotation.z = -Math.PI / 2;
    tip.position.set(0.68, -0.18, t * 0.17);
    bucketPivot.add(tip);
  }

  // Bucket cylinder (controls curl)
  const hcK_hous = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8), steelMid);
  hcK_hous.position.set(0.2, 0.5, 0);
  hcK_hous.rotation.z = 0.5;
  bucketPivot.add(hcK_hous);
  const hcK_rod = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.3, 7), chrome);
  hcK_rod.position.set(0.3, 0.26, 0);
  hcK_rod.rotation.z = 0.5;
  bucketPivot.add(hcK_rod);

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

/* ══════════════════════════════════════════════════════════════
   ANIMATION LOOP
══════════════════════════════════════════════════════════════ */

// Particle pool for concrete pour
const particlePool = [];

function spawnParticles(originVec, mat, count) {
  const geo = new THREE.SphereGeometry(0.06, 4, 4);
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(originVec);
    m.userData.vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      -0.1 - Math.random() * 0.2,
      (Math.random() - 0.5) * 0.2
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

function animate() {
  requestAnimationFrame(animate);
  const dt      = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Camera lerp
  if (camTarget) {
    camera.position.lerp(camTarget.pos, 0.03);
    controls.target.lerp(camTarget.look, 0.03);
  }

  // Pulse clickable markers
  clickables3D.forEach(c => {
    if (c.pulse && c.mesh) {
      const s = 1 + 0.18 * Math.sin(elapsed * 3 + (c.phase || 0));
      c.mesh.scale.setScalar(s);
    }
  });

  // Excavator arm dig animation
  if (OBJ.excavatorArm && STATE.currentStep === 2) {
    if (STATE.stepState.digging) {
      OBJ.excavatorArm.rotation.z   = -0.62 + 0.38 * Math.sin(elapsed * 3.2);
      if (OBJ.excavatorStick)  OBJ.excavatorStick.rotation.z  = 0.48 + 0.22 * Math.sin(elapsed * 3.2 + 0.5);
      if (OBJ.excavatorBucket) OBJ.excavatorBucket.rotation.z = -0.42 - 0.3 * Math.sin(elapsed * 3.2 + 1.1);
    }
    if (OBJ.excavatorUpper) OBJ.excavatorUpper.rotation.y = 0.18 * Math.sin(elapsed * 0.45);
  }

  // Truck drum rotation (around its tilted axis)
  if (OBJ.truckDrum) {
    OBJ.truckDrum.rotation.y += 0.018;
  }

  // Inspector bob
  if (OBJ.inspector) {
    OBJ.inspector.position.y = 0 + 0.05 * Math.sin(elapsed * 1.5);
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

  /* ─────────────────── 0: Soil Assessment ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.tested = 0;
      ss.total  = 5;

      const markerPositions = [
        new THREE.Vector3(-5,  0.01, -4),
        new THREE.Vector3( 3,  0.01, -6),
        new THREE.Vector3(-2,  0.01,  5),
        new THREE.Vector3( 6,  0.01,  3),
        new THREE.Vector3( 0,  0.01,  7)
      ];

      const poleGeo   = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
      const sphereGeo = new THREE.SphereGeometry(0.18, 8, 8);

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

        clickables3D.push({
          mesh: g,
          pulse: true,
          phase: i * 1.2,
          onHit() {
            if (sphere.material.color.getHex() === MAT.markerGreen.color.getHex()) return;
            if (sphere.material.emissive) {
              sphere.material.color.set(0x00cc44);
              sphere.material.emissive.set(0x00aa22);
            }
            ss.tested++;
            markSubtask(0);

            const data = SOIL_RESULTS[i];
            show3DPopup(sphere,
              `<strong>${data.soil}</strong><br>Bearing: ${data.bearing}<br>Moisture: ${data.moisture}<br><em style="opacity:.75">${data.note}</em>`,
              2500
            );

            showFeedback('info', `Soil sample ${i + 1}: ${data.soil}`);

            if (ss.tested === ss.total) {
              markSubtask(1);
              DOM.actionBar().innerHTML = '';
              DOM.actionBar().appendChild(
                makeBtn('📋 Submit Assessment Report', 'btn btn-primary', () => {
                  markSubtask(2);
                  completeStep();
                })
              );
              showFeedback('correct', 'All soil tests complete! Submit your report.');
            }
          }
        });
      });

      DOM.actionBar().innerHTML = '<span style="color:#aaa;font-size:.85rem;">Click the pulsing orange markers on the site to test soil</span>';
    },
    cleanup() {}
  },

  /* ─────────────────── 1: Site Preparation ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.removed = 0;
      ss.total   = 6;
      ss.leveled = false;

      const debrisPositions = [
        new THREE.Vector3(-5, 0,  4),
        new THREE.Vector3( 6, 0, -5),
        new THREE.Vector3(-3, 0, -7),
        new THREE.Vector3( 5, 0,  6),
        new THREE.Vector3( 2, 0,  8),
        new THREE.Vector3(-7, 0,  2)
      ];

      DEBRIS_ITEMS.forEach((item, i) => {
        const pos = debrisPositions[i];
        let mesh;

        if (item.type === 'rock') {
          const geo = new THREE.IcosahedronGeometry(0.4, 0);
          mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x78909c }));
          mesh.scale.set(1 + Math.random() * 0.4, 0.7 + Math.random() * 0.3, 1 + Math.random() * 0.4);
          mesh.position.copy(pos);
          mesh.position.y = 0.3;
        } else if (item.type === 'stump') {
          mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.35, 0.6, 8),
            new THREE.MeshLambertMaterial({ color: 0x5d3a1a })
          );
          mesh.position.copy(pos);
          mesh.position.y = 0.3;
        } else {
          // weed cluster
          const g = new THREE.Group();
          const weedMat = new THREE.MeshLambertMaterial({ color: 0x558b2f });
          for (let w = 0; w < 3; w++) {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), weedMat);
            sphere.scale.set(1, 1.4, 1);
            sphere.position.set((Math.random() - 0.5) * 0.4, 0.25, (Math.random() - 0.5) * 0.4);
            g.add(sphere);
          }
          g.position.copy(pos);
          mesh = g;
        }

        mesh.castShadow = true;
        addStep(mesh);

        clickables3D.push({
          mesh,
          onHit() {
            const idx = clickables3D.findIndex(c => c.mesh === mesh);
            if (idx > -1) clickables3D.splice(idx, 1);
            ss.removed++;
            showFeedback('info', `Removed ${item.label}!`);

            // Animate scale to 0
            let t = 0;
            const iv = setInterval(() => {
              t += 0.08;
              const s = Math.max(0, 1 - t);
              mesh.scale.setScalar(s);
              mesh.position.y += 0.05;
              if (s <= 0) {
                clearInterval(iv);
                scene.remove(mesh);
                const si = stepObjects.indexOf(mesh);
                if (si > -1) stepObjects.splice(si, 1);
              }
            }, 16);

            if (ss.removed === ss.total) {
              markSubtask(0);
              safeTimeout(showLevelBtn, 500);
            }
          }
        });
      });

      DOM.actionBar().innerHTML = '<span style="color:#aaa;font-size:.85rem;">Click debris items on the site to clear them</span>';

      function showLevelBtn() {
        DOM.actionBar().innerHTML = '';
        DOM.actionBar().appendChild(
          makeBtn('🚜 Level Ground', 'btn btn-primary', doLevelGround)
        );
        showFeedback('correct', 'All debris cleared! Now level the ground.');
      }

      function doLevelGround() {
        if (ss.leveled) return;
        ss.leveled = true;
        markSubtask(1);

        // Animate a sweeping plane across the ground
        const sweepMat = new THREE.MeshLambertMaterial({
          color: 0x5a9e3a, transparent: true, opacity: 0.5
        });
        const sweep = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 30), sweepMat);
        sweep.position.set(-16, 0.03, 0);
        addStep(sweep);

        let x = -16;
        const iv = setInterval(() => {
          x += 0.5;
          sweep.position.x = x;
          if (x > 16) {
            clearInterval(iv);
            scene.remove(sweep);
            showFeedback('correct', 'Ground leveled and graded!');
            safeTimeout(completeStep, 400);
          }
        }, 16);
      }
    },
    cleanup() {}
  },

  /* ─────────────────── 2: Excavation ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.depth   = 0;
      ss.digging = false;
      ss.complete = false;

      buildExcavator3D();
      buildDepthRuler();

      // Excavation zone marker — yellow dashed frame on ground
      const frameMat = new THREE.MeshLambertMaterial({ color: 0xf5a623 });
      const thickness = 0.07;
      const size = 5.2;
      [
        [size, thickness, thickness,  0,      0.02,  size / 2],
        [size, thickness, thickness,  0,      0.02, -size / 2],
        [thickness, thickness, size,  size/2, 0.02,  0],
        [thickness, thickness, size, -size/2, 0.02,  0]
      ].forEach(([w, h, d, x, y, z]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
        m.position.set(x, y, z);
        addStep(m);
      });

      // Pit progress display
      const pitDepthMat = new THREE.MeshLambertMaterial({ color: 0x3a1f08 });
      const pitViz = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.05, 4.8), pitDepthMat);
      pitViz.position.set(0, -0.02, 0);
      addStep(pitViz);
      OBJ.excavPitViz = pitViz;

      // Action bar
      const actionBar = DOM.actionBar();
      actionBar.innerHTML = '';

      const depthWrap = el('div', 'fill-meter-wrap');
      depthWrap.appendChild(el('div', '', '<span style="color:#fff;font-size:.78rem;font-weight:700;">Excavation Depth</span>'));
      const track = el('div', 'fill-meter-track');
      const bar   = el('div', 'fill-meter-bar');
      bar.id = 'exc-depth-bar';
      track.appendChild(bar);
      const pctLbl = el('div', '', '0%');
      pctLbl.id = 'exc-depth-pct';
      pctLbl.style.color = '#fff';
      depthWrap.appendChild(track);
      depthWrap.appendChild(pctLbl);
      actionBar.appendChild(depthWrap);

      const digBtn = makeBtn('⛏️ DIG', 'btn btn-primary', null);
      digBtn.style.fontSize = '1.1rem';
      digBtn.style.padding  = '12px 24px';
      actionBar.appendChild(digBtn);
      actionBar.appendChild(el('span', '', '<span style="color:#aaa;font-size:.8rem;">Hold the DIG button to excavate</span>'));

      function doDigTick() {
        if (ss.depth >= 100 || ss.complete) return;
        ss.depth = Math.min(100, ss.depth + 1.8);
        const d = $('exc-depth-bar');
        const p = $('exc-depth-pct');
        if (d) d.style.width = ss.depth + '%';
        if (p) p.textContent = Math.round(ss.depth) + '%';

        // Move pit floor and walls down
        const depthFrac = ss.depth / 100;
        if (OBJ.pitFloor) {
          OBJ.pitFloor.position.y = -0.1 - depthFrac * 2.95;
        }
        if (OBJ.excavPitViz) {
          OBJ.excavPitViz.position.y = -0.02 - depthFrac * 2.95;
        }

        // Grow soil pile at milestone steps
        if (ss.depth % 15 < 1.9) buildSoilPile(depthFrac);

        if (ss.depth >= 50 && !ss.done50) {
          ss.done50 = true;
          markSubtask(0);
        }
        if (ss.depth >= 100) stopDig();
      }

      function startDig() {
        if (ss.depth >= 100) return;
        ss.digging = true;
        digBtn.style.background = '#d4880a';
        ss.digIv = setInterval(doDigTick, 60);
      }
      function stopDig() {
        ss.digging = false;
        if (ss.digIv) { clearInterval(ss.digIv); ss.digIv = null; }
        digBtn.style.background = '';
        if (ss.depth >= 100 && !ss.complete) {
          ss.complete = true;
          markSubtask(1);
          showFeedback('correct', 'Excavation complete! 100% depth reached.');
          DOM.actionBar().innerHTML = '';
          DOM.actionBar().appendChild(
            makeBtn('✅ Confirm Excavation', 'btn btn-green', () => {
              markSubtask(2);
              completeStep();
            })
          );
        }
      }

      digBtn.addEventListener('mousedown', startDig);
      digBtn.addEventListener('mouseup',   stopDig);
      digBtn.addEventListener('mouseleave', stopDig);
      digBtn.addEventListener('touchstart', e => { e.preventDefault(); startDig(); }, { passive: false });
      digBtn.addEventListener('touchend',   stopDig);
    },
    cleanup() {
      if (STATE.stepState.digIv) clearInterval(STATE.stepState.digIv);
    }
  },

  /* ─────────────────── 3: Formwork ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.placed = { north: false, south: false, east: false, west: false };
      ss.count  = 0;

      const panels3D = {
        north: { w: 5,    h: 3, d: 0.14, x: 0,     y: -1.5, z: -2.43, startY: 4 },
        south: { w: 5,    h: 3, d: 0.14, x: 0,     y: -1.5, z:  2.43, startY: 4 },
        west:  { w: 0.14, h: 3, d: 4.72, x: -2.43, y: -1.5, z: 0,     startY: 4 },
        east:  { w: 0.14, h: 3, d: 4.72, x:  2.43, y: -1.5, z: 0,     startY: 4 }
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

  /* ─────────────────── 4: Reinforcement ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.longPlaced  = 0;
      ss.crossPlaced = 0;
      ss.phase = 'longitudinal';

      buildFormwork3D();

      // 4 longitudinal bottom bars (run along Z-axis, spaced in X)
      const longXPos = [-1.35, -0.45, 0.45, 1.35];
      const longMeshes = longXPos.map(x => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 6), MAT.steel);
        m.position.set(x, 8, 0);
        m.castShadow = true;
        addStep(m);
        return { mesh: m, targetX: x, targetY: -2.65 };
      });

      // 4 cross bars (run along X-axis, spaced in Z)
      const crossZPos = [-1.35, -0.45, 0.45, 1.35];
      const crossMeshes = crossZPos.map(z => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 6), MAT.steel);
        m.rotation.z = Math.PI / 2;
        m.position.set(0, 8, z);
        m.castShadow = true;
        addStep(m);
        return { mesh: m, targetZ: z, targetY: -2.58 };
      });

      const rebar = [
        { key: 'L1', icon: '|', label: 'Long Bar 1', type: 'long',  idx: 0 },
        { key: 'L2', icon: '|', label: 'Long Bar 2', type: 'long',  idx: 1 },
        { key: 'L3', icon: '|', label: 'Long Bar 3', type: 'long',  idx: 2 },
        { key: 'L4', icon: '|', label: 'Long Bar 4', type: 'long',  idx: 3 },
        { key: 'C1', icon: '—', label: 'Cross Bar 1', type: 'cross', idx: 0 },
        { key: 'C2', icon: '—', label: 'Cross Bar 2', type: 'cross', idx: 1 },
        { key: 'C3', icon: '—', label: 'Cross Bar 3', type: 'cross', idx: 2 },
        { key: 'C4', icon: '—', label: 'Cross Bar 4', type: 'cross', idx: 3 }
      ];

      const actionBar = DOM.actionBar();
      actionBar.innerHTML = '<span style="color:#e0c87a;font-size:.78rem;width:100%;text-align:center;display:block;margin-bottom:2px;">Place longitudinal bars first, then cross bars</span>';

      rebar.forEach(r => {
        const item = el('div', 'panel-item');
        item.innerHTML = `
          <div class="item-icon" style="font-family:monospace;font-size:1.4rem;color:#607d8b;">${r.icon}${r.icon}</div>
          <div class="item-label">${r.label}</div>
        `;

        item.addEventListener('click', () => {
          if (item.classList.contains('placed')) return;
          if (r.type === 'cross' && ss.longPlaced < 4) {
            penalize('Place all longitudinal bars before cross bars!');
            return;
          }
          item.classList.add('placed');
          item.innerHTML += '<div style="color:var(--green-ok);font-size:.8rem;margin-top:2px;">✓</div>';

          if (r.type === 'long') {
            ss.longPlaced++;
            markSubtask(0);
            const entry = longMeshes[r.idx];
            let t = 0;
            const startY = entry.mesh.position.y;
            const iv = setInterval(() => {
              t = Math.min(1, t + 0.04);
              entry.mesh.position.y = startY + (entry.targetY - startY) * t;
              if (t >= 1) clearInterval(iv);
            }, 16);
            showFeedback('info', `Longitudinal bar ${ss.longPlaced}/4 placed.`);
            if (ss.longPlaced === 4) {
              ss.phase = 'cross';
              showFeedback('correct', 'All longitudinal bars placed! Now add cross bars.');
            }
          } else {
            ss.crossPlaced++;
            markSubtask(1);
            const entry = crossMeshes[r.idx];
            let t = 0;
            const startY = entry.mesh.position.y;
            const iv = setInterval(() => {
              t = Math.min(1, t + 0.04);
              entry.mesh.position.y = startY + (entry.targetY - startY) * t;
              if (t >= 1) clearInterval(iv);
            }, 16);
            showFeedback('info', `Cross bar ${ss.crossPlaced}/4 placed.`);
            if (ss.crossPlaced === 4) {
              showFeedback('correct', 'Rebar grid complete!');
              safeTimeout(completeStep, 800);
            }
          }
        });

        actionBar.appendChild(item);
      });
    },
    cleanup() {}
  },

  /* ─────────────────── 5: Concrete Placement ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.fillPct  = 0;
      ss.pouring  = false;
      ss.complete = false;
      ss.pourIv   = null;

      buildFormwork3D();
      buildRebar3D();
      buildConcreteTruck3D();
      buildPourStream();

      // Concrete fill mesh (grows upward)
      const fillMat = MAT.concrete.clone();
      const fillMesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.01, 4.6), fillMat);
      fillMesh.position.set(0, -2.99, 0);
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
        // Scale fill mesh height: max 2.8 at 100%
        if (OBJ.concreteFill) {
          const h = Math.max(0.01, 2.8 * pct / 100);
          OBJ.concreteFill.scale.y = h / 0.01;
          OBJ.concreteFill.position.y = -3 + h / 2;
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

  /* ─────────────────── 6: Inspection ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.checked   = 0;
      ss.checkedSet = new Set();

      buildFormwork3D();
      buildRebar3D();
      buildConcreteSlab3D(-0.2);
      buildInspector3D(4.5, 4.5);

      /* ── Inspection definitions ─────────────────────────── */
      const inspDefs = [
        {
          pos:   new THREE.Vector3(0, -2.5, 0),
          label: 'Pit Depth',
          icon:  '📏',
          note:  '3.0m depth — within design specification',
          camPos:  new THREE.Vector3(-6, 0.5, 6.5),
          camLook: new THREE.Vector3(0, -2.5, 0)
        },
        {
          pos:   new THREE.Vector3(2.0, -1.2, 2.0),
          label: 'Formwork Alignment',
          icon:  '📐',
          note:  'Plumb ±3mm, square within 5mm ✓',
          camPos:  new THREE.Vector3(6, 1.5, 8),
          camLook: new THREE.Vector3(0, -1.5, 0)
        },
        {
          pos:   new THREE.Vector3(-1.2, -2.35, -1.2),
          label: 'Rebar Cover & Spacing',
          icon:  '⚙️',
          note:  '72mm bar spacing, 50mm edge cover ✓',
          camPos:  new THREE.Vector3(1, 1, 8),
          camLook: new THREE.Vector3(0, -2.2, 0)
        },
        {
          pos:   new THREE.Vector3(0, -0.05, 0),
          label: 'Concrete Fill Level',
          icon:  '🔲',
          note:  '93% fill — within the 88-98% target zone ✓',
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

  /* ─────────────────── 7: Curing ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.day          = 1;
      ss.totalDays    = 7;
      ss.strength     = 0;
      ss.wateredToday = false;
      ss.missedDays   = 0;
      ss.complete     = false;

      buildFormwork3D();
      buildRebar3D();

      // Concrete top
      const concMat = MAT.concrete.clone();
      const concMesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.8, 4.6), concMat);
      concMesh.position.set(0, -1.6, 0);
      addStep(concMesh);
      OBJ.curingConcrete = concMesh;

      // Curing blanket texture
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

  /* ─────────────────── 8: Backfilling ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.fillClicks    = 0;
      ss.compactClicks = 0;
      ss.fillPct       = 0;
      ss.compactPct    = 0;
      ss.maxFill       = 5;
      ss.maxCompact    = 3;

      buildFormwork3D();
      buildConcreteSlab3D(-0.2);
      buildCompactor3D(4.5, 1.5);

      // Backfill boxes (4 corners around foundation)
      const bfMat = MAT.dirt.clone();
      const corners = [
        { x: -1.9, z: -1.9 }, { x: 1.9, z: -1.9 },
        { x: -1.9, z:  1.9 }, { x: 1.9, z:  1.9 }
      ];
      const bfMeshes = corners.map(c => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.01, 2.0), bfMat.clone());
        m.position.set(c.x, -3, c.z);
        m.castShadow = true; m.receiveShadow = true;
        addStep(m);
        return m;
      });
      OBJ.backfillMeshes = bfMeshes;

      const ab = DOM.actionBar();
      ab.innerHTML = '';

      // Fill meter
      const fillWrap = makeMeter('Backfill', 'bf-fill', 'linear-gradient(to right,#2980b9,#27ae60)');
      const compWrap = makeMeter('Compaction', 'bf-comp', 'linear-gradient(to right,#8e44ad,#c0392b)');
      ab.appendChild(fillWrap);
      ab.appendChild(compWrap);

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

      const btnRow = el('div', '');
      btnRow.style.cssText = 'display:flex;gap:8px;';

      const soilBtn = makeBtn('🪣 Add Soil', 'btn btn-primary', () => {
        if (ss.fillClicks >= ss.maxFill) return;
        ss.fillClicks++;
        ss.fillPct = Math.round((ss.fillClicks / ss.maxFill) * 100);
        const b = $('bf-fill-bar'); const p = $('bf-fill-pct');
        if (b) b.style.width = ss.fillPct + '%';
        if (p) p.textContent = ss.fillPct + '%';

        // Grow backfill meshes
        bfMeshes.forEach(m => {
          const h = Math.max(0.01, 3 * ss.fillPct / 100);
          m.scale.y = h / 0.01;
          m.position.y = -3 + h / 2;
        });
        showFeedback('info', `Fill: ${ss.fillPct}%`);
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
        // Animate compactor shaking
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
          showFeedback('correct', 'Backfilling complete!');
          ab.innerHTML = '';
          ab.appendChild(makeBtn('✅ Backfilling Complete', 'btn btn-green', () => completeStep()));
        }
      }
    },
    cleanup() {}
  },

  /* ─────────────────── 9: Final Inspection ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.checked = 0;
      ss.scores  = [];

      buildConcreteSlab3D(0.0);
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

  /* ─────────────────── 10: Pillar Construction ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.rebarPlaced   = 0;
      ss.fwPlaced      = 0;
      ss.concPct       = 0;
      ss.concreteComplete = false;
      ss.fwStripped    = 0;
      ss.phase         = 'rebar';

      // Foundation slab visible
      buildConcreteSlab3D(0.17);

      // Column rebar cage (hidden until placed) — 4 corner bars
      const colRebarMeshes = [];
      const colXZ = [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]];
      colXZ.forEach(([x, z]) => {
        const m = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 6, 6),
          MAT.steel
        );
        m.position.set(x, 3.17, z);
        m.visible = false;
        m.castShadow = true;
        addStep(m);
        colRebarMeshes.push(m);
      });
      // Stirrups (hidden group, shown after all 4 bars placed)
      const stirrupGroup = new THREE.Group();
      stirrupGroup.visible = false;
      addStep(stirrupGroup);
      const stirrupYLevels = [0.5, 1.3, 2.1, 2.9, 3.7, 4.5];
      stirrupYLevels.forEach(y => {
        [
          { len: 1.1, axis: 'x', x: 0,    z: -0.55 },
          { len: 1.1, axis: 'x', x: 0,    z:  0.55 },
          { len: 1.1, axis: 'z', x: -0.55, z: 0    },
          { len: 1.1, axis: 'z', x:  0.55, z: 0    }
        ].forEach(s => {
          const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, s.len, 5), MAT.steel);
          if (s.axis === 'x') sm.rotation.z = Math.PI / 2;
          else                 sm.rotation.x = Math.PI / 2;
          sm.position.set(s.x, y, s.z);
          stirrupGroup.add(sm);
        });
      });

      // Column formwork (2 half-shells)
      const fwHalves = [];
      [-1, 1].forEach(side => {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 6, 1.6),
          MAT.wood
        );
        m.position.set(side * 0.85, 3.17, 0);
        m.visible = false;
        m.castShadow = true;
        addStep(m);
        fwHalves.push(m);
      });

      // Column concrete mesh
      const colMat = MAT.concrete.clone();
      const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.01, 12), colMat);
      colMesh.position.set(0, 0.17, 0);
      colMesh.visible = false;
      addStep(colMesh);
      OBJ.columnConcrete = colMesh;

      // Final pillar mesh
      const pillarMat = new THREE.MeshLambertMaterial({ color: 0x616161, map: TEX.concrete });
      const pillarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 6, 12), pillarMat);
      pillarMesh.position.set(0, 3.17, 0);
      pillarMesh.visible = false;
      pillarMesh.castShadow = true;
      addStep(pillarMesh);

      // Pillar cap
      const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.2, 12), new THREE.MeshLambertMaterial({ color: 0x555555 }));
      capMesh.position.set(0, 6.27, 0);
      capMesh.visible = false;
      capMesh.castShadow = true;
      addStep(capMesh);

      // Click targets on foundation top (4 spots)
      const targetGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
      const targetMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, emissive: 0xd4880a, emissiveIntensity: 0.5 });
      const rebarTargets = colXZ.map(([x, z]) => {
        const m = new THREE.Mesh(targetGeo, targetMat.clone());
        m.position.set(x, 0.4, z);
        addStep(m);
        return m;
      });

      clickables3D.push(...rebarTargets.map((m, i) => ({
        mesh: m,
        pulse: true,
        phase: i * 0.9,
        onHit() {
          if (m.userData.done) return;
          m.userData.done = true;
          m.material.color.set(0x27ae60);
          m.material.emissive.set(0x1e8449);
          ss.rebarPlaced++;

          // Show rebar growing upward
          const rb = colRebarMeshes[i];
          rb.visible = true;
          rb.scale.y = 0.001;
          let t = 0;
          const iv = setInterval(() => {
            t = Math.min(1, t + 0.04);
            rb.scale.y = t;
            if (t >= 1) clearInterval(iv);
          }, 16);

          markSubtask(0);
          showFeedback('info', `Column rebar ${ss.rebarPlaced}/4 inserted.`);
          if (ss.rebarPlaced === 4) {
            stirrupGroup.visible = true;
            rebarTargets.forEach(t => { scene.remove(t); });
            clickables3D = clickables3D.filter(c => !rebarTargets.includes(c.mesh));
            showFeedback('correct', 'All column rebar placed! Install formwork.');
            safeTimeout(phase_formwork, 600);
          }
        }
      })));

      DOM.actionBar().innerHTML = '<span style="color:#e0c87a;font-size:.82rem;">Click 4 spots on the foundation to insert column rebar</span>';

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
            markSubtask(1);
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
            const h = Math.max(0.01, 6 * ss.concPct / 100);
            if (colMesh) {
              colMesh.scale.y = h / 0.01;
              colMesh.position.y = 0.17 + h / 2;
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
            safeTimeout(phase_strip, 1200);
          } else {
            ss.concreteComplete = true;
            pourBtn.disabled = true;
            STATE.score += 20; updateHUD();
            markSubtask(2);
            showFeedback('correct', `Column poured at ${Math.round(pct)}%! +20 bonus!`);
            safeTimeout(phase_strip, 1000);
          }
        }

        pourBtn.addEventListener('mousedown', startPour);
        pourBtn.addEventListener('mouseup',   stopPour);
        pourBtn.addEventListener('mouseleave', stopPour);
        pourBtn.addEventListener('touchstart', e => { e.preventDefault(); startPour(); }, { passive: false });
        pourBtn.addEventListener('touchend',   stopPour);
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

                showFeedback('correct', '🎉 Pillar revealed! Column stands complete!');
                safeTimeout(() => {
                  DOM.actionBar().innerHTML = '';
                  DOM.actionBar().appendChild(
                    makeBtn('🏆 Complete Construction!', 'btn btn-green', () => completeStep())
                  );
                }, 1200);
              }
            }
          });
        });
      }

      safeTimeout(() => {}, 200); // small delay for camera to settle
    },
    cleanup() {}
  }

]; // end STEP_HANDLERS

/* ══════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', init);
