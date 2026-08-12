# Course-Materials — Repository Reference

Static site (no build step, no package manager, no dependencies). Plain HTML + CSS + vanilla JS,
served directly as files. Everything below describes the current state of `main` (the
`adjusting-home-page` and `Modify-Home` branches that built this up have both merged in), plus the
real Calc 1 catalog and its source files added on the `Calc1-Content-Addition` branch, plus the
real Calc 2 and Calc 3 catalogs and their source files added on the `Calc2&3-Content-Addition`
branch (not yet merged to `main`), plus the interactive `Applets/` system (shared header, the
Quadric Surfaces applet fully wired up) added on the `First-Applet` branch (not yet merged to
`main`), plus a round of Applets/browse-page polish on the `small-fixes` branch (not yet merged to
`main`): Partial Derivatives migrated to the same full-viewport layout as Quadric Surfaces, both
applets' headers rebuilt from a two-bar shared-topline design down to a single gradient banner with
a page-level brand credit row, same-tab applet launches, a course-glyph redesign of the top-level
Applets/Lecture Videos course-carousel headers, and a three.js version regression fix on Partial
Derivatives — see §7 for all of it.

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
├── js/                   Scripts (4 files)
├── Course Materials/     Actual source files (PDF/DOCX) that data.js's items[] link to
└── Applets/              Interactive React applets (source + shipped standalone HTML) — see §7
```

No `.github/`, no `package.json`, no config files, no test directory, no `_layouts`/`_includes`
(not a Jekyll site).

### `Course Materials/`
The real worksheets, lecture guides/notes, and Skill Check files the site links to — not app code,
just static binary assets served as-is. Organized per course as `Course Materials/<Course>/`, e.g.
`Course Materials/Calc 1/`:
- `Notes/Ch. N/` — per-chapter Guide (`_Guide.pdf`/`.docx`) and Notes (`_Notes.pdf`/`.docx`) pairs,
  one per textbook section, plus a `Worksheets/` subfolder (worksheet + `_Solutions` pairs). This is
  the source of `LectureGuideNotes` and `subtype: 'Standard'` `Worksheet` items.
- `Blended Sessions/Unit N/` — the Blended/Honors parallel track, organized by pedagogical unit
  (1-4) rather than chapter number. Source of `subtype: 'Blended'` `Worksheet` items. Also holds
  `Course Review/` (a whole-course review packet, not unit-specific — see the `resource` field
  below) and the Skills Check practice+solutions pairs re-used for `subtype: 'Blended'` Skill Check
  worksheet items.
- `Skill Checks/Skill Check N/` — the Skills Check Practice + `_Solutions` pair used for the
  `LectureGuideNotes`-typed Skill Check items (see below). Only the Practice/Solutions files are
  used; per-part (A/B/C) variants and guideline docs were pruned as not needed for the catalog.
Every `guideFile`/`notesFile`/`worksheetFile`/`solutionsFile` path in `js/data.js` for a course with
real content is a relative path into this tree; `fileLinkHTML()` (`js/app.js`) renders it as a real
link only when the path isn't `'#'` or empty.

### `assets/`
| File | Contents |
|---|---|
| `favicon.svg` | Vector favicon |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Raster favicons at three sizes |
| `favicon.ico` | Legacy `.ico` favicon |
| `apple-touch-icon.png` | iOS home-screen icon |
| `logo-seal-white.svg` | K² seal, all strokes/fills `#FFFFFF` — used on colored grounds (banner, footer) |
| `logo-seal-accent.svg` | Same artwork, all strokes/fills `#3B4FC2` — used on white/pale grounds: `about.html`'s photo and the home page's About-card circular badge (`.spotlight-media-circle`, whose background is a pale gradient, not a colored fill) |
| `favicon-white.svg` | White-recolored twin of `favicon.svg` (ring + `K²` monogram only, no curved text), built for the `Applets/` shared topline's brand badge. That topline is now unused by both migrated applets (see §7), so this file currently has no live consumer — kept in case a future applet's header still wants a mark on a dark/colored ground. |

`logo-seal-white.svg` and `logo-seal-accent.svg` are byte-identical apart from the color values.
Both are 200×200 viewBox with curved `PROFESSOR` / `MATHEMATICS` text on `<textPath>` and a serif
`K²` monogram. `favicon.svg`/`favicon-white.svg` are a simpler, ring-plus-monogram-only pair (no
curved text) meant to stay legible at much smaller sizes than the full seal.

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

**All data lives in `js/data.js` as globals — there is no JSON.** The file declares five top-level
`const`s at file scope (no module, no IIFE), so they land on the global scope and are visible to
whichever page script loads next:

