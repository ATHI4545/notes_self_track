import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiTrophyLine, RiSearchLine, RiGithubLine, RiCodeSSlashLine,
  RiCalendarCheckLine, RiInformationLine,
} from 'react-icons/ri';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

// ── Reusable Avatar Component ─────────────────────────────────────────────────
function UserAvatar({ user, size = 52, ringColor = null, rankBadge = null }) {
  const [imgError, setImgError] = useState(false);
  const hasPhoto = user.profileImageUrl && !imgError;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Glowing ring */}
      {ringColor && (
        <div style={{
          position: 'absolute', inset: '-3px', borderRadius: '50%',
          background: `conic-gradient(${ringColor}, transparent, ${ringColor})`,
          animation: 'spin 3s linear infinite',
          zIndex: 0,
        }} />
      )}
      {/* Avatar circle */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: size, height: size, borderRadius: '50%',
        overflow: 'hidden', border: `2px solid ${ringColor || 'rgba(99,102,241,0.15)'}`,
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: ringColor ? `0 0 16px ${ringColor}55` : '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        {hasPhoto ? (
          <img
            src={user.profileImageUrl}
            alt={user.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: size * 0.5 }}>{user.avatar || '🧑‍💻'}</span>
        )}
      </div>
      {/* Rank badge */}
      {rankBadge && (
        <div style={{
          position: 'absolute', bottom: '-4px', right: '-4px', zIndex: 2,
          background: ringColor || '#6366f1', color: '#fff', borderRadius: '50%',
          width: Math.max(22, size * 0.38), height: Math.max(22, size * 0.38),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.22, fontWeight: '900',
          boxShadow: '0 2px 6px rgba(0,0,0,0.18)', border: '2px solid #fff',
        }}>
          {rankBadge}
        </div>
      )}
    </div>
  );
}

