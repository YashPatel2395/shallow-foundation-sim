/* ============================================================
   RETAINING WALL CONSTRUCTION SIMULATION — Three.js 3D
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
    desc: 'Conduct soil boring tests at 5 locations along the wall alignment to determine soil profile and bearing capacity.',
    subtasks: ['Test point BH-1','Test point BH-2','Test point BH-3','Test point BH-4','Test point BH-5','Review soil report'],
    why: 'A retaining wall footing must bear on soil strong enough to resist overturning and sliding — the soil profile drives the footing design.',
    warning: 'Skipping site investigation risks founding the wall on soft or variable soil that later settles or slides.'
  },
  {
    title: '2. Wall Alignment Layout',
    desc: 'Stake out the wall centreline at three points — Start, Mid, and End — to set the alignment and footing offset.',
    subtasks: ['Place stake — Start','Place stake — Mid','Place stake — End'],
    why: 'The wall line must follow the design alignment exactly, or the retained earth behind it will not be captured correctly.',
    warning: 'Layout errors cannot be corrected after excavation. Check twice, stake once.'
  },
  {
    title: '3. Excavation',
    desc: 'Excavate a trench the full length of the wall down to footing depth.',
    subtasks: ['Excavate trench to footing depth'],
    why: 'The footing must sit below the frost/bearing depth on undisturbed, competent soil.',
    warning: 'Over-excavating and backfilling with loose soil under the footing invites settlement.'
  },
  {
    title: '4. Base Preparation',
    desc: 'Pour a thin plain-concrete (PCC) blinding layer on the trench floor and set cover-block spacers.',
    subtasks: ['Pour PCC blinding layer', 'Place cover blocks'],
    why: 'The blinding layer gives a clean, level surface so footing rebar sits at the correct cover depth instead of in loose soil.',
    warning: 'Rebar placed directly on soil loses concrete cover and corrodes prematurely.'
  },
  {
    title: '5. Base Reinforcement',
    desc: 'Place the footing’s two reinforcement mats — a bottom mat and a top mat, each running in two directions.',
    subtasks: ['Bottom mat — Direction 1', 'Bottom mat — Direction 2', 'Top mat — Direction 1', 'Top mat — Direction 2'],
    why: 'A cantilever footing bends both upward and downward along its length — bottom steel and top steel both resist real forces here, not just one.',
    warning: 'Omitting the top mat leaves the heel unable to resist the hogging moment created by the retained soil above it.'
  },
  {
    title: '6. Wall Stem Starter Rebar',
    desc: 'Extend the footing dowel bars into full-height vertical bars for the wall stem, before the top mat is placed.',
    subtasks: ['Extend stem dowels to full height'],
    why: 'The stem’s vertical bars carry the bending moment from earth pressure down into the footing — they must lap-splice cleanly with the footing dowels.',
    warning: 'A weak splice between stem and footing bars is a common location for cracking under lateral earth pressure.'
  },
  {
    title: '7. Base Casting',
    desc: 'Pour the footing concrete, holding the pour button to fill the trench along its full length.',
    subtasks: ['Hold to pour footing concrete'],
    why: 'The footing transfers the wall’s overturning and sliding forces into bearing pressure on the soil below.',
    warning: 'Cold joints from an interrupted pour weaken the footing along its length.'
  },
  {
    title: '8. Stem Reinforcement — Binders',
    desc: 'Add horizontal binder ties across the vertical stem bars to complete the reinforcement cage.',
    subtasks: ['Place horizontal binder ties'],
    why: 'Binders hold the vertical bars in position during the pour and provide shear/temperature reinforcement.',
    warning: 'Without binders the vertical bars can shift or splay apart as concrete is placed.'
  },
  {
    title: '9. Stem Formwork',
    desc: 'Install formwork panels on both faces of the wall stem to contain the pour.',
    subtasks: ['Install front-face panel', 'Install back-face panel'],
    why: 'A freestanding concrete wall cannot be poured without formwork — the panels hold the shape until the concrete cures.',
    warning: 'Unbraced or misaligned panels can bulge or blow out under the pressure of wet concrete.'
  },
  {
    title: '10. Stem Casting',
    desc: 'Pour the wall stem, holding the pour button to fill between the formwork panels, then strip the forms.',
    subtasks: ['Hold to pour stem concrete', 'Strip formwork'],
    why: 'The stem is the wall’s main structural element, resisting the lateral earth pressure of the retained soil.',
    warning: 'Stripping formwork before the concrete has enough strength can deform or crack the stem.'
  },
  {
    title: '11. Drainage & Weep Holes',
    desc: 'Install weep-hole pipes through the stem and a gravel drainage layer behind the wall before backfilling.',
    subtasks: ['Install weep-hole pipes', 'Place gravel drainage layer'],
    why: 'Without drainage, water collects behind the wall and builds up hydrostatic pressure the wall was never designed to resist.',
    warning: 'Blocked or omitted weep holes are one of the most common causes of retaining wall failure in the field.'
  },
  {
    title: '12. Backfilling',
    desc: 'Backfill the toe side to grade, then backfill the retained side in lifts, compacting as you go.',
    subtasks: ['Backfill toe side to grade', 'Add soil 5 times behind wall', 'Compact 3 times (after 60% fill)', 'Reach 100% fill — grade restored'],
    why: 'Backfilling in compacted lifts avoids trapping loose pockets of soil that settle later and avoids shocking the wall with a single mass of fill.',
    warning: 'Backfilling before the stem has cured, or compacting too close with heavy equipment, can crack or push over the wall.'
  },
  {
    title: '13. Final Inspection',
    desc: 'Verify 5 quality checkpoints on the completed retaining wall.',
    subtasks: ['Check all 5 quality points', 'Average score ≥ 80%', 'Sign off construction'],
    why: 'Final QA confirms the wall meets design specifications before it is relied on to hold back the retained soil.',
    warning: 'A defective retaining wall fails silently for years before it finally gives way.'
  }
];

const STEP_META = [
  {
    purpose: 'Determine the subsurface soil profile to design the footing depth, width, and bearing pressure.',
    userAction: 'Click all 5 soil boring markers and review the soil report.',
    tools: ['Soil boring rig', 'SPT sampler', 'Geotechnical lab'],
    qualityCheck: 'All boring locations tested; soil profile and bearing capacity documented.',
    commonMistake: 'Testing only at one end of a long wall misses variable soil along its length.',
    learningObjective: 'Retaining wall footings rely on soil bearing capacity and friction — both must be known before design.'
  },
  {
    purpose: 'Establish the exact wall alignment and footing offset from the property/design line.',
    userAction: 'Click each stake point to mark the wall centreline.',
    tools: ['Total station', 'Survey stakes', 'Steel tape', 'Design drawings'],
    qualityCheck: 'Alignment within ±25mm of design coordinates over the full wall length.',
    commonMistake: 'Staking only the endpoints and assuming a straight line ignores ground obstructions along the run.',
    learningObjective: 'A retaining wall is a continuous linear element — its alignment must be set out along its whole length, not just at one point.'
  },
  {
    purpose: 'Excavate a clean trench to footing depth along the full wall length.',
    userAction: 'Hold EXCAVATE to dig the trench to design depth.',
    tools: ['Excavator', 'Laser level', 'Depth gauge'],
    qualityCheck: 'Trench at design depth along its full length, side walls stable.',
    commonMistake: 'Uneven trench depth leaves parts of the footing bearing on disturbed soil.',
    learningObjective: 'Footing depth is set by soil bearing capacity and frost depth, not convenience.'
  },
  {
    purpose: 'Prepare a clean, level bearing surface for the footing reinforcement.',
    userAction: 'Pour the PCC blinding layer and place cover-block spacers.',
    tools: ['Plain cement concrete', 'Cover blocks', 'Screed board'],
    qualityCheck: 'Blinding layer level and fully cured before rebar placement; spacers set at design cover.',
    commonMistake: 'Skipping the blinding layer lets rebar sit directly in soil, losing cover and inviting corrosion.',
    learningObjective: 'A blinding layer is not structural — it exists purely to give rebar a clean surface to sit on at the correct height.'
  },
  {
    purpose: 'Place a full two-mat reinforcement grid so the footing resists bending in both directions and on both faces.',
    userAction: 'Place the bottom mat in both directions, then the top mat in both directions.',
    tools: ['Steel rebar', 'Rebar chairs/spacers', 'Tie wire'],
    qualityCheck: 'Bottom and top mats both complete, correctly spaced, tied at every intersection.',
    commonMistake: 'Placing only a bottom mat and skipping the top mat, since it is easy to forget once the bottom mat looks "finished".',
    learningObjective: 'The footing heel bends the opposite way from the toe under the weight of retained soil — this is exactly why it needs steel on both faces.'
  },
  {
    purpose: 'Extend the footing dowel bars into the full-height stem reinforcement before the top mat is closed over them.',
    userAction: 'Trigger the stem bars to rise from the footing dowels to full wall height.',
    tools: ['Rebar cage', 'Lap splice ties', 'Crane/manual lift'],
    qualityCheck: 'Stem bars vertical, correct lap length with the footing dowels, spaced per design.',
    commonMistake: 'Placing the top mat first blocks access for standing up the stem bars afterward.',
    learningObjective: 'Sequencing matters in reinforced concrete — some bars must go in before others simply to remain accessible.'
  },
  {
    purpose: 'Cast the footing so it can transfer the wall’s overturning and sliding forces into the soil below.',
    userAction: 'Hold the pour button to fill the footing along its full length.',
    tools: ['Ready-mix truck', 'Concrete pump/chute', 'Vibrator'],
    qualityCheck: 'Footing filled to design level along its full length, no visible voids.',
    commonMistake: 'Pouring too fast in one spot lets concrete flow and segregate before it can be vibrated properly.',
    learningObjective: 'The footing must cure before stem construction begins — it is what the whole wall stands on.'
  },
  {
    purpose: 'Tie the vertical stem bars together so they stay in position and resist shear during the pour.',
    userAction: 'Place horizontal binder bars across the vertical stem bars at regular spacing.',
    tools: ['Steel rebar', 'Tie wire'],
    qualityCheck: 'Binders spaced per design, tied at every vertical bar they cross.',
    commonMistake: 'Wide binder spacing lets the cage rack out of shape when concrete is placed.',
    learningObjective: 'Vertical bars alone are not a stable cage — binders turn them into one.'
  },
  {
    purpose: 'Build a temporary mold on both faces of the stem to hold wet concrete in shape while it cures.',
    userAction: 'Lift and install the front-face and back-face formwork panels.',
    tools: ['Formwork panels', 'Bracing', 'Crane'],
    qualityCheck: 'Both panels plumb, aligned, and braced against the pressure of wet concrete.',
    commonMistake: 'Under-bracing tall formwork lets it bulge or fail under the hydrostatic pressure of fresh concrete.',
    learningObjective: 'Wet concrete behaves like a heavy fluid — formwork must be designed to resist that pressure, not just hold a shape.'
  },
  {
    purpose: 'Cast the wall stem, the main structural element resisting lateral earth pressure.',
    userAction: 'Hold the pour button to fill the stem between the formwork panels, then strip the forms once cured.',
    tools: ['Ready-mix truck', 'Concrete pump', 'Vibrator', 'Formwork strike tools'],
    qualityCheck: 'Stem filled to full height with no honeycombing; formwork removed cleanly after adequate cure.',
    commonMistake: 'Stripping formwork too early, before the concrete can support itself and the next lift.',
    learningObjective: 'Formwork is temporary — it must stay in place only as long as the concrete needs it, then come off.'
  },
  {
    purpose: 'Give water behind the wall a controlled path out, so it never builds up pressure the wall was not designed for.',
    userAction: 'Install weep-hole pipes through the stem, then place a gravel drainage layer behind it.',
    tools: ['PVC weep pipes', 'Drainage gravel', 'Geotextile filter fabric'],
    qualityCheck: 'Weep holes clear and spaced per design; drainage layer covers the full retained face.',
    commonMistake: 'Backfilling with fine soil directly against the stem with no drainage path at all.',
    learningObjective: 'Retaining walls are designed for earth pressure, not water pressure — drainage is what keeps that assumption true.'
  },
  {
    purpose: 'Restore ground level on both sides of the completed wall without damaging it.',
    userAction: 'Backfill the toe side, then backfill the retained side in lifts, compacting between lifts.',
    tools: ['Backfill soil', 'Plate compactor', 'Lift-thickness gauge'],
    qualityCheck: 'Soil level with surrounding grade on both sides; compaction achieved at each lift.',
    commonMistake: 'Dumping all the backfill at once and compacting only at the end overloads the wall before it can resist properly.',
    learningObjective: 'Backfilling in lifts lets the wall pick up load gradually instead of all at once.'
  },
  {
    purpose: 'Confirm the retaining wall meets design specification before it is relied on to hold back soil.',
    userAction: 'Click each inspection point and review the pass/fail results.',
    tools: ['Inspection checklist', 'Level', 'Measuring tools'],
    qualityCheck: 'All 5 checkpoints pass with an average score of 80% or higher.',
    commonMistake: 'Signing off on visual appearance alone without checking alignment, drainage, and backfill compaction.',
    learningObjective: 'A retaining wall that looks fine on the surface can still be one blocked weep hole away from failure.'
  }
];

const SOIL_RESULTS = [
  { soil: 'Sandy Loam',   bearing: '120 kN/m²', moisture: '18%', note: 'Moderate bearing capacity' },
  { soil: 'Stiff Clay',   bearing: '180 kN/m²', moisture: '21%', note: 'Watch for expansive behaviour' },
  { soil: 'Dense Gravel', bearing: '300 kN/m²', moisture: '7%',  note: 'Excellent bearing, good drainage' },
  { soil: 'Silty Sand',   bearing: '95 kN/m²',  moisture: '24%', note: 'Requires wider footing' },
  { soil: 'Firm Sand',    bearing: '150 kN/m²', moisture: '13%', note: 'Suitable, good friction angle' }
];

const FINAL_CHECKS = [
  { label: 'Wall Alignment',    note: 'Straight within ±10mm over full length.' },
  { label: 'Concrete Finish',   note: 'Smooth, void-free, no honeycombing.' },
  { label: 'Weep Hole Flow',    note: 'All weep holes clear and draining.' },
  { label: 'Backfill Compaction', note: 'Density meets specification at each lift.' },
  { label: 'Vertical Plumb',    note: 'Stem within tolerance of true vertical.' }
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
camera.position.set(16, 6, 20);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.85;
controls.minDistance   = 3;
controls.maxDistance   = 80;
controls.target.set(0, -1, 0);

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
TEX.concrete.repeat.set(2, 4);
TEX.wood.repeat.set(1, 3);
TEX.gravel.repeat.set(2, 2);

/* ══════════════════════════════════════════════════════════════
   MATERIALS
══════════════════════════════════════════════════════════════ */

