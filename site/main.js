(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle (light by default) ---------- */
  var toggle = document.getElementById('theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncTheme() {
    var t = root.getAttribute('data-theme');
    toggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    if (themeMeta) themeMeta.setAttribute('content', t === 'dark' ? '#0E1116' : '#F6F7F9');
  }
  syncTheme();
  toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncTheme();
  });

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('nav-burger');
  var links = document.getElementById('nav-links');
  function closeMenu() {
    links.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav')) closeMenu();
  });

  /* ---------- Active nav link ---------- */
  var navMap = { about: 'about', experience: 'experience', projects: 'projects', skills: 'skills', education: 'skills', contact: 'contact' };
  var navLinks = links.querySelectorAll('a');
  function setActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle('active', id && a.getAttribute('href') === '#' + id);
    });
  }
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(navMap[en.target.id] || null);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Section reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- Hero terminal typing (~1.5s, then still) ---------- */
  var termLines = document.querySelectorAll('#hero-term .tl');
  if (reduceMotion) {
    termLines.forEach(function (l) { l.classList.add('on'); });
  } else {
    var steps = [];
    termLines.forEach(function (line) {
      var prompt = line.querySelector('.p');
      if (prompt) {
        var node = line.lastChild;
        var full = node.textContent;
        node.textContent = '';
        steps.push({ line: line, node: node, full: full });
      } else {
        steps.push({ line: line });
      }
    });
    var i = 0;
    var next = function () {
      if (i > 0) steps[i - 1].line.classList.remove('typing');
      if (i >= steps.length) return;
      var s = steps[i++];
      s.line.classList.add('on');
      if (!s.node) { setTimeout(next, 110); return; }
      s.line.classList.add('typing');
      var c = 0;
      var tick = function () {
        c++;
        s.node.textContent = s.full.slice(0, c);
        if (c < s.full.length) setTimeout(tick, 20);
        else setTimeout(next, 90);
      };
      tick();
    };
    setTimeout(next, 250);
  }

  /* ---------- Expandable timeline item ---------- */
  document.querySelectorAll('.tl-toggle').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  });

  /* ---------- Copy buttons ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var icon = btn.querySelector('.ui-icon use');
    var setIcon = function (name) { if (icon) icon.setAttribute('href', '/assets/icons.svg#i-' + name); };
    var label = btn.querySelector('.copy-text');
    var timer;
    btn.addEventListener('click', function () {
      copyText(btn.getAttribute('data-copy')).then(function () {
        clearTimeout(timer);
        btn.classList.add('copied');
        setIcon('check');
        if (label) label.textContent = 'Copied';
        timer = setTimeout(function () {
          btn.classList.remove('copied');
          setIcon('copy');
          if (label) label.textContent = 'Copy';
        }, 2000);
      }).catch(function () {});
    });
  });

  /* ---------- Resume preview (loaded only on demand) ---------- */
  var dialog = document.getElementById('resume-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    var frame = dialog.querySelector('.resume__frame');
    var loading = dialog.querySelector('.resume__loading');
    frame.addEventListener('load', function () {
      if (!frame.getAttribute('src')) return;
      frame.classList.add('ready');
      loading.hidden = true;
    });
    var openResume = function () {
      if (!frame.getAttribute('src')) frame.setAttribute('src', '/resume.html');
      closeMenu();
      root.classList.add('modal-open');
      dialog.showModal();
    };
    document.querySelectorAll('[data-resume]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        // Let ctrl/cmd/shift/middle clicks open the page in a new tab as usual
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openResume();
      });
    });
    var closeResume = function () {
      root.classList.remove('modal-open');
      if (dialog.open) dialog.close();
    };
    dialog.addEventListener('close', closeResume);
    dialog.addEventListener('cancel', function () { root.classList.remove('modal-open'); });
    document.getElementById('resume-close').addEventListener('click', closeResume);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeResume(); });
    document.getElementById('resume-print').addEventListener('click', function () {
      if (frame.classList.contains('ready')) frame.contentWindow.print();
      else window.open('/resume.html', '_blank', 'noopener');
    });
  }
})();
