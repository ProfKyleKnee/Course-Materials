# Lagrange Multipliers Applet — Project Spec

_Course: Calc 3_
_Folder: Applets/Calc 3/Lagrange Multipliers/_
_Last updated: 2026-10-08_

## Current status

Mockup 3 built (`mockup-3.html`), extending Mockup 2. All originally-open features are now built: slider snapping to tangency points, a play/loop button, hover tooltips + a dynamic summary sentence, and a toggle comparing flat 2D-projection vectors against true-3D solid vectors. Everything is still tentative/tunable — see Open threads — but there's a complete, working build for Kyle to spend hands-on time with.

Built on the `LagrangeMultipliers-TangentCurve` branch (not yet merged to `main`), on top of `LagrangeMultipliersApplet.jsx` only — `mockup-3.html` was **not** updated in parallel this round (unlike the header-migration work on other mockup-stage applets), since the JSX is already the more current/complete artifact (a port of Mockup 3) and doubling every change across both files wasn't worth it for a feature this size. Worth backfilling into the HTML mockup later if Kyle wants the two back in sync, but not done proactively here.

**Now wired into the live site** (same branch, same-day follow-up): the applet is migrated to the
canonical full-viewport/gradient-banner header (see "Header migration + site wiring" below) and has
a real `items[]` row in `js/data.js` (`id: 'a-c3-39'`, Calculus III · section 3.9, same chapter as the
existing 3.9 Lecture Guide/Notes/Worksheet/Video items for "Lagrange Multipliers") and a dedicated
`lagrangeLevel` card-tile animation — Kyle can now reach it from the real Applets grid rather than
only through a scratch build.

**A third top-level tab, "Simple Case"** (same branch, same-day follow-up #2), plus grid lines (the
mesh overlay) on by default — see "Simple Case tab + mesh-on-by-default" below.

