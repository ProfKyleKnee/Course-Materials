  // ---------- shared site data: the single source of truth for every count and listing
  // on the site. Loaded by BOTH index.html (hero stats in js/home.js) and browse.html
  // (all browse pages in js/app.js), in each case immediately before that page's own
  // script, so `items` / `courseOrder` / `typeOrder` / `typeLabel` are in scope. ----------
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

  const courseOrder = ["Precalc", "Calc 1", "Calc 2", "Calc 3", "Linear Algebra", "Discrete Math", "Statistics"];
  const typeOrder = ["Applet", "Worksheet", "LectureGuideNotes", "LectureVideo"];
  const typeLabel = { Applet: "Applets", Worksheet: "Worksheets", LectureGuideNotes: "Lecture Guides/Notes", LectureVideo: "Lecture Videos" };
