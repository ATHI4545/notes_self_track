import { useEffect, useRef, useCallback } from 'react';

// ── Sparkle Particle Trail + Neon Crosshair Cursor ───────────────────────────
export default function CustomCursor() {
  const crossRef   = useRef(null);
  const canvasRef  = useRef(null);
  const particles  = useRef([]);
  const mouse      = useRef({ x: -300, y: -300 });
  const smooth     = useRef({ x: -300, y: -300 });
  const raf        = useRef(null);
  const isPointer  = useRef(false);
  const isClicking = useRef(false);

  // Spawn a sparkle particle at (x, y)
  const spawnParticle = useCallback((x, y) => {
    const hues = [260, 280, 45, 200, 330]; // purple, violet, gold, cyan, pink
    const hue  = hues[Math.floor(Math.random() * hues.length)];
    particles.current.push({
      x, y,
      vx: (Math.random() - 0.5) * 2.2,
      vy: (Math.random() - 0.5) * 2.2 - 0.8,
      size:  Math.random() * 4 + 2,
      alpha: 1,
      hue,
      shape: Math.random() > 0.5 ? 'star' : 'circle',
    });
    // Cap particles
    if (particles.current.length > 80) particles.current.shift();
  }, []);

  // Draw a star shape on canvas
  const drawStar = (ctx, x, y, r, alpha, hue) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.fillStyle = `hsl(${hue}, 100%, 72%)`;
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = ((i * 4) / 5) * Math.PI;
      const a2 = ((i * 4 + 2) / 5) * Math.PI;
      if (i === 0) ctx.moveTo(Math.cos(a1) * r, Math.sin(a1) * r);
      else ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
      ctx.lineTo(Math.cos(a2) * (r * 0.4), Math.sin(a2) * (r * 0.4));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    // Hide native cursor
    document.body.style.cursor = 'none';

    // Canvas covers full window
    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let lastSpawn = 0;

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      // Spawn trail particles every 30ms
      const now = Date.now();
      if (now - lastSpawn > 28) {
        spawnParticle(e.clientX, e.clientY);
        lastSpawn = now;
      }

      // Detect clickable
      const t = e.target.closest('a, button, [role="button"], input, select, textarea, label, [tabindex]');
      isPointer.current = !!t;
    };

    const onDown = (e) => {
      isClicking.current = true;
      // Burst 10 particles on click
      for (let i = 0; i < 10; i++) spawnParticle(e.clientX, e.clientY);
    };
    const onUp = () => { isClicking.current = false; };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup',   onUp);

    // Animation loop
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth crosshair follow
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.18;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.18;

      // ── Draw particles ──
      particles.current = particles.current.filter(p => p.alpha > 0.02);
      for (const p of particles.current) {
        if (p.shape === 'star') {
          drawStar(ctx, p.x, p.y, p.size, p.alpha, p.hue);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${p.hue}, 100%, 72%)`;
          ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        }
        p.x     += p.vx;
        p.y     += p.vy;
        p.vy    += 0.04; // slight gravity
        p.alpha -= 0.028;
        p.size  *= 0.97;
      }

      // ── Draw crosshair ──
      const cx = smooth.current.x;
      const cy = smooth.current.y;
      const hover = isPointer.current;
      const clicking = isClicking.current;

      const lineLen  = hover ? 14 : 10;
      const gap      = hover ? 7  : 5;
      const color1   = hover ? '#f59e0b' : '#a78bfa';
      const color2   = hover ? '#f97316' : '#6366f1';
      const lineW    = hover ? 2.2 : 1.8;

      // Outer pulsing ring (subtle)
      const pulse = Math.sin(frame * 0.08) * 0.3 + 0.7;
      ctx.save();
      ctx.globalAlpha = 0.35 * pulse;
      ctx.strokeStyle = color1;
      ctx.lineWidth   = 1;
      ctx.shadowColor = color1;
      ctx.shadowBlur  = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, hover ? 22 : 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Inner solid ring
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = color2;
      ctx.lineWidth   = lineW;
      ctx.shadowColor = color2;
      ctx.shadowBlur  = 14;
      ctx.beginPath();
      ctx.arc(cx, cy, hover ? 12 : 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Crosshair lines — top, bottom, left, right with gap
      const arms = [
        [cx, cy - gap, cx, cy - gap - lineLen],
        [cx, cy + gap, cx, cy + gap + lineLen],
        [cx - gap, cy, cx - gap - lineLen, cy],
        [cx + gap, cy, cx + gap + lineLen, cy],
      ];
      const grad = ctx.createLinearGradient(cx - lineLen, cy, cx + lineLen, cy);
      grad.addColorStop(0, color1);
      grad.addColorStop(1, color2);

      for (const [x1, y1, x2, y2] of arms) {
        ctx.save();
        ctx.globalAlpha = clicking ? 1 : 0.92;
        ctx.strokeStyle = color1;
        ctx.lineWidth   = lineW + (clicking ? 1 : 0);
        ctx.shadowColor = color1;
        ctx.shadowBlur  = clicking ? 22 : 16;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      }

      // Center dot
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle   = hover ? '#fbbf24' : '#c4b5fd';
      ctx.shadowColor = hover ? '#f59e0b' : '#8b5cf6';
      ctx.shadowBlur  = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, hover ? 3 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);

    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup',   onUp);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf.current);
    };
  }, [spawnParticle]);

  return (
    <>
      <style>{`
        * { cursor: none !important; }
      `}</style>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 999999,
        }}
      />
    </>
  );
}
