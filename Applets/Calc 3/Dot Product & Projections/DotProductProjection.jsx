import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";

// ---------- Math helpers ----------
const MIN_LEN = 0.01; // epsilon clamp for dragged vector length
const DOMAIN = 10; // invisible -10..10 bounding window for tips
const DRAW_IN_MS = 1467; // dash-by-dash perpendicular reveal duration (50% faster than the original 2200ms)

function len(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}
function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}
function clampToDomain(v) {
  return {
    x: Math.max(-DOMAIN, Math.min(DOMAIN, v.x)),
    y: Math.max(-DOMAIN, Math.min(DOMAIN, v.y)),
  };
}
function clampMinLength(v) {
  const l = len(v);
  if (l >= MIN_LEN) return v;
  if (l < 1e-9) return { x: MIN_LEN, y: 0 };
  const scale = MIN_LEN / l;
  return { x: v.x * scale, y: v.y * scale };
}
function angleBetween(a, b) {
  const na = len(a), nb = len(b);
  if (na < 1e-9 || nb < 1e-9) return { rad: NaN, deg: NaN };
  let cos = dot(a, b) / (na * nb);
  cos = Math.max(-1, Math.min(1, cos));
  const rad = Math.acos(cos);
  return { rad, deg: (rad * 180) / Math.PI };
}
function scalarProjection(from, onto) {
  const nOnto = len(onto);
  if (nOnto < 1e-9) return NaN;
  return dot(from, onto) / nOnto;
}
function vectorProjection(from, onto) {
  const oo = dot(onto, onto);
  if (oo < 1e-9) return { x: NaN, y: NaN };
  const t = dot(from, onto) / oo;
  return { x: t * onto.x, y: t * onto.y };
}
function fmt(n, d = 2) {
  if (Number.isNaN(n)) return "—";
  return n.toFixed(d);
}
function displayNum(n) {
  if (Number.isNaN(n)) return "";
  const rounded = parseFloat(n.toFixed(4));
  return String(rounded);
}

// ---------- Caliper label measurement (real text metrics, not fixed offsets) ----------
const CALIPER_FONT_MAIN = "700 15px -apple-system, BlinkMacSystemFont, Inter, sans-serif";
const CALIPER_FONT_SUB = "600 11px -apple-system, BlinkMacSystemFont, Inter, sans-serif";
const CALIPER_LINE_H_MAIN = 18; // rendered line-box height for the 15px/700 main line
const CALIPER_LINE_H_SUB = 15; // rendered line-box height for the 11px/600 sub line
const CALIPER_LINE_GAP = 4; // gap between the two stacked lines when both are present

let _measureCanvas = null;
function getMeasureCtx() {
  if (typeof document === "undefined") return null;
  if (!_measureCanvas) _measureCanvas = document.createElement("canvas");
  return _measureCanvas.getContext("2d");
}

// Measures the actual pixel footprint of whatever caliper text will be on screen right now
// (one line if comp is non-negative, two lines if negative) using the same fonts we render with.
function measureCaliperText(mainText, subText) {
  const ctx = getMeasureCtx();
  let mainWidth = mainText.length * 7.5; // fallback if canvas measurement is unavailable
  let subWidth = subText ? subText.length * 6.2 : 0;
  if (ctx) {
    ctx.font = CALIPER_FONT_MAIN;
    mainWidth = ctx.measureText(mainText).width;
    if (subText) {
      ctx.font = CALIPER_FONT_SUB;
      subWidth = ctx.measureText(subText).width;
    }
  }
  const width = Math.max(mainWidth, subWidth);
  const height = subText ? CALIPER_LINE_H_MAIN + CALIPER_LINE_GAP + CALIPER_LINE_H_SUB : CALIPER_LINE_H_MAIN;
  return { width, height };
}

// Builds the individual dash segments for the perpendicular's dash-by-dash draw-in.
// Undershoot at the "onto" end is fine by design; each dash fades in independently.
function buildPerpDashes(fromPx, projPx) {
  const dx = projPx.x - fromPx.x;
  const dy = projPx.y - fromPx.y;
  const totalLen = Math.hypot(dx, dy);
  if (totalLen < 1e-6) return [];
  const ux = dx / totalLen;
  const uy = dy / totalLen;
  const DASH_LEN = 9;
  const GAP_LEN = 7;
  const step = DASH_LEN + GAP_LEN;
  let n = Math.max(1, Math.round(totalLen / step));
  n = Math.max(3, Math.min(n, 40));
  const dashes = [];
  for (let i = 0; i < n; i++) {
    const startD = i * step;
    if (startD >= totalLen) break;
    const endD = Math.min(startD + DASH_LEN, totalLen);
    dashes.push({
      x1: fromPx.x + ux * startD,
      y1: fromPx.y + uy * startD,
      x2: fromPx.x + ux * endD,
      y2: fromPx.y + uy * endD,
    });
  }
  return dashes;
}

// ---------- Coordinate mapping (fixed base pixel space; viewBox pans/zooms over it) ----------
const VB_W = 680;
const VB_H = 440;
const TAIL_PX = { x: 260, y: 235 }; // fixed pixel location of shared tail in base space
const PX_PER_UNIT = 18; // domain (10) reaches 180px in every direction from the tail

