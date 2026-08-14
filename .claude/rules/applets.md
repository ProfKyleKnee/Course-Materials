# Applets — Rules & Conventions

Load this file when working on anything under `Applets/` — building, migrating, or rebundling an
applet, or editing its header/layout. For how an applet gets *linked into* the rest of the site
(`js/data.js`'s `items[]`, `launchUrl`, same-tab navigation), see
[wiring.md](wiring.md#wiring-an-applet-into-the-main-site) instead — that's cross-file wiring, not
an applet-internal concern.

Interactive teaching tools (Calc 1–3 React apps), added on the `First-Applet` branch (not yet
merged to `main`). Each applet is authored as a React app and delivered as one self-contained,
dependency-free HTML file with React/ReactDOM bundled inline via esbuild — no CDN `<script>` tags,
no external `bundle.js` sibling file. This keeps the site's own "no build step to *serve* anything"
rule intact: the compiled HTML files are committed and served as-is, same as every other file in the
repo. The build step exists only to *produce* those files from source; it isn't part of
Course-Materials' own runtime and there's no `package.json` anywhere in this repo for it.

## Folder structure
```
Applets/
├── shared/                       Header code every migrated applet loads — see below
│   ├── applet-header.css
│   └── applet-header.js
├── Calc 1/                       Flat *.html files, no JSX source alongside (predates this system),
│                                   except Curve Sketching, Newton's Method, and Reimann Sums (below),
│                                   all three migrated
│   ├── Curve Sketching/            Migrated — curve-sketching-v13.html is the shipped bundle,
│   │                                 curve-sketching-v13.jsx + curve-sketching-styles.css the source;
│   │                                 has its own spec_4.md
│   ├── Newton's Method/            Migrated — Newton's Method.html is the shipped bundle; App.jsx,
│   │                                 Shared.jsx, Graph.jsx, newtonMath.js, IntroTab.jsx,
│   │                                 FreePlayTab.jsx, FailureTab.jsx, OtherReasonsTab.jsx,
│   │                                 failureConfigs.js, main.jsx the source (all flat in this same
│   │                                 folder — see the import-path mismatch note under "Build model"
│   │                                 below); has its own spec.md
│   └── Reimann Sums/               Migrated — riemann-sum-applet-standalone_6.html is the shipped
│                                     bundle, riemann-sum-applet.jsx the source; also cross-listed as a
│                                     Calculus II applet (same shipped file, two items[] rows — see
│                                     wiring.md); has its own spec_5.md
├── Calc 2/
│   ├── Polar Graphing/            Migrated — polar-graphing-applet.html is the shipped bundle,
│   │                                 app.jsx the source; has its own spec_4.md
│   └── Taylor Series & Taylor's Theorem/  Migrated — taylor-series-explorer_6.html is the shipped
│                                     bundle, TaylorSeriesApplet.jsx the source; has its own spec_4.md
└── Calc 3/
    ├── Quadric Surfaces/         One folder per applet once it's past mockup stage
    │   ├── quadric_surface_explorer_5.html   Shipped bundle — this is what items[].launchUrl points to
    │   ├── app.jsx                            React source (imports the two files below)
    │   ├── quiz_bank.js                        Applet-specific data, imported by app.jsx
    │   ├── saddle_icon.js                      Applet-specific data, imported by app.jsx
    │   └── spec.md                             Design-decision log for this applet — see below
    ├── Dot Product & Projections/  Same folder pattern, no spec.md yet
    ├── Partial Derivatives/        Migrated — partial-derivatives-standalone_3.html is the shipped
    │                                 bundle, partial-derivatives.jsx the source; has its own
    │                                 spec_2_1_1_1.md
    └── Lagrange Multipliers/       Mockup stage only — mockup-3.html + jsx + spec_4.md, no shipped bundle yet
```
**Quadric Surfaces, Partial Derivatives, Polar Graphing & Integration, Taylor Series & Remainder
Explorer, Curve Sketching Studio, Newton's Method Explorer, and the Riemann Sum Explorer have been
migrated** to the full-viewport layout described below; Calc 3's other two applets and the rest of Calc 1 still use
their own one-off header (or none at all) and haven't been touched. Migrating one means: hand-matching its own JSX gradient banner and
page-level credit row to the canonical spec (see "Header pattern" below) and rebuilding its bundle.
None of the migrated applets use the old shared-topline HTML/JS wiring anymore — see "Header
pattern" for why.

## Per-applet design-decision logs
Files named `spec.md` (or a variant like `spec_4.md`) are per-applet logs of settled decisions, open
threads, and pedagogical goals — read for context, not executed. Not every applet folder has one yet
(as of this branch, Quadric Surfaces, Partial Derivatives, Lagrange Multipliers, Polar Graphing,
Taylor Series, Curve Sketching, Newton's Method, and Reimann Sums all do); worth back-filling one when doing
substantial work on an applet that lacks
one. Applet-specific facts (design decisions, open threads, pedagogical goals for *that* applet)
belong in its own `spec.md`, not in this file — this file is only for rules that apply across
applets.

## Build model
Each applet is bundled **independently** — there is no shared build pipeline or lockfile in this
repo, and React itself isn't committed anywhere. The `.jsx` file is the source of truth; the shipped
HTML's inline `<script>` is the compiled output for that file. There's no script in this repo that
automates the splice-into-HTML step; it's done by hand each time, replacing everything from the
bundle's own `<script>` opening tag through to the closing `</script></body></html>` — the header
`<link>`/`<script>` lines (see "Header pattern" below) live *before* that block and aren't touched by
a rebuild.

**Quadric Surfaces** (`import`-based source, real ES module imports for React/react-dom/its two
sibling data files) uses the straightforward esbuild bundle recipe:
```
npm install react@19 react-dom@19        # in a scratch dir — not part of this repo
npx esbuild app.jsx --bundle --outfile=bundle.js --format=iife --jsx=automatic
```
This inlines React/ReactDOM/the JSX runtime into one IIFE (visible as esbuild's own
`// src/...`-style module-boundary comments inside the bundle).

**Partial Derivatives** is different and easy to get wrong: `partial-derivatives.jsx` references
`React`, `ReactDOM`, and `THREE` as bare globals (no `import` statements at all — see the file's own
top-of-file comment), because its shipped bundle is a straight concatenation of the raw UMD
production builds of **React 18.3.1**, **ReactDOM 18.3.1**, and **three.js 0.149.x** (pre-r150, the
last version with a plain global/UMD `build/three.min.js` — modern three.js only ships ESM/CJS) with
a classic-transform JSX compile of the source appended after them:
```
npm install react@18.3.1 react-dom@18.3.1 three@0.149.0     # scratch dir, not part of this repo
npx esbuild partial-derivatives.jsx --jsx=transform --jsx-factory=React.createElement \
  --jsx-fragment=React.Fragment --minify --outfile=app.compiled.js
```
...then concatenate, in this order: `node_modules/react/umd/react.production.min.js`,
`node_modules/react-dom/umd/react-dom.production.min.js`, `node_modules/three/build/three.min.js`,
`app.compiled.js`. **Do not** rebuild this applet's three.js from a current npm install (whether via
the real `three` package's ESM build bundled into a global, or any other recent version) — three.js
r150+ turned on sRGB color management and physically-correct light falloff by default, which
silently darkens and desaturates the surface's vertex-colored mesh and its `AmbientLight`/
`DirectionalLight` intensities, since none of those numbers in the source were tuned for that
lighting model. This exact regression shipped once already on the `small-fixes` branch and had to be
diagnosed and reverted by comparing against a git-history screenshot of the original bundle — pin
the version instead of re-deriving this fix.

**Polar Graphing & Integration**'s shipped bundle is also a classic-transform JSX compile (same
`--jsx=transform --jsx-factory=React.createElement` shape as Partial Derivatives, concatenated after
React/ReactDOM 18.3.1 UMD builds — it has no `three` dependency, so no build-tool step here) — but the
edit that added its header/footer (see "Header pattern" below) was made **by hand, directly in the
shipped HTML's `React.createElement` calls**, in an environment with no `node`/`npx`/esbuild
available to actually recompile `app.jsx`. When that's the situation, edit both files in parallel:
the `.jsx` source with real JSX (so it stays correct if someone *does* rebuild it later), and the
shipped HTML's compiled `React.createElement(...)` call tree by hand, matching the classic-transform
output shape already used elsewhere in that same file (nested `React.createElement(tag, propsObj,
...children)` calls, `/*#__PURE__*/` comments included) — get the paren/brace nesting exactly right,
since a single miscounted closing paren breaks the whole script silently (produces a blank page with
a `SyntaxError: missing ) after argument list` console error, not a helpful line-pointed one). Prefer
a real esbuild rebuild over hand-editing whenever the toolchain is actually available.

**Taylor Series & Remainder Explorer** is built the same way as Polar Graphing & Integration
(classic-transform JSX compile concatenated after React/ReactDOM 18.3.1 UMD builds, no `three`
dependency) — see that applet's own `spec_4.md` for its math-engine specifics (Taylor-mode automatic
differentiation, not symbolic/finite-difference). Its post-migration layout/sizing fixes (see spec_4
for the full list) were also hand-edited in parallel across `TaylorSeriesApplet.jsx` and the shipped
HTML, same no-toolchain-available constraint as Polar Graphing.

**Curve Sketching Studio** is built like Quadric Surfaces (`import`-based source, real ES module
imports for React/react-dom) rather than the classic-transform-concatenation pattern the other three
migrated applets use — it was decompiled from a compiled bundle into real JSX in a prior handoff (see
its own `spec_4.md`), and Node/esbuild were actually available for its header migration, so the
straightforward `esbuild --bundle --format=iife --jsx=automatic` recipe (against `react@19`/
`react-dom@19`) was used to rebuild it rather than hand-editing compiled output. It's also the first
migrated applet to keep a real external stylesheet (`curve-sketching-styles.css`, inlined into the
shipped HTML's `<style>` block) instead of styling everything via inline JSX `style={{}}` objects —
its `<head>` links `../../shared/applet-header.css` for the shared full-viewport rules *and* keeps its
own `<style>` block for its class-based component styles, both loading alongside each other rather
than one replacing the other. It's also the applet that surfaced the fourth full-viewport gotcha below
(the CSS Grid `minmax(0, Nfr)` one) — its two-column `.main-grid` had no responsive breakpoint at all
until a later round of work added one, at which point the missing `minmax(0, …)` caused a real
horizontal-overflow bug on phones, not just a hypothetical one.

**Newton's Method Explorer** is built like Quadric Surfaces and Curve Sketching (`import`-based
source, real ES module imports for React/react-dom), rebuilt via the same `esbuild --bundle
--format=iife --jsx=automatic` recipe against `react@19`/`react-dom@19`. **Import-path mismatch to
know about before rebuilding**: `App.jsx` imports its tab components from `./tabs/IntroTab.jsx` etc.,
but every `.jsx` file in this applet actually sits flat in `Applets/Calc 1/Newton's Method/` — there
is no `tabs/` subfolder on disk. This isn't a bug that broke anything (esbuild resolves relative to
wherever you actually put the files when bundling, not to some canonical layout), but it does mean a
straight `esbuild app.jsx --bundle` run against the files *in place* will fail to resolve those
imports — copy the tab files into an actual `tabs/` subdirectory in your scratch build folder first
(matching what the imports expect), bundle from there, and don't try to "fix" the mismatch by moving
the real repo files into a `tabs/` folder without checking with Kyle first, since nothing about the
shipped HTML or this doc assumes that layout.

