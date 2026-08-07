// Home page only. Needs js/data.js loaded first (for `items` / `courseOrder` / `typeOrder`).
// #mobile-menu overlays the page (see .mobile-menu in css/styles.css) rather than sitting in
// normal flow, so its top has to be set to the banner's actual rendered height right before
// it opens — that height isn't a fixed number (brand text can wrap differently).
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (!menu.classList.contains('open')) {
    menu.style.top = (document.querySelector('.c-topline').offsetHeight + document.querySelector('.c-banner').offsetHeight) + 'px';
  }
  menu.classList.toggle('open');
}
// Now that the menu overlays the page instead of pushing it down, a tap anywhere outside it
// (or the hamburger, which has its own toggle) closes it — otherwise it'd stay floating over
// content the user is trying to interact with.
document.addEventListener('click', (e) => {
  const menu = document.getElementById('mobile-menu');
  if (!menu.classList.contains('open')) return;
  if (menu.contains(e.target) || e.target.closest('.hamburger')) return;
  menu.classList.remove('open');
});

// Hero stats, counted off the same js/data.js `items` array the browse pages count, so the
// home page can't drift out of step with what browse.html reports. Each number counts up
// rather than just appearing, a small bit of life now that the hero has the full width to
// itself. Skipped for prefers-reduced-motion, where it just jumps straight to the value.
const COUNT_UP_MS = 900;
function animateStat(el, target) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / COUNT_UP_MS, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = Math.round(eased * target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function renderHeroStats() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const set = (key, n) => {
    const el = document.querySelector(`.hero-stat-num[data-stat="${key}"]`);
    if (!el) return;
    if (reduceMotion) { el.textContent = n; return; }
    // Waits for the stat's own entrance animation (.hero-stat in css/home.css) to actually
    // start before counting up, so the count finishes as the number becomes visible instead
    // of mostly playing out while it's still hidden/fading in.
    const wrap = el.closest('.hero-stat');
    if (wrap) wrap.addEventListener('animationstart', () => animateStat(el, n), { once: true });
    else animateStat(el, n);
  };
  set('courses', courseOrder.filter(c => items.some(i => i.course === c)).length);
  typeOrder.forEach(t => set(t, items.filter(i => i.type === t).length));
}
renderHeroStats();

// Browse-by-Course spotlight: shuffles a 3-card stack while the whole card is hovered. The
// front card swings out to the right in front of the stack, recedes behind it, then wipes
// left into the back slot, picking up the next course symbol once it has settled there —
// while the card underneath slides up to hold the front of the pile.
(function () {
  const SYMBOLS = [
    { sym: 'lim', size: 6 },
    { sym: 'Σ', size: 7.5 },
    { sym: '∭', size: 6.5 },
    { sym: 'sinθ', size: 4.3 },
    { sym: '∀', size: 7.5 },
    { sym: 'λ', size: 7.5 },
    { sym: '%', size: 6.5 }
  ];
  const STEP_MS = 1400;
  const CYCLE_MS = 900;   // must match the course-card-cycle duration in css/home.css
  const RECEDE_MS = 432;  // its 48% "moves back" beat, where the card drops behind the stack

  function initCourseShuffle(svg) {
    const cards = Array.from(svg.querySelectorAll('.course-card'));
    if (cards.length !== 3) return;

    const initialOrder = cards.slice();
    const initialClasses = cards.map(c => c.getAttribute('class'));
    const initialSymbols = cards.map(c => {
      const text = c.querySelector('text');
      return { sym: text.textContent, size: text.getAttribute('font-size') };
    });

    let queueIndex = 3;
    let timer = null;
    let armTimer = null;
    let recedeTimer = null;
    let settleTimer = null;
    // bumped on every step and on reset, so a step's own deferred work can tell whether it's
    // still the current one before touching the stack
    let runId = 0;

    function applySymbol(cardEl, symObj) {
      const text = cardEl.querySelector('text');
      text.textContent = symObj.sym;
      text.setAttribute('font-size', symObj.size);
    }

    function shuffleStep() {
      const leaving = svg.querySelector('.pos-front');
      const mid = svg.querySelector('.pos-mid');
      const back = svg.querySelector('.pos-back');
      if (!leaving || !mid || !back) return;

      const thisRun = ++runId;

      leaving.classList.replace('pos-front', 'pos-back');
      mid.classList.replace('pos-mid', 'pos-front');
      back.classList.replace('pos-back', 'pos-mid');

      // Paint order for the first half of the step: new mid, new front, then the leaving card
      // LAST so it sits on top (later siblings paint over earlier ones). That's what makes the
      // swing to the right read as the top card moving — the old code sent it to the bottom of
      // the pile before it had moved at all, hiding the whole motion behind the stack.
      svg.appendChild(back);
      svg.appendChild(mid);
      svg.appendChild(leaving);
      leaving.classList.add('cycling', 'on-top');

      // Halfway through, at the "moves back" beat, it recedes behind the other two and then
      // finishes by wiping left into the back slot. Note which element moves: re-ordering by
      // lifting the two idle cards ABOVE the leaving card, rather than pushing the leaving
      // card below them. Detaching an element cancels its running CSS animation — and with
      // .cycling still applied it would immediately restart from 0%, so the card would swing
      // out, snap back to the front and replay the whole thing. The idle cards have already
      // reached their target transforms by now, so moving them costs nothing.
      recedeTimer = setTimeout(() => {
        if (thisRun !== runId) return;
        leaving.classList.remove('on-top');
        svg.appendChild(back);   // new mid   } leaves the order [leaving, back, mid],
        svg.appendChild(mid);    // new front } i.e. back-most painted first
      }, RECEDE_MS);

      // Only once it has settled at the back — faded and mostly covered — does it pick up the
      // next symbol, so the swap never happens on the card you're looking at. The small margin
      // past CYCLE_MS keeps this clear of the animation's own end rather than racing it; the
      // final keyframe matches .pos-back exactly, so the card is already at rest by then.
      settleTimer = setTimeout(() => {
        if (thisRun !== runId) return;
        leaving.classList.remove('cycling', 'on-top');
        applySymbol(leaving, SYMBOLS[queueIndex % SYMBOLS.length]);
        queueIndex++;
      }, CYCLE_MS + 60);
    }

    function reset() {
      clearTimeout(armTimer);
      armTimer = null;
      clearInterval(timer);
      timer = null;
      clearTimeout(recedeTimer);
      recedeTimer = null;
      clearTimeout(settleTimer);
      settleTimer = null;
      runId++;
      queueIndex = 3;
      initialOrder.forEach((cardEl, i) => {
        cardEl.setAttribute('class', initialClasses[i]);
        applySymbol(cardEl, initialSymbols[i]);
        svg.appendChild(cardEl);
      });
    }

    const card = svg.closest('.spotlight');
    if (!card) return;
    card.addEventListener('mouseenter', () => {
      if (timer || armTimer) return;
      // small "hover intent" delay so a mouse just passing through on its way
      // elsewhere doesn't trigger a shuffle
      armTimer = setTimeout(() => {
        armTimer = null;
        shuffleStep();
        timer = setInterval(shuffleStep, STEP_MS);
      }, 200);
    });
    card.addEventListener('mouseleave', reset);
  }

  document.querySelectorAll('.course-stack-svg').forEach(initCourseShuffle);
})();
