import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';

/**
 * Lagrange Multipliers applet — React/JSX port of mockup-3.html, extended with
 * two new features (see spec_4.md "Tangent level curve" section):
 *
 *  - A live, single level curve of f that can either follow the current point
 *    along the constraint ("Follow") or be driven by its own independent
 *    height control ("Custom"), shown in both the 2D and 3D panels and
 *    colored green exactly when it's tangent to the constraint.
 *  - A second top-level tab, "Gradient as Motion", a 4-step guided walkthrough
 *    connecting the tangential component of ∇f along the constraint's own
 *    direction of travel to the slope of h(t) = f(path(t)), and from there to
 *    the Lagrange condition ∇f ∥ ∇g.
 *
 * Tested against three@0.128.0 (matching the original CDN-loaded r128 build
 * this was ported from). Newer three.js versions should also work — only
 * stable, long-standing APIs are used (PerspectiveCamera, WebGLRenderer,
 * PlaneGeometry, Sprite/SpriteMaterial, CanvasTexture, LineSegments, etc.) —
 * but r128 is the version this was actually tested against.
 *
 * npm install three@0.128.0
 */

// =============================================================================
// Shared surface + gradient definitions (pure, no React/Three dependency)
// =============================================================================
const DOMAIN = 6; // world units

const BUMP1 = { A: 3.0, u: -1.1, v: -1.0, sigma: 0.9 };
const BUMP2 = { A: 1.8, u: 1.3, v: 1.1, sigma: 0.8 };

function heightGaussianBump(u, v) {
  const g1 = BUMP1.A * Math.exp(-(((u - BUMP1.u) ** 2 + (v - BUMP1.v) ** 2)) / (2 * BUMP1.sigma * BUMP1.sigma));
  const g2 = BUMP2.A * Math.exp(-(((u - BUMP2.u) ** 2 + (v - BUMP2.v) ** 2)) / (2 * BUMP2.sigma * BUMP2.sigma));
  return g1 + g2;
}

// analytic gradient of f
function gradF(u, v) {
  const g1 = BUMP1.A * Math.exp(-(((u - BUMP1.u) ** 2 + (v - BUMP1.v) ** 2)) / (2 * BUMP1.sigma * BUMP1.sigma));
  const g2 = BUMP2.A * Math.exp(-(((u - BUMP2.u) ** 2 + (v - BUMP2.v) ** 2)) / (2 * BUMP2.sigma * BUMP2.sigma));
  const du = g1 * (-(u - BUMP1.u) / (BUMP1.sigma * BUMP1.sigma)) + g2 * (-(u - BUMP2.u) / (BUMP2.sigma * BUMP2.sigma));
  const dv = g1 * (-(v - BUMP1.v) / (BUMP1.sigma * BUMP1.sigma)) + g2 * (-(v - BUMP2.v) / (BUMP2.sigma * BUMP2.sigma));
  return { du, dv };
}

// -----------------------------------------------------------------------------
// Constraint path presets. Each defines:
//   closed        — whether the path loops (circle) or is a bounded curve
//   point(t)      — t in [0,1] -> {u, v}
//   gradG(u,v)    — analytic gradient of the implicit g(u,v)=0 defining the path
// -----------------------------------------------------------------------------
const PATHS = {
  circle: {
    closed: true,
    radius: 1.6,
    point(t) {
      const a = t * Math.PI * 2;
      return { u: this.radius * Math.cos(a), v: this.radius * Math.sin(a) };
    },
    gradG(u, v) { return { du: 2 * u, dv: 2 * v }; },
  },
  line: {
    closed: false,
    P0: { u: -2.7, v: -2.4 },
    P1: { u: 2.7, v: 2.3 },
    point(t) {
      return {
        u: this.P0.u + (this.P1.u - this.P0.u) * t,
        v: this.P0.v + (this.P1.v - this.P0.v) * t,
      };
    },
    gradG(u, v) {
      const dx = this.P1.u - this.P0.u, dy = this.P1.v - this.P0.v;
      return { du: dy, dv: -dx };
    },
  },
  parabola: {
    closed: false,
    a: 0.32, b: -1.5, uMin: -2.8, uMax: 2.8,
    point(t) {
      const u = this.uMin + (this.uMax - this.uMin) * t;
      return { u, v: this.a * u * u + this.b };
    },
    gradG(u, v) { return { du: -2 * this.a * u, dv: 1 }; },
  },
  wavy: {
    closed: false,
    amp: 1.3, k: 1.15, uMin: -2.8, uMax: 2.8,
    point(t) {
      const u = this.uMin + (this.uMax - this.uMin) * t;
      return { u, v: this.amp * Math.sin(this.k * u) };
    },
    gradG(u, v) { return { du: -this.amp * this.k * Math.cos(this.k * u), dv: 1 }; },
  },
};
const PATH_IDS = ['circle', 'line', 'parabola', 'wavy'];
const PATH_LABELS = { circle: 'Circle', line: 'Line', parabola: 'Parabola', wavy: 'Wavy' };
const PATH_TOOLTIPS = {
  circle: 'A closed loop around the origin — look for two tangency points as it circles both peaks.',
  line: 'A straight cross-section through the domain — typically one max and one min along its length.',
  parabola: 'A curved, open path — watch how the tangency points shift compared to the line.',
  wavy: 'A sine-based path that crosses the terrain repeatedly — usually has several tangency points.',
};

const TOLERANCE_DEG = 6; // tentative, flagged for hands-on tuning in spec

function normalize(du, dv) {
  const len = Math.sqrt(du * du + dv * dv) || 1;
  return { du: du / len, dv: dv / len, len: Math.sqrt(du * du + dv * dv) };
}

// Pure — takes pathId explicitly rather than relying on module-level mutable
// state (the vanilla version used a shared `currentPathId` global; here that
// lives in React state instead).
function tangencyInfoFor(pathId, t) {
  const path = PATHS[pathId];
  const { u, v } = path.point(t);
  const gf = gradF(u, v);
  const gg = path.gradG(u, v);
  const magF = Math.sqrt(gf.du * gf.du + gf.dv * gf.dv);
  const magG = Math.sqrt(gg.du * gg.du + gg.dv * gg.dv);
  let angleDeg = 90;
  if (magF > 1e-6 && magG > 1e-6) {
    const dot = (gf.du * gg.du + gf.dv * gg.dv) / (magF * magG);
    const clamped = Math.max(-1, Math.min(1, dot));
    const raw = Math.acos(clamped) * (180 / Math.PI);
    angleDeg = Math.min(raw, 180 - raw); // 0 = parallel or anti-parallel
  }
  const isTangent = angleDeg <= TOLERANCE_DEG;
  return { u, v, z: heightGaussianBump(u, v), gf, gg, magF, magG, angleDeg, isTangent };
}

// -----------------------------------------------------------------------------
// Per-path sample cache: dense height samples along the path, reused by both
// critical-point finding and the h(t) line-graph polyline on the "Gradient as
// Motion" tab, so neither has to re-sample the path from scratch.
// -----------------------------------------------------------------------------
const SAMPLE_N = 2000;
const pathSampleCache = {};
function getPathSamples(pathId) {
  if (pathSampleCache[pathId]) return pathSampleCache[pathId];
  const path = PATHS[pathId];
  const hVals = new Array(SAMPLE_N + 1);
  for (let i = 0; i <= SAMPLE_N; i++) {
    const { u, v } = path.point(i / SAMPLE_N);
    hVals[i] = heightGaussianBump(u, v);
  }
  pathSampleCache[pathId] = { hVals, N: SAMPLE_N };
  return pathSampleCache[pathId];
}

// -----------------------------------------------------------------------------
// Critical points: local extrema of h(t) = f(pathPoint(t)) along each path.
// By the Lagrange condition, extrema of f restricted to the constraint occur
// exactly where grad f is parallel to grad g — so these are also the
// tangency points, AND the heights at which a level curve of f is exactly
// tangent to the constraint. Found by dense sampling + parabolic refinement,
// cached per path since the underlying surface/paths never change at runtime.
// -----------------------------------------------------------------------------
const criticalPointsCache = {};
function computeCriticalPoints(pathId) {
  if (criticalPointsCache[pathId]) return criticalPointsCache[pathId];
  const path = PATHS[pathId];
  const { hVals, N } = getPathSamples(pathId);
  const results = [];
  const start = path.closed ? 0 : 1;
  const end = path.closed ? N : N - 1;
  for (let i = start; i <= end; i++) {
    const prev = hVals[(i - 1 + N + 1) % (N + 1)];
    const cur = hVals[i];
    const next = hVals[(i + 1) % (N + 1)];
    const isMax = cur > prev && cur > next;
    const isMin = cur < prev && cur < next;
    if (isMax || isMin) {
      const denom = (prev - 2 * cur + next);
      const offset = denom !== 0 ? 0.5 * (prev - next) / denom : 0;
      const tRefined = Math.max(0, Math.min(1, (i + Math.max(-0.5, Math.min(0.5, offset))) / N));
      const { u, v } = path.point(tRefined);
      results.push({ t: tRefined, kind: isMax ? 'max' : 'min', height: heightGaussianBump(u, v) });
    }
  }
  criticalPointsCache[pathId] = results;
  return results;
}

const SNAP_RADIUS = 0.018; // in t-units; tentative, flagged for hands-on tuning
function snapT(t, pathId) {
  const crits = computeCriticalPoints(pathId);
  let best = null, bestDist = SNAP_RADIUS;
  crits.forEach((c) => {
    const d = Math.abs(c.t - t);
    if (d < bestDist) { bestDist = d; best = c.t; }
  });
  return best !== null ? best : t;
}

// Unit tangent direction of the path at t, oriented with increasing t — found
// by finite difference of point() rather than an analytic derivative per
// path, since every preset already defines point(t) and this keeps the
// "Gradient as Motion" tab from needing a fifth per-path function.
const TANGENT_EPS = 0.0015;
function tangentUnitAt(pathId, t) {
  const path = PATHS[pathId];
  let t0 = t - TANGENT_EPS, t1 = t + TANGENT_EPS;
  if (path.closed) {
    t0 = (t0 + 1) % 1; t1 = (t1 + 1) % 1;
  } else {
    t0 = Math.max(0, t0); t1 = Math.min(1, t1);
  }
  const p0 = path.point(t0), p1 = path.point(t1);
  let du = p1.u - p0.u, dv = p1.v - p0.v;
  const len = Math.sqrt(du * du + dv * dv) || 1;
  return { du: du / len, dv: dv / len };
}

// range for surface color ramp — computed once at module load
let minH = Infinity, maxH = -Infinity;
(function computeRange() {
  const n = 80;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const u = -DOMAIN / 2 + (DOMAIN * i) / n;
      const v = -DOMAIN / 2 + (DOMAIN * j) / n;
      const h = heightGaussianBump(u, v);
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
  }
})();

// Low end is a mid-tone lavender-blue (not near-white) so the surface reads
// clearly at every height against a light page background.
function heightColor(h) {
  const low = { r: 0x8E, g: 0x96, b: 0xD6 };
  const high = { r: 0x2A, g: 0x39, b: 0x99 };
  const t = maxH > minH ? (h - minH) / (maxH - minH) : 0.5;
  return {
    r: Math.round(low.r + (high.r - low.r) * t),
    g: Math.round(low.g + (high.g - low.g) * t),
    b: Math.round(low.b + (high.b - low.b) * t),
  };
}

// -----------------------------------------------------------------------------
// Level-curve (isoline) computation via coarse marching squares.
// `heightGrid` is built once; `marchingSquaresAtLevel(thresh)` walks it for
// an arbitrary height and is the shared primitive behind:
//   - the fixed 7-level mesh-netting overlay (`contourSegments`, unchanged
//     behavior from Mockup 3), and
//   - the new live single level curve, recomputed at whatever height the
//     "Level Curve" feature is currently showing (see spec_4.md).
// -----------------------------------------------------------------------------
const GRID = 70;
const LEVELS = 7;

function buildHeightGrid() {
  const grid = [];
  for (let i = 0; i <= GRID; i++) {
    grid.push([]);
    for (let j = 0; j <= GRID; j++) {
      const u = -DOMAIN / 2 + (DOMAIN * i) / GRID;
      const v = -DOMAIN / 2 + (DOMAIN * j) / GRID;
      grid[i].push(heightGaussianBump(u, v));
    }
  }
  return grid;
}
const heightGrid = buildHeightGrid();

function marchingSquaresAtLevel(thresh) {
  const segs = [];
  const lerp = (a, b, tt) => a + (b - a) * tt;
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const u0 = -DOMAIN / 2 + (DOMAIN * i) / GRID, u1 = -DOMAIN / 2 + (DOMAIN * (i + 1)) / GRID;
      const v0 = -DOMAIN / 2 + (DOMAIN * j) / GRID, v1 = -DOMAIN / 2 + (DOMAIN * (j + 1)) / GRID;
      const hA = heightGrid[i][j], hB = heightGrid[i + 1][j], hC = heightGrid[i + 1][j + 1], hD = heightGrid[i][j + 1];
      const corners = [
        { h: hA, u: u0, v: v0 }, { h: hB, u: u1, v: v0 },
        { h: hC, u: u1, v: v1 }, { h: hD, u: u0, v: v1 },
      ];
      const pts = [];
      for (let e = 0; e < 4; e++) {
        const c0 = corners[e], c1 = corners[(e + 1) % 4];
        const above0 = c0.h >= thresh, above1 = c1.h >= thresh;
        if (above0 !== above1) {
          const tt = (thresh - c0.h) / (c1.h - c0.h);
          pts.push({ u: lerp(c0.u, c1.u, tt), v: lerp(c0.v, c1.v, tt) });
        }
      }
      if (pts.length === 2) segs.push([pts[0], pts[1]]);
    }
  }
  return segs;
}

const contourSegments = [];
for (let lvl = 1; lvl <= LEVELS; lvl++) {
  const thresh = minH + (maxH - minH) * (lvl / (LEVELS + 1));
  contourSegments.push(...marchingSquaresAtLevel(thresh));
}

// Tolerance (in height units) for the "Custom" level-curve mode to call its
// freely-chosen height tangent to the constraint — the same role TOLERANCE_DEG
// plays for the angle-based signal elsewhere, just expressed in height space
// since a custom level isn't tied to a point/angle at all. Tentative, flagged
// for hands-on tuning in spec_4.md same as the angle tolerance was.
const LEVEL_HEIGHT_TOL = (maxH - minH) * 0.02;
function isLevelTangentAtHeight(pathId, c) {
  const crits = computeCriticalPoints(pathId);
  let best = Infinity;
  crits.forEach((cp) => { const d = Math.abs(cp.height - c); if (d < best) best = d; });
  return best <= LEVEL_HEIGHT_TOL;
}

// Visual-only scale for the ∇f decomposition drawn on the "Gradient as Motion"
// tab. Unlike the main gradient arrows elsewhere (deliberately fixed-length,
// direction-only), the tangential/normal pieces here must share one scale
// factor with the full vector so they visibly sum back up to it — so this is
// a single clamped multiplier applied to the raw (unnormalized) gradient,
// not a renormalize-to-fixed-length step. Tentative constants, tune by eye.
const DECOMP_SCALE = 0.4;
const DECOMP_MAX_LEN = 2.0;

const PLAY_SPEED = 1 / 7; // fraction of [0,1] per second, tentative

// =============================================================================
// Shared 2D-canvas drawing primitives — used by both the Explore tab's 2D
// panel and the Gradient-as-Motion tab's diagram panel, so the two don't
// duplicate the same world->screen math and arrow-drawing code.
// =============================================================================
function worldToScreen(u, v, w, h) {
  const x = ((u + DOMAIN / 2) / DOMAIN) * w;
  const y = ((DOMAIN / 2 - v) / DOMAIN) * h;
  return [x, y];
}

