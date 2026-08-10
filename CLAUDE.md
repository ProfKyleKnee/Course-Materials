# Course-Materials — Repository Reference

Static site (no build step, no package manager, no dependencies). Plain HTML + CSS + vanilla JS,
served directly as files. Everything below describes the current state of `main` (the
`adjusting-home-page` and `Modify-Home` branches that built this up have both merged in).

---

## 1. File & Folder Structure

```
/
├── index.html            Home page
├── browse.html           Browse/search SPA (all non-home views)
├── about.html            Static "About" bio page
├── README.md             One line: "# Website"
├── .gitattributes        LF normalization; *.png/.ico/.jpg/.jpeg/.gif/.webp forced binary
├── assets/               Favicons and logo SVGs (static image files only)
├── css/                  Stylesheets (3 files)
└── js/                   Scripts (4 files)
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
| `logo-seal-accent.svg` | Same artwork, all strokes/fills `#3B4FC2` — used on white/pale grounds: `about.html`'s photo and the home page's About-card circular badge (`.spotlight-media-circle`, whose background is a pale gradient, not a colored fill) |

`logo-seal-white.svg` and `logo-seal-accent.svg` are byte-identical apart from the color values.
Both are 200×200 viewBox with curved `PROFESSOR` / `MATHEMATICS` text on `<textPath>` and a serif
`K²` monogram.

### HTML pages
| File | Responsibility |
|---|---|
| `index.html` | Home only. Static markup: header, hero (title + description + a centered, full-width row of 5 stat numbers — each with its own icon, count-up animation, and staggered entrance fade), a gradient `.hub-divider` bar, then a "Find What You Need" section of four `.spotlight` cards (Browse by Course / Applets / Lecture Videos / About — the last links to `about.html`), footer. Loads `css/styles.css` + `css/home.css`, then `js/data.js` + `js/home.js`. |
| `browse.html` | Shell for every other data-driven view. Its `<body>` contains only the header, mobile menu, an empty `<div id="page">` + `<div id="sidebar-card">`, and the footer. All page content is rendered into `#page` by `js/app.js`. Loads `css/styles.css` only, then `js/data.js` + `js/app.js`. |
| `about.html` | Static bio page — photo, full bio paragraph, a course-pill list, and an email link, built from the shared `.detail-card`/`.item-pill`/`.file-link` components in `css/styles.css`. Not part of the SPA: plain `<a href>` nav links like `index.html`, no client-side routing. Loads `css/styles.css` + `css/about.css`, then `js/about.js` only — **no `js/data.js`**, since this page isn't data-driven. |

Every non-home, non-about view (course directory, per-type browse, per-course type listing, item
detail) is a client-side route inside `browse.html`. `about.html` is the one static page that
lives outside that SPA entirely — it's a real, separate HTML file, not a route.

### Naming conventions
- **HTML**: lowercase, single word, `.html` extension, at repo root. No subdirectories, no
  `index.html`-per-folder pattern.
- **CSS**: lowercase, `css/<scope>.css`. `styles.css` = shared/global; `home.css` / `about.css` =
  page-specific, named after the page that loads it.
- **JS**: lowercase, `js/<name>.js`. `data.js` = data; `app.js` / `home.js` / `about.js` = named
  after the page they drive (`app.js` drives `browse.html`).
- **Data files**: there are **no `.json` files in this repo.** All site data is a JS object literal
  in `js/data.js`.

---

## 2. CSS Organization

Three stylesheets, all loaded via `<link rel="stylesheet">` with document-relative hrefs.

