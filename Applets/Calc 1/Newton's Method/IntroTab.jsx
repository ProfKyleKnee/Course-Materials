import React, { useState, useRef, useEffect, useCallback } from 'react';
import { COLORS, FixedReadout, FieldCaption, IterationTable, subscriptDigits } from '../Shared.jsx';
import Graph, { useCamera, toGraphPx } from '../Graph.jsx';
import { LOCKED_FUNCTIONS, KNOWN_ROOTS, computeIterations } from '../newtonMath.js';

const fn = LOCKED_FUNCTIONS.intro;
const X1 = 4; // wide starting guess so x1..x4 stay visually separated
              // instead of clustering right on top of the root
const MAX_N = 4;
const TRAIL_COLOR = COLORS.accent; // blue, not red — nothing here is an error

// Timing, tuned live against the standalone animation mockup.
const DOT_FADE_MS = 500;
const PAUSE_AFTER_DOT_MS = 400;
const DASH_TOTAL_MS = 1400;
const PAUSE_BEFORE_TANGENT_MS = 450;
const TANGENT_FADE_MS = 900;
const PAUSE_BEFORE_INTERCEPT_MS = 350;
const INTERCEPT_FADE_MS = 500;
const PAUSE_AFTER_MS = 500;
const FINAL_PAUSE_MS = 2200; // longer hold on the finished x4 state before the loop blanks and restarts
const DASH_LEN = 4, GAP_LEN = 4; // must match the settled connector's own stroke-dasharray

// Fades its children in via a real CSS transition rather than SMIL, and —
// crucially — is meant to be given a `key` by the caller that changes each
// time a NEW point starts this fade. That forces React to unmount the old
// instance and mount a fresh one (visible=false again), so the fade
// actually restarts every time instead of only ever playing once.
function FadeIn({ durationMs, children }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <g style={{ opacity: visible ? 1 : 0, transition: `opacity ${durationMs}ms ease-out` }}>
      {children}
    </g>
  );
}

