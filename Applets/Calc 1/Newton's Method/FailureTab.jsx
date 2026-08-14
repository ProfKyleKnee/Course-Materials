import React, { useState, useMemo, useEffect, useRef } from 'react';
import { COLORS, FixedReadout, FieldCaption, IterationTable, buildTrail } from '../Shared.jsx';
import Graph, { useCamera } from '../Graph.jsx';
import { computeIterations, formatNum, nearestRootIndex } from '../newtonMath.js';

function computeEdgeBadges(view, xs, n) {
  const offscreen = [];
  for (let i = 0; i < n && i < xs.length; i++) {
    const x = xs[i];
    if (x < view.xMin || x > view.xMax) {
      offscreen.push({ n: i + 1, value: formatNum(x, 2), side: x < view.xMin ? 'left' : 'right' });
    }
  }
  return offscreen.slice(-2);
}

const FIELD_ROW_HEIGHT = 37;

export default function FailureTab({ config }) {
  const [isGood, setIsGood] = useState(false); // loads on the "bad" case per spec, resets on tab remount
  const [n, setN] = useState(1); // every page starts at n=1

  const x1 = config.hasToggle ? (isGood ? config.goodX1 : config.badX1) : config.x1;
  const initialView = config.hasToggle && isGood && config.goodView ? config.goodView : config.defaultView;
  const camera = useCamera(initialView);

  // Eased camera swap + slider reset to n=1, tied to the toggle click
  // (skips the very first mount, which already starts at the right view).
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    const target = config.hasToggle && isGood && config.goodView ? config.goodView : config.defaultView;
    camera.animateTo(target);
    setN(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGood]);

  const xs = useMemo(() => computeIterations(config.fn, x1, config.maxN), [config, x1]);
  const clampedN = Math.min(n, xs.length);
  // Trail/table color ties to toggle state: rose while "bad" is selected
  // (or always, for the no-toggle Diverge tab), blue once "good" is picked.
  const isRose = config.hasToggle ? !isGood : !!config.roseTheme;
  const trail = buildTrail(xs, clampedN, isRose ? COLORS.bad : COLORS.accent);
  const capMessage = config.getCapMessage ? config.getCapMessage(isGood, xs, clampedN) : null;
  const edgeBadges = config.useEdgeBadges ? computeEdgeBadges(camera.view, xs, clampedN) : [];
  const rootHighlight = config.roots && config.roots.length ? nearestRootIndex(config.roots, x1) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
      <div style={{ flexShrink: 0, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', background: COLORS.card, borderRadius: 18, padding: '12px 16px', boxShadow: '0 1px 3px rgba(60,60,90,0.07)' }}>
        <div>
          <FieldCaption>Function</FieldCaption>
          <FixedReadout prefix="f(x) =" value={config.fn.label} />
        </div>
        <div>
          <FieldCaption>Initial guess</FieldCaption>
          <FixedReadout prefix="x&#8321; =" value={x1} />
        </div>
        {config.hasToggle ? (
          <button
            onClick={() => setIsGood((g) => !g)}
            style={{
              padding: '0 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontWeight: 700,
              border: 'none', background: isGood ? COLORS.good : COLORS.bad, color: '#FFFFFF',
              height: FIELD_ROW_HEIGHT, display: 'flex', alignItems: 'center',
            }}
          >
            {isGood ? 'Showing: good guess \u21c4 tap for bad' : 'Showing: bad guess \u21c4 tap for good'}
          </button>
        ) : (
          config.noToggleNote && (
            <div style={{
              background: '#F0F0F8', color: COLORS.muted, fontSize: 12, borderRadius: 10,
              padding: '0 14px', lineHeight: 1.35, height: FIELD_ROW_HEIGHT,
              display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
            }}>
              {config.noToggleNote}
            </div>
          )
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <Graph
            fn={config.fn} camera={camera} trail={trail} edgeBadges={edgeBadges}
            roots={config.roots} rootHighlight={rootHighlight} showRootLegend={!!config.showRootLegend}
            onAutofitClick={() => camera.autofit(config.fn, xs.slice(0, clampedN))}
            overheadPx={445}
          />
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: COLORS.card, borderRadius: 18, padding: '8px 16px', boxShadow: '0 1px 3px rgba(60,60,90,0.07)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12.5, color: COLORS.muted, fontWeight: 600 }}>n</span>
              <input
                type="range" min={1} max={config.maxN} step={1} value={clampedN}
                onChange={(e) => setN(parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: COLORS.accent }}
              />
            </div>
            <span style={{
              background: COLORS.accent, color: '#FFFFFF', fontSize: 12, fontWeight: 700,
              padding: '4px 10px', borderRadius: 20, minWidth: 34, textAlign: 'center',
            }}>{clampedN}</span>
          </div>
        </div>
        <IterationTable maxN={config.maxN} currentN={clampedN} xs={xs} roseTheme={isRose} />
      </div>

      {capMessage && (
        <div style={{ background: capMessage.bg, color: capMessage.color, fontSize: 13, borderRadius: 12, padding: '10px 16px', lineHeight: 1.45 }}>
          {capMessage.text}
        </div>
      )}
    </div>
  );
}
