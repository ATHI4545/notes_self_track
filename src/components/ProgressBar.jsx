import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';
import { RiFireLine, RiCheckboxCircleLine, RiTimerLine } from 'react-icons/ri';

export default function ProgressBar({ completed, total, streak }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = total - completed;

  return (
    <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontWeight: '700', fontSize: '1.05rem', color: 'inherit', letterSpacing: '-0.01em' }}>
            Overall Progress
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            {completed} completed · {remaining} remaining
          </p>
        </div>
        {/* Streak badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.6rem 1.25rem', borderRadius: '999px',
          background: 'linear-gradient(135deg, rgba(251,146,60,0.2) 0%, rgba(239,68,68,0.15) 100%)',
          border: '1px solid rgba(251,146,60,0.3)',
        }}>
          <RiFireLine style={{ color: '#fb923c', fontSize: '1.3rem' }} />
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f97316', lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', display: 'block', lineHeight: 1.2 }}>day streak</span>
          </div>
        </div>
      </div>

      {/* Main content: circular + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Large circular progress */}
        <div style={{ width: '140px', height: '140px', flexShrink: 0, position: 'relative' }}>
          <CircularProgressbar
            value={pct}
            styles={buildStyles({
              pathColor: 'url(#progressGradient)',
              trailColor: 'rgba(99,102,241,0.12)',
              pathTransitionDuration: 1,
              strokeLinecap: 'round',
            })}
          />
          {/* Overlaid % text */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#6366f1', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {pct}%
            </span>
          </div>
          {/* Gradient definition */}
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '200px' }}>
          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Completion</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6366f1' }}>{pct}%</span>
            </div>
            <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 0 12px rgba(99,102,241,0.4)',
                }}
              />
            </div>
          </div>

          {/* Mini stat row */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem', borderRadius: '0.875rem',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
            }}>
              <RiCheckboxCircleLine style={{ color: '#10b981', fontSize: '1.3rem', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#059669', lineHeight: 1 }}>{completed}</p>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>Done</p>
              </div>
            </div>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem', borderRadius: '0.875rem',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
            }}>
              <RiTimerLine style={{ color: '#f59e0b', fontSize: '1.3rem', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#d97706', lineHeight: 1 }}>{remaining}</p>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>Left</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
