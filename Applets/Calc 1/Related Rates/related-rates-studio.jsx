import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ---------- Style tokens (Cloud Pastel, saturation 5) ----------
const COLORS = {
  bg: "#F5F5FA",
  card: "#FFFFFF",
  border: "#DCDCF0",
  tabInactive: "#E4E4F1",
  accent: "#3B4FC2",
  accent2: "#6478D6",
  text: "#3A3A3C",
  muted: "#6E6E86",
  eyebrow: "#8A8AA3",
  sectionTitle: "#3A3A3C",
  warn: "#C77B94",
  waterFill: "#8FA3E8",
  waterSurface: "#5C74D6",
  guide: "#54546E",
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif";

const TABS = [
  "Filling/Draining Tank",
  "Sliding Ladder",
  "Shadow & Streetlamp",
  "Two Ships Departing",
];

const UNITS = ["m", "cm", "ft", "in"];

// Which rendering "family" a shape belongs to — shapes in the same family
// share continuous SVG elements (so their dimensions can ease smoothly);
// shapes in different families are structurally different drawings, so a
// switch between families cross-fades instead.
function familyOf(shapeType) {
  if (shapeType === "prism") return "box";
  if (shapeType === "hourglass") return "hourglass";
  return "circular"; // cone, cylinder
}

// Numbers are NOT converted when the unit label changes — H = 12 "m" simply
// becomes H = 12 "cm" (or "ft", "in") if you switch units.
const DEFAULTS = { H: 12, R: 4, L: 5, W: 3, Rn: 1.5, dVdt: 2, dhdt: 0.15, drdt: 0.1, dLdt: 0.1, dWdt: 0.1 };
const CLAMP = { H: [1, 100], R: [0.5, 50], L: [0.5, 50], W: [0.5, 50], Rn: [0.1, 50] };

const RATE_LABELS = {
  dVdt: { sym: "dV/dt" },
  dhdt: { sym: "dh/dt" },
  drdt: { sym: "dr/dt" },
  dLdt: { sym: "dL/dt" },
  dWdt: { sym: "dW/dt" },
};

// nearest whole number, but never let a taper collapse to exactly 0
function halfRounded(x) {
  let v = Math.round(x);
  if (v === 0) v = 0.5;
  return v;
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const SPEED_OPTIONS = [0.5, 1, 2, 4];

// ---- exact-fraction helpers for the derivation panel ----
function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}
function decimalPlaces(n) {
  const s = String(n);
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
}
function toFraction(a, b) {
  const d = Math.max(decimalPlaces(a), decimalPlaces(b));
  const scale = Math.pow(10, d);
  const num = Math.round(a * scale);
  const den = Math.round(b * scale);
  const g = gcd(num, den);
  return { num: num / g, den: den / g, reducible: g > 1 };
}
function fmtNum(n) {
  if (Number.isInteger(n)) return String(n);
  return String(n).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}
function clampToRange(v, rng) {
  return Math.min(Math.max(v, rng.min), rng.max);
}

// ---- shared "solid of revolution" physics engine ----
// Works for any radius-at-top/radius-at-bottom taper (cone = bottom radius 0,
// cylinder = equal radii, and future frustum/cone-up are just other Rtop/Rbottom pairs).
function volumeAtHeight(h, H, Rtop, Rbottom) {
  const a = Rbottom;
  const b = (Rtop - Rbottom) / H;
  if (Math.abs(b) < 1e-9) return Math.PI * a * a * h;
  return (Math.PI / (3 * b)) * (Math.pow(a + b * h, 3) - Math.pow(a, 3));
}
function heightFromVolumeFraction(p, H, Rtop, Rbottom, Vmax) {
  const a = Rbottom;
  const b = (Rtop - Rbottom) / H;
  const targetV = p * Vmax;
  if (Math.abs(b) < 1e-9) return targetV / (Math.PI * a * a);
  const inner = Math.pow(a, 3) + (3 * b * targetV) / Math.PI;
  return (Math.cbrt(inner) - a) / b;
}

// ---- rectangular "frustum of a pyramid" physics engine ----
// L and W each taper linearly and independently between a top and bottom
// value. Cross-sectional area A(h) = L(h)*W(h) is a quadratic in h, so
// V(h) = integral of A is a cubic — no clean closed-form inverse like the
// circular case, so heightFromVolume uses bisection instead (robust, since
// V(h) is monotonic increasing for h in [0, H]).
function rectVolumeAtHeight(h, H, Ltop, Lbottom, Wtop, Wbottom) {
  const bL = (Ltop - Lbottom) / H;
  const bW = (Wtop - Wbottom) / H;
  const A = Lbottom * Wbottom;
  const B = (Lbottom * bW + Wbottom * bL) / 2;
  const C = (bL * bW) / 3;
  return A * h + B * h * h + C * h * h * h;
}
function rectHeightFromVolumeFraction(p, H, Ltop, Lbottom, Wtop, Wbottom, Vmax) {
  const targetV = p * Vmax;
  if (targetV <= 0) return 0;
  if (targetV >= Vmax) return H;
  let lo = 0,
    hi = H;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const v = rectVolumeAtHeight(mid, H, Ltop, Lbottom, Wtop, Wbottom);
    if (v < targetV) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---- hourglass physics engine ----
// Modeled as two symmetric cones (frustums) joined apex-to-apex at the
// midpoint height H/2: a bottom bulb tapering from R (at h=0) down to the
// neck radius Rn (at h=H/2), and a top bulb widening back from Rn to R (at
// h=H). Each half is an ordinary frustum, so this reuses the exact
// closed-form volumeAtHeight/heightFromVolumeFraction — no bisection needed.
function hourglassVolumeAtHeight(h, H, R, Rn) {
  const halfH = H / 2;
  const Vbulb = volumeAtHeight(halfH, halfH, Rn, R);
  if (h <= halfH) return volumeAtHeight(h, halfH, Rn, R);
  return Vbulb + volumeAtHeight(h - halfH, halfH, R, Rn);
}
function hourglassHeightFromVolumeFraction(p, H, R, Rn, Vmax) {
  const halfH = H / 2;
  const Vbulb = Vmax / 2;
  const targetV = p * Vmax;
  if (targetV <= Vbulb) {
    const p1 = Vbulb > 0 ? targetV / Vbulb : 0;
    return heightFromVolumeFraction(p1, halfH, Rn, R, Vbulb);
  }
  const p2 = Vbulb > 0 ? (targetV - Vbulb) / Vbulb : 0;
  return halfH + heightFromVolumeFraction(p2, halfH, R, Rn, Vbulb);
}
// Local radius and taper slope at a given height (needed since the slope
// flips sign at the neck — narrowing below it, widening above it).
function hourglassRadiusAndSlope(h, H, R, Rn) {
  const halfH = H / 2;
  if (h <= halfH) {
    const b = (Rn - R) / halfH;
    return { r: R + b * h, b };
  }
  const b = (R - Rn) / halfH;
  return { r: Rn + b * (h - halfH), b };
}

// Fit the tank drawing into a fixed box, preserving true H:R proportions,
// except extreme ratios get a 12% floor so nothing shrinks to an invisible sliver.
function computeFit(H, R, boxHalfW = 130, boxH = 250) {
  let H_px = boxH;
  let R_px = H_px * (R / H);
  if (R_px > boxHalfW) {
    R_px = boxHalfW;
    H_px = R_px * (H / R);
  }
  const floorW = boxHalfW * 0.12;
  const floorH = boxH * 0.12;
  if (R_px < floorW) R_px = floorW;
  if (H_px < floorH) H_px = floorH;
  return { H_px, R_px };
}

// ---- shape icon glyphs for the selector rail ----
function ShapeIcon({ shape, active }) {
  const stroke = active ? "#FFFFFF" : COLORS.muted;
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke, strokeWidth: 1.6 };
  if (shape === "cone") return <svg {...common}><path d="M2 2 L14 2 L8 14 Z" /></svg>;
  if (shape === "prism") return <svg {...common}><rect x="2.5" y="2" width="11" height="12" /></svg>; // plain rectangle
  if (shape === "hourglass") return <svg {...common}><path d="M2.5 2 L13.5 2 L8 8 L13.5 14 L2.5 14 L8 8 Z" /></svg>;
  if (shape === "sphere") return <svg {...common}><path d="M2 5 A6 6 0 0 0 14 5" /><line x1="2" y1="5" x2="14" y2="5" /></svg>; // open bowl
  if (shape === "trough") return <svg {...common}><path d="M2 3 L4 3 L8 12 L12 3 L14 3" /></svg>; // open V with flat rim ticks
  return <svg {...common}><rect x="3" y="2" width="10" height="12" rx="5" /></svg>; // cylinder
}

// Generic hook: eases an array of numbers toward new targets over 1s
// (ease-out-cubic), auto-pausing playback during the transition. Used for
// the rectangular tank's independent Ltop/Lbottom/Wtop/Wbottom values, the
// hourglass bulb/neck radii, and the sphere's sampled radius profile — the
// same way RtopRender/RbottomRender ease the circular shapes. Works for any
// array length, not just 4.
function useMorph4(targets, isPlaying, setIsPlaying) {
  const [rendered, setRendered] = useState(targets);
  const ref = useRef({ from: targets, to: targets, start: null, raf: null });
  const renderedRef = useRef(rendered);
  renderedRef.current = rendered;
  useEffect(() => {
    if (ref.current.to.length === targets.length && ref.current.to.every((v, i) => v === targets[i])) return;
    ref.current.from = renderedRef.current.length === targets.length ? renderedRef.current : targets;
    ref.current.to = targets;
    ref.current.start = null;
    const wasPlaying = isPlaying;
    if (wasPlaying) setIsPlaying(false);
    const duration = 1000;
    const step = (ts) => {
      if (ref.current.start == null) ref.current.start = ts;
      const t = Math.min(1, (ts - ref.current.start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setRendered(ref.current.from.map((f, i) => f + (ref.current.to[i] - f) * eased));
      if (t < 1) ref.current.raf = requestAnimationFrame(step);
      else if (wasPlaying) setIsPlaying(true);
    };
    ref.current.raf = requestAnimationFrame(step);
    return () => ref.current.raf && cancelAnimationFrame(ref.current.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, targets);
  return rendered;
}

// ---- sphere / hemisphere physics engine ----
// Bowl = bottom hemisphere (point at bottom h=0, flat open rim at top h=R).
// Dome = top hemisphere (flat base at bottom h=0, point at top h=R).
// Full Sphere = both stacked, joined at the equator h=R (total height 2R).
// All three share one identity: they're cross-sections of a sphere of
// radius R, just centered at a different height. Bowl's r(h)^2 = 2Rh - h^2
// and Dome's r(h)^2 = R^2 - h^2 both reduce to the same circle equation
// R^2 - (h-R)^2, which is exactly the Full Sphere profile (see validation
// notes) — confirmed numerically before writing any UI for this shape.
function bowlVolumeAtHeight(h, R) {
  return Math.PI * (R * h * h - (h * h * h) / 3);
}
function domeVolumeAtHeight(h, R) {
  return Math.PI * (R * R * h - (h * h * h) / 3);
}
function fullSphereVolumeAtHeight(h, R) {
  const bulbV = (2 * Math.PI * R * R * R) / 3;
  if (h <= R) return bowlVolumeAtHeight(h, R);
  return bulbV + domeVolumeAtHeight(h - R, R);
}
function sphereVolumeAtHeight(h, R, variant) {
  if (variant === "dome") return domeVolumeAtHeight(h, R);
  if (variant === "fullSphere") return fullSphereVolumeAtHeight(h, R);
  return bowlVolumeAtHeight(h, R);
}
// No clean closed-form inverse (cubic in h, same situation as the
// rectangular frustum) — bisection is robust since volume is monotonic
// increasing in h, verified in the standalone validation pass.
function sphereHeightFromVolumeFraction(p, Htotal, R, variant, Vmax) {
  const targetV = p * Vmax;
  if (targetV <= 0) return 0;
  if (targetV >= Vmax) return Htotal;
  let lo = 0,
    hi = Htotal;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const v = sphereVolumeAtHeight(mid, R, variant);
    if (v < targetV) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
// Local radius and dr/dh slope at a given height. Guarded against division
// by zero at the poles (r=0, matching the cone-apex treatment) and, for
// Full Sphere, at the equator where dr/dh is exactly 0 — a fixed nonzero
// dr/dt there would require infinite dh/dt, so "hold dr/dt constant" treats
// that instant the same way the hourglass neck treats its singularity.
function sphereRadiusAndSlope(h, R, variant) {
  if (variant === "dome") {
    const r = Math.sqrt(Math.max(0, R * R - h * h));
    const b = r > 1e-9 ? -h / r : 0;
    return { r, b };
  }
  if (variant === "fullSphere") {
    const u = h - R;
    const r = Math.sqrt(Math.max(0, R * R - u * u));
    const b = r > 1e-9 ? -u / r : 0;
    return { r, b };
  }
  const r = Math.sqrt(Math.max(0, 2 * R * h - h * h));
  const b = r > 1e-9 ? (R - h) / r : 0;
  return { r, b };
}
// Render-only profile, sampled EVENLY BY ANGLE (not by height) so the
// outline reads as a true circle instead of faceting near the poles —
// a circle's slope is steepest near the poles, so equal-height steps bunch
// points up around the equator and leave big gaps at the ends. Equal-angle
// steps give uniform arc-length spacing all the way around (verified
// numerically: a step-length ratio of exactly 1.000 across all segments,
// vs. a very uneven ratio for equal-height steps) — the standard way to
// draw a smooth circular arc as a polygon. This is a pure rendering fix:
// the (t, rNorm) pairs it produces satisfy the exact same r(h) formulas
// used by the physics engine above (confirmed in a standalone validation
// pass before touching this code), just sampled at different points along
// the curve. t is height as a fraction of that variant's own total height
// (R for Bowl/Dome, 2R for Full Sphere); rNorm is radius as a fraction of R.
function spherePointAt(phi, variant) {
  if (variant === "dome") return { t: Math.sin(phi), rNorm: Math.cos(phi) };
  if (variant === "fullSphere") return { t: (1 - Math.cos(phi)) / 2, rNorm: Math.sin(phi) };
  return { t: 1 - Math.cos(phi), rNorm: Math.sin(phi) }; // bowl
}
const SPHERE_N = 40;
// Flattened as [t0, r0, t1, r1, ...] so the whole profile can ease through
// the existing generic array-morph hook (useMorph4) with no changes to it.
function sphereProfilePoints(variant) {
  const angleRange = variant === "fullSphere" ? Math.PI : Math.PI / 2;
  const arr = [];
  for (let i = 0; i <= SPHERE_N; i++) {
    const phi = (i / SPHERE_N) * angleRange;
    const pt = spherePointAt(phi, variant);
    arr.push(pt.t, pt.rNorm);
  }
  return arr;
}

// ---- trough physics engine ----
// A trough is a constant cross-section extruded along a horizontal Length —
// filling it is a 2D cross-section problem multiplied by Length, not a
// solid-of-revolution problem like every shape above. dV/dh = width(h) *
// Length (a "width method" cross-section analog of the disk method), rather
// than dV/dh = pi r(h)^2.
//
// V-Shape and Trapezoidal share one linear-taper formula — V-Shape is just
// the Wbottom=0 special case, the same relationship Cone has to the
// circular Frustum. Because this is an AREA integral (2D) rather than a
// VOLUME integral (solid of revolution), it comes out linear/quadratic in
// h, not cubic — so unlike the rectangular tank, this DOES have a clean
// closed-form inverse (quadratic formula).
function troughLinearAreaAtHeight(h, D, Wtop, Wbottom) {
  const a = Wbottom;
  const b = (Wtop - Wbottom) / D;
  return a * h + (b * h * h) / 2;
}
function troughLinearHeightFromAreaFraction(p, D, Wtop, Wbottom, Amax) {
  const targetA = p * Amax;
  const a = Wbottom;
  const b = (Wtop - Wbottom) / D;
  if (Math.abs(b) < 1e-9) return a > 1e-9 ? targetA / a : 0;
  const A_ = b / 2, B_ = a, C_ = -targetA;
  const disc = B_ * B_ - 4 * A_ * C_;
  return (-B_ + Math.sqrt(Math.max(0, disc))) / (2 * A_);
}
function troughLinearWidthAtHeight(h, D, Wtop, Wbottom) {
  return Wbottom + ((Wtop - Wbottom) / D) * h;
}

// Semicircular: the water's chord width at height h satisfies the exact
// same circle equation as the Sphere's Bowl (same shape, just interpreted
// as a 2D cross-section instead of a 3D solid of revolution): width(h) =
// 2*sqrt(2Rh - h^2). Its AREA is a genuine circular-SEGMENT area — a
// transcendental function (arcsin), unlike every polynomial volume formula
// elsewhere in this app. No closed-form inverse; bisection is used, same
// as the rectangular tank and the sphere. Validated against an independent
// numeric integration of the width function (not just internal
// consistency) before writing any UI.
function troughSemicircleWidthAtHeight(h, R) {
  return 2 * Math.sqrt(Math.max(0, 2 * R * h - h * h));
}
function troughSemicircleAreaAtHeight(h, R) {
  const u = h - R;
  const clamped = Math.max(-1, Math.min(1, u / R));
  return u * Math.sqrt(Math.max(0, R * R - u * u)) + R * R * Math.asin(clamped) + (Math.PI * R * R) / 2;
}
function troughSemicircleHeightFromAreaFraction(p, R, Amax) {
  const targetA = p * Amax;
  if (targetA <= 0) return 0;
  if (targetA >= Amax) return R;
  let lo = 0, hi = R;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (troughSemicircleAreaAtHeight(mid, R) < targetA) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Trough cross-section profile, unified across all three variants as one
// N+1-point sampled array — same architecture as Sphere's Bowl/Dome/
// FullSphere, so switching V-Shaped <-> Semicircular <-> Trapezoidal can
// morph point-by-point through useMorph4 instead of cutting instantly.
// Points store ABSOLUTE half-width values (real units, not normalized),
// since V-Shape/Trapezoidal's top/bottom widths and Semicircular's R are
// independent physical quantities with no natural shared normalization —
// morphing the raw values directly is well-defined and simple. Semicircular
// samples evenly BY ANGLE (reusing the exact same circle equation as
// Sphere's Bowl, since a semicircular trough's chord half-width is provably
// identical to the Bowl's r(h)); V-Shape/Trapezoidal are a plain linear
// taper, sampled at the same point count purely so the array shapes match
// for morphing — a straight line through N+1 evenly-spaced points is still
// exactly a straight line.
function troughProfilePoints(variant, topHalf, bottomHalf, R) {
  const arr = [];
  if (variant === "semicircular") {
    for (let i = 0; i <= SPHERE_N; i++) {
      const phi = (i / SPHERE_N) * (Math.PI / 2);
      arr.push(1 - Math.cos(phi), R * Math.sin(phi));
    }
  } else {
    for (let i = 0; i <= SPHERE_N; i++) {
      const t = i / SPHERE_N;
      arr.push(t, bottomHalf + (topHalf - bottomHalf) * t);
    }
  }
  return arr;
}

// ---------- Reusable pieces ----------

function Readout({ label, value, unit, color, footnote, highlight }) {
  return (
    <div
      style={{
        background: COLORS.card,
        borderRadius: 18,
        boxShadow: highlight
          ? `0 0 0 2px ${COLORS.accent}, 0 1px 3px rgba(60,60,90,0.07)`
          : "0 1px 3px rgba(60,60,90,0.07)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: COLORS.eyebrow,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 21,
          fontWeight: 700,
          color: color || COLORS.accent,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
        {unit ? (
          <span style={{ fontSize: 12.5, fontWeight: 500, color: COLORS.muted, marginLeft: 4 }}>{unit}</span>
        ) : null}
      </span>
      {footnote ? <span style={{ fontSize: 10.5, color: COLORS.warn, lineHeight: 1.3 }}>{footnote}</span> : null}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: COLORS.sectionTitle,
      }}
    >
      {children}
    </span>
  );
}

function PillButton({ children, onClick, primary, active, small, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: primary || active ? "none" : `1px solid ${COLORS.border}`,
        background: primary || active ? COLORS.accent : COLORS.card,
        color: primary || active ? "#FFFFFF" : COLORS.text,
        borderRadius: 20,
        padding: small ? "6px 13px" : "10px 22px",
        fontSize: small ? 12 : 14,
        fontWeight: 600,
        fontFamily: FONT,
        cursor: "pointer",
        boxShadow: primary ? "0 2px 6px rgba(59,79,194,0.28)" : "none",
        transition: "transform 0.08s ease",
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

// Number field with fused prefix, text-buffer pattern, and soft clamp warning
function NumberField({ prefix, value, onChange, min, max, suffix, width, disabled, disabledNote }) {
  const [text, setText] = useState(String(value));
  const [warn, setWarn] = useState("");

  useEffect(() => {
    setText(String(Number.isFinite(value) ? +value.toFixed(3) : value));
  }, [value]);

  const commit = (raw) => {
    const n = parseFloat(raw);
    if (Number.isNaN(n)) {
      setText(String(value));
      setWarn("");
      return;
    }
    if (n < min || n > max) {
      const clamped = Math.min(Math.max(n, min), max);
      setWarn(`Clamped to the allowed range (${min}\u2013${max}${suffix ? " " + suffix : ""}).`);
      onChange(clamped);
      setText(String(clamped));
    } else {
      setWarn("");
      onChange(n);
      setText(raw);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: width || "auto" }}>
      <div style={{ display: "flex" }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.muted,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRight: "none",
            borderRadius: "20px 0 0 20px",
            padding: "7px 10px",
            whiteSpace: "nowrap",
          }}
        >
          {prefix}
        </span>
        <input
          value={text}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value;
            if (/^-?\d*\.?\d*$/.test(v)) setText(v);
          }}
          onBlur={() => commit(text)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(text);
          }}
          style={{
            width: "100%",
            minWidth: 0,
            border: `1px solid ${COLORS.border}`,
            borderLeft: "none",
            borderRight: suffix ? "none" : `1px solid ${COLORS.border}`,
            padding: "7px 8px",
            fontSize: 13,
            fontFamily: FONT,
            fontWeight: 700,
            color: disabled ? COLORS.muted : COLORS.text,
            background: disabled ? COLORS.bg : "#fff",
            outline: "none",
          }}
        />
        {suffix ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.muted,
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderLeft: "none",
              borderRadius: "0 20px 20px 0",
              padding: "7px 10px",
            }}
          >
            {suffix}
          </span>
        ) : null}
      </div>
      {warn ? <span style={{ fontSize: 10.5, color: COLORS.warn }}>{warn}</span> : null}
      {disabled && disabledNote ? <span style={{ fontSize: 10.5, color: COLORS.eyebrow, fontStyle: "italic" }}>{disabledNote}</span> : null}
    </div>
  );
}

function Slider({ value, min, max, step, onChange, onPointerDown }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      onPointerDown={onPointerDown}
      className="cr-slider"
      style={{ "--fill": `${pct}%` }}
    />
  );
}