// ── Leaderboard fetches real users from Firestore ─────────────────────────────
export default function Leaderboard() {
  const { profile } = useAuth();
  const [dbUsers, setDbUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overall');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id) {
            usersList.push({
              uid: doc.id,
              name: data.name || data.displayName || 'Developer',
              avatar: data.avatar || '🧑‍💻',
              profileImageUrl: data.profileImageUrl || '',
              leetcodeSolved: data.leetcodeSolved || 0,
              githubRepos: data.githubRepos || 0,
              activeDaysCount: data.activeDaysCount || 1,
              isReal: true,
            });
          }
        });
        setDbUsers(usersList);
      } catch (err) {
        console.error('Error fetching leaderboard users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const getPoints = (u) =>
    (u.leetcodeSolved || 0) * 10 + (u.githubRepos || 0) * 5 + (u.activeDaysCount || 1) * 2;

  const allUsers = [...dbUsers];

  // Ensure current user in list
  const currentUserExists = allUsers.some((u) => u.uid === profile.uid);
  if (!currentUserExists && profile.uid) {
    allUsers.push({
      uid: profile.uid,
      name: profile.name || 'You',
      avatar: profile.avatar || '🧑‍💻',
      profileImageUrl: profile.profileImageUrl || '',
      leetcodeSolved: profile.leetcodeSolved || 0,
      githubRepos: profile.githubRepos || 0,
      activeDaysCount: profile.activeDaysCount || 1,
      isReal: true,
    });
  }

  // Refresh current user from context (in case stats updated)
  const preparedUsers = allUsers.map((u) => {
    if (u.uid === profile.uid) {
      return {
        ...u,
        name: profile.name || 'You',
        avatar: profile.avatar || '🧑‍💻',
        profileImageUrl: profile.profileImageUrl || '',
        leetcodeSolved: profile.leetcodeSolved || 0,
        githubRepos: profile.githubRepos || 0,
        activeDaysCount: profile.activeDaysCount || 1,
      };
    }
    return u;
  });

  const getSortedUsers = () => {
    const list = [...preparedUsers];
    if (activeTab === 'overall') {
      return list.sort((a, b) => {
        const diff = getPoints(b) - getPoints(a);
        return diff !== 0 ? diff : (b.leetcodeSolved || 0) - (a.leetcodeSolved || 0);
      });
    } else if (activeTab === 'leetcode') {
      return list.sort((a, b) => (b.leetcodeSolved || 0) - (a.leetcodeSolved || 0));
    } else if (activeTab === 'github') {
      return list.sort((a, b) => (b.githubRepos || 0) - (a.githubRepos || 0));
    } else if (activeTab === 'activity') {
      return list.sort((a, b) => (b.activeDaysCount || 0) - (a.activeDaysCount || 0));
    }
    return list;
  };

  const sortedUsers = getSortedUsers();
  const filteredUsers = sortedUsers.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Podium: display as [2nd, 1st, 3rd]
  const top3 = sortedUsers.slice(0, 3);
  const displayPodium = [];
  if (top3[1]) displayPodium.push({ ...top3[1], rank: 2 });
  if (top3[0]) displayPodium.push({ ...top3[0], rank: 1 });
  if (top3[2]) displayPodium.push({ ...top3[2], rank: 3 });

  const currentUserRank = sortedUsers.findIndex((u) => u.uid === profile.uid) + 1;

  const PODIUM_CONFIG = {
    1: { color: '#f59e0b', shadow: 'rgba(245,158,11,0.3)', height: '80px', badge: '🥇', label: '1st', avatarSize: 88 },
    2: { color: '#94a3b8', shadow: 'rgba(148,163,184,0.2)', height: '55px', badge: '🥈', label: '2nd', avatarSize: 72 },
    3: { color: '#b45309', shadow: 'rgba(180,83,9,0.2)', height: '40px', badge: '🥉', label: '3rd', avatarSize: 64 },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontWeight: 500 }}>Fetching leaderboard...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 1.75rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes podium-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.25); }
          50% { box-shadow: 0 0 36px rgba(245,158,11,0.5); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
            }}>
              <RiTrophyLine />
            </div>
            <h1 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Leaderboard
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            Rankings based on coding activity, projects & consistency.
          </p>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '10px',
            background: 'rgba(99,102,241,0.08)', color: '#6366f1',
            border: '1px solid rgba(99,102,241,0.18)', fontSize: '0.8rem',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <RiInformationLine /> How it Works
        </button>
      </div>

      {/* ── Info Card ── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}
          >
            <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#6366f1' }}>⭐ Points Formula</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {[
                  { icon: '🧩', title: 'LeetCode Problems', sub: '+10 pts per solved problem' },
                  { icon: '🐙', title: 'GitHub Repos', sub: '+5 pts per repository' },
                  { icon: '🌐', title: 'Days Active', sub: '+2 pts per active day' },
                ].map(item => (
                  <div key={item.title} style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>{item.title}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Podium Section ── */}
      {displayPodium.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 50%, #faf5ff 100%)', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.1)', padding: '2rem 1rem 0', boxShadow: '0 4px 24px rgba(99,102,241,0.06)' }}>
          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.5rem', margin: '0 0 1.5rem' }}>
            🏆 Top Performers
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1.25rem', flexWrap: 'wrap' }}>
            {displayPodium.map((user) => {
              const cfg = PODIUM_CONFIG[user.rank];
              const isSelf = user.uid === profile.uid;
              const pts = getPoints(user);

              return (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: user.rank * 0.08, duration: 0.45 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: user.rank === 1 ? 200 : 170 }}
                >
                  {/* Crown for 1st */}
                  {user.rank === 1 && (
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem', filter: 'drop-shadow(0 2px 6px rgba(245,158,11,0.4))' }}>👑</div>
                  )}

                  {/* Profile Avatar */}
                  <div style={{ marginBottom: '0.75rem', animation: user.rank === 1 ? 'podium-glow 2.5s ease-in-out infinite' : 'none', borderRadius: '50%' }}>
                    <UserAvatar
                      user={user}
                      size={cfg.avatarSize}
                      ringColor={cfg.color}
                      rankBadge={user.rank}
                    />
                  </div>

                  {/* Name + Stats Card */}
                  <div style={{
                    width: '100%', padding: '0.875rem 0.75rem', textAlign: 'center',
                    background: isSelf ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                    border: `1.5px solid ${isSelf ? 'rgba(99,102,241,0.35)' : cfg.color + '44'}`,
                    borderRadius: '14px', marginBottom: '0',
                    boxShadow: `0 8px 24px ${cfg.shadow}`,
                  }}>
                    <p style={{ fontWeight: 800, fontSize: user.rank === 1 ? '1rem' : '0.88rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name} {isSelf && <span style={{ fontSize: '0.65rem', background: '#6366f1', color: '#fff', padding: '0.1rem 0.3rem', borderRadius: '4px', marginLeft: '0.2rem' }}>YOU</span>}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.625rem', margin: '0.4rem 0 0.5rem', fontSize: '0.7rem', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <RiCodeSSlashLine style={{ color: '#ffa116' }} /> {user.leetcodeSolved}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <RiGithubLine style={{ color: '#238636' }} /> {user.githubRepos}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <RiCalendarCheckLine style={{ color: '#6366f1' }} /> {user.activeDaysCount}d
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color, background: cfg.color + '18', padding: '0.2rem 0.625rem', borderRadius: '10px', display: 'inline-block' }}>
                      {pts} pts
                    </span>
                  </div>

                  {/* Podium Block */}
                  <div style={{
                    width: '100%', height: cfg.height,
                    background: `linear-gradient(to bottom, ${cfg.color}22, ${cfg.color}06)`,
                    borderTop: `2px solid ${cfg.color}`,
                    borderRadius: '0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem',
                  }}>
                    {cfg.badge}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Table Section ── */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

        {/* Controls row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(148,163,184,0.08)', borderRadius: '10px', padding: '0.2rem', gap: '0.2rem' }}>
            {[
              { key: 'overall', label: 'Overall' },
              { key: 'leetcode', label: 'LeetCode' },
              { key: 'github', label: 'GitHub' },
              { key: 'activity', label: 'Activity' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.4rem 0.875rem', borderRadius: '8px', border: 'none',
                  fontSize: '0.78rem', fontWeight: activeTab === tab.key ? 700 : 500,
                  background: activeTab === tab.key ? '#fff' : 'transparent',
                  color: activeTab === tab.key ? '#6366f1' : '#64748b',
                  boxShadow: activeTab === tab.key ? '0 1px 5px rgba(0,0,0,0.07)' : 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: 210 }}>
            <RiSearchLine style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }} />
            <input
              type="text" placeholder="Search user..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.4rem 0.75rem 0.4rem 2rem', fontSize: '0.8rem', borderRadius: '10px' }}
            />
          </div>
        </div>

        {/* My Standing Banner */}
        {profile.uid && (
          <div style={{
            padding: '0.875rem 1rem', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.07) 100%)',
            border: '1px solid rgba(99,102,241,0.14)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserAvatar user={profile} size={40} ringColor="#6366f1" />
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>Your Ranking</p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                  #{currentUserRank} out of <strong>{sortedUsers.length}</strong> participants
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>Total Score</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#6366f1' }}>{getPoints(profile)} pts</p>
              </div>
              <div style={{ borderLeft: '1px solid rgba(99,102,241,0.15)', paddingLeft: '1.25rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>LeetCode</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#ffa116' }}>{profile.leetcodeSolved || 0}</p>
              </div>
              <div style={{ borderLeft: '1px solid rgba(99,102,241,0.15)', paddingLeft: '1.25rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>GitHub</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#238636' }}>{profile.githubRepos || 0}</p>
              </div>
              <div style={{ borderLeft: '1px solid rgba(99,102,241,0.15)', paddingLeft: '1.25rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>Active Days</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#4f46e5' }}>{profile.activeDaysCount || 1}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '560px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid rgba(0,0,0,0.06)', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 0.75rem' }}>Rank</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Developer</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>LeetCode</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>GitHub</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Active Days</th>
                <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const rank = sortedUsers.findIndex(u => u.uid === user.uid) + 1;
                    const isSelf = user.uid === profile.uid;
                    const pts = getPoints(user);

                    return (
                      <motion.tr
                        key={user.uid}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          borderBottom: '1px solid rgba(0,0,0,0.04)',
                          background: isSelf ? 'rgba(99,102,241,0.04)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isSelf ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = isSelf ? 'rgba(99,102,241,0.04)' : 'transparent'}
                      >
                        {/* Rank */}
                        <td style={{ padding: '0.875rem 0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : (
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>#{rank}</span>
                          )}
                        </td>

                        {/* Developer */}
                        <td style={{ padding: '0.875rem 0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <UserAvatar
                              user={user}
                              size={42}
                              ringColor={isSelf ? '#6366f1' : rank <= 3 ? PODIUM_CONFIG[rank]?.color : null}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: isSelf ? '#4f46e5' : '#1e293b' }}>
                                  {user.name}
                                </p>
                                {isSelf && (
                                  <span style={{ fontSize: '0.62rem', background: '#6366f1', color: '#fff', padding: '0.08rem 0.3rem', borderRadius: '4px', fontWeight: 700 }}>
                                    YOU
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>Verified Student</p>
                            </div>
                          </div>
                        </td>

                        {/* LeetCode */}
                        <td style={{ padding: '0.875rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 600, color: user.leetcodeSolved ? '#d97706' : '#cbd5e1' }}>
                            <RiCodeSSlashLine /> {user.leetcodeSolved || 0}
                          </span>
                        </td>

                        {/* GitHub */}
                        <td style={{ padding: '0.875rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 600, color: user.githubRepos ? '#16a34a' : '#cbd5e1' }}>
                            <RiGithubLine /> {user.githubRepos || 0}
                          </span>
                        </td>

                        {/* Days Active */}
                        <td style={{ padding: '0.875rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 600, color: '#4f46e5' }}>
                            <RiCalendarCheckLine /> {user.activeDaysCount || 1}d
                          </span>
                        </td>

                        {/* Points */}
                        <td style={{ padding: '0.875rem 0.75rem', textAlign: 'right' }}>
                          <span style={{
                            fontSize: '0.875rem', fontWeight: 800,
                            color: '#4f46e5',
                            background: isSelf ? 'rgba(99,102,241,0.1)' : 'transparent',
                            padding: isSelf ? '0.2rem 0.625rem' : '0',
                            borderRadius: '8px',
                          }}>
                            {pts} pts
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                      {searchTerm ? `No users matching "${searchTerm}"` : 'No participants yet. Be the first to join!'}
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
