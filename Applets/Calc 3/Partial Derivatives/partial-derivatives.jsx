// First & Second Partial Derivatives on a Surface — Calculus III, Unit 2
// Reconstructed JSX source (decompiled from the compiled production build,
// partial-derivatives-standalone.html). Requires React 18, ReactDOM 18, three.js
// (loaded as globals in the standalone build's UMD script tags).
const { useRef, useEffect, useState } = React;

const f = (x, y) => 0.2 * Math.sin(x) * Math.cos(y);
const fx = (x, y) => 0.2 * Math.cos(x) * Math.cos(y);
const fy = (x, y) => -0.2 * Math.sin(x) * Math.sin(y);
const fxx = (x, y) => -0.2 * Math.sin(x) * Math.cos(y);
const fyy = (x, y) => -0.2 * Math.sin(x) * Math.cos(y);
const fxy = (x, y) => -0.2 * Math.cos(x) * Math.sin(y);
const fyx = (x, y) => -0.2 * Math.cos(x) * Math.sin(y);
const DOMAIN_MIN = -3;
const DOMAIN_MAX = 3;
const SEG = 48;
const Z_SCALE = 1.6;
const INDIGO = 0x3b4fc2;
const INDIGO_CSS = "#3B4FC2";
const LIGHT_BLUE = 0x6478d6;
const DIM_CURVE = 0x9aa2e0;
const RISING = "#3B8F73";
const FALLING = "#C77B94";
const PATH_RED = 0xc0405b;
const AXIS_COLOR = 0x4a4a5c;
const MUTED_TEXT = "#6E6E86";
const TEXT = "#3A3A3C";
const BORDER = "#DCDCF0";
const SURF_LOW = new THREE.Color(0xb7bfef);
const SURF_HIGH = new THREE.Color(0x5f6cc9);
const PATH_CURVE_N = 220;
const DASH_ON = 3;
const DASH_OFF = 3;
const dashPattern = (i) => (i % (DASH_ON + DASH_OFF) < DASH_ON ? 1 : 0);

// ---- mode configuration ----
// sliderVar / fixedVar: which of x,y is driven by the slider vs. the fixed input box
// tangentDir: axis the tangent line is drawn along (= sliderVar for first/pure-second modes,
//             = fixedVar for mixed modes, since the tangent always shows the "inner" derivative)
// mixed: whether this mode uses the dashed fixed-path + dim-reference/live dual curve treatment
// second: whether this mode has a second-derivative badge row below a plain first-derivative row
const MODES = {
  fx: {
    sliderVar: "x",
    fixedVar: "y",
    tangentDir: "x",
    mixed: false,
    second: false,
  },
  fy: {
    sliderVar: "y",
    fixedVar: "x",
    tangentDir: "y",
    mixed: false,
    second: false,
  },
  fxx: {
    sliderVar: "x",
    fixedVar: "y",
    tangentDir: "x",
    mixed: false,
    second: true,
  },
  fyy: {
    sliderVar: "y",
    fixedVar: "x",
    tangentDir: "y",
    mixed: false,
    second: true,
  },
  fxy: {
    sliderVar: "y",
    fixedVar: "x",
    tangentDir: "x",
    mixed: true,
    second: true,
  },
  fyx: {
    sliderVar: "x",
    fixedVar: "y",
    tangentDir: "y",
    mixed: true,
    second: true,
  },
};
const PILL_GROUPS = [
  {
    label: "First derivative",
    modes: ["fx", "fy"],
  },
  {
    label: "Pure second derivative",
    modes: ["fxx", "fyy"],
  },
  {
    label: "Mixed second derivative",
    modes: ["fxy", "fyx"],
  },
];
function ModeLabel({ m }) {
  const map = {
    fx: ["f", "x"],
    fy: ["f", "y"],
    fxx: ["f", "xx"],
    fyy: ["f", "yy"],
    fxy: ["f", "xy"],
    fyx: ["f", "yx"],
  };
  const [base, sub] = map[m];
  return (
    <React.Fragment>
      {base}
      <sub>{sub}</sub>
    </React.Fragment>
  );
}
function range(min, max, n) {
  const step = (max - min) / (n - 1);
  return Array.from(
    {
      length: n,
    },
    (_, i) => min + i * step,
  );
}
function toScene(x, y, z) {
  return new THREE.Vector3(x, z * Z_SCALE, -y);
}
// vary one axis over the domain while holding the other axis at a fixed value
function crossSection(varyAxis, holdVal, n) {
  return range(DOMAIN_MIN, DOMAIN_MAX, n).map((v) => {
    const x = varyAxis === "x" ? v : holdVal;
    const y = varyAxis === "x" ? holdVal : v;
    return toScene(x, y, f(x, y));
  });
}
function makeLabelSprite(text, color = "#6E6E86") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.font = "italic 40px -apple-system, sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 64, 32);
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.6, 0.3, 1);
  return sprite;
}
function makeDotSprite(fill, ring) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(32, 32, 22, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = ring;
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.14, 0.14, 1);
  return sprite;
}
function buildStripIndices(n) {
  const idx = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2,
      b = i * 2 + 1,
      c = i * 2 + 2,
      d = i * 2 + 3;
    idx.push(a, b, c, b, d, c);
  }
  return idx;
}
function makeRibbonMesh(n, color) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3),
  );
  geo.setIndex(buildStripIndices(n));
  const mat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}
