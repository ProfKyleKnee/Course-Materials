import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import * as math from "mathjs";

const PRESETS = [
  { label: "x²/4 + 1", expr: "x^2/4 + 1" },
  { label: "sin(x) + 2", expr: "sin(x) + 2" },
  { label: "0.15x³ − x² + 2", expr: "0.15*x^3 - x^2 + 2" },
  { label: "√x + 1", expr: "sqrt(x) + 1" },
  { label: "4 − 0.3x²", expr: "4 - 0.3*x^2" },
];

const ENDPOINTS = [
  { key: "left", label: "Left endpoint", t: 0 },
  { key: "mid", label: "Midpoint", t: 0.5 },
  { key: "right", label: "Right endpoint", t: 1 },
];

const SAMPLE_COLOR = "#3B4FC2";
const TRAP_COLOR = "#6478D6";
const SIMPSON_COLOR = "#3B4FC2";
const HANDLE_COLOR = "#3B4FC2";

const SIMPSON_MAX_N = 20;

const W = 860;
const H = 420;
const MARGIN = { top: 28, right: 28, bottom: 48, left: 56 };
const PLOT_W = W - MARGIN.left - MARGIN.right;
const PLOT_H = H - MARGIN.top - MARGIN.bottom;

function safeEval(compiled, x) {
  try {
    const v = compiled.evaluate({ x });
    return typeof v === "number" && isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

// Rounds to the nearest even integer within [min, max] — used to keep the
// rectangle count valid for Simpson's Rule, which requires an even n.
function clampToEvenRange(n, min, max) {
  let v = Math.round(n / 2) * 2;
  return Math.max(min, Math.min(max, v));
}

function computeDefaultView(compiled, aVal, bVal) {
  const lo = Math.min(aVal, bVal);
  const hi = Math.max(aVal, bVal);
  const xPad = (hi - lo) * 0.15 || 1;
  const xMin = lo - xPad;
  const xMax = hi + xPad;
  let loY = Infinity, hiY = -Infinity;
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + ((xMax - xMin) * i) / steps;
    const y = safeEval(compiled, x);
    if (y !== null) {
      if (y < loY) loY = y;
      if (y > hiY) hiY = y;
    }
  }
  if (!isFinite(loY) || !isFinite(hiY)) { loY = -1; hiY = 1; }
  loY = Math.min(loY, 0);
  hiY = Math.max(hiY, 0);
  const yPad = (hiY - loY) * 0.15 || 1;
  return { xMin, xMax, yMin: loY - yPad, yMax: hiY + yPad };
}

// Quadratic through 3 equally-spaced points (x0,y0),(x1,y1),(x2,y2), evaluated
// at parameter u in [-1,1] where u=-1 -> x0, u=0 -> x1, u=1 -> x2.
function simpsonQuadratic(y0, y1, y2, u) {
  return y1 + ((y2 - y0) / 2) * u + ((y2 - 2 * y1 + y0) / 2) * u * u;
}

export default function RiemannSumApplet() {
  const [exprInput, setExprInput] = useState("x^2/4 + 1");
  const [a, setA] = useState(0);
  const [b, setB] = useState(6);
  const [n, setN] = useState(8);
  const [technique, setTechnique] = useState("rect"); // "rect" | "trap" | "simpson"
  const [mode, setMode] = useState("sample"); // "sample" | "random" — only meaningful when technique === "rect"
  const [t, setT] = useState(0);
  const [randomTs, setRandomTs] = useState(() => Array.from({ length: 8 }, () => Math.random()));
  const [showExact, setShowExact] = useState(true);
  const [parseError, setParseError] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [bWarning, setBWarning] = useState(false);
  const [view, setView] = useState(() => {
    try {
      return computeDefaultView(math.compile("x^2/4 + 1"), 0, 6);
    } catch {
      return { xMin: -1, xMax: 7, yMin: -1, yMax: 5 };
    }
  });

  const svgRef = useRef(null);
  const aRef = useRef(a);
  const bRef = useRef(b);
  aRef.current = a;
  bRef.current = b;

  const compiled = useMemo(() => {
    try {
      const c = math.compile(exprInput);
      c.evaluate({ x: 1 });
      setParseError(null);
      return c;
    } catch (e) {
      setParseError("Can't parse that function. Try things like x^2, sin(x)+2, sqrt(x)+1.");
      return null;
    }
  }, [exprInput]);

  // Axes only reset when the function itself changes — not when a/b move.
  useEffect(() => {
    if (!compiled) return;
    setView(computeDefaultView(compiled, aRef.current, bRef.current));
  }, [compiled]);

  // The random-sample array has to match the current rectangle count, so
  // regenerate it whenever n changes (this is a side effect of needing the
  // right length, not a deliberate "reroll on n change" design choice).
  useEffect(() => {
    setRandomTs(Array.from({ length: n }, () => Math.random()));
  }, [n]);

  const reshuffle = () => setRandomTs(Array.from({ length: n }, () => Math.random()));

  const selectTechnique = (tech) => {
    setTechnique(tech);
    if (tech === "simpson") setN((cur) => clampToEvenRange(cur, 2, SIMPSON_MAX_N));
  };

  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const dx = (hi - lo) / n;

  const scaleX = (x) => MARGIN.left + ((x - view.xMin) / (view.xMax - view.xMin)) * PLOT_W;
  const scaleY = (y) => MARGIN.top + PLOT_H - ((y - view.yMin) / (view.yMax - view.yMin)) * PLOT_H;
  const unscaleX = (px) => view.xMin + ((px - MARGIN.left) / PLOT_W) * (view.xMax - view.xMin);

  const curvePoints = useMemo(() => {
    if (!compiled) return [];
    const pts = [];
    const steps = 240;
    for (let i = 0; i <= steps; i++) {
      const x = view.xMin + ((view.xMax - view.xMin) * i) / steps;
      const y = safeEval(compiled, x);
      if (y !== null) pts.push([x, y]);
    }
    return pts;
  }, [compiled, view.xMin, view.xMax]);

  const curvePath = useMemo(() => {
    if (curvePoints.length === 0) return "";
    let d = "";
    let pen = false;
    for (const [x, y] of curvePoints) {
      const px = scaleX(x), py = scaleY(y);
      if (!pen) { d += `M ${px} ${py} `; pen = true; }
      else d += `L ${px} ${py} `;
    }
    return d;
  }, [curvePoints, view]);

  const { shapes, sum, exact } = useMemo(() => {
    if (!compiled) return { shapes: [], sum: 0, exact: 0 };
    const shapeList = [];
    let total = 0;

    if (technique === "trap") {
      for (let i = 0; i < n; i++) {
        const x0 = lo + i * dx;
        const x1 = x0 + dx;
        const y0 = safeEval(compiled, x0);
        const y1 = safeEval(compiled, x1);
        if (y0 === null || y1 === null) continue;
        total += (dx * (y0 + y1)) / 2;
        shapeList.push({ type: "trap", x0, x1, y0, y1 });
      }
    } else if (technique === "simpson") {
      const pairs = Math.floor(n / 2);
      for (let j = 0; j < pairs; j++) {
        const x0 = lo + 2 * j * dx;
        const x1 = x0 + dx;
        const x2 = x0 + 2 * dx;
        const y0 = safeEval(compiled, x0);
        const y1 = safeEval(compiled, x1);
        const y2 = safeEval(compiled, x2);
        if (y0 === null || y1 === null || y2 === null) continue;
        total += (dx / 3) * (y0 + 4 * y1 + y2);
        shapeList.push({ type: "simpson", x0, x1, x2, y0, y1, y2, idx: j });
      }
    } else {
      for (let i = 0; i < n; i++) {
        const x0 = lo + i * dx;
        const x1 = x0 + dx;
        const tVal = mode === "random" ? (randomTs[i] ?? Math.random()) : t;
        const sampleX = x0 + tVal * dx;
        const h = safeEval(compiled, sampleX);
        if (h === null) continue;
        total += dx * h;
        shapeList.push({ type: "rect", x0, x1, h, sampleX });
      }
    }

    let exactVal = 0;
    const fine = 2000;
    const fdx = (hi - lo) / fine;
    for (let i = 0; i < fine; i++) {
      const xm = lo + (i + 0.5) * fdx;
      const ym = safeEval(compiled, xm);
      if (ym !== null) exactVal += ym * fdx;
    }
    return { shapes: shapeList, sum: total, exact: exactVal };
  }, [compiled, lo, hi, n, dx, technique, mode, t, randomTs]);

  const shapeColor = technique === "trap" ? TRAP_COLOR : technique === "simpson" ? SIMPSON_COLOR : SAMPLE_COLOR;
  const sumLabel =
    technique === "trap" ? "Trapezoid sum"
    : technique === "simpson" ? "Simpson's Rule sum"
    : mode === "random" ? "Random sample sum"
    : Math.abs(t - 0) < 0.005 ? "Left endpoint sum"
    : Math.abs(t - 1) < 0.005 ? "Right endpoint sum"
    : Math.abs(t - 0.5) < 0.005 ? "Midpoint sum"
    : `Sample sum (t = ${t.toFixed(2)})`;
  const countLabel = technique === "trap" ? "Trapezoids" : technique === "simpson" ? "Subintervals" : "Rectangles";
  const error = Math.abs(sum - exact);

  const handlePointerMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let dataX = round2(unscaleX(svgX));
    dataX = Math.max(view.xMin, Math.min(view.xMax, dataX)); // clamp to current visible window
    if (dragging === "a") {
      dataX = Math.min(dataX, b); // a can't cross b
      setA(dataX);
    } else {
      dataX = Math.max(dataX, a); // b can't cross a
      setB(dataX);
    }
  }, [dragging, view, a, b]);

  const handlePointerUp = useCallback(() => setDragging(null), []);

  const zoom = (factor) => {
    setView((v) => {
      const cx = (v.xMin + v.xMax) / 2;
      const cy = (v.yMin + v.yMax) / 2;
      const hw = ((v.xMax - v.xMin) / 2) * factor;
      const hh = ((v.yMax - v.yMin) / 2) * factor;
      return { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh };
    });
  };

  const autofit = () => {
    if (!compiled) return;
    setView(computeDefaultView(compiled, a, b));
  };

  // Called when a or b is typed directly. If the new value falls outside
  // the current view, extend that side of the x-axis to include it (with
  // one extra unit of buffer), and recompute the y-axis to fit the curve
  // over the new domain.
  const extendViewForX = (val) => {
    setView((v) => {
      let { xMin, xMax } = v;
      let changed = false;
      if (val < xMin) { xMin = val - 1; changed = true; }
      if (val > xMax) { xMax = val + 1; changed = true; }
      if (!changed) return v;
      if (!compiled) return { ...v, xMin, xMax };
      let loY = Infinity, hiY = -Infinity;
      const steps = 100;
      for (let i = 0; i <= steps; i++) {
        const x = xMin + ((xMax - xMin) * i) / steps;
        const y = safeEval(compiled, x);
        if (y !== null) {
          if (y < loY) loY = y;
          if (y > hiY) hiY = y;
        }
      }
      if (!isFinite(loY) || !isFinite(hiY)) { loY = v.yMin; hiY = v.yMax; }
      loY = Math.min(loY, 0);
      hiY = Math.max(hiY, 0);
      const yPad = (hiY - loY) * 0.15 || 1;
      return { xMin, xMax, yMin: loY - yPad, yMax: hiY + yPad };
    });
  };

  const handleSetA = (val) => { const clamped = Math.min(val, b); setA(clamped); extendViewForX(clamped); };
  const handleSetB = (val) => {
    setBWarning(val < a);
    const clamped = Math.max(val, a);
    setB(clamped);
    extendViewForX(clamped);
  };

  const nMin = technique === "simpson" ? 2 : 1;
  const nMax = technique === "simpson" ? SIMPSON_MAX_N : 100;
  const nStep = technique === "simpson" ? 2 : 1;

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
        background: "#E8E8F2",
        height: "100%",
        padding: "24px 24px 0",
        color: "#3A3A3C",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          maxWidth: 1200, width: "100%", margin: "0 auto", borderRadius: 20,
          boxShadow: "0 4px 24px rgba(60,60,90,0.14)", overflow: "hidden", flexShrink: 0,
          background: "#FFFFFF", display: "flex", flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "relative", overflow: "hidden", display: "flex", alignItems: "center",
            gap: 16, padding: "16px 28px", flexShrink: 0,
            background: "linear-gradient(135deg, #3B4FC2, #4A5CD6)",
          }}
        >
          <svg
            viewBox="0 0 1200 130" preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.14, pointerEvents: "none" }}
          >
            <path d="M0 95 C 200 15, 340 120, 560 45 S 900 5, 1200 75" stroke="white" strokeWidth="2.5" fill="none" />
          </svg>
          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
            <a
              href="../../../browse.html#/applets"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.88)",
                textDecoration: "none", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap",
                padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.12)",
              }}
            >
              ← All Applets
            </a>
            <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.22)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Calculus I · Unit 4<span style={{ margin: "0 10px", opacity: 0.6 }}>/</span>Calculus II · Unit 2
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.005em" }}>Riemann Sum Approximation</h1>
            </div>
          </div>
        </div>
        <div style={{ background: "#F5F5FA", padding: "20px 28px 24px" }}>
      <style>{`
        .rsa-slider { -webkit-appearance: none; height: 4px; border-radius: 2px; background: #DCDCF0; outline: none; accent-color: #3B4FC2; }
        .rsa-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #3B4FC2; cursor: pointer; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .rsa-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #3B4FC2; cursor: pointer; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .rsa-btn { transition: all 0.15s ease; cursor: pointer; }
        .rsa-input:focus, .rsa-btn:focus-visible { outline: 2px solid #3B4FC2; outline-offset: 2px; }
        .rsa-num { font-variant-numeric: tabular-nums; }
        .rsa-handle { cursor: ew-resize; touch-action: none; }
        .rsa-zoom-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #DCDCF0; background: rgba(255,255,255,0.95); color: #3B4FC2; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(60,60,90,0.1); }
        .rsa-zoom-btn:hover { background: #EFEFFA; }
        .rsa-tech-btn { transition: all 0.15s ease; cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ fontSize: 12, color: "#8A8AA3", marginBottom: 14 }}>
          Drag the a and b markers on the axis to adjust the interval.
        </div>

        <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 20, padding: 14, boxShadow: "0 1px 3px rgba(60,60,90,0.08)" }}>
          <div style={{ position: "absolute", top: 22, right: 22, display: "flex", flexDirection: "column", gap: 6, zIndex: 2 }}>
            <button className="rsa-zoom-btn" onClick={() => zoom(0.8)} aria-label="Zoom in">+</button>
            <button className="rsa-zoom-btn" onClick={() => zoom(1.25)} aria-label="Zoom out">−</button>
            <button className="rsa-zoom-btn" onClick={autofit} aria-label="Autofit view" title="Autofit to a, b" style={{ fontSize: 12 }}>⤢</button>
          </div>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            style={{ display: "block" }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {Array.from({ length: 13 }).map((_, i) => {
              const x = view.xMin + ((view.xMax - view.xMin) * i) / 12;
              return (
                <line key={`gx${i}`} x1={scaleX(x)} y1={MARGIN.top} x2={scaleX(x)} y2={MARGIN.top + PLOT_H}
                  stroke="rgba(123,140,222,0.08)" strokeWidth="1" />
              );
            })}
            {Array.from({ length: 9 }).map((_, i) => {
              const y = view.yMin + ((view.yMax - view.yMin) * i) / 8;
              return (
                <line key={`gy${i}`} x1={MARGIN.left} y1={scaleY(y)} x2={MARGIN.left + PLOT_W} y2={scaleY(y)}
                  stroke="rgba(123,140,222,0.08)" strokeWidth="1" />
              );
            })}
            <line x1={MARGIN.left} y1={scaleY(0)} x2={MARGIN.left + PLOT_W} y2={scaleY(0)} stroke="#C7CCE8" strokeWidth="1.5" />
            <line x1={scaleX(0)} y1={MARGIN.top} x2={scaleX(0)} y2={MARGIN.top + PLOT_H} stroke="#C7CCE8" strokeWidth="1.5" />

            {technique === "simpson" && shapes.map((s, i) => {
              const steps = 16;
              let d = `M ${scaleX(s.x0)} ${scaleY(0)} L ${scaleX(s.x0)} ${scaleY(s.y0)} `;
              for (let k = 1; k <= steps; k++) {
                const u = -1 + (2 * k) / steps;
                const x = s.x1 + u * dx;
                const y = simpsonQuadratic(s.y0, s.y1, s.y2, u);
                d += `L ${scaleX(x)} ${scaleY(y)} `;
              }
              d += `L ${scaleX(s.x2)} ${scaleY(0)} Z`;
              const opacity = s.idx % 2 === 0 ? 0.15 : 0.50;
              return (
                <path key={i} d={d} fill={SIMPSON_COLOR} fillOpacity={opacity} stroke={SIMPSON_COLOR} strokeOpacity="0.6" strokeWidth="1" />
              );
            })}

            {technique === "simpson" && shapes.slice(1).map((s, i) => (
              <g key={`simpb${i}`}>
                <line x1={scaleX(s.x0)} y1={MARGIN.top} x2={scaleX(s.x0)} y2={MARGIN.top + PLOT_H}
                  stroke="#3A3A3C" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
                <circle cx={scaleX(s.x0)} cy={scaleY(s.y0)} r="4" fill="#3A3A3C" />
              </g>
            ))}

            {technique === "trap" && shapes.map((s, i) => {
              const p1 = [scaleX(s.x0), scaleY(0)];
              const p2 = [scaleX(s.x0), scaleY(s.y0)];
              const p3 = [scaleX(s.x1), scaleY(s.y1)];
              const p4 = [scaleX(s.x1), scaleY(0)];
              const d = `M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]} L ${p4[0]} ${p4[1]} Z`;
              return <path key={i} d={d} fill={shapeColor} fillOpacity="0.35" stroke={shapeColor} strokeWidth="1" />;
            })}

            {technique === "rect" && shapes.map((s, i) => {
              const yTop = Math.max(s.h, 0);
              const yBot = Math.min(s.h, 0);
              const px0 = scaleX(s.x0), px1 = scaleX(s.x1);
              const py = scaleY(yTop), pyBase = scaleY(yBot);
              return (
                <rect key={i} x={Math.min(px0, px1)} y={py} width={Math.abs(px1 - px0)} height={Math.max(pyBase - py, 0)}
                  fill={shapeColor} fillOpacity="0.35" stroke={shapeColor} strokeWidth="1" />
              );
            })}

            <path d={curvePath} fill="none" stroke="#3A3A3C" strokeWidth="2.5" />

            {technique === "rect" && shapes.map((s, i) => (
              <line key={`m${i}`} x1={scaleX(s.sampleX)} y1={scaleY(0)} x2={scaleX(s.sampleX)} y2={scaleY(s.h)}
                stroke="#3A3A3C" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.4" />
            ))}

            {Array.from({ length: 7 }).map((_, i) => {
              const x = view.xMin + ((view.xMax - view.xMin) * i) / 6;
              return (
                <text key={`tx${i}`} x={scaleX(x)} y={MARGIN.top + PLOT_H + 20} fontSize="11" fill="#8A8AA3"
                  fontFamily="-apple-system, sans-serif" textAnchor="middle">
                  {x.toFixed(1)}
                </text>
              );
            })}

            <g
              className="rsa-handle"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging("a"); }}
            >
              <circle cx={scaleX(a)} cy={scaleY(0)} r="14" fill="transparent" />
              <circle cx={scaleX(a)} cy={scaleY(0)} r="7" fill={HANDLE_COLOR} stroke="#FFFFFF" strokeWidth="2" />
              <text x={scaleX(a)} y={scaleY(0) - 16} fontSize="13" fontWeight="600" fill={HANDLE_COLOR} textAnchor="middle">a</text>
            </g>
            <g
              className="rsa-handle"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging("b"); }}
            >
              <circle cx={scaleX(b)} cy={scaleY(0)} r="14" fill="transparent" />
              <circle cx={scaleX(b)} cy={scaleY(0)} r="7" fill={HANDLE_COLOR} stroke="#FFFFFF" strokeWidth="2" />
              <text x={scaleX(b)} y={scaleY(0) - 16} fontSize="13" fontWeight="600" fill={HANDLE_COLOR} textAnchor="middle">b</text>
            </g>
          </svg>
        </div>

        {parseError && (
          <div style={{ marginTop: 10, color: "#C77B94", fontSize: 13 }}>
            {parseError}
          </div>
        )}

        <div style={{ display: "flex", gap: 14, marginTop: 12, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Readout label={sumLabel} value={sum.toFixed(4)} color={shapeColor} />
            {showExact && <Readout label="Exact integral" value={exact.toFixed(4)} color="#3A3A3C" />}
            {showExact && <Readout label="Error" value={error.toFixed(4)} color="#8A8AA3" />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <div style={{ fontSize: 10, letterSpacing: 1, color: "#8A8AA3", textTransform: "uppercase", fontWeight: 600 }}>
              Interval
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <AxisBox label="a" value={a} onChange={handleSetA} />
              <AxisBox label="b" value={b} onChange={handleSetB} />
            </div>
            {bWarning && (
              <div style={{ fontSize: 11, color: "#C77B94", maxWidth: 190, textAlign: "right" }}>
                b can't be less than a — the interval and rectangles won't show.
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={{ gridColumn: 1, gridRow: 1 }}>
            <Label>Function</Label>
            <div style={{ display: "flex", alignItems: "stretch", width: "100%" }}>
              <div
                style={{
                  display: "flex", alignItems: "center", padding: "0 14px",
                  background: "#EFEFFA", border: "1px solid #DCDCF0", borderRight: "none",
                  borderRadius: "20px 0 0 20px", color: "#3B4FC2",
                  fontSize: 14, fontWeight: 600, whiteSpace: "nowrap",
                }}
              >
                f(x) =
              </div>
              <input
                className="rsa-input"
                value={exprInput}
                onChange={(e) => setExprInput(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box", background: "#FFFFFF", border: "1px solid #DCDCF0",
                  borderRadius: "0 20px 20px 0", padding: "10px 16px", color: "#3A3A3C",
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  className="rsa-btn"
                  onClick={() => setExprInput(p.expr)}
                  style={{
                    background: exprInput === p.expr ? "#3B4FC2" : "#FFFFFF",
                    color: exprInput === p.expr ? "#FFFFFF" : "#6E6E86",
                    border: "1px solid #DCDCF0", borderRadius: 20, padding: "5px 12px", fontSize: 12,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: 2, gridRow: 1 }}>
            <Label>Method</Label>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                className="rsa-tech-btn"
                onClick={() => selectTechnique("rect")}
                style={{
                  background: technique === "rect" ? SAMPLE_COLOR : "#FFFFFF",
                  color: technique === "rect" ? "#FFFFFF" : "#6E6E86",
                  border: `1px solid ${technique === "rect" ? SAMPLE_COLOR : "#DCDCF0"}`, borderRadius: 20, padding: "7px 14px", fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Rectangles
              </button>
              <button
                className="rsa-tech-btn"
                onClick={() => selectTechnique("trap")}
                style={{
                  background: technique === "trap" ? TRAP_COLOR : "#FFFFFF",
                  color: technique === "trap" ? "#FFFFFF" : "#6E6E86",
                  border: `1px solid ${technique === "trap" ? TRAP_COLOR : "#DCDCF0"}`, borderRadius: 20, padding: "7px 14px", fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Trapezoid
              </button>
              <button
                className="rsa-tech-btn"
                onClick={() => selectTechnique("simpson")}
                style={{
                  background: technique === "simpson" ? SIMPSON_COLOR : "#FFFFFF",
                  color: technique === "simpson" ? "#FFFFFF" : "#6E6E86",
                  border: `1px solid ${technique === "simpson" ? SIMPSON_COLOR : "#DCDCF0"}`, borderRadius: 20, padding: "7px 14px", fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Simpson's Rule
              </button>
            </div>

            {technique === "rect" && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {ENDPOINTS.map((p) => {
                  const active = mode === "sample" && Math.abs(t - p.t) < 0.005;
                  return (
                    <button
                      key={p.key}
                      className="rsa-btn"
                      onClick={() => { setMode("sample"); setT(p.t); }}
                      style={{
                        background: active ? SAMPLE_COLOR : "#FFFFFF",
                        color: active ? "#FFFFFF" : "#6E6E86",
                        border: `1px solid ${active ? SAMPLE_COLOR : "#DCDCF0"}`, borderRadius: 20, padding: "6px 12px", fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
                <button
                  className="rsa-btn"
                  onClick={() => { setMode("random"); reshuffle(); }}
                  style={{
                    background: mode === "random" ? SAMPLE_COLOR : "#FFFFFF",
                    color: mode === "random" ? "#FFFFFF" : "#6E6E86",
                    border: `1px solid ${mode === "random" ? SAMPLE_COLOR : "#DCDCF0"}`, borderRadius: 20, padding: "6px 12px", fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Random
                </button>
              </div>
            )}

            {technique === "rect" && (mode === "sample" || mode === "random") && (
              <div style={{ marginTop: 16 }}>
                <input
                  className="rsa-slider"
                  type="range" min="0" max="1" step="0.01" value={t}
                  onChange={(e) => {
                    setT(parseFloat(e.target.value));
                    if (mode === "random") reshuffle();
                  }}
                  style={{ width: "100%" }}
                />
                <div className="rsa-num" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A8AA3", marginTop: 4 }}>
                  {mode === "random" ? (
                    <span style={{ margin: "0 auto" }}>drag to reshuffle each rectangle's sample point</span>
                  ) : (
                    <>
                      <span>left</span>
                      <span>t = {t.toFixed(2)}</span>
                      <span>right</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ gridColumn: 1, gridRow: 2, alignSelf: "end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6E6E86", cursor: "pointer" }}>
              <input type="checkbox" checked={showExact} onChange={(e) => setShowExact(e.target.checked)} />
              Show exact integral and error
            </label>
          </div>

          <div style={{ gridColumn: 2 }}>
            <Label>{countLabel}: {n}</Label>
            <input
              className="rsa-slider"
              type="range" min={nMin} max={nMax} step={nStep} value={n}
              onChange={(e) => setN(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
            {technique === "simpson" && (
              <div style={{ fontSize: 11, color: "#8A8AA3", marginTop: 4 }}>
                Simpson's Rule requires an even number of subintervals — kept even automatically here.
              </div>
            )}
          </div>
        </div>
      </div>
        </div>
      </div>
      <PageCredit />
    </div>
  );
}

function PageCredit() {
  return (
    <div
      style={{
        marginTop: "auto", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 11, padding: "18px 20px 26px", fontSize: 13.5, color: "#8A8AA3",
      }}
    >
      <span style={{
        width: 40, height: 40, borderRadius: "50%", background: "#FFFFFF", border: "1px solid #DCDCF0",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <img src="../../../assets/favicon.svg" alt="" width="28" height="28" />
      </span>
      Professor Kyle Knee · Harper College Mathematics
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: 1, color: "#8A8AA3", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function NumBox({ value, onChange }) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <input
      className="rsa-input rsa-num"
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={() => { focused.current = true; }}
      onBlur={() => {
        focused.current = false;
        const parsed = parseFloat(text);
        if (isFinite(parsed)) { onChange(parsed); setText(String(parsed)); }
        else setText(String(value));
      }}
      onChange={(e) => {
        const v = e.target.value;
        if (!/^-?\d*\.?\d*$/.test(v)) return; // ignore invalid characters
        setText(v);
        const parsed = parseFloat(v);
        if (isFinite(parsed)) onChange(parsed);
      }}
      style={{
        width: 84, background: "#FFFFFF", border: "1px solid #DCDCF0", borderRadius: 20,
        padding: "8px 14px", color: "#3A3A3C", fontSize: 14,
      }}
    />
  );
}

function AxisBox({ label, value, onChange }) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <div
        style={{
          display: "flex", alignItems: "center", padding: "0 8px",
          background: "#EFEFFA", border: "1px solid #DCDCF0", borderRight: "none",
          borderRadius: "18px 0 0 18px", color: "#3B4FC2",
          fontSize: 12, fontWeight: 600,
        }}
      >
        {label} =
      </div>
      <input
        className="rsa-input rsa-num"
        type="text"
        inputMode="decimal"
        value={text}
        onFocus={() => { focused.current = true; }}
        onBlur={() => {
          focused.current = false;
          const parsed = parseFloat(text);
          if (isFinite(parsed)) { onChange(parsed); setText(String(parsed)); }
          else setText(String(value));
        }}
        onChange={(e) => {
          const v = e.target.value;
          if (!/^-?\d*\.?\d*$/.test(v)) return;
          setText(v);
          const parsed = parseFloat(v);
          if (isFinite(parsed)) onChange(parsed);
        }}
        style={{
          width: 56, background: "#FFFFFF", border: "1px solid #DCDCF0",
          borderRadius: "0 18px 18px 0", padding: "6px 10px", color: "#3A3A3C", fontSize: 13,
        }}
      />
    </div>
  );
}

function Readout({ label, value, color }) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "12px 18px", minWidth: 150, boxShadow: "0 1px 3px rgba(60,60,90,0.06)" }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: "#8A8AA3", textTransform: "uppercase", fontWeight: 600 }}>
        {label}
      </div>
      <div className="rsa-num" style={{ fontSize: 22, fontWeight: 600, color }}>
        {value}
      </div>
    </div>
  );
}
