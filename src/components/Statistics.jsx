import { motion } from 'framer-motion';
import { RiCheckboxCircleLine, RiTimeLine, RiAlarmWarningLine, RiListCheck, RiArrowUpLine } from 'react-icons/ri';

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
    key: 'overdue',
    label: 'Overdue',
    icon: RiAlarmWarningLine,
    iconColor: '#ef4444',
    iconBg: 'rgba(239,68,68,0.14)',
    numColor: '#dc2626',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(220,38,38,0.04) 100%)',
    glow: 'rgba(239,68,68,0.15)',
  },
];

export default function Statistics({ stats }) {
  return (
    <div className="stats-grid">
      {CARDS.map(({ key, label, icon: Icon, iconColor, iconBg, numColor, gradient, glow }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.09, duration: 0.45, ease: 'easeOut' }}
          className="stat-card-enhanced glass-card"
          style={{
            background: gradient,
          }}
          whileHover={{
            y: -4,
            boxShadow: `0 16px 48px ${glow}, 0 4px 16px rgba(0,0,0,0.08)`,
            transition: { duration: 0.2 },
          }}
        >
          {/* Top row: icon + trend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: iconBg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
              boxShadow: `0 4px 16px ${glow}`,
            }}>
              <Icon style={{ fontSize: '1.6rem', color: iconColor }} />
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.2rem',
              fontSize: '0.72rem', fontWeight: '700', color: iconColor,
              background: iconBg, padding: '0.25rem 0.6rem', borderRadius: '999px',
            }}>
              <RiArrowUpLine style={{ fontSize: '0.8rem' }} />
              Active
            </div>
          </div>

          {/* Number */}
          <motion.p
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 + 0.2, type: 'spring', stiffness: 180 }}
            style={{
              fontSize: '2.75rem',
              fontWeight: '800',
              color: numColor,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              marginBottom: '0.35rem',
            }}
          >
            {stats?.[key] ?? 0}
          </motion.p>

          {/* Label */}
          <p style={{
            fontSize: '0.85rem', fontWeight: '600',
            color: '#94a3b8', letterSpacing: '0.01em',
          }}>
            {label}
          </p>
        </motion.div>
      ))}

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (min-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .stat-card-enhanced {
          padding: 1.5rem 1.625rem;
          cursor: default;
          transition: box-shadow 0.2s ease;
          border-radius: 1.125rem;
        }
      `}</style>
    </div>
  );
}