| File | Loaded by | Scope |
|---|---|---|
| `css/styles.css` | `index.html`, `browse.html`, `about.html` | Global. `:root` custom properties, reset, header/banner/nav, search, mobile menu (now an overlay — see §4), page shell + sidebar, breadcrumbs, all card/tile/carousel components, tooltips, footer (including the gradient top border and `.f-links` quick-links column), both media queries for the shared chrome. |
| `css/home.css` | `index.html` only | Home-page-only. Hero (centered text, full-width stat row, per-stat icons, count-up-friendly `tabular-nums`, entrance-fade keyframes), the `.hub-divider` gradient bar, ripple accents, spotlight sections (including the About card's `seal-pulse` hover loop), and the four spotlight animations. |
| `css/about.css` | `about.html` only | About-page-only. Just the photo/name/role row layout and the course-pill wrapper — everything else on the page reuses global `styles.css` components (`.detail-card`, `.item-pill`, `.file-link`). |

### Import pattern to follow
`styles.css` is always first, page-specific CSS second (so the page file can override globals):

```html
<link rel="stylesheet" href="css/styles.css">
<link rel="stylesheet" href="css/home.css">   <!-- or css/about.css, on the page that needs it -->
```

Paths are **document-relative with no leading slash** (`css/…`, `js/…`, `assets/…`). All three
HTML files carry a comment in `<head>` stating this is required because the site is served from a
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
- `styles.css` defines its own `.course-card` / `.pos-front` / `.pos-mid` / `.pos-back` rules —
  the *same class names* `home.css` uses for the animated 3-card shuffle stack, but only the static
  fanned-stack positioning/fill/opacity states, none of the `@keyframes`/`.cycling` shuffle
  behavior. This is intentional: `browse.html`'s Course Materials page reuses the home page's
  3-card stack markup as a static title badge (`.title-stack-badge`, `js/app.js`'s
  `courseMaterials` branch) since there's no hoverable spotlight card there to trigger a shuffle
  against. The two rule sets never load on the same page (`home.css` is index.html-only), so there's
  no runtime conflict, but a change to one stack's visual design (card size, rotation, colors)
  won't automatically apply to the other — they have to be updated in parallel by hand.
- The `course-card-cycle` animation duration (`0.9s`, `home.css:152`) and its `48%` keyframe are
  mirrored as numeric constants in `js/home.js` (`CYCLE_MS = 900`, `RECEDE_MS = 432`). Changing one
  without the other desynchronizes the card-shuffle animation; a comment near the top of the
  Browse-by-Course IIFE in `home.js` says so.
- The About card's seal photo (`.spotlight-media img`, `home.css:92`) sets `will-change: transform`
  specifically to stop its `seal-pulse` hover animation from occasionally re-rendering the SVG's
  `<text>` monogram with a different font fallback mid-animation than the resting image uses —
  `will-change` forces one stable rasterized layer instead of per-frame re-rendering.
- `.mobile-menu` (`styles.css:213`) is `position: absolute` with no `top` set in CSS — each page's
  `toggleMobileMenu()` sets `menu.style.top` inline, computed from the banner's actual rendered
  height, right before opening it. See §4.

---

## 3. Data Structure

**All data lives in `js/data.js` as globals — there is no JSON.** The file declares four top-level
`const`s at file scope (no module, no IIFE), so they land on the global scope and are visible to
whichever page script loads next:

| Global | Type | Contents |
|---|---|---|
| `items` | array of objects | Every material on the site |
| `courseOrder` | array of strings | `["Precalculus", "Calculus I", "Calculus II", "Calculus III", "Linear Algebra", "Discrete", "Statistics"]` — display order and the canonical course-name spellings |
| `typeOrder` | array of strings | `["Applet", "Worksheet", "LectureGuideNotes", "LectureVideo"]` |
| `typeLabel` | object | Type key → human label (`Applet: "Applets"`, `LectureGuideNotes: "Lecture Guides/Notes"`, …) |

### `items` schema

Common to every item:
```js
{
  id: 'g-c1-11',              // unique string; also the /item/<id> route segment
  course: 'Calculus I',       // MUST match a string in courseOrder exactly
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
(`js/app.js:183`) renders `'#'` and empty values as an inert, grayed-out `<span>` with a tooltip
instead of a live link; `launchApplet()` (`js/app.js:173`) no-ops on `'#'`.

### Generated dummy data
`js/data.js:82-140` defines `dummyUnitDefs` (5 units each for Calculus I and Calculus III) and
`buildDummyItems()`, which generates 4 items (worksheet / guide-notes / video / applet) × 10
sections × 5 units × 2 courses = 400 items, appended with `items.push(...buildDummyItems())`.
Item counts shown anywhere on the site therefore include this generated data.

### Consumers
| Consumer | Uses |
|---|---|
| `js/home.js` | `items`, `courseOrder`, `typeOrder` — for the hero stat numbers |
| `js/app.js` | `items`, `courseOrder`, `typeOrder`, `typeLabel` — for every rendered view, search, and the footer date. Search (`searchableText()`) matches title, course, type label, section numbers, `sectionLabel`, and Standard/Blended subtype — not just title+course. |
| `js/about.js` | Nothing — doesn't load `js/data.js` at all. `about.html`'s content (bio, course list) is hand-written static markup, not rendered from `items`. |

### Data duplicated across files (must be kept in sync)
1. **Type keys.** The `data-stat` attributes in `index.html`'s hero stats (`Applet`, `Worksheet`,
   `LectureGuideNotes`, `LectureVideo`) must match `typeOrder` strings in `js/data.js:143`.
   `js/home.js`'s `renderHeroStats()` matches them by string.
2. **Bio paragraph.** Written out in full three times now: `index.html`'s About card uses a short
   one-sentence teaser instead, but the full paragraph appears in `about.html`'s `.detail-desc` and
   as `const bioText` in `js/app.js:13` (declared, still unreferenced by any code).
3. **Course list.** `about.html`'s `.about-courses` pill row hand-types the same seven course names
   as `courseOrder` in `js/data.js:142` — intentionally not data-driven (see §1), so it's a second
   place that would need updating if a course were renamed. Renaming a course is a multi-file
   change: every `items[].course` value in `js/data.js` (including the `dummyUnitDefs` keys and the
   `course === 'Calculus I'` check inside `buildDummyItems()`) must match `courseOrder` exactly, and
   `js/app.js`'s `courseInfo` (blurb/topics/audience) and `courseSymbol` (the per-course glyph badge
   — see below) objects are keyed by the same course strings, so both need a matching key rename too.
   `index.html`'s Applets/Lecture Videos spotlight descriptions also name specific courses in prose
   and don't update automatically.
4. **Footer date.** `index.html` and `about.html` both hardcode `Site last updated: Aug 2, 2026`.
   `browse.html` leaves it empty and `js/app.js:642` fills it from the newest `items[].updated`.
   All three can disagree.
5. **Header, mobile menu, and footer markup** are copy-pasted into all three HTML files (there is
   no partial/include mechanism). `index.html` and `about.html` use plain `<a href>` nav links;
   `browse.html` uses `onclick` handlers into the router. The footer's Quick Links column and
   gradient top border are identical across all three.
6. **`toggleMobileMenu()`** is defined three times — `js/home.js`, `js/app.js`, and `js/about.js` —
   because each page loads only one of the three scripts. All three implementations must stay in
   sync: each computes and sets the overlay's `top` offset from the banner's rendered height before
   opening (see §4). `js/app.js` additionally has `closeMobileMenu()`, used by `browse.html`'s
   in-SPA `onclick` links; all three files also register a document-level `click` listener that
   closes the menu on an outside tap.
7. **Palette hexes.** `unitAccentPalette` in `js/app.js:241` is a literal hex array, unrelated to
   the `:root` variables in `css/styles.css`.

---

## 4. Cross-File Dependencies

### Load order (strict)
```html
<script src="js/data.js"></script>   <!-- must be first -->
<script src="js/app.js"></script>    <!-- or js/home.js -->
```
Neither `js/app.js` nor `js/home.js` guards for missing data — both reference `items` at top level
and would throw if `data.js` were absent or loaded second. Both script files open with a comment
stating this. `about.html` is the exception: it doesn't load `js/data.js` at all, just
`js/about.js` on its own (see §1).

### `index.html` → `browse.html` links
`index.html` links into the SPA using hash routes:
- `browse.html` → default view (Course Materials)
- `browse.html#/applets` → `{ level: 'typeBrowse', type: 'Applet' }`
- `browse.html#/lecture-videos` → `{ level: 'typeBrowse', type: 'LectureVideo' }`

Only those two hashes are recognized. `stateFromHash()` (`js/app.js:649`) parses them; anything
else falls back to Course Materials. Adding a new home-page link into a deeper view requires
adding a case in `stateFromHash()` — the hash strings there must match the `href`s in `index.html`'s
nav pills/hero and the slugs in `statePath()` (`js/app.js:56`). `about.html` is a plain page, not a
hash route — it's linked with a normal `href="about.html"`, same as `index.html`.

### DOM contract between `browse.html` and `js/app.js`
`js/app.js` reads these IDs/selectors and will break if renamed in the HTML:
`#page`, `#sidebar-card`, `.page-shell`, `#mobile-menu`, `#search-input`, `#search-results`,
`#search-clear`, `#search-input-mobile`, `#search-results-mobile`, `#footer-updated`,
`#nav-coursematerials`, `#nav-applets`, `#nav-videos`.

`js/home.js` reads: `#mobile-menu`, `.c-topline`, `.c-banner`, `.hero-stat-num[data-stat="…"]`,
`.course-stack-svg`, `.course-card` (expects exactly 3), and `.spotlight` as the hover target.

### Mobile menu overlay
`#mobile-menu` (`styles.css:213`) is `position: absolute` with no default `top`, so it floats over
the page instead of pushing content down when opened. Each page's `toggleMobileMenu()` sets
`menu.style.top` inline — computed as `.c-topline`'s + `.c-banner`'s `offsetHeight`, measured right
before opening — because the banner's rendered height isn't a fixed number (brand text wraps
differently at different widths). A document-level `click` listener in each script closes the menu
on a tap outside it (checking `menu.contains(e.target)` and `e.target.closest('.hamburger')`). This
pattern — read the banner height, set `top`, toggle, listen for outside clicks — is duplicated
identically across `js/home.js`, `js/app.js`, and `js/about.js` and must stay in sync if the
banner's structure or the menu's positioning changes.

### Sidebar alignment
On the two pages that show `#sidebar-card` (`typeBrowse` and `tier3`, for the three sidebar types —
see the DOM contract above), `alignSidebarToJumpRow()` in `js/app.js` pushes the sidebar's resting
position down with an inline `marginTop` so its top edge lines up with the page's `.jump-row` (course
chips on `typeBrowse`, the Standard/Blended/unit chip rows on `tier3`) instead of the very top of the
main column. It measures via `getBoundingClientRect()` deltas rather than `offsetTop`, since neither
`#page` nor `.page-shell` is a positioned ancestor — `offsetTop` on the jump row would otherwise
resolve relative to the document, not to the sidebar's own position. It's called once after each of
those two render branches sets `page.innerHTML`, and again on `window resize` (matching the
`.page-shell` 900px breakpoint where the sidebar drops below the main column instead of sitting
beside it, at which point the margin is cleared).

