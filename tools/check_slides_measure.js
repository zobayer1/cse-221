// Used by tools/check_slides.sh. Injected into a copy of each slide: reports layout problems into <pre id="sweep">.
addEventListener('load', function () {
  setTimeout(function () {
    var out = [], slide = document.querySelector('.slide');
    slide.style.transform = 'none';
    var S = slide.getBoundingClientRect();
    var foot = document.querySelector('.footline');
    var footTop = foot ? foot.getBoundingClientRect().top : S.bottom;
    var frame = document.querySelector('.frame');
    if (frame && frame.scrollHeight > frame.clientHeight + 2) out.push('frame overflows by ' + (frame.scrollHeight - frame.clientHeight) + 'px');
    var textEls = [];
    document.querySelectorAll('.frame *, .titlepage *').forEach(function (el) {
      if (el.closest('.doodle') || el.closest('svg')) return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.bottom > footTop + 1) out.push('below footline: <' + el.tagName.toLowerCase() + ' class="' + el.className + '"> by ' + Math.round(r.bottom - footTop) + 'px');
      if (r.right > S.right - 20 || r.left < S.left + 20) out.push('near/over side edge: <' + el.tagName.toLowerCase() + ' class="' + el.className + '">');
      // measure the text itself, not the element box (a paragraph's box spans the full width)
      Array.prototype.forEach.call(el.childNodes, function (n) {
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        var rg = document.createRange(); rg.selectNodeContents(n);
        Array.prototype.forEach.call(rg.getClientRects(), function (tr) { textEls.push([el, tr]); });
      });
    });
    document.querySelectorAll('.doodle, .here, .ic').forEach(function (d) {
      var dr = d.getBoundingClientRect();
      if (dr.bottom > footTop + 1) out.push('overlay runs into footline');
      textEls.forEach(function (t) {
        var r = t[1];
        if (t[0].contains(d)) return;
        var ix = Math.min(dr.right, r.right) - Math.max(dr.left, r.left), iy = Math.min(dr.bottom, r.bottom) - Math.max(dr.top, r.top);
        if (ix > 4 && iy > 4) out.push('overlay overlaps text: "' + t[0].textContent.trim().slice(0, 40) + '"');
      });
    });
    // in-flow stick figures (stroke #1a1a1a) that open a gap: they should be .doodle overlays
    function contentHeight() {
      var t = Infinity, b = -Infinity;
      Array.prototype.forEach.call(frame.children, function (c) { var r = c.getBoundingClientRect(); if (r.height) { t = Math.min(t, r.top); b = Math.max(b, r.bottom); } });
      return b - t;
    }
    if (frame) frame.querySelectorAll('svg').forEach(function (svg) {
      if ((svg.getAttribute('stroke') || '').toLowerCase() !== '#1a1a1a') return;
      if (svg.hasAttribute('data-figure')) return; // an important diagram, deliberately in the layout
      var before = contentHeight(), d = svg.style.display; svg.style.display = 'none';
      var gap = before - contentHeight(); svg.style.display = d;
      if (gap > 25) out.push('in-flow stick figure opens a ' + Math.round(gap) + 'px gap: make it a .doodle overlay');
    });
    var pre = document.createElement('pre'); pre.id = 'sweep';
    pre.textContent = JSON.stringify(Array.from(new Set(out)));
    document.body.appendChild(pre);
  }, 300);
});
