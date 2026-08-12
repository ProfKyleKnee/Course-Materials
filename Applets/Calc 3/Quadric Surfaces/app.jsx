// app.jsx
// Quadric Surface Explorer -- main application source.
//
// NOTE ON FORM: this file is reconstructed from the compiled/bundled HTML by
// splitting esbuild's output back along its original module boundaries (esbuild
// leaves '// src/...' comments marking where each source file's code begins).
// It is valid, runnable JavaScript, but element creation uses the automatic JSX
// runtime's function-call form (jsx(type, props), jsxs(type, props)) rather than
// literal <tag> syntax, because that's what the build already lowered it to --
// this file was never seen by Claude in hand-authored tag form. Say the word if
// you want it converted to literal JSX tag syntax for easier hand-editing.
import { QUIZ_BANK as equations } from './quiz_bank.js';
import { SADDLE_ICON_GRAY, SADDLE_ICON_INDIGO } from './saddle_icon.js';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

  var C = {
    bg: "#F5F5FA",
    card: "#FFFFFF",
    accent: "#3B4FC2",
    accent2: "#6478D6",
    amber: "#C98F3E",
    green: "#3FA671",
    warn: "#C77B94",
    text: "#3A3A3C",
    muted: "#6E6E86",
    eyebrow: "#8A8AA3",
    border: "#DCDCF0"
  };
  function mapAxis(axisOfSymmetry, other1, other2, special) {
    if (axisOfSymmetry === "z") return { x: other1, y: other2, z: special };
    if (axisOfSymmetry === "x") return { x: special, y: other1, z: other2 };
    return { x: other1, y: special, z: other2 };
  }
  function otherAxes(axisOfSymmetry) {
    return ["x", "y", "z"].filter((v) => v !== axisOfSymmetry);
  }
  function project(x, y, z, theta, phi) {
    const tmp = x;
    x = y;
    y = tmp;
    const xr = x * Math.cos(theta) - y * Math.sin(theta);
    const yr = x * Math.sin(theta) + y * Math.cos(theta);
    const y2 = yr * Math.cos(phi) - z * Math.sin(phi);
    const z2 = yr * Math.sin(phi) + z * Math.cos(phi);
    return { sx: xr, sy: -z2, depth: y2 };
  }
  var T = 2.4;
  function polarGrid(rings, spokes, rFn) {
    const grid = [];
    for (let ri = 0; ri <= rings; ri++) {
      const row = [];
      for (let si = 0; si <= spokes; si++) {
        const th = 2 * Math.PI * si / spokes;
        row.push({ r: rFn(ri), th });
      }
      grid.push(row);
    }
    return grid;
  }
  function traceHyperbolaBranches(wMin, wMax, N, innerFn, ptFn) {
    const segments = [];
    let plusRun = [];
    let minusRun = [];
    const flush = () => {
      if (plusRun.length > 1) segments.push(plusRun);
      if (minusRun.length > 1) segments.push(minusRun);
      plusRun = [];
      minusRun = [];
    };
    const findBoundary = (wA, wB) => {
      let lo = wA, hi = wB;
      let loNeg = innerFn(lo) < 0;
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        const midNeg = innerFn(mid) < 0;
        if (midNeg === loNeg) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    let prevW = null, prevValid = false;
    for (let i = 0; i <= N; i++) {
      const w = wMin + (wMax - wMin) * i / N;
      const inner = innerFn(w);
      const valid = inner >= 0;
      if (prevW !== null && valid !== prevValid) {
        const wB = findBoundary(prevW, w);
        const vertexPt = ptFn(wB, 0);
        plusRun.push(vertexPt);
        minusRun.push(vertexPt);
        if (!valid) flush();
      }
      if (valid) {
        const r = Math.sqrt(inner);
        plusRun.push(ptFn(w, r));
        minusRun.push(ptFn(w, -r));
      }
      prevW = w;
      prevValid = valid;
    }
    flush();
    return segments;
  }
  var ELLIPSOID_SEMI = { x: 4, y: 3, z: 2 };
  var SHAPES = {
    Ellipsoid: {
      label: "Ellipsoid",
      hasAxisToggle: true,
      buildMeshPieces(axis) {
        const { x: A, y: B, z: Cz } = ELLIPSOID_SEMI;
        const latN = 12, lonN = 24;
        const grid = [];
        for (let i = 0; i <= latN; i++) {
          const lat = -Math.PI / 2 + Math.PI * i / latN;
          const row = [];
          for (let j = 0; j <= lonN; j++) {
            const lon = 2 * Math.PI * j / lonN;
            row.push({ x: A * Math.cos(lat) * Math.cos(lon), y: B * Math.cos(lat) * Math.sin(lon), z: Cz * Math.sin(lat) });
          }
          grid.push(row);
        }
        return [grid];
      },
      origEquation() {
        return "x\xB2/16 + y\xB2/9 + z\xB2/4 = 1";
      },
      crossSection(axis, fixedAxis, val) {
        const others = otherAxes(fixedAxis);
        const semiFixed = ELLIPSOID_SEMI[fixedAxis];
        const remaining = 1 - val * val / (semiFixed * semiFixed);
        const semi1 = ELLIPSOID_SEMI[others[0]], semi2 = ELLIPSOID_SEMI[others[1]];
        if (remaining < 0) {
          return {
            exists: false,
            rewrite: `${others[0]}\xB2/${semi1 * semi1} + ${others[1]}\xB2/${semi2 * semi2} = 1 \u2212 #\xB2/${semiFixed * semiFixed}`,
            emptyExplain: `At ${fixedAxis} = ${val.toFixed(1)}: the right-hand side works out to ${remaining.toFixed(2)}, which is negative \u2014 no real solutions, so there's nothing to draw here.`
          };
        }
        const r1 = semi1 * Math.sqrt(remaining);
        const r2 = semi2 * Math.sqrt(remaining);
        const pts = [];
        for (let i = 0; i <= 48; i++) {
          const th = 2 * Math.PI * i / 48;
          const u = r1 * Math.cos(th), v = r2 * Math.sin(th);
          pts.push(mapAxis(fixedAxis, u, v, val));
        }
        return { exists: true, tracePoints: [pts], rewrite: `${others[0]}\xB2/${semi1 * semi1} + ${others[1]}\xB2/${semi2 * semi2} = 1 \u2212 #\xB2/${semiFixed * semiFixed}` };
      },
      sliderRange(axis, fixedAxis) {
        const semi = ELLIPSOID_SEMI[fixedAxis] || 2;
        return { min: -semi, max: semi, default: semi * 0.4 };
      }
    },
    "Elliptic Paraboloid": {
      label: "Elliptic Paraboloid",
      hasAxisToggle: true,
      buildMeshPieces(axis) {
        const grid = polarGrid(10, 24, (ri) => T * ri / 10).map(
          (row) => row.map(({ r, th }) => {
            const u = r * Math.cos(th), v = r * Math.sin(th);
            return mapAxis(axis, u, v, u * u + v * v);
          })
        );
        return [grid];
      },
      origEquation(axis) {
        const [o1, o2] = otherAxes(axis);
        return `${axis} = ${o1}\xB2 + ${o2}\xB2`;
      },
      crossSection(axis, fixedAxis, val) {
        const others = otherAxes(axis);
        if (fixedAxis === axis) {
          const r = Math.sqrt(Math.max(0, val));
          const pts2 = [];
          for (let i = 0; i <= 48; i++) {
            const th = 2 * Math.PI * i / 48;
            pts2.push(mapAxis(axis, r * Math.cos(th), r * Math.sin(th), val));
          }
          return { exists: true, tracePoints: [pts2], rewrite: `${others[0]}\xB2 + ${others[1]}\xB2 = #` };
        }
        const remaining = others.find((v) => v !== fixedAxis);
        const maxOther = Math.sqrt(Math.max(0, T * T - val * val));
        const pts = [];
        for (let i = 0; i <= 48; i++) {
          const t = -maxOther + 2 * maxOther * i / 48;
          const u = fixedAxis === others[0] ? val : t;
          const v = fixedAxis === others[0] ? t : val;
          pts.push(mapAxis(axis, u, v, u * u + v * v));
        }
        return { exists: true, tracePoints: [pts], rewrite: `${axis} = #\xB2 + ${remaining}\xB2` };
      },
      sliderRange(axis, fixedAxis) {
        return fixedAxis === axis ? { min: 0, max: 6, default: 3 } : { min: -T, max: T, default: 0 };
      }
    },
    "Hyperbolic Paraboloid": {
      label: "Hyperbolic Paraboloid",
      hasAxisToggle: true,
      buildMeshPieces(axis) {
        const N = 16;
        const grid = [];
        for (let i = 0; i <= N; i++) {
          const u = -T + 2 * T * i / N;
          const row = [];
          for (let j = 0; j <= N; j++) {
            const v = -T + 2 * T * j / N;
            row.push(mapAxis(axis, u, v, u * u - v * v));
          }
          grid.push(row);
        }
        return [grid];
      },
      origEquation(axis) {
        const [o1, o2] = otherAxes(axis);
        return `${axis} = ${o1}\xB2 \u2212 ${o2}\xB2`;
      },
      crossSection(axis, fixedAxis, val) {
        const others = otherAxes(axis);
        if (fixedAxis === axis) {
          const segments = traceHyperbolaBranches(
            -T,
            T,
            48,
            (v) => v * v + val,
            (v, u) => mapAxis(axis, u, v, val)
          );
          return { exists: true, tracePoints: segments, rewrite: `${others[0]}\xB2 \u2212 ${others[1]}\xB2 = #` };
        }
        const remaining = others.find((v) => v !== fixedAxis);
        const isFirstOther = fixedAxis === others[0];
        const pts = [];
        for (let i = 0; i <= 48; i++) {
          const t = -T + 2 * T * i / 48;
          const u = isFirstOther ? val : t;
          const v = isFirstOther ? t : val;
          pts.push(mapAxis(axis, u, v, u * u - v * v));
        }
        return {
          exists: true,
          tracePoints: [pts],
          rewrite: `${axis} = ${isFirstOther ? `#\xB2 \u2212 ${remaining}\xB2` : `${remaining}\xB2 \u2212 #\xB2`}`
        };
      },
      sliderRange(axis, fixedAxis) {
        return fixedAxis === axis ? { min: -6, max: 6, default: 2 } : { min: -T, max: T, default: 0 };
      }
    },
    Cone: {
      label: "Cone",
      hasAxisToggle: true,
      buildMeshPieces(axis) {
        const rings = 8, spokes = 24;
        const pieces = [];
        for (const sign of [1, -1]) {
          const grid = [];
          for (let ri = 0; ri <= rings; ri++) {
            const w = sign * (T * ri) / rings;
            const r = Math.abs(w);
            const row = [];
            for (let si = 0; si <= spokes; si++) {
              const th = 2 * Math.PI * si / spokes;
              row.push(mapAxis(axis, r * Math.cos(th), r * Math.sin(th), w));
            }
            grid.push(row);
          }
          pieces.push(grid);
        }
        return pieces;
      },
      origEquation(axis) {
        const [o1, o2] = otherAxes(axis);
        return `${o1}\xB2 + ${o2}\xB2 = ${axis}\xB2`;
      },
      crossSection(axis, fixedAxis, val) {
        const others = otherAxes(axis);
        if (fixedAxis === axis) {
          const r = Math.abs(val);
          const pts = [];
          for (let i = 0; i <= 48; i++) {
            const th = 2 * Math.PI * i / 48;
            pts.push(mapAxis(axis, r * Math.cos(th), r * Math.sin(th), val));
          }
          return { exists: true, tracePoints: [pts], rewrite: `${others[0]}\xB2 + ${others[1]}\xB2 = #\xB2` };
        }
        const remaining = others.find((v) => v !== fixedAxis);
        const isFirstOther = fixedAxis === others[0];
        const segments = traceHyperbolaBranches(-T, T, 48, (w) => w * w - val * val, (w, r2) => {
          const u = isFirstOther ? val : r2;
          const v = isFirstOther ? r2 : val;
          return mapAxis(axis, u, v, w);
        });
        return { exists: true, tracePoints: segments, rewrite: `${axis}\xB2 \u2212 ${remaining}\xB2 = #\xB2` };
      },
      sliderRange(axis, fixedAxis) {
        return fixedAxis === axis ? { min: -T, max: T, default: 1.2 } : { min: -T, max: T, default: 0.8 };
      }
    },
    Hyperboloid1Sheet: {
      label: "Hyperboloid (1 Sheet)",
      hasAxisToggle: true,
      buildMeshPieces(axis) {
        const rings = 10, spokes = 24;
        const grid = [];
        for (let ri = 0; ri <= rings; ri++) {
          const w = -T + 2 * T * ri / rings;
          const r = Math.sqrt(1 + w * w);
          const row = [];
          for (let si = 0; si <= spokes; si++) {
            const th = 2 * Math.PI * si / spokes;
            row.push(mapAxis(axis, r * Math.cos(th), r * Math.sin(th), w));
          }
          grid.push(row);
        }
        return [grid];
      },
      origEquation(axis) {
        const [o1, o2] = otherAxes(axis);
        return `${o1}\xB2 + ${o2}\xB2 \u2212 ${axis}\xB2 = 1`;
      },
      crossSection(axis, fixedAxis, val) {
        const others = otherAxes(axis);
        if (fixedAxis === axis) {
          const r = Math.sqrt(1 + val * val);
          const pts = [];
          for (let i = 0; i <= 48; i++) {
            const th = 2 * Math.PI * i / 48;
            pts.push(mapAxis(axis, r * Math.cos(th), r * Math.sin(th), val));
          }
          return { exists: true, tracePoints: [pts], rewrite: `${others[0]}\xB2 + ${others[1]}\xB2 = 1 + #\xB2` };
        }
        const remaining = others.find((v) => v !== fixedAxis);
        const isFirstOther = fixedAxis === others[0];
        const rhs = 1 - val * val;
        const segments = traceHyperbolaBranches(
          -T,
          T,
          48,
          (w) => w * w + rhs,
          (w, r2) => mapAxis(axis, isFirstOther ? val : r2, isFirstOther ? r2 : val, w)
        );
        return { exists: true, tracePoints: segments, rewrite: `${remaining}\xB2 \u2212 ${axis}\xB2 = 1 \u2212 #\xB2` };
      },
      sliderRange(axis, fixedAxis) {
        return fixedAxis === axis ? { min: -T, max: T, default: 1.2 } : { min: -T, max: T, default: 0.6 };
      }
    },
    Hyperboloid2Sheet: {
      label: "Hyperboloid (2 Sheets)",
      hasAxisToggle: true,
      buildMeshPieces(axis) {
        const rings = 8, spokes = 24;
        const pieces = [];
        for (const sign of [1, -1]) {
          const grid = [];
          for (let ri = 0; ri <= rings; ri++) {
            const w = sign * (1 + T * ri / rings);
            const r = Math.sqrt(Math.max(0, w * w - 1));
            const row = [];
            for (let si = 0; si <= spokes; si++) {
              const th = 2 * Math.PI * si / spokes;
              row.push(mapAxis(axis, r * Math.cos(th), r * Math.sin(th), w));
            }
            grid.push(row);
          }
          pieces.push(grid);
        }
        return pieces;
      },
      origEquation(axis) {
        const [o1, o2] = otherAxes(axis);
        return `${axis}\xB2 \u2212 ${o1}\xB2 \u2212 ${o2}\xB2 = 1`;
      },
      crossSection(axis, fixedAxis, val) {
        const others = otherAxes(axis);
        if (fixedAxis === axis) {
          const inner = val * val - 1;
          if (inner < 0) {
            return {
              exists: false,
              rewrite: `${others[0]}\xB2 + ${others[1]}\xB2 = #\xB2 \u2212 1`,
              emptyExplain: `This surface has no points between ${axis} = \u22121 and ${axis} = 1. At ${axis} = ${val.toFixed(1)}: ${others[0]}\xB2 + ${others[1]}\xB2 = ${val.toFixed(1)}\xB2 \u2212 1 = ${inner.toFixed(2)} \u2014 impossible for real numbers.`
            };
          }
          const r = Math.sqrt(inner);
          const pts = [];
          for (let i = 0; i <= 48; i++) {
            const th = 2 * Math.PI * i / 48;
            pts.push(mapAxis(axis, r * Math.cos(th), r * Math.sin(th), val));
          }
          return { exists: true, tracePoints: [pts], rewrite: `${others[0]}\xB2 + ${others[1]}\xB2 = #\xB2 \u2212 1` };
        }
        const remaining = others.find((v) => v !== fixedAxis);
        const isFirstOther = fixedAxis === others[0];
        const rhs = 1 + val * val;
        const segments = traceHyperbolaBranches(
          -T - 1,
          T + 1,
          96,
          (w) => w * w - rhs,
          (w, r2) => mapAxis(axis, isFirstOther ? val : r2, isFirstOther ? r2 : val, w)
        );
        return { exists: true, tracePoints: segments, rewrite: `${axis}\xB2 \u2212 ${remaining}\xB2 = 1 + #\xB2` };
      },
      sliderRange(axis, fixedAxis) {
        return fixedAxis === axis ? { min: -T, max: T, default: 0.5 } : { min: -T, max: T, default: 0.6 };
      }
    }
  };
  var SHAPE_KEYS = ["Ellipsoid", "Elliptic Paraboloid", "Hyperbolic Paraboloid", "Cone", "Hyperboloid1Sheet", "Hyperboloid2Sheet"];
  function formatTerm(coeff, v) {
    if (coeff === 1) return v;
    if (coeff === -1) return `-${v}`;
    return `${coeff}${v}`;
  }
  function parseSide(raw) {
    let s = raw.replace(/\s+/g, "").replace(/\u00B2/g, "^2");
    if (!s.startsWith("+") && !s.startsWith("-")) s = "+" + s;
    const terms = s.match(/[+-][^+-]+/g) || [];
    const out = { x2: 0, y2: 0, z2: 0, x: 0, y: 0, z: 0, c: 0 };
    for (const term of terms) {
      const sign = term[0] === "-" ? -1 : 1;
      const body = term.slice(1);
      const displayTerm = (sign < 0 ? "-" : "") + body;
      const letters = body.match(/[xyz]/g) || [];
      const distinct = [...new Set(letters)];
      if (distinct.length > 1) {
        return { error: "cross-term", term: displayTerm, vars: distinct };
      }
      if (distinct.length === 0) {
        const num = body === "" ? 0 : parseFloat(body);
        if (Number.isNaN(num)) return { error: "syntax" };
        out.c += sign * num;
        continue;
      }
      const v = distinct[0];
      if (letters.length > 1) {
        return { error: "degree", term: displayTerm };
      }
      const isSquared = new RegExp(`${v}\\^2`).test(body);
      const numPart = body.split(v)[0];
      let coeff = numPart === "" || numPart === "*" ? 1 : parseFloat(numPart.replace("*", ""));
      if (Number.isNaN(coeff)) return { error: "syntax" };
      coeff *= sign;
      if (isSquared) out[v + "2"] += coeff;
      else out[v] += coeff;
    }
    return out;
  }
  function parseEquation(text) {
    const parts = text.split("=");
    if (parts.length !== 2) return { error: "syntax" };
    const L = parseSide(parts[0]);
    const R = parseSide(parts[1]);
    if (L.error) return L;
    if (R.error) return R;
    return { x2: L.x2 - R.x2, y2: L.y2 - R.y2, z2: L.z2 - R.z2, x: L.x - R.x, y: L.y - R.y, z: L.z - R.z, g: L.c - R.c };
  }
  function classifyQuadric(coef) {
    if (!coef || coef.error === "syntax") {
      return { valid: false, reason: "Couldn\u2019t parse this \u2014 check the acceptable form above." };
    }
    if (coef.error === "cross-term") {
      const vars = coef.vars.length > 1 ? `${coef.vars[0]} and ${coef.vars[1]}` : coef.vars[0];
      return { valid: false, reason: `"${coef.term}" mixes ${vars} in one term \u2014 only axis-aligned quadrics are supported here.` };
    }
    if (coef.error === "degree") {
      return { valid: false, reason: `"${coef.term}" isn\u2019t a supported form \u2014 only x\xB2, y\xB2, z\xB2, x, y, z, and constant terms are allowed.` };
    }
    const { x2: A, y2: B, z2: C2, x: D, y: E, z: F, g: G } = coef;
    const lin = { x: D, y: E, z: F };
    const quad = { x: A, y: B, z: C2 };
    const nonzeroLin = ["x", "y", "z"].filter((v) => Math.abs(lin[v]) > 1e-9);
    if (nonzeroLin.length === 0) {
      const rhs = -G;
      if (Math.abs(rhs) < 1e-9) {
        const signs2 = ["x", "y", "z"].map((v) => Math.sign(quad[v]));
        if (signs2.some((s) => s === 0)) return { valid: false, reason: "This isn\u2019t a full 3D quadric surface (a variable is missing entirely)." };
        if (signs2.every((s) => s === signs2[0])) return { valid: false, reason: "Only the origin satisfies this equation (a degenerate point), not a surface." };
        const counts = { "-1": 0, "1": 0 };
        for (const v of ["x", "y", "z"]) counts[Math.sign(quad[v])]++;
        const majoritySign = counts["1"] >= counts["-1"] ? 1 : -1;
        const axis2 = ["x", "y", "z"].find((v) => Math.sign(quad[v]) !== majoritySign);
        return { valid: true, type: "Cone", axisOfSymmetry: axis2 };
      }
      const signs = ["x", "y", "z"].map((v) => quad[v]);
      if (signs.some((s) => s === 0)) return { valid: false, reason: "This isn\u2019t a full 3D quadric surface (a variable is missing entirely)." };
      const matchSign = ["x", "y", "z"].map((v) => Math.sign(quad[v]) === Math.sign(rhs));
      const matchCount = matchSign.filter(Boolean).length;
      if (matchCount === 3) return { valid: true, type: "Ellipsoid", axisOfSymmetry: "z" };
      if (matchCount === 2) return { valid: true, type: "Hyperboloid1Sheet", axisOfSymmetry: ["x", "y", "z"][matchSign.indexOf(false)] };
      if (matchCount === 1) return { valid: true, type: "Hyperboloid2Sheet", axisOfSymmetry: ["x", "y", "z"][matchSign.indexOf(true)] };
      return { valid: false, reason: "No real points satisfy this equation." };
    }
    if (nonzeroLin.length === 1) {
      const axis2 = nonzeroLin[0];
      if (Math.abs(quad[axis2]) > 1e-9) {
        const linTermText2 = formatTerm(lin[axis2], axis2);
        return { valid: false, reason: `"${linTermText2}" would shift the center off the origin \u2014 only surfaces centered at the origin are supported here.` };
      }
      const others = ["x", "y", "z"].filter((v) => v !== axis2);
      const [o1, o2] = others;
      if (Math.abs(quad[o1]) < 1e-9 || Math.abs(quad[o2]) < 1e-9) return { valid: false, reason: "This reduces to a parabolic cylinder, not a full quadric surface." };
      if (Math.sign(quad[o1]) === Math.sign(quad[o2])) return { valid: true, type: "Elliptic Paraboloid", axisOfSymmetry: axis2 };
      return { valid: true, type: "Hyperbolic Paraboloid", axisOfSymmetry: axis2 };
    }
    const axis = nonzeroLin[0];
    const linTermText = formatTerm(lin[axis], axis);
    return { valid: false, reason: `"${linTermText}" would shift the center off the origin \u2014 only surfaces centered at the origin are supported here.` };
  }
  var VANTAGE = {
    z: { theta: 1e-3, phi: 1.5708 - 1e-3 },
    x: { theta: 1e-3, phi: 1e-3 },
    y: { theta: 1.5708, phi: 1e-3 }
  };
  var SHAPE_DEFAULTS = {
    Ellipsoid: { theta: 0.541, phi: -0.065, zoom: 25, zAxisLength: 2, xAxisLength: 4 },
    "Elliptic Paraboloid": { theta: 0.541, phi: -0.065, zoom: 20, zAxisLength: 6 },
    "Hyperbolic Paraboloid": { theta: 1, phi: 0.42, zoom: 24, zAxisLength: 6 },
    Cone: { theta: 0.541, phi: -0.065, zoom: 34, zAxisLength: 3.1 },
    Hyperboloid1Sheet: { theta: 0.541, phi: -0.065, zoom: 34, zAxisLength: 3.1 },
    Hyperboloid2Sheet: { theta: 0.541, phi: -0.065, zoom: 34, zAxisLength: 3.1 }
  };
  var CANVAS_CX = 200;
  var CANVAS_CY = 170;
  function projectScene(pieces, rawTraceSegments, rawEmptyPoint, theta, phi, zoom, zAxisLength, xAxisLength) {
    const polyList = [];
    for (const grid of pieces) {
      const rings = grid.length - 1;
      const spokes = grid[0].length - 1;
      const proj = grid.map(
        (row) => row.map((p) => {
          const pr = project(p.x, p.y, p.z, theta, phi);
          return { x: CANVAS_CX + pr.sx * zoom, y: CANVAS_CY + pr.sy * zoom, depth: pr.depth };
        })
      );
      for (let ri = 0; ri < rings; ri++) {
        for (let si = 0; si < spokes; si++) {
          const p1 = proj[ri][si], p2 = proj[ri][si + 1], p3 = proj[ri + 1][si + 1], p4 = proj[ri + 1][si];
          const depth = (p1.depth + p2.depth + p3.depth + p4.depth) / 4;
          polyList.push({ depth, pts: [p1, p2, p3, p4] });
        }
      }
    }
    polyList.sort((a, b) => a.depth - b.depth);
    let traceSegments = null, emptyMarker = null;
    if (rawTraceSegments) {
      traceSegments = rawTraceSegments.map(
        (seg) => seg.map((p) => {
          const pr = project(p.x, p.y, p.z, theta, phi);
          return `${(CANVAS_CX + pr.sx * zoom).toFixed(1)},${(CANVAS_CY + pr.sy * zoom).toFixed(1)}`;
        }).join(" ")
      );
    } else if (rawEmptyPoint) {
      const pr = project(rawEmptyPoint.x, rawEmptyPoint.y, rawEmptyPoint.z, theta, phi);
      emptyMarker = { x: CANVAS_CX + pr.sx * zoom, y: CANVAS_CY + pr.sy * zoom };
    }
    const axisEnds = {};
    const L = 3.1;
    const xL = xAxisLength !== void 0 ? xAxisLength : L;
    const zL = zAxisLength !== void 0 ? zAxisLength : L;
    for (const [name, vec] of [["x", [xL, 0, 0]], ["y", [0, L, 0]], ["z", [0, 0, zL]]]) {
      const pr = project(vec[0], vec[1], vec[2], theta, phi);
      axisEnds[name] = { x: CANVAS_CX + pr.sx * zoom, y: CANVAS_CY + pr.sy * zoom };
    }
    const ticks = [];
    const dirs = [["x", [1, 0, 0], xL], ["y", [0, 1, 0], L], ["z", [0, 0, 1], zL]];
    for (const [name, dir, axisLen] of dirs) {
      const maxTick = Math.floor(axisLen);
      for (let d = 1; d <= maxTick; d++) {
        const pr = project(dir[0] * d, dir[1] * d, dir[2] * d, theta, phi);
        const prev = project(dir[0] * (d - 0.12), dir[1] * (d - 0.12), dir[2] * (d - 0.12), theta, phi);
        const px = CANVAS_CX + pr.sx * zoom, py = CANVAS_CY + pr.sy * zoom;
        const dx = px - (CANVAS_CX + prev.sx * zoom), dy = py - (CANVAS_CY + prev.sy * zoom);
        const len = Math.hypot(dx, dy) || 1;
        const perpX = -dy / len * 4, perpY = dx / len * 4;
        ticks.push({ key: `${name}${d}`, x1: px - perpX, y1: py - perpY, x2: px + perpX, y2: py + perpY, lx: px + perpX + 3, ly: py + perpY + 3, label: String(d) });
      }
    }
    return { polys: polyList, traceSegments, emptyMarker, axisEnds, ticks };
  }
  function SceneSvg({ scene, showZAxisLabel = true }) {
    return /* @__PURE__ */ jsxs("svg", { width: "100%", height: "100%", viewBox: "0 0 400 340", preserveAspectRatio: "xMidYMid meet", children: [
      scene.polys.map((poly, i) => /* @__PURE__ */ jsx(
        "polygon",
        {
          points: poly.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
          fill: "#E4E7FB",
          stroke: C.accent2,
          strokeWidth: "0.6",
          opacity: "0.92"
        },
        i
      )),
      /* @__PURE__ */ jsx("line", { x1: CANVAS_CX, y1: CANVAS_CY, x2: scene.axisEnds.x.x, y2: scene.axisEnds.x.y, stroke: "#C7C9E6", strokeWidth: "1.2" }),
      /* @__PURE__ */ jsx("line", { x1: CANVAS_CX, y1: CANVAS_CY, x2: scene.axisEnds.y.x, y2: scene.axisEnds.y.y, stroke: "#C7C9E6", strokeWidth: "1.2" }),
      /* @__PURE__ */ jsx("line", { x1: CANVAS_CX, y1: CANVAS_CY, x2: scene.axisEnds.z.x, y2: scene.axisEnds.z.y, stroke: "#C7C9E6", strokeWidth: "1.2" }),
      scene.ticks.map((t) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("line", { x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2, stroke: "#B8B8CC", strokeWidth: "1.2" }),
        /* @__PURE__ */ jsx("text", { x: t.lx, y: t.ly, fontSize: "8", fill: "#9B9BB0", children: t.label })
      ] }, t.key)),
      /* @__PURE__ */ jsx("text", { x: scene.axisEnds.x.x + 4, y: scene.axisEnds.x.y + 4, fontSize: "12", fontWeight: "700", fill: C.muted, children: "x" }),
      /* @__PURE__ */ jsx("text", { x: scene.axisEnds.y.x + 4, y: scene.axisEnds.y.y + 4, fontSize: "12", fontWeight: "700", fill: C.muted, children: "y" }),
      showZAxisLabel && /* @__PURE__ */ jsx("text", { x: scene.axisEnds.z.x + 4, y: scene.axisEnds.z.y - 4, fontSize: "12", fontWeight: "700", fill: C.muted, children: "z" }),
      scene.traceSegments && scene.traceSegments.map((seg, i) => /* @__PURE__ */ jsx("polyline", { points: seg, fill: "none", stroke: "#D2415C", strokeWidth: "3", strokeLinecap: "round" }, i)),
      scene.emptyMarker && /* @__PURE__ */ jsx("circle", { cx: scene.emptyMarker.x, cy: scene.emptyMarker.y, r: "5", fill: "none", stroke: "#A8A8C0", strokeWidth: "2", strokeDasharray: "2.5 3" })
    ] });
  }
  function GuidedCanvas({ shapeKey, axisOfSymmetry, selectedAxis, sliceValue, cornerButtons }) {
    const defaults = SHAPE_DEFAULTS[shapeKey] || SHAPE_DEFAULTS.Cone;
    const [theta, setTheta] = React.useState(defaults.theta);
    const [phi, setPhi] = React.useState(defaults.phi);
    const [zoom, setZoom] = React.useState(defaults.zoom);
    const dragRef = React.useRef(null);
    const def = SHAPES[shapeKey];
    React.useEffect(() => {
      setTheta(defaults.theta);
      setPhi(defaults.phi);
      setZoom(defaults.zoom);
    }, [shapeKey]);
    const onPointerDown = (e) => {
      dragRef.current = { x: e.clientX, y: e.clientY, theta, phi };
    };
    const onPointerMove = (e) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      setTheta(dragRef.current.theta + dx * 0.01);
      setPhi(Math.max(-1.4, Math.min(1.4, dragRef.current.phi - dy * 0.01)));
    };
    const onPointerUp = () => {
      dragRef.current = null;
    };
    const pieces = React.useMemo(() => def.buildMeshPieces(axisOfSymmetry), [def, axisOfSymmetry]);
    const rawCs = React.useMemo(() => {
      if (!selectedAxis) return null;
      return def.crossSection(axisOfSymmetry, selectedAxis, sliceValue);
    }, [def, axisOfSymmetry, selectedAxis, sliceValue]);
    const scene = React.useMemo(() => {
      const rawTrace = rawCs && rawCs.exists ? rawCs.tracePoints : null;
      const rawEmpty = rawCs && !rawCs.exists ? mapAxis(axisOfSymmetry, 0, 0, sliceValue) : null;
      return projectScene(pieces, rawTrace, rawEmpty, theta, phi, zoom, defaults.zAxisLength, defaults.xAxisLength);
    }, [pieces, rawCs, axisOfSymmetry, sliceValue, theta, phi, zoom, defaults.zAxisLength, defaults.xAxisLength]);
    return /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          position: "relative",
          background: C.card,
          borderRadius: 18,
          border: `1px solid ${C.border}`,
          flex: 1,
          minHeight: 520,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none"
        },
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerLeave: onPointerUp,
        children: [
          /* @__PURE__ */ jsx(SceneSvg, { scene }),
          /* @__PURE__ */ jsxs("div", { style: { position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 6 }, children: [
            /* @__PURE__ */ jsx("button", { onClick: () => setZoom((z) => Math.min(70, z + 6)), style: zoomBtnStyle, children: "+" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setZoom((z) => Math.max(14, z - 6)), style: zoomBtnStyle, children: "\u2212" })
          ] }),
          cornerButtons && /* @__PURE__ */ jsx("div", { style: { position: "absolute", bottom: 12, right: 12, display: "flex", gap: 8 }, children: /* @__PURE__ */ jsx("div", { style: cornerPillStyle, onClick: () => {
            setTheta(defaults.theta);
            setPhi(defaults.phi);
            setZoom(defaults.zoom);
          }, children: "Reset View" }) }),
          /* @__PURE__ */ jsx("div", { style: { position: "absolute", bottom: 12, left: 12, fontSize: 11, color: C.eyebrow, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "5px 10px" }, children: "drag to rotate" })
        ]
      }
    );
  }
  function LockedView({ shapeKey, axisOfSymmetry, selectedAxis, sliceValue }) {
    const def = SHAPES[shapeKey];
    const defaults = SHAPE_DEFAULTS[shapeKey] || SHAPE_DEFAULTS.Cone;
    const pieces = React.useMemo(() => def.buildMeshPieces(axisOfSymmetry), [def, axisOfSymmetry]);
    const vantage = VANTAGE[selectedAxis];
    const scene = React.useMemo(() => {
      const cs = def.crossSection(axisOfSymmetry, selectedAxis, sliceValue);
      const rawTrace = cs.exists ? cs.tracePoints : null;
      const rawEmpty = !cs.exists ? mapAxis(axisOfSymmetry, 0, 0, sliceValue) : null;
      return projectScene(pieces, rawTrace, rawEmpty, vantage.theta, vantage.phi, defaults.zoom, defaults.zAxisLength, defaults.xAxisLength);
    }, [pieces, def, axisOfSymmetry, selectedAxis, sliceValue, vantage, defaults.zoom, defaults.zAxisLength, defaults.xAxisLength]);
    return /* @__PURE__ */ jsxs("div", { style: { position: "relative", background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, flex: "0 0 240px", minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { position: "absolute", top: 12, left: 14, fontSize: 10.5, fontWeight: 700, color: C.eyebrow, textTransform: "uppercase", letterSpacing: "0.04em" }, children: [
        "Locked view \xB7 down ",
        selectedAxis.toUpperCase()
      ] }),
      /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 700, color: C.eyebrow, background: C.bg, padding: "3px 9px", borderRadius: 10 }, children: "still image" }),
      /* @__PURE__ */ jsx(SceneSvg, { scene, showZAxisLabel: selectedAxis !== "z" })
    ] });
  }
  var zoomBtnStyle = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: C.card,
    border: `1px solid ${C.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    color: C.muted,
    boxShadow: "0 1px 3px rgba(60,60,90,0.08)",
    cursor: "pointer"
  };
  var cornerPillStyle = { padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 700, background: C.card, border: `1px solid ${C.border}`, color: C.muted, boxShadow: "0 1px 3px rgba(60,60,90,0.08)", cursor: "pointer" };
  var SHAPE_ICON_HINTS = {
    Ellipsoid: "Ellipsoid",
    "Elliptic Paraboloid": "Paraboloid",
    "Hyperbolic Paraboloid": "Hyp. Paraboloid",
    Cone: "Cone",
    Hyperboloid1Sheet: "Hyperboloid (1 sheet)",
    Hyperboloid2Sheet: "Hyperboloid (2 sheets)"
  };
  function RailIcon({ shapeKey, label, active, onClick }) {
    const color = active ? C.accent : "#A8A8C0";
    return /* @__PURE__ */ jsxs("div", { onClick, style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 4px", margin: "0 8px", borderRadius: 14, background: active ? "#ECEDFA" : "transparent", cursor: "pointer" }, title: label, children: [
      /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 40 40", width: "30", height: "30", children: [
        shapeKey === "Ellipsoid" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("ellipse", { cx: "20", cy: "20", rx: "15", ry: "10", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("ellipse", { cx: "20", cy: "20", rx: "5", ry: "10", fill: "none", stroke: color, strokeWidth: "1.6" }),
          /* @__PURE__ */ jsx("ellipse", { cx: "20", cy: "20", rx: "15", ry: "3", fill: "none", stroke: color, strokeWidth: "1.6" })
        ] }),
        shapeKey === "Elliptic Paraboloid" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("path", { d: "M7 9 Q20 33 33 9", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("path", { d: "M7 9 Q20 14 33 9", fill: "none", stroke: color, strokeWidth: "1.4", opacity: "0.6" }),
          /* @__PURE__ */ jsx("ellipse", { cx: "20", cy: "9", rx: "13", ry: "4", fill: "none", stroke: color, strokeWidth: "2" })
        ] }),
        shapeKey === "Cone" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("path", { d: "M20 6 L7 32", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("path", { d: "M20 6 L33 32", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("ellipse", { cx: "20", cy: "32", rx: "13", ry: "4", fill: "none", stroke: color, strokeWidth: "2" })
        ] }),
        shapeKey === "Hyperboloid1Sheet" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("ellipse", { cx: "20", cy: "8", rx: "14", ry: "4", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("ellipse", { cx: "20", cy: "32", rx: "14", ry: "4", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("path", { d: "M6 8 Q13 20 6 32", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("path", { d: "M34 8 Q27 20 34 32", fill: "none", stroke: color, strokeWidth: "2" })
        ] }),
        shapeKey === "Hyperboloid2Sheet" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("ellipse", { cx: "20", cy: "6", rx: "12", ry: "3", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("path", { d: "M8 6 Q20 18 32 6", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("path", { d: "M8 6 Q20 9 32 6", fill: "none", stroke: color, strokeWidth: "1.3", opacity: "0.6" }),
          /* @__PURE__ */ jsx("ellipse", { cx: "20", cy: "32", rx: "12", ry: "3", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("path", { d: "M8 32 Q20 20 32 32", fill: "none", stroke: color, strokeWidth: "2" }),
          /* @__PURE__ */ jsx("path", { d: "M8 32 Q20 29 32 32", fill: "none", stroke: color, strokeWidth: "1.3", opacity: "0.6" })
        ] }),
        shapeKey === "Hyperbolic Paraboloid" && /* @__PURE__ */ jsx("image", { href: active ? SADDLE_ICON_INDIGO : SADDLE_ICON_GRAY, x: "2", y: "4", width: "36", height: "32", preserveAspectRatio: "xMidYMid meet" })
      ] }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 9, textAlign: "center", lineHeight: 1.1, color: active ? C.accent : C.muted, fontWeight: 600 }, children: label })
    ] });
  }
  var eyebrowStyle = { fontSize: 11, color: C.eyebrow, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 };
  var axisBtnStyle = (active) => ({ width: 32, height: 32, borderRadius: "50%", background: active ? C.amber : C.card, color: active ? "#fff" : C.muted, border: `1px solid ${active ? C.amber : C.border}`, fontSize: 13, fontWeight: 700, cursor: "pointer" });
  var viewBtnStyle = (active) => ({ padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, textAlign: "left", background: active ? C.accent : C.card, color: active ? "#fff" : C.muted, border: `1px solid ${active ? C.accent : C.border}`, cursor: "pointer" });
  var toggleSwitchStyle = (on) => ({ width: 38, height: 22, borderRadius: 12, background: on ? C.accent : "#DCDCF0", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" });
  var toggleKnobStyle = (on) => ({ position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.15s" });
  var VERTEX_CAPTIONS = {
    Cone: "Slide toward the center \u2014 the ellipse shrinks to a single point, then reopens on the other side.",
    Hyperboloid1Sheet: "Slide all the way to the center \u2014 the ellipse never disappears, it just reaches its smallest width.",
    Hyperboloid2Sheet: "Slide toward the center \u2014 the ellipse vanishes partway through. That gap is the space between the two sheets."
  };
  function AxisViewControls({ def, axisOfSymmetry, selectedAxis, setSelectedAxis, sliceValue, setSliceValue, showLocked, setShowLocked }) {
    const range = selectedAxis ? def.sliderRange(axisOfSymmetry, selectedAxis) : null;
    const cs = selectedAxis ? def.crossSection(axisOfSymmetry, selectedAxis, sliceValue) : null;
    function toggleAxis(a) {
      setSelectedAxis((prev) => prev === a ? null : a);
    }
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: eyebrowStyle, children: "View Along Axis" }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6 }, children: ["x", "y", "z"].map((a) => /* @__PURE__ */ jsx("button", { onClick: () => toggleAxis(a), style: { ...viewBtnStyle(selectedAxis === a), flex: 1, textAlign: "center" }, children: a.toUpperCase() }, a)) })
      ] }),
      selectedAxis && cs && /* @__PURE__ */ jsxs("div", { style: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 14px" }, children: [
        /* @__PURE__ */ jsxs("div", { style: eyebrowStyle, children: [
          "Cross-section at fixed ",
          selectedAxis
        ] }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 14, color: C.accent, fontWeight: 600 }, children: cs.rewrite.split("#").map((part, i, arr) => /* @__PURE__ */ jsxs("span", { children: [
          part,
          i < arr.length - 1 && /* @__PURE__ */ jsx("span", { style: { color: C.amber, fontWeight: 700 }, children: "#" })
        ] }, i)) }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: C.muted, fontWeight: 600 }, children: selectedAxis }),
          /* @__PURE__ */ jsx("input", { type: "range", min: range.min, max: range.max, step: "0.1", value: sliceValue, onChange: (e) => setSliceValue(parseFloat(e.target.value)), style: { flex: 1, accentColor: C.accent } }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 700, color: C.accent, background: "#ECEDFA", padding: "3px 9px", borderRadius: 14 }, children: sliceValue.toFixed(1) })
        ] }),
        !cs.exists && /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, color: "#9C5A70", background: "#FBEFF3", borderRadius: 10, padding: "8px 10px", marginTop: 8, lineHeight: 1.4 }, children: cs.emptyExplain })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", opacity: selectedAxis ? 1 : 0.4, pointerEvents: selectedAxis ? "auto" : "none" }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 12.5, fontWeight: 600, color: C.text }, children: "Show locked view" }),
        /* @__PURE__ */ jsx("div", { onClick: () => selectedAxis && setShowLocked((v) => !v), style: toggleSwitchStyle(showLocked && !!selectedAxis), "data-testid": "locked-toggle", children: /* @__PURE__ */ jsx("div", { style: toggleKnobStyle(showLocked && !!selectedAxis) }) })
      ] })
    ] });
  }
  function GuidedTab() {
    const [shapeKey, setShapeKey] = React.useState("Ellipsoid");
    const [axisOfSymmetry, setAxisOfSymmetry] = React.useState("z");
    const [selectedAxis, setSelectedAxis] = React.useState(null);
    const [sliceValue, setSliceValue] = React.useState(0);
    const [showLocked, setShowLocked] = React.useState(false);
    const def = SHAPES[shapeKey];
    React.useEffect(() => {
      if (selectedAxis) {
        const range = def.sliderRange(axisOfSymmetry, selectedAxis);
        setSliceValue(range.default);
      }
    }, [selectedAxis, axisOfSymmetry, shapeKey]);
    React.useEffect(() => {
      setSelectedAxis(null);
      setAxisOfSymmetry("z");
    }, [shapeKey]);
    const origEq = def.origEquation(axisOfSymmetry);
    const vertexCaption = VERTEX_CAPTIONS[shapeKey];
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", minHeight: 480 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { width: 96, background: C.card, borderRight: `1px solid ${C.border}`, padding: "14px 0", display: "flex", flexDirection: "column", gap: 4 }, children: [
        SHAPE_KEYS.map((key) => /* @__PURE__ */ jsx(RailIcon, { shapeKey: key, label: SHAPE_ICON_HINTS[key], active: key === shapeKey, onClick: () => setShapeKey(key) }, key))
      ] }),
      /* @__PURE__ */ jsx("div", { style: { flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 14 }, children: [
        /* @__PURE__ */ jsx(GuidedCanvas, { shapeKey, axisOfSymmetry, selectedAxis, sliceValue, cornerButtons: true }),
        selectedAxis && showLocked && /* @__PURE__ */ jsx(LockedView, { shapeKey, axisOfSymmetry, selectedAxis, sliceValue })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { style: { width: 260, borderLeft: `1px solid ${C.border}`, background: C.card, padding: 16, display: "flex", flexDirection: "column", gap: 16 }, children: [
        def.hasAxisToggle && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: eyebrowStyle, children: "Axis of Symmetry" }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6 }, children: ["x", "y", "z"].map((a) => /* @__PURE__ */ jsx("button", { onClick: () => setAxisOfSymmetry(a), style: axisBtnStyle(a === axisOfSymmetry), children: a }, a)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 14px" }, children: [
          /* @__PURE__ */ jsx("div", { style: eyebrowStyle, children: "Equation" }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 15, color: C.accent, fontWeight: 600 }, children: origEq }),
          vertexCaption && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.accent2, fontStyle: "italic", lineHeight: 1.4, marginTop: 10 }, children: vertexCaption })
        ] }),
        /* @__PURE__ */ jsx(AxisViewControls, { def, axisOfSymmetry, selectedAxis, setSelectedAxis, sliceValue, setSliceValue, showLocked, setShowLocked })
      ] })
    ] });
  }
  var funcPillStyle = { width: "100%", borderRadius: 20, border: `1.5px solid ${C.border}`, background: C.bg, padding: "10px 16px", fontSize: 14, fontWeight: 600, color: C.text, boxSizing: "border-box" };
  var rangeInputStyle = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "5px 7px", fontSize: 12, textAlign: "center", boxSizing: "border-box" };
  function FreePlayTab({ funcText, setFuncText, fromQuiz, onReturnToQuiz, matchHeight }) {
    const [selectedAxis, setSelectedAxis] = React.useState(null);
    const [sliceValue, setSliceValue] = React.useState(0);
    const [showLocked, setShowLocked] = React.useState(false);
    const coef = React.useMemo(() => parseEquation(funcText), [funcText]);
    const result = React.useMemo(() => classifyQuadric(coef), [coef]);
    React.useEffect(() => {
      setSelectedAxis(null);
    }, [funcText]);
    const def = result.valid ? SHAPES[result.type] : null;
    React.useEffect(() => {
      if (def && selectedAxis) {
        const range = def.sliderRange(result.axisOfSymmetry, selectedAxis);
        setSliceValue(range.default);
      }
    }, [selectedAxis, result.valid]);
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", height: matchHeight ? `${matchHeight}px` : void 0, minHeight: 480, overflow: "hidden" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }, children: [
        fromQuiz && /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ECEDFA", border: "1px solid #D4D8F5", borderRadius: 14, padding: "10px 16px", fontSize: 12.5, color: C.accent, fontWeight: 600 }, children: [
          /* @__PURE__ */ jsx("span", { children: "\u2190 You're here from the Quiz" }),
          /* @__PURE__ */ jsx("button", { onClick: onReturnToQuiz, style: { background: C.accent, color: "#fff", padding: "6px 14px", borderRadius: 14, fontSize: 12, border: "none", cursor: "pointer" }, children: "Return to Quiz" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 14, flex: 1, minHeight: 0 }, children: result.valid ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(GuidedCanvas, { shapeKey: result.type, axisOfSymmetry: result.axisOfSymmetry, selectedAxis, sliceValue, cornerButtons: true }),
          selectedAxis && showLocked && /* @__PURE__ */ jsx(LockedView, { shapeKey: result.type, axisOfSymmetry: result.axisOfSymmetry, selectedAxis, sliceValue })
        ] }) : /* @__PURE__ */ jsx("div", { style: { position: "relative", background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, flex: 1, minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx("div", { style: { color: C.eyebrow, fontSize: 13, textAlign: "center", maxWidth: 260 }, children: "Nothing to plot yet \u2014 fix the equation to see it graphed here." }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { width: 260, borderLeft: `1px solid ${C.border}`, background: C.card, padding: 16, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: eyebrowStyle, children: "Your Equation" }),
          /* @__PURE__ */ jsx("input", { value: funcText, onChange: (e) => setFuncText(e.target.value), style: { ...funcPillStyle, borderColor: result.valid ? C.border : C.warn, background: result.valid ? C.bg : "#FBEFF3" } }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 10.5, color: C.eyebrow, lineHeight: 1.4, marginTop: 6 }, children: "Acceptable form: Ax\xB2 + By\xB2 + Cz\xB2 + Dx + Ey + Fz + G = 0. Terms mixing two or more variables (like 4xy or 2x\xB2y) aren't supported." }),
          !result.valid && /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, alignItems: "flex-start", fontSize: 11.5, color: "#9C5A70", background: "#FBEFF3", borderRadius: 10, padding: "8px 10px", marginTop: 8, lineHeight: 1.4 }, children: [
            /* @__PURE__ */ jsx("div", { style: { width: 6, height: 6, borderRadius: "50%", background: C.warn, flexShrink: 0, marginTop: 4 } }),
            result.reason
          ] }),
          result.valid && /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: C.accent, background: "#ECEDFA", borderRadius: 10, padding: "6px 10px", marginTop: 8, fontWeight: 600 }, children: [
            "Recognized as: ",
            SHAPES[result.type].label
          ] })
        ] }),
        result.valid && /* @__PURE__ */ jsx(AxisViewControls, { def, axisOfSymmetry: result.axisOfSymmetry, selectedAxis, setSelectedAxis, sliceValue, setSliceValue, showLocked, setShowLocked })
      ] })
    ] });
  }

  // src/quiz.jsx
  var SURFACE_NAMES_FULL = ["Ellipsoid", "Elliptic Paraboloid", "Hyperbolic Paraboloid", "Cone", "Hyperboloid1Sheet", "Hyperboloid2Sheet"];
  var SURFACE_LABELS = {
    Ellipsoid: "Ellipsoid",
    "Elliptic Paraboloid": "Elliptic Paraboloid",
    "Hyperbolic Paraboloid": "Hyperbolic Paraboloid",
    Cone: "Cone",
    Hyperboloid1Sheet: "Hyperboloid (1 sheet)",
    Hyperboloid2Sheet: "Hyperboloid (2 sheets)"
  };
  var CS_OPTIONS_FULL = ["Ellipse", "Parabola", "Hyperbola"];
  var FAMILY = { Cone: "A", Hyperboloid1Sheet: "A", Hyperboloid2Sheet: "A", Ellipsoid: "B", "Elliptic Paraboloid": "C", "Hyperbolic Paraboloid": "D" };
  var CONE_HYP_TYPES = ["Cone", "Hyperboloid1Sheet", "Hyperboloid2Sheet"];
  var CONE_HYP_CS_OPTIONS = ["Ellipse", "Hyperbola"];
  function surfaceNamesFor(mode) {
    return mode === "conehyp" ? CONE_HYP_TYPES : SURFACE_NAMES_FULL;
  }
  function csOptionsFor(mode) {
    return mode === "conehyp" ? CONE_HYP_CS_OPTIONS : CS_OPTIONS_FULL;
  }
  function scenario1Hint(trueType, wrongType) {
    const sameFamily = CONE_HYP_TYPES;
    if (trueType === "Ellipsoid") {
      if (wrongType === "Hyperbolic Paraboloid") return "The shape you selected has no cross-sections that are ellipses. What shape has multiple cross-sections that are ellipses?";
      return "The shape you selected has only a single cross-section that is an ellipse. What shape has multiple cross-sections that are ellipses?";
    }
    if (trueType === "Elliptic Paraboloid") {
      if (wrongType === "Ellipsoid") return "The shape you selected has all cross-sections being ellipses. What shape would also have cross-sections that are parabolas?";
      if (wrongType === "Hyperbolic Paraboloid") return "The shape you selected has two cross-sections that are parabolas, but they would have to open in different directions. It also has a cross-section that is a hyperbola. What shape would have another cross-section that is an ellipse instead?";
      return "The shape you selected has 2 cross-sections that are hyperbolas. What shape would have 2 cross-sections that are parabolas?";
    }
    if (trueType === "Hyperbolic Paraboloid") {
      if (wrongType === "Ellipsoid") return "The shape you selected has no cross-sections that are hyperbolas or parabolas. What shape would have 2 cross-sections that are parabolas?";
      if (wrongType === "Elliptic Paraboloid") return "The shape you selected has two cross-sections that are parabolas, but they would have to open the same direction. It also has a cross-section that is an ellipse. What shape would have another cross-section that is a hyperbola instead?";
      return "The shape you selected has 2 cross-sections that are hyperbolas and none that are parabolas. What shape would have 2 cross-sections that are parabolas?";
    }
    if (sameFamily.includes(trueType)) {
      if (!sameFamily.includes(wrongType)) return "The shape you selected doesn't have 2 cross-sections that are hyperbolas. What shape has 2 cross-sections that are hyperbolas?";
      return "Double check the behavior of the underlying ellipses. Do they shrink to a point? Do they always exist? Do they fail to exist for some values?";
    }
    return "Take another look at how the cross-sections behave for the shape you picked versus what you found.";
  }
  function pickRandomQuizSet(mode) {
    const relevantTypes = mode === "conehyp" ? CONE_HYP_TYPES : SURFACE_NAMES_FULL;
    const byType = {};
    const pool = [];
    for (const eq of equations) {
      if (!relevantTypes.includes(eq.type)) continue;
      (byType[eq.type] = byType[eq.type] || []).push(eq);
      pool.push(eq);
    }
    const guaranteed = relevantTypes.map((t) => {
      const p = byType[t];
      return p[Math.floor(Math.random() * p.length)];
    });
    const remaining = pool.filter((eq) => !guaranteed.includes(eq));
    const fillCount = mode === "conehyp" ? 6 : 4;
    const shuffled = remaining.sort(() => Math.random() - 0.5).slice(0, fillCount);
    return [...guaranteed, ...shuffled].sort(() => Math.random() - 0.5);
  }
  function newFieldState() {
    return {
      name: { eliminated: [], resolved: null, wasAuto: false },
      x: { eliminated: [], resolved: null, wasAuto: false },
      y: { eliminated: [], resolved: null, wasAuto: false },
      z: { eliminated: [], resolved: null, wasAuto: false }
    };
  }
  function computeQuizStats(questions, fieldStates, firstAttemptResults) {
    let correctCount = 0;
    let csRightNameWrongCount = 0;
    const csTotals = { Ellipse: [0, 0], Parabola: [0, 0], Hyperbola: [0, 0] };
    const csConfusion = {};
    const nameConfusion = {};
    let sameFamilyConfusion = 0, crossFamilyConfusion = 0;
    questions.forEach((q, i) => {
      const fs = fieldStates[i];
      const far = firstAttemptResults[i];
      if (far && far.allCorrect) correctCount++;
      if (far && far.csAllCorrectButNameWrong) csRightNameWrongCount++;
      for (const axis of ["x", "y", "z"]) {
        const correct = q.crossSections[axis];
        csTotals[correct][1]++;
        if (!fs[axis].wasAuto) csTotals[correct][0]++;
        for (const wrong of fs[axis].eliminated) {
          const key = `${correct}->${wrong}`;
          csConfusion[key] = (csConfusion[key] || 0) + 1;
        }
      }
      for (const wrongName of fs.name.eliminated) {
        if (FAMILY[wrongName] === FAMILY[q.type]) sameFamilyConfusion++;
        else crossFamilyConfusion++;
        const pairKey = [q.type, wrongName].sort().join("<->");
        nameConfusion[pairKey] = (nameConfusion[pairKey] || 0) + 1;
      }
    });
    let topConfusion = null, topCount = 0;
    for (const [k, v] of Object.entries(csConfusion)) {
      if (v > topCount) {
        topCount = v;
        topConfusion = k;
      }
    }
    return { correctCount, csRightNameWrongCount, csTotals, csConfusion, topConfusion, topCount, nameConfusion, sameFamilyConfusion, crossFamilyConfusion };
  }
  var btnStyle = (bg, disabled) => ({ padding: "10px 20px", borderRadius: 20, fontSize: 12.5, fontWeight: 700, background: bg, color: disabled ? "#B8B8CC" : "#fff", border: "none", cursor: disabled ? "default" : "pointer" });
  function QuizStartPage({ onBegin, sessionAttempts, sessionCsTotals, sessionNameConfusion }) {
    const [selectedMode, setSelectedMode] = React.useState("full");
    let trickiest = null, trickiestPct = 100;
    for (const type of CS_OPTIONS_FULL) {
      const [c, t] = sessionCsTotals[type];
      if (t === 0) continue;
      const pct = c / t * 100;
      if (pct < trickiestPct) {
        trickiestPct = pct;
        trickiest = type;
      }
    }
    const latest = sessionAttempts.length > 0 ? sessionAttempts[sessionAttempts.length - 1] : null;
    let topNamePair = null, topNameCount = 0;
    for (const [k, v] of Object.entries(sessionNameConfusion)) {
      if (v > topNameCount) {
        topNameCount = v;
        topNamePair = k;
      }
    }
    const namePatternText = topNamePair && topNameCount >= 2 ? (() => {
      const [a, b] = topNamePair.split("<->");
      return `You mixed up ${SURFACE_LABELS[a]} and ${SURFACE_LABELS[b]} ${topNameCount} times this session.`;
    })() : null;
    return /* @__PURE__ */ jsxs("div", { style: { padding: "44px 40px", maxWidth: 640, margin: "0 auto", textAlign: "center" }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: C.eyebrow, textTransform: "uppercase", marginBottom: 10 }, children: "Cross-Section Identification Quiz" }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 12, letterSpacing: "-0.01em" }, children: "Ready to test yourself?" }),
      /* @__PURE__ */ jsx("p", { style: { fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 460, margin: "0 auto 28px" }, children: "You'll see an equation and pick the surface's name plus its cross-section shape along all three axes. Wrong answers get a hint, not just a red X \u2014 work through it and try again. Only your very first try on each question counts toward your score, just like an exam." }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 14, justifyContent: "center", marginBottom: 30, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => setSelectedMode("full"),
            style: {
              border: `1.5px solid ${selectedMode === "full" ? C.accent : C.border}`,
              background: selectedMode === "full" ? "#F7F8FE" : C.card,
              boxShadow: selectedMode === "full" ? "0 0 0 3px rgba(59,79,194,0.08)" : "none",
              borderRadius: 16,
              padding: "18px 20px",
              width: 220,
              textAlign: "left",
              cursor: "pointer"
            },
            children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }, children: "Full Quiz" }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, color: C.muted, lineHeight: 1.5 }, children: "All 6 surface types, drawn from the full 60-equation bank. 10 questions per set." })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => setSelectedMode("conehyp"),
            style: {
              border: `1.5px solid ${selectedMode === "conehyp" ? C.accent : C.border}`,
              background: selectedMode === "conehyp" ? "#F7F8FE" : C.card,
              boxShadow: selectedMode === "conehyp" ? "0 0 0 3px rgba(59,79,194,0.08)" : "none",
              borderRadius: 16,
              padding: "18px 20px",
              width: 220,
              textAlign: "left",
              cursor: "pointer"
            },
            children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }, children: "Cone & Hyperboloid Challenge" }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, color: C.muted, lineHeight: 1.5 }, children: "Just Cone, Hyperboloid (1 sheet), and Hyperboloid (2 sheets) \u2014 the trio with matching cross-sections. Good focused practice." })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => onBegin(selectedMode), style: { background: C.accent, color: "#fff", border: "none", fontSize: 14.5, fontWeight: 700, padding: "13px 36px", borderRadius: 20, cursor: "pointer", boxShadow: "0 2px 8px rgba(59,79,194,0.25)" }, children: "Begin Quiz" }),
      /* @__PURE__ */ jsxs("div", { style: { marginTop: 36, background: C.bg, borderRadius: 16, padding: "20px 24px", textAlign: "left", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 2 }, children: "Your progress this session" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.eyebrow, marginBottom: 14 }, children: "Resets when you close or reload this page \u2014 nothing is saved between visits." }),
        sessionAttempts.length === 0 ? /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, color: C.eyebrow, padding: "6px 0" }, children: "No attempts yet this session \u2014 finish a set and your stats will show up here." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 12 }, children: [
            /* @__PURE__ */ jsxs("div", { style: { flex: 1, background: C.card, borderRadius: 12, padding: "10px 12px" }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, color: C.eyebrow, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 4 }, children: "Sets completed" }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 18, fontWeight: 800, color: C.accent }, children: sessionAttempts.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { flex: 1, background: C.card, borderRadius: 12, padding: "10px 12px" }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, color: C.eyebrow, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 4 }, children: "Latest accuracy" }),
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 18, fontWeight: 800, color: C.accent }, children: [
                latest ? Math.round(latest.correct / latest.total * 100) : 0,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { flex: 1, background: C.card, borderRadius: 12, padding: "10px 12px" }, children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, color: C.eyebrow, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 4 }, children: "Trickiest cross-section" }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 13.5, fontWeight: 800, color: C.accent }, children: trickiest || "\u2014" })
            ] })
          ] }),
          namePatternText && /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: C.accent2, fontStyle: "italic", lineHeight: 1.5, marginTop: 12 }, children: namePatternText })
        ] })
      ] })
    ] });
  }
  function pillState(fieldState, optionValue, currentPick) {
    if (fieldState.resolved === optionValue) return fieldState.wasAuto ? "correct-auto" : "correct";
    if (fieldState.eliminated.includes(optionValue)) return "eliminated";
    if (currentPick === optionValue) return "selected";
    return "default";
  }
  function FieldBlock({ label, children }) {
    return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 14 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.eyebrow, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700, marginBottom: 6 }, children: label }),
      children
    ] });
  }
  function Pill({ state, onClick, disabled, children }) {
    const styles = {
      default: { border: `1.5px solid ${C.border}`, background: C.card, color: C.text },
      selected: { border: `1.5px solid ${C.accent}`, background: "#ECEDFA", color: C.accent },
      correct: { border: `1.5px solid ${C.green}`, background: "#EFF9F3", color: "#256E48" },
      "correct-auto": { border: `1.5px solid #A8D9BE`, background: "#F3FAF6", color: "#5C9A78" },
      eliminated: { border: `1.5px solid ${C.border}`, background: "#F3F3F8", color: "#C4C4D6", textDecoration: "line-through" }
    };
    return /* @__PURE__ */ jsx("button", { onClick, disabled, style: { padding: "7px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: disabled ? "default" : "pointer", ...styles[state] }, children });
  }
  var navArrowStyle = (disabled) => ({ width: 30, height: 30, borderRadius: "50%", background: C.card, border: `1px solid ${C.border}`, color: C.muted, fontSize: 14, opacity: disabled ? 0.35 : 1, cursor: disabled ? "default" : "pointer" });
  function QuizTab({ onExplore }) {
    const [started, setStarted] = React.useState(false);
    const [mode, setMode] = React.useState("full");
    const [questions, setQuestions] = React.useState(() => pickRandomQuizSet("full"));
    const [qIndex, setQIndex] = React.useState(0);
    const [reviewIndex, setReviewIndex] = React.useState(null);
    const [fieldStates, setFieldStates] = React.useState(() => questions.map(() => newFieldState()));
    const [attemptCounts, setFieldAttempts] = React.useState(() => questions.map(() => 0));
    const [picks, setPicks] = React.useState(() => questions.map(() => ({ name: null, x: null, y: null, z: null })));
    const [feedback, setFeedback] = React.useState(null);
    const [showSummary, setShowSummary] = React.useState(false);
    const [sessionAttempts, setSessionAttempts] = React.useState([]);
    const [sessionCsTotals, setSessionCsTotals] = React.useState({ Ellipse: [0, 0], Parabola: [0, 0], Hyperbola: [0, 0] });
    const [sessionNameConfusion, setSessionNameConfusion] = React.useState({});
    const [firstAttemptResults, setFirstAttemptResults] = React.useState(() => questions.map(() => null));
    const activeIndex = reviewIndex !== null ? reviewIndex : qIndex;
    const q = questions[activeIndex];
    const fs = fieldStates[activeIndex];
    const pick = picks[activeIndex];
    const isReviewing = reviewIndex !== null;
    const isResolved = fs.name.resolved && fs.x.resolved && fs.y.resolved && fs.z.resolved;
    const maxReachable = qIndex;
    const surfaceNames = surfaceNamesFor(mode);
    const csOptions = csOptionsFor(mode);
    function beginQuiz(selectedMode) {
      const fresh = pickRandomQuizSet(selectedMode);
      setMode(selectedMode);
      setQuestions(fresh);
      setFieldStates(fresh.map(() => newFieldState()));
      setFieldAttempts(fresh.map(() => 0));
      setPicks(fresh.map(() => ({ name: null, x: null, y: null, z: null })));
      setFirstAttemptResults(fresh.map(() => null));
      setQIndex(0);
      setReviewIndex(null);
      setShowSummary(false);
      setFeedback(null);
      setStarted(true);
    }
    function setPick(field, value) {
      if (isReviewing) return;
      if (fs[field].resolved) return;
      setPicks((prev) => {
        const next = [...prev];
        next[activeIndex] = { ...next[activeIndex], [field]: value };
        return next;
      });
    }
    function allFilled() {
      return ["name", "x", "y", "z"].every((f) => {
        if (fs[f].resolved) return true;
        return pick[f] && !fs[f].eliminated.includes(pick[f]);
      });
    }
    function checkAnswer() {
      if (!allFilled()) return;
      const isFirstAttempt = attemptCounts[activeIndex] === 0;
      const newFs = { ...fs, name: { ...fs.name }, x: { ...fs.x }, y: { ...fs.y }, z: { ...fs.z } };
      for (const axis of ["x", "y", "z"]) {
        if (newFs[axis].resolved) continue;
        const correct = q.crossSections[axis];
        if (pick[axis] === correct) {
          newFs[axis].resolved = correct;
          newFs[axis].wasAuto = false;
        } else {
          if (!newFs[axis].eliminated.includes(pick[axis])) newFs[axis].eliminated.push(pick[axis]);
          const remaining = csOptions.filter((o) => !newFs[axis].eliminated.includes(o));
          if (remaining.length === 1) {
            newFs[axis].resolved = correct;
            newFs[axis].wasAuto = true;
          }
        }
      }
      if (!newFs.name.resolved) {
        if (pick.name === q.type) {
          newFs.name.resolved = q.type;
          newFs.name.wasAuto = false;
        } else {
          if (!newFs.name.eliminated.includes(pick.name)) newFs.name.eliminated.push(pick.name);
          const remaining = surfaceNames.filter((o) => !newFs.name.eliminated.includes(o));
          if (remaining.length === 1) {
            newFs.name.resolved = q.type;
            newFs.name.wasAuto = true;
          }
        }
      }
      const nameCorrectThisTry = pick.name === q.type;
      const allCrossCorrectThisPress = ["x", "y", "z"].every((a) => pick[a] === q.crossSections[a]);
      let msg, tone;
      if (allCrossCorrectThisPress && nameCorrectThisTry) {
        msg = "Great job! Everything here is correct.";
        tone = "success";
      } else if (allCrossCorrectThisPress && !nameCorrectThisTry) {
        msg = `All three cross-sections are correct \u2014 nice work. But the name isn't quite right yet. ${scenario1Hint(q.type, pick.name)}`;
        tone = "neutral";
      } else if (!allCrossCorrectThisPress && nameCorrectThisTry) {
        msg = "Nice work naming the surface \u2014 but not all of your cross-sections are correct, so this may have been a bit of a lucky guess. For each one you got wrong: what do you actually get when you substitute a constant in for that variable and simplify?";
        tone = "warn";
      } else {
        msg = "The cross-sections in green are correct; the ones in red aren\u2019t. Fix those first before re-guessing the surface\u2019s name. For each one marked in red \u2014 what curve do you actually get if you fix that variable at a constant value and simplify what\u2019s left of the equation?";
        tone = "warn";
      }
      setFieldStates((prev) => {
        const next = [...prev];
        next[activeIndex] = newFs;
        return next;
      });
      setFieldAttempts((prev) => {
        const next = [...prev];
        next[activeIndex] = next[activeIndex] + 1;
        return next;
      });
      if (isFirstAttempt) {
        setFirstAttemptResults((prev) => {
          const next = [...prev];
          next[activeIndex] = {
            allCorrect: allCrossCorrectThisPress && nameCorrectThisTry,
            csAllCorrectButNameWrong: allCrossCorrectThisPress && !nameCorrectThisTry
          };
          return next;
        });
      }
      setFeedback({ msg, tone });
    }
    function goNext() {
      setFeedback(null);
      if (qIndex + 1 >= questions.length) {
        const stats = computeQuizStats(questions, fieldStates, firstAttemptResults);
        setSessionAttempts((prev) => [...prev, { correct: stats.correctCount, total: questions.length }]);
        setSessionCsTotals((prev) => {
          const next = {};
          for (const k of CS_OPTIONS_FULL) next[k] = [prev[k][0] + stats.csTotals[k][0], prev[k][1] + stats.csTotals[k][1]];
          return next;
        });
        setSessionNameConfusion((prev) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(stats.nameConfusion)) next[k] = (next[k] || 0) + v;
          return next;
        });
        setShowSummary(true);
      } else {
        setQIndex((i) => i + 1);
      }
    }
    function reviewQuestion(i) {
      setFeedback(null);
      setReviewIndex(i === qIndex ? null : i);
    }
    function restartQuiz() {
      beginQuiz(mode);
    }
    function backToStart() {
      setStarted(false);
    }
    if (!started) {
      return /* @__PURE__ */ jsx(QuizStartPage, { onBegin: beginQuiz, sessionAttempts, sessionCsTotals, sessionNameConfusion });
    }
    if (showSummary) {
      return /* @__PURE__ */ jsx(QuizSummary, { questions, fieldStates, firstAttemptResults, sessionAttempts, onRestart: restartQuiz, onChangeMode: backToStart });
    }
    return /* @__PURE__ */ jsxs("div", { style: { padding: 20, maxWidth: 640, margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }, children: [
        /* @__PURE__ */ jsx("button", { disabled: activeIndex === 0, onClick: () => reviewQuestion(Math.max(0, activeIndex - 1)), style: navArrowStyle(activeIndex === 0), children: "\u2039" }),
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, fontWeight: 700, color: C.text }, children: [
            "Question ",
            activeIndex + 1,
            " of ",
            questions.length,
            isReviewing && /* @__PURE__ */ jsx("span", { style: { color: C.accent }, children: " \xB7 reviewing" })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 5, marginTop: 6, justifyContent: "center" }, children: questions.map((_, i) => {
            const done = fieldStates[i].name.resolved && fieldStates[i].x.resolved && fieldStates[i].y.resolved && fieldStates[i].z.resolved;
            const reachable = i <= maxReachable;
            const isCurrentReal = i === qIndex;
            const isBeingReviewed = i === activeIndex && isReviewing;
            let bg = "#EAEAF2", color = "#B8B8CC", ring = "none";
            if (done) {
              bg = C.green;
              color = "#fff";
            }
            if (isCurrentReal) {
              bg = C.accent;
              color = "#fff";
              ring = "0 0 0 3px #DCDFF6";
            }
            if (isBeingReviewed) {
              ring = `0 0 0 2px ${C.accent}`;
            }
            return /* @__PURE__ */ jsx("div", { onClick: () => reachable && reviewQuestion(i), style: { width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, background: bg, color, boxShadow: ring, cursor: reachable ? "pointer" : "default", opacity: reachable ? 1 : 0.5 }, children: i + 1 }, i);
          }) })
        ] }),
        /* @__PURE__ */ jsx("button", { disabled: activeIndex >= maxReachable, onClick: () => reviewQuestion(Math.min(maxReachable, activeIndex + 1)), style: navArrowStyle(activeIndex >= maxReachable), children: "\u203A" })
      ] }),
      isReviewing && /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ECEDFA", border: "1px solid #D4D8F5", borderRadius: 14, padding: "10px 16px", marginBottom: 14, fontSize: 12.5, color: C.accent, fontWeight: 600 }, children: [
        /* @__PURE__ */ jsx("span", { children: "You\u2019re reviewing a completed question" }),
        /* @__PURE__ */ jsxs("button", { onClick: () => reviewQuestion(qIndex), style: { background: C.accent, color: "#fff", padding: "6px 14px", borderRadius: 14, fontSize: 12, border: "none", cursor: "pointer" }, children: [
          "Return to Question ",
          qIndex + 1
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 19, fontWeight: 600, marginBottom: 16 }, children: q.display }),
        /* @__PURE__ */ jsx(FieldBlock, { label: "Surface Name", children: /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }, children: surfaceNames.map((name) => /* @__PURE__ */ jsxs(Pill, { state: pillState(fs.name, name, pick.name), onClick: () => setPick("name", name), disabled: isReviewing || fs.name.resolved || fs.name.eliminated.includes(name), children: [
          SURFACE_LABELS[name],
          fs.name.resolved === name && !fs.name.wasAuto ? " \u2713" : "",
          fs.name.resolved === name && fs.name.wasAuto ? " \u2014 correct answer" : ""
        ] }, name)) }) }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 10 }, children: ["x", "y", "z"].map((axis) => /* @__PURE__ */ jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ jsx(FieldBlock, { label: /* @__PURE__ */ jsxs(Fragment, { children: ["Cross-Section: ", /* @__PURE__ */ jsx("span", { style: { textTransform: "none" }, children: axis })] }), children: /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: csOptions.map((opt) => /* @__PURE__ */ jsxs(Pill, { state: pillState(fs[axis], opt, pick[axis]), onClick: () => setPick(axis, opt), disabled: isReviewing || fs[axis].resolved || fs[axis].eliminated.includes(opt), children: [
          opt,
          fs[axis].resolved === opt && !fs[axis].wasAuto ? " \u2713" : "",
          fs[axis].resolved === opt && fs[axis].wasAuto ? " \u2014 correct answer" : ""
        ] }, opt)) }) }) }, axis)) }),
        feedback && !isReviewing && /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, alignItems: "flex-start", borderRadius: 14, padding: "10px 14px", margin: "14px 0", fontSize: 12.5, fontWeight: 500, background: feedback.tone === "success" ? "#EFF9F3" : feedback.tone === "warn" ? "#FBEFF3" : "#ECEDFA", color: feedback.tone === "success" ? "#256E48" : feedback.tone === "warn" ? "#9C5A70" : C.accent }, children: [
          /* @__PURE__ */ jsx("div", { style: { width: 7, height: 7, borderRadius: "50%", background: "currentColor", marginTop: 5, flexShrink: 0 } }),
          feedback.msg
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }, children: [
          /* @__PURE__ */ jsx("div", { onClick: () => isResolved && !isReviewing && onExplore(q.display), style: isResolved ? { fontSize: 12.5, fontWeight: 700, color: C.accent, cursor: "pointer" } : { fontSize: 12.5, fontWeight: 700, color: "#B8B8CC", position: "relative" }, title: isResolved ? void 0 : "Available once the question has been answered", children: "Explore this one \u2192" }),
          isReviewing ? null : isResolved ? /* @__PURE__ */ jsx("button", { onClick: goNext, style: btnStyle(C.accent), children: qIndex + 1 >= questions.length ? "Finish Quiz \u2192" : "Next Question \u2192" }) : /* @__PURE__ */ jsx("button", { onClick: checkAnswer, disabled: !allFilled(), style: btnStyle(allFilled() ? C.accent : "#EAEAF2", !allFilled()), children: "Check Answer" })
        ] })
      ] })
    ] });
  }
  function SummarySection({ title, children }) {
    return /* @__PURE__ */ jsxs("div", { style: { background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "16px 18px", marginBottom: 14 }, children: [
      /* @__PURE__ */ jsx("h4", { style: { margin: "0 0 10px", fontSize: 13, color: C.eyebrow, textTransform: "uppercase", letterSpacing: "0.04em" }, children: title }),
      children
    ] });
  }
  function QuizSummary({ questions, fieldStates, firstAttemptResults, sessionAttempts, onRestart, onChangeMode }) {
    const stats = computeQuizStats(questions, fieldStates, firstAttemptResults);
    const latest = sessionAttempts[sessionAttempts.length - 1] || { correct: stats.correctCount, total: questions.length };
    const totalConfusions = stats.sameFamilyConfusion + stats.crossFamilyConfusion;
    return /* @__PURE__ */ jsxs("div", { style: { padding: 20, maxWidth: 640, margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: "18px 22px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: C.muted, fontWeight: 600 }, children: "Quiz complete" }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 26, fontWeight: 700, color: C.accent }, children: [
            latest.correct,
            " / ",
            latest.total
          ] }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: C.eyebrow, marginTop: 2 }, children: "Counts only fully-correct first attempts \u2014 no credit for corrections after a hint." })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10 }, children: [
          /* @__PURE__ */ jsx("button", { onClick: onChangeMode, style: { ...btnStyle(C.card), color: C.accent, border: `1.5px solid ${C.border}` }, children: "Change Mode" }),
          /* @__PURE__ */ jsx("button", { onClick: onRestart, style: btnStyle(C.accent), children: "Start a New Set \u2192" })
        ] })
      ] }),
      stats.csRightNameWrongCount > 0 && /* @__PURE__ */ jsx(SummarySection, { title: "Name vs. Cross-Section Gap", children: /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.5 }, children: [
        "On ",
        /* @__PURE__ */ jsx("b", { children: stats.csRightNameWrongCount }),
        " question",
        stats.csRightNameWrongCount === 1 ? "" : "s",
        ", every cross-section was right but the surface name wasn\u2019t \\u2014 worth reviewing what actually distinguishes those shapes beyond their cross-sections."
      ] }) }),
      /* @__PURE__ */ jsxs(SummarySection, { title: "Cross-Section Accuracy by Type", children: [
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: CS_OPTIONS_FULL.map((type) => {
          const [c, t] = stats.csTotals[type];
          if (t === 0) return null;
          const pct = Math.round(c / t * 100);
          return /* @__PURE__ */ jsxs("div", { style: { background: C.bg, borderRadius: 12, padding: "10px 14px", minWidth: 90 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, color: C.eyebrow, textTransform: "uppercase", letterSpacing: "0.03em" }, children: type }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 17, fontWeight: 800, color: C.accent }, children: [
              pct,
              "%"
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 10.5, color: C.muted }, children: [
              c,
              "/",
              t,
              " correct"
            ] })
          ] }, type);
        }) }),
        stats.topConfusion && stats.topCount > 1 && /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: C.accent2, fontStyle: "italic", marginTop: 12, lineHeight: 1.5 }, children: [
          "Most common mix-up: mistaking a ",
          /* @__PURE__ */ jsx("b", { children: stats.topConfusion.split("->")[0] }),
          " cross-section for a ",
          /* @__PURE__ */ jsx("b", { children: stats.topConfusion.split("->")[1] }),
          " (",
          stats.topCount,
          " time",
          stats.topCount === 1 ? "" : "s",
          ")."
        ] })
      ] }),
      totalConfusions > 0 && /* @__PURE__ */ jsx(SummarySection, { title: "Surface Name Confusion", children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, background: C.bg, borderRadius: 12, padding: "10px 14px" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, color: C.eyebrow, textTransform: "uppercase", letterSpacing: "0.03em" }, children: "Same-family mix-ups" }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 17, fontWeight: 800, color: C.accent }, children: stats.sameFamilyConfusion }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 10.5, color: C.muted }, children: "e.g. Cone vs. a Hyperboloid" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, background: C.bg, borderRadius: 12, padding: "10px 14px" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 10, fontWeight: 700, color: C.eyebrow, textTransform: "uppercase", letterSpacing: "0.03em" }, children: "Cross-family mix-ups" }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 17, fontWeight: 800, color: C.accent }, children: stats.crossFamilyConfusion }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 10.5, color: C.muted }, children: "unrelated shapes confused" })
        ] })
      ] }) }),
      sessionAttempts.length > 0 && /* @__PURE__ */ jsx(SummarySection, { title: "Attempts This Session", children: /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: sessionAttempts.map((a, i) => /* @__PURE__ */ jsxs("div", { style: { background: C.bg, borderRadius: 14, padding: "6px 12px", fontSize: 12, fontWeight: 600 }, children: [
        "Attempt ",
        i + 1,
        ": ",
        a.correct,
        "/",
        a.total
      ] }, i)) }) })
    ] });
  }

  // src/main.jsx
  function App() {
    const TAB_ORDER = ["guided", "freeplay", "quiz"];
    const TAB_LABELS = { guided: "Guided", freeplay: "Free Play", quiz: "Quiz" };
    const [tab, setTab] = React.useState("guided");
    const [funcText, setFuncText] = React.useState("x\xB2 + y\xB2 = z");
    const [cameFromQuiz, setCameFromQuiz] = React.useState(false);
    const [thumbStyle, setThumbStyle] = React.useState({ left: 4, width: 62 });
    const [baselineHeight, setBaselineHeight] = React.useState(null);
    const containerRef = React.useRef(null);
    const guidedPanelRef = React.useRef(null);
    const freeplayPanelRef = React.useRef(null);
    const quizPanelRef = React.useRef(null);
    const tabButtonRefs = React.useRef({});
    const tabGroupRef = React.useRef(null);
    const prevTabRef = React.useRef("guided");
    const panelRefFor = (key) => key === "guided" ? guidedPanelRef : key === "freeplay" ? freeplayPanelRef : quizPanelRef;
    function measureThumb(key) {
      const btn = tabButtonRefs.current[key];
      const group = tabGroupRef.current;
      if (!btn || !group) return;
      const groupRect = group.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setThumbStyle({ left: btnRect.left - groupRect.left, width: btnRect.width });
    }
    React.useEffect(() => {
      measureThumb("guided");
    }, []);
    React.useEffect(() => {
      if (tab !== "guided") return;
      const el = guidedPanelRef.current;
      if (!el) return;
      const measure = () => setBaselineHeight(el.getBoundingClientRect().height);
      measure();
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }, [tab]);
    React.useEffect(() => {
      measureThumb(tab);
      const prevKey = prevTabRef.current;
      if (prevKey === tab) return;
      const outgoingEl = panelRefFor(prevKey).current;
      const incomingEl = panelRefFor(tab).current;
      const container = containerRef.current;
      if (!outgoingEl || !incomingEl || !container) {
        prevTabRef.current = tab;
        return;
      }
      const startHeight = container.getBoundingClientRect().height;
      container.style.height = startHeight + "px";
      outgoingEl.style.transition = "none";
      outgoingEl.style.opacity = "1";
      incomingEl.style.transition = "none";
      incomingEl.style.display = "block";
      incomingEl.style.position = "absolute";
      incomingEl.style.top = "0";
      incomingEl.style.left = "0";
      incomingEl.style.width = "100%";
      incomingEl.style.opacity = "0";
      void incomingEl.offsetHeight;
      const endHeight = incomingEl.getBoundingClientRect().height;
      const raf = requestAnimationFrame(() => {
        container.style.transition = "height 0.3s cubic-bezier(0.4,0,0.2,1)";
        container.style.height = endHeight + "px";
        outgoingEl.style.transition = "opacity 0.24s ease";
        outgoingEl.style.opacity = "0";
        incomingEl.style.transition = "opacity 0.26s ease";
        incomingEl.style.opacity = "1";
      });
      const t = setTimeout(() => {
        outgoingEl.style.display = "none";
        outgoingEl.style.transition = "";
        outgoingEl.style.opacity = "";
        incomingEl.style.position = "";
        incomingEl.style.top = "";
        incomingEl.style.left = "";
        incomingEl.style.width = "";
        incomingEl.style.transition = "";
        incomingEl.style.opacity = "";
        container.style.transition = "";
        container.style.height = "auto";
      }, 320);
      prevTabRef.current = tab;
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }, [tab]);
    function handleExplore(equationDisplay) {
      setFuncText(equationDisplay);
      setCameFromQuiz(true);
      setTab("freeplay");
    }
    function handleReturnToQuiz() {
      setCameFromQuiz(false);
      setTab("quiz");
    }
    return /* @__PURE__ */ jsxs("div", { style: { height: "100%", boxSizing: "border-box", background: "#E8E8F2", padding: "24px 24px 0", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", color: C.text }, children: [
      /* @__PURE__ */ jsxs("div", { style: { maxWidth: 1200, width: "100%", margin: "0 auto", background: C.bg, borderRadius: "20px", boxShadow: "0 4px 24px rgba(60,60,90,0.14)", overflow: "hidden", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", background: "linear-gradient(135deg, #3B4FC2, #4A5CD6)" }, children: [
        /* @__PURE__ */ jsx("svg", { viewBox: "0 0 1200 130", preserveAspectRatio: "none", style: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.14, pointerEvents: "none" }, children: /* @__PURE__ */ jsx("path", { d: "M0 95 C 200 15, 340 120, 560 45 S 900 5, 1200 75", stroke: "white", strokeWidth: "2.5", fill: "none" }) }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }, children: [
          /* @__PURE__ */ jsx("a", { href: "../../../browse.html#/applets", style: { display: "inline-flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.88)", textDecoration: "none", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.12)" }, children: "← All Applets" }),
          /* @__PURE__ */ jsx("div", { style: { width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.22)" } }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.08em", textTransform: "uppercase" }, children: "Calculus III \xB7 Unit 1" }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 24, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.005em" }, children: "Quadric Surface Explorer" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { ref: tabGroupRef, style: { position: "relative", zIndex: 1, display: "flex", gap: 4, background: "rgba(255,255,255,0.14)", padding: 4, borderRadius: 20 }, children: [
          /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: 4, left: 0, bottom: 4, width: thumbStyle.width, transform: `translateX(${thumbStyle.left}px)`, background: "#FFFFFF", borderRadius: 16, transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1), width 0.32s cubic-bezier(0.4,0,0.2,1)", zIndex: 0 } }),
          TAB_ORDER.map((key) => /* @__PURE__ */ jsx(
            "button",
            {
              ref: (el) => {
                tabButtonRefs.current[key] = el;
              },
              onClick: () => setTab(key),
              style: {
                position: "relative",
                zIndex: 1,
                padding: "7px 16px",
                borderRadius: 16,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: "transparent",
                color: tab === key ? "#3B4FC2" : "#FFFFFF",
                opacity: tab === key ? 1 : 0.78,
                transition: "color 0.2s ease, opacity 0.2s ease"
              },
              children: TAB_LABELS[key]
            },
            key
          ))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { ref: containerRef, style: { position: "relative", minHeight: baselineHeight ? `${baselineHeight}px` : void 0 }, children: [
        /* @__PURE__ */ jsx("div", { ref: guidedPanelRef, style: { display: tab === "guided" ? "block" : "none" }, children: /* @__PURE__ */ jsx(GuidedTab, {}) }),
        /* @__PURE__ */ jsx("div", { ref: freeplayPanelRef, style: { display: tab === "freeplay" ? "block" : "none" }, children: /* @__PURE__ */ jsx(FreePlayTab, { funcText, setFuncText, fromQuiz: cameFromQuiz, onReturnToQuiz: handleReturnToQuiz, matchHeight: baselineHeight }) }),
        /* @__PURE__ */ jsx("div", { ref: quizPanelRef, style: { display: tab === "quiz" ? "block" : "none" }, children: /* @__PURE__ */ jsx(QuizTab, { onExplore: handleExplore }) })
      ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { marginTop: "auto", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 11, padding: "18px 20px 26px", fontSize: 13.5, color: C.muted }, children: [
        /* @__PURE__ */ jsx("span", { style: { width: 40, height: 40, borderRadius: "50%", background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx("img", { src: "../../../assets/favicon.svg", alt: "", width: "28", height: "28" }) }),
        "Professor Kyle Knee \xB7 Harper College Mathematics"
      ] })
    ] });
  }
  var root = createRoot(document.getElementById("root"));
  root.render(/* @__PURE__ */ jsx(App, {}));
