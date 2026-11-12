/* ==========================================================
   GEDO EZZ – menu lightbox (zoom, pan, pinch, keyboard)
   Plain JavaScript, no dependencies.
   ========================================================== */
(function () {
  'use strict';

  var lb = document.getElementById('lightbox');
  var stage = document.getElementById('lb-stage');
  var img = document.getElementById('lb-img');
  var counter = document.getElementById('lb-count');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.menu__btn'));
  if (!lb || !stage || !img || !thumbs.length) return;

  var MIN_SCALE = 1;
  var MAX_SCALE = 5;
  var DOUBLE_TAP_SCALE = 2.5;

  var scale = 1, tx = 0, ty = 0;
  var index = 0, isOpen = false, opener = null;
  var pointers = new Map();
  var drag = null, pinch = null;
  var lastTap = { time: 0, x: 0, y: 0 };
  var inertTargets = Array.prototype.slice.call(document.querySelectorAll('.hero, main, .footer'));

  /* ---------- transform helpers ---------- */
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function geometry() {
    var cs = getComputedStyle(stage);
    var w = stage.clientWidth;
    var h = stage.clientHeight;
    var padTop = parseFloat(cs.paddingTop) || 0;
    var padBottom = parseFloat(cs.paddingBottom) || 0;
    return { w: w, h: h, cy0: padTop + (h - padTop - padBottom) / 2 };
  }

  function apply() {
    var g = geometry();
    var iw = img.offsetWidth * scale;
    var ih = img.offsetHeight * scale;
    // keep the picture covering the screen once it is larger than the screen
    var minX = iw > g.w ? -(iw - g.w) / 2 : 0;
    var maxX = iw > g.w ? (iw - g.w) / 2 : 0;
    var minY = ih > g.h ? g.h - g.cy0 - ih / 2 : 0;
    var maxY = ih > g.h ? ih / 2 - g.cy0 : 0;
    tx = clamp(tx, minX, maxX);
    ty = clamp(ty, minY, maxY);
    img.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + scale + ')';
    stage.style.cursor = scale > 1 ? '' : 'default';
  }

  function animated(fn) {
    img.style.transition = 'transform .2s ease';
    fn();
    window.setTimeout(function () { img.style.transition = ''; }, 230);
  }

  // zoom to newScale keeping the point (clientX, clientY) fixed on screen
  function zoomAt(newScale, clientX, clientY) {
    var ns = clamp(newScale, MIN_SCALE, MAX_SCALE);
    var r = stage.getBoundingClientRect();
    var g = geometry();
    var px = clientX - (r.left + g.w / 2 + tx);
    var py = clientY - (r.top + g.cy0 + ty);
    tx += px * (1 - ns / scale);
    ty += py * (1 - ns / scale);
    scale = ns;
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  }

  function centerPoint() {
    var r = stage.getBoundingClientRect();
    var g = geometry();
    return { x: r.left + g.w / 2 + tx, y: r.top + g.cy0 + ty };
  }

  function resetView(withAnimation) {
    var run = function () { scale = 1; tx = 0; ty = 0; apply(); };
    if (withAnimation) animated(run); else run();
  }

  /* ---------- open / close ---------- */
  function show(i) {
    index = (i + thumbs.length) % thumbs.length;
    var thumb = thumbs[index].querySelector('img');
    img.alt = thumb.alt;
    img.src = thumb.currentSrc || thumb.src;   // the full original file – never a resized copy
    counter.textContent = (index + 1) + ' / ' + thumbs.length;
    resetView(false);
  }

  function open(i, openerEl) {
    if (isOpen) return;
    isOpen = true;
    opener = openerEl || null;
    show(i);
    lb.hidden = false;
    document.body.classList.add('lb-open');
    inertTargets.forEach(function (el) { el.setAttribute('inert', ''); });
    try { history.pushState({ gedoLb: true }, ''); } catch (e) { /* ignore */ }
    lb.querySelector('[data-act="close"]').focus();
    apply();
  }

  function close(fromPopState) {
    if (!isOpen) return;
    isOpen = false;
    pointers.clear();
    drag = pinch = null;
    lb.hidden = true;
    document.body.classList.remove('lb-open');
    inertTargets.forEach(function (el) { el.removeAttribute('inert'); });
    if (opener) opener.focus({ preventScroll: true });
    if (!fromPopState && history.state && history.state.gedoLb) history.back();
  }

  /* ---------- events ---------- */
  thumbs.forEach(function (btn, i) {
    btn.addEventListener('click', function () { open(i, btn); });
  });

  window.addEventListener('popstate', function () { if (isOpen) close(true); });
  window.addEventListener('resize', function () { if (isOpen) apply(); });
  img.addEventListener('load', function () { if (isOpen) apply(); });

  lb.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    var c = centerPoint();
    if (act === 'close') close(false);
    else if (act === 'in') animated(function () { zoomAt(scale * 1.5, c.x, c.y); });
    else if (act === 'out') animated(function () { zoomAt(scale / 1.5, c.x, c.y); });
    else if (act === 'reset') resetView(true);
    else if (act === 'next') show(index + 1);
    else if (act === 'prev') show(index - 1);
  });

  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    var factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002));
    zoomAt(scale * factor, e.clientX, e.clientY);
  }, { passive: false });

  function pointerDistance() {
    var p = Array.from(pointers.values());
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  }
  function pointerMid() {
    var p = Array.from(pointers.values());
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
  }

  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      var mid = pointerMid();
      pinch = { dist: pointerDistance(), scale: scale, mid: mid };
      drag = null;
    } else if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty, time: Date.now(), moved: false, onImage: e.target === img };
    }
    if (scale > 1) stage.classList.add('is-panning');
  });

  stage.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size >= 2) {
      var mid = pointerMid();
      zoomAt(pinch.scale * (pointerDistance() / pinch.dist), mid.x, mid.y);
      tx += mid.x - pinch.mid.x;
      ty += mid.y - pinch.mid.y;
      pinch.mid = mid;
      apply();
      if (drag) drag.moved = true;
    } else if (drag) {
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) drag.moved = true;
      if (scale > 1) {
        tx = drag.tx + dx;
        ty = drag.ty + dy;
        apply();
      }
    }
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    var finished = drag;

    if (pinch && pointers.size < 2) {
      pinch = null;
      if (scale < 1.02) resetView(false);
      var rest = Array.from(pointers.values())[0];
      drag = rest ? { x: rest.x, y: rest.y, tx: tx, ty: ty, time: Date.now(), moved: true, onImage: true } : null;
    }
    if (pointers.size === 0) {
      stage.classList.remove('is-panning');
      drag = null;
      if (e.type === 'pointerup' && finished && !finished.moved && Date.now() - finished.time < 350) {
        handleTap(e, finished);
      }
    }
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);

  function handleTap(e, info) {
    var now = Date.now();
    var isDouble = now - lastTap.time < 320 &&
      Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30;
    if (isDouble) {
      lastTap.time = 0;
      animated(function () {
        if (scale > 1.05) resetView(false);
        else zoomAt(DOUBLE_TAP_SCALE, e.clientX, e.clientY);
      });
      return;
    }
    lastTap = { time: now, x: e.clientX, y: e.clientY };
    // a single tap on the dark area (not the picture) closes the viewer
    if (!info.onImage && scale === 1) close(false);
  }

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    var c = centerPoint();
    switch (e.key) {
      case 'Escape': close(false); break;
      case '+': case '=': animated(function () { zoomAt(scale * 1.5, c.x, c.y); }); break;
      case '-': case '_': animated(function () { zoomAt(scale / 1.5, c.x, c.y); }); break;
      case '0': resetView(true); break;
      case 'ArrowLeft':
        if (scale > 1) { tx += 80; apply(); } else show(index + 1);
        break;
      case 'ArrowRight':
        if (scale > 1) { tx -= 80; apply(); } else show(index - 1);
        break;
      case 'ArrowUp': if (scale > 1) { ty += 80; apply(); e.preventDefault(); } break;
      case 'ArrowDown': if (scale > 1) { ty -= 80; apply(); e.preventDefault(); } break;
      case 'Tab': trapFocus(e); break;
      default: return;
    }
  });

  function trapFocus(e) {
    var f = Array.prototype.slice.call(lb.querySelectorAll('button'));
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
})();