const MAT = {
  grass:    new THREE.MeshLambertMaterial({ map: TEX.grass, side: THREE.DoubleSide }),
  concrete: new THREE.MeshLambertMaterial({ map: TEX.concrete }),
  concreteDark: new THREE.MeshLambertMaterial({ color: 0x888888, map: TEX.concrete }),
  concreteWet:  new THREE.MeshLambertMaterial({ color: 0x9e9e9e, transparent: true, opacity: 0.92 }),
  wood:     new THREE.MeshLambertMaterial({ map: TEX.wood }),
  formworkWood: new THREE.MeshLambertMaterial({ color: 0xc8902a }),
  yellow:   new THREE.MeshLambertMaterial({ color: 0xf5a623 }),
  darkGray: new THREE.MeshLambertMaterial({ color: 0x37474f }),
  black:    new THREE.MeshLambertMaterial({ color: 0x111111 }),
  dirt:     new THREE.MeshLambertMaterial({ map: TEX.dirt }),
  gravel:   new THREE.MeshLambertMaterial({ map: TEX.gravel }),
  skin:     new THREE.MeshLambertMaterial({ color: 0xffcc99 }),
  rebarSteel:   new THREE.MeshLambertMaterial({ color: 0x607d8b }),
  pcc:      new THREE.MeshLambertMaterial({ color: 0xaaaaaa, map: TEX.concrete }),
  weepPipe: new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
  markerOrange: new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.4 }),
  markerGreen:  new THREE.MeshStandardMaterial({ color: 0x00cc44, emissive: 0x00aa22, emissiveIntensity: 0.3 }),
  diamondBlue:  new THREE.MeshStandardMaterial({ color: 0x2196f3, emissive: 0x1565c0, emissiveIntensity: 0.4 }),
  diamondGreen: new THREE.MeshStandardMaterial({ color: 0x4caf50, emissive: 0x2e7d32, emissiveIntensity: 0.3 }),
  voidDark: new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
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
  delete OBJ.excavatorArm;
  delete OBJ.excavatorBucket;
  delete OBJ.excavatorStick;
  delete OBJ.excavatorUpper;
  delete OBJ.truckDrum;
  delete OBJ.truckChuteGroup;
  delete OBJ.inspector;
  delete OBJ.compactor;
}

/* ══════════════════════════════════════════════════════════════
   CAMERA PRESETS
══════════════════════════════════════════════════════════════ */

// Steps 2-10 view end-on down the wall's short axis (the excavation
// rectangle is 10 units long by ~3.4 wide -- the camera sits out past one
// short end at Z=0.4, the footing's own centerline, and looks straight down
// the length) so everything happening along the wall is visible in one
// shot instead of foreshortened by a diagonal angle. This also keeps these
// cameras well clear of the permanent hillside (which only starts past
// Z=2.15 -- see addHillside()/RAMP_Z0 in the GROUND/SITE section). Steps 0,
// 1, 11 and 12 keep a heel-side/elevated diagonal vantage instead, since
// those need the wall's full length spread across the frame (staked layout
// points, spread-out final-inspection checkpoints) or the hillside itself
// in view (establishing shots, backfilling).
const CAM_PRESETS = [
  { pos: new THREE.Vector3(14,  5,  18),   look: new THREE.Vector3(0,   -1,  0) },   // 0 investigation
  { pos: new THREE.Vector3(12,  7,  16),   look: new THREE.Vector3(0,    0,  0) },   // 1 layout
  { pos: new THREE.Vector3(15,  2,  0.4),  look: new THREE.Vector3(-3, -0.6, 0.4) }, // 2 excavation
  { pos: new THREE.Vector3(15,  1,  0.4),  look: new THREE.Vector3(-3, -1.5, 0.4) }, // 3 base prep
  { pos: new THREE.Vector3(15,  2,  0.4),  look: new THREE.Vector3(-3,   -1, 0.4) }, // 4 base rebar
  { pos: new THREE.Vector3(15,  3,  0.4),  look: new THREE.Vector3(-3,  0.5, 0.4) }, // 5 stem starter rebar
  { pos: new THREE.Vector3(15,  1,  0.4),  look: new THREE.Vector3(-3, -1.3, 0.4) }, // 6 base casting
  { pos: new THREE.Vector3(15,  3,  0.4),  look: new THREE.Vector3(-3,    1, 0.4) }, // 7 stem binders
  { pos: new THREE.Vector3(15,  3,  0.4),  look: new THREE.Vector3(-3,    1, 0.4) }, // 8 stem formwork
  { pos: new THREE.Vector3(15,  3,  0.4),  look: new THREE.Vector3(-3,    1, 0.4) }, // 9 stem casting
  { pos: new THREE.Vector3(15,  2,  0.4),  look: new THREE.Vector3(-3,  0.5, 0.4) }, // 10 drainage
  { pos: new THREE.Vector3(12,  5,  13),   look: new THREE.Vector3(0,   0.5, 0) },   // 11 backfilling
  { pos: new THREE.Vector3(11,  5,  12),   look: new THREE.Vector3(0,     1, 0) }    // 12 final inspection
];

