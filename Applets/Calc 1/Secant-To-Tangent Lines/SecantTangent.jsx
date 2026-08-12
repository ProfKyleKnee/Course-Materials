import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// COLORS (Cloud Pastel)
// ============================================================================
const COLORS = {
  accent: '#3B4FC2',
  accent2: '#6478D6',
  secant: '#C1556B',
  amber: '#C98F3E',
  green: '#3FA671',
  bg: '#F5F5FA',
  card: '#FFFFFF',
  text: '#3A3A3C',
  muted: '#6E6E86',
  eyebrow: '#8A8AA3',
  border: '#DCDCF0',
  warning: '#C77B94',
};

const BASE_W = 800;
const BASE_H = 420;

// ============================================================================
// EXPRESSION PARSER (mathjs substitute — no network access to install mathjs)
// ============================================================================
function safePow(base, exp) {
  if (base >= 0) return Math.pow(base, exp);
  if (Number.isInteger(exp)) return Math.pow(base, exp);
  // Negative base, non-integer exponent: Math.pow always returns NaN here,
  // but real odd roots (e.g. cube root of a negative number) are legitimate
  // real numbers. Find the smallest p/q (q <= 12) matching this exponent —
  // covers virtually any exponent a student would actually type (1/3, 2/3,
  // 1/5, 3/5, etc.) — and use the real-valued odd root when q is odd.
  const MAX_DENOM = 12;
  for (let q = 2; q <= MAX_DENOM; q++) {
    const p = Math.round(exp * q);
    if (Math.abs(exp - p / q) < 1e-9) {
      if (q % 2 === 1) {
        const sign = (p % 2 === 0) ? 1 : -1;
        return sign * Math.pow(-base, exp);
      }
      return NaN; // even root of a negative number — genuinely not real
    }
  }
  return NaN; // exponent doesn't match any small rational — leave undefined
}

function compileExpression(exprStr) {
  const src = exprStr.replace(/\s+/g, '');
  if (!src) throw new Error('empty expression');
  let pos = 0;
  const peek = () => src[pos];
  const eat = (ch) => { if (src[pos] !== ch) throw new Error(`Expected '${ch}'`); pos++; };

  function parseExpr() {
    let node = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = src[pos]; pos++;
      const rhs = parseTerm();
      const prev = node;
      node = (x) => op === '+' ? prev(x) + rhs(x) : prev(x) - rhs(x);
    }
    return node;
  }
  function parseTerm() {
    let node = parseUnary();
    while (peek() === '*' || peek() === '/' || (peek() && /[a-zA-Z0-9(]/.test(peek()))) {
      let op = '*';
      if (peek() === '*' || peek() === '/') { op = src[pos]; pos++; }
      const rhs = parseUnary();
      const prev = node;
      node = (x) => op === '*' ? prev(x) * rhs(x) : prev(x) / rhs(x);
    }
    return node;
  }
  function parseUnary() {
    if (peek() === '-') { pos++; const inner = parseUnary(); return (x) => -inner(x); }
    if (peek() === '+') { pos++; return parseUnary(); }
    return parsePower();
  }
  function parsePower() {
    const base = parseAtom();
    if (peek() === '^') { pos++; const exp = parseUnary(); return (x) => safePow(base(x), exp(x)); }
    return base;
  }
  const FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    exp: Math.exp, ln: Math.log, log: Math.log10, sqrt: Math.sqrt, abs: Math.abs,
    atan: Math.atan, arctan: Math.atan,
    asin: Math.asin, arcsin: Math.asin,
    acos: Math.acos, arccos: Math.acos,
  };
  function parseAtom() {
    if (peek() === '(') { pos++; const node = parseExpr(); eat(')'); return node; }
    if (/[0-9.]/.test(peek())) {
      let start = pos;
      while (pos < src.length && /[0-9.]/.test(src[pos])) pos++;
      const val = parseFloat(src.slice(start, pos));
      return () => val;
    }
    if (/[a-zA-Z]/.test(peek())) {
      let start = pos;
      while (pos < src.length && /[a-zA-Z]/.test(src[pos])) pos++;
      const name = src.slice(start, pos);
      if (FUNCS[name]) { eat('('); const arg = parseExpr(); eat(')'); const f = FUNCS[name]; return (x) => f(arg(x)); }
      if (name === 'x') return (x) => x;
      if (name === 'e') return () => Math.E;
      if (name === 'pi') return () => Math.PI;
      throw new Error(`Unknown identifier "${name}"`);
    }
    throw new Error(`Unexpected character`);
  }
  const node = parseExpr();
  if (pos !== src.length) throw new Error('Unexpected trailing input');
  return (x) => node(x);
}

// ============================================================================
// PRESET FUNCTIONS
// ============================================================================
const PRESETS = {
  'x^2':   { label: 'x²',    expr: 'x^2',   fn: x => x * x,       domain: () => true },
  'x^3':   { label: 'x³',    expr: 'x^3',   fn: x => x * x * x,   domain: () => true },
  'sinx':  { label: 'sin x', expr: 'sin(x)',fn: x => Math.sin(x), domain: () => true },
  'ex':    { label: 'eˣ',    expr: 'e^x',   fn: x => Math.exp(x), domain: () => true },
  'lnx':   { label: 'ln x',  expr: 'ln(x)', fn: x => Math.log(x), domain: x => x > 0 },
  'sqrtx': { label: '√x',    expr: 'sqrt(x)', fn: x => Math.sqrt(x), domain: x => x >= 0 },
};
const PRESET_ORDER = ['x^2', 'x^3', 'sinx', 'ex', 'lnx', 'sqrtx'];

