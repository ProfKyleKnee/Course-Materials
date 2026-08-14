import React, { useRef, useState, useEffect, useCallback } from 'react';
import { COLORS } from './Shared.jsx';

const WIDTH = 500;
const HEIGHT = 380;
const CURVE_COLOR = '#232326';

export function useCamera(initialView) {
  const [view, setViewState] = useState(initialView);
  const viewRef = useRef(initialView);
  const tweenRef = useRef(null);

  const setView = useCallback((v) => {
    setViewState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v;
      viewRef.current = next;
      return next;
    });
  }, []);

  const zoomBy = useCallback((factor) => {
    setView((v) => {
      const cx = (v.xMin + v.xMax) / 2;
      const cy = (v.yMin + v.yMax) / 2;
      const hw = ((v.xMax - v.xMin) / 2) * factor;
      const hh = ((v.yMax - v.yMin) / 2) * factor;
      return { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh };
    });
  }, [setView]);

  const panBy = useCallback((dxMath, dyMath) => {
    setView((v) => ({
      xMin: v.xMin + dxMath, xMax: v.xMax + dxMath,
      yMin: v.yMin + dyMath, yMax: v.yMax + dyMath,
    }));
  }, [setView]);

  const animateTo = useCallback((target, duration = 700) => {
    if (tweenRef.current) cancelAnimationFrame(tweenRef.current);
    const from = viewRef.current;
    let start = null;
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function step(ts) {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const e = ease(t);
      setView({
        xMin: from.xMin + (target.xMin - from.xMin) * e,
        xMax: from.xMax + (target.xMax - from.xMax) * e,
        yMin: from.yMin + (target.yMin - from.yMin) * e,
        yMax: from.yMax + (target.yMax - from.yMax) * e,
      });
      if (t < 1) tweenRef.current = requestAnimationFrame(step);
    }
    tweenRef.current = requestAnimationFrame(step);
  }, [setView]);

  const autofit = useCallback((fn, xValues) => {
    if (!xValues.length) return;
    let xMin = Math.min(...xValues, 0);
    let xMax = Math.max(...xValues, 0);
    let yMin = 0, yMax = 0;
    xValues.forEach((x) => {
      const y = fn.f(x);
      if (isFinite(y)) { yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); }
    });
    const xPad = Math.max((xMax - xMin) * 0.25, 0.5);
    const yPad = Math.max((yMax - yMin) * 0.25, 0.5);
    animateTo({ xMin: xMin - xPad, xMax: xMax + xPad, yMin: yMin - yPad, yMax: yMax + yPad });
  }, [animateTo]);

  const isOffscreen = useCallback((xValues) => {
    return xValues.some((x) => x < view.xMin || x > view.xMax);
  }, [view]);

  return { view, setView, zoomBy, panBy, autofit, animateTo, isOffscreen };
}

function toPx(x, y, view) {
  const px = ((x - view.xMin) / (view.xMax - view.xMin)) * WIDTH;
  const py = HEIGHT - ((y - view.yMin) / (view.yMax - view.yMin)) * HEIGHT;
  return [px, py];
}

export const GRAPH_WIDTH = WIDTH;
export const GRAPH_HEIGHT = HEIGHT;
export function toGraphPx(x, y, view) { return toPx(x, y, view); }

function niceTicks(min, max) {
  const range = max - min;
  const rough = range / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step;
  if (norm < 1.5) step = 1 * mag;
  else if (norm < 3) step = 2 * mag;
  else if (norm < 7) step = 5 * mag;
  else step = 10 * mag;
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let t = start; t <= max; t += step) ticks.push(Math.round(t * 1000) / 1000);
  return ticks;
}

function AxisTicks({ view }) {
  const xTicks = niceTicks(view.xMin, view.xMax);
  const yTicks = niceTicks(view.yMin, view.yMax);
  const [zeroXpx] = toPx(0, 0, view);
  const [, zeroYpx] = toPx(0, 0, view);
  const showXAxis = view.yMin < 0 && view.yMax > 0;
  const showYAxis = view.xMin < 0 && view.xMax > 0;
  return (
    <g>
      {showXAxis && <line x1={0} x2={WIDTH} y1={zeroYpx} y2={zeroYpx} stroke="#C7C7DE" strokeWidth={1} />}
      {showYAxis && <line x1={zeroXpx} x2={zeroXpx} y1={0} y2={HEIGHT} stroke="#C7C7DE" strokeWidth={1} />}
      {xTicks.map((t) => {
        if (Math.abs(t) < 1e-9) return null;
        const [px] = toPx(t, 0, view);
        const py = showXAxis ? zeroYpx : HEIGHT - 14;
        return <text key={`x${t}`} x={px} y={py + 14} fontSize={10} fill={COLORS.muted} textAnchor="middle">{t}</text>;
      })}
      {yTicks.map((t) => {
        if (Math.abs(t) < 1e-9) return null;
        const [, py] = toPx(0, t, view);
        const px = showYAxis ? zeroXpx : 14;
        return <text key={`y${t}`} x={px - 8} y={py + 3} fontSize={10} fill={COLORS.muted} textAnchor="end">{t}</text>;
      })}
    </g>
  );
}

