import { motion } from 'framer-motion';
import { DailyChart, WeeklyChart, CategoryChart } from '../components/Charts';
import { useTask } from '../context/TaskContext';
import { computeStats } from '../utils/helpers';

export default function Analytics() {
  const { tasks } = useTask();
  const stats = computeStats(tasks);

  const METRIC_CARDS = [
    { label: 'Total Tasks',     value: stats.total,     color: '#6366f1', bg: 'rgba(99,102,241,0.1)',   border: 'rgba(99,102,241,0.2)',   icon: '📋' },
    { label: 'Completion Rate', value: `${stats.pct}%`, color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.2)',   icon: '✅' },
    { label: 'Pending',         value: stats.pending,   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.2)',   icon: '⏳' },
    { label: 'Overdue',         value: stats.overdue,   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.2)',    icon: '🚨' },
  ];

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'inherit' }}>
          Analytics
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Your productivity insights at a glance
        </p>
      </motion.div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }} className="analytics-metrics-grid">
        {METRIC_CARDS.map(({ label, value, color, bg, border, icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card"
            style={{
              padding: '1.75rem',
              display: 'flex', alignItems: 'center', gap: '1.25rem',
              background: bg, borderWidth: '1px', borderStyle: 'solid', borderColor: border, cursor: 'default',
            }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <div style={{
              width: '60px', height: '60px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.2)', border: `1px solid ${border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', flexShrink: 0,
            }}>
              {icon}
            </div>
            <div>
              <p style={{ fontSize: '2.5rem', fontWeight: '800', color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {value}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: '600', marginTop: '0.25rem' }}>
                {label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gap: '1.5rem' }} className="analytics-charts-grid">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <DailyChart />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <WeeklyChart />
        </motion.div>
      </div>

      {/* Category chart full width */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <CategoryChart />
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="glass-card"
        style={{ padding: '2rem' }}
      >
        <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'inherit', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>
          Productivity Summary
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="analytics-summary-grid">
          {[
            { label: 'High Priority', value: tasks.filter(t => t.priority === 'High').length,  color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.15)' },
            { label: 'Total Completed', value: tasks.filter(t => t.completed).length,          color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
            { label: 'Archived Tasks', value: tasks.filter(t => t.archived).length,            color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ padding: '1.5rem', borderRadius: '1rem', textAlign: 'center', background: bg, border: `1px solid ${border}` }}>
              <p style={{ fontSize: '2.5rem', fontWeight: '800', color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: '600', marginTop: '0.5rem' }}>{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <style>{`
        @media (min-width: 1024px) {
          .analytics-metrics-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .analytics-charts-grid  { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .analytics-summary-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
