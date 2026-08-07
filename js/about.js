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
// Now that the menu overlays the page instead of pushing it down, a tap anywhere outside it
// (or the hamburger, which has its own toggle) closes it — otherwise it'd stay floating over
// content the user is trying to interact with.
document.addEventListener('click', (e) => {
  const menu = document.getElementById('mobile-menu');
  if (!menu.classList.contains('open')) return;
  if (menu.contains(e.target) || e.target.closest('.hamburger')) return;
  menu.classList.remove('open');
});
