import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';

/**
 * Lagrange Multipliers applet — React/JSX port of mockup-3.html.
 *
 * Exact behavioral port: same surface, same 4 constraint paths, same
 * gradient math, same snapping/play/tooltip/zoom behavior as the original
 * single-file HTML build. The Three.js and Canvas2D imperative code is
 * unavoidably imperative even in React — it lives inside refs and effects,
 * driven by React state, following the standard pattern for integrating an
 * external render loop (Three.js) with React.
 *
 * Tested against three@0.128.0 (matching the original CDN-loaded r128
 * build this was ported from). Newer three.js versions should also work —
 * only stable, long-standing APIs are used (PerspectiveCamera, WebGLRenderer,
 * PlaneGeometry, Sprite/SpriteMaterial, CanvasTexture, etc.) — but r128 is
 * the version this was actually tested against.
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
// Critical points: local extrema of h(t) = f(pathPoint(t)) along each path.
// By the Lagrange condition, extrema of f restricted to the constraint occur
// exactly where grad f is parallel to grad g — so these are also the
// tangency points. Found by dense sampling + parabolic refinement, cached
// per path since the underlying surface/paths never change at runtime.
// -----------------------------------------------------------------------------
const criticalPointsCache = {};
function computeCriticalPoints(pathId) {
  if (criticalPointsCache[pathId]) return criticalPointsCache[pathId];
  const path = PATHS[pathId];
  const N = 2000;
  const hVals = new Array(N + 1);
  for (let i = 0; i <= N; i++) {
    const { u, v } = path.point(i / N);
    hVals[i] = heightGaussianBump(u, v);
  }
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
      const tRefined = (i + Math.max(-0.5, Math.min(0.5, offset))) / N;
      results.push({ t: Math.max(0, Math.min(1, tRefined)), kind: isMax ? 'max' : 'min' });
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
// Level-curve (isoline) computation via coarse marching squares. Shared by
// the 2D contour lines and the lifted 3D mesh-netting overlay, so toggling
// "mesh" always shows the same curves in both panels. Computed once.
// -----------------------------------------------------------------------------
const GRID = 70;
const LEVELS = 7;
const contourSegments = [];
(function computeContours() {
  const grid = [];
  for (let i = 0; i <= GRID; i++) {
    grid.push([]);
    for (let j = 0; j <= GRID; j++) {
      const u = -DOMAIN / 2 + (DOMAIN * i) / GRID;
      const v = -DOMAIN / 2 + (DOMAIN * j) / GRID;
      grid[i].push(heightGaussianBump(u, v));
    }
  }
  function lerp(a, b, tt) { return a + (b - a) * tt; }
  for (let lvl = 1; lvl <= LEVELS; lvl++) {
    const thresh = minH + (maxH - minH) * (lvl / (LEVELS + 1));
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const u0 = -DOMAIN / 2 + (DOMAIN * i) / GRID, u1 = -DOMAIN / 2 + (DOMAIN * (i + 1)) / GRID;
        const v0 = -DOMAIN / 2 + (DOMAIN * j) / GRID, v1 = -DOMAIN / 2 + (DOMAIN * (j + 1)) / GRID;
        const hA = grid[i][j], hB = grid[i + 1][j], hC = grid[i + 1][j + 1], hD = grid[i][j + 1];
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
        if (pts.length === 2) contourSegments.push([pts[0], pts[1]]);
      }
    }
  }
})();

const PLAY_SPEED = 1 / 7; // fraction of [0,1] per second, tentative

// =============================================================================
// Component
// =============================================================================
export default function LagrangeMultipliersApplet() {
  // ---- React state (drives the UI and, via effects, the imperative render layers) ----
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'both' | '2d'
  const [meshVisible, setMeshVisible] = useState(false);
  const [pathId, setPathId] = useState('circle');
  const [sliderT, setSliderT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tooltip, setTooltip] = useState(null); // { text, left, top } | null

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
  useEffect(() => { pathIdRef.current = pathId; }, [pathId]);
  useEffect(() => { sliderTRef.current = sliderT; }, [sliderT]);
  useEffect(() => { meshVisibleRef.current = meshVisible; }, [meshVisible]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

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
  // isoline overlay, ribbon, marker, arrow sprites, zoom/drag/wheel controls,
  // and the render loop. Mirrors init3D() from the HTML version.
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
    const arrowIconTexture = makeArrowIconTexture();
    const ROTATION_OFFSET = Math.PI / 2;

    function makeArrowSprite(color, sizeScale) {
      const mat = new THREE.SpriteMaterial({
        map: arrowIconTexture, color, transparent: true,
        sizeAttenuation: false, depthTest: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.center.set(0.5, 0);
      const baseSize = 0.11; // tentative fixed on-screen scale
      sprite.scale.set(baseSize * (64 / 200) * sizeScale, baseSize * sizeScale, 1);
      return { sprite, mat };
    }
    const ggArrow = makeArrowSprite(0x8A8AA3, 0.85);
    const gfArrow = makeArrowSprite(0x3B4FC2, 1.25);
    scene.add(ggArrow.sprite, gfArrow.sprite); // gf added last so it wins ties when coincident

    const ggAnchor = new THREE.Vector3(), gfAnchor = new THREE.Vector3();
    const ggDir = new THREE.Vector3(1, 0, 0), gfDir = new THREE.Vector3(1, 0, 0);
    function updateArrowRotation(arrow, anchor, dir, cam, w, h) {
      if (w <= 0 || h <= 0) return;
      const tipWorld = anchor.clone().addScaledVector(dir, 0.5);
      const p1 = tipWorld.project(cam);
      const p0 = anchor.clone().project(cam);
      const x1 = (p1.x + 1) / 2 * w, y1 = (1 - p1.y) / 2 * h;
      const x0 = (p0.x + 1) / 2 * w, y0 = (1 - p0.y) / 2 * h;
      arrow.mat.rotation = Math.atan2(y1 - y0, x1 - x0) + ROTATION_OFFSET;
    }

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
      buildRibbon, applyPointState,
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // ---------------------------------------------------------------------------
  // Mount-once: 2D canvas (heightmap heatmap, contour lines, path, arrows,
  // marker). Mirrors init2D() from the HTML version. Reads live state via
  // refs (pathIdRef, sliderTRef, meshVisibleRef) so the loop doesn't need to
  // be recreated on every state change.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvas2dRef.current;
    const ctx = canvas.getContext('2d');

    const RES = 220;
    const off = document.createElement('canvas');
    off.width = RES; off.height = RES;
    const octx = off.getContext('2d');
    const img = octx.createImageData(RES, RES);
    for (let py = 0; py < RES; py++) {
      for (let px = 0; px < RES; px++) {
        const u = -DOMAIN / 2 + (DOMAIN * px) / RES;
        const v = DOMAIN / 2 - (DOMAIN * py) / RES;
        const h = heightGaussianBump(u, v);
        const c = heightColor(h);
        const idx = (py * RES + px) * 4;
        img.data[idx] = c.r; img.data[idx + 1] = c.g; img.data[idx + 2] = c.b; img.data[idx + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);

    function worldToScreen(u, v, w, h) {
      const x = ((u + DOMAIN / 2) / DOMAIN) * w;
      const y = ((DOMAIN / 2 - v) / DOMAIN) * h;
      return [x, y];
    }

    function drawArrow2D(w, h, anchorU, anchorV, du, dv, color, lineWidth) {
      const n = normalize(du, dv);
      const scaleWorld = 0.95; // fixed world-space length; 2D panel has no zoom, so already screen-constant
      const tipU = anchorU + n.du * scaleWorld;
      const tipV = anchorV + n.dv * scaleWorld;
      const [x0, y0] = worldToScreen(anchorU, anchorV, w, h);
      const [x1, y1] = worldToScreen(tipU, tipV, w, h);
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
      ctx.drawImage(off, 0, 0, w, h);

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
      drawArrow2D(w, h, st.u, st.v, st.gg.du, st.gg.dv, '#8A8AA3', 2.4);
      drawArrow2D(w, h, st.u, st.v, st.gf.du, st.gf.dv, st.isTangent ? '#4E9E7C' : '#3B4FC2', 3.4);

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

  return (
    <div style={styles.body}>
      <div style={styles.wrap}>
        <h1 style={styles.h1}>Lagrange Multipliers Applet</h1>
        <p style={styles.subtitle}>
          Two-Gaussian-bump surface with 4 preset constraint paths, gradient vectors (∇f indigo, ∇g gray) with a
          red/green tangency signal, slider snapping to tangency points, play/loop, and a live readout panel.
        </p>

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
              {...tt('Toggle the level-curve mesh overlay — the same curves shown in the 2D panel, lifted onto the 3D surface.')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
                <path d="M3 8c3-2 6-2 9 0s6 2 9 0M3 13c3-2 6-2 9 0s6 2 9 0M3 18c3-2 6-2 9 0s6 2 9 0" strokeLinecap="round" />
              </svg>
            </button>
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
        </p>

        <p style={styles.note}>
          Drag the 3D surface to rotate, scroll to zoom (or use the +/− buttons). Switch paths above — the slider
          resets to the start of the new path and re-marks the tangency ticks. The mesh button toggles the lifted
          level-curve overlay.
        </p>
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
// Styles (Cloud Pastel palette, matching the rest of the applet suite)
// =============================================================================
const styles = {
  body: {
    margin: 0,
    padding: '28px 24px 40px',
    background: '#F5F5FA',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    color: '#3A3A3C',
  },
  wrap: { maxWidth: 1040, margin: '0 auto' },
  h1: { fontSize: 19, fontWeight: 700, margin: '0 0 4px 0' },
  subtitle: { color: '#6E6E86', fontSize: 13, margin: '0 0 20px 0' },

  controlsRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 12, marginBottom: 14,
  },
  toggleGroup: { display: 'flex', alignItems: 'center', gap: 10 },
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
    boxShadow: '0 1px 3px rgba(60,60,90,0.08)', gap: 2,
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
    display: 'flex', flexDirection: 'column', minWidth: 0,
  },
  panelLabel: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em',
    color: '#8A8AA3', fontWeight: 600, marginBottom: 8,
  },
  canvas: { width: '100%', height: 420, borderRadius: 12, display: 'block', background: '#F5F5FA' },

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

  legend: { marginTop: 12, display: 'flex', justifyContent: 'center', gap: 22, fontSize: 12, color: '#6E6E86' },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 3, borderRadius: 2, display: 'inline-block' },

  summaryText: { textAlign: 'center', fontSize: 13, color: '#6E6E86', margin: '14px 0 0 0', transition: 'color 0.25s ease' },
  summaryTextTangent: { color: '#4E9E7C', fontWeight: 600 },

  note: { textAlign: 'center', color: '#8A8AA3', fontSize: 12, marginTop: 22, lineHeight: 1.5 },

  tooltipBubble: {
    position: 'fixed', background: '#3A3A3C', color: '#FFFFFF', fontSize: 11.5,
    lineHeight: 1.4, padding: '7px 10px', borderRadius: 8, maxWidth: 220,
    pointerEvents: 'none', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
  },
};
