import { motion } from 'framer-motion';
import { RiCheckboxCircleLine, RiTimeLine, RiAlarmWarningLine, RiListCheck, RiArrowUpLine, RiAwardLine, RiBookOpenLine } from 'react-icons/ri';

const CARDS = [
  {
    key: 'total',
    label: 'Total Tasks',
    icon: RiListCheck,
    iconColor: '#6366f1',
    iconBg: 'rgba(99,102,241,0.14)',
    numColor: '#6366f1',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)',
    glow: 'rgba(99,102,241,0.15)',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: RiCheckboxCircleLine,
    iconColor: '#10b981',
    iconBg: 'rgba(16,185,129,0.14)',
    numColor: '#059669',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.04) 100%)',
    glow: 'rgba(16,185,129,0.15)',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: RiTimeLine,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.14)',
    numColor: '#d97706',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(217,119,6,0.04) 100%)',
    glow: 'rgba(245,158,11,0.15)',
  },
  {
    key: 'certificatesCount',
    label: 'Certificates',
    icon: RiAwardLine,
    iconColor: '#ec4899',
    iconBg: 'rgba(236,72,153,0.14)',
    numColor: '#ec4899',
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(219,39,119,0.04) 100%)',
    glow: 'rgba(236,72,153,0.15)',
  },
  {
    key: 'coursesCompleted',
    label: 'Courses Completed',
    icon: RiBookOpenLine,
    iconColor: '#38bdf8',
    iconBg: 'rgba(56,189,248,0.14)',
    numColor: '#38bdf8',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(3,105,161,0.04) 100%)',
    glow: 'rgba(56,189,248,0.15)',
  },
];

export default function Statistics({ stats }) {
  return (
    <div className="stats-grid">
      {CARDS.map(({ key, label, icon: Icon, iconColor, iconBg, numColor, gradient, glow }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.09, duration: 0.5, ease: 'easeOut' }}
          className="stat-card-enhanced"
          whileHover={{
            y: -6,
            transition: { duration: 0.18 },
          }}
          style={{ '--glow': glow, '--border': iconColor }}
        >
          {/* Glow border effect */}
          <div className="stat-card-glow-border" style={{ '--c': iconColor }} />

          {/* Top row: icon + trend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem', position: 'relative', zIndex: 1 }}>
            <div className="stat-icon-wrap" style={{ background: iconBg, boxShadow: `0 0 18px ${glow}` }}>
              <Icon style={{ fontSize: '1.6rem', color: iconColor }} />
            </div>
            <div className="stat-trend-badge" style={{ color: iconColor, background: iconBg }}>
              <RiArrowUpLine style={{ fontSize: '0.8rem' }} />
              Active
            </div>
          </div>

          {/* Number */}
          <motion.p
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 + 0.2, type: 'spring', stiffness: 200, damping: 14 }}
            className="stat-number"
            style={{ color: numColor, textShadow: `0 0 20px ${glow}` }}
          >
            {stats?.[key] ?? 0}
          </motion.p>

          {/* Label */}
          <p className="stat-label">{label}</p>
        </motion.div>
      ))}

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1200px) { .stats-grid { grid-template-columns: repeat(5, 1fr); } }

        .stat-card-enhanced {
          position: relative;
          padding: 1.5rem 1.625rem;
          cursor: default;
          border-radius: 0;
          overflow: hidden;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,0.1);
          border-top: 2px solid var(--border, #6366f1);
          box-shadow: 0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        html:not(.dark) .stat-card-enhanced {
          background: rgba(255,255,255,0.82);
          border-color: rgba(0,0,0,0.07);
          border-top-color: var(--border, #6366f1);
          box-shadow: 0 4px 18px rgba(99,102,241,0.08), 0 1px 3px rgba(0,0,0,0.06);
        }
        .stat-card-enhanced:hover {
          box-shadow:
            0 0 0 1px var(--border, #6366f1),
            0 8px 32px var(--glow, rgba(99,102,241,0.3)),
            0 2px 8px rgba(0,0,0,0.2);
        }

        /* Animated top-shine */
        .stat-card-glow-border {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--c), transparent);
          animation: statShine 3s ease-in-out infinite;
          opacity: 0.8;
        }
        @keyframes statShine {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }

        .stat-icon-wrap {
          width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          clip-path: polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%);
        }
        .stat-trend-badge {
          display: flex; align-items: center; gap: 0.2rem;
          font-size: 0.72rem; font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 0;
        }
        .stat-number {
          font-size: 2.75rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
          margin-bottom: 0.35rem;
          position: relative; z-index: 1;
        }
        .stat-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(148,163,184,0.85);
          letter-spacing: 0.03em;
          text-transform: uppercase;
          position: relative; z-index: 1;
        }
        html:not(.dark) .stat-label { color: #64748b; }
      `}</style>
    </div>
  );
}
