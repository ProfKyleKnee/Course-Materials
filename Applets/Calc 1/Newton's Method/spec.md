# Newton's Method — Project Spec

_Course: Calc 1_
_Folder: Applets/Calc 1/Newton's Method/_
_Last updated: this session (backfilled — this applet predates the spec.md system)_

## Current status

All seven tabs (Intro, Free Play, Diverge, Flat Tangent, Oscillation, Wrong Root, More/Extensions) are built and match the originally agreed mockups, plus two full feedback/polish rounds on top of that. The Intro tab's tangent-line-reveal animation went through a dedicated debugging pass using an isolated standalone mockup (three real bugs found and fixed there, then ported into the real component) and Kyle confirmed it now reads correctly for all four points. The most recent round also fixed toggle styling, a pill-box sizing bug, message wording, cross-tab content alignment, and a legend placement. All automated Playwright checks are passing (46 across four suites) and every tab's content top-aligns with the Intro nav button within 1px. No open bugs or unresolved questions as of the last message — Kyle said it looks good. This spec and the current build are being handed to a fresh chat now to manage context/tokens.

## Pedagogical goal

Teach Newton's Method (root-finding via tangent-line approximation) through guided animation first, then open exploration, then targeted failure cases:
- **Intro**: a slow, guided build of the tangent → x-intercept → repeat process on one well-behaved example, so students see *how* the method works before touching anything themselves.
- **Free Play**: open sandbox — pick a preset or type any function, drag or type an initial guess, watch it converge (or not).
- **Diverge / Flat Tangent / Oscillation / Wrong Root**: four specific, real failure modes of Newton's Method, each with a locked example chosen to demonstrate that failure cleanly. The point is that Newton's Method is powerful but not infallible, and *why* it fails is itself instructive.
- **More/Extensions**: three doors to walk through if curious — Secant Method (closest to what they know), Halley's Method (one step further), Basins of Attraction (genuinely wild — the one place the applet steps into the complex plane, as a bridge to chaos theory).

## Design decisions log

- Original build: reviewed pre-existing mockup files (`intro-tab.html`, `free-play-tab.html`, `diverge-tab.html`, `flat-tangent-tab.html`, `wrong-root-tab.html`, `other-reasons-final.html`, `layout-b-icon-rail.html`) and built the full 7-tab React app to match them closely — icon rail SVGs/labels/dividers, root markers in green, x-intercepts in red (later revised — see below), black f(x) curve, "xₙ ≈ value" table format, toggle button in a third control-strip slot, presets in a third column on Free Play.
- **Recurring delivery bug, now guarded against**: the built HTML must have its JS bundle *inlined* directly into a single `<script>` tag in the HTML file — never shipped as `index.html` + a separate `bundle.js` referenced via `<script src="bundle.js">`. The two-file version works fine sitting in the sandbox but fails to load the moment it's opened as a standalone file (no sibling-file access). Always verify the *final inlined single file* loads via Playwright before delivery, not just the dev two-file build output.
- Round 1 feedback (large): table color ties to toggle state (rose while "bad" selected, blue while "good"; Diverge is always rose since it has no toggle); Diverge's explanatory note stays neutral/muted, red reserved for actual warnings/cap-out messages; static (locked-function) tabs keep non-editable pill styling — only Free Play gets input-style boxes, since giving static tabs input-chrome would falsely invite editing; xₙ/f(xₙ) readout boxes removed entirely (no clear purpose, mockups never had them); zoom/autofit buttons stacked into one column (was overlapping); scroll-wheel zoom added; Wrong Root's camera transition eased (0.7s) instead of jumping; both Wrong Root roots visually marked; Diverge's view widened to show x1–x3 before edge badges take over; Extensions page restored "Beyond Newton's Method" title and blue tier-label color; Basins of Attraction switched from a static SVG icon to a live-rendered complex-plane Newton fractal (z³−1), computed in-browser via canvas rather than a stock photo, to keep the "zero external dependencies" rule and because it's genuinely more interesting as real math.
- Basins of Attraction description text: workshopped six phrasing options via an interactive picker (all flagging the step into complex numbers, since every other tab stays on the real line). **Locked: option D** — "Push Newton's Method somewhere new: let the starting guess be a complex number instead of a real one. Color each guess by which root it lands on, and the boundary between colors is a genuine fractal — this is where a first-semester algorithm quietly connects to chaos theory."
- Round 2 feedback (detailed polish): Intro's trail color changed **red → blue** (nothing on that tab is an error, so red was the wrong signal — red/rose stays reserved for the failure tabs and warnings). Intro's example changed from x₁=1 to **x₁=4** on the same function (x²−2) so all four iterates (4, 2.25, 1.57, 1.42) stay visually distinct instead of collapsing onto the root by x₃. Diverge widened further to show x1–x5 on screen (explicit tradeoff: compresses x1–x3 closer together, inherent to a doubling sequence). Free Play's input boxes restyled to visually match the Riemann Sum applet's pill style (style only — kept the existing 3-column layout, did not switch to a full-width stacked layout). Presets fixed to stay on one line. Every tab now defaults to n=1 on load (previously some defaulted fully-revealed). **Wrong Root's "surprise" example was factually wrong** — x₁=0.6 is actually nearer to root 1 (distance 0.4) than root 0 (distance 0.6), so it converging to 1 was never actually surprising. Replaced with **x₁=0.49**, verified numerically: nearest to root 0 (distance 0.49 vs 0.51 to root 1) yet converges all the way to −1, the farthest root. Wrong Root gets a dashed green ring around the *nearest* root (computed generically via distance, not hardcoded) plus an in-graph key reading "root nearest x₁ (expected)" — the trail settling somewhere else tells the story by contrast. More page's intro paragraph moved out of its white card into plain text directly on the page background.
- Intro animation deep-dive (see Interaction & animation details below for the full timing spec): built a standalone, tunable, isolated HTML/JS mockup (outside the React app) specifically to iterate on animation feel, since Kyle doesn't have an intuitive feel for millisecond values and wanted to see/adjust live. Found and fixed three real bugs during this process — see Technical build notes.
- Final polish round: Diverge's no-toggle note now stretches wide on one line (`whiteSpace: nowrap`, no width cap) instead of being forced into a fixed-height box too short for its wrapped text. Flat Tangent's cap message is now **always present** for the bad case (previously gated on reaching n=12), reworded to "Even after 12 iterations..." (dropped "n=12" — the slider already shows the number, so restating it as "n=12" was redundant/jargony). Toggle button text reverted to **"Showing: bad guess ⇄ tap for good"** style (kept the ⇄ icon, restored the alternating green/red background — this had briefly been changed to a fixed-color "Bad guess ⇄" pill, which Kyle preferred less). All tab content bumped down (~18px top margin) so every tab's top-most card aligns with the Intro nav button's top edge, not the rail's "LEARN" group label above it — verified via bounding-box measurement, within 1px on all seven tabs. Wrong Root's legend moved from bottom-left to bottom-right.