function toPx(v) {
  return { x: TAIL_PX.x + v.x * PX_PER_UNIT, y: TAIL_PX.y - v.y * PX_PER_UNIT };
}
function toMath(px) {
  return {
    x: (px.x - TAIL_PX.x) / PX_PER_UNIT,
    y: (TAIL_PX.y - px.y) / PX_PER_UNIT,
  };
}

const DEFAULT_VIEW = { x: 0, y: 0, w: VB_W, h: VB_H };
const MIN_VIEW_W = VB_W * 0.28;
const MAX_VIEW_W = VB_W * 3.2;

function fitViewToPoints(points, marginPx = 46) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  let minX = Math.min(...xs) - marginPx;
  let maxX = Math.max(...xs) + marginPx;
  let minY = Math.min(...ys) - marginPx;
  let maxY = Math.max(...ys) + marginPx;
  let w = maxX - minX;
  let h = maxY - minY;
  const aspect = VB_W / VB_H;
  if (w / h > aspect) {
    const targetH = w / aspect;
    const grow = (targetH - h) / 2;
    minY -= grow;
    h = targetH;
  } else {
    const targetW = h * aspect;
    const grow = (targetW - w) / 2;
    minX -= grow;
    w = targetW;
  }
  w = Math.max(MIN_VIEW_W, Math.min(MAX_VIEW_W, w));
  h = w / aspect;
  return { x: minX, y: minY, w, h };
}

function isOffScreen(view, points, marginPx = 10) {
  return points.some(
    (p) =>
      p.x < view.x + marginPx ||
      p.x > view.x + view.w - marginPx ||
      p.y < view.y + marginPx ||
      p.y > view.y + view.h - marginPx
  );
}

// ---------- Visual constants ----------
const COLORS = {
  accent: "#3B4FC2",
  accent2: "#6478D6",
  proj: "#C98F3E",
  green: "#3FA671",
  red: "#C1556B",
  muted: "#6E6E86",
  eyebrow: "#8A8AA3",
  border: "#DCDCF0",
  bg: "#F5F5FA",
  text: "#3A3A3C",
};

function arrowMarker(id, color) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="5" refY="2.5" orient="auto">
      <path d="M0,0 L5,2.5 L0,5 Z" fill={color} />
    </marker>
  );
}

// ---------- Small reusable UI bits ----------
function Vec({ children }) {
  return <span style={{ fontWeight: 800, textTransform: "none" }}>{children}</span>;
}

function SwitchDot({ on, onClick, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      role="switch"
      aria-checked={on}
      style={{
        width: 46,
        height: 26,
        borderRadius: 20,
        background: on ? COLORS.accent : "#D5D5E6",
        position: "relative",
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          transition: "left 0.15s",
        }}
      />
    </div>
  );
}

function NumberInput({ label, value, onChange }) {
  const [text, setText] = useState(displayNum(value));
  useEffect(() => {
    setText(displayNum(value));
  }, [value]);

  return (
    <div
      style={{
        display: "flex",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 22,
        overflow: "hidden",
        background: "white",
      }}
    >
      <div
        style={{
          background: "#EFEFF7",
          color: COLORS.muted,
          fontSize: 15,
          fontWeight: 600,
          padding: "11px 12px",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = parseFloat(text);
          if (!Number.isNaN(n)) onChange(n);
          else setText(displayNum(value));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.target.blur();
        }}
        style={{
          border: "none",
          outline: "none",
          padding: "11px 12px",
          width: 88,
          fontSize: 15,
          fontFamily: "inherit",
          fontVariantNumeric: "tabular-nums",
        }}
      />
    </div>
  );
}

