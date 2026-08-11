# Quadric Surface Explorer — spec.md

*Backfilled from the pre-existing handoff doc plus this session's work. First draft — please review, especially the "Current status" and "Open threads" sections, since some detail is reconstructed from conversation rather than pulled from a running spec doc kept live throughout.*

## What this is

Interactive standalone HTML applet (Calc 3, Unit 1) for identifying quadric surfaces via cross-sections. Three tabs: **Guided**, **Free Play**, **Quiz**. Delivered as a single self-contained HTML file (no external dependencies, no sibling `bundle.js`) so it can be uploaded directly to Blackboard or shared as a link.

## Current status

Advanced / near-final. All three tabs are functionally complete and have been through several rounds of feedback. Most recently closed out:

- Banner redesigned (kicker line + restrained title weight, see Design decisions).
- Tab switching now has a sliding pill indicator and a stable-shell crossfade transition (no more full-panel snap).
- Default z-axis length now varies per shape to match each shape's actual geometry, rather than one hardcoded length for everything.
- Ellipsoid re-equationed to stretch horizontally (semi-axes x=4, y=3, z=2) and now loads as the default shape on Guided tab.
- Standard camera tilt (theta=0.541, phi=-0.065) applied to five of six shapes; Ellipsoid was the last holdout and is now aligned too.

## Design decisions (settled, not open)

**The persistent-3D + locked-view interaction model.** Clicking X/Y/Z overlays that axis's cross-section trace and slider directly on the same freely-rotatable solid — the camera never snaps or moves on axis selection. A separate "Show locked view" toggle reveals a second, non-interactive still-image panel (classic axis-aligned flat view) beside the main viewport. That toggle's on/off state persists across axis switches within a tab session, but resets on shape/tab changes. Do not reintroduce camera-snapping without checking first — it was explicitly rejected early on.

**Hyperbola cross-section traces are separate branches, never one polyline.** Handled by the shared `traceHyperbolaBranches` helper, used by Cone, Hyperboloid (1 sheet), Hyperboloid (2 sheets), and Hyperbolic Paraboloid. This helper was fixed this session (see Bugs fixed) to close a vertex gap that appeared depending on slider value — reuse it for any new hyperbola-producing shape rather than re-deriving.

**Ellipsoid equation:** `x²/16 + y²/9 + z²/4 = 1` (semi-axes x=4, y=3, z=2) — deliberately stretched horizontally rather than vertically, and deliberately non-spherical so students see what an ellipsoid actually looks like. This was flipped this session from the original `x²/4 + y²/9 + z²/16 = 1` (which stretched vertically) at the user's request. All math (mesh, cross-sections, slider ranges, displayed equation) reads from a single `ELLIPSOID_SEMI` constant, so it stays in sync automatically if changed again.