// ============================================================================
// MATH HELPERS
// ============================================================================
const H_EPSILON = 1e-9;
function differenceQuotient(fn, a, h) {
  const safeH = Math.abs(h) < H_EPSILON ? (h < 0 ? -H_EPSILON : H_EPSILON) : h;
  return (fn(a + safeH) - fn(a)) / safeH;
}
function numericalDerivative(fn, a, eps = 1e-6) {
  return (fn(a + eps) - fn(a - eps)) / (2 * eps);
}
function clampAToDomain(domain, a) {
  if (domain(a)) return a;
  if (domain(0.01)) return 0.01;
  if (domain(0)) return 0;
  return a;
}
function clampHToDomain(domain, a, h) {
  if (domain(a + h)) return h;
  let lo = 0, hi = h;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (domain(a + mid)) lo = mid; else hi = mid;
  }
  return lo;
}
function displayNum(v, decimals = 3) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(decimals);
}

const TABLE_MAGNITUDES = [3, 2, 1, 0.5, 0.25, 0.1, 0.05, 0.01, 0.001];
function buildTable(domain, a, currentH, fn) {
  const sign = currentH < 0 ? -1 : 1;
  return TABLE_MAGNITUDES.map((mag, i) => {
    let h = clampHToDomain(domain, a, sign * mag);
    return { h, xVal: a + h, dq: differenceQuotient(fn, a, h), isLast: i === TABLE_MAGNITUDES.length - 1, key: i };
  });
}

// ============================================================================
// SMALL UI PRIMITIVES
// ============================================================================
function Frac({ num, den, color }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', margin: '0 4px', fontStyle: 'italic', color }}>
      <span style={{ padding: '0 4px', lineHeight: 1.3, borderBottom: '1.5px solid currentColor' }}>{num}</span>
      <span style={{ padding: '0 4px', lineHeight: 1.3 }}>{den}</span>
    </span>
  );
}
function LimStack({ sub }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', margin: '0 3px', lineHeight: 1.1 }}>
      <span style={{ fontStyle: 'italic' }}>lim</span>
      <span style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic' }}>{sub}</span>
    </span>
  );
}

