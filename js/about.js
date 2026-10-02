// About page only. No data.js dependency — this page is static, not data-driven.
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
// Copies the visible email address so visitors without a default mail app (where the mailto: button
// does nothing) can paste it into webmail. Falls back to selecting the text if the clipboard API
// is unavailable (e.g. restricted contexts).
function copyEmail() {
  const textEl = document.getElementById('about-email-text');
  const btn = document.getElementById('about-copy-btn');
  const done = () => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy address'; btn.classList.remove('copied'); }, 1800);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textEl.textContent.trim()).then(done, () => selectEmail(textEl));
  } else {
    selectEmail(textEl);
  }
}
function selectEmail(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
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
