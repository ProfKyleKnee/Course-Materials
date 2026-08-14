# Riemann Sum Applet — Project Spec

_Course: Calc 1_
_Folder: Applets/Calc 1/Riemann Sum/_
_Last updated: this session_

## Current status

Feature-complete and polished. Supports three techniques — Rectangles (with Left/Midpoint/Right/Random sub-modes and a continuous sample-point slider), Trapezoid, and Simpson's Rule — with draggable interval endpoints, zoom/autofit, and a fully offline standalone export for LMS upload. Most recent work was layout tuning (graph height, spacing) to fit on-screen without scrolling.

Wired into the site on the `ReimannSums-Wiring` branch (not yet merged to `main`): migrated to the canonical gradient-banner header/`PageCredit` footer pattern (see `.claude/rules/applets.md`), added to `js/data.js` as `a-c1-51` (Calculus I, section 5.1, Unit 4), and cross-listed as `a-c2-26` (Calculus II, section 2.6, Unit 2) pointing at the same shipped `riemann-sum-applet-standalone_6.html` — no second build, no second copy of the file. The banner kicker names both: "Calculus I · Unit 4 / Calculus II · Unit 2", with the `/` in its own `<span>` given horizontal margin so the two labels read as distinct rather than run-on. The card tile (`tileType: 'riemannSum'` in both `items[]` rows) is a dedicated animation, not the generic curve+dot tile — see "Card-tile animation" below. No open feature work right now; the "Design decisions log" through "Open threads" sections below are a first-draft backfill pulled from conversation history from before the wiring work — please review and correct anything I've mischaracterized.

## Card-tile animation

