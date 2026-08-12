# Cross-File Wiring — Rules & Conventions

Load this file whenever a change touches how the site's files are paired, linked, or kept in sync
with each other — adding a route, renaming a course, touching shared DOM IDs/classes, or hooking a
new item into `js/data.js`. Not needed for applet-internal work (visual/layout/build concerns for a
single applet's own JSX — see [applets.md](applets.md)) or general page design.

## Cross-file CSS gotchas
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
  height, right before opening it. See "Mobile menu overlay" below.

## Load order (strict)
```html
<script src="js/data.js"></script>   <!-- must be first -->
<script src="js/app.js"></script>    <!-- or js/home.js -->
```
Neither `js/app.js` nor `js/home.js` guards for missing data — both reference `items` at top level
and would throw if `data.js` were absent or loaded second. Both script files open with a comment
stating this. `about.html` is the exception: it doesn't load `js/data.js` at all, just
`js/about.js` on its own.

## `index.html` → `browse.html` links
`index.html` links into the SPA using hash routes:
- `browse.html` → default view (Course Materials)
- `browse.html#/applets` → `{ level: 'typeBrowse', type: 'Applet' }`
- `browse.html#/lecture-videos` → `{ level: 'typeBrowse', type: 'LectureVideo' }`

Only those two hashes are recognized. `stateFromHash()` (`js/app.js:649`) parses them; anything
else falls back to Course Materials. Adding a new home-page link into a deeper view requires
adding a case in `stateFromHash()` — the hash strings there must match the `href`s in `index.html`'s
nav pills/hero and the slugs in `statePath()` (`js/app.js:56`). `about.html` is a plain page, not a
hash route — it's linked with a normal `href="about.html"`, same as `index.html`.

## DOM contract between `browse.html` and `js/app.js`
`js/app.js` reads these IDs/selectors and will break if renamed in the HTML:
`#page`, `#sidebar-card`, `.page-shell`, `#mobile-menu`, `#search-input`, `#search-results`,
`#search-clear`, `#search-input-mobile`, `#search-results-mobile`, `#footer-updated`,
`#nav-coursematerials`, `#nav-applets`, `#nav-videos`.

`js/home.js` reads: `#mobile-menu`, `.c-topline`, `.c-banner`, `.hero-stat-num[data-stat="…"]`,
`.course-stack-svg`, `.course-card` (expects exactly 3), and `.spotlight` as the hover target.

## Mobile menu overlay
`#mobile-menu` (`styles.css:213`) is `position: absolute` with no default `top`, so it floats over
the page instead of pushing content down when opened. Each page's `toggleMobileMenu()` sets
`menu.style.top` inline — computed as `.c-topline`'s + `.c-banner`'s `offsetHeight`, measured right
before opening — because the banner's rendered height isn't a fixed number (brand text wraps
differently at different widths). A document-level `click` listener in each script closes the menu
on a tap outside it (checking `menu.contains(e.target)` and `e.target.closest('.hamburger')`). This
pattern — read the banner height, set `top`, toggle, listen for outside clicks — is duplicated
identically across `js/home.js`, `js/app.js`, and `js/about.js` and must stay in sync if the
banner's structure or the menu's positioning changes.

## Sidebar alignment
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

## Course-carousel headers (`typeBrowse` pages)
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

## In-development course lock
`js/app.js` defines `isInDevelopment(course)`, `devTapeHTML(course)`, and `devPillHTML(course)`,
all driven by `coursesInDevelopment` in `js/data.js`. Three render sites call all three:
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
`inProgress: true`) is a separate, unrelated pill sharing the same amber palette by convention, not
by shared class or shared list.

## Inline handlers
All interaction uses inline `onclick="…"` attributes in HTML strings, calling functions declared at
file scope in `js/app.js`. Those functions must stay global (no module wrapper, no IIFE around
`app.js`) or every handler breaks silently.

## Asset references
All three HTML files reference the same six favicon/touch-icon files and `assets/logo-seal-white.svg`
(banner + footer); `index.html` additionally uses `assets/logo-seal-accent.svg` for the About card's
photo, and `about.html` uses it again for its own photo. All references are document-relative.

## Data duplicated across files (must be kept in sync)
1. **Type keys.** The `data-stat` attributes in `index.html`'s hero stats (`Applet`, `Worksheet`,
   `LectureGuideNotes`, `LectureVideo`) must match `typeOrder` strings in `js/data.js`.
   `js/home.js`'s `renderHeroStats()` matches them by string.
2. **Bio paragraph.** Written out in full three times now: `index.html`'s About card uses a short
   one-sentence teaser instead, but the full paragraph appears in `about.html`'s `.detail-desc` and
   as `const bioText` in `js/app.js` (declared, still unreferenced by any code).
3. **Course list.** `about.html`'s `.about-courses` pill row hand-types the same seven course names
   as `courseOrder` in `js/data.js` — intentionally not data-driven, so it's a second place that
   would need updating if a course were renamed. Renaming a course is a multi-file change: every
   `items[].course` value in `js/data.js` must match `courseOrder` exactly, any
   `coursesInDevelopment` entry for that course must be renamed too, and `js/app.js`'s `courseInfo`
   (blurb/topics/audience) and `courseSymbol` (the per-course glyph badge) objects are keyed by the
   same course strings, so both need a matching key rename too. `index.html`'s Applets/Lecture
   Videos spotlight descriptions also name specific courses in prose and don't update automatically.
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
   opening (see "Mobile menu overlay" above). `js/app.js` additionally has `closeMobileMenu()`, used
   by `browse.html`'s in-SPA `onclick` links; all three files also register a document-level `click`
   listener that closes the menu on an outside tap.
7. **Palette hexes.** `unitAccentPalette` in `js/app.js:241` is a literal hex array, unrelated to
   the `:root` variables in `css/styles.css`.

## Wiring an applet into the main site
An applet is just another `Applet`-typed row in `js/data.js`'s `items[]` — `launchUrl` points at its
shipped HTML file's path relative to the repo root (e.g.
`'Applets/Calc 3/Quadric Surfaces/quadric_surface_explorer_5.html'`), and `sections` should match
whatever chapter/section its *topic* actually covers, since it drives unit-carousel placement via
`unitOf()` (`js/app.js:118`) — it has no inherent relationship to the applet's own filename or `id`,
so double-check a new item's `sections` value against that topic's existing
`LectureGuideNotes`/`Worksheet` items rather than trusting a placeholder value someone else wrote.
`launchApplet()` (`js/app.js:214`) navigates via `window.location.href = url` — **same tab**, not
`window.open(..., '_blank')` — specifically so the browser's own back button returns to wherever the
user launched the applet from (the Applets grid, a course's unit carousel, etc.) instead of leaving
an orphaned tab. Each migrated applet's own "All Applets" banner link (see
[applets.md](applets.md#header-pattern)) is a second, independent way back to `browse.html#/applets`
specifically, regardless of where the user actually came from.
