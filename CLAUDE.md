# Course-Materials — Repository Reference

Static site (no build step, no package manager, no dependencies). Plain HTML + CSS + vanilla JS,
served directly as files. Everything below describes the state of the `adjusting-home-page` branch,
which is the most complete branch in the repo.

---

## 1. File & Folder Structure

```
/
├── index.html            Home page
├── browse.html           Browse/search SPA (all non-home views)
├── README.md             One line: "# Website"
├── .gitattributes        LF normalization; *.png/.ico/.jpg/.jpeg/.gif/.webp forced binary
├── assets/               Favicons and logo SVGs (static image files only)
├── css/                  Stylesheets (2 files)
└── js/                   Scripts (3 files)
```

There are no other directories. No `.github/`, no `package.json`, no config files, no test
directory, no `_layouts`/`_includes` (not a Jekyll site).

### `assets/`
| File | Contents |
|---|---|
| `favicon.svg` | Vector favicon |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Raster favicons at three sizes |
| `favicon.ico` | Legacy `.ico` favicon |
| `apple-touch-icon.png` | iOS home-screen icon |
| `logo-seal-white.svg` | K² seal, all strokes/fills `#FFFFFF` — used on colored grounds (banner, footer) |
| `logo-seal-accent.svg` | Same artwork, all strokes/fills `#3B4FC2` — used on white grounds (hero bio card) |

`logo-seal-white.svg` and `logo-seal-accent.svg` are byte-identical apart from the color values.
Both are 200×200 viewBox with curved `PROFESSOR` / `MATHEMATICS` text on `<textPath>` and a serif
`K²` monogram.

### HTML pages
| File | Responsibility |
|---|---|
| `index.html` | Home only. Static markup: header, hero (title + description + 5 stat numbers + bio card), three "spotlight" sections (Browse by Course / Applets / Lecture Videos), footer. Loads `css/styles.css` + `css/home.css`, then `js/data.js` + `js/home.js`. |
| `browse.html` | Shell for every other view. Its `<body>` contains only the header, mobile menu, an empty `<div id="page">` + `<div id="sidebar-card">`, and the footer. All page content is rendered into `#page` by `js/app.js`. Loads `css/styles.css` only, then `js/data.js` + `js/app.js`. |

There is no third HTML file. Every non-home view (course directory, per-type browse, per-course
type listing, item detail) is a client-side route inside `browse.html`, not a separate file.

### Naming conventions
- **HTML**: lowercase, single word, `.html` extension, at repo root. No subdirectories, no
  `index.html`-per-folder pattern.
- **CSS**: lowercase, `css/<scope>.css`. `styles.css` = shared/global; `home.css` = page-specific,
  named after the page that loads it.
- **JS**: lowercase, `js/<name>.js`. `data.js` = data; `app.js` / `home.js` = named after the page
  they drive (`app.js` drives `browse.html`).
- **Data files**: there are **no `.json` files in this repo.** All site data is a JS object literal
  in `js/data.js`.

---

## 2. CSS Organization

Two stylesheets, both loaded via `<link rel="stylesheet">` with document-relative hrefs.

| File | Loaded by | Scope |
|---|---|---|
| `css/styles.css` | `index.html`, `browse.html` | Global. `:root` custom properties, reset, header/banner/nav, search, mobile menu, page shell + sidebar, breadcrumbs, all card/tile/carousel components, tooltips, footer, both media queries for the shared chrome. |
| `css/home.css` | `index.html` only | Home-page-only. Hero, hero stats, bio card, ripple accents, spotlight sections, and the three spotlight animations. |

### Import pattern to follow
`styles.css` is always first, page-specific CSS second (so the page file can override globals):

```html
<link rel="stylesheet" href="css/styles.css">
<link rel="stylesheet" href="css/home.css">
```

Paths are **document-relative with no leading slash** (`css/…`, `js/…`, `assets/…`). Both HTML
files carry a comment in `<head>` stating this is required because the site is served from a
project subpath.

### Custom properties
- `css/styles.css` `:root` defines the palette: `--bg`, `--card`, `--accent` (`#3B4FC2`),
  `--accent-2` (`#6478D6`), `--text`, `--muted`, `--eyebrow`, `--border`, `--soft`.