let camTarget = null;

function setCamPreset(n) {
  const p = CAM_PRESETS[Math.min(n, CAM_PRESETS.length - 1)];
  camTarget = { pos: p.pos.clone(), look: p.look.clone() };
}

const VIEW_PRESETS = {
  iso:     { pos: new THREE.Vector3(16,  5, 20), look: new THREE.Vector3(0, -1, 0) },
  top:     { pos: new THREE.Vector3(0,  28,  1), look: new THREE.Vector3(0,  0, 0) },
  front:   { pos: new THREE.Vector3(0,   2, 22), look: new THREE.Vector3(0, -1, 0) },
  cutaway: { pos: new THREE.Vector3(10, -2, 12), look: new THREE.Vector3(0, -2, 0) }
};

window.setCameraView = function(name) {
  const p = VIEW_PRESETS[name];
  if (p) camTarget = { pos: p.pos.clone(), look: p.look.clone() };
};

window.resetCamera = function() {
  setCamPreset(STATE.currentStep);
  controls.target.set(0, -1, 0);
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
   Wall runs along X, centred on the origin. Z=0..STEM_THICK is the
   stem footprint; toe (exposed, low side) is -Z, heel (retained,
   backfilled side) is +Z.
══════════════════════════════════════════════════════════════ */

const WALL_LENGTH   = 10;
const WALL_X0        = -WALL_LENGTH / 2;
const WALL_X1        =  WALL_LENGTH / 2;
const TOE_WIDTH      = 0.8;
const STEM_THICK     = 0.3;
const HEEL_WIDTH     = 1.3;
const FOOTING_WIDTH  = TOE_WIDTH + STEM_THICK + HEEL_WIDTH;      // 2.4
const FOOTING_THICK  = 0.4;
const STEM_HEIGHT    = 4.0;

const TOE_GRADE_Y    = 0;                                        // original/low-side grade
const FOOTING_TOP_Y  = -0.3;
const FOOTING_BOT_Y  = FOOTING_TOP_Y - FOOTING_THICK;             // -0.7
const STEM_TOP_Y     = FOOTING_TOP_Y + STEM_HEIGHT;               // 3.7
const RETAINED_GRADE_Y = STEM_TOP_Y;                              // backfilled heel-side grade

const FOOTING_Z0     = -TOE_WIDTH;                                // toe edge
const FOOTING_Z1     = STEM_THICK + HEEL_WIDTH;                   // heel edge
const STEM_Z0        = 0;
const STEM_Z1        = STEM_THICK;
const STEM_ZC        = STEM_THICK / 2;

const TRENCH_MARGIN  = 0.5;                                       // working room either side of the footing in Z
const TRENCH_Z0      = FOOTING_Z0 - TRENCH_MARGIN;
const TRENCH_Z1      = FOOTING_Z1 + TRENCH_MARGIN;

// Rebar spacing -- dense enough to read as a real reinforcement mesh
// rather than a handful of scattered rods. Stem dowels use the same
// spacing as the Direction-2 mat bars so they visually align as the same
// reinforcement system, not two unrelated cages.
const REBAR_SPACING_1 = 0.16;
const REBAR_SPACING_2 = 0.28;
const STEM_DOWEL_SPACING = REBAR_SPACING_2;

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

// The retained side isn't flat lawn -- it's the toe of an existing, overly
// steep bank that the wall exists to hold back. The rise starts right at
// the excavation margin (matching where the backfill wedge in the
// Backfilling step ends, at STEM_Z1 + HEEL_WIDTH + 0.3 = 2.05) so the
// backfilled soil ties into the existing grade with no visible gap, and
// it's steeper than a natural angle of repose -- the whole reason a
// structural wall is needed here instead of just grading a slope.
const RAMP_Z0  = HOLE_Z1 + 0.05;
const RAMP_RUN = 2.2;
const RAMP_Z1  = RAMP_Z0 + RAMP_RUN;

// A single tilted quad connecting (y0 at z0) to (y1 at z1), full site width.
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
  const mesh = new THREE.Mesh(geo, MAT.grass);
  mesh.receiveShadow = true;
  return mesh;
}

// Adds the rising slope + flat hilltop plateau beyond the working apron --
// shared by buildGround() and buildGroundWithTrench() so the hillside is
// always present, whether or not the trench is currently open.
function addHillside() {
  groundGroup.add(buildSlopedQuad(RAMP_Z0, TOE_GRADE_Y, RAMP_Z1, RETAINED_GRADE_Y));
  const plateau = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_HALF * 2, GROUND_HALF - RAMP_Z1), MAT.grass);
  plateau.rotation.x = -Math.PI / 2;
  plateau.position.set(0, RETAINED_GRADE_Y - 0.01, (RAMP_Z1 + GROUND_HALF) / 2);
  plateau.receiveShadow = true;
  groundGroup.add(plateau);
}

// Intact lawn, no trench -- used before excavation happens. Flat toe/working
// apron out to the base of the hillside, then the permanent slope + plateau.
function buildGround() {
  while (groundGroup.children.length) groundGroup.remove(groundGroup.children[0]);
  const flat = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_HALF * 2, GROUND_HALF + RAMP_Z0), MAT.grass);
  flat.rotation.x = -Math.PI / 2;
  flat.position.set(0, TOE_GRADE_Y - 0.01, (-GROUND_HALF + RAMP_Z0) / 2);
  flat.receiveShadow = true;
  groundGroup.add(flat);
  addHillside();
}

// Ground with a trench-shaped opening left over the wall footprint, so the
// excavation and everything built inside it (footing, rebar, casting) is
// actually visible instead of sitting under a solid, unbroken lawn plane.
// The hillside itself is unaffected -- the hole only ever cuts through the
// flat working apron in front of it.
function buildGroundWithTrench() {
  while (groundGroup.children.length) groundGroup.remove(groundGroup.children[0]);

  function piece(w, d, cx, cz) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.grass);
    m.rotation.x = -Math.PI / 2;
    m.position.set(cx, TOE_GRADE_Y - 0.01, cz);
    m.receiveShadow = true;
    groundGroup.add(m);
  }

  // West / east strips run the full Z depth of the flat working apron.
  piece(HOLE_X0 - (-GROUND_HALF), GROUND_HALF + RAMP_Z0, (-GROUND_HALF + HOLE_X0) / 2, (-GROUND_HALF + RAMP_Z0) / 2);
  piece(GROUND_HALF - HOLE_X1,    GROUND_HALF + RAMP_Z0, (HOLE_X1 + GROUND_HALF) / 2, (-GROUND_HALF + RAMP_Z0) / 2);
  // Toe-side / heel-side strips fill the rest of the frame around the hole.
  piece(HOLE_X1 - HOLE_X0, HOLE_Z0 - (-GROUND_HALF), (HOLE_X0 + HOLE_X1) / 2, (-GROUND_HALF + HOLE_Z0) / 2);
  piece(HOLE_X1 - HOLE_X0, RAMP_Z0 - HOLE_Z1,         (HOLE_X0 + HOLE_X1) / 2, (HOLE_Z1 + RAMP_Z0) / 2);

  addHillside();
}

let siteGroup = null;

function buildSiteElements() {
  if (siteGroup) scene.remove(siteGroup);
  siteGroup = new THREE.Group();
  scene.add(siteGroup);

  const matBarrier = new THREE.MeshLambertMaterial({ color: 0xd0d0d0 });
  const matBarrierS = new THREE.MeshLambertMaterial({ color: 0xb0b0b0 });
  const matSpoil = new THREE.MeshLambertMaterial({ color: 0x7a5c35 });
  const matRebarDeco = new THREE.MeshLambertMaterial({ color: 0x607d8b });

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

  const spoilGeo = new THREE.SphereGeometry(2.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const spoil = new THREE.Mesh(spoilGeo, matSpoil);
  spoil.position.set(WALL_X1 + 4, 0, TRENCH_Z0 - 2);
  spoil.scale.set(1.1, 0.5, 0.9);
  spoil.castShadow = true;
  siteGroup.add(spoil);

  const rebarBundle = new THREE.Group();
  rebarBundle.position.set(WALL_X0 - 3, 0.1, TRENCH_Z0 - 3);
  for (let row = 0; row < 3; row++) {
    const cols = 5 - row;
    for (let col = 0; col < cols; col++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6), matRebarDeco);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(col * 0.18 - (cols * 0.18) / 2, row * 0.1, 0);
      rebarBundle.add(bar);
    }
  }
  siteGroup.add(rebarBundle);

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
   WALL / REBAR BUILDER HELPERS