## Interaction & animation details

### Intro tab's tangent-line reveal (the most detail-sensitive part of the whole applet)

Sequence per transition (going from a settled point x_i to the next point x_{i+1}):
1. **Dash-by-dash reveal**: a dashed connector sketches upward from (x_i, 0) to (x_i, f(x_i)), one segment at a time. Segment count is derived from actual pixel distance (`ceil(totalLen / (dashLen+gapLen))`, dashLen=gapLen=4px) — **not** a fixed count — and the per-segment stagger is `DASH_TOTAL_MS / count`, so every transition always spends the same total time on this phase regardless of how visually short or long that particular segment is. (Bug fixed here: previously either a fixed dash count or a capped max-stagger meant short transitions finished far faster than long ones, reading as "instant.")
2. Pause.
3. **Tangent line fades in** at (x_i, f(x_i)), along with its curve-point dot.
4. Pause.
5. **Next point fades in** as a plain dot at (x_{i+1}, 0), labeled x_{i+1}. This dot is *not* re-faded when its own transition later begins — its appearance here is its only fade-in.
6. Pause, then the next transition begins (or, if this was the last point x4, a longer pause then loop back to blank).

The very first point (x1) gets a one-time fade-in before any transition starts, since there's no "previous transition" to have produced it. This is the only place a true "0" state exists (nothing drawn on the graph at all) — **it is never shown as a number** on the slider or in the table; the slider/badge always read ≥1.

Locked timing (tuned live against the standalone mockup, all values in ms):
| Phase | Duration |
|---|---|
| Dot fade-in (x1 only, once) | 500 |
| Pause after dot | 400 |
| Dash reveal | 1400 (always, regardless of distance) |
| Pause before tangent | 450 |
| Tangent fade-in | 900 |
| Pause before intercept | 350 |
| Intercept (next point) fade-in | 500 |
| Pause after intercept | 500 |

Per-transition total ≈ 4100ms. Full x1→x4 cycle ≈ 13,200ms (900ms initial dot phase + 3 × 4100ms).

**Slider behavior during Play**: the slider *thumb* fills continuously, tracking real elapsed time within the current transition (via `requestAnimationFrame`, not discrete steps) — it's meant to read like it's tracking time, not jumping between integers. The numeric **badge**, however, intentionally does *not* show fractional values (no "1.4") — it only updates once a transition fully completes, since a fractional iterate isn't a real mathematical value and showing one would be more confusing than helpful. This was an explicit choice between two options Kyle tried in the mockup; the "badge holds at last integer" version won.

**Manual slider drag** always jumps instantly to a plain, fully-static state — no animation — matching how every other tab's slider works. Only pressing Play triggers the phased reveal.

**Function/example**: locked to x² − 2, x₁ = 4 (not 1 — see design log). n capped at 4 (not 8) specifically to keep the animation from feeling padded, per Kyle's original request.