`tileType: 'riemannSum'` (`js/app.js`'s `rsTileSVG`/`rsStartSpin`/`rsStopSpin`, styled by `.rs-rect` in `css/styles.css`) uses the applet's own real math and default view, not decoration: f(x) = x²/4 + 1 (the first function preset) sampled with Left-endpoint rectangles (the default technique/mode) over [0, 6]. Up to 50 `<rect>` elements are always present in the tile's DOM; at rest only the first 4 are shown (a static picture, matching the generic tile's "everything visible, static" resting convention). On hover, `rsStartSpin` eases the visible rectangle count from 4 up to 50 over ~2.2s (recomputing every visible rect's x/y/width/height each frame — real geometry, not a lookup table), holds briefly at 50 so the dense, curve-hugging finish is readable, then snaps back to 4 and repeats for as long as the card stays hovered; moving away resets immediately to the static 4-rectangle frame.

## Pedagogical goal

Let students see *why* a Riemann sum approximates area under a curve, and that the approximation still works even when the sampling rule isn't applied uniformly across subintervals (the point of the Random mode). Also demonstrates the relative accuracy of rectangles vs. trapezoids vs. Simpson's Rule for the same function/interval, side by side via the error readout.

## Design decisions log

- Visual style: "Cloud Pastel," saturation level 5 — confirmed after being shown 5 font/color directions and 5 saturation levels. Indigo `#3B4FC2` primary accent, light lavender-gray `#F5F5FA` background, pill-shaped controls (20px radius), `-apple-system`/Inter font stack, no serif or heavy monospace.
- Blue-focused palette requested explicitly (an earlier orange-led version was rejected) — all technique/accent colors are now in the blue-indigo family.
- Function input, and later the interval endpoints, use a fused non-editable prefix (`f(x) =`, `a =`, `b =`) rather than a separate label above the box.
- Interval endpoints (a, b) are draggable directly on the graph's x-axis (small circle handles + label), fully synced with number inputs below — dragging and typing both update the same state, in both directions.
- Axes are static by default — dragging a/b does NOT rescale the graph. Only an explicit zoom (+/−) or Autofit action changes the view. Typing an a/b value that falls outside the current view auto-extends that axis (with 1 unit of buffer) and recomputes the y-range to fit.
- a and b cannot cross each other — enforced symmetrically (dragging or typing either one clamps against the other), not just handled one-directionally.
- Rectangle/trapezoid slider range: 1–100. Simpson's Rule capped at 20 subintervals specifically (10 parabola pairs) since Kyle expects small-n use for teaching convergence, not large-scale demos — slider is step-2, even-only while Simpson's is selected, and switching to Simpson's from an odd n auto-rounds to the nearest even value.
- Random mode: a "Random" button added alongside Left/Mid/Right. When active, the shared continuous slider becomes a **reshuffle trigger** — any drag regenerates a fresh independent random sample point per rectangle, rather than the slider position meaning anything itself. Changing rectangle count (n) also regenerates the random set (necessity, not a deliberate "reroll on n change" design choice — the old array is just the wrong length).
- Method UI restructured into a hierarchy: three top-level technique buttons (Rectangles, Trapezoid, Simpson's Rule). Only Rectangles expands into sub-buttons (Left/Mid/Right/Random) + the continuous slider; Trapezoid and Simpson's are standalone with no sub-row.
- Simpson's Rule region shading: Option A chosen (alternating opacity of one color — 0.15/0.50 split, widened from an initial 0.22/0.42 mockup for better readability) over alternating hues, to stay consistent with "one accent color per technique" elsewhere in the app. Paired with a dashed boundary line + small dot marking each seam between adjacent parabola pairs.
- Negative-number input bug fixed: number inputs (interval endpoints, axis boxes) use a local text-buffer pattern instead of `type="number"` with immediate `parseFloat(...) || 0` coercion, which was silently blocking a leading `-` from ever being typed.
- Warning label added: if a typed b-value is less than a, a small inline message appears explaining why the interval/rectangles won't render — soft rose color, not harsh red, clears automatically once valid.
- Layout iterations (several rounds of precise positioning feedback): interval a/b boxes moved from inside the graph's whitespace to the readout row itself (right-aligned, top-aligned with the Error card); checkbox relocated to bottom-align with the Rectangles/count slider; Rectangles slider explicitly pinned to grid column 2 so it lines up with the sample-point slider above it.
- Graph height tuned twice after overshooting in both directions: 480px (too tall, cut off content) → 260px (overcorrected, left a large empty gap) → settled at 420px, landing around ~880px real content height, which fits a normal browser window without scrolling.

## Interaction & animation details

- Zoom controls: small circular `+` / `−` / autofit (`⤢`) buttons stacked vertically in the top-right corner of the graph card itself (absolutely positioned over the plot). Zoom steps: ×0.8 (in) / ×1.25 (out), centered on current view.
- Sample-point marker: a dashed vertical line from the x-axis up to the curve at each rectangle's actual sample x-value, shown for both the continuous-slider modes and Random mode (using each rectangle's own random point in the latter case).
- Simpson's Rule: each parabola pair is drawn as an actual sampled quadratic curve (16 sample points via the standard equally-spaced-3-point quadratic interpolation formula), not a straight-line approximation — shaded underneath, alternating opacity per pair, with a dashed boundary + dot at each pair-to-pair seam.
- Drag behavior for a/b handles: clamped to the currently visible view window (can't drag off-screen; zoom out first for more room), and clamped against each other (can't cross).

## Technical build notes

- Two parallel deliverables are maintained from the same source: the React artifact (`riemann-sum-applet.jsx`, uses `mathjs` via `math.compile`) and a fully offline standalone export (`riemann-sum-applet-standalone.html`).
- Standalone export pipeline (rebuilt from the `.jsx` source each time, not hand-maintained separately):
  1. Strip `import` lines and the `export default` keyword from the source.
  2. Precompile JSX → plain JS via TypeScript (`tsc --jsx react --target es2019 --module none`) — critical: do NOT ship raw JSX with an in-browser Babel transformer, which was the root cause of a real blank-page bug earlier in this project.
  3. Bundle React + ReactDOM locally via esbuild (against locally installed npm packages, output as an IIFE that sets `window.React` / `window.createRoot`) rather than linking a CDN — CDN dependencies (unpkg, Google Fonts, mathjs's UMD build) were a repeated, hard-to-diagnose failure point across several rounds of debugging (wrong version paths 404ing, school network firewalls blocking package registries).
  4. Replace `mathjs` with a small hand-rolled recursive-descent expression parser (supports `+ - * / ^`, parens, implicit multiplication, correct unary-minus precedence, `sin/cos/tan/sqrt/abs/exp/log/ln`, `pi`/`e`), exposing the same `math.compile(expr).evaluate({x})` shape so the component code is identical between both versions.
  5. Result: zero external network requests, zero Claude/Anthropic branding anywhere — verified via Playwright (headless Chromium, available locally) before handing back, not just asserted.
- Verification standard going forward: after any bug report on the standalone export, actually re-verify with a real syntax checker + a real headless-browser load/interaction test before calling it fixed — confident-but-wrong fixes happened more than once before this became the standard.
- Simpson's Rule math: standard composite formula, `(dx/3)(y0 + 4y1 + y2)` per pair, summed. Confirmed correct by testing against a quadratic function, which Simpson's Rule integrates exactly — error came out to 0.0000 as expected.

## Open threads / questions

- None currently open. Flag anything I've gotten wrong above so this spec is accurate for the next session.
- The folder name (`Applets/Calc 1/Reimann Sums/`) and this file's own path keep the "Reimann" misspelling on purpose — the shipped HTML's `launchUrl` in `js/data.js` (both the Calc I and Calc II rows) and this spec's own filename all point at that exact path, so renaming the folder now would be a coordinated multi-file rename, not a typo fix. Worth doing in one dedicated pass if it's ever bothersome, not as a drive-by edit.
