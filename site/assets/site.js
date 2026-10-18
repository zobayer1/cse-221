// CSE 221 course website: header, footer and page renderers. Data comes from data.js (window.SITE).
(function () {
  var S = window.SITE, C = S.course;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var sim = function (id) { return S.simulators.filter(function (s) { return s.id === id; })[0]; };
  var lec = function (dir) { return S.lectures.filter(function (l) { return l.dir === dir; })[0]; };
  var slideUrl = function (dir, n) { return 'slides.html?l=' + encodeURIComponent(dir) + (n > 1 ? '#' + n : ''); };
  var page = document.body.getAttribute('data-page');

  // Header and footer.
  var top = document.createElement('header');
  top.className = 'top';
  var nav = [['index.html#lectures', 'Lectures'], ['index.html#simulators', 'Simulators'], ['index.html#quizzes', 'Quizzes'],
    ['index.html#assignments', 'Assignments'], ['glossary.html', 'Glossary']];
  top.innerHTML = '<div class="in"><a class="brand" href="index.html">' + esc(C.code) + ' · ' + esc(C.name) +
    '<small>' + esc(C.term) + ', ' + esc(C.section) + '</small></a><nav>' +
    nav.map(function (n) { return '<a href="' + n[0] + '"' + (page === 'glossary' && n[1] === 'Glossary' ? ' class="on"' : '') + '>' + n[1] + '</a>'; }).join('') +
    '</nav></div>';
  if (page !== 'viewer') document.body.insertBefore(top, document.body.firstChild);
  var CC = 'https://creativecommons.org/licenses/by-nc-sa/4.0/';
  if (page !== 'viewer') {
    var foot = document.createElement('footer');
    foot.className = 'foot';
    foot.innerHTML = '<div class="in"><div class="side"><a class="cc" href="' + CC + '" rel="license">CC BY-NC-SA 4.0</a>' +
      '<a href="' + esc(C.repo) + '">Source on GitHub</a></div><div class="lic">' +
      '<p>© 2026 ' + esc(C.instructor) + '. The course materials on this site are licensed under the <a href="' + CC + '" rel="license">' +
      'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>. ' +
      'You may share and adapt them for non-commercial purposes if you give credit and share your adaptations under the same license.</p>' +
      '<p>The simulators and assignment support programs are under the <a href="simulations/LICENSE.txt">MIT License</a>. ' +
      'The BRAC University logo and the textbook cover images belong to their owners.</p></div></div>';
    document.body.appendChild(foot);
  } else {
    var lic = document.createElement('a');
    lic.className = 'cc';
    lic.href = CC;
    lic.rel = 'license';
    lic.title = 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International';
    lic.textContent = 'CC BY-NC-SA 4.0';
    document.querySelector('.vbar').appendChild(lic);
  }

  var pdfBtn = function (href) { return href ? '<a class="btn" href="' + esc(href) + '" download>PDF</a>' : ''; };

  var R = {};
  R.home = function () {
    document.title = C.code + ' – ' + C.name;
    var q = function (sel) { return document.querySelector(sel); };
    q('#hero').innerHTML = '<div><h1>' + esc(C.code) + ' – ' + esc(C.name) + '</h1><p>' + esc(C.dept) + '<br>' +
      esc(C.term) + ', ' + esc(C.section) + ' · ' + esc(C.instructor) + ' (' + esc(C.initials) + ')</p></div>' +
      '<table class="hours">' + C.hours.map(function (h) {
        return '<tr><td>' + esc(h.what) + '</td><td>' + esc(h.days) + ', ' + esc(h.time) + '</td><td class="m">' + esc(h.where) + '</td></tr>';
      }).join('') + '</table>';

    q('#lectures .lecs').innerHTML = S.lectures.map(function (l) {
      var sims = (l.simulators || []).map(sim).filter(Boolean);
      return '<div class="lec"><div class="n">' + esc(l.num) + '</div><div><h3><a href="' + slideUrl(l.dir, 1) + '">' + esc(l.title) + '</a></h3>' +
        '<p>' + esc(l.topics) + ' · ' + l.total + ' slides</p>' +
        (sims.length ? '<div class="chips">' + sims.map(function (s) { return '<a class="chip" href="' + esc(s.file) + '">▶ ' + esc(s.title) + ' simulator</a>'; }).join('') + '</div>' : '') +
        '</div><div class="acts"><a class="btn pri" href="' + slideUrl(l.dir, 1) + '">View slides</a>' +
        pdfBtn(l.pdf && 'lectures/' + l.dir + '/' + l.pdf) + '</div></div>';
    }).join('');

    q('#simulators .grid').innerHTML = S.simulators.map(function (s) {
      var used = S.lectures.filter(function (l) { return (l.simulators || []).indexOf(s.id) >= 0; });
      return '<div class="card"><div class="k">' + esc(used.map(function (l) { return l.num; }).join(', ') || 'Simulator') + '</div>' +
        '<h3><a href="' + esc(s.file) + '">' + esc(s.title) + '</a></h3><p>' + esc(s.desc) + '</p>' +
        '<div class="acts"><a class="btn pri" href="' + esc(s.file) + '">Open</a><a class="btn" href="' + esc(s.file) + '" download>Download</a></div></div>';
    }).join('');

    q('#quizzes .grid').innerHTML = S.quizzes.length ? S.quizzes.map(function (x) {
      return '<div class="card"><div class="k">Quiz</div><h3>' + esc(x.title) + '</h3><p>' + esc(x.topics) + '</p><div class="acts">' +
        '<a class="btn pri" href="' + esc(x.paper.html) + '">Question paper</a>' + pdfBtn(x.paper.pdf) +
        (x.answers ? '<a class="btn" href="' + esc(x.answers.html) + '">Solutions</a>' + pdfBtn(x.answers.pdf) : '<span class="empty">Solutions after the quiz</span>') +
        '</div></div>';
    }).join('') : '<p class="empty">No quizzes yet.</p>';

    q('#assignments .grid').innerHTML = S.assignments.length ? S.assignments.map(function (x) {
      return '<div class="card"><div class="k">Due ' + esc(x.due) + '</div><h3>' + esc(x.title) + '</h3><p>' + esc(x.subtitle) + '</p>' +
        (x.support ? '<p>Support programs: ' + x.support.map(function (f) { return '<a href="' + esc(f) + '"><code>' + esc(f.split('/').pop()) + '</code></a>'; }).join(', ') + '</p>' : '') +
        '<div class="acts"><a class="btn pri" href="' + esc(x.paper.html) + '">Assignment</a>' + pdfBtn(x.paper.pdf) +
        (x.zip ? '<a class="btn" href="' + esc(x.zip) + '" download>Support files (.zip)</a>' : '') + '</div></div>';
    }).join('') : '<p class="empty">No assignments yet.</p>';
  };

  R.glossary = function () {
    document.title = 'Glossary – ' + C.code;
    var g = S.glossary, dl = document.getElementById('gl');
    var id = function (t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
    dl.innerHTML = g.map(function (t) {
      var refs = (t.see || []).map(function (r) {
        var l = lec(r[0]);
        return l ? '<a href="' + slideUrl(r[0], r[1]) + '">' + esc(l.num || l.title) + ', slide ' + r[1] + ': ' + esc(l.slides[r[1] - 1]) + '</a>' : '';
      });
      if (t.clrs) refs.push('<span>CLRS ' + esc(t.clrs) + '</span>');
      var s = t.sim && sim(t.sim);
      if (s) refs.push('<a href="' + esc(s.file) + '">▶ ' + esc(s.title) + ' simulator</a>');
      return '<div id="' + id(t.term) + '" data-q="' + esc((t.term + ' ' + t.def).toLowerCase()) + '"><dt>' + esc(t.term) + '</dt><dd><p>' + esc(t.def) + '</p><div class="refs">' + refs.join('') + '</div></dd></div>';
    }).join('');
    var letters = [];
    g.forEach(function (t) { var c = t.term[0].toUpperCase(); if (letters.indexOf(c) < 0) letters.push(c); });
    document.getElementById('letters').innerHTML = letters.map(function (c) {
      var first = g.filter(function (t) { return t.term[0].toUpperCase() === c; })[0];
      return '<a href="#' + id(first.term) + '">' + c + '</a>';
    }).join('');
    document.getElementById('q').addEventListener('input', function () {
      var v = this.value.trim().toLowerCase();
      dl.querySelectorAll('[data-q]').forEach(function (el) { el.hidden = v && el.getAttribute('data-q').indexOf(v) < 0; });
    });
    document.getElementById('links').innerHTML = S.links.map(function (grp) {
      return '<h3 class="subhd">' + esc(grp.group) + '</h3><ul class="links">' + grp.items.map(function (i) {
        return '<li><a href="' + esc(i.url) + '">' + esc(i.title) + '</a><span>' + esc(i.by) + '</span></li>';
      }).join('') + '</ul>';
    }).join('') + '<h3 class="subhd">Simulators</h3><ul class="links">' + S.simulators.map(function (s) {
      return '<li><a href="' + esc(s.file) + '">' + esc(s.title) + '</a><span>' + esc(s.desc) + '</span></li>';
    }).join('') + '</ul>';
  };

  R.viewer = function () {
    var params = new URLSearchParams(location.search);
    var L = lec(params.get('l')) || S.lectures[0];
    var i = L.dir === params.get('l') ? Math.min(Math.max(parseInt(location.hash.slice(1), 10) || 1, 1), L.total) : 1;
    var frame = document.getElementById('frame'), sel = document.getElementById('sel'), cnt = document.getElementById('cnt');
    var prev = document.querySelectorAll('[data-go="-1"]'), next = document.querySelectorAll('[data-go="1"]');
    var idx = S.lectures.indexOf(L), prevL = S.lectures[idx - 1], nextL = S.lectures[idx + 1];
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var src = function (n) { return 'lectures/' + L.dir + '/slide' + pad(n) + '.html'; };

    document.title = (L.num ? L.num + ': ' : '') + L.title + ' – ' + C.code;
    document.getElementById('ttl').innerHTML = (L.num ? '<small>' + esc(L.num) + '</small>' : '') + esc(L.title);
    sel.innerHTML = L.slides.map(function (t, k) { return '<option value="' + (k + 1) + '">' + (k + 1) + '. ' + esc(t) + '</option>'; }).join('');
    var pdf = document.getElementById('pdf');
    if (L.pdf) pdf.href = 'lectures/' + L.dir + '/' + L.pdf; else pdf.remove();

    function show(n, push) {
      if (n < 1) { if (prevL) location.href = slideUrl(prevL.dir, prevL.total); return; }
      if (n > L.total) { if (nextL) location.href = slideUrl(nextL.dir, 1); return; }
      i = n;
      frame.src = src(i);
      sel.value = i;
      cnt.textContent = i + ' / ' + L.total;
      prev.forEach(function (b) { b.disabled = i === 1 && !prevL; b.title = i === 1 && prevL ? 'Previous lecture' : 'Previous slide'; });
      next.forEach(function (b) { b.disabled = i === L.total && !nextL; b.title = i === L.total && nextL ? 'Next lecture: ' + nextL.title : 'Next slide'; });
      document.getElementById('nextlec').hidden = !(i === L.total && nextL);
      var url = slideUrl(L.dir, i);
      if (push) history.pushState(null, '', url); else history.replaceState(null, '', url);
      if (i < L.total) { var p = document.createElement('link'); p.rel = 'prefetch'; p.href = src(i + 1); document.head.appendChild(p); }
    }
    if (nextL) {
      var nl = document.getElementById('nextlec');
      nl.href = slideUrl(nextL.dir, 1);
      nl.textContent = 'Next: ' + (nextL.num || nextL.title) + ' →';
    }
    document.querySelectorAll('[data-go]').forEach(function (b) {
      b.addEventListener('click', function () { show(i + parseInt(b.getAttribute('data-go'), 10), true); });
    });
    sel.addEventListener('change', function () { show(parseInt(sel.value, 10), true); sel.blur(); });
    addEventListener('popstate', function () { show(parseInt(location.hash.slice(1), 10) || 1, false); });

    var stage = document.getElementById('stage');
    function fullscreen() {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (stage.requestFullscreen) stage.requestFullscreen();
    }
    document.getElementById('fs').addEventListener('click', fullscreen);
    document.getElementById('open').addEventListener('click', function () { window.open(src(i), '_blank'); });

    function onKey(e) {
      if (e.altKey || e.ctrlKey || e.metaKey || /^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      var k = e.key, go = null;
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'n') go = i + 1;
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace' || k === 'p') go = i - 1;
      else if (k === 'Home') go = 1;
      else if (k === 'End') go = L.total;
      else if (k === 'f' || k === 'F') { fullscreen(); e.preventDefault(); return; }
      if (go !== null) { e.preventDefault(); show(Math.min(Math.max(go, 0), L.total + 1), true); }
    }
    var x0 = null;
    function swipe(doc) {
      doc.addEventListener('touchstart', function (e) { x0 = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
      doc.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1), true);
        x0 = null;
      }, { passive: true });
    }
    document.addEventListener('keydown', onKey);
    swipe(document);
    // The slide runs in a same-origin iframe; listen there too so keys work after clicking on it.
    frame.addEventListener('load', function () {
      try { frame.contentDocument.addEventListener('keydown', onKey); swipe(frame.contentDocument); } catch (err) { /* file:// */ }
    });
    show(i, false);
  };

  if (R[page]) R[page]();
})();
