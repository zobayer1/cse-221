// CSE 221 slide theme: course details, footline and window scaling.
// Each lecture folder has a deck.js that sets window.DECK = { title, label, total }.
(function () {
  var COURSE = {
    author: 'Zobayer Hasan', initials: 'ZBYR',
    code: 'CSE 221', name: 'Algorithms',
    dept: 'Department of Computer Science and Engineering, BRAC University',
    term: 'Fall 2026', section: 'Section 19'
  };
  var DECK = window.DECK || {};
  var slide = document.querySelector('.slide');
  var m = location.pathname.match(/slide(\d+)\.html$/);
  var page = m ? parseInt(m[1], 10) : '';

  // Fill <span data-course="author"> style placeholders (title page, etc.).
  document.querySelectorAll('[data-course]').forEach(function (el) {
    el.textContent = COURSE[el.getAttribute('data-course')] || '';
  });
  document.querySelectorAll('[data-deck]').forEach(function (el) {
    el.textContent = DECK[el.getAttribute('data-deck')] || '';
  });

  if (!slide.hasAttribute('data-nofoot')) {
    var f = document.createElement('div');
    f.className = 'footline';
    f.innerHTML =
      '<span class="fl-a">' + COURSE.author + '</span>' +
      '<span class="fl-b">' + COURSE.code + ' · ' + (DECK.label || '') + '</span>' +
      '<span class="fl-c"><span>' + COURSE.term + ' · ' + COURSE.section + '</span><span>' + page + ' / ' + (DECK.total || '') + '</span></span>';
    slide.appendChild(f);
  }

  function fit() {
    var k = Math.min(innerWidth / 1280, innerHeight / 720) * 0.96;
    slide.style.transform = 'scale(' + k + ')';
  }
  addEventListener('resize', fit);
  fit();
})();
