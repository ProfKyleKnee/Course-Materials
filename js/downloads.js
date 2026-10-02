  // Bulk ZIP downloads for the "Download Everything" (course landing page), Worksheets, and
  // Lecture Guides/Notes sidebar boxes. Depends on js/data.js (items, coursesInDevelopment) and
  // the vendored js/vendor/jszip.min.js, both of which browse.html loads before this file; depended
  // on in turn by js/app.js's sidebarContentForType()/courseDownloadSidebarHTML() calls, which build
  // the onclick="bulkDownload(...)" markup these functions respond to. No module wrapper, same as
  // js/app.js — these functions must stay global or every button's onclick breaks silently.

  // A Word copy of every guide/notes/worksheet/solutions PDF already lives right next to the PDF
  // in Course Materials/, same name, just a .docx extension -- no separate data.js field needed.
  function docxPath(p) {
    return (p && p !== '#') ? p.replace(/\.pdf$/i, '.docx') : p;
  }

  // Strips the 'Course Materials/<Course>/' prefix so a zip's internal folder structure starts
  // at 'Notes/Ch. 2/...' or 'Blended Sessions/Unit 1/...' instead of repeating the course name
  // the student already picked by downloading this particular zip.
  function zipEntryPath(fullPath) {
    const marker = 'Course Materials/';
    const idx = fullPath.indexOf(marker);
    if (idx === -1) return fullPath;
    const parts = fullPath.slice(idx + marker.length).split('/');
    parts.shift();
    return parts.join('/');
  }

  function worksheetFilePaths(course, subtypeFilter) {
    return items
      .filter(i => i.type === 'Worksheet' && i.course === course && (!subtypeFilter || i.subtype === subtypeFilter))
      .reduce((paths, i) => {
        paths.push(i.worksheetFile);
        if (i.hasSolutions !== false) paths.push(i.solutionsFile);
        return paths;
      }, [])
      .filter(p => p && p !== '#');
  }

  function guideNotesFilePaths(course) {
    return items
      .filter(i => i.type === 'LectureGuideNotes' && i.course === course)
      .reduce((paths, i) => {
        if (i.guideFile) paths.push(i.guideFile);
        if (i.notesFile) paths.push(i.notesFile);
        return paths;
      }, [])
      .filter(p => p && p !== '#');
  }

  function bulkDownloadPaths(course, kind, subtype) {
    if (kind === 'Worksheet') return worksheetFilePaths(course, subtype);
    if (kind === 'LectureGuideNotes') return guideNotesFilePaths(course);
    return worksheetFilePaths(course, null).concat(guideNotesFilePaths(course));
  }

  function zipFileName(course, kind, subtype, format) {
    const fmt = format === 'word' ? 'Word' : 'PDF';
    let label;
    if (kind === 'Worksheet') label = subtype ? `Worksheets (${subtype})` : 'All Worksheets';
    else if (kind === 'LectureGuideNotes') label = 'Lecture Guides-Notes';
    else label = 'All Materials';
    return `${course} - ${label} (${fmt}).zip`.replace(/[\\/]/g, '-');
  }

  // Swaps a clicked button into a disabled "Preparing ZIP..." state and back, regardless of
  // whether the download below succeeds, fails outright, or only partially succeeds.
  function setButtonLoading(btn, loading, label) {
    btn.disabled = loading;
    btn.classList.toggle('loading', loading);
    btn.textContent = loading ? 'Preparing ZIP…' : label;
  }

  async function bulkDownload(course, kind, subtype, format, btn) {
    if (isInDevelopment(course)) return;

    const pdfPaths = bulkDownloadPaths(course, kind, subtype);
    const paths = format === 'word' ? pdfPaths.map(docxPath) : pdfPaths;
    if (!paths.length) return;

    const originalLabel = btn.textContent;
    setButtonLoading(btn, true);

    const zip = new JSZip();
    await Promise.all(paths.map(async p => {
      try {
        const res = await fetch(encodeURI(p));
        if (!res.ok) throw new Error('fetch failed: ' + p);
        zip.file(zipEntryPath(p), await res.blob());
      } catch (e) {
        // Skip-and-continue: one missing/renamed file shouldn't block the rest of the bundle.
        console.warn('Download-all: skipped a file that failed to load —', p, e);
      }
    }));

    if (Object.keys(zip.files).length === 0) {
      setButtonLoading(btn, false, originalLabel);
      alert('Sorry, none of these files could be downloaded right now. Please try again later.');
      return;
    }

    if (window.trackDownload) window.trackDownload('zip/' + zipFileName(course, kind, subtype, format));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFileName(course, kind, subtype, format);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);

    setButtonLoading(btn, false, originalLabel);
  }

  // ---------- Bulk-download markup for the sidebar boxes. Separate from js/app.js's own
  // render functions (fileLinkHTML, sidebarContentForType, etc.) only because the ZIP-building
  // logic above needed a home — these still return the same kind of template-literal HTML string
  // every other *HTML() function in this codebase does, and are called directly from js/app.js. ----------

  const downloadIconSVG = `<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/></svg>`;

  // Mirrors fileLinkHTML()'s disabled/tooltip-wrap pattern in js/app.js for courses in
  // coursesInDevelopment, which have no real files to bundle — and again whenever this exact
  // course/kind/subtype combination has zero files on its own (e.g. Calculus III has no Blended
  // Sessions track, so its "Blended Only" buttons would otherwise silently do nothing on click).
  function dlBtnHTML(label, course, kind, subtype, format) {
    if (isInDevelopment(course)) {
      return `<span class="tooltip-wrap">
        <button class="dl-btn disabled" disabled aria-disabled="true">${label}</button>
        <span class="tooltip-bubble">No materials available yet</span>
      </span>`;
    }
    if (!bulkDownloadPaths(course, kind, subtype).length) {
      return `<span class="tooltip-wrap">
        <button class="dl-btn disabled" disabled aria-disabled="true">${label}</button>
        <span class="tooltip-bubble">Nothing to bundle for this option</span>
      </span>`;
    }
    const subtypeArg = subtype ? `'${subtype}'` : 'null';
    return `<button class="dl-btn" onclick="bulkDownload('${course}','${kind}',${subtypeArg},'${format}',this)">${label}</button>`;
  }

  // Only Calculus I and II actually have a Standard/Blended split worth offering as separate
  // bundles (every other course's Worksheet items are all subtype: 'Standard' — Calculus III has
  // no Blended Sessions track at all, and the coursesInDevelopment courses have no real subtype
  // data either way) -- so everywhere else just gets the single "All Worksheets" row, matching the
  // Lecture Guides/Notes section's own layout, instead of two dead Regular/Blended buttons that
  // the dlBtnHTML zero-files guard would otherwise disable on every single course but these two.
  const worksheetSubtypeSplitCourses = ['Calculus I', 'Calculus II'];

  function worksheetDownloadSectionHTML(course) {
    const splitBySubtype = worksheetSubtypeSplitCourses.includes(course);
    const body = splitBySubtype ? `
        <div class="dl-format-grid">
          <div>
            <div class="dl-format-col-head">PDF</div>
            <div class="dl-btn-stack">
              ${dlBtnHTML('All Worksheets', course, 'Worksheet', null, 'pdf')}
              ${dlBtnHTML('Regular Only', course, 'Worksheet', 'Standard', 'pdf')}
              ${dlBtnHTML('Blended Only', course, 'Worksheet', 'Blended', 'pdf')}
            </div>
          </div>
          <div>
            <div class="dl-format-col-head">Word</div>
            <div class="dl-btn-stack">
              ${dlBtnHTML('All Worksheets', course, 'Worksheet', null, 'word')}
              ${dlBtnHTML('Regular Only', course, 'Worksheet', 'Standard', 'word')}
              ${dlBtnHTML('Blended Only', course, 'Worksheet', 'Blended', 'word')}
            </div>
          </div>
        </div>` : `
        <div class="dl-single-row">
          ${dlBtnHTML('Download PDF', course, 'Worksheet', null, 'pdf')}
          ${dlBtnHTML('Download Word', course, 'Worksheet', null, 'word')}
        </div>`;
    return `
      <div class="dl-divider">
        <div class="dl-section-label">${downloadIconSVG}Bulk Download (ZIP)</div>
        ${body}
      </div>`;
  }

  function guideNotesDownloadSectionHTML(course) {
    return `
      <div class="dl-divider">
        <div class="dl-section-label">${downloadIconSVG}Bulk Download (ZIP)</div>
        <div class="dl-single-row">
          ${dlBtnHTML('Download PDF', course, 'LectureGuideNotes', null, 'pdf')}
          ${dlBtnHTML('Download Word', course, 'LectureGuideNotes', null, 'word')}
        </div>
      </div>`;
  }

  function courseDownloadSidebarHTML(course) {
    return `
      <div class="sidebar-header-row"><div class="sidebar-icon-inline">${downloadIconSVG}</div><h3>Download Everything</h3></div>
      <p>Grab every Lecture Guide/Notes and Worksheet (with solutions) for ${course} in one ZIP.</p>
      <div class="dl-single-row">
        ${dlBtnHTML('Download PDF', course, 'All', null, 'pdf')}
        ${dlBtnHTML('Download Word', course, 'All', null, 'word')}
      </div>`;
  }
