import React, { useRef, useEffect } from 'react';
import { COLORS } from '../Shared.jsx';

function BasinsCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const img = ctx.createImageData(W, H);
    const roots = [[1, 0], [-0.5, Math.sqrt(3) / 2], [-0.5, -Math.sqrt(3) / 2]];
    const colors = [[59, 79, 194], [201, 143, 62], [63, 166, 113]];
    const scale = 2.2;
    const maxIter = 25;
    function cmul(a, b) { return [a[0]*b[0] - a[1]*b[1], a[0]*b[1] + a[1]*b[0]]; }
    function csub(a, b) { return [a[0]-b[0], a[1]-b[1]]; }
    function cdiv(a, b) { const d = b[0]*b[0] + b[1]*b[1]; return [(a[0]*b[0] + a[1]*b[1]) / d, (a[1]*b[0] - a[0]*b[1]) / d]; }
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        let z = [(px / W - 0.5) * 2 * scale, (py / H - 0.5) * 2 * scale];
        let iter = 0;
        for (; iter < maxIter; iter++) {
          const z2 = cmul(z, z), z3 = cmul(z2, z);
          const fz = csub(z3, [1, 0]);
          const fpz = [3 * z2[0], 3 * z2[1]];
          const delta = cdiv(fz, fpz);
          z = csub(z, delta);
          if (Math.hypot(delta[0], delta[1]) < 1e-6) break;
        }
        let best = 0, bestDist = Infinity;
        for (let r = 0; r < roots.length; r++) {
          const d = Math.hypot(z[0]-roots[r][0], z[1]-roots[r][1]);
          if (d < bestDist) { bestDist = d; best = r; }
        }
        const shade = Math.max(0.35, 1 - iter / maxIter);
        const idx = (py * W + px) * 4;
        img.data[idx] = colors[best][0] * shade + 255 * (1 - shade) * 0.15;
        img.data[idx+1] = colors[best][1] * shade + 255 * (1 - shade) * 0.15;
        img.data[idx+2] = colors[best][2] * shade + 255 * (1 - shade) * 0.15;
        img.data[idx+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, []);
  return <canvas ref={ref} width={84} height={84} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

const TOPICS = [
  {
    tier: 'Closest to what you already know',
    title: 'The Secant Method',
    body: 'Instead of a tangent line, use two nearby points on the curve to approximate the slope. This sidesteps needing a formula for f\u2032(x) at all \u2014 handy when the derivative is hard or impossible to find.',
    thumb: (
      <svg viewBox="0 0 200 90" width="100%" height="100%">
        <path d="M10 70 Q80 10 190 30" fill="none" stroke={COLORS.accentLight} strokeWidth={2} />
        <circle cx={50} cy={46} r={3} fill={COLORS.accent} />
        <circle cx={130} cy={20} r={3} fill={COLORS.accent} />
        <line x1={50} y1={46} x2={175} y2={5} stroke={COLORS.amber} strokeWidth={1.5} strokeDasharray="4,3" />
      </svg>
    ),
  },
  {
    tier: 'One step further',
    title: "Halley's Method",
    body: 'Folds in the second derivative \u2014 curvature, not just slope \u2014 for a closer-fitting local approximation. It converges faster near a root than Newton\u2019s Method, at the cost of needing f\u2033(x) too.',
    thumb: (
      <svg viewBox="0 0 84 84" width="100%" height="100%">
        <path d="M8 70 Q42 8 76 40" fill="none" stroke={COLORS.accentLight} strokeWidth={2} />
        <path d="M14 60 Q42 30 70 46" fill="none" stroke={COLORS.amber} strokeWidth={1.5} strokeDasharray="3,3" />
      </svg>
    ),
  },
  {
    tier: 'Where this gets genuinely wild',
    title: 'Basins of Attraction',
    body: 'Push Newton\u2019s Method somewhere new: let the starting guess be a complex number instead of a real one. Color each guess by which root it lands on, and the boundary between colors is a genuine fractal \u2014 this is where a first-semester algorithm quietly connects to chaos theory.',
    thumb: <BasinsCanvas />,
  },
];

export default function OtherReasonsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, maxWidth: 720 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>Beyond Newton&rsquo;s Method</div>
      <div style={{ fontSize: 13.5, color: COLORS.muted, lineHeight: 1.6, marginTop: -8 }}>
        Newton&rsquo;s Method isn&rsquo;t the end of the story &mdash; it&rsquo;s one entry point into a much larger
        toolbox, one that has an entire field named after it, <strong style={{ color: COLORS.text }}>Numerical Analysis</strong>. Here are a few
        doors worth opening if you&rsquo;re curious.
      </div>

      {TOPICS.map((topic) => (
        <div key={topic.title} style={{
          display: 'flex', gap: 18, alignItems: 'center', background: COLORS.card, borderRadius: 16,
          padding: '16px 20px', boxShadow: '0 1px 3px rgba(60,60,90,0.07)',
        }}>
          <div style={{ width: 84, height: 84, flexShrink: 0, background: '#F0F0F8', borderRadius: 12, overflow: 'hidden' }}>
            {topic.thumb}
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLORS.accentLight, fontWeight: 700 }}>
              {topic.tier}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: '2px 0 4px' }}>{topic.title}</div>
            <div style={{ fontSize: 12.5, color: COLORS.muted, lineHeight: 1.5 }}>{topic.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