| Global | Type | Contents |
|---|---|---|
| `items` | array of objects | Every material on the site |
| `courseOrder` | array of strings | `["Precalculus", "Calculus I", "Calculus II", "Calculus III", "Linear Algebra", "Discrete", "Statistics"]` — display order and the canonical course-name spellings |
| `typeOrder` | array of strings | `["Applet", "Worksheet", "LectureGuideNotes", "LectureVideo"]` |
| `typeLabel` | object | Type key → human label (`Applet: "Applets"`, `LectureGuideNotes: "Lecture Guides/Notes"`, …) |
| `coursesInDevelopment` | array of strings | Courses with no real materials wired up yet — currently `["Precalculus", "Linear Algebra", "Discrete", "Statistics"]`. Shared between `js/app.js` (caution-tape badge overlay, "In Development" pill, locks the course-directory-card against navigation — see "In-development course lock" under §4) and `js/home.js` (excluded from the hero "Courses" stat count). Remove a course from this list once its real catalog replaces the placeholder items. |

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
| `LectureVideo` | `playlistUrl`, optional `inProgress: true` (see below) |
| `Applet` | `launchUrl`, `curve` (an SVG path `d` string used for the card's mini-graph and the dot's `offset-path`) |

An optional `inProgress: true` field on a `LectureVideo` item means the section has been recorded
but the playlist isn't linked yet (as opposed to a course in `coursesInDevelopment`, which has no
materials of any kind). It renders an amber "In Progress" pill on the item's card (`cardHTML()` in
`js/app.js`) and swaps the detail page's disabled-link tooltip to "Video in progress — check back
soon" instead of the generic "Playlist not yet linked" (`fileLinkHTML()` call in the `detail` render
branch). Currently only used on Calculus III (29 of its 40 `LectureVideo` items), which has filmed
far fewer sections than Calculus I/II.

`sectionLabel` is present on most non-Applet items but is **not read by any current code**, except
as the fallback title text for the section-stripped Blended worksheet titles generated for Calc 1
(see below).

An optional `resource: true` field marks an item as *not* belonging to any unit (e.g. Calc 1's
"Graphs To Know" reference sheet and its "Course Review" packet). `tier3BodyHTML()` (`js/app.js`)
pulls `resource` items out of the unit computation entirely and renders them in their own
"Resources" carousel block *after* the last unit's block, rather than grouping them into a
(nonexistent) unit.

For courses in `coursesInDevelopment` (Precalculus, Linear Algebra, Discrete, Statistics), every
file/URL field in the dataset is still a single hand-written placeholder item per type with `'#'`
values. **Calculus I, II, and III are the exception** — every `LectureGuideNotes`, `Worksheet`, and
(for Calc I/II) `LectureVideo` item has a real `guideFile`/`notesFile`/`worksheetFile`/
`solutionsFile` (a path into `Course Materials/Calc <N>/...`, see above) or `playlistUrl` (a real
YouTube playlist link). Calc III's `LectureVideo` items are a mix — see the `inProgress` note above.
`fileLinkHTML()` (`js/app.js`) renders `'#'` and empty values as an inert, grayed-out `<span>` with
a tooltip instead of a live link; `launchApplet()` (`js/app.js`) no-ops on `'#'`. Worksheet/Guide/
Notes links are rendered with `{ newTab: true }` (opens `target="_blank" rel="noopener"`) so a
student clicking a PDF doesn't lose their place in the browse UI — `LectureVideo`/channel links
already had this.

Calc I/II's Skills Check 1(/2/3 for Calc I) are represented twice, once per subtype: a
`LectureGuideNotes` item (Practice+Solutions as `guideFile`/`notesFile`) and a `subtype: 'Blended'`
`Worksheet` item (a *different* Blended-track Practice+Solutions pair, from `Blended Sessions/Unit
N/`, not a duplicate of the first). Both use the placeholder section `'<chapter>.0'` (e.g. `'2.0'`)
so they sort first within their chapter's unit grouping, ahead of that chapter's real `X.Y`
sections — there's no dedicated "Skill Check" item type, this is a sorting convention layered on
the existing schema. Calc III has no Skill Checks or Blended Sessions folder, so it has neither.

### No generated dummy data
`js/data.js` previously defined `dummyUnitDefs` / `buildDummyItems()` to generate placeholder items
for whichever course didn't have a real catalog yet (Calculus I, then Calculus III). Both have since
been replaced with real catalogs (see below), so the generator and its `items.push(...)` call were
deleted entirely — there's no synthetic data left in `items[]`, only the hand-written placeholder
items for courses in `coursesInDevelopment` and the real per-course catalogs.

### Calc 1/2/3's real catalogs
Calculus I/II/III's `items[]` entries are hand-written, real data — not generated:

| Course | LectureGuideNotes | Worksheet | LectureVideo | Applet | Total |
|---|---|---|---|---|---|
| Calculus I | 38 | 62 | 36 | 0 | 136 |
| Calculus II | 40 | 65 | 36 | 0 | 141 |
| Calculus III | 45 | 45 | 40 (11 real, 29 `inProgress`) | 1 | 131 |

