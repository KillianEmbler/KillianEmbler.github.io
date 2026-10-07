/* Killian Embler - portfolio behaviour
   Everything here is progressive enhancement: with JS disabled the page is
   fully readable and the galleries are still swipe/scrollable. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── MOBILE MENU ─────────────────────────────────────────────────────── */
  var btn = document.querySelector('.menu-btn');
  var overlay = document.getElementById('menu-overlay');

  function setMenu(open) {
    if (!btn || !overlay) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    overlay.classList.toggle('open', open);
    overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.documentElement.classList.toggle('menu-open', open);
  }

  if (btn && overlay) {
    btn.addEventListener('click', function () {
      setMenu(btn.getAttribute('aria-expanded') !== 'true');
    });
    overlay.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (a) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        btn.focus();
      }
    });
    var wide = window.matchMedia('(min-width: 901px)');
    var onWide = function (e) { if (e.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* ── ACTIVE NAV LINK (desktop) ───────────────────────────────────────── */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-desktop a[href^="#"]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          navLinks.forEach(function (a) { a.classList.remove('active'); });
          map[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* ── SCROLL REVEAL ───────────────────────────────────────────────────── */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showAll() { reveals.forEach(function (r) { r.classList.add('in-view'); }); }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -4% 0px' });
    reveals.forEach(function (r) { io.observe(r); });
    window.addEventListener('beforeprint', showAll);
  }

  /* ── CAROUSELS ───────────────────────────────────────────────────────── */
  function initCarousel(root) {
    var track = root.querySelector('.carousel-track');
    if (!track) return;
    var ui = null, countEl = null, prev = null, next = null;

    function slides() {
      return Array.prototype.slice.call(track.querySelectorAll('.slide:not(.placeholder)'));
    }

    function currentIndex() {
      var w = track.clientWidth || 1;
      return Math.round(track.scrollLeft / w);
    }

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function update() {
      if (!ui) return;
      var list = slides();
      var i = Math.max(0, Math.min(currentIndex(), list.length - 1));
      countEl.textContent = pad(i + 1) + ' / ' + pad(list.length);
      prev.disabled = i <= 0;
      next.disabled = i >= list.length - 1;
    }

    function go(dir) {
      var list = slides();
      var i = Math.max(0, Math.min(currentIndex() + dir, list.length - 1));
      var left = i * track.clientWidth;
      if (track.scrollTo) {
        try { track.scrollTo({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' }); }
        catch (e) { track.scrollLeft = left; }
      } else { track.scrollLeft = left; }
    }

    function makeBtn(label, glyph, dir) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-btn';
      b.setAttribute('aria-label', label);
      b.textContent = glyph;
      b.addEventListener('click', function () { go(dir); });
      return b;
    }

    function build() {
      if (ui && ui.parentNode) ui.parentNode.removeChild(ui);
      ui = null;
      var list = slides();
      var ph = track.querySelector('.slide.placeholder');

      if (list.length === 0) {
        root.classList.add('is-empty');
        if (!ph) {
          ph = document.createElement('div');
          ph.className = 'slide placeholder';
          ph.innerHTML = '<span>Photos coming soon</span>';
          track.appendChild(ph);
        }
        return;
      }
      root.classList.remove('is-empty');
      if (ph) ph.parentNode.removeChild(ph);
      if (list.length < 2) return;

      ui = document.createElement('div');
      ui.className = 'carousel-ui';
      countEl = document.createElement('span');
      countEl.className = 'carousel-count';
      countEl.setAttribute('aria-live', 'polite');
      var btns = document.createElement('div');
      btns.className = 'carousel-btns';
      prev = makeBtn('Previous photo', '←', -1);
      next = makeBtn('Next photo', '→', 1);
      btns.appendChild(prev);
      btns.appendChild(next);
      ui.appendChild(countEl);
      ui.appendChild(btns);
      root.appendChild(ui);
      update();
    }

    // Percent-encode spaces etc. in src so folder names like "TVC Rocket" always resolve
    Array.prototype.forEach.call(track.querySelectorAll('img'), function (img) {
      var raw = img.getAttribute('src');
      if (raw && raw.indexOf('%') === -1) img.setAttribute('src', encodeURI(raw));
    });

    // Tap/click a photo to open it full size in a new tab (lets phones pinch-zoom diagrams and posters)
    Array.prototype.forEach.call(track.querySelectorAll('.slide img'), function (img) {
      if (img.parentNode && img.parentNode.tagName === 'A') return;
      var a = document.createElement('a');
      a.className = 'slide-link';
      a.href = img.getAttribute('src');
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', 'Open full-size image: ' + (img.getAttribute('alt') || 'photo'));
      img.parentNode.insertBefore(a, img);
      a.appendChild(img);
    });

    // Drop slides whose image is missing so visitors never see broken-image icons
    function dropSlide(img) {
      var slide = img.closest ? img.closest('.slide') : img.parentNode;
      if (slide && slide.parentNode) slide.parentNode.removeChild(slide);
      build();
    }
    track.addEventListener('error', function (e) {
      if (e.target && e.target.tagName === 'IMG') dropSlide(e.target);
    }, true);
    Array.prototype.forEach.call(track.querySelectorAll('img'), function (img) {
      // only eager images: a lazy image that hasn't started loading must not be mistaken for a failed one
      if (img.loading !== 'lazy' && img.complete && img.naturalWidth === 0 && img.getAttribute('src')) dropSlide(img);
    });

    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', update);

    build();
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), initCarousel);
})();