- `css/home.css` `:root` adds `--decor` (`#5063C9`) and `--hero-pad-y` (`63px`, controls hero height).
- `--unit-color` is a per-element variable set inline from JS (`js/app.js`), read by `.item-card`,
  `.applet-card`, and `.unit-carousel-header .carousel-title` in `styles.css`. It defaults to
  `transparent`, so pages that don't set it get no accent bar.

### Cross-file CSS gotchas
- `css/home.css:8` sets a **global** `svg { stroke: var(--accent); fill: none; … }`. This is why the
  seal is loaded as `<img>` rather than inlined on the home page — a comment in `styles.css:24`
  records this. Any inline SVG added to `index.html` inherits that rule.
- `.meta-bar` is defined in `styles.css:9` but referenced by no current HTML or JS (orphaned rule
  from the pre-split version).
- The `course-card-cycle` animation duration (`0.9s`, `home.css:132`) and its `48%` keyframe are
  mirrored as numeric constants in `js/home.js` (`CYCLE_MS = 900`, `RECEDE_MS = 432`). Changing one
  without the other desynchronizes the card-shuffle animation; `home.js:31` carries a comment saying so.

---

## 3. Data Structure

**All data lives in `js/data.js` as globals — there is no JSON.** The file declares four top-level
`const`s at file scope (no module, no IIFE), so they land on the global scope and are visible to
whichever page script loads next:

| Global | Type | Contents |
|---|---|---|
| `items` | array of objects | Every material on the site |
| `courseOrder` | array of strings | `["Precalc", "Calc 1", "Calc 2", "Calc 3", "Linear Algebra", "Discrete Math", "Statistics"]` — display order and the canonical course-name spellings |
| `typeOrder` | array of strings | `["Applet", "Worksheet", "LectureGuideNotes", "LectureVideo"]` |
| `typeLabel` | object | Type key → human label (`Applet: "Applets"`, `LectureGuideNotes: "Lecture Guides/Notes"`, …) |

### `items` schema

Common to every item:
```js
{
  id: 'g-c1-11',              // unique string; also the /item/<id> route segment
  course: 'Calc 1',           // MUST match a string in courseOrder exactly
  type: 'LectureGuideNotes',  // MUST match a string in typeOrder exactly
  sections: ['1.1'],          // array; sorting and unit grouping use sections[0]
  title: '…',
  desc: '…',
  updated: '2026-02-01',      // 'YYYY-MM-DD'; parsed as `new Date(updated + 'T00:00:00')`
}
```

Type-dependent fields:
| `type` | Extra fields |
|---|---|
| `Worksheet` | `subtype: 'Standard' \| 'Blended'`, `worksheetFile`, `solutionsFile`, optional `hasSolutions: false` (suppresses the solutions link) |
| `LectureGuideNotes` | `guideFile`, `notesFile` — either may be `null` to omit that link |
| `LectureVideo` | `playlistUrl` |
| `Applet` | `launchUrl`, `curve` (an SVG path `d` string used for the card's mini-graph and the dot's `offset-path`) |

`sectionLabel` is present on most non-Applet items but is **not read by any current code**.

Every file/URL field in the dataset is currently the placeholder `'#'`. `fileLinkHTML()`
(`js/app.js:165`) renders `'#'` and empty values as an inert, grayed-out `<span>` with a tooltip
instead of a live link; `launchApplet()` (`js/app.js:155`) no-ops on `'#'`.

### Generated dummy data
`js/data.js:82-140` defines `dummyUnitDefs` (5 units each for Calc 1 and Calc 3) and
`buildDummyItems()`, which generates 4 items (worksheet / guide-notes / video / applet) × 10
sections × 5 units × 2 courses = 400 items, appended with `items.push(...buildDummyItems())`.
Item counts shown anywhere on the site therefore include this generated data.

### Consumers
| Consumer | Uses |
|---|---|
| `js/home.js` | `items`, `courseOrder`, `typeOrder` — for the hero stat numbers |
| `js/app.js` | `items`, `courseOrder`, `typeOrder`, `typeLabel` — for every rendered view, search, and the footer date |

### Data duplicated across files (must be kept in sync)
1. **Type keys.** The `data-stat` attributes in `index.html:70-73` (`Applet`, `Worksheet`,
   `LectureGuideNotes`, `LectureVideo`) must match `typeOrder` strings in `js/data.js:143`.
   `js/home.js:12` matches them by string.
