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
Derivatives — see §7 for all of it, plus the Calc 2 Polar Graphing & Integration applet wired into
`js/data.js` and migrated to that same canonical header/footer pattern, a new `polarRose` card-tile
hover animation (a progressive stroke-dashoffset curve reveal, not the generic curve+dot tile — see
`.claude/rules/wiring.md`), and a Calc II Chapter 4/5 unit-merge fix (`unitMergeOverrides` in
`js/app.js`) added on the `polar-graphing` branch (not yet merged to `main`), plus the Calc 2 Taylor
Series & Remainder Explorer applet wired into `js/data.js` (Unit 4, via `unitMergeOverrides` same as
Polar Graphing) and migrated to that same canonical header/footer pattern, a new `taylorSeries`
card-tile hover animation (a morphing polynomial path lerping between precomputed degree shapes, not
the generic curve+dot tile or a static crossfade — see `.claude/rules/wiring.md`), and a round of
post-migration layout/sizing fixes (default `n`/preset/view-zoom changes, a card `max-width` fix so
the banner no longer stretches full-bleed, a graph-box `min-height` fix for overlap on short
viewports, a compact-mode media query so the error-investigation rail fits without scrolling, an
`svg` `preserveAspectRatio` fix so corner labels sit flush at the top-left instead of being
letterboxed downward, adaptive x-axis tick marks, and moving the error panel's selected-x marker off
the error line and down onto the x-axis — see that applet's own `spec_4.md` and
`.claude/rules/applets.md` for the general gotchas these fixes surfaced) added on the
`TaylorSeries-Applet` branch (not yet merged to `main`).

---

## 0. Working Mode

Always work in manual mode — confirm before taking actions the user hasn't explicitly asked for
(destructive commands, git pushes/PRs, multi-step browser automation sequences like `wait`/`hover`
chains, etc.) rather than proceeding through them autonomously. This applies for the whole repo
unless a specific request says otherwise for that task.

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
| `logo-seal-accent.svg` | Same artwork, all strokes/fills `#3B4FC2` — used on white/pale grounds (`about.html`'s photo, the home page's About-card badge) |
| `favicon-white.svg` | White-recolored twin of `favicon.svg`, built for the (now-retired) `Applets/` shared topline — see [.claude/rules/applets.md](.claude/rules/applets.md) |

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
Several rules quietly depend on state in another file staying in sync (a global `svg` rule, a
duplicated `.course-card` rule set shared by two unrelated components, animation-duration constants
mirrored between CSS and JS, the mobile-menu `top` offset). Full list: see
[.claude/rules/wiring.md](.claude/rules/wiring.md#cross-file-css-gotchas).

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

### Calc 1/2/3's real catalogs
Calculus I/II/III's `items[]` entries are hand-written, real data — not generated:

| Course | LectureGuideNotes | Worksheet | LectureVideo | Applet | Total |
|---|---|---|---|---|---|
| Calculus I | 38 | 62 | 36 | 0 | 136 |
| Calculus II | 40 | 65 | 36 | 1 | 142 |
| Calculus III | 45 | 45 | 40 (11 real, 29 `inProgress`) | 1 | 131 |

Calc I's chapters (2-5) don't align with its pedagogical unit numbers (1-4), since Chapter 1 has no
unit of its own (just the "Graphs To Know" resource item) and Unit 1 starts at Chapter 2.
`unitLabelOverrides` / `unitLabel(course, u)` (`js/app.js`) remaps the *displayed* unit number for
Calculus I only (chapter `2`→"Unit 1", `3`→"2", `4`→"3", `5`→"4"); `unitOf()`'s raw return value
(the chapter number) is still what's used for grouping/filtering/`isolateUnit()` state everywhere —
only the on-screen "Unit N" text changes. Calc II has a *different* kind of override: its Chapter 4
(Power Series) and Chapter 5 (Parametric & Polar) are one pedagogical unit (Unit 4) per the Blended
Sessions folder structure, so `unitMergeOverrides` folds Chapter 5 into Chapter 4 inside `unitOf()`
itself — a real grouping merge, not just a relabel, so every Chapter 5 item (Lecture Guides/Notes,
Worksheets, Lecture Videos, and the Polar Graphing & Integration applet alike) shows up in the same
Unit 4 carousel as Chapter 4 items. See `.claude/rules/wiring.md` for the mechanism. Calc III has no
override — its textbook chapter numbers and pedagogical unit numbers already align 1:1.

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
Several values (type keys, the bio paragraph, the course list, the footer date, header/menu/footer
markup, `toggleMobileMenu()`, palette hexes) are hand-copied across two or more files instead of
being computed from one source. Full list with specifics: see
[.claude/rules/wiring.md](.claude/rules/wiring.md#data-duplicated-across-files-must-be-kept-in-sync).

---

## 4. Cross-File Dependencies

Rules for how the site's files are paired, linked, and kept in sync with each other — script load
order, the `index.html`→`browse.html` hash routes, the DOM contract between `browse.html` and
`js/app.js`, the mobile menu overlay, sidebar alignment, course-carousel headers, the
in-development course lock, inline `onclick` handlers, asset references, and the full list of data
duplicated across files — have moved to
[.claude/rules/wiring.md](.claude/rules/wiring.md). Load that file before making any change that
touches more than one file's wiring to another.

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

Indentation, CSS style, class naming, JavaScript style, comment style, and HTML style rules for
this repo have moved to [.claude/rules/code-style.md](.claude/rules/code-style.md). Load that file
before writing or editing any HTML/CSS/JS here.

---

## 7. Applets

Interactive teaching tools (Calc 1–3 React apps), added on the `First-Applet` branch (not yet
merged to `main`) and living under `Applets/`. Full rules — folder structure, per-applet spec.md
logs, the build model (including the pinned-three.js-version gotcha for Partial Derivatives), the
shared gradient-banner header pattern, and the full-viewport layout contract — have moved to
[.claude/rules/applets.md](.claude/rules/applets.md). Load that file before doing any applet
work (building, migrating, or rebundling one, or editing its header/layout). For how an applet
gets wired into `js/data.js`'s `items[]`, see
[.claude/rules/wiring.md](.claude/rules/wiring.md#wiring-an-applet-into-the-main-site) instead.
