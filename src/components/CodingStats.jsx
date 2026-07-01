import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiCodeBoxLine, RiAwardLine, RiRefreshLine, RiSettings4Line } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── alfa-leetcode-api (CORS-friendly public REST API) ────────────────────────
const BASE = 'https://alfa-leetcode-api.onrender.com';

async function fetchProfile(username) {
  const res = await fetch(`${BASE}/userProfile/${username}`);
  if (!res.ok) throw new Error(`Network error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'User not found');
  if (json.totalSolved === undefined && json.totalQuestions === undefined) {
    throw new Error('LeetCode profile not found or API is currently offline.');
  }
  return json;
}

async function fetchBadges(username) {
  try {
    const res = await fetch(`${BASE}/${username}/badges`);
    if (!res.ok) return { badges: [] };
    return await res.json();
  } catch {
    return { badges: [] };
  }
}

async function fetchCalendar(username) {
  try {
    const res = await fetch(`${BASE}/${username}/userCalendar`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CodingStats() {
  const { profile } = useAuth();
  const username = profile?.leetcodeUsername;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const [profileData, badgesData, calendarData] = await Promise.all([
          fetchProfile(username),
          fetchBadges(username),
          fetchCalendar(username),
        ]);

        const badges = badgesData?.badges || [];

        setData({
          username,
          ranking: profileData.ranking || 'N/A',
          solved: {
            total: profileData.totalSolved || 0,
            totalQuestions: profileData.totalQuestions || 0,
            easy: profileData.easySolved || 0,
            totalEasy: profileData.totalEasy || 0,
            medium: profileData.mediumSolved || 0,
            totalMedium: profileData.totalMedium || 0,
            hard: profileData.hardSolved || 0,
            totalHard: profileData.totalHard || 0,
          },
          badges,
          streak: calendarData?.streak || 0,
          activeDays: calendarData?.totalActiveDays || 0,
        });
      } catch (err) {
        console.error('LeetCode fetch error:', err);
        setError(err.message || 'Failed to fetch LeetCode data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, refreshKey]);

  // ── No username linked ────────────────────────────────────────────────────
  if (!username) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          padding: '1.5rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.75rem',
          background: 'rgba(255, 161, 22, 0.03)',
          border: '1px solid rgba(255, 161, 22, 0.15)',
        }}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 161, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RiCodeBoxLine style={{ fontSize: '1.75rem', color: '#ffa116' }} />
        </div>
        <div>
          <p style={{ fontWeight: '700', fontSize: '1rem' }}>Connect LeetCode Profile</p>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Link your LeetCode username to see your problem solving, badges, and achievements here.
          </p>
        </div>
        <Link to="/platforms" className="btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', border: '1px solid #ffa116', color: '#ffa116', background: 'none', textDecoration: 'none' }}>
          Connect Now
        </Link>
      </motion.div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: '120px', height: '16px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)', animation: 'pulse 1.5s infinite' }} />
          </div>
          <div style={{ width: '80px', height: '16px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)', animation: 'pulse 1.5s infinite' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ height: '80px', borderRadius: '12px', background: 'rgba(0,0,0,0.03)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '80px', borderRadius: '12px', background: 'rgba(0,0,0,0.03)', animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.75rem',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          background: 'rgba(239, 68, 68, 0.02)'
        }}
      >
        <p style={{ fontWeight: '700', color: '#ef4444', fontSize: '0.9rem' }}>LeetCode Integration Offline</p>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Unable to fetch details for <strong>{username}</strong>. Error: {error}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setRefreshKey(k => k + 1)} className="btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <RiRefreshLine /> Retry
          </button>
          <Link to="/platforms" className="btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
            <RiSettings4Line /> Settings
          </Link>
        </div>
      </div>
    );
  }

  const { solved, badges, ranking } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{
        padding: '1.5rem 1.75rem',
        borderLeft: '4px solid #ffa116',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #ffa116 0%, #ff7a00 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: '800', fontSize: '1rem'
          }}>
            L
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '750', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              LeetCode Stats
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>({username})</span>
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
              Global Ranking: {typeof ranking === 'number' ? ranking.toLocaleString() : ranking}
            </p>
          </div>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem', display: 'flex', padding: '0.25rem', borderRadius: '0.375rem', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ffa116'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          title="Refresh statistics"
        >
          <RiRefreshLine />
        </button>
      </div>

      {/* Stats Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="leetcode-grid">

        {/* Solved Progress Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '750', color: '#94a3b8' }}>PROBLEMS SOLVED</span>
            <span style={{ fontSize: '1.25rem', fontWeight: '855', color: '#ffa116' }}>
              {solved.total} <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: '500' }}>/ {solved.totalQuestions}</span>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Easy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600' }}>
                <span style={{ color: '#00b8a3' }}>Easy</span>
                <span>{solved.easy} / {solved.totalEasy || 800}</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(0, 184, 163, 0.1)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((solved.easy / (solved.totalEasy || 800)) * 100, 100)}%`, height: '100%', background: '#00b8a3', borderRadius: '3px', transition: 'width 0.6s ease' }} />
              </div>
            </div>

            {/* Medium */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600' }}>
                <span style={{ color: '#ffc01e' }}>Medium</span>
                <span>{solved.medium} / {solved.totalMedium || 1600}</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255, 192, 30, 0.1)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((solved.medium / (solved.totalMedium || 1600)) * 100, 100)}%`, height: '100%', background: '#ffc01e', borderRadius: '3px', transition: 'width 0.6s ease' }} />
              </div>
            </div>

            {/* Hard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600' }}>
                <span style={{ color: '#ef4743' }}>Hard</span>
                <span>{solved.hard} / {solved.totalHard || 700}</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(239, 71, 67, 0.1)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((solved.hard / (solved.totalHard || 700)) * 100, 100)}%`, height: '100%', background: '#ef4743', borderRadius: '3px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <RiAwardLine style={{ color: '#10b981', fontSize: '1.3rem' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '750', textTransform: 'uppercase', margin: 0 }}>BADGES</p>
              <p style={{ fontSize: '1.15rem', fontWeight: '855', margin: 0, color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {badges.length}
                <span style={{ display: 'inline-flex', gap: '0.2rem', marginLeft: '0.2rem' }}>
                  {badges.slice(0, 3).map((badge, idx) => (
                    <img
                      key={badge.id || idx}
                      src={badge.icon?.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`}
                      alt={badge.displayName || badge.name}
                      title={badge.displayName || badge.name}
                      style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ))}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (min-width: 640px) {
          .leetcode-grid {
            grid-template-columns: 3fr 2fr !important;
            align-items: center;
          }
          .leetcode-grid > div:last-child {
            border-top: none !important;
            padding-top: 0 !important;
            border-left: 1px solid rgba(0,0,0,0.06);
            padding-left: 1.5rem;
            flex-direction: column !important;
            gap: 1rem !important;
            justify-content: center !important;
          }
        }
        html.dark .leetcode-grid > div:last-child {
          border-color: rgba(255,255,255,0.08) !important;
        }
      `}</style>
    </motion.div>
  );
}