**Simple Case tab refinements** (same branch, same-day follow-up #3): a new blue-teal-green surface
coloring (replacing an initial diverging rose/indigo scheme Kyle found didn't read well), a toggle for
the ∇f/∇g gradient vectors, and the Custom level-curve slider now on by default instead of Follow —
see "Simple Case visual + control refinements" below.

**Simple Case tab, second pass** (same branch, same-day follow-up #4): surface changed to
`f(x,y) = xy + 1`, the fixed mesh overlay no longer draws the degenerate middle level, and — matched
directly against a reference photo Kyle sent of a textbook/lecture rendering of this exact surface —
the color vocabulary is now yellow level curves / cyan constraint / red dots marking exactly where a
level curve is crossing a critical height, with a much tighter tangency tolerance than before and a
dark-halo contrast pass on every colored stroke — see "Simple Case: xy+1, precise crossing dots,
reference-matched colors" below.

**Default-view, contrast, and ordering pass** (same branch, same-day follow-up #5): Simple Case is
now the first top-level tab (and the default on load), its own default view is 3D-only with gradient
vectors off, the constraint ribbon got a dark outline for contrast, the crossing-point dots were
shrunk to stop dwarfing the point marker, the ∇g arrow got a darker gray on this tab, and the 2D
panel now draws the shared tangent line at a crossing — see "Default view, ordering, and contrast
refinements" below.

**Camera rotation and a second round of mesh/marker/layout fixes** (same branch, same-day follow-up
#6): the default 3D camera angle rotated 75° further clockwise from the previous round's value, the
fixed mesh levels now include the exact max/min heights instead of generic even spacing, the point
marker itself turns red at a max/min instead of a separate dot elsewhere (restricted to Follow mode;
Custom mode keeps the dot pool, now rebuilt to exactly match the marker's size/shape), a real
distortion bug in the 2D-only view was fixed, and the Simple Case control row was split into two —
see "Camera rotation, critical-height mesh levels, marker/dot rework, and 2D-only distortion fix"
below.

## Header migration + site wiring (2026-10-08)

Previously mockup-stage only (no shipped bundle, one-off header). Migrated and wired in response to
Kyle asking to "wire this into the site" so he could test the new tangent-curve/Gradient-as-Motion
work there directly, rather than in a throwaway build.

- **Canonical header applied** — the old plain `<h1>`/subtitle layout was replaced with the standard
  gradient banner (see [applets.md](../../../.claude/rules/applets.md#header-pattern)): "← All
  Applets" link, "Calculus III · Unit 3" kicker, "Lagrange Multipliers Explorer" title, and — since
  this applet now has a top-level tab switcher ("Explore" / "Gradient as Motion") — that switcher
  moved into the banner's right zone, same slot Quadric Surfaces' Guided/Free Play/Quiz switcher and
  Polar Graphing's mode toggle use. The descriptive tagline paragraph moved into the white card body
  below the banner (same precedent as Curve Sketching Studio's locked pedagogical tagline). The outer
  React wrapper switched from no explicit height (previously just a normal scrolling page) to the
  canonical `height: "100%", boxSizing: "border-box"` full-viewport contract, now that the shipped
  HTML loads `../../shared/applet-header.css` for the shared html/body/#root flex rules.
- **A real overflow bug, caught by testing at normal widths, not assumed:** the first pass at the
  banner's two-tab switcher used its full label, "Gradient as Motion," right next to the title —
  at the card's normal ~1200px width (and even at 1280px) this didn't fit, and the overflow was
  silently clipped by the card's own `overflow: hidden` rounding rather than wrapping or showing an
  error. Fixed by shortening the tab's on-screen label to "Motion" (with a hover tooltip spelling out
  "Gradient as Motion" in full, so the longer name isn't lost) rather than shrinking the title/kicker,
  which are both already at their canonical spec sizes and sizes other applets' banners also rely on.
- **Build**: `import`-based source (same as Quadric Surfaces/Curve Sketching/Newton's Method),
  `npm install react@19 react-dom@19 three@0.128.0` in a scratch dir, then a **production** esbuild
  bundle — `--minify --define:process.env.NODE_ENV='"production"'` — not just the bare `--bundle`
  recipe: a first pass without those flags produced an unminified ~2.2MB development bundle (React's
  dev warnings included); the production flags brought the shipped file to a three.js-dominated
  ~760KB. See [applets.md](../../../.claude/rules/applets.md#build-model) for the full recipe and why
  `three@0.128.0` specifically was kept (a verified-working pin, not a regression workaround like
  Partial Derivatives').
- **Shipped as** `lagrange-multipliers-explorer.html` (first shipped bundle for this applet — no
  version-number suffix, since there's no prior shipped version to disambiguate from).
- **Verification**: tested as a standalone scratch build first, then a *second* time served from its
  real repo path through a full local static server rooted at the repo (not just an isolated scratch
  folder), so every relative path the shipped file actually depends on — `../../shared/applet-header.css`,
  `../../../browse.html#/applets`, `../../../assets/favicon.svg` — was exercised exactly as it will be
  on GitHub Pages. Confirmed via the real `js/data.js`/`js/app.js` wiring too: the Applets grid's
  Calculus III section picked up the new card (4 applets, up from 3) with the right title/desc, the
  card is a real `<a href>` pointing at the shipped file, and navigating to that URL directly loads
  the applet with no console errors and the favicon chip/back-link both resolving correctly.
- **New card-tile animation** (`tileType: 'lagrangeLevel'` in `js/data.js`, `lgTileSVG`/`lgStartSpin`/
  `lgStopSpin` in `js/app.js`) — not the generic curve+dot tile, since this applet's whole point is a
  closed level curve brushing a fixed curve, not a point traveling along an open path. A circle
  (the level curve) grows from `r=4` to `r=58` and back on hover against a fixed diagonal line (the
  constraint); the color flips to the applet's own tangent-green (`#4E9E7C`) exactly when `r` crosses
  `LG_TANGENT_R`, the real perpendicular point-to-line distance from the circle's center — computed
  once from the same geometry the tile draws, not hand-tuned, so the flip is a genuine tangency, same
  "verify, don't eyeball" standard the applet's own tolerance constants follow. See
  [wiring.md](../../../.claude/rules/wiring.md#card-tile-hover-animation) for the general pattern this
  follows.

## Simple Case tab + mesh-on-by-default (2026-10-08)

Kyle's direct feedback after trying the tangent-level-curve/Gradient-as-Motion work: the two-Gaussian-
bump surface's terrain makes the level curves hard to read, and could the grid lines be on by default
so it's easier to see what they're doing. Two changes, both in `LagrangeMultipliersApplet.jsx`:

- **`meshVisible` now defaults to `true`** (was `false`) — the only change needed for the mesh-overlay
  request. Applies to the Explore tab's two-bump surface; the new Simple Case tab below defaults its
  own mesh on too.
- **A third banner tab, "Simple"** — a second, independent surface `f(x,y) = xy` (a saddle) with one
  fixed circular constraint `x² + y² = 8`, the classic "maximize/minimize xy on a circle" textbook
  example. Chosen specifically because it has **exact, checkable critical points** at `(±2, ±2)` with
  `f = ±4` — unlike the bump surface's numerically-found ones, a student (or Kyle) can verify these by
  hand, and the build was in fact spot-verified against them live: snapping the slider landed on
  `x=2.00, y=2.00, z=4.00, ∠(∇f,∇g)=0.0°` exactly, not just approximately.
  - Same feature set as Explore (3D/2D/Both view, mesh toggle, Level Follow/Custom, slider + snap +
    play, gradient readout + tangency signal) against this surface and its one fixed path — no
    path-tabs row, since there's nothing to switch between. Defaults differ from Explore on purpose,
    since the whole point of this tab is to make the level-curve behavior immediately visible rather
    than something the student has to opt into: view mode defaults to **Both** (not 3D-only) and Level
    mode defaults to **Follow** (not Off).
  - Implementation kept as a fully independent set of `sc`-prefixed pure functions and its own
    `SimpleCaseTabBody` component (own state, own refs, own mount-once 3D/2D effects — same
    self-contained-tab pattern `MotionTabBody` already established) rather than generalizing
    `tangencyInfoFor`/`computeCriticalPoints`/`marchingSquaresAtLevel`/the 3D effect to take a surface
    parameter. This is a second, simpler illustration of the same idea, not a multi-surface framework
    — threading a new parameter through code the Explore/Motion tabs already depend on would have
    been a bigger, riskier change than duplicating ~60 lines of already-correct math. Two small pieces
    *were* hoisted and shared though, since they're genuinely surface-agnostic: `makeArrowIconTexture`/
    `makeArrowSprite`/`updateArrowRotation` (pure Three.js helpers, no closure over either effect's
    scene state) moved out of the Explore 3D effect to module scope, and `drawArrow2D` gained a
    `toScreen` parameter (was hardcoded to the Explore/Motion tabs' shared `worldToScreen`) so the new
    tab's differently-sized domain (`SC_DOMAIN=7` vs `DOMAIN=6`, see below) could pass its own
    `scWorldToScreen` instead of a third near-duplicate arrow-drawing function. Verified these
    extractions didn't regress Explore/Motion by re-testing both after the refactor, not just assuming
    a mechanical extraction was safe.
  - **A real framing bug found and fixed by actually looking at it, not assumed correct from the
    numbers alone:** `z=xy` swings roughly `±(domain/2)²` over a square domain — much taller relative
    to its footprint than the bump surface's gentle rise — so the first version's camera (reusing
    Explore's `radius: DOMAIN*1.05`-style framing) showed only a small corner of the surface, most of
    the panel empty. Fixed two ways together: the 3D mesh's own Y-coordinate is visually compressed by
    a dedicated `SC_Z_SCALE = 0.3` constant (`scY(h) = h * SC_Z_SCALE`, applied only where a height
    becomes a Three.js Y position — the readout panel, level logic, and contour computation all still
    use the true unscaled `scHeight`), and the camera was pulled back and flattened (`radius:
    SC_DOMAIN*2.0`, `phi: π*0.26` vs. Explore's `π*0.32`) until the whole saddle visibly fit in frame.
    Both values are tentative/tune-by-eye, same as every other camera/visual constant in this file.
  - **A second real contrast bug, also caught visually:** the color ramp's first pass normalized
    against the surface's true full range (`±scMaxH ≈ ±12.25`, reached only at the domain's far
    corners), which washed the circle's own neighborhood — where `|xy|` tops out at 4, the only region
    that actually matters here — out to a near-white haze, and *also* made the white constraint ribbon
    nearly invisible against it (same white-on-pale problem as the Motion tab's halo fix, different
    cause). Fixed by clamping the color mapping to `±SC_COLOR_RANGE = 6` instead of the true range —
    color now saturates fully a bit past the critical points, so the pedagogically relevant region
    reads with real contrast, while the level-value sliders still range over the true `scMinH..scMaxH`
    (unaffected, since that's a separate normalization from color).
  - **Original coloring: a diverging ramp**, not the bump surface's sequential one — `z=xy` is
    genuinely signed (a saddle, not a bump), so `scHeightColor` ran rose (negative) → pale (zero) →
    indigo (positive) instead of low→high on one hue family. **Superseded the same day** — see "Simple
    Case visual + control refinements" below; kept here only as a record of what the first pass tried.
  - Circle radius fixed at `x²+y²=8` (not an adjustable path, unlike Explore's four presets) — keeping
    this tab to exactly one constraint was a deliberate scope decision, not an oversight; the point is
    a simpler illustration, not a second full exploration surface.

## Simple Case visual + control refinements (2026-10-08, same day)

Kyle's direct feedback after trying the Simple Case tab: the diverging rose/indigo coloring didn't
read well, with a reference screenshot pointing at a 3D graphing tool's own blue-to-green terrain-
style surface coloring instead. Also asked for a way to hide the gradient vectors, and for the
Custom-mode level-curve slider (not Follow) to be the tab's main interaction, matching how he'd
described wanting to "drag level curves around" with a slider. Three changes, all scoped to the
Simple Case tab only (Explore/Motion untouched and re-verified unaffected):

- **New sequential blue → teal → green color ramp**, replacing the diverging rose/pale/indigo one.
  Matches Kyle's reference image — a smooth low-to-high terrain gradient rather than a sign-based
  split. Three explicit color stops (`#1E3C8C` → `#14A39E` → `#4CC24E`) rather than a straight
  two-stop lerp, since blue-straight-to-green alone looked muddy through the middle on a first test —
  the teal midpoint keeps the transition reading as intentional. Still uses the same `SC_COLOR_RANGE`
  clamping (±6, not the true ±12.25) established in the previous pass, for the same reason: without
  it the circle's own neighborhood — the only region that matters here — washes out toward one end of
  the ramp instead of spanning it.
- **Gradient-vector toggle** — a new button (arrow icon) next to the mesh toggle, `vectorsVisible`
  state (default **on**), wired to both panels: the 3D sprites' own `.visible` flag (new
  `setVectorsVisible` on the effect's exposed API, alongside `setMeshVisible`) and a guard around the
  2D panel's two `drawArrow2D` calls. Scoped to this tab only — Explore's arrows aren't optional,
  since removing them there wasn't asked for and they're more load-bearing to that tab's existing
  narrative (readout panel, legend, summary text all assume they're visible).
- **Level mode now defaults to `'custom'`**, not `'follow'` — so the independently-draggable `c`
  slider is the very first thing visible on this tab, rather than something a student has to notice
  the toggle and switch to. Follow is still available as the other option, unchanged.

## Simple Case: xy+1, precise crossing dots, reference-matched colors (2026-10-08, same day)

Kyle's next round of feedback, with a reference photo of a textbook/lecture-slide 3D rendering of
this exact surface (yellow level curves labeled `z = 2`, a cyan constraint ellipse lying on the
surface, small red dots marking the two points where it's tangent to a level curve) to model the
colors on directly, plus a correctness complaint: the green "tangent" highlight on the live level
curve was triggering well before the curve was actually at a min/max — misleadingly broad, not just
cosmetically off.

- **Surface changed to `f(x,y) = xy + 1`** — `scHeight(u,v) = u*v + 1`; `scGradF` is unchanged, since
  the gradient of a constant shift is zero. This moves the critical values from the previous
  `±4` to `5` (at `(2,2)` and `(-2,-2)`) and `-3` (at `(2,-2)` and `(-2,2)`) — still exact, hand-
  checkable numbers, just no longer symmetric about zero. Every piece of UI text that said "`xy`"
  (subtitle, banner-tab tooltip, the `z =` readout label and its tooltip) now says "`xy + 1`" / "`xy+1`".
  Default `customC` bumped from `3` to `4` to stay a representative mid-range value under the new `5`.
- **The fixed mesh overlay no longer draws the degenerate middle level.** Of the 7 evenly-spaced
  mesh levels, the exact middle one (index 4 of 7, at fraction 0.5) always lands at
  `(scMinH+scMaxH)/2` — and since this surface is just `xy` plus a constant, that midpoint is always
  exactly the degenerate `xy=0` level: not a real hyperbola, just its own asymptotes (the coordinate
  axes) crossing in an "X" that reads as a rendering glitch, not a curve. `SC_DEGENERATE_LEVEL_IDX`
  is skipped in the generation loop — 6 real levels instead of 7, not a new spacing scheme.
- **New three-color vocabulary, matched to the reference photo**: `SC_LEVEL_COLOR` (`#FFC400`,
  vivid yellow) for both the fixed mesh overlay and the live draggable level curve;
  `SC_CONSTRAINT_COLOR` (`#22D3EE`, cyan) for the circle, **replacing the red** the previous pass had
  used there (that red is now reserved for the crossing dots below — the reference photo's own
  vocabulary is yellow/cyan/red, not yellow/red). The live level curve still turns green
  (`#4E9E7C`, unchanged) when tangent, on top of its usual yellow.
- **A real, not hypothetical, precision bug fixed**: `SC_LEVEL_HEIGHT_TOL` was `(scMaxH-scMinH)*0.02`
  (≈0.49 height units) — generous enough that the live curve's green highlight was visibly "on" for a
  wide stretch of the `c` slider well before the curve was actually at a critical height, which Kyle
  caught by dragging it himself and noticing the green state didn't line up with the curve actually
  touching a min/max. Replaced with a fixed, tight `0.15` — reasoned about directly as "within 0.15 of
  the known critical heights 5 and -3," not as a percentage of anything — tight enough that the
  slider's own `(scMaxH-scMinH)/400 ≈ 0.06`-per-step granularity gives only a couple of steps of
  "tangent" window, not a wide plateau.
- **New: small red dots at the exact crossing point(s).** `scCriticalPointsNearHeight(c)` returns
  every critical point within `SC_LEVEL_HEIGHT_TOL` of the live curve's current height — plural on
  purpose, since two critical points share each height here (`(2,2)` and `(-2,-2)` both sit at `z=5`),
  so a single "nearest point" wouldn't mark every place the curve is genuinely touching. Rendered as
  small white-ringed red dots: in 3D, a pool of up to 4 billboarded sprites (`makeDotTexture`/
  `makeDotSprite`, hoisted alongside the arrow-sprite helpers since they're built the same way —
  `sizeAttenuation:false`, `depthTest:false`, so they stay fixed-size and always-on-top like the
  arrows); in 2D, filled circles drawn directly in the canvas. Both read the same
  `scCriticalPointsNearHeight` list, so the 2D and 3D panels, and the green highlight, all agree on
  exactly when a crossing is "happening" — verified live by stepping the `c` slider one tick at a
  time across a critical height and confirming the dots and the green state appeared and disappeared
  together, not independently.
- **Contrast pass**: a soft dark canvas-shadow halo (`rgba(10,20,40,0.55)`, blur 3) now sits behind
  every 2D-panel level/constraint stroke — the mesh, the constraint circle, and the live level curve
  all draw inside one `ctx.save()`/`shadowColor`/`shadowBlur`/`ctx.restore()` block. Added because
  yellow-on-green and cyan-on-teal are both real risks with this surface's own blue-teal-green color
  ramp (not just a hypothetical one raised without checking) — same halo technique already proven on
  the Motion tab's vectors, applied here for the analogous reason. Not applied to the 3D panel's
  strokes (`LineBasicMaterial` doesn't have an equivalent cheap option); the color choices there were
  checked by eye against the actual ramp and read fine, but flagged in Open threads below in case a
  specific camera angle/lighting combination ever makes a 3D stroke hard to see.

## Default view, ordering, and contrast refinements (2026-10-08, same day)

Kyle's next round of direct feedback, after spending hands-on time with the Simple Case tab: lead
with the simple example rather than Explore, tighten up the default view, and clean up a few
contrast/sizing issues he'd noticed. All changes scoped to `LagrangeMultipliersApplet.jsx`; the
shipped `lagrange-multipliers-explorer.html` was rebuilt from it the same way as the original
wiring pass (`npm install react@19 react-dom@19 three@0.128.0` in a scratch dir, then
`esbuild --bundle --jsx=automatic --format=iife --minify --define:process.env.NODE_ENV='"production"'`,
spliced into the existing shell), and the result was verified hands-on through a full local static
server rooted at the repo (not just a scratch build) — stepped through all three tabs, confirmed no
console errors, and specifically exercised the Simple tab's vectors toggle, the `c` slider at a
critical height, and the Explore/Motion tabs to confirm the tab-scoped changes below didn't leak
into them.

- **"Simple" is now the first tab, and the default on load.** `TOP_TAB_IDS` reordered to
  `['simple', 'explore', 'motion']` (was `['explore', 'motion', 'simple']` — the banner's tab row
  renders in this order automatically) and `topTab`'s initial state changed from `'explore'` to
  `'simple'`, since the xy+1 saddle with its one fixed circle is the easier entry point Kyle wants
  students to land on first, before the harder two-bump Explore surface.
- **Simple Case tab's own default view tightened**: `viewMode` now starts `'3d'` (was `'both'`) and
  `vectorsVisible` now starts `false` (was `true`) — matching a reference screenshot Kyle sent of the
  single-panel, no-arrows look he wants on first load. The 2D panel and the gradient vectors are both
  still one click away (the view toggle and the vectors-toggle button), nothing was removed, just the
  defaults.
- **Crossing-point red dots shrunk.** The 3D crossing dots reused the gradient-arrow sprites' own
  `0.085` fixed-screen-size scale, which — since the point marker is an ordinary world-space disc that
  shrinks with camera distance, not a `sizeAttenuation:false` sprite like the dots/arrows — made them
  read as oversized blobs next to the marker, not matching peers the way they were meant to. New
  `SC_CRIT_DOT_SIZE_3D = 0.035` constant, about 40% of the old size; tentative, tune by eye like every
  other fixed-sprite-size constant in this file.
- **∇g arrow given a darker, more contrasting gray on this tab only.** The shared `#8A8AA3` gray
  (used file-wide as both the muted-text color and the Explore/Motion tabs' own ∇g color) read as
  low-contrast against this tab's blue-teal-green surface specifically. Rather than touch the shared
  constant — which would also recolor labels and the other two tabs' arrows, not asked for — a new
  `SC_GG_COLOR` / `SC_GG_COLOR_2D` pair (`#5B5B74`) was added and wired into just the Simple Case
  tab's 3D arrow, 2D arrow, and legend swatch. Explore/Motion's own ∇g arrows are untouched and
  reuse the original color.
- **Constraint ribbon given a dark outline for contrast.** The flat cyan ribbon (`MeshBasicMaterial`,
  no lighting) could blend into the surface's own teal midtones with nothing to anchor its edges.
  `buildRibbonMesh(width, yOffset, color)` factors out what used to be inline one-shot ribbon-building
  code so it can be called twice: a wider (`0.16` vs. the original `0.09`), lower (`yOffset 0.046` vs.
  `0.05`), dark-navy (`SC_CONSTRAINT_OUTLINE_COLOR = #0A2540`) mesh first, then the original cyan
  ribbon on top — the dark mesh peeks out around the cyan one's edges as a stroke. The 2D panel's
  ribbon already had the dark-halo contrast pass from the previous round and wasn't touched again.
- **New: the shared tangent line at a crossing point, drawn in the 2D panel.** Kyle's own framing —
  a concrete lead-in to *why* ∇f and ∇g end up parallel at a critical point, not just a readout saying
  they are. At a true crossing, the circle and the live level curve touch without crossing, so they
  share one common tangent line there; it's drawn as a short dashed construction line through the
  point, in the perpendicular direction to ∇f (the same direction ∇g's own tangent takes there, since
  that's what tangency means), reusing the same `scCriticalPointsNearHeight` list the red dots and
  green highlight already agree on. Deliberately **not** part of the yellow/cyan/red/green vocabulary
  established in the previous round — a flat, neutral dark gray (`SC_TANGENT_LINE_COLOR_2D =
  '#3A3A3C'`, reusing the point marker's own dot color) reads as a construction line illustrating a
  fact *about* the two curves, not a fifth semantic color. Drawn with a light halo (not the
  surrounding block's own dark halo, which would do nothing for a line that's already dark) so it
  stays legible against the surface underneath it. 3D panel not touched — Kyle specifically asked for
  this "in the 2D image," and the existing "no contrast-halo technique in 3D" limitation (see Open
  threads) would apply here too. A matching sentence was added to the tab's explanatory note below the
  controls, naming what the dashed line is and tying it back to the parallel-gradients fact.
- **Verification note on the gradient-vector clipping near the panel edge**: while testing the ∇g
  arrow's new contrast color, noticed the fixed-length 2D arrows can run off the right edge of the 2D
  panel's canvas when the point sits near the domain boundary (visible at `t=0`, the circle's
  rightmost point) — this is pre-existing fixed-arrow-length behavior inherited from the Explore tab's
  own convention (see "Arrow visual length vs. true magnitude" in Open threads), not something this
  pass changed or was asked to fix; flagging here since it was directly observed while verifying the
  color change, not just a hypothetical.
- **3D starting camera angle nudged further clockwise** (`theta: Math.PI * 0.30`, was `0.28`) — Kyle's
  direct follow-up after seeing the default view, confirmed via an `AskUserQuestion` exchange that
  "clockwise as seen from above" was the intended direction (not a tilt or counter-clockwise swing).
  This surface's azimuthal framing turned out to be unusually sensitive — a handful of larger trial
  values (`0.31`, `0.34`, `0.43`, and `0.15` the other direction) were tried and rejected live in the
  browser first, each one swinging which of the saddle's two "wings" dominates the frame rather than
  opening the view up gradually, since the saddle only reads as symmetric right at the ~45°-ish
  direction the original `0.28` was already close to. `0.30` (a ~3.6° nudge) was the smallest change
  that read as a real, deliberate rotation without losing the second wing or unbalancing the
  composition — tentative, same "flag and tune by eye" treatment as every other camera constant in
  this file; revisit if Kyle wants it rotated further still.

## Camera rotation, critical-height mesh levels, marker/dot rework, and 2D-only distortion fix (2026-10-08, same day)

Kyle's next round of direct feedback, after the default-view/ordering/contrast pass above. Verified
the same way as that round — full production esbuild rebuild (`three@0.128.0`, minified,
`NODE_ENV=production`), spliced into the shipped HTML, served through a local static server rooted
at the repo, and driven live through the in-app browser: stepped through 3D/Both/2D views, Follow and
Custom level modes, the position and `c` sliders, and both Explore/Motion tabs to confirm nothing
leaked into them.

- **Camera rotated another 75° clockwise.** Kyle's first ask ("rotate about 75 degrees clockwise")
  was unambiguous on amount but not on which rotational sense "clockwise" meant for an orbiting
  camera, so this was confirmed with a direct `AskUserQuestion` exchange rather than guessed — he
  confirmed clockwise as seen from a bird's-eye view looking straight down. `camState.theta` moved
  from the previous round's `Math.PI * 0.30` to `Math.PI * 0.7167` (0.30 + 75°). Unlike the small
  nudge in the previous round, 75° is a large enough swing to land well clear of the saddle's
  sensitive near-symmetric zone.
- **Fixed mesh levels now include the actual critical heights.** Kyle's request: he wanted a level
  curve that already visibly passes through the max/min locations, not just evenly-spaced levels
  that happen to land nearby (the old 6-of-7-evenly-spaced scheme didn't). The level list is now
  built from `scComputeCriticalPoints()` itself (not hardcoded 5/-3, so this stays correct if the
  surface or critical points ever change): the two real critical heights are included exactly, plus
  four more placed symmetrically around them — one further out past each critical height toward the
  domain's true min/max, and one further in on each side, straddling (never touching) the degenerate
  `xy=0` height the same way the old scheme skipped it. `SC_LEVELS`/`SC_DEGENERATE_LEVEL_IDX` were
  removed as no longer meaningful once level count and spacing are driven by the critical heights
  rather than a fixed even-division formula.
- **The point marker itself turns red at a max/min, replacing the crossing-dot pool in Follow mode.**
  Kyle's complaint about the previous behavior: dragging the position slider lit up a red dot at
  *every* critical point sharing the current height (e.g. both (2,2) and (-2,-2) at z=5), when only
  the point actually under the slider should be highlighted. Fixed by having `applyPointState` (3D)
  and the 2D marker draw both recolor the point's own dot red (`SC_CRIT_DOT_COLOR`) exactly when
  `info.isTangent`, unconditional on Level mode — and by gating the old crossing-dot pool to Custom
  mode only (`setLiveLevel`'s new `showDots` parameter, `levelModeRef.current === 'custom'` in the 2D
  effect). Custom mode legitimately keeps the pool, since its height is independent of the point and
  can validly touch a critical point the slider isn't anywhere near — that's a different situation
  from Follow, where the dot and the point are always the same thing.
- **Crossing dots rebuilt to exactly match the point marker's size and shape**, per Kyle's explicit
  ask. The old pool used `sizeAttenuation:false` sprites (fixed screen size regardless of zoom) with
  a hand-tuned scale constant that only approximately matched the marker, which is ordinary
  world-space geometry that shrinks/grows with camera distance. New `makeMarkerDiscGroup(dotColor)`
  helper builds the literal same construction as the marker (0.16 ring + 0.095 dot `CircleGeometry`
  meshes, billboarded via a per-frame quaternion copy from the camera, same as the marker already
  does) parameterized only by dot color — used for both the marker itself and the 4-slot dot pool, so
  the two are guaranteed to read as the same size/shape at every zoom level, not just the default
  one. The now-unused sprite-texture helpers (`makeDotTexture`/`makeDotSprite`) and the
  `SC_CRIT_DOT_SIZE_3D` tuning constant were removed along with the old pool. The 2D pool's white
  ring radius was also bumped from `7.5` to `8` to exactly match the 2D marker's own ring, not just
  approximately.
- **A real, not hypothetical, distortion bug in the 2D-only view, fixed.** Kyle's report: "when the 2D
  version only is displayed it is distorted." Root cause confirmed by inspecting the panel sizing:
  the 2D canvas's CSS height is a fixed `420px` while its width is whatever the panel's flex layout
  gives it — `100%` of the card in 2D-only mode vs. roughly half in Both mode — and `scWorldToScreen`
  mapped world `u`/`v` to screen `x`/`y` using that canvas's full (non-square) `w`/`h` independently,
  stretching the circle into a visibly flattened ellipse whenever the canvas aspect ratio departed
  from square. Fixed with a new `scLetterbox(w, h)` helper: one uniform scale from `Math.min(w, h)`,
  centered with blank margin on the long axis, used both by `scWorldToScreen` (per-point) and the
  heatmap background's own `drawImage` call (previously stretched to the full canvas the same way).
  Verified live in the 2D-only view specifically, since that's the case that actually exposes a
  non-square canvas; Both and 3D-only were unaffected before and remain so. The Explore tab's own
  `worldToScreen` has the same latent bug (not fixed here, out of scope for this pass — see Open
  threads).
- **Simple Case's control row split into two**, per Kyle's go-ahead on this session's earlier
  brainstormed suggestion. Row 1 (`controlsRow`) now holds only the display-option toggles — 3D/Both/
  2D, the mesh button, the vectors button. Row 2 is a new `levelSection` block with its own
  "LEVEL CURVE" uppercase label (matching the existing `panelLabel` convention used elsewhere, e.g.
  "POSITION ALONG CIRCLE") directly above the stage, holding just the Off/Follow/Custom toggle — since
  that's the tab's actual interaction, not a display setting, and previously sat shoulder-to-shoulder
  with the icon buttons with nothing to distinguish its different role. Scoped to Simple Case only;
  Explore's own single-row layout (which also has mesh + Level-mode controls, plus its own path-tabs
  row) was left untouched since the request and the brainstorm were both specific to Simple Case.

## Rotation, denser evenly-spaced mesh, standing max/min markers, point/slider visibility, three-section controls (2026-10-08, same day)

Kyle's next round, verified live the same way as the rounds above (production esbuild rebuild,
spliced into the shipped HTML, served locally, driven through the in-app browser).

- **Camera rotated another 15° clockwise** — `camState.theta` now `Math.PI * 0.8` (was `0.7167`).
- **Mesh levels rebuilt again: evenly spaced, not just critical-anchored.** Kyle's follow-up
  (referencing the same chalkboard reference photo) was that he wanted *more* level curves and wanted
  them evenly spaced, not just the 6 critical-anchored-but-irregularly-spaced levels from the previous
  round. New scheme: step = `(scCritHigh - scCritLow) / 4`, grid anchored at the critical heights and
  extended outward with the same step to the domain's true min/max — evenly spaced *and* still lands
  exactly on both critical heights (mathematically guaranteed compatible here, since the degenerate
  `xy=0` height is always exactly the midpoint between the two critical heights on this surface), still
  skipping only that one degenerate level. ~12 real curves now, up from 6.
  **Real bug hit and fixed during this change, not hypothetical:** the first version deduped critical
  heights with `new Set()` before computing the step, which treated (2,2)/(-2,-2)'s two independently
  floating-point-refined copies of z=5 as different values, collapsed the computed `scCritLow`/
  `scCritHigh` onto two nearly-identical numbers, drove the mesh step to ~0, and sent the
  outward-extension loop into a near-infinite run — a real `Uncaught RangeError: Invalid array length`
  in the browser console, caught by actually loading the build, not assumed safe from reading the diff.
  Fixed by using `Math.min`/`Math.max` over every critical point's height instead of deduping by exact
  value; also added a defensive `scMeshStep > 1e-3` guard around the loops as a second line of defense.
- **Standing max/min markers** — a new always-available pair of toggles ("Max"/"Min", independent of
  each other and of `levelMode`/`sliderT` entirely) that show a red marker, in the same
  `makeMarkerDiscGroup` style as every other critical-point marker in this tab, at the known max and/or
  min critical point(s). Kyle's direct ask: a way to just point at "the maxes" or "the mins" while
  talking, without first having to drive the slider or Custom level curve there. Built once at mount in
  3D (`scMaxDiscs`/`scMinDiscs`, billboarded each frame same as the other disc pools); drawn directly
  from `scComputeCriticalPoints()` filtered by `kind` in the 2D effect.
- **Point and slider visibility toggles**, independent of each other and of the vectors toggle —
  `showPoint`/`showSlider` state, new circular icon buttons (filled-dot icon for the point, line+dot
  "slider" icon for the slider). Hiding the point hides the marker in both panels (gated in
  `applyPointState`/the 2D marker draw via `showPointRef`); hiding the slider hides the "Position Along
  Circle" label + slider row specifically (not the Custom `c` slider or the readout panel, which are
  separate concerns). The whole `infoPanel` card is suppressed entirely when both the slider is hidden
  and `levelMode === 'off'`, so hiding everything doesn't leave a blank white box on screen.
- **Controls reorganized into three labeled sections** (Kyle's go-ahead on this session's earlier
  brainstormed suggestion, now carried further): **View** (3D/Both/2D only), **Level Curve** (the
  Off/Follow/Custom toggle, the mesh button, and the new Max/Min pills — everything "about the level
  curves"), and **Point & Gradient** (show/hide point, show/hide slider, and the ∇f/∇g vectors toggle —
  everything about the walking point). Chosen name for the third section after Kyle asked for naming
  input; flagged as easy to rename if it doesn't stick. New `smallPillBtn`/`smallPillBtnActive` styles
  added for the standalone (non-mutually-exclusive) Max/Min toggle buttons, distinct from the existing
  3-way `toggle`/`toggleBtn` sliding-highlight component used for View and Level Curve.

## Tangent level curve + "Gradient as Motion" tab (2026-10-08)

Two new features added to `LagrangeMultipliersApplet.jsx`, both requested directly by Kyle and designed via an `AskUserQuestion` exchange rather than guessed at — he picked the fuller option on both axes:

- **Level curve interaction model: both a "Follow" and a "Custom" mode, as a toggle** (not just one). A new 3-way toggle next to the mesh button — **Level: Off / Follow / Custom** — shows a single live level curve of f, in both the 2D panel and lifted onto the 3D surface, colored indigo normally and sage green (`#4E9E7C`, the existing tangent color) exactly when it's tangent to the constraint:
  - **Follow** ties the level curve's height to the current point (the existing position slider) — no new control, it's just "what level curve already passes through here," updating live as the point moves.
  - **Custom** gives the level curve its own independent height slider (`c = `, ranging `[minH, maxH]`), decoupled from the point — the "balloon" framing Kyle described ("move level curves on the surface until the point where the level curve just brushes up against the constraint curve"). The point/marker/gradient-arrow readout keeps tracking the position slider as before; the level curve is a second, independent thing on screen.
  - Both modes reuse the *exact same* critical points already computed for slider-snapping — tangency for Follow is just `info.isTangent` (the existing angle-based signal); tangency for Custom is a new `isLevelTangentAtHeight(pathId, c)`, which checks `c` against the cached critical *heights* (new `height` field added to each critical point) within `LEVEL_HEIGHT_TOL` (2% of the surface's total height range, tentative — same "flag and tune by eye" treatment as every other tolerance constant in this file).
  - Implementation-wise, the fixed-7-level mesh overlay's marching-squares cell loop was generalized into `marchingSquaresAtLevel(thresh)` over a module-level `heightGrid`, so the live curve (recomputed at whatever height is current — every slider tick in Follow mode, every drag tick in Custom mode) and the original mesh toggle now share one code path instead of two.
  - Verified hands-on in a scratch esbuild/react/three.js@0.128.0 build (see "Verification" below): Follow mode's level curve visibly shrinks/grows with the point and turns green exactly at the snap points; Custom mode's level curve genuinely behaves like the textbook "balloon" — at low `c` it's two separate loops (one per Gaussian bump), shrinking as `c` rises, and at `c ≈ 1.85` on the circle path one loop shrinks to a point that just kisses the white constraint circle and turns green, matching the known critical height (computed independently via a throwaway Node script: ≈1.79) within the tolerance band.

- **New "Gradient as Motion" top-level tab** — a second tab alongside the renamed "Explore" tab (the toggle lives right under the title/subtitle). A 4-step guided walkthrough (full standalone walkthrough, per Kyle's choice, not just a bare graph) connecting the tangential component of ∇f along the constraint's own direction of travel to the Lagrange condition:
  1. **Direction of travel** — just the path + point + a dashed dual-ended tangent line through the point.
  2. **Split ∇f** — adds the plain ∇f arrow.
  3. **Watch the graph** — adds the tangential/normal decomposition (∇f split into a piece along the tangent direction and a piece perpendicular to it, drawn as the two legs of a right triangle against ∇f as the hypotenuse) and a short slope-indicator segment on the h(t) graph at the current t.
  4. **The Lagrange condition** — adds ∇g, ties the whole thing together in the step text, and (since both ∇f/∇g are colored by the existing `isTangent` signal) both arrows visibly flip to green and align exactly where the graph goes flat.
  - Step state (`motionStep`, 0-3) is independent of the shared `pathId`/`sliderT`, which stay shared with the Explore tab on purpose — switching tabs mid-exploration keeps the same point/path, so a student can set up a tangency on Explore and then switch tabs to see *why* it's a tangency.
  - The tangent direction itself (`tangentUnitAt`) is found by finite difference of each path's own `point(t)`, not a fifth per-path analytic derivative — reuses what every preset already defines, oriented by construction (symmetric forward/backward sample) to point with increasing `t`.
  - The decomposition's two pieces are drawn in true relative proportion to each other and to the full ∇f (unlike the main gradient arrows elsewhere, which are deliberately fixed-length/direction-only) — a single clamped scale factor (`DECOMP_SCALE = 0.4`, capped at `DECOMP_MAX_LEN = 2.0` world units so it doesn't blow up near the tall peak) is applied uniformly to the raw unnormalized ∇f and both of its split pieces, so they still visibly sum back up to ∇f.
  - The h(t) graph is inline SVG (not a third canvas/rAF loop) — a downsampled polyline from the same cached per-path height samples critical-point-finding already uses, with green dots at the critical points (reusing the same cached `computeCriticalPoints`) and a marker tracking the live slider position.
  - **A genuine low-contrast bug found in testing, not just a hypothetical:** the diagram panel's vectors/lines are drawn directly over the heatmap background (same as the Explore 2D panel), and at some points on the surface the heatmap's own local color is close enough to the vector colors (both blue-family) that the vector was nearly invisible in a screenshot even though it was rendering at the exactly correct pixels (confirmed by sampling canvas pixel data directly, not just eyeballing). Fixed by adding a soft white canvas-shadow halo (`shadowColor`/`shadowBlur`) behind every vector/line in this panel specifically — same reasoning as the existing white-ring markers elsewhere (contrast against the surface), just via a cheap shadow instead of a second manual stroke pass. Not applied to the Explore tab's own 2D panel, which tested fine without it; worth revisiting there too if the same issue ever shows up on a different path/point.

- **A real bug caught by actually clicking through the build, not just reading the diff:** the first pass put the Explore tab's entire body (including the 3D/2D `<canvas>` elements) behind a ternary that unmounted it whenever the Motion tab was active. Since the Three.js scene/renderer and the 2D canvas's own render loop are both set up in **mount-once** effects bound to `canvas3dRef.current`/`canvas2dRef.current` at first mount, unmounting and remounting the `<canvas>` DOM node on every tab switch silently detached the running renderer from the page — switching back to Explore showed a blank gray 3D panel (confirmed via screenshot, not assumed). Fixed by mounting **both** tab bodies permanently and toggling `display` instead (same "always render, toggle visibility" principle `applets.md` already documents for micro-fades, just applied at the tab level here) — `MotionTabBody`'s own one-shot draw effect additionally takes `topTab` as a dependency so it redraws immediately on becoming visible again, since (unlike the Explore panels' continuous rAF loops) it only redraws on state changes and wouldn't otherwise notice regaining visibility.

### Verification

No automated tests exist for this applet (none do, repo-wide — see CLAUDE.md §5). Verified by hand: built a throwaway `esbuild --bundle --format=iife --jsx=automatic` bundle against `react@19`/`react-dom@19`/`three@0.128.0` in a scratch npm dir (outside this repo, per the established build model — see "Build model" in `applets.md`), served it locally, and drove it through the in-app browser pane — toggled all three Level modes on both the circle and wavy paths, dragged the Custom `c` slider to a confirmed tangent height, stepped through all 4 Motion-tab steps, confirmed 3D orbit/zoom still work, and confirmed no console errors before and after the tab-remount fix.

**Debugging note:** Mockup 2 initially failed to render for Kyle ("black screen") when viewed through Claude's in-app file preview specifically (not a real browser tab). Root cause was never conclusively identified — troubleshooting included ruling out the CDN Three.js dependency (bundling it inline didn't fix it) and comparing against the partial derivatives applet's approach, which wasn't accessible from this project's chat history. The issue did not recur once Mockup 3 was built and viewed; if it resurfaces, get the exact browser console error (right-click → Inspect → Console) as the fastest path to a real diagnosis, rather than guessing at causes.

## Mockup 3 additions (2026-08-06)

- **Snapping, implemented via critical points, not a fixed t-distance.** Rather than snapping to arbitrary preset t-values, the build samples f(t) = height along the current path (2000 samples), finds local extrema (refined via parabolic interpolation for sub-sample precision), and snaps the slider to those — because by the Lagrange condition, extrema of f restricted to the constraint occur exactly where ∇f ∥ ∇g. So "snap points" and "tangency points" are mathematically the same set, computed once per path and cached. Snap radius is 0.018 in t-units (tentative). Snapping only triggers on manual slider drag (not during Play), so autoplay stays smooth.
- **Tick marks added on the slider track**, one per critical point, so students can see where the tangency points are before finding them — not originally specified, added because it directly supports "always see the parallel case" and pairs naturally with snapping. Flagging as a scope addition, easy to remove if it feels like it gives away too much.
- **Play/loop button built.** Sweeps the slider automatically at a constant rate (full pass in ~7s, tentative). Closed paths (circle) loop continuously; open paths (line/parabola/wavy) ping-pong back and forth between t=0 and t=1, since they have no natural "wrap." Manually dragging the slider stops playback and hands control back. Switching paths also stops playback.
- **Hover tooltips built** on the view toggle, mesh toggle, style toggle, path tabs, slider, play button, and each readout card — light narration per the original "light touch, not a tutorial" decision. Paired with a **new dynamic summary sentence** below the legend (e.g. "Tangent! ∇f and ∇g are parallel here...") that updates live as the point moves — a small addition beyond what was asked, grouped in with tooltips since it's the same "light narration" idea.
- **Vector/marker rendering style — added a toggle, not a replacement.** Following Kyle's interest in matching CalcPlot3D's look, Mockup 3 keeps the flat 2D-projection style (existing convention: ring+dot marker, flat quad arrows) alongside a new **true-3D style** (solid sphere marker, cylinder-shaft arrows) and lets Kyle switch between them live via a cube-icon button to compare, since this is a real fork from the established "only the surface is true 3D" convention and Kyle hadn't fully decided. Currently defaults to 3D on load, per Kyle's stated lean — not a final decision.
- **First-pass arrow rendering had two bugs, both caught by Kyle testing the build directly rather than taking the description at face value — see the follow-up section below for the actual fixes shipped.** The initial approach lifted each arrow to whichever was taller, its anchor or its tip (to stop arrows from being buried in rising terrain), and nudged the two vectors sideways when parallel (to stop one from hiding the other) — both of which visibly detached the arrows from the point they're anchored at. Superseded below.

## Mockup 3 follow-up fixes (2026-08-06, same day)

Kyle caught real problems with the first pass at Mockup 3's arrow rendering, testing it directly rather than taking the earlier description at face value. Two rounds of fixes resulted:

- **Root cause of "vectors coming detached from the point":** the side-offset fix (nudging arrows sideways so parallel vectors wouldn't hide each other) literally moved the arrow's anchor away from the marker. Separately, the arrow-lift fix (lifting the whole arrow to the height of whichever was taller, its anchor or its tip) could float the entire arrow well above the marker on sloped terrain. Both are now replaced: arrows anchor exactly at the marker's own height (no lateral offset, no tip-height lift), and the "hide each other when parallel" problem is instead solved by making ∇f (the color-changing signal vector) reliably win any exact overlap — it's drawn with a visibly larger radius than ∇g and added to the scene after it, so its color is never the one that disappears at a tangency point.
- **Arrows disappearing into rising terrain, fixed differently for the two styles.** Removing the tip-height lift reintroduced the original problem (an arrow pointing toward the tall peak got buried, invisible, since a rigid horizontal arrow can end up under much higher terrain along its length). For the **true-3D style**, arrows are now tilted into the surface's own tangent plane at the anchor point (using the same analytic surface gradient that drives ∇f, applied regardless of which vector — ∇f or ∇g — is being drawn), which is the standard first-order approximation for drawing a tangent vector on a surface and keeps the arrow visually "resting on" the surface along its length. This is **not** applied to the flat style, which is deliberately flat by the established convention — flat-style arrows can still dip into steep terrain near a peak; this is a known, flagged limitation, not fixed in this pass.
- **Billboarded arrowheads, matching CalcPlot3D.** Per Kyle's research into how CalcPlot3D avoids the "flat-looking arrowhead" problem, the true-3D style's arrowhead is now a camera-facing sprite (a triangle texture) rather than a rigid 3D cone — a cone's silhouette can compress to a thin sliver from some viewing angles (e.g. looking down its own axis), while the sprite always presents its full triangular shape, rotated in-plane every frame to match the vector's on-screen projected direction. Verified by rotating the camera in testing — the arrowhead correctly stays a full, readable triangle rather than flattening out. This only affects the true-3D style; the flat style's arrowheads were never a cone and are unaffected.
- **2D panel confirmed unchanged from the detachment bug, and simplified.** Kyle asked directly whether the 2D panel had been touched — yes, briefly: the same lateral offset had been applied there too, which wasn't necessary and is now removed. Canvas 2D draws in strict paint order (unlike the 3D panel's GPU depth test), so drawing ∇g first and ∇f second already guarantees ∇f's color is the one on top at a tangency point, with no offset needed. The two vectors are now differentiated by line thickness (∇f thicker) instead, consistent with the 3D panel's approach.
- **New finding from stress-testing, not yet fully solved:** on the wavy path specifically (the most curved terrain), a critical point was found where the marker and arrows are technically rendered correctly but get occluded by a nearby ridge from the default camera angle — confirmed by orbiting the camera, which reveals them. This is ordinary 3D depth occlusion, not a rendering bug, but worth being aware of: at some points on the more chaotic paths, the default camera angle may not have a clear line of sight to the point, and orbiting is needed to see it clearly. Not addressed further in this pass.

## Mockup 3 second follow-up (2026-08-06, same day)

- **True-3D vector/marker style removed entirely, per Kyle's decision** — not just hidden, the sphere marker, cylinder-shaft arrows, billboarded triangle arrowheads, and the tangent-plane tilt logic built for that style are all deleted from the file. Flat 2D-projection is now the only style, matching the rest of the applet suite's convention with no toggle needed.
- **The flat disc marker now billboards to face the camera**, using the same "always face the camera" technique that had been built for the (now-removed) 3D style's arrowheads — Kyle asked directly whether the marker needed the same treatment as the arrowhead, reasoning that a flat disc lying on the surface would foreshorten into an ellipse at oblique viewing angles the same way a flat arrowhead did. That's correct, and simpler to fix than the arrowhead was: since a circle has no "pointing direction," billboarding it only needs to face the camera — no in-plane rotation logic is needed the way the arrowhead needed to match its on-screen direction. Implemented by copying the camera's orientation onto the marker group every frame.
- **Zoom added to the 3D panel**: scroll wheel, plus on-screen +/− buttons in the top-right corner of the panel (visible in all three view-toggle modes). Both adjust the same orbit-camera radius the drag-to-rotate control already used, clamped between roughly 0.35x and 2.4x the default distance (tentative bounds).
- **Confirmed drag-to-rotate still works** — Kyle asked to double check since it predates this session's changes; verified directly, unaffected by anything done today.

## Mockup 3 third follow-up: proper billboarded arrows (2026-08-06, same day)

Kyle correctly identified that the flat-style arrows still weren't billboarded at all — they were flat quads lying parallel to the ground, which is a genuinely different thing from facing the camera, and can go edge-on and vanish from some angles exactly like the original CalcPlot3D complaint. He also asked for a fixed on-screen vector length so arrows stay visible regardless of zoom. Both were solved together:

- **Arrows rebuilt as billboarded sprite icons.** Each gradient vector (shaft + head, as one image) is now a single `THREE.Sprite` with a canvas-drawn arrow texture, tinted per-vector via `material.color`. Sprites billboard automatically in Three.js — no rotation math needed for facing the camera — so this guarantees full legibility from literally any angle, verified by testing from a near-overhead camera angle where the arrows stayed fully readable. The sprite's in-plane rotation is still recomputed every frame (projecting the vector's true 3D direction to on-screen pixels) so it points the correct way as the camera orbits.
- **Fixed on-screen length via `sizeAttenuation: false`.** This Three.js sprite setting makes the sprite's apparent size constant in screen pixels regardless of camera distance, which directly answers "fixed length so they can always be seen" — verified by zooming out significantly and confirming the arrows stayed the same pixel size while the surface shrank around them. True magnitude remains available only in the |∇f| / |∇g| readout values, unchanged.
- **A real occlusion bug found and fixed along the way:** with normal depth-testing, an arrow pointing toward nearby terrain (e.g. toward the tall peak) could get partially or fully hidden — not because the vector itself was behind anything, but because its on-screen icon extended into screen regions where closer terrain won the depth test. Fixed by disabling depth-testing on the arrow sprites (`depthTest: false`), and for consistency, on the point marker's materials too (which needed `transparent: true` added as well, since depth-test settings alone don't reliably control draw order for fully opaque materials in Three.js) — both are now guaranteed to always render on top, matching the "always be seen" goal directly rather than fighting it.
- **∇f vs. ∇g at a tangency point** still differentiated by sprite scale (∇f 1.25x, ∇g 0.85x) and draw order (∇f added to the scene last), same strategy as before, now applied to sprites instead of meshes.

## Pedagogical goal

Help Calc 3 students bridge the two ways Lagrange multipliers get taught: the 3D "walk the constrained ridge and watch the height" intuition, and the 2D "level curves become tangent to the constraint" justification. Students commonly experience these as two disconnected ideas rather than two views of the same fact — the applet's central job is to make that connection visible and simultaneous, not just teach either view alone.

Dual use case:
- **Live lecture demo** — instructor-driven, used while talking, so it needs to support pointing/looping without requiring constant clicking.
- **Self-serve student review** — students revisit independently afterward, so it needs enough built-in narration (light touch, not a forced tutorial) to stand alone without the instructor present.

This is a first introduction to the topic, not tied to specific homework problems — the goal is general intuition-building across a variety of constraint paths, not mirroring a specific worked example.

## Design decisions log

- 2026-07-28: Dual-purpose applet — lecture demo + self-serve student tool. Narration should be light: hover tooltips on controls (style matches the partial derivatives applet) plus a brief summary readout, not a click-through tutorial sequence. **(Tooltips not yet built — see Open threads.)**
- 2026-07-28: Rendering convention (carried over from the partial derivatives applet): only the underlying surface is a true 3D render. Constraint paths, gradient indicators, etc. are 2D projections lifted onto the surface — no floating 3D axes, gridlines, or freestanding vectors off the surface.
- 2026-07-28: View model is a hybrid of split-screen and toggle — a 3-way control (3D only / 2D only / Both) rather than a fixed split-screen or a hard single-view switch. Toggle glides/transitions between states (matching the curve-sketching applet's transition style), not a hard cut.
- 2026-07-28: Single surface for the whole applet (not multiple surfaces to choose from) — the goal is illustrating the idea, not covering many cases.
- 2026-07-28: 2D panel shows the projection of the constraint path into the xy-plane, using the same path/color as the 3D lifted path, so the visual connection between panels is explicit.
- 2026-07-28: 3-4 preset constraint paths, switchable via tabs — confirmed set is circle, line, parabola, and a wavy/sine-based curve.
- 2026-07-28: Point position along the selected path is controlled by a single slider (not free-drag), living in a side/info panel, not the header.
- 2026-07-28: Max/min signaling: gradient vectors are colored (not outlined) red-ish when not parallel, green when parallel/near-parallel, with a tolerance buffer.
- 2026-07-28: Snap-to-critical-point behavior on the slider — tentatively yes; not yet built (see Open threads).
- 2026-07-28: Readout panel confirmed contents: x, y, z (=f value), angle between ∇f and ∇g, magnitudes of both gradients (to set up λ conceptually).
- 2026-07-28: Optional play/loop button to auto-sweep the slider, primarily for lecture use — not yet built (see Open threads).
- 2026-07-28: Surface decided — two-Gaussian bump (taller peak near (-1.1,-1.0), shorter off-center peak near (1.3,1.1)), chosen over wavy multi-hump and saddle candidates.
- 2026-07-28: Mockup 1 built and confirmed: surface, circle path (radius 1.6, centered at origin), 3-way glide view toggle, position slider with synced marker across both panels.
- 2026-07-28: Constraint path rendered as a flat ribbon lifted onto the 3D surface (not a round tube) — keeps it a true 2D projection, consistent with the "only the surface is true 3D" convention.
- 2026-07-28: 3D panel is fully static except for click-and-drag orbit — no idle auto-rotation.
- **2026-08-04: Surface color ramp fixed.** The original low-end color (`#DCDCF0`) was nearly white and washed out against the `#F5F5FA` page background, especially at low surface heights. New ramp runs from a mid-tone lavender-blue (`#8E96D6`) to deep indigo (`#2A3999`) — same hue family, more contrast throughout. Applies to both the 3D surface material and the 2D heatmap.
- **2026-08-04: Mesh-netting overlay — decided as lifted level-curve (isoline) lines, not a generic u/v wireframe.** Reuses the exact same marching-squares contour data as the 2D panel's contour lines, lifted onto the 3D surface, so toggling it shows identical curves in both panels. Chosen over a plain grid because the isolines carry real pedagogical weight (they're literally the level curves the 2D "tangent to level curves" argument is about), not just depth-perception scaffolding. Toggle is a small round button next to the 3D/Both/2D view toggle; affects both panels together.
- **2026-08-04: All 4 path presets built.** Circle (radius 1.6, origin) unchanged. Line runs from (-2.7,-2.4) to (2.7,2.3), roughly through both bump centers. Parabola: v = 0.32u² − 1.5, u ∈ [-2.8, 2.8]. Wavy: v = 1.3·sin(1.15u), u ∈ [-2.8, 2.8]. Line/parabola/wavy are open curves (not loops); circle remains closed.
- **2026-08-04: Path-switch slider behavior decided (tentative): resets to t=0 (start of new path) rather than trying to preserve a comparable position.** Simplest behavior and avoids ambiguous "closest point" logic across very different curve shapes. Flagged as a reasonable default, not a locked decision — revisit if it feels jarring in use.
- **2026-08-04: Gradient vectors built.** ∇f (surface gradient) computed analytically from the two-Gaussian sum. ∇g (constraint gradient) computed analytically per path from each path's implicit form (circle: u²+v²−r²; line: constant normal direction; parabola/wavy: v − h(u) = 0). Rendered as flat arrows (shaft + triangular head) lifted onto the surface in 3D, and as screen-space arrows in 2D. **Arrows are drawn at a fixed visual length (not scaled to true magnitude)** so the angle between them stays visually legible regardless of how large the actual magnitudes get near path extremes; true magnitudes are shown numerically in the readout panel instead. This is a reasonable-default implementation choice, called out per the "final signal method may evolve" note in the original decision — open to revisiting if Kyle wants arrow length to also carry magnitude information.
- **2026-08-04: Tangency tolerance set to 6°** (angle between ∇f and ∇g, folded to the 0–90° range so parallel and anti-parallel both count). Tentative placeholder pending hands-on tuning, per the original open thread.
- **2026-08-04: New color added — soft sage green `#4E9E7C` for the "tangent" state**, extending the Cloud Pastel palette (which only had a warning rose defined, not a "success" color). Used for the tangent arrow color, the angle readout card's value, and its outline highlight. Flagging since this is a new palette choice outside the original 5-direction/5-saturation exercise — happy to swap if it doesn't sit right against the existing indigo/rose pairing.
- **2026-08-04: Readout panel built** — 6 cards in a horizontal row (x, y, z, ∠(∇f,∇g), |∇f|, |∇g|). The angle card gets a highlighted outline + green value text when within the tangency tolerance, echoing the arrow color signal.

## Interaction & animation details

- Position slider: single control, parameterizes location along whichever constraint path is currently selected. **Snap-to-critical-point not yet built** — still needs the magnetic-pull behavior near the true tangent point, plus hands-on tuning of snap radius.
- Tolerance buffer for the red/green gradient-parallel signal: currently 6°, needs empirical tuning against the working build.
- View toggle: 3-way (3D / 2D / Both), glides/animates between states.
- Path switching (circle/line/parabola/wavy) via tabs; switching resets the position slider to t=0 (tentative, see decisions log).
- Mesh-netting toggle: small round button next to the view toggle; shows/hides lifted level curves in 3D and contour lines in 2D together.
- Play/loop button: **not yet built.** Still needs a decision on sweep speed and whether it pauses at the critical point or ignores snap behavior while animating.
- Hover tooltips / narration: **not yet built.** Light-touch tooltip style (matching the partial derivatives applet) plus a bottom summary still needs to be added — currently the readout panel is the only in-applet explanation of what's being shown.

## Technical build notes

- `mockup-2.html` (single-file HTML + Three.js r128, loaded via cdnjs) — current reference build. Surface height/gradient functions, path preset definitions (each with `point(t)` and an analytic `gradG`), isoline computation (shared between panels), ribbon/marker/arrow construction, and the view/mesh/path toggle wiring all live here.
- Surface height function: sum of two Gaussians — `BUMP1 = {A:3.0, u:-1.1, v:-1.0, sigma:0.9}`, `BUMP2 = {A:1.8, u:1.3, v:1.1, sigma:0.8}`. Domain roughly [-3,3] × [-3,3].
- `gradF(u,v)` is the analytic gradient of that same sum — exact, not numerical.
- Each path preset object carries its own `gradG(u,v)`, derived from that path's implicit form. Angle-based tangency test is scale-invariant, so the arbitrary scaling of each `g` doesn't affect the red/green signal — only the numeric `|∇g|` readout value, which will naturally differ in scale from path to path (expected/standard, not a bug).
- Color ramp: low `#8E96D6` → high `#2A3999`, used identically for the 3D surface material and 2D heatmap.
- Tangent-state color: `#4E9E7C`.

## Open threads / questions

- **Snap-to-critical-point** — implemented (snaps to the same points as the tangency ticks), but the 0.018 t-unit snap radius is a placeholder; needs to be felt out once interactive, could be widened, narrowed, or reversed if it feels too artificial/easy.
- **Tick marks on the slider** — added alongside snapping, not originally spec'd; confirm this is wanted (vs. feeling like it gives away the answer) once Kyle has hands-on time.
- **Play/loop button** — implemented (~7s per pass, ping-pong on open paths); sweep speed and the open-vs-closed behavior are both placeholders pending feel-testing. Also still no decision on whether it should pause momentarily at tangency points during the sweep.
- **Path-switch slider behavior** — still resets to t=0; confirm this feels right once Kyle has hands-on time.
- **Exact tolerance buffer width** — currently 6°, needs empirical tuning against the working build.
- **Arrow visual length vs. true magnitude** — currently fixed-length arrows with magnitude shown only numerically; revisit if Kyle wants the arrows themselves to convey scale.
- **Thickness ratio between ∇f/∇g** — now expressed as sprite scale (1.25x / 0.85x) rather than mesh radius; placeholder, worth a look once Kyle is driving the build.
- **Fixed arrow icon size** (`baseSize = 0.11`, tentative) — the on-screen pixel size of the arrow sprites; worth tuning by eye, especially checking it doesn't feel too small/large across the zoom range.
- **Depth-testing disabled on arrows and marker** — they now always render on top of the surface, even from viewing angles where the point would normally be legitimately hidden behind terrain. This trades strict 3D correctness for Kyle's "always be seen" goal; flag if there's a viewing angle where this looks wrong (arrow floating with no visible connection to the surface).
- **Zoom bounds** (0.35x–2.4x default distance) — tentative; confirm the range feels right, especially the closest zoom-in (surface detail vs. losing spatial context).
- **New tangent-green color** (`#4E9E7C`) — not part of the original palette exercise; confirm it works visually or swap for something else in the Cloud Pastel family.
- **Exact peak parameters for the two-Gaussian-bump surface** — still using the Mockup 1 values; worth confirming they still work well now that gradients and 3 more paths are drawn on top, or whether they need adjusting so more paths cross both peaks meaningfully.
- **Camera occlusion on the wavy path** — mostly moot now that arrows/marker ignore depth-testing (see above), but worth re-checking on the wavy path specifically since that was the original case where this showed up.
- **Custom level curve's height tolerance** (`LEVEL_HEIGHT_TOL`, 2% of the surface's total height range) — tentative, same "flag and tune by eye" treatment as `TOLERANCE_DEG`/`SNAP_RADIUS`; worth widening or narrowing once Kyle has hands-on time dragging the `c` slider toward a tangency.
- **Decomposition scale on the Gradient-as-Motion tab** (`DECOMP_SCALE = 0.4`, clamped at `DECOMP_MAX_LEN = 2.0`) — tentative constants controlling how big the tangential/normal pieces are drawn; worth tuning by eye, especially near the tall peak where ∇f's true magnitude is largest.
- **White halo behind the Motion tab's vectors** — added after testing surfaced a real (not hypothetical) low-contrast spot where a vector's color nearly matched the heatmap underneath it; only applied to the new Motion-tab diagram panel, not the original Explore-tab 2D panel (which tested fine without it). Worth adding there too if the same issue ever turns up on a different path/point.
- **Custom level curve doesn't show where it crosses the constraint** (other than color-coding whether it's tangent anywhere) — deliberately scoped out of this pass to keep the feature size down; could add small crossing-point markers later if Kyle wants more explicit feedback than "the two curves visibly cross or don't."
- **"Gradient as Motion" step transitions are a hard cut**, not an eased fade — each layer (tangent line, decomposition, ∇g) appears/disappears instantly on Next/Back rather than easing in, unlike the rest of the suite's established "always render, toggle opacity with a transition" convention. Scoped out for this pass since the canvas-based diagram would need its own small easing-toward-target loop to match; worth adding if the hard cut feels abrupt in practice.
- **Simple Case tab's vertical compression** (`SC_Z_SCALE = 0.3`) and **camera framing** (`radius: SC_DOMAIN*2.0`, `phi: π*0.26`) — all tentative, tuned by eye only until the saddle visibly fit the panel; worth a closer look once Kyle is driving the build, especially whether the compression makes the surface feel too flat/subdued rather than genuinely saddle-shaped.
- **Simple Case tab's color clamp** (`SC_COLOR_RANGE = 6`) — tentative; chosen so the circle's neighborhood (critical values now `5`/`-3`, since the surface moved to `xy+1`) saturates fully, but worth confirming the clipped far corners of the domain (where the true value reaches roughly `-11.25`/`13.25`) don't read as a bug ("why does the color stop changing out there") rather than an intentional focus choice.
- **Simple Case tab's default Custom-mode `c` value** (hardcoded `4`, bumped up from `3` when the surface shifted to `xy+1`) — picked only as a representative mid-range value under the new critical max of `5`; not derived from anything, worth reconsidering.
- **Simple Case tab's starting position** (`sliderT = 0`, i.e. the point `(√8, 0)`) sits exactly on the u-axis, where `z = xy+1 = 1` — the degenerate axes-crossing level (now also skipped in the fixed mesh overlay, see above). In **Follow** mode specifically, the level curve is this degenerate crossing on first load, not yet a visible hyperbola, until the student drags the slider. No longer the first thing seen by default now that the tab opens in **Custom** mode (c=4, a real hyperbola, visible immediately) — still worth fixing if Kyle switches to Follow and hits this.
- **3D-panel strokes have no contrast halo** (unlike the 2D panel's new dark-shadow pass) — `LineBasicMaterial` doesn't offer an equivalent cheap technique, so the yellow/cyan color choices there were only checked by eye against the current color ramp and camera angle. Worth a closer look if a specific saddle orientation ever makes a level curve or the constraint hard to see in 3D.
- **Red crossing-dot pool is capped at 4** (`MAX_CRIT_DOTS`) — correct for this specific surface (exactly 4 critical points total, in two pairs sharing a height), but not a general-purpose cap; would need raising if a future surface swap for this tab had more critical points sharing a height.
- **Simple Case tab has no path-tabs row** (unlike Explore) and its circle radius is fixed at `x²+y²=8` — a deliberate scope decision (see above), but if Kyle wants to compare a few different circle sizes on this surface later, that would need its own small slider/preset row added.
- **Simple Case tab's new blue-teal-green color stops** (`#1E3C8C` / `#14A39E` / `#4CC24E`) — matched to Kyle's reference screenshot by eye, not sampled pixel-for-pixel from it; worth a side-by-side comparison once Kyle has the build in front of him, and the `SC_COLOR_RANGE=6` clamp is still tentative too (see above).
- **Gradient-vector toggle only exists on the Simple Case tab**, not Explore or Motion — scoped there deliberately since that's where it was asked for and those other tabs' existing narrative (readout panel, legend, summary text) assumes the arrows are always visible; worth adding elsewhere too if Kyle wants it consistently available.
- **Crossing-dot size** (`SC_CRIT_DOT_SIZE_3D = 0.035`) — picked by eye to read closer to the point marker's own size than the old `0.085`; worth a closer side-by-side check once Kyle is driving the build, especially at the zoom extremes (the dots are fixed-screen-size, the marker shrinks with distance, so their relative sizes will drift apart when zoomed far in or out).
- **Constraint-ribbon outline width** (`0.16` vs. the ribbon's own `0.09`) and **gray gradient-vector color** (`SC_GG_COLOR = #5B5B74`) — both tuned by eye against the current color ramp/camera angle, same "flag and tune by eye" treatment as every other visual constant in this file.
- **Shared tangent line's half-length** (`SC_TANGENT_LINE_HALFLEN = 1.4`) — tentative; chosen to read as clearly longer than the circle/level-curve's own local curvature at a crossing without extending so far it looks like it belongs to a different construction. Only drawn in 2D per Kyle's request — revisit adding a 3D version (lifted onto the surface, same convention as the level curves) if he wants the same visual cue there too.
- **Simple Case tab's starting camera rotation** (`theta: Math.PI * 0.7167`) — rotated 75° further clockwise from the previous round's `0.30` at Kyle's explicit request (confirmed via `AskUserQuestion` that "clockwise" meant bird's-eye-view clockwise); worth another look once Kyle has hands-on time dragging to orbit, especially whether this new angle holds up once he's actually teaching from it.
- **Explore tab's 2D-only view likely has the same letterboxing bug just fixed on Simple Case** (`worldToScreen`, not `scWorldToScreen` — see the dedicated writeup above) — not fixed in this pass since Kyle's report was specific to the tab he was on, but the root cause (a fixed-height, variable-width canvas combined with a per-axis world-to-screen scale) applies equally there; worth fixing the same way if it comes up.
- **Mesh-level symmetric placement formula** (outer/inner levels at the midpoints between the critical heights and the domain min/max, and between the critical heights and the degenerate height) — a reasonable, not-hand-tuned default now that it's driven by real critical-point data, but the resulting *visual* spacing wasn't separately eyeballed against Kyle's own sense of "evenly spaced"; worth a look once he's driving the build.
- **Crossing-dot vertical offset above the surface** (`+0.1`, was `+0.12` under the old sprite pool) — nudged slightly when the pool was rebuilt as marker-style disc groups, to sit at the same height convention the marker itself uses; not separately re-verified against every camera angle.