**Reimann Sums** predates this system's `import`-based/classic-transform-concatenation split
entirely — its own build pipeline (`tsc --jsx react` plus a hand-rolled recursive-descent expression
parser standing in for `mathjs`, see its own `spec_5.md` for the full recipe) has nothing to do with
esbuild. No toolchain assumption from that original pipeline needed to be re-run for the header
migration, since only the outermost wrapper/banner/footer changed, not the math engine — but the
shipped HTML has no `import`s to rebuild from either way, so the migration edited the compiled
`React.createElement(...)` tree directly, same hand-editing constraint as Polar Graphing/Taylor
Series. Rather than counting nested parens by eye (the exact mistake this doc's hand-editing warning
above is about), the splice points were found programmatically: a small one-off Node script walked
the file with a JS-aware paren/string/template-literal matcher to locate the byte offsets of the
`return (`, the outer wrapper's own `React.createElement(...)` call, and the content div's call, then
spliced the new banner/card/footer markup in at those offsets. The result was verified with
`node --check` on the extracted `<script>` block plus a real headless-browser render before being
treated as done — the general "verify, don't just assert" standard `spec_5.md` already called for on
this applet, extended to structural HTML edits, not just math-logic bugs. Prefer this script-assisted
splice approach (or a real esbuild rebuild, if a toolchain happens to be available for a given
applet) over hand-counting parens on any future compiled-output-only migration.