2. **Bio paragraph.** Written out in full twice: `index.html:81` (rendered) and `js/app.js:13` as
   `const bioText` (declared, currently unreferenced).
3. **Footer date.** `index.html:171` hardcodes `Site last updated: Aug 2, 2026`. `browse.html:78`
   leaves it empty and `js/app.js:624` fills it from the newest `items[].updated`. The two pages
   can and do disagree.
4. **Header, mobile menu, and footer markup** are copy-pasted into both HTML files (there is no
   partial/include mechanism). They differ deliberately: `index.html` uses plain `<a href>` links,
   `browse.html` uses `onclick` handlers into the router.
5. **`toggleMobileMenu()`** is defined twice — `js/home.js:2` and `js/app.js:114` — because each
   page loads only one of the two scripts.
6. **Palette hexes.** `unitAccentPalette` in `js/app.js:223` is a literal hex array, unrelated to
   the `:root` variables in `css/styles.css`.

---

## 4. Cross-File Dependencies

### Load order (strict)
```html
<script src="js/data.js"></script>   <!-- must be first -->
<script src="js/app.js"></script>    <!-- or js/home.js -->
```
Neither page script guards for missing data — both reference `items` at top level and would throw
if `data.js` were absent or loaded second. Both script files open with a comment stating this.

### `index.html` → `browse.html` links
`index.html` links into the SPA using hash routes:
- `browse.html` → default view (Course Materials)
- `browse.html#/applets` → `{ level: 'typeBrowse', type: 'Applet' }`
- `browse.html#/lecture-videos` → `{ level: 'typeBrowse', type: 'LectureVideo' }`

Only those two hashes are recognized. `stateFromHash()` (`js/app.js:631`) parses them; anything
else falls back to Course Materials. Adding a new home-page link into a deeper view requires
adding a case in `stateFromHash()` — the hash strings there must match the `href`s in `index.html`
(lines 33-34 and 45-46) and the slugs in `statePath()` (`js/app.js:60`).

### DOM contract between `browse.html` and `js/app.js`
`js/app.js` reads these IDs/selectors and will break if renamed in the HTML:
`#page`, `#sidebar-card`, `.page-shell`, `#mobile-menu`, `#search-input`, `#search-results`,
`#search-clear`, `#search-input-mobile`, `#search-results-mobile`, `#footer-updated`,
`#nav-coursematerials`, `#nav-applets`, `#nav-videos`.

`js/home.js` reads: `#mobile-menu`, `.hero-stat-num[data-stat="…"]`, `.course-stack-svg`,
`.course-card` (expects exactly 3), and `.spotlight` as the hover target.

### Inline handlers
All interaction uses inline `onclick="…"` attributes in HTML strings, calling functions declared at
file scope in `js/app.js`. Those functions must stay global (no module wrapper, no IIFE around
`app.js`) or every handler breaks silently.

### Asset references
Both HTML files reference the same six favicon/touch-icon files and `assets/logo-seal-white.svg`
(banner + footer); `index.html` additionally uses `assets/logo-seal-accent.svg`. All references are
document-relative.

---

## 5. Build & Deploy

- **No build step.** Files are served exactly as committed. No bundler, transpiler, minifier,
  preprocessor, or package manager.
- **Remote:** `https://github.com/ProfKyleKnee/Course-Materials.git` (`origin`).
- **Serving path:** the site is a GitHub Pages *project* site served from the `/Course-Materials/`
  subpath. Comments at the top of both `index.html` and `browse.html` state this explicitly and
  note that a leading `/` on any href would break it. The Pages source branch/folder is a
  repository setting and is not recorded anywhere in the repo.
- **No GitHub Actions.** There is no `.github/` directory on any branch — no workflows, no CI, no
  linting, no deploy action.
- **No dates-file automation.** No script or action generates a dates/manifest file. The
  "last updated" values come from two places, both manual or client-side: the hardcoded string in
  `index.html:171`, and `js/app.js:624`, which computes the newest `items[].updated` at page load.
- **No other automation** of any kind (no hooks, no cron, no submodules, no LFS).

