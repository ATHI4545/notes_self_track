import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiAwardLine, RiShieldUserLine, RiLink, RiLinkUnlink, RiLoader5Line, RiCheckDoubleLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ALFA_API = 'https://alfa-leetcode-api.onrender.com';

export default function Platforms() {
  const { profile, updateProfile } = useAuth();
  const [leetcodeUsername, setLeetcodeUsername] = useState(profile.leetcodeUsername || '');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const handleLinkLeetcode = async (e) => {
    e.preventDefault();
    if (!leetcodeUsername.trim()) {
      toast.error('Please enter a LeetCode username');
      return;
    }

    setVerifying(true);
    setPreviewData(null);
    const targetUsername = leetcodeUsername.trim();

    try {
      const res = await fetch(`${ALFA_API}/userProfile/${encodeURIComponent(targetUsername)}`);
      if (!res.ok) throw new Error('LeetCode API is currently offline. Please try again.');

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0]?.message || 'LeetCode profile not found.');
      if (json.totalSolved === undefined && json.totalQuestions === undefined) {
        throw new Error('LeetCode profile not found. Check the username and try again.');
      }

      const solved = json.totalSolved || 0;
      const total = json.totalQuestions || 0;

      setPreviewData({ solvedProblem: solved, totalQuestions: total });
      setSaving(true);

      await updateProfile({ leetcodeUsername: targetUsername });
      toast.success('🔗 LeetCode profile linked successfully!');
    } catch (err) {
      toast.error(err.message || 'Verification failed. Make sure the username is correct.');
    } finally {
      setVerifying(false);
      setSaving(false);
    }
  };

  const handleUnlinkLeetcode = async () => {
    if (!window.confirm('Are you sure you want to unlink your LeetCode profile?')) return;
    setSaving(true);
    try {
      await updateProfile({ leetcodeUsername: '' });
      setLeetcodeUsername('');
      setPreviewData(null);
      toast.success('Unlinked LeetCode profile');
    } catch (err) {
      toast.error('Failed to unlink: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'inherit' }}>
          Platforms Integration
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Connect your accounts on external coding platforms to display your achievements and stats
        </p>
      </motion.div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="platforms-grid">
        
        {/* LeetCode Integration Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="glass-card" 
          style={{ padding: '1.75rem', borderLeft: '4px solid #ffa116' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '42px', height: '42px', borderRadius: '10px', 
                background: 'linear-gradient(135deg, #ffa116 0%, #ff7a00 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: '800', fontSize: '1.25rem'
              }}>
                L
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '750', margin: 0 }}>LeetCode</h2>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Track solved questions, badges, and achievements</p>
              </div>
            </div>
            
            {profile.leetcodeUsername ? (
              <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.5rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <RiCheckDoubleLine /> LINKED
              </span>
            ) : (
              <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.5rem', borderRadius: '6px', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' }}>
                NOT CONNECTED
              </span>
            )}
          </div>

          <form onSubmit={handleLinkLeetcode} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                LeetCode Username
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <RiShieldUserLine style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g., mugesh_p"
                    value={leetcodeUsername}
                    onChange={e => setLeetcodeUsername(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.75rem' }}
                    disabled={verifying || saving}
                  />
                </div>
                
                {profile.leetcodeUsername && (
                  <button
                    type="button"
                    onClick={handleUnlinkLeetcode}
                    className="btn-secondary"
                    style={{ border: '1px solid #ef4444', color: '#ef4444', background: 'none', padding: '0 1rem' }}
                    disabled={verifying || saving}
                  >
                    <RiLinkUnlink style={{ fontSize: '1.1rem' }} /> Unlink
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #ffa116 0%, #ff7a00 100%)', boxShadow: '0 4px 16px rgba(255, 161, 22, 0.25)' }}
              disabled={verifying || saving}
            >
              {verifying ? (
                <>
                  <RiLoader5Line className="animate-spin" /> Verifying Profile…
                </>
              ) : saving ? (
                <>
                  <RiLoader5Line className="animate-spin" /> Linking Profile…
                </>
              ) : (
                <>
                  <RiLink /> Link LeetCode Profile
                </>
              )}
            </button>
          </form>

          {/* Verification Preview Data */}
          {previewData && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                borderRadius: '1rem',
                background: 'rgba(255, 161, 22, 0.05)',
                border: '1px solid rgba(255, 161, 22, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <p style={{ fontWeight: '750', fontSize: '0.85rem', color: '#ffa116' }}>Verification Successful!</p>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                  Solved: {previewData.solvedProblem} / {previewData.totalQuestions} questions
                </p>
              </div>
              <RiAwardLine style={{ fontSize: '2rem', color: '#ffa116' }} />
            </motion.div>
          )}
        </motion.div>
        
        {/* Placeholder for future platforms */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card" 
          style={{ padding: '1.75rem', opacity: 0.7, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '0.75rem', borderStyle: 'dashed' }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RiLink style={{ fontSize: '1.5rem', color: '#94a3b8' }} />
          </div>
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>More Platforms Coming Soon</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>We are working on integrations for GeeksforGeeks, HackerRank, GitHub and more.</p>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .platforms-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