Calc I's chapters (2-5) don't align with its pedagogical unit numbers (1-4), since Chapter 1 has no
unit of its own (just the "Graphs To Know" resource item) and Unit 1 starts at Chapter 2.
`unitLabelOverrides` / `unitLabel(course, u)` (`js/app.js`) remaps the *displayed* unit number for
Calculus I only (chapter `2`→"Unit 1", `3`→"2", `4`→"3", `5`→"4"); `unitOf()`'s raw return value
(the chapter number) is still what's used for grouping/filtering/`isolateUnit()` state everywhere —
only the on-screen "Unit N" text changes. Calc II and Calc III have no such override — their
textbook chapter numbers and pedagogical unit numbers already align 1:1.

Both Calc II and Calc III also carry a handful of `resource: true` items beyond the "reference
sheet" pattern described above — cumulative review packets and exam-practice worksheets (e.g. Calc
II's "Course Review", "Series Review 1/2"; Calc III's "Exam 5 Review") and, for Calc III, a
"Recommended Book Problems" `LectureGuideNotes` reference item per chapter.

### Consumers
| Consumer | Uses |
|---|---|
| `js/home.js` | `items`, `courseOrder`, `typeOrder`, `coursesInDevelopment` — for the hero stat numbers (the "Courses" count excludes courses in `coursesInDevelopment`; the four type counts don't) |
| `js/app.js` | `items`, `courseOrder`, `typeOrder`, `typeLabel`, `coursesInDevelopment` — for every rendered view, search, and the footer date. Search (`searchableText()`) matches title, course, type label, section numbers, `sectionLabel`, and Standard/Blended subtype — not just title+course. |
| `js/about.js` | Nothing — doesn't load `js/data.js` at all. `about.html`'s content (bio, course list) is hand-written static markup, not rendered from `items`. |

### Data duplicated across files (must be kept in sync)
1. **Type keys.** The `data-stat` attributes in `index.html`'s hero stats (`Applet`, `Worksheet`,
   `LectureGuideNotes`, `LectureVideo`) must match `typeOrder` strings in `js/data.js`.
   `js/home.js`'s `renderHeroStats()` matches them by string.
2. **Bio paragraph.** Written out in full three times now: `index.html`'s About card uses a short
   one-sentence teaser instead, but the full paragraph appears in `about.html`'s `.detail-desc` and
   as `const bioText` in `js/app.js` (declared, still unreferenced by any code).