const _dir = new THREE.Vector3();
const _view = new THREE.Vector3();
const _perp = new THREE.Vector3();
function updateRibbon(mesh, points, halfWidth, camera, refDist, patternFn) {
  const n = points.length;
  const posAttr = mesh.geometry.attributes.position;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    if (n === 1) _dir.set(1, 0, 0);
    else if (i === 0) _dir.subVectors(points[1], points[0]);
    else if (i === n - 1) _dir.subVectors(points[i], points[i - 1]);
    else _dir.subVectors(points[i + 1], points[i - 1]);
    _dir.normalize();
    _view.subVectors(camera.position, p).normalize();
    _perp.crossVectors(_dir, _view);
    if (_perp.lengthSq() < 1e-8) _perp.set(0, 1, 0);
    const distScale = camera.position.distanceTo(p) / refDist;
    const patternScale = patternFn ? patternFn(i) : 1;
    const w = halfWidth * distScale * patternScale;
    _perp.normalize().multiplyScalar(w);
    posAttr.setXYZ(i * 2, p.x + _perp.x, p.y + _perp.y, p.z + _perp.z);
    posAttr.setXYZ(i * 2 + 1, p.x - _perp.x, p.y - _perp.y, p.z - _perp.z);
  }
  posAttr.needsUpdate = true;
}
function makeArrowMesh(color) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(9), 3),
  );
  geo.setIndex([0, 1, 2]);
  const mat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}
