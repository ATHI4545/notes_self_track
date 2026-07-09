import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { RiAddLine, RiArrowRightLine, RiSparklingLine, RiFireLine, RiCompass3Line, RiDeleteBin6Line } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import Statistics from '../components/Statistics';
import ProgressBar from '../components/ProgressBar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { getGreeting, getDailyQuote, computeStats, isTodayTask } from '../utils/helpers';
import { db } from '../firebase/firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

// ── Live clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="db-clock">
      {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      {' · '}
      <span style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }}>
        {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </p>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { profile } = useAuth();
  const { tasks, streak } = useTask();
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;

    const q = query(collection(db, 'users', profile.uid, 'roadmaps'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const dbDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      let localDocs = [];
      try {
        localDocs = JSON.parse(localStorage.getItem('self_track_local_roadmaps') || '[]');
      } catch (err) {
        console.error(err);
      }

      const merged = [...dbDocs, ...localDocs].sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return (timeB || 0) - (timeA || 0);
      });

      setRoadmaps(merged);
      setLoadingRoadmaps(false);
    }, (err) => {
      console.warn('Firestore fetch failed, loading local storage roadmaps only:', err);
      let localDocs = [];
      try {
        localDocs = JSON.parse(localStorage.getItem('self_track_local_roadmaps') || '[]');
      } catch (localErr) {
        console.error(localErr);
      }
      setRoadmaps(localDocs);
      setLoadingRoadmaps(false);
    });
    return unsub;
  }, [profile?.uid]);

  const handleDeleteRoadmap = async (e, roadmapId) => {
    e.stopPropagation();
    if (roadmapId.startsWith('local-')) {
      try {
        const localRoadmaps = JSON.parse(localStorage.getItem('self_track_local_roadmaps') || '[]');
        const filtered = localRoadmaps.filter(rm => rm.id !== roadmapId);
        localStorage.setItem('self_track_local_roadmaps', JSON.stringify(filtered));
        setRoadmaps(prev => prev.filter(rm => rm.id !== roadmapId));
      } catch (err) {
        console.error('Failed to delete local roadmap:', err);
      }
    } else if (profile?.uid) {
      try {
        await deleteDoc(doc(db, 'users', profile.uid, 'roadmaps', roadmapId));
      } catch (err) {
        console.error('Failed to delete roadmap:', err);
      }
    }
  };

  const [certificatesCount, setCertificatesCount] = useState(0);

  useEffect(() => {
    if (!profile?.uid) return;
    const docRef = doc(db, 'users', profile.uid);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCertificatesCount(data.certificates?.length || 0);
      }
    }, (err) => {
      console.error('Failed to listen to user document for certificates:', err);
    });
    return unsub;
  }, [profile?.uid]);

  const completedRoadmapsCount = roadmaps.filter(rm => {
    const totalItems = (rm.phases?.reduce((acc, phase) => acc + (phase.topics?.length || 0) + (phase.projects?.length || 0), 0)) || 1;
    const completedCount = Object.keys(rm.completedItems || {}).filter(k => rm.completedItems[k] === true).length;
    const percentage = Math.round((completedCount / totalItems) * 100);
    return percentage === 100;
  }).length;

  const stats = {
    ...computeStats(tasks),
    certificatesCount,
    coursesCompleted: completedRoadmapsCount
  };
  const todayTasks = tasks.filter(t => isTodayTask(t) && !t.archived).slice(0, 6);
  const quote = getDailyQuote();

  return (
    <div className="page-container animate-fade-in db-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="db-hero"
      >
        <div>
          <h1 className="db-greeting">
            {getGreeting(profile.name)}
          </h1>
          <LiveClock />
        </div>
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { setEditTask(null); setShowForm(true); }}
          className="db-add-btn"
          id="dashboard-add-task"
        >
          <RiAddLine style={{ fontSize: '1.15rem' }} /> New Task
        </motion.button>
      </motion.div>

      {/* Streak banner */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="db-streak-banner"
        >
          <RiFireLine className="db-streak-icon" />
          <span className="db-streak-text">
            🔥 {streak}-day streak — keep it going!
          </span>
        </motion.div>
      )}

      {/* Stats grid */}
      <Statistics stats={stats} />

      {/* Progress bar */}
      <ProgressBar completed={stats.completed} total={stats.total} streak={streak} />

      {/* Daily Quote */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="db-quote-card"
      >
        <div className="db-quote-accent" />
        <RiSparklingLine className="db-quote-icon" />
        <div>
          <p className="db-quote-text">"{quote.text}"</p>
          <p className="db-quote-author">— {quote.author}</p>
        </div>
      </motion.div>

      {/* Ongoing AI Study Roadmaps */}
      <div>
        <div className="db-section-header">
          <h2 className="db-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RiCompass3Line style={{ color: '#a78bfa' }} /> Ongoing Study Roadmaps
          </h2>
          <Link to="/roadmap" className="db-view-all">
            Build New <RiArrowRightLine />
          </Link>
        </div>

        {loadingRoadmaps ? (
          <div className="db-empty-card" style={{ padding: '2rem' }}>
            <p className="db-empty-sub">Loading saved roadmaps...</p>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="db-empty-card" style={{ padding: '2rem' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🧭</span>
            <p className="db-empty-title">No ongoing roadmaps</p>
            <p className="db-empty-sub">Generate and save a study guide to track your progress.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {roadmaps.map(rm => {
              // Calculate completion percentage based on checked items
              const totalItems = (rm.phases?.reduce((acc, phase) => acc + (phase.topics?.length || 0) + (phase.projects?.length || 0), 0)) || 1;
              const completedCount = Object.keys(rm.completedItems || {}).filter(k => rm.completedItems[k] === true).length;
              const percentage = Math.round((completedCount / totalItems) * 100);

              return (
                <div
                  key={rm.id}
                  onClick={() => navigate('/roadmap', { state: { activeRoadmap: rm } })}
                  className="glass-card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: 0,
                    borderLeft: '4px solid #a78bfa',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.15s, box-shadow 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(167,139,250,0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.925rem', fontWeight: '800', lineHeight: 1.3, color: 'inherit' }}>
                      {rm.title}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteRoadmap(e, rm.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#94a3b8', transition: 'color 0.15s', fontSize: '1rem'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                      title="Remove from Dashboard"
                    >
                      <RiDeleteBin6Line />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '0.1rem 0.4rem' }}>
                      {rm.level}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', background: 'rgba(167,139,250,0.1)', color: '#a78bfa', padding: '0.1rem 0.4rem' }}>
                      {rm.duration}
                    </span>
                  </div>

                  {/* Progress indicators */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: '750', color: '#a78bfa', marginBottom: '0.35rem' }}>
                      <span>PROGRESS</span>
                      <span>{percentage}%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: 0, overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: 'linear-gradient(90deg, #a78bfa, #38bdf8)', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Today's Tasks */}
      <div>
        <div className="db-section-header">
          <h2 className="db-section-title">Today's Tasks</h2>
          <Link to="/tasks" className="db-view-all">
            View all <RiArrowRightLine />
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <AnimatePresence>
            {todayTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="db-empty-card"
              >
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '0.75rem' }}>🎯</span>
                <p className="db-empty-title">No tasks due today!</p>
                <p className="db-empty-sub">Add a task or check upcoming ones.</p>
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

      {/* ── Dashboard styles ── */}
      <style>{`
        /* ── Root wrapper — fills main-content area ── */
        .db-root {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
        }

        /* ── Animated background ── */
        .db-bg-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          /* Warm Obsidian & Amber Sunset gradient */
          background:
            radial-gradient(ellipse at 20% 10%, rgba(249, 115, 22, 0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 50%, rgba(234, 88, 12, 0.06) 0%, transparent 70%),
            linear-gradient(160deg, #0d0a08 0%, #17110c 45%, #2c1a0e 100%);
        }
        /* Light mode override */
        html:not(.dark) .db-bg-layer {
          background:
            radial-gradient(ellipse at 15% 10%, rgba(99,102,241,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 85%, rgba(139,92,246,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 55%, rgba(14,165,233,0.06) 0%, transparent 60%),
            linear-gradient(160deg, #f0eeff 0%, #ece8ff 45%, #f8f4ff 100%);
        }

        /* Floating glowing orbs */
        .db-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          animation: dbOrbFloat 10s ease-in-out infinite;
          pointer-events: none;
        }
        .db-orb-1 {
          width: 420px; height: 420px;
          top: -80px; left: -80px;
          background: radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%);
          animation-duration: 12s;
        }
        .db-orb-2 {
          width: 340px; height: 340px;
          bottom: 80px; right: 60px;
          background: radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%);
          animation-duration: 9s;
          animation-delay: 3s;
        }
        .db-orb-3 {
          width: 280px; height: 280px;
          top: 40%; left: 55%;
          background: radial-gradient(circle, rgba(14,165,233,0.14) 0%, transparent 70%);
          animation-duration: 14s;
          animation-delay: 6s;
        }
        @keyframes dbOrbFloat {
          0%,100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(30px, -20px) scale(1.06); }
          66%      { transform: translate(-20px, 25px) scale(0.95); }
        }

        /* Subtle dot-grid overlay */
        .db-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(rgba(167,139,250,0.2) 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.35;
        }
        html:not(.dark) .db-grid-overlay {
          background-image:
            radial-gradient(rgba(99,102,241,0.18) 1px, transparent 1px);
          opacity: 0.4;
        }

        /* ── Content sits above background ── */
        .db-content { position: relative; z-index: 1; }

        /* ── Hero row ── */
        .db-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        /* ── Gradient greeting ── */
        .db-greeting {
          font-size: 2.1rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.15;
          background: linear-gradient(90deg, #a78bfa 0%, #818cf8 40%, #38bdf8 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
        html:not(.dark) .db-greeting {
          background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #0ea5e9 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* ── Clock ── */
        .db-clock {
          font-size: 0.875rem;
          color: rgba(167,139,250,0.7);
          margin-top: 0.3rem;
        }
        html:not(.dark) .db-clock { color: #7c3aed; opacity: 0.75; }

        /* ── Add button ── */
        .db-add-btn {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.75rem 1.6rem;
          border: none; cursor: pointer;
          border-radius: 0;
          background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
          color: #fff;
          font-weight: 800; font-size: 0.9rem; font-family: inherit;
          letter-spacing: 0.02em;
          box-shadow: 4px 4px 0 0 rgba(99,102,241,0.45);
          white-space: nowrap;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .db-add-btn:hover {
          box-shadow: 6px 6px 0 0 rgba(99,102,241,0.55);
          transform: translate(-2px, -2px);
        }

        /* ── Streak banner ── */
        .db-streak-banner {
          display: inline-flex; align-items: center; gap: 0.75rem;
          padding: 0.65rem 1.25rem;
          background: linear-gradient(135deg, rgba(251,146,60,0.15), rgba(239,68,68,0.1));
          border: 1px solid rgba(251,146,60,0.35);
          border-radius: 0;
          box-shadow: 3px 3px 0 0 rgba(251,146,60,0.2);
        }
        .db-streak-icon { color: #fb923c; font-size: 1.4rem; }
        .db-streak-text {
          font-size: 0.9rem; font-weight: 700;
          background: linear-gradient(90deg, #fb923c, #f43f5e);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* ── Quote card ── */
        .db-quote-card {
          position: relative;
          display: flex; gap: 1rem; align-items: flex-start;
          padding: 1.5rem 1.75rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 0;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          overflow: hidden;
          box-shadow: 4px 4px 0 0 rgba(99,102,241,0.15);
        }
        html:not(.dark) .db-quote-card {
          background: rgba(255,255,255,0.7);
          border-color: rgba(99,102,241,0.2);
        }
        .db-quote-accent {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, #a78bfa 0%, #38bdf8 100%);
        }
        .db-quote-icon {
          color: #a78bfa;
          font-size: 1.5rem;
          flex-shrink: 0;
          margin-top: 0.1rem;
          filter: drop-shadow(0 0 6px rgba(167,139,250,0.5));
        }
        .db-quote-text {
          font-size: 1.05rem;
          font-weight: 600;
          font-style: italic;
          line-height: 1.6;
          background: linear-gradient(90deg, #c4b5fd, #e2e8f0);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        html:not(.dark) .db-quote-text {
          background: linear-gradient(90deg, #4f46e5, #1e293b);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .db-quote-author {
          font-size: 0.82rem;
          color: rgba(167,139,250,0.6);
          margin-top: 0.5rem;
          font-weight: 600;
        }
        html:not(.dark) .db-quote-author { color: #7c3aed; opacity: 0.7; }

        /* ── Section header ── */
        .db-section-header {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(167,139,250,0.15);
        }
        .db-section-title {
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          background: linear-gradient(90deg, #a78bfa, #818cf8);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        html:not(.dark) .db-section-title {
          background: linear-gradient(90deg, #4f46e5, #7c3aed);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .db-view-all {
          display: flex; align-items: center; gap: 0.3rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #a78bfa;
          text-decoration: none;
          padding: 0.3rem 0.7rem;
          border: 1px solid rgba(167,139,250,0.3);
          transition: all 0.15s;
          letter-spacing: 0.02em;
        }
        .db-view-all:hover {
          background: rgba(167,139,250,0.1);
          border-color: rgba(167,139,250,0.5);
          gap: 0.55rem;
        }
        html:not(.dark) .db-view-all { color: #6366f1; border-color: rgba(99,102,241,0.25); }
        html:not(.dark) .db-view-all:hover { background: rgba(99,102,241,0.07); border-color: #6366f1; }

        /* ── Empty state ── */
        .db-empty-card {
          padding: 3.5rem 1.5rem;
          text-align: center;
          background: rgba(99,102,241,0.04);
          border: 2px dashed rgba(167,139,250,0.25);
          border-radius: 0;
        }
        html:not(.dark) .db-empty-card {
          border-color: rgba(99,102,241,0.2);
          background: rgba(99,102,241,0.02);
        }
        .db-empty-title {
          font-weight: 700; font-size: 1rem;
          color: #a78bfa; margin-bottom: 0.35rem;
        }
        html:not(.dark) .db-empty-title { color: #4f46e5; }
        .db-empty-sub { font-size: 0.85rem; color: rgba(148,163,184,0.9); }
      `}</style>
    </div>
  );
}
