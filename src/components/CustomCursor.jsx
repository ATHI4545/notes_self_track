import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const dotRef   = useRef(null);
  const ringRef  = useRef(null);
  const burstRef = useRef(null);

  const pos    = useRef({ x: -200, y: -200 });
  const ring   = useRef({ x: -200, y: -200 });
  const raf    = useRef(null);

  const [isHover,   setIsHover]   = useState(false);
  const [isClick,   setIsClick]   = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    // Hide native cursor
    document.body.style.cursor = 'none';

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };

      // Detect if hovering over interactive element
      const target = e.target;
      const clickable = target.closest(
        'a, button, [role="button"], input, select, textarea, label, [tabindex]'
      );
      setIsPointer(!!clickable);

      // Move inner dot instantly
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    const onDown = () => {
      setIsClick(true);
      // Burst effect position
      if (burstRef.current) {
        burstRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
        burstRef.current.style.animation = 'none';
        // Force reflow
        void burstRef.current.offsetWidth;
        burstRef.current.style.animation = 'cursor-burst 0.4s ease-out forwards';
      }
    };
    const onUp = () => {
      setIsClick(false);
    };

    const onEnter  = () => setIsHover(true);
    const onLeave  = () => setIsHover(false);

    document.addEventListener('mousemove',  onMove);
    document.addEventListener('mousedown',  onDown);
    document.addEventListener('mouseup',    onUp);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mouseleave', onLeave);

    // Smooth trailing ring via RAF
    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('mousemove',  onMove);
      document.removeEventListener('mousedown',  onDown);
      document.removeEventListener('mouseup',    onUp);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const dotSize  = isClick ? 6 : isPointer ? 10 : 8;
  const ringSize = isPointer ? 44 : isClick ? 20 : 36;
  const dotColor = isPointer ? '#f59e0b' : '#6366f1';
  const ringBorder = isPointer
    ? '2px solid rgba(245,158,11,0.8)'
    : isClick
    ? '2px solid rgba(99,102,241,0.4)'
    : '1.5px solid rgba(99,102,241,0.55)';
  const ringBg = isPointer ? 'rgba(245,158,11,0.08)' : 'transparent';

  return (
    <>
      <style>{`
        * { cursor: none !important; }

        .cursor-dot,
        .cursor-ring,
        .cursor-burst {
          position: fixed;
          top: 0; left: 0;
          pointer-events: none;
          z-index: 999999;
          will-change: transform;
        }

        /* ── Inner dot ── */
        .cursor-dot {
          width: var(--dot-size);
          height: var(--dot-size);
          border-radius: 50%;
          background: var(--dot-color);
          box-shadow: 0 0 8px var(--dot-color), 0 0 20px var(--dot-color);
          margin-left: calc(var(--dot-size) / -2);
          margin-top: calc(var(--dot-size) / -2);
          transition: width 0.15s, height 0.15s, background 0.2s, box-shadow 0.2s;
        }

        /* ── Outer ring ── */
        .cursor-ring {
          width: var(--ring-size);
          height: var(--ring-size);
          border-radius: 50%;
          border: var(--ring-border);
          background: var(--ring-bg);
          margin-left: calc(var(--ring-size) / -2);
          margin-top: calc(var(--ring-size) / -2);
          transition: width 0.2s, height 0.2s, border 0.2s, background 0.2s;
          backdrop-filter: blur(0px);
        }

        /* ── Click burst ── */
        .cursor-burst {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          margin-left: -24px;
          margin-top: -24px;
          background: radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 70%);
          opacity: 0;
        }

        @keyframes cursor-burst {
          0%   { opacity: 1; transform: translate(var(--bx), var(--by)) scale(0.2); }
          60%  { opacity: 0.6; }
          100% { opacity: 0; transform: translate(var(--bx), var(--by)) scale(2.5); }
        }
      `}</style>

      {/* Inner glowing dot */}
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{
          '--dot-size': `${dotSize}px`,
          '--dot-color': dotColor,
        }}
      />

      {/* Trailing outer ring */}
      <div
        ref={ringRef}
        className="cursor-ring"
        style={{
          '--ring-size': `${ringSize}px`,
          '--ring-border': ringBorder,
          '--ring-bg': ringBg,
        }}
      />

      {/* Click burst */}
      <div ref={burstRef} className="cursor-burst" />
    </>
  );
}
