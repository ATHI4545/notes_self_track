import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiCodeBoxLine, RiAwardLine, RiRefreshLine, RiSettings4Line } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── alfa-leetcode-api (CORS-friendly public REST API) ────────────────────────
const BASE = 'https://alfa-leetcode-api.onrender.com';
const TIMEOUT_MS = 30000; // 30s — enough for Render cold-start
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 4000;

// Fetch with timeout support
async function fetchWithTimeout(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error('Request timed out. API may be warming up.');
    throw err;
  }
}

// Retry wrapper with exponential back-off
async function withRetry(fn, retries = MAX_RETRIES, delayMs = RETRY_DELAY_MS) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delayMs * attempt));
    }
  }
}

async function fetchProfile(username) {
  return withRetry(async () => {
    const res = await fetchWithTimeout(`${BASE}/userProfile/${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error(`Network error: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message || 'User not found');
    if (json.totalSolved === undefined && json.totalQuestions === undefined) {
      throw new Error('LeetCode profile not found. Please check your username.');
    }
    return json;
  });
}

async function fetchBadges(username) {
  try {
    const res = await fetchWithTimeout(`${BASE}/${encodeURIComponent(username)}/badges`);
    if (!res.ok) return { badges: [] };
    return await res.json();
  } catch {
    return { badges: [] };
  }
}

async function fetchCalendar(username) {
  try {
    const res = await fetchWithTimeout(`${BASE}/${encodeURIComponent(username)}/userCalendar`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CodingStats() {
  const { profile, updateProfile } = useAuth();
  const username = profile?.leetcodeUsername;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warming, setWarming] = useState(false); // true while waiting for cold-start
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setWarming(false);
    setError(null);

    // Show "warming up" hint after 5s if still loading (Render cold-start)
    const warmTimer = setTimeout(() => setWarming(true), 5000);

    const fetchData = async () => {
      try {
        // Send a cheap wake-up ping first so the server starts booting
        fetch(`${BASE}/userProfile/${encodeURIComponent(username)}`).catch(() => {});

        const [profileData, badgesData, calendarData] = await Promise.all([
          fetchProfile(username),
          fetchBadges(username),
          fetchCalendar(username),
        ]);

        const badges = badgesData?.badges || [];
        const solvedCount = profileData.totalSolved || 0;

        setData({
          username,
          ranking: profileData.ranking || 'N/A',
          solved: {
            total: solvedCount,
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

        // Sync to Firestore for Leaderboard caching
        if (profile && profile.leetcodeSolved !== solvedCount) {
          updateProfile({ leetcodeSolved: solvedCount });
        }
      } catch (err) {
        console.error('LeetCode fetch error:', err);
        setError(err.message || 'Failed to fetch LeetCode data.');
      } finally {
        clearTimeout(warmTimer);
        setLoading(false);
        setWarming(false);
      }
    };

    fetchData();
    return () => clearTimeout(warmTimer);
  }, [username, refreshKey, profile?.leetcodeSolved]);

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
        {warming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,161,22,0.06)', border: '1px solid rgba(255,161,22,0.15)' }}>
            <span style={{ fontSize: '0.95rem' }}>⏳</span>
            <p style={{ fontSize: '0.78rem', color: '#ffa116', margin: 0, fontWeight: '600' }}>
              API waking up — this can take up to 30s on first load. Please wait…
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    const isTimeout = error.toLowerCase().includes('timeout') || error.toLowerCase().includes('warming');
    const isNotFound = error.toLowerCase().includes('not found') || error.toLowerCase().includes('check');
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
        <span style={{ fontSize: '2rem' }}>{isNotFound ? '🔍' : '⏳'}</span>
        <p style={{ fontWeight: '700', color: '#ef4444', fontSize: '0.9rem' }}>
          {isNotFound ? 'Profile Not Found' : isTimeout ? 'API is Starting Up…' : 'LeetCode Stats Unavailable'}
        </p>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '280px' }}>
          {isNotFound
            ? `No LeetCode profile found for "${username}". Please check the username in Settings.`
            : isTimeout
            ? 'The stats server was asleep. Click Retry — it usually works on the second attempt.'
            : `Could not load stats for ${username}. The API may be temporarily down.`
          }
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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
      {/* Header — profile photo + name + LeetCode username */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

          {/* Profile photo / avatar */}
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={profile.name}
              style={{
                width: '52px', height: '52px', borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #ffa116',
                flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffa116 0%, #ff7a00 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', flexShrink: 0,
              border: '2px solid rgba(255,161,22,0.4)',
            }}>
              {profile.avatar && profile.avatar.length <= 4 ? profile.avatar : '🧑‍💻'}
            </div>
          )}

          {/* Name + meta */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, letterSpacing: '-0.01em', color: 'inherit' }}>
              {profile.name || username}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#ffa116', fontWeight: '600', margin: '0.1rem 0 0' }}>
              @{username}
            </p>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.1rem 0 0' }}>
              Global Rank: {typeof ranking === 'number' ? ranking.toLocaleString() : ranking}
            </p>
          </div>
        </div>

        {/* Refresh button */}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {/* Easy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600' }}>
                <span style={{ color: '#00b8a3' }}>Easy</span>
                <span>{solved.easy} / {solved.totalEasy || 800}</span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(0, 184, 163, 0.12)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((solved.easy / (solved.totalEasy || 800)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg,#00b8a3,#00d4be)', borderRadius: '4px', transition: 'width 0.8s ease' }} />
              </div>
            </div>

            {/* Medium */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600' }}>
                <span style={{ color: '#ffc01e' }}>Medium</span>
                <span>{solved.medium} / {solved.totalMedium || 1600}</span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255, 192, 30, 0.12)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((solved.medium / (solved.totalMedium || 1600)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg,#ffc01e,#ffd84d)', borderRadius: '4px', transition: 'width 0.8s ease' }} />
              </div>
            </div>

            {/* Hard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600' }}>
                <span style={{ color: '#ef4743' }}>Hard</span>
                <span>{solved.hard} / {solved.totalHard || 700}</span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(239, 71, 67, 0.12)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((solved.hard / (solved.totalHard || 700)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg,#ef4743,#ff6b68)', borderRadius: '4px', transition: 'width 0.8s ease' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Badges — full grid showing ALL badges at proper size */}
        <div className="leetcode-badges-col" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '750', textTransform: 'uppercase', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RiAwardLine style={{ color: '#10b981', fontSize: '1rem' }} />
            BADGES
            <span style={{ color: '#10b981', fontWeight: '800', fontSize: '0.85rem' }}>({badges.length})</span>
          </p>
          {badges.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', padding: '0.5rem 0' }}>
              <span style={{ fontSize: '0.82rem' }}>No badges yet — keep solving!</span>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
              gap: '0.625rem',
            }}>
              {badges.map((badge, idx) => (
                <div
                  key={badge.id || idx}
                  title={badge.displayName || badge.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    aspectRatio: '1',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
                    cursor: 'default',
                    padding: '6px',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.14)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.25)';
                    e.currentTarget.style.background = 'rgba(16,185,129,0.12)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'rgba(16,185,129,0.06)';
                  }}
                >
                  <img
                    src={badge.icon?.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`}
                    alt={badge.displayName || badge.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={e => { e.target.parentElement.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          )}
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