**Color**: blue (accent color) throughout — not red/rose, since this tab has no failure case to signal.

### General patterns across the failure tabs (Diverge, Flat Tangent, Oscillation, Wrong Root)

- Toggle button (where present) lives in a third control-strip slot beside Function/Initial Guess, styled with alternating green/red background and reads "Showing: bad guess ⇄ tap for good" / "Showing: good guess ⇄ tap for bad".
- Toggling resets the n-slider to 1 and eases the camera to the new view over 0.7s (not an instant jump).
- Table/trail color ties to toggle state: rose while "bad" selected, blue while "good" (Diverge is always rose, no toggle).
- All four failure tabs default to n=1 on load; toggling also resets to n=1.
- Root markers are green; Wrong Root additionally gets a dashed ring + in-graph key on whichever root is *nearest* the current x₁ (computed generically by distance, works for either toggle state), so the "converged somewhere else" surprise is visually obvious by contrast.
- Zoom controls (+/−/autofit) live stacked in one column, top-right of the graph. Scroll wheel also zooms.

### Free Play

- Function and Initial Guess are editable pill inputs styled to visually match the Riemann Sum applet (3-column layout retained: Function, Initial Guess, Presets).
- Draggable guess point on the graph (open circle), synced with the typed value.
- Live risk-warning heuristics (flat tangent / diverging / oscillating) shown in a reserved-height row under the Initial Guess field so appearing/disappearing never shifts the graph.
- Table only shows rows up to the current n (no placeholder dashes) — this is the one tab (along with the failure tabs) where that differs from Intro, which always shows the full placeholder table since revealing rows is part of its narrative.

## Technical build notes

- **Stack**: React + esbuild, bundled to a single inline `<script>` inside one self-contained `index.html` — no external dependencies, no CDN references. See the delivery-bug note in the design log above; this is a recurring failure mode to guard against every time.
- **File structure** (all under `src/`):
  - `App.jsx` — icon rail nav + tab routing. Content wrapper has `marginTop: 18` to align with the Intro button (see design log).
  - `Shared.jsx` — design-system primitives: `COLORS`, `FixedReadout`, `NumberField`, `FieldCaption`, `IconRail` (exact SVG icons/labels, divider lines between nav groups), `IterationTable` (handles both "always show placeholders" mode for Intro and "only show up to current n" mode for everything else), `buildTrail`, `subscriptDigits`.
  - `Graph.jsx` — SVG graph rendering: `useCamera` hook (view state, zoom, pan, eased `animateTo` tween, `autofit`), axis ticks, curve path (always black), root markers (`RootMarkers`, supports a dashed-ring highlight + optional `RootLegend` bottom-right), trail rendering (`TrailStep`, used by every tab except Intro's front point), edge badges for off-screen iterates, and an `overlay` render-prop used by Intro for its custom phased animation.
  - `newtonMath.js` — hand-rolled recursive-descent expression parser (no external math library) for Free Play's typed functions, `LOCKED_FUNCTIONS` (exact analytic f/f′ for each locked tab), `KNOWN_ROOTS`, `nearestRootIndex` (generic distance-based lookup, used by Wrong Root's legend), `computeIterations`, `newtonStep` (epsilon-clamps near-zero derivatives), `assessRisk` (Free Play's warning heuristics).
  - `tabs/IntroTab.jsx` — the animated walkthrough; see Interaction & animation details above. Uses a local `FadeIn` component (CSS transition + `key`-forced remount) rather than SVG SMIL `<animate>` — SMIL was the root cause of one of the three animation bugs (doesn't restart on reuse, only ever plays once per DOM node).
  - `tabs/FreePlayTab.jsx` — open sandbox tab.
  - `tabs/FailureTab.jsx` — one generic component driving all four failure tabs, configured via `tabs/failureConfigs.js` (per-tab function, roots, views, toggle values, cap messages, legend flag).
  - `tabs/OtherReasonsTab.jsx` — More/Extensions tab; includes a live in-browser canvas rendering of the z³−1 Newton fractal for the Basins of Attraction thumbnail.
- **Verification**: Playwright used throughout for automated checks (value correctness against hand-validated math, DOM-level UI state, animation timing/progression) — not just visual screenshots. `validate-newton.js` (standalone Node script, ships alongside the build) independently verifies the core Newton iteration math for every locked example against hand-calculated values.
- **Known non-issues, already considered and accepted**: Diverge's widened view (to show x1–x5) compresses the earlier iterates closer together — inherent tradeoff of a doubling sequence, not a bug. Intro's table shows x1's value immediately on load even though the graph itself stays blank until Play is pressed (x1 is just the known starting guess, not a mystery — only the graph's build-up is meant to be revealed).

## Open threads / questions

None outstanding. Last exchange was Kyle confirming the animation and full rebuild looked good. If a new session picks this up, there's no pending decision waiting on him — treat the current build as the stable baseline unless he raises something new.
