/* ============================================
   TEAM SECTION — team-network.js  (v3)
   Draws animated SVG lines from the company
   hub down to each of the three member cards.
   Uses a <path> per line with a glowing
   animated dot travelling along it.
   ============================================ */

(function () {

  const svg   = document.getElementById('team-svg');
  const hub   = document.getElementById('company-hub');
  const inner = document.querySelector('.team-inner');

  const CARD_IDS = ['tc-0', 'tc-1', 'tc-2'];
  const NODE_IDS = ['tc-node-0', 'tc-node-1', 'tc-node-2'];

  const COLORS = [
    { stroke: 'rgba(10,240,255,',  glow: '10,240,255'  },  // cyan
    { stroke: 'rgba(79,110,247,',  glow: '79,110,247'  },  // indigo
    { stroke: 'rgba(0,229,204,',   glow: '0,229,204'   },  // teal
  ];

  let lines   = [];   // { path, packet, dotEl, glowEl, length, color }
  let active  = false;
  let rafId   = null;

  /* ── Build SVG lines ──────────────────────── */
  function buildLines() {
    // clear old
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    lines = [];

    const svgRect = svg.getBoundingClientRect();

    // Hub anchor: bottom-centre of .company-hub
    const hr = hub.getBoundingClientRect();
    const hx = hr.left + hr.width  / 2 - svgRect.left;
    const hy = hr.bottom - svgRect.top;

    CARD_IDS.forEach((id, i) => {
      const card     = document.getElementById(id);
      const nodeEl   = document.getElementById(NODE_IDS[i]);
      if (!card || !nodeEl) return;

      const nr  = nodeEl.getBoundingClientRect();
      const nx  = nr.left + nr.width  / 2 - svgRect.left;
      const ny  = nr.top  + nr.height / 2 - svgRect.top;

      const col = COLORS[i];

      // Bezier: straight down from hub then curve to card node
      const midY = (hy + ny) / 2;
      const d    = `M ${hx} ${hy} C ${hx} ${midY}, ${nx} ${midY}, ${nx} ${ny}`;

      // ── Defs for glow filter (one per line) ──
      const defs   = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', `glow-${i}`);
      filter.setAttribute('x', '-50%'); filter.setAttribute('y', '-50%');
      filter.setAttribute('width', '200%'); filter.setAttribute('height', '200%');
      const feBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      feBlur.setAttribute('stdDeviation', '3');
      feBlur.setAttribute('result', 'coloredBlur');
      const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
      const n1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      n1.setAttribute('in', 'coloredBlur');
      const n2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      n2.setAttribute('in', 'SourceGraphic');
      feMerge.appendChild(n1); feMerge.appendChild(n2);
      filter.appendChild(feBlur); filter.appendChild(feMerge);
      defs.appendChild(filter);
      svg.appendChild(defs);

      // ── Base dashed path ──
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', `${col.stroke}0.25)`);
      path.setAttribute('stroke-width', '1.2');
      path.setAttribute('stroke-dasharray', '5 8');
      svg.appendChild(path);

      // Total path length for packet travel
      const length = path.getTotalLength();

      // ── Animated dot (packet) ──
      const glowEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glowEl.setAttribute('r', '6');
      glowEl.setAttribute('fill', `rgba(${col.glow},0.25)`);
      glowEl.setAttribute('filter', `url(#glow-${i})`);
      svg.appendChild(glowEl);

      const dotEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dotEl.setAttribute('r', '3');
      dotEl.setAttribute('fill', `rgba(${col.glow},1)`);
      dotEl.setAttribute('filter', `url(#glow-${i})`);
      svg.appendChild(dotEl);

      lines.push({
        path,
        dotEl,
        glowEl,
        length,
        color: col,
        t: i * 0.33,      // stagger start positions
        speed: 0.0018 + i * 0.0003,
      });
    });
  }

  /* ── Animate dash offset on base path ──────── */
  let dashOffset = 0;

  /* ── Main rAF loop ──────────────────────────── */
  function loop() {
    if (!active) { rafId = requestAnimationFrame(loop); return; }

    dashOffset -= 0.4;

    lines.forEach(line => {
      // Scroll dash along path
      line.path.setAttribute('stroke-dashoffset', dashOffset);

      // Move packet dot along bezier
      line.t += line.speed;
      if (line.t > 1) line.t = 0;

      const pt = line.path.getPointAtLength(line.t * line.length);
      line.dotEl.setAttribute('cx', pt.x);
      line.dotEl.setAttribute('cy', pt.y);
      line.glowEl.setAttribute('cx', pt.x);
      line.glowEl.setAttribute('cy', pt.y);

      // Pulse opacity based on position — brightest near endpoints
      const alpha = 0.5 + 0.5 * Math.sin(line.t * Math.PI);
      line.dotEl.setAttribute('fill', `rgba(${line.color.glow},${alpha.toFixed(2)})`);
    });

    rafId = requestAnimationFrame(loop);
  }

  /* ── Build + measure on resize ─────────────── */
  let resizeTimer = null;
  function rebuild() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildLines, 80);
  }
  window.addEventListener('resize', rebuild);

  loop();

  /* ── Exposed API for scroll.js ─────────────── */
  window.teamNetwork = {
    activate() {
      active = true;
      if (inner) inner.classList.add('visible');

      // Trigger card entrance stagger
      CARD_IDS.forEach((id, i) => {
        const card = document.getElementById(id);
        if (card) setTimeout(() => card.classList.add('visible'), 400 + i * 130);
      });

      // Measure after slide-in transition completes
      setTimeout(buildLines, 520);
    },
    deactivate() {
      active = false;
      if (inner) inner.classList.remove('visible');
      CARD_IDS.forEach(id => {
        const card = document.getElementById(id);
        if (card) card.classList.remove('visible');
      });
      // Clear SVG
      while (svg && svg.firstChild) svg.removeChild(svg.firstChild);
      lines = [];
    },
  };

})();