// ---------- Main component ----------
export default function DotProductProjection() {
  const [a, setA] = useState({ x: 5, y: 6 });
  const [b, setB] = useState({ x: 7, y: -1 });
  const [swapDirection, setSwapDirection] = useState(false); // false: proj_b(a); true: proj_a(b)
  const [showProjection, setShowProjection] = useState(false);
  const [showComponent, setShowComponent] = useState(false);
  const [dragging, setDragging] = useState(null); // { which: 'a'|'b', mode: 'free'|'rotate' }
  const [hoverZone, setHoverZone] = useState(null); // { which: 'a'|'b', zone: 'tip'|'body' }
  const [caliperVisible, setCaliperVisible] = useState(false);
  const [caliperAnimKey, setCaliperAnimKey] = useState(0);
  const [perpPhase, setPerpPhase] = useState("idle"); // 'idle' | 'fadeOut' | 'drawIn'
  const [prevPerpGeom, setPrevPerpGeom] = useState(null); // { fromPx, projPx } snapshot to fade out
  const [perpAnimKey, setPerpAnimKey] = useState(0);
  const perpTimeoutsRef = useRef([]);
  const [view, setView] = useState(DEFAULT_VIEW);
  const svgRef = useRef(null);
  const dragStateRef = useRef(null); // { which, mode, length }

  const fromVec = swapDirection ? b : a;
  const ontoVec = swapDirection ? a : b;
  const fromLabel = swapDirection ? "b" : "a";
  const ontoLabel = swapDirection ? "a" : "b";

  const angle = useMemo(() => angleBetween(a, b), [a, b]);
  const dotVal = useMemo(() => dot(a, b), [a, b]);
  const comp = useMemo(() => scalarProjection(fromVec, ontoVec), [fromVec, ontoVec]);
  const proj = useMemo(() => vectorProjection(fromVec, ontoVec), [fromVec, ontoVec]);
  const isNegative = comp < 0;
  const caliperColor = isNegative ? COLORS.red : COLORS.green;

  const aIsZero = a.x === 0 && a.y === 0;
  const bIsZero = b.x === 0 && b.y === 0;

  const clearPerpTimeouts = () => {
    perpTimeoutsRef.current.forEach(clearTimeout);
    perpTimeoutsRef.current = [];
  };

  // Plays: (optional) quick fade-out of old perpendicular -> dash-by-dash draw-in of the new one
  // -> fade-in of the solid projection vector -> (if component was showing) resweep the caliper.
  const triggerPerpTransition = (prevGeom, wasComponentOn) => {
    clearPerpTimeouts();
    const startDrawIn = () => {
      setPerpPhase("drawIn");
      setPerpAnimKey((k) => k + 1);
      const t = setTimeout(() => {
        setPerpPhase("idle");
        if (wasComponentOn) {
          setCaliperVisible(true);
          setCaliperAnimKey((k) => k + 1);
        }
      }, DRAW_IN_MS);
      perpTimeoutsRef.current.push(t);
    };
    if (prevGeom) {
      setPrevPerpGeom(prevGeom);
      setPerpPhase("fadeOut");
      const t = setTimeout(startDrawIn, 160);
      perpTimeoutsRef.current.push(t);
    } else {
      startDrawIn();
    }
  };

  useEffect(() => clearPerpTimeouts, []);

  const handleToggleProjection = () => {
    setShowProjection((prev) => {
      const next = !prev;
      if (!next) {
        setShowComponent(false);
        setCaliperVisible(false);
        clearPerpTimeouts();
        setPerpPhase("idle");
      } else {
        setCaliperVisible(false);
        triggerPerpTransition(null, false);
      }
      return next;
    });
  };

  const handleToggleComponent = () => {
    setShowComponent((prev) => {
      const next = !prev;
      setCaliperVisible(next);
      if (next) setCaliperAnimKey((k) => k + 1);
      return next;
    });
  };

  const handleRemeasure = () => {
    setCaliperVisible(true);
    setCaliperAnimKey((k) => k + 1);
  };

  const handleSwap = () => {
    const prevGeom = !Number.isNaN(proj.x) ? { fromPx, projPx } : null;
    const wasComponentOn = showComponent;
    setCaliperVisible(false);
    setSwapDirection((s) => !s);
    triggerPerpTransition(prevGeom, wasComponentOn);
  };

  // --- shared: check off-screen and autofit if needed, given explicit vector values ---
  const maybeAutofit = useCallback(
    (nextA, nextB) => {
      const pts = [toPx({ x: 0, y: 0 }), toPx(nextA), toPx(nextB)];
      if (showProjection) {
        const fA = swapDirection ? nextB : nextA;
        const oA = swapDirection ? nextA : nextB;
        const p = vectorProjection(fA, oA);
        if (!Number.isNaN(p.x)) pts.push(toPx(p));
      }
      setView((v) => (isOffScreen(v, pts) ? fitViewToPoints(pts) : v));
    },
    [showProjection, swapDirection]
  );

  // --- dragging ---
  const getMathFromClientEvent = useCallback((clientX, clientY, currentView) => {
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = currentView.w / rect.width;
    const scaleY = currentView.h / rect.height;
    const px = { x: currentView.x + (clientX - rect.left) * scaleX, y: currentView.y + (clientY - rect.top) * scaleY };
    return toMath(px);
  }, []);

  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const startDrag = (which, mode) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const current = which === "a" ? a : b;
    dragStateRef.current = { which, mode, length: len(current) };
    setDragging({ which, mode });
    setCaliperVisible(false);
  };

  useEffect(() => {
    if (!dragging) return;
    let lastVal = null;

    const handleMove = (e) => {
      const point = e.touches ? e.touches[0] : e;
      const mathPt = getMathFromClientEvent(point.clientX, point.clientY, viewRef.current);
      const ds = dragStateRef.current;
      let next;
      if (ds.mode === "rotate") {
        const ang = Math.atan2(mathPt.y, mathPt.x);
        next = { x: ds.length * Math.cos(ang), y: ds.length * Math.sin(ang) };
      } else {
        next = clampMinLength(clampToDomain(mathPt));
      }
      lastVal = next;
      if (ds.which === "a") setA(next);
      else setB(next);
    };
    const handleUp = () => {
      const ds = dragStateRef.current;
      if (ds && lastVal) {
        const nextA = ds.which === "a" ? lastVal : a;
        const nextB = ds.which === "b" ? lastVal : b;
        maybeAutofit(nextA, nextB);
      }
      dragStateRef.current = null;
      setDragging(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, getMathFromClientEvent]);

  const handleInputChange = (which) => (axis) => (val) => {
    const setter = which === "a" ? setA : setB;
    const current = which === "a" ? a : b;
    const next = clampToDomain({ ...current, [axis]: val });
    setter(next);
    setCaliperVisible(false);
    const nextA = which === "a" ? next : a;
    const nextB = which === "b" ? next : b;
    maybeAutofit(nextA, nextB);
  };

  const handleZoom = (factor) => {
    setView((v) => {
      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;
      let w = Math.max(MIN_VIEW_W, Math.min(MAX_VIEW_W, v.w * factor));
      const h = w / (VB_W / VB_H);
      return { x: cx - w / 2, y: cy - h / 2, w, h };
    });
  };

  const handleAutofit = () => {
    const pts = [toPx({ x: 0, y: 0 }), toPx(a), toPx(b)];
    if (showProjection && !Number.isNaN(proj.x)) pts.push(toPx(proj));
    setView(fitViewToPoints(pts));
  };

  // --- geometry for drawing ---
  const tailPx = TAIL_PX;
  const aPx = toPx(a);
  const bPx = toPx(b);
  const fromPx = swapDirection ? bPx : aPx;
  const ontoPx = swapDirection ? aPx : bPx;
  const projPx = toPx(proj);

  const ontoVecPx = { x: ontoPx.x - tailPx.x, y: ontoPx.y - tailPx.y };
  const ontoPxLen = Math.max(1e-6, Math.sqrt(ontoVecPx.x ** 2 + ontoVecPx.y ** 2));
  const ontoUnit = { x: ontoVecPx.x / ontoPxLen, y: ontoVecPx.y / ontoPxLen };
  const perp = { x: -ontoUnit.y, y: ontoUnit.x };

  const fromVecPx = { x: fromPx.x - tailPx.x, y: fromPx.y - tailPx.y };
  const sideOfFrom = Math.sign(perp.x * fromVecPx.x + perp.y * fromVecPx.y) || 1;
  const caliperSign = -sideOfFrom;

  const OFFSET = 30;
  const calStart = { x: tailPx.x + perp.x * OFFSET * caliperSign, y: tailPx.y + perp.y * OFFSET * caliperSign };
  const calEnd = { x: projPx.x + perp.x * OFFSET * caliperSign, y: projPx.y + perp.y * OFFSET * caliperSign };
  const tickLen = 7;
  const tickDx = perp.x * tickLen;
  const tickDy = perp.y * tickLen;

  const rightAngleSize = 9;
  const raBase = { x: projPx.x - ontoUnit.x * rightAngleSize, y: projPx.y - ontoUnit.y * rightAngleSize };
  const raCorner = { x: raBase.x + perp.x * rightAngleSize * sideOfFrom, y: raBase.y + perp.y * rightAngleSize * sideOfFrom };
  const raEnd = { x: projPx.x + perp.x * rightAngleSize * sideOfFrom, y: projPx.y + perp.y * rightAngleSize * sideOfFrom };

  // ---- measurement-based caliper text placement (caliper's own rotated frame) ----
  // Frame axes: barUnit runs along the caliper bar itself; perp (already computed above) is
  // perpendicular to it. Both the tick-mark box and the text box are measured/positioned in
  // this frame, then converted back to screen pixels.
  const barVec = { x: calEnd.x - calStart.x, y: calEnd.y - calStart.y };
  const caliperLen = Math.max(1e-6, Math.hypot(barVec.x, barVec.y));
  const barUnit = { x: barVec.x / caliperLen, y: barVec.y / caliperLen };

  const caliperMainText = `comp_${ontoLabel}(${fromLabel}) = ${fmt(comp)}`;
  const caliperSubText = isNegative ? `negative — points opposite ${ontoLabel}` : null;
  const { width: calTextWidth, height: calTextHeight } = measureCaliperText(caliperMainText, caliperSubText);
  const TEXT_GAP = 6; // clearance between the tick tips/bar and the nearest edge of the text block

  // The label is rotated to run parallel to the bar. This is only ever drawn as a one-shot
  // static placement (toggle-on / remeasure), never mid-drag, so a single computed angle per
  // reveal is all that's needed — no live re-orientation to worry about.
  let calAngleDeg = (Math.atan2(barUnit.y, barUnit.x) * 180) / Math.PI;
  if (calAngleDeg > 90) calAngleDeg -= 180;
  else if (calAngleDeg < -90) calAngleDeg += 180;

  // Now that the text is rotated to the bar's own angle, its measured width truly runs along
  // the bar and its height truly runs perpendicular to it — clearance is just "past the ticks."
  const calPerpPush = tickLen + calTextHeight / 2 + TEXT_GAP;
  const halfTextW = calTextWidth / 2;
  let alongBar = caliperLen / 2;
  if (calTextWidth <= caliperLen) {
    alongBar = Math.max(halfTextW, Math.min(caliperLen - halfTextW, alongBar));
  }
  const calTextAnchor = {
    x: calStart.x + barUnit.x * alongBar + perp.x * calPerpPush * caliperSign,
    y: calStart.y + barUnit.y * alongBar + perp.y * calPerpPush * caliperSign,
  };
  // Local (pre-rotation) baseline positions for each line, stacked along the label's own
  // "height" axis — becomes perpendicular-to-the-bar once rotated into world space below.
  const calLocalLine1Y = caliperSubText
    ? -calTextHeight / 2 + CALIPER_LINE_H_MAIN / 2
    : 0;
  const calLocalLine2Y = -calTextHeight / 2 + CALIPER_LINE_H_MAIN + CALIPER_LINE_GAP + CALIPER_LINE_H_SUB / 2;

  // Rotate each line's local offset into world space by hand and place the <text> element
  // directly at that world position, using a single rotate(deg, cx, cy) transform per element
  // (no wrapping <g>, no combined translate+rotate) — the simplest, most portable SVG form.
  const calAngleRad = (calAngleDeg * Math.PI) / 180;
  const calRotate = (localX, localY) => ({
    x: calTextAnchor.x + localX * Math.cos(calAngleRad) - localY * Math.sin(calAngleRad),
    y: calTextAnchor.y + localX * Math.sin(calAngleRad) + localY * Math.cos(calAngleRad),
  });
  const calLine1Pos = calRotate(0, calLocalLine1Y);
  const calLine2Pos = calRotate(0, calLocalLine2Y);

  // dash-by-dash reveal segments for the perpendicular's draw-in animation
  const perpDashes = useMemo(() => buildPerpDashes(fromPx, projPx), [fromPx.x, fromPx.y, projPx.x, projPx.y]);
  const perpDashCount = Math.max(1, perpDashes.length);
  const perpPerDashMs = DRAW_IN_MS / perpDashCount;
  const perpDashFadeMs = Math.max(60, Math.min(150, perpPerDashMs * 0.6));

  // Full-viewport layout contract, matching Applets/shared/applet-header.css's canonical spec:
  // height:"100%" (not minHeight:"100vh") so the app fills whatever #root's flex-allotted remaining
  // viewport space is. There's no separate shared topline anymore (see Banner() below), so the card
  // gets full 24px inset on the sides/top and full 20px rounding on all corners -- Banner sits flush
  // at its top. The outer wrapper is a flex column (not a plain block) specifically so PageCredit
  // can pin itself to the bottom via marginTop:"auto" -- see PageCredit()'s own comment.
  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        background: "#E8E8F2",
        padding: "24px 24px 0",
        display: "flex",
        flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif",
        color: COLORS.text,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          background: COLORS.bg,
          borderRadius: "20px",
          boxShadow: "0 4px 24px rgba(60,60,90,0.14)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Banner />
        <div style={{ padding: "20px 24px 24px" }}>
      <style>{`
        @keyframes sweepIn {
          from { stroke-dashoffset: var(--len); opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes quickFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes quickFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .icon-btn {
          width: 30px; height: 30px; border-radius: 50%;
          border: 1px solid ${COLORS.border}; background: white; color: ${COLORS.accent};
          font-size: 15px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
        }
      `}</style>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* ---------------- CANVAS ---------------- */}
        <div
          style={{
            flex: "1 1 460px",
            minWidth: 380,
            background: "#FCFCFE",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 18,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg
            ref={svgRef}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            width="100%"
            height={460}
            style={{ display: "block", touchAction: "none" }}
          >
            <defs>
              {arrowMarker("arrA", COLORS.accent)}
              {arrowMarker("arrB", COLORS.accent2)}
              {arrowMarker("arrP", COLORS.proj)}
            </defs>

            <circle cx={tailPx.x} cy={tailPx.y} r={4} fill={COLORS.text} />

            {showProjection && !Number.isNaN(proj.x) && (
              <>
                {perpPhase === "fadeOut" && prevPerpGeom && (
                  <line
                    x1={prevPerpGeom.fromPx.x}
                    y1={prevPerpGeom.fromPx.y}
                    x2={prevPerpGeom.projPx.x}
                    y2={prevPerpGeom.projPx.y}
                    stroke={COLORS.eyebrow}
                    strokeWidth={2}
                    strokeDasharray="6,5"
                    style={{ animation: "quickFadeOut 0.16s ease-in forwards" }}
                  />
                )}
                {perpPhase === "idle" && (
                  <line
                    key="perp-static"
                    x1={fromPx.x}
                    y1={fromPx.y}
                    x2={projPx.x}
                    y2={projPx.y}
                    stroke={COLORS.eyebrow}
                    strokeWidth={2}
                    strokeDasharray="6,5"
                  />
                )}
                {perpPhase === "drawIn" &&
                  perpDashes.map((d, i) => (
                    <line
                      key={`perp-dash-${perpAnimKey}-${i}`}
                      x1={d.x1}
                      y1={d.y1}
                      x2={d.x2}
                      y2={d.y2}
                      stroke={COLORS.eyebrow}
                      strokeWidth={2}
                      strokeLinecap="round"
                      opacity={0}
                      style={{ animation: `quickFadeIn ${perpDashFadeMs}ms ease-out ${i * perpPerDashMs}ms both` }}
                    />
                  ))}
                {perpPhase !== "fadeOut" && (
                  <path
                    d={`M ${raBase.x} ${raBase.y} L ${raCorner.x} ${raCorner.y} L ${raEnd.x} ${raEnd.y}`}
                    fill="none"
                    stroke={COLORS.eyebrow}
                    strokeWidth={1.5}
                    style={
                      perpPhase === "drawIn"
                        ? { animation: `quickFadeIn 0.3s ease-out ${(DRAW_IN_MS - 300) / 1000}s both` }
                        : undefined
                    }
                  />
                )}
              </>
            )}

            <line x1={tailPx.x} y1={tailPx.y} x2={bPx.x} y2={bPx.y} stroke={COLORS.accent2} strokeWidth={3} markerEnd="url(#arrB)" />
            <text
              x={bPx.x + (bPx.x >= tailPx.x ? 12 : -22)}
              y={bPx.y + (bPx.y <= tailPx.y ? -8 : 18)}
              fill={COLORS.accent2}
              fontSize={18}
              fontWeight={800}
            >
              b
            </text>

            <line x1={tailPx.x} y1={tailPx.y} x2={aPx.x} y2={aPx.y} stroke={COLORS.accent} strokeWidth={3} markerEnd="url(#arrA)" />
            <text
              x={aPx.x + (aPx.x >= tailPx.x ? 12 : -22)}
              y={aPx.y + (aPx.y <= tailPx.y ? -8 : 18)}
              fill={COLORS.accent}
              fontSize={18}
              fontWeight={800}
            >
              a
            </text>

            {showProjection && !Number.isNaN(proj.x) && perpPhase !== "fadeOut" && (
              <line
                x1={tailPx.x}
                y1={tailPx.y}
                x2={projPx.x}
                y2={projPx.y}
                stroke={COLORS.proj}
                strokeWidth={3}
                markerEnd="url(#arrP)"
                style={perpPhase === "drawIn" ? { animation: "quickFadeIn 0.35s ease-out forwards" } : undefined}
              />
            )}

            {["a", "b"].map((which) => {
              const px = which === "a" ? aPx : bPx;
              const color = which === "a" ? COLORS.accent : COLORS.accent2;
              const bodyEnd = { x: tailPx.x + (px.x - tailPx.x) * 0.82, y: tailPx.y + (px.y - tailPx.y) * 0.82 };
              const bodyStart = { x: tailPx.x + (px.x - tailPx.x) * 0.12, y: tailPx.y + (px.y - tailPx.y) * 0.12 };
              const isHoverBody = hoverZone && hoverZone.which === which && hoverZone.zone === "body";
              const isHoverTip = hoverZone && hoverZone.which === which && hoverZone.zone === "tip";
              return (
                <g key={which}>
                  {isHoverBody && (
                    <line
                      x1={bodyStart.x}
                      y1={bodyStart.y}
                      x2={bodyEnd.x}
                      y2={bodyEnd.y}
                      stroke={color}
                      strokeWidth={14}
                      opacity={0.14}
                      strokeLinecap="round"
                    />
                  )}
                  {isHoverTip && <circle cx={px.x} cy={px.y} r={14} fill={color} opacity={0.16} />}
                  <line
                    x1={bodyStart.x}
                    y1={bodyStart.y}
                    x2={bodyEnd.x}
                    y2={bodyEnd.y}
                    stroke="transparent"
                    strokeWidth={18}
                    style={{ cursor: "grab" }}
                    onMouseEnter={() => setHoverZone({ which, zone: "body" })}
                    onMouseLeave={() => setHoverZone(null)}
                    onMouseDown={startDrag(which, "rotate")}
                    onTouchStart={startDrag(which, "rotate")}
                  />
                  <circle
                    cx={px.x}
                    cy={px.y}
                    r={14}
                    fill="transparent"
                    style={{ cursor: "grab" }}
                    onMouseEnter={() => setHoverZone({ which, zone: "tip" })}
                    onMouseLeave={() => setHoverZone(null)}
                    onMouseDown={startDrag(which, "free")}
                    onTouchStart={startDrag(which, "free")}
                  />
                </g>
              );
            })}

            {caliperVisible && !dragging && perpPhase === "idle" && !Number.isNaN(comp) && (
              <g key={caliperAnimKey}>
                <line
                  x1={calStart.x}
                  y1={calStart.y}
                  x2={calEnd.x}
                  y2={calEnd.y}
                  stroke={caliperColor}
                  strokeWidth={3}
                  pathLength={1}
                  style={{ strokeDasharray: 1, animation: "sweepIn 0.5s ease-out forwards", ["--len"]: 1 }}
                />
                <line
                  x1={calStart.x - tickDx}
                  y1={calStart.y - tickDy}
                  x2={calStart.x + tickDx}
                  y2={calStart.y + tickDy}
                  stroke={caliperColor}
                  strokeWidth={3}
                  style={{ animation: "fadeUp 0.3s ease-out 0.4s both" }}
                />
                <line
                  x1={calEnd.x - tickDx}
                  y1={calEnd.y - tickDy}
                  x2={calEnd.x + tickDx}
                  y2={calEnd.y + tickDy}
                  stroke={caliperColor}
                  strokeWidth={3}
                  style={{ animation: "fadeUp 0.3s ease-out 0.4s both" }}
                />
                <text
                  x={calLine1Pos.x}
                  y={calLine1Pos.y}
                  transform={`rotate(${calAngleDeg} ${calLine1Pos.x} ${calLine1Pos.y})`}
                  fill={caliperColor}
                  fontSize={15}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  opacity={0}
                  style={{ animation: "quickFadeIn 0.3s ease-out 0.5s both" }}
                >
                  <tspan fontWeight={800}>comp</tspan>
                  <tspan baselineShift="sub" fontSize={11} fontWeight={800}>
                    {ontoLabel}
                  </tspan>
                  <tspan>(</tspan>
                  <tspan fontWeight={800}>{fromLabel}</tspan>
                  <tspan>{`) = ${fmt(comp)}`}</tspan>
                </text>
                {isNegative && (
                  <text
                    x={calLine2Pos.x}
                    y={calLine2Pos.y}
                    transform={`rotate(${calAngleDeg} ${calLine2Pos.x} ${calLine2Pos.y})`}
                    fill={caliperColor}
                    fontSize={11}
                    fontWeight={600}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity={0}
                    style={{ animation: "quickFadeIn 0.3s ease-out 0.5s both" }}
                  >
                    negative — points opposite {ontoLabel}
                  </text>
                )}
              </g>
            )}
          </svg>

          <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", gap: 7 }}>
            <ZoomBtn label="+" ariaLabel="Zoom in" onClick={() => handleZoom(0.8)} />
            <ZoomBtn label="−" ariaLabel="Zoom out" onClick={() => handleZoom(1.25)} />
            <ZoomBtn label="⤢" ariaLabel="Autofit" onClick={handleAutofit} />
          </div>
        </div>

        {/* ---------------- SIDEBAR ---------------- */}
        <div style={{ flex: "1 1 340px", minWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <NumberInput label={<span><Vec>a</Vec><sub>x</sub> =</span>} value={a.x} onChange={handleInputChange("a")("x")} />
            <NumberInput label={<span><Vec>a</Vec><sub>y</sub> =</span>} value={a.y} onChange={handleInputChange("a")("y")} />
            <NumberInput label={<span><Vec>b</Vec><sub>x</sub> =</span>} value={b.x} onChange={handleInputChange("b")("x")} />
            <NumberInput label={<span><Vec>b</Vec><sub>y</sub> =</span>} value={b.y} onChange={handleInputChange("b")("y")} />
          </div>
          {aIsZero && (
            <div style={{ color: COLORS.red, fontSize: 12.5, fontWeight: 600, paddingLeft: 4, marginTop: -4 }}>
              a can't be the zero vector — projection divides by |a| or |b|.
            </div>
          )}
          {bIsZero && (
            <div style={{ color: COLORS.red, fontSize: 12.5, fontWeight: 600, paddingLeft: 4, marginTop: -4 }}>
              b can't be the zero vector — projection divides by |b|.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", gap: 10, padding: "8px 4px" }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Show Projection</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SwitchDot on={showProjection} onClick={handleToggleProjection} />
              {showProjection ? (
                <div
                  onClick={handleSwap}
                  role="button"
                  aria-label="Swap projection direction"
                  title="⇄ swaps which vector is projected onto the other"
                  className="icon-btn"
                >
                  ⇄
                </div>
              ) : (
                <div style={{ width: 30, height: 30, visibility: "hidden", flexShrink: 0 }} />
              )}
            </div>
          </div>

          {showProjection && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", gap: 10, padding: "2px 4px" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Show Component</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SwitchDot on={showComponent} onClick={handleToggleComponent} />
                {showComponent ? (
                  <div
                    onClick={handleRemeasure}
                    role="button"
                    aria-label="Remeasure"
                    title="↻ redraws the component length"
                    className="icon-btn"
                  >
                    ↻
                  </div>
                ) : (
                  <div style={{ width: 30, height: 30, visibility: "hidden", flexShrink: 0 }} />
                )}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ReadoutCard eyebrow="Angle">
              <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.accent }}>{fmt(angle.deg, 1)}°</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.muted, marginTop: 2 }}>{fmt(angle.rad, 3)} rad</div>
            </ReadoutCard>
            <ReadoutCard eyebrow={<span><Vec>a</Vec> · <Vec>b</Vec></span>}>
              <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.accent }}>{fmt(dotVal)}</div>
            </ReadoutCard>

            {showProjection && !Number.isNaN(proj.x) && (
              <div
                style={{
                  gridColumn: showComponent ? "span 1" : "span 2",
                  background: "white",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 18,
                  padding: "12px 16px",
                  textAlign: "center",
                  transition: "grid-column 0.6s ease",
                }}
              >
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", color: COLORS.eyebrow, fontWeight: 700, marginBottom: 6, whiteSpace: "nowrap" }}>
                  proj<sub><Vec>{ontoLabel}</Vec></sub>(<Vec>{fromLabel}</Vec>)
                </div>
                <div style={{ fontSize: showComponent ? 17 : 21, fontWeight: 700, color: COLORS.proj, whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: "1.35em", fontWeight: 800 }}>⟨</span>
                  {fmt(proj.x)}, {fmt(proj.y)}
                  <span style={{ fontSize: "1.35em", fontWeight: 800 }}>⟩</span>
                </div>
              </div>
            )}

            {showComponent && !Number.isNaN(comp) && (
              <div style={{ background: "white", border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: "12px 10px", textAlign: "center", overflow: "hidden" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: COLORS.eyebrow, whiteSpace: "nowrap" }}>
                  comp<sub><Vec>{ontoLabel}</Vec></sub>(<Vec>{fromLabel}</Vec>)=&#8214;proj<sub><Vec>{ontoLabel}</Vec></sub>(<Vec>{fromLabel}</Vec>)&#8214;
                </div>
                <div style={{ fontSize: 21, fontWeight: 700, color: caliperColor }}>{fmt(comp)}</div>
              </div>
            )}
          </div>

          <DerivationPanel
            a={a}
            b={b}
            dotVal={dotVal}
            proj={proj}
            comp={comp}
            caliperColor={caliperColor}
            showProjection={showProjection}
            showComponent={showComponent}
            fromLabel={fromLabel}
            ontoLabel={ontoLabel}
            fromVec={fromVec}
            ontoVec={ontoVec}
          />
        </div>
      </div>
        </div>
      </div>
      <PageCredit />
    </div>
  );
}

// Matches the canonical gradient-banner spec documented at the bottom of
// Applets/shared/applet-header.css, hand-matched here since each applet's banner lives in its own
// JSX -- same values Quadric Surfaces' and Partial Derivatives' banners use. "All Applets" lives
// inline on the banner's left; the decorative curve carries over from the old topline+banner pair.
function Banner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 28px",
        background: "linear-gradient(135deg, #3B4FC2, #4A5CD6)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 1200 130"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.14, pointerEvents: "none" }}
      >
        <path d="M0 95 C 200 15, 340 120, 560 45 S 900 5, 1200 75" stroke="white" strokeWidth="2.5" fill="none" />
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
        <a
          href="../../../browse.html#/applets"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            color: "rgba(255,255,255,0.88)",
            textDecoration: "none",
            fontSize: 12.5,
            fontWeight: 600,
            whiteSpace: "nowrap",
            padding: "6px 10px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.12)",
          }}
        >
          ← All Applets
        </a>
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.22)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.65)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Calculus III · Unit 1
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.005em" }}>
            Dot Product &amp; Projections
          </div>
        </div>
      </div>
    </div>
  );
}