**Five full-viewport gotchas worth checking on any migrated applet** — the first three caught (and
fixed) on Taylor Series Explorer, the fourth on Curve Sketching Studio, the fifth on Newton's Method
Explorer:
- The **card** itself (the flex child holding the banner *and* the content, not just an inner content
  wrapper) needs its own explicit `max-width: 1200px; margin: 0 auto` — capping only an inner wrapper
  while the outer card is unconstrained lets the gradient banner stretch full-bleed across the page
  while the content beneath it looks correctly inset, which reads as broken even though each piece is
  individually "capped" somewhere.
- Any element sized by CSS Grid or Flexbox that's expected to *shrink* on short viewports needs an
  explicit `min-height: 0` — the default `min-height: auto` refuses to shrink below the element's own
  content height, so instead of resizing it silently overflows past an `overflow: hidden` ancestor
  (invisible clipping) or, worse, an absolutely-positioned child anchored inside it (e.g. a draggable
  badge pinned to its parent's bottom edge) gets dragged up into whatever sits below once the parent's
  real height collapses toward zero, overlapping content that never should have touched.
- The graph `<svg>`'s fixed `viewBox` needs `preserveAspectRatio="none"` whenever the app's own pan/
  zoom math already computes x- and y-scale independently from the rendered box (check for two
  separate `scaleX`/`scaleY` values derived from `getBoundingClientRect()` in the panning code) —
  without it, the browser's default `xMidYMid meet` letterboxes the content to preserve the viewBox's
  native aspect ratio, which both visually pushes fixed-position overlay text (e.g. a top-left corner
  label) away from the box's actual top-left corner, and — if ever assumed otherwise — would silently
  desync pointer coordinates from data coordinates in the letterboxed margin.
- The *horizontal* twin of the `min-height: 0` gotcha above: a CSS Grid `Nfr` column's implicit
  minimum width is `auto` (its content's natural/min-content width), not `0`, so a wide-content column
  that's expected to *shrink* on narrow viewports needs `minmax(0, Nfr)` instead of a bare `Nfr` — a
  bare `Nfr` lets that column's content stretch the whole grid (and everything above it that trusts
  `width: 100%`) past the viewport instead of shrinking, causing a page-level horizontal scrollbar with
  content clipped off the right edge. Flexbox children have the same default (`min-width: auto`) and
  need the equivalent explicit `min-width: 0` — hit on Curve Sketching Studio by two side-by-side
  `<input type="range">` sliders inside a flex row, which refused to shrink below their own browser-
  default intrinsic width no matter how narrow their flex container got.
- A deeply-nested `flex: 1 1 auto; min-height: 0` chain (six-plus levels, trying to make an inner
  element like a graph truly *fill* whatever vertical space is left after the banner/fixed rows) is
  fragile and easy to get subtly wrong — on Newton's Method Explorer, removing `min-height: 0` from
  just one intermediate row (to stop a sibling nav rail from being squeezed below its own content
  height) caused a *different* level's automatic min-height calculation to balloon to ~980px on some
  window sizes, which silently clipped the nav rail's own bottom buttons against an ancestor's
  `overflow: hidden` instead of fixing anything. If an element's height genuinely needs to track "the
  rest of the viewport, minus some fixed chrome above/below it," prefer sizing it directly against the
  viewport instead of routing that constraint through many flex levels: lock its own `aspect-ratio` (so
  it can never visually distort, sidestepping the `preserveAspectRatio="none"` gotcha above entirely,
  since the box always matches the `viewBox`'s true proportions) and cap its *width* (which then drives
  height through the locked ratio) with `calc(100vh - Npx)`, where `Npx` is that specific caller's own
  measured fixed vertical overhead — pass it in as a prop rather than hardcoding one value shared by
  every caller, since siblings with less fixed content around the sized element (e.g. a simpler tab
  with no intro/explainer card) need a smaller `Npx` or they'll under-fill and leave dead space below.

## Header pattern
Every migrated applet's HTML shell loads only the shared CSS file, for its full-viewport layout
rules — nothing else is shared HTML/JS anymore:
```html
<head>...<link rel="stylesheet" href="../../shared/applet-header.css"></head>
<body>
<div id="root"></div>
<script>/* compiled bundle, renders React into #root */</script>
</body>
```
An earlier version of this pattern (still visible in `applet-header.js` and most of
`applet-header.css`) had a **shared topline** — a separate navy strip above the gradient banner,
rendered by calling `mountAppletHeader({...})` against a `<div id="applet-header">`, with a "Course
site" link back to `index.html`. That two-bar design was retired after live A/B trials on both
migrated applets found it read as visually heavy; `applet-header.js`'s `mountAppletHeader()` and
`applet-header.css`'s `.aph-*` rules still exist (in case a future applet's layout genuinely wants a
separate topline) but none of the migrated applets call or load them anymore — don't assume a new
applet should wire them back up without checking whether the single-banner pattern below fits first.