export default function SecantTangent() {
  // ---- function state ----
  const [functionKey, setFunctionKey] = useState('x^2');
  const [customExpr, setCustomExpr] = useState('');
  const [customExprText, setCustomExprText] = useState('');
  const [customError, setCustomError] = useState(null);
  const [fnInputText, setFnInputText] = useState('x^2');

  // ---- point state ----
  const [aVal, setAVal] = useState(1);
  const [aText, setAText] = useState('1.00');
  const [hVal, setHVal] = useState(0.842);
  const [hText, setHText] = useState('0.842');
  const [aWarning, setAWarning] = useState(null);

  // ---- notation / toggles ----
  const [notation, setNotation] = useState('ah'); // 'ah' | 'xa'
  const [showRiseRun, setShowRiseRun] = useState(false);
  const [showTangent, setShowTangent] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [derivOpen, setDerivOpen] = useState(false);

  // ---- camera ----
  const [camera, setCamera] = useState({ cx: 1.4, cy: 1.7, scale: 90 });

  // ---- drag / play ----
  const [dragging, setDragging] = useState(false);
  const [panning, setPanning] = useState(false);
  const panStartRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [echoes, setEchoes] = useState([]);
  const [manualTrailOn, setManualTrailOn] = useState(false);
  const lastEchoPushRef = useRef(0);
  const svgOuterRef = useRef(null);
  const playAnimRef = useRef(null);
  const playStartHRef = useRef(hVal);

  const activeFn = useMemo(() => {
    if (functionKey === 'custom') {
      try {
        const fn = compileExpression(customExpr || '0');
        setCustomError(null);
        return { fn, domain: () => true, label: customExpr || '(empty)' };
      } catch (e) {
        setCustomError(e.message);
        return { fn: x => x, domain: () => true, label: 'x' };
      }
    }
    return PRESETS[functionKey];
  }, [functionKey, customExpr]);

  const fa = activeFn.fn(aVal);
  const fah = activeFn.fn(aVal + hVal);
  const dq = differenceQuotient(activeFn.fn, aVal, hVal);
  const fprime = numericalDerivative(activeFn.fn, aVal);
  const xVal = aVal + hVal;

  // ---- coordinate transforms ----
  const worldToPx = useCallback((x, y) => ({
    sx: BASE_W / 2 + (x - camera.cx) * camera.scale,
    sy: BASE_H / 2 - (y - camera.cy) * camera.scale,
  }), [camera]);

  const pxToWorldX = useCallback((clientX) => {
    const rect = svgOuterRef.current.getBoundingClientRect();
    const localX = ((clientX - rect.left) / rect.width) * BASE_W;
    return camera.cx + (localX - BASE_W / 2) / camera.scale;
  }, [camera]);

  // Camera-parameterized variants (don't close over live state) — used for
  // panning, where we always measure against the camera captured at the
  // start of the drag to avoid compounding error frame-to-frame.
  const pxToWorldXWith = useCallback((clientX, cam) => {
    const rect = svgOuterRef.current.getBoundingClientRect();
    const localX = ((clientX - rect.left) / rect.width) * BASE_W;
    return cam.cx + (localX - BASE_W / 2) / cam.scale;
  }, []);
  const pxToWorldYWith = useCallback((clientY, cam) => {
    const rect = svgOuterRef.current.getBoundingClientRect();
    const localY = ((clientY - rect.top) / rect.height) * BASE_H;
    return cam.cy + (BASE_H / 2 - localY) / cam.scale;
  }, []);

  const visibleXRange = [camera.cx - (BASE_W / 2) / camera.scale, camera.cx + (BASE_W / 2) / camera.scale];
  const visibleYRange = [camera.cy - (BASE_H / 2) / camera.scale, camera.cy + (BASE_H / 2) / camera.scale];

  // ---- curve path ----
  const curvePath = useMemo(() => {
    const [xMin, xMax] = visibleXRange;
    const N = 200;
    let d = '';
    let penDown = false;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (xMax - xMin) * (i / N);
      if (!activeFn.domain(x)) { penDown = false; continue; }
      let y;
      try { y = activeFn.fn(x); } catch (e) { penDown = false; continue; }
      if (!Number.isFinite(y)) { penDown = false; continue; }
      const { sx, sy } = worldToPx(x, y);
      if (sy < -800 || sy > BASE_H + 800) { penDown = false; continue; }
      d += (penDown ? ' L ' : ' M ') + sx.toFixed(2) + ' ' + sy.toFixed(2);
      penDown = true;
    }
    return d;
  }, [activeFn, camera, worldToPx]);

  function lineToEdges(pointX, pointY, slope) {
    const [xMin, xMax] = visibleXRange;
    const marginX = (xMax - xMin) * 0.15;
    const x1 = xMin - marginX, x2 = xMax + marginX;
    const y1 = pointY + slope * (x1 - pointX);
    const y2 = pointY + slope * (x2 - pointX);
    const p1 = worldToPx(x1, y1);
    const p2 = worldToPx(x2, y2);
    return { x1: p1.sx, y1: p1.sy, x2: p2.sx, y2: p2.sy };
  }

  const secantLine = lineToEdges(aVal, fa, dq);
  const tangentLine = showTangent ? lineToEdges(aVal, fa, fprime) : null;

  // ---- pixel positions ----
  const pA = worldToPx(aVal, fa);
  const pAH = worldToPx(xVal, fah);
  const pCorner = worldToPx(aVal, fah); // right-angle corner at (a, f(a+h))

  const legHpx = Math.abs(pAH.sx - pCorner.sx);
  const legVpx = Math.abs(pCorner.sy - pA.sy);
  const hypotPx = Math.hypot(legHpx, legVpx);
  const riseRunVisible = showRiseRun && hypotPx >= 20;

  // ---- autofit ----
  const autofit = useCallback(() => {
    const xLo = Math.min(aVal, xVal);
    const xHi = Math.max(aVal, xVal);
    const spanX = Math.max(xHi - xLo, 0.5);
    const padX = spanX * 0.6;
    const xMin = xLo - padX, xMax = xHi + padX;
    let yMin = Infinity, yMax = -Infinity;
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (xMax - xMin) * (i / N);
      if (!activeFn.domain(x)) continue;
      let y;
      try { y = activeFn.fn(x); } catch (e) { continue; }
      if (!Number.isFinite(y)) continue;
      yMin = Math.min(yMin, y); yMax = Math.max(yMax, y);
    }
    if (!Number.isFinite(yMin)) { yMin = fa - 2; yMax = fa + 2; }
    const spanY = Math.max(yMax - yMin, 0.5);
    const padY = spanY * 0.35;
    yMin -= padY; yMax += padY;
    const scaleX = BASE_W / (xMax - xMin);
    const scaleY = BASE_H / (yMax - yMin);
    const scale = Math.min(scaleX, scaleY) * 0.9;
    setCamera({ cx: (xMin + xMax) / 2, cy: (yMin + yMax) / 2, scale });
  }, [aVal, xVal, activeFn, fa]);

  useEffect(() => { autofit(); /* eslint-disable-next-line */ }, [functionKey, customExpr]);

  // NOTE: autofit is now a purely manual action (button press only). Earlier
  // versions re-autofit automatically whenever a point drifted near the edge
  // of the view — including mid-drag — which could compound: a drag-triggered
  // autofit changes the pixel<->math conversion while the pointer is still
  // moving, which can push the computed h further off-screen, triggering
  // another autofit, and so on. That's what produced runaway h values.

  // ---- a / h setters with domain clamping ----
  function commitA(rawA) {
    let a = Math.max(-10, Math.min(10, rawA));
    a = clampAToDomain(activeFn.domain, a);
    if (!Number.isFinite(a)) a = 0;
    let h = clampHToDomain(activeFn.domain, a, hVal);
    setAVal(a); setHVal(h);
    setAText(displayNum(a, 2));
    setHText(displayNum(h, 3));
  }
  function commitH(rawH) {
    const h = clampHToDomain(activeFn.domain, aVal, rawH);
    setHVal(h);
    setHText(displayNum(h, 3));
  }

  // Pushes the current secant position into the trail when the manual
  // "Show Secant Lines" toggle is on. Play manages its own trail separately
  // and takes priority (never double-pushes while animating).
  function pushManualEchoIfNeeded(h) {
    if (!manualTrailOn || playing) return;
    const now = performance.now();
    if (now - lastEchoPushRef.current < 120) return;
    lastEchoPushRef.current = now;
    setEchoes(prev => [...prev, { h, id: Math.random() }].slice(-5));
  }

  // ---- drag handling for the a+h / x point ----
  useEffect(() => {
    if (!dragging) return;
    function onMove(e) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let worldX = pxToWorldX(clientX);
      // Clamp to the visible x-range (with a small inset) so dragging the
      // pointer past the edge of the graph box can't pull x beyond what's
      // actually drawn on screen.
      const [xMin, xMax] = visibleXRange;
      const inset = (xMax - xMin) * 0.02;
      worldX = Math.max(xMin + inset, Math.min(xMax - inset, worldX));
      const rawH = worldX - aVal;
      commitH(rawH);
      pushManualEchoIfNeeded(clampHToDomain(activeFn.domain, aVal, rawH));
    }
    function onUp() { setDragging(false); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line
  }, [dragging, aVal, camera]);

  // ---- background panning (click-and-drag the graph itself, like the Taylor's Theorem applet) ----
  function onBackgroundPointerDown(e) {
    if (dragging) return; // the point handle's own onPointerDown takes priority (it stops propagation)
    stopPlay();
    panStartRef.current = { clientX: e.clientX, clientY: e.clientY, camera };
    setPanning(true);
  }
  useEffect(() => {
    if (!panning) return;
    function onMove(e) {
      const { clientX: x0, clientY: y0, camera: camStart } = panStartRef.current;
      const wx0 = pxToWorldXWith(x0, camStart);
      const wxNow = pxToWorldXWith(e.clientX, camStart);
      const wy0 = pxToWorldYWith(y0, camStart);
      const wyNow = pxToWorldYWith(e.clientY, camStart);
      setCamera({ cx: camStart.cx - (wxNow - wx0), cy: camStart.cy - (wyNow - wy0), scale: camStart.scale });
    }
    function onUp() { setPanning(false); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line
  }, [panning]);

  // ---- scroll-wheel zoom, centered on the cursor ----
  useEffect(() => {
    const el = svgOuterRef.current;
    if (!el) return;
    function onWheel(e) {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const localX = ((e.clientX - rect.left) / rect.width) * BASE_W;
      const localY = ((e.clientY - rect.top) / rect.height) * BASE_H;
      setCamera(cam => {
        const worldX = cam.cx + (localX - BASE_W / 2) / cam.scale;
        const worldY = cam.cy + (BASE_H / 2 - localY) / cam.scale;
        const factor = Math.exp(-e.deltaY * 0.0015);
        const newScale = Math.max(5, Math.min(4000, cam.scale * factor));
        return {
          cx: worldX - (localX - BASE_W / 2) / newScale,
          cy: worldY - (BASE_H / 2 - localY) / newScale,
          scale: newScale,
        };
      });
    }
    // Passive:false is required so preventDefault() actually stops the page
    // from scrolling while the cursor is over the graph — React's own
    // onWheel prop attaches listeners as passive by default, which would
    // silently ignore preventDefault().
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  function stopPlay() {
    setPlaying(false);
    if (playAnimRef.current) { cancelAnimationFrame(playAnimRef.current.raf); playAnimRef.current = null; }
  }

  function startPlay() {
    const MAG_END = 0.001;
    const sign = hVal < 0 ? -1 : 1; // preserves current side; sign(0) treated as positive
    const magStart = Math.max(Math.abs(hVal), MAG_END);
    // Resuming from a paused, near-zero h is valid — just plays out the tiny
    // remainder rather than refusing (this is what caused the "stuck" bug).
    playStartHRef.current = sign * magStart;
    setEchoes([]);
    setPlaying(true);
    setManualTrailOn(true); // Play always leaves a trail, so the toggle should read "Clear Secant Lines" once it starts
    const SWEEP_MS = 6000;
    const PAUSE_MS = 500;
    // Mostly-linear pacing: constant speed for the first TAIL_START of the
    // time, then a gentle ease-out over the remaining time so the final
    // approach to h=0 is still visually legible instead of a blur.
    const TAIL_START = 0.8;   // fraction of *time* where the slowdown begins
    const TAIL_DIST = 0.25;   // fraction of *distance* covered during that slowdown
    function easeProgress(t) {
      if (t <= TAIL_START) return (t / TAIL_START) * (1 - TAIL_DIST);
      const s = (t - TAIL_START) / (1 - TAIL_START);
      const eased = 1 - Math.pow(1 - s, 2);
      return (1 - TAIL_DIST) + TAIL_DIST * eased;
    }
    let phase = 'sweep';
    let phaseStart = performance.now();
    let lastEchoAt = 0;

    function frame(now) {
      const t = now - phaseStart;
      if (phase === 'sweep') {
        const progress = Math.min(1, t / SWEEP_MS);
        const eased = easeProgress(progress);
        const mag = magStart - (magStart - MAG_END) * eased;
        const h = clampHToDomain(activeFn.domain, aVal, sign * mag);
        setHVal(h);
        if (t - lastEchoAt > SWEEP_MS / 6) {
          lastEchoAt = t;
          setEchoes(prev => {
            const next = [...prev, { h, id: Math.random() }];
            return next.slice(-5);
          });
        }
        if (progress >= 1) { phase = 'pause'; phaseStart = now; }
        playAnimRef.current = { raf: requestAnimationFrame(frame) };
      } else if (phase === 'pause') {
        if (t >= PAUSE_MS) {
          setHVal(playStartHRef.current);
          setHText(displayNum(playStartHRef.current, 3));
          setEchoes([]);
          phase = 'sweep'; phaseStart = now; lastEchoAt = 0;
        }
        playAnimRef.current = { raf: requestAnimationFrame(frame) };
      }
    }
    playAnimRef.current = { raf: requestAnimationFrame(frame) };
  }

  useEffect(() => () => { if (playAnimRef.current) cancelAnimationFrame(playAnimRef.current.raf); }, []);

  // ---- slider (log-scaled) ----
  const SLIDER_MAX_MAG = 5, SLIDER_MIN_MAG = 0.001;
  function magToSlider(mag) {
    const clamped = Math.max(SLIDER_MIN_MAG, Math.min(SLIDER_MAX_MAG, mag));
    return 1 - (Math.log(clamped / SLIDER_MIN_MAG) / Math.log(SLIDER_MAX_MAG / SLIDER_MIN_MAG));
  }
  function sliderToMag(s) {
    const clamped = Math.max(0, Math.min(1, s));
    return SLIDER_MIN_MAG * Math.pow(SLIDER_MAX_MAG / SLIDER_MIN_MAG, 1 - clamped);
  }
  const sliderPos = magToSlider(Math.abs(hVal));
  function onSliderChange(e) {
    stopPlay();
    const s = parseFloat(e.target.value);
    const mag = sliderToMag(s);
    const sign = hVal < 0 ? -1 : 1;
    const h = clampHToDomain(activeFn.domain, aVal, sign * mag);
    commitH(h);
    pushManualEchoIfNeeded(h);
  }

  // ---- labels per notation ----
  const isXA = notation === 'xa';
  const pointLabel = isXA ? 'x' : 'a+h';
  const deltaLabel = isXA ? 'x − a' : 'h';
  const dqDenomLabel = isXA ? 'x − a' : 'h';

  const tangentSlide = showTangent;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", background: COLORS.bg, padding: 20, borderRadius: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: COLORS.card, borderRadius: 20, boxShadow: '0 2px 14px rgba(59,79,200,0.08)', padding: 18 }}>

        {/* ================= GRAPH ================= */}
        <div style={{ background: 'linear-gradient(135deg, #EFEFF9, #F7F7FC)', borderRadius: 16, height: 400, position: 'relative', overflow: 'hidden' }} ref={svgOuterRef}>
          <svg viewBox={`0 0 ${BASE_W} ${BASE_H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', cursor: panning ? 'grabbing' : 'grab' }} onPointerDown={onBackgroundPointerDown}>
            {/* axes */}
            {(() => {
              const [xMin, xMax] = visibleXRange;
              const [yMin, yMax] = visibleYRange;
              const axisLines = [];
              if (yMin <= 0 && yMax >= 0) {
                const pLeft = worldToPx(xMin, 0), pRight = worldToPx(xMax, 0);
                axisLines.push(<line key="xaxis" x1={pLeft.sx} y1={pLeft.sy} x2={pRight.sx} y2={pRight.sy} stroke="#C4C4DC" strokeWidth="1.3" />);
              }
              if (xMin <= 0 && xMax >= 0) {
                const pTop = worldToPx(0, yMax), pBot = worldToPx(0, yMin);
                axisLines.push(<line key="yaxis" x1={pTop.sx} y1={pTop.sy} x2={pBot.sx} y2={pBot.sy} stroke="#C4C4DC" strokeWidth="1.3" />);
              }
              return axisLines;
            })()}

            {/* base curve */}
            <path d={curvePath} stroke={COLORS.accent} strokeWidth="2.5" fill="none" />

            {/* echo trail */}
            {echoes.map((echo, i) => {
              const eh = echo.h;
              const efah = activeFn.domain(aVal + eh) ? activeFn.fn(aVal + eh) : fa;
              const edq = differenceQuotient(activeFn.fn, aVal, eh);
              const eline = lineToEdges(aVal, fa, edq);
              const opacity = 0.10 + 0.65 * ((i + 1) / echoes.length);
              return <line key={echo.id} x1={eline.x1} y1={eline.y1} x2={eline.x2} y2={eline.y2} stroke={COLORS.secant} strokeWidth="1.6" opacity={opacity} />;
            })}

            {/* current secant, full strength */}
            <line x1={secantLine.x1} y1={secantLine.y1} x2={secantLine.x2} y2={secantLine.y2} stroke={COLORS.secant} strokeWidth="2.6" />

            {/* tangent line */}
            {tangentLine && (
              <line
                x1={tangentLine.x1} y1={tangentLine.y1} x2={tangentLine.x2} y2={tangentLine.y2}
                stroke={COLORS.amber} strokeWidth="2.2"
                style={{ opacity: tangentSlide ? 1 : 0, transition: 'opacity 960ms cubic-bezier(0.4,0,0.2,1)' }}
              />
            )}

            {/* rise & run overlay */}
            {riseRunVisible && (() => {
              const SIZE = 8;
              const dxSign = pAH.sx >= pCorner.sx ? 1 : -1;
              const dySign = pA.sy >= pCorner.sy ? 1 : -1;
              const rectX = dxSign > 0 ? pCorner.sx : pCorner.sx - SIZE;
              const rectY = dySign > 0 ? pCorner.sy : pCorner.sy - SIZE;
              return (
                <g>
                  <line x1={pCorner.sx} y1={pCorner.sy} x2={pAH.sx} y2={pAH.sy} stroke={COLORS.green} strokeWidth="1.6" />
                  <line x1={pCorner.sx} y1={pCorner.sy} x2={pA.sx} y2={pA.sy} stroke={COLORS.green} strokeWidth="1.6" />
                  <rect x={rectX} y={rectY} width={SIZE} height={SIZE} fill="none" stroke={COLORS.green} strokeWidth="1.2" />
                  <text x={(pCorner.sx + pAH.sx) / 2} y={pCorner.sy + (dySign > 0 ? -8 : 16)} fontSize="12.5" fill={COLORS.green} fontStyle="italic" textAnchor="middle">{deltaLabel}</text>
                  <text x={pCorner.sx + (dxSign > 0 ? -8 : 8)} y={(pCorner.sy + pA.sy) / 2} fontSize="12.5" fill={COLORS.green} fontStyle="italic" textAnchor={dxSign > 0 ? 'end' : 'start'}>f({pointLabel}) − f(a)</text>
                </g>
              );
            })()}

            {/* fixed point a */}
            <circle cx={pA.sx} cy={pA.sy} r="5" fill={COLORS.accent} />
            <text x={pA.sx - 12} y={pA.sy - 10} fontSize="14" fill={COLORS.muted} fontStyle="italic">a</text>

            {/* draggable point a+h / x */}
            <circle
              cx={pAH.sx} cy={pAH.sy} r="9" fill="white" stroke={COLORS.accent2} strokeWidth="2.5"
              style={{ cursor: 'grab' }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); stopPlay(); setDragging(true); }}
            />
            <text x={pAH.sx + 10} y={pAH.sy - 10} fontSize="14" fill={COLORS.secant} fontStyle="italic">{pointLabel}</text>
          </svg>

          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => setCamera(c => ({ ...c, scale: c.scale * 1.25 }))} style={zoomBtnStyle}>+</button>
            <button onClick={() => setCamera(c => ({ ...c, scale: c.scale / 1.25 }))} style={zoomBtnStyle}>−</button>
            <button onClick={autofit} style={{ ...zoomBtnStyle, fontSize: 11 }}>⤢</button>
          </div>
        </div>

        {/* ================= f(x) BANNER ================= */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}`, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', border: `1px solid ${COLORS.border}`, borderRadius: 20, overflow: 'hidden', fontSize: 12.5, flex: 1, minWidth: 160 }}>
            <div style={{ background: COLORS.bg, padding: '6px 10px', color: COLORS.muted, fontWeight: 600, fontStyle: 'italic', whiteSpace: 'nowrap' }}>f(x) =</div>
            <input
              style={{ border: 'none', padding: '6px 10px', width: '100%', fontSize: 12.5, fontFamily: 'inherit', outline: 'none' }}
              value={fnInputText}
              onChange={(e) => setFnInputText(e.target.value)}
              onBlur={() => {
                const preset = PRESET_ORDER.find(k => PRESETS[k].expr === fnInputText);
                if (preset) { setFunctionKey(preset); return; }
                try { compileExpression(fnInputText); setFunctionKey('custom'); setCustomExpr(fnInputText); setCustomError(null); }
                catch (e) { setCustomError(e.message); }
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
            {PRESET_ORDER.map(k => (
              <button key={k} onClick={() => { setFunctionKey(k); setFnInputText(PRESETS[k].expr); setCustomError(null); }}
                style={{ ...pillStyle, ...(functionKey === k ? pillActiveStyle : {}) }}>{PRESETS[k].label}</button>
            ))}
          </div>
        </div>
        {customError && <div style={{ color: COLORS.warning, fontSize: 12, marginTop: 6 }}>Couldn't parse that expression: {customError}</div>}

        {/* ================= READOUT ROW (Option A) ================= */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'stretch' }}>
          <ReadoutCard eyebrow={isXA ? 'x − a' : 'h'} math value={displayNum(hVal, 3)} />
          <ReadoutCard eyebrow="a" math value={`(${displayNum(aVal, 2)}, ${displayNum(fa, 2)})`} small />
          <ReadoutCard eyebrow={pointLabel} math value={`(${displayNum(xVal, 2)}, ${displayNum(fah, 2)})`} small color={COLORS.secant} />
          <div style={{
            background: COLORS.bg, borderRadius: 14, padding: '10px 14px', textAlign: 'center', display: 'flex', flexDirection: 'column',
            flex: tangentSlide ? 1.6 : 2, minWidth: 0, transition: 'flex 960ms cubic-bezier(0.4,0,0.2,1)'
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.eyebrow, marginBottom: 4 }}>Difference Quotient</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 13.5, flexWrap: 'wrap', gap: 2, color: COLORS.accent, fontWeight: 700 }}>
                <Frac num={`f(${pointLabel}) − f(a)`} den={dqDenomLabel} />
                <span>=</span>
                <span>{displayNum(dq, 3)}</span>
              </div>
            </div>
          </div>
          <div style={{
            background: tangentSlide ? '#FBF1E3' : COLORS.bg, borderRadius: 14, padding: '10px 14px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', whiteSpace: 'nowrap',
            flex: tangentSlide ? 1 : 0, opacity: tangentSlide ? 1 : 0, minWidth: 0,
            transition: 'flex 960ms cubic-bezier(0.4,0,0.2,1), opacity 960ms cubic-bezier(0.4,0,0.2,1), background 960ms',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.amber, fontStyle: 'italic', marginBottom: 4 }}>f '(a)</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.amber, fontStyle: 'italic' }}>{displayNum(fprime, 3)}</div>
            </div>
          </div>
        </div>

        {/* ================= SLIDER / PLAY / INPUTS ================= */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.eyebrow, marginBottom: 4, fontStyle: 'italic' }}>{isXA ? 'x → a' : 'h → 0'}</div>
            <input type="range" min="0" max="1" step="0.001" value={sliderPos} onChange={onSliderChange} style={{ width: '100%' }} />
          </div>
          <button onClick={() => playing ? stopPlay() : startPlay()} style={playBtnStyle}>{playing ? '⏸' : '▶'}</button>
          <button
            onClick={() => {
              if (playing) { setEchoes([]); return; } // Play still owns the trail — clear only, stays in "Clear" mode
              if (manualTrailOn) { setEchoes([]); setManualTrailOn(false); }
              else { setManualTrailOn(true); }
            }}
            style={{ ...pillStyle, ...(manualTrailOn ? { background: COLORS.secant, borderColor: COLORS.secant, color: 'white' } : {}) }}
            title={manualTrailOn ? 'Clear the accumulated secant lines' : 'Leave a fading trail of secant lines while dragging or sliding'}
          >
            {manualTrailOn ? 'Clear Secant Lines' : 'Show Secant Lines'}
          </button>
          <FusedInput prefix="a =" value={aText} onChange={setAText} onCommit={() => commitA(parseFloat(aText))} />
          <FusedInput prefix={isXA ? 'x − a =' : 'h ='} value={hText} onChange={setHText} onCommit={() => { stopPlay(); commitH(parseFloat(hText)); }} />
          <button
            onClick={() => setNotation(n => n === 'ah' ? 'xa' : 'ah')}
            title={isXA ? 'Switch to a, a+h notation' : 'Switch to x, a notation'}
            style={{ ...pillStyle, display: 'flex', alignItems: 'center', gap: 5, fontStyle: 'italic' }}
          >
            a, a+h <span style={{ fontStyle: 'normal', color: COLORS.accent }}>⇄</span> x, a
          </button>
        </div>
        {aWarning && <div style={{ color: COLORS.warning, fontSize: 12, marginTop: 6 }}>{aWarning}</div>}

        {/* ================= TOGGLE ROW ================= */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <ToggleBtn label="Rise & Run" on={showRiseRun} color={COLORS.green} onClick={() => setShowRiseRun(v => !v)} />
          <ToggleBtn label="Tangent" on={showTangent} color={COLORS.amber} onClick={() => setShowTangent(v => !v)} />
          <ToggleBtn label="Table" on={showTable} color={COLORS.accent} onClick={() => setShowTable(v => !v)} />
        </div>

        {/* ================= TABLE ================= */}
        {showTable && (
          <div style={{ marginTop: 14, background: COLORS.bg, borderRadius: 14, padding: '12px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={thStyleMath}>{isXA ? 'x − a' : 'h'}</th>
                  <th style={thStyleMath}>{pointLabel}</th>
                  <th style={thStyleWord}>Difference Quotient</th>
                </tr>
              </thead>
              <tbody>
                {buildTable(activeFn.domain, aVal, hVal, activeFn.fn).map(row => (
                  <tr key={row.key} style={row.isLast ? { color: COLORS.accent, fontWeight: 700 } : {}}>
                    <td style={{ ...tdStyle, borderBottom: row.isLast ? 'none' : `1px solid ${COLORS.border}` }}>{displayNum(row.h, 3)}</td>
                    <td style={{ ...tdStyle, borderBottom: row.isLast ? 'none' : `1px solid ${COLORS.border}` }}>{displayNum(row.xVal, 3)}</td>
                    <td style={{ ...tdStyle, borderBottom: row.isLast ? 'none' : `1px solid ${COLORS.border}` }}>{displayNum(row.dq, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= FORMULA & DERIVATION PANEL ================= */}
        <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 14, paddingTop: 12 }}>
          <div onClick={() => setDerivOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: COLORS.accent, cursor: 'pointer' }}>
            <span>{derivOpen ? '▾' : '▸'} Formula & Derivation</span>
          </div>
          {derivOpen && (
            <div style={{ marginTop: 12, fontSize: 14, color: COLORS.text, lineHeight: 2.4, background: COLORS.bg, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ marginBottom: 14 }}>
                <div style={eyebrowLabel}>{isXA ? 'Slope of the secant line' : 'Slope of the secant line'}</div>
                <div style={eqRow}>
                  <Frac num={`f(${pointLabel}) − f(a)`} den={dqDenomLabel} />
                  <span>=</span>
                  <Frac num={`f(${displayNum(xVal, 2)}) − f(${displayNum(aVal, 2)})`} den={displayNum(hVal, 3)} />
                  <span>=</span>
                  <span style={{ color: COLORS.secant, fontWeight: 700 }}>{displayNum(dq, 3)}</span>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={eyebrowLabel}>Definition of the derivative</div>
                <div style={eqRow}>
                  <span style={{ fontStyle: 'italic' }}>f '(a)</span>
                  <span>=</span>
                  <LimStack sub={isXA ? 'x→a' : 'h→0'} />
                  <Frac num={`f(${pointLabel}) − f(a)`} den={dqDenomLabel} />
                </div>
              </div>
              <div>
                <div style={{ ...eyebrowLabel, fontStyle: 'italic', textTransform: 'none' }}>at a = {displayNum(aVal, 2)}</div>
                <div style={eqRow}>
                  <span style={{ fontStyle: 'italic' }}>f '({displayNum(aVal, 2)})</span>
                  <span>=</span>
                  <span style={{ color: COLORS.amber, fontWeight: 700 }}>{displayNum(fprime, 3)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadoutCard({ eyebrow, value, math, small, color }) {
  return (
    <div style={{ background: COLORS.bg, borderRadius: 14, padding: '10px 14px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.03em', color: COLORS.eyebrow, marginBottom: 4, fontStyle: math ? 'italic' : 'normal', textTransform: math ? 'none' : 'uppercase' }}>{eyebrow}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: small ? 13 : 15, fontWeight: 700, color: color || COLORS.accent, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    </div>
  );
}

function FusedInput({ prefix, value, onChange, onCommit }) {
  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${COLORS.border}`, borderRadius: 20, overflow: 'hidden', fontSize: 12.5 }}>
      <div style={{ background: COLORS.bg, padding: '6px 10px', color: COLORS.muted, fontWeight: 600, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{prefix}</div>
      <input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '' || v === '-' || /^-?\d*\.?\d*$/.test(v)) onChange(v);
        }}
        onBlur={onCommit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        style={{ border: 'none', padding: '6px 10px', width: 70, fontSize: 12.5, fontFamily: 'inherit', outline: 'none' }}
      />
    </div>
  );
}

function ToggleBtn({ label, on, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      ...pillStyle,
      background: on ? color : COLORS.bg,
      borderColor: on ? color : COLORS.border,
      color: on ? 'white' : COLORS.text,
      transition: 'background 200ms, border-color 200ms, color 200ms',
    }}>{label}: {on ? 'On' : 'Off'}</button>
  );
}

const zoomBtnStyle = { width: 28, height: 28, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: COLORS.accent, fontWeight: 700, border: 'none', cursor: 'pointer' };
const playBtnStyle = { width: 34, height: 34, borderRadius: '50%', background: COLORS.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, border: 'none', cursor: 'pointer' };
const pillStyle = { borderRadius: 20, padding: '6px 16px', fontSize: 12.5, fontWeight: 600, background: COLORS.bg, borderWidth: 1, borderStyle: 'solid', borderColor: COLORS.border, color: COLORS.text, whiteSpace: 'nowrap', cursor: 'pointer' };
const pillActiveStyle = { background: COLORS.accent, color: 'white', borderColor: COLORS.accent };
const thStyleMath = { textAlign: 'left', color: COLORS.eyebrow, fontWeight: 700, fontStyle: 'italic', fontSize: 12, padding: '4px 8px', borderBottom: `1px solid ${COLORS.border}` };
const thStyleWord = { textAlign: 'left', color: COLORS.eyebrow, fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5, padding: '4px 8px', borderBottom: `1px solid ${COLORS.border}` };
const tdStyle = { padding: '4px 8px', fontVariantNumeric: 'tabular-nums' };
const eyebrowLabel = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLORS.eyebrow, marginBottom: 4 };
const eqRow = { display: 'flex', alignItems: 'center', fontSize: 15, flexWrap: 'wrap', gap: 2 };