3. **Course list.** `about.html`'s `.about-courses` pill row hand-types the same seven course names
   as `courseOrder` in `js/data.js` — intentionally not data-driven (see §1), so it's a second
   place that would need updating if a course were renamed. Renaming a course is a multi-file
   change: every `items[].course` value in `js/data.js` must match `courseOrder` exactly, any
   `coursesInDevelopment` entry for that course must be renamed too, and `js/app.js`'s `courseInfo`
   (blurb/topics/audience) and `courseSymbol` (the per-course glyph badge — see below) objects are
   keyed by the same course strings, so both need a matching key rename too. `index.html`'s
   Applets/Lecture Videos spotlight descriptions also name specific courses in prose and don't
   update automatically.
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
position down with an inline `marginTop` so its top edge lines up with the page's `.jump-row` instead
of the very top of the main column. It measures via `getBoundingClientRect()` deltas rather than
`offsetTop`, since neither `#page` nor `.page-shell` is a positioned ancestor — `offsetTop` on the
jump row would otherwise resolve relative to the document, not to the sidebar's own position. It's
called once after each of those two render branches sets `page.innerHTML`, and again on `window
resize` (matching the `.page-shell` 900px breakpoint where the sidebar drops below the main column
instead of sitting beside it, at which point the margin is cleared). `typeBrowse` no longer renders
a `.jump-row` at all (the course chip filter row was removed from the top-level Applets/Lecture
Videos pages — see "Course-carousel headers" below), so on that page the function's `if (!jumpRow ...)
{ sidebar.style.marginTop = ''; return; }` branch always fires and the sidebar just sits at the top
of the main column; the function still does real work on `tier3`, where the Standard/Blended/unit
chip rows still exist.

### Course-carousel headers (`typeBrowse` pages)
`courseCarouselsHTML()` (`js/app.js:764`) drives the per-course sections on the top-level Applets and
Lecture Videos pages (both share this one function via the `typeVal` param). Each course section's
header is now a `courseSymbol` glyph in a `.cc-glyph` badge (44×44px — the same glyphs the course-
directory-card badge uses, reused here deliberately instead of introducing per-course color, since
color already means something specific via `--unit-color` on a course's own `tier3` page) next to the
course name and an inline item count (`"N applets"` / `"N worksheets"` etc., singularized for count
1). The whole per-course block list is wrapped in a `.course-carousel-list` container specifically so
a hairline divider (`.course-carousel-list > .carousel-block + .carousel-block`) can separate course
sections from each other without also affecting `tier3`'s own unit carousels, which share the same
`.carousel-block` class but aren't wrapped in that container. The old `.jump-row` course-chip filter
row above this list (rendered via `jumpRowHTML()`) was removed from `typeBrowse` entirely — see
"Sidebar alignment" above for the knock-on effect on sidebar positioning.

### In-development course lock
`js/app.js` defines `isInDevelopment(course)`, `devTapeHTML(course)`, and `devPillHTML(course)`,
all driven by `coursesInDevelopment` in `js/data.js` (see §3). Three render sites call all three:
the `courseMaterials` course-directory-card, the `tier2` course-landing header, and `titleBlockHTML()`
(used by the `tier3` course+type header — not the top-level `typeBrowse` header, which has no
specific course and so no badge to flag). Each site wraps its course-symbol badge (`.cd-symbol-badge`
or `.title-icon-badge`) with an added `.badge-dev-wrap` class and injects `devTapeHTML()`'s
`<span class="caution-tape">` inside it — a diagonal repeating-gradient stripe sized in `%` so it
scales to whichever badge it's placed in (`css/styles.css`) — and appends `devPillHTML()`'s
`<span class="in-dev-pill">In Development</span>` next to the title text. The course-directory-card
additionally gets no `onclick` attribute at all when `isInDevelopment()` is true (instead of a
guarded/no-op handler), plus a `.course-directory-card-locked` class that zeroes out the hover
lift/box-shadow/border-left-color and the badge's hover scale — so there's nothing to click and
nothing that visually suggests there is. `.in-progress-pill` (used on `LectureVideo` items with
`inProgress: true`, see §3) is a separate, unrelated pill sharing the same amber palette by
convention, not by shared class or shared list.

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

---

## 7. Applets

Interactive teaching tools (Calc 1–3 React apps), added on the `First-Applet` branch (not yet
merged to `main`). Each applet is authored as a React app and delivered as one self-contained,
dependency-free HTML file with React/ReactDOM bundled inline via esbuild — no CDN `<script>` tags,
no external `bundle.js` sibling file. This keeps the site's own "no build step to *serve* anything"
rule intact: the compiled HTML files are committed and served as-is, same as every other file in the
repo. The build step exists only to *produce* those files from source; it isn't part of
Course-Materials' own runtime and there's no `package.json` anywhere in this repo for it.

### Folder structure
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

### Per-applet design-decision logs
Files named `spec.md` (or a variant like `spec_4.md`) are per-applet logs of settled decisions, open
threads, and pedagogical goals — read for context, not executed. Not every applet folder has one yet
(as of this branch, only Quadric Surfaces, Partial Derivatives, and Lagrange Multipliers do); worth
back-filling one when doing substantial work on an applet that lacks it.

### Build model
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

### Header pattern
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

### Full-viewport layout contract
Also governed by `applet-header.css` (see its own comments for the full reasoning): `html`/`body`
become a fixed-height flex column so `#root` gets exactly the viewport's height (there's no separate
header element outside `#root` anymore — see "Header pattern" above), with `#root { overflow: auto }`
acting as a safety net for unusually short windows or unusually tall content rather than the normal
case. A migrated applet's own top-level React wrapper must cooperate — `height: "100%"` and
`boxSizing: "border-box"`, **not** `minHeight: "100vh"` (which was correct back when the app *was*
the entire page, but forces a scrollbar on every window size regardless of content once anything
else shares the viewport with it).

### Wiring an applet into the main site
An applet is just another `Applet`-typed row in `js/data.js`'s `items[]` (see §3) —
`launchUrl` points at its shipped HTML file's path relative to the repo root (e.g.
`'Applets/Calc 3/Quadric Surfaces/quadric_surface_explorer_5.html'`), and `sections` should match
whatever chapter/section its *topic* actually covers, since it drives unit-carousel placement via
`unitOf()` (`js/app.js:118`) — it has no inherent relationship to the applet's own filename or `id`,
so double-check a new item's `sections` value against that topic's existing
`LectureGuideNotes`/`Worksheet` items rather than trusting a placeholder value someone else wrote.
`launchApplet()` (`js/app.js:214`) navigates via `window.location.href = url` — **same tab**, not
`window.open(..., '_blank')` — specifically so the browser's own back button returns to wherever the
user launched the applet from (the Applets grid, a course's unit carousel, etc.) instead of leaving
an orphaned tab. Each migrated applet's own "All Applets" banner link (see "Header pattern" above) is
a second, independent way back to `browse.html#/applets` specifically, regardless of where the user
actually came from.
