import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import {
  RiPlayLine, RiPauseLine, RiRefreshLine,
  RiCupLine, RiRestaurantLine, RiBriefcaseLine,
  RiFireLine, RiCheckboxCircleLine,
} from 'react-icons/ri';
import { toast } from 'react-toastify';

const MODES = [
  { key: 'focus', label: 'Focus',       seconds: 25 * 60, icon: RiBriefcaseLine, color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', glow: 'rgba(99,102,241,0.4)'  },
  { key: 'short', label: 'Short Break', seconds:  5 * 60, icon: RiCupLine,       color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.4)'  },
  { key: 'long',  label: 'Long Break',  seconds: 15 * 60, icon: RiRestaurantLine, color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.4)'  },
];

const STEPS = [
  { step: '1', text: 'Choose a task to work on',          color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
  { step: '2', text: 'Start a 25‑minute focus session',   color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
  { step: '3', text: 'Take a 5‑minute short break',       color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  { step: '4', text: 'After 4 sessions, take a long break',color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
];

export default function PomodoroPage() {
  const [mode, setMode]         = useState(MODES[0]);
  const [timeLeft, setTimeLeft] = useState(MODES[0].seconds);
  const [running, setRunning]   = useState(false);
  const [sessions, setSessions] = useState(0);

  const pct = Math.round((timeLeft / mode.seconds) * 100);

  useEffect(() => {
    setTimeLeft(mode.seconds);
    setRunning(false);
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          setRunning(false);
          if (mode.key === 'focus') {
            setSessions(s => s + 1);
            toast.success('🍅 Focus session complete! Great work!');
          } else {
            toast.info('☕ Break over! Ready for another session?');
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode.key]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const reset = () => { setRunning(false); setTimeLeft(mode.seconds); };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'inherit' }}>
          Pomodoro Timer
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Stay focused with the Pomodoro technique
        </p>
      </motion.div>

      {/* Two-column layout on desktop */}
      <div className="pomodoro-layout">
        {/* Timer card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-card"
          style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}
        >
          {/* Mode tabs */}
          <div style={{
            display: 'flex', gap: '0.375rem', padding: '0.375rem',
            borderRadius: '1rem', width: '100%',
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.1)',
          }}>
            {MODES.map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '0.65rem 0.5rem',
                  borderRadius: '0.75rem', border: 'none',
                  fontWeight: '600', fontSize: '0.83rem', fontFamily: 'inherit',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: mode.key === m.key ? m.gradient : 'transparent',
                  color: mode.key === m.key ? '#fff' : '#94a3b8',
                  boxShadow: mode.key === m.key ? `0 4px 14px ${m.glow}` : 'none',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Circular timer */}
          <motion.div
            key={mode.key}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ width: '240px', height: '240px', position: 'relative', flexShrink: 0 }}
          >
            {/* Progress ring — no text prop, we overlay our own */}
            <CircularProgressbar
              value={pct}
              styles={buildStyles({
                pathColor: mode.color,
                trailColor: 'rgba(148,163,184,0.12)',
                pathTransitionDuration: 0.6,
                strokeLinecap: 'round',
              })}
            />

            {/* Overlaid time text — full HTML control */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              pointerEvents: 'none',
            }}>
              <span style={{
                fontSize: '2.85rem',
                fontWeight: '800',
                color: mode.color,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                fontFamily: "'Inter', monospace",
              }}>
                {fmt(timeLeft)}
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                {running ? 'Running' : 'Paused'}
              </span>
            </div>

            {/* Glow pulse when running */}
            {running && (
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: mode.color, opacity: 0.06,
                  animation: 'blobPulse 2s ease-in-out infinite',
                }}
              />
            )}
          </motion.div>

          {/* Mode label + session count */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '1.15rem', fontWeight: '700', color: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              <mode.icon style={{ color: mode.color, fontSize: '1.3rem' }} />
              {mode.label}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              marginTop: '0.5rem', padding: '0.35rem 1rem', borderRadius: '999px',
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
            }}>
              <RiCheckboxCircleLine style={{ color: '#6366f1' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#6366f1' }}>
                {sessions} session{sessions !== 1 ? 's' : ''} completed
              </span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button
              onClick={reset}
              style={{
                width: '50px', height: '50px', borderRadius: '50%', border: 'none',
                background: 'rgba(99,102,241,0.08)', color: '#94a3b8',
                fontSize: '1.3rem', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
              title="Reset"
            >
              <RiRefreshLine />
            </button>

            <motion.button
              onClick={() => setRunning(r => !r)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              style={{
                width: '72px', height: '72px', borderRadius: '50%', border: 'none',
                background: mode.gradient, color: '#fff', fontSize: '1.75rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 8px 28px ${mode.glow}`,
              }}
              title={running ? 'Pause' : 'Start'}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={running ? 'pause' : 'play'}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {running ? <RiPauseLine /> : <RiPlayLine />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            {/* Spacer to mirror reset button */}
            <div style={{ width: '50px' }} />
          </div>

          <p style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
            Focus 25 min · Short break 5 min · Long break 15 min
          </p>
        </motion.div>

        {/* Right column: How it works + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card"
            style={{ padding: '2rem' }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'inherit', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
              How it works
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {STEPS.map(({ step, text, color, bg }) => (
                <div key={step} className="pomodoro-steps-item">
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: bg, border: `2px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '0.9rem', color, flexShrink: 0,
                  }}>
                    {step}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'inherit', fontWeight: '500', lineHeight: 1.4 }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Session stats card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 }}
            className="glass-card"
            style={{ padding: '2rem' }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'inherit', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
              Today's Progress
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Sessions Done',  value: sessions,          color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  icon: '🍅' },
                { label: 'Focus Minutes',  value: sessions * 25,     color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: '⏱️' },
                { label: 'Current Mode',   value: mode.label,        color: mode.color, bg: `${mode.color}18`,     icon: '🎯' },
                { label: 'Status',         value: running ? 'Active' : 'Paused', color: running ? '#10b981' : '#f59e0b', bg: running ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', icon: running ? '🟢' : '⏸️' },
              ].map(({ label, value, color, bg, icon }) => (
                <div
                  key={label}
                  style={{
                    padding: '1.25rem', borderRadius: '0.875rem',
                    background: bg, border: `1px solid ${color}25`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{icon}</div>
                  <p style={{ fontSize: '1.25rem', fontWeight: '800', color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {value}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', marginTop: '0.3rem' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