function CurvePath({ fn, view }) {
  const N = 200;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = view.xMin + ((view.xMax - view.xMin) * i) / N;
    const y = fn.f(x);
    if (isFinite(y)) {
      const [px, py] = toPx(x, y, view);
      pts.push(`${px},${py}`);
    }
  }
  return <polyline points={pts.join(' ')} fill="none" stroke={CURVE_COLOR} strokeWidth={2.25} />;
}

function RootMarkers({ roots = [], view, highlight = null }) {
  return (
    <>
      {roots.map((rx, i) => {
        const [px, py] = toPx(rx, 0, view);
        const isHighlighted = highlight === null || highlight === i;
        return (
          <g key={i}>
            <circle cx={px} cy={py} r={isHighlighted ? 5.5 : 4} fill={COLORS.good} opacity={isHighlighted ? 1 : 0.55} />
            {highlight === i && (
              <circle cx={px} cy={py} r={10} fill="none" stroke={COLORS.good} strokeWidth={1.6} strokeDasharray="3,3" opacity={0.8} />
            )}
          </g>
        );
      })}
    </>
  );
}

function RootLegend() {
  return (
    <div style={{
      position: 'absolute', right: 10, bottom: 10, display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '4px 10px',
      fontSize: 10.5, color: COLORS.muted, border: `1px solid ${COLORS.border}`,
    }}>
      <svg width={14} height={14} viewBox="0 0 14 14">
        <circle cx={7} cy={7} r={3} fill={COLORS.good} />
        <circle cx={7} cy={7} r={6} fill="none" stroke={COLORS.good} strokeWidth={1.4} strokeDasharray="2,2" />
      </svg>
      root nearest x&#8321; (expected)
    </div>
  );
}

function TrailStep({ fn, view, x, label, opacity, isCurrent, dotColor, simpleFade }) {
  const y = fn.f(x);
  const [dotPx, dotPy] = toPx(x, 0, view);
  const [curvePx, curvePy] = toPx(x, y, view);
  const slope = fn.fp(x);

  const x0 = view.xMin, x1 = view.xMax;
  const y0 = y + slope * (x0 - x);
  const y1 = y + slope * (x1 - x);
  const [lx0, ly0] = toPx(x0, y0, view);
  const [lx1, ly1] = toPx(x1, y1, view);

  const [tangentOpacity, setTangentOpacity] = useState(isCurrent && simpleFade ? 0 : 1);
  useEffect(() => {
    if (isCurrent && simpleFade) {
      setTangentOpacity(0);
      const raf = requestAnimationFrame(() => setTangentOpacity(1));
      return () => cancelAnimationFrame(raf);
    } else {
      setTangentOpacity(1);
    }
  }, [isCurrent, x, simpleFade]);

  return (
    <g opacity={opacity}>
      <line x1={dotPx} y1={dotPy} x2={curvePx} y2={curvePy} stroke={COLORS.muted} strokeWidth={1} strokeDasharray="3,3" />
      <line
        x1={lx0} y1={ly0} x2={lx1} y2={ly1}
        stroke={dotColor}
        strokeWidth={isCurrent ? 2 : 1.5}
        style={{ opacity: tangentOpacity, transition: isCurrent ? 'opacity 0.5s ease-out' : 'none' }}
      />
      <circle cx={curvePx} cy={curvePy} r={3.5} fill={dotColor} />
      <circle cx={dotPx} cy={dotPy} r={4} fill={dotColor} />
      <text x={dotPx} y={dotPy + 16} fontSize={10.5} fontWeight={700} fill={dotColor} textAnchor="middle">{label}</text>
    </g>
  );
}

function EdgeBadge({ n, value, side }) {
  const isLeft = side === 'left';
  return (
    <div style={{
      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
      [isLeft ? 'left' : 'right']: 6,
      background: COLORS.bad, color: '#FFFFFF', fontSize: 11, fontWeight: 700,
      borderRadius: 10, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3,
    }}>
      {isLeft ? `← x${n}=${value}` : `x${n}=${value} →`}
    </div>
  );
}

