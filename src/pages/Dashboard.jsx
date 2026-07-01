import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { RiAddLine, RiArrowRightLine, RiSparklingLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import Statistics from '../components/Statistics';
import ProgressBar from '../components/ProgressBar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import CodingStats from '../components/CodingStats';
import { getGreeting, getDailyQuote, computeStats, isTodayTask } from '../utils/helpers';

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.3rem' }}>
      {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      {' · '}
      <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
        {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </p>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { tasks, streak } = useTask();
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const stats = computeStats(tasks);
  const todayTasks = tasks.filter(t => isTodayTask(t) && !t.archived).slice(0, 6);
  const quote = getDailyQuote();

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.025em', color: 'inherit', lineHeight: 1.2 }}>
            {getGreeting(profile.name)}
          </h1>
          <LiveClock />
        </div>
        <button
          onClick={() => { setEditTask(null); setShowForm(true); }}
          className="btn-primary"
          id="dashboard-add-task"
        >
          <RiAddLine style={{ fontSize: '1.1rem' }} /> New Task
        </button>
      </motion.div>

      {/* Stats grid */}
      <Statistics stats={stats} />

      {/* Progress bar */}
      <ProgressBar completed={stats.completed} total={stats.total} streak={streak} />

      {/* Daily Quote */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="glass-card"
        style={{
          padding: '1.5rem 1.75rem',
          borderLeft: '4px solid #6366f1',
          borderTopLeftRadius: '0', borderBottomLeftRadius: '0',
          borderTopRightRadius: '1.125rem', borderBottomRightRadius: '1.125rem',
          display: 'flex', gap: '1rem', alignItems: 'flex-start',
        }}
      >
        <RiSparklingLine style={{ color: '#6366f1', fontSize: '1.5rem', flexShrink: 0, marginTop: '0.15rem' }} />
        <div>
          <p style={{ fontSize: '1.05rem', fontWeight: '600', fontStyle: 'italic', color: 'inherit', lineHeight: 1.55 }}>
            "{quote.text}"
          </p>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.5rem', fontWeight: '500' }}>
            — {quote.author}
          </p>
        </div>
      </motion.div>

      {/* Coding Platforms Statistics */}
      <CodingStats />

      {/* Today's Tasks */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'inherit', letterSpacing: '-0.01em' }}>
            Today's Tasks
          </h2>
          <Link
            to="/tasks"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.85rem', color: '#6366f1', fontWeight: '600',
              textDecoration: 'none', transition: 'gap 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.gap = '0.5rem'}
            onMouseLeave={e => e.currentTarget.style.gap = '0.25rem'}
          >
            View all <RiArrowRightLine />
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <AnimatePresence>
            {todayTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card"
                style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}
              >
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '0.75rem' }}>🎯</span>
                <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.35rem' }}>No tasks due today!</p>
                <p style={{ fontSize: '0.85rem' }}>Add a task or check upcoming ones.</p>
              </motion.div>
            ) : todayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => { setEditTask(t); setShowForm(true); }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Task form */}
      <AnimatePresence>
        {showForm && (
          <TaskForm
            editTask={editTask}
            onClose={() => { setShowForm(false); setEditTask(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
