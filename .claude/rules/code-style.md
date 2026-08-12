# Code Conventions — Rules & Conventions

Load this file when writing or editing HTML/CSS/JS in this repo. Not needed for architecture
reference, data-schema questions, or planning — only for producing new code that should match the
existing style.

## Indentation
- **HTML**: 2 spaces. Top-level `<body>` children start at column 0; nesting indents by 2.
- **`css/styles.css`, `css/home.css`, `css/about.css`, `js/data.js`, `js/app.js`**: every line
  carries a **2-space base indent** — i.e. even top-level rules and declarations begin at column 2,
  not 0. Nesting is 2 spaces on top of that.
- **`js/home.js` and `js/about.js`** are the exceptions: both start at column 0 with conventional
  2-space nesting.
- Match whichever file you are editing.

## CSS style
- One rule per line where it fits: `.selector { prop: value; prop: value; }` all on a single line.
  Multi-line bodies are used only for long rules (e.g. `.applet-card`, `.carousel-arrow`).
- Section banners: `/* ---------- description ---------- */`.
- Explanatory comments are written in full prose sentences, often several lines, describing what a
  rule does and what breaks without it.
- Colors: lowercase-free uppercase hex (`#3B4FC2`), `rgba()` for translucency.
- Numeric values use decimals freely (`13.5px`, `1.6`, `0.15s`).

## Class naming
Flat, lowercase, hyphen-separated. No BEM, no utility classes, no CSS-in-JS.
Two patterns coexist:
- Full descriptive names for blocks: `.course-directory-card`, `.carousel-header`, `.sidebar-card`,
  `.hero-stat-icon`, `.hub-divider`.
- Short prefixed abbreviations for a block's children: `.cd-title` / `.cd-blurb` / `.cd-counts` /
  `.cd-symbol-badge` / `.cd-count-chip` (course-directory), `.ac-eyebrow` / `.ac-title` / `.ac-body`
  (applet-card), `.rt-title` / `.rt-meta` (related-tile, on the item detail page), `.b-name` /
  `.b-title` (brand), `.f-col` / `.f-name` / `.f-seal` / `.f-links` / `.f-links-title` (footer),
  `.h-title` / `.h-desc` (hero), `.about-bio-row` / `.about-photo` / `.about-role` /
  `.about-courses` (`about.html`-only, in `css/about.css`).
- `.pillbox-row`/`.pb-*` (the old tier2 "pick a type" rows) and `.whatsnew-item`/`.wn-*` (the old
  related-materials rows) have both been removed — tier2's type list and the detail page's related
  materials now both reuse tile-grid patterns (`.tile-grid`/`.tile` and `.related-tile` respectively)
  instead.

State/modifier classes are bare words appended to the base: `.current`, `.open`, `.visible`,
`.disabled`, `.reverse`, `.no-sidebar`, `.chip-active`, `.cycling`, `.on-top`, `.pos-front`.

## JavaScript style
- `const`/`let`, arrow functions for short callbacks, `function` declarations for named functions.
- Semicolons throughout. Single quotes in `js/app.js`/`js/data.js`; template literals for all HTML.
- **Rendering pattern**: functions named `<thing>HTML(...)` return template-literal strings; a
  single `render()` switches on `state.level` and assigns `page.innerHTML`. No DOM node
  construction, no framework, no virtual DOM.
- **Routing pattern**: a single `state` object, `navigate(newState, push)`, `statePath(state)` →
  URL string, `history.pushState`/`replaceState` wrapped in `try/catch` with an
  `/* ignore in restricted contexts */` comment, plus a `popstate` listener.
- Values are interpolated straight into HTML strings with no escaping — data is trusted.

## Comment style
- Section dividers in JS and CSS: `// ---------- label ---------- ` / `/* ---------- label ---------- */`.
- Many dividers carry a version tag recording which revision introduced the block: `v16:`, `v17:`,
  `v18:`. This is an existing convention visible throughout `js/app.js` and `css/styles.css`.
- Long multi-line prose comments explaining non-obvious behavior — animation timing, paint order,
  clipping, why a value is what it is — are common and expected, especially in `js/home.js` and
  `css/home.css`.

## HTML style
- Attribute order: `class`, then `id`, then `src`/`href`, then everything else.
- Inline `style="…"` is used sparingly for one-off spacing (e.g. `index.html:199`,
  `js/app.js:488`) alongside the stylesheets.
- SVG is written inline in the HTML for decoration, and as template-literal strings in
  `js/app.js` (`typeIconSVG`, `folderIcon`, `chevronLeftSVG`, `chevronRightSVG`) for icons.
- `aria-label` / `aria-hidden` / `aria-disabled` are used on interactive and decorative elements.
