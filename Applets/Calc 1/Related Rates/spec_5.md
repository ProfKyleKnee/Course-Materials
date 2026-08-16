# Related Rates Studio — Project Spec

_Course: Calc 1_
_Folder: Applets/Calc 1/Related Rates/_
_Last updated: August 15, 2026_

## Current status

Migrated into the canonical gradient-banner header/PageCredit footer pattern (see
`.claude/rules/applets.md`) and wired into `js/data.js` for the first time (Unit 3, section 4.1),
on the `RelatedRate-Wiring` branch. Only `RelatedRatesStudio()`'s outer App shell changed — the
eyebrow/title block was replaced by the shared `Banner()`, the notebook tabs and unit switcher moved
into the card body directly below the banner (same "tabs live in the white card body" convention
Curve Sketching Studio established), and the outer wrapper switched from `minHeight: "100vh"` to
`height: "100%"` per the full-viewport contract. None of `TankScenario`'s internals were touched.
Rebuilt via the same `esbuild --bundle --format=iife --jsx=automatic` recipe as Quadric Surfaces/
Curve Sketching/Newton's Method (real `import`-based source, `react@19`/`react-dom@19`), not a
hand-splice. Card tile (`tileType: 'relatedRates'`) is a new dedicated animation: a point-down cone
(the applet's own default shape) fills with the same 3D-perspective convention the real
`TankScenario` uses for every shape — a flattened rim ellipse, straight side walls tangent to it, and
an elliptical-bottomed `.rr-water-fill` path topped by its own `.rr-water-surf` ellipse, all rewritten
every frame — rather than the flat 2D triangle/polygon the tile shipped with initially. A small
`dh/dt = ` readout sits inside the tile itself (echoing the app's own Readout component) computed
from real `C / f²` cone math so it's always positive and visibly decelerates as the tank fills —
deliberately kept inside the tiny ~51px icon box rather than moved out to normal-size text next to
it, per explicit direction, even though every other applet's tile is purely visual. The card's own
`desc` text was reworded to describe related rates generally rather than the tank scenario
specifically, since three of the four tabs aren't tank problems at all — matches the other applet
cards' four-line description height.

The "Filling/Draining Tank" scenario is fully built and polished: 6 shapes across two icon-rail groups — **Vertical**: Cylinder, Box (Box/Frustum), Cone (Point down/Point up/Frustum), Hourglass, Sphere/Hemisphere (Bowl/Dome/Full Sphere); **Horizontal**: Trough (V-Shaped/Semicircular/Trapezoidal). All shapes share one physics/rendering architecture, cross-fade smoothly between each other, and every sub-variant morphs continuously within its own shape. Rate values (dV/dt, dr/dt, etc.) are now directly editable, not just slider-driven. A standalone single-file HTML export has been built and validated (opens via `file://`, no network dependencies). The other three tabs (Sliding Ladder, Shadow & Streetlamp, Two Ships Departing) are still placeholder-only and were shipped as-is, matching how this repo has wired in other partially-complete applets before. Next planned shape is **Horizontal Cylinder** (tank on its side, filling as a circular segment) — the last item to complete the Horizontal group.

## Pedagogical goal

Teaches related rates via the classic "filling/draining tank" family of problems across the full range of cross-sections a Calc 1 course covers: cones, cylinders, boxes/frustums, hourglasses, hemispheres/spheres, and troughs (V-shaped, semicircular, trapezoidal). Each shape's Derivation panel walks the disk-method (or width-method, for troughs) derivation step by step, so it doubles as a worked-example reference, not just a simulator. Built to let students (or Kyle in class) manipulate dimensions and rates directly and see the related-rates relationship play out visually and numerically at once.

## Design decisions log

- Core app (pre-dates this spec): Cone/Cylinder/Box/Hourglass built with a family-based cross-fade system (2000ms, ease-in-out-cubic, shared/eased size envelope) for switching between structurally different shapes, and continuous per-dimension easing (`useMorph4`) for switching between variants within the same shape.
- Sphere/Hemisphere added as Bowl (bottom hemisphere) / Dome (top hemisphere) / Full Sphere, sharing one icon (open bowl glyph, representing the default Bowl state, same convention as Cone's icon showing its default Point-down state). H auto-locks to R (or 2R for Full Sphere) — no independent H field for this shape.
- Sphere's three variants morph continuously into each other (not cross-fade) via a shared angle-sampled point array, since Bowl and Dome are literally the same circle read in opposite directions.
- dr/dt is offered as a hold-constant mode for Sphere despite Full Sphere's equator singularity (dr/dh = 0 there) — handled the same way as the Hourglass neck singularity (dh/dt drops to 0, footnote explains why), rather than omitting dr/dt entirely.
- Box was retrofitted with an explicit Box/Frustum two-button toggle (previously just one "Frustum" toggle button) to match Cone's pattern of always showing every variant as its own button.
- Trough added as V-Shaped / Semicircular / Trapezoidal, icon = open V with small flat rim ticks. Rendering uses an end-on isometric view (cross-section as the "front face," Length receding into the page via the same isometric technique Box already uses for its depth dimension) rather than a wide horizontal panel, so every shape keeps the same panel footprint.
- Trough's dimension fields deliberately reuse the shared fields other shapes already use (H → Depth D, locked to R for Semicircular; L → top width; L2 → bottom width, Trapezoidal only; W → Length) rather than introducing new state, following the precedent of R already being shared across Cone/Cylinder/Hourglass/Sphere.
- Trough only offers dV/dt and dh/dt as hold-constant modes (no dr/dt-equivalent for the changing surface width) — kept simple by explicit request.
- Trough gets its own fixed starting dimensions (D=3, top width=6, bottom width=2, Length=10, R=2.5) rather than the shared `DEFAULTS` object, since a trough that's 12 deep and 3 long (the tank-tuned shared defaults) looked absurd. Still fully deterministic on every shape-icon click, just tuned for trough proportions.
- All three Trough variants were later unified under one point-sampled array (same architecture as Sphere's Bowl/Dome/Full Sphere), so V-Shaped ↔ Semicircular ↔ Trapezoidal now morph smoothly into each other instead of cutting instantly.
- Clicking a shape's rail icon always resets that shape's dimensions to fixed defaults; clicking a sub-variant button (Frustum, Bowl/Dome/etc.) never resets anything, preserving whatever the user has typed. This was a deliberate fix after Sphere's auto-locked H was found silently carrying over into whatever shape came next.
- Rate values (dV/dt, dr/dt, dh/dt, etc., plus Both mode's Inflow/Outflow) are directly editable via text input, not just slider-driven. Typing a negative value auto-switches Filling ↔ Draining to match the sign typed, rather than being disallowed or requiring a separate control.
- Layout: left column (tank drawing + dimension inputs) widened to 400px max-width; right column (measurements/rates/slider) tightened slightly (smaller grid gaps and card padding) to compensate — fixes long labels like "Top Width =" squeezing their input box down to invisible.

## Interaction & animation details

- **Cross-family fade** (switching between structurally different shapes, e.g. Cone → Box): 2000ms opacity fade, ease-in-out-cubic, with the size envelope (H_px/scalePx) blending in lockstep via a **frozen snapshot** of the "from" shape's fit — captured synchronously during render, before that shape's own dimension-reset effects can overwrite the shared H/R state fitOf() reads. (Without this snapshot, the "from" size silently became identical to the "to" size, so only opacity animated — a real bug, not just a design choice, fixed this session.)
- **Within-family sub-variant morph** (e.g. Bowl → Dome, or Point-down → Frustum): a shared N+1-point array (`useMorph4`, generic — works for any array length) eases every sample point simultaneously, 1000ms ease-out-cubic, auto-pausing playback for the duration and resuming when settled.
- Trough and Sphere both reuse this exact same point-array technique for their own internal variant morphing; Trough's Semicircular profile is mathematically the same circle equation as Sphere's Bowl, just read as a 2D cross-section instead of a 3D solid of revolution — Trough's arc sampling literally reuses Sphere's Bowl-profile function.
- Isometric depth offset (Box's W, Trough's Length): fixed direction (up-and-right, `DEPTH_DIR_X=0.62, DEPTH_DIR_Y=-0.36`), magnitude capped at 70px regardless of the actual dimension's size — needed because Length is routinely 2-3x the cross-section width by design, and scaling the offset directly by the same per-unit factor as the cross-section shot the whole drawing off-canvas otherwise.
- Vertical centering: Bowl/Dome and Trough's Depth are both often much smaller than the ~250px height budget taller shapes fill, so both get centered on a shared vertical midline instead of anchored at a fixed top-left point (which left visible empty space below them).
- Play/pause, speed (0.5x/1x/2x/4x), and the h-position slider behave identically across all shapes; near-pinch-point behavior (radius/width → 0) shows "large" for dh/dt with an explanatory footnote, consistently across Cone's apex, Bowl's bottom, Hourglass's neck, and Trough's point-down variants.

## Technical build notes

- Single-file React component (`related-rates-studio.jsx`), no external deps beyond React/ReactDOM. Family-based rendering: each shape belongs to a rendering "family" (circular, box, hourglass, sphere, trough) that determines whether cross-shape switches cross-fade or continuously morph.
- Physics validated in standalone Node scripts (no UI) before any rendering code is written, every time — this caught real bugs each time it was skipped-then-added-back-in: Sphere/Trough-Semicircular's transcendental segment area was checked against an independent numeric integration (not just internal consistency) before trusting the closed-form formula.
- Trough's V-Shaped/Trapezoidal area is a clean quadratic in h (closed-form invertible via the quadratic formula) — genuinely simpler than the rectangular tank, which is cubic because it tapers in two independent directions at once. Semicircular's segment area is transcendental (arcsin-based); like Sphere, it needs bisection for height-from-volume.
- Known past bugs (all fixed, documented here in case similar patterns recur): water-fill paths need explicit start/end corner points rather than relying on sample density to approximate them (broke silently for 2-point tapers); SVG arc-based fills meeting at a seam can leave an uncovered sliver depending on which way the arc bulges (Hourglass neck) — defensive full-ellipse caps fixed both.
- Standalone export: `esbuild --bundle --minify` (React/ReactDOM resolved via local `node_modules` symlinks to this environment's global npm packages, since this sandbox has no network access for a fresh `npm install`) produces a single minified JS bundle, inlined directly into one HTML file with a `#root` div. Validated by opening the actual saved file via `file://` in headless Chromium — not just serving it locally — and scanning the bundle for any stray network-dependent URLs.
- Environment note: this sandbox doesn't have a persistent global esbuild+tsc install; esbuild has been found bundled inside `tsx`'s own dependencies (`tsx/node_modules/.bin/esbuild`) each time it's needed. Worth re-checking at the start of a new session rather than assuming it's already set up.

## Open threads / questions

- **Horizontal Cylinder** not yet built — the last shape needed to complete the Horizontal group (tank lying on its side, filling as a circular segment; physics will be closely related to Trough's Semicircular segment-area math, just oriented differently).
- Sliding Ladder, Shadow & Streetlamp, and Two Ships Departing tabs are placeholder-only — no design discussion has happened on any of them yet.
- A "Both" mode freeze was reported for Sphere specifically; it could not be reliably reproduced in isolation (stress-testing hung even on the pre-existing Cone shape, pointing to test-methodology overhead rather than a confirmed app bug). Real inefficiency found and fixed regardless (profile arrays were being reallocated every render instead of memoized), but if freezing resurfaces, it needs a live repro with exact steps rather than another blind stress test.