// Page-level brand credit, centered below the app card (see the "final header direction" note in
// Applets/shared/applet-header.css) -- lives here rather than inside Banner() since it belongs to
// the whole page, not specifically to the banner or the card. marginTop:"auto" on its wrapper usage
// above pins it to the bottom of the outer flex column when there's leftover vertical space, and
// lets it fall in normal flow right after the card (never disappearing) when the app's own content
// is tall enough to fill the viewport on its own.
function PageCredit() {
  return (
    <div
      style={{
        marginTop: "auto",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 11,
        padding: "18px 20px 26px",
        fontSize: 13.5,
        color: COLORS.muted,
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#FFFFFF",
          border: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <img src="../../../assets/favicon.svg" alt="" width="28" height="28" />
      </span>
      Professor Kyle Knee · Harper College Mathematics
    </div>
  );
}

function ZoomBtn({ label, ariaLabel, onClick }) {
  return (
    <div
      onClick={onClick}
      role="button"
      aria-label={ariaLabel}
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: `1px solid ${COLORS.border}`,
        background: "white",
        color: COLORS.muted,
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {label}
    </div>
  );
}

function ReadoutCard({ eyebrow, children }) {
  return (
    <div style={{ background: "white", border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: "12px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.03em", color: COLORS.eyebrow, fontWeight: 700, marginBottom: 6 }}>
        {eyebrow}
      </div>
      {children}
    </div>
  );
}

function DerivationPanel({ a, b, dotVal, proj, comp, caliperColor, showProjection, showComponent, fromLabel, ontoLabel, fromVec, ontoVec }) {
  const [open, setOpen] = useState(true);
  const nOnto2 = ontoVec.x * ontoVec.x + ontoVec.y * ontoVec.y;
  return (
    <div style={{ marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 14 }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Formulas &amp; Derivation</div>
        <div style={{ color: COLORS.muted, fontSize: 14 }}>{open ? "▾" : "▸"}</div>
      </div>
      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: COLORS.accent }}>
            <span style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: COLORS.eyebrow, fontWeight: 700, marginBottom: 3 }}>
              Dot Product
            </span>
            <Vec>a</Vec> · <Vec>b</Vec> = &#8214;<Vec>a</Vec>&#8214;&#8214;<Vec>b</Vec>&#8214;cos(θ) = ({fmt(a.x)})({fmt(b.x)}) + ({fmt(a.y)})({fmt(b.y)}) = {fmt(dotVal)}
          </div>
          {showProjection && (
            <div style={{ fontSize: 14, lineHeight: 1.5, color: COLORS.proj }}>
              <span style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: COLORS.eyebrow, fontWeight: 700, marginBottom: 3 }}>
                Vector Projection
              </span>
              proj<sub><Vec>{ontoLabel}</Vec></sub>(<Vec>{fromLabel}</Vec>) = (<Vec>{fromLabel}</Vec> · <Vec>{ontoLabel}</Vec> / &#8214;<Vec>{ontoLabel}</Vec>&#8214;<sup>2</sup>) <Vec>{ontoLabel}</Vec> = ({fmt(dotVal)} / {fmt(nOnto2)})⟨{fmt(ontoVec.x)}, {fmt(ontoVec.y)}⟩ = ⟨{fmt(proj.x)}, {fmt(proj.y)}⟩
            </div>
          )}
          {showComponent && (
            <div style={{ fontSize: 14, lineHeight: 1.5, color: caliperColor }}>
              <span style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: COLORS.eyebrow, fontWeight: 700, marginBottom: 3 }}>
                Scalar Component
              </span>
              comp<sub><Vec>{ontoLabel}</Vec></sub>(<Vec>{fromLabel}</Vec>) = (<Vec>{fromLabel}</Vec> · <Vec>{ontoLabel}</Vec>) / &#8214;<Vec>{ontoLabel}</Vec>&#8214; = {fmt(dotVal)} / {fmt(len(ontoVec))} = &#8214;proj<sub><Vec>{ontoLabel}</Vec></sub>(<Vec>{fromLabel}</Vec>)&#8214; = {fmt(comp)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
