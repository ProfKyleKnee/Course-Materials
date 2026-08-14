import React, { useState, useMemo } from 'react';
import { COLORS, NumberField, FieldCaption, WarningNote, IterationTable, buildTrail } from '../Shared.jsx';
import Graph, { useCamera } from '../Graph.jsx';
import { compileFunction, FREE_PLAY_PRESETS, computeIterations, assessRisk } from '../newtonMath.js';

const MAX_N = 20;

export default function FreePlayTab() {
  const [presetIdx, setPresetIdx] = useState(1); // x^3 - x active by default, matches mockup
  const [customSrc, setCustomSrc] = useState(FREE_PLAY_PRESETS[1].src);
  const [x1, setX1] = useState(FREE_PLAY_PRESETS[1].defaultX1);
  const [n, setN] = useState(1);
  const [parseError, setParseError] = useState(null);
  const camera = useCamera({ xMin: -3, xMax: 3, yMin: -4, yMax: 4 });

  const fn = useMemo(() => {
    try {
      const compiled = compileFunction(customSrc);
      setParseError(null);
      return compiled;
    } catch (err) {
      setParseError(err.message);
      return { f: () => NaN, fp: () => NaN, label: customSrc };
    }
  }, [customSrc]);

  const xs = useMemo(() => {
    if (parseError) return [x1];
    return computeIterations(fn, x1, MAX_N);
  }, [fn, x1, parseError]);

  const risk = useMemo(() => {
    if (parseError) return null;
    return assessRisk(fn, x1);
  }, [fn, x1, parseError]);

  function selectPreset(i) {
    setPresetIdx(i);
    setCustomSrc(FREE_PLAY_PRESETS[i].src);
    setX1(FREE_PLAY_PRESETS[i].defaultX1);
    setN(1);
  }

  function handleCustomTyped(text) {
    setPresetIdx(-1);
    setCustomSrc(text);
  }

  const clampedN = Math.min(n, xs.length);
  const trail = buildTrail(xs, clampedN, COLORS.accent);

  // If the sequence has converged by the current n, mark that point as
  // the root (green) — generic since Free Play's function is arbitrary.
  const roots = useMemo(() => {
    if (parseError || clampedN < 2) return [];
    const a = xs[clampedN - 1], b = xs[clampedN - 2];
    return Math.abs(a - b) < 1e-6 && isFinite(a) ? [a] : [];
  }, [xs, clampedN, parseError]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
      <div style={{ flexShrink: 0, display: 'flex', gap: 16, flexWrap: 'wrap', background: COLORS.card, borderRadius: 18, padding: '12px 16px', boxShadow: '0 1px 3px rgba(60,60,90,0.07)' }}>
        <div>
          <FieldCaption>Function</FieldCaption>
          <div style={{ display: 'flex', borderRadius: 20, border: `1px solid ${parseError ? COLORS.warning : COLORS.border}`, overflow: 'hidden', background: '#FFFFFF' }}>
            <div style={{ padding: '8px 6px 8px 14px', color: COLORS.muted, fontSize: 14 }}>f(x) =</div>
            <input
              type="text" value={customSrc}
              onChange={(e) => handleCustomTyped(e.target.value)}
              style={{ width: 190, border: 'none', outline: 'none', padding: '8px 14px 8px 4px', fontSize: 14, color: COLORS.text, background: 'transparent' }}
            />
          </div>
          <div style={{ height: 28, visibility: parseError ? 'visible' : 'hidden', paddingTop: 4 }}>
            {parseError && <WarningNote>Couldn&rsquo;t parse that expression &mdash; check syntax.</WarningNote>}
          </div>
        </div>
        <div>
          <FieldCaption>Initial guess</FieldCaption>
          <NumberField value={x1} onChange={setX1} prefix="x&#8321; =" />
          <div style={{ height: 28, visibility: risk ? 'visible' : 'hidden', paddingTop: 4 }}>
            {risk && <WarningNote>{risk.message}</WarningNote>}
          </div>
        </div>
        <div>
          <FieldCaption>Presets</FieldCaption>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
            {FREE_PLAY_PRESETS.map((p, i) => (
              <button
                key={p.src}
                onClick={() => selectPreset(i)}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap',
                  border: `1px solid ${presetIdx === i ? COLORS.accent : COLORS.border}`,
                  background: presetIdx === i ? COLORS.accent : '#FFFFFF',
                  color: presetIdx === i ? '#FFFFFF' : COLORS.text,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <Graph
            fn={fn} camera={camera} trail={trail} roots={roots}
            guessPoint={{ x: x1, onDrag: setX1 }}
            onAutofitClick={() => camera.autofit(fn, xs.slice(0, clampedN))}
            overheadPx={397}
          />

          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: COLORS.card, borderRadius: 18, padding: '8px 16px', boxShadow: '0 1px 3px rgba(60,60,90,0.07)' }}>
            <span style={{ fontSize: 12.5, color: COLORS.muted, fontWeight: 600 }}>n</span>
            <input
              type="range" min={1} max={MAX_N} step={1} value={clampedN}
              onChange={(e) => setN(parseInt(e.target.value, 10))}
              style={{ flex: 1, accentColor: COLORS.accent }}
            />
            <span style={{
              background: COLORS.accent, color: '#FFFFFF', fontSize: 12, fontWeight: 700,
              padding: '4px 10px', borderRadius: 20, minWidth: 34, textAlign: 'center',
            }}>{clampedN}</span>
          </div>
        </div>
        <IterationTable maxN={MAX_N} currentN={clampedN} xs={parseError ? [] : xs} />
      </div>
    </div>
  );
}
