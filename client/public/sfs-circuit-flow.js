/**
 * SFS CIRCUIT FLOW - Animated Golden Circuit Background
 * Creates flowing golden circuits with pulsing nodes
 */

(function () {
  'use strict';

  const canvas = document.getElementById('sfs-circuit');
  if (!canvas) {
    console.warn('Circuit canvas not found. Add <canvas id="sfs-circuit"></canvas> to your HTML');
    return;
  }

  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Circuit nodes
  const nodes = [];
  const nodeCount = Math.floor((width * height) / 15000); // Responsive density
  const connections = [];

  // Colors (SFS Gold Palette)
  const colors = {
    primary: 'rgba(255, 215, 0, 0.6)',      // Flowing gold
    secondary: 'rgba(212, 175, 55, 0.4)',   // Muted gold
    glow: 'rgba(255, 215, 0, 0.8)',         // Bright pulse
    node: 'rgba(255, 215, 0, 0.9)',         // Node color
  };

  // Performance settings
  let animationId;
  let isVisible = true;

  // Node class
  class Node {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.5; // Slow drift
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.02 + Math.random() * 0.02;
    }

    update() {
      // Drift movement
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Keep in bounds
      this.x = Math.max(0, Math.min(width, this.x));
      this.y = Math.max(0, Math.min(height, this.y));

      // Pulse animation
      this.pulsePhase += this.pulseSpeed;
    }

    draw() {
      const pulse = Math.sin(this.pulsePhase);
      const glowSize = this.radius + pulse * 3;

      // Outer glow
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, glowSize
      );
      gradient.addColorStop(0, colors.glow);
      gradient.addColorStop(0.4, colors.primary);
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Core node
      ctx.fillStyle = colors.node;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Initialize nodes
  function initNodes() {
    nodes.length = 0;
    connections.length = 0;

    const count = Math.floor((width * height) / 15000);
    for (let i = 0; i < count; i++) {
      nodes.push(new Node());
    }
  }

  // Draw connection between two nodes
  function drawConnection(node1, node2, distance, maxDistance) {
    const opacity = 1 - (distance / maxDistance);
    const gradient = ctx.createLinearGradient(
      node1.x, node1.y,
      node2.x, node2.y
    );

    gradient.addColorStop(0, `rgba(255, 215, 0, ${opacity * 0.3})`);
    gradient.addColorStop(0.5, `rgba(212, 175, 55, ${opacity * 0.5})`);
    gradient.addColorStop(1, `rgba(255, 215, 0, ${opacity * 0.3})`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = opacity * 1.5;
    ctx.beginPath();
    ctx.moveTo(node1.x, node1.y);
    ctx.lineTo(node2.x, node2.y);
    ctx.stroke();

    // Draw flowing particles along connection
    if (Math.random() < 0.1) {
      const t = (Date.now() % 3000) / 3000;
      const x = node1.x + (node2.x - node1.x) * t;
      const y = node1.y + (node2.y - node1.y) * t;

      ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Animation loop
  function animate() {
    // Clear with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, width, height);

    // Update and draw nodes
    nodes.forEach(node => {
      node.update();
      node.draw();
    });

    // Draw connections
    const maxDistance = 150;
    connections.length = 0;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          drawConnection(nodes[i], nodes[j], distance, maxDistance);
        }
      }
    }

    if (isVisible) {
      animationId = requestAnimationFrame(animate);
    }
  }

  // Resize handler
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initNodes();
  }

  // Visibility handler (pause when tab hidden)
  function handleVisibilityChange() {
    if (document.hidden) {
      isVisible = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    } else {
      isVisible = true;
      animate();
    }
  }

  // Mouse interaction (optional - nodes react to cursor)
  let mouseX = 0;
  let mouseY = 0;

  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Push nodes away from cursor
    nodes.forEach(node => {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        const force = (100 - distance) / 100;
        node.vx += (dx / distance) * force * 0.5;
        node.vy += (dy / distance) * force * 0.5;
      }
    });
  }

  // Initialize
  resize();

  // Event listeners
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  canvas.addEventListener('mousemove', handleMouseMove);

  // Start animation
  animate();

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    canvas.removeEventListener('mousemove', handleMouseMove);
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });

  console.log('✨ SFS Circuit Flow initialized');
})();