### Inline handlers
All interaction uses inline `onclick="…"` attributes in HTML strings, calling functions declared at
file scope in `js/app.js`. Those functions must stay global (no module wrapper, no IIFE around
`app.js`) or every handler breaks silently.

### Asset references
All three HTML files reference the same six favicon/touch-icon files and `assets/logo-seal-white.svg`
(banner + footer); `index.html` additionally uses `assets/logo-seal-accent.svg` for the About card's
photo, and `about.html` uses it again for its own photo. All references are document-relative.

---

## 5. Build & Deploy

- **No build step.** Files are served exactly as committed. No bundler, transpiler, minifier,
  preprocessor, or package manager.
- **Remote:** `https://github.com/ProfKyleKnee/Course-Materials.git` (`origin`).
- **Serving path:** the site is a GitHub Pages *project* site served from the `/Course-Materials/`
  subpath. Comments at the top of all three HTML files state this explicitly and note that a
  leading `/` on any href would break it. The Pages source branch/folder is a repository setting
  and is not recorded anywhere in the repo.
- **No GitHub Actions.** There is no `.github/` directory on any branch — no workflows, no CI, no
  linting, no deploy action.
- **No dates-file automation.** No script or action generates a dates/manifest file. The
  "last updated" values come from two places, both manual or client-side: the hardcoded strings in
  `index.html` and `about.html`, and `js/app.js:642`, which computes the newest `items[].updated`
  at page load for `browse.html`.
