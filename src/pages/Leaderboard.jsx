import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiTrophyLine, RiSearchLine, RiGithubLine, RiCodeSSlashLine,
  RiCalendarCheckLine, RiInformationLine, RiMedalLine, RiUserLocationLine
} from 'react-icons/ri';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

// Beautiful, curated mock users to populate the leaderboard
const MOCK_USERS = [
  { uid: 'mock-1', name: 'Sophia Chen', avatar: '👩‍💼', leetcodeSolved: 342, githubRepos: 18, activeDaysCount: 42 },
  { uid: 'mock-2', name: 'Alex Rivers', avatar: '🧑‍💻', leetcodeSolved: 285, githubRepos: 24, activeDaysCount: 36 },
  { uid: 'mock-3', name: 'Marcus Miller', avatar: '🧙', leetcodeSolved: 210, githubRepos: 12, activeDaysCount: 28 },
  { uid: 'mock-4', name: 'Elena Rostova', avatar: '🦸', leetcodeSolved: 145, githubRepos: 8, activeDaysCount: 50 },
  { uid: 'mock-5', name: 'Amit Patel', avatar: '🧑‍🔬', leetcodeSolved: 98, githubRepos: 32, activeDaysCount: 15 },
];

export default function Leaderboard() {
  const { profile } = useAuth();
  const [dbUsers, setDbUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overall'); // 'overall' | 'leetcode' | 'github' | 'activity'
  const [showInfo, setShowInfo] = useState(false);

  // Fetch real users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Skip if no UID (safety check)
          if (doc.id) {
            usersList.push({
              uid: doc.id,
              name: data.name || data.displayName || 'Developer',
              avatar: data.avatar || '🧑‍💻',
              leetcodeSolved: data.leetcodeSolved || 0,
              githubRepos: data.githubRepos || 0,
              activeDaysCount: data.activeDaysCount || 1,
              isReal: true
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

  // Compute points formula
  const getPoints = (u) => {
    return (u.leetcodeSolved || 0) * 10 + (u.githubRepos || 0) * 5 + (u.activeDaysCount || 1) * 2;
  };

  // Combine real and mock users (avoid duplicates of current user name in mock data)
  const allUsers = [...dbUsers];
  
  // Add mock users that don't match the current user name
  MOCK_USERS.forEach((mock) => {
    const nameExists = allUsers.some(
      (u) => u.name.toLowerCase() === mock.name.toLowerCase() || u.uid === mock.uid
    );
    if (!nameExists) {
      allUsers.push(mock);
    }
  });

  // Ensure current user is in the list
  const currentUserExists = allUsers.some((u) => u.uid === profile.uid);
  if (!currentUserExists && profile.uid) {
    allUsers.push({
      uid: profile.uid,
      name: profile.name || 'You',
      avatar: profile.avatar || '🧑‍💻',
      leetcodeSolved: profile.leetcodeSolved || 0,
      githubRepos: profile.githubRepos || 0,
      activeDaysCount: profile.activeDaysCount || 1,
      isReal: true
    });
  }

  // Update current user values from latest profile context
  const preparedUsers = allUsers.map((u) => {
    if (u.uid === profile.uid) {
      return {
        ...u,
        name: profile.name || 'You',
        avatar: profile.avatar || '🧑‍💻',
        leetcodeSolved: profile.leetcodeSolved || 0,
        githubRepos: profile.githubRepos || 0,
        activeDaysCount: profile.activeDaysCount || 1,
      };
    }
    return u;
  });

  // Sorting based on active tab
  const getSortedUsers = () => {
    const list = [...preparedUsers];
    if (activeTab === 'overall') {
      return list.sort((a, b) => {
        const diff = getPoints(b) - getPoints(a);
        if (diff !== 0) return diff;
        return (b.leetcodeSolved || 0) - (a.leetcodeSolved || 0); // LeetCode priority tiebreaker
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

  // Apply search filtering
  const filteredUsers = sortedUsers.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Identify podium ranks (top 3 overall or for selected categories)
  const podiumUsers = sortedUsers.slice(0, 3);
  // Re-order podium for display: [2nd, 1st, 3rd]
  const displayPodium = [];
  if (podiumUsers[1]) displayPodium.push({ ...podiumUsers[1], rank: 2 });
  if (podiumUsers[0]) displayPodium.push({ ...podiumUsers[0], rank: 1 });
  if (podiumUsers[2]) displayPodium.push({ ...podiumUsers[2], rank: 3 });

  // Get index/rank of current user
  const currentUserRank = sortedUsers.findIndex((u) => u.uid === profile.uid) + 1;

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '3px solid rgba(99,102,241,0.25)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>Fetching leaderboard standings...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(245,158,11,0.3)'
            }}>
              <RiTrophyLine />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }} className="text-gradient">
              Leaderboard
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
            Compete with fellow developers based on coding activity and consistency.
          </p>
        </div>

        {/* Info button */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '10px',
            background: 'rgba(99,102,241,0.1)', color: '#6366f1',
            border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.82rem',
            fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
          }}
          className="hover-scale"
        >
          <RiInformationLine style={{ fontSize: '1rem' }} />
          How it Works
        </button>
      </div>

      {/* Info details card (Toggled) */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="glass-card" style={{
              padding: '1.25rem', border: '1px solid rgba(99,102,241,0.2)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.02) 100%)',
              display: 'flex', flexDirection: 'column', gap: '0.875rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ⭐ Points Calculator Rules
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Your overall leaderboard standing is calculated dynamically using your connected platform statistics.
                First priority is given to LeetCode problems solved, awarding high weight to technical problem solving.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🧩</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: '700' }}>LeetCode Problems</h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>+10 Points per Solved Problem</p>
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🐙</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: '700' }}>GitHub Repositories</h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>+5 Points per Repository</p>
                  </div>
                </div>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🌐</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: '700' }}>Website Active Days</h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>+2 Points per Active Day</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Podium Section */}
      {displayPodium.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
          gap: '1.5rem', margin: '1rem 0 2rem', flexWrap: 'wrap'
        }}>
          {displayPodium.map((user) => {
            const isSelf = user.uid === profile.uid;
            const points = getPoints(user);
            
            // Podium specific styles
            let height = '140px';
            let color = '#94a3b8'; // Silver default
            let title = 'Silver';
            let trophy = '🥈';
            let shadow = 'rgba(148,163,184,0.15)';
            let borderColor = 'rgba(148,163,184,0.2)';

            if (user.rank === 1) {
              height = '180px';
              color = '#fbbf24'; // Gold
              title = 'Gold';
              trophy = '🥇';
              shadow = 'rgba(251,191,36,0.25)';
              borderColor = 'rgba(251,191,36,0.3)';
            } else if (user.rank === 3) {
              height = '120px';
              color = '#b45309'; // Bronze
              title = 'Bronze';
              trophy = '🥉';
              shadow = 'rgba(180,83,9,0.15)';
              borderColor = 'rgba(180,83,9,0.2)';
            }

            return (
              <motion.div
                key={user.uid}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: user.rank * 0.1 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  width: '180px', position: 'relative'
                }}
              >
                {/* Avatar with Ring */}
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '3rem', display: 'block',
                    filter: `drop-shadow(0 8px 12px ${shadow})`
                  }}>
                    {user.avatar}
                  </span>
                  <div style={{
                    position: 'absolute', bottom: '-4px', right: '-4px',
                    background: color, color: '#fff', borderRadius: '50%',
                    width: '24px', height: '24px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', fontWeight: 'bold',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    border: '2px solid #fff'
                  }}>
                    {user.rank}
                  </div>
                </div>

                {/* Info Card */}
                <div
                  className="glass-card"
                  style={{
                    width: '100%', padding: '1rem 0.75rem',
                    textAlign: 'center',
                    border: `1px solid ${isSelf ? 'rgba(99,102,241,0.5)' : borderColor}`,
                    boxShadow: isSelf ? '0 10px 25px rgba(99,102,241,0.15)' : `0 10px 20px ${shadow}`,
                    background: isSelf ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%)' : 'rgba(255,255,255,0.7)',
                    borderRadius: '16px', zIndex: 2
                  }}
                >
                  <p style={{
                    fontWeight: '800', fontSize: '0.9rem', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {user.name} {isSelf && '(You)'}
                  </p>
                  
                  {/* Category Standings */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', margin: '0.4rem 0 0.5rem', fontSize: '0.72rem', color: '#64748b' }}>
                    <span title="LeetCode Solved" style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                      <RiCodeSSlashLine style={{ color: '#ffa116' }} /> {user.leetcodeSolved}
                    </span>
                    <span title="GitHub Repos" style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                      <RiGithubLine style={{ color: '#238636' }} /> {user.githubRepos}
                    </span>
                    <span title="Days Active" style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                      <RiCalendarCheckLine style={{ color: '#6366f1' }} /> {user.activeDaysCount}
                    </span>
                  </div>

                  {/* Points display */}
                  <span style={{
                    fontSize: '0.75rem', fontWeight: '700',
                    color: '#6366f1', background: 'rgba(99,102,241,0.1)',
                    padding: '0.25rem 0.75rem', borderRadius: '12px',
                    display: 'inline-block'
                  }}>
                    {points} pts
                  </span>
                </div>

                {/* Visual Podium Base */}
                <div style={{
                  width: '90%', height: height,
                  background: `linear-gradient(to bottom, rgba(${user.rank === 1 ? '251,191,36,0.12' : user.rank === 2 ? '148,163,184,0.12' : '180,83,9,0.12'}), rgba(0,0,0,0.01))`,
                  borderTop: `2px solid ${color}`,
                  borderRadius: '8px 8px 0 0',
                  marginTop: '-8px', zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: color, fontSize: '2rem', fontWeight: '900', opacity: 0.6
                }}>
                  {trophy}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Controls & Table Container */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Search & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Tabs */}
          <div style={{
            display: 'flex', padding: '0.25rem', borderRadius: '10px',
            background: 'rgba(148,163,184,0.08)', gap: '0.25rem'
          }}>
            {[
              { key: 'overall', label: 'Overall' },
              { key: 'leetcode', label: 'LeetCode' },
              { key: 'github', label: 'GitHub Repos' },
              { key: 'activity', label: 'Days Active' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.45rem 0.875rem', borderRadius: '8px', border: 'none',
                  fontSize: '0.8rem', fontWeight: activeTab === tab.key ? '700' : '500',
                  background: activeTab === tab.key ? '#fff' : 'transparent',
                  color: activeTab === tab.key ? '#6366f1' : '#64748b',
                  boxShadow: activeTab === tab.key ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '220px' }}>
            <RiSearchLine style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }} />
            <input
              type="text"
              placeholder="Search user..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field"
              style={{
                width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem',
                fontSize: '0.8rem', borderRadius: '10px'
              }}
            />
          </div>
        </div>

        {/* Current user fast stats badge */}
        {profile.uid && (
          <div style={{
            padding: '0.875rem 1.125rem', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.15)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🏅</span>
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '700' }}>Your Standing</p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                  Ranked <strong style={{ color: '#6366f1' }}>#{currentUserRank}</strong> out of {sortedUsers.length} total participants.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>Overall Score</p>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '800', color: '#6366f1' }}>{getPoints(profile)} pts</p>
              </div>
              <div style={{ borderLeft: '1px solid rgba(99,102,241,0.2)', paddingLeft: '1rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>LeetCode Solved</p>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '800', color: '#ffa116' }}>{profile.leetcodeSolved || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table view */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Rank</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>User</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>LeetCode Solved</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>GitHub Projects</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Days Active</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, idx) => {
                    // Find actual rank in the sorted list
                    const rank = sortedUsers.findIndex(u => u.uid === user.uid) + 1;
                    const isSelf = user.uid === profile.uid;
                    const points = getPoints(user);

                    return (
                      <motion.tr
                        key={user.uid}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          borderBottom: '1px solid rgba(0,0,0,0.04)',
                          background: isSelf ? 'rgba(99,102,241,0.05)' : 'transparent',
                          fontWeight: isSelf ? '700' : 'normal',
                          color: isSelf ? '#4f46e5' : 'inherit',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isSelf ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.01)'}
                        onMouseLeave={e => e.currentTarget.style.background = isSelf ? 'rgba(99,102,241,0.05)' : 'transparent'}
                      >
                        {/* Rank */}
                        <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                          </div>
                        </td>

                        {/* User Avatar + Name */}
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <span style={{ fontSize: '1.4rem' }}>{user.avatar}</span>
                            <div>
                              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '700', color: isSelf ? '#4f46e5' : '#1e293b' }}>
                                {user.name} {isSelf && <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#fff', background: '#6366f1', padding: '0.1rem 0.35rem', borderRadius: '4px', marginLeft: '0.25rem' }}>YOU</span>}
                              </p>
                              <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>
                                {user.isReal ? 'Verified Student' : 'Challenger'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* LeetCode count */}
                        <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.82rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: user.leetcodeSolved ? '#d97706' : '#94a3b8' }}>
                            <RiCodeSSlashLine /> {user.leetcodeSolved || 0}
                          </span>
                        </td>

                        {/* GitHub count */}
                        <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.82rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: user.githubRepos ? '#15803d' : '#94a3b8' }}>
                            <RiGithubLine /> {user.githubRepos || 0}
                          </span>
                        </td>

                        {/* Days Active */}
                        <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.82rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#4f46e5' }}>
                            <RiCalendarCheckLine /> {user.activeDaysCount || 1}d
                          </span>
                        </td>

                        {/* Total Points */}
                        <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '800', color: '#4f46e5' }}>
                          {points} pts
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      No participants found matching "{searchTerm}"
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
