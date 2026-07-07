import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiCheckboxCircleLine, RiCheckboxBlankCircleLine, RiExternalLinkLine,
  RiCodeSSlashLine, RiTrophyLine, RiFireLine, RiTimeLine,
  RiSearchLine, RiFilterLine,
} from 'react-icons/ri';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import { recordStreakDay } from '../utils/helpers';

// ── Problem data ──────────────────────────────────────────────────────────────
const PROBLEMS = [
  // ── Easy ──
  {
    id: 'lc-two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    url: 'https://leetcode.com/problems/two-sum/description/',
    tags: ['Array', 'Hash Table'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'Easy',
    url: 'https://leetcode.com/problems/palindrome-number/',
    tags: ['Math'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-remove-element',
    title: 'Remove Element',
    difficulty: 'Easy',
    url: 'https://leetcode.com/problems/remove-element/',
    tags: ['Array', 'Two Pointers'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-search-insert-position',
    title: 'Search Insert Position',
    difficulty: 'Easy',
    url: 'https://leetcode.com/problems/search-insert-position/',
    tags: ['Array', 'Binary Search'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-remove-duplicates-sorted-list',
    title: 'Remove Duplicates from Sorted List',
    difficulty: 'Easy',
    url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-list/',
    tags: ['Linked List'],
    platform: 'LeetCode',
  },

  // ── Medium ──
  {
    id: 'lc-reverse-integer',
    title: 'Reverse Integer',
    difficulty: 'Medium',
    url: 'https://leetcode.com/problems/reverse-integer/',
    tags: ['Math'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-remove-nth-node',
    title: 'Remove Nth Node from End of List',
    difficulty: 'Medium',
    url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/',
    tags: ['Linked List', 'Two Pointers'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-divide-two-integers',
    title: 'Divide Two Integers',
    difficulty: 'Medium',
    url: 'https://leetcode.com/problems/divide-two-integers/',
    tags: ['Math', 'Bit Manipulation'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-rotate-image',
    title: 'Rotate Image',
    difficulty: 'Medium',
    url: 'https://leetcode.com/problems/rotate-image/',
    tags: ['Array', 'Matrix'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-rotate-array',
    title: 'Rotate Array',
    difficulty: 'Medium',
    url: 'https://leetcode.com/problems/rotate-array/',
    tags: ['Array', 'Two Pointers'],
    platform: 'LeetCode',
  },

  // ── Hard ──
  {
    id: 'lc-minimum-window-substring',
    title: 'Minimum Window Substring',
    difficulty: 'Hard',
    url: 'https://leetcode.com/problems/minimum-window-substring/',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-substring-with-concatenation',
    title: 'Substring with Concatenation of All Words',
    difficulty: 'Hard',
    url: 'https://leetcode.com/problems/substring-with-concatenation-of-all-words/',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-first-missing-positive',
    title: 'First Missing Positive',
    difficulty: 'Hard',
    url: 'https://leetcode.com/problems/first-missing-positive/',
    tags: ['Array', 'Hash Table'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-sliding-window-maximum',
    title: 'Sliding Window Maximum',
    difficulty: 'Hard',
    url: 'https://leetcode.com/problems/sliding-window-maximum/',
    tags: ['Array', 'Queue', 'Sliding Window', 'Monotonic Queue', 'Heap'],
    platform: 'LeetCode',
  },
  {
    id: 'lc-text-justification',
    title: 'Text Justification',
    difficulty: 'Hard',
    url: 'https://leetcode.com/problems/text-justification/',
    tags: ['String', 'Simulation'],
    platform: 'LeetCode',
  },
];

// ── Difficulty config ─────────────────────────────────────────────────────────
const DIFF_CONFIG = {
  Easy:   { color: '#00b8a3', bg: 'rgba(0,184,163,0.1)',   border: 'rgba(0,184,163,0.25)'   },
  Medium: { color: '#ffc01e', bg: 'rgba(255,192,30,0.1)', border: 'rgba(255,192,30,0.25)'  },
  Hard:   { color: '#ef4743', bg: 'rgba(239,71,67,0.1)',  border: 'rgba(239,71,67,0.25)'   },
};

// ── Firestore helpers ─────────────────────────────────────────────────────────
const getUserRef = () => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  return doc(db, 'users', auth.currentUser.uid);
};

async function loadCompleted() {
  try {
    const snap = await getDoc(getUserRef());
    if (snap.exists()) {
      const dbCompleted = snap.data().programmingProgress || [];
      localStorage.setItem('self_track_programming_progress', JSON.stringify(dbCompleted));
      return dbCompleted;
    }
  } catch (err) {
    console.warn('Firestore load failed, loading local fallback:', err);
  }
  try {
    return JSON.parse(localStorage.getItem('self_track_programming_progress') || '[]');
  } catch {
    return [];
  }
}

async function saveCompleted(completed) {
  let savedToCloud = false;
  try {
    await setDoc(getUserRef(), { programmingProgress: completed, updatedAt: new Date().toISOString() }, { merge: true });
    savedToCloud = true;
  } catch (err) {
    console.warn('Firestore save failed, caching locally:', err);
  }
  
  try {
    localStorage.setItem('self_track_programming_progress', JSON.stringify(completed));
  } catch (err) {
    console.error('Failed to save to local storage:', err);
  }
  
  if (!savedToCloud) {
    throw new Error('LocalFallback');
  }
}

// ── Problem row component ─────────────────────────────────────────────────────
function ProblemRow({ problem, index, completed, onToggle, sectionIndex }) {
  const cfg = DIFF_CONFIG[problem.difficulty];
  const isDone = completed.includes(problem.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sectionIndex * 0.04 + index * 0.05 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.875rem 1.125rem',
        borderRadius: '12px',
        border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : 'rgba(0,0,0,0.06)'}`,
        background: isDone ? 'rgba(16,185,129,0.04)' : 'transparent',
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
    >
      {/* Serial number */}
      <span style={{
        width: '24px', height: '24px', borderRadius: '6px',
        background: isDone ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.72rem', fontWeight: '700', flexShrink: 0,
        color: isDone ? '#10b981' : '#94a3b8',
      }}>
        {index + 1}
      </span>

      {/* Checkbox toggle */}
      <button
        onClick={() => onToggle(problem.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, display: 'flex', alignItems: 'center',
          color: isDone ? '#10b981' : '#cbd5e1',
          fontSize: '1.35rem', flexShrink: 0,
          transition: 'color 0.2s, transform 0.15s',
          transform: isDone ? 'scale(1.08)' : 'scale(1)',
        }}
        title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {isDone ? <RiCheckboxCircleLine /> : <RiCheckboxBlankCircleLine />}
      </button>

      {/* Problem title + link */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={problem.url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontWeight: '600', fontSize: '0.9rem',
            color: isDone ? '#94a3b8' : 'inherit',
            textDecoration: isDone ? 'line-through' : 'none',
            textDecorationColor: 'rgba(148,163,184,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => { if (!isDone) e.currentTarget.style.color = '#6366f1'; }}
          onMouseLeave={e => { if (!isDone) e.currentTarget.style.color = 'inherit'; }}
        >
          {problem.title}
          <RiExternalLinkLine style={{ fontSize: '0.78rem', opacity: 0.6 }} />
        </a>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          {problem.tags.map(tag => (
            <span key={tag} style={{
              fontSize: '0.65rem', fontWeight: '600', padding: '0.1rem 0.4rem',
              borderRadius: '20px', background: 'rgba(99,102,241,0.08)',
              color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)',
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Platform badge */}
      <span style={{
        fontSize: '0.65rem', fontWeight: '700', padding: '0.2rem 0.5rem',
        borderRadius: '6px', flexShrink: 0,
        background: 'rgba(255,161,22,0.08)', color: '#ffa116',
        border: '1px solid rgba(255,161,22,0.15)',
      }}>{problem.platform}</span>

      {/* Difficulty badge */}
      <span style={{
        fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.55rem',
        borderRadius: '6px', flexShrink: 0,
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      }}>{problem.difficulty}</span>

      {/* Done indicator */}
      {isDone && (
        <motion.span
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10b981', flexShrink: 0 }}
        >✓ Done</motion.span>
      )}
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProgrammingSheet() {
  const [completed,  setCompleted]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterDiff, setFilterDiff] = useState('All');

  // Load saved progress from Firestore on mount
  useEffect(() => {
    loadCompleted().then(data => {
      setCompleted(data);
      setLoading(false);
    });
  }, []);

  // Toggle a problem done/undone and save to DB
  const handleToggle = async (id) => {
    const next = completed.includes(id)
      ? completed.filter(x => x !== id)
      : [...completed, id];

    setCompleted(next);
    setSaving(true);
    try {
      await saveCompleted(next);
      if (!completed.includes(id)) {
        toast.success('✅ Problem marked as completed!');
        if (auth.currentUser?.uid) {
          recordStreakDay(auth.currentUser.uid);
        }
      }
    } catch (err) {
      if (err.message === 'LocalFallback') {
        if (!completed.includes(id)) {
          toast.info('✅ Saved locally! (Deploy firestore.rules to sync online)');
          if (auth.currentUser?.uid) {
            recordStreakDay(auth.currentUser.uid);
          }
        }
      } else {
        console.error('Failed to save progress:', err);
        toast.error('Could not save progress: ' + err.message);
        // Revert on failure
        setCompleted(completed);
      }
    } finally {
      setSaving(false);
    }
  };

  // Filter problems
  const filtered = PROBLEMS.filter(p => {
    const matchDiff   = filterDiff === 'All' || p.difficulty === filterDiff;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                        p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchDiff && matchSearch;
  });

  // Group into sections
  const sections = ['Easy', 'Medium', 'Hard'].map(diff => ({
    diff,
    problems: filtered.filter(p => p.difficulty === diff),
    cfg: DIFF_CONFIG[diff],
  })).filter(s => s.problems.length > 0 || filterDiff === 'All');

  // Stats
  const total     = PROBLEMS.length;
  const doneCount = PROBLEMS.filter(p => completed.includes(p.id)).length;
  const pct       = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const byDiff    = ['Easy', 'Medium', 'Hard'].map(d => ({
    d,
    done:  PROBLEMS.filter(p => p.difficulty === d && completed.includes(p.id)).length,
    total: PROBLEMS.filter(p => p.difficulty === d).length,
    cfg:   DIFF_CONFIG[d],
  }));

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.25rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1.4rem',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
          }}>
            <RiCodeSSlashLine />
          </div>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
              Programming Sheet
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.1rem' }}>
              Track your progress across curated coding problems
            </p>
          </div>
          {saving && (
            <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: '600', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RiTimeLine className="animate-spin-slow" /> Saving…
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Progress overview ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card"
        style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <RiTrophyLine style={{ fontSize: '1.5rem', color: '#f59e0b' }} />
            <div>
              <p style={{ fontWeight: '800', fontSize: '1.4rem', margin: 0, lineHeight: 1 }}>
                {doneCount} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>/ {total} solved</span>
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.15rem 0 0' }}>
                {pct}% completed
              </p>
            </div>
          </div>

          {/* Per-difficulty pills */}
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {byDiff.map(({ d, done, total: t, cfg }) => (
              <div key={d} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '0.4rem 0.875rem', borderRadius: '10px',
                background: cfg.bg, border: `1px solid ${cfg.border}`,
              }}>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: cfg.color, lineHeight: 1.1 }}>{done}/{t}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: '600', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Overall progress bar */}
        <div>
          <div style={{ height: '10px', borderRadius: '5px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: '5px',
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
              }}
            />
          </div>
        </div>

        {/* Streak / fire badge */}
        {doneCount >= 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600' }}>
            <RiFireLine style={{ fontSize: '1.1rem' }} />
            {doneCount >= total ? '🎉 All problems completed! Amazing work!' : `Great progress! ${total - doneCount} more to go.`}
          </motion.div>
        )}
      </motion.div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <RiSearchLine style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem' }} />
          <input
            type="text"
            placeholder="Search problems or tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
          />
        </div>

        {/* Difficulty filter */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['All', 'Easy', 'Medium', 'Hard'].map(d => {
            const cfg = d === 'All' ? null : DIFF_CONFIG[d];
            const isActive = filterDiff === d;
            return (
              <button
                key={d}
                onClick={() => setFilterDiff(d)}
                style={{
                  padding: '0.5rem 0.875rem', borderRadius: '8px', border: 'none',
                  fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                  background: isActive
                    ? (cfg ? cfg.bg : 'rgba(99,102,241,0.12)')
                    : 'rgba(0,0,0,0.04)',
                  color: isActive
                    ? (cfg ? cfg.color : '#6366f1')
                    : '#94a3b8',
                  outline: isActive
                    ? `1.5px solid ${cfg ? cfg.color : '#6366f1'}`
                    : '1.5px solid transparent',
                  transition: 'all 0.15s',
                }}
              >{d}</button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Problem sections ─────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: '64px', borderRadius: '12px', background: 'rgba(0,0,0,0.04)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {['Easy', 'Medium', 'Hard'].map((diff, si) => {
            const cfg      = DIFF_CONFIG[diff];
            const problems = filtered.filter(p => p.difficulty === diff);
            const allProbs = PROBLEMS.filter(p => p.difficulty === diff);
            const doneHere = allProbs.filter(p => completed.includes(p.id)).length;

            if (filterDiff !== 'All' && filterDiff !== diff) return null;
            if (diff === 'Hard' && allProbs.length === 0) {
              return (
                <motion.div key={diff} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-card"
                  style={{ padding: '1.5rem 1.75rem', borderLeft: `4px solid ${cfg.color}`, opacity: 0.7, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '8px', background: cfg.bg, color: cfg.color }}>HARD</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Coming Soon</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                    Hard problems will be added shortly. Stay tuned!
                  </p>
                </motion.div>
              );
            }
            if (problems.length === 0) return null;

            return (
              <motion.div key={diff} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.06 }}
                className="glass-card"
                style={{ padding: '1.5rem 1.75rem', borderLeft: `4px solid ${cfg.color}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Section header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: '800', padding: '0.25rem 0.7rem',
                      borderRadius: '8px', background: cfg.bg, color: cfg.color,
                      border: `1px solid ${cfg.border}`, letterSpacing: '0.06em',
                    }}>{diff.toUpperCase()}</span>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>
                      {diff} Problems
                    </h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: doneHere === allProbs.length && allProbs.length > 0 ? '#10b981' : '#94a3b8' }}>
                      {doneHere} / {allProbs.length}
                    </span>
                    {doneHere === allProbs.length && allProbs.length > 0 && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '1.1rem' }}>🎉</motion.span>
                    )}
                  </div>
                </div>

                {/* Section progress bar */}
                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: allProbs.length > 0 ? `${(doneHere / allProbs.length) * 100}%` : '0%' }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: '3px', background: cfg.color, transition: 'width 0.5s ease' }}
                  />
                </div>

                {/* Problem list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <AnimatePresence>
                    {problems.map((p, i) => (
                      <ProblemRow
                        key={p.id}
                        problem={p}
                        index={i}
                        sectionIndex={si}
                        completed={completed}
                        onToggle={handleToggle}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 2s linear infinite; display: inline-block; }
      `}</style>
    </div>
  );
}