**Per-shape axis lengths.** The z-axis (and, for Ellipsoid, the x-axis too) is no longer a single global length shared by every shape — each shape's `SHAPE_DEFAULTS` entry carries its own `zAxisLength` (and `xAxisLength` where needed) so the drawn axis actually reaches the shape's true extent: Ellipsoid z→4 (matches its own semi-axis exactly), Ellipsoid x→4 (matches its stretched semi-axis), Elliptic Paraboloid and Hyperbolic Paraboloid z→6 (so the axis visibly poke past the surface's own rim, which sits at 5.76). Cone, Hyperboloid (1 sheet), and Hyperboloid (2 sheets) stay at the original 3.1. Tick-mark counts scale automatically with axis length.

**Standard camera tilt:** `theta: 0.541, phi: -0.065` — matches a reference image the user supplied of a "textbook" orientation (x toward viewer/down-left, y right, z up). Applied to Ellipsoid, Elliptic Paraboloid, Cone, Hyperboloid (1 sheet), Hyperboloid (2 sheets). Hyperbolic Paraboloid intentionally keeps its own distinct tilt (`theta: 1, phi: 0.42`) since it wasn't part of this alignment.

**Axis lines render on top of the mesh, not underneath.** This was a real bug, not a style choice: axis lines used to paint *before* the mesh polygons, so the shape's own fill silently covered them — worst for the z-axis, since it's every shape's symmetry axis and runs straight through the body. Fixed by reordering `SceneSvg` so axes/ticks/labels paint after the mesh, matching the same convention the red cross-section trace already used. Keep this ordering (mesh → axes/ticks/labels → trace curves) for any new shape.

**Header/banner pattern.** Saved to the `math-applet-style` skill for reuse across the whole applet series: gradient banner (`linear-gradient(135deg, #3B4FC2, #4A5CD6)`), small uppercase kicker line above the title ("Calculus III · Unit 1" — keep this wording consistent across future applets so the series reads as one course), title at `fontWeight: 700` (not 800 — that read as unprofessional), sliding-pill tab indicator measured live off button positions, and a stable-shell crossfade transition between tab panels (outgoing panel stays in normal flow while fading so the shell never collapses; incoming panel is measured for height only after it's actually rendered, never while hidden). Full mechanical detail is in the skill file, since this exact implementation avoided a real bug (collapsing to just the banner strip) that's easy to reintroduce if rebuilt from scratch.

**Quiz scoring counts only the first attempt**, across all four fields (surface name + three cross-sections) simultaneously — a question is correct only if everything was right on the very first "Check Answer" press with zero prior wrong picks, modeled on exam conditions. Progressive-elimination hints still run after that first press, purely for learning, but no longer affect score. Separately tracked: how often a student got every cross-section right but still misnamed the surface.

**Session-only quiz progress**, explicitly labeled as such (no backend) — resets on reload by design, not a missing feature.

**Name-confusion callout uses a threshold** (recurs ≥2 times), not a raw percentage, since 10 questions per set is too small a sample for a percentage to be meaningful. Distinct from "Trickiest Cross-Section," which does use a percentage.

**Cone & Hyperboloid Challenge mode** trims answer choices to the 3 relevant surface names and drops Parabola from cross-section options, since that trio's shared cross-section pattern is the actual conceptual hurdle in this unit.

## Bugs fixed this session

- **Hyperbola vertex gap**: `traceHyperbolaBranches` used a fixed 48-step sampling grid, so the two arms of a hyperbola cross-section stopped short of the true vertex by however much the grid missed by — anywhere from negligible to visually obvious, depending on slider value (hence it looked random/intermittent rather than consistently broken). Fixed via bisection to find the exact crossing point regardless of grid resolution.
- **Invisible/near-invisible z-axis**: axis lines were painted before the mesh, so the shape's own fill covered them. See "Axis lines render on top" above.
- **Content-transition collapse ("pillbox" bug)**: the original tab-switch implementation measured the outgoing panel's height *after* React had already set it to `display: none`, giving a height of 0 and collapsing the whole card down to just the banner before snapping back open. Fixed by keeping the outgoing panel in normal flow during its fade and measuring the incoming panel only once it's actually rendered (as an absolutely-positioned overlay, not hidden).
- **Uppercase-transform bleeding into math variables**: a recurring pattern where `text-transform: uppercase` (used for section-header styling) silently capitalized single-letter axis variables that should stay lowercase by math convention (e.g., quiz's "Cross-Section: x" label rendering as "X"). Fixed for the Quiz tab's per-axis label via a nested span with `textTransform: none`. **This is a recurring bug class, not a one-off** — grep for `textTransform.*uppercase` near any element that might contain a math variable before every delivery, the same way Unicode-escape placement gets checked.

## Open threads

- **Saddle icon**: resolved — Candidate D (thickened via image morphology to ~60px stroke at source resolution) shipped. The comparison scaffolding (`testBIcon`, duplicate rail entry) has been removed.
- **General code-review/polish pass**: still hasn't happened. Built incrementally across many sessions, verified functionally each time via Playwright, but never had a line-by-line quality pass.
- **Mobile/touch**: still unverified on an actual touch device. Pointer events are used throughout, which should mostly work, but this has never been tested for real.
- **Free Play equation parsing**: turned out to be considerably further along than an earlier version of this doc suggested — `parseEquation`/`classifyQuadric` and the full live-validation UI are genuinely built, not stubbed. What's still unconfirmed is whether it's been tested against real edge cases (degenerate equations, cylinders, equations that aren't full 3D quadrics, off-center terms) — worth a dedicated pass before calling it done.
- **Kicker text wording**: "Calculus III · Unit 1" was used throughout this session's mockups and shipped as-is — worth explicitly confirming this is the wording you want long-term, since it'll set the pattern for the rest of the applet series.
- **Animation timing**: tab-thumb slide (~320ms) and content crossfade (~250–300ms) durations were chosen during implementation, not requested at those exact numbers — worth a deliberate check now that they're live in the real app rather than just approved in the abstract via mockup.

## Reference files (from the original project, predates this doc)

- `quadric-surfaces-equation-set.md` — the 60-equation quiz bank with ground-truth cross-sections, plus the rationale for why Cone/Hyperboloid(1)/Hyperboloid(2) are cross-section-ambiguous by design.
- `quadric-surfaces-quiz-feedback.md` — the Scenario 1–4 feedback logic and exact hint wording for the quiz's progressive-elimination flow.

## Build pipeline

esbuild at `/home/claude/.npm-global/lib/node_modules/tsx/node_modules/.bin/esbuild`; React/ReactDOM symlinked from `/home/claude/.npm-global/lib/node_modules/`. Source lives as `app.jsx` (imports `quiz_bank.js` and `saddle_icon.js`), bundled with:

```
esbuild src/app.jsx --bundle --outfile=bundle.js --format=iife --jsx=automatic
```

...then inlined into the final HTML via a Python script. Source files don't persist between chat sessions on their own — this session's `app.jsx`/`quiz_bank.js`/`saddle_icon.js` were reconstructed by splitting the delivered HTML's bundle back along esbuild's original module-boundary comments, and are being saved as project files specifically so that reconstruction step doesn't have to happen again next time.

**Mandatory pre-delivery checks:**
- Grep for raw `\u00B2` / `\u2014` etc. appearing outside real JS string/template-literal context (only interpolates correctly inside actual strings).
- Grep for `textTransform.*uppercase` near anything that might render a math variable (see "Bugs fixed" above).
- Confirm single self-contained file: `grep -c "src=\"http\|bundle.js"` should return 0.
- Playwright load check for console/page errors, cycling all six shapes and all three tabs.
