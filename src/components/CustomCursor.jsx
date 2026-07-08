import { useEffect, useRef, useState } from 'react';

/**
 * Professional Cursor
 * ─────────────────────────────────────────────────────
 * • Small sharp inner dot  — tracks cursor exactly
 * • Smooth lagging ring    — follows with lerp easing
 * • Hover state            — ring blends & shows label
 * • Click state            — quick scale press feedback
 * • Blend-mode: exclusion  — looks great on any bg
 */
export default function CustomCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  const mouse  = useRef({ x: -200, y: -200 });
  const ring   = useRef({ x: -200, y: -200 });
  const raf    = useRef(null);

  const [state, setState] = useState('default'); // 'default' | 'pointer' | 'text' | 'click'

  useEffect(() => {
    document.body.style.cursor = 'none';

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      // Detect element type
      const target = e.target;
      const isLink   = target.closest('a, button, [role="button"], [tabindex]');
      const isInput  = target.closest('input, textarea, select');

      if (isInput)      setState('text');
      else if (isLink)  setState('pointer');
      else              setState('default');

      // Dot moves instantly
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    const onDown = () => setState('click');
    const onUp   = (e) => {
      const target = e.target;
      const isLink  = target.closest('a, button, [role="button"], [tabindex]');
      const isInput = target.closest('input, textarea, select');
      if (isInput)     setState('text');
      else if (isLink) setState('pointer');
      else             setState('default');
    };

    document.addEventListener('mousemove',  onMove);
    document.addEventListener('mousedown',  onDown);
    document.addEventListener('mouseup',    onUp);

    // Lerp ring
    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.1;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.1;
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate(${ring.current.x}px, ${ring.current.y}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup',   onUp);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  /* ── State-driven ring sizes ── */
  const ringSize = state === 'pointer' ? 48
                 : state === 'click'   ? 20
                 : state === 'text'    ? 28
                 : 36;

  const dotSize  = state === 'click'   ? 4
                 : state === 'pointer' ? 0   // hidden — ring fills
                 : state === 'text'    ? 2
                 : 6;

  const ringBg   = state === 'pointer' ? 'rgba(99,102,241,0.12)'
                 : state === 'text'    ? 'rgba(99,102,241,0.06)'
                 : 'transparent';

  const ringBorder = state === 'pointer'
    ? '1.5px solid rgba(99,102,241,0.7)'
    : state === 'click'
    ? '1.5px solid rgba(99,102,241,0.9)'
    : state === 'text'
    ? '1px solid rgba(99,102,241,0.4)'
    : '1.5px solid rgba(99,102,241,0.55)';

  const ringBlur = state === 'pointer' ? '0px' : '0px';

  return (
    <>
      <style>{`
        *, *::before, *::after { cursor: none !important; }

        /* ── Outer ring ── */
        .pro-ring {
          position: fixed;
          top: 0; left: 0;
          border-radius: 50%;
          pointer-events: none;
          z-index: 999998;
          will-change: transform;
          mix-blend-mode: normal;
          transition:
            width            0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            height           0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            background       0.22s ease,
            border           0.22s ease,
            margin           0.22s ease;
        }

        /* ── Inner dot ── */
        .pro-dot {
          position: fixed;
          top: 0; left: 0;
          border-radius: 50%;
          pointer-events: none;
          z-index: 999999;
          will-change: transform;
          background: #6366f1;
          box-shadow: 0 0 0 1px rgba(99,102,241,0.2);
          transition:
            width  0.15s ease,
            height 0.15s ease,
            margin 0.15s ease,
            opacity 0.15s ease;
        }

        /* ── Text cursor bar ── */
        .pro-text-bar {
          position: fixed;
          top: 0; left: 0;
          pointer-events: none;
          z-index: 999999;
          will-change: transform;
          width: 2px;
          height: 20px;
          background: #6366f1;
          border-radius: 2px;
          margin-left: -1px;
          margin-top: -10px;
          animation: textBlink 1s ease-in-out infinite;
          transition: opacity 0.15s;
        }

        @keyframes textBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      {/* Lagging ring */}
      <div
        ref={ringRef}
        className="pro-ring"
        style={{
          width:        `${ringSize}px`,
          height:       `${ringSize}px`,
          marginLeft:   `${-ringSize / 2}px`,
          marginTop:    `${-ringSize / 2}px`,
          background:   ringBg,
          border:       ringBorder,
        }}
      />

      {/* Instant-tracking inner element */}
      {state === 'text' ? (
        /* Text cursor — blinking bar */
        <div
          ref={dotRef}
          className="pro-text-bar"
        />
      ) : (
        /* Normal / pointer / click — dot */
        <div
          ref={dotRef}
          className="pro-dot"
          style={{
            width:      `${dotSize}px`,
            height:     `${dotSize}px`,
            marginLeft: `${-dotSize / 2}px`,
            marginTop:  `${-dotSize / 2}px`,
            opacity:    state === 'pointer' ? 0 : 1,
          }}
        />
      )}
    </>
  );
}
