# Taylor Series & Remainder Explorer — Project Spec

_Course: Calc 2_
_Folder: Applets/Calc 2/Taylor Series Explorer/_
_Last updated: 2026-08-12 (backfilled from full build history — this is a first draft, please review)_

## Current status

Feature-complete and fully built. Both deliverables exist and have been verified to behave identically: a standalone offline HTML file (single-file, zero network requests) and a Claude.ai artifact (JSX). The most recent change was moving the shaded error region so it spans [a, b] instead of [x₀, x]. No open build work is pending — future sessions should treat this as a working baseline to iterate from, not something mid-construction.

## Pedagogical goal

Illustrate Taylor polynomials and Taylor's Remainder Theorem for Calc 2 students: how a polynomial approximates a function near a center point x₀, how the approximation improves as degree n increases, and how to compute/interpret the Lagrange error bound (using a bound M on the (n+1)th derivative over an interval [a,b]). Should let a student build intuition by dragging/typing rather than just reading a static picture.

## Design decisions log

- Function input: seven presets — eˣ, sin x, cos x, ln(1+x), 1/(1−x), arctan x, (1+x)^k (with an editable k) — plus a free-text custom expression box. Custom expressions use a hand-written recursive-descent parser (see Technical build notes), not mathjs.
- Center x₀: defaults to 0. Editable via a small badge in the graph's bottom-left corner (not inside the polynomial box — tried that first, moved it out) and via a draggable dot on the curve itself, two-way synced (drag updates the box, typing snaps the dot).
- x₀ badge styling: border in the accent color, fill matches the graph's background (not white) so it reads as part of the graph rather than a sticker on top.
- Degree n: the primary/hero control on the page — sits in its own bordered band below the graph, visually dominant. Max degree raised over several rounds: 10 → 25 → 50 (higher n is mostly useful for showing divergence outside the radius of convergence, since coefficients shrink fast inside it). Slider drag is decoupled from the committed value — a continuous internal value drives smooth handle motion while the displayed/used n only commits at whole numbers, so it doesn't feel like it's snapping between ticks.
- Polynomial display: always visible (not toggleable — tried a toggle first, removed it). Highest-order surviving (non-zero) term is always highlighted as the "newest" term. Shows **exact fractions with factorial notation** (e.g. `1/5!`) when x₀ = 0 for the six presets where that's mathematically clean (eˣ, sin x, cos x, ln(1+x), 1/(1−x), arctan x); falls back to decimals for any other center, and always decimals for the binomial preset and custom functions (their coefficients aren't clean rationals in general). Truncates to the first 10 non-zero terms + "⋯" + the final term once there would be more than 11 terms shown (relevant once n got large).
- Error investigation is behind an "E" toggle (small square button next to zoom/autofit, tooltip "Investigate Errors"). Off by default so n and the polynomial own the page on first load. Toggling on reveals a side rail and resizes the graph — see Interaction details for the resize behavior constraint.
- Selected error point x: draggable on the graph (all three markers — the point on f, the point on P, and the midpoint indicator — are each independently draggable) and typeable in a box styled to match the a/b interval boxes (signals it's editable the same way). Domain-invalid x shows a warning under the box.
- Shaded error region on the graph: **spans [a, b]**, not [x₀, x] (changed from an earlier version that used [x₀, x]).
- Rail contents, top to bottom: x readout, |Error|, Rⁿ bound, then the M controls below a divider. Each of the three readouts has a one-line caption explaining what it shows. Rail is a fixed 220px (not a proportional column) specifically to leave the graph as much room as possible — this width was a first guess, not confirmed as final.
- Rⁿ bound hides (replaced with an explanatory warning) when the selected x falls outside [a, b], since Taylor's Theorem's bound isn't valid there.
- M (the derivative bound): both a slider and an editable number box, kept in sync. "Jump to min / reset" button snaps to the smallest valid M. "Shrink to smallest possible [a,b]" button collapses the interval to exactly [x₀, x]. [a,b] auto-tracks to [x₀, x] until the student manually edits a or b, at which point auto-tracking stops. Negative M is disallowed with an explicit warning ("M can't be negative — it's a bound on an absolute value").
- M-slider range adapts as you type: upper bound = `ceil(M + 6·minValidM / √(1 + gap/minValidM))` where gap = M − minValidM — bigger gap gives proportionally smaller extra headroom, so the slider doesn't become useless after typing one huge value.
- Convergence band drawn directly on the graph (not a separate strip) with radius R computed per-preset as a function of x₀ (nearest singularity in the complex plane, e.g. R = √(x₀²+1) for arctan). Label text: "R = X.XX" and "Converges for all x inside the gray band", both left-aligned and stacked (moved from the right side, and stacked specifically to avoid overlapping each other regardless of where the band sits). "Converges for all real x" shown instead when the function has no finite radius (eˣ, sin, cos, integer-k binomial).
- x-axis shows plain numeric tick labels at x₀, a, and b (values only, no "x₀=" style prefixes).
- Graph navigation: zoom (+/−), autofit (⤢), reset (⟲), scroll-wheel zoom, and click-drag panning on the background. Autofit and the settle-recenter that happens after dragging/typing x₀ **only ever adjust the x-range** — they never touch the y-scale, so a student's manual y-zoom is never undone by moving x₀. Reset (⟲) is a full return to the origin-centered default view, and fires automatically whenever the function/preset changes.
- Navigation has an "auto mode" / "manual mode" split: normally (auto mode), settling on a new x₀ reframes the x-range to keep it in view. The moment the student manually pans or zooms, the app switches to manual mode and stops auto-reframing (so they can go look at something far away without the view fighting them) until they press Reset or Autofit, which snaps back to auto mode.
- Total on-screen footprint must stay constant when the E panel opens/closes — the graph should only narrow in place, not shrink the whole app. This required decoupling the graph's rendered height from its width (see Technical build notes).

## Interaction & animation details

- Toggling E animates the graph/rail split (CSS transition on the grid column widths, ~0.28s ease) rather than snapping.
- n-slider: internally driven by a continuous value (step 0.01) for the visual handle position; the committed/displayed n is that value rounded to the nearest integer. Track is thin with tick marks at each whole-number stop, and fills the full width of its box.
- x₀ and error-point dragging use pointer capture (pointerdown/move/up) so drags track correctly even if the cursor leaves the element. Settle-recenter (the x-range reframe) fires on pointerup for a drag, or on blur for a typed value — not live during the drag itself, to keep the view calm while dragging.
- Background panning: pointerdown anywhere on the graph background (not on a draggable dot) starts a pan; the draggable dots call stopPropagation so their own drags don't also trigger a pan. Panning is loosely leashed to roughly 20× the current view span around x₀ (and around f(x₀) vertically), so a student can explore but can't pan away indefinitely.
- Scroll-wheel zoom uses a native (non-passive) wheel listener specifically so preventDefault reliably stops the page itself from scrolling while zooming over the graph.

## Technical build notes

- Stack: TypeScript, compiled with `tsc` and bundled with `esbuild` into a single offline IIFE for the standalone HTML (zero external requests, verified). The same compiled source is also stripped down to a single-file JSX for the Claude.ai artifact — both are kept in sync and spot-checked to behave identically after every change.
- Math engine: **Taylor-mode automatic differentiation** (power series arithmetic), not symbolic differentiation or finite differences. Represents functions as truncated power series and propagates them through +, −, ×, ÷, exp, ln, sin/cos (coupled recurrence), atan (via derivative/divide/integrate), and pow (via exp(k·ln(u))). This gives exact Taylor coefficients at any center x₀, to any order, for both presets and custom expressions. Validated against known closed-form series before being trusted for the UI.
- Custom function parsing: hand-written recursive-descent parser (not mathjs) — needed anyway since expressions must evaluate against the power-series engine, not just plain floats.
- M's minimum valid value is found by sampling 120 points across [a,b] and taking the max of |f⁽ⁿ⁺¹⁾|, not a closed-form maximum — fine for the smooth functions in scope, but worth knowing if a wild custom function with a sharp spike is ever tested.
- Sizing: app renders at a fixed natural design width (1500px) and is scaled to fit the viewport using the CSS `zoom` property (not `transform`), with roughly a 15% reduction built in and a 0.55 minimum scale for legibility — except the width constraint always wins over that floor, specifically so it doesn't overflow narrow contexts like the Claude artifact preview panel.
- The graph's rendered height is fixed (not aspect-locked to its width) — this was required to keep the app's total footprint constant when the E panel toggles; letting the graph's height follow its width caused the whole app to rescale whenever the panel opened.
- Known browser-support caveat: CSS `zoom` is solid in Chrome/Edge/Safari but only recently supported in Firefox — not yet specifically tested there.
- A few root-cause bugs worth remembering so they don't creep back in if this code is refactored:
  - The "is this coefficient zero" check must use strict equality, not an epsilon threshold — the engine produces exact zeros for true-zero terms, and an epsilon threshold was incorrectly discarding legitimate tiny-but-nonzero high-order terms (e.g. 1/13!).
  - Pointer/pan handlers need to live at the `<svg>` level, not on a specific background rect sibling — sibling elements don't receive bubbled events from each other, only ancestors do.
  - Numeric input boxes must resync to the true committed (possibly clamped) value on blur, not reformat whatever raw text was typed — otherwise an invalid typed value (e.g. negative M) can look "stuck" even after the underlying state has already corrected itself.

## Open threads / questions

- Rail width (220px) was a first pass to free up graph space — not yet confirmed as final by Kyle.
- Fit-to-viewport sizing hasn't been tested in Firefox specifically.
- No additional presets or features are currently planned; treat the current build as stable unless told otherwise.