- **No other automation** of any kind (no hooks, no cron, no submodules, no LFS).

### PR workflow
Changes land via feature branches merged into `main` through a pull request — never a direct push
or local merge to `main`. `main` currently reflects the full home-page redesign and `about.html`
addition (branches `adjusting-home-page` and `Modify-Home` have both merged in and been deleted).

---

## 6. Code Conventions In Use

### Indentation
- **HTML**: 2 spaces. Top-level `<body>` children start at column 0; nesting indents by 2.
- **`css/styles.css`, `css/home.css`, `css/about.css`, `js/data.js`, `js/app.js`**: every line
  carries a **2-space base indent** — i.e. even top-level rules and declarations begin at column 2,
  not 0. Nesting is 2 spaces on top of that.
- **`js/home.js` and `js/about.js`** are the exceptions: both start at column 0 with conventional
  2-space nesting.
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
- Inline `style="…"` is used sparingly for one-off spacing (e.g. `index.html:199`,
  `js/app.js:488`) alongside the stylesheets.
- SVG is written inline in the HTML for decoration, and as template-literal strings in
  `js/app.js` (`typeIconSVG`, `folderIcon`, `chevronLeftSVG`, `chevronRightSVG`) for icons.
- `aria-label` / `aria-hidden` / `aria-disabled` are used on interactive and decorative elements.
