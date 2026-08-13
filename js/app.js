  // Site data (items, courseOrder, typeOrder, typeLabel) lives in js/data.js, which
  // browse.html loads immediately before this file.

  const fileTypeLabel = { Applet: "Interactive", Worksheet: "PDF", LectureGuideNotes: "PDF", LectureVideo: "Video" };

  const typeDescription = {
    Applet: "Interactive tools you can drag, adjust, and explore.",
    Worksheet: "Practice problems, in both Standard and Blended/Honors versions.",
    LectureGuideNotes: "Written guides and notes covering key concepts.",
    LectureVideo: "Recorded walkthroughs of important topics."
  };

  const bioText = "Kyle Knee is a mathematics professor in the Mathematics Department at Harper College in Palatine, IL, where he has taught for over a decade. He teaches primarily across the Calculus sequence, along with Statistics, Precalculus, Linear Algebra, and Discrete Mathematics. He holds a Master's in the Teaching of Mathematics from the University of Illinois and built this site to bring his interactive applets, lecture materials, and practice worksheets together in one place — for his own students and anyone else who finds them useful.";

  const videosSidebarText = "All of Kyle's recorded lecture walkthroughs live on one YouTube channel, organized into a playlist per course. Section-level links throughout this site jump straight to the relevant playlist — visit the full channel to browse everything in one place.";
  const youtubeChannelUrl = "https://www.youtube.com/@kneedmath5234";

  // ---------- v17: sidebar copy for the Worksheets and Lecture Guides/Notes browse pages ----------
  const worksheetsOrgText = "Worksheets are grouped by course and unit. Blended/Honors versions are marked with a badge and appear alongside the Standard version for the same section.";
  const worksheetsUseText = "Worksheets are meant for independent practice after each section, with problems ranging from foundational to more challenging. Blended/Honors worksheets go a step further with deeper, more complex problems — these are intended for in-class group work under teacher supervision, rather than independent practice.";
  const guidesOrgText = "Lecture guides and notes are grouped by course and unit.";
  const guidesUseText = "The Lecture Guide is the skeleton version brought to class — theorems to notate rather than copy, problems to work through rather than read, diagrams to label as the lesson unfolds. It's the version taught from directly, marked up live so students can do the same on their own copy. The Lecture Notes are a completed version of that same guide, sometimes containing additional details beyond what's covered in class. The goal is to keep focus on understanding the ideas in the moment rather than transcribing — the guide provides structure during class, the notes provide the finished record.";

  const courseInfo = {
    "Calculus I": { blurb: "First-semester calculus: limits, derivatives, and an introduction to integrals, with an emphasis on graphical and real-world interpretation.", topics: "Limits & continuity, derivative rules, related rates, optimization, intro to integration", audience: "Students starting calculus for the first time — no calculus background assumed." },
    "Calculus II": { blurb: "Techniques of integration, sequences and series, and an introduction to parametric and polar curves.", topics: "Integration techniques, applications of integrals, sequences & series, parametric/polar", audience: "Students who've completed Calculus I or the equivalent." },
    "Calculus III": { blurb: "Multivariable calculus — vectors, partial derivatives, multiple integrals, and vector calculus.", topics: "Vectors & 3D space, partial derivatives, multiple integrals, vector fields", audience: "Students who've completed Calculus II." },
    "Precalculus": { blurb: "Foundational algebra and trigonometry needed before starting calculus.", topics: "Functions, polynomials, trig identities, exponential/log functions", audience: "Students preparing for Calculus I." },
    "Statistics": { blurb: "Introductory statistics: descriptive stats, probability, and inferential methods.", topics: "Descriptive statistics, probability, distributions, hypothesis testing, confidence intervals", audience: "Students from any major needing an intro stats course." },
    "Linear Algebra": { blurb: "Vectors, matrices, and linear transformations, with an eye toward applications.", topics: "Matrix operations, vector spaces, eigenvalues/eigenvectors, linear transformations", audience: "Students who've completed Calculus II or by instructor permission." },
    "Discrete": { blurb: "Logic, proof techniques, and discrete structures used throughout computer science and mathematics.", topics: "Logic & proofs, set theory, combinatorics, graph theory basics", audience: "Math and CS students; no calculus required." },
  };

  // ---------- course directory symbols: the same per-course glyph shorthand a student would
  // recognize from the course itself, used as a badge on each course-directory-card. size is
  // tuned per-symbol so visually heavier/wider glyphs (e.g. "sin(θ)") don't overpower the badge. ----------
  const courseSymbol = {
    "Precalculus": { text: "sin(θ)", size: "15px" },
    "Calculus I": { text: "lim", size: "16px" },
    "Calculus II": { text: "Σ", size: "24px" },
    "Calculus III": { text: "∭", size: "20px" },
    "Linear Algebra": { text: "λ", size: "24px" },
    "Discrete": { text: "∀", size: "22px" },
    "Statistics": { text: "%", size: "24px" },
  };

  // ---------- coursesInDevelopment lives in js/data.js (shared with js/home.js's hero stat
  // count). Here it drives the caution-tape overlay across the course badge plus an "In
  // Development" pill next to the title, everywhere that badge/title pair is rendered (course
  // directory card, course landing page, course+type header), and locks the directory card
  // against navigation. Remove a course from that list once its real catalog replaces the
  // placeholder items. ----------
  function isInDevelopment(course) { return coursesInDevelopment.includes(course); }
  function devTapeHTML(course) { return isInDevelopment(course) ? '<span class="caution-tape"></span>' : ''; }
  function devPillHTML(course) { return isInDevelopment(course) ? '<span class="in-dev-pill">In Development</span>' : ''; }

  const typeIconSVG = {
    Applet: `<svg viewBox="-1 -1 27 26">
      <line x1="4" y1="21" x2="4" y2="3"/><line x1="4" y1="21" x2="4" y2="23" stroke-width="1.3"/>
      <line x1="2" y1="19" x2="22" y2="19"/><line x1="4" y1="19" x2="2" y2="19" stroke-width="1.3"/>
      <g transform="translate(1,-1.5)">
        <path d="M4.5 17.5C6 11 8 8.5 9.5 8.5S13 11 13.5 13.5 16 18.5 17.5 18.5 20 15 21 9.5"/>
        <circle cx="21" cy="9.5" r="1.05" fill="var(--accent)" stroke="none"/>
        <circle cx="21" cy="9.5" r="2.4" opacity="0.45"/>
        <circle cx="21" cy="9.5" r="3.8" opacity="0.22"/>
      </g></svg>`,
    Worksheet: `<svg viewBox="0 0 24 24"><path d="M5 3h11l3 3v15H5z"/><path d="M16 3v3h3"/><line x1="8" y1="9" x2="15" y2="9"/><line x1="8" y1="12" x2="12" y2="12"/><path d="M9 15l5-5 2 2-5 5-2.5 0.5z"/></svg>`,
    LectureGuideNotes: `<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="4" y1="7" x2="7" y2="7" stroke-width="2.4"/><line x1="4" y1="11" x2="7" y2="11" stroke-width="2.4"/><line x1="4" y1="15" x2="7" y2="15" stroke-width="2.4"/><line x1="10" y1="7" x2="17" y2="7"/><line x1="10" y1="11" x2="17" y2="11"/><line x1="10" y1="15" x2="15" y2="15"/></svg>`,
    LectureVideo: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M10 8l5 2.5L10 13z" fill="var(--accent)" stroke="none"/><path d="M8 20h8M12 17v3"/></svg>`
  };
  const folderIcon = `<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>`;
  const chevronLeftSVG = `<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`;
  const chevronRightSVG = `<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`;

  let state = { level: 'courseMaterials' };

  // ---------- v16: History API — proper back/forward support ----------
  function statePath(s) {
    if (!s) return '/';
    if (s.level === 'courseMaterials') return '/course-materials';
    if (s.level === 'typeBrowse') {
      const friendlySlug = { Applet: 'applets', LectureVideo: 'lecture-videos', Worksheet: 'worksheets', LectureGuideNotes: 'lecture-guides-notes' };
      return '/' + (friendlySlug[s.type] || s.type.toLowerCase());
    }
    if (s.level === 'tier2') return s.entry === 'course' ? `/course-materials/${slug(s.course)}` : `/type/${s.type}`;
    if (s.level === 'tier3') {
      let base = s.entry === 'course' ? `/course-materials/${slug(s.course)}/${s.type}` : `/type/${s.type}/${slug(s.course)}`;
      if (s.isolatedUnit) base += `/unit-${s.isolatedUnit}`;
      return base;
    }
    if (s.level === 'detail') return `/item/${s.id}`;
    return '/';
  }
  function navigate(newState, push) {
    if (push === undefined) push = true;
    state = newState;
    if (push) {
      try { history.pushState(state, '', '#' + statePath(state)); } catch (e) { /* ignore in restricted contexts */ }
    }
    render();
  }
  window.addEventListener('popstate', function (e) {
    state = e.state || { level: 'courseMaterials' };
    render();
  });

  function sectionCompare(a, b) {
    const pa = ((a.sections && a.sections[0]) || '').split('.').map(Number);
    const pb = ((b.sections && b.sections[0]) || '').split('.').map(Number);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const na = pa[i] || 0, nb = pb[i] || 0;
      if (na !== nb) return na - nb;
    }
    return 0;
  }

  // Calc 2's Chapters 4 (Power Series) and 5 (Parametric & Polar) are one pedagogical unit
  // (Unit 4) in the Blended Sessions folder structure (Course Materials/Calc 2/Blended
  // Sessions/Unit 4/ holds both 4.x and 5.x worksheets) -- unlike Calc 1's overrides below, this
  // is a real grouping merge, not just a display-label renumbering, so it lives in unitOf() itself
  // and folds every Chapter 5 item into the Chapter 4 carousel/label on Calc II's Applets/
  // Worksheets/Lecture Guides/Lecture Videos pages.
  const unitMergeOverrides = {
    'Calculus II': { '5': '4' },
  };
  function unitOf(item) {
    const s = (item.sections && item.sections[0]) || '0';
    const chapter = s.split('.')[0] || '0';
    const merge = unitMergeOverrides[item.course];
    return (merge && merge[chapter]) || chapter;
  }

  // Calc 1's textbook chapters (2-5) don't line up with its pedagogical unit numbers (1-4) --
  // Chapter 1 has no unit of its own (just the Graphs To Know resource), so Unit 1 starts at
  // Chapter 2. This maps the raw chapter number (unitOf's return value) to the number shown to
  // students; grouping/filtering still keys off the raw chapter number everywhere else.
  const unitLabelOverrides = {
    'Calculus I': { '2': '1', '3': '2', '4': '3', '5': '4' },
  };
  function unitLabel(course, u) {
    const overrides = unitLabelOverrides[course];
    return (overrides && overrides[u]) || u;
  }

  const RECENT_WINDOW_DAYS = 30;
  function isRecentlyUpdated(dateStr) {
    const updated = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const diffDays = (now - updated) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= RECENT_WINDOW_DAYS;
  }
  function recentBadgeHTML(dateStr) {
    return isRecentlyUpdated(dateStr)
      ? `<span class="recent-badge" title="Updated ${formatDate(dateStr)}"><span class="dot-ico"></span>Recently Updated</span>`
      : '';
  }

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
  function closeMobileMenu() { document.getElementById('mobile-menu').classList.remove('open'); }
  // Now that the menu overlays the page instead of pushing it down, a tap anywhere outside it
  // (or the hamburger, which has its own toggle) closes it — otherwise it'd stay floating over
  // content the user is trying to interact with.
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('mobile-menu');
    if (!menu.classList.contains('open')) return;
    if (menu.contains(e.target) || e.target.closest('.hamburger')) return;
    closeMobileMenu();
  });

  function clearNav() { document.querySelectorAll('.nav-pill').forEach(n => n.classList.remove('current')); }
  function setCurrentNav(id) { const el = document.getElementById(id); if (el) el.classList.add('current'); }

  function updateNavHighlight() {
    clearNav();
    if (state.level === 'typeBrowse' && state.type === 'Applet') { setCurrentNav('nav-applets'); return; }
    if (state.level === 'typeBrowse' && state.type === 'LectureVideo') { setCurrentNav('nav-videos'); return; }
    if (state.level === 'courseMaterials') { setCurrentNav('nav-coursematerials'); return; }
    if (['tier2', 'tier3'].includes(state.level) && state.entry === 'course') { setCurrentNav('nav-coursematerials'); return; }
    if (state.level === 'detail') { setCurrentNav('nav-coursematerials'); return; }
  }

  function goToCourseMaterials() { navigate({ level: 'courseMaterials' }); }
  function enterCourse(course) { navigate({ level: 'tier2', entry: 'course', course }); }

  // ---------- v17: all four material types now open the same course-carousel browse page ----------
  // (previously Worksheet/LectureGuideNotes routed to the old tier2 folder-tile page instead)
  function enterType(type) {
    navigate({ level: 'typeBrowse', type });
  }

  function openTier3(entry, courseVal, typeVal) {
    navigate({ level: 'tier3', entry, course: courseVal, type: typeVal, isolatedUnit: null, subtypeFilter: null });
  }

  function isolateUnit(u) {
    navigate(Object.assign({}, state, { isolatedUnit: u }));
  }

  // ---------- Worksheet Standard/Blended filter — same chip-row pattern as the unit jump row,
  // stacked above it since it's a broader "which kind of worksheet" filter rather than a scoping
  // control. Left independent of isolateUnit so both filters can combine (e.g. Unit 3 + Blended). ----------
  function setSubtypeFilter(v) {
    navigate(Object.assign({}, state, { subtypeFilter: v }));
  }

  function openDetail(id) {
    const item = items.find(i => i.id === id);
    if (item && item.type === 'Applet') { launchApplet(id); return; }
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate({ level: 'detail', id });
  }

  // ---------- v17: placeholder URLs (still just '#' throughout the dummy dataset) no longer
  // do anything when clicked — no more falling through to a blank tab or the homepage ----------
  function launchApplet(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (!item.launchUrl || item.launchUrl === '#') return; // no-op: applet not yet linked
    window.location.href = item.launchUrl; // same tab, so the browser back button returns here
  }

  // Renders a file/playlist link. Real URLs render as a normal working link.
  // Placeholder URLs ('#' or empty) render as a grayed-out, inert control with a tooltip
  // instead of a live link — so clicking genuinely does nothing rather than misbehaving.
  function fileLinkHTML(url, label, opts) {
    opts = opts || {};
    const isPlaceholder = !url || url === '#';
    if (isPlaceholder) {
      return `<span class="tooltip-wrap">
        <span class="file-link disabled" aria-disabled="true">${label}</span>
        <span class="tooltip-bubble">${opts.tooltip || 'File not yet uploaded'}</span>
      </span>`;
    }
    const targetAttr = opts.newTab ? ` target="_blank" rel="noopener"` : '';
    return `<a class="file-link" href="${url}"${targetAttr}>${label}</a>`;
  }

  function relatedItems(item) {
    const targetSections = item.sections || [];
    return items.filter(i => {
      if (i.id === item.id) return false;
      if (i.course !== item.course) return false;
      const iSections = i.sections || [];
      return iSections.some(s => targetSections.includes(s));
    });
  }

  function slug(course) { return course.replace(/\s+/g, ''); }
  function jumpTo(course) {
    const el = document.getElementById('grp-' + slug(course));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function jumpRowHTML(courseList) {
    return `<div class="jump-row">${courseList.map(c => `<span class="jump-link" onclick="jumpTo('${c}')">${c}</span>`).join('')}</div>`;
  }

  function scrollCarousel(id, dir) {
    const el = document.getElementById(id);
    if (el) el.scrollBy({ left: dir * 460, behavior: 'smooth' });
  }
  function arrowBtnHTML(rowId, dir) {
    const cls = dir < 0 ? 'left' : 'right';
    const icon = dir < 0 ? chevronLeftSVG : chevronRightSVG;
    return `<button class="carousel-arrow ${cls}" onclick="scrollCarousel('${rowId}', ${dir})" aria-label="Scroll ${cls}">${icon}</button>`;
  }

  // ---------- v18: shared title-block markup for single-material-type pages (typeBrowse + tier3).
  // Applets (no sidebar) keeps a one-line tagline here; the other three drop it since their sidebar
  // already covers the same ground. ----------
  const appletTagline = "Interactive tools to drag, adjust, and explore.";
  // courseVal is only passed on the course+type (tier3) page: it swaps the badge from the
  // material-type icon to the course symbol, since the type icon is already shown in the sidebar
  // (sidebarContentForType) right next to this title — showing it twice was redundant. The
  // top-level typeBrowse page (no single course) keeps the type icon, since there's no sidebar
  // redundancy there — its sidebar covers the type, not a specific course.
  function titleBlockHTML(type, titleText, courseVal) {
    const tagline = type === 'Applet' ? `<div class="page-tagline">${appletTagline}</div>` : '';
    const sym = courseVal && courseSymbol[courseVal];
    const badgeContent = sym ? `<span style="font-size:${sym.size};">${sym.text}</span>` : typeIconSVG[type];
    const devWrapClass = courseVal ? ' badge-dev-wrap' : '';
    return `<div class="title-block">
      <div class="title-row">
        <div class="title-icon-badge${devWrapClass}">${badgeContent}${courseVal ? devTapeHTML(courseVal) : ''}</div>
        <div class="page-title">${titleText}${courseVal ? devPillHTML(courseVal) : ''}</div>
      </div>
      ${tagline}
    </div>`;
  }

  // ---------- v18: cycling accent palette for per-unit card/header color on Tier 3 pages ----------
  const unitAccentPalette = ['#6478D6', '#3F9C82', '#B8862F', '#B15FA8', '#4A90A4'];
  function unitColorMap(units) {
    const map = {};
    units.forEach((u, idx) => { map[u] = unitAccentPalette[idx % unitAccentPalette.length]; });
    return map;
  }

  function crumbHTML() {
    const parts = [`<span class="crumb" onclick="window.location.href='index.html'">Home</span>`];

    if (state.level === 'courseMaterials') {
      parts.push(`<span class="sep">/</span><span class="current-crumb">Course Materials</span>`);
    }
    if (state.level === 'typeBrowse') {
      const label = state.type === 'Applet' ? 'Applets' : typeLabel[state.type];
      parts.push(`<span class="sep">/</span><span class="current-crumb">${label}</span>`);
    }
    if (state.level === 'tier2') {
      if (state.entry === 'course') {
        parts.push(`<span class="sep">/</span><span class="crumb" onclick="goToCourseMaterials()">Course Materials</span>`);
        parts.push(`<span class="sep">/</span><span class="current-crumb">${state.course}</span>`);
      } else {
        parts.push(`<span class="sep">/</span><span class="current-crumb">${typeLabel[state.type]}</span>`);
      }
    }
    if (state.level === 'tier3') {
      if (state.entry === 'course') {
        parts.push(`<span class="sep">/</span><span class="crumb" onclick="goToCourseMaterials()">Course Materials</span>`);
        parts.push(`<span class="sep">/</span><span class="crumb" onclick="enterCourse('${state.course}')">${state.course}</span>`);
        parts.push(`<span class="sep">/</span><span class="current-crumb">${typeLabel[state.type]}</span>`);
      } else {
        parts.push(`<span class="sep">/</span><span class="crumb" onclick="enterType('${state.type}')">${typeLabel[state.type]}</span>`);
        parts.push(`<span class="sep">/</span><span class="current-crumb">${state.course}</span>`);
      }
      if (state.isolatedUnit) {
        parts.push(`<span class="sep">/</span><span class="current-crumb">Unit ${unitLabel(state.course, state.isolatedUnit)}</span>`);
      }
    }
    if (state.level === 'detail') {
      const item = items.find(i => i.id === state.id);
      if (item) {
        parts.push(`<span class="sep">/</span><span class="crumb" onclick="goToCourseMaterials()">Course Materials</span>`);
        parts.push(`<span class="sep">/</span><span class="crumb" onclick="enterCourse('${item.course}')">${item.course}</span>`);
        parts.push(`<span class="sep">/</span><span class="crumb" onclick="openTier3('course','${item.course}','${item.type}')">${typeLabel[item.type]}</span>`);
        parts.push(`<span class="sep">/</span><span class="current-crumb">${item.title}</span>`);
      }
    }
    return `<div class="breadcrumb">${parts.join('')}</div>`;
  }

  // ---------- tileType is an opt-in escape hatch from the generic curve+dot tile below, for an
  // applet whose card should preview what it actually does rather than a generic mini-graph.
  // Only 'paraboloid' exists so far (Quadric Surfaces) — add a new case here (and a matching CSS
  // block) for any future applet that warrants the same treatment. ----------
  function tileSVG(a) {
    if (a.tileType === 'paraboloid') return paraboloidTileSVG();
    if (a.tileType === 'partialDerivatives') return partialDerivTileSVG();
    if (a.tileType === 'dotProduct') return dpTileSVG();
    if (a.tileType === 'polarRose') return prTileSVG();
    if (a.tileType === 'taylorSeries') return tsTileSVG();
    const curve = a.curve || 'M14,50 C34,20 56,45 74,25 S 100,45 118,20';
    return `<svg viewBox="0 0 130 66">
      <line class="axis-line" x1="8" y1="58" x2="8" y2="4"/>
      <line class="axis-line" x1="4" y1="58" x2="126" y2="58"/>
      <path class="curve-path" d="${curve}"/>
      <circle class="ring ring1" cx="118" cy="26" r="2.5"/>
      <circle class="ring ring2" cx="118" cy="26" r="2.5"/>
      <circle class="dot" r="3" style="offset-path: path('${curve}');"/>
    </svg>`;
  }

  // ---------- Quadric Surfaces card tile: real 3D wireframe, not a hand-faked 2D icon ----------
  // qsProject() is the same rotate-then-tilt formula as project() in
  // Applets/Calc 3/Quadric Surfaces/app.jsx (swap x/y, rotate by a fixed azimuth, tilt by a fixed
  // elevation, drop the depth-sorted axis) -- ported here so the tile is built from actual 3D math
  // instead of guessed 2D curves. Camera angle is fixed at load time (QS_THETA/QS_PHI below); the
  // rim, body outline, back-rim, and all three axes are computed from it once and never change.
  // Rotation is instead sold by three interior meridian "ribs", each spun live around the surface's
  // own azimuthal angle (see qsStartSpin below) -- since the camera never moves, the axes and outer
  // silhouette stay completely still while only the mesh visibly turns, same as spinning a physical
  // bowl in place rather than orbiting a camera around it.
  //
  // The camera tilt here (QS_THETA=0.5, QS_PHI=-0.45) is deliberately NOT the applet's own default
  // (theta:0.541, phi:-0.065) -- that tilt is nearly edge-on and reads fine at the applet's full
  // size (where per-face mesh shading carries the 3D read), but projects the rim almost flat at a
  // 50px icon with only line art to work with. QS_PHI is steeper than the applet's own so the
  // opening still reads as open, but shallow enough that the xy-plane still appears close to the
  // line of sight rather than being viewed from nearly overhead (a much steeper phi was tried
  // first and looked too top-down). QS_T/QS_ZLEN/QS_XYLEN mirror the applet's own Elliptic
  // Paraboloid constants (T=2.4 rim radius; z axis drawn a bit past the rim's own height so it
  // visibly pokes through, same idea as the applet's own zAxisLength convention), with the z/x/y
  // axis lengths trimmed down from an earlier, steeper-phi version of this tile -- a shallower phi
  // projects more of each axis's true length onto the screen, so shorter world-space lengths were
  // needed to keep the whole composition (axes + rim) similarly proportioned. All three axes stay
  // visually distinct from one another (a 0 or fully-front-on theta makes two of them project onto
  // the same screen line -- checked numerically before picking 0.5).
  var QS_THETA = 0.5, QS_PHI = -0.45;
  var QS_T = 2.4, QS_ZLEN = 7, QS_XYLEN = 2.4;
  var QS_SCALE = 12.92, QS_OX = 50, QS_OY = 89.4; // world units -> icon px, viewBox "0 0 100 108"

  function qsProject(x, y, z) {
    const tmp = x;
    x = y;
    y = tmp;
    const xr = x * Math.cos(QS_THETA) - y * Math.sin(QS_THETA);
    const yr = x * Math.sin(QS_THETA) + y * Math.cos(QS_THETA);
    const y2 = yr * Math.cos(QS_PHI) - z * Math.sin(QS_PHI);
    const z2 = yr * Math.sin(QS_PHI) + z * Math.cos(QS_PHI);
    return { x: QS_OX + xr * QS_SCALE, y: QS_OY - z2 * QS_SCALE, depth: y2 };
  }
  function qsSurfacePoint(r, th) {
    const u = r * Math.cos(th), v = r * Math.sin(th);
    return qsProject(u, v, u * u + v * v);
  }
  function qsMeridianPoints(th, steps) {
    const pts = [];
    for (let i = 0; i <= steps; i++) pts.push(qsSurfacePoint(QS_T * i / steps, th));
    return pts;
  }
  function qsPathFrom(pts) {
    return 'M' + pts.map((p) => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join('L');
  }
  function qsMeridianPath(th) {
    return qsPathFrom(qsMeridianPoints(th, 7));
  }
  function qsCrossPath(zVal) {
    const r = Math.sqrt(Math.max(0, zVal));
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const th = 2 * Math.PI * i / 40;
      pts.push(qsProject(r * Math.cos(th), r * Math.sin(th), zVal));
    }
    return qsPathFrom(pts) + 'Z';
  }
  // Leftmost/rightmost screen points of the rim -- the two meridians that split it into a
  // near (front) and far (back) arc, i.e. the bowl's own silhouette. Computed once and cached:
  // QS_THETA/QS_PHI/QS_T never change at runtime, so this is always the same answer.
  var qsSilCache = null;
  function qsSilhouette() {
    if (qsSilCache) return qsSilCache;
    let leftTh = 0, rightTh = 0, minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < 360; i++) {
      const th = 2 * Math.PI * i / 360;
      const p = qsSurfacePoint(QS_T, th);
      if (p.x < minX) { minX = p.x; leftTh = th; }
      if (p.x > maxX) { maxX = p.x; rightTh = th; }
    }
    qsSilCache = { left: leftTh, right: rightTh };
    return qsSilCache;
  }
  function qsRimArc(fromTh, toTh, steps) {
    let span = toTh - fromTh;
    while (span <= 0) span += 2 * Math.PI;
    const pts = [];
    for (let i = 0; i <= steps; i++) pts.push(qsSurfacePoint(QS_T, fromTh + span * i / steps));
    return pts;
  }
  function qsAvgDepth(pts) {
    return pts.reduce((s, p) => s + p.depth, 0) / pts.length;
  }
  // Filled body silhouette: the near half of the rim, plus the two silhouette meridians walking
  // down to the vertex and back up -- one continuous closed path, so (unlike an earlier version)
  // there's no separate floating rim shape that can visually disconnect from the walls.
  function qsBodyPath() {
    const { left, right } = qsSilhouette();
    const a = qsRimArc(left, right, 20), b = qsRimArc(right, left, 20);
    const front = qsAvgDepth(a) >= qsAvgDepth(b) ? a : b.slice().reverse();
    const downRight = qsMeridianPoints(right, 6).slice().reverse();
    const upLeft = qsMeridianPoints(left, 6);
    return qsPathFrom(front.concat(downRight.slice(1)).concat(upLeft.slice(1))) + 'Z';
  }
  function qsBackRimPath() {
    const { left, right } = qsSilhouette();
    const a = qsRimArc(left, right, 20), b = qsRimArc(right, left, 20);
    return qsPathFrom(qsAvgDepth(a) < qsAvgDepth(b) ? a : b);
  }
  var QS_RIB_PHASES = [0, 2 * Math.PI / 3, 4 * Math.PI / 3];
  function paraboloidTileSVG() {
    const vertex = qsProject(0, 0, 0), zTop = qsProject(0, 0, QS_ZLEN);
    const xPos = qsProject(QS_XYLEN, 0, 0), xNeg = qsProject(-QS_XYLEN, 0, 0);
    const yPos = qsProject(0, QS_XYLEN, 0), yNeg = qsProject(0, -QS_XYLEN, 0);
    const ribs = QS_RIB_PHASES.map((th) => `<path class="qs-rib" d="${qsMeridianPath(th)}"/>`).join('');
    return `<svg class="qs-tile" viewBox="0 0 100 108">
      <path class="qs-body" d="${qsBodyPath()}"/>
      <path class="qs-back-rim" d="${qsBackRimPath()}"/>
      ${ribs}
      <line class="qs-zaxis" x1="${vertex.x.toFixed(1)}" y1="${vertex.y.toFixed(1)}" x2="${zTop.x.toFixed(1)}" y2="${zTop.y.toFixed(1)}"/>
      <line class="qs-axis" x1="${xNeg.x.toFixed(1)}" y1="${xNeg.y.toFixed(1)}" x2="${xPos.x.toFixed(1)}" y2="${xPos.y.toFixed(1)}"/>
      <line class="qs-axis" x1="${yNeg.x.toFixed(1)}" y1="${yNeg.y.toFixed(1)}" x2="${yPos.x.toFixed(1)}" y2="${yPos.y.toFixed(1)}"/>
      <path class="qs-cross" d="${qsCrossPath(0.15)}"/>
    </svg>`;
  }
  // Live rotation, only while a paraboloid tile's card is hovered: each frame recomputes the three
  // ribs' paths at a slowly advancing phase (qsMeridianPath again -- the exact same function used
  // for the resting frame, just called continuously) and the cross-section's path/opacity, then
  // writes them straight to the DOM. requestAnimationFrame only runs while qsSpins has an entry for
  // that svg, so nothing is computed for cards that aren't being looked at.
  var qsSpins = new Map();
  function qsStartSpin(svg) {
    if (qsSpins.has(svg)) return;
    const ribEls = svg.querySelectorAll('.qs-rib');
    const crossEl = svg.querySelector('.qs-cross');
    const start = performance.now();
    function frame(now) {
      const t = (now - start) / 1000;
      const phase = t * (2 * Math.PI / 9); // one full turn every 9s
      ribEls.forEach((el, i) => el.setAttribute('d', qsMeridianPath(phase + QS_RIB_PHASES[i])));
      const cyclePos = (t % 5.4) / 5.4;
      const sweep = cyclePos < 0.5 ? cyclePos / 0.5 : (1 - cyclePos) / 0.5; // 0 -> 1 -> 0
      const zVal = Math.max(0.15, 5.6 - sweep * 5.3); // near the rim down toward the vertex, and back
      const fade = cyclePos < 0.08 ? cyclePos / 0.08 : cyclePos > 0.92 ? (1 - cyclePos) / 0.08 : 1;
      crossEl.setAttribute('d', qsCrossPath(zVal));
      crossEl.style.opacity = Math.min(1, fade) * 0.9;
      qsSpins.set(svg, requestAnimationFrame(frame));
    }
    qsSpins.set(svg, requestAnimationFrame(frame));
  }
  function qsStopSpin(svg) {
    const id = qsSpins.get(svg);
    if (id) cancelAnimationFrame(id);
    qsSpins.delete(svg);
    svg.querySelectorAll('.qs-rib').forEach((el, i) => el.setAttribute('d', qsMeridianPath(QS_RIB_PHASES[i])));
    const crossEl = svg.querySelector('.qs-cross');
    if (crossEl) crossEl.style.opacity = '';
  }
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    const svg = card && card.querySelector('svg.qs-tile');
    if (svg) qsStartSpin(svg);
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    if (!card || card.contains(e.relatedTarget)) return;
    const svg = card.querySelector('svg.qs-tile');
    if (svg) qsStopSpin(svg);
  });

  // ---------- Partial Derivatives card tile: real wavy-surface mesh + a live tangent line ----------
  // pdProject/pdF/pdFx/PD_Z_SCALE are the exact same camera and surface math as
  // Applets/Calc 3/Partial Derivatives/partial-derivatives.jsx (f, fx, toScene, and the applet's
  // real default camera: position (6.2,4.4,6.2), lookAt (0,0.3,0), fov 38) -- a true perspective
  // projection of that camera, not a guessed 2D curve, same rationale as the Quadric tile above.
  // Unlike Quadric, the mesh itself is shaded (not just outlined): each quad gets a height-based
  // color lerp (SURF_LOW->SURF_HIGH, matching the applet's own vertex-color gradient) times a flat
  // per-face Lambertian factor approximating the applet's real lights (ambient 0.55, key light at
  // (5,9,4) x0.9, fill light at (-6,3,-4) x0.35) -- a flat height-only fill read as too plain at
  // this size, since the surface's actual bumps are extremely shallow relative to the domain.
  var PD_DOMAIN_MIN = -3, PD_DOMAIN_MAX = 3, PD_SEG = 19, PD_Z_SCALE = 1.6;
  var PD_CAM_POS = [6.2, 4.4, 6.2], PD_CAM_TARGET = [0, 0.3, 0], PD_FOV_DEG = 38;
  var PD_VIEW_W = 100, PD_VIEW_H = 108;
  function pdF(x, y) { return 0.2 * Math.sin(x) * Math.cos(y); }
  function pdFx(x, y) { return 0.2 * Math.cos(x) * Math.cos(y); }
  function pdToScene(x, y, z) { return [x, z * PD_Z_SCALE, -y]; }
  function pdSub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function pdCross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function pdDot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function pdNorm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  var PD_KEY_DIR = pdNorm([5, 9, 4]), PD_FILL_DIR = pdNorm([-6, 3, -4]);
  var pdProjectCache = null;
  function pdProject() {
    if (pdProjectCache) return pdProjectCache;
    const forward = pdNorm(pdSub(PD_CAM_TARGET, PD_CAM_POS));
    const right = pdNorm(pdCross(forward, [0, 1, 0]));
    const camUp = pdCross(right, forward);
    const tanHalf = Math.tan((PD_FOV_DEG * Math.PI / 180) / 2);
    const aspect = PD_VIEW_W / PD_VIEW_H;
    pdProjectCache = function (x, y, z) {
      const rel = pdSub([x, y, z], PD_CAM_POS);
      const xc = pdDot(rel, right), yc = pdDot(rel, camUp), depth = pdDot(rel, forward);
      return {
        x: PD_VIEW_W / 2 + (xc / (depth * tanHalf * aspect)) * (PD_VIEW_W / 2),
        y: PD_VIEW_H / 2 - (yc / (depth * tanHalf)) * (PD_VIEW_H / 2),
        depth: depth,
      };
    };
    return pdProjectCache;
  }
  function pdShadeFactor(faceNormal) {
    let n = faceNormal;
    if (pdDot(n, [0, 1, 0]) < 0) n = [-n[0], -n[1], -n[2]];
    return 0.55 + Math.max(0, pdDot(n, PD_KEY_DIR)) * 0.9 + Math.max(0, pdDot(n, PD_FILL_DIR)) * 0.35;
  }
  var PD_SURF_LOW = [0xb7, 0xbf, 0xef], PD_SURF_HIGH = [0x5f, 0x6c, 0xc9];
  function pdQuadColor(t, shade) {
    const c = PD_SURF_LOW.map((lo, i) => Math.max(0, Math.min(255, Math.round((lo + (PD_SURF_HIGH[i] - lo) * t) * shade))));
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }
  // Mesh geometry/shading never changes (static camera, fixed surface), so the quad markup is
  // built once and cached -- only the tangent line + dot are rewritten per animation frame.
  var pdMeshCache = null;
  function pdMeshHTML() {
    if (pdMeshCache) return pdMeshCache;
    const proj = pdProject();
    const pts = [], zVals = [];
    for (let j = 0; j < PD_SEG; j++) {
      pts.push([]);
      for (let i = 0; i < PD_SEG; i++) {
        const x = PD_DOMAIN_MIN + (PD_DOMAIN_MAX - PD_DOMAIN_MIN) * i / (PD_SEG - 1);
        const y = PD_DOMAIN_MIN + (PD_DOMAIN_MAX - PD_DOMAIN_MIN) * j / (PD_SEG - 1);
        const z = pdF(x, y);
        pts[j].push(pdToScene(x, y, z));
        zVals.push(z);
      }
    }
    const zMin = Math.min.apply(null, zVals), zMax = Math.max.apply(null, zVals);
    const quads = [];
    for (let j = 0; j < PD_SEG - 1; j++) {
      for (let i = 0; i < PD_SEG - 1; i++) {
        const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i];
        const pa = proj(a[0], a[1], a[2]), pb = proj(b[0], b[1], b[2]), pc = proj(c[0], c[1], c[2]), pd = proj(d[0], d[1], d[2]);
        const avgZ = (zVals[j * PD_SEG + i] + zVals[j * PD_SEG + i + 1] + zVals[(j + 1) * PD_SEG + i + 1] + zVals[(j + 1) * PD_SEG + i]) / 4;
        const t = (avgZ - zMin) / ((zMax - zMin) || 1);
        const depth = (pa.depth + pb.depth + pc.depth + pd.depth) / 4;
        const shade = pdShadeFactor(pdNorm(pdCross(pdSub(b, a), pdSub(d, a))));
        quads.push({ pts: [pa, pb, pc, pd], color: pdQuadColor(t, shade), depth: depth });
      }
    }
    quads.sort((p, q) => q.depth - p.depth); // far first, painter's algorithm (camera never moves)
    pdMeshCache = quads.map((q) =>
      '<polygon class="pd-quad" points="' + q.pts.map((p) => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ') + '" fill="' + q.color + '"/>'
    ).join('');
    return pdMeshCache;
  }
  // Resting frame matches the applet's own default point (x=1, y=1).
  var PD_X0 = 1, PD_REST_Y = 1;
  function pdTangentPoints(y) {
    const proj = pdProject();
    const z0 = pdF(PD_X0, y), slope = pdFx(PD_X0, y), delta = 0.9;
    const p1 = pdToScene(PD_X0 - delta, y, z0 - delta * slope);
    const p2 = pdToScene(PD_X0 + delta, y, z0 + delta * slope);
    const pc = pdToScene(PD_X0, y, z0);
    return { p1: proj(p1[0], p1[1], p1[2]), p2: proj(p2[0], p2[1], p2[2]), pc: proj(pc[0], pc[1], pc[2]) };
  }
  function partialDerivTileSVG() {
    const rest = pdTangentPoints(PD_REST_Y);
    return `<svg class="pd-tile" viewBox="0 0 ${PD_VIEW_W} ${PD_VIEW_H}">
      ${pdMeshHTML()}
      <line class="pd-tangent" x1="${rest.p1.x.toFixed(1)}" y1="${rest.p1.y.toFixed(1)}" x2="${rest.p2.x.toFixed(1)}" y2="${rest.p2.y.toFixed(1)}"/>
      <circle class="pd-dot" cx="${rest.pc.x.toFixed(1)}" cy="${rest.pc.y.toFixed(1)}"/>
    </svg>`;
  }
  // Live animation, only while a Partial Derivatives card is hovered: sweeps y with x held fixed
  // at PD_X0, so the tangent line (always oriented in the x-direction) visibly rotates as its slope
  // (f_x) changes with y -- that changing slope is f_xy. No dashed/reference curves needed to sell
  // it; the rotating tangent alone carries the idea, same "animate content only, camera stays put"
  // treatment as the Quadric tile's spinning ribs.
  var pdSpins = new Map();
  function pdStartSpin(svg) {
    if (pdSpins.has(svg)) return;
    const tangentEl = svg.querySelector('.pd-tangent');
    const dotEl = svg.querySelector('.pd-dot');
    const start = performance.now();
    function frame(now) {
      const t = ((now - start) / 1000) % 6; // 6s ping-pong cycle
      const cyclePos = t / 6;
      const sweep = cyclePos < 0.5 ? cyclePos / 0.5 : (1 - cyclePos) / 0.5; // 0 -> 1 -> 0
      const y = PD_DOMAIN_MIN + (PD_DOMAIN_MAX - PD_DOMAIN_MIN) * sweep;
      const pts = pdTangentPoints(y);
      tangentEl.setAttribute('x1', pts.p1.x.toFixed(1));
      tangentEl.setAttribute('y1', pts.p1.y.toFixed(1));
      tangentEl.setAttribute('x2', pts.p2.x.toFixed(1));
      tangentEl.setAttribute('y2', pts.p2.y.toFixed(1));
      dotEl.setAttribute('cx', pts.pc.x.toFixed(1));
      dotEl.setAttribute('cy', pts.pc.y.toFixed(1));
      pdSpins.set(svg, requestAnimationFrame(frame));
    }
    pdSpins.set(svg, requestAnimationFrame(frame));
  }
  function pdStopSpin(svg) {
    const id = pdSpins.get(svg);
    if (id) cancelAnimationFrame(id);
    pdSpins.delete(svg);
    const rest = pdTangentPoints(PD_REST_Y);
    const tangentEl = svg.querySelector('.pd-tangent');
    const dotEl = svg.querySelector('.pd-dot');
    if (tangentEl) {
      tangentEl.setAttribute('x1', rest.p1.x.toFixed(1));
      tangentEl.setAttribute('y1', rest.p1.y.toFixed(1));
      tangentEl.setAttribute('x2', rest.p2.x.toFixed(1));
      tangentEl.setAttribute('y2', rest.p2.y.toFixed(1));
    }
    if (dotEl) {
      dotEl.setAttribute('cx', rest.pc.x.toFixed(1));
      dotEl.setAttribute('cy', rest.pc.y.toFixed(1));
    }
  }
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    const svg = card && card.querySelector('svg.pd-tile');
    if (svg) pdStartSpin(svg);
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    if (!card || card.contains(e.relatedTarget)) return;
    const svg = card.querySelector('svg.pd-tile');
    if (svg) pdStopSpin(svg);
  });

  // ---------- Dot Product & Projections card tile: two vectors from a shared tail, replaying the
  // applet's own "rotate up, reveal the perpendicular, fade in the projection" story in miniature.
  // b stays fixed pointing right the whole time (the "onto" vector); a is the only thing that moves,
  // sweeping from 15deg to 60deg above it (dpFrameState's rotate phase) before the dashed
  // perpendicular fades in, then the solid projection vector — mirroring the real applet's perpPhase
  // sequence (dashes first, then the solid proj<sub>b</sub>(a) vector), just without the real app's
  // dash-by-dash reveal or right-angle mark, which don't read at this size. Resting frame (a at
  // 15deg, dashed/proj both invisible) is drawn once at render time; live motion is JS-driven via
  // requestAnimationFrame, only while a card is hovered, same as the Quadric/Partial Derivatives
  // tiles above. Phase lengths are specified in absolute ms (DP_DUR) rather than hand-computed
  // fractions, since every fraction depends on the total cycle length and hand-adjusting one phase
  // used to mean re-deriving all the others -- DP_PHASE below just sums DP_DUR into cumulative
  // fractions of whatever DP_CYCLE_MS comes out to. `close` is set equal to `rotate` so the angle
  // collapses at exactly the same pace it opened at (the version this replaced had the open phase
  // take ~2.5s against a ~0.3s close, which read as lopsided); `hold1` is kept short so the dashed
  // perpendicular starts fading in almost immediately once a finishes rotating; `hold2` (the pause
  // once the projection vector is fully visible, before it and the dashes fade back out) is kept
  // short too, so the angle doesn't sit idle for long after the reveal finishes.
  var DP_TAIL = { x: 15, y: 84 };
  var DP_LEN = 62;
  var DP_A_MIN_DEG = 15, DP_A_MAX_DEG = 60;
  var DP_ARROW_LEN = 6, DP_ARROW_HALF_W = 3.4;
  var DP_DUR = { rotate: 1054, hold1: 124, perpFade: 744, projFade: 744, hold2: 700, fadeOut: 400, close: 1054 };
  var DP_CYCLE_MS = DP_DUR.rotate + DP_DUR.hold1 + DP_DUR.perpFade + DP_DUR.projFade + DP_DUR.hold2 + DP_DUR.fadeOut + DP_DUR.close;
  var DP_PHASE = (function () {
    let t = DP_DUR.rotate;
    const rotateEnd = t / DP_CYCLE_MS;
    t += DP_DUR.hold1;
    const hold1End = t / DP_CYCLE_MS;
    t += DP_DUR.perpFade;
    const perpEnd = t / DP_CYCLE_MS;
    t += DP_DUR.projFade;
    const projEnd = t / DP_CYCLE_MS;
    t += DP_DUR.hold2;
    const hold2End = t / DP_CYCLE_MS;
    t += DP_DUR.fadeOut;
    const outEnd = t / DP_CYCLE_MS;
    return { rotateEnd, hold1End, perpEnd, projEnd, hold2End, outEnd };
  })();
  function dpEaseInOutSine(t) {
    return t <= 0 ? 0 : t >= 1 ? 1 : (1 - Math.cos(t * Math.PI)) / 2;
  }
  function dpPoint(angleDeg, len) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: DP_TAIL.x + len * Math.cos(rad), y: DP_TAIL.y - len * Math.sin(rad) };
  }
  function dpProjX(angleDeg) {
    return DP_TAIL.x + DP_LEN * Math.cos((angleDeg * Math.PI) / 180);
  }
  function dpFrameState(cyclePos) {
    const P = DP_PHASE;
    if (cyclePos < P.rotateEnd) {
      const s = dpEaseInOutSine(cyclePos / P.rotateEnd);
      return { angle: DP_A_MIN_DEG + (DP_A_MAX_DEG - DP_A_MIN_DEG) * s, perpOpacity: 0, projOpacity: 0 };
    }
    if (cyclePos < P.hold1End) return { angle: DP_A_MAX_DEG, perpOpacity: 0, projOpacity: 0 };
    if (cyclePos < P.perpEnd) {
      const s = (cyclePos - P.hold1End) / (P.perpEnd - P.hold1End);
      return { angle: DP_A_MAX_DEG, perpOpacity: s, projOpacity: 0 };
    }
    if (cyclePos < P.projEnd) {
      const s = (cyclePos - P.perpEnd) / (P.projEnd - P.perpEnd);
      return { angle: DP_A_MAX_DEG, perpOpacity: 1, projOpacity: s };
    }
    if (cyclePos < P.hold2End) return { angle: DP_A_MAX_DEG, perpOpacity: 1, projOpacity: 1 };
    if (cyclePos < P.outEnd) {
      const s = (cyclePos - P.hold2End) / (P.outEnd - P.hold2End);
      return { angle: DP_A_MAX_DEG, perpOpacity: 1 - s, projOpacity: 1 - s };
    }
    const s = (cyclePos - P.outEnd) / (1 - P.outEnd);
    return { angle: DP_A_MAX_DEG - (DP_A_MAX_DEG - DP_A_MIN_DEG) * dpEaseInOutSine(s), perpOpacity: 0, projOpacity: 0 };
  }
  // A shared right-pointing triangle, positioned per-vector via `transform: translate(...) rotate(...)`
  // rather than a full orient="auto" SVG <marker> (which would need a page-unique id) -- simpler and
  // sufficient at this size. The projection vector's own direction never changes (b is fixed along
  // +x, and a's component along it is always positive over the 15-60deg range this tile animates
  // through), so its arrow only ever needs translating; a's arrow also needs rotating to match a's
  // current angle each frame -- see dpVecAngleToRotateDeg below for why that's simply the negated
  // angle rather than a full atan2 computation.
  function dpArrowPoints() {
    return `-${DP_ARROW_LEN},-${DP_ARROW_HALF_W} 0,0 -${DP_ARROW_LEN},${DP_ARROW_HALF_W}`;
  }
  // dpPoint's screen direction for a given angleDeg is (cos(rad), -sin(rad)) -- y negated because
  // screen y grows downward while angleDeg is measured the usual upward-positive way. The default
  // arrow shape points along +x (angle 0 on screen), so rotating it by -angleDeg in SVG's own
  // (also y-down) rotate() lines it up with that same direction exactly.
  function dpVecAngleToRotateDeg(angleDeg) {
    return -angleDeg;
  }
  function dpTileSVG() {
    const aTip = dpPoint(DP_A_MIN_DEG, DP_LEN);
    const aLineEnd = dpPoint(DP_A_MIN_DEG, DP_LEN - DP_ARROW_LEN);
    const bTip = dpPoint(0, DP_LEN);
    const bLineEnd = dpPoint(0, DP_LEN - DP_ARROW_LEN);
    const projX = dpProjX(DP_A_MIN_DEG);
    return `<svg class="dp-tile" viewBox="0 0 100 100">
      <circle class="dp-tail-dot" cx="${DP_TAIL.x}" cy="${DP_TAIL.y}" r="2.2"/>
      <line class="dp-perp" x1="${aTip.x.toFixed(1)}" y1="${aTip.y.toFixed(1)}" x2="${projX.toFixed(1)}" y2="${DP_TAIL.y}"/>
      <line class="dp-vec-b" x1="${DP_TAIL.x}" y1="${DP_TAIL.y}" x2="${bLineEnd.x.toFixed(1)}" y2="${bLineEnd.y.toFixed(1)}"/>
      <polygon class="dp-vec-b-arrow" points="${dpArrowPoints()}" transform="translate(${bTip.x.toFixed(1)},${bTip.y.toFixed(1)}) rotate(${dpVecAngleToRotateDeg(0)})"/>
      <line class="dp-vec-a" x1="${DP_TAIL.x}" y1="${DP_TAIL.y}" x2="${aLineEnd.x.toFixed(1)}" y2="${aLineEnd.y.toFixed(1)}"/>
      <polygon class="dp-vec-a-arrow" points="${dpArrowPoints()}" transform="translate(${aTip.x.toFixed(1)},${aTip.y.toFixed(1)}) rotate(${dpVecAngleToRotateDeg(DP_A_MIN_DEG)})"/>
      <line class="dp-proj" x1="${DP_TAIL.x}" y1="${DP_TAIL.y}" x2="${(projX - DP_ARROW_LEN).toFixed(1)}" y2="${DP_TAIL.y}"/>
      <polygon class="dp-proj-arrow" points="${dpArrowPoints()}" transform="translate(${projX.toFixed(1)},${DP_TAIL.y})"/>
    </svg>`;
  }
  var dpSpins = new Map();
  function dpStartSpin(svg) {
    if (dpSpins.has(svg)) return;
    const aEl = svg.querySelector('.dp-vec-a');
    const aArrowEl = svg.querySelector('.dp-vec-a-arrow');
    const perpEl = svg.querySelector('.dp-perp');
    const projEl = svg.querySelector('.dp-proj');
    const arrowEl = svg.querySelector('.dp-proj-arrow');
    const start = performance.now();
    const cycleMs = DP_CYCLE_MS;
    function frame(now) {
      const cyclePos = ((now - start) % cycleMs) / cycleMs;
      const st = dpFrameState(cyclePos);
      const aTip = dpPoint(st.angle, DP_LEN);
      const aLineEnd = dpPoint(st.angle, DP_LEN - DP_ARROW_LEN);
      const projX = dpProjX(st.angle);
      aEl.setAttribute('x2', aLineEnd.x.toFixed(1));
      aEl.setAttribute('y2', aLineEnd.y.toFixed(1));
      aArrowEl.setAttribute('transform', `translate(${aTip.x.toFixed(1)},${aTip.y.toFixed(1)}) rotate(${dpVecAngleToRotateDeg(st.angle).toFixed(1)})`);
      perpEl.setAttribute('x1', aTip.x.toFixed(1));
      perpEl.setAttribute('y1', aTip.y.toFixed(1));
      perpEl.setAttribute('x2', projX.toFixed(1));
      perpEl.style.opacity = st.perpOpacity;
      projEl.setAttribute('x2', (projX - DP_ARROW_LEN).toFixed(1));
      projEl.style.opacity = st.projOpacity;
      arrowEl.setAttribute('transform', `translate(${projX.toFixed(1)},${DP_TAIL.y})`);
      arrowEl.style.opacity = st.projOpacity;
      dpSpins.set(svg, requestAnimationFrame(frame));
    }
    dpSpins.set(svg, requestAnimationFrame(frame));
  }
  function dpStopSpin(svg) {
    const id = dpSpins.get(svg);
    if (id) cancelAnimationFrame(id);
    dpSpins.delete(svg);
    const aEl = svg.querySelector('.dp-vec-a');
    const aArrowEl = svg.querySelector('.dp-vec-a-arrow');
    const perpEl = svg.querySelector('.dp-perp');
    const projEl = svg.querySelector('.dp-proj');
    const arrowEl = svg.querySelector('.dp-proj-arrow');
    const restTip = dpPoint(DP_A_MIN_DEG, DP_LEN);
    const restLineEnd = dpPoint(DP_A_MIN_DEG, DP_LEN - DP_ARROW_LEN);
    const restProjX = dpProjX(DP_A_MIN_DEG);
    if (aEl) { aEl.setAttribute('x2', restLineEnd.x.toFixed(1)); aEl.setAttribute('y2', restLineEnd.y.toFixed(1)); }
    if (aArrowEl) { aArrowEl.setAttribute('transform', `translate(${restTip.x.toFixed(1)},${restTip.y.toFixed(1)}) rotate(${dpVecAngleToRotateDeg(DP_A_MIN_DEG)})`); }
    if (perpEl) { perpEl.setAttribute('x1', restTip.x.toFixed(1)); perpEl.setAttribute('y1', restTip.y.toFixed(1)); perpEl.setAttribute('x2', restProjX.toFixed(1)); perpEl.style.opacity = ''; }
    if (projEl) { projEl.setAttribute('x2', (restProjX - DP_ARROW_LEN).toFixed(1)); projEl.style.opacity = ''; }
    if (arrowEl) { arrowEl.setAttribute('transform', `translate(${restProjX.toFixed(1)},${DP_TAIL.y})`); arrowEl.style.opacity = ''; }
  }
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    const svg = card && card.querySelector('svg.dp-tile');
    if (svg) dpStartSpin(svg);
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    if (!card || card.contains(e.relatedTarget)) return;
    const svg = card.querySelector('svg.dp-tile');
    if (svg) dpStopSpin(svg);
  });

  // ---------- Polar Graphing & Integration card tile: echoes the applet's own Graphing-mode
  // animation -- the curve being TRACED OUT (drawn progressively as a radius line sweeps through
  // theta), not just a dot gliding along an already-complete curve -- rather than the generic
  // curve+traveling-dot tile; see the matching CSS comment in styles.css for why. No area-shading
  // animation, by design; the tile only needs to read as "this is the graphing view". At rest the
  // full rose is shown solid (stroke-dasharray/-offset cleared) so the tile still reads clearly
  // without hovering; hovering switches .pr-rose into a stroke-dashoffset reveal driven by the real
  // path geometry (getTotalLength/getPointAtLength) so the reveal front, the radius line, and the
  // dot are always the exact same point -- not a separately-computed theta that could drift out of
  // sync with how much of the curve is actually drawn. ----------
  var PR_SCALE = 17, PR_CX = 50, PR_CY = 50;
  function prPoint(theta) {
    const r = 2 * Math.cos(2 * theta);
    return { x: PR_CX + PR_SCALE * r * Math.cos(theta), y: PR_CY - PR_SCALE * r * Math.sin(theta) };
  }
  function prRosePathD() {
    const steps = 240;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const theta = (2 * Math.PI * i) / steps;
      const p = prPoint(theta);
      d += (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ' ';
    }
    return d.trim();
  }
  function prTileSVG() {
    const rest = prPoint(0);
    return `<svg class="pr-tile" viewBox="0 0 100 100">
      <line class="axis-line" x1="50" y1="92" x2="50" y2="8"/>
      <line class="axis-line" x1="8" y1="50" x2="92" y2="50"/>
      <path class="curve-path pr-rose" d="${prRosePathD()}"/>
      <line class="pr-radius" x1="${PR_CX}" y1="${PR_CY}" x2="${rest.x.toFixed(1)}" y2="${rest.y.toFixed(1)}"/>
      <circle class="pr-dot" cx="${rest.x.toFixed(1)}" cy="${rest.y.toFixed(1)}"/>
    </svg>`;
  }
  var prSpins = new Map();
  var PR_CYCLE_MS = 2600;
  function prStartSpin(svg) {
    if (prSpins.has(svg)) return;
    const pathEl = svg.querySelector('.pr-rose');
    const lineEl = svg.querySelector('.pr-radius');
    const dotEl = svg.querySelector('.pr-dot');
    const total = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = String(total);
    const start = performance.now();
    function frame(now) {
      const f = ((now - start) % PR_CYCLE_MS) / PR_CYCLE_MS;
      const dist = total * f;
      pathEl.style.strokeDashoffset = String(total - dist);
      const p = pathEl.getPointAtLength(dist);
      lineEl.setAttribute('x2', p.x.toFixed(1));
      lineEl.setAttribute('y2', p.y.toFixed(1));
      dotEl.setAttribute('cx', p.x.toFixed(1));
      dotEl.setAttribute('cy', p.y.toFixed(1));
      prSpins.set(svg, requestAnimationFrame(frame));
    }
    prSpins.set(svg, requestAnimationFrame(frame));
  }
  function prStopSpin(svg) {
    const id = prSpins.get(svg);
    if (id) cancelAnimationFrame(id);
    prSpins.delete(svg);
    const pathEl = svg.querySelector('.pr-rose');
    const lineEl = svg.querySelector('.pr-radius');
    const dotEl = svg.querySelector('.pr-dot');
    const rest = prPoint(0);
    if (pathEl) { pathEl.style.strokeDasharray = ''; pathEl.style.strokeDashoffset = ''; }
    if (lineEl) { lineEl.setAttribute('x2', rest.x.toFixed(1)); lineEl.setAttribute('y2', rest.y.toFixed(1)); }
    if (dotEl) { dotEl.setAttribute('cx', rest.x.toFixed(1)); dotEl.setAttribute('cy', rest.y.toFixed(1)); }
  }
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    const svg = card && card.querySelector('svg.pr-tile');
    if (svg) prStartSpin(svg);
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    if (!card || card.contains(e.relatedTarget)) return;
    const svg = card.querySelector('svg.pr-tile');
    if (svg) prStopSpin(svg);
  });

  // ---------- Taylor Series & Remainder Explorer card tile (tileType: 'taylorSeries' in
  // js/data.js) -- sells the applet's actual pedagogy (a Taylor polynomial's fit improves as its
  // degree n rises) rather than a generic curve+dot. sin x (dashed, muted -- "the true function")
  // is drawn once and never moves; a single polynomial path around x0=0 morphs between degrees
  // (n=1,3,5,7, the same odd-term signs/coefficients as sin x's real series) by lerping each
  // sampled point's y-value between the two neighboring degrees' precomputed shapes (eased with
  // tsEase) and rewriting the path's `d` every frame -- not a crossfade between separately-drawn
  // paths, since two full-opacity curves overlapping mid-fade read as a flicker/dissolve rather
  // than one curve bending into the next. Same start/stop-on-hover wiring as
  // prStartSpin/prStopSpin above. At rest (unhovered) only n=1 (the tangent-line approximation)
  // shows, so the resting tile still reads as "a line approximating a curve" rather than blank;
  // hovering morphs up through better-fitting degrees and loops. Points are clamped in *pixel*
  // space (not domain space) so a high-degree term shooting off outside [-1,1] near the domain
  // edges just runs into the tile's own border instead of producing absurd coordinate values --
  // that clamped runaway is itself a small, honest preview of divergence outside the radius of
  // convergence, not a bug to hide. ----------
  var TS_OX = 50, TS_OY = 50, TS_SCALE_X = 80 / 7, TS_SCALE_Y = 24;
  var TS_XMIN = -3.5, TS_XMAX = 3.5, TS_STEPS = 56;
  var TS_TERMS = [[1, 1], [3, -1 / 6], [5, 1 / 120], [7, -1 / 5040]];
  var TS_DEGREES = [1, 3, 5, 7];
  var TS_HOLD_MS = 450, TS_MORPH_MS = 550;
  function tsPolyValue(x, n) {
    let y = 0;
    for (const [p, c] of TS_TERMS) { if (p > n) break; y += c * Math.pow(x, p); }
    return y;
  }
  function tsPoint(x, y) {
    const py = TS_OY - y * TS_SCALE_Y;
    return { x: TS_OX + x * TS_SCALE_X, y: Math.max(2, Math.min(98, py)) };
  }
  var TS_XS = [];
  for (let i = 0; i <= TS_STEPS; i++) TS_XS.push(TS_XMIN + (TS_XMAX - TS_XMIN) * i / TS_STEPS);
  var TS_TARGET_YS = TS_XS.map((x) => Math.sin(x));
  var TS_DEGREE_YS = TS_DEGREES.map((n) => TS_XS.map((x) => tsPolyValue(x, n)));
  function tsPathFromYs(ys) {
    let d = '';
    for (let i = 0; i < ys.length; i++) {
      const p = tsPoint(TS_XS[i], ys[i]);
      d += (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ' ';
    }
    return d.trim();
  }
  function tsEase(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
  function tsTileSVG() {
    return `<svg class="ts-tile" viewBox="0 0 100 100">
      <line class="axis-line" x1="50" y1="92" x2="50" y2="8"/>
      <line class="axis-line" x1="8" y1="50" x2="92" y2="50"/>
      <path class="ts-target" d="${tsPathFromYs(TS_TARGET_YS)}"/>
      <path class="curve-path ts-poly" d="${tsPathFromYs(TS_DEGREE_YS[0])}"/>
    </svg>`;
  }
  var tsSpins = new Map();
  var TS_CYCLE_MS = TS_DEGREES.length * (TS_HOLD_MS + TS_MORPH_MS);
  function tsStartSpin(svg) {
    if (tsSpins.has(svg)) return;
    const pathEl = svg.querySelector('.ts-poly');
    const segMs = TS_HOLD_MS + TS_MORPH_MS;
    const start = performance.now();
    function frame(now) {
      // A browser's first rAF callback can hand back a `now` that's *earlier* than the
      // performance.now() captured above (the timestamp is pinned to the frame's start, which
      // can precede the event handler's own clock read) -- clamping to 0 keeps `now - start`
      // from going negative, since JS's `%` doesn't wrap negatives the way math mod does and a
      // negative t here would produce a negative (out-of-bounds) TS_DEGREE_YS index.
      const t = Math.max(0, now - start) % TS_CYCLE_MS;
      const idx = Math.floor(t / segMs) % TS_DEGREES.length;
      const local = t % segMs;
      let ys;
      if (local < TS_HOLD_MS) {
        ys = TS_DEGREE_YS[idx];
      } else {
        const nextIdx = (idx + 1) % TS_DEGREES.length;
        const b = tsEase((local - TS_HOLD_MS) / TS_MORPH_MS);
        const from = TS_DEGREE_YS[idx], to = TS_DEGREE_YS[nextIdx];
        ys = from.map((y, i) => y + (to[i] - y) * b);
      }
      pathEl.setAttribute('d', tsPathFromYs(ys));
      tsSpins.set(svg, requestAnimationFrame(frame));
    }
    tsSpins.set(svg, requestAnimationFrame(frame));
  }
  function tsStopSpin(svg) {
    const id = tsSpins.get(svg);
    if (id) cancelAnimationFrame(id);
    tsSpins.delete(svg);
    const pathEl = svg.querySelector('.ts-poly');
    if (pathEl) pathEl.setAttribute('d', tsPathFromYs(TS_DEGREE_YS[0]));
  }
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    const svg = card && card.querySelector('svg.ts-tile');
    if (svg) tsStartSpin(svg);
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    if (!card || card.contains(e.relatedTarget)) return;
    const svg = card.querySelector('svg.ts-tile');
    if (svg) tsStopSpin(svg);
  });

  // ---------- v18: unitColor is only ever passed from tier3BodyHTML (unit-grouped pages) —
  // courseCarouselsHTML calls these with no second argument, so top-level pages get no accent bar ----------
  function appletCardHTML(a, unitColor) {
    const styleAttr = unitColor ? ` style="--unit-color:${unitColor};"` : '';
    return `<div class="applet-card"${styleAttr} onclick="launchApplet('${a.id}')">
      <div class="ac-eyebrow">Applet</div>
      <div class="ac-title">${a.title}</div>
      <div class="ac-body">
        <div class="ac-tile">${tileSVG(a)}</div>
        <div class="ac-desc">${a.desc}<span class="course-tag">${a.course}</span>${recentBadgeHTML(a.updated)}</div>
      </div>
    </div>`;
  }

  function cardHTML(i, unitColor) {
    const styleAttr = unitColor ? ` style="--unit-color:${unitColor};"` : '';
    return `<div class="item-card"${styleAttr} onclick="openDetail('${i.id}')">
      <div class="item-eyebrow">${typeLabel[i.type]}</div>
      <div class="item-title">${i.title}</div>
      <div class="item-tag">${i.course}</div>
      <div>
        <span class="filetype-badge">${fileTypeLabel[i.type]}</span>
        ${i.subtype === 'Blended' ? `<span class="item-pill">Blended/Honors</span>` : ''}
        ${i.inProgress ? `<span class="item-pill in-progress-pill">In Progress</span>` : ''}
        ${recentBadgeHTML(i.updated)}
      </div>
    </div>`;
  }

  // Kept as full tiles (type icon only, no course badge) rather than rows — the course name
  // stays in the text so these can later link out to material from other courses on the same
  // section without looking like they belong to the current course.
  function relatedRowHTML(i) {
    return `<div class="related-tile" onclick="openDetail('${i.id}')">
      <div class="icon-badge">${typeIconSVG[i.type]}</div>
      <div class="rt-title">${i.title}</div>
      <div class="rt-meta">${i.course} · ${typeLabel[i.type]}${i.subtype === 'Blended' ? ' · Blended/Honors' : ''}</div>
    </div>`;
  }

  // ---------- v18: sidebar content is now shared between the top-level typeBrowse page and the
  // course-specific tier3 page for the same type — same copy either way, since it's type-level,
  // not course-level, information. Icon now sits inline with the heading instead of stacked above it. ----------
  const sidebarTypes = ['LectureVideo', 'Worksheet', 'LectureGuideNotes'];

  function sidebarContentForType(type) {
    if (type === 'LectureVideo') {
      return `
        <div class="sidebar-header-row"><div class="sidebar-icon-inline">${typeIconSVG.LectureVideo}</div><h3>Lecture Videos on YouTube</h3></div>
        <p>${videosSidebarText}</p>
        ${fileLinkHTML(youtubeChannelUrl, 'Visit full channel', { newTab: true, tooltip: 'Channel link not yet added' })}
      `;
    }
    if (type === 'Worksheet') {
      return `
        <div class="sidebar-header-row"><div class="sidebar-icon-inline">${typeIconSVG.Worksheet}</div><h3>Worksheets</h3></div>
        <p>${worksheetsOrgText}</p>
        <p>${worksheetsUseText}</p>
      `;
    }
    if (type === 'LectureGuideNotes') {
      return `
        <div class="sidebar-header-row"><div class="sidebar-icon-inline">${typeIconSVG.LectureGuideNotes}</div><h3>Lecture Guides/Notes</h3></div>
        <p>${guidesOrgText}</p>
        <p>${guidesUseText}</p>
      `;
    }
    return '';
  }

  function renderSidebar() {
    const card = document.getElementById('sidebar-card');
    card.className = 'sidebar-card';
    if (state.level === 'typeBrowse' || state.level === 'tier3') {
      card.innerHTML = sidebarContentForType(state.type);
    }
  }

  // ---------- v16: top-level course carousels (Applets / Lecture Videos overview pages) ----------
  function courseCarouselsHTML(typeVal) {
    const all = items.filter(i => i.type === typeVal);
    const coursesPresent = courseOrder.filter(c => all.some(a => a.course === c));
    const cardFn = typeVal === 'Applet' ? appletCardHTML : cardHTML;
    return `<div class="course-carousel-list">${coursesPresent.map(c => {
      const inCourse = all.filter(a => a.course === c).sort(sectionCompare);
      const sym = courseSymbol[c] || { text: '', size: '18px' };
      const glyphHTML = `<div class="cc-glyph">${sym.text ? `<span style="font-size:${sym.size};">${sym.text}</span>` : ''}</div>`;
      if (!inCourse.length) {
        return `<div class="carousel-block" id="grp-${slug(c)}">
          <div class="carousel-header">
            <div class="carousel-title-group">
              ${glyphHTML}
              <div class="carousel-title-row"><span class="carousel-title" style="cursor:default;color:var(--muted);">${c}</span><span class="carousel-count">No ${typeLabel[typeVal].toLowerCase()} yet</span></div>
            </div>
          </div>
          <div class="empty-group-state">No ${typeLabel[typeVal].toLowerCase()} for this course yet.</div>
        </div>`;
      }
      const rowId = `car-${typeVal}-${slug(c)}`;
      const countLabel = inCourse.length === 1 ? `1 ${typeLabel[typeVal].toLowerCase().replace(/s$/, '')}` : `${inCourse.length} ${typeLabel[typeVal].toLowerCase()}`;
      return `
        <div class="carousel-block" id="grp-${slug(c)}">
          <div class="carousel-header">
            <div class="carousel-title-group">
              ${glyphHTML}
              <div class="carousel-title-row"><span class="carousel-title" onclick="openTier3('type','${c}','${typeVal}')">${c}</span><span class="carousel-count">${countLabel}</span></div>
            </div>
            <div class="carousel-seeall" onclick="openTier3('type','${c}','${typeVal}')">See all (${inCourse.length}) →</div>
          </div>
          <div class="carousel-wrap">
            ${arrowBtnHTML(rowId, -1)}
            <div class="carousel-track" id="${rowId}">${inCourse.map(a => cardFn(a)).join('')}</div>
            ${arrowBtnHTML(rowId, 1)}
          </div>
        </div>`;
    }).join('')}</div>`;
  }

  // ---------- v16/v18: tier 3 — unit chip filter row + unit carousels, with isolate-to-full-grid.
  // v18 adds a per-unit accent color, cycling through unitAccentPalette by unit position. ----------
  function tier3BodyHTML(matchesAll, course, typeVal) {
    const subtypeChipsHTML = typeVal === 'Worksheet' ? `<div class="jump-row">
      <span class="jump-link ${!state.subtypeFilter ? 'chip-active' : ''}" onclick="setSubtypeFilter(null)">All Worksheets</span>
      <span class="jump-link ${state.subtypeFilter === 'Standard' ? 'chip-active' : ''}" onclick="setSubtypeFilter('Standard')">Standard</span>
      <span class="jump-link ${state.subtypeFilter === 'Blended' ? 'chip-active' : ''}" onclick="setSubtypeFilter('Blended')">Blended/Honors</span>
    </div>` : '';
    const matches = (typeVal === 'Worksheet' && state.subtypeFilter)
      ? matchesAll.filter(i => i.subtype === state.subtypeFilter)
      : matchesAll;

    if (!matches.length) return `${subtypeChipsHTML}<div class="empty-state">No items match this filter yet.</div>`;

    // Resources (e.g. Calc 1's "Graphs To Know") aren't part of any unit -- pull them out before
    // computing unit groupings, and pin them in their own block at the top of the page.
    const resourceItems = matches.filter(i => i.resource);
    const unitMatches = matches.filter(i => !i.resource);
    const cardFn = typeVal === 'Applet' ? appletCardHTML : cardHTML;
    const gridClass = typeVal === 'Applet' ? 'applet-grid' : 'grid';
    const isolated = state.isolatedUnit;
    const resourcesHTML = (resourceItems.length && !isolated) ? `
      <div class="carousel-block" id="grp-resources">
        <div class="carousel-header"><div class="carousel-title" style="cursor:default;">Resources</div></div>
        <div class="${gridClass}">${resourceItems.map(i => cardFn(i)).join('')}</div>
      </div>` : '';

    if (!unitMatches.length) return `${subtypeChipsHTML}${resourcesHTML}`;

    const units = [...new Set(unitMatches.map(unitOf))].sort((a, b) => Number(a) - Number(b));
    const colorMap = unitColorMap(units);

    const chipsHTML = `<div class="jump-row">
      <span class="jump-link ${!isolated ? 'chip-active' : ''}" onclick="isolateUnit(null)">All Units</span>
      ${units.map(u => `<span class="jump-link ${isolated === u ? 'chip-active' : ''}" onclick="isolateUnit('${u}')">Unit ${unitLabel(course, u)}</span>`).join('')}
    </div>`;

    if (isolated) {
      const inUnit = unitMatches.filter(i => unitOf(i) === isolated);
      const color = colorMap[isolated];
      return `${subtypeChipsHTML}${chipsHTML}
        <div class="result-count">${inUnit.length} item${inUnit.length === 1 ? '' : 's'} in Unit ${unitLabel(course, isolated)}</div>
        <div class="${gridClass}">${inUnit.map(i => cardFn(i, color)).join('')}</div>`;
    }

    const slugId = `${slug(course)}-${typeVal}`;
    const rows = units.map(u => {
      const inUnit = unitMatches.filter(i => unitOf(i) === u);
      const rowId = `car-unit-${slugId}-${u}`;
      const color = colorMap[u];
      return `
        <div class="carousel-block unit-carousel-header" id="grp-unit-${u}" style="--unit-color:${color};">
          <div class="carousel-header">
            <div class="carousel-title" onclick="isolateUnit('${u}')">Unit ${unitLabel(course, u)}</div>
            ${inUnit.length > 1 ? `<div class="carousel-seeall" onclick="isolateUnit('${u}')">See all (${inUnit.length}) →</div>` : ''}
          </div>
          <div class="carousel-wrap">
            ${arrowBtnHTML(rowId, -1)}
            <div class="carousel-track" id="${rowId}">${inUnit.map(i => cardFn(i, color)).join('')}</div>
            ${arrowBtnHTML(rowId, 1)}
          </div>
        </div>`;
    }).join('');
    return subtypeChipsHTML + chipsHTML + rows + resourcesHTML;
  }

  // Lines the sidebar card's resting position up with the jump row (course chips on typeBrowse,
  // unit chips on tier3) instead of the very top of the main column, so it doesn't sit noticeably
  // higher than the content it's next to. Matches the .page-shell breakpoint (900px) where the
  // sidebar drops below the main column instead of sitting beside it — no offset needed there.
  function alignSidebarToJumpRow() {
    const sidebar = document.getElementById('sidebar-card');
    if (!sidebar) return;
    const jumpRow = document.querySelector('#page .jump-row');
    if (!jumpRow || window.innerWidth <= 900) { sidebar.style.marginTop = ''; return; }
    // offsetTop is relative to the nearest *positioned* ancestor — neither #page nor .page-shell
    // has one, so it was resolving all the way up to the document, not to the sidebar's own
    // starting position. Comparing bounding rects instead measures the actual on-screen gap.
    sidebar.style.marginTop = '0px';
    const delta = jumpRow.getBoundingClientRect().top - sidebar.getBoundingClientRect().top;
    sidebar.style.marginTop = Math.max(0, delta) + 'px';
  }
  window.addEventListener('resize', () => {
    if (state.level === 'typeBrowse' || state.level === 'tier3') alignSidebarToJumpRow();
  });

  function render() {
    updateNavHighlight();

    const page = document.getElementById('page');
    const shell = document.querySelector('.page-shell');
    // v18: sidebar now applies on both the top-level typeBrowse page AND the course-specific tier3
    // page, for the same three types; Applets stays sidebar-less on both.
    const showSidebar = (state.level === 'typeBrowse' && sidebarTypes.includes(state.type))
      || (state.level === 'tier3' && sidebarTypes.includes(state.type));
    if (showSidebar) { shell.classList.remove('no-sidebar'); renderSidebar(); }
    else { shell.classList.add('no-sidebar'); }

    if (state.level === 'courseMaterials') {
      const coursesPresent = courseOrder.filter(c => items.some(i => i.course === c));
      const body = coursesPresent.map(c => {
        const info = courseInfo[c] || {};
        const sym = courseSymbol[c] || { text: '', size: '20px' };
        const counts = typeOrder.map(t => {
          const n = items.filter(i => i.course === c && i.type === t).length;
          return n ? `<span class="cd-count-chip">${typeLabel[t]}: ${n}</span>` : null;
        }).filter(Boolean).join('');
        const devLocked = isInDevelopment(c);
        const cardAttrs = devLocked ? '' : ` onclick="enterCourse('${c}')"`;
        return `<div class="course-directory-card${devLocked ? ' course-directory-card-locked' : ''}" id="grp-${slug(c)}"${cardAttrs}>
          <div class="cd-symbol-badge badge-dev-wrap" style="font-size:${sym.size};" aria-hidden="true">${sym.text}${devTapeHTML(c)}</div>
          <div class="cd-content">
            <div class="cd-title">${c}${devPillHTML(c)}</div>
            <div class="cd-blurb">${info.blurb || ''}</div>
            <div class="cd-counts">${counts || 'No items yet'}</div>
          </div>
        </div>`;
      }).join('');
      const stackBadgeHTML = `<div class="title-stack-badge" aria-hidden="true">
        <svg class="course-stack-svg" viewBox="0 0 24 24">
          <g class="course-card pos-back">
            <rect x="6.5" y="5" width="13" height="9.5" rx="2" stroke="var(--accent)"/>
            <text x="13" y="11.4" text-anchor="middle" font-family="Georgia, serif" font-size="6.5" fill="var(--accent)" stroke="none" font-weight="700">&#8749;</text>
          </g>
          <g class="course-card pos-mid">
            <rect x="6.5" y="5" width="13" height="9.5" rx="2" stroke="var(--accent)"/>
            <text x="13" y="11.5" text-anchor="middle" font-family="Georgia, serif" font-size="7.5" fill="var(--accent)" stroke="none" font-weight="700">&#931;</text>
          </g>
          <g class="course-card pos-front">
            <rect x="6.5" y="5" width="13" height="9.5" rx="2" stroke="var(--accent)"/>
            <text x="13" y="11.2" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="6" fill="var(--accent)" stroke="none" font-weight="700">lim</text>
          </g>
        </svg>
      </div>`;
      page.innerHTML = `
        ${crumbHTML()}
        <div class="title-row" style="margin-bottom:6px;">
          ${stackBadgeHTML}
          <div class="page-title" style="margin:0;">Course Materials</div>
        </div>
        <div class="page-tagline" style="margin:0 0 24px 72px;">Pick a course below to see everything for it — worksheets, lecture guides and notes, applets, and videos, organized by unit.</div>
        <div class="course-directory-grid">${body}</div>
      `;
      return;
    }

    // ---------- v17: unified browse-by-type page (replaces appletsBrowse/videosBrowse + the old tier2
    // folder-tile route for Worksheet/LectureGuideNotes) — same course-carousel pattern for all four types ----------
    if (state.level === 'typeBrowse') {
      const t = state.type;
      const all = items.filter(i => i.type === t);
      const pageTitle = t === 'Applet' ? 'All Applets' : typeLabel[t];
      const unitLabel = t === 'Applet' ? 'applet' : (t === 'LectureVideo' ? 'video section' : 'item');
      const countText = `${all.length} ${unitLabel}${all.length === 1 ? '' : 's'} across ${courseOrder.filter(c => all.some(a => a.course === c)).length} courses`;
      page.innerHTML = `
        ${crumbHTML()}
        ${titleBlockHTML(t, pageTitle)}
        <div class="result-count">${countText}</div>
        ${courseCarouselsHTML(t)}
      `;
      alignSidebarToJumpRow();
      return;
    }

    if (state.level === 'tier2') {
      let tilesHTML = '';
      let infoHTML = '';
      if (state.entry === 'course') {
        const info = courseInfo[state.course];
        if (info) {
          infoHTML = `<div class="course-info">
            <p>${info.blurb}</p>
            <div class="course-info-cols">
              <div class="topics"><b>Topics:</b> ${info.topics}</div>
              <div class="topics"><b>Who it's for:</b> ${info.audience}</div>
            </div>
          </div>`;
        }
        const availableTypes = typeOrder.filter(t => items.some(i => i.course === state.course && i.type === t));
        tilesHTML = `<div class="tile-grid">${availableTypes.map(t => {
          const count = items.filter(i => i.course === state.course && i.type === t).length;
          return `<div class="tile" onclick="openTier3('course','${state.course}','${t}')">
            <div class="icon-badge">${typeIconSVG[t]}</div>
            <div class="label">${typeLabel[t]}</div>
            <div class="count">${count} item${count === 1 ? '' : 's'}</div>
          </div>`;
        }).join('')}</div>`;
      } else {
        // v17: this branch (course tiles reached "by type") is no longer reachable through normal
        // navigation — enterType() now always sends users to the typeBrowse course-carousel page
        // instead. Left in place rather than deleted in case a future entry point wants it back.
        const availableCourses = courseOrder.filter(c => items.some(i => i.course === c && i.type === state.type));
        tilesHTML = `<div class="tile-grid">${availableCourses.map(c => {
          const count = items.filter(i => i.course === c && i.type === state.type).length;
          return `<div class="tile" onclick="openTier3('type','${c}','${state.type}')">
            <div class="icon-badge">${folderIcon}</div>
            <div class="label">${c}</div>
            <div class="count">${count} item${count === 1 ? '' : 's'}</div>
          </div>`;
        }).join('')}</div>`;
      }
      const tier2CourseSym = state.entry === 'course' ? courseSymbol[state.course] : null;
      const tier2TitleHTML = tier2CourseSym
        ? `<div class="title-row" style="margin-bottom:6px;">
            <div class="title-icon-badge badge-dev-wrap"><span style="font-size:${tier2CourseSym.size};">${tier2CourseSym.text}</span>${devTapeHTML(state.course)}</div>
            <div class="page-title" style="margin:0;">${state.course}${devPillHTML(state.course)}</div>
          </div>`
        : `<div class="page-title" style="margin-top:0;">${state.entry === 'course' ? state.course : typeLabel[state.type]}</div>`;
      page.innerHTML = `
        ${crumbHTML()}
        ${tier2TitleHTML}
        ${infoHTML}
        ${tilesHTML}
      `;
      return;
    }

    if (state.level === 'tier3') {
      const matches = items.filter(i => i.course === state.course && i.type === state.type).sort(sectionCompare);
      const titleSuffix = (state.type === 'Worksheet') ? 'Worksheets (Standard & Blended/Honors)' : typeLabel[state.type];
      page.innerHTML = `
        ${crumbHTML()}
        ${titleBlockHTML(state.type, `${state.course} — ${titleSuffix}`, state.course)}
        ${tier3BodyHTML(matches, state.course, state.type)}
      `;
      alignSidebarToJumpRow();
      return;
    }

    if (state.level === 'detail') {
      const item = items.find(i => i.id === state.id);
      if (!item) { goToCourseMaterials(); return; }
      if (item.type === 'Applet') { launchApplet(item.id); goToCourseMaterials(); return; }

      let linksHTML = '';
      if (item.type === 'Worksheet') {
        linksHTML = fileLinkHTML(item.worksheetFile, 'Worksheet (PDF)', { newTab: true })
          + (item.hasSolutions !== false ? fileLinkHTML(item.solutionsFile, 'Solutions (PDF)', { newTab: true }) : '');
      } else if (item.type === 'LectureGuideNotes') {
        linksHTML = (item.guideFile ? fileLinkHTML(item.guideFile, 'Lecture Guide (PDF)', { newTab: true }) : '')
          + (item.notesFile ? fileLinkHTML(item.notesFile, 'Lecture Notes (PDF)', { newTab: true }) : '');
      } else if (item.type === 'LectureVideo') {
        linksHTML = fileLinkHTML(item.playlistUrl, 'Watch on YouTube (playlist)', { newTab: true, tooltip: item.inProgress ? 'Video in progress — check back soon' : 'Playlist not yet linked' });
      }

      const related = relatedItems(item);
      const relatedHTML = related.length ? `
        <div class="related-block"><h2>Related materials</h2><div class="related-list">${related.map(relatedRowHTML).join('')}</div></div>` : '';

      const sections = item.sections || [];
      const sectionText = sections.length ? (sections.length > 1 ? 'Sections ' : 'Section ') + sections.join(', ') : '';

      page.innerHTML = `
        ${crumbHTML()}
        <div class="detail-card">
          <div class="title-row" style="margin-bottom:14px;">
            <div class="title-icon-badge">${typeIconSVG[item.type]}</div>
            <div>
              <div class="item-eyebrow">${typeLabel[item.type]}${sectionText ? ' · ' + sectionText : ''}</div>
              <div class="detail-title" style="margin:2px 0 0;">${item.title}</div>
            </div>
          </div>
          <div class="item-tag">${item.course}${item.subtype === 'Blended' ? ' · Blended/Honors' : ''}</div>
          <p class="detail-desc">${item.desc}</p>
          <div class="detail-links">${linksHTML}</div>
        </div>
        ${relatedHTML}
      `;
      return;
    }
  }

  function formatDate(d) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Broadened past just title+course so a search for a section number ("1.1"), a topic
  // ("squeeze theorem"), a material type ("worksheet"), or a subtype ("blended") also matches —
  // those are all things a student is just as likely to type as the item's own title.
  function searchableText(i) {
    return [
      i.title, i.course, typeLabel[i.type], i.sectionLabel, (i.sections || []).join(' '),
      i.subtype === 'Blended' ? 'Blended Honors' : (i.subtype === 'Standard' ? 'Standard' : '')
    ].filter(Boolean).join(' ').toLowerCase();
  }
  function doSearch(q, isMobile) {
    const boxId = isMobile ? 'search-results-mobile' : 'search-results';
    const box = document.getElementById(boxId);
    if (!isMobile) document.getElementById('search-clear').classList.toggle('visible', q.length > 0);
    if (!q) { box.innerHTML = ''; return; }
    const matches = items.filter(i => searchableText(i).includes(q.toLowerCase()));
    box.innerHTML = matches.slice(0, 6).map((i, idx) =>
      `<div class="r" onclick="goToSearchResult(${idx}, ${!!isMobile})"><b>${i.title}</b> — ${i.course}, ${typeLabel[i.type]}${i.subtype === 'Blended' ? ' (Blended/Honors)' : ''}</div>`
    ).join('') || `<div class="r" style="cursor:default;"><span style="color:var(--eyebrow); font-style:italic;">No matches.</span></div>`;
    window._lastSearchMatches = matches;
  }

  function goToSearchResult(idx, isMobile) {
    const i = window._lastSearchMatches[idx];
    if (!i) return;
    openDetail(i.id);
    if (isMobile) {
      document.getElementById('search-input-mobile').value = '';
      document.getElementById('search-results-mobile').innerHTML = '';
      closeMobileMenu();
    } else { clearSearch(); }
  }

  function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-clear').classList.remove('visible');
  }

  document.getElementById('footer-updated').textContent =
    formatDate([...items].sort((a, b) => new Date(b.updated) - new Date(a.updated))[0].updated);

  // ---------- initial load: set up history without creating a duplicate first entry ----------
  // browse.html has no home route of its own — the home page lives at index.html and links here
  // via a hash (e.g. browse.html#/applets); parse that hash into a starting state, defaulting to
  // Course Materials when there's no hash or it doesn't match a known top-level route.
  function stateFromHash() {
    const h = (window.location.hash || '').replace(/^#/, '');
    if (h === '/applets') return { level: 'typeBrowse', type: 'Applet' };
    if (h === '/lecture-videos') return { level: 'typeBrowse', type: 'LectureVideo' };
    return { level: 'courseMaterials' };
  }
  state = stateFromHash();
  try { history.replaceState(state, '', '#' + statePath(state)); } catch (e) { /* ignore */ }
  render();