══════════════════════════════════════════════════════════════ */

// Trench void -- solid dark box representing the un-poured excavation.
// Hidden (not removed) once its section starts casting, same fix applied
// in Drilled Shaft: a solid void mesh sitting at the same position as
// poured concrete fully encloses and hides it if left visible.
function buildTrenchVoid() {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_LENGTH, 0.06, TRENCH_Z1 - TRENCH_Z0),
    MAT.voidDark
  );
  floor.position.set(0, FOOTING_BOT_Y, (TRENCH_Z0 + TRENCH_Z1) / 2);
  g.add(floor);
  const wallMat = MAT.dirt;
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_LENGTH, TOE_GRADE_Y - FOOTING_BOT_Y, 0.06),
    wallMat
  );
  front.position.set(0, (TOE_GRADE_Y + FOOTING_BOT_Y) / 2, TRENCH_Z0);
  g.add(front);
  const back = front.clone();
  back.position.z = TRENCH_Z1;
  g.add(back);
  const endL = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, TOE_GRADE_Y - FOOTING_BOT_Y, TRENCH_Z1 - TRENCH_Z0),
    wallMat
  );
  endL.position.set(WALL_X0, (TOE_GRADE_Y + FOOTING_BOT_Y) / 2, (TRENCH_Z0 + TRENCH_Z1) / 2);
  g.add(endL);
  const endR = endL.clone();
  endR.position.x = WALL_X1;
  g.add(endR);
  return g;
}

// A footing transverse bar with a real 90-degree hook at each end, bending
// up into the footing thickness at the toe and heel edges -- the standard
// anchorage detail at a discontinuous footing edge (as opposed to the stem
// dowels in DowelBendCurve, which are a separate set of bars).
class FootingEndHookCurve extends THREE.Curve {
  constructor(x, y, z0, z1, hookHeight) {
    super();
    const bendIn = 0.08;
    this.pts = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, y + hookHeight, z0),
      new THREE.Vector3(x, y + hookHeight * 0.15, z0 + bendIn * 0.35),
      new THREE.Vector3(x, y, z0 + bendIn),
      new THREE.Vector3(x, y, z1 - bendIn),
      new THREE.Vector3(x, y + hookHeight * 0.15, z1 - bendIn * 0.35),
      new THREE.Vector3(x, y + hookHeight, z1)
    ]);
  }
  getPoint(t, target = new THREE.Vector3()) {
    return this.pts.getPoint(t, target);
  }
}

// A single rebar mat: bars running either along X (dir 1, spanning the
// wall length) or along Z (dir 2, spanning the footing width), at a
// given Y height. Returns { group, bars, reveal(pct) } -- reveal grows
// the mat progressively along its own run direction, for hold-to-place.
// opts.chairs adds small spacer chairs under the bars (bottom mat only,
// matching the reference); opts.hooks adds a stub-cap end marker (top mat
// only); opts.endBends bends dir-2 bars into a real L-hook at the toe and
// heel edges (bottom mat only, matching the reference's footing detail).
function buildRebarMat(dir, y, spacing, opts) {
  opts = opts || {};
  const group = new THREE.Group();
  const bars = [];

  function addHooks(bar, x, z, alongX) {
    const hookLen = 0.12;
    [-1, 1].forEach(sign => {
      const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, hookLen, 5), MAT.rebarSteel);
      if (alongX) {
        hook.position.set(x + sign * (WALL_LENGTH / 2), y - hookLen / 2, z);
      } else {
        hook.position.set(x, y - hookLen / 2, z + sign * ((FOOTING_Z1 - FOOTING_Z0) / 2));
      }
      hook.visible = false;
      group.add(hook);
      bar.userData.extras = bar.userData.extras || [];
      bar.userData.extras.push(hook);
    });
  }

  function addChairs(bar, alongX, fixedCoord) {
    bar.userData.extras = bar.userData.extras || [];
    const span = alongX ? WALL_LENGTH : (FOOTING_Z1 - FOOTING_Z0);
    const start = alongX ? WALL_X0 : FOOTING_Z0;
    for (let s = start + 0.6; s < start + span - 0.4; s += 1.4) {
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), MAT.concreteDark);
      if (alongX) chair.position.set(s, y - 0.05, fixedCoord);
      else chair.position.set(fixedCoord, y - 0.05, s);
      chair.visible = false;
      group.add(chair);
      bar.userData.extras.push(chair);
    }
  }

  if (dir === 1) {
    // bars run along X, spaced along Z across the footing width
    for (let z = FOOTING_Z0 + 0.15; z <= FOOTING_Z1 - 0.1; z += spacing) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, WALL_LENGTH, 6), MAT.rebarSteel);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, y, z);
      bar.visible = false;
      group.add(bar);
      bars.push(bar);
      if (opts.hooks) addHooks(bar, 0, z, true);
      if (opts.chairs) addChairs(bar, true, z);
    }
  } else {
    // bars run along Z, spaced along X across the wall length
    for (let x = WALL_X0 + 0.15; x <= WALL_X1 - 0.1; x += spacing) {
      let bar;
      if (opts.endBends) {
        const curve = new FootingEndHookCurve(x, y, FOOTING_Z0, FOOTING_Z1, 0.12);
        bar = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.02, 6, false), MAT.rebarSteel);
      } else {
        bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, FOOTING_Z1 - FOOTING_Z0, 6), MAT.rebarSteel);
        bar.rotation.x = Math.PI / 2;
        bar.position.set(x, y, (FOOTING_Z0 + FOOTING_Z1) / 2);
      }
      bar.visible = false;
      group.add(bar);
      bars.push(bar);
      if (opts.hooks) addHooks(bar, x, (FOOTING_Z0 + FOOTING_Z1) / 2, false);
      if (opts.chairs) addChairs(bar, false, x);
    }
  }
  function reveal(pct) {
    const n = Math.round(bars.length * pct);
    bars.forEach((b, i) => {
      const v = i < n;
      b.visible = v;
      if (b.userData.extras) b.userData.extras.forEach(e => { e.visible = v; });
    });
  }
  return { group, bars, reveal };
}

// Stem starter/main bars, built as continuous bent dowels -- each one is a
// single curved tube that lies flat in the footing (lap-spliced with the
// mat), bends 90 degrees, and rises the full stem height, matching the
// reference's L-shaped dowel-to-stem detail instead of separate floating
// straight rods. Two rows (front/back stem face), revealed progressively
// along X at the same spacing as the Direction-2 mat bars so they read as
// the same reinforcement system, not two unrelated cages.
class DowelBendCurve extends THREE.Curve {
  constructor(x, y0, yTop, zBend, sign) {
    super();
    this.pts = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, y0, zBend + sign * 0.55),
      new THREE.Vector3(x, y0, zBend + sign * 0.05),
      new THREE.Vector3(x, y0 + 0.16, zBend),
      new THREE.Vector3(x, yTop, zBend)
    ]);
  }
  getPoint(t, target = new THREE.Vector3()) {
    return this.pts.getPoint(t, target);
  }
}

function buildStemVerticals(spacing) {
  const group = new THREE.Group();
  const bars = [];
  const y0 = FOOTING_BOT_Y + 0.15;
  const yTop = STEM_TOP_Y - 0.15;

  for (let x = WALL_X0 + 0.15; x <= WALL_X1 - 0.15; x += spacing) {
    [{ z: STEM_Z0, sign: -1 }, { z: STEM_Z1, sign: 1 }].forEach(({ z, sign }) => {
      const curve = new DowelBendCurve(x, y0, yTop, z, sign);
      const geo = new THREE.TubeGeometry(curve, 16, 0.02, 6, false);
      const bar = new THREE.Mesh(geo, MAT.rebarSteel);
      bar.visible = false;
      group.add(bar);
      bars.push(bar);
    });
  }
  function reveal(pct) {
    const n = Math.round(bars.length * pct);
    bars.forEach((b, i) => { b.visible = i < n; });
  }
  return { group, bars, reveal };
}

// Horizontal binder ties across the stem verticals, revealed progressively.
function buildStemBinders(spacing) {
  const group = new THREE.Group();
  const bars = [];
  for (let y = FOOTING_TOP_Y + 0.25; y <= STEM_TOP_Y - 0.15; y += spacing) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, WALL_LENGTH - 0.3, 6), MAT.rebarSteel);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, y, STEM_ZC);
    bar.visible = false;
    group.add(bar);
    bars.push(bar);
  }
  function reveal(pct) {
    const n = Math.round(bars.length * pct);
    bars.forEach((b, i) => { b.visible = i < n; });
  }
  return { group, bars, reveal };
}

// Formwork panel (front or back face of the stem), staged lying flat on
// the ground nearby, then lifted upright and slid into position -- same
// stage-then-lift pattern used for casing/cage installs elsewhere.
function buildFormworkPanel(face) {
  const geo = new THREE.BoxGeometry(WALL_LENGTH - 0.2, STEM_HEIGHT, 0.06);
  const panel = new THREE.Mesh(geo, MAT.formworkWood);
  panel.userData.face = face; // 'front' | 'back'
  return panel;
}

