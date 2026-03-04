/* ============================================
   TEAM SECTION — team-network.js  (v6)

   Key design decisions:
   • Canvas is position:absolute inside .team
     (not fixed) — so it's clipped to the panel
   • SVG lines use absolute coords relative to
     the team section's bounding rect
   • Cards always have opacity:1 (visible by
     default). JS adds .anim-ready then .visible
     for the entrance animation.
   • buildLines() called once after activate,
     and on resize/scroll — never in rAF loop
   ============================================ */

(function () {

  /* ─── Elements ───────────────────────────── */
  const teamEl  = document.getElementById('team');
  const pCanvas = document.getElementById('team-particle-canvas');
  const pCtx    = pCanvas.getContext('2d');
  const svg     = document.getElementById('team-svg');
  const hub     = document.getElementById('company-hub');
  const CARDS   = ['tc-0', 'tc-1', 'tc-2'];
  const NODES   = ['tc-node-0', 'tc-node-1', 'tc-node-2'];
  const LCOLS   = [
    { stroke: 'rgba(10,240,255,',  glow: '10,240,255' },
    { stroke: 'rgba(79,110,247,',  glow: '79,110,247' },
    { stroke: 'rgba(0,229,204,',   glow: '0,229,204'  },
  ];

  let pW, pH, particles = [], pActive = false, svgActive = false;
  let lines = [], dashOffset = 0;
  const mouse = { x: -9999, y: -9999 };
  const PCOLORS = ['#0af0ff','#4f6ef7','#00e5cc','#7ab8ff','#a0c4ff'];

  /* ─── Particle system ────────────────────── */
  function pResize() {
    pW = pCanvas.width  = teamEl.offsetWidth;
    pH = pCanvas.height = teamEl.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(rand) {
      this.x  = rand ? Math.random() * pW : (Math.random() * pW * 0.6 + pW * 0.2);
      this.y  = rand ? Math.random() * pH : (Math.random() * pH * 0.6 + pH * 0.2);
      this.r  = 1 + Math.random() * 2.2;
      this.color = PCOLORS[Math.floor(Math.random() * PCOLORS.length)];
      this.alpha = 0.28 + Math.random() * 0.5;
      const a = Math.random() * Math.PI * 2, s = 0.2 + Math.random() * 0.3;
      this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
      this.sx = 0; this.sy = 0;
      this.tp = Math.random() * Math.PI * 2;
      this.ts = 0.005 + Math.random() * 0.012;
    }
    update() {
      const dx = this.x - mouse.x, dy = this.y - mouse.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 110 && d > 0) {
        const f = (1 - d / 110) * 4.5;
        this.sx += dx / d * f; this.sy += dy / d * f;
      }
      this.sx *= 0.92; this.sy *= 0.92;
      this.x += this.vx + this.sx; this.y += this.vy + this.sy;
      if (this.x < 0 || this.x > pW) this.vx *= -1;
      if (this.y < 0 || this.y > pH) this.vy *= -1;
      this.x = Math.max(0, Math.min(pW, this.x));
      this.y = Math.max(0, Math.min(pH, this.y));
      this.tp += this.ts;
    }
    draw() {
      const a = this.alpha * (0.6 + 0.4 * Math.sin(this.tp));
      pCtx.save(); pCtx.globalAlpha = a;
      const g = pCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3);
      g.addColorStop(0, this.color); g.addColorStop(0.45, this.color + 'aa'); g.addColorStop(1, this.color + '00');
      pCtx.beginPath(); pCtx.arc(this.x, this.y, this.r * 3, 0, Math.PI * 2);
      pCtx.fillStyle = g; pCtx.fill();
      pCtx.beginPath(); pCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      pCtx.fillStyle = this.color; pCtx.fill();
      pCtx.restore();
    }
  }

  function drawPLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 115) {
          pCtx.save(); pCtx.globalAlpha = (1 - d / 115) * 0.13;
          const g = pCtx.createLinearGradient(a.x, a.y, b.x, b.y);
          g.addColorStop(0, a.color); g.addColorStop(1, b.color);
          pCtx.beginPath(); pCtx.moveTo(a.x, a.y); pCtx.lineTo(b.x, b.y);
          pCtx.strokeStyle = g; pCtx.lineWidth = 0.65; pCtx.stroke();
          pCtx.restore();
        }
      }
    }
  }

  function initParticles() {
    pResize();
    particles = [];
    for (let i = 0; i < 85; i++) particles.push(new Particle());
  }

  /* Mouse tracking relative to team section */
  teamEl.addEventListener('mousemove', e => {
    const r = teamEl.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top + teamEl.scrollTop;
  });
  teamEl.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  /* ─── SVG lines ──────────────────────────── */
  function buildLines() {
    if (!svgActive) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    lines = [];

    /* SVG is position:absolute inside .team.
       All coords are relative to .team's top-left,
       accounting for scrollTop. */
    const teamRect = teamEl.getBoundingClientRect();
    const scrollY  = teamEl.scrollTop;

    const hr = hub.getBoundingClientRect();
    const hx = hr.left + hr.width  / 2 - teamRect.left;
    const hy = hr.bottom - teamRect.top + scrollY;

    CARDS.forEach((id, i) => {
      const nodeEl = document.getElementById(NODES[i]);
      if (!nodeEl) return;

      const nr = nodeEl.getBoundingClientRect();
      const nx = nr.left + nr.width  / 2 - teamRect.left;
      const ny = nr.top  + nr.height / 2 - teamRect.top + scrollY;

      if (ny <= hy) return; // still animating in

      const col  = LCOLS[i];
      const midY = hy + (ny - hy) * 0.5;
      const d    = `M ${hx} ${hy} C ${hx} ${midY}, ${nx} ${midY}, ${nx} ${ny}`;

      /* Glow filter */
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const flt  = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      flt.setAttribute('id', `tg${i}`);
      flt.setAttribute('x', '-60%'); flt.setAttribute('y', '-60%');
      flt.setAttribute('width', '220%'); flt.setAttribute('height', '220%');
      const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      blur.setAttribute('stdDeviation', '3'); blur.setAttribute('result', 'cb');
      const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
      ['cb', 'SourceGraphic'].forEach(inp => {
        const n = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        n.setAttribute('in', inp); merge.appendChild(n);
      });
      flt.appendChild(blur); flt.appendChild(merge);
      defs.appendChild(flt); svg.appendChild(defs);

      /* Path */
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d); path.setAttribute('fill', 'none');
      path.setAttribute('stroke', `${col.stroke}0.22)`);
      path.setAttribute('stroke-width', '1.4');
      path.setAttribute('stroke-dasharray', '5 8');
      svg.appendChild(path);

      const len = path.getTotalLength();

      /* Glow halo */
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('r', '7'); glow.setAttribute('fill', `rgba(${col.glow},0.18)`);
      glow.setAttribute('filter', `url(#tg${i})`); svg.appendChild(glow);

      /* Core dot */
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '3'); dot.setAttribute('fill', `rgba(${col.glow},1)`);
      dot.setAttribute('filter', `url(#tg${i})`); svg.appendChild(dot);

      lines.push({ path, dot, glow, len, col, t: i * 0.33, spd: 0.002 + i * 0.0003 });
    });
  }

  /* Rebuild lines when team panel scrolls */
  teamEl.addEventListener('scroll', () => { if (svgActive) buildLines(); }, { passive: true });

  /* ─── Animation loop ─────────────────────── */
  function loop() {
    if (pActive) {
      pCtx.clearRect(0, 0, pW, pH);
      drawPLines();
      particles.forEach(p => { p.update(); p.draw(); });
    }

    if (svgActive && lines.length) {
      dashOffset -= 0.4;
      lines.forEach(ln => {
        ln.path.setAttribute('stroke-dashoffset', dashOffset);
        ln.t += ln.spd; if (ln.t > 1) ln.t = 0;
        const pt = ln.path.getPointAtLength(ln.t * ln.len);
        ln.dot.setAttribute('cx', pt.x);  ln.dot.setAttribute('cy', pt.y);
        ln.glow.setAttribute('cx', pt.x); ln.glow.setAttribute('cy', pt.y);
        const a = (0.45 + 0.55 * Math.sin(ln.t * Math.PI)).toFixed(2);
        ln.dot.setAttribute('fill', `rgba(${ln.col.glow},${a})`);
      });
    }

    requestAnimationFrame(loop);
  }

  /* Resize */
  let rTimer;
  window.addEventListener('resize', () => {
    clearTimeout(rTimer);
    rTimer = setTimeout(() => { pResize(); buildLines(); }, 150);
  });

  /* Start loop immediately */
  loop();

  /* ─── Public API ─────────────────────────── */
  window.teamNetwork = {
    activate() {
      /* Show canvas + svg */
      pCanvas.classList.add('active');
      svg.classList.add('active');
      pActive   = true;
      svgActive = true;
      initParticles();

      /* Card entrance: add anim-ready first, then .visible with stagger */
      CARDS.forEach((id, i) => {
        const c = document.getElementById(id);
        if (!c) return;
        c.classList.add('anim-ready');
        setTimeout(() => c.classList.add('visible'), 100 + i * 120);
      });

      /* Build SVG lines after panel finishes sliding in */
      setTimeout(buildLines, 1050);
    },

    deactivate() {
      pActive   = false;
      svgActive = false;
      pCanvas.classList.remove('active');
      svg.classList.remove('active');
      pCtx.clearRect(0, 0, pW, pH);

      /* Remove card animations so they show instantly on re-entry */
      CARDS.forEach(id => {
        const c = document.getElementById(id);
        if (c) { c.classList.remove('anim-ready', 'visible'); }
      });

      while (svg.firstChild) svg.removeChild(svg.firstChild);
      lines = [];
    },
  };

})();
