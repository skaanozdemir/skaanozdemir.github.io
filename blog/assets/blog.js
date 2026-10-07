/* Blog behaviour. No dependencies. Everything degrades: the site reads fine without this file. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LANG = root.getAttribute('lang') || 'tr';
  var S = {
    tr: { copied: 'Bağlantı kopyalandı', noresult: 'Sonuç bulunamadı.', hint: 'Başlık, konu veya etiket yazın.', play: 'Oynat', pause: 'Durdur', loading: 'Yükleniyor…' },
    en: { copied: 'Link copied', noresult: 'No results.', hint: 'Type a title, topic or tag.', play: 'Play', pause: 'Pause', loading: 'Loading…' }
  }[LANG] || {};

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- Theme toggle ---------- */
  var themeBtn = doc.querySelector('[data-theme-toggle]');
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store('ko-blog-theme', next);
    });
  }

  /* ---------- Language preference ---------- */
  doc.querySelectorAll('[data-lang-link]').forEach(function (a) {
    a.addEventListener('click', function () { store('ko-blog-lang', a.getAttribute('data-lang-link')); });
  });

  /* ---------- Mobile menu ---------- */
  var nav = doc.querySelector('.mast__nav');
  var menuBtn = doc.querySelector('.mast__menu');
  if (nav && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = nav.hasAttribute('data-open');
      if (open) nav.removeAttribute('data-open'); else nav.setAttribute('data-open', '');
      menuBtn.setAttribute('aria-expanded', String(!open));
    });
  }

  /* ---------- Reading progress ---------- */
  var bar = doc.querySelector('.progress__bar');
  var article = doc.querySelector('[data-article]');
  if (bar && article) {
    var ticking = false;
    var update = function () {
      var r = article.getBoundingClientRect();
      var total = r.height - window.innerHeight * 0.6;
      var done = Math.min(Math.max(-r.top / Math.max(total, 1), 0), 1);
      bar.style.transform = 'scaleX(' + done.toFixed(4) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- TOC highlight ---------- */
  var tocLinks = [].slice.call(doc.querySelectorAll('.toc a'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var heads = Object.keys(map).map(function (id) { return doc.getElementById(id); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          tocLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          var a = map[e.target.id];
          if (a) a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '0px 0px -70% 0px', threshold: 0 });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* ---------- Copy link ---------- */
  doc.querySelectorAll('[data-copy-link]').forEach(function (b) {
    var label = b.querySelector('[data-label]');
    var original = label ? label.textContent : '';
    b.addEventListener('click', function () {
      var url = b.getAttribute('data-copy-link') || location.href;
      var done = function () {
        if (!label) return;
        label.textContent = S.copied; b.setAttribute('data-copied', '');
        setTimeout(function () { label.textContent = original; b.removeAttribute('data-copied'); }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () {});
      else { var ta = doc.createElement('textarea'); ta.value = url; doc.body.appendChild(ta); ta.select(); try { doc.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
    });
  });

  /* ---------- Walkthrough stepper ---------- */
  doc.querySelectorAll('[data-walk]').forEach(function (w) {
    var steps = [].slice.call(w.querySelectorAll('.walk__step'));
    var details = [].slice.call(w.querySelectorAll('.walk__detail'));
    var count = w.querySelector('.walk__count');
    var playBtn = w.querySelector('[data-walk-play]');
    var prevBtn = w.querySelector('[data-walk-prev]');
    var nextBtn = w.querySelector('[data-walk-next]');
    var i = 0, timer = null, touched = false;
    w.addEventListener('click', function (e) { if (e.target.closest('button')) touched = true; });
    function show(n) {
      i = (n + steps.length) % steps.length;
      steps.forEach(function (s, k) {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-done', k < i);
        var btn = s.querySelector('button');
        if (btn) btn.setAttribute('aria-current', k === i ? 'step' : 'false');
      });
      details.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
      if (count) count.textContent = (i + 1) + ' / ' + steps.length;
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      held = false;
      if (playBtn) { playBtn.setAttribute('aria-pressed', 'false'); var l = playBtn.querySelector('[data-label]'); if (l) l.textContent = S.play; playBtn.querySelector('.i-play').hidden = false; playBtn.querySelector('.i-pause').hidden = true; }
    }
    function start() {
      if (timer) return;
      if (playBtn) { playBtn.setAttribute('aria-pressed', 'true'); var l = playBtn.querySelector('[data-label]'); if (l) l.textContent = S.pause; playBtn.querySelector('.i-play').hidden = true; playBtn.querySelector('.i-pause').hidden = false; }
      timer = setInterval(function () { show(i + 1); }, 4200);
    }
    steps.forEach(function (s, k) {
      var btn = s.querySelector('button');
      if (btn) btn.addEventListener('click', function () { stop(); show(k); });
    });
    if (prevBtn) prevBtn.addEventListener('click', function () { stop(); show(i - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { stop(); show(i + 1); });
    if (playBtn) playBtn.addEventListener('click', function () { timer ? stop() : start(); });
    show(0);
    stop();
    // WCAG 2.2.2: autoplay holds while the pointer or keyboard focus is inside, and resumes on leave
    var held = false;
    function hold() { if (timer) { clearInterval(timer); timer = null; held = true; } }
    function release() { if (held && !touched) { held = false; timer = setInterval(function () { show(i + 1); }, 4200); } else { held = false; } }
    w.addEventListener('mouseenter', hold);
    w.addEventListener('mouseleave', release);
    w.addEventListener('focusin', hold);
    w.addEventListener('focusout', function (e) { if (!w.contains(e.relatedTarget)) release(); });
    if (!reduce && 'IntersectionObserver' in window && playBtn) {
      var autoplayed = false;
      new IntersectionObserver(function (es, ob) {
        es.forEach(function (e) { if (e.isIntersecting && !autoplayed) { autoplayed = true; ob.disconnect(); if (!touched) start(); } });
      }, { threshold: 0.35 }).observe(w);
    }
  });

  /* ---------- Video facade (YouTube / Vimeo load only on click) ---------- */
  doc.querySelectorAll('[data-embed]').forEach(function (b) {
    b.addEventListener('click', function () {
      var frame = b.parentNode;
      var f = doc.createElement('iframe');
      f.src = b.getAttribute('data-embed');
      f.title = b.getAttribute('data-title') || '';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.loading = 'lazy';
      frame.innerHTML = '';
      frame.appendChild(f);
    });
  });

  /* ---------- Search ---------- */
  var dlg = doc.getElementById('search');
  if (dlg && typeof dlg.showModal === 'function') {
    var input = dlg.querySelector('.search__input');
    var list = dlg.querySelector('.search__results');
    var index = null, loading = false;
    var fold = function (s) {
      return s.replace(/İ/g, 'i').replace(/I/g, 'i').toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
    };
    var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    function load(cb) {
      if (index) return cb();
      if (loading) return;
      loading = true;
      fetch(dlg.getAttribute('data-index')).then(function (r) { return r.json(); }).then(function (j) {
        index = j.map(function (p) { p._h = fold([p.t, p.s, p.tp, p.k, (p.g || []).join(' '), p.b].join(' ')); p._t = fold(p.t); return p; });
        cb();
      }).catch(function () { loading = false; list.innerHTML = '<li class="search__hint">' + esc(S.noresult) + '</li>'; });
    }
    function render(q) {
      var terms = fold(q.trim()).split(/\s+/).filter(Boolean);
      if (!terms.length) { list.innerHTML = '<li class="search__hint">' + esc(S.hint) + '</li>'; return; }
      var hits = index.map(function (p) {
        var score = 0;
        for (var k = 0; k < terms.length; k++) {
          if (p._h.indexOf(terms[k]) < 0) return null;
          if (p._t.indexOf(terms[k]) >= 0) score += 5;
          score += 1;
        }
        return { p: p, score: score };
      }).filter(Boolean).sort(function (a, b) { return b.score - a.score || (a.p.d < b.p.d ? 1 : -1); }).slice(0, 8);
      if (!hits.length) { list.innerHTML = '<li class="search__hint">' + esc(S.noresult) + '</li>'; return; }
      list.innerHTML = hits.map(function (h) {
        var p = h.p;
        return '<li><a href="' + dlg.getAttribute('data-base') + p.u + '"><span class="meta"><span class="meta__kind">' + esc(p.k) + '</span><span class="meta__dot" aria-hidden="true">·</span><span>' + esc(p.tp) + '</span><span class="meta__dot" aria-hidden="true">·</span><span>' + esc(p.dl) + '</span></span><span class="list__title">' + esc(p.t) + '</span></a></li>';
      }).join('');
    }
    function open() {
      if (!dlg.open) dlg.showModal();
      input.value = ''; list.innerHTML = '<li class="search__hint">' + esc(S.loading) + '</li>';
      load(function () { render(''); });
      setTimeout(function () { input.focus(); }, 0);
    }
    doc.querySelectorAll('[data-search-open]').forEach(function (b) { b.addEventListener('click', open); });
    dlg.querySelector('.search__close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    input.addEventListener('input', function () { if (index) render(input.value); });
    doc.addEventListener('keydown', function (e) {
      var tag = (doc.activeElement && doc.activeElement.tagName) || '';
      var typing = /INPUT|TEXTAREA|SELECT/.test(tag) || (doc.activeElement && doc.activeElement.isContentEditable);
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (!typing && e.key === '/')) { e.preventDefault(); open(); }
    });
  }

  /* ---------- Listing filters (progressive enhancement) ---------- */
  var fbar = doc.querySelector('[data-filters]');
  if (fbar) {
    var items = [].slice.call(doc.querySelectorAll('[data-item]'));
    var years = [].slice.call(doc.querySelectorAll('[data-year]'));
    var state = { kind: 'all', topic: 'all' };
    var empty = doc.querySelector('[data-empty]');
    var apply = function () {
      var shown = 0;
      items.forEach(function (it) {
        var ok = (state.kind === 'all' || it.getAttribute('data-kind') === state.kind) && (state.topic === 'all' || it.getAttribute('data-topic') === state.topic);
        it.hidden = !ok; if (ok) shown++;
      });
      years.forEach(function (y) {
        var group = [].slice.call(doc.querySelectorAll('[data-item][data-y="' + y.getAttribute('data-year') + '"]'));
        y.hidden = !group.some(function (g) { return !g.hidden; });
      });
      if (empty) empty.hidden = shown > 0;
    };
    fbar.querySelectorAll('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var group = b.getAttribute('data-filter'), val = b.getAttribute('data-value');
        state[group] = val;
        fbar.querySelectorAll('[data-filter="' + group + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        apply();
      });
    });
  }
})();
