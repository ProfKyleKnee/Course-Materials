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
├── Calc 1/                       Flat *.html files, no JSX source alongside (predates this system)
├── Calc 2/                       Same as Calc 1
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
**Quadric Surfaces and Partial Derivatives have been migrated** to the full-viewport layout
described below; the other two Calc 3 applets and everything under Calc 1/Calc 2 still use their
own one-off header (or none at all) and haven't been touched. Migrating one means: hand-matching its
own JSX gradient banner and page-level credit row to the canonical spec (see "Header pattern" below)
and rebuilding its bundle. Neither migrated applet uses the old shared-topline HTML/JS wiring
anymore — see "Header pattern" for why.

## Per-applet design-decision logs
Files named `spec.md` (or a variant like `spec_4.md`) are per-applet logs of settled decisions, open
threads, and pedagogical goals — read for context, not executed. Not every applet folder has one yet
(as of this branch, only Quadric Surfaces, Partial Derivatives, and Lagrange Multipliers do); worth
back-filling one when doing substantial work on an applet that lacks it. Applet-specific facts
(design decisions, open threads, pedagogical goals for *that* applet) belong in its own `spec.md`,
not in this file — this file is only for rules that apply across applets.

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

## Header pattern
Both migrated applets' HTML shells load only the shared CSS file, for its full-viewport layout
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
separate topline) but neither migrated applet calls or loads them anymore — don't assume a new
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
  own tabs/toggles, e.g. Quadric Surfaces' Guided/Free Play/Quiz switcher — those on the right.
  Nothing else goes in the banner.
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
