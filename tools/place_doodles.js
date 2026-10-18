// Used by tools/place_doodles.sh. For every .doodle overlay on the slide, find the free
// spot nearest its current position (scaling down to 60% if needed) that keeps clear of
// text, boxes, borders, images and other figures. Prints the result into <pre id="place">.
addEventListener('load', function () {
  setTimeout(function () {
    var slide = document.querySelector('.slide'); slide.style.transform = 'none';
    var S = slide.getBoundingClientRect();
    var title = document.querySelector('.frametitle'), foot = document.querySelector('.footline');
    var top0 = title ? title.getBoundingClientRect().bottom - S.top + 8 : 8;
    var bot0 = (foot ? foot.getBoundingClientRect().top - S.top : 720) - 8;
    var PAD = 10, obstacles = [];
    function add(r) { if (r.width > 0 && r.height > 0) obstacles.push({ l: r.left - S.left, t: r.top - S.top, r: r.right - S.left, b: r.bottom - S.top }); }
    document.querySelectorAll('.frame *, .frame').forEach(function (el) {
      if (el.closest('.doodle')) return;
      if (el.tagName === 'svg' || el.tagName === 'IMG' || el.tagName === 'CANVAS') { add(el.getBoundingClientRect()); return; }
      if (el.closest('svg')) return;
      var cs = getComputedStyle(el);
      var painted = (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') ||
        ['Top', 'Right', 'Bottom', 'Left'].some(function (s) { return parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none'; }) ||
        cs.boxShadow !== 'none';
      if (painted && el !== document.querySelector('.frame')) add(el.getBoundingClientRect());
      Array.prototype.forEach.call(el.childNodes, function (n) {
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        var rg = document.createRange(); rg.selectNodeContents(n);
        Array.prototype.forEach.call(rg.getClientRects(), add);
      });
    });
    var res = [];
    document.querySelectorAll('.doodle').forEach(function (d, idx) {
      var dr = d.getBoundingClientRect();
      var cx = dr.left - S.left, cy = dr.top - S.top, w0 = dr.width, h0 = dr.height;
      var best = null;
      [1, 0.9, 0.8, 0.7, 0.6].forEach(function (sc) {
        if (best) return;
        var w = w0 * sc, h = h0 * sc;
        for (var y = top0; y + h <= bot0; y += 6) for (var x = 24; x + w <= 1256; x += 6) {
          var hit = obstacles.some(function (o) { return x < o.r + PAD && x + w > o.l - PAD && y < o.b + PAD && y + h > o.t - PAD; });
          if (hit) continue;
          var dist = Math.hypot(x - cx, y - cy);
          if (!best || dist < best.dist) best = { idx: idx, left: Math.round(x), top: Math.round(y), width: Math.round(w), scale: sc, dist: Math.round(dist) };
        }
      });
      res.push(best || { idx: idx, none: true });
      if (best) obstacles.push({ l: best.left, t: best.top, r: best.left + best.width, b: best.top + h0 * best.scale });
    });
    var pre = document.createElement('pre'); pre.id = 'place'; pre.textContent = JSON.stringify(res);
    document.body.appendChild(pre);
  }, 300);
});