function updateArrow(mesh, tip, dirUnit, camera, halfWidth, length, refDist) {
  const distScale = camera.position.distanceTo(tip) / refDist;
  const w = halfWidth * distScale;
  const len = length * distScale;
  _view.subVectors(camera.position, tip).normalize();
  _perp.crossVectors(dirUnit, _view);
  if (_perp.lengthSq() < 1e-8) _perp.set(0, 1, 0);
  _perp.normalize().multiplyScalar(w);
  const backX = tip.x - dirUnit.x * len;
  const backY = tip.y - dirUnit.y * len;
  const backZ = tip.z - dirUnit.z * len;
  const posAttr = mesh.geometry.attributes.position;
  posAttr.setXYZ(0, backX + _perp.x, backY + _perp.y, backZ + _perp.z);
  posAttr.setXYZ(1, backX - _perp.x, backY - _perp.y, backZ - _perp.z);
  posAttr.setXYZ(2, tip.x, tip.y, tip.z);
  posAttr.needsUpdate = true;
}
function PartialDerivativeMockup() {
  const mountRef = useRef(null);
  const meshesRef = useRef({});
  const refDistRef = useRef(1);
  const curveWorldRef = useRef({
    t1: new THREE.Vector3(),
    t2: new THREE.Vector3(),
    pt: new THREE.Vector3(),
    refCurve: [],
    liveCurve: [],
    pathCurve: [],
  });
  const axisWorldRef = useRef({
    x: null,
    y: null,
    z: null,
  });
  const modeRef = useRef("fx");
  const [mode, setMode] = useState("fx");
  const [xVal, setXVal] = useState(1);
  const [yVal, setYVal] = useState(1);
  const [xText, setXText] = useState("1");
  const [yText, setYText] = useState("1");
  const [curveAnchor, setCurveAnchor] = useState(1); // anchor value of the slider var, for the dim reference curve in mixed modes

  const getVal = (v) => (v === "x" ? xVal : yVal);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // reset the dim-reference curve's start position whenever we switch into a mixed mode
  useEffect(() => {
    if (MODES[mode].mixed) setCurveAnchor(getVal(MODES[mode].sliderVar));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ---- one-time scene setup ----
  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(6.2, 4.4, 6.2);
    camera.lookAt(0, 0.3, 0);
    refDistRef.current = camera.position.length();
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    mount.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(5, 9, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);
    const xs = range(DOMAIN_MIN, DOMAIN_MAX, SEG);
    const ys = range(DOMAIN_MIN, DOMAIN_MAX, SEG);
    const geometry = new THREE.PlaneGeometry(
      DOMAIN_MAX - DOMAIN_MIN,
      DOMAIN_MAX - DOMAIN_MIN,
      SEG - 1,
      SEG - 1,
    );
    const posAttr = geometry.attributes.position;
    const zVals = [];
    for (let j = 0; j < SEG; j++) {
      for (let i = 0; i < SEG; i++) {
        const idx = j * SEG + i;
        const zz = f(xs[i], ys[j]);
        const p = toScene(xs[i], ys[j], zz);
        posAttr.setXYZ(idx, p.x, p.y, p.z);
        zVals.push(zz);
      }
    }
    const zMin = Math.min(...zVals);
    const zMax = Math.max(...zVals);
    const colors = new Float32Array(posAttr.count * 3);
    for (let k = 0; k < posAttr.count; k++) {
      const t = (zVals[k] - zMin) / (zMax - zMin || 1);
      const c = SURF_LOW.clone().lerp(SURF_HIGH, t);
      colors[k * 3] = c.r;
      colors[k * 3 + 1] = c.g;
      colors[k * 3 + 2] = c.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.05,
      depthTest: true,
      depthWrite: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const wireGeo = new THREE.WireframeGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x3a3f7a,
      transparent: true,
      opacity: 0.18,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    scene.add(wireframe);
    const gridHelper = new THREE.GridHelper(
      DOMAIN_MAX - DOMAIN_MIN,
      6,
      0xc8cce8,
      0xe4e4f0,
    );
    const AXIS_BASE_Y_VALUE = -0.6 * Z_SCALE;
    gridHelper.position.y = AXIS_BASE_Y_VALUE;
    scene.add(gridHelper);
    const xLabel = makeLabelSprite("x");
    xLabel.position.set(DOMAIN_MAX + 1.1, AXIS_BASE_Y_VALUE, 0);
    scene.add(xLabel);
    const yLabel = makeLabelSprite("y");
    yLabel.position.set(0, AXIS_BASE_Y_VALUE, -(DOMAIN_MAX + 1.1));
    scene.add(yLabel);
    const zLabel = makeLabelSprite("z");
    zLabel.position.set(0, 2.35, 0);
    scene.add(zLabel);
    axisWorldRef.current = {
      x: [
        new THREE.Vector3(DOMAIN_MIN, AXIS_BASE_Y_VALUE, 0),
        new THREE.Vector3(DOMAIN_MAX + 0.75, AXIS_BASE_Y_VALUE, 0),
      ],
      y: [
        new THREE.Vector3(0, AXIS_BASE_Y_VALUE, -DOMAIN_MIN),
        new THREE.Vector3(0, AXIS_BASE_Y_VALUE, -(DOMAIN_MAX + 0.75)),
      ],
      z: [
        new THREE.Vector3(0, AXIS_BASE_Y_VALUE, 0),
        new THREE.Vector3(0, 2.05, 0),
      ],
    };
    const m = {};
    m.refCurve = makeRibbonMesh(60, DIM_CURVE);
    m.liveCurve = makeRibbonMesh(60, LIGHT_BLUE);
    m.pathCurve = makeRibbonMesh(PATH_CURVE_N, PATH_RED);
    m.tangent = makeRibbonMesh(2, INDIGO);
    m.xAxis = makeRibbonMesh(2, AXIS_COLOR);
    m.yAxis = makeRibbonMesh(2, AXIS_COLOR);
    m.zAxis = makeRibbonMesh(2, AXIS_COLOR);
    m.xArrow = makeArrowMesh(AXIS_COLOR);
    m.yArrow = makeArrowMesh(AXIS_COLOR);
    m.zArrow = makeArrowMesh(AXIS_COLOR);
    m.point = makeDotSprite(INDIGO_CSS, "#FFFFFF");
    Object.values(m).forEach((obj) => scene.add(obj));
    meshesRef.current = m;
    let raf;
    let isDragging = false;
    let lastX = 0,
      lastY = 0;
    let theta = Math.atan2(camera.position.x, camera.position.z);
    let phi = Math.acos(camera.position.y / camera.position.length());
    let radius = camera.position.length();
    const onPointerDown = (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerUp = () => {
      isDragging = false;
    };
    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      theta -= dx * 0.006;
      phi = Math.min(Math.max(phi - dy * 0.006, 0.25), Math.PI / 2.1);
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.lookAt(0, 0.3, 0);
    };
    const onWheel = (e) => {
      e.preventDefault();
      radius = Math.min(Math.max(radius + e.deltaY * 0.01, 4), 14);
      camera.position.setLength(radius);
      camera.lookAt(0, 0.3, 0);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("wheel", onWheel, {
      passive: false,
    });
    const _axisDir = new THREE.Vector3();
    const animate = () => {
      const { t1, t2, pt, refCurve, liveCurve, pathCurve } =
        curveWorldRef.current;
      const axes = axisWorldRef.current;
      const refDist = refDistRef.current;
      const mixed = MODES[modeRef.current].mixed;
      m.refCurve.visible = mixed;
      m.pathCurve.visible = mixed;
      if (refCurve.length)
        updateRibbon(m.refCurve, refCurve, 0.013, camera, refDist);
      if (liveCurve.length)
        updateRibbon(m.liveCurve, liveCurve, 0.0195, camera, refDist);
      if (pathCurve.length)
        updateRibbon(
          m.pathCurve,
          pathCurve,
          0.017,
          camera,
          refDist,
          dashPattern,
        );
      updateRibbon(m.tangent, [t1, t2], 0.02, camera, refDist);
      m.point.position.copy(pt);
      const ARROW_HALF = 0.05;
      const ARROW_LEN = 0.13;
      const drawAxis = (rodMesh, arrowMesh, pts) => {
        _axisDir.subVectors(pts[1], pts[0]).normalize();
        const tipDistScale = camera.position.distanceTo(pts[1]) / refDist;
        const scaledArrowLen = ARROW_LEN * tipDistScale;
        const rodEnd = pts[1]
          .clone()
          .addScaledVector(_axisDir, -scaledArrowLen);
        updateRibbon(rodMesh, [pts[0], rodEnd], 0.02, camera, refDist);
        updateArrow(
          arrowMesh,
          pts[1],
          _axisDir,
          camera,
          ARROW_HALF,
          ARROW_LEN,
          refDist,
        );
      };
      if (axes.x) drawAxis(m.xAxis, m.xArrow, axes.x);
      if (axes.y) drawAxis(m.yAxis, m.yArrow, axes.y);
      if (axes.z) drawAxis(m.zAxis, m.zArrow, axes.z);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("wheel", onWheel);
      mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      wireGeo.dispose();
      wireMat.dispose();
    };
  }, []);

  // ---- recompute curves / point / tangent whenever mode or values change ----
  useEffect(() => {
    const cfg = MODES[mode];
    const fixedValNow = getVal(cfg.fixedVar);
    const sliderValNow = getVal(cfg.sliderVar);
    let pathPts = [],
      refPts = [],
      livePts = [];
    if (cfg.mixed) {
      pathPts = crossSection(cfg.sliderVar, fixedValNow, PATH_CURVE_N);
      refPts = crossSection(cfg.fixedVar, curveAnchor, 60);
      livePts = crossSection(cfg.fixedVar, sliderValNow, 60);
    } else {
      livePts = crossSection(cfg.sliderVar, fixedValNow, 60);
    }
    const z0 = f(xVal, yVal);
    const delta = 1.1;
    let t1, t2;
    if (cfg.tangentDir === "x") {
      const slope = fx(xVal, yVal);
      t1 = toScene(xVal - delta, yVal, z0 - delta * slope);
      t2 = toScene(xVal + delta, yVal, z0 + delta * slope);
    } else {
      const slope = fy(xVal, yVal);
      t1 = toScene(xVal, yVal - delta, z0 - delta * slope);
      t2 = toScene(xVal, yVal + delta, z0 + delta * slope);
    }
    curveWorldRef.current = {
      t1,
      t2,
      pt: toScene(xVal, yVal, z0),
      refCurve: refPts,
      liveCurve: livePts,
      pathCurve: pathPts,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, xVal, yVal, curveAnchor]);
  const cfg = MODES[mode];
  const z0 = f(xVal, yVal);
  const fxVal = fx(xVal, yVal);
  const fyVal = fy(xVal, yVal);
  const secondVals = {
    fxx: fxx(xVal, yVal),
    fyy: fyy(xVal, yVal),
    fxy: fxy(xVal, yVal),
    fyx: fyx(xVal, yVal),
  };
  const badgeVal = cfg.second
    ? secondVals[mode]
    : mode === "fx"
      ? fxVal
      : fyVal;
  const rising = badgeVal >= 0;
  const accent = rising ? RISING : FALLING;
  const baseDeriv = cfg.tangentDir; // 'x' or 'y' -- which first derivative anchors the tangent line
  const baseVal = baseDeriv === "x" ? fxVal : fyVal;
  const baseLabelKey = baseDeriv === "x" ? "fx" : "fy";
  const fixedVarName = cfg.fixedVar;
  const sliderVarName = cfg.sliderVar;
  const fixedText = fixedVarName === "x" ? xText : yText;
  const setFixedText = fixedVarName === "x" ? setXText : setYText;
  const sliderValue = sliderVarName === "x" ? xVal : yVal;
  const setSliderValue = sliderVarName === "x" ? setXVal : setYVal;
  const commitFixed = () => {
    const v = parseFloat(fixedText);
    if (!Number.isNaN(v)) {
      const clamped = Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, v));
      if (fixedVarName === "x") {
        setXVal(clamped);
        setXText(String(clamped));
      } else {
        setYVal(clamped);
        setYText(String(clamped));
      }
      if (cfg.mixed) setCurveAnchor(getVal(cfg.sliderVar));
    } else {
      setFixedText(String(fixedVarName === "x" ? xVal : yVal));
    }
  };

  // static, per pill-group explanation (not mode-specific)
  const GROUP_HINTS = {
    "First derivative":
      "One variable is held fixed while the other drives the slider. The tangent line's slope along that curve is the first partial derivative.",
    "Pure second derivative":
      "Same fixed/slider setup as first partials — but now we track whether the tangent line's slope is increasing or decreasing as you slide. That's the curve's concavity.",
    "Mixed second derivative":
      "One variable is fixed, which traces a path (the dashed curve) for the point to follow. As it moves, we track how the tangent line's slope in the other direction changes.",
  };

  // dynamic hints, keyed by mode, attached to the fixed-value box, the slider, and the derivative readout
  const fixedHint = {
    fx: (
      <React.Fragment>
        Holding y constant turns the surface into a single curve in the
        x-direction — the one shown in blue.
      </React.Fragment>
    ),
    fy: (
      <React.Fragment>
        Holding x constant turns the surface into a single curve in the
        y-direction — the one shown in blue.
      </React.Fragment>
    ),
    fxx: (
      <React.Fragment>
        Holding y constant turns the surface into a single curve in the
        x-direction. We'll watch how its steepness changes as we slide along it.
      </React.Fragment>
    ),
    fyy: (
      <React.Fragment>
        Holding x constant turns the surface into a single curve in the
        y-direction. We'll watch how its steepness changes as we slide along it.
      </React.Fragment>
    ),
    fxy: (
      <React.Fragment>
        The blue curve and its f<sub>x</sub> tangent line here are the same
        picture you saw in f<sub>xx</sub> — an x-direction curve at a fixed y.
        What's fixed in the box above, though, is x: that sets the dashed red
        path, the exact route the point follows as the slider (y) moves and
        slides that whole blue curve to new y-values.
      </React.Fragment>
    ),
    fyx: (
      <React.Fragment>
        The blue curve and its f<sub>y</sub> tangent line here are the same
        picture you saw in f<sub>yy</sub> — a y-direction curve at a fixed x.
        What's fixed in the box above, though, is y: that sets the dashed red
        path, the exact route the point follows as the slider (x) moves and
        slides that whole blue curve to new x-values.
      </React.Fragment>
    ),
  }[mode];
  const sliderHint = {
    fx: (
      <React.Fragment>
        Dragging slides the point along the blue curve. The tangent line always
        points in the x-direction, and its slope is f<sub>x</sub>.
      </React.Fragment>
    ),
    fy: (
      <React.Fragment>
        Dragging slides the point along the blue curve. The tangent line always
        points in the y-direction, and its slope is f<sub>y</sub>.
      </React.Fragment>
    ),
    fxx: (
      <React.Fragment>
        Dragging slides the point along the curve. Watch the tangent line's
        slope (f<sub>x</sub>) — rising means concave up, falling means concave
        down.
      </React.Fragment>
    ),
    fyy: (
      <React.Fragment>
        Dragging slides the point along the curve. Watch the tangent line's
        slope (f<sub>y</sub>) — rising means concave up, falling means concave
        down.
      </React.Fragment>
    ),
    fxy: (
      <React.Fragment>
        Dragging moves y and slides the point along the dashed path. The solid
        blue curve, the tangent line's slope f<sub>x</sub>, and f<sub>xy</sub>{" "}
        itself all update live to match.
      </React.Fragment>
    ),
    fyx: (
      <React.Fragment>
        Dragging moves x and slides the point along the dashed path. The solid
        blue curve, the tangent line's slope f<sub>y</sub>, and f<sub>yx</sub>{" "}
        itself all update live to match.
      </React.Fragment>
    ),
  }[mode];
  const badgeHint = {
    fx: (
      <React.Fragment>
        Positive means the surface is rising as x increases here; negative means
        it's falling.
      </React.Fragment>
    ),
    fy: (
      <React.Fragment>
        Positive means the surface is rising as y increases here; negative means
        it's falling.
      </React.Fragment>
    ),
    fxx: (
      <React.Fragment>
        Positive means the tangent slope is increasing as x increases — concave
        up. Negative means concave down.
      </React.Fragment>
    ),
    fyy: (
      <React.Fragment>
        Positive means the tangent slope is increasing as y increases — concave
        up. Negative means concave down.
      </React.Fragment>
    ),
    fxy: (
      <React.Fragment>
        f<sub>xy</sub> positive means f<sub>x</sub> is increasing as y
        increases; negative means f<sub>x</sub> is decreasing as y increases.
      </React.Fragment>
    ),
    fyx: (
      <React.Fragment>
        f<sub>yx</sub> positive means f<sub>y</sub> is increasing as x
        increases; negative means f<sub>y</sub> is decreasing as x increases.
      </React.Fragment>
    ),
  }[mode];

  // fuller, full-width recap combining the fixed/slider/badge hint content into one paragraph per mode
  const summary = {
    fx: (
      <React.Fragment>
        Here, y is held fixed while x drives the slider, tracing out a single
        curve on the surface — the one shown in blue. As you drag the slider,
        the point slides along that curve, and the tangent line, which always
        points in the x-direction, shows the surface's slope at that point. The
        readout above turns{" "}
        <span
          style={{
            color: RISING,
            fontWeight: 600,
          }}
        >
          positive
        </span>{" "}
        when the surface is rising as x increases, and{" "}
        <span
          style={{
            color: FALLING,
            fontWeight: 600,
          }}
        >
          negative
        </span>{" "}
        when it's falling.
      </React.Fragment>
    ),
    fy: (
      <React.Fragment>
        Here, x is held fixed while y drives the slider, tracing out a single
        curve on the surface — the one shown in blue. As you drag the slider,
        the point slides along that curve, and the tangent line, which always
        points in the y-direction, shows the surface's slope at that point. The
        readout above turns{" "}
        <span
          style={{
            color: RISING,
            fontWeight: 600,
          }}
        >
          positive
        </span>{" "}
        when the surface is rising as y increases, and{" "}
        <span
          style={{
            color: FALLING,
            fontWeight: 600,
          }}
        >
          negative
        </span>{" "}
        when it's falling.
      </React.Fragment>
    ),
    fxx: (
      <React.Fragment>
        Here, y is held fixed while x drives the slider, tracing out the same
        kind of single blue curve as in f<sub>x</sub>. This time, though, we're
        not just watching the tangent line's slope at one point — we're watching
        how that slope changes as you slide along the curve. If the slope keeps{" "}
        <span
          style={{
            color: RISING,
            fontWeight: 600,
          }}
        >
          increasing
        </span>
        , the curve is concave up; if it keeps{" "}
        <span
          style={{
            color: FALLING,
            fontWeight: 600,
          }}
        >
          decreasing
        </span>
        , it's concave down. That rate of change in the slope is f<sub>xx</sub>.
      </React.Fragment>
    ),
    fyy: (
      <React.Fragment>
        Here, x is held fixed while y drives the slider, tracing out the same
        kind of single blue curve as in f<sub>y</sub>. This time, though, we're
        not just watching the tangent line's slope at one point — we're watching
        how that slope changes as you slide along the curve. If the slope keeps{" "}
        <span
          style={{
            color: RISING,
            fontWeight: 600,
          }}
        >
          increasing
        </span>
        , the curve is concave up; if it keeps{" "}
        <span
          style={{
            color: FALLING,
            fontWeight: 600,
          }}
        >
          decreasing
        </span>
        , it's concave down. That rate of change in the slope is f<sub>yy</sub>.
      </React.Fragment>
    ),
    fxy: (
      <React.Fragment>
        Here, x is held fixed, which sets the dashed red path — the exact route
        the point follows as the slider (y) moves. As the point slides along
        that path, a second curve (solid blue, with a dim reference curve
        marking where it started) tracks the surface's cross-section in the
        x-direction at the current y-value. The tangent line always points in
        the x-direction, with slope f<sub>x</sub>. Watch whether that slope{" "}
        <span
          style={{
            color: RISING,
            fontWeight: 600,
          }}
        >
          increases
        </span>{" "}
        or{" "}
        <span
          style={{
            color: FALLING,
            fontWeight: 600,
          }}
        >
          decreases
        </span>{" "}
        as y increases — that rate is f<sub>xy</sub>, a way of asking how the
        x-direction slope itself changes as you move in the y-direction.
      </React.Fragment>
    ),
    fyx: (
      <React.Fragment>
        Here, y is held fixed, which sets the dashed red path — the exact route
        the point follows as the slider (x) moves. As the point slides along
        that path, a second curve (solid blue, with a dim reference curve
        marking where it started) tracks the surface's cross-section in the
        y-direction at the current x-value. The tangent line always points in
        the y-direction, with slope f<sub>y</sub>. Watch whether that slope{" "}
        <span
          style={{
            color: RISING,
            fontWeight: 600,
          }}
        >
          increases
        </span>{" "}
        or{" "}
        <span
          style={{
            color: FALLING,
            fontWeight: 600,
          }}
        >
          decreases
        </span>{" "}
        as x increases — that rate is f<sub>yx</sub>, a way of asking how the
        y-direction slope itself changes as you move in the x-direction.
      </React.Fragment>
    ),
  }[mode];
  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
        background: "#F5F5FA",
        minHeight: "100vh",
        padding: 24,
        color: TEXT,
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        <Banner />
        <div
          style={{
            display: "flex",
            gap: 20,
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 620px",
              background: "#FFFFFF",
              borderRadius: 20,
              boxShadow: "0 1px 3px rgba(60,60,90,0.08)",
              padding: 12,
              height: 544,
              boxSizing: "border-box",
            }}
          >
            <div
              ref={mountRef}
              style={{
                width: "100%",
                height: 520,
                borderRadius: 12,
                overflow: "hidden",
                cursor: "grab",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                zIndex: 5,
                width: 230,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "radial-gradient(ellipse at center, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 100%)",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontFamily: "Cambria, Georgia, 'Times New Roman', serif",
                  fontSize: 15,
                  color: TEXT,
                }}
              >
                <em>f</em>(<em>x</em>, <em>y</em>) = 0.2 · sin(<em>x</em>) ·
                cos(<em>y</em>)
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 5,
                width: 200,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "radial-gradient(ellipse at center, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 100%)",
                fontSize: 11.5,
                color: MUTED_TEXT,
                pointerEvents: "none",
              }}
            >
              drag to orbit · scroll to zoom
            </div>
          </div>
          <div
            style={{
              flex: "0 0 280px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 20,
                boxShadow: "0 1px 3px rgba(60,60,90,0.06)",
                padding: 12,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#8A8AA3",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Derivative mode
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {PILL_GROUPS.map((g) => (
                  <div key={g.label}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: 11,
                        color: "#8A8AA3",
                        textTransform: "uppercase",
                        marginBottom: 3,
                        letterSpacing: 0.4,
                      }}
                    >
                      {g.label}
                      <InfoTip text={GROUP_HINTS[g.label]} />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      {g.modes.map((m) => (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            borderRadius: 20,
                            border:
                              mode === m
                                ? `1px solid ${INDIGO_CSS}`
                                : `1px solid ${BORDER}`,
                            background: mode === m ? "#EBEEFB" : "#FFFFFF",
                            color: mode === m ? INDIGO_CSS : MUTED_TEXT,
                            fontWeight: mode === m ? 700 : 500,
                            fontSize: 14,
                            cursor: "pointer",
                          }}
                        >
                          <ModeLabel m={m} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  height: 1,
                  background: BORDER,
                  margin: "10px 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 11,
                  color: "#8A8AA3",
                  marginBottom: 4,
                }}
              >
                Fixed value
                <InfoTip text={fixedHint} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "stretch",
                }}
              >
                <div
                  style={{
                    background: "#F5F5FA",
                    border: `1px solid ${BORDER}`,
                    borderRight: "none",
                    borderRadius: "20px 0 0 20px",
                    padding: "7px 12px",
                    fontSize: 14,
                    color: MUTED_TEXT,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {fixedVarName} =
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fixedText}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (/^-?\d*\.?\d*$/.test(raw)) {
                      setFixedText(raw);
                      const v = parseFloat(raw);
                      if (
                        !Number.isNaN(v) &&
                        v >= DOMAIN_MIN &&
                        v <= DOMAIN_MAX
                      ) {
                        if (fixedVarName === "x") setXVal(v);
                        else setYVal(v);
                      }
                    }
                  }}
                  onBlur={commitFixed}
                  style={{
                    flex: 1,
                    border: `1px solid ${BORDER}`,
                    borderRadius: "0 20px 20px 0",
                    padding: "7px 12px",
                    fontSize: 14,
                    outline: "none",
                    color: TEXT,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </div>
              <div
                style={{
                  height: 1,
                  background: BORDER,
                  margin: "10px 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 11,
                  color: "#8A8AA3",
                  marginBottom: 4,
                }}
              >
                Slider
                <InfoTip text={sliderHint} />
              </div>
              <div
                style={{
                  position: "relative",
                  paddingTop: 24,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: `${((sliderValue - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN)) * 100}%`,
                    transform: "translateX(-50%)",
                    background: INDIGO_CSS,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    padding: "3px 9px",
                    borderRadius: 12,
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 6px rgba(59,79,194,0.35)",
                    pointerEvents: "none",
                  }}
                >
                  {sliderVarName} = {sliderValue.toFixed(2)}
                  <div
                    style={{
                      position: "absolute",
                      bottom: -4,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 0,
                      height: 0,
                      borderLeft: "4px solid transparent",
                      borderRight: "4px solid transparent",
                      borderTop: `4px solid ${INDIGO_CSS}`,
                    }}
                  />
                </div>
                <input
                  type="range"
                  min={DOMAIN_MIN}
                  max={DOMAIN_MAX}
                  step={0.02}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                  style={{
                    width: "100%",
                    accentColor: "#3B4FC2",
                    display: "block",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 20,
                boxShadow: "0 1px 3px rgba(60,60,90,0.06)",
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                }}
              >
                <Readout label="x" value={xVal.toFixed(2)} />
                <Readout label="y" value={yVal.toFixed(2)} />
                <Readout label="z" value={z0.toFixed(3)} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 11,
                  color: "#8A8AA3",
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: `1px solid ${BORDER}`,
                }}
              >
                What the sign means
                <InfoTip text={badgeHint} />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: cfg.second ? "1fr 1fr" : "1fr",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                {cfg.second && (
                  <Readout
                    label={<ModeLabel m={baseLabelKey} />}
                    value={baseVal.toFixed(3)}
                    accent={INDIGO_CSS}
                  />
                )}
                <Readout
                  label={<ModeLabel m={mode} />}
                  value={badgeVal.toFixed(3)}
                  accent={accent}
                  badge={rising ? "+" : "–"}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            boxShadow: "0 1px 3px rgba(60,60,90,0.06)",
            padding: "16px 20px",
            marginTop: 14,
            fontSize: 13.5,
            lineHeight: 1.55,
            color: MUTED_TEXT,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#8A8AA3",
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 6,
            }}
          >
            Summary —{" "}
            <span
              style={{
                textTransform: "none",
              }}
            >
              <ModeLabel m={mode} />
            </span>
          </div>
          {summary}
        </div>
      </div>
    </div>
  );
}
function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        marginLeft: 5,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          width: 15,
          height: 15,
          borderRadius: "50%",
          border: `1px solid ${BORDER}`,
          background: "#F5F5FA",
          color: MUTED_TEXT,
          fontSize: 9.5,
          fontWeight: 700,
          fontStyle: "italic",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
        aria-label="More info"
      >
        i
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 30,
            top: 20,
            left: 0,
            width: 210,
            background: "#2E2E3D",
            color: "#F5F5FA",
            fontSize: 11.5,
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: "normal",
            lineHeight: 1.42,
            padding: "9px 11px",
            borderRadius: 10,
            boxShadow: "0 6px 16px rgba(30,30,45,0.28)",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
function Banner() {
  return (
    <div
      style={{
        background: "linear-gradient(120deg, #4655D4 0%, #303C99 100%)",
        borderRadius: 22,
        padding: "16px 22px",
        marginBottom: 14,
        boxShadow: "0 4px 14px rgba(48,60,153,0.25)",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.72)",
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 3,
        }}
      >
        Calculus III · Unit 2
      </div>
      <div
        style={{
          color: "#FFFFFF",
          fontSize: 21,
          fontWeight: 700,
        }}
      >
        First & Second Partial Derivatives
      </div>
    </div>
  );
}
function Readout({ label, value, accent, badge }) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          color: "#8A8AA3",
          marginBottom: 2,
          fontStyle: "italic",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: accent || TEXT,
          fontVariantNumeric: "tabular-nums",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {value}
        {badge && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              background: accent,
              color: "#fff",
              borderRadius: 10,
              padding: "1px 7px",
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
const rootEl = document.getElementById("root");
ReactDOM.createRoot(rootEl).render(<PartialDerivativeMockup />);
