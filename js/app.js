  const items = [
    { id: 'g-c1-11', course: 'Calc 1', type: 'LectureGuideNotes', sections: ['1.1'], sectionLabel: 'Limits & Continuity',
      title: '1.1 Limits & Continuity — Notes', desc: 'Notes covering the formal definition of a limit, one-sided limits, and continuity at a point.',
      guideFile: null, notesFile: '#', updated: '2026-02-01' },
    { id: 'w-c1-11-std', course: 'Calc 1', type: 'Worksheet', subtype: 'Standard', sections: ['1.1'], sectionLabel: 'Limits & Continuity',
      title: '1.1 Limits Worksheet', desc: 'Practice evaluating limits graphically and algebraically.',
      worksheetFile: '#', solutionsFile: '#', hasSolutions: false, updated: '2026-01-15' },

    { id: 'g-c1-23', course: 'Calc 1', type: 'LectureGuideNotes', sections: ['2.3'], sectionLabel: 'Related Rates',
      title: '2.3 Related Rates — Guide & Notes', desc: 'Guide and notes for setting up and solving related rates problems.',
      guideFile: '#', notesFile: '#', updated: '2026-07-10' },
    { id: 'w-c1-23-std', course: 'Calc 1', type: 'Worksheet', subtype: 'Standard', sections: ['2.3'], sectionLabel: 'Related Rates',
      title: '2.3 Related Rates Worksheet', desc: 'Standard practice set on related rates word problems.',
      worksheetFile: '#', solutionsFile: '#', updated: '2026-02-10' },
    { id: 'w-c1-23-ble', course: 'Calc 1', type: 'Worksheet', subtype: 'Blended', sections: ['2.3'], sectionLabel: 'Related Rates',
      title: '2.3 Related Rates Worksheet (Blended/Honors)', desc: 'Extended related rates practice with additional multi-step problems.',
      worksheetFile: '#', solutionsFile: '#', updated: '2026-07-05' },
    { id: 'v-c1-23', course: 'Calc 1', type: 'LectureVideo', sections: ['2.3'], sectionLabel: 'Related Rates',
      title: '2.3 Related Rates — Lecture Videos', desc: 'Recorded walkthroughs of related rates setup and solved examples.',
      playlistUrl: '#', updated: '2026-04-22' },

    { id: 'g-c2-34', course: 'Calc 2', type: 'LectureGuideNotes', sections: ['3.4'], sectionLabel: 'Series Convergence',
      title: '3.4 Series Convergence — Guide & Notes', desc: 'Guide and notes covering convergence tests for infinite series.',
      guideFile: '#', notesFile: '#', updated: '2026-06-18' },
    { id: 'w-c2-34-std', course: 'Calc 2', type: 'Worksheet', subtype: 'Standard', sections: ['3.4'], sectionLabel: 'Series Convergence',
      title: '3.4 Series Convergence Worksheet', desc: 'Practice applying the ratio, root, and comparison tests.',
      worksheetFile: '#', solutionsFile: '#', updated: '2026-06-25' },
    { id: 'v-c2-34', course: 'Calc 2', type: 'LectureVideo', sections: ['3.4'], sectionLabel: 'Series Convergence',
      title: '3.4 Series Convergence — Lecture Videos', desc: 'Recorded lecture covering convergence tests with worked examples.',
      playlistUrl: '#', updated: '2026-07-16' },

    { id: 'g-c3-52', course: 'Calc 3', type: 'LectureGuideNotes', sections: ['5.2'], sectionLabel: 'Triple Integrals',
      title: '5.2 Triple Integrals — Guide & Notes', desc: 'Guide and notes on setting up triple integrals in rectangular coordinates.',
      guideFile: '#', notesFile: '#', updated: '2026-05-02' },
    { id: 'w-c3-52-std', course: 'Calc 3', type: 'Worksheet', subtype: 'Standard', sections: ['5.2'], sectionLabel: 'Triple Integrals',
      title: '5.2 Triple Integrals Worksheet', desc: 'Standard practice setting up and evaluating triple integrals.',
      worksheetFile: '#', solutionsFile: '#', updated: '2026-01-12' },
    { id: 'w-c3-52-ble', course: 'Calc 3', type: 'Worksheet', subtype: 'Blended', sections: ['5.2'], sectionLabel: 'Triple Integrals',
      title: '5.2 Triple Integrals Worksheet (Blended/Honors)', desc: 'Extended practice including cylindrical and spherical setups.',
      worksheetFile: '#', solutionsFile: '#', updated: '2026-03-28' },
    { id: 'v-c3-52', course: 'Calc 3', type: 'LectureVideo', sections: ['5.2'], sectionLabel: 'Triple Integrals',
      title: '5.2 Triple Integrals — Lecture Videos', desc: 'Recorded walkthroughs of triple integral setup and evaluation.',
      playlistUrl: '#', updated: '2026-03-01' },

    { id: 'g-c3-41', course: 'Calc 3', type: 'LectureGuideNotes', sections: ['4.1'], sectionLabel: 'Quadric Surfaces',
      title: '4.1 Quadric Surfaces — Guide', desc: 'Guide to identifying and sketching quadric surfaces from their equations.',
      guideFile: '#', notesFile: null, updated: '2026-05-20' },
    { id: 'a-c3-41', course: 'Calc 3', type: 'Applet', sections: ['4.1'],
      title: 'Quadric Surfaces Explorer', desc: 'Interactive tool for rotating and slicing quadric surfaces to see their cross-sections.',
      curve: 'M14,52 C34,14 56,14 74,32 S 100,52 118,22', launchUrl: '#', updated: '2026-07-14' },

    { id: 'g-pc-12', course: 'Precalc', type: 'LectureGuideNotes', sections: ['1.2'], sectionLabel: 'The Unit Circle',
      title: '1.2 The Unit Circle — Guide & Notes', desc: 'Guide and notes on unit circle values and their use in trigonometric functions.',
      guideFile: '#', notesFile: '#', updated: '2026-03-05' },
    { id: 'a-pc-12', course: 'Precalc', type: 'Applet', sections: ['1.2'],
      title: 'Unit Circle Explorer', desc: 'Drag a point around the unit circle to see corresponding sine and cosine values update live.',
      curve: 'M14,32 C30,10 60,10 74,32 S 105,55 118,32', launchUrl: '#', updated: '2026-04-11' },

    { id: 'g-st-61', course: 'Statistics', type: 'LectureGuideNotes', sections: ['6.1'], sectionLabel: 'Hypothesis Testing',
      title: '6.1 Hypothesis Testing — Notes', desc: 'Notes introducing null/alternative hypotheses, p-values, and significance levels.',
      guideFile: null, notesFile: '#', updated: '2026-02-20' },
    { id: 'w-st-61-std', course: 'Statistics', type: 'Worksheet', subtype: 'Standard', sections: ['6.1'], sectionLabel: 'Hypothesis Testing',
      title: '6.1 Hypothesis Testing Worksheet', desc: 'Practice setting up and interpreting hypothesis tests.',
      worksheetFile: '#', solutionsFile: '#', updated: '2026-02-14' },

    { id: 'g-la-31', course: 'Linear Algebra', type: 'LectureGuideNotes', sections: ['3.1'], sectionLabel: 'Eigenvalues & Eigenvectors',
      title: '3.1 Eigenvalues & Eigenvectors — Guide & Notes', desc: 'Guide and notes on computing eigenvalues and eigenvectors of a matrix.',
      guideFile: '#', notesFile: '#', updated: '2026-01-30' },
    { id: 'a-la-31', course: 'Linear Algebra', type: 'Applet', sections: ['3.1', '3.2'],
      title: 'Eigenvalues & Eigenvectors Explorer', desc: 'Visualize how a matrix transforms vectors and highlights its eigenvectors.',
      curve: 'M14,45 C40,50 55,15 74,20 S 105,45 118,15', launchUrl: '#', updated: '2026-05-20' },

    { id: 'w-dm-21-std', course: 'Discrete Math', type: 'Worksheet', subtype: 'Standard', sections: ['2.1'], sectionLabel: 'Logic & Proofs',
      title: '2.1 Logic & Proofs Worksheet', desc: 'Practice with truth tables, logical equivalences, and basic proof techniques.',
      worksheetFile: '#', solutionsFile: '#', updated: '2026-01-05' },
  ];

  // ---------- v16: dummy data — 10 items per unit per material type, 5 units, Calc 1 & Calc 3 (~400 items) ----------
  const dummyUnitDefs = {
    'Calc 1': [
      { unit: 1, label: 'Squeeze Theorem & Asymptotes' },
      { unit: 2, label: 'Definition of the Derivative' },
      { unit: 3, label: 'Chain Rule & Implicit Differentiation' },
      { unit: 4, label: 'Applications of Derivatives' },
      { unit: 5, label: 'Intro to Integration' },
    ],
    'Calc 3': [
      { unit: 1, label: 'Vectors in 3D Space' },
      { unit: 2, label: 'Partial Derivatives' },
      { unit: 3, label: 'Directional Derivatives & Gradients' },
      { unit: 6, label: 'Line Integrals' },
      { unit: 7, label: 'Surface Integrals' },
    ]
  };
  const subtopicSuffixes = ['Part A', 'Part B', 'Part C', 'Part D', 'Part E', 'Part F', 'Part G', 'Part H', 'Part I', 'Part J'];

  function buildDummyItems() {
    const out = [];
    const dates = ['2026-01-08', '2026-02-12', '2026-03-05', '2026-04-18', '2026-05-22', '2026-06-14', '2026-07-20', '2026-07-25', '2026-01-30', '2026-06-01'];
    let dateIdx = 0;
    const nextDate = () => dates[(dateIdx++) % dates.length];

    Object.keys(dummyUnitDefs).forEach(course => {
      const cs = course === 'Calc 1' ? 'c1' : 'c3';
      dummyUnitDefs[course].forEach(block => {
        for (let n = 1; n <= 10; n++) {
          const sec = `${block.unit}.${n}`;
          const secId = `${block.unit}-${n}`;
          const suffix = subtopicSuffixes[n - 1];
          const subtype = (n % 2 === 0) ? 'Blended' : 'Standard';
          out.push({ id: `d-${cs}-${secId}-ws`, course, type: 'Worksheet', subtype,
            sections: [sec], sectionLabel: `${block.label} — ${suffix}`,
            title: `${sec} ${block.label} Worksheet${subtype === 'Blended' ? ' (Blended/Honors)' : ''}`,
            desc: `Practice set covering ${block.label.toLowerCase()}, ${suffix.toLowerCase()}.`,
            worksheetFile: '#', solutionsFile: '#', updated: nextDate() });
          out.push({ id: `d-${cs}-${secId}-lgn`, course, type: 'LectureGuideNotes',
            sections: [sec], sectionLabel: `${block.label} — ${suffix}`,
            title: `${sec} ${block.label} — Guide & Notes (${suffix})`,
            desc: `Guide and notes covering ${block.label.toLowerCase()}, ${suffix.toLowerCase()}.`,
            guideFile: '#', notesFile: '#', updated: nextDate() });
          out.push({ id: `d-${cs}-${secId}-vid`, course, type: 'LectureVideo',
            sections: [sec], sectionLabel: `${block.label} — ${suffix}`,
            title: `${sec} ${block.label} — Lecture Video (${suffix})`,
            desc: `Recorded walkthrough of ${block.label.toLowerCase()}, ${suffix.toLowerCase()}.`,
            playlistUrl: '#', updated: nextDate() });
          out.push({ id: `d-${cs}-${secId}-app`, course, type: 'Applet',
            sections: [sec],
            title: `${block.label} Explorer (${suffix})`,
            desc: `Interactive exploration tool for ${block.label.toLowerCase()}, ${suffix.toLowerCase()}.`,
            curve: 'M14,50 C34,20 56,45 74,25 S 100,45 118,20', launchUrl: '#', updated: nextDate() });
        }
      });
    });
    return out;
  }
  items.push(...buildDummyItems());

  const fileTypeLabel = { Applet: "Interactive", Worksheet: "PDF", LectureGuideNotes: "PDF", LectureVideo: "Video" };

  const typeDescription = {
    Applet: "Interactive tools you can drag, adjust, and explore.",
    Worksheet: "Practice problems, in both Standard and Blended/Honors versions.",
    LectureGuideNotes: "Written guides and notes covering key concepts.",
    LectureVideo: "Recorded walkthroughs of important topics."
  };

  const bioText = "Kyle Knee is a mathematics professor in the Mathematics Department at Harper College in Palatine, IL, where he has taught for over a decade. He teaches primarily across the Calculus sequence, along with Statistics, Precalculus, Linear Algebra, and Discrete Mathematics. He holds a Master's in the Teaching of Mathematics from the University of Illinois and built this site to bring his interactive applets, lecture materials, and practice worksheets together in one place — for his own students and anyone else who finds them useful.";

  const videosSidebarText = "All of Kyle's recorded lecture walkthroughs live on one YouTube channel, organized into a playlist per course. Section-level links throughout this site jump straight to the relevant playlist — visit the full channel to browse everything in one place.";
  const youtubeChannelUrl = "#";

  // ---------- v17: sidebar copy for the Worksheets and Lecture Guides/Notes browse pages ----------
  const worksheetsOrgText = "Worksheets are grouped by course and unit. Blended/Honors versions are marked with a badge and appear alongside the Standard version for the same section.";
  const worksheetsUseText = "Worksheets are meant for independent practice after each section, with problems ranging from foundational to more challenging. Blended/Honors worksheets go a step further with deeper, more complex problems — these are intended for in-class group work under teacher supervision, rather than independent practice.";
  const guidesOrgText = "Lecture guides and notes are grouped by course and unit.";
  const guidesUseText = "The Lecture Guide is the skeleton version brought to class — theorems to notate rather than copy, problems to work through rather than read, diagrams to label as the lesson unfolds. It's the version taught from directly, marked up live so students can do the same on their own copy. The Lecture Notes are a completed version of that same guide, sometimes containing additional details beyond what's covered in class. The goal is to keep focus on understanding the ideas in the moment rather than transcribing — the guide provides structure during class, the notes provide the finished record.";

  const courseInfo = {
    "Calc 1": { blurb: "First-semester calculus: limits, derivatives, and an introduction to integrals, with an emphasis on graphical and real-world interpretation.", topics: "Limits & continuity, derivative rules, related rates, optimization, intro to integration", audience: "Students starting calculus for the first time — no calculus background assumed." },
    "Calc 2": { blurb: "Techniques of integration, sequences and series, and an introduction to parametric and polar curves.", topics: "Integration techniques, applications of integrals, sequences & series, parametric/polar", audience: "Students who've completed Calc 1 or the equivalent." },
    "Calc 3": { blurb: "Multivariable calculus — vectors, partial derivatives, multiple integrals, and vector calculus.", topics: "Vectors & 3D space, partial derivatives, multiple integrals, vector fields", audience: "Students who've completed Calc 2." },
    "Precalc": { blurb: "Foundational algebra and trigonometry needed before starting calculus.", topics: "Functions, polynomials, trig identities, exponential/log functions", audience: "Students preparing for Calc 1." },
    "Statistics": { blurb: "Introductory statistics: descriptive stats, probability, and inferential methods.", topics: "Descriptive statistics, probability, distributions, hypothesis testing, confidence intervals", audience: "Students from any major needing an intro stats course." },
    "Linear Algebra": { blurb: "Vectors, matrices, and linear transformations, with an eye toward applications.", topics: "Matrix operations, vector spaces, eigenvalues/eigenvectors, linear transformations", audience: "Students who've completed Calc 2 or by instructor permission." },
    "Discrete Math": { blurb: "Logic, proof techniques, and discrete structures used throughout computer science and mathematics.", topics: "Logic & proofs, set theory, combinatorics, graph theory basics", audience: "Math and CS students; no calculus required." },
  };

  const courseOrder = ["Precalc", "Calc 1", "Calc 2", "Calc 3", "Linear Algebra", "Discrete Math", "Statistics"];
  const typeOrder = ["Applet", "Worksheet", "LectureGuideNotes", "LectureVideo"];
  const typeLabel = { Applet: "Applets", Worksheet: "Worksheets", LectureGuideNotes: "Lecture Guides/Notes", LectureVideo: "Lecture Videos" };

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

  let state = { level: 'home' };
  let devShowEmptyCourses = false;

  // ---------- v16: History API — proper back/forward support ----------
  function statePath(s) {
    if (!s) return '/';
    if (s.level === 'home') return '/';
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
    state = e.state || { level: 'home' };
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

  const RECENT_WINDOW_DAYS = 30;
  function isRecentlyUpdated(dateStr) {
    const updated = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const diffDays = (now - updated) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= RECENT_WINDOW_DAYS;
  }
  function recentBadgeHTML(dateStr) {
    return isRecentlyUpdated(dateStr)
      ? `<span class="recent-badge" title="Updated ${formatDate(dateStr)}"><span class="dot-ico"></span>Updated</span>`
      : '';
  }

  function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }
  function closeMobileMenu() { document.getElementById('mobile-menu').classList.remove('open'); }

  function clearNav() { document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('current')); }
  function setCurrentNav(id) { const el = document.getElementById(id); if (el) el.classList.add('current'); }

  function updateNavHighlight() {
    clearNav();
    if (state.level === 'home') { setCurrentNav('nav-home'); return; }
    if (state.level === 'typeBrowse' && state.type === 'Applet') { setCurrentNav('nav-applets'); return; }
    if (state.level === 'typeBrowse' && state.type === 'LectureVideo') { setCurrentNav('nav-videos'); return; }
    if (state.level === 'courseMaterials') { setCurrentNav('nav-coursematerials'); return; }
    if (['tier2', 'tier3'].includes(state.level) && state.entry === 'course') { setCurrentNav('nav-coursematerials'); return; }
    if (state.level === 'detail') { setCurrentNav('nav-coursematerials'); return; }
  }

  function goHome() { navigate({ level: 'home' }); }
  function goToCourseMaterials() { navigate({ level: 'courseMaterials' }); }
  function enterCourse(course) { navigate({ level: 'tier2', entry: 'course', course }); }

  // ---------- v17: all four material types now open the same course-carousel browse page ----------
  // (previously Worksheet/LectureGuideNotes routed to the old tier2 folder-tile page instead)
  function enterType(type) {
    navigate({ level: 'typeBrowse', type });
  }

  function openTier3(entry, courseVal, typeVal) {
    navigate({ level: 'tier3', entry, course: courseVal, type: typeVal, isolatedUnit: null });
  }

  function isolateUnit(u) {
    navigate(Object.assign({}, state, { isolatedUnit: u }));
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
  function titleBlockHTML(type, titleText) {
    const tagline = type === 'Applet' ? `<div class="page-tagline">${appletTagline}</div>` : '';
    return `<div class="title-block">
      <div class="title-row">
        <div class="title-icon-badge">${typeIconSVG[type]}</div>
        <div class="page-title">${titleText}</div>
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
    if (state.level === 'home') return '';
    const parts = [`<span class="crumb" onclick="goHome()">Home</span>`];

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
        parts.push(`<span class="sep">/</span><span class="current-crumb">Unit ${state.isolatedUnit}</span>`);
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

  function tileSVG(a) {
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
        ${recentBadgeHTML(i.updated)}
      </div>
    </div>`;
  }

  function relatedRowHTML(i) {
    return `<div class="whatsnew-item" onclick="openDetail('${i.id}')">
      <div class="icon-badge">${typeIconSVG[i.type]}</div>
      <div>
        <div class="wn-title">${i.title}</div>
        <div class="wn-meta">${i.course} · ${typeLabel[i.type]}${i.subtype === 'Blended' ? ' · Blended/Honors' : ''}</div>
      </div>
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
    if (state.level === 'home') {
      card.className = 'sidebar-card bio-card';
      card.innerHTML = `<div class="sidebar-photo">KK</div><h3>Kyle Knee</h3><p>${bioText}</p>`;
      return;
    }
    card.className = 'sidebar-card';
    if (state.level === 'typeBrowse' || state.level === 'tier3') {
      card.innerHTML = sidebarContentForType(state.type);
    }
  }

  // ---------- v16: top-level course carousels (Applets / Lecture Videos overview pages) ----------
  function courseCarouselsHTML(typeVal) {
    const all = items.filter(i => i.type === typeVal);
    const coursesPresent = devShowEmptyCourses ? courseOrder.slice() : courseOrder.filter(c => all.some(a => a.course === c));
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
  function tier3BodyHTML(matches, course, typeVal) {
    if (!matches.length) return `<div class="empty-state">No items for this course/type yet.</div>`;
    const units = [...new Set(matches.map(unitOf))].sort((a, b) => Number(a) - Number(b));
    const colorMap = unitColorMap(units);
    const isolated = state.isolatedUnit;
    const cardFn = typeVal === 'Applet' ? appletCardHTML : cardHTML;
    const gridClass = typeVal === 'Applet' ? 'applet-grid' : 'grid';

    const chipsHTML = `<div class="jump-row">
      <span class="jump-link ${!isolated ? 'chip-active' : ''}" onclick="isolateUnit(null)">All Units</span>
      ${units.map(u => `<span class="jump-link ${isolated === u ? 'chip-active' : ''}" onclick="isolateUnit('${u}')">Unit ${u}</span>`).join('')}
    </div>`;

    if (isolated) {
      const inUnit = matches.filter(i => unitOf(i) === isolated);
      const color = colorMap[isolated];
      return `${chipsHTML}
        <div class="result-count">${inUnit.length} item${inUnit.length === 1 ? '' : 's'} in Unit ${isolated}</div>
        <div class="${gridClass}">${inUnit.map(i => cardFn(i, color)).join('')}</div>`;
    }

    const slugId = `${slug(course)}-${typeVal}`;
    const rows = units.map(u => {
      const inUnit = matches.filter(i => unitOf(i) === u);
      const rowId = `car-unit-${slugId}-${u}`;
      const color = colorMap[u];
      return `
        <div class="carousel-block unit-carousel-header" id="grp-unit-${u}" style="--unit-color:${color};">
          <div class="carousel-header">
            <div class="carousel-title" onclick="isolateUnit('${u}')">Unit ${u}</div>
            ${inUnit.length > 1 ? `<div class="carousel-seeall" onclick="isolateUnit('${u}')">See all (${inUnit.length}) →</div>` : ''}
          </div>
          <div class="carousel-wrap">
            ${arrowBtnHTML(rowId, -1)}
            <div class="carousel-track" id="${rowId}">${inUnit.map(i => cardFn(i, color)).join('')}</div>
            ${arrowBtnHTML(rowId, 1)}
          </div>
        </div>`;
    }).join('');
    return chipsHTML + rows;
  }

  function devToggleHTML() {
    return `<label class="dev-toggle">
      <input type="checkbox" ${devShowEmptyCourses ? 'checked' : ''} onchange="toggleShowEmptyCourses(this.checked)">
      <span class="dev-tag">Dev preview</span> Show all courses, including empty ones (remove before launch)
    </label>`;
  }
  function toggleShowEmptyCourses(checked) { devShowEmptyCourses = checked; render(); }

  function render() {
    updateNavHighlight();

    const page = document.getElementById('page');
    const shell = document.querySelector('.page-shell');
    // v18: sidebar now applies on both the top-level typeBrowse page AND the course-specific tier3
    // page, for the same three types; Applets stays sidebar-less on both.
    const showSidebar = state.level === 'home'
      || (state.level === 'typeBrowse' && sidebarTypes.includes(state.type))
      || (state.level === 'tier3' && sidebarTypes.includes(state.type));
    if (showSidebar) { shell.classList.remove('no-sidebar'); renderSidebar(); }
    else { shell.classList.add('no-sidebar'); }

    if (state.level === 'home') {
      const recent = [...items].sort((a, b) => new Date(b.updated) - new Date(a.updated)).slice(0, 5);
      const whatsNewHTML = recent.map(i => `
        <div class="whatsnew-item" onclick="openDetail('${i.id}')">
          <div class="icon-badge">${typeIconSVG[i.type]}</div>
          <div><div class="wn-title">${i.title}</div><div class="wn-meta">${i.course} · ${typeLabel[i.type]}</div></div>
          <div class="wn-date">${formatDate(i.updated)}</div>
        </div>`).join('');
      const explainerHTML = typeOrder.map(t => `
        <div class="explainer-card" onclick="enterType('${t}')">
          <div class="icon-badge">${typeIconSVG[t]}</div>
          <div><div class="label">${typeLabel[t]}</div><div class="desc">${typeDescription[t]}</div></div>
        </div>`).join('');
      page.innerHTML = `
        <div class="home-title">Teaching Materials Hub</div>
        <div class="home-subtitle">Applets, notes, and worksheets for every course — browse by course under Course Materials, or jump straight to Applets or Lecture Videos above.</div>
        <div class="explainer-row">${explainerHTML}</div>
        <div class="whatsnew"><h2>What's New</h2><div class="whatsnew-list">${whatsNewHTML}</div></div>
      `;
      return;
    }

    if (state.level === 'courseMaterials') {
      const coursesPresent = devShowEmptyCourses ? courseOrder.slice() : courseOrder.filter(c => items.some(i => i.course === c));
      const body = coursesPresent.map(c => {
        const info = courseInfo[c] || {};
        const counts = typeOrder.map(t => {
          const n = items.filter(i => i.course === c && i.type === t).length;
          return n ? `${typeLabel[t]}: ${n}` : null;
        }).filter(Boolean).join(' · ');
        return `<div class="course-directory-card" id="grp-${slug(c)}" onclick="enterCourse('${c}')">
          <div class="cd-title">${c}</div>
          <div class="cd-blurb">${info.blurb || ''}</div>
          <div class="cd-counts">${counts || 'No items yet'}</div>
        </div>`;
      }).join('');
      page.innerHTML = `
        ${crumbHTML()}
        <div class="page-title" style="margin-top:0;">Course Materials</div>
        ${devToggleHTML()}
        ${jumpRowHTML(coursesPresent)}
        <div style="display:flex; flex-direction:column; gap:14px;">${body}</div>
      `;
      return;
    }

    // ---------- v17: unified browse-by-type page (replaces appletsBrowse/videosBrowse + the old tier2
    // folder-tile route for Worksheet/LectureGuideNotes) — same course-carousel pattern for all four types ----------
    if (state.level === 'typeBrowse') {
      const t = state.type;
      const all = items.filter(i => i.type === t);
      const coursesPresent = devShowEmptyCourses ? courseOrder.slice() : courseOrder.filter(c => all.some(a => a.course === c));
      const pageTitle = t === 'Applet' ? 'All Applets' : typeLabel[t];
      const unitLabel = t === 'Applet' ? 'applet' : (t === 'LectureVideo' ? 'video section' : 'item');
      const countText = `${all.length} ${unitLabel}${all.length === 1 ? '' : 's'} across ${courseOrder.filter(c => all.some(a => a.course === c)).length} courses`;
      page.innerHTML = `
        ${crumbHTML()}
        ${titleBlockHTML(t, pageTitle)}
        ${devToggleHTML()}
        ${jumpRowHTML(coursesPresent)}
        <div class="result-count">${countText}</div>
        ${courseCarouselsHTML(t)}
      `;
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
            <div class="topics"><b>Topics:</b> ${info.topics}</div>
            <div class="topics" style="margin-top:4px;"><b>Who it's for:</b> ${info.audience}</div>
          </div>`;
        }
        const availableTypes = typeOrder.filter(t => items.some(i => i.course === state.course && i.type === t));
        tilesHTML = `<div class="pillbox-list">${availableTypes.map(t => {
          const count = items.filter(i => i.course === state.course && i.type === t).length;
          return `<div class="pillbox-row" onclick="openTier3('course','${state.course}','${t}')">
            <div class="icon-badge">${typeIconSVG[t]}</div>
            <div><div class="pb-label">${typeLabel[t]}</div><div class="pb-desc">${typeDescription[t]}</div></div>
            <div class="pb-count">${count} item${count === 1 ? '' : 's'}</div>
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
      page.innerHTML = `
        ${crumbHTML()}
        <div class="page-title" style="margin-top:0;">${state.entry === 'course' ? state.course : typeLabel[state.type]}</div>
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
        ${titleBlockHTML(state.type, `${state.course} — ${titleSuffix}`)}
        ${tier3BodyHTML(matches, state.course, state.type)}
      `;
      return;
    }

    if (state.level === 'detail') {
      const item = items.find(i => i.id === state.id);
      if (!item) { goHome(); return; }
      if (item.type === 'Applet') { launchApplet(item.id); goHome(); return; }

      let linksHTML = '';
      if (item.type === 'Worksheet') {
        linksHTML = fileLinkHTML(item.worksheetFile, 'Worksheet (PDF)')
          + (item.hasSolutions !== false ? fileLinkHTML(item.solutionsFile, 'Solutions (PDF)') : '');
      } else if (item.type === 'LectureGuideNotes') {
        linksHTML = (item.guideFile ? fileLinkHTML(item.guideFile, 'Lecture Guide (PDF)') : '')
          + (item.notesFile ? fileLinkHTML(item.notesFile, 'Lecture Notes (PDF)') : '');
      } else if (item.type === 'LectureVideo') {
        linksHTML = fileLinkHTML(item.playlistUrl, 'Watch on YouTube (playlist)', { newTab: true, tooltip: 'Playlist not yet linked' });
      }

      const related = relatedItems(item);
      const relatedHTML = related.length ? `
        <div class="related-block"><h2>Related materials</h2><div class="related-list">${related.map(relatedRowHTML).join('')}</div></div>` : '';

      const sections = item.sections || [];
      const sectionText = sections.length ? (sections.length > 1 ? 'Sections ' : 'Section ') + sections.join(', ') : '';

      page.innerHTML = `
        ${crumbHTML()}
        <div class="detail-card">
          <div class="item-eyebrow">${typeLabel[item.type]}${sectionText ? ' · ' + sectionText : ''}</div>
          <div class="detail-title">${item.title}</div>
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

  function doSearch(q, isMobile) {
    const boxId = isMobile ? 'search-results-mobile' : 'search-results';
    const box = document.getElementById(boxId);
    if (!isMobile) document.getElementById('search-clear').classList.toggle('visible', q.length > 0);
    if (!q) { box.innerHTML = ''; return; }
    const matches = items.filter(i => (i.title + ' ' + i.course).toLowerCase().includes(q.toLowerCase()));
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
  state = { level: 'home' };
  try { history.replaceState(state, '', '#/'); } catch (e) { /* ignore */ }
  render();
