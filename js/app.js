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

  function unitOf(item) {
    const s = (item.sections && item.sections[0]) || '0';
    return s.split('.')[0] || '0';
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
    window.open(item.launchUrl, '_blank', 'noopener');
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
    const svg = e.target.closest && e.target.closest('.applet-card svg.qs-tile');
    if (svg) qsStartSpin(svg);
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest && e.target.closest('.applet-card');
    if (!card || card.contains(e.relatedTarget)) return;
    const svg = card.querySelector('svg.qs-tile');
    if (svg) qsStopSpin(svg);
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
    return coursesPresent.map(c => {
      const inCourse = all.filter(a => a.course === c).sort(sectionCompare);
      if (!inCourse.length) {
        return `<div class="carousel-block" id="grp-${slug(c)}">
          <div class="carousel-header"><div class="carousel-title" style="cursor:default;color:var(--muted);">${c}</div></div>
          <div class="empty-group-state">No ${typeLabel[typeVal].toLowerCase()} for this course yet.</div>
        </div>`;
      }
      const rowId = `car-${typeVal}-${slug(c)}`;
      return `
        <div class="carousel-block" id="grp-${slug(c)}">
          <div class="carousel-header">
            <div class="carousel-title" onclick="openTier3('type','${c}','${typeVal}')">${c}</div>
            <div class="carousel-seeall" onclick="openTier3('type','${c}','${typeVal}')">See all (${inCourse.length}) →</div>
          </div>
          <div class="carousel-wrap">
            ${arrowBtnHTML(rowId, -1)}
            <div class="carousel-track" id="${rowId}">${inCourse.map(a => cardFn(a)).join('')}</div>
            ${arrowBtnHTML(rowId, 1)}
          </div>
        </div>`;
    }).join('');
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
      const coursesPresent = courseOrder.filter(c => all.some(a => a.course === c));
      const pageTitle = t === 'Applet' ? 'All Applets' : typeLabel[t];
      const unitLabel = t === 'Applet' ? 'applet' : (t === 'LectureVideo' ? 'video section' : 'item');
      const countText = `${all.length} ${unitLabel}${all.length === 1 ? '' : 's'} across ${courseOrder.filter(c => all.some(a => a.course === c)).length} courses`;
      page.innerHTML = `
        ${crumbHTML()}
        ${titleBlockHTML(t, pageTitle)}
        ${jumpRowHTML(coursesPresent)}
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