function drawArrow2D(ctx, toScreen, w, h, anchorU, anchorV, du, dv, color, lineWidth) {
  const n = normalize(du, dv);
  const scaleWorld = 0.95; // fixed world-space length; this panel has no zoom, so already screen-constant
  const tipU = anchorU + n.du * scaleWorld;
  const tipV = anchorV + n.dv * scaleWorld;
  const [x0, y0] = toScreen(anchorU, anchorV, w, h);
  const [x1, y1] = toScreen(tipU, tipV, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const headLen = 8 + lineWidth * 1.4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - headLen * Math.cos(ang - Math.PI / 7), y1 - headLen * Math.sin(ang - Math.PI / 7));
  ctx.lineTo(x1 - headLen * Math.cos(ang + Math.PI / 7), y1 - headLen * Math.sin(ang + Math.PI / 7));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Lazily-built offscreen heightmap texture, shared by both 2D-ish canvases
// (Explore panel + Motion-tab diagram). Built on first use inside an effect,
// not at module-eval time, so this file makes no DOM assumptions at import.
const HEATMAP_RES = 220;
let heatmapCanvasCache = null;
function getHeatmapCanvas() {
  if (heatmapCanvasCache) return heatmapCanvasCache;
  const off = document.createElement('canvas');
  off.width = HEATMAP_RES; off.height = HEATMAP_RES;
  const octx = off.getContext('2d');
  const img = octx.createImageData(HEATMAP_RES, HEATMAP_RES);
  for (let py = 0; py < HEATMAP_RES; py++) {
    for (let px = 0; px < HEATMAP_RES; px++) {
      const u = -DOMAIN / 2 + (DOMAIN * px) / HEATMAP_RES;
      const v = DOMAIN / 2 - (DOMAIN * py) / HEATMAP_RES;
      const h = heightGaussianBump(u, v);
      const c = heightColor(h);
      const idx = (py * HEATMAP_RES + px) * 4;
      img.data[idx] = c.r; img.data[idx + 1] = c.g; img.data[idx + 2] = c.b; img.data[idx + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  heatmapCanvasCache = off;
  return off;
}

// Downsampled h(t) polyline for the Gradient-as-Motion tab's graph — cached
// per path since it doesn't depend on the current slider position.
const hGraphCache = {};
function getHGraphPolyline(pathId) {
  if (hGraphCache[pathId]) return hGraphCache[pathId];
  const { hVals, N } = getPathSamples(pathId);
  const STRIDE = 20;
  const pts = [];
  for (let i = 0; i <= N; i += STRIDE) pts.push({ t: i / N, h: hVals[i] });
  if (pts[pts.length - 1].t !== 1) pts.push({ t: 1, h: hVals[N] });
  hGraphCache[pathId] = pts;
  return pts;
}

// =============================================================================
// "Simple Case" tab — a second, independent surface f(x,y) = xy + 1 (a saddle)
// with a single fixed circular constraint x²+y² = 8 (the classic "maximize/
// minimize xy on a circle" textbook example — exact critical points at
// (±2,±2), unlike the two-Gaussian-bump surface's numerically-found ones).
// Added because the bump surface's terrain makes the level curves hard to
// read at a glance; this tab trades the richer surface for one where the
// hyperbola-shaped level curves (xy+1 = c) are easy to see sweep past the
// circle. Kept as its own small set of `sc`-prefixed functions rather than
// generalizing tangencyInfoFor/computeCriticalPoints/marchingSquaresAtLevel
// to take a surface parameter — this is a second, simpler illustration of
// the same idea, not a multi-surface framework, and duplicating ~60 lines of
// already-correct, tested math is lower-risk than threading a new parameter
// through code the Explore/Motion tabs already depend on.
// =============================================================================
const SC_DOMAIN = 7; // wider than DOMAIN so the r=√8≈2.83 circle sits comfortably inside it

function scHeight(u, v) { return u * v + 1; }
function scGradF(u, v) { return { du: v, dv: u }; } // gradient unaffected by the +1 shift

// z=xy swings roughly ±(SC_DOMAIN/2)² over this domain — much taller relative
// to its footprint than the bump surface's gentle rise, which would look like
// a near-vertical cliff in 3D. SC_Z_SCALE visually compresses only the 3D
// mesh's own Y-coordinate (a standard "vertical exaggeration" control, same
// idea real 3D plotting tools expose) — every readout/level/contour value
// still uses the true, unscaled scHeight. scY() is the single place that
// conversion happens, used only by 3D-building code below.
const SC_Z_SCALE = 0.3; // tentative, tune by eye
function scY(h) { return h * SC_Z_SCALE; }

const SC_R2 = 8; // x² + y² = 8 -- classic "maximize/minimize xy" textbook example
const SC_R = Math.sqrt(SC_R2);
function scPathPoint(t) {
  const a = t * Math.PI * 2;
  return { u: SC_R * Math.cos(a), v: SC_R * Math.sin(a) };
}
function scGradG(u, v) { return { du: 2 * u, dv: 2 * v }; }

function scTangencyInfoFor(t) {
  const { u, v } = scPathPoint(t);
  const gf = scGradF(u, v);
  const gg = scGradG(u, v);
  const magF = Math.sqrt(gf.du * gf.du + gf.dv * gf.dv);
  const magG = Math.sqrt(gg.du * gg.du + gg.dv * gg.dv);
  let angleDeg = 90;
  if (magF > 1e-6 && magG > 1e-6) {
    const dot = (gf.du * gg.du + gf.dv * gg.dv) / (magF * magG);
    const clamped = Math.max(-1, Math.min(1, dot));
    const raw = Math.acos(clamped) * (180 / Math.PI);
    angleDeg = Math.min(raw, 180 - raw);
  }
  const isTangent = angleDeg <= TOLERANCE_DEG;
  return { u, v, z: scHeight(u, v), gf, gg, magF, magG, angleDeg, isTangent };
}

const SC_SAMPLE_N = 2000;
let scHValsCache = null;
function getScHVals() {
  if (scHValsCache) return scHValsCache;
  scHValsCache = new Array(SC_SAMPLE_N + 1);
  for (let i = 0; i <= SC_SAMPLE_N; i++) {
    const { u, v } = scPathPoint(i / SC_SAMPLE_N);
    scHValsCache[i] = scHeight(u, v);
  }
  return scHValsCache;
}

let scCriticalPointsCache = null;
function scComputeCriticalPoints() {
  if (scCriticalPointsCache) return scCriticalPointsCache;
  const hVals = getScHVals();
  const N = SC_SAMPLE_N;
  const results = [];
  for (let i = 0; i <= N; i++) {
    const prev = hVals[(i - 1 + N + 1) % (N + 1)];
    const cur = hVals[i];
    const next = hVals[(i + 1) % (N + 1)];
    const isMax = cur > prev && cur > next;
    const isMin = cur < prev && cur < next;
    if (isMax || isMin) {
      const denom = (prev - 2 * cur + next);
      const offset = denom !== 0 ? 0.5 * (prev - next) / denom : 0;
      const tRefined = Math.max(0, Math.min(1, (i + Math.max(-0.5, Math.min(0.5, offset))) / N));
      const { u, v } = scPathPoint(tRefined);
      results.push({ t: tRefined, kind: isMax ? 'max' : 'min', height: scHeight(u, v) });
    }
  }
  scCriticalPointsCache = results;
  return results;
}

const SC_SNAP_RADIUS = 0.018;
function scSnapT(t) {
  const crits = scComputeCriticalPoints();
  let best = null, bestDist = SC_SNAP_RADIUS;
  crits.forEach((c) => { const d = Math.abs(c.t - t); if (d < bestDist) { bestDist = d; best = c.t; } });
  return best !== null ? best : t;
}

let scMinH = Infinity, scMaxH = -Infinity;
(function scComputeRange() {
  const n = 80;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const u = -SC_DOMAIN / 2 + (SC_DOMAIN * i) / n;
      const v = -SC_DOMAIN / 2 + (SC_DOMAIN * j) / n;
      const h = scHeight(u, v);
      if (h < scMinH) scMinH = h;
      if (h > scMaxH) scMaxH = h;
    }
  }
})();

// Diverging ramp, not the bump surface's sequential low->high one — z=xy is
// genuinely signed (a saddle, not a bump), symmetric about 0 by construction
// here (scMinH = -scMaxH over a centered square domain), so a warm/cool split
// around a pale middle makes the sign of f legible at a glance, not just its
// magnitude — directly supports seeing the two pairs of hyperbola branches.
// Clamped to ±SC_COLOR_RANGE rather than the true ±scMaxH (≈12.25, reached
// only at the domain's far corners, well outside the circle) -- normalizing
// against the full range washed the circle's own neighborhood (where
// |xy| tops out at 4, the critical value) out to a near-white haze. Clamping
// means color saturates fully a bit past the critical points instead, so the
// region that actually matters pedagogically reads with real contrast; the
// level-value sliders still range over the true scMinH..scMaxH, unaffected.
const SC_COLOR_RANGE = 6;

// Level curves (both the fixed mesh overlay and the live draggable one) are
// a bold yellow against the blue/teal/green surface; the fixed circular
// constraint is cyan, and the exact point(s) where the live level curve
// crosses a critical height get their own small red dot -- modeled directly
// on a reference photo Kyle sent of a textbook/lecture-slide rendering of
// this exact surface, which uses this same three-color vocabulary ("yellow
// = a level set of f", "cyan = the constraint", "red = where they touch").
// Kept as paired hex-number/hex-string constants since Three.js materials
// want a number and canvas 2D wants a string -- same pattern the rest of
// this file uses for shared colors.
const SC_LEVEL_COLOR = 0xFFC400;
const SC_LEVEL_COLOR_2D = '#FFC400';
const SC_CONSTRAINT_COLOR = 0x22D3EE;
const SC_CONSTRAINT_COLOR_2D = '#22D3EE';
const SC_CRIT_DOT_COLOR = 0xE5484D;
const SC_CRIT_DOT_COLOR_2D = '#E5484D';
// A darker, more saturated gray than the shared muted-text/∇g color
// (#8A8AA3, used elsewhere in this file for labels as well as the Explore/
// Motion tabs' own ∇g arrows) — scoped to the Simple Case tab only, since
// that's where the low-contrast complaint came from and the other tabs'
// narrative already assumes the existing color.
const SC_GG_COLOR = 0x5B5B74;
const SC_GG_COLOR_2D = '#5B5B74';
// Dark navy outline drawn as a wider mesh directly beneath the cyan
// constraint ribbon, so the ribbon reads as a stroked shape rather than a
// flat color that can blend into the surface's own teal midtones.
const SC_CONSTRAINT_OUTLINE_COLOR = 0x0A2540;
// The shared tangent line at a crossing point, drawn in the 2D panel only —
// a neutral, non-semantic dark gray (reusing the point marker's own dot
// color) rather than any of the yellow/cyan/red/green vocabulary, since it's
// a construction line illustrating a fact *about* those two curves (they
// share a tangent line exactly where ∇f ∥ ∇g, each being perpendicular to
// it), not a fourth thing added to that vocabulary.
const SC_TANGENT_LINE_COLOR_2D = '#3A3A3C';
const SC_TANGENT_LINE_HALFLEN = 1.4; // world units each direction; tentative, tune by eye

// Sequential deep-blue -> teal -> green ramp by true height (low to high,
// not by sign/quadrant) -- replaces an earlier rose/pale/indigo diverging
// scheme Kyle found didn't read well, in favor of the blue-to-green terrain-
// style gradient he pointed to in a reference screenshot (a 3D graphing
// tool's own default surface coloring). Three explicit stops rather than two,
// since a straight blue->green lerp alone looked muddy through the middle —
// the teal midpoint keeps the transition looking intentional.
function scHeightColor(h) {
  const low = { r: 0x1E, g: 0x3C, b: 0x8C };
  const mid = { r: 0x14, g: 0xA3, b: 0x9E };
  const high = { r: 0x4C, g: 0xC2, b: 0x4E };
  const clamped = Math.max(-SC_COLOR_RANGE, Math.min(SC_COLOR_RANGE, h));
  const t = (clamped + SC_COLOR_RANGE) / (2 * SC_COLOR_RANGE);
  const [a, b, s] = t < 0.5 ? [low, mid, t * 2] : [mid, high, (t - 0.5) * 2];
  return {
    r: Math.round(a.r + (b.r - a.r) * s),
    g: Math.round(a.g + (b.g - a.g) * s),
    b: Math.round(a.b + (b.b - a.b) * s),
  };
}

const SC_GRID = 70;
function scBuildHeightGrid() {
  const grid = [];
  for (let i = 0; i <= SC_GRID; i++) {
    grid.push([]);
    for (let j = 0; j <= SC_GRID; j++) {
      const u = -SC_DOMAIN / 2 + (SC_DOMAIN * i) / SC_GRID;
      const v = -SC_DOMAIN / 2 + (SC_DOMAIN * j) / SC_GRID;
      grid[i].push(scHeight(u, v));
    }
  }
  return grid;
}
const scHeightGrid = scBuildHeightGrid();

function scMarchingSquaresAtLevel(thresh) {
  const segs = [];
  const lerp = (a, b, tt) => a + (b - a) * tt;
  for (let i = 0; i < SC_GRID; i++) {
    for (let j = 0; j < SC_GRID; j++) {
      const u0 = -SC_DOMAIN / 2 + (SC_DOMAIN * i) / SC_GRID, u1 = -SC_DOMAIN / 2 + (SC_DOMAIN * (i + 1)) / SC_GRID;
      const v0 = -SC_DOMAIN / 2 + (SC_DOMAIN * j) / SC_GRID, v1 = -SC_DOMAIN / 2 + (SC_DOMAIN * (j + 1)) / SC_GRID;
      const hA = scHeightGrid[i][j], hB = scHeightGrid[i + 1][j], hC = scHeightGrid[i + 1][j + 1], hD = scHeightGrid[i][j + 1];
      const corners = [
        { h: hA, u: u0, v: v0 }, { h: hB, u: u1, v: v0 },
        { h: hC, u: u1, v: v1 }, { h: hD, u: u0, v: v1 },
      ];
      const pts = [];
      for (let e = 0; e < 4; e++) {
        const c0 = corners[e], c1 = corners[(e + 1) % 4];
        const above0 = c0.h >= thresh, above1 = c1.h >= thresh;
        if (above0 !== above1) {
          const tt = (thresh - c0.h) / (c1.h - c0.h);
          pts.push({ u: lerp(c0.u, c1.u, tt), v: lerp(c0.v, c1.v, tt) });
        }
      }
      if (pts.length === 2) segs.push([pts[0], pts[1]]);
    }
  }
  return segs;
}

// Evenly-spaced mesh levels (Kyle's direct request, matching a denser
// reference image he sent of levels fanning out across the whole surface),
// anchored so two of them still land exactly on the real critical heights
// (5 and -3, at (±2,±2)) rather than just somewhere nearby — his earlier,
// separate request. The two constraints turn out to be compatible, not
// coincidentally: since this surface is just xy shifted by a constant, the
// degenerate xy=0 height (= scHeight(0,0)) is always exactly the midpoint
// between the two critical heights, so a step size of
// (critHigh - critLow) / SC_MESH_SUBDIVISIONS keeps the whole grid evenly
// spaced, lands on both critical heights exactly, and lands on the
// degenerate height exactly too — which is then the one level skipped, not
// a real hyperbola but just its two asymptotes crossing (reads as a glitchy
// "X" rather than a curve). The critical heights themselves still come from
// scComputeCriticalPoints(), not hardcoded, so this stays correct if the
// surface/critical points ever change.
const scContourSegments = [];
{
  // Math.min/max over *every* critical point's height, not a dedup-by-Set —
  // the two points sharing each critical height (e.g. (2,2) and (-2,-2),
  // both nominally z=5) are found independently via parabolic refinement at
  // different sample indices along the path, so their computed heights can
  // differ by a tiny floating-point epsilon even though they're
  // mathematically equal. Deduping by exact value treated those as distinct,
  // which previously collapsed scCritLow/scCritHigh onto two nearly-equal
  // values, made scMeshStep ~0, and sent the outward-extension loops below
  // into a nearly-infinite run (crashed with a real `RangeError: Invalid
  // array length`, not a hypothetical) — min/max sidesteps the dedup
  // entirely and is also just simpler.
  const scCritHeights = scComputeCriticalPoints().map((cp) => cp.height);
  const scCritLow = Math.min(...scCritHeights);
  const scCritHigh = Math.max(...scCritHeights);
  const scDegenerateHeight = scHeight(0, 0);
  const SC_MESH_SUBDIVISIONS = 4; // steps between the two critical heights
  const scMeshStep = (scCritHigh - scCritLow) / SC_MESH_SUBDIVISIONS;
  const scMeshLevels = [];
  if (scMeshStep > 1e-3) {
    for (let n = 0; n <= SC_MESH_SUBDIVISIONS; n++) {
      const h = scCritLow + n * scMeshStep;
      if (Math.abs(h - scDegenerateHeight) > 1e-6) scMeshLevels.push(h);
    }
    for (let h = scCritLow - scMeshStep; h > scMinH; h -= scMeshStep) scMeshLevels.push(h);
    for (let h = scCritHigh + scMeshStep; h < scMaxH; h += scMeshStep) scMeshLevels.push(h);
  }
  scMeshLevels.forEach((thresh) => scContourSegments.push(...scMarchingSquaresAtLevel(thresh)));
}

// Tight on purpose — Kyle's direct feedback was that the earlier 2%-of-range
// tolerance made the live level curve read as "tangent" (green) well before
// it visually reached a min/max, which is actively misleading pedagogically.
// A fixed, small height-unit value instead of a range percentage, since the
// two critical heights here are fixed, known numbers (5 and -3) a tolerance
// can be reasoned about directly against. Also used, unchanged, as the
// radius for which critical points get a red crossing-dot — see
// scCriticalPointsNearHeight below — so the green highlight and the red dot
// always appear/disappear together, not at two different precisions.
const SC_LEVEL_HEIGHT_TOL = 0.15;
function scIsLevelTangentAtHeight(c) {
  const crits = scComputeCriticalPoints();
  let best = Infinity;
  crits.forEach((cp) => { const d = Math.abs(cp.height - c); if (d < best) best = d; });
  return best <= SC_LEVEL_HEIGHT_TOL;
}
// All critical points within tolerance of a given level value c — plural,
// since two critical points can share the same height here (e.g. both
// (2,2) and (-2,-2) sit at z=5), so a single "nearest point" wouldn't be
// enough to mark every place the level curve is actually touching.
function scCriticalPointsNearHeight(c) {
  return scComputeCriticalPoints().filter((cp) => Math.abs(cp.height - c) <= SC_LEVEL_HEIGHT_TOL);
}

// Lazily-built offscreen heightmap texture for the Simple Case tab's 2D
// panel — same lazy-on-first-use pattern as getHeatmapCanvas() above.
let scHeatmapCanvasCache = null;
function getScHeatmapCanvas() {
  if (scHeatmapCanvasCache) return scHeatmapCanvasCache;
  const off = document.createElement('canvas');
  off.width = HEATMAP_RES; off.height = HEATMAP_RES;
  const octx = off.getContext('2d');
  const img = octx.createImageData(HEATMAP_RES, HEATMAP_RES);
  for (let py = 0; py < HEATMAP_RES; py++) {
    for (let px = 0; px < HEATMAP_RES; px++) {
      const u = -SC_DOMAIN / 2 + (SC_DOMAIN * px) / HEATMAP_RES;
      const v = SC_DOMAIN / 2 - (SC_DOMAIN * py) / HEATMAP_RES;
      const h = scHeight(u, v);
      const c = scHeightColor(h);
      const idx = (py * HEATMAP_RES + px) * 4;
      img.data[idx] = c.r; img.data[idx + 1] = c.g; img.data[idx + 2] = c.b; img.data[idx + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  scHeatmapCanvasCache = off;
  return off;
}
// A non-square canvas (e.g. the 2D-only view, whose panel is much wider than
// tall once the 3D panel's width collapses to 0) used to get a per-axis
// scale here — stretching the circle into a visibly distorted ellipse. This
// letterboxes instead: one uniform scale from the shorter canvas dimension,
// centered, so world shapes are never stretched, just inset with blank
// margin on the long axis. Used by both scWorldToScreen (per-point) and the
// heatmap background draw (which needs the square side length directly).
function scLetterbox(w, h) {
  const side = Math.min(w, h);
  const scale = side / SC_DOMAIN;
  return { scale, offX: (w - side) / 2, offY: (h - side) / 2, side };
}
function scWorldToScreen(u, v, w, h) {
  const { scale, offX, offY } = scLetterbox(w, h);
  const x = offX + (u + SC_DOMAIN / 2) * scale;
  const y = offY + (SC_DOMAIN / 2 - v) * scale;
  return [x, y];
}

// =============================================================================
// Shared Three.js helpers used by both the Explore tab's 3D effect and the
// Simple Case tab's 3D effect — pure (no closure over either effect's local
// scene state), so hoisted here instead of being redefined in each effect.
// =============================================================================
function makeArrowIconTexture() {
  const w = 64, h = 200;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cx = c.getContext('2d');
  cx.fillStyle = '#ffffff';
  const shaftW = 12, headW = 44, headH = 62;
  cx.fillRect(w / 2 - shaftW / 2, headH, shaftW, h - headH);
  cx.beginPath();
  cx.moveTo(w / 2, 2);
  cx.lineTo(w / 2 - headW / 2, headH);
  cx.lineTo(w / 2 + headW / 2, headH);
  cx.closePath();
  cx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeArrowSprite(texture, color, sizeScale) {
  const mat = new THREE.SpriteMaterial({
    map: texture, color, transparent: true,
    sizeAttenuation: false, depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.center.set(0.5, 0);
  const baseSize = 0.11; // tentative fixed on-screen scale
  sprite.scale.set(baseSize * (64 / 200) * sizeScale, baseSize * sizeScale, 1);
  return { sprite, mat };
}

// A billboarded flat ring+dot group — the exact same construction (and
// radii: 0.16 ring, 0.095 dot) as the Simple Case tab's own point marker, so
// the critical-point dots it also builds from this are guaranteed to read as
// the same size and shape as the marker at every zoom level, not just an
// independently-tuned size that happens to look similar at the default zoom.
// Real world-space geometry (not a sizeAttenuation:false sprite, which the
// marker isn't either) so both shrink/grow with camera distance together.
function makeMarkerDiscGroup(dotColor) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 28),
    new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, depthTest: false, transparent: true })
  );
  group.add(ring);
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.095, 28),
    new THREE.MeshBasicMaterial({ color: dotColor, side: THREE.DoubleSide, depthTest: false, transparent: true })
  );
  dot.position.z = 0.002;
  group.add(dot);
  group.visible = false;
  return group;
}

const ARROW_ROTATION_OFFSET = Math.PI / 2;
function updateArrowRotation(arrow, anchor, dir, cam, w, h) {
  if (w <= 0 || h <= 0) return;
  const tipWorld = anchor.clone().addScaledVector(dir, 0.5);
  const p1 = tipWorld.project(cam);
  const p0 = anchor.clone().project(cam);
  const x1 = (p1.x + 1) / 2 * w, y1 = (1 - p1.y) / 2 * h;
  const x0 = (p0.x + 1) / 2 * w, y0 = (1 - p0.y) / 2 * h;
  arrow.mat.rotation = Math.atan2(y1 - y0, x1 - x0) + ARROW_ROTATION_OFFSET;
}

const TOP_TAB_IDS = ['simple', 'explore', 'motion'];
const TOP_TAB_LABELS = { explore: 'Explore', motion: 'Motion', simple: 'Simple' };
const TOP_TAB_TOOLTIPS = {
  explore: 'Free exploration — paths, gradients, and the movable level curve.',
  motion: 'Gradient as Motion — a guided walkthrough connecting the tangential component of ∇f to the Lagrange condition.',
  simple: 'A simpler example — f(x,y) = xy + 1 with one circular constraint, easier to read the level curves on than the two-bump surface.',
};

// =============================================================================
// Component
// =============================================================================
export default function LagrangeMultipliersApplet() {
  // ---- React state (drives the UI and, via effects, the imperative render layers) ----
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'both' | '2d'
  const [meshVisible, setMeshVisible] = useState(true); // on by default, per Kyle's request — easier to read the level curves against
  const [pathId, setPathId] = useState('circle');
  const [sliderT, setSliderT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tooltip, setTooltip] = useState(null); // { text, left, top } | null

  // ---- top-level tab + "current level curve" feature state ----
  // Defaults to 'simple' — the xy+1 saddle is the easiest entry point into
  // the applet, per Kyle's request to lead with it rather than the harder
  // two-bump Explore surface.
  const [topTab, setTopTab] = useState('simple'); // 'explore' | 'motion' | 'simple'
  const [levelMode, setLevelMode] = useState('off'); // 'off' | 'follow' | 'custom'
  const [customC, setCustomC] = useState(() => (minH + maxH) / 2);
  const [motionStep, setMotionStep] = useState(0); // 0..3

  // ---- refs to DOM nodes ----
  const canvas3dRef = useRef(null);
  const canvas2dRef = useRef(null);
  const panel3dRef = useRef(null);
  const tickLayerRef = useRef(null);

  // ---- refs mirroring state, for read access inside stable rAF closures ----
  const pathIdRef = useRef(pathId);
  const sliderTRef = useRef(sliderT);
  const meshVisibleRef = useRef(meshVisible);
  const isPlayingRef = useRef(isPlaying);
  const levelModeRef = useRef(levelMode);
  const customCRef = useRef(customC);
  useEffect(() => { pathIdRef.current = pathId; }, [pathId]);
  useEffect(() => { sliderTRef.current = sliderT; }, [sliderT]);
  useEffect(() => { meshVisibleRef.current = meshVisible; }, [meshVisible]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { levelModeRef.current = levelMode; }, [levelMode]);
  useEffect(() => { customCRef.current = customC; }, [customC]);

  // ---- ref holding all Three.js state/objects created once on mount ----
  const threeRef = useRef(null);
  // ---- ref holding 2D canvas state created once on mount ----
  const twoDRef = useRef(null);
  // ---- play/loop animation bookkeeping (doesn't need to trigger re-render) ----
  const playRAFRef = useRef(null);
  const lastPlayTimeRef = useRef(null);
  const playDirectionRef = useRef(1);

  const info = useMemo(() => tangencyInfoFor(pathId, sliderT), [pathId, sliderT]);

  // ---------------------------------------------------------------------------
  // Mount-once: set up the Three.js scene, camera, renderer, lights, surface,
  // isoline overlay, ribbon, marker, arrow sprites, live level-curve line,
  // zoom/drag/wheel controls, and the render loop. Mirrors init3D() from the
  // HTML version, plus the new live-level-curve object (see spec_4.md).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvas3dRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F5F5FA');
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(4, 6, 3);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
    dir2.position.set(-4, 3, -3);
    scene.add(dir2);

    // surface
    const geometry = new THREE.PlaneGeometry(DOMAIN, DOMAIN, 90, 90);
    geometry.rotateX(-Math.PI / 2);
    const pos = geometry.attributes.position;
    const colors = [];
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getZ(i);
      const h = heightGaussianBump(u, v);
      pos.setY(i, h);
      const c = heightColor(h);
      colors.push(c.r / 255, c.g / 255, c.b / 255);
    }
    pos.needsUpdate = true;
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true, metalness: 0.05, roughness: 0.62, side: THREE.DoubleSide,
    });
    scene.add(new THREE.Mesh(geometry, material));

    // isoline mesh-netting overlay: lifted contour segments, toggleable
    const isolineGroup = new THREE.Group();
    {
      const positions = [];
      contourSegments.forEach(([p0, p1]) => {
        positions.push(p0.u, heightGaussianBump(p0.u, p0.v) + 0.035, p0.v);
        positions.push(p1.u, heightGaussianBump(p1.u, p1.v) + 0.035, p1.v);
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.85 });
      isolineGroup.add(new THREE.LineSegments(geo, mat));
    }
    isolineGroup.visible = meshVisibleRef.current;
    scene.add(isolineGroup);

    // live single level curve — "Follow" (tied to the current point's height)
    // or "Custom" (its own independent height control). Off by default.
    const liveLevelGeo = new THREE.BufferGeometry();
    const liveLevelMat = new THREE.LineBasicMaterial({ color: 0x3B4FC2, transparent: true, opacity: 0.95, depthTest: false });
    const liveLevelLines = new THREE.LineSegments(liveLevelGeo, liveLevelMat);
    liveLevelLines.visible = false;
    scene.add(liveLevelLines);
    function setLiveLevel(levelValue, visible, tangent) {
      liveLevelLines.visible = visible;
      if (!visible) return;
      const segs = marchingSquaresAtLevel(levelValue);
      const positions = [];
      segs.forEach(([p0, p1]) => {
        positions.push(p0.u, levelValue + 0.045, p0.v);
        positions.push(p1.u, levelValue + 0.045, p1.v);
      });
      liveLevelGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions.length ? positions : [0, 0, 0, 0, 0, 0], 3));
      liveLevelGeo.attributes.position.needsUpdate = true;
      liveLevelGeo.computeBoundingSphere();
      liveLevelMat.color.set(tangent ? 0x4E9E7C : 0x3B4FC2);
    }

    // constraint path ribbon — rebuilt whenever the preset path changes
    let ribbonMesh = null;
    function buildRibbon(activePathId) {
      if (ribbonMesh) { scene.remove(ribbonMesh); ribbonMesh.geometry.dispose(); }
      const path = PATHS[activePathId];
      const N = 240;
      const width = 0.09;
      const eps = 0.001;
      const left = [], right = [];
      const tMax = path.closed ? 1 : 1 - eps;
      for (let i = 0; i <= N; i++) {
        const t = Math.min(i / N, tMax);
        const { u, v } = path.point(t);
        const tNext = path.closed ? t + eps : Math.min(t + eps, 1);
        const { u: u2, v: v2 } = path.point(tNext);
        let tx = u2 - u, tv = v2 - v;
        const len = Math.sqrt(tx * tx + tv * tv) || 1;
        tx /= len; tv /= len;
        const nx = -tv * (width / 2), nv = tx * (width / 2);
        const uL = u + nx, vL = v + nv;
        const uR = u - nx, vR = v - nv;
        left.push(new THREE.Vector3(uL, heightGaussianBump(uL, vL) + 0.05, vL));
        right.push(new THREE.Vector3(uR, heightGaussianBump(uR, vR) + 0.05, vR));
      }
      const positions = [];
      const indices = [];
      for (let i = 0; i <= N; i++) {
        positions.push(left[i].x, left[i].y, left[i].z);
        positions.push(right[i].x, right[i].y, right[i].z);
      }
      for (let i = 0; i < N; i++) {
        const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
        indices.push(a, b, c, b, d, c);
      }
      const ribbonGeo = new THREE.BufferGeometry();
      ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      ribbonGeo.setIndex(indices);
      ribbonGeo.computeVertexNormals();
      const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
      ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
      scene.add(ribbonMesh);
    }
    buildRibbon(pathIdRef.current);

    // ---- marker: billboarded flat ring+dot, always faces the camera ----
    const markerGroupFlat = new THREE.Group();
    const ringGeo = new THREE.CircleGeometry(0.16, 28);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, depthTest: false, transparent: true });
    markerGroupFlat.add(new THREE.Mesh(ringGeo, ringMat));
    const dotGeo = new THREE.CircleGeometry(0.095, 28);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x3A3A3C, side: THREE.DoubleSide, depthTest: false, transparent: true });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    dotMesh.position.z = 0.002;
    markerGroupFlat.add(dotMesh);
    scene.add(markerGroupFlat);

    // ---- gradient vectors: billboarded, fixed-screen-size sprite arrows ----
    const arrowIconTexture = makeArrowIconTexture();
    const ggArrow = makeArrowSprite(arrowIconTexture, 0x8A8AA3, 0.85);
    const gfArrow = makeArrowSprite(arrowIconTexture, 0x3B4FC2, 1.25);
    scene.add(ggArrow.sprite, gfArrow.sprite); // gf added last so it wins ties when coincident

    const ggAnchor = new THREE.Vector3(), gfAnchor = new THREE.Vector3();
    const ggDir = new THREE.Vector3(1, 0, 0), gfDir = new THREE.Vector3(1, 0, 0);

    function applyPointState(activePathId, t) {
      const st = tangencyInfoFor(activePathId, t);
      const tangentColor = st.isTangent ? 0x4E9E7C : 0x3B4FC2;
      const anchorY = st.z + 0.1;

      markerGroupFlat.position.set(st.u, st.z + 0.09, st.v);

      ggAnchor.set(st.u, anchorY, st.v);
      gfAnchor.set(st.u, anchorY, st.v);
      const ngg = normalize(st.gg.du, st.gg.dv);
      const ngf = normalize(st.gf.du, st.gf.dv);
      ggDir.set(ngg.du, 0, ngg.dv);
      gfDir.set(ngf.du, 0, ngf.dv);
      ggArrow.sprite.position.copy(ggAnchor);
      gfArrow.sprite.position.copy(gfAnchor);
      ggArrow.mat.color.set(0x8A8AA3);
      gfArrow.mat.color.set(tangentColor);
    }
    applyPointState(pathIdRef.current, sliderTRef.current);

    // ---- zoom: mouse wheel + on-screen +/- buttons ----
    const camState = { radius: DOMAIN * 1.05, theta: Math.PI * 0.28, phi: Math.PI * 0.32, dragging: false, lastX: 0, lastY: 0 };
    const ZOOM_MIN = DOMAIN * 0.35;
    const ZOOM_MAX = DOMAIN * 2.4;
    function zoomBy(factor) {
      camState.radius = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camState.radius * factor));
    }
    function onWheel(e) {
      e.preventDefault();
      zoomBy(e.deltaY > 0 ? 1.08 : 1 / 1.08);
    }
    canvas.addEventListener('wheel', onWheel, { passive: false });

    function updateCamera() {
      const r = camState.radius;
      camera.position.x = r * Math.sin(camState.phi) * Math.sin(camState.theta);
      camera.position.z = r * Math.sin(camState.phi) * Math.cos(camState.theta);
      camera.position.y = r * Math.cos(camState.phi);
      camera.lookAt(0, 0.6, 0);
    }
    function onPointerDown(e) { camState.dragging = true; camState.lastX = e.clientX; camState.lastY = e.clientY; canvas.setPointerCapture(e.pointerId); }
    function onPointerUp() { camState.dragging = false; }
    function onPointerMove(e) {
      if (!camState.dragging) return;
      const dx = e.clientX - camState.lastX, dy = e.clientY - camState.lastY;
      camState.lastX = e.clientX; camState.lastY = e.clientY;
      camState.theta -= dx * 0.008;
      camState.phi = Math.max(0.15, Math.min(Math.PI - 0.15, camState.phi - dy * 0.008));
    }
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);

    let lastW = 0, lastH = 0;
    function resizeIfNeeded() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w > 0 && h > 0 && (w !== lastW || h !== lastH)) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        lastW = w; lastH = h;
      }
    }

    let rafId = null;
    function animate() {
      rafId = requestAnimationFrame(animate);
      resizeIfNeeded();
      updateCamera();
      markerGroupFlat.quaternion.copy(camera.quaternion);
      updateArrowRotation(ggArrow, ggAnchor, ggDir, camera, lastW, lastH);
      updateArrowRotation(gfArrow, gfAnchor, gfDir, camera, lastW, lastH);
      renderer.render(scene, camera);
    }
    animate();

    threeRef.current = {
      scene, camera, renderer,
      buildRibbon, applyPointState, setLiveLevel,
      setMeshVisible: (v) => { isolineGroup.visible = v; },
      zoomIn: () => zoomBy(1 / 1.15),
      zoomOut: () => zoomBy(1.15),
    };

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      liveLevelGeo.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // ---------------------------------------------------------------------------
  // Mount-once: 2D canvas (heightmap heatmap, contour lines, path, arrows,
  // marker, live level curve). Mirrors init2D() from the HTML version. Reads
  // live state via refs (pathIdRef, sliderTRef, meshVisibleRef, levelModeRef,
  // customCRef) so the loop doesn't need to be recreated on every state change.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvas2dRef.current;
    const ctx = canvas.getContext('2d');
    const heat = getHeatmapCanvas();

    let lastW = 0, lastH = 0;
    function draw() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;
      if (w !== lastW || h !== lastH) {
        canvas.width = w * (window.devicePixelRatio || 1);
        canvas.height = h * (window.devicePixelRatio || 1);
        lastW = w; lastH = h;
      }
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(heat, 0, 0, w, h);

      if (meshVisibleRef.current) {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1;
        contourSegments.forEach(([p0, p1]) => {
          const [x0, y0] = worldToScreen(p0.u, p0.v, w, h);
          const [x1, y1] = worldToScreen(p1.u, p1.v, w, h);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        });
      }

      const path = PATHS[pathIdRef.current];
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const N = 128;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const { u, v } = path.point(t);
        const [x, y] = worldToScreen(u, v, w, h);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const st = tangencyInfoFor(pathIdRef.current, sliderTRef.current);

      if (levelModeRef.current !== 'off') {
        const levelValue = levelModeRef.current === 'follow' ? st.z : customCRef.current;
        const tangent = levelModeRef.current === 'follow' ? st.isTangent : isLevelTangentAtHeight(pathIdRef.current, levelValue);
        const segs = marchingSquaresAtLevel(levelValue);
        ctx.save();
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = tangent ? '#4E9E7C' : '#3B4FC2';
        ctx.lineWidth = 2.6;
        segs.forEach(([p0, p1]) => {
          const [x0, y0] = worldToScreen(p0.u, p0.v, w, h);
          const [x1, y1] = worldToScreen(p1.u, p1.v, w, h);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        });
        ctx.restore();
      }

      drawArrow2D(ctx, worldToScreen, w, h, st.u, st.v, st.gg.du, st.gg.dv, '#8A8AA3', 2.4);
      drawArrow2D(ctx, worldToScreen, w, h, st.u, st.v, st.gf.du, st.gf.dv, st.isTangent ? '#4E9E7C' : '#3B4FC2', 3.4);

      const [mx, my] = worldToScreen(st.u, st.v, w, h);
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3A3A3C';
      ctx.fill();
    }

    let rafId = null;
    function loop() { rafId = requestAnimationFrame(loop); draw(); }
    loop();

    twoDRef.current = { draw };

    return () => cancelAnimationFrame(rafId);
  }, []); // mount once

  // ---------------------------------------------------------------------------
  // Path change: rebuild the ribbon, reset the slider, stop any playback.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (threeRef.current) threeRef.current.buildRibbon(pathId);
    stopPlay();
    playDirectionRef.current = 1;
    setSliderT(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  // ---------------------------------------------------------------------------
  // Slider/path change: push the new point state into the 3D scene.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (threeRef.current) threeRef.current.applyPointState(pathId, sliderT);
  }, [pathId, sliderT]);

  // ---------------------------------------------------------------------------
  // Mesh toggle: update the 3D isoline overlay visibility.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (threeRef.current) threeRef.current.setMeshVisible(meshVisible);
  }, [meshVisible]);

  // ---------------------------------------------------------------------------
  // Live level curve (3D): "Follow" tracks the current point's height every
  // time the slider or path changes; "Custom" tracks its own independent
  // height control instead. See spec_4.md "Tangent level curve" section.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!threeRef.current) return;
    if (levelMode === 'off') { threeRef.current.setLiveLevel(0, false, false); return; }
    const levelValue = levelMode === 'follow' ? info.z : customC;
    const tangent = levelMode === 'follow' ? info.isTangent : isLevelTangentAtHeight(pathId, levelValue);
    threeRef.current.setLiveLevel(levelValue, true, tangent);
  }, [levelMode, customC, pathId, sliderT, info.z, info.isTangent]);

  // ---------------------------------------------------------------------------
  // Play/loop: sweeps the slider automatically. Closed paths (circle) loop
  // continuously; open paths ping-pong back and forth. Snapping is skipped
  // while playing so the sweep stays smooth.
  // ---------------------------------------------------------------------------
  const stopPlay = useCallback(() => {
    setIsPlaying(false);
    if (playRAFRef.current) cancelAnimationFrame(playRAFRef.current);
    playRAFRef.current = null;
    lastPlayTimeRef.current = null;
  }, []);

  const startPlay = useCallback(() => {
    setIsPlaying(true);
    lastPlayTimeRef.current = null;
    const tick = (now) => {
      if (!isPlayingRef.current) return;
      if (lastPlayTimeRef.current === null) lastPlayTimeRef.current = now;
      const dt = (now - lastPlayTimeRef.current) / 1000;
      lastPlayTimeRef.current = now;
      const path = PATHS[pathIdRef.current];
      let t = sliderTRef.current;
      if (path.closed) {
        t = (t + PLAY_SPEED * dt) % 1;
      } else {
        t += PLAY_SPEED * dt * playDirectionRef.current;
        if (t >= 1) { t = 1; playDirectionRef.current = -1; }
        if (t <= 0) { t = 0; playDirectionRef.current = 1; }
      }
      setSliderT(t);
      playRAFRef.current = requestAnimationFrame(tick);
    };
    playRAFRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => { if (playRAFRef.current) cancelAnimationFrame(playRAFRef.current); }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSliderPointerDown = () => { if (isPlayingRef.current) stopPlay(); };
  const handleSliderChange = (e) => {
    const t = snapT(parseFloat(e.target.value), pathId);
    setSliderT(t);
  };
  const handlePlayClick = () => { if (isPlayingRef.current) stopPlay(); else startPlay(); };
  const handlePathClick = (id) => { if (id !== pathId) setPathId(id); };
  const handleCustomCChange = (e) => setCustomC(parseFloat(e.target.value));

  const showTooltip = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const bw = 220;
    let left = rect.left + rect.width / 2 - bw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
    setTooltip({ text, left, top: Math.max(8, rect.top - 44) });
  };
  const hideTooltip = () => setTooltip(null);
  const tt = (text) => ({
    onMouseEnter: (e) => showTooltip(e, text),
    onMouseLeave: hideTooltip,
  });

  const ticks = useMemo(() => computeCriticalPoints(pathId), [pathId]);

  // panel sizing per view mode, mirrors the CSS-driven glide transition
  const panel3dStyle = useMemo(() => {
    if (viewMode === '3d') return { width: '100%', opacity: 1, flexGrow: 1 };
    if (viewMode === '2d') return { width: '0%', opacity: 0, flexGrow: 0, padding: '14px 0' };
    return { width: '50%', opacity: 1, flexGrow: 1 };
  }, [viewMode]);
  const panel2dStyle = useMemo(() => {
    if (viewMode === '2d') return { width: '100%', opacity: 1, flexGrow: 1 };
    if (viewMode === '3d') return { width: '0%', opacity: 0, flexGrow: 0, padding: '14px 0' };
    return { width: '50%', opacity: 1, flexGrow: 1 };
  }, [viewMode]);
  const highlightPos = { '3d': 0, both: 1, '2d': 2 }[viewMode];
  const levelHighlightPos = { off: 0, follow: 1, custom: 2 }[levelMode];

  const levelIsTangent = levelMode === 'off'
    ? false
    : levelMode === 'follow' ? info.isTangent : isLevelTangentAtHeight(pathId, customC);

  return (
    <div style={styles.outer}>
      <div style={styles.card}>
        <div style={styles.banner}>
          <svg style={styles.bannerDecor} viewBox="0 0 1200 130" preserveAspectRatio="none">
            <path d="M0 95 C 200 15, 340 120, 560 45 S 900 5, 1200 75" stroke="white" strokeWidth="2.5" fill="none" />
          </svg>
          <div style={styles.bannerLeft}>
            <a href="../../../browse.html#/applets" style={styles.allAppletsLink}>← All Applets</a>
            <div style={styles.bannerDivider} />
            <div style={styles.bannerTitleStack}>
              <div style={styles.bannerKicker}>Calculus III · Unit 3</div>
              <div style={styles.bannerTitleText}>Lagrange Multipliers Explorer</div>
            </div>
          </div>
          <div style={styles.bannerTabWrap}>
            <div style={{ ...styles.bannerTabHighlight, transform: `translateX(${TOP_TAB_IDS.indexOf(topTab) * 100}%)` }} />
            {TOP_TAB_IDS.map((id) => (
              <button
                key={id}
                onClick={() => setTopTab(id)}
                style={{ ...styles.bannerTabBtn, color: topTab === id ? '#3B4FC2' : '#FFFFFF', opacity: topTab === id ? 1 : 0.78 }}
                {...tt(TOP_TAB_TOOLTIPS[id])}
              >
                {TOP_TAB_LABELS[id]}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.cardBody}>
        <div style={styles.wrap}>
        <p style={styles.subtitle}>
          Drag a level curve until it just grazes the constraint — exactly where ∇f and ∇g line up. Explore freely,
          or switch to "Gradient as Motion" to see why that moment is forced by the math.
        </p>

        {/*
          Both tab bodies are always mounted — only `display` toggles — rather
          than a ternary that mounts/unmounts them. The 3D/2D canvases below
          are driven by mount-once effects bound to their own ref's DOM node;
          unmounting and remounting the <canvas> on every tab switch would
          detach the running Three.js renderer and 2D rAF loop from the page
          (a real bug caught in testing — the 3D panel went blank switching
          back from "Gradient as Motion"). Same "always render, toggle
          visibility" convention documented in applets.md for micro-fades,
          applied here at the tab level for the same underlying reason.
        */}
        <div style={{ display: topTab === 'explore' ? 'block' : 'none' }}>
            <div style={styles.controlsRow}>
              <div style={styles.toggleGroup}>
                <div
                  style={styles.toggle}
                  {...tt('Switch between the 3D surface view, the 2D top-down view, or both side by side.')}
                >
                  <div style={{ ...styles.toggleHighlight, transform: `translateX(${highlightPos * 100}%)` }} />
                  {['3d', 'both', '2d'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{ ...styles.toggleBtn, ...(viewMode === mode ? styles.toggleBtnActive : {}) }}
                    >
                      {mode === '3d' ? '3D' : mode === '2d' ? '2D' : 'Both'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setMeshVisible((v) => !v)}
                  style={{ ...styles.meshBtn, ...(meshVisible ? styles.meshBtnActive : {}) }}
                  {...tt('Toggle the level-curve mesh overlay — 7 fixed reference levels, the same curves shown in the 2D panel, lifted onto the 3D surface.')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
                    <path d="M3 8c3-2 6-2 9 0s6 2 9 0M3 13c3-2 6-2 9 0s6 2 9 0M3 18c3-2 6-2 9 0s6 2 9 0" strokeLinecap="round" />
                  </svg>
                </button>
                <div
                  style={styles.toggle}
                  {...tt('Show a single, movable level curve of f. "Follow" ties it to the current point; "Custom" gives it its own height control — drag it until it just brushes the constraint.')}
                >
                  <div style={{ ...styles.toggleHighlight, transform: `translateX(${levelHighlightPos * 100}%)` }} />
                  {['off', 'follow', 'custom'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setLevelMode(mode)}
                      style={{ ...styles.toggleBtn, ...(levelMode === mode ? styles.toggleBtnActive : {}), width: 86 }}
                    >
                      {mode === 'off' ? 'Level: Off' : mode === 'follow' ? 'Follow' : 'Custom'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.pathTabs}>
                {PATH_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => handlePathClick(id)}
                    style={{ ...styles.pathTabBtn, ...(pathId === id ? styles.pathTabBtnActive : {}) }}
                    {...tt(PATH_TOOLTIPS[id])}
                  >
                    {PATH_LABELS[id]}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.stage}>
              <div ref={panel3dRef} style={{ ...styles.panel, ...panel3dStyle }}>
                <div style={styles.panelLabel}>3D Surface</div>
                <canvas ref={canvas3dRef} style={{ ...styles.canvas, cursor: 'grab' }} />
                <div style={styles.zoomControls}>
                  <button
                    style={styles.zoomBtn}
                    onClick={() => threeRef.current && threeRef.current.zoomIn()}
                    {...tt('Zoom in (scroll wheel also works)')}
                  >+</button>
                  <button
                    style={styles.zoomBtn}
                    onClick={() => threeRef.current && threeRef.current.zoomOut()}
                    {...tt('Zoom out (scroll wheel also works)')}
                  >−</button>
                </div>
              </div>
              <div style={{ ...styles.panel, ...panel2dStyle }}>
                <div style={styles.panelLabel}>2D Plane (top-down)</div>
                <canvas ref={canvas2dRef} style={styles.canvas} />
              </div>
            </div>

            <div style={styles.infoPanel}>
              <div style={styles.panelLabel}>Position Along Path</div>
              <div style={styles.sliderRow}>
                <button
                  onClick={handlePlayClick}
                  style={{ ...styles.playBtn, ...(isPlaying ? styles.playBtnActive : {}) }}
                  {...tt('Play: automatically sweep the point along the path, hands-free (useful for lecture).')}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    {isPlaying ? (
                      <g>
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </g>
                    ) : (
                      <polygon points="6,4 20,12 6,20" />
                    )}
                  </svg>
                </button>
                <div style={styles.sliderTrackWrap}>
                  <input
                    type="range"
                    min="0" max="1" step="0.001"
                    value={sliderT}
                    onPointerDown={handleSliderPointerDown}
                    onChange={handleSliderChange}
                    style={styles.range}
                    {...tt('Drag to move the point along the path. It snaps near the green ticks, where ∇f and ∇g are parallel.')}
                  />
                  <div ref={tickLayerRef} style={styles.tickLayer}>
                    {ticks.map((c, i) => (
                      <div key={i} style={{ ...styles.tickMark, left: `${c.t * 100}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              {levelMode === 'custom' && (
                <div style={styles.sliderRow}>
                  <div style={{ ...styles.levelBadge, ...(levelIsTangent ? styles.levelBadgeTangent : {}) }}>
                    c = {customC.toFixed(2)}
                  </div>
                  <div style={styles.sliderTrackWrap}>
                    <input
                      type="range"
                      min={minH} max={maxH} step={(maxH - minH) / 400}
                      value={customC}
                      onChange={handleCustomCChange}
                      style={styles.range}
                      {...tt('Drag the level curve itself — independent of the point above — until it just brushes the constraint.')}
                    />
                  </div>
                </div>
              )}
              {levelMode === 'follow' && (
                <p style={styles.levelFollowNote}>
                  Level curve = {info.z.toFixed(2)}, following the point above.
                </p>
              )}
            </div>

            <div style={styles.readoutPanel}>
              <ReadoutCard label="x" value={info.u.toFixed(2)} tooltip="The point's coordinates in the domain." tt={tt} />
              <ReadoutCard label="y" value={info.v.toFixed(2)} tooltip="The point's coordinates in the domain." tt={tt} />
              <ReadoutCard label="z = f(x,y)" value={info.z.toFixed(2)} accent tooltip="The surface height f(x,y) at this point." tt={tt} />
              <ReadoutCard
                label="∠(∇f, ∇g)"
                value={`${info.angleDeg.toFixed(1)}°`}
                tangent={info.isTangent}
                tooltip="Angle between ∇f and ∇g, folded to 0–90°. 0° means they're parallel — a candidate max or min of f along the path."
                tt={tt}
              />
              <ReadoutCard label="|∇f|" value={info.magF.toFixed(2)} tooltip="Magnitude (length) of the surface gradient ∇f at this point." tt={tt} />
              <ReadoutCard
                label="|∇g|"
                value={info.magG.toFixed(2)}
                tooltip="Magnitude of the constraint gradient ∇g. Its scale is arbitrary (depends on how the path's equation is written) — the ratio |∇f|/|∇g| at a tangency point is λ."
                tt={tt}
              />
            </div>

            <div style={styles.legend}>
              <span style={styles.legendItem}><span style={{ ...styles.swatch, background: '#3B4FC2' }} />∇f (gradient of surface)</span>
              <span style={styles.legendItem}><span style={{ ...styles.swatch, background: '#8A8AA3' }} />∇g (gradient of constraint)</span>
              <span style={styles.legendItem}><span style={{ ...styles.swatch, background: '#C77B94' }} />not tangent</span>
              <span style={styles.legendItem}><span style={{ ...styles.swatch, background: '#4E9E7C' }} />tangent (within tolerance)</span>
            </div>

            <p style={{ ...styles.summaryText, ...(info.isTangent ? styles.summaryTextTangent : {}) }}>
              {info.isTangent
                ? `Tangent! ∇f and ∇g are parallel here (${info.angleDeg.toFixed(1)}° apart) — a candidate max or min of f along this path.`
                : `Not tangent — ∇f and ∇g are ${info.angleDeg.toFixed(1)}° apart. Drag near a green tick (or hit Play) to find where they line up.`}
              {levelMode === 'custom' && (
                levelIsTangent
                  ? ' The level curve (dashed) is also just brushing the constraint right now — that height is one of the candidate values of f.'
                  : ' The level curve (dashed) is still crossing the constraint at two points, or missing it — slide c until it just grazes, turning green.'
              )}
            </p>

            <p style={styles.note}>
              Drag the 3D surface to rotate, scroll to zoom (or use the +/− buttons). Switch paths above — the slider
              resets to the start of the new path and re-marks the tangency ticks. The mesh button toggles the fixed
              reference levels; the Level toggle shows one movable level curve instead.
            </p>
        </div>

        <div style={{ display: topTab === 'motion' ? 'block' : 'none' }}>
          <MotionTabBody
            pathId={pathId}
            sliderT={sliderT}
            motionStep={motionStep}
            setMotionStep={setMotionStep}
            ticks={ticks}
            info={info}
            isPlaying={isPlaying}
            handlePlayClick={handlePlayClick}
            handleSliderPointerDown={handleSliderPointerDown}
            handleSliderChange={handleSliderChange}
            handlePathClick={handlePathClick}
            topTab={topTab}
            tt={tt}
          />
        </div>

        <div style={{ display: topTab === 'simple' ? 'block' : 'none' }}>
          <SimpleCaseTabBody topTab={topTab} tt={tt} />
        </div>
        </div>
        </div>
      </div>

      <div style={styles.pageCredit}>
        <span style={styles.pageCreditChip}>
          <img src="../../../assets/favicon.svg" alt="" width="28" height="28" />
        </span>
        Professor Kyle Knee · Harper College Mathematics
      </div>

      {tooltip && (
        <div style={{ ...styles.tooltipBubble, left: tooltip.left, top: tooltip.top, opacity: 1, transform: 'translateY(0)' }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

function ReadoutCard({ label, value, accent, tangent, tooltip, tt }) {
  return (
    <div
      style={{ ...styles.readoutCard, ...(tangent ? styles.readoutCardTangent : {}), cursor: tooltip ? 'help' : 'default' }}
      {...(tooltip ? tt(tooltip) : {})}
    >
      <div style={styles.readoutLabel}>{label}</div>
      <div style={{ ...styles.readoutValue, ...(accent ? styles.readoutValueAccent : {}), ...(tangent ? styles.readoutValueTangent : {}) }}>
        {value}
      </div>
    </div>
  );
}

// =============================================================================
// "Gradient as Motion" tab — a 4-step guided walkthrough connecting the
// tangential component of ∇f along the constraint's own direction of travel
// to the slope of h(t) = f(path(t)), and from there to the Lagrange condition
// ∇f ∥ ∇g. See spec_4.md "Gradient as motion along the constraint" section.
// =============================================================================
const MOTION_STEPS = [
  {
    title: 'Direction of travel',
    text: 'As the point moves along the constraint, it has a direction of motion at every instant — shown here as a gray dashed line through the point.',
  },
  {
    title: 'Split ∇f',
    text: '∇f (indigo) also lives at this point. Split it into a piece along the direction of travel (tangential) and a piece perpendicular to it (normal) — the two pieces add back up to ∇f, like the legs of a right triangle.',
  },
  {
    title: 'Watch the graph',
    text: 'The tangential piece is exactly what makes f change as we move — it tracks the slope of h(t) = f(path(t)) on the right. Drag the slider and watch: where the graph goes flat, the tangential piece shrinks toward zero.',
  },
  {
    title: 'The Lagrange condition',
    text: '∇g (gray) is always perpendicular to the direction of travel — that is exactly what makes g = 0 the constraint. So when the tangential piece of ∇f vanishes, ∇f is perpendicular to the direction of travel too — meaning ∇f and ∇g point along the same line. Parallel. That is the Lagrange condition, and it happens exactly where the graph is flat.',
  },
];

const GRAPH_W = 300, GRAPH_H = 150, GRAPH_PAD = 12;

function MotionTabBody({ pathId, sliderT, motionStep, setMotionStep, ticks, info, isPlaying, handlePlayClick, handleSliderPointerDown, handleSliderChange, handlePathClick, topTab, tt }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w <= 0 || h <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(getHeatmapCanvas(), 0, 0, w, h);

    const path = PATHS[pathId];
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const N = 128;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const { u, v } = path.point(t);
      const [x, y] = worldToScreen(u, v, w, h);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const { u, v, gf, gg, isTangent } = info;
    const T = tangentUnitAt(pathId, sliderT);

    // Soft white halo behind every vector/line drawn below, so they stay
    // legible against the heatmap even where its own color happens to be
    // close to a vector's (e.g. deep blue heatmap under the indigo ∇f) —
    // same reasoning as the white-ring markers elsewhere, just via a canvas
    // shadow instead of a second stroke pass.
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.95)';
    ctx.shadowBlur = 4;

    if (motionStep >= 0) {
      const half = 1.5;
      const [tx0, ty0] = worldToScreen(u - T.du * half, v - T.dv * half, w, h);
      const [tx1, ty1] = worldToScreen(u + T.du * half, v + T.dv * half, w, h);
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#B9B9CC';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(tx1, ty1); ctx.stroke();
      ctx.restore();
    }

    if (motionStep >= 1 && motionStep < 2) {
      drawArrow2D(ctx, worldToScreen, w, h, u, v, gf.du, gf.dv, isTangent ? '#4E9E7C' : '#3B4FC2', 3.2);
    }

    if (motionStep >= 2) {
      const magF = Math.sqrt(gf.du * gf.du + gf.dv * gf.dv) || 1;
      const scale = Math.min(DECOMP_SCALE, DECOMP_MAX_LEN / magF);
      const tangScalar = gf.du * T.du + gf.dv * T.dv;
      const tangVec = { du: T.du * tangScalar, dv: T.dv * tangScalar };
      const tipTangU = u + tangVec.du * scale, tipTangV = v + tangVec.dv * scale;
      const tipFullU = u + gf.du * scale, tipFullV = v + gf.dv * scale;
      const [x0, y0] = worldToScreen(u, v, w, h);
      const [x1, y1] = worldToScreen(tipTangU, tipTangV, w, h);
      const [x2, y2] = worldToScreen(tipFullU, tipFullV, w, h);
      ctx.save();
      ctx.strokeStyle = isTangent ? '#4E9E7C' : '#D98BA0';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#8A8AA3';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
      drawArrow2D(ctx, worldToScreen, w, h, u, v, gf.du, gf.dv, isTangent ? '#4E9E7C' : '#3B4FC2', 1.4);
    }

    if (motionStep >= 3) {
      drawArrow2D(ctx, worldToScreen, w, h, u, v, gg.du, gg.dv, isTangent ? '#4E9E7C' : '#8A8AA3', 2.2);
    }

    ctx.restore(); // drop the halo shadow before the marker, drawn crisp

    const [px, py] = worldToScreen(u, v, w, h);
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, 4.4, 0, Math.PI * 2);
    ctx.fillStyle = '#3A3A3C'; ctx.fill();
  }, [pathId, sliderT, motionStep, info, topTab]);

  const graph = useMemo(() => {
    const pts = getHGraphPolyline(pathId);
    const toX = (t) => GRAPH_PAD + t * (GRAPH_W - 2 * GRAPH_PAD);
    const toY = (hv) => GRAPH_PAD + (1 - (hv - minH) / (maxH - minH)) * (GRAPH_H - 2 * GRAPH_PAD);
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.t).toFixed(1)},${toY(p.h).toFixed(1)}`).join(' ');
    const crits = computeCriticalPoints(pathId).map((c) => ({ x: toX(c.t), y: toY(c.height) }));
    const markerX = toX(sliderT), markerY = toY(info.z);
    let slopeLine = null;
    if (motionStep >= 2) {
      const dT = 0.02;
      const path = PATHS[pathId];
      const tL = Math.max(0, sliderT - dT), tR = Math.min(1, sliderT + dT);
      const pL = path.point(tL), pR = path.point(tR);
      const hL = heightGaussianBump(pL.u, pL.v), hR = heightGaussianBump(pR.u, pR.v);
      slopeLine = { x1: toX(tL), y1: toY(hL), x2: toX(tR), y2: toY(hR) };
    }
    return { d, crits, markerX, markerY, slopeLine };
  }, [pathId, sliderT, motionStep, info.z]);

  return (
    <div>
      <div style={styles.pathTabs}>
        {PATH_IDS.map((id) => (
          <button
            key={id}
            onClick={() => handlePathClick(id)}
            style={{ ...styles.pathTabBtn, ...(pathId === id ? styles.pathTabBtnActive : {}) }}
            {...tt(PATH_TOOLTIPS[id])}
          >
            {PATH_LABELS[id]}
          </button>
        ))}
      </div>

      <div style={styles.motionLayout}>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>Constraint &amp; Gradients</div>
          <canvas ref={canvasRef} style={styles.canvas} />
        </div>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>h(t) = f(path(t))</div>
          <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} style={styles.hGraphSvg}>
            <path d={graph.d} fill="none" stroke="#8A8AA3" strokeWidth="2" />
            {graph.crits.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r="3.4" fill="#4E9E7C" opacity="0.85" />)}
            {graph.slopeLine && (
              <line
                x1={graph.slopeLine.x1} y1={graph.slopeLine.y1}
                x2={graph.slopeLine.x2} y2={graph.slopeLine.y2}
                stroke={info.isTangent ? '#4E9E7C' : '#C77B94'} strokeWidth="2.8" strokeLinecap="round"
              />
            )}
            <line
              x1={graph.markerX} y1={GRAPH_PAD} x2={graph.markerX} y2={GRAPH_H - GRAPH_PAD}
              stroke="#D8D8E6" strokeWidth="1" strokeDasharray="3,3"
            />
            <circle cx={graph.markerX} cy={graph.markerY} r="4.6" fill={info.isTangent ? '#4E9E7C' : '#3B4FC2'} />
          </svg>
        </div>
      </div>

      <div style={styles.infoPanel}>
        <div style={styles.panelLabel}>Position Along Path</div>
        <div style={styles.sliderRow}>
          <button
            onClick={handlePlayClick}
            style={{ ...styles.playBtn, ...(isPlaying ? styles.playBtnActive : {}) }}
            {...tt('Play: automatically sweep the point along the path.')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              {isPlaying ? (
                <g>
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </g>
              ) : (
                <polygon points="6,4 20,12 6,20" />
              )}
            </svg>
          </button>
          <div style={styles.sliderTrackWrap}>
            <input
              type="range"
              min="0" max="1" step="0.001"
              value={sliderT}
              onPointerDown={handleSliderPointerDown}
              onChange={handleSliderChange}
              style={styles.range}
            />
            <div style={styles.tickLayer}>
              {ticks.map((c, i) => (
                <div key={i} style={{ ...styles.tickMark, left: `${c.t * 100}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.stepPanel}>
        <div style={styles.stepHeader}>
          <span style={styles.stepBadge}>Step {motionStep + 1} of {MOTION_STEPS.length}</span>
          <span style={styles.stepTitle}>{MOTION_STEPS[motionStep].title}</span>
        </div>
        <p style={styles.stepText}>{MOTION_STEPS[motionStep].text}</p>
        <div style={styles.stepNav}>
          <button
            onClick={() => setMotionStep((s) => Math.max(0, s - 1))}
            disabled={motionStep === 0}
            style={{ ...styles.stepBtn, ...(motionStep === 0 ? styles.stepBtnDisabled : {}) }}
          >
            ← Back
          </button>
          <div style={styles.stepDots}>
            {MOTION_STEPS.map((_, i) => (
              <span key={i} style={{ ...styles.stepDot, ...(i === motionStep ? styles.stepDotActive : {}) }} />
            ))}
          </div>
          <button
            onClick={() => setMotionStep((s) => Math.min(MOTION_STEPS.length - 1, s + 1))}
            disabled={motionStep === MOTION_STEPS.length - 1}
            style={{ ...styles.stepBtn, ...(motionStep === MOTION_STEPS.length - 1 ? styles.stepBtnDisabled : {}) }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// "Simple Case" tab — f(x,y) = xy + 1 with one circular constraint (see the sc*
// surface definitions near the top of the file). Same feature set as Explore
// (3D/2D/Both view, mesh overlay default-on, Level Follow/Custom, slider +
// snap + play, gradient readout + tangency signal) against that surface and
// its single fixed path — no path-tabs row, since there's only one path.
// Owns its own state/refs/effects entirely (not shared with Explore/Motion),
// same pattern MotionTabBody already established for a self-contained tab.
// See spec_4.md "Simple Case tab" for the design log.
// =============================================================================
function SimpleCaseTabBody({ topTab, tt }) {
  // Defaults to '3d' (not 'both') and vectors off — the simplest possible
  // first look at this tab, matching the uncluttered default view Kyle asked
  // for; the 2D panel and gradient vectors are both one click away.
  const [viewMode, setViewMode] = useState('3d');
  const [meshVisible, setMeshVisible] = useState(true);
  const [vectorsVisible, setVectorsVisible] = useState(false);
  // Defaults to 'custom' (not 'follow', unlike Explore) so the drag-the-
  // level-curve-yourself slider is the very first thing visible on this tab
  // — that's the interaction Kyle specifically asked for here.
  const [levelMode, setLevelMode] = useState('custom');
  const [customC, setCustomC] = useState(4);
  const [sliderT, setSliderT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  // Standing (not level-/slider-dependent) red markers at the known max
  // and/or min critical points — Kyle's request: a way to just point at
  // "the maxes" or "the mins" directly while talking, without having to
  // drive the slider or the Custom level curve there first. Independent of
  // levelMode/sliderT entirely.
  const [showMaxPoints, setShowMaxPoints] = useState(false);
  const [showMinPoints, setShowMinPoints] = useState(false);
  // Hide/show the walking point (and its slider) independently of the
  // gradient vectors, so the card can be simplified down to just the
  // surface + level curves for a moment — Kyle's request.
  const [showPoint, setShowPoint] = useState(true);
  const [showSlider, setShowSlider] = useState(true);

  const canvas3dRef = useRef(null);
  const canvas2dRef = useRef(null);
  const threeRef = useRef(null);

  const sliderTRef = useRef(sliderT);
  const meshVisibleRef = useRef(meshVisible);
  const vectorsVisibleRef = useRef(vectorsVisible);
  const levelModeRef = useRef(levelMode);
  const customCRef = useRef(customC);
  const isPlayingRef = useRef(isPlaying);
  const showMaxPointsRef = useRef(showMaxPoints);
  const showMinPointsRef = useRef(showMinPoints);
  const showPointRef = useRef(showPoint);
  useEffect(() => { sliderTRef.current = sliderT; }, [sliderT]);
  useEffect(() => { meshVisibleRef.current = meshVisible; }, [meshVisible]);
  useEffect(() => { vectorsVisibleRef.current = vectorsVisible; }, [vectorsVisible]);
  useEffect(() => { levelModeRef.current = levelMode; }, [levelMode]);
  useEffect(() => { customCRef.current = customC; }, [customC]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { showMaxPointsRef.current = showMaxPoints; }, [showMaxPoints]);
  useEffect(() => { showMinPointsRef.current = showMinPoints; }, [showMinPoints]);
  useEffect(() => { showPointRef.current = showPoint; }, [showPoint]);

  const playRAFRef = useRef(null);
  const lastPlayTimeRef = useRef(null);

  const info = useMemo(() => scTangencyInfoFor(sliderT), [sliderT]);
  const ticks = useMemo(() => scComputeCriticalPoints(), []);

  // ---------------------------------------------------------------------------
  // Mount-once 3D effect — same structure as the Explore tab's, against the
  // sc* surface/path instead, with no path-switching (buildRibbon runs once).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvas3dRef.current;
    if (!canvas) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F5F5FA');
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(4, 6, 3);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
    dir2.position.set(-4, 3, -3);
    scene.add(dir2);

    // surface — scY() visually compresses the vertical axis only; every
    // non-3D use of height (readout, level logic, contours) stays unscaled.
    const geometry = new THREE.PlaneGeometry(SC_DOMAIN, SC_DOMAIN, 90, 90);
    geometry.rotateX(-Math.PI / 2);
    const pos = geometry.attributes.position;
    const colors = [];
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getZ(i);
      const h = scHeight(u, v);
      pos.setY(i, scY(h));
      const c = scHeightColor(h);
      colors.push(c.r / 255, c.g / 255, c.b / 255);
    }
    pos.needsUpdate = true;
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true, metalness: 0.05, roughness: 0.62, side: THREE.DoubleSide,
    });
    scene.add(new THREE.Mesh(geometry, material));

    // isoline mesh-netting overlay — on by default (meshVisibleRef starts true)
    const isolineGroup = new THREE.Group();
    {
      const positions = [];
      scContourSegments.forEach(([p0, p1]) => {
        positions.push(p0.u, scY(scHeight(p0.u, p0.v)) + 0.035, p0.v);
        positions.push(p1.u, scY(scHeight(p1.u, p1.v)) + 0.035, p1.v);
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({ color: SC_LEVEL_COLOR, transparent: true, opacity: 1 });
      isolineGroup.add(new THREE.LineSegments(geo, mat));
    }
    isolineGroup.visible = meshVisibleRef.current;
    scene.add(isolineGroup);

    // live single level curve — "Follow" or "Custom", defaults to visible
    // (levelModeRef starts 'follow')
    const liveLevelGeo = new THREE.BufferGeometry();
    const liveLevelMat = new THREE.LineBasicMaterial({ color: SC_LEVEL_COLOR, transparent: true, opacity: 0.95, depthTest: false });
    const liveLevelLines = new THREE.LineSegments(liveLevelGeo, liveLevelMat);
    liveLevelLines.visible = false;
    scene.add(liveLevelLines);

    // Red crossing-point dots: up to 4 pooled marker-style disc groups
    // (there are 4 critical points total, two per critical height, since
    // e.g. both (2,2) and (-2,-2) sit at z=5) — shown exactly where the
    // live level curve is currently touching a critical height, using the
    // same tight SC_LEVEL_HEIGHT_TOL the curve's own green highlight uses,
    // so the two signals always agree. Only shown in Custom mode (see
    // setLiveLevel's showDots param below) — in Follow mode the point
    // marker itself turns red at a crossing (see applyPointState), and
    // showing a second red dot at the *other* critical point sharing that
    // height would be confusing/redundant there, per Kyle's direct
    // feedback. Pooled rather than created/destroyed per update since at
    // most 4 are ever needed.
    const MAX_CRIT_DOTS = 4;
    const critDotGroups = Array.from({ length: MAX_CRIT_DOTS }, () => {
      const group = makeMarkerDiscGroup(SC_CRIT_DOT_COLOR);
      scene.add(group);
      return group;
    });
    function updateCritDots(levelValue, visible) {
      const matches = visible ? scCriticalPointsNearHeight(levelValue) : [];
      critDotGroups.forEach((group, i) => {
        if (i < matches.length) {
          const cp = matches[i];
          const { u, v } = scPathPoint(cp.t);
          group.position.set(u, scY(cp.height) + 0.1, v);
          group.visible = true;
        } else {
          group.visible = false;
        }
      });
    }

    // Standing max/min markers — unlike the crossing-dot pool above, these
    // sit at the known critical points permanently (not keyed to the live
    // level curve's current height at all), so Kyle can point at "the maxes"
    // or "the mins" without first having to drive the slider or Custom
    // level curve there. Built once at mount since the critical points
    // themselves are fixed constants of this surface.
    const scMaxDiscs = scComputeCriticalPoints().filter((cp) => cp.kind === 'max').map((cp) => {
      const group = makeMarkerDiscGroup(SC_CRIT_DOT_COLOR);
      const { u, v } = scPathPoint(cp.t);
      group.position.set(u, scY(cp.height) + 0.1, v);
      scene.add(group);
      return group;
    });
    const scMinDiscs = scComputeCriticalPoints().filter((cp) => cp.kind === 'min').map((cp) => {
      const group = makeMarkerDiscGroup(SC_CRIT_DOT_COLOR);
      const { u, v } = scPathPoint(cp.t);
      group.position.set(u, scY(cp.height) + 0.1, v);
      scene.add(group);
      return group;
    });
    function updateMaxMinDiscs() {
      scMaxDiscs.forEach((g) => { g.visible = showMaxPointsRef.current; });
      scMinDiscs.forEach((g) => { g.visible = showMinPointsRef.current; });
    }
    updateMaxMinDiscs();

    function setLiveLevel(levelValue, visible, tangent, showDots) {
      liveLevelLines.visible = visible;
      updateCritDots(levelValue, visible && showDots);
      if (!visible) return;
      const segs = scMarchingSquaresAtLevel(levelValue);
      const positions = [];
      segs.forEach(([p0, p1]) => {
        positions.push(p0.u, scY(levelValue) + 0.045, p0.v);
        positions.push(p1.u, scY(levelValue) + 0.045, p1.v);
      });
      liveLevelGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions.length ? positions : [0, 0, 0, 0, 0, 0], 3));
      liveLevelGeo.attributes.position.needsUpdate = true;
      liveLevelGeo.computeBoundingSphere();
      liveLevelMat.color.set(tangent ? 0x4E9E7C : SC_LEVEL_COLOR);
    }

    // constraint ribbon — one fixed circle, built once (no path switching)
    {
      const N = 240;
      const eps = 0.001;
      // Builds one flat ribbon mesh around the fixed circle, at a given half-
      // width/color/height-offset — called twice below, a wider dark one
      // first (an outline) and the normal cyan one on top of it, so the
      // ribbon reads as a stroked shape instead of a flat color that can
      // blend into the surface's own teal midtones.
      function buildRibbonMesh(width, yOffset, color) {
        const left = [], right = [];
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const { u, v } = scPathPoint(t);
          const { u: u2, v: v2 } = scPathPoint(t + eps);
          let tx = u2 - u, tv = v2 - v;
          const len = Math.sqrt(tx * tx + tv * tv) || 1;
          tx /= len; tv /= len;
          const nx = -tv * (width / 2), nv = tx * (width / 2);
          const uL = u + nx, vL = v + nv;
          const uR = u - nx, vR = v - nv;
          left.push(new THREE.Vector3(uL, scY(scHeight(uL, vL)) + yOffset, vL));
          right.push(new THREE.Vector3(uR, scY(scHeight(uR, vR)) + yOffset, vR));
        }
        const positions = [];
        const indices = [];
        for (let i = 0; i <= N; i++) {
          positions.push(left[i].x, left[i].y, left[i].z);
          positions.push(right[i].x, right[i].y, right[i].z);
        }
        for (let i = 0; i < N; i++) {
          const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
          indices.push(a, b, c, b, d, c);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
        scene.add(new THREE.Mesh(geo, mat));
      }
      buildRibbonMesh(0.16, 0.046, SC_CONSTRAINT_OUTLINE_COLOR);
      buildRibbonMesh(0.09, 0.05, SC_CONSTRAINT_COLOR);
    }

    // marker: billboarded flat ring+dot
    const markerGroupFlat = new THREE.Group();
    const ringGeo = new THREE.CircleGeometry(0.16, 28);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, depthTest: false, transparent: true });
    markerGroupFlat.add(new THREE.Mesh(ringGeo, ringMat));
    const dotGeo = new THREE.CircleGeometry(0.095, 28);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x3A3A3C, side: THREE.DoubleSide, depthTest: false, transparent: true });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    dotMesh.position.z = 0.002;
    markerGroupFlat.add(dotMesh);
    scene.add(markerGroupFlat);

    // gradient vectors: billboarded, fixed-screen-size sprite arrows (shared helpers)
    const arrowIconTexture = makeArrowIconTexture();
    const ggArrow = makeArrowSprite(arrowIconTexture, SC_GG_COLOR, 0.85);
    const gfArrow = makeArrowSprite(arrowIconTexture, 0x3B4FC2, 1.25);
    scene.add(ggArrow.sprite, gfArrow.sprite);
    ggArrow.sprite.visible = vectorsVisibleRef.current;
    gfArrow.sprite.visible = vectorsVisibleRef.current;

    const ggAnchor = new THREE.Vector3(), gfAnchor = new THREE.Vector3();
    const ggDir = new THREE.Vector3(1, 0, 0), gfDir = new THREE.Vector3(1, 0, 0);

    function applyPointState(t) {
      const st = scTangencyInfoFor(t);
      const tangentColor = st.isTangent ? 0x4E9E7C : 0x3B4FC2;
      const dispZ = scY(st.z);
      const anchorY = dispZ + 0.1;

      markerGroupFlat.position.set(st.u, dispZ + 0.09, st.v);
      markerGroupFlat.visible = showPointRef.current;
      // The point marker itself turns red right at a max/min, instead of
      // (or in addition to) a separate crossing-dot elsewhere — Kyle's
      // direct request: moving the slider should only ever highlight the
      // point actually under it, not also light up the symmetric partner
      // critical point sharing the same height on the other side.
      dotMat.color.set(st.isTangent ? SC_CRIT_DOT_COLOR : 0x3A3A3C);

      ggAnchor.set(st.u, anchorY, st.v);
      gfAnchor.set(st.u, anchorY, st.v);
      const ngg = normalize(st.gg.du, st.gg.dv);
      const ngf = normalize(st.gf.du, st.gf.dv);
      ggDir.set(ngg.du, 0, ngg.dv);
      gfDir.set(ngf.du, 0, ngf.dv);
      ggArrow.sprite.position.copy(ggAnchor);
      gfArrow.sprite.position.copy(gfAnchor);
      ggArrow.mat.color.set(SC_GG_COLOR);
      gfArrow.mat.color.set(tangentColor);
    }
    applyPointState(sliderTRef.current);

    // zoom/drag orbit camera — pulled back further than Explore's (1.05x) since
    // this surface's un-scaled footprint is larger (SC_DOMAIN=7 vs DOMAIN=6)
    const camState = { radius: SC_DOMAIN * 2.0, theta: Math.PI * 0.8, phi: Math.PI * 0.26, dragging: false, lastX: 0, lastY: 0 };
    const ZOOM_MIN = SC_DOMAIN * 0.35;
    const ZOOM_MAX = SC_DOMAIN * 2.4;
    function zoomBy(factor) { camState.radius = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camState.radius * factor)); }
    function onWheel(e) { e.preventDefault(); zoomBy(e.deltaY > 0 ? 1.08 : 1 / 1.08); }
    canvas.addEventListener('wheel', onWheel, { passive: false });

    function updateCamera() {
      const r = camState.radius;
      camera.position.x = r * Math.sin(camState.phi) * Math.sin(camState.theta);
      camera.position.z = r * Math.sin(camState.phi) * Math.cos(camState.theta);
      camera.position.y = r * Math.cos(camState.phi);
      camera.lookAt(0, 0, 0); // the saddle point sits at height 0, already the natural center
    }
    function onPointerDown(e) { camState.dragging = true; camState.lastX = e.clientX; camState.lastY = e.clientY; canvas.setPointerCapture(e.pointerId); }
    function onPointerUp() { camState.dragging = false; }
    function onPointerMove(e) {
      if (!camState.dragging) return;
      const dx = e.clientX - camState.lastX, dy = e.clientY - camState.lastY;
      camState.lastX = e.clientX; camState.lastY = e.clientY;
      camState.theta -= dx * 0.008;
      camState.phi = Math.max(0.15, Math.min(Math.PI - 0.15, camState.phi - dy * 0.008));
    }
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);

    let lastW = 0, lastH = 0;
    function resizeIfNeeded() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w > 0 && h > 0 && (w !== lastW || h !== lastH)) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        lastW = w; lastH = h;
      }
    }

    let rafId = null;
    function animate() {
      rafId = requestAnimationFrame(animate);
      resizeIfNeeded();
      updateCamera();
      markerGroupFlat.quaternion.copy(camera.quaternion);
      critDotGroups.forEach((group) => { if (group.visible) group.quaternion.copy(camera.quaternion); });
      scMaxDiscs.forEach((group) => { if (group.visible) group.quaternion.copy(camera.quaternion); });
      scMinDiscs.forEach((group) => { if (group.visible) group.quaternion.copy(camera.quaternion); });
      updateArrowRotation(ggArrow, ggAnchor, ggDir, camera, lastW, lastH);
      updateArrowRotation(gfArrow, gfAnchor, gfDir, camera, lastW, lastH);
      renderer.render(scene, camera);
    }
    animate();

    threeRef.current = {
      applyPointState, setLiveLevel,
      setMeshVisible: (v) => { isolineGroup.visible = v; },
      setVectorsVisible: (v) => { ggArrow.sprite.visible = v; gfArrow.sprite.visible = v; },
      setShowPoint: (v) => { markerGroupFlat.visible = v; },
      setShowMaxMin: () => updateMaxMinDiscs(),
      zoomIn: () => zoomBy(1 / 1.15),
      zoomOut: () => zoomBy(1.15),
    };

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      liveLevelGeo.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // ---------------------------------------------------------------------------
  // Mount-once 2D effect — same structure as the Explore tab's, against the
  // sc* surface/path and scWorldToScreen (different domain size) instead.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvas2dRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const heat = getScHeatmapCanvas();

    let lastW = 0, lastH = 0;
    function draw() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;
      if (w !== lastW || h !== lastH) {
        canvas.width = w * (window.devicePixelRatio || 1);
        canvas.height = h * (window.devicePixelRatio || 1);
        lastW = w; lastH = h;
      }
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // Drawn into the letterboxed square region (see scLetterbox), not
      // stretched to the full w×h canvas — a non-square panel (e.g. the
      // 2D-only view) would otherwise stretch the heatmap, and everything
      // drawn on top of it via scWorldToScreen, into a visibly distorted
      // ellipse instead of a circle.
      const lb = scLetterbox(w, h);
      ctx.drawImage(heat, lb.offX, lb.offY, lb.side, lb.side);

      // A soft dark halo behind every level/constraint stroke below, so
      // yellow and cyan both stay legible against whichever part of the
      // blue/teal/green surface they happen to cross — same shadow technique
      // used for the Motion tab's vectors, applied here since yellow-on-
      // green and cyan-on-teal are both real low-contrast risks this
      // surface's own color ramp can produce.
      ctx.save();
      ctx.shadowColor = 'rgba(10,20,40,0.55)';
      ctx.shadowBlur = 3;

      if (meshVisibleRef.current) {
        ctx.strokeStyle = SC_LEVEL_COLOR_2D;
        ctx.lineWidth = 2.2;
        scContourSegments.forEach(([p0, p1]) => {
          const [x0, y0] = scWorldToScreen(p0.u, p0.v, w, h);
          const [x1, y1] = scWorldToScreen(p1.u, p1.v, w, h);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        });
      }

      ctx.strokeStyle = SC_CONSTRAINT_COLOR_2D;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const N = 128;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const { u, v } = scPathPoint(t);
        const [x, y] = scWorldToScreen(u, v, w, h);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const st = scTangencyInfoFor(sliderTRef.current);

      if (levelModeRef.current !== 'off') {
        const levelValue = levelModeRef.current === 'follow' ? st.z : customCRef.current;
        const tangent = levelModeRef.current === 'follow' ? st.isTangent : scIsLevelTangentAtHeight(levelValue);
        const segs = scMarchingSquaresAtLevel(levelValue);
        ctx.save();
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = tangent ? '#4E9E7C' : SC_LEVEL_COLOR_2D;
        ctx.lineWidth = 2.6;
        segs.forEach(([p0, p1]) => {
          const [x0, y0] = scWorldToScreen(p0.u, p0.v, w, h);
          const [x1, y1] = scWorldToScreen(p1.u, p1.v, w, h);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        });
        ctx.restore();

        // Crossing dots + the shared tangent line only in Custom mode — in
        // Follow mode the point marker itself turns red at a crossing (see
        // below), and also drawing a dot at the *other* critical point
        // sharing that height (e.g. both (2,2) and (-2,-2) at z=5) would be
        // confusing/redundant there, per Kyle's direct feedback. Custom's
        // level height is independent of the point, so it can validly touch
        // a critical point the slider isn't anywhere near — that's exactly
        // the case these are for.
        if (levelModeRef.current === 'custom') {
          // Red dot(s), sized/shaped to exactly match the point marker
          // below (same 8/5 radii) — at the exact critical point(s) the
          // level curve is currently crossing. See SC_LEVEL_HEIGHT_TOL's
          // comment for why this uses the same tight tolerance as the green
          // highlight above.
          const crossings = scCriticalPointsNearHeight(levelValue);
          crossings.forEach((cp) => {
            const { u, v } = scPathPoint(cp.t);
            const [dx, dy] = scWorldToScreen(u, v, w, h);
            ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
            ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fillStyle = SC_CRIT_DOT_COLOR_2D; ctx.fill();
          });

          // The shared tangent line itself — at a true crossing, the circle
          // and the level curve touch without crossing, so they share one
          // common tangent line there. Drawn perpendicular to ∇f (equal to
          // ∇g's own direction at this exact point, since that's what
          // "tangent" means) as a short dashed construction line through the
          // point, a visual lead-in to *why* the two gradients end up
          // parallel — both are perpendicular to the same line.
          crossings.forEach((cp) => {
            const { u, v } = scPathPoint(cp.t);
            const grad = scGradF(u, v);
            const glen = Math.sqrt(grad.du * grad.du + grad.dv * grad.dv) || 1;
            const tx = -grad.dv / glen, tv = grad.du / glen; // rotate ∇f by 90°
            const [x0, y0] = scWorldToScreen(u - tx * SC_TANGENT_LINE_HALFLEN, v - tv * SC_TANGENT_LINE_HALFLEN, w, h);
            const [x1, y1] = scWorldToScreen(u + tx * SC_TANGENT_LINE_HALFLEN, v + tv * SC_TANGENT_LINE_HALFLEN, w, h);
            ctx.save();
            // Overrides the outer dark halo with a light one — this line is
            // itself dark, so a dark shadow would do nothing for its
            // contrast against the surface underneath it.
            ctx.shadowColor = 'rgba(255,255,255,0.65)';
            ctx.shadowBlur = 3;
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = SC_TANGENT_LINE_COLOR_2D;
            ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
            ctx.restore();
          });
        }
      }

      ctx.restore(); // drop the halo shadow before the arrows/marker, drawn crisp

      // Standing max/min markers — independent of levelMode/sliderT, so
      // Kyle can point at "the maxes" or "the mins" without first driving
      // the slider or Custom level curve there. Same white-ring/red-dot
      // style as every other critical-point marker in this panel.
      if (showMaxPointsRef.current || showMinPointsRef.current) {
        scComputeCriticalPoints().forEach((cp) => {
          if (cp.kind === 'max' && !showMaxPointsRef.current) return;
          if (cp.kind === 'min' && !showMinPointsRef.current) return;
          const { u, v } = scPathPoint(cp.t);
          const [dx, dy] = scWorldToScreen(u, v, w, h);
          ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
          ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fillStyle = SC_CRIT_DOT_COLOR_2D; ctx.fill();
        });
      }

      if (vectorsVisibleRef.current) {
        drawArrow2D(ctx, scWorldToScreen, w, h, st.u, st.v, st.gg.du, st.gg.dv, SC_GG_COLOR_2D, 2.4);
        drawArrow2D(ctx, scWorldToScreen, w, h, st.u, st.v, st.gf.du, st.gf.dv, st.isTangent ? '#4E9E7C' : '#3B4FC2', 3.4);
      }

      // The point marker itself turns red right at a max/min — see the 3D
      // effect's applyPointState for the matching comment. Hidden entirely
      // when showPointRef is off, per Kyle's request to be able to simplify
      // the card down to just the surface + level curves for a moment.
      if (showPointRef.current) {
        const [mx, my] = scWorldToScreen(st.u, st.v, w, h);
        ctx.beginPath(); ctx.arc(mx, my, 8, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
        ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fillStyle = st.isTangent ? SC_CRIT_DOT_COLOR_2D : '#3A3A3C'; ctx.fill();
      }
    }

    let rafId = null;
    function loop() { rafId = requestAnimationFrame(loop); draw(); }
    loop();

    return () => cancelAnimationFrame(rafId);
  }, []); // mount once

  useEffect(() => {
    if (threeRef.current) threeRef.current.applyPointState(sliderT);
  }, [sliderT]);
  useEffect(() => {
    if (threeRef.current) threeRef.current.setMeshVisible(meshVisible);
  }, [meshVisible]);
  useEffect(() => {
    if (threeRef.current) threeRef.current.setVectorsVisible(vectorsVisible);
  }, [vectorsVisible]);
  useEffect(() => {
    if (threeRef.current) threeRef.current.setShowPoint(showPoint);
  }, [showPoint]);
  useEffect(() => {
    if (threeRef.current) threeRef.current.setShowMaxMin();
  }, [showMaxPoints, showMinPoints]);
  useEffect(() => {
    if (!threeRef.current) return;
    if (levelMode === 'off') { threeRef.current.setLiveLevel(0, false, false, false); return; }
    const levelValue = levelMode === 'follow' ? info.z : customC;
    const tangent = levelMode === 'follow' ? info.isTangent : scIsLevelTangentAtHeight(levelValue);
    // Crossing dots only in Custom mode — see setLiveLevel's own comment.
    threeRef.current.setLiveLevel(levelValue, true, tangent, levelMode === 'custom');
  }, [levelMode, customC, sliderT, info.z, info.isTangent]);

  // Play/loop — the circle is always closed, so this is just a plain modulo
  // sweep, no ping-pong branch needed (unlike the Explore tab's open paths).
  const stopPlay = useCallback(() => {
    setIsPlaying(false);
    if (playRAFRef.current) cancelAnimationFrame(playRAFRef.current);
    playRAFRef.current = null;
    lastPlayTimeRef.current = null;
  }, []);
  const startPlay = useCallback(() => {
    setIsPlaying(true);
    lastPlayTimeRef.current = null;
    const tick = (now) => {
      if (!isPlayingRef.current) return;
      if (lastPlayTimeRef.current === null) lastPlayTimeRef.current = now;
      const dt = (now - lastPlayTimeRef.current) / 1000;
      lastPlayTimeRef.current = now;
      const t = (sliderTRef.current + PLAY_SPEED * dt) % 1;
      setSliderT(t);
      playRAFRef.current = requestAnimationFrame(tick);
    };
    playRAFRef.current = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => { if (playRAFRef.current) cancelAnimationFrame(playRAFRef.current); }, []);

  const handleSliderPointerDown = () => { if (isPlayingRef.current) stopPlay(); };
  const handleSliderChange = (e) => setSliderT(scSnapT(parseFloat(e.target.value)));
  const handlePlayClick = () => { if (isPlayingRef.current) stopPlay(); else startPlay(); };
  const handleCustomCChange = (e) => setCustomC(parseFloat(e.target.value));

  const panel3dStyle = useMemo(() => {
    if (viewMode === '3d') return { width: '100%', opacity: 1, flexGrow: 1 };
    if (viewMode === '2d') return { width: '0%', opacity: 0, flexGrow: 0, padding: '14px 0' };
    return { width: '50%', opacity: 1, flexGrow: 1 };
  }, [viewMode]);
  const panel2dStyle = useMemo(() => {
    if (viewMode === '2d') return { width: '100%', opacity: 1, flexGrow: 1 };
    if (viewMode === '3d') return { width: '0%', opacity: 0, flexGrow: 0, padding: '14px 0' };
    return { width: '50%', opacity: 1, flexGrow: 1 };
  }, [viewMode]);
  const highlightPos = { '3d': 0, both: 1, '2d': 2 }[viewMode];
  const levelHighlightPos = { off: 0, follow: 1, custom: 2 }[levelMode];
  const levelIsTangent = levelMode === 'off' ? false : levelMode === 'follow' ? info.isTangent : scIsLevelTangentAtHeight(customC);

  return (
    <div>
      <p style={styles.subtitle}>
        A simpler surface — f(x,y) = xy + 1 — with one fixed circle, x² + y² = 8. The level curves are
        hyperbolas (xy+1 = c); watch one sweep past the circle as c changes. Grid lines are on by default here too.
      </p>

      {/* Three labeled control sections, split by what each one actually
          does (Kyle's request) rather than one undifferentiated row of
          icon buttons: VIEW (what's on screen), LEVEL CURVE (the level-set
          interaction, plus the fixed mesh and the standing max/min
          markers — all "about the level curves"), and POINT & GRADIENT
          (everything about the walking point itself — show/hide it,
          show/hide its slider, and the ∇f/∇g arrows anchored to it). */}
      <div style={styles.controlSectionsRow}>
        <div style={styles.controlSection}>
          <div style={styles.panelLabel}>View</div>
          <div
            style={styles.toggle}
            {...tt('Switch between the 3D surface view, the 2D top-down view, or both side by side.')}
          >
            <div style={{ ...styles.toggleHighlight, transform: `translateX(${highlightPos * 100}%)` }} />
            {['3d', 'both', '2d'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{ ...styles.toggleBtn, ...(viewMode === mode ? styles.toggleBtnActive : {}) }}
              >
                {mode === '3d' ? '3D' : mode === '2d' ? '2D' : 'Both'}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.controlSection}>
          <div style={styles.panelLabel}>Level Curve</div>
          <div style={styles.toggleGroup}>
            <div
              style={styles.toggle}
              {...tt('Show a single, movable level curve of f. "Follow" ties it to the current point; "Custom" gives it its own height control.')}
            >
              <div style={{ ...styles.toggleHighlight, transform: `translateX(${levelHighlightPos * 100}%)` }} />
              {['off', 'follow', 'custom'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLevelMode(mode)}
                  style={{ ...styles.toggleBtn, ...(levelMode === mode ? styles.toggleBtnActive : {}), width: 86 }}
                >
                  {mode === 'off' ? 'Level: Off' : mode === 'follow' ? 'Follow' : 'Custom'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMeshVisible((v) => !v)}
              style={{ ...styles.meshBtn, ...(meshVisible ? styles.meshBtnActive : {}) }}
              {...tt('Toggle the fixed level-curve mesh overlay (including the max and min heights themselves), lifted onto the 3D surface.')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
                <path d="M3 8c3-2 6-2 9 0s6 2 9 0M3 13c3-2 6-2 9 0s6 2 9 0M3 18c3-2 6-2 9 0s6 2 9 0" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => setShowMaxPoints((v) => !v)}
              style={{ ...styles.smallPillBtn, ...(showMaxPoints ? styles.smallPillBtnActive : {}) }}
              {...tt('Show a standing red marker at the maximum point(s), regardless of the slider or level curve.')}
            >
              Max
            </button>
            <button
              onClick={() => setShowMinPoints((v) => !v)}
              style={{ ...styles.smallPillBtn, ...(showMinPoints ? styles.smallPillBtnActive : {}) }}
              {...tt('Show a standing red marker at the minimum point(s), regardless of the slider or level curve.')}
            >
              Min
            </button>
          </div>
        </div>

        <div style={styles.controlSection}>
          <div style={styles.panelLabel}>Point & Gradient</div>
          <div style={styles.toggleGroup}>
            <button
              onClick={() => setShowPoint((v) => !v)}
              style={{ ...styles.meshBtn, ...(showPoint ? styles.meshBtnActive : {}) }}
              {...tt('Show or hide the walking point itself (in both panels).')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="6" fill="currentColor" /></svg>
            </button>
            <button
              onClick={() => setShowSlider((v) => !v)}
              style={{ ...styles.meshBtn, ...(showSlider ? styles.meshBtnActive : {}) }}
              {...tt('Show or hide the Position Along Circle slider below.')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
                <circle cx="14" cy="12" r="3.2" fill="currentColor" stroke="none" />
              </svg>
            </button>
            <button
              onClick={() => setVectorsVisible((v) => !v)}
              style={{ ...styles.meshBtn, ...(vectorsVisible ? styles.meshBtnActive : {}) }}
              {...tt('Toggle the ∇f/∇g gradient vectors on or off.')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                <line x1="4" y1="20" x2="18" y2="6" strokeLinecap="round" />
                <path d="M10 6h8v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div style={styles.stage}>
        <div style={{ ...styles.panel, ...panel3dStyle }}>
          <div style={styles.panelLabel}>3D Surface</div>
          <canvas ref={canvas3dRef} style={{ ...styles.canvas, cursor: 'grab' }} />
          <div style={styles.zoomControls}>
            <button style={styles.zoomBtn} onClick={() => threeRef.current && threeRef.current.zoomIn()} {...tt('Zoom in (scroll wheel also works)')}>+</button>
            <button style={styles.zoomBtn} onClick={() => threeRef.current && threeRef.current.zoomOut()} {...tt('Zoom out (scroll wheel also works)')}>−</button>
          </div>
        </div>
        <div style={{ ...styles.panel, ...panel2dStyle }}>
          <div style={styles.panelLabel}>2D Plane (top-down)</div>
          <canvas ref={canvas2dRef} style={styles.canvas} />
        </div>
      </div>

      {(showSlider || levelMode !== 'off') && (
      <div style={styles.infoPanel}>
        {showSlider && (
          <>
            <div style={styles.panelLabel}>Position Along Circle</div>
            <div style={styles.sliderRow}>
              <button
                onClick={handlePlayClick}
                style={{ ...styles.playBtn, ...(isPlaying ? styles.playBtnActive : {}) }}
                {...tt('Play: automatically sweep the point around the circle.')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  {isPlaying ? (
                    <g><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></g>
                  ) : (
                    <polygon points="6,4 20,12 6,20" />
                  )}
                </svg>
              </button>
              <div style={styles.sliderTrackWrap}>
                <input
                  type="range"
                  min="0" max="1" step="0.001"
                  value={sliderT}
                  onPointerDown={handleSliderPointerDown}
                  onChange={handleSliderChange}
                  style={styles.range}
                  {...tt('Drag to move the point around the circle. It snaps near the green ticks, where ∇f and ∇g are parallel.')}
                />
                <div style={styles.tickLayer}>
                  {ticks.map((c, i) => (
                    <div key={i} style={{ ...styles.tickMark, left: `${c.t * 100}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {levelMode === 'custom' && (
          <div style={styles.sliderRow}>
            <div style={{ ...styles.levelBadge, ...(levelIsTangent ? styles.levelBadgeTangent : {}) }}>
              c = {customC.toFixed(2)}
            </div>
            <div style={styles.sliderTrackWrap}>
              <input
                type="range"
                min={scMinH} max={scMaxH} step={(scMaxH - scMinH) / 400}
                value={customC}
                onChange={handleCustomCChange}
                style={styles.range}
                {...tt('Drag the level curve itself — independent of the point above — until it just brushes the circle.')}
              />
            </div>
          </div>
        )}
        {levelMode === 'follow' && (
          <p style={styles.levelFollowNote}>Level curve = {info.z.toFixed(2)}, following the point above.</p>
        )}
      </div>
      )}

      <div style={styles.readoutPanel}>
        <ReadoutCard label="x" value={info.u.toFixed(2)} tooltip="The point's coordinates in the domain." tt={tt} />
        <ReadoutCard label="y" value={info.v.toFixed(2)} tooltip="The point's coordinates in the domain." tt={tt} />
        <ReadoutCard label="z = xy+1" value={info.z.toFixed(2)} accent tooltip="The surface height f(x,y) = xy+1 at this point." tt={tt} />
        <ReadoutCard
          label="∠(∇f, ∇g)"
          value={`${info.angleDeg.toFixed(1)}°`}
          tangent={info.isTangent}
          tooltip="Angle between ∇f and ∇g, folded to 0–90°. 0° means they're parallel — a candidate max or min of f on the circle."
          tt={tt}
        />
        <ReadoutCard label="|∇f|" value={info.magF.toFixed(2)} tooltip="Magnitude of the surface gradient ∇f at this point." tt={tt} />
        <ReadoutCard label="|∇g|" value={info.magG.toFixed(2)} tooltip="Magnitude of the constraint gradient ∇g." tt={tt} />
      </div>

      <div style={styles.legend}>
        <span style={styles.legendItem}><span style={{ ...styles.swatch, background: '#3B4FC2' }} />∇f (gradient of surface)</span>
        <span style={styles.legendItem}><span style={{ ...styles.swatch, background: SC_GG_COLOR_2D }} />∇g (gradient of constraint)</span>
        <span style={styles.legendItem}><span style={{ ...styles.swatch, background: '#C77B94' }} />not tangent</span>
        <span style={styles.legendItem}><span style={{ ...styles.swatch, background: '#4E9E7C' }} />tangent (within tolerance)</span>
      </div>

      <p style={{ ...styles.summaryText, ...(info.isTangent ? styles.summaryTextTangent : {}) }}>
        {info.isTangent
          ? `Tangent! ∇f and ∇g are parallel here (${info.angleDeg.toFixed(1)}° apart) — one of the four critical points at (±2, ±2).`
          : `Not tangent — ∇f and ∇g are ${info.angleDeg.toFixed(1)}° apart. Drag near a green tick (or hit Play) to find where they line up.`}
      </p>

      <p style={styles.note}>
        Drag the 3D surface to rotate, scroll to zoom. The vertical axis is visually compressed here (xy swings
        much more steeply than the two-bump surface) so the saddle stays readable — the readout above always
        shows the true, unscaled value. In the 2D view, a short dashed line marks the tangent line shared by
        the circle and the level curve right where they touch — ∇f and ∇g are parallel there because both
        are perpendicular to that same shared tangent line.
      </p>
    </div>
  );
}

// =============================================================================
// Styles (Cloud Pastel palette, matching the rest of the applet suite)
// =============================================================================
const styles = {
  // Canonical full-viewport outer wrapper — see applets.md "Header pattern".
  // height:"100%" (not minHeight:"100vh") cooperates with the shared
  // html/body/#root flex-column rules in ../../shared/applet-header.css.
  outer: {
    height: '100%', boxSizing: 'border-box', background: '#E8E8F2', padding: '24px 24px 0',
    display: 'flex', flexDirection: 'column',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", color: '#3A3A3C',
  },
  card: {
    maxWidth: 1200, width: '100%', margin: '0 auto', background: '#F5F5FA',
    borderRadius: '20px', boxShadow: '0 4px 24px rgba(60,60,90,0.14)', overflow: 'hidden', flexShrink: 0,
  },
  banner: {
    position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 16, padding: '16px 28px',
    background: 'linear-gradient(135deg, #3B4FC2, #4A5CD6)',
  },
  bannerDecor: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.14, pointerEvents: 'none' },
  bannerLeft: { display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 },
  allAppletsLink: {
    display: 'inline-flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.88)', textDecoration: 'none',
    fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', padding: '6px 10px', borderRadius: 8,
    background: 'rgba(255,255,255,0.12)',
  },
  bannerDivider: { width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.22)' },
  bannerTitleStack: { display: 'flex', flexDirection: 'column', gap: 2 },
  bannerKicker: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  bannerTitleText: { fontSize: 24, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.005em' },

  bannerTabWrap: {
    position: 'relative', zIndex: 1, display: 'flex', background: 'rgba(255,255,255,0.14)',
    borderRadius: 20, padding: 4, flexShrink: 0,
  },
  bannerTabHighlight: {
    position: 'absolute', top: 4, bottom: 4, width: 'calc(33.333% - 2.66px)',
    background: '#FFFFFF', borderRadius: 16, transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
  },
  bannerTabBtn: {
    position: 'relative', zIndex: 1, border: 'none', background: 'transparent', flex: 1,
    padding: '7px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
    borderRadius: 16, whiteSpace: 'nowrap', transition: 'color 0.2s ease, opacity 0.2s ease',
  },

  cardBody: { padding: '20px 24px 28px' },
  wrap: { maxWidth: 1040, margin: '0 auto' },
  subtitle: { color: '#6E6E86', fontSize: 13, margin: '0 0 20px 0' },

  pageCredit: {
    marginTop: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 11, padding: '18px 20px 26px', fontSize: 13.5, color: '#6E6E86',
  },
  pageCreditChip: {
    width: 40, height: 40, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #DCDCF0',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  controlsRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 12, marginBottom: 14,
  },
  toggleGroup: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  // Simple Case tab only — three labeled control sections (View / Level
  // Curve / Point & Gradient) sitting side by side, each grouping controls
  // by what they actually do rather than one undifferentiated row.
  controlSectionsRow: { display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 14 },
  controlSection: { display: 'flex', flexDirection: 'column', gap: 0 },
  smallPillBtn: {
    border: 'none', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(60,60,90,0.08)',
    borderRadius: 16, padding: '8px 14px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    color: '#6E6E86', cursor: 'pointer', transition: 'background 0.25s ease, color 0.25s ease',
  },
  smallPillBtnActive: { background: '#3B4FC2', color: '#FFFFFF' },
  toggle: {
    position: 'relative', display: 'inline-flex', background: '#FFFFFF',
    borderRadius: 20, padding: 4, boxShadow: '0 1px 3px rgba(60,60,90,0.08)',
  },
  toggleHighlight: {
    position: 'absolute', top: 4, bottom: 4, width: 'calc(33.333% - 2.66px)',
    background: '#3B4FC2', borderRadius: 16,
    transition: 'transform 0.5s cubic-bezier(0.65, 0, 0.35, 1)',
  },
  toggleBtn: {
    position: 'relative', zIndex: 1, border: 'none', background: 'transparent',
    padding: '9px 22px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    color: '#6E6E86', cursor: 'pointer', borderRadius: 16,
    transition: 'color 0.3s ease', width: 110,
  },
  toggleBtnActive: { color: '#FFFFFF' },

  meshBtn: {
    width: 38, height: 38, borderRadius: '50%', border: 'none', background: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(60,60,90,0.08)', color: '#6E6E86', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.25s ease, color 0.25s ease', flexShrink: 0,
  },
  meshBtnActive: { background: '#3B4FC2', color: '#FFFFFF' },

  zoomControls: {
    position: 'absolute', top: 38, right: 24, display: 'flex',
    flexDirection: 'column', gap: 6, zIndex: 5,
  },
  zoomBtn: {
    width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#FFFFFF',
    boxShadow: '0 1px 4px rgba(60,60,90,0.18)', color: '#3A3A3C', fontSize: 17,
    fontWeight: 700, lineHeight: 1, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },

  pathTabs: {
    display: 'inline-flex', background: '#FFFFFF', borderRadius: 20, padding: 4,
    boxShadow: '0 1px 3px rgba(60,60,90,0.08)', gap: 2, marginBottom: 14,
  },
  pathTabBtn: {
    border: 'none', background: 'transparent', padding: '9px 16px', fontSize: 13,
    fontWeight: 600, fontFamily: 'inherit', color: '#6E6E86', cursor: 'pointer',
    borderRadius: 16, transition: 'background 0.25s ease, color 0.25s ease',
  },
  pathTabBtnActive: { background: '#3B4FC2', color: '#FFFFFF' },

  stage: { display: 'flex', gap: 16, alignItems: 'stretch' },
  panel: {
    position: 'relative', background: '#FFFFFF', borderRadius: 20,
    boxShadow: '0 1px 3px rgba(60,60,90,0.08)', padding: 14, overflow: 'hidden',
    transition: 'width 0.55s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.4s ease, flex-grow 0.55s cubic-bezier(0.65, 0, 0.35, 1)',
    display: 'flex', flexDirection: 'column', minWidth: 0, flex: '1 1 0%',
  },
  panelLabel: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em',
    color: '#8A8AA3', fontWeight: 600, marginBottom: 8,
  },
  canvas: { width: '100%', height: 420, borderRadius: 12, display: 'block', background: '#F5F5FA' },

  motionLayout: { display: 'flex', gap: 16, alignItems: 'stretch', marginBottom: 16 },
  hGraphSvg: { width: '100%', height: 420, borderRadius: 12, background: '#FFFFFF', display: 'block' },

  infoPanel: {
    background: '#FFFFFF', borderRadius: 20, boxShadow: '0 1px 3px rgba(60,60,90,0.08)',
    padding: '16px 20px', marginTop: 16,
  },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 },
  sliderTrackWrap: { position: 'relative', flex: 1 },
  range: { width: '100%', height: 6, borderRadius: 3, background: '#E4E4EF', outline: 'none', accentColor: '#3B4FC2' },
  tickLayer: { position: 'absolute', left: 10, right: 10, top: 'calc(50% - 1px)', height: 2, pointerEvents: 'none' },
  tickMark: {
    position: 'absolute', top: -4, width: 3, height: 9, marginLeft: -1.5,
    borderRadius: 2, background: '#4E9E7C', opacity: 0.7,
  },

  levelBadge: {
    flexShrink: 0, minWidth: 74, textAlign: 'center', fontSize: 12.5, fontWeight: 700,
    color: '#3B4FC2', background: '#EFEFFA', border: '1px solid #D8D8E6', borderRadius: 14,
    padding: '8px 10px', fontVariantNumeric: 'tabular-nums',
  },
  levelBadgeTangent: { color: '#FFFFFF', background: '#4E9E7C', border: '1px solid #4E9E7C' },
  levelFollowNote: { color: '#8A8AA3', fontSize: 12, margin: '8px 0 0 0' },

  playBtn: {
    width: 38, height: 38, borderRadius: '50%', border: 'none', background: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(60,60,90,0.08)', color: '#3B4FC2', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'background 0.25s ease, color 0.25s ease',
  },
  playBtnActive: { background: '#3B4FC2', color: '#FFFFFF' },

  readoutPanel: { marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 },
  readoutCard: {
    background: '#FFFFFF', borderRadius: 16, boxShadow: '0 1px 3px rgba(60,60,90,0.08)',
    padding: '12px 10px', textAlign: 'center',
  },
  readoutCardTangent: { boxShadow: '0 0 0 2px #4E9E7C inset, 0 1px 3px rgba(60,60,90,0.08)' },
  readoutLabel: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em',
    color: '#8A8AA3', fontWeight: 600, marginBottom: 6,
  },
  readoutValue: { fontSize: 18, fontWeight: 700, color: '#3A3A3C', fontVariantNumeric: 'tabular-nums' },
  readoutValueAccent: { color: '#3B4FC2' },
  readoutValueTangent: { color: '#4E9E7C' },

  legend: { marginTop: 12, display: 'flex', justifyContent: 'center', gap: 22, fontSize: 12, color: '#6E6E86', flexWrap: 'wrap' },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 3, borderRadius: 2, display: 'inline-block' },

  summaryText: { textAlign: 'center', fontSize: 13, color: '#6E6E86', margin: '14px 0 0 0', transition: 'color 0.25s ease' },
  summaryTextTangent: { color: '#4E9E7C', fontWeight: 600 },

  note: { textAlign: 'center', color: '#8A8AA3', fontSize: 12, marginTop: 22, lineHeight: 1.5 },

  stepPanel: {
    background: '#FFFFFF', borderRadius: 20, boxShadow: '0 1px 3px rgba(60,60,90,0.08)',
    padding: '18px 22px', marginTop: 16,
  },
  stepHeader: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 },
  stepBadge: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700,
    color: '#3B4FC2', background: '#EFEFFA', borderRadius: 10, padding: '3px 8px',
  },
  stepTitle: { fontSize: 15.5, fontWeight: 700, color: '#3A3A3C' },
  stepText: { fontSize: 13.5, lineHeight: 1.6, color: '#6E6E86', margin: '0 0 16px 0' },
  stepNav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    border: 'none', background: '#EFEFFA', color: '#3B4FC2', fontWeight: 600, fontSize: 13,
    fontFamily: 'inherit', padding: '8px 16px', borderRadius: 14, cursor: 'pointer',
  },
  stepBtnDisabled: { background: '#F5F5FA', color: '#C8C8DA', cursor: 'default' },
  stepDots: { display: 'flex', gap: 6 },
  stepDot: { width: 7, height: 7, borderRadius: '50%', background: '#D8D8E6' },
  stepDotActive: { background: '#3B4FC2' },

  tooltipBubble: {
    position: 'fixed', background: '#3A3A3C', color: '#FFFFFF', fontSize: 11.5,
    lineHeight: 1.4, padding: '7px 10px', borderRadius: 8, maxWidth: 220,
    pointerEvents: 'none', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
  },
};
