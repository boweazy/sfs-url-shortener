/* SmartFlow Systems — Gold Particle Background */
(function () {
  const CONFIG = {
    nodeCount: 45,
    connectionDistance: 160,
    nodeSpeed: 0.28,
    nodeRadius: 2.2,
    goldAlpha: 0.14,
    sparkleCount: 60,
    sparkleMaxRadius: 1.6,
    sparkleSpeed: 0.008,
    mobileBreakpoint: 768,
    pauseOnHide: true,
  };

  const canvas = document.createElement('canvas');
  canvas.id = 'sfs-bg-canvas';
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H, nodes, sparkles, raf;
  const mobile = () => window.innerWidth <= CONFIG.mobileBreakpoint;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    init();
  }

  function mkNode() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * CONFIG.nodeSpeed * 2,
      vy: (Math.random() - 0.5) * CONFIG.nodeSpeed * 2,
    };
  }

  function mkSparkle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * CONFIG.sparkleMaxRadius,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function init() {
    const div = mobile() ? 2 : 1;
    nodes = Array.from({ length: Math.floor(CONFIG.nodeCount / div) }, mkNode);
    sparkles = Array.from({ length: Math.floor(CONFIG.sparkleCount / div) }, mkSparkle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* connections */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectionDistance) {
          const alpha = CONFIG.goldAlpha * (1 - dist / CONFIG.connectionDistance);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,215,0,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    /* nodes */
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, CONFIG.nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,215,0,0.55)';
      ctx.fill();

      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    /* sparkles */
    sparkles.forEach((s) => {
      s.phase += CONFIG.sparkleSpeed;
      const alpha = (Math.sin(s.phase) + 1) / 2 * 0.45;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,215,0,${alpha})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  function start() { if (!raf) raf = requestAnimationFrame(draw); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  window.addEventListener('resize', resize);
  if (CONFIG.pauseOnHide) {
    document.addEventListener('visibilitychange', () =>
      document.hidden ? stop() : start()
    );
  }

  resize();
  start();
})();