Every migrated applet now builds its **entire header as one gradient banner**, inside its own JSX
(still not literally shared code, for the same reason as before — each applet is an independently-
bundled React app with no shared component pipeline). The canonical spec for this banner, its
"All Applets" back-link, and the page-level brand-credit row below the card is documented as a
comment block at the bottom of `applet-header.css` ("final header direction") — any new or migrated
applet must hand-match those values in its own JSX rather than inventing its own. Bullet summary
(see that comment block for exact style values):
- **Banner**: `linear-gradient(135deg, #3B4FC2, #4A5CD6)`, a decorative SVG curve behind everything,
  an inline "← All Applets" link (`href="<repo-root>/browse.html#/applets"`) on the left next to a
  1px divider and the kicker/title stack (title `fontSize: 24`), and — only if the applet has its
  own tabs/toggles, e.g. Quadric Surfaces' Guided/Free Play/Quiz switcher or Polar Graphing &
  Integration's Graphing/Polar Integration mode toggle — those on the right. Nothing else goes in
  the banner.
- **Outer wrapper**: `display: "flex", flexDirection: "column", height: "100%"`, `padding: "24px 24px
  0"` (no bottom padding — the credit row below supplies its own), holding the card (`flexShrink: 0`,
  full `20px` rounding on all four corners now that there's no topline to flatten the top corners
  against) as its first child.
