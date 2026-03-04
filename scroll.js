/* scroll.js — final clean version
   Pure CSS class-based transitions.
   No inline transforms, no rAF loops.
*/
(function () {

  const IDS      = ['hero', 'services', 'team'];
  const DURATION = 850;

  let cur         = 0;
  let busy        = false;

  /* ── Inject transition CSS once ── */
  var style = document.createElement('style');
  style.textContent = [
    '.sp-above  { transform: translateY(-100%) !important; }',
    '.sp-active { transform: translateY(0%)    !important; }',
    '.sp-below  { transform: translateY(100%)  !important; }',
    '.sp-trans  { transition: transform ' + DURATION + 'ms cubic-bezier(0.77,0,0.175,1) !important; }'
  ].join('\n');
  document.head.appendChild(style);

  function el(id)  { return document.getElementById(id); }
  function cls(id) { return el(id).classList; }

  /* Clear position classes */
  function clearPos(id) {
    cls(id).remove('sp-above', 'sp-active', 'sp-below', 'sp-trans');
  }

  /* ── Place all panels without animation ── */
  function init() {
    IDS.forEach(function(id, i) {
      clearPos(id);
      cls(id).add(i === 0 ? 'sp-active' : 'sp-below');
    });
    syncDots();
    onEnter(0);
  }

  /* ── Navigate to panel index ── */
  function goTo(next) {
    if (busy || next === cur)      return;
    if (next < 0 || next >= IDS.length) return;

    busy = true;
    var prev = cur;
    var down = next > prev;

    onLeave(prev);

    /* 1. Place incoming panel on the off-screen side (no transition) */
    clearPos(IDS[next]);
    cls(IDS[next]).add(down ? 'sp-below' : 'sp-above');

    /* 2. Force a reflow so browser registers the starting position */
    el(IDS[next]).getBoundingClientRect();

    /* 3. Enable transitions on both panels */
    cls(IDS[prev]).add('sp-trans');
    cls(IDS[next]).add('sp-trans');

    /* 4. Set target positions — transitions will fire */
    clearPos(IDS[prev]);  /* removes old position class but keeps sp-trans */
    cls(IDS[prev]).add('sp-trans', down ? 'sp-above' : 'sp-below');
    clearPos(IDS[next]);
    cls(IDS[next]).add('sp-trans', 'sp-active');

    /* 5. After transition ends, clean up */
    setTimeout(function() {
      clearPos(IDS[prev]);
      cls(IDS[prev]).add(down ? 'sp-above' : 'sp-below');  /* keep it hidden, no transition */

      cur  = next;
      busy = false;
      syncDots();
      onEnter(next);

      /* Reset scroll of panel we just left */
      el(IDS[prev]).scrollTop = 0;
    }, DURATION + 60);
  }

  /* ── Lifecycle ── */
  function onEnter(i) {
    var hint = el('scroll-hint');
    if (hint) hint.style.opacity = i === 0 ? '1' : '0';

    if (i === 1) {
      var cards = document.querySelectorAll('.svc-card');
      cards.forEach(function(c, idx) {
        setTimeout(function() { c.classList.add('visible'); }, idx * 90);
      });
    }
    if (i === 2 && window.teamNetwork) window.teamNetwork.activate();
  }

  function onLeave(i) {
    if (i === 1) {
      document.querySelectorAll('.svc-card').forEach(function(c) {
        c.classList.remove('visible');
      });
    }
    if (i === 2 && window.teamNetwork) window.teamNetwork.deactivate();
  }

  /* ── Sync nav dots ── */
  function syncDots() {
    document.querySelectorAll('.scroll-dot').forEach(function(d, i) {
      d.classList.toggle('active', i === cur);
    });
  }

  /* ── Can we leave the current panel? ── */
  function canLeave(goingDown) {
    var panel = el(IDS[cur]);
    if (!panel) return true;
    var overflow = panel.scrollHeight > panel.clientHeight + 4;
    if (!overflow) return true;
    if (goingDown) return (panel.scrollTop + panel.clientHeight) >= (panel.scrollHeight - 6);
    return panel.scrollTop <= 4;
  }

  /* ── Wheel ── */
  var wheelLock = false;
  window.addEventListener('wheel', function(e) {
    e.preventDefault();
    if (busy || wheelLock)         return;
    if (!canLeave(e.deltaY > 0))   return;
    wheelLock = true;
    setTimeout(function() { wheelLock = false; }, 700);
    goTo(e.deltaY > 0 ? cur + 1 : cur - 1);
  }, { passive: false });

  /* ── Keyboard ── */
  window.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(cur + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(cur - 1); }
  });

  /* ── Touch ── */
  var ty0 = null;
  window.addEventListener('touchstart', function(e) {
    ty0 = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', function(e) {
    if (ty0 === null) return;
    var dy = ty0 - e.changedTouches[0].clientY;
    ty0 = null;
    if (Math.abs(dy) < 40)       return;
    if (!canLeave(dy > 0))       return;
    goTo(dy > 0 ? cur + 1 : cur - 1);
  }, { passive: true });

  /* ── Dot clicks ── */
  document.querySelectorAll('.scroll-dot').forEach(function(d) {
    d.addEventListener('click', function() {
      goTo(parseInt(d.dataset.target, 10));
    });
  });

  /* ── Boot ── */
  init();

})();