export default function IntroTab() {
  // k = number of FULLY DECORATED points (dot+dash+tangent complete).
  // Displayed slider/table value is always k+1 (never 0, per spec) —
  // "blank" tracks the one true zero-state (nothing drawn at all yet),
  // which only ever happens before the very first Play press or right
  // after a full loop resets, and is never exposed as a number anywhere.
  const [k, setK] = useState(0);
  const [blank, setBlank] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState(null); // null | 'dash' | 'tangent' | 'intercept'
  const [dashesVisible, setDashesVisible] = useState(0);
  const [continuousN, setContinuousN] = useState(1); // slider thumb position — fills smoothly with elapsed time; the numeric badge below is driven by k+1 instead, so it only ever shows completed integers
  const timeoutsRef = useRef([]);
  const rafRef = useRef(null);
  const playTokenRef = useRef(0);
  const camera = useCamera({ xMin: -1, xMax: 4.5, yMin: -2.5, yMax: 15 });

  const xs = computeIterations(fn, X1, MAX_N);
  const displayN = k + 1;

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);

  function schedule(f, ms) {
    const id = setTimeout(f, ms);
    timeoutsRef.current.push(id);
  }

  function dashSegmentCount(x, y, view) {
    const [dotPx, dotPy] = toGraphPx(x, 0, view);
    const [curvePx, curvePy] = toGraphPx(x, y, view);
    const totalLen = Math.hypot(curvePx - dotPx, curvePy - dotPy);
    return Math.max(1, Math.ceil(totalLen / (DASH_LEN + GAP_LEN)));
  }

  // Drives the slider thumb continuously across one transition's full
  // duration (dash + all pauses + fades), so it reads like it's tracking
  // real elapsed time rather than jumping at each integer. The numeric
  // badge is intentionally NOT driven by this — it only ever shows the
  // last fully-completed x value.
  function driveSliderContinuously(fromK, totalMs, myToken) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    function frame(now) {
      if (myToken !== playTokenRef.current) return;
      const t = Math.min(1, (now - start) / totalMs);
      setContinuousN(fromK + 1 + t);
      if (t < 1) rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  function transitionTotalMs() {
    return DASH_TOTAL_MS + PAUSE_BEFORE_TANGENT_MS + TANGENT_FADE_MS + PAUSE_BEFORE_INTERCEPT_MS + INTERCEPT_FADE_MS;
  }

  // Runs the transition from xs[i] to xs[i+1]: dash-by-dash sketch (always
  // takes the full DASH_TOTAL_MS regardless of physical distance), a pause,
  // the tangent fading in, another pause, then the new point fading in as
  // the next front dot.
  function runTransition(i, myToken) {
    driveSliderContinuously(i, transitionTotalMs(), myToken);
    setPhase('dash');
    setDashesVisible(0);
    const count = dashSegmentCount(xs[i], fn.f(xs[i]), camera.view);
    const stagger = DASH_TOTAL_MS / count;
    for (let d = 1; d <= count; d++) {
      schedule(() => setDashesVisible(d), stagger * d);
    }
    schedule(() => setPhase('tangent'), DASH_TOTAL_MS + PAUSE_BEFORE_TANGENT_MS);
    schedule(() => setPhase('intercept'), DASH_TOTAL_MS + PAUSE_BEFORE_TANGENT_MS + TANGENT_FADE_MS + PAUSE_BEFORE_INTERCEPT_MS);
    schedule(() => {
      const nextK = i + 1;
      setK(nextK);
      setContinuousN(nextK + 1);
      setPhase(null);
      if (nextK < MAX_N - 1) {
        schedule(() => runTransition(nextK, myToken), PAUSE_AFTER_MS);
      } else {
        // reached x4 — a longer hold on the finished picture, then loop back to a fully blank canvas
        schedule(() => {
          setBlank(true);
          setK(0);
          setContinuousN(1);
          setPhase(null);
          schedule(() => { setBlank(false); runTransition(0, myToken); }, DOT_FADE_MS + PAUSE_AFTER_DOT_MS);
        }, FINAL_PAUSE_MS);
      }
    }, DASH_TOTAL_MS + PAUSE_BEFORE_TANGENT_MS + TANGENT_FADE_MS + PAUSE_BEFORE_INTERCEPT_MS + INTERCEPT_FADE_MS);
  }

  function handlePlay() {
    if (playing) {
      setPlaying(false);
      clearTimers();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      playTokenRef.current++;
      return;
    }
    setPlaying(true);
    clearTimers();
    const myToken = ++playTokenRef.current;
    if (blank) {
      schedule(() => { setBlank(false); runTransition(0, myToken); }, DOT_FADE_MS + PAUSE_AFTER_DOT_MS);
    } else if (k >= MAX_N - 1) {
      setBlank(true);
      setK(0);
      setContinuousN(1);
      schedule(() => { setBlank(false); runTransition(0, myToken); }, DOT_FADE_MS + PAUSE_AFTER_DOT_MS);
    } else {
      runTransition(k, myToken);
    }
  }

  // Manual slider drag always jumps to a plain, fully-static view — no
  // animation, matching every other tab's scrub behavior.
  function handleSliderChange(e) {
    setPlaying(false);
    clearTimers();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    playTokenRef.current++;
    setPhase(null);
    setBlank(false);
    const newK = Math.round(parseFloat(e.target.value)) - 1;
    setK(newK);
    setContinuousN(newK + 1);
  }

  // Fully decorated points: indices 0..k-1 only. The current front (index
  // k) is deliberately NOT included here — it's rendered by the overlay
  // below, either as a plain dot (phase===null) or mid-animation. Including
  // it here was the original bug: it made the front point's dash+tangent
  // appear instantly, before its own transition ever started.
  const settledTrail = [];
  for (let idx = 0; idx < k; idx++) {
    const age = k - 1 - idx;
    settledTrail.push({
      key: idx,
      x: xs[idx],
      label: `x${subscriptDigits(idx + 1)}`,
      opacity: age === 0 ? 1 : Math.max(0.15, 1 - age * 0.22),
      isCurrent: false,
      color: TRAIL_COLOR,
    });
  }

  const overlay = (view) => {
    if (blank) return null;
    const i = k;
    if (i >= xs.length) return null;
    const x = xs[i];
    const y = fn.f(x);
    const [dotPx, dotPy] = toGraphPx(x, 0, view);
    const [curvePx, curvePy] = toGraphPx(x, y, view);
    const slope = fn.fp(x);

    // The front dot itself: always fully visible here (its OWN appearance
    // was already handled — either the one-time initial dot fade, or the
    // previous transition's intercept-fade landing here).
    const dotEl = (
      <g>
        <circle cx={dotPx} cy={dotPy} r={4} fill={TRAIL_COLOR} />
        <text x={dotPx} y={dotPy + 16} fontSize={10.5} fontWeight={700} fill={TRAIL_COLOR} textAnchor="middle">
          x{subscriptDigits(i + 1)}
        </text>
      </g>
    );

    if (phase === null) {
      return dotEl; // resting front dot; dash/tangent haven't started yet
    }

    // Dash reveal — segment count derived from actual pixel distance so
    // pacing always spends the full DASH_TOTAL_MS regardless of how close
    // or far this particular point is from the curve. Segments use the
    // exact dash/gap geometry as the settled connector's stroke-dasharray,
    // so there is nothing to "snap" to once fully revealed.
    const totalLen = Math.hypot(curvePx - dotPx, curvePy - dotPy);
    const count = Math.max(1, Math.ceil(totalLen / (DASH_LEN + GAP_LEN)));
    const ux = totalLen > 0 ? (curvePx - dotPx) / totalLen : 0;
    const uy = totalLen > 0 ? (curvePy - dotPy) / totalLen : 0;
    const dashesToShow = phase === 'dash' ? dashesVisible : count;
    const dashes = [];
    for (let d = 0; d < dashesToShow; d++) {
      const segStart = d * (DASH_LEN + GAP_LEN);
      const segEnd = Math.min(segStart + DASH_LEN, totalLen);
      dashes.push(
        <line key={d}
          x1={dotPx + ux * segStart} y1={dotPy + uy * segStart}
          x2={dotPx + ux * segEnd} y2={dotPy + uy * segEnd}
          stroke={COLORS.muted} strokeWidth={1.4} />
      );
    }

    let tangentEl = null;
    if (phase === 'tangent' || phase === 'intercept') {
      const x0 = view.xMin, x1v = view.xMax;
      const ty0 = y + slope * (x0 - x);
      const ty1 = y + slope * (x1v - x);
      const [lx0, ly0] = toGraphPx(x0, ty0, view);
      const [lx1, ly1] = toGraphPx(x1v, ty1, view);
      tangentEl = (
        <FadeIn key={`tangent-${i}`} durationMs={TANGENT_FADE_MS}>
          <line x1={lx0} y1={ly0} x2={lx1} y2={ly1} stroke={TRAIL_COLOR} strokeWidth={2} />
          <circle cx={curvePx} cy={curvePy} r={3.5} fill={TRAIL_COLOR} />
        </FadeIn>
      );
    }

    let interceptEl = null;
    if (phase === 'intercept' && i + 1 < xs.length) {
      const nx = xs[i + 1];
      const [npx, npy] = toGraphPx(nx, 0, view);
      interceptEl = (
        <FadeIn key={`intercept-${i}`} durationMs={INTERCEPT_FADE_MS}>
          <circle cx={npx} cy={npy} r={4.5} fill={TRAIL_COLOR} />
          <text x={npx} y={npy + 16} fontSize={10.5} fontWeight={700} fill={TRAIL_COLOR} textAnchor="middle">
            x{subscriptDigits(i + 2)}
          </text>
        </FadeIn>
      );
    }

    return (
      <g>
        {dotEl}
        {dashes}
        {tangentEl}
        {interceptEl}
      </g>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
      <div style={{ flexShrink: 0, background: COLORS.card, borderRadius: 16, padding: '10px 16px', boxShadow: '0 1px 3px rgba(60,60,90,0.07)', fontSize: 13, color: COLORS.text, lineHeight: 1.45 }}>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.accent, fontWeight: 700, marginBottom: 4 }}>The Big Idea</div>
        <p style={{ margin: '0 0 5px 0' }}>
          Newton&rsquo;s Method finds a root of f(x) by repeatedly replacing a hard problem with an easy one. At your
          current guess, the curve is approximated by its <span style={{ color: COLORS.accent, fontWeight: 600 }}>tangent line</span> &mdash;
          and a tangent line is trivial to solve exactly, so we use{' '}
          <span style={{ color: COLORS.accent, fontWeight: 600 }}>where that tangent line crosses the x-axis</span> as
          our next, hopefully better, guess.
        </p>
        <p style={{ margin: 0 }}>
          Press play to watch it happen: a tangent line appears, its x-intercept is marked, and that intercept becomes
          the starting point for the next tangent line. Watch how quickly the marked points march toward the actual root.
        </p>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', gap: 12, flexWrap: 'wrap', background: COLORS.card, borderRadius: 18, padding: '12px 16px', boxShadow: '0 1px 3px rgba(60,60,90,0.07)' }}>
        <div>
          <FieldCaption>Function</FieldCaption>
          <FixedReadout prefix="f(x) =" value={fn.label} />
        </div>
        <div>
          <FieldCaption>Initial guess &mdash; your first estimate of the root</FieldCaption>
          <FixedReadout prefix="x&#8321; =" value={X1} minWidth={220} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <Graph
            fn={fn} camera={camera} trail={settledTrail} overlay={overlay}
            roots={KNOWN_ROOTS.intro}
            onAutofitClick={() => camera.autofit(fn, xs.slice(0, displayN))}
            overheadPx={515}
          />

          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: COLORS.card, borderRadius: 18, padding: '8px 16px', boxShadow: '0 1px 3px rgba(60,60,90,0.07)' }}>
            <button
              onClick={handlePlay}
              style={{
                width: 30, height: 30, borderRadius: '50%', border: 'none', background: COLORS.accent,
                color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? '\u275a\u275a' : '\u25b6'}
            </button>
            <span style={{ fontSize: 12.5, color: COLORS.muted, fontWeight: 600 }}>n</span>
            <input
              type="range" min={1} max={MAX_N} step="any" value={continuousN}
              onChange={handleSliderChange}
              style={{ flex: 1, accentColor: COLORS.accent }}
            />
            <span style={{
              background: COLORS.accent, color: '#FFFFFF', fontSize: 12, fontWeight: 700,
              padding: '4px 10px', borderRadius: 20, minWidth: 34, textAlign: 'center',
            }}>{displayN}</span>
          </div>
        </div>
        <IterationTable maxN={MAX_N} currentN={displayN} xs={xs} showPlaceholders roseTheme={false} />
      </div>
    </div>
  );
}