// ---------- Tank scenario ----------

function TankScenario({ unit }) {
  const [H, setH] = useState(DEFAULTS.H);
  const [R, setR] = useState(DEFAULTS.R);
  const [R2, setR2] = useState(0); // second radius, used only by the frustum cone-variant
  const [shapeType, setShapeType] = useState("cone"); // 'cone' | 'cylinder' | 'prism' | 'hourglass' | 'sphere'
  const [coneVariant, setConeVariant] = useState("down"); // 'down' | 'frustum' | 'up' (cone family only)

  // Rectangular prism family: L/W are the "top" (or full, for Box) values;
  // L2/W2 are the "bottom" values, used only by the Frustum sub-variant.
  const [L, setL] = useState(DEFAULTS.L);
  const [L2, setL2] = useState(0);
  const [W, setW] = useState(DEFAULTS.W);
  const [W2, setW2] = useState(0);
  const [prismVariant, setPrismVariant] = useState("box"); // 'box' | 'frustum'

  // Hourglass: symmetric bulb radius R (reuses the same R field as the cone
  // for consistency) and a separate neck radius.
  const [Rn, setRn] = useState(DEFAULTS.Rn);

  // Sphere/Hemisphere: Bowl (bottom hemisphere) / Dome (top hemisphere) /
  // Full Sphere. H is auto-locked to R (or 2R for Full Sphere) — see the
  // sync effect below — so there's no independent H field for this shape.
  const [sphereVariant, setSphereVariant] = useState("bowl"); // 'bowl' | 'dome' | 'fullSphere'

  // Trough: V-Shaped / Semicircular / Trapezoidal. Reuses the same shared
  // dimension fields as everything else, per the established convention
  // (R is already shared across Cone/Cylinder/Hourglass/Sphere): H plays
  // the role of cross-section Depth D (auto-locked to R for Semicircular,
  // same pattern as Sphere locking H to R), L is the top width, L2 is the
  // bottom width (Trapezoidal only, same role as Box's L2), and W is the
  // extruded Length (same axis Box's W already recedes into the page
  // along, reusing that isometric depth-offset code directly).
  const [troughVariant, setTroughVariant] = useState("vshape"); // 'vshape' | 'semicircular' | 'trapezoidal'

  const [flowMode, setFlowMode] = useState("filling"); // 'filling' | 'draining' | 'both'
  const [singleMode, setSingleMode] = useState("dVdt"); // dropdown driver for filling/draining
  const [rates, setRates] = useState({
    dVdt: DEFAULTS.dVdt,
    dhdt: DEFAULTS.dhdt,
    drdt: DEFAULTS.drdt,
    dLdt: DEFAULTS.dLdt,
    dWdt: DEFAULTS.dWdt,
  });
  const [inflowRate, setInflowRate] = useState(DEFAULTS.dVdt);
  const [outflowRate, setOutflowRate] = useState(DEFAULTS.dVdt * 0.4);

  const [p, setP] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [heightJump, setHeightJump] = useState("");
  const [derivShown, setDerivShown] = useState(false);

  const isSphere = shapeType === "sphere";
  const isTrough = shapeType === "trough";
  const effectiveMode = flowMode === "both" ? "dVdt" : singleMode;

  // Remembers the last real Rtop/Rbottom while actually on Cone/Cylinder, so
  // those values can be frozen (not recomputed) while on other shapes. See
  // the shape-geometry block below for why this matters.
  const lastCircularRef = useRef({ Rtop: R, Rbottom: 0 });

  // Cone/Cylinder share one continuous SVG structure, so switching between
  // them can ease smoothly. Box, Hourglass, and Sphere are structurally
  // different drawings, so there's nothing to smoothly interpolate when
  // switching between families — instead, cross-fade: briefly render both
  // the old and new family's drawing, opacity easing from one to the other.
  // (Switching BETWEEN sphere variants, e.g. Bowl <-> Dome, stays within the
  // "sphere" family and morphs continuously instead — see profileRender.)
  const currentFamily = isSphere ? "sphere" : isTrough ? "trough" : familyOf(shapeType);
  const prevFamilyRef = useRef(currentFamily);
  const [fadeFrom, setFadeFrom] = useState(null);
  const [fadeT, setFadeT] = useState(1);
  const fadeRafRef = useRef(null);
  // Snapshot of the previous render's target fit, captured SYNCHRONOUSLY
  // during render (not inside an effect) the instant currentFamily
  // changes — BEFORE the shape-switch reset/lock effects (which run AFTER
  // this render commits) get a chance to overwrite the shared dimension
  // state (H, R, etc.) that fitOf() reads. Without this, recomputing
  // fitOf(fadeFrom) fresh partway through the fade would use the NEW
  // shape's already-updated H/R, making the "from" size accidentally equal
  // the "to" size — exactly what caused the reported bug where the shape
  // snapped to its final size immediately and only opacity animated
  // afterward, instead of the two blending together the way Box/Cone do.
  const lastTargetFitRef = useRef(null);
  const frozenFromFitRef = useRef(null);
  const prevFamilyForSnapshotRef = useRef(currentFamily);
  if (prevFamilyForSnapshotRef.current !== currentFamily) {
    frozenFromFitRef.current = lastTargetFitRef.current;
    prevFamilyForSnapshotRef.current = currentFamily;
  }
  useEffect(() => {
    if (prevFamilyRef.current === currentFamily) return;
    const from = prevFamilyRef.current;
    prevFamilyRef.current = currentFamily;
    setFadeFrom(from);
    setFadeT(0);
    let start = null;
    const duration = 2000;
    const step = (ts) => {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      setFadeT(t);
      if (t < 1) {
        fadeRafRef.current = requestAnimationFrame(step);
      } else {
        setFadeFrom(null);
      }
    };
    fadeRafRef.current = requestAnimationFrame(step);
    return () => fadeRafRef.current && cancelAnimationFrame(fadeRafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFamily]);
  // Eased progress (ease-in-out-cubic) — used for opacity AND for blending
  // the two families' size envelopes together, so the drawing's overall
  // footprint eases smoothly too instead of snapping to the new family's
  // independently-computed fit partway through the fade.
  const easedFadeT = easeInOutCubic(fadeT);


  // ---- Auto-initialize frustum radii whenever the user switches INTO the
  // frustum cone-variant from point-down or point-up. This always resets
  // (even if the user had manually tweaked R2 before), per user preference.
  // Rounding: nearest whole number, but if that would round to 0 (collapsing
  // the taper into a cylinder by accident), fall back to the nearest half-step.
  //
  // Leaving frustum always inherits the LARGER of the two radii (not
  // whichever one happens to live in the shared R field). Point-up reuses R
  // as its base radius, so without this, repeated Frustum <-> Point-up
  // switches would each halve R again — a compounding shrink.
  const prevVariantRef = useRef(coneVariant);
  useEffect(() => {
    const prevVariant = prevVariantRef.current;
    if (shapeType === "cone" && coneVariant === "frustum" && prevVariant !== "frustum") {
      if (prevVariant === "down") {
        // R (top) stays as-is; new bottom radius is half of it.
        setR2(halfRounded(R / 2));
      } else if (prevVariant === "up") {
        // The old R was the base (bottom) radius; it becomes R2, and the
        // new top radius is half of that old value.
        const oldR = R;
        setR2(oldR);
        setR(halfRounded(oldR / 2));
      }
    } else if (shapeType === "cone" && prevVariant === "frustum" && coneVariant !== "frustum") {
      setR(Math.max(R, R2));
    }
    prevVariantRef.current = coneVariant;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coneVariant, shapeType]);

  // Same idea for the prism's L and W, now that it's just Box <-> Frustum.
  const prevPrismVariantRef = useRef(prismVariant);
  useEffect(() => {
    const prevVariant = prevPrismVariantRef.current;
    if (shapeType === "prism" && prismVariant === "frustum" && prevVariant !== "frustum") {
      setL2(halfRounded(L / 2));
      setW2(halfRounded(W / 2));
    } else if (shapeType === "prism" && prevVariant === "frustum" && prismVariant !== "frustum") {
      setL(Math.max(L, L2));
      setW(Math.max(W, W2));
    }
    prevPrismVariantRef.current = prismVariant;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prismVariant, shapeType]);

  // ---- Reset every shape's dimensions to the same fixed defaults whenever
  // the user switches to a DIFFERENT top-level shape (clicking a rail icon),
  // so leftover values from whatever shape you were just on never carry
  // over — e.g. Sphere auto-locks H to R, and without this reset that H
  // value would otherwise still be sitting there if you then switched to
  // Cylinder. This only fires on an actual shapeType change: re-clicking
  // the shape you're already on is a no-op (React won't re-run an effect
  // whose dependency didn't change), and clicking a sub-variant button
  // (Frustum, Point up, Bowl/Dome/etc.) doesn't touch shapeType at all, so
  // those keep using whatever values you've typed in, as before.
  const prevShapeTypeRef = useRef(shapeType);
  useEffect(() => {
    if (prevShapeTypeRef.current === shapeType) return;
    prevShapeTypeRef.current = shapeType;
    if (shapeType === "trough") {
      // Trough gets its own fixed starting dimensions rather than the
      // shared DEFAULTS — a trough that's 12 deep and only 3 long (the
      // shared H/W defaults) would look absurd, since a trough is supposed
      // to be long and shallow. Still fixed/deterministic every time you
      // click the icon, same as every other shape — just tuned for this
      // shape's proportions instead of reusing numbers tuned for tanks.
      setH(3); // Depth D
      setR(2.5); // Semicircular radius
      setR2(0);
      setL(6); // top width
      setL2(2); // bottom width (Trapezoidal only)
      setW(10); // extruded Length
    } else {
      setH(DEFAULTS.H);
      setR(DEFAULTS.R);
      setR2(0);
      setL(DEFAULTS.L);
      setL2(0);
      setW(DEFAULTS.W);
    }
    setW2(0);
    setRn(DEFAULTS.Rn);
    setConeVariant("down");
    setPrismVariant("box");
    setSphereVariant("bowl");
    setTroughVariant("vshape");
    setP(0);
    setHeightJump("");
  }, [shapeType]);

  // ---- Sphere: H is auto-locked to R (Bowl/Dome) or 2R (Full Sphere) —
  // there's no independent H input for this shape, since a sphere's height
  // is fully determined by its radius. Keep the shared H state in sync
  // whenever R or the variant changes, so the rest of the app (timing,
  // rate ranges, etc., all of which read the shared H) stays correct
  // without needing sphere-specific branches everywhere.
  useEffect(() => {
    if (shapeType !== "sphere") return;
    const target = sphereVariant === "fullSphere" ? 2 * R : R;
    if (Math.abs(H - target) > 1e-9) setH(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeType, sphereVariant, R]);

  // ---- Trough: H (playing the role of cross-section Depth D here) is
  // auto-locked to R for the Semicircular variant, same pattern as Sphere
  // locking H to R — a semicircle's depth is always its radius, so there's
  // no independent Depth field for that variant.
  useEffect(() => {
    if (shapeType !== "trough") return;
    if (troughVariant !== "semicircular") return;
    if (Math.abs(H - R) > 1e-9) setH(R);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeType, troughVariant, R]);

  // ---- shape geometry: cone-down = bottom radius 0, cylinder = equal radii,
  // frustum = two independent radii, cone-up = top radius 0 ----
  // Only recompute these while actually on Cone/Cylinder. Otherwise, freeze
  // them at their last real value — without this guard, they'd keep
  // recalculating off-screen from leftover coneVariant state while on Box
  // or Hourglass (since R is shared across shapes), causing a spurious
  // "regrow" animation when switching back to Cone/Cylinder.
  let Rtop, Rbottom;
  if (shapeType === "cylinder") {
    Rtop = R;
    Rbottom = R;
  } else if (shapeType === "cone") {
    if (coneVariant === "up") {
      Rtop = 0;
      Rbottom = R;
    } else if (coneVariant === "frustum") {
      Rtop = R;
      Rbottom = R2;
    } else {
      Rtop = R;
      Rbottom = 0;
    }
  } else {
    Rtop = lastCircularRef.current.Rtop;
    Rbottom = lastCircularRef.current.Rbottom;
  }
  if (shapeType === "cylinder" || shapeType === "cone") {
    lastCircularRef.current = { Rtop, Rbottom };
  }
  const bSlope = (Rtop - Rbottom) / H;
  const noTaper = Math.abs(bSlope) < 1e-9;

  // ---- rectangular prism geometry: Box = both constant, Pyramid-down =
  // both taper to a point at the bottom, Pyramid-up = both taper to a point
  // at the top, Frustum = four independent values ----
  let Ltop, Lbottom, Wtop, Wbottom;
  if (prismVariant === "frustum") {
    Ltop = L;
    Lbottom = L2;
    Wtop = W;
    Wbottom = W2;
  } else {
    Ltop = L;
    Lbottom = L;
    Wtop = W;
    Wbottom = W;
  }
  const bL = (Ltop - Lbottom) / H;
  const bW = (Wtop - Wbottom) / H;
  const noTaperL = Math.abs(bL) < 1e-9;
  const noTaperW = Math.abs(bW) < 1e-9;

  const isPrism = shapeType === "prism";
  const isHourglass = shapeType === "hourglass";
  const noTaperHourglass = Math.abs(R - Rn) < 1e-9;
  const sphereHtotal = sphereVariant === "fullSphere" ? 2 * R : R;
  // Trough: D is the shared H field (locked to R for Semicircular), top
  // width is the shared L field, bottom width is the shared L2 field (used
  // only by Trapezoidal — V-Shape is just the Wbottom=0 special case, same
  // relationship Cone has to the circular Frustum), and Length is the
  // shared W field (the same axis Box's isometric depth offset already
  // recedes along).
  const troughD = troughVariant === "semicircular" ? R : H;
  const troughTopWidth = L;
  const troughBottomWidth = troughVariant === "trapezoidal" ? L2 : 0;
  const troughAmax = isTrough
    ? troughVariant === "semicircular"
      ? troughSemicircleAreaAtHeight(R, R)
      : troughLinearAreaAtHeight(troughD, troughD, troughTopWidth, troughBottomWidth)
    : 0;
  const Vmax = isPrism
    ? rectVolumeAtHeight(H, H, Ltop, Lbottom, Wtop, Wbottom)
    : isHourglass
    ? hourglassVolumeAtHeight(H, H, R, Rn)
    : isSphere
    ? sphereVolumeAtHeight(sphereHtotal, R, sphereVariant)
    : isTrough
    ? troughAmax * W
    : volumeAtHeight(H, H, Rtop, Rbottom);

  // Keep the "hold constant" dropdown pointed at a mode that's actually
  // valid for the current shape (no dr/dt without a radius, no dL/dt or
  // dW/dt when that dimension doesn't taper, etc). Sphere always allows
  // dr/dt (Bowl and Dome are monotonic; Full Sphere has a momentary
  // singularity at the equator, handled in the physics block below, the
  // same way the hourglass neck is handled). Trough only offers dV/dt and
  // dh/dt — there's no dedicated "hold constant" mode for the changing
  // surface width, kept simple by design.
  useEffect(() => {
    const validModes = isPrism
      ? ["dVdt", "dhdt", ...(noTaperL ? [] : ["dLdt"]), ...(noTaperW ? [] : ["dWdt"])]
      : isHourglass
      ? ["dVdt", "dhdt", ...(noTaperHourglass ? [] : ["drdt"])]
      : isSphere
      ? ["dVdt", "dhdt", "drdt"]
      : isTrough
      ? ["dVdt", "dhdt"]
      : ["dVdt", "dhdt", ...(noTaper ? [] : ["drdt"])];
    if (!validModes.includes(singleMode)) setSingleMode("dVdt");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrism, isHourglass, isSphere, isTrough, noTaper, noTaperL, noTaperW, noTaperHourglass, singleMode]);

  // Visual-only eased radii, so switching shapes/variants warps the outline
  // smoothly instead of snapping. Physics below uses the real Rtop/Rbottom
  // immediately; only the drawing eases toward the new target.
  const [RtopRender, setRtopRender] = useState(Rtop);
  const [RbottomRender, setRbottomRender] = useState(Rbottom);
  const morphRef = useRef({ fromTop: Rtop, toTop: Rtop, fromBottom: Rbottom, toBottom: Rbottom, start: null, raf: null });
  useEffect(() => {
    if (morphRef.current.toTop === Rtop && morphRef.current.toBottom === Rbottom) return;
    morphRef.current.fromTop = RtopRender;
    morphRef.current.toTop = Rtop;
    morphRef.current.fromBottom = RbottomRender;
    morphRef.current.toBottom = Rbottom;
    morphRef.current.start = null;
    const wasPlaying = isPlaying;
    if (wasPlaying) setIsPlaying(false);
    const duration = 1000;
    const step = (ts) => {
      if (morphRef.current.start == null) morphRef.current.start = ts;
      const t = Math.min(1, (ts - morphRef.current.start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setRtopRender(morphRef.current.fromTop + (morphRef.current.toTop - morphRef.current.fromTop) * eased);
      setRbottomRender(morphRef.current.fromBottom + (morphRef.current.toBottom - morphRef.current.fromBottom) * eased);
      if (t < 1) {
        morphRef.current.raf = requestAnimationFrame(step);
      } else if (wasPlaying) {
        setIsPlaying(true);
      }
    };
    morphRef.current.raf = requestAnimationFrame(step);
    return () => morphRef.current.raf && cancelAnimationFrame(morphRef.current.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Rtop, Rbottom]);

  // Box's four independent dimensions ease the same way, via the generic hook.
  const [LtopRender, LbottomRender, WtopRender, WbottomRender] = useMorph4(
    [Ltop, Lbottom, Wtop, Wbottom],
    isPlaying,
    setIsPlaying
  );

  // Hourglass bulb/neck radii, same easing treatment (only the first two
  // values are meaningful; the hook just needs a fixed-length array).
  const [RbulbRender, RneckRender] = useMorph4([R, Rn, 0, 0], isPlaying, setIsPlaying);

  // Sphere: the sampled radius profile eases point-by-point whenever the
  // variant changes (Bowl <-> Dome <-> Full Sphere), so the silhouette
  // morphs continuously instead of cross-fading — Bowl and Dome are the
  // same curve read in opposite directions, so this always looks like a
  // smooth "roll over" rather than a dissolve. The total height (R vs 2R
  // for Full Sphere) eases the same way, via a second small morph, so the
  // vertical extent grows/shrinks in step with the profile.
  //
  // Memoized on sphereVariant alone: without this, sphereProfilePoints()
  // would allocate a fresh 82-element array (and recompute 41 sin/cos
  // pairs) on EVERY render, not just when the variant actually changes —
  // wasted work that's cheap in isolation but adds up during rapid
  // interaction (e.g. dragging the inflow/outflow sliders in "Both" mode
  // fires many renders per second), a likely contributor to reported
  // sluggishness. useMorph4's internal effect also runs on every render
  // whenever it's handed a freshly-allocated array (since a new array
  // reference always looks "changed" to React's dependency check, even
  // when the values are identical) — memoizing gives it a stable
  // reference so that effect can skip entirely when nothing changed.
  const sphereProfileTarget = useMemo(() => sphereProfilePoints(sphereVariant), [sphereVariant]);
  const profileRender = useMorph4(sphereProfileTarget, isPlaying, setIsPlaying);
  const [sphereHRender] = useMorph4([sphereHtotal, 0, 0, 0], isPlaying, setIsPlaying);

  // Trough: ALL THREE variants (V-Shape/Semicircular/Trapezoidal) ease
  // through one unified point-sampled array, exactly mirroring Sphere's
  // Bowl/Dome/FullSphere architecture — switching between any of them
  // morphs point-by-point instead of cutting instantly, including between
  // the straight-line taper and the curved arc. The overall Depth extent
  // (troughD, which changes abruptly when locking to R for Semicircular)
  // eases the same way sphereHtotal does via its own small morph.
  // Memoized for the same reason as the sphere profile above.
  const troughProfileTarget = useMemo(
    () => troughProfilePoints(troughVariant, troughTopWidth / 2, troughBottomWidth / 2, R),
    [troughVariant, troughTopWidth, troughBottomWidth, R]
  );
  const troughProfileRender = useMorph4(troughProfileTarget, isPlaying, setIsPlaying);
  const [troughDRender] = useMorph4([troughD, 0, 0, 0], isPlaying, setIsPlaying);

  const rangeFor = useCallback(
    (rmode) => {
      let base;
      if (rmode === "dVdt") base = Vmax;
      else if (rmode === "dhdt") base = isSphere ? sphereHtotal : isTrough ? troughD : H;
      else if (rmode === "drdt") base = R;
      else if (rmode === "dLdt") base = Math.max(Ltop, Lbottom, 0.001);
      else base = Math.max(Wtop, Wbottom, 0.001); // dWdt
      const min = base / 200;
      const max = base / 4;
      const step = (max - min) / 100;
      return { min, max, step };
    },
    [H, R, Vmax, Ltop, Lbottom, Wtop, Wbottom, isSphere, sphereHtotal, isTrough, troughD]
  );

  // keep all rate values inside their valid range whenever any dimension changes
  useEffect(() => {
    setRates((prev) => {
      const next = { ...prev };
      ["dVdt", "dhdt", "drdt", "dLdt", "dWdt"].forEach((md) => {
        next[md] = clampToRange(prev[md], rangeFor(md));
      });
      return next;
    });
    setInflowRate((prev) => clampToRange(prev, rangeFor("dVdt")));
    setOutflowRate((prev) => clampToRange(prev, rangeFor("dVdt")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [H, R, L, L2, W, W2, Rn, sphereVariant, troughVariant]);

  // signed net rate actually driving the animation
  let signedK;
  if (flowMode === "filling") signedK = rates[singleMode];
  else if (flowMode === "draining") signedK = -rates[singleMode];
  else signedK = inflowRate - outflowRate;

  const stateRef = useRef({});
  useEffect(() => {
    stateRef.current = {
      H,
      Rtop,
      Rbottom,
      Ltop,
      Lbottom,
      Wtop,
      Wbottom,
      isPrism,
      isHourglass,
      isSphere,
      isTrough,
      R,
      Rn,
      sphereVariant,
      sphereHtotal,
      troughVariant,
      troughD,
      troughTopWidth,
      troughBottomWidth,
      W,
      Vmax,
      mode: effectiveMode,
      k: signedK,
      speed,
    };
  });

  const rafRef = useRef(null);
  const lastTsRef = useRef(null);

  const tFillFor = (
    H_,
    Rtop_,
    Rbottom_,
    Ltop_,
    Lbottom_,
    Wtop_,
    Wbottom_,
    isPrism_,
    isHourglass_,
    isSphere_,
    R_,
    Rn_,
    sphereVariant_,
    sphereHtotal_,
    Vmax_,
    mode_,
    kMag
  ) => {
    if (mode_ === "dVdt") return Vmax_ / kMag;
    if (mode_ === "dhdt") return (isSphere_ ? sphereHtotal_ : H_) / kMag;
    if (isPrism_) {
      if (mode_ === "dLdt") return Math.abs(Ltop_ - Lbottom_) / kMag;
      if (mode_ === "dWdt") return Math.abs(Wtop_ - Wbottom_) / kMag;
      return Infinity;
    }
    if (isHourglass_) {
      // drdt (n/a for a symmetric hourglass with no taper): the radius
      // traverses |R - Rn| twice — once narrowing, once widening.
      return Math.abs(R_ - Rn_) > 1e-9 ? (2 * Math.abs(R_ - Rn_)) / kMag : Infinity;
    }
    if (isSphere_) {
      // drdt: the radius traverses 0 -> R once (Bowl/Dome) or 0 -> R -> 0
      // (Full Sphere, twice the distance).
      const span = sphereVariant_ === "fullSphere" ? 2 * R_ : R_;
      return span > 1e-9 ? span / kMag : Infinity;
    }
    const b = (Rtop_ - Rbottom_) / H_;
    return b !== 0 ? Math.abs(Rtop_ - Rbottom_) / kMag : Infinity; // drdt (n/a for no-taper shapes)
  };

  const tick = useCallback((ts) => {
    if (lastTsRef.current == null) lastTsRef.current = ts;
    const dtMs = ts - lastTsRef.current;
    lastTsRef.current = ts;

    setP((prevP) => {
      const {
        H: H_,
        Rtop: Rtop_,
        Rbottom: Rbottom_,
        Ltop: Ltop_,
        Lbottom: Lbottom_,
        Wtop: Wtop_,
        Wbottom: Wbottom_,
        isPrism: isPrism_,
        isHourglass: isHourglass_,
        isSphere: isSphere_,
        R: R_,
        Rn: Rn_,
        sphereVariant: sphereVariant_,
        sphereHtotal: sphereHtotal_,
        Vmax: Vmax_,
        mode: mode_,
        k: k_,
        speed: speed_,
      } = stateRef.current;
      if (!k_) {
        rafRef.current = requestAnimationFrame(tick);
        return prevP; // net-zero: steady state, no level change
      }
      const dir = k_ > 0 ? 1 : -1;
      const tFill = tFillFor(
        H_,
        Rtop_,
        Rbottom_,
        Ltop_,
        Lbottom_,
        Wtop_,
        Wbottom_,
        isPrism_,
        isHourglass_,
        isSphere_,
        R_,
        Rn_,
        sphereVariant_,
        sphereHtotal_,
        Vmax_,
        mode_,
        Math.abs(k_)
      );
      const durationSec = Math.min(15, Math.max(4, tFill)) / speed_;
      let next = prevP + (dir * dtMs) / (durationSec * 1000);
      if (next >= 1) next = 0;
      else if (next <= 0) next = 1;
      return next;
    });

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [isPlaying, tick]);

  const [dropPhase, setDropPhase] = useState(0);
  useEffect(() => {
    if (!isPlaying) return;
    let raf;
    const loop = (ts) => {
      setDropPhase((ts % 900) / 900);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // ---- physics ----
  const k = signedK;
  let h, V, dhdt, dVdt, nearSingularity;
  let r = null,
    drdt = null;
  let Lh = null,
    Wh = null,
    dLdt = null,
    dWdt = null;

  if (isPrism) {
    h = effectiveMode === "dVdt" ? rectHeightFromVolumeFraction(p, H, Ltop, Lbottom, Wtop, Wbottom, Vmax) : H * p;
    Lh = Lbottom + bL * h;
    Wh = Wbottom + bW * h;
    V = rectVolumeAtHeight(h, H, Ltop, Lbottom, Wtop, Wbottom);
    const hSafe = Math.max(h, H * 0.0035);
    const LhSafe = Lbottom + bL * hSafe;
    const WhSafe = Wbottom + bW * hSafe;
    const areaSafe = Math.max(LhSafe * WhSafe, 1e-6);
    if (effectiveMode === "dVdt") dhdt = k / areaSafe;
    else if (effectiveMode === "dhdt") dhdt = k;
    else if (effectiveMode === "dLdt") dhdt = bL !== 0 ? k / bL : 0;
    else dhdt = bW !== 0 ? k / bW : 0; // dWdt
    dLdt = bL * dhdt;
    dWdt = bW * dhdt;
    dVdt = LhSafe * WhSafe * dhdt;
    const maxArea = Math.max(Ltop * Wtop, Lbottom * Wbottom, 0.0001);
    nearSingularity = effectiveMode === "dVdt" && k !== 0 && Lh * Wh < maxArea * 0.02;
  } else if (isHourglass) {
    h = effectiveMode === "dVdt" ? hourglassHeightFromVolumeFraction(p, H, R, Rn, Vmax) : H * p;
    const local = hourglassRadiusAndSlope(h, H, R, Rn);
    r = local.r;
    V = hourglassVolumeAtHeight(h, H, R, Rn);
    const hSafe = Math.max(h, H * 0.0035);
    const localSafe = hourglassRadiusAndSlope(hSafe, H, R, Rn);
    const rSafe = localSafe.r;
    const bLocal = localSafe.b;
    if (effectiveMode === "dVdt") dhdt = k / (Math.PI * rSafe * rSafe);
    else if (effectiveMode === "dhdt") dhdt = k;
    else dhdt = bLocal !== 0 ? k / bLocal : 0; // drdt
    drdt = bLocal * dhdt;
    dVdt = Math.PI * rSafe * rSafe * dhdt;
    nearSingularity = effectiveMode === "dVdt" && k !== 0 && Math.abs(r) < Math.max(R, Rn) * 0.02;
  } else if (isSphere) {
    h = effectiveMode === "dVdt" ? sphereHeightFromVolumeFraction(p, sphereHtotal, R, sphereVariant, Vmax) : sphereHtotal * p;
    const local = sphereRadiusAndSlope(h, R, sphereVariant);
    r = local.r;
    V = sphereVolumeAtHeight(h, R, sphereVariant);
    // Guard both poles (radius -> 0) away from the exact ends, same
    // epsilon-based approach used by the other shapes' apex/pinch points.
    const hSafe = Math.min(Math.max(h, sphereHtotal * 0.0035), sphereHtotal * (1 - 0.0035));
    const localSafe = sphereRadiusAndSlope(hSafe, R, sphereVariant);
    const rSafe = localSafe.r;
    const bLocal = localSafe.b;
    if (effectiveMode === "dVdt") dhdt = k / (Math.PI * rSafe * rSafe);
    else if (effectiveMode === "dhdt") dhdt = k;
    else dhdt = Math.abs(bLocal) > 1e-6 ? k / bLocal : 0; // drdt — 0 at the Full Sphere equator, see comment above
    drdt = bLocal * dhdt;
    dVdt = Math.PI * rSafe * rSafe * dhdt;
    nearSingularity = effectiveMode === "dVdt" && k !== 0 && Math.abs(r) < R * 0.02;
  } else if (isTrough) {
    const areaAtH = (hh) =>
      troughVariant === "semicircular"
        ? troughSemicircleAreaAtHeight(hh, R)
        : troughLinearAreaAtHeight(hh, troughD, troughTopWidth, troughBottomWidth);
    const widthAtH = (hh) =>
      troughVariant === "semicircular"
        ? troughSemicircleWidthAtHeight(hh, R)
        : troughLinearWidthAtHeight(hh, troughD, troughTopWidth, troughBottomWidth);
    h =
      effectiveMode === "dVdt"
        ? troughVariant === "semicircular"
          ? troughSemicircleHeightFromAreaFraction(p, R, troughAmax)
          : troughLinearHeightFromAreaFraction(p, troughD, troughTopWidth, troughBottomWidth, troughAmax)
        : troughD * p;
    r = widthAtH(h); // reusing "r" to carry "surface width" for the shared readout row
    V = areaAtH(h) * W;
    // Guard the pinch point (width -> 0 at the bottom point for V-Shape and
    // Semicircular, or at the narrow bottom edge for Trapezoidal), same
    // epsilon-clamp pattern used by every other shape's apex/pole.
    const hSafe = Math.max(h, troughD * 0.0035);
    const wSafe = Math.max(widthAtH(hSafe), 1e-6);
    if (effectiveMode === "dVdt") dhdt = k / (wSafe * W);
    else dhdt = k; // dhdt mode
    dVdt = wSafe * W * dhdt;
    const maxWidth = Math.max(troughTopWidth, troughBottomWidth, 2 * R, 0.0001);
    nearSingularity = effectiveMode === "dVdt" && k !== 0 && r < maxWidth * 0.02;
  } else {
    h = effectiveMode === "dVdt" ? heightFromVolumeFraction(p, H, Rtop, Rbottom, Vmax) : H * p;
    r = Rbottom + bSlope * h;
    V = volumeAtHeight(h, H, Rtop, Rbottom);
    const hSafe = Math.max(h, H * 0.0035);
    const rSafe = Rbottom + bSlope * hSafe;
    if (effectiveMode === "dVdt") dhdt = k / (Math.PI * rSafe * rSafe);
    else if (effectiveMode === "dhdt") dhdt = k;
    else dhdt = bSlope !== 0 ? k / bSlope : 0;
    drdt = bSlope * dhdt;
    dVdt = Math.PI * rSafe * rSafe * dhdt;
    nearSingularity = effectiveMode === "dVdt" && k !== 0 && Math.abs(r) < Math.max(Rtop, Rbottom) * 0.02;
  }

  const dhdtFootnote = nearSingularity
    ? isPrism || isTrough
      ? "Near the pinch point (cross-section \u2192 0), dh/dt formally \u2192 \u00b1\u221e in magnitude."
      : "Near the pinch point (radius \u2192 0), dh/dt formally \u2192 \u00b1\u221e in magnitude."
    : "";

  const volUnit = `${unit}\u00b3`;
  const lenUnit = unit;
  const volRateUnit = `${volUnit}/s`;
  const lenRateUnit = `${unit}/s`;

  const resetDefaults = () => {
    setH(DEFAULTS.H);
    setR(DEFAULTS.R);
    setR2(0);
    setL(DEFAULTS.L);
    setL2(0);
    setW(DEFAULTS.W);
    setW2(0);
    setRn(DEFAULTS.Rn);
    setShapeType("cone");
    setConeVariant("down");
    setPrismVariant("box");
    setSphereVariant("bowl");
    setTroughVariant("vshape");
    setFlowMode("filling");
    setSingleMode("dVdt");
    setRates({ dVdt: DEFAULTS.dVdt, dhdt: DEFAULTS.dhdt, drdt: DEFAULTS.drdt, dLdt: DEFAULTS.dLdt, dWdt: DEFAULTS.dWdt });
    setInflowRate(DEFAULTS.dVdt);
    setOutflowRate(DEFAULTS.dVdt * 0.4);
    setP(0);
    setIsPlaying(false);
    setSpeed(1);
    setHeightJump("");
  };

  const activeRange = rangeFor(singleMode);
  const bothRange = rangeFor("dVdt");

  // The slider's visual position always increases while playing, representing
  // elapsed time in the loop rather than "how full" the tank is. When net flow
  // is filling, that lines up with p directly; when net flow is draining, the
  // slider is the mirror of p so it still moves left-to-right as time passes.
  const direction = k >= 0 ? 1 : -1;
  const progressDisplay = direction === 1 ? p : 1 - p;

  const handleProgressChange = (e) => {
    setIsPlaying(false);
    const val = Number(e.target.value) / 1000;
    setP(direction === 1 ? val : 1 - val);
  };
  const handleProgressPointerDown = () => setIsPlaying(false);

  const commitHeightJump = () => {
    const val = parseFloat(heightJump);
    if (Number.isNaN(val)) return;
    const HmaxForJump = isSphere ? sphereHtotal : H;
    const clamped = Math.min(Math.max(val, 0), HmaxForJump);
    const newP =
      effectiveMode === "dVdt"
        ? isPrism
          ? rectVolumeAtHeight(clamped, H, Ltop, Lbottom, Wtop, Wbottom) / Vmax
          : isHourglass
          ? hourglassVolumeAtHeight(clamped, H, R, Rn) / Vmax
          : isSphere
          ? sphereVolumeAtHeight(clamped, R, sphereVariant) / Vmax
          : isTrough
          ? (troughVariant === "semicircular"
              ? troughSemicircleAreaAtHeight(clamped, R)
              : troughLinearAreaAtHeight(clamped, troughD, troughTopWidth, troughBottomWidth)) *
            W /
            Vmax
          : volumeAtHeight(clamped, H, Rtop, Rbottom) / Vmax
        : clamped / HmaxForJump;
    setP(newP);
    setIsPlaying(false);
  };

  const clampH = CLAMP.H;
  const clampR = CLAMP.R;
  const clampL = CLAMP.L;
  const clampW = CLAMP.W;
  const clampRn = CLAMP.Rn;

  // ---- SVG geometry: autofit-to-box with a 12% readability floor. Both the
  // top and bottom radii are eased independently so any shape/variant switch
  // (including cone point-up, where the TOP shrinks instead of the bottom)
  // morphs smoothly. ----
  const viewW = 300, viewH = 400, topY = 40, cx = 150;
  const maxR = Math.max(Rtop, Rbottom, 0.001);
  const maxHalfL = Math.max(Ltop, Lbottom, 0.001) / 2;
  const maxHourglassR = Math.max(R, Rn, 0.001);
  // Guard against stale L/R values from whichever trough variant ISN'T
  // currently active (e.g. R left over from a prior visit to Semicircular
  // while now on V-Shaped) — only read the dimension that's actually
  // driving the current variant's width, same discipline as
  // lastCircularRef guards elsewhere in this file.
  const maxTroughHalfWidth = isTrough
    ? troughVariant === "semicircular"
      ? Math.max(R, 0.001)
      : Math.max(troughTopWidth, troughBottomWidth, 0.001) / 2
    : 0.001;
  // Derived from the ALREADY-EASED troughProfileRender array, so the width
  // envelope transitions smoothly during a sub-variant switch (V-Shape <->
  // Semicircular <-> Trapezoidal) without needing a second, separately-timed
  // easing pass on top of it.
  const troughMaxHalfWidthRender = isTrough
    ? Math.max(...Array.from({ length: SPHERE_N + 1 }, (_, i) => troughProfileRender[2 * i + 1]), 0.001)
    : 0.001;

  // Only use the WITHIN-family eased envelope values (sphereHRender,
  // troughDRender, troughMaxHalfWidthRender) when NOT in the middle of a
  // cross-family fade. During an active fade, the outer 2000ms opacity+size
  // blend already governs the whole transition — layering a SECOND,
  // differently-timed easing on top of it (e.g. sphereHRender's own 1000ms
  // ease-out) was exactly what caused the reported bug where the shape
  // snapped to its final size almost immediately while the opacity was
  // still only partway faded in. Sub-variant switches (which don't trigger
  // fadeFrom at all) still get the smooth inner easing as before.
  const useEasedEnvelope = !fadeFrom;

  // Shared size envelope: each family has its own natural autofit (based on
  // its own widest dimension), but during a cross-family fade we blend the
  // FROM family's envelope into the TO family's envelope using the same
  // eased progress as the opacity fade — so the whole drawing's footprint
  // grows/shrinks smoothly instead of each family snapping to its own fit.
  const DEPTH_SCALE = 0.5, DEPTH_DIR_X = 0.62, DEPTH_DIR_Y = -0.36;
  const MAX_DEPTH_PX = 70;
  // Trough's isometric depth offset pushes its widest point further right
  // than its own half-width alone accounts for — without reserving room for
  // it here, the depth-shifted corner (and its dashed back edges) could
  // extend past the viewBox edge and get clipped. Reserve the maximum
  // possible horizontal push (MAX_DEPTH_PX * DEPTH_DIR_X) plus a small
  // safety margin, same box height budget otherwise.
  const TROUGH_BOX_HALF_W = 130 - MAX_DEPTH_PX * DEPTH_DIR_X - 8;
  const fitOf = (fam) =>
    fam === "circular"
      ? computeFit(H, maxR)
      : fam === "box"
      ? computeFit(H, maxHalfL)
      : fam === "hourglass"
      ? computeFit(H, maxHourglassR)
      : fam === "trough"
      ? computeFit(
          useEasedEnvelope ? troughDRender : troughD,
          useEasedEnvelope ? troughMaxHalfWidthRender : maxTroughHalfWidth,
          TROUGH_BOX_HALF_W
        )
      : computeFit(useEasedEnvelope ? sphereHRender : sphereHtotal, Math.max(R, 0.001)); // sphere — normalized profile maxes out at 1, so its "R" is just R
  const targetFit = fitOf(currentFamily);
  lastTargetFitRef.current = targetFit;
  const envelope = fadeFrom
    ? (() => {
        // Use the FROZEN snapshot (captured before this shape's own
        // dimension-reset effects ran), not a fresh fitOf(fadeFrom) call —
        // see the comment by frozenFromFitRef above for why. Falls back to
        // a live fitOf(fadeFrom) call only if the snapshot is somehow
        // unavailable (e.g. a hot-reload edge case), which reproduces the
        // old (buggy) behavior rather than crashing.
        const fromFit = frozenFromFitRef.current || fitOf(fadeFrom);
        return {
          H_px: fromFit.H_px + (targetFit.H_px - fromFit.H_px) * easedFadeT,
          R_px: fromFit.R_px + (targetFit.R_px - fromFit.R_px) * easedFadeT,
        };
      })()
    : targetFit;

  const { H_px, R_px: scalePx } = envelope;
  const apexY = topY + H_px;
  const pxPerUnit = scalePx / maxR;
  const RtopPx = RtopRender * pxPerUnit;
  const RbottomPx = RbottomRender * pxPerUnit;
  const rimRy = 14;
  const topRimRy = rimRy * (RtopPx / scalePx);
  const bottomRimRy = rimRy * (RbottomPx / scalePx);
  const hFrac = h / H;
  const waterY = apexY - hFrac * H_px;
  const rCurrentPx = RbottomPx + (RtopPx - RbottomPx) * hFrac;
  const waterRimRy = rimRy * (rCurrentPx / scalePx);
  const dripEndY = apexY + 45;

  // ---- Box geometry: front face shows L (drawn exactly like the circular
  // radius profile above), depth cue shows W via a foreshortened diagonal
  // offset (classic "isometric box" textbook technique). Shares the same
  // size envelope as the other families (see above). ----
  const boxH_px = H_px, boxScalePx = scalePx;
  const boxApexY = topY + boxH_px;
  const boxPxPerUnit = boxScalePx / maxHalfL;
  const LtopPx = (LtopRender / 2) * boxPxPerUnit;
  const LbottomPx = (LbottomRender / 2) * boxPxPerUnit;
  const depthTopPx = Math.min(WtopRender * boxPxPerUnit * DEPTH_SCALE, MAX_DEPTH_PX);
  const depthBottomPx = Math.min(WbottomRender * boxPxPerUnit * DEPTH_SCALE, MAX_DEPTH_PX);
  const dxTop = depthTopPx * DEPTH_DIR_X, dyTop = depthTopPx * DEPTH_DIR_Y;
  const dxBot = depthBottomPx * DEPTH_DIR_X, dyBot = depthBottomPx * DEPTH_DIR_Y;
  const boxHFrac = h / H;
  const boxWaterY = boxApexY - boxHFrac * boxH_px;
  const LCurrentPx = LbottomPx + (LtopPx - LbottomPx) * boxHFrac;
  const dxCurrent = dxBot + (dxTop - dxBot) * boxHFrac;
  const dyCurrent = dyBot + (dyTop - dyBot) * boxHFrac;
  const boxDripEndY = boxApexY + 45;

  // ---- Hourglass geometry: two cones joined at a neck at H/2. Shares the
  // same size envelope as the other families (see above). ----
  const hgH_px = H_px, hgScalePx = scalePx;
  const hgApexY = topY + hgH_px;
  const hgMidY = topY + hgH_px / 2;
  const hgPxPerUnit = hgScalePx / maxHourglassR;
  const RbulbPx = RbulbRender * hgPxPerUnit;
  const RneckPx = RneckRender * hgPxPerUnit;
  const hgRimRy = 14;
  const bulbRimRy = hgRimRy * (RbulbPx / hgScalePx);
  const neckRimRy = hgRimRy * (RneckPx / hgScalePx);
  const hgHFrac = h / H;
  const hgWaterY = hgApexY - hgHFrac * hgH_px;
  const hgLowerHalf = hgHFrac <= 0.5;
  const hgCurrentPx = hgLowerHalf
    ? RbulbPx + (RneckPx - RbulbPx) * (hgHFrac / 0.5)
    : RneckPx + (RbulbPx - RneckPx) * ((hgHFrac - 0.5) / 0.5);
  const hgWaterRimRy = hgRimRy * (hgCurrentPx / hgScalePx);
  const hgDripEndY = hgApexY + 45;

  // ---- Sphere geometry: outline is a polyline through SPHERE_N+1 sampled
  // points (see profileRender), so Bowl/Dome/Full Sphere are all drawn by
  // the same generic code — a point's radius naturally goes to 0 wherever
  // the shape comes to a point (Bowl's rounded bottom, Dome's peaked top,
  // both poles of Full Sphere) and naturally reaches the full envelope
  // width wherever the shape is at its widest (Bowl's open rim, Dome's
  // flat base, Full Sphere's equator) — no per-variant special-casing
  // needed for rim vs. point endpoints. ----
  const sphH_px = H_px, sphScalePx = scalePx;
  // Bowl/Dome only occupy Htotal=R of vertical space (vs. up to ~250px for
  // taller shapes or Full Sphere's 2R), so anchoring at the same fixed
  // topY=40 every other shape uses left a large empty gap below them,
  // making the drawing look pushed toward the top of the panel instead of
  // centered. Center every sphere variant's own bounding box around the
  // same vertical midline a "full height" shape would naturally occupy
  // (topY + half of the max box height), so Bowl/Dome/Full Sphere all sit
  // visually centered regardless of how much of the height budget they use.
  const SPHERE_VERTICAL_CENTER = topY + 125;
  const sphApexY = SPHERE_VERTICAL_CENTER + sphH_px / 2; // h = 0 (bottom)
  const sphTopY = SPHERE_VERTICAL_CENTER - sphH_px / 2; // h = sphereHtotal (top)
  const sphPxPerUnit = sphScalePx; // profile values are already normalized 0..1
  // profileRender is flattened [t0, r0, t1, r1, ...] pairs (see
  // sphereProfilePoints) — points are sampled evenly BY ANGLE, not by
  // height, so t is NOT evenly spaced across the array. Every lookup below
  // has to search/interpolate by t value rather than assume a fixed index
  // step, unlike the old height-based sampling.
  const sphPoints = [];
  for (let i = 0; i <= SPHERE_N; i++) {
    const t = profileRender[2 * i];
    const rNorm = profileRender[2 * i + 1];
    sphPoints.push({ t, y: sphApexY - t * sphH_px, xOff: rNorm * sphPxPerUnit });
  }
  const sphHFrac = sphereHtotal > 0 ? h / sphereHtotal : 0;
  const sphWaterY = sphApexY - sphHFrac * sphH_px;
  // Current water-surface radius via linear interpolation between the two
  // bracketing sampled points, found by t value since spacing is uneven
  // (visual only — physics uses the exact r computed above from h).
  const sphTExact = Math.min(1, Math.max(0, sphHFrac));
  let sphIdxLo = 0;
  for (let i = 0; i < SPHERE_N; i++) {
    if (sphPoints[i].t <= sphTExact) sphIdxLo = i;
    else break;
  }
  const sphPtLo = sphPoints[sphIdxLo];
  const sphPtHi = sphPoints[Math.min(sphIdxLo + 1, SPHERE_N)];
  const sphLocalSpan = sphPtHi.t - sphPtLo.t;
  const sphFrac = sphLocalSpan > 1e-9 ? (sphTExact - sphPtLo.t) / sphLocalSpan : 0;
  const sphCurrentXOff = sphPtLo.xOff + (sphPtHi.xOff - sphPtLo.xOff) * sphFrac;
  const sphWaterRimRy = rimRy * (sphCurrentXOff / sphScalePx || 0);
  const sphDripEndY = sphApexY + 45;
  const sphLeftPath = sphPoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${cx - pt.xOff} ${pt.y}`).join(" ");
  const sphRightPath = sphPoints
    .slice()
    .reverse()
    .map((pt) => `L ${cx + pt.xOff} ${pt.y}`)
    .join(" ");
  const sphOutlinePath = `${sphLeftPath} ${sphRightPath}`;
  // Water fill: only the sampled points below the current level, plus the
  // exact interpolated point right at the water surface.
  const sphWaterPointsBelow = sphPoints.filter((pt) => pt.y >= sphWaterY - 0.001);
  const sphWaterLeftPath = sphWaterPointsBelow.map((pt, i) => `${i === 0 ? "M" : "L"} ${cx - pt.xOff} ${pt.y}`).join(" ");
  const sphWaterRightPath = sphWaterPointsBelow
    .slice()
    .reverse()
    .map((pt) => `L ${cx + pt.xOff} ${pt.y}`)
    .join(" ");
  const sphWaterFillPath = `${sphWaterLeftPath} L ${cx + sphCurrentXOff} ${sphWaterY} ${sphWaterRightPath.replace(/^L /, "L ")} Z`;

  // ---- Trough geometry: cross-section (V-Shape/Trapezoidal linear taper,
  // or Semicircular arc) as the "front face," with Length receding into
  // the page via the same isometric depth-offset technique Box uses for
  // its W dimension (same direction/scale, confirmed) — except the offset
  // here is CONSTANT along the whole height, since Length doesn't taper
  // the way Box's W can for its Frustum variant; a trough is a uniform
  // extrusion, not a pyramid. ----
  const trH_px = H_px, trScalePx = scalePx;
  // Same centering treatment as Sphere: Trough's Depth D is often much
  // smaller than the ~250px height budget other shapes fill (a shallow,
  // long trough is the whole point of the shape), so anchoring at the
  // fixed topY=40 left it sitting high with empty space below. Center on
  // the same shared vertical midline Sphere uses.
  const TROUGH_VERTICAL_CENTER = topY + 125;
  const trApexY = TROUGH_VERTICAL_CENTER + trH_px / 2; // h = 0 (bottom)
  const trTopY = TROUGH_VERTICAL_CENTER - trH_px / 2; // h = troughD (top rim)
  const trPxPerUnit = trScalePx / (useEasedEnvelope ? troughMaxHalfWidthRender : maxTroughHalfWidth);
  // All three variants now come from one unified, already-eased point array
  // (troughProfileRender — see the morph hook above), so no per-variant
  // branching is needed here at all; switching variants morphs this array
  // point-by-point instead of cutting instantly.
  const trRawPoints = Array.from({ length: SPHERE_N + 1 }, (_, i) => ({
    t: troughProfileRender[2 * i],
    halfWidth: troughProfileRender[2 * i + 1],
  }));
  const trPoints = trRawPoints.map((pt) => ({ t: pt.t, y: trApexY - pt.t * trH_px, xOff: pt.halfWidth * trPxPerUnit }));
  const trTopPt = trPoints[trPoints.length - 1];
  const trBottomPt = trPoints[0];
  const troughHFracForRender = troughD > 0 ? h / troughD : 0;
  const trWaterY = trApexY - troughHFracForRender * trH_px;
  const trTExact = Math.min(1, Math.max(0, troughHFracForRender));
  let trIdxLo = 0;
  for (let i = 0; i < trPoints.length - 1; i++) {
    if (trPoints[i].t <= trTExact) trIdxLo = i;
    else break;
  }
  const trIdxHi = Math.min(trIdxLo + 1, trPoints.length - 1);
  const trLocalSpan = trPoints[trIdxHi].t - trPoints[trIdxLo].t;
  const trLocalFrac = trLocalSpan > 1e-9 ? (trTExact - trPoints[trIdxLo].t) / trLocalSpan : 0;
  const trCurrentXOff = trPoints[trIdxLo].xOff + (trPoints[trIdxHi].xOff - trPoints[trIdxLo].xOff) * trLocalFrac;
  const trDripEndY = trApexY + 45;

  const trLeftPath = trPoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${cx - pt.xOff} ${pt.y}`).join(" ");
  const trRightPath = trPoints
    .slice()
    .reverse()
    .map((pt) => `L ${cx + pt.xOff} ${pt.y}`)
    .join(" ");
  const trOutlinePath = `${trLeftPath} ${trRightPath}`;

  // Isometric depth offset for Length — CONSTANT along the whole height
  // (unlike Box's W, Length never tapers), same DEPTH_SCALE/DEPTH_DIR as Box.
  const trDepthPx = Math.min(W * trPxPerUnit * DEPTH_SCALE, MAX_DEPTH_PX);
  const trDx = trDepthPx * DEPTH_DIR_X;
  const trDy = trDepthPx * DEPTH_DIR_Y;
  const trBackLeftPath = trPoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${cx - pt.xOff + trDx} ${pt.y + trDy}`).join(" ");
  const trBackRightPath = trPoints
    .slice()
    .reverse()
    .map((pt) => `L ${cx + pt.xOff + trDx} ${pt.y + trDy}`)
    .join(" ");
  const trBackOutlinePath = `${trBackLeftPath} ${trBackRightPath}`;

  // Water: front-face fill (flat 2D silhouette up to the current level), a
  // right-wall ribbon (front water-line points + their depth-shifted
  // counterparts, curve-aware via the same sampled points as the outline),
  // and a top-surface parallelogram — so the water reads as filling a 3D
  // trough rather than a flat 2D tank, the same visual language as Box's
  // water depth-face trick.
  //
  // IMPORTANT: the two exact water-surface corner points (at height
  // trWaterY) are added EXPLICITLY here, rather than relying on there being
  // enough sample points near the water line to approximate them. That
  // worked fine for Semicircular (41 sampled points give a dense
  // approximation) but was flat-out wrong for V-Shape/Trapezoidal, which
  // only have 2 raw points total — filtering "points at/below the water"
  // there could produce just a single point (the bottom), silently
  // dropping one whole side of the fill polygon and drawing a degenerate
  // sliver instead of the correct triangle.
  const trWaterPointsStrictlyBelow = trPoints.filter((pt) => pt.y > trWaterY + 0.001);
  // Ordered near-water -> ... -> bottom (i.e. reversed from how the filter
  // naturally returns them, which is bottom-first). Needed so the path
  // below traces a continuous, non-self-intersecting outline: start at one
  // water corner, walk DOWN to the bottom, then back UP the other side to
  // the other water corner. The previous version walked down then back up
  // through the SAME ordering on both sides, tracing a zigzag that only
  // rendered visibly for the old 2-point taper (where direction didn't
  // matter with just one point) and broke once there were many sample
  // points to get the order wrong on.
  const trWaterPointsNearWaterFirst = trWaterPointsStrictlyBelow.slice().reverse();
  const trWaterLeftPath = [
    `M ${cx - trCurrentXOff} ${trWaterY}`,
    ...trWaterPointsNearWaterFirst.map((pt) => `L ${cx - pt.xOff} ${pt.y}`),
  ].join(" ");
  const trWaterRightPath = [
    ...trWaterPointsStrictlyBelow.map((pt) => `L ${cx + pt.xOff} ${pt.y}`),
    `L ${cx + trCurrentXOff} ${trWaterY}`,
  ].join(" ");
  const trWaterFillPath = `${trWaterLeftPath} ${trWaterRightPath} Z`;
  const trWaterRightWallFrontPoints = [
    { x: cx + trCurrentXOff, y: trWaterY },
    ...trWaterPointsNearWaterFirst.map((pt) => ({ x: cx + pt.xOff, y: pt.y })),
  ];
  const trWaterRightWallPath =
    trWaterRightWallFrontPoints.length > 1
      ? `M ${trWaterRightWallFrontPoints.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${trWaterRightWallFrontPoints
          .slice()
          .reverse()
          .map((p) => `${p.x + trDx} ${p.y + trDy}`)
          .join(" L ")} Z`
      : "";

  const showInflow = isPlaying && (flowMode === "filling" || flowMode === "both");
  const showOutflow = isPlaying && (flowMode === "draining" || flowMode === "both");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,400px) 1fr", gap: 24 }}>
        {/* Tank visual + dimension inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: COLORS.card,
              borderRadius: 20,
              boxShadow: "0 1px 3px rgba(60,60,90,0.07)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* Flow mode toggle, top-left near the tank */}
            <div style={{ display: "flex", gap: 4, background: COLORS.bg, borderRadius: 14, padding: 3, alignSelf: "flex-start" }}>
              {[
                { key: "filling", label: "\u2191 Filling" },
                { key: "draining", label: "\u2193 Draining" },
                { key: "both", label: "\u2195 Both" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFlowMode(opt.key)}
                  style={{
                    border: "none",
                    borderRadius: 11,
                    padding: "6px 12px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    fontFamily: FONT,
                    cursor: "pointer",
                    background: flowMode === opt.key ? COLORS.accent : "transparent",
                    color: flowMode === opt.key ? "#FFFFFF" : COLORS.muted,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: COLORS.eyebrow,
                    marginBottom: 2,
                  }}
                >
                  Vertical
                </span>
                {["cylinder", "prism", "cone", "hourglass", "sphere"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setShapeType(s)}
                    title={
                      s === "cone"
                        ? "Cone"
                        : s === "cylinder"
                        ? "Cylinder"
                        : s === "hourglass"
                        ? "Hourglass"
                        : s === "sphere"
                        ? "Sphere / Hemisphere"
                        : "Box"
                    }
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: `1px solid ${shapeType === s ? COLORS.accent : COLORS.border}`,
                      background: shapeType === s ? COLORS.accent : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <ShapeIcon shape={s} active={shapeType === s} />
                  </button>
                ))}
                <div style={{ height: 1, background: COLORS.border, margin: "4px 0" }} />
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: COLORS.eyebrow,
                    marginBottom: 2,
                  }}
                >
                  Horizontal
                </span>
                {["trough"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setShapeType(s)}
                    title="Trough"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: `1px solid ${shapeType === s ? COLORS.accent : COLORS.border}`,
                      background: shapeType === s ? COLORS.accent : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <ShapeIcon shape={s} active={shapeType === s} />
                  </button>
                ))}
              </div>
              <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" style={{ maxWidth: 260 }}>
                {(currentFamily === "circular" || fadeFrom === "circular") && (
                  <g opacity={currentFamily === "circular" ? easedFadeT : 1 - easedFadeT}>
                    {showInflow &&
                      [0, 1, 2].map((i) => {
                        const phase = (dropPhase + i * 0.33) % 1;
                        const y = topY - 34 + phase * 34;
                        const opacity = phase < 0.85 ? 1 : (1 - phase) / 0.15;
                        return <circle key={`in${i}`} cx={cx + (i - 1) * 5} cy={y} r={3} fill={COLORS.accent2} opacity={opacity} />;
                      })}

                    {showOutflow &&
                      [0, 1, 2].map((i) => {
                        const phase = (dropPhase + i * 0.33) % 1;
                        const y = apexY + phase * (dripEndY - apexY);
                        const opacity = phase < 0.85 ? 1 : (1 - phase) / 0.15;
                        return <circle key={`out${i}`} cx={cx + (i - 1) * 4} cy={y} r={2.6} fill={COLORS.accent2} opacity={opacity} />;
                      })}

                    {p > 0 && RbottomPx > 0.5 && (
                      <ellipse cx={cx} cy={apexY} rx={RbottomPx} ry={bottomRimRy} fill={COLORS.waterFill} opacity={0.85} />
                    )}
                    {p > 0 && (
                      <path
                        d={`M ${cx - RbottomPx} ${apexY} L ${cx - rCurrentPx} ${waterY} A ${rCurrentPx} ${waterRimRy} 0 0 0 ${cx + rCurrentPx} ${waterY} L ${cx + RbottomPx} ${apexY} Z`}
                        fill={COLORS.waterFill}
                        opacity={0.85}
                      />
                    )}
                    {p > 0 && (
                      <ellipse cx={cx} cy={waterY} rx={rCurrentPx} ry={waterRimRy} fill={COLORS.waterSurface} opacity={0.9} />
                    )}

                    {p > 0.01 && (
                      <>
                        <line x1={cx} y1={apexY} x2={cx} y2={waterY} stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" />
                        <line x1={cx} y1={waterY} x2={cx + rCurrentPx} y2={waterY} stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" />
                        <text x={cx - 14} y={(apexY + waterY) / 2} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT} textAnchor="end">
                          h
                        </text>
                        <text x={cx + rCurrentPx / 2} y={waterY + 15} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT} textAnchor="middle">
                          r
                        </text>
                      </>
                    )}

                    <line x1={cx - RbottomPx} y1={apexY} x2={cx - RtopPx} y2={topY} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    <line x1={cx + RbottomPx} y1={apexY} x2={cx + RtopPx} y2={topY} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    {RtopPx > 0.5 && (
                      <ellipse cx={cx} cy={topY} rx={RtopPx} ry={topRimRy} fill="none" stroke={COLORS.accent} strokeWidth={2.5} />
                    )}
                    {RbottomPx > 0.5 && (
                      <ellipse cx={cx} cy={apexY} rx={RbottomPx} ry={bottomRimRy} fill="none" stroke={COLORS.accent} strokeWidth={2.5} />
                    )}

                    <line x1={cx + scalePx + 18} y1={apexY} x2={cx + scalePx + 18} y2={topY} stroke={COLORS.guide} strokeWidth={1.6} />
                    <text x={cx + scalePx + 24} y={(apexY + topY) / 2} fontSize={11.5} fontWeight={700} fill={COLORS.guide} fontFamily={FONT}>
                      H
                    </text>
                  </g>
                )}

                {(currentFamily === "box" || fadeFrom === "box") && (
                  <g opacity={currentFamily === "box" ? easedFadeT : 1 - easedFadeT}>
                    {showInflow &&
                      [0, 1, 2].map((i) => {
                        const phase = (dropPhase + i * 0.33) % 1;
                        const y = topY - 34 + phase * 34;
                        const opacity = phase < 0.85 ? 1 : (1 - phase) / 0.15;
                        return <circle key={`in${i}`} cx={cx + (i - 1) * 5} cy={y} r={3} fill={COLORS.accent2} opacity={opacity} />;
                      })}
                    {showOutflow &&
                      [0, 1, 2].map((i) => {
                        const phase = (dropPhase + i * 0.33) % 1;
                        const y = boxApexY + phase * (boxDripEndY - boxApexY);
                        const opacity = phase < 0.85 ? 1 : (1 - phase) / 0.15;
                        return <circle key={`out${i}`} cx={cx + (i - 1) * 4} cy={y} r={2.6} fill={COLORS.accent2} opacity={opacity} />;
                      })}

                    {/* back (hidden) edges — dashed, drawn first so the front face sits on top */}
                    <polygon
                      points={`${cx - LbottomPx + dxBot},${boxApexY + dyBot} ${cx + LbottomPx + dxBot},${boxApexY + dyBot} ${cx + LtopPx + dxTop},${topY + dyTop} ${cx - LtopPx + dxTop},${topY + dyTop}`}
                      fill="none"
                      stroke={COLORS.guide}
                      strokeWidth={1.6}
                      strokeDasharray="4 3"
                    />
                    <line x1={cx - LbottomPx} y1={boxApexY} x2={cx - LbottomPx + dxBot} y2={boxApexY + dyBot} stroke={COLORS.guide} strokeWidth={1.4} strokeDasharray="4 3" />
                    <line x1={cx + LbottomPx} y1={boxApexY} x2={cx + LbottomPx + dxBot} y2={boxApexY + dyBot} stroke={COLORS.guide} strokeWidth={1.4} strokeDasharray="4 3" />
                    <line x1={cx - LtopPx} y1={topY} x2={cx - LtopPx + dxTop} y2={topY + dyTop} stroke={COLORS.guide} strokeWidth={1.4} strokeDasharray="4 3" />
                    <line x1={cx + LtopPx} y1={topY} x2={cx + LtopPx + dxTop} y2={topY + dyTop} stroke={COLORS.guide} strokeWidth={1.4} strokeDasharray="4 3" />


                    {/* water: front face fill, then top surface + right-depth face for a 3D read */}
                    {p > 0 && (
                      <path
                        d={`M ${cx - LbottomPx} ${boxApexY} L ${cx - LCurrentPx} ${boxWaterY} L ${cx + LCurrentPx} ${boxWaterY} L ${cx + LbottomPx} ${boxApexY} Z`}
                        fill={COLORS.waterFill}
                        opacity={0.85}
                      />
                    )}
                    {p > 0 && (
                      <polygon
                        points={`${cx + LbottomPx},${boxApexY} ${cx + LbottomPx + dxBot},${boxApexY + dyBot} ${cx + LCurrentPx + dxCurrent},${boxWaterY + dyCurrent} ${cx + LCurrentPx},${boxWaterY}`}
                        fill={COLORS.waterFill}
                        opacity={0.65}
                      />
                    )}
                    {p > 0 && (
                      <polygon
                        points={`${cx - LCurrentPx},${boxWaterY} ${cx + LCurrentPx},${boxWaterY} ${cx + LCurrentPx + dxCurrent},${boxWaterY + dyCurrent} ${cx - LCurrentPx + dxCurrent},${boxWaterY + dyCurrent}`}
                        fill={COLORS.waterSurface}
                        opacity={0.9}
                      />
                    )}

                    {p > 0.01 && (
                      <>
                        <line x1={cx} y1={boxApexY} x2={cx} y2={boxWaterY} stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" />
                        <line x1={cx} y1={boxWaterY} x2={cx + LCurrentPx} y2={boxWaterY} stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" />
                        <text x={cx - 14} y={(boxApexY + boxWaterY) / 2} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT} textAnchor="end">
                          h
                        </text>
                        <text x={cx + LCurrentPx / 2} y={boxWaterY + 15} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT} textAnchor="middle">
                          L
                        </text>
                      </>
                    )}

                    {/* front face — solid, on top */}
                    <line x1={cx - LbottomPx} y1={boxApexY} x2={cx - LtopPx} y2={topY} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    <line x1={cx + LbottomPx} y1={boxApexY} x2={cx + LtopPx} y2={topY} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    {LtopPx > 0.5 && (
                      <line x1={cx - LtopPx} y1={topY} x2={cx + LtopPx} y2={topY} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    )}
                    {LbottomPx > 0.5 && (
                      <line x1={cx - LbottomPx} y1={boxApexY} x2={cx + LbottomPx} y2={boxApexY} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    )}
                    {/* depth (W) label near the top-right receding edge */}
                    {depthTopPx > 0.5 && (
                      <text
                        x={cx + LtopPx + dxTop / 2 + 6}
                        y={topY + dyTop / 2 - 4}
                        fontSize={11}
                        fontWeight={700}
                        fill={COLORS.guide}
                        fontFamily={FONT}
                      >
                        W
                      </text>
                    )}

                    <line x1={cx + boxScalePx + 18} y1={boxApexY} x2={cx + boxScalePx + 18} y2={topY} stroke={COLORS.guide} strokeWidth={1.6} />
                    <text x={cx + boxScalePx + 24} y={(boxApexY + topY) / 2} fontSize={11.5} fontWeight={700} fill={COLORS.guide} fontFamily={FONT}>
                      H
                    </text>
                  </g>
                )}

                {(currentFamily === "hourglass" || fadeFrom === "hourglass") && (
                  <g opacity={currentFamily === "hourglass" ? easedFadeT : 1 - easedFadeT}>
                    {showInflow &&
                      [0, 1, 2].map((i) => {
                        const phase = (dropPhase + i * 0.33) % 1;
                        const y = topY - 34 + phase * 34;
                        const opacity = phase < 0.85 ? 1 : (1 - phase) / 0.15;
                        return <circle key={`in${i}`} cx={cx + (i - 1) * 5} cy={y} r={3} fill={COLORS.accent2} opacity={opacity} />;
                      })}
                    {showOutflow &&
                      [0, 1, 2].map((i) => {
                        const phase = (dropPhase + i * 0.33) % 1;
                        const y = hgApexY + phase * (hgDripEndY - hgApexY);
                        const opacity = phase < 0.85 ? 1 : (1 - phase) / 0.15;
                        return <circle key={`out${i}`} cx={cx + (i - 1) * 4} cy={y} r={2.6} fill={COLORS.accent2} opacity={opacity} />;
                      })}

                    {/* water: bottom bulb (always drawn up to min(waterY, neck)), then any
                        overflow into the top bulb once the water level passes the neck */}
                    {p > 0 && RbulbPx > 0.5 && (
                      <ellipse cx={cx} cy={hgApexY} rx={RbulbPx} ry={bulbRimRy} fill={COLORS.waterFill} opacity={0.85} />
                    )}
                    {p > 0 && hgLowerHalf && (
                      <path
                        d={`M ${cx - RbulbPx} ${hgApexY} L ${cx - hgCurrentPx} ${hgWaterY} A ${hgCurrentPx} ${hgWaterRimRy} 0 0 0 ${cx + hgCurrentPx} ${hgWaterY} L ${cx + RbulbPx} ${hgApexY} Z`}
                        fill={COLORS.waterFill}
                        opacity={0.85}
                      />
                    )}
                    {p > 0 && !hgLowerHalf && (
                      <>
                        <path
                          d={`M ${cx - RbulbPx} ${hgApexY} L ${cx - RneckPx} ${hgMidY} A ${RneckPx} ${neckRimRy} 0 0 0 ${cx + RneckPx} ${hgMidY} L ${cx + RbulbPx} ${hgApexY} Z`}
                          fill={COLORS.waterFill}
                          opacity={0.85}
                        />
                        {/* Defensive full neck-cap ellipse, same idea as the water-surface
                            ellipse below it — the arc above only traces one side of the neck's
                            elliptical cross-section, and depending on which way it bulges could
                            leave a thin uncovered sliver right where this polygon meets the one
                            below it. A full ellipse here guarantees the seam is always sealed,
                            regardless of arc direction. */}
                        <ellipse cx={cx} cy={hgMidY} rx={RneckPx} ry={neckRimRy} fill={COLORS.waterFill} opacity={0.85} />
                        <path
                          d={`M ${cx - RneckPx} ${hgMidY} L ${cx - hgCurrentPx} ${hgWaterY} A ${hgCurrentPx} ${hgWaterRimRy} 0 0 0 ${cx + hgCurrentPx} ${hgWaterY} L ${cx + RneckPx} ${hgMidY} Z`}
                          fill={COLORS.waterFill}
                          opacity={0.85}
                        />
                      </>
                    )}
                    {p > 0 && (
                      <ellipse cx={cx} cy={hgWaterY} rx={hgCurrentPx} ry={hgWaterRimRy} fill={COLORS.waterSurface} opacity={0.9} />
                    )}

                    {p > 0.01 && (
                      <>
                        <line x1={cx} y1={hgApexY} x2={cx} y2={hgWaterY} stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" />
                        <line x1={cx} y1={hgWaterY} x2={cx + hgCurrentPx} y2={hgWaterY} stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" />
                        <text x={cx - 14} y={(hgApexY + hgWaterY) / 2} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT} textAnchor="end">
                          h
                        </text>
                        <text x={cx + hgCurrentPx / 2} y={hgWaterY + 15} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT} textAnchor="middle">
                          r
                        </text>
                      </>
                    )}

                    {/* outline: bottom cone, neck, top cone */}
                    <line x1={cx - RbulbPx} y1={hgApexY} x2={cx - RneckPx} y2={hgMidY} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    <line x1={cx + RbulbPx} y1={hgApexY} x2={cx + RneckPx} y2={hgMidY} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    <line x1={cx - RneckPx} y1={hgMidY} x2={cx - RbulbPx} y2={topY} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    <line x1={cx + RneckPx} y1={hgMidY} x2={cx + RbulbPx} y2={topY} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    <ellipse cx={cx} cy={hgApexY} rx={RbulbPx} ry={bulbRimRy} fill="none" stroke={COLORS.accent} strokeWidth={2.5} />
                    <ellipse cx={cx} cy={topY} rx={RbulbPx} ry={bulbRimRy} fill="none" stroke={COLORS.accent} strokeWidth={2.5} />
                    {RneckPx > 0.5 && (
                      <ellipse cx={cx} cy={hgMidY} rx={RneckPx} ry={neckRimRy} fill="none" stroke={COLORS.accent} strokeWidth={1.8} />
                    )}

                    <line x1={cx + hgScalePx + 18} y1={hgApexY} x2={cx + hgScalePx + 18} y2={topY} stroke={COLORS.guide} strokeWidth={1.6} />
                    <text x={cx + hgScalePx + 24} y={(hgApexY + topY) / 2} fontSize={11.5} fontWeight={700} fill={COLORS.guide} fontFamily={FONT}>
                      H
                    </text>
                  </g>
                )}

                {(currentFamily === "sphere" || fadeFrom === "sphere") && (
                  <g opacity={currentFamily === "sphere" ? easedFadeT : 1 - easedFadeT}>
                    {showInflow &&
                      [0, 1, 2].map((i) => {
                        const phase = (dropPhase + i * 0.33) % 1;
                        const y = sphTopY - 34 + phase * 34;
                        const opacity = phase < 0.85 ? 1 : (1 - phase) / 0.15;
                        return <circle key={`in${i}`} cx={cx + (i - 1) * 5} cy={y} r={3} fill={COLORS.accent2} opacity={opacity} />;
                      })}
                    {showOutflow &&
                      [0, 1, 2].map((i) => {
                        const phase = (dropPhase + i * 0.33) % 1;
                        const y = sphApexY + phase * (sphDripEndY - sphApexY);
                        const opacity = phase < 0.85 ? 1 : (1 - phase) / 0.15;
                        return <circle key={`out${i}`} cx={cx + (i - 1) * 4} cy={y} r={2.6} fill={COLORS.accent2} opacity={opacity} />;
                      })}

                    {/* water-colored base cap for Dome's flat bottom (mirrors the circular
                        family's "water bottom ellipse" pattern) — drawn here, before the main
                        fill/outline, so it reads as part of the water rather than as an opaque
                        white cap sitting on top of it. */}
                    {p > 0 && sphPoints[0].xOff > 0.5 && (
                      <ellipse cx={cx} cy={sphPoints[0].y} rx={sphPoints[0].xOff} ry={Math.max(8, sphPoints[0].xOff * 0.18)} fill={COLORS.waterFill} opacity={0.85} />
                    )}
                    {p > 0 && <path d={sphWaterFillPath} fill={COLORS.waterFill} opacity={0.85} />}
                    {p > 0 && (
                      <ellipse cx={cx} cy={sphWaterY} rx={sphCurrentXOff} ry={sphWaterRimRy} fill={COLORS.waterSurface} opacity={0.9} />
                    )}

                    {p > 0.01 && (
                      <>
                        <line x1={cx} y1={sphApexY} x2={cx} y2={sphWaterY} stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" />
                        <line x1={cx} y1={sphWaterY} x2={cx + sphCurrentXOff} y2={sphWaterY} stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" />
                        <text x={cx - 14} y={(sphApexY + sphWaterY) / 2} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT} textAnchor="end">
                          h
                        </text>
                        <text x={cx + sphCurrentXOff / 2} y={sphWaterY + 15} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT} textAnchor="middle">
                          r
                        </text>
                      </>
                    )}

                    <path d={sphOutlinePath} fill="none" stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    {/* open rim ellipse where the profile is at full width right at an end
                        (Bowl's top opening, Dome's base) — a thin ellipse hints depth without
                        implying a lid. Skipped wherever the endpoint radius is ~0 (a point).
                        ry is scaled proportionally to the ellipse's OWN rx (not the shared
                        rimRy constant used by the narrower circular/hourglass/trough shapes) —
                        Bowl/Dome's rim can be nearly as wide as the whole drawing, and a fixed
                        14px ry there reads as an unnaturally flat sliver rather than a rounded
                        3D rim. */}
                    {sphPoints[SPHERE_N].xOff > 0.5 && (
                      <ellipse cx={cx} cy={sphPoints[SPHERE_N].y} rx={sphPoints[SPHERE_N].xOff} ry={Math.max(8, sphPoints[SPHERE_N].xOff * 0.18)} fill="none" stroke={COLORS.accent} strokeWidth={2} opacity={0.6} />
                    )}
                    {sphPoints[0].xOff > 0.5 && (
                      <ellipse cx={cx} cy={sphPoints[0].y} rx={sphPoints[0].xOff} ry={Math.max(8, sphPoints[0].xOff * 0.18)} fill="none" stroke={COLORS.accent} strokeWidth={2} opacity={0.6} />
                    )}
                    {sphereVariant === "fullSphere" && (
                      <line
                        x1={cx - sphScalePx}
                        y1={topY + sphH_px / 2}
                        x2={cx + sphScalePx}
                        y2={topY + sphH_px / 2}
                        stroke={COLORS.guide}
                        strokeWidth={1.2}
                        strokeDasharray="3 3"
                        opacity={0.5}
                      />
                    )}

                    <line x1={cx + sphScalePx + 18} y1={sphApexY} x2={cx + sphScalePx + 18} y2={sphTopY} stroke={COLORS.guide} strokeWidth={1.6} />
                    <text x={cx + sphScalePx + 24} y={(sphApexY + sphTopY) / 2} fontSize={11.5} fontWeight={700} fill={COLORS.guide} fontFamily={FONT}>
                      H
                    </text>
                  </g>
                )}

                {(currentFamily === "trough" || fadeFrom === "trough") && (
                  <g opacity={currentFamily === "trough" ? easedFadeT : 1 - easedFadeT}>
                    {showInflow &&
                      [0, 1, 2].map((i) => {
                        const phase = (dropPhase + i * 0.33) % 1;
                        const y = trTopY - 34 + phase * 34;
                        const opacity = phase < 0.85 ? 1 : (1 - phase) / 0.15;
                        return <circle key={`in${i}`} cx={cx + (i - 1) * 5} cy={y} r={3} fill={COLORS.accent2} opacity={opacity} />;
                      })}
                    {showOutflow &&
                      [0, 1, 2].map((i) => {
                        const phase = (dropPhase + i * 0.33) % 1;
                        const y = trApexY + phase * (trDripEndY - trApexY);
                        const opacity = phase < 0.85 ? 1 : (1 - phase) / 0.15;
                        return <circle key={`out${i}`} cx={cx + (i - 1) * 4} cy={y} r={2.6} fill={COLORS.accent2} opacity={opacity} />;
                      })}

                    {/* back (hidden) outline + connecting depth edges — dashed, drawn first */}
                    <path d={trBackOutlinePath} fill="none" stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" opacity={0.6} />
                    <line x1={cx - trTopPt.xOff} y1={trTopPt.y} x2={cx - trTopPt.xOff + trDx} y2={trTopPt.y + trDy} stroke={COLORS.guide} strokeWidth={1.4} strokeDasharray="4 3" />
                    <line x1={cx + trTopPt.xOff} y1={trTopPt.y} x2={cx + trTopPt.xOff + trDx} y2={trTopPt.y + trDy} stroke={COLORS.guide} strokeWidth={1.4} strokeDasharray="4 3" />
                    {trBottomPt.xOff > 0.5 ? (
                      <>
                        <line x1={cx - trBottomPt.xOff} y1={trBottomPt.y} x2={cx - trBottomPt.xOff + trDx} y2={trBottomPt.y + trDy} stroke={COLORS.guide} strokeWidth={1.4} strokeDasharray="4 3" />
                        <line x1={cx + trBottomPt.xOff} y1={trBottomPt.y} x2={cx + trBottomPt.xOff + trDx} y2={trBottomPt.y + trDy} stroke={COLORS.guide} strokeWidth={1.4} strokeDasharray="4 3" />
                        {/* back bottom edge itself — connects the two back-bottom corners.
                            Only needed when the bottom is wide (Trapezoidal); V-Shape/
                            Semicircular come to a point there so there's no back edge to draw. */}
                        <line x1={cx - trBottomPt.xOff + trDx} y1={trBottomPt.y + trDy} x2={cx + trBottomPt.xOff + trDx} y2={trBottomPt.y + trDy} stroke={COLORS.guide} strokeWidth={1.4} strokeDasharray="4 3" />
                      </>
                    ) : (
                      <line x1={cx} y1={trBottomPt.y} x2={cx + trDx} y2={trBottomPt.y + trDy} stroke={COLORS.guide} strokeWidth={1.4} strokeDasharray="4 3" />
                    )}

                    {/* water */}
                    {p > 0 && <path d={trWaterFillPath} fill={COLORS.waterFill} opacity={0.85} />}
                    {p > 0 && trWaterRightWallPath && <path d={trWaterRightWallPath} fill={COLORS.waterFill} opacity={0.5} />}
                    {p > 0 && (
                      <polygon
                        points={`${cx - trCurrentXOff},${trWaterY} ${cx + trCurrentXOff},${trWaterY} ${cx + trCurrentXOff + trDx},${trWaterY + trDy} ${cx - trCurrentXOff + trDx},${trWaterY + trDy}`}
                        fill={COLORS.waterSurface}
                        opacity={0.9}
                      />
                    )}

                    {p > 0.01 && (
                      <>
                        <line x1={cx} y1={trApexY} x2={cx} y2={trWaterY} stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" />
                        <line x1={cx} y1={trWaterY} x2={cx + trCurrentXOff} y2={trWaterY} stroke={COLORS.guide} strokeWidth={1.6} strokeDasharray="4 3" />
                        <text x={cx - 14} y={(trApexY + trWaterY) / 2} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT} textAnchor="end">
                          h
                        </text>
                        <text x={cx + trCurrentXOff / 2} y={trWaterY + 15} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT} textAnchor="middle">
                          w
                        </text>
                      </>
                    )}

                    {/* front outline — solid, on top */}
                    <path d={trOutlinePath} fill="none" stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    {/* flat bottom edge — only needed when the bottom is wide (Trapezoidal);
                        V-Shape/Semicircular come to a point there so there's nothing to close. */}
                    {trBottomPt.xOff > 0.5 && (
                      <line x1={cx - trBottomPt.xOff} y1={trBottomPt.y} x2={cx + trBottomPt.xOff} y2={trBottomPt.y} stroke={COLORS.accent} strokeWidth={2.5} strokeLinecap="round" />
                    )}
                    {/* receding top edges + back top line, showing Length (open rim, no lid) */}
                    <line x1={cx - trTopPt.xOff} y1={trTopPt.y} x2={cx - trTopPt.xOff + trDx} y2={trTopPt.y + trDy} stroke={COLORS.accent} strokeWidth={2} opacity={0.8} />
                    <line x1={cx + trTopPt.xOff} y1={trTopPt.y} x2={cx + trTopPt.xOff + trDx} y2={trTopPt.y + trDy} stroke={COLORS.accent} strokeWidth={2} opacity={0.8} />
                    <line
                      x1={cx - trTopPt.xOff + trDx}
                      y1={trTopPt.y + trDy}
                      x2={cx + trTopPt.xOff + trDx}
                      y2={trTopPt.y + trDy}
                      stroke={COLORS.accent}
                      strokeWidth={2}
                      opacity={0.8}
                    />
                    {/* Length label near the receding top-right edge */}
                    <text x={cx + trTopPt.xOff + trDx / 2 + 6} y={trTopPt.y + trDy / 2 - 4} fontSize={11} fontWeight={700} fill={COLORS.guide} fontFamily={FONT}>
                      L
                    </text>

                    <line x1={cx + trScalePx + 18} y1={trApexY} x2={cx + trScalePx + 18} y2={trTopY} stroke={COLORS.guide} strokeWidth={1.6} />
                    <text x={cx + trScalePx + 24} y={(trApexY + trTopY) / 2} fontSize={11.5} fontWeight={700} fill={COLORS.guide} fontFamily={FONT}>
                      D
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {shapeType === "cone" && (
              <div style={{ display: "flex", gap: 4, background: COLORS.bg, borderRadius: 14, padding: 3, alignSelf: "flex-start" }}>
                {[
                  { key: "down", label: "Point down" },
                  { key: "up", label: "Point up" },
                  { key: "frustum", label: "Frustum" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setConeVariant(opt.key)}
                    style={{
                      border: "none",
                      borderRadius: 11,
                      padding: "6px 12px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      fontFamily: FONT,
                      cursor: "pointer",
                      background: coneVariant === opt.key ? COLORS.accent2 : "transparent",
                      color: coneVariant === opt.key ? "#FFFFFF" : COLORS.muted,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {shapeType === "prism" && (
              <div style={{ display: "flex", gap: 4, background: COLORS.bg, borderRadius: 14, padding: 3, alignSelf: "flex-start" }}>
                {[
                  { key: "box", label: "Box" },
                  { key: "frustum", label: "Frustum" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPrismVariant(opt.key)}
                    style={{
                      border: "none",
                      borderRadius: 11,
                      padding: "6px 12px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      fontFamily: FONT,
                      cursor: "pointer",
                      background: prismVariant === opt.key ? COLORS.accent2 : "transparent",
                      color: prismVariant === opt.key ? "#FFFFFF" : COLORS.muted,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {shapeType === "sphere" && (
              <div style={{ display: "flex", gap: 4, background: COLORS.bg, borderRadius: 14, padding: 3, alignSelf: "flex-start" }}>
                {[
                  { key: "bowl", label: "Bowl" },
                  { key: "dome", label: "Dome" },
                  { key: "fullSphere", label: "Full Sphere" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSphereVariant(opt.key)}
                    style={{
                      border: "none",
                      borderRadius: 11,
                      padding: "6px 12px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      fontFamily: FONT,
                      cursor: "pointer",
                      background: sphereVariant === opt.key ? COLORS.accent2 : "transparent",
                      color: sphereVariant === opt.key ? "#FFFFFF" : COLORS.muted,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {shapeType === "trough" && (
              <div style={{ display: "flex", gap: 4, background: COLORS.bg, borderRadius: 14, padding: 3, alignSelf: "flex-start" }}>
                {[
                  { key: "vshape", label: "V-Shaped" },
                  { key: "semicircular", label: "Semicircular" },
                  { key: "trapezoidal", label: "Trapezoidal" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTroughVariant(opt.key)}
                    style={{
                      border: "none",
                      borderRadius: 11,
                      padding: "6px 12px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      fontFamily: FONT,
                      cursor: "pointer",
                      background: troughVariant === opt.key ? COLORS.accent2 : "transparent",
                      color: troughVariant === opt.key ? "#FFFFFF" : COLORS.muted,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dimension inputs */}
          <div
            style={{
              background: COLORS.card,
              borderRadius: 18,
              boxShadow: "0 1px 3px rgba(60,60,90,0.07)",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <SectionTitle>Tank dimensions</SectionTitle>
            <div style={{ display: "flex", gap: 10 }}>
              <NumberField
                prefix={isTrough ? "D =" : "H ="}
                value={isSphere ? sphereHtotal : isTrough ? troughD : H}
                min={clampH[0]}
                max={clampH[1]}
                suffix={unit}
                onChange={setH}
                disabled={isSphere || (isTrough && troughVariant === "semicircular")}
                disabledNote={
                  isSphere
                    ? sphereVariant === "fullSphere"
                      ? "H is locked to 2R for a full sphere."
                      : "H is locked to R for a hemisphere."
                    : isTrough && troughVariant === "semicircular"
                    ? "D is locked to R for a semicircular trough."
                    : null
                }
              />
              {!isPrism && !(isTrough && troughVariant !== "semicircular") && (
                <NumberField
                  prefix={
                    isHourglass
                      ? "Bulb R ="
                      : isSphere
                      ? "R ="
                      : coneVariant === "frustum" && shapeType === "cone"
                      ? "R top ="
                      : "R ="
                  }
                  value={R}
                  min={clampR[0]}
                  max={clampR[1]}
                  suffix={unit}
                  onChange={setR}
                />
              )}
            </div>
            {!isPrism && shapeType === "cone" && coneVariant === "frustum" && (
              <div style={{ display: "flex", gap: 10 }}>
                <NumberField prefix="R bottom =" value={R2} min={0} max={clampR[1]} suffix={unit} onChange={setR2} />
              </div>
            )}
            {isHourglass && (
              <div style={{ display: "flex", gap: 10 }}>
                <NumberField prefix="Neck R =" value={Rn} min={clampRn[0]} max={R} suffix={unit} onChange={setRn} />
              </div>
            )}
            {isPrism && (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <NumberField
                    prefix={prismVariant === "frustum" ? "L top =" : "L ="}
                    value={L}
                    min={clampL[0]}
                    max={clampL[1]}
                    suffix={unit}
                    onChange={setL}
                  />
                  <NumberField
                    prefix={prismVariant === "frustum" ? "W top =" : "W ="}
                    value={W}
                    min={clampW[0]}
                    max={clampW[1]}
                    suffix={unit}
                    onChange={setW}
                  />
                </div>
                {prismVariant === "frustum" && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <NumberField prefix="L bottom =" value={L2} min={0} max={clampL[1]} suffix={unit} onChange={setL2} />
                    <NumberField prefix="W bottom =" value={W2} min={0} max={clampW[1]} suffix={unit} onChange={setW2} />
                  </div>
                )}
              </>
            )}
            {isTrough && (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  {troughVariant !== "semicircular" && (
                    <NumberField
                      prefix={troughVariant === "trapezoidal" ? "Top Width =" : "Width ="}
                      value={L}
                      min={clampL[0]}
                      max={clampL[1]}
                      suffix={unit}
                      onChange={setL}
                    />
                  )}
                  <NumberField prefix="Length =" value={W} min={clampW[0]} max={clampW[1]} suffix={unit} onChange={setW} />
                </div>
                {troughVariant === "trapezoidal" && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <NumberField prefix="Bottom Width =" value={L2} min={0} max={clampL[1]} suffix={unit} onChange={setL2} />
                  </div>
                )}
              </>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <NumberField
                prefix="jump to h ="
                value={heightJump === "" ? "" : heightJump}
                min={0}
                max={isSphere ? sphereHtotal : isTrough ? troughD : H}
                suffix={unit}
                onChange={(v) => setHeightJump(v)}
              />
              <PillButton small onClick={commitHeightJump} style={{ marginBottom: 2 }}>
                Go
              </PillButton>
            </div>
            <PillButton small onClick={resetDefaults} style={{ alignSelf: "flex-start" }}>
              Reset to defaults
            </PillButton>
          </div>
        </div>

        {/* Readouts + controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div>
            <SectionTitle>Water measurements</SectionTitle>
            {isPrism ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 6 }}>
                <Readout label="Water height h(t)" value={h.toFixed(2)} unit={lenUnit} />
                <Readout label="Surface length L(t)" value={Lh.toFixed(2)} unit={lenUnit} color={COLORS.accent2} />
                <Readout label="Surface width W(t)" value={Wh.toFixed(2)} unit={lenUnit} color={COLORS.accent2} />
                <Readout label="Water volume V(t)" value={V.toFixed(1)} unit={volUnit} />
              </div>
            ) : isTrough ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 6 }}>
                <Readout label="Water height h(t)" value={h.toFixed(2)} unit={lenUnit} />
                <Readout label="Surface width w(t)" value={r.toFixed(2)} unit={lenUnit} color={COLORS.accent2} />
                <Readout label="Water volume V(t)" value={V.toFixed(1)} unit={volUnit} />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 6 }}>
                <Readout label="Water height h(t)" value={h.toFixed(2)} unit={lenUnit} />
                <Readout label="Water surface radius r(t)" value={r.toFixed(2)} unit={lenUnit} color={COLORS.accent2} />
                <Readout label="Water volume V(t)" value={V.toFixed(1)} unit={volUnit} />
              </div>
            )}
          </div>

          <div>
            <SectionTitle>Rates of change</SectionTitle>
            {isPrism ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 6 }}>
                <Readout label="dV/dt" value={dVdt.toFixed(2)} unit={volRateUnit} highlight={effectiveMode === "dVdt" && flowMode !== "both"} />
                <Readout label="dL/dt" value={dLdt.toFixed(3)} unit={lenRateUnit} color={COLORS.accent2} highlight={effectiveMode === "dLdt"} />
                <Readout label="dW/dt" value={dWdt.toFixed(3)} unit={lenRateUnit} color={COLORS.accent2} highlight={effectiveMode === "dWdt"} />
                <Readout
                  label="dh/dt"
                  value={nearSingularity ? "large" : dhdt.toFixed(3)}
                  unit={nearSingularity ? "" : lenRateUnit}
                  footnote={dhdtFootnote || null}
                  highlight={effectiveMode === "dhdt"}
                />
              </div>
            ) : isTrough ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 6 }}>
                <Readout label="dV/dt" value={dVdt.toFixed(2)} unit={volRateUnit} highlight={effectiveMode === "dVdt" && flowMode !== "both"} />
                <Readout
                  label="dh/dt"
                  value={nearSingularity ? "large" : dhdt.toFixed(3)}
                  unit={nearSingularity ? "" : lenRateUnit}
                  footnote={dhdtFootnote || null}
                  highlight={effectiveMode === "dhdt"}
                />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 6 }}>
                <Readout label="dV/dt" value={dVdt.toFixed(2)} unit={volRateUnit} highlight={effectiveMode === "dVdt" && flowMode !== "both"} />
                <Readout
                  label="dr/dt"
                  value={drdt.toFixed(3)}
                  unit={lenRateUnit}
                  color={COLORS.accent2}
                  highlight={effectiveMode === "drdt"}
                  footnote={
                    isSphere && sphereVariant === "fullSphere" && Math.abs(h - R) < sphereHtotal * 0.02
                      ? "Near the equator, r(t) is momentarily at its max \u2014 dr/dt passes through 0 here."
                      : null
                  }
                />
                <Readout
                  label="dh/dt"
                  value={nearSingularity ? "large" : dhdt.toFixed(3)}
                  unit={nearSingularity ? "" : lenRateUnit}
                  footnote={dhdtFootnote || null}
                  highlight={effectiveMode === "dhdt"}
                />
              </div>
            )}
          </div>


          {/* Rate driver control */}
          <div
            style={{
              background: COLORS.card,
              borderRadius: 18,
              boxShadow: "0 1px 3px rgba(60,60,90,0.07)",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {flowMode !== "both" ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>Hold constant:</span>
                  <select
                    value={singleMode}
                    onChange={(e) => setSingleMode(e.target.value)}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 20,
                      padding: "7px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: COLORS.accent,
                      background: COLORS.bg,
                      fontFamily: FONT,
                      cursor: "pointer",
                    }}
                  >
                    <option value="dVdt">dV/dt</option>
                    {!isPrism && !isSphere && !isTrough && (
                      <option value="drdt" disabled={isHourglass ? noTaperHourglass : noTaper}>
                        dr/dt{(isHourglass ? noTaperHourglass : noTaper) ? " (n/a — no taper)" : ""}
                      </option>
                    )}
                    {isSphere && <option value="drdt">dr/dt</option>}
                    {isPrism && (
                      <>
                        <option value="dLdt" disabled={noTaperL}>
                          dL/dt{noTaperL ? " (n/a — no taper)" : ""}
                        </option>
                        <option value="dWdt" disabled={noTaperW}>
                          dW/dt{noTaperW ? " (n/a — no taper)" : ""}
                        </option>
                      </>
                    )}
                    <option value="dhdt">dh/dt</option>
                  </select>
                  <div style={{ marginLeft: "auto" }}>
                    <NumberField
                      prefix={`${RATE_LABELS[singleMode].sym} =`}
                      value={signedK}
                      min={-activeRange.max}
                      max={activeRange.max}
                      suffix={singleMode === "dVdt" ? volRateUnit : lenRateUnit}
                      width={185}
                      onChange={(v) => {
                        const magnitude = clampToRange(Math.abs(v), activeRange);
                        setFlowMode(v < 0 ? "draining" : "filling");
                        setRates((r0) => ({ ...r0, [singleMode]: magnitude }));
                      }}
                    />
                  </div>
                </div>
                <Slider
                  value={rates[singleMode]}
                  min={activeRange.min}
                  max={activeRange.max}
                  step={activeRange.step}
                  onChange={(e) => setRates((r0) => ({ ...r0, [singleMode]: Number(e.target.value) }))}
                />
                <span style={{ fontSize: 11, color: COLORS.eyebrow, lineHeight: 1.4 }}>
                  {flowMode === "draining"
                    ? `Draining, so ${RATE_LABELS[singleMode].sym} is negative \u2014 the slider sets its magnitude.`
                    : "Filling, so this rate is positive."}
                  {singleMode !== "dVdt" &&
                    " Holding this rate constant means dV/dt is not constant \u2014 watch it change in the rates row above."}
                  {isSphere && sphereVariant === "fullSphere" && singleMode === "drdt" &&
                    " Near the equator, dr/dt briefly can't be held at a nonzero value \u2014 dh/dt drops to 0 there instead."}
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted }}>
                  Inflow and outflow, both as volume rates:
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ minWidth: 150 }}>
                    <NumberField
                      prefix="Inflow ="
                      value={inflowRate}
                      min={bothRange.min}
                      max={bothRange.max}
                      suffix={volRateUnit}
                      onChange={(v) => setInflowRate(clampToRange(v, bothRange))}
                    />
                  </div>
                  <Slider value={inflowRate} min={bothRange.min} max={bothRange.max} step={bothRange.step} onChange={(e) => setInflowRate(Number(e.target.value))} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ minWidth: 150 }}>
                    <NumberField
                      prefix="Outflow ="
                      value={outflowRate}
                      min={bothRange.min}
                      max={bothRange.max}
                      suffix={volRateUnit}
                      onChange={(v) => setOutflowRate(clampToRange(v, bothRange))}
                    />
                  </div>
                  <Slider value={outflowRate} min={bothRange.min} max={bothRange.max} step={bothRange.step} onChange={(e) => setOutflowRate(Number(e.target.value))} />
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 13,
                    fontWeight: 700,
                    color: k > 0 ? COLORS.accent : k < 0 ? COLORS.warn : COLORS.muted,
                  }}
                >
                  Net dV/dt = inflow − outflow = {k.toFixed(2)} {volRateUnit}
                  {k === 0 && <span style={{ fontWeight: 500, fontStyle: "italic" }}> (steady state — level holds constant)</span>}
                </div>
              </>
            )}
          </div>

          {/* Play / progress control */}
          <div
            style={{
              background: COLORS.card,
              borderRadius: 18,
              boxShadow: "0 1px 3px rgba(60,60,90,0.07)",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <PillButton primary onClick={() => setIsPlaying((v) => !v)}>
                {isPlaying ? "\u23f8  Stop" : "\u25b6  Play"}
              </PillButton>
              <span style={{ fontSize: 12, color: COLORS.muted }}>
                {isPlaying ? (k === 0 ? "Steady state\u2026" : k > 0 ? "Filling\u2026" : "Draining\u2026") : p === 0 ? "Tank empty" : p >= 0.999 ? "Tank full" : "Paused"}
              </span>
              <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                {SPEED_OPTIONS.map((s) => (
                  <PillButton key={s} small active={speed === s} onClick={() => setSpeed(s)}>
                    {s}x
                  </PillButton>
                ))}
              </div>
            </div>
            <Slider value={Math.round(progressDisplay * 1000)} min={0} max={1000} step={1} onChange={handleProgressChange} onPointerDown={handleProgressPointerDown} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.eyebrow }}>
              <span>{direction === 1 ? "empty" : "full"}</span>
              <span>{direction === 1 ? "full" : "empty"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equation / derivation panel */}
      <div
        style={{
          background: COLORS.card,
          borderRadius: 20,
          boxShadow: "0 1px 3px rgba(60,60,90,0.07)",
          padding: "18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle>Derivation</SectionTitle>
          <PillButton small onClick={() => setDerivShown((v) => !v)}>
            {derivShown ? "Hide" : "Show"}
          </PillButton>
        </div>

        {derivShown && shapeType === "cone" && coneVariant === "down" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const { num: rNum, den: rDen, reducible } = toFraction(R, H);
              const c3num0 = rNum * rNum;
              const c3den0 = 3 * rDen * rDen;
              const g3 = gcd(c3num0, c3den0);
              const c3num = c3num0 / g3;
              const c3den = c3den0 / g3;
              const StepNum = ({ n }) => (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: COLORS.border,
                    color: COLORS.muted,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: 8,
                  }}
                >
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    Cone volume: V = ⅓π r² h
                  </div>
                  <div>
                    <StepNum n={2} />
                    Similar triangles (constant cone shape): r/h = R/H = {fmtNum(R)}/{fmtNum(H)}
                    {reducible ? (
                      <span style={{ color: COLORS.eyebrow, fontStyle: "italic", fontSize: 12 }}> (unreduced)</span>
                    ) : (
                      <>, so r = ({rNum}/{rDen}) h</>
                    )}
                  </div>
                  {reducible && (
                    <div style={{ paddingLeft: 26 }}>
                      = {rNum}/{rDen} <span style={{ color: COLORS.eyebrow, fontStyle: "italic", fontSize: 12 }}>(reduced)</span>, so r = ({rNum}/{rDen}) h
                    </div>
                  )}
                  <div>
                    <StepNum n={3} />
                    Eliminate r: V = ⅓π(({rNum}/{rDen})h)² h = ({c3num}/{c3den})π h³
                  </div>
                  <div>
                    <StepNum n={4} />
                    Differentiate both sides in t: dV/dt = ({rNum * rNum}/{rDen * rDen})π h² · dh/dt
                  </div>
                  <div>
                    <StepNum n={5} />
                    Same substitution gives: dr/dt = ({rNum}/{rDen}) dh/dt
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "cone" && coneVariant === "up" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: COLORS.border,
                    color: COLORS.muted,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: 8,
                  }}
                >
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    This cone is flipped — wide base at the bottom (radius R = {fmtNum(R)} {unit}), tapering to a point at the top.
                  </div>
                  <div>
                    <StepNum n={2} />
                    Similar triangles measured from the top point: r/(H − h) = R/H, so r = R(1 − h/H).
                  </div>
                  <div>
                    <StepNum n={3} />
                    Disk method (true for any tank shape): dV/dh = π r².
                  </div>
                  <div>
                    <StepNum n={4} />
                    Chain rule: dV/dt = π r² · dh/dt, and since r = R(1 − h/H), dr/dt = −(R/H) · dh/dt.
                  </div>
                  <div>
                    <StepNum n={5} />
                    Notice the minus sign: as the tank fills and h increases, r shrinks, so dr/dt is negative even while filling.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "cone" && coneVariant === "frustum" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: COLORS.border,
                    color: COLORS.muted,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: 8,
                  }}
                >
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    A frustum's radius blends linearly between the two ends: r = R_bottom + ((R_top − R_bottom)/H)·h.
                  </div>
                  <div>
                    <StepNum n={2} />
                    With R_top = {fmtNum(R)} {unit} and R_bottom = {fmtNum(R2)} {unit}, the slope is (R_top − R_bottom)/H = {((R - R2) / H).toFixed(3)}.
                  </div>
                  <div>
                    <StepNum n={3} />
                    Disk method (true for any tank shape): dV/dh = π r².
                  </div>
                  <div>
                    <StepNum n={4} />
                    Chain rule: dV/dt = π r² · dh/dt, and dr/dt = ((R_top − R_bottom)/H) · dh/dt.
                  </div>
                  <div>
                    <StepNum n={5} />
                    If R_top = R_bottom this reduces to the cylinder case (slope 0, dr/dt always 0); if R_bottom = 0 it reduces to the plain cone.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "cylinder" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: COLORS.border,
                    color: COLORS.muted,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: 8,
                  }}
                >
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    Cylinder volume: V = πR²h
                  </div>
                  <div>
                    <StepNum n={2} />
                    R = {fmtNum(R)} {unit} stays constant at every height, so R² is just a fixed number here — no similar triangles needed, unlike the cone.
                  </div>
                  <div>
                    <StepNum n={3} />
                    Differentiate both sides in t: dV/dt = πR² · dh/dt
                  </div>
                  <div>
                    <StepNum n={4} />
                    Since R never changes, dr/dt = 0 always — that's why the "hold constant" dropdown skips dr/dt for this shape.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "prism" && prismVariant === "box" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: COLORS.border,
                    color: COLORS.muted,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: 8,
                  }}
                >
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    Box volume: V = L·W·h
                  </div>
                  <div>
                    <StepNum n={2} />
                    L = {fmtNum(L)} {unit} and W = {fmtNum(W)} {unit} stay constant at every height — the cross-section never changes, unlike a tapered tank.
                  </div>
                  <div>
                    <StepNum n={3} />
                    Differentiate both sides in t: dV/dt = L·W · dh/dt
                  </div>
                  <div>
                    <StepNum n={4} />
                    Since L and W never change, dL/dt = dW/dt = 0 always — that's why both are grayed out in the "hold constant" dropdown for this shape.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "prism" && prismVariant === "frustum" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: COLORS.border,
                    color: COLORS.muted,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: 8,
                  }}
                >
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    L and W each blend linearly between their own top and bottom values: L(h) = L_bottom + ((L_top − L_bottom)/H)·h, and likewise for W(h).
                  </div>
                  <div>
                    <StepNum n={2} />
                    With L_top = {fmtNum(L)} {unit}, L_bottom = {fmtNum(L2)} {unit}, W_top = {fmtNum(W)} {unit}, W_bottom = {fmtNum(W2)} {unit}, the cross-section area is A(h) = L(h)·W(h) — a quadratic in h, not a constant.
                  </div>
                  <div>
                    <StepNum n={3} />
                    Disk method: dV/dh = A(h), so V(h) is a cubic in h. Unlike the circular frustum, this cubic has no clean closed-form inverse — height-from-volume is solved numerically here.
                  </div>
                  <div>
                    <StepNum n={4} />
                    Chain rule still applies term by term: dV/dt = A(h)·dh/dt, dL/dt = ((L_top − L_bottom)/H)·dh/dt, dW/dt = ((W_top − W_bottom)/H)·dh/dt.
                  </div>
                  <div>
                    <StepNum n={5} />
                    Setting L_top = L_bottom and W_top = W_bottom reduces this to the Box case; setting both bottoms to 0 reduces it to Pyramid-down.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "hourglass" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: COLORS.border,
                    color: COLORS.muted,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: 8,
                  }}
                >
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    The hourglass is two cones joined at a neck at height H/2: below the neck, radius shrinks linearly from R = {fmtNum(R)} {unit} (at h = 0) to R_n = {fmtNum(Rn)} {unit} (at h = H/2); above it, radius grows back from R_n to R.
                  </div>
                  <div>
                    <StepNum n={2} />
                    Each half is an ordinary cone/frustum, so the disk method applies separately on each: dV/dh = π r(h)², with r(h) piecewise-linear.
                  </div>
                  <div>
                    <StepNum n={3} />
                    Below the neck: dV/dt = π r² · dh/dt, and dr/dt = −((R − R_n)/(H/2))·dh/dt (radius shrinking). Above the neck, the sign flips: dr/dt = +((R − R_n)/(H/2))·dh/dt (radius growing again).
                  </div>
                  <div>
                    <StepNum n={4} />
                    Right at the neck, dr/dt jumps from negative to positive — the radius has a minimum there, so its rate of change isn't a single smooth value at that instant.
                  </div>
                  <div>
                    <StepNum n={5} />
                    Near the neck, a fixed dV/dt drives dh/dt to its largest magnitude for the whole shape, since the cross-section is at its smallest there (same "pinch" effect as a cone's apex, just not all the way to zero).
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "sphere" && sphereVariant === "bowl" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: COLORS.border,
                    color: COLORS.muted,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: 8,
                  }}
                >
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    A Bowl is the bottom half of a sphere of radius R = {fmtNum(R)} {unit}: measuring h from the rounded bottom, the water's radius satisfies r² = 2Rh − h² (a circle centered at the rim, h = R).
                  </div>
                  <div>
                    <StepNum n={2} />
                    Disk method (true for any tank shape): dV/dh = π r² = π(2Rh − h²).
                  </div>
                  <div>
                    <StepNum n={3} />
                    Integrating gives V(h) = π(Rh² − h³/3) — a cubic in h, unlike the cone's simple h³ term, so height-from-volume is solved numerically here (same situation as the rectangular frustum).
                  </div>
                  <div>
                    <StepNum n={4} />
                    Chain rule: dV/dt = π r² · dh/dt, and implicitly differentiating r² = 2Rh − h² gives 2r·dr/dt = (2R − 2h)·dh/dt, so dr/dt = ((R − h)/r)·dh/dt.
                  </div>
                  <div>
                    <StepNum n={5} />
                    At the very bottom (h → 0), r → 0, so dr/dt → ∞ for any nonzero dh/dt — the same pinch behavior as a cone's apex.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "sphere" && sphereVariant === "dome" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: COLORS.border,
                    color: COLORS.muted,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: 8,
                  }}
                >
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    A Dome is the top half of a sphere of radius R = {fmtNum(R)} {unit} sitting on a flat base: measuring h from the base, r² = R² − h² (a circle centered at the base, h = 0).
                  </div>
                  <div>
                    <StepNum n={2} />
                    Disk method: dV/dh = π r² = π(R² − h²).
                  </div>
                  <div>
                    <StepNum n={3} />
                    Integrating gives V(h) = π(R²h − h³/3) — the mirror image of the Bowl's formula, reflecting that a Dome is a Bowl turned upside down.
                  </div>
                  <div>
                    <StepNum n={4} />
                    Chain rule: dV/dt = π r² · dh/dt, and dr/dt = (−h/r) · dh/dt — negative because the radius shrinks as h (and hence the water level) rises toward the point at the top.
                  </div>
                  <div>
                    <StepNum n={5} />
                    Near the top (h → R), r → 0, so dr/dt → −∞ in magnitude for any nonzero dh/dt — the same pinch behavior as a cone's apex, just at the top instead of the bottom.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "sphere" && sphereVariant === "fullSphere" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: COLORS.border,
                    color: COLORS.muted,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: "18px",
                    marginRight: 8,
                  }}
                >
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    A Full Sphere of radius R = {fmtNum(R)} {unit} has total height 2R = {fmtNum(2 * R)} {unit}. Measuring h from the bottom point, the sphere's own equation gives r² = R² − (h − R)².
                  </div>
                  <div>
                    <StepNum n={2} />
                    Below the equator (h ≤ R) this is exactly the Bowl's profile; above it (h ≥ R) it's exactly the Dome's profile — a Full Sphere is literally a Bowl with a Dome stacked on top.
                  </div>
                  <div>
                    <StepNum n={3} />
                    Disk method: dV/dh = π r² on each half separately, giving the Bowl volume formula up to h = R, then that same fixed volume plus the Dome formula for the remainder above it.
                  </div>
                  <div>
                    <StepNum n={4} />
                    Implicit differentiation of r² = R² − (h − R)² gives dr/dt = (−(h − R)/r) · dh/dt. Below the equator this is positive (radius growing); above it, negative (radius shrinking) — the sign flips exactly at the equator.
                  </div>
                  <div>
                    <StepNum n={5} />
                    Right at the equator (h = R), dr/dt = 0 regardless of dh/dt — the radius is momentarily at its maximum, so it isn't changing at that instant. At both poles (h = 0 and h = 2R), r → 0 and dr/dt → ±∞ in magnitude, the same pinch behavior as the Bowl and Dome individually.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "trough" && troughVariant === "vshape" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: "50%", background: COLORS.border, color: COLORS.muted, fontSize: 10.5, fontWeight: 700, textAlign: "center", lineHeight: "18px", marginRight: 8 }}>
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    A trough is a constant cross-section extruded along Length = {fmtNum(W)} {unit} — filling it is a 2D cross-section problem multiplied by Length, not a solid of revolution. V-Shaped's cross-section is a triangle, point down, with top width {fmtNum(L)} {unit} and depth D = {fmtNum(troughD)} {unit}.
                  </div>
                  <div>
                    <StepNum n={2} />
                    Similar triangles (same idea as the Cone): the water's surface width w(h) scales linearly with h, w = (W_top/D)·h.
                  </div>
                  <div>
                    <StepNum n={3} />
                    "Width method" (the 2D analog of the disk method): dA/dh = w(h), where A is cross-section area. Integrating gives A(h) = (W_top/(2D))·h² — quadratic in h, so unlike the Sphere or rectangular tank, this DOES have a clean closed-form inverse.
                  </div>
                  <div>
                    <StepNum n={4} />
                    Volume is Area times the constant Length: V = A(h)·Length. Chain rule: dV/dt = w(h)·Length·dh/dt.
                  </div>
                  <div>
                    <StepNum n={5} />
                    Near the bottom point (h → 0), w → 0, so dh/dt → ∞ for any nonzero dV/dt — the same pinch behavior as a cone's apex, just in 2D.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "trough" && troughVariant === "trapezoidal" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: "50%", background: COLORS.border, color: COLORS.muted, fontSize: 10.5, fontWeight: 700, textAlign: "center", lineHeight: "18px", marginRight: 8 }}>
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    Trapezoidal's cross-section width blends linearly between a bottom width ({fmtNum(L2)} {unit}) and a top width ({fmtNum(L)} {unit}) over depth D = {fmtNum(troughD)} {unit}: w(h) = W_bottom + ((W_top − W_bottom)/D)·h.
                  </div>
                  <div>
                    <StepNum n={2} />
                    Width method: dA/dh = w(h). Integrating gives A(h) = W_bottom·h + ((W_top − W_bottom)/(2D))·h² — a quadratic in h with a clean closed-form inverse (the quadratic formula), unlike the Sphere's transcendental cousin below.
                  </div>
                  <div>
                    <StepNum n={3} />
                    Volume is Area times the constant Length = {fmtNum(W)} {unit}: V = A(h)·Length.
                  </div>
                  <div>
                    <StepNum n={4} />
                    Chain rule: dV/dt = w(h)·Length·dh/dt.
                  </div>
                  <div>
                    <StepNum n={5} />
                    Setting W_bottom = 0 reduces this exactly to the V-Shaped case; setting W_top = W_bottom (no taper) makes w(h) constant, so dh/dt is simply dV/dt divided by a fixed cross-sectional area — no pinch point anywhere.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {derivShown && shapeType === "trough" && troughVariant === "semicircular" && (
          <div style={{ fontSize: 13.5, color: COLORS.text, lineHeight: 2.1, fontVariantNumeric: "tabular-nums" }}>
            {(() => {
              const StepNum = ({ n }) => (
                <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: "50%", background: COLORS.border, color: COLORS.muted, fontSize: 10.5, fontWeight: 700, textAlign: "center", lineHeight: "18px", marginRight: 8 }}>
                  {n}
                </span>
              );
              return (
                <>
                  <div>
                    <StepNum n={1} />
                    Semicircular's cross-section is bounded by a circle of radius R = {fmtNum(R)} {unit}: the water's surface width satisfies w(h)² = (2Rh − h²)·4 — the exact same circle equation as the Sphere's Bowl, just read as a 2D chord instead of a 3D disk radius.
                  </div>
                  <div>
                    <StepNum n={2} />
                    Width method: dA/dh = w(h). Integrating w(h) = 2√(2Rh − h²) gives a genuine circular-SEGMENT area — a transcendental function involving arcsin, not a polynomial like V-Shaped or Trapezoidal.
                  </div>
                  <div>
                    <StepNum n={3} />
                    Because it's transcendental, there's no closed-form inverse for height-from-volume here — solved numerically (bisection), the same situation as the rectangular tank and the Sphere.
                  </div>
                  <div>
                    <StepNum n={4} />
                    Volume is Area times the constant Length = {fmtNum(W)} {unit}: V = A(h)·Length. Chain rule: dV/dt = w(h)·Length·dh/dt.
                  </div>
                  <div>
                    <StepNum n={5} />
                    Near the bottom point (h → 0), w → 0, so dh/dt → ∞ for any nonzero dV/dt — the same pinch behavior as the Bowl's rounded bottom. Near the top rim (h → R), w approaches its maximum of 2R and flattens out (zero slope), the same plateau the Bowl's open rim has.
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <style>{`
        .cr-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 20px;
          background: linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accent} var(--fill,50%), ${COLORS.border} var(--fill,50%), ${COLORS.border} 100%);
          outline: none;
          cursor: pointer;
        }
        .cr-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 3px solid ${COLORS.accent};
          box-shadow: 0 1px 3px rgba(60,60,90,0.25);
          cursor: pointer;
          margin-top: -6px;
        }
        .cr-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 3px solid ${COLORS.accent};
          box-shadow: 0 1px 3px rgba(60,60,90,0.25);
          cursor: pointer;
        }
        .cr-slider::-moz-range-track {
          height: 6px;
          border-radius: 20px;
          background: ${COLORS.border};
        }
      `}</style>
    </div>
  );
}

// ---------- Placeholder for future tabs ----------

function PlaceholderScenario({ name }) {
  return (
    <div
      style={{
        background: COLORS.card,
        borderRadius: 20,
        boxShadow: "0 1px 3px rgba(60,60,90,0.07)",
        padding: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 280,
      }}
    >
      <span style={{ fontSize: 32 }}>🛠️</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{name}</span>
      <span style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", maxWidth: 320 }}>
        This scenario isn't built yet — just holding a spot in the tab layout for now.
      </span>
    </div>
  );
}

// ---------- App shell ----------

export default function RelatedRatesStudio() {
  const [activeTab, setActiveTab] = useState(0);
  const [unit, setUnit] = useState("m");

  return (
    <div
      style={{
        fontFamily: FONT,
        background: COLORS.bg,
        height: "100%",
        padding: "24px 24px 0",
        boxSizing: "border-box",
        color: COLORS.text,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          borderRadius: 20,
          boxShadow: "0 4px 24px rgba(60,60,90,0.14)",
          overflow: "hidden",
          flexShrink: 0,
          background: COLORS.card,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Banner />
        <div style={{ padding: "20px 24px 32px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 0, flexWrap: "wrap", gap: 12 }}>
              {/* Notebook-style tabs (style A) */}
              <div style={{ display: "flex", gap: 4, paddingLeft: 10 }}>
                {TABS.map((name, i) => (
                  <button
                    key={name}
                    onClick={() => setActiveTab(i)}
                    style={{
                      background: activeTab === i ? COLORS.card : COLORS.tabInactive,
                      color: activeTab === i ? COLORS.accent : COLORS.muted,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "10px 10px 0 0",
                      padding: "9px 18px",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: FONT,
                      cursor: "pointer",
                      position: "relative",
                      top: 1,
                      zIndex: activeTab === i ? 2 : 1,
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: COLORS.card, borderRadius: 20, padding: 4, boxShadow: "0 1px 3px rgba(60,60,90,0.07)" }}>
                {UNITS.map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    style={{
                      border: "none",
                      borderRadius: 16,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: FONT,
                      cursor: "pointer",
                      background: unit === u ? COLORS.accent : "transparent",
                      color: unit === u ? "#FFFFFF" : COLORS.muted,
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "0 12px 12px 12px",
                padding: 20,
              }}
            >
              {activeTab === 0 ? <TankScenario unit={unit} /> : <PlaceholderScenario name={TABS[activeTab]} />}
            </div>
          </div>
        </div>
      </div>
      <PageCredit />
    </div>
  );
}

function Banner() {
  return (
    <div
      style={{
        position: "relative", overflow: "hidden", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 16, padding: "16px 28px", flexShrink: 0,
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
            Calculus I · Unit 3
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.005em" }}>Related Rates Studio</h1>
        </div>
      </div>
    </div>
  );
}

function PageCredit() {
  return (
    <div
      style={{
        marginTop: "auto", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 11, padding: "18px 20px 26px", fontSize: 13.5, color: COLORS.eyebrow,
      }}
    >
      <span
        style={{
          width: 40, height: 40, borderRadius: "50%", background: "#FFFFFF", border: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <img src="../../../assets/favicon.svg" alt="" width="28" height="28" />
      </span>
      Professor Kyle Knee · Harper College Mathematics
    </div>
  );
}
