/* ============================================
   STACKED CARD SCROLL — scroll.js  (v2)
   3 panels: hero → services → team
   ============================================ */

(function () {

  const panels     = Array.from(document.querySelectorAll('.stack-panel'));
  const dots       = Array.from(document.querySelectorAll('.scroll-dot'));
  const scrollHint = document.getElementById('scroll-hint');
  const cards      = Array.from(document.querySelectorAll('.svc-card'));
  const TOTAL      = panels.length;

  let current     = 0;
  let isAnimating = false;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animatePanel(panel, fromY, toY, duration, onDone) {
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const raw   = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(raw);
      panel.style.transform = `translateY(${fromY + (toY - fromY) * eased}%)`;
      if (raw < 1) { requestAnimationFrame(step); }
      else { panel.style.transform = `translateY(${toY}%)`; if (onDone) onDone(); }
    }
    requestAnimationFrame(step);
  }

  function goTo(index) {
    if (isAnimating || index === current) return;
    if (index < 0 || index >= TOTAL)     return;

    isAnimating = true;
    const dir  = index > current ? 'down' : 'up';
    const from = panels[current];
    const to   = panels[index];
    const dur  = 900;

    onPanelLeave(current);

    if (dir === 'down') {
      animatePanel(from, 0, -100, dur);
      to.style.transform = 'translateY(100%)';
      animatePanel(to, 100, 0, dur, () => {
        current = index; isAnimating = false; updateDots(); onPanelEnter(current);
      });
    } else {
      if (current === 1) { from.scrollTop = 0; }
      animatePanel(from, 0, 100, dur);
      to.style.transform = 'translateY(-100%)';
      animatePanel(to, -100, 0, dur, () => {
        current = index; isAnimating = false; updateDots(); onPanelEnter(current);
      });
    }

    if (scrollHint) scrollHint.classList.toggle('hidden', index !== 0);
  }

  function onPanelEnter(idx) {
    if (idx === 1) cards.forEach((c, i) => setTimeout(() => c.classList.add('visible'), i * 80));
    if (idx === 2 && window.teamNetwork) window.teamNetwork.activate();
  }

  function onPanelLeave(idx) {
    if (idx === 1) cards.forEach(c => c.classList.remove('visible'));
    if (idx === 2 && window.teamNetwork) window.teamNetwork.deactivate();
  }

  function updateDots() {
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  /* Wheel */
  let wheelCooldown = false, wheelAccum = 0;
  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isAnimating || wheelCooldown) return;
    if (current === 1) {
      const svc = document.getElementById('services');
      if (svc) {
        if (e.deltaY > 0 && svc.scrollTop + svc.clientHeight < svc.scrollHeight - 2) return;
        if (e.deltaY < 0 && svc.scrollTop > 0) return;
      }
    }
    wheelAccum += Math.abs(e.deltaY);
    if (wheelAccum < 60) return;
    wheelAccum = 0;
    wheelCooldown = true;
    setTimeout(() => { wheelCooldown = false; }, 500);
    goTo(e.deltaY > 0 ? current + 1 : current - 1);
  }, { passive: false });

  /* Keyboard */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
  });

  /* Touch */
  let touchStartY = null, touchStartX = null;
  window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; touchStartX = e.touches[0].clientX; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    const deltaX = Math.abs(touchStartX - e.changedTouches[0].clientX);
    touchStartY = null; touchStartX = null;
    if (deltaX > Math.abs(deltaY) || Math.abs(deltaY) < 50) return;
    if (current === 1) {
      const svc = document.getElementById('services');
      if (svc) {
        if (deltaY > 0 && svc.scrollTop + svc.clientHeight < svc.scrollHeight - 2) return;
        if (deltaY < 0 && svc.scrollTop > 0) return;
      }
    }
    goTo(deltaY > 0 ? current + 1 : current - 1);
  }, { passive: true });

  /* Dot clicks */
  dots.forEach(dot => dot.addEventListener('click', () => goTo(parseInt(dot.dataset.target))));

  /* Init */
  panels.forEach((p, i) => { p.style.transform = i === 0 ? 'translateY(0%)' : 'translateY(100%)'; });
  onPanelEnter(0);

})();
