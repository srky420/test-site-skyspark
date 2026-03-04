/* ============================================
   IT SERVICES HERO BANNER — particles.js
   Particle system with mouse-scatter effect
   ============================================ */

(function () {
  const canvas  = document.getElementById('particle-canvas');
  const ctx     = canvas.getContext('2d');

  // ── CONFIG ──────────────────────────────────
  const CONFIG = {
    count:           130,        // total particles
    baseSpeed:       0.35,       // normal drift speed
    minRadius:       1,
    maxRadius:       3.2,
    connectDistance: 130,        // max px to draw a line
    scatterRadius:   120,        // mouse repulsion zone (px)
    scatterForce:    5.5,        // push strength
    returnSpeed:     0.045,      // how fast they drift back
    colors: [
      '#0af0ff',   // cyber cyan
      '#4f6ef7',   // electric indigo
      '#00e5cc',   // neon teal
      '#7ab8ff',   // sky blue
      '#a0c4ff',   // pale blue
    ],
  };

  // ── STATE ───────────────────────────────────
  let W, H, particles = [];
  const mouse = { x: -9999, y: -9999 };

  // ── RESIZE ──────────────────────────────────
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', () => { resize(); init(); });
  resize();

  // ── PARTICLE CLASS ───────────────────────────
  class Particle {
    constructor() { this.reset(true); }

    reset(random = false) {
      this.x  = random ? Math.random() * W : (Math.random() * W * 0.6 + W * 0.2);
      this.y  = random ? Math.random() * H : (Math.random() * H * 0.6 + H * 0.2);
      this.ox = this.x;   // "origin" — where it wants to return
      this.oy = this.y;
      this.r  = CONFIG.minRadius + Math.random() * (CONFIG.maxRadius - CONFIG.minRadius);
      this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.alpha = 0.3 + Math.random() * 0.6;

      // drift velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = CONFIG.baseSpeed * (0.4 + Math.random() * 0.8);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;

      // scatter velocity (separate, decays)
      this.sx = 0;
      this.sy = 0;

      // subtle twinkle
      this.twinkleSpeed = 0.005 + Math.random() * 0.015;
      this.twinklePhase = Math.random() * Math.PI * 2;
    }

    update(t) {
      // ── Mouse repulsion ──
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.scatterRadius && dist > 0) {
        const force = (1 - dist / CONFIG.scatterRadius) * CONFIG.scatterForce;
        this.sx += (dx / dist) * force;
        this.sy += (dy / dist) * force;
      }

      // ── Decay scatter velocity ──
      this.sx *= 0.92;
      this.sy *= 0.92;

      // ── Drift + scatter ──
      this.x += this.vx + this.sx;
      this.y += this.vy + this.sy;

      // ── Gentle return to original area (soft boundaries) ──
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;

      // clamp to canvas
      this.x = Math.max(0, Math.min(W, this.x));
      this.y = Math.max(0, Math.min(H, this.y));

      // ── Twinkle ──
      this.twinklePhase += this.twinkleSpeed;
      this.currentAlpha = this.alpha * (0.6 + 0.4 * Math.sin(this.twinklePhase));
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.currentAlpha;

      // glow
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3.5);
      grad.addColorStop(0,   this.color);
      grad.addColorStop(0.4, this.color + 'aa');
      grad.addColorStop(1,   this.color + '00');

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // solid core
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      ctx.restore();
    }
  }

  // ── INIT ─────────────────────────────────────
  function init() {
    particles = [];
    for (let i = 0; i < CONFIG.count; i++) {
      particles.push(new Particle());
    }
  }

  // ── DRAW CONNECTIONS ──────────────────────────
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectDistance) {
          const alpha = (1 - dist / CONFIG.connectDistance) * 0.18;

          // pick a blended color between the two particles
          ctx.save();
          ctx.globalAlpha = alpha;

          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, a.color);
          grad.addColorStop(1, b.color);

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.7;
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // ── MOUSE CURSOR GLOW ─────────────────────────
  function drawMouseGlow() {
    if (mouse.x < 0 || mouse.x > W) return;
    const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, CONFIG.scatterRadius);
    grad.addColorStop(0,   'rgba(10,240,255,0.06)');
    grad.addColorStop(0.5, 'rgba(79,110,247,0.03)');
    grad.addColorStop(1,   'rgba(10,240,255,0)');

    ctx.save();
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, CONFIG.scatterRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  // ── ANIMATION LOOP ────────────────────────────
  let t = 0;
  function loop() {
    ctx.clearRect(0, 0, W, H);

    drawMouseGlow();
    drawConnections();
    particles.forEach(p => { p.update(t); p.draw(); });

    t++;
    requestAnimationFrame(loop);
  }

  // ── MOUSE EVENTS ─────────────────────────────
  const hero = document.getElementById('hero');

  hero.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  hero.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // ── Touch support ─────────────────────────────
  hero.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - rect.left;
    mouse.y = e.touches[0].clientY - rect.top;
  }, { passive: false });

  hero.addEventListener('touchend', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // ── START ─────────────────────────────────────
  init();
  loop();
})();
