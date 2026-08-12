# Curve Sketching Studio — Project Spec

_Course: Calculus 1_
_Folder: Applets/Calc 1/Curve Sketching Studio/_
_Last updated: 2026-08-12_

## Current status

The applet is at v13, all six tiers wired and math-validated (14-check Playwright suite passed in an earlier session). This session fixed two polish issues: (1) a grid-overflow bug that misaligned the header's right edge against the derivative-info panel, and (2) the header text (kicker/title/tagline) was sized up for better visual presence. Both are confirmed fixed and verified. Kyle has a documented list of six bugs and ten design notes from his own testing of v1 that are the intended next work item, but they have not been discussed or actioned in this project yet — start there before adding new tiers or features. This handoff includes a decompiled `.jsx` source (see Technical build notes) since the working file had only ever existed as a compiled single-file HTML bundle.

## Pedagogical goal

Helps Calc 1 students synthesize first- and second-derivative sign information into a curve sketch, mirroring Kyle's exam format (students get derivative number lines and must produce a possible graph). Used primarily for live classroom demonstration; also used by students on phones/tablets, so responsive layout is a real constraint. The applet never shows students the underlying function formula — functions exist only for internal validation. Tiers are jumpable in any order, not a forced progression. Locked framing tagline: "Let's use information from the 1st and 2nd derivatives to build a possible sketch of the function."

## Design decisions log

- Prior sessions: six tiers scoped and named for the mathematical concept rather than a difficulty number — Baseline (clean cubic), Faker (false critical point), Impostor (false inflection point), The Gap (two vertical asymptotes), Corner (non-differentiable seam), Capstone (all skills combined, no formula shown).
- Prior sessions: clickable interval-segment feature deferred in favor of x-axis labels. Engine only supports vertical-asymptote domain breaks, not removable holes.
- Prior sessions: square-root notation uses CSS `text-decoration: overline` on the digit (Unicode combining characters rendered unreliably). Domain-break ticks show the actual x-coordinate in italics, not a bare "u." Pause duration during animation is fixed at 1 second regardless of playback speed. Label badges fade via CSS opacity transition, not instant disappearance. Number-line spacing is even/non-proportional for busy tiers, capped at four marked values per line.
- This session: root-caused the header/panel misalignment to `.main-grid`'s `grid-template-columns: 62% 38%` — the two percentages already summed to 100% of the container, so the 18px column gap pushed the second column 18px past the container's right edge. Fixed by switching to `62fr 38fr`, which correctly reserves space for the gap. Verified 0px difference between header and panel right edges at four viewport widths (1024–1400px).
- This session: header kicker/title/tagline sized up from 10px/17px/13px to 12px/23px/15px (mockup "Option C" of four sizes shown), with tab-pill label text nudged from 12.5px/10px to 13px/10.5px to stay proportional. Kicker and tagline text-opacity increased slightly (0.65→0.7, 0.78→0.82) alongside the size bump.

## Interaction & animation details

(Carried from prior sessions — not re-verified in detail this session beyond the round-trip test below.)
- Two-pass reveal: 1st Derivative Pass animates the curve using only increasing/decreasing behavior; 2nd Derivative Pass adds concavity. Play button pulses to draw attention before first use.
- Domain-break ticks and sign-row labels pulse (ring animation, 0.8s ease-out ×2) when clicked/reviewed, with label badges fading in/out via opacity transition.
- Tab switching uses a sliding "thumb" behind the active tab pill (position/size tracked via `offsetLeft`/`offsetWidth` of the active button, animated via CSS transition on `left`/`top`/`width`/`height`).

## Technical build notes

- **Stack**: React + esbuild, bundled to a single self-contained HTML file (`curve-sketching-v13.html`) for offline/LMS delivery. No external requests at runtime.
- **This handoff's source files**: The project has only ever kept the compiled HTML as its working file — there was no separately maintained `.jsx` source. For this handoff, the JSX/JS application code was extracted from the bundle (`src/main.jsx`'s compiled output lives between the `// src/main.jsx` marker and the final `root.render()` call) and mechanically decompiled back into JSX syntax using a Babel AST transform (converting `jsx()`/`jsxs()` calls back into `<Element>` syntax). **This is a reconstruction, not the original source** — variable names, structure, and logic are faithful (it's a direct AST-level inverse of the compile step), but formatting/comments are not preserved from any "true" original since none was ever saved separately.
- **Verification of the reconstruction**: re-bundled the decompiled `.jsx` with esbuild (`jsx: "automatic"`), reassembled it into a full HTML page with the extracted stylesheet, and ran it through Playwright: zero console errors on load, zero React key warnings, and a spot-check across three tiers (Baseline, Faker, Impostor) including a triggered play animation — all pixel- and behavior-identical to the v13 build. One real bug was caught and fixed during the reconstruction itself: two `.map()` calls return a `<>...</>` Fragment shorthand, which can't carry a `key` prop — these needed the explicit `<Fragment key={...}>` form instead, or React throws a missing-key warning on those lists.
- **Files delivered**: `curve-sketching-v13.jsx` (component source, needs React 18+/`react-dom/client`) and `curve-sketching-styles.css` (the full stylesheet — the JSX alone will not render correctly without it). To get back to a working single-file HTML build, bundle the `.jsx` with esbuild using `jsx: "automatic"` and inline both the resulting JS and the CSS into an HTML shell (same pattern as all of Kyle's other applets).
- Uses SymPy (offline, prior sessions) for symbolic math verification and Playwright for UI verification; no runtime dependency on either.
- Shares the Cloud Pastel visual system and header design (adopted from the Quadric Surface Explorer) with the rest of Kyle's applet suite.

## Open threads / questions

- Six bugs and ten design notes from Kyle's personal testing of v1 are documented but not yet triaged/actioned in this project — should be the first work item in the next session, before new tiers or features.
- Whether Kyle wants future sessions in *this* project to keep working directly against the compiled HTML (as before) or to adopt the newly-reconstructed `.jsx` + `.css` as the maintained source going forward — worth deciding explicitly since it changes the workflow (edit JSX + rebuild vs. edit compiled bundle directly).