// Weep pipe -- short horizontal PVC pipe through the stem thickness.
function buildWeepPipe() {
  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, STEM_THICK + 0.1, 8),
    MAT.weepPipe
  );
  pipe.rotation.x = Math.PI / 2;
  return pipe;
}

let stagedFormworkPanels = null;

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

  // The lawn stays intact through layout, then opens up over the wall
  // footprint from Excavation onward so everything built below grade is
  // actually visible instead of sitting under a solid, unbroken plane.
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
    rc.innerHTML = `
      <div id="result-icon">🧱</div>
      <h2>Retaining Wall Complete!</h2>
      <p>Wall cast, drained, and backfilled to grade.</p>
      <div id="result-score-line">Final Score: <span id="result-score">${STATE.score}</span></div>
      <div id="result-grade">${getGrade()}</div>
      <div class="pile-report">
        <h3 style="color:#f5a623;margin-bottom:10px;">Construction Report</h3>
        <table style="width:100%;text-align:left;font-size:0.85rem;">
          <tr><td style="color:#aaa;">Wall Type:</td><td>Cantilever Retaining Wall</td></tr>
          <tr><td style="color:#aaa;">Wall Length:</td><td>10.0m</td></tr>
          <tr><td style="color:#aaa;">Stem Height:</td><td>4.0m</td></tr>
          <tr><td style="color:#aaa;">Footing:</td><td>Two-mat reinforced</td></tr>
          <tr><td style="color:#aaa;">Drainage:</td><td style="color:#27ae60;">Weep holes + gravel layer</td></tr>
          <tr><td style="color:#aaa;">Backfill:</td><td style="color:#27ae60;">Compacted in lifts</td></tr>
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
  if (STATE.score >= 900)      return 'Master Wall Builder!';
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
  if (stagedFormworkPanels) {
    stagedFormworkPanels.forEach(p => {
      const stg = p.userData.stagePos;
      if (stg) p.position.set(stg.x, stg.y, stg.z);
      p.userData.installed = false;
      p.visible = true;
    });
  }
  STATE.score = 1000;
  STATE.penalties = 0;
  STATE.drivenDepth = 0;
  STATE.drilledDepth = 0;
  STATE.totalBlows = 0;
  STATE.excavationComplete = false;
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

  if (OBJ.excavatorArm && STATE.stepState.digging) {
    OBJ.excavatorArm.rotation.z   = -0.62 + 0.38 * Math.sin(elapsed * 3.2);
    if (OBJ.excavatorStick)  OBJ.excavatorStick.rotation.z  = 0.48 + 0.22 * Math.sin(elapsed * 3.2 + 0.5);
    if (OBJ.excavatorBucket) OBJ.excavatorBucket.rotation.z = -0.42 - 0.3 * Math.sin(elapsed * 3.2 + 1.1);
    if (OBJ.excavatorUpper) OBJ.excavatorUpper.rotation.y = 0.18 * Math.sin(elapsed * 0.45);
  }

  if (OBJ.truckDrum) {
    OBJ.truckDrum.rotation.y += 0.018;
  }

  if (OBJ.compactor && STATE.stepState.compacting) {
    OBJ.compactor.position.y = 0.3 + 0.04 * Math.abs(Math.sin(elapsed * 14));
  }

  if (OBJ.inspector) {
    OBJ.inspector.position.y = 0 + 0.05 * Math.sin(elapsed * 1.5);
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
            showFeedback('correct', 'Soil profile confirmed suitable for a spread footing. DRAINAGE-AWARE RETAINING WALL DESIGN CONFIRMED.');
            safeTimeout(() => completeStep(), 1500);
          });
          ab.appendChild(submitBtn);
        }
      }
    },
    cleanup() {}
  },

  /* ─────────────────── 1: Wall Alignment Layout ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.placed = 0;
      ss.total = 3;
      ss.demoStarted = false;

      const stakePositions = [
        new THREE.Vector3(WALL_X0, 0.01, STEM_ZC),
        new THREE.Vector3(0,        0.01, STEM_ZC),
        new THREE.Vector3(WALL_X1, 0.01, STEM_ZC)
      ];
      const labels = ['Start', 'Mid', 'End'];

      const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(WALL_LENGTH + 0.2, 0.05, FOOTING_WIDTH + 0.2));
      const outlineMat = new THREE.LineBasicMaterial({ color: 0xf5a623 });
      const outlineMesh = new THREE.LineSegments(outlineGeo, outlineMat);
      outlineMesh.position.set(0, 0.03, (FOOTING_Z0 + FOOTING_Z1) / 2);
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

        const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.7, 6), MAT.rebarSteel);
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
          showFeedback('correct', 'Wall alignment set out! Layout complete.');
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
      ab.innerHTML = '<div class="step-instruction">Click one stake point to mark the wall alignment -- the rest will follow the same way</div>';

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

  /* ─────────────────── 2: Excavation ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.depthPct = 0;
      ss.digging = false;

      const trench = buildTrenchVoid();
      trench.visible = false;
      addStep(trench);
      OBJ.trenchVoid = trench;

      // Trench sides shown as a wireframe outline until dug
      const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(WALL_LENGTH, 0.02, TRENCH_Z1 - TRENCH_Z0));
      const outline = new THREE.LineSegments(outlineGeo, new THREE.LineBasicMaterial({ color: 0xf5a623 }));
      outline.position.set(0, 0.02, (TRENCH_Z0 + TRENCH_Z1) / 2);
      addStep(outline);

      const ab = DOM.actionBar();
      ab.innerHTML = '';

      const statsDiv = el('div', 'blow-display', '');
      statsDiv.innerHTML = `
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center;">
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Trench Depth</div>
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
      const maxDepth = TOE_GRADE_Y - FOOTING_BOT_Y;

      function doDig() {
        if (ss.depthPct >= 100) return;
        ss.depthPct = Math.min(100, ss.depthPct + 2);
        const depth = (maxDepth * ss.depthPct / 100).toFixed(1);
        const dEl = $('dig-depth'); if (dEl) dEl.textContent = depth + 'm';
        const pEl = $('dig-pct');   if (pEl) pEl.textContent = Math.round(ss.depthPct) + '%';

        // Grade sits at world Y=0, so scaling the group's Y around its own
        // origin keeps the top edge pinned at grade while the floor rises
        // up to reflect the current (shallower) dug depth.
        trench.visible = true;
        trench.scale.y = Math.max(0.02, ss.depthPct / 100);

        // The trench itself is only ~0.7 units deep -- easy to miss against
        // a 36-unit site. A growing spoil pile gives an unmistakable second
        // cue that digging is actually happening, regardless of depth scale.
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
          showFeedback('correct', 'Trench excavated to footing depth!');
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

  /* ─────────────────── 3: Base Preparation ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.poured = false;
      ss.spacers = 0;

      const trench = buildTrenchVoid();
      addStep(trench);
      OBJ.trenchVoid = trench;

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Hold to pour the PCC blinding layer, then place cover-block spacers</div>';

      const pccBtn = makeBtn('POUR PCC', 'btn-primary', () => {});
      let pourIv = null;
      let h = 0.01;
      const maxH = 0.1;

      function doPour() {
        if (h >= maxH) return;
        h = Math.min(maxH, h + 0.006);
        if (!OBJ.pccSlab) {
          const slab = new THREE.Mesh(
            new THREE.BoxGeometry(WALL_LENGTH - 0.2, 0.01, TRENCH_Z1 - TRENCH_Z0 - 0.2),
            MAT.pcc
          );
          slab.position.set(0, FOOTING_BOT_Y, (TRENCH_Z0 + TRENCH_Z1) / 2);
          addStep(slab);
          OBJ.pccSlab = slab;
        }
        OBJ.pccSlab.scale.y = h / 0.01;
        OBJ.pccSlab.position.y = FOOTING_BOT_Y + h / 2;
        if (h >= maxH) {
          if (pourIv) { clearInterval(pourIv); pourIv = null; }
          markSubtask(0);
          showFeedback('correct', 'PCC blinding layer poured!');
          pccBtn.disabled = true;
          pccBtn.style.opacity = '0.5';
          showSpacerStage();
        }
      }
      pccBtn.addEventListener('mousedown', () => { if (h < maxH) pourIv = safeInterval(doPour, 40); doPour(); });
      pccBtn.addEventListener('mouseup',    () => { if (pourIv) { clearInterval(pourIv); pourIv = null; } });
      pccBtn.addEventListener('mouseleave', () => { if (pourIv) { clearInterval(pourIv); pourIv = null; } });
      ab.appendChild(pccBtn);

      function showSpacerStage() {
        const wrap = el('div', 'step-instruction', 'Place cover-block spacers along the blinding layer');
        ab.appendChild(wrap);
        const btn = makeBtn('Place Cover Blocks', 'btn-primary', () => {
          if (ss.spacers > 0) return;
          ss.spacers = 1;
          for (let x = WALL_X0 + 0.5; x <= WALL_X1 - 0.5; x += 1.2) {
            const spacer = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), MAT.concreteDark);
            spacer.position.set(x, FOOTING_BOT_Y + 0.1 + 0.03, STEM_ZC);
            addStep(spacer);
          }
          markSubtask(1);
          showFeedback('correct', 'Cover blocks placed — footing steel will sit at correct cover depth.');
          safeTimeout(() => completeStep(), 1000);
        });
        ab.appendChild(btn);
      }
    },
    cleanup() {
      delete OBJ.pccSlab;
    }
  },

  /* ─────────────────── 4: Base Reinforcement ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.done = 0;

      const trench = buildTrenchVoid();
      addStep(trench);

      const pccSlab = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_LENGTH - 0.2, 0.1, TRENCH_Z1 - TRENCH_Z0 - 0.2),
        MAT.pcc
      );
      pccSlab.position.set(0, FOOTING_BOT_Y + 0.05, (TRENCH_Z0 + TRENCH_Z1) / 2);
      addStep(pccSlab);

      const bottomY = FOOTING_BOT_Y + 0.18;
      const topY    = FOOTING_TOP_Y - 0.08;
      const matBottom1 = buildRebarMat(1, bottomY, REBAR_SPACING_1, { chairs: true });
      const matBottom2 = buildRebarMat(2, bottomY + 0.02, REBAR_SPACING_2, { endBends: true });
      const matTop1    = buildRebarMat(1, topY, REBAR_SPACING_1, { hooks: true });
      const matTop2    = buildRebarMat(2, topY - 0.02, REBAR_SPACING_2);
      [matBottom1, matBottom2, matTop1, matTop2].forEach(m => addStep(m.group));

      const stages = [
        { label: 'Bottom Mat — Direction 1', mat: matBottom1 },
        { label: 'Bottom Mat — Direction 2', mat: matBottom2 },
        { label: 'Top Mat — Direction 1',    mat: matTop1 },
        { label: 'Top Mat — Direction 2',    mat: matTop2 }
      ];

      const ab = DOM.actionBar();
      ab.innerHTML = '';
      const instr = el('div', 'step-instruction', `Place ${stages[0].label}`);
      ab.appendChild(instr);

      let stageIdx = 0;
      const btn = makeBtn(`Place ${stages[0].label}`, 'btn-primary', () => runStage());
      ab.appendChild(btn);

      function runStage() {
        btn.disabled = true;
        const stage = stages[stageIdx];
        showFeedback('correct', `Placing ${stage.label}...`);
        let t = 0;
        const iv = safeInterval(() => {
          t += 0.05;
          stage.mat.reveal(Math.min(1, t));
          if (t >= 1) {
            clearInterval(iv);
            markSubtask(stageIdx);
            ss.done++;
            stageIdx++;
            if (stageIdx < stages.length) {
              instr.textContent = `Place ${stages[stageIdx].label}`;
              btn.textContent = `Place ${stages[stageIdx].label}`;
              btn.disabled = false;
            } else {
              showFeedback('correct', 'Base reinforcement complete — bottom and top mats both placed!');
              safeTimeout(() => completeStep(), 1200);
            }
          }
        }, 40);
      }
    },
    cleanup() {}
  },

  /* ─────────────────── 5: Wall Stem Starter Rebar ─── */
  {
    enter() {
      const ss = STATE.stepState;

      const trench = buildTrenchVoid();
      addStep(trench);
      const pccSlab = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_LENGTH - 0.2, 0.1, TRENCH_Z1 - TRENCH_Z0 - 0.2),
        MAT.pcc
      );
      pccSlab.position.set(0, FOOTING_BOT_Y + 0.05, (TRENCH_Z0 + TRENCH_Z1) / 2);
      addStep(pccSlab);
      [buildRebarMat(1, FOOTING_BOT_Y + 0.18, REBAR_SPACING_1), buildRebarMat(2, FOOTING_BOT_Y + 0.2, REBAR_SPACING_2, { endBends: true })].forEach(m => {
        m.reveal(1);
        addStep(m.group);
      });

      const verticals = buildStemVerticals(STEM_DOWEL_SPACING);
      addStep(verticals.group);

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Extend the footing dowels into full-height stem bars</div>';
      const btn = makeBtn('Extend Stem Dowels', 'btn-primary', () => {
        btn.disabled = true;
        showFeedback('correct', 'Standing up the stem reinforcement...');
        let t = 0;
        const iv = safeInterval(() => {
          t += 0.025;
          verticals.reveal(Math.min(1, t));
          if (t >= 1) {
            clearInterval(iv);
            markSubtask(0);
            showFeedback('correct', 'Stem starter bars at full height — lap-spliced with the footing dowels.');
            safeTimeout(() => completeStep(), 1200);
          }
        }, 30);
      });
      ab.appendChild(btn);
    },
    cleanup() {}
  },

  /* ─────────────────── 6: Base Casting ─── */
  {
    enter() {
      const ss = STATE.stepState;

      const trench = buildTrenchVoid();
      addStep(trench);
      OBJ.trenchVoid = trench;
      const pccSlab = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_LENGTH - 0.2, 0.1, TRENCH_Z1 - TRENCH_Z0 - 0.2),
        MAT.pcc
      );
      pccSlab.position.set(0, FOOTING_BOT_Y + 0.05, (TRENCH_Z0 + TRENCH_Z1) / 2);
      addStep(pccSlab);
      [buildRebarMat(1, FOOTING_BOT_Y + 0.18, REBAR_SPACING_1), buildRebarMat(2, FOOTING_BOT_Y + 0.2, REBAR_SPACING_2, { endBends: true }),
       buildRebarMat(1, FOOTING_TOP_Y - 0.08, REBAR_SPACING_1), buildRebarMat(2, FOOTING_TOP_Y - 0.06, REBAR_SPACING_2)].forEach(m => {
        m.reveal(1);
        addStep(m.group);
      });
      const verticals = buildStemVerticals(STEM_DOWEL_SPACING);
      verticals.reveal(1);
      addStep(verticals.group);

      const ab = DOM.actionBar();
      ab.innerHTML = '';
      const statsDiv = el('div', 'blow-display', '');
      statsDiv.innerHTML = `
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center;">
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Footing Poured</div>
            <div id="base-pour-pct" style="color:#27ae60;font-size:1.2rem;font-weight:700;">0%</div>
          </div>
        </div>
      `;
      ab.appendChild(statsDiv);
      const fillWrap = el('div', 'fill-meter-wrap');
      const fillTrack = el('div', 'fill-meter-track');
      const fillBar = el('div', 'fill-meter-bar');
      fillBar.id = 'base-pour-bar';
      fillBar.style.background = 'linear-gradient(to right,#616161,#9e9e9e,#bdbdbd)';
      fillBar.style.width = '0%';
      fillTrack.appendChild(fillBar);
      fillWrap.appendChild(fillTrack);
      ab.appendChild(fillWrap);

      const pourBtn = makeBtn('HOLD TO POUR', 'btn-primary', () => {});
      pourBtn.style.cssText += 'font-size:1.1rem;padding:12px 40px;background:#757575;color:#fff;margin-top:10px;';
      ab.appendChild(pourBtn);

      let fillPct = 0;
      let pouring = false;
      let iv = null;
      let concFill = null;

      function tick() {
        if (fillPct >= 100) return;
        if (trench.visible) trench.visible = false; // reveal the void so the pour is visible
        fillPct = Math.min(100, fillPct + 1.4);
        if (!concFill) {
          concFill = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, FOOTING_THICK, FOOTING_WIDTH),
            MAT.concreteDark
          );
          concFill.position.set(WALL_X0, (FOOTING_TOP_Y + FOOTING_BOT_Y) / 2, (FOOTING_Z0 + FOOTING_Z1) / 2);
          addStep(concFill);
        }
        const len = WALL_LENGTH * fillPct / 100;
        concFill.scale.x = len / 0.1;
        concFill.position.x = WALL_X0 + len / 2;

        const bar = $('base-pour-bar'); if (bar) bar.style.width = fillPct + '%';
        const pct = $('base-pour-pct'); if (pct) pct.textContent = Math.round(fillPct) + '%';

        if (fillPct >= 100) {
          pouring = false;
          if (iv) { clearInterval(iv); iv = null; }
          markSubtask(0);
          showFeedback('correct', 'Footing poured along its full length!');
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

  /* ─────────────────── 7: Stem Reinforcement — Binders ─── */
  {
    enter() {
      const footing = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_LENGTH, FOOTING_THICK, FOOTING_WIDTH),
        MAT.concreteDark
      );
      footing.position.set(0, (FOOTING_TOP_Y + FOOTING_BOT_Y) / 2, (FOOTING_Z0 + FOOTING_Z1) / 2);
      addStep(footing);

      const verticals = buildStemVerticals(STEM_DOWEL_SPACING);
      verticals.reveal(1);
      addStep(verticals.group);

      const binders = buildStemBinders(0.3);
      addStep(binders.group);

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Tie horizontal binder bars across the stem verticals</div>';
      const btn = makeBtn('Place Binder Ties', 'btn-primary', () => {
        btn.disabled = true;
        showFeedback('correct', 'Placing binder ties up the stem...');
        let t = 0;
        const iv = safeInterval(() => {
          t += 0.04;
          binders.reveal(Math.min(1, t));
          if (t >= 1) {
            clearInterval(iv);
            markSubtask(0);
            showFeedback('correct', 'Stem cage complete — verticals tied together with binders.');
            safeTimeout(() => completeStep(), 1200);
          }
        }, 30);
      });
      ab.appendChild(btn);
    },
    cleanup() {}
  },

  /* ─────────────────── 8: Stem Formwork ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.installed = 0;

      const footing = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_LENGTH, FOOTING_THICK, FOOTING_WIDTH),
        MAT.concreteDark
      );
      footing.position.set(0, (FOOTING_TOP_Y + FOOTING_BOT_Y) / 2, (FOOTING_Z0 + FOOTING_Z1) / 2);
      addStep(footing);
      const verticals = buildStemVerticals(STEM_DOWEL_SPACING); verticals.reveal(1); addStep(verticals.group);
      const binders = buildStemBinders(0.3); binders.reveal(1); addStep(binders.group);

      const panels = [
        { face: 'front', z: STEM_Z0 - 0.05 },
        { face: 'back',  z: STEM_Z1 + 0.05 }
      ].map((p, i) => {
        const panel = buildFormworkPanel(p.face);
        const stageX = WALL_X0 - 2.5;
        const stageZ = TRENCH_Z0 - 2.5 - i * 1.2;
        panel.rotation.x = Math.PI / 2; // lying flat on the ground
        panel.position.set(stageX, 0.1, stageZ);
        panel.userData.stagePos = { x: stageX, y: 0.1, z: stageZ };
        panel.userData.targetZ = p.z;
        panel.userData.installed = false;
        addStep(panel);
        return panel;
      });
      stagedFormworkPanels = panels;

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Lift each staged panel and install it against the stem cage</div>';

      const items = [];
      ['Install front-face panel', 'Install back-face panel'].forEach((label, i) => {
        const item = el('div', 'panel-item');
        item.innerHTML = `<div class="item-icon">🪵</div><div class="item-label">${label}</div>`;
        item.addEventListener('click', () => installPanel(i));
        items.push(item);
        ab.appendChild(item);
      });

      function installPanel(i) {
        if (items[i].classList.contains('placed')) return;
        items[i].classList.add('placed');
        items[i].innerHTML += '<div style="color:var(--green-ok);font-size:.85rem;margin-top:2px;">✓ Installed</div>';

        const panel = panels[i];
        const startX = panel.position.x, startY = panel.position.y, startZ = panel.position.z;
        const hoverY = STEM_HEIGHT / 2 + FOOTING_TOP_Y + 2;
        showFeedback('correct', `Lifting ${panel.userData.face}-face panel...`);

        let t1 = 0;
        const liftIv = safeInterval(() => {
          t1 += 0.025;
          if (t1 >= 1) {
            clearInterval(liftIv);
            panel.rotation.x = 0;
            panel.position.y = hoverY;
            guide();
            return;
          }
          panel.rotation.x = (Math.PI / 2) * (1 - t1);
          panel.position.y = startY + (hoverY - startY) * t1;
        }, 30);

        function guide() {
          showFeedback('correct', `Positioning ${panel.userData.face}-face panel...`);
          let t2 = 0;
          const guideIv = safeInterval(() => {
            t2 += 0.03;
            if (t2 >= 1) {
              clearInterval(guideIv);
              panel.position.x = 0;
              panel.position.z = panel.userData.targetZ;
              settle();
              return;
            }
            panel.position.x = startX + (0 - startX) * t2;
            panel.position.z = startZ + (panel.userData.targetZ - startZ) * t2;
          }, 30);
        }

        function settle() {
          let t3 = 0;
          const finalY = FOOTING_TOP_Y + STEM_HEIGHT / 2;
          const settleIv = safeInterval(() => {
            t3 += 0.04;
            if (t3 >= 1) {
              clearInterval(settleIv);
              panel.position.y = finalY;
              panel.userData.installed = true;
              ss.installed++;
              markSubtask(i);
              showFeedback('correct', `${panel.userData.face[0].toUpperCase()}${panel.userData.face.slice(1)}-face panel installed!`);
              if (ss.installed >= 2) {
                showFeedback('correct', 'Formwork complete on both faces!');
                safeTimeout(() => completeStep(), 1200);
              }
              return;
            }
            panel.position.y = hoverY + (finalY - hoverY) * t3;
          }, 30);
        }
      }
    },
    cleanup() {}
  },

  /* ─────────────────── 9: Stem Casting ─── */
  {
    enter() {
      const ss = STATE.stepState;

      const footing = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_LENGTH, FOOTING_THICK, FOOTING_WIDTH),
        MAT.concreteDark
      );
      footing.position.set(0, (FOOTING_TOP_Y + FOOTING_BOT_Y) / 2, (FOOTING_Z0 + FOOTING_Z1) / 2);
      addStep(footing);
      const verticals = buildStemVerticals(STEM_DOWEL_SPACING); verticals.reveal(1); addStep(verticals.group);
      const binders = buildStemBinders(0.3); binders.reveal(1); addStep(binders.group);

      const frontPanel = buildFormworkPanel('front');
      frontPanel.position.set(0, FOOTING_TOP_Y + STEM_HEIGHT / 2, STEM_Z0 - 0.05);
      addStep(frontPanel);
      const backPanel = buildFormworkPanel('back');
      backPanel.position.set(0, FOOTING_TOP_Y + STEM_HEIGHT / 2, STEM_Z1 + 0.05);
      addStep(backPanel);

      const ab = DOM.actionBar();
      ab.innerHTML = '';
      const statsDiv = el('div', 'blow-display', '');
      statsDiv.innerHTML = `
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center;">
          <div style="text-align:center;">
            <div style="color:#aaa;font-size:0.65rem;text-transform:uppercase;">Stem Poured</div>
            <div id="stem-pour-pct" style="color:#27ae60;font-size:1.2rem;font-weight:700;">0%</div>
          </div>
        </div>
      `;
      ab.appendChild(statsDiv);
      const fillWrap = el('div', 'fill-meter-wrap');
      const fillTrack = el('div', 'fill-meter-track');
      const fillBar = el('div', 'fill-meter-bar');
      fillBar.id = 'stem-pour-bar';
      fillBar.style.background = 'linear-gradient(to right,#616161,#9e9e9e,#bdbdbd)';
      fillBar.style.width = '0%';
      fillTrack.appendChild(fillBar);
      fillWrap.appendChild(fillTrack);
      ab.appendChild(fillWrap);

      const pourBtn = makeBtn('HOLD TO POUR', 'btn-primary', () => {});
      pourBtn.style.cssText += 'font-size:1.1rem;padding:12px 40px;background:#757575;color:#fff;margin-top:10px;';
      ab.appendChild(pourBtn);

      let fillPct = 0, pouring = false, iv = null, concFill = null;

      function tick() {
        if (fillPct >= 100) return;
        fillPct = Math.min(100, fillPct + 1.2);
        if (!concFill) {
          concFill = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, 0.05, STEM_THICK - 0.02), MAT.concreteDark);
          concFill.position.set(0, FOOTING_TOP_Y, STEM_ZC);
          addStep(concFill);
        }
        const h = STEM_HEIGHT * fillPct / 100;
        concFill.scale.y = h / 0.05;
        concFill.position.y = FOOTING_TOP_Y + h / 2;

        const bar = $('stem-pour-bar'); if (bar) bar.style.width = fillPct + '%';
        const pct = $('stem-pour-pct'); if (pct) pct.textContent = Math.round(fillPct) + '%';

        if (fillPct >= 100) {
          pouring = false;
          if (iv) { clearInterval(iv); iv = null; }
          markSubtask(0);
          showFeedback('correct', 'Stem poured to full height!');
          pourBtn.disabled = true;
          pourBtn.textContent = 'POURED';
          strikeFormwork();
        }
      }
      pourBtn.addEventListener('mousedown', () => { if (fillPct >= 100 || pouring) return; pouring = true; iv = safeInterval(tick, 60); tick(); });
      pourBtn.addEventListener('mouseup',    () => { pouring = false; if (iv) { clearInterval(iv); iv = null; } });
      pourBtn.addEventListener('mouseleave', () => { pouring = false; if (iv) { clearInterval(iv); iv = null; } });

      function strikeFormwork() {
        const strikeWrap = el('div', 'step-instruction', 'Concrete cured — strip the formwork');
        ab.appendChild(strikeWrap);
        const strikeBtn = makeBtn('Strip Formwork', 'btn-primary', () => {
          scene.remove(frontPanel); scene.remove(backPanel);
          [frontPanel, backPanel].forEach(p => {
            const idx = stepObjects.indexOf(p);
            if (idx > -1) stepObjects.splice(idx, 1);
          });
          markSubtask(1);
          showFeedback('correct', 'Formwork stripped — the finished wall stem is revealed!');
          safeTimeout(() => completeStep(), 1200);
        });
        ab.appendChild(strikeBtn);
      }
    },
    cleanup() {}
  },

  /* ─────────────────── 10: Drainage & Weep Holes ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.weeps = false;
      ss.drainage = false;

      const footing = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, FOOTING_THICK, FOOTING_WIDTH), MAT.concreteDark);
      footing.position.set(0, (FOOTING_TOP_Y + FOOTING_BOT_Y) / 2, (FOOTING_Z0 + FOOTING_Z1) / 2);
      addStep(footing);
      const stem = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, STEM_HEIGHT, STEM_THICK), MAT.concreteDark);
      stem.position.set(0, FOOTING_TOP_Y + STEM_HEIGHT / 2, STEM_ZC);
      addStep(stem);
      OBJ.stemMesh = stem;

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Install weep holes through the stem, then place the drainage layer behind it</div>';

      const weepBtn = makeBtn('Install Weep-Hole Pipes', 'btn-primary', () => {
        if (ss.weeps) return;
        ss.weeps = true;
        weepBtn.disabled = true;
        for (let x = WALL_X0 + 1; x <= WALL_X1 - 1; x += 1.5) {
          const pipe = buildWeepPipe();
          pipe.position.set(x, FOOTING_TOP_Y + 0.4, STEM_ZC);
          addStep(pipe);
        }
        markSubtask(0);
        showFeedback('correct', 'Weep-hole pipes installed — water behind the wall now has a path out.');
        drainBtn.disabled = false;
      });
      ab.appendChild(weepBtn);

      const drainBtn = makeBtn('Place Drainage Layer', 'btn-primary', () => {
        if (ss.drainage || !ss.weeps) return;
        ss.drainage = true;
        drainBtn.disabled = true;
        const gravel = new THREE.Mesh(
          new THREE.BoxGeometry(WALL_LENGTH - 0.2, STEM_HEIGHT - 0.1, 0.25),
          MAT.gravel
        );
        gravel.position.set(0, FOOTING_TOP_Y + STEM_HEIGHT / 2, STEM_Z1 + 0.18);
        addStep(gravel);
        markSubtask(1);
        showFeedback('correct', 'Drainage gravel layer placed — hydrostatic pressure will relieve through the weep holes.');
        safeTimeout(() => completeStep(), 1200);
      });
      drainBtn.disabled = true;
      ab.appendChild(drainBtn);
    },
    cleanup() {}
  },

  /* ─────────────────── 11: Backfilling ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.toeFilled = false;
      ss.fillCount = 0;
      ss.compactCount = 0;
      ss.fillPct = 0;

      const footing = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, FOOTING_THICK, FOOTING_WIDTH), MAT.concreteDark);
      footing.position.set(0, (FOOTING_TOP_Y + FOOTING_BOT_Y) / 2, (FOOTING_Z0 + FOOTING_Z1) / 2);
      addStep(footing);
      const stem = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, STEM_HEIGHT, STEM_THICK), MAT.concreteDark);
      stem.position.set(0, FOOTING_TOP_Y + STEM_HEIGHT / 2, STEM_ZC);
      addStep(stem);
      const gravel = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH - 0.2, STEM_HEIGHT - 0.1, 0.25), MAT.gravel);
      gravel.position.set(0, FOOTING_TOP_Y + STEM_HEIGHT / 2, STEM_Z1 + 0.18);
      addStep(gravel);

      const ab = DOM.actionBar();
      ab.innerHTML = '';
      const instr = el('div', 'step-instruction', 'Backfill the toe side to grade');
      ab.appendChild(instr);

      const toeBtn = makeBtn('Backfill Toe Side', 'btn-primary', () => {
        ss.toeFilled = true;
        toeBtn.disabled = true;
        const toeFill = new THREE.Mesh(
          new THREE.BoxGeometry(WALL_LENGTH, TOE_GRADE_Y - FOOTING_BOT_Y, TOE_WIDTH),
          MAT.dirt
        );
        toeFill.position.set(0, (TOE_GRADE_Y + FOOTING_BOT_Y) / 2, FOOTING_Z0 + TOE_WIDTH / 2);
        addStep(toeFill);
        markSubtask(0);
        showFeedback('correct', 'Toe side backfilled to grade.');
        instr.textContent = 'Add soil behind the wall in lifts (5 total)';
        fillBtn.disabled = false;
      });
      ab.appendChild(toeBtn);

      const fillWrap = el('div', 'fill-meter-wrap');
      const fillTrack = el('div', 'fill-meter-track');
      const fillBar = el('div', 'fill-meter-bar');
      fillBar.id = 'backfill-bar';
      fillBar.style.background = 'linear-gradient(to right,#8d6e63,#a1887f,#bcaaa4)';
      fillBar.style.width = '0%';
      fillTrack.appendChild(fillBar);
      fillWrap.appendChild(fillTrack);
      ab.appendChild(fillWrap);

      const heelFill = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_LENGTH, 0.02, HEEL_WIDTH + STEM_THICK + 0.3),
        MAT.dirt
      );
      heelFill.position.set(0, FOOTING_TOP_Y + 0.01, STEM_Z1 + (HEEL_WIDTH + 0.3) / 2);
      addStep(heelFill);

      function updateHeelFill() {
        const totalRise = RETAINED_GRADE_Y - FOOTING_TOP_Y;
        const h = Math.max(0.02, totalRise * ss.fillPct / 100);
        heelFill.scale.y = h / 0.02;
        heelFill.position.y = FOOTING_TOP_Y + h / 2;
      }

      const fillBtn = makeBtn('Add Soil Layer', 'btn-primary', () => {
        if (ss.fillCount >= 5) return;
        ss.fillCount++;
        ss.fillPct = Math.min(100, ss.fillPct + 20);
        updateHeelFill();
        const bar = $('backfill-bar'); if (bar) bar.style.width = ss.fillPct + '%';
        showFeedback('correct', `Backfill lift ${ss.fillCount}/5 added.`);
        markSubtask(1);

        if (ss.fillPct >= 60 && !compactBtn.enabledOnce) {
          compactBtn.enabledOnce = true;
          compactBtn.disabled = false;
          instr.textContent = 'Compact the fill (3 passes required after 60%)';
        }
        if (ss.fillCount >= 5) {
          fillBtn.disabled = true;
        }
        checkDone();
      });
      ab.appendChild(fillBtn);

      const compactBtn = makeBtn('Compact Fill', 'btn-primary', () => {
        if (ss.compactCount >= 3) return;
        ss.compactCount++;
        OBJ.compactor = OBJ.compactor || (() => {
          const c = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.3, 12), MAT.darkGray);
          c.position.set(0, 0.3, STEM_Z1 + 0.8);
          addStep(c);
          return c;
        })();
        STATE.stepState.compacting = true;
        safeTimeout(() => { STATE.stepState.compacting = false; }, 500);
        showFeedback('correct', `Compaction pass ${ss.compactCount}/3.`);
        markSubtask(2);
        if (ss.compactCount >= 3) compactBtn.disabled = true;
        checkDone();
      });
      compactBtn.disabled = true;
      ab.appendChild(compactBtn);
      fillBtn.disabled = true;

      function checkDone() {
        if (ss.toeFilled && ss.fillCount >= 5 && ss.compactCount >= 3) {
          markSubtask(3);
          showFeedback('correct', 'Backfilling complete — grade restored on both sides of the wall.');
          safeTimeout(() => completeStep(), 1200);
        }
      }
    },
    cleanup() {
      STATE.stepState.compacting = false;
    }
  },

  /* ─────────────────── 12: Final Inspection ─── */
  {
    enter() {
      const ss = STATE.stepState;
      ss.checked = 0;
      ss.scores = [];

      const footing = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, FOOTING_THICK, FOOTING_WIDTH), MAT.concreteDark);
      footing.position.set(0, (FOOTING_TOP_Y + FOOTING_BOT_Y) / 2, (FOOTING_Z0 + FOOTING_Z1) / 2);
      addStep(footing);
      const stem = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, STEM_HEIGHT, STEM_THICK), MAT.concreteDark);
      stem.position.set(0, FOOTING_TOP_Y + STEM_HEIGHT / 2, STEM_ZC);
      addStep(stem);
      const toeFill = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, TOE_GRADE_Y - FOOTING_BOT_Y, TOE_WIDTH), MAT.dirt);
      toeFill.position.set(0, (TOE_GRADE_Y + FOOTING_BOT_Y) / 2, FOOTING_Z0 + TOE_WIDTH / 2);
      addStep(toeFill);
      const heelFill = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, RETAINED_GRADE_Y - FOOTING_TOP_Y, HEEL_WIDTH + STEM_THICK + 0.3), MAT.dirt);
      heelFill.position.set(0, (RETAINED_GRADE_Y + FOOTING_TOP_Y) / 2, STEM_Z1 + (HEEL_WIDTH + 0.3) / 2);
      addStep(heelFill);

      const checkPositions = [
        new THREE.Vector3(WALL_X0 + 1, STEM_TOP_Y + 0.4, STEM_ZC),
        new THREE.Vector3(WALL_X0 + 3.5, STEM_TOP_Y + 0.4, STEM_ZC),
        new THREE.Vector3(0, STEM_TOP_Y + 0.4, STEM_ZC),
        new THREE.Vector3(WALL_X1 - 3.5, STEM_TOP_Y + 0.4, STEM_ZC),
        new THREE.Vector3(WALL_X1 - 1, STEM_TOP_Y + 0.4, STEM_ZC)
      ];

      const ab = DOM.actionBar();
      ab.innerHTML = '<div class="step-instruction">Click each pulsing checkpoint to run the inspection</div>';

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
            markSubtask(0);
            showFeedback('correct', `${chk.label}: ${score}%`);

            if (ss.checked === FINAL_CHECKS.length) {
              const avg = Math.round(ss.scores.reduce((a, b) => a + b, 0) / ss.scores.length);
              safeTimeout(() => {
                ab.innerHTML = '';
                if (avg >= 80) {
                  markSubtask(1);
                  markSubtask(2);
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
