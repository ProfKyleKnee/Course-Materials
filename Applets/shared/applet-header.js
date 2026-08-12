// Shared applet header (topline strip only — see applet-header.css for why the gradient banner
// below it isn't included here). Each applet's static HTML shell loads this file, then calls
// mountAppletHeader({...}) once with its own brand-link path and logo path, both of which vary by
// how many folders deep the applet's HTML file sits relative to the repo root.

function appletHeaderHTML(config) {
  return `
    <div class="aph-header-wrap">
      <div class="aph-topline">
        <div class="aph-topline-brand">
          <span class="aph-mark-chip"><img class="aph-mark" src="${config.logoSrc}" alt="" width="26" height="26"></span>
          <span>Professor Kyle Knee &middot; Harper College Mathematics</span>
        </div>
        <a class="aph-topline-link" href="${config.courseSiteHref}">
          <svg class="aph-back-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          All Applets
        </a>
      </div>
    </div>
  `;
}

function mountAppletHeader(config) {
  const el = document.getElementById(config.mount || 'applet-header');
  if (!el) return;
  el.innerHTML = appletHeaderHTML(config);
}
