import React, { useEffect, useRef } from 'react';

/**
 * Interactive Anti-Gravity Canvas Component
 * Renders an interactive physics field of gravitons responding to cursor & shield states
 */
export default function AntiGravityCanvas({
  state = 'idle', // 'idle' | 'scanning' | 'safe' | 'suspicious' | 'critical'
  width = 320,
  height = 320,
  interactive = true,
  className = ''
}) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: width / 2, y: height / 2, active: false, clickWave: 0 });
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize Graviton Particles
    const PARTICLE_COUNT = 65;
    const particles = [];

    const getColors = () => {
      switch (state) {
        case 'critical':
          return ['#f43f5e', '#fb7185', '#e11d48', '#fda4af'];
        case 'suspicious':
          return ['#f59e0b', '#fbbf24', '#f97316', '#fed7aa'];
        case 'safe':
          return ['#10b981', '#34d399', '#06b6d4', '#6ee7b7'];
        case 'scanning':
          return ['#06b6d4', '#38bdf8', '#a855f7', '#6366f1'];
        default: // idle
          return ['#06b6d4', '#10b981', '#f59e0b', '#38bdf8'];
      }
    };

    let colors = getColors();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 25 + Math.random() * (width * 0.42);
      particles.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        baseRadius: radius,
        angle: angle,
        speed: (0.004 + Math.random() * 0.012) * (Math.random() > 0.5 ? 1 : -1),
        radialSpeed: 0.05 + Math.random() * 0.15,
        size: 1.2 + Math.random() * 2.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.25 + Math.random() * 0.7,
        pulseSpeed: 0.02 + Math.random() * 0.04,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    let shockwaveRadius = 0;
    let shockwaveOpacity = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      colors = getColors();

      // Draw Center Energy Halo
      const haloGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, width * 0.45);
      if (state === 'critical') {
        haloGrad.addColorStop(0, 'rgba(244, 63, 94, 0.22)');
        haloGrad.addColorStop(0.5, 'rgba(225, 29, 72, 0.08)');
        haloGrad.addColorStop(1, 'transparent');
      } else if (state === 'suspicious') {
        haloGrad.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
        haloGrad.addColorStop(0.5, 'rgba(251, 146, 60, 0.08)');
        haloGrad.addColorStop(1, 'transparent');
      } else if (state === 'safe') {
        haloGrad.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        haloGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
        haloGrad.addColorStop(1, 'transparent');
      } else if (state === 'scanning') {
        haloGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        haloGrad.addColorStop(0.6, 'rgba(168, 85, 247, 0.12)');
        haloGrad.addColorStop(1, 'transparent');
      } else {
        haloGrad.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
        haloGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.06)');
        haloGrad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Click Shockwave expansion
      if (shockwaveOpacity > 0) {
        ctx.save();
        ctx.strokeStyle = colors[0];
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = shockwaveOpacity;
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        shockwaveRadius += 3.5;
        shockwaveOpacity -= 0.02;
      }

      // Update and Draw Particles
      particles.forEach((p, idx) => {
        // Orbit update
        const speedMultiplier = state === 'scanning' ? 2.8 : 1.0;
        p.angle += p.speed * speedMultiplier;
        p.pulsePhase += p.pulseSpeed;

        // Base target position
        let targetX = centerX + Math.cos(p.angle) * p.baseRadius;
        let targetY = centerY + Math.sin(p.angle) * p.baseRadius;

        // Interactive mouse gravity deflection
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - targetX;
          const dy = mouseRef.current.y - targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 90;

          if (dist < maxDist) {
            // Anti-gravity repulsion or light pull based on distance
            const force = (1 - dist / maxDist) * 24;
            targetX -= (dx / dist) * force;
            targetY -= (dy / dist) * force;
          }
        }

        // Smooth position interpolation
        p.x += (targetX - p.x) * 0.1;
        p.y += (targetY - p.y) * 0.1;

        // Render particle
        const currentSize = p.size * (0.8 + 0.4 * Math.sin(p.pulsePhase));
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = state === 'scanning' ? 10 : 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Connect nearby particles with luminous filament threads
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distSq = (p.x - p2.x) ** 2 + (p.y - p2.y) ** 2;
          const maxDistSq = 38 * 38;

          if (distSq < maxDistSq) {
            const filamentAlpha = (1 - Math.sqrt(distSq) / 38) * 0.25;
            ctx.save();
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = filamentAlpha;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, width, height]);

  // Pointer interactions
  const handlePointerMove = (e) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
    mouseRef.current.active = true;
  };

  const handlePointerLeave = () => {
    mouseRef.current.active = false;
  };

  const handleClick = () => {
    mouseRef.current.clickWave = 1;
  };

  return (
    <div
      className={`antigravity-canvas-wrapper ${className}`}
      style={{ width, height, position: 'relative', overflow: 'hidden' }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'block',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
