const { useState, useRef, useEffect } = React;
const COLORS = [
  "#3B4FC2",
  "#E0785A",
  "#3FAFA0",
  "#D9A441",
  "#8B5FBF",
  "#5B8C5A",
];
const NEUTRAL_SHADE = "#97A0D9";
const ROSE = "#C77B94";
const VB = 400;
const CENTER = 200;
const UNIT_PX = 34;
function makeInitialFuncs() {
  return [
    {
      id: 0,
      expr: "1 + cos(theta)",
      checked: true,
      fg: "f",
      enabled: true,
    },
    {
      id: 1,
      expr: "2*cos(2*theta)",
      checked: true,
      fg: "g",
      enabled: true,
    },
  ];
}
function parseAngleValue(str, fallback) {
  try {
    const v = math.evaluate(
      String(str).replace(/π/g, "pi").replace(/θ/g, "theta"),
    );
    if (typeof v === "number" && isFinite(v)) return v;
  } catch (e) {
    /* fall through */
  }
  return fallback;
}
function angleStrToRadians(str, unit, fallback) {
  const v = parseAngleValue(str, null);
  if (v === null) return fallback;
  return unit === "deg" ? (v * Math.PI) / 180 : v;
}
function formatRadStr(rad) {
  const table = [
    [0, "0"],
    [Math.PI / 6, "π/6"],
    [Math.PI / 4, "π/4"],
    [Math.PI / 3, "π/3"],
    [Math.PI / 2, "π/2"],
    [Math.PI, "π"],
    [(3 * Math.PI) / 2, "3π/2"],
    [2 * Math.PI, "2π"],
    [-Math.PI / 2, "-π/2"],
    [-Math.PI, "-π"],
    [(-3 * Math.PI) / 2, "-3π/2"],
    [-2 * Math.PI, "-2π"],
  ];
  for (const [val, label] of table) {
    if (Math.abs(rad - val) < 1e-6) return label;
  }
  return String(Math.round(rad * 1000) / 1000);
}
function radiansToAngleStr(rad, unit) {
  return unit === "deg"
    ? String(Math.round((rad * 180) / Math.PI))
    : formatRadStr(rad);
}
function applyFunctionAliases(expr) {
  // accept the "arc-" spelling of inverse trig functions since it's more familiar to students
  return expr
    .replace(/\barcsin\b/gi, "asin")
    .replace(/\barccos\b/gi, "acos")
    .replace(/\barctan\b/gi, "atan")
    .replace(/\barccsc\b/gi, "acsc")
    .replace(/\barcsec\b/gi, "asec")
    .replace(/\barccot\b/gi, "acot");
}
function compileExpr(expr) {
  if (!expr || !expr.trim()) return null;
  try {
    const node = math.compile(
      applyFunctionAliases(expr.replace(/θ/g, "theta").replace(/π/g, "pi")),
    );
    const test = node.evaluate({
      theta: 0.37,
    });
    if (typeof test !== "number" || !isFinite(test)) return null;
    return node;
  } catch (e) {
    return null;
  }
}
function pathD(pts) {
  if (!pts.length) return "";
  return pts
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${p.xy[0].toFixed(2)} ${p.xy[1].toFixed(2)}`,
    )
    .join(" ");
}
function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}
function niceStep(target) {
  if (target <= 0 || !isFinite(target)) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
  const residual = target / magnitude;
  let niceResidual;
  if (residual < 1.5) niceResidual = 1;
  else if (residual < 3.5) niceResidual = 2;
  else if (residual < 7.5) niceResidual = 5;
  else niceResidual = 10;
  return niceResidual * magnitude;
}
function PolarApplet() {
  const [funcs, setFuncs] = useState(makeInitialFuncs);
  const idCounter = useRef(2);
  const [thetaStartStr, setThetaStartStr] = useState("0");
  const [thetaEndStr, setThetaEndStr] = useState("2π");
  const [units, setUnits] = useState("rad");
  const thetaStart = angleStrToRadians(thetaStartStr, units, 0);
  const thetaEnd = angleStrToRadians(thetaEndStr, units, 2 * Math.PI);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [areaMode, setAreaMode] = useState(false);
  const [areaAStr, setAreaAStr] = useState("0");
  const [areaBStr, setAreaBStr] = useState("2π");
  const areaA = angleStrToRadians(areaAStr, units, 0);
  const areaB = angleStrToRadians(areaBStr, units, 2 * Math.PI);
  const [sightAngle, setSightAngle] = useState(0);
  const [areaPlaying, setAreaPlaying] = useState(false);
  const [areaLoop, setAreaLoop] = useState(false);
  const shadingStyle = "hatch"; // locked in after comparison testing

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({
    x: 0,
    y: 0,
  });
  const svgRef = useRef(null);
  const panDragRef = useRef(null);
  const dragTargetRef = useRef(null);
  useEffect(() => {
    if (!playing) setT(thetaStart);
  }, [thetaStartStr]); // eslint-disable-line
  useEffect(() => {
    const lo = Math.min(areaA, areaB),
      hi = Math.max(areaA, areaB);
    setSightAngle((a) => Math.min(Math.max(a, lo), hi));
  }, [areaAStr, areaBStr]); // eslint-disable-line

  useEffect(() => {
    if (!playing) return;
    let raf;
    let last = performance.now();
    const fullSweepMs = 4000;
    function step(now) {
      const dt = now - last;
      last = now;
      const range = thetaEnd - thetaStart;
      const dir = range >= 0 ? 1 : -1;
      const rate =
        (Math.abs(range) > 0 ? (2 * Math.PI) / Math.abs(range) : 1) *
        ((2 * Math.PI) / fullSweepMs) *
        speed;
      setT((prev) => {
        let nt = prev + dir * rate * dt;
        if ((dir > 0 && nt >= thetaEnd) || (dir < 0 && nt <= thetaEnd)) {
          nt = thetaEnd;
          setPlaying(false);
        }
        return nt;
      });
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, thetaStart, thetaEnd]);
  useEffect(() => {
    if (!areaPlaying) return;
    let raf;
    let last = performance.now();
    const fullSweepMs = 4000;
    function step(now) {
      const dt = now - last;
      last = now;
      const range = areaB - areaA;
      const rate =
        (Math.abs(range) > 0 ? (2 * Math.PI) / Math.abs(range) : 1) *
        ((2 * Math.PI) / fullSweepMs) *
        speed;
      setSightAngle((prev) => {
        let na = prev + rate * dt;
        if (na >= areaB) {
          if (areaLoop) na = areaA;
          else {
            na = areaB;
            setAreaPlaying(false);
          }
        }
        return na;
      });
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [areaPlaying, areaLoop, speed, areaA, areaB]);
  const withColors = funcs.map((f, idx) => ({
    ...f,
    color: COLORS[idx % COLORS.length],
  }));
  const checkedFuncs = withColors.filter(
    (f) => f.checked && f.expr.trim() !== "" && f.enabled,
  );
  const checkedCount = checkedFuncs.length;
  function clearShading() {
    setSightAngle(areaA);
  }
  function changeUnits(newUnit) {
    if (newUnit === units) return;
    const convert = (str) => {
      const v = parseAngleValue(str, null);
      if (v === null) return str;
      const rad = units === "deg" ? (v * Math.PI) / 180 : v;
      return radiansToAngleStr(rad, newUnit);
    };
    setThetaStartStr(convert(thetaStartStr));
    setThetaEndStr(convert(thetaEndStr));
    setAreaAStr(convert(areaAStr));
    setAreaBStr(convert(areaBStr));
    setUnits(newUnit);
  }
  function toggleEnabled(id) {
    setFuncs((prev) => {
      const target = prev.find((f) => f.id === id);
      const turningOff = target.enabled;
      return prev.map((f) =>
        f.id === id
          ? {
              ...f,
              enabled: !f.enabled,
              ...(turningOff
                ? {
                    checked: false,
                    fg: null,
                  }
                : {}),
            }
          : f,
      );
    });
    clearShading();
  }
  function toggleChecked(id) {
    setFuncs((prev) => {
      const target = prev.find((f) => f.id === id);
      if (!target.checked && checkedCount >= 2) return prev;
      let next = prev.map((f) =>
        f.id === id
          ? {
              ...f,
              checked: !f.checked,
            }
          : f,
      );
      const nowChecked = next.filter(
        (f) => f.checked && f.expr.trim() !== "" && f.enabled,
      );
      if (nowChecked.length === 2) {
        const [a, b] = nowChecked;
        if (a.fg === b.fg || !a.fg || !b.fg) {
          next = next.map((f) => {
            if (f.id === a.id)
              return {
                ...f,
                fg: "f",
              };
            if (f.id === b.id)
              return {
                ...f,
                fg: "g",
              };
            return f;
          });
        }
      } else {
        next = next.map((f) =>
          f.checked
            ? f
            : {
                ...f,
                fg: null,
              },
        );
      }
      return next;
    });
    clearShading();
  }
  function setFg(id, val) {
    setFuncs((prev) => {
      const other = prev.find(
        (f) => f.checked && f.id !== id && f.expr.trim() !== "" && f.enabled,
      );
      let next = prev.map((f) =>
        f.id === id
          ? {
              ...f,
              fg: val,
            }
          : f,
      );
      if (other) {
        const opp = val === "f" ? "g" : "f";
        next = next.map((f) =>
          f.id === other.id
            ? {
                ...f,
                fg: opp,
              }
            : f,
        );
      }
      return next;
    });
  }
  function updateExpr(id, expr) {
    setFuncs((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              expr,
            }
          : f,
      ),
    );
  }
  function removeSlot(id) {
    setFuncs((prev) => prev.filter((f) => f.id !== id));
    clearShading();
  }
  function addSlot() {
    setFuncs((prev) => {
      if (prev.length >= 6) return prev;
      const id = idCounter.current++;
      return [
        ...prev,
        {
          id,
          expr: "",
          checked: false,
          fg: null,
          enabled: true,
        },
      ];
    });
  }
  function clearAll() {
    idCounter.current = 2;
    setFuncs(
      makeInitialFuncs().map((f) => ({
        ...f,
        expr: "",
        checked: false,
        fg: null,
        enabled: true,
      })),
    );
    clearShading();
  }
  function toXY(rVal, theta) {
    const s = UNIT_PX * zoom;
    const x = CENTER + pan.x + rVal * s * Math.cos(theta);
    const y = CENTER + pan.y - rVal * s * Math.sin(theta);
    return [x, y];
  }
  const origin = toXY(0, 0);

  // adaptive tick rings: pick a "nice" r-step so rings land roughly 55px apart on screen,
  // then draw only as many rings as fully fit within the visible axes (nearest edge, not the diagonal corner)
  const pxPerUnit = UNIT_PX * zoom;
  const tickStep = niceStep(55 / pxPerUnit);
  const nearestEdgeDist = Math.min(
    origin[0],
    VB - origin[0],
    origin[1],
    VB - origin[1],
  );
  const tickCount = Math.max(
    0,
    Math.min(20, Math.floor(nearestEdgeDist / (tickStep * pxPerUnit))),
  );
  const tickRings = Array.from(
    {
      length: tickCount,
    },
    (_, i) => (i + 1) * tickStep,
  );
  function edgePoint(ox, oy, theta) {
    const dx = Math.cos(theta),
      dy = -Math.sin(theta);
    let tMax = Infinity;
    if (dx > 0) tMax = Math.min(tMax, (VB - ox) / dx);
    else if (dx < 0) tMax = Math.min(tMax, (0 - ox) / dx);
    if (dy > 0) tMax = Math.min(tMax, (VB - oy) / dy);
    else if (dy < 0) tMax = Math.min(tMax, (0 - oy) / dy);
    if (!isFinite(tMax) || tMax < 0) tMax = 0;
    return [ox + dx * tMax, oy + dy * tMax];
  }
  function samplePath(node, from, to, steps = 160) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const th = from + (to - from) * (i / steps);
      let r;
      try {
        r = node.evaluate({
          theta: th,
        });
      } catch (e) {
        r = 0;
      }
      if (typeof r !== "number" || !isFinite(r)) r = 0;
      pts.push({
        theta: th,
        r,
        xy: toXY(r, th),
      });
    }
    return pts;
  }
  function angleFromEvent(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left,
      y = e.clientY - rect.top;
    const scaleX = VB / rect.width,
      scaleY = VB / rect.height;
    const vx = x * scaleX - (CENTER + pan.x);
    const vy = y * scaleY - (CENTER + pan.y);
    return Math.atan2(-vy, vx);
  }
  useEffect(() => {
    function move(e) {
      const drag = dragTargetRef.current;
      if (!drag) return;
      const raw = angleFromEvent(e);
      const delta = angleDelta(raw, drag.lastRaw);
      drag.lastRaw = raw;
      if (drag.type === "sight") {
        const lo = Math.min(areaA, areaB),
          hi = Math.max(areaA, areaB);
        setSightAngle((prev) => Math.min(Math.max(prev + delta, lo), hi));
      } else if (drag.type === "a") {
        drag.rad += delta;
        setAreaAStr(radiansToAngleStr(drag.rad, units));
      } else if (drag.type === "b") {
        drag.rad += delta;
        setAreaBStr(radiansToAngleStr(drag.rad, units));
      }
    }
    function up() {
      dragTargetRef.current = null;
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [areaA, areaB, pan, units]); // eslint-disable-line

  useEffect(() => {
    function move(e) {
      if (!panDragRef.current) return;
      const dx = e.clientX - panDragRef.current.startX,
        dy = e.clientY - panDragRef.current.startY;
      setPan({
        x: panDragRef.current.panX + dx,
        y: panDragRef.current.panY + dy,
      });
    }
    function up() {
      panDragRef.current = null;
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);
  function onSvgMouseDown(e) {
    if (areaMode) return;
    panDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }
  function fmtAngle(rad) {
    return units === "deg"
      ? `${((rad * 180) / Math.PI).toFixed(0)}°`
      : rad.toFixed(2);
  }
  const compiled = withColors.map((f) => ({
    ...f,
    node: compileExpr(f.expr),
  }));
  function splitAllRuns(flags) {
    // splits index range into contiguous runs of matching true/false flag value
    const runs = [];
    let cur = [];
    let curVal = null;
    flags.forEach((v, i) => {
      if (curVal === null || v === curVal) {
        cur.push(i);
        curVal = v;
      } else {
        runs.push({
          bad: curVal,
          idx: cur,
        });
        cur = [i];
        curVal = v;
      }
    });
    if (cur.length)
      runs.push({
        bad: curVal,
        idx: cur,
      });
    return runs;
  }
  let shadingEls = null;
  let hasAnomaly = false;
  if (areaMode) {
    const from = areaA;
    const to = sightAngle;
    if (checkedCount === 1) {
      const fn = compiled.find((f) => f.id === checkedFuncs[0].id);
      if (fn.node) {
        const pts = samplePath(fn.node, from, to, 200);
        const flags = pts.map((p) => p.r < 0);
        const runs = splitAllRuns(flags);
        hasAnomaly = runs.some((r) => r.bad);
        shadingEls = (
          /*#__PURE__*/ <g>
            {runs.map((run, i) => {
              const segPts = run.idx.map((ix) => pts[ix]);
              const sub = [
                {
                  xy: origin,
                },
                ...segPts,
                {
                  xy: origin,
                },
              ];
              const d = pathD(sub) + " Z";
              return run.bad ? (
                /*#__PURE__*/ <path key={i} d={d} fill="url(#hatchPattern)" />
              ) : (
                /*#__PURE__*/ <path
                  key={i}
                  d={d}
                  fill={NEUTRAL_SHADE}
                  opacity={0.28}
                />
              );
            })}
          </g>
        );
      }
    } else if (checkedCount === 2) {
      const fOne = compiled.find((f) => f.checked && f.fg === "f" && f.enabled);
      const gOne = compiled.find((f) => f.checked && f.fg === "g" && f.enabled);
      if (fOne && gOne && fOne.node && gOne.node) {
        const ptsF = samplePath(fOne.node, from, to, 200);
        const ptsG = samplePath(gOne.node, from, to, 200);
        const flags = ptsF.map(
          (p, i) => p.r < ptsG[i].r || p.r < 0 || ptsG[i].r < 0,
        );
        const runs = splitAllRuns(flags);
        hasAnomaly = runs.some((r) => r.bad);
        shadingEls = (
          /*#__PURE__*/ <g>
            {runs.map((run, k) => {
              const sub = [
                ...run.idx.map((i) => ptsF[i]),
                ...run.idx.map((i) => ptsG[i]).reverse(),
              ];
              const d = pathD(sub) + " Z";
              return run.bad ? (
                /*#__PURE__*/ <path key={k} d={d} fill="url(#hatchPattern)" />
              ) : (
                /*#__PURE__*/ <path
                  key={k}
                  d={d}
                  fill={NEUTRAL_SHADE}
                  opacity={0.28}
                />
              );
            })}
          </g>
        );
      }
    }
  }
  const sliderLo = Math.min(thetaStart, thetaEnd);
  const sliderHi = Math.max(thetaStart, thetaEnd);
  const fAssigned = checkedFuncs.find((f) => f.fg === "f");
  const gAssigned = checkedFuncs.find((f) => f.fg === "g");
  return (
    /*#__PURE__*/ <div className="pa-root">
      <div className="pa-shell">
        <Banner areaMode={areaMode} setAreaMode={setAreaMode} />
        <div className="pa-body">
          <div className="pa-layout">
            <div className="pa-sidebar">
              <div className="pa-panel">
                <div className="pa-eyebrow">
                  <span className="cap">Functions</span> (r = f(θ)) · max 6
                </div>
                {withColors.map((f) => {
                  const isEmpty = f.expr.trim() === "";
                  const excludedByPair =
                    areaMode && checkedCount >= 2 && !f.checked;
                  const grayed = excludedByPair || !f.enabled;
                  const showFg =
                    areaMode && checkedCount === 2 && f.checked && f.enabled;
                  const invalid = !isEmpty && !compileExpr(f.expr);
                  return (
                    /*#__PURE__*/ <React.Fragment key={f.id}>
                      <div className={`pa-func-row${grayed ? " grayed" : ""}`}>
                        <span
                          className="pa-swatch"
                          style={{
                            background: isEmpty
                              ? "#DCDCF0"
                              : f.enabled
                                ? f.color
                                : "#fff",
                            border: isEmpty
                              ? "1px solid rgba(0,0,0,0.08)"
                              : `2px solid ${f.color}`,
                          }}
                          onClick={() => !isEmpty && toggleEnabled(f.id)}
                          title={
                            isEmpty
                              ? ""
                              : f.enabled
                                ? "Hide from graph"
                                : "Show on graph"
                          }
                        />
                        <div className="pa-prefix-input">
                          <span className="pa-prefix">r(θ) =</span>
                          <input
                            value={f.expr}
                            placeholder="empty slot"
                            onChange={(e) => updateExpr(f.id, e.target.value)}
                          />
                        </div>
                        {areaMode && (
                          /*#__PURE__*/ <input
                            type="checkbox"
                            className="pa-area-check"
                            checked={f.checked}
                            disabled={
                              isEmpty ||
                              !f.enabled ||
                              (!f.checked && checkedCount >= 2)
                            }
                            onChange={() => toggleChecked(f.id)}
                          />
                        )}
                        {showFg && (
                          /*#__PURE__*/ <select
                            className="pa-fg-select"
                            value={f.fg || "f"}
                            onChange={(e) => setFg(f.id, e.target.value)}
                          >
                            <option value="f">f(θ)</option>
                            <option value="g">g(θ)</option>
                          </select>
                        )}
                        <div
                          className="pa-icon-btn"
                          onClick={() => removeSlot(f.id)}
                        >
                          ×
                        </div>
                      </div>
                      {invalid && (
                        /*#__PURE__*/ <div className="pa-warn">
                          Can't parse this — check syntax (e.g. cos(theta),
                          2*theta).
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
                <div
                  className="pa-row-flex"
                  style={{
                    marginTop: 4,
                  }}
                >
                  <div className="pa-add-hint">{funcs.length}/6 used</div>
                  <button
                    className="pa-pill-btn"
                    style={{
                      marginLeft: "auto",
                      padding: "4px 10px",
                      fontSize: 11,
                    }}
                    onClick={clearAll}
                  >
                    Clear all
                  </button>
                </div>
                {funcs.length < 6 && (
                  /*#__PURE__*/ <button
                    className="pa-add-slot"
                    onClick={addSlot}
                  >
                    + Add another function
                  </button>
                )}
              </div>
              <div className="pa-panel">
                <div className="pa-eyebrow">Graphing</div>
                <div className="pa-controls-grid">
                  <div>
                    <div className="pa-field-label">θ range — start</div>
                    <div className="pa-bound-input">
                      <span className="pa-prefix">a =</span>
                      <input
                        value={thetaStartStr}
                        onChange={(e) => setThetaStartStr(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="pa-field-label">θ range — end</div>
                    <div className="pa-bound-input">
                      <span className="pa-prefix">b =</span>
                      <input
                        value={thetaEndStr}
                        onChange={(e) => setThetaEndStr(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    height: 10,
                  }}
                />
                <input
                  type="range"
                  min={sliderLo}
                  max={sliderHi}
                  step={(sliderHi - sliderLo) / 1000 || 0.001}
                  value={Math.min(Math.max(t, sliderLo), sliderHi)}
                  disabled={areaMode}
                  onChange={(e) => {
                    setPlaying(false);
                    setT(parseFloat(e.target.value));
                    clearShading();
                  }}
                />
                <div
                  className="pa-row-flex"
                  style={{
                    marginTop: 10,
                  }}
                >
                  <button
                    className="pa-pill-btn primary"
                    disabled={areaMode}
                    onClick={() => {
                      if (t >= sliderHi) setT(thetaStart);
                      setPlaying((p) => !p);
                      clearShading();
                    }}
                  >
                    {playing ? "⏸ Pause" : "▶ Play"}
                  </button>
                  <div className="pa-seg">
                    {[0.5, 1, 2].map((s) => (
                      /*#__PURE__*/ <button
                        key={s}
                        className={speed === s ? "active" : ""}
                        onClick={() => setSpeed(s)}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                  <div className="pa-seg pa-unit-toggle">
                    <button
                      className={units === "rad" ? "active" : ""}
                      onClick={() => changeUnits("rad")}
                    >
                      rad
                    </button>
                    <button
                      className={units === "deg" ? "active" : ""}
                      onClick={() => changeUnits("deg")}
                    >
                      deg
                    </button>
                  </div>
                </div>
                <div className="pa-note">
                  θ = {fmtAngle(t)}
                  {areaMode
                    ? " (tracing paused while Polar Integration is On — range still editable)"
                    : ""}
                </div>
                <div className={`pa-expand-wrap${areaMode ? " open" : ""}`}>
                  <div className="pa-expand-inner">
                    <div className="pa-expand-pad">
                      <div className="pa-eyebrow">Polar Integration</div>
                      <div className="pa-controls-grid">
                        <div>
                          <div className="pa-field-label">Shade from</div>
                          <div className="pa-bound-input">
                            <span className="pa-prefix">a =</span>
                            <input
                              value={areaAStr}
                              onChange={(e) => setAreaAStr(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="pa-field-label">Shade to</div>
                          <div className="pa-bound-input">
                            <span className="pa-prefix">b =</span>
                            <input
                              value={areaBStr}
                              onChange={(e) => setAreaBStr(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="pa-row-flex"
                        style={{
                          marginTop: 10,
                        }}
                      >
                        <button
                          className="pa-pill-btn primary"
                          onClick={() => {
                            if (sightAngle >= Math.max(areaA, areaB))
                              setSightAngle(Math.min(areaA, areaB));
                            setAreaPlaying((p) => !p);
                          }}
                        >
                          {areaPlaying ? "⏸ Pause" : "▶ Play / Loop"}
                        </button>
                        <label
                          style={{
                            fontSize: 11,
                            color: "#6E6E86",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={areaLoop}
                            onChange={(e) => setAreaLoop(e.target.checked)}
                          />{" "}
                          Loop
                        </label>
                        <button className="pa-pill-btn" onClick={clearShading}>
                          Clear shading
                        </button>
                      </div>
                      <div className="pa-note">
                        θ (sight line) = {fmtAngle(sightAngle)} · drag the solid
                        line or the a/b edge labels on the graph, or use
                        Play/Loop.
                      </div>
                      {checkedCount === 0 && (
                        /*#__PURE__*/ <div className="pa-fg-note">
                          Check a function's box above to shade its area from
                          the origin.
                        </div>
                      )}
                      {checkedCount === 1 && (
                        /*#__PURE__*/ <div className="pa-fg-note">
                          Shading the area within this single curve.
                          <span className="pa-formula">A = ½ ∫ r(θ)² dθ</span>
                        </div>
                      )}
                      {checkedCount === 2 && fAssigned && gAssigned && (
                        /*#__PURE__*/ <div className="pa-fg-note">
                          Shading the area between f(θ) and g(θ), where f is the
                          larger (outer) curve and g is the smaller (inner) one.
                          <span className="pa-formula">
                            A = ½ ∫ [f(θ)² − g(θ)²] dθ
                          </span>
                          {hasAnomaly && (
                            /*#__PURE__*/ <span className="pa-anomaly">
                              Heads up: on the highlighted sub-interval(s) on
                              the graph, f(θ) isn't actually the larger value
                              there (or one curve is negative) — the integral's
                              sign flips relative to the formula above.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pa-graphcol">
              <div className="pa-graphwrap">
                <div className="pa-zoom">
                  <button onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}>
                    +
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(z / 1.2, 0.2))}
                  >
                    −
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1);
                      setPan({
                        x: 0,
                        y: 0,
                      });
                    }}
                  >
                    ⊙
                  </button>
                </div>
                {areaMode && hasAnomaly && (
                  /*#__PURE__*/ <div className="pa-legend-chip">
                    <span className="pa-legend-swatch" />
                    {checkedCount === 2
                      ? "Hatched = f(θ) < g(θ) here (integral's sign flips)"
                      : "Hatched = r(θ) < 0 here (curve traces to the opposite side of the origin)"}
                  </div>
                )}
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${VB} ${VB}`}
                  width="100%"
                  height="360"
                  onMouseDown={onSvgMouseDown}
                  style={{
                    cursor: areaMode ? "default" : "grab",
                  }}
                >
                  <defs>
                    <pattern
                      id="hatchPattern"
                      width="6"
                      height="6"
                      patternTransform="rotate(45)"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect
                        width="6"
                        height="6"
                        fill={NEUTRAL_SHADE}
                        opacity="0.28"
                      />
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="6"
                        stroke={ROSE}
                        strokeWidth="2"
                        opacity="0.55"
                      />
                    </pattern>
                  </defs>
                  <line
                    x1={0}
                    y1={CENTER + pan.y}
                    x2={VB}
                    y2={CENTER + pan.y}
                    stroke="black"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                  <line
                    x1={CENTER + pan.x}
                    y1={0}
                    x2={CENTER + pan.x}
                    y2={VB}
                    stroke="black"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                  {tickRings.map((rVal, i) => {
                    const labelPt = toXY(rVal, 0);
                    return (
                      /*#__PURE__*/ <g key={i}>
                        <circle
                          cx={origin[0]}
                          cy={origin[1]}
                          r={rVal * pxPerUnit}
                          fill="none"
                          stroke="#DCDCF0"
                          strokeWidth="1"
                        />
                        <text
                          x={labelPt[0] + 3}
                          y={labelPt[1] - 4}
                          fontSize="9"
                          fill="#8A8AA3"
                        >
                          {Number(rVal.toFixed(6))}
                        </text>
                      </g>
                    );
                  })}
                  {shadingEls}
                  {areaMode && (
                    /*#__PURE__*/ <React.Fragment>
                      {[
                        {
                          ang: areaA,
                          label: "θ=a",
                          type: "a",
                        },
                        {
                          ang: areaB,
                          label: "θ=b",
                          type: "b",
                        },
                      ].map((b, i) => {
                        const end = edgePoint(origin[0], origin[1], b.ang);
                        return (
                          /*#__PURE__*/ <g key={i}>
                            <line
                              x1={origin[0]}
                              y1={origin[1]}
                              x2={end[0]}
                              y2={end[1]}
                              stroke="#8A8AA3"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <circle
                              cx={end[0]}
                              cy={end[1]}
                              r="9"
                              fill="#8A8AA3"
                              opacity="0.001"
                              style={{
                                cursor: "grab",
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                dragTargetRef.current = {
                                  type: b.type,
                                  lastRaw: angleFromEvent(e),
                                  rad: b.ang,
                                };
                              }}
                            />
                            <circle
                              cx={end[0]}
                              cy={end[1]}
                              r="4"
                              fill="#8A8AA3"
                              opacity="0.35"
                            />
                            <text
                              x={end[0] + (end[0] > CENTER ? -4 : 4)}
                              y={end[1] + (end[1] > CENTER ? -8 : 12)}
                              textAnchor={end[0] > CENTER ? "end" : "start"}
                              className="pa-edge-label"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                dragTargetRef.current = {
                                  type: b.type,
                                  lastRaw: angleFromEvent(e),
                                  rad: b.ang,
                                };
                              }}
                            >
                              {b.label}
                            </text>
                          </g>
                        );
                      })}
                      {(() => {
                        const end = edgePoint(origin[0], origin[1], sightAngle);
                        return (
                          /*#__PURE__*/ <g
                            className="pa-sight-group"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              dragTargetRef.current = {
                                type: "sight",
                                lastRaw: angleFromEvent(e),
                              };
                            }}
                          >
                            <line
                              x1={origin[0]}
                              y1={origin[1]}
                              x2={end[0]}
                              y2={end[1]}
                              stroke="transparent"
                              strokeWidth="22"
                              style={{
                                cursor: "grab",
                              }}
                            />
                            <line
                              className="pa-sight-visible"
                              x1={origin[0]}
                              y1={origin[1]}
                              x2={end[0]}
                              y2={end[1]}
                              stroke="#3B4FC2"
                              strokeWidth="2"
                              pointerEvents="none"
                            />
                          </g>
                        );
                      })()}
                    </React.Fragment>
                  )}
                  {compiled
                    .filter((f) => f.enabled)
                    .map((f) => {
                      if (!f.node) return null;
                      const to = areaMode ? thetaEnd : t;
                      const pts = samplePath(f.node, thetaStart, to, 200);
                      return (
                        /*#__PURE__*/ <path
                          key={f.id}
                          d={pathD(pts)}
                          fill="none"
                          stroke={f.color}
                          strokeWidth="2.2"
                        />
                      );
                    })}
                  {!areaMode &&
                    compiled
                      .filter((f) => f.enabled)
                      .map((f) => {
                        if (!f.node) return null;
                        let r;
                        try {
                          r = f.node.evaluate({
                            theta: t,
                          });
                        } catch (e) {
                          return null;
                        }
                        if (typeof r !== "number" || !isFinite(r)) return null;
                        const pt = toXY(r, t);
                        const nominal = toXY(-r, t);
                        return (
                          /*#__PURE__*/ <g key={f.id}>
                            {r < 0 && (
                              /*#__PURE__*/ <line
                                x1={origin[0]}
                                y1={origin[1]}
                                x2={nominal[0]}
                                y2={nominal[1]}
                                stroke={ROSE}
                                strokeWidth="1.3"
                                strokeDasharray="3 3"
                              />
                            )}
                            <line
                              x1={origin[0]}
                              y1={origin[1]}
                              x2={pt[0]}
                              y2={pt[1]}
                              stroke={f.color}
                              strokeWidth="1.5"
                              strokeDasharray="4 3"
                            />
                            <circle
                              cx={pt[0]}
                              cy={pt[1]}
                              r="3.2"
                              fill={f.color}
                            />
                          </g>
                        );
                      })}
                </svg>
              </div>
              <div className="pa-flag">
                v3 build. Fixed since last round: enable/disable toggle bug,
                sliding header toggle, wider glowing sight-line drag target,
                header/body alignment, × now removes a function entirely, merged
                Graphing + Polar Integration panel with smooth expand animation,
                f/g note relocated next to the shading controls. Known
                simplifications remaining: no axis tick labels;
                area-between-curves shading uses a simple f-to-g ribbon rather
                than a full region-decomposition.
              </div>
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
// JSX (see CLAUDE.md's "Shared header" section) -- same values Quadric Surfaces and Partial
// Derivatives both use. "All Applets" lives inline on the banner's left; this applet's own
// Graphing/Polar Integration mode toggle occupies the banner's right zone (the one case the spec
// calls out for applet-specific controls), pushed there via marginLeft:"auto".
function Banner({ areaMode, setAreaMode }) {
  return (
    /*#__PURE__*/ <div
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
        <path
          d="M0 95 C 200 15, 340 120, 560 45 S 900 5, 1200 75"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
        />
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
            Calculus II · Unit 4
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.005em",
            }}
          >
            Polar Graphing & Integration
          </div>
        </div>
      </div>
      <div
        className={`pa-header-toggle${areaMode ? " on" : ""}`}
        style={{ marginLeft: "auto", position: "relative", zIndex: 1 }}
      >
        <div className="pa-thumb" />
        <button
          className={!areaMode ? "active" : ""}
          onClick={() => setAreaMode(false)}
        >
          Graphing
        </button>
        <button
          className={areaMode ? "active" : ""}
          onClick={() => setAreaMode(true)}
        >
          Polar Integration
        </button>
      </div>
    </div>
  );
}
// Page-level brand credit, centered below the app card -- see the "final header direction" note in
// Applets/shared/applet-header.css. marginTop:"auto" on the wrapper pins it to the bottom of the
// outer flex column when there's leftover vertical space, and lets it fall in normal flow right
// after the card (never disappearing) when the app's own content is tall enough to fill the
// viewport on its own.
function PageCredit() {
  return (
    /*#__PURE__*/ <div
      style={{
        marginTop: "auto",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 11,
        padding: "18px 20px 26px",
        fontSize: 13.5,
        color: "#8A8AA3",
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#FFFFFF",
          border: "1px solid #DCDCF0",
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
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/*#__PURE__*/ <PolarApplet />);