### Branch state
`main` is behind this branch and contains only `index.html`, `js/app.js`, `css/styles.css`,
`README.md`, `.gitattributes`. It has **no** `browse.html`, `js/data.js`, `js/home.js`,
`css/home.css`, or `assets/`; its `index.html` is titled "Teaching Materials Hub — v18" and opens
with a `.meta-bar` changelog block, and its `js/app.js` still contains the `items` array inline.
The two-page structure and split data file exist only on `adjusting-home-page` (and its remote
counterpart).

---

## 6. Code Conventions In Use

### Indentation
- **HTML**: 2 spaces. Top-level `<body>` children start at column 0; nesting indents by 2.
- **`css/styles.css`, `css/home.css`, `js/data.js`, `js/app.js`**: every line carries a **2-space
  base indent** — i.e. even top-level rules and declarations begin at column 2, not 0. Nesting is
  2 spaces on top of that.
- **`js/home.js`** is the exception: it starts at column 0 with conventional 2-space nesting.
- Match whichever file you are editing.

### CSS style
- One rule per line where it fits: `.selector { prop: value; prop: value; }` all on a single line.
  Multi-line bodies are used only for long rules (e.g. `.applet-card`, `.carousel-arrow`).
- Section banners: `/* ---------- description ---------- */`.
- Explanatory comments are written in full prose sentences, often several lines, describing what a
  rule does and what breaks without it.
- Colors: lowercase-free uppercase hex (`#3B4FC2`), `rgba()` for translucency.
- Numeric values use decimals freely (`13.5px`, `1.6`, `0.15s`).

### Class naming
Flat, lowercase, hyphen-separated. No BEM, no utility classes, no CSS-in-JS.
Two patterns coexist:
- Full descriptive names for blocks: `.course-directory-card`, `.carousel-header`, `.sidebar-card`.
- Short prefixed abbreviations for a block's children: `.cd-title` / `.cd-blurb` / `.cd-counts`
  (course-directory), `.ac-eyebrow` / `.ac-title` / `.ac-body` (applet-card), `.pb-label` /
  `.pb-desc` / `.pb-count` (pillbox), `.wn-title` / `.wn-meta` (whats-new), `.b-name` / `.b-title`
  (brand), `.f-col` / `.f-name` / `.f-seal` (footer), `.h-title` / `.h-desc` (hero).

State/modifier classes are bare words appended to the base: `.current`, `.open`, `.visible`,
`.disabled`, `.reverse`, `.no-sidebar`, `.chip-active`, `.cycling`, `.on-top`, `.pos-front`.

### JavaScript style
- `const`/`let`, arrow functions for short callbacks, `function` declarations for named functions.
- Semicolons throughout. Single quotes in `js/app.js`/`js/data.js`; template literals for all HTML.
- **Rendering pattern**: functions named `<thing>HTML(...)` return template-literal strings; a
  single `render()` switches on `state.level` and assigns `page.innerHTML`. No DOM node
  construction, no framework, no virtual DOM.
- **Routing pattern**: a single `state` object, `navigate(newState, push)`, `statePath(state)` →
  URL string, `history.pushState`/`replaceState` wrapped in `try/catch` with an
  `/* ignore in restricted contexts */` comment, plus a `popstate` listener.
- Values are interpolated straight into HTML strings with no escaping — data is trusted.

### Comment style
- Section dividers in JS and CSS: `// ---------- label ---------- ` / `/* ---------- label ---------- */`.
- Many dividers carry a version tag recording which revision introduced the block: `v16:`, `v17:`,
  `v18:`. This is an existing convention visible throughout `js/app.js` and `css/styles.css`.
- Long multi-line prose comments explaining non-obvious behavior — animation timing, paint order,
  clipping, why a value is what it is — are common and expected, especially in `js/home.js` and
  `css/home.css`.

### HTML style
- Attribute order: `class`, then `id`, then `src`/`href`, then everything else.
- Inline `style="…"` is used sparingly for one-off spacing (e.g. `index.html:165`,
  `js/app.js:470`) alongside the stylesheets.
- SVG is written inline in the HTML for decoration, and as template-literal strings in
  `js/app.js` (`typeIconSVG`, `folderIcon`, `chevronLeftSVG`, `chevronRightSVG`) for icons.
- `aria-label` / `aria-hidden` / `aria-disabled` are used on interactive and decorative elements.