function ZoomControls({ camera, onAutofitClick }) {
  const btnStyle = {
    width: 26, height: 26, borderRadius: '50%', border: `1px solid ${COLORS.border}`,
    background: COLORS.card, cursor: 'pointer', fontSize: 14, color: COLORS.muted,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button style={btnStyle} onClick={() => camera.zoomBy(0.8)} title="Zoom in">+</button>
      <button style={btnStyle} onClick={() => camera.zoomBy(1.25)} title="Zoom out">−</button>
      <button style={{ ...btnStyle, fontSize: 12 }} onClick={onAutofitClick} title="Autofit">⤢</button>
    </div>
  );
}

// overheadPx is each caller's own fixed vertical chrome (banner + card padding + whatever sits
// above/below the graph on that specific tab — the Big Idea card on Intro, the toggle/note row and
// capMessage on the failure tabs, etc.) — it has to be passed in per tab rather than hardcoded here,
// since Intro's Big Idea card alone is worth well over 100px that Free Play and the failure tabs
// don't have, and reusing one constant across all of them under-fills the shorter tabs.
export default function Graph({ fn, camera, trail = [], guessPoint, edgeBadges = [], roots = [], rootHighlight = null, showRootLegend = false, onAutofitClick, simpleFade = true, overlay, overheadPx = 515 }) {
  const svgRef = useRef(null);
  const dragState = useRef(null);

  function pxToMath(px, py, view) {
    const x = view.xMin + (px / WIDTH) * (view.xMax - view.xMin);
    const y = view.yMin + ((HEIGHT - py) / HEIGHT) * (view.yMax - view.yMin);
    return [x, y];
  }

  function handleBgMouseDown(e) {
    if (e.target.dataset && e.target.dataset.role === 'guess-handle') return;
    dragState.current = { startPxX: e.clientX, startPxY: e.clientY, startView: camera.view };
  }
  function handleMouseMove(e) {
    if (!dragState.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = (dragState.current.startView.xMax - dragState.current.startView.xMin) / rect.width;
    const scaleY = (dragState.current.startView.yMax - dragState.current.startView.yMin) / rect.height;
    const dxPx = e.clientX - dragState.current.startPxX;
    const dyPx = e.clientY - dragState.current.startPxY;
    camera.setView({
      xMin: dragState.current.startView.xMin - dxPx * scaleX,
      xMax: dragState.current.startView.xMax - dxPx * scaleX,
      yMin: dragState.current.startView.yMin + dyPx * scaleY,
      yMax: dragState.current.startView.yMax + dyPx * scaleY,
    });
  }
  function handleMouseUp() {
    dragState.current = null;
  }

  function handleWheel(e) {
    e.preventDefault();
    camera.zoomBy(e.deltaY > 0 ? 1.1 : 0.9);
  }

  function handleGuessDrag(e) {
    if (!guessPoint || !guessPoint.onDrag) return;
    e.stopPropagation();
    const rect = svgRef.current.getBoundingClientRect();
    const onMove = (ev) => {
      const px = ((ev.clientX - rect.left) / rect.width) * WIDTH;
      const [x] = pxToMath(px, HEIGHT, camera.view);
      guessPoint.onDrag(x);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (guessPoint.onDragEnd) guessPoint.onDragEnd();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const view = camera.view;

  return (
    <div style={{
      position: 'relative', width: '100%',
      maxWidth: `max(290px, calc((100vh - ${overheadPx}px) * ${(WIDTH / HEIGHT).toFixed(4)}))`,
      aspectRatio: `${WIDTH}/${HEIGHT}`, margin: '0 auto', flexShrink: 0,
      background: COLORS.card, borderRadius: 18, boxShadow: '0 1px 3px rgba(60,60,90,0.07)', overflow: 'hidden',
    }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%" height="100%"
        onMouseDown={handleBgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: 'grab', display: 'block' }}
      >
        <AxisTicks view={view} />
        <CurvePath fn={fn} view={view} />
        <RootMarkers roots={roots} view={view} highlight={rootHighlight} />
        {trail.map((step, i) => (
          <TrailStep
            key={step.key ?? i}
            fn={fn} view={view} x={step.x} label={step.label}
            opacity={step.opacity} isCurrent={step.isCurrent}
            dotColor={step.color ?? COLORS.bad}
            simpleFade={simpleFade}
          />
        ))}
        {guessPoint && (() => {
          const [px, py] = toPx(guessPoint.x, 0, view);
          return (
            <circle
              data-role="guess-handle"
              cx={px} cy={py} r={7}
              fill="#FFFFFF" stroke={COLORS.accent} strokeWidth={2.5}
              style={{ cursor: 'ew-resize' }}
              onMouseDown={handleGuessDrag}
            />
          );
        })()}
        {overlay && overlay(view)}
      </svg>
      <ZoomControls camera={camera} onAutofitClick={onAutofitClick} />
      {edgeBadges.map((b) => <EdgeBadge key={b.n} {...b} />)}
      {showRootLegend && rootHighlight !== null && <RootLegend />}
    </div>
  );
}
