(function () {
  'use strict';

  /* ---------- Screenshot lightbox (project pages only) ---------- */
  var box = document.getElementById('lightbox');
  var buttons = document.querySelectorAll('[data-shot]');
  if (!box || !buttons.length || typeof box.showModal !== 'function') return;

  var img = box.querySelector('img');
  var cap = box.querySelector('figcaption');
  var shots = Array.prototype.map.call(buttons, function (b) {
    var i = b.querySelector('img');
    var fig = b.closest('figure').querySelector('figcaption');
    return { src: i.currentSrc || i.src, full: i.src.replace(/-800\.webp$/, '-1600.webp'), alt: i.alt, caption: fig ? fig.textContent : '' };
  });
  var current = 0;

  function show(n) {
    current = (n + shots.length) % shots.length;
    var s = shots[current];
    img.src = s.full;
    img.alt = s.alt;
    cap.textContent = s.caption + (shots.length > 1 ? '  (' + (current + 1) + ' / ' + shots.length + ')' : '');
  }
  function open(n) {
    show(n);
    document.documentElement.classList.add('modal-open');
    box.showModal();
  }
  function close() {
    document.documentElement.classList.remove('modal-open');
    if (box.open) box.close();
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { open(+b.getAttribute('data-shot')); });
  });
  box.addEventListener('click', function (e) {
    var act = e.target.closest('[data-lb]');
    if (act) {
      var a = act.getAttribute('data-lb');
      if (a === 'close') close();
      else show(current + (a === 'next' ? 1 : -1));
    } else if (e.target === box) {
      close();
    }
  });
  box.addEventListener('close', function () { document.documentElement.classList.remove('modal-open'); });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft') show(current - 1);
  });
  if (shots.length < 2) box.querySelectorAll('.lightbox__nav').forEach(function (b) { b.hidden = true; });
})();
