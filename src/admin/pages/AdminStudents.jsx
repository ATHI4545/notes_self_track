import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'react-toastify';
import {
  RiTeamLine, RiUserAddLine, RiSearchLine, RiCodeSSlashLine,
  RiGithubLine, RiLinkedinLine, RiDeleteBinLine, RiExternalLinkLine,
  RiMailLine, RiBookOpenLine, RiStarLine, RiTimerLine, RiCloseLine,
} from 'react-icons/ri';

function AddMenteeModal({ onClose, onAdded }) {
  const { addMentee } = useAdminAuth();
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErr(''); setLoading(true);
    const res = await addMentee(email.trim());
    setLoading(false);
    if (res.success) {
      toast.success(`✅ ${email} added as mentee!`);
      onAdded();
      onClose();
    } else {
      setErr(res.error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        style={{ background: 'rgba(15,10,30,0.98)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RiUserAddLine style={{ color: '#a855f7' }} /> Add Mentee
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
            <RiCloseLine />
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#7c6fa0', marginBottom: '1.25rem' }}>
          Enter the student's registered email address to add them as your mentee.
        </p>
        {err && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.85rem' }}>
            {err}
          </div>
        )}
        <form onSubmit={handleAdd}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <RiMailLine style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#6d28d9', fontSize: '1rem' }} />
            <input
              type="email" required value={email}
              placeholder="student@example.com"
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.6rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.75rem', color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: '0.75rem', color: '#fff', fontWeight: '700', fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {loading ? <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> : <><RiUserAddLine /> Add Mentee</>}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function StudentCard({ student, index, onRemove }) {
  const initials = student.name ? student.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : student.email?.slice(0, 2).toUpperCase() || '??';
  const colors = ['#7c3aed','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4'];
  const color  = colors[index % colors.length];

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '1.25rem', padding: '1.5rem', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
    >
      {/* Top */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '1rem' }}>
        {student.profileImageUrl ? (
          <img src={student.profileImageUrl} alt="" style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: `2px solid ${color}50` }} />
        ) : (
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0, background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '800', color }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '0.15rem' }}>{student.name || 'Unknown'}</p>
          <p style={{ fontSize: '0.75rem', color: '#7c6fa0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</p>
          {(student.course || student.cgpa) && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
              {student.course && <span style={{ fontSize: '0.68rem', color: '#a78bfa', background: 'rgba(139,92,246,0.12)', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>{student.course}</span>}
              {student.cgpa  && <span style={{ fontSize: '0.68rem', color: '#34d399', background: 'rgba(16,185,129,0.12)', padding: '0.15rem 0.5rem', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><RiStarLine /> {student.cgpa}</span>}
            </div>
          )}
        </div>
        <button onClick={() => onRemove(student.email)} title="Remove mentee" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a3f5e', fontSize: '1rem', display: 'flex', alignItems: 'center', padding: '0.25rem', borderRadius: '0.375rem', transition: 'color 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#4a3f5e'}
        >
          <RiDeleteBinLine />
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.625rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f59e0b' }}>{student.leetcodeSolved || 0}</p>
          <p style={{ fontSize: '0.65rem', color: '#92400e', fontWeight: '600' }}>LC Solved</p>
        </div>
        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.625rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#a78bfa' }}>{student.githubRepos || 0}</p>
          <p style={{ fontSize: '0.65rem', color: '#5b21b6', fontWeight: '600' }}>GH Repos</p>
        </div>
      </div>

      {/* Platform links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {[
          { icon: RiCodeSSlashLine, color: '#f59e0b', val: student.leetcodeUsername, href: student.leetcodeUsername ? `https://leetcode.com/${student.leetcodeUsername}` : null, label: 'LeetCode' },
          { icon: RiGithubLine,     color: '#a78bfa', val: student.githubUsername,   href: student.githubUsername   ? `https://github.com/${student.githubUsername}` : null,   label: 'GitHub'   },
          { icon: RiLinkedinLine,   color: '#38bdf8', val: student.linkedinUrl,      href: student.linkedinUrl,                                                                  label: 'LinkedIn' },
        ].map(({ icon: Icon, color: ic, val, href, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon style={{ color: ic, fontSize: '0.85rem', flexShrink: 0 }} />
            {val ? (
              href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: ic, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  {val} <RiExternalLinkLine style={{ fontSize: '0.68rem' }} />
                </a>
              ) : <span style={{ fontSize: '0.78rem', color: ic }}>{val}</span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#3d3356', fontStyle: 'italic' }}>Not linked</span>
            )}
          </div>
        ))}
      </div>

      {/* Active days */}
      {student.activeDaysCount > 0 && (
        <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#6d6a80' }}>
          <RiTimerLine /> {student.activeDaysCount} active day{student.activeDaysCount !== 1 ? 's' : ''} on platform
        </div>
      )}
    </motion.div>
  );
}

export default function AdminStudents() {
  const { adminProfile, fetchMenteesData, removeMentee } = useAdminAuth();
  const [mentees,   setMentees]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search,    setSearch]    = useState('');

  const loadMentees = async () => {
    setLoading(true);
    try {
      const data = await fetchMenteesData();
      setMentees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminProfile) loadMentees();
  }, [adminProfile]);

  const handleRemove = async (email) => {
    if (!confirm(`Remove ${email} from your mentees?`)) return;
    await removeMentee(email);
    setMentees(prev => prev.filter(s => s.email !== email));
    toast.success('Mentee removed.');
  };

  const filtered = mentees.filter(s => {
    const q = search.toLowerCase();
    return !q || (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
              <RiTeamLine style={{ color: '#fff', fontSize: '1.2rem' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #e2e8f0, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Student Progress
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#7c6fa0' }}>{adminProfile?.mentees?.length || 0} mentees</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: '0.875rem', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}
          >
            <RiUserAddLine /> Add Student
          </button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <RiSearchLine style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#7c6fa0', fontSize: '1.1rem' }} />
        <input
          type="text" value={search} placeholder="Search by name or email…"
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '0.875rem', color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.2)'; e.target.style.boxShadow = 'none'; }}
        />
      </motion.div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: '260px', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '1.25rem' }}>
          <RiTeamLine style={{ fontSize: '3rem', color: '#3d3356', marginBottom: '1rem' }} />
          <p style={{ color: '#7c6fa0', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {search ? 'No students match your search.' : 'No mentees yet. Add your first student!'}
          </p>
          {!search && (
            <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: '0.875rem', color: '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              <RiUserAddLine /> Add First Student
            </button>
          )}
        </div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          <AnimatePresence>
            {filtered.map((s, i) => (
              <StudentCard key={s.uid} student={s} index={i} onRemove={handleRemove} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && <AddMenteeModal onClose={() => setShowModal(false)} onAdded={loadMentees} />}
      </AnimatePresence>
    </div>
  );
}
