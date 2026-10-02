  // Header search for the two static pages (index.html, about.html). Mirrors searchableText()/
  // doSearch()/clearSearch() in js/app.js, which can't be loaded here since it would try to render
  // the browse SPA. Depends on js/data.js (items, typeLabel), loaded before this file. Picking a
  // result navigates to browse.html's item-detail hash route instead of calling openDetail().
  // No module wrapper, same as js/app.js — the inline oninput/onclick handlers need these global.

  function searchableText(i) {
    return [
      i.title, i.course, typeLabel[i.type], i.sectionLabel, (i.sections || []).join(' '),
      i.subtype === 'Blended' ? 'Blended Honors' : (i.subtype === 'Standard' ? 'Standard' : '')
    ].filter(Boolean).join(' ').toLowerCase();
  }
  function doSearch(q, isMobile) {
    const box = document.getElementById(isMobile ? 'search-results-mobile' : 'search-results');
    if (!isMobile) document.getElementById('search-clear').classList.toggle('visible', q.length > 0);
    if (!q) { box.innerHTML = ''; return; }
    const matches = items.filter(i => searchableText(i).includes(q.toLowerCase()));
    box.innerHTML = matches.slice(0, 6).map(i =>
      `<div class="r" onclick="goToSearchResult('${i.id}')"><b>${i.title}</b> — ${i.course}, ${typeLabel[i.type]}${i.subtype === 'Blended' ? ' (Blended/Honors)' : ''}</div>`
    ).join('') || `<div class="r" style="cursor:default;"><span style="color:var(--eyebrow); font-style:italic;">No matches.</span></div>`;
  }

  function goToSearchResult(id) {
    window.location.href = 'browse.html#/item/' + id;
  }

  function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-clear').classList.remove('visible');
  }