- **PageCredit**: a second flex child *after* the card, not inside it — `marginTop: "auto"` so it
  pins to the bottom of the outer wrapper on tall viewports but still falls in normal flow right
  after the card (never disappearing) when the app's own content is tall enough to fill the viewport
  on its own. Centered (not left/right — it belongs to the whole page, not to whichever element sits
  above it), a 40×40 circular chip holding `assets/favicon.svg` at 28×28 (the accent-colored mark,
  since this chip sits on a light background — not `assets/favicon-white.svg`, which was sized for a
  dark topline this pattern no longer has), followed by "Professor Kyle Knee · Harper College
  Mathematics" spelled out in full. Two prior, smaller sizes for this mark (22×22/14×14, then a
  corner-watermark placement inside the banner itself) were both tried and rejected as illegible —
  don't shrink it back down or move it back into the banner without checking with the user first.

This pattern's history (spec-in-a-comment, not a literal shared component) traces back to the same
reasoning as the original topline/banner split: a real shared React component isn't achievable
without unifying the build pipeline across every applet, so the comment block is the practical
alternative and the actual durable source of truth (an earlier per-applet `spec.md` claimed it had
been saved into a Claude Skill file instead — it hadn't been; don't trust that claim if you encounter
it).

## Full-viewport layout contract
Also governed by `applet-header.css` (see its own comments for the full reasoning): `html`/`body`
become a fixed-height flex column so `#root` gets exactly the viewport's height (there's no separate
header element outside `#root` anymore — see "Header pattern" above), with `#root { overflow: auto }`
acting as a safety net for unusually short windows or unusually tall content rather than the normal
case. A migrated applet's own top-level React wrapper must cooperate — `height: "100%"` and
`boxSizing: "border-box"`, **not** `minHeight: "100vh"` (which was correct back when the app *was*
the entire page, but forces a scrollbar on every window size regardless of content once anything
else shares the viewport with it).

## Wiring an applet into the site
Covered in [wiring.md](wiring.md#wiring-an-applet-into-the-main-site), not here — it's about how
`js/data.js`'s `items[]` and `js/app.js`'s `launchApplet()` link a shipped applet HTML file into the
rest of the site, which is cross-file wiring rather than an applet-internal concern.
