import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  RiImageLine, RiUserLine, RiMailLine, RiBookOpenLine,
  RiStarLine, RiSearchLine, RiExternalLinkLine, RiCloseLine,
  RiCodeSSlashLine, RiGithubLine, RiLinkedinLine, RiTimerLine,
  RiFileTextLine, RiGlobalLine,
} from 'react-icons/ri';

const ensureAbsoluteUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

function StudentModal({ student, onClose }) {
  if (!student) return null;
  const initials = student.name ? student.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        style={{ background: 'rgba(15,10,30,0.98)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '1.5rem', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.6)' }}
      >
        {/* Banner */}
        <div style={{ height: '80px', background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #a855f7)', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <RiCloseLine />
          </button>
        </div>
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          {/* Header Row — Shift only the Avatar up to avoid cutting off name */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', position: 'relative' }}>
            {student.profileImageUrl ? (
              <img src={student.profileImageUrl} alt="" style={{ width: '72px', height: '72px', borderRadius: '16px', objectFit: 'cover', border: '4px solid rgba(10,6,20,0.95)', flexShrink: 0, marginTop: '-36px', zIndex: 10 }} />
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: '4px solid rgba(10,6,20,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '800', color: '#fff', flexShrink: 0, marginTop: '-36px', zIndex: 10 }}>
                {initials}
              </div>
            )}
            <div style={{ minWidth: 0, paddingTop: '0.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#e2e8f0', marginBottom: '0.15rem', lineHeight: 1.2 }}>{student.name || 'Unknown'}</h2>
              <p style={{ fontSize: '0.78rem', color: '#7c6fa0' }}>{student.email}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { label: 'Course',   val: student.course,         color: '#a78bfa' },
              { label: 'CGPA',     val: student.cgpa,           color: '#34d399' },
              { label: 'LC Solved',val: student.leetcodeSolved, color: '#f59e0b' },
              { label: 'GH Repos', val: student.githubRepos,    color: '#8b5cf6' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ padding: '0.625rem 0.875rem', borderRadius: '0.75rem', background: `${color}10`, border: `1px solid ${color}25` }}>
                <p style={{ fontSize: '0.65rem', color: '#7c6fa0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{label}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color }}>{val || '—'}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: RiCodeSSlashLine, color: '#f59e0b', val: student.leetcodeUsername, href: student.leetcodeUsername ? `https://leetcode.com/${student.leetcodeUsername}` : null, label: 'LeetCode' },
              { icon: RiGithubLine,     color: '#a78bfa', val: student.githubUsername,   href: student.githubUsername   ? `https://github.com/${student.githubUsername}` : null,   label: 'GitHub' },
              { icon: RiLinkedinLine,   color: '#38bdf8', val: student.linkedinUrl,      href: student.linkedinUrl ? ensureAbsoluteUrl(student.linkedinUrl) : null,                  label: 'LinkedIn' },
            ].map(({ icon: Icon, color, val, href, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', background: `${color}08`, border: `1px solid ${color}20` }}>
                <Icon style={{ color, fontSize: '1rem', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: '#7c6fa0', fontWeight: '600', minWidth: '60px' }}>{label}</span>
                {val ? (
                  href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', flex: 1 }}>
                      {val} <RiExternalLinkLine style={{ fontSize: '0.7rem' }} />
                    </a>
                  ) : <span style={{ fontSize: '0.82rem', color, flex: 1 }}>{val}</span>
                ) : <span style={{ fontSize: '0.78rem', color: '#3d3356', fontStyle: 'italic' }}>Not linked</span>}
              </div>
            ))}

            {/* Resume Link */}
            {student.resumeUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <RiFileTextLine style={{ color: '#f87171', fontSize: '1rem', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: '#7c6fa0', fontWeight: '600', minWidth: '60px' }}>Resume</span>
                <a href={ensureAbsoluteUrl(student.resumeUrl)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: '#f87171', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', flex: 1, fontWeight: '700' }}>
                  View PDF Resume <RiExternalLinkLine style={{ fontSize: '0.7rem' }} />
                </a>
              </div>
            )}

            {/* Portfolio Link */}
            {student.portfolioUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <RiGlobalLine style={{ color: '#34d399', fontSize: '1rem', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: '#7c6fa0', fontWeight: '600', minWidth: '60px' }}>Portfolio</span>
                <a href={ensureAbsoluteUrl(student.portfolioUrl)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: '#34d399', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', flex: 1, fontWeight: '700' }}>
                  Visit Portfolio Website <RiExternalLinkLine style={{ fontSize: '0.7rem' }} />
                </a>
              </div>
            )}
          </div>

          {student.activeDaysCount > 0 && (
            <p style={{ marginTop: '0.875rem', fontSize: '0.75rem', color: '#6d6a80', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <RiTimerLine /> {student.activeDaysCount} active day{student.activeDaysCount !== 1 ? 's' : ''} on platform
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminStudentDB() {
  const { adminProfile, fetchMenteesData } = useAdminAuth();
  const [mentees,  setMentees]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!adminProfile) return;
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
    load();
  }, [adminProfile]);

  const filtered = mentees.filter(s => {
    const q = search.toLowerCase();
    return !q || (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.course || '').toLowerCase().includes(q);
  });

  const colors = ['#7c3aed','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4'];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
            <RiImageLine style={{ color: '#fff', fontSize: '1.2rem' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #e2e8f0, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Student DB
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#7c6fa0' }}>Photos and profiles of your mentees</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ position: 'relative', marginBottom: '1.75rem' }}>
        <RiSearchLine style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#7c6fa0', fontSize: '1.1rem' }} />
        <input
          type="text" value={search} placeholder="Search by name, email, or course…"
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.85rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '0.875rem', color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.2)'; e.target.style.boxShadow = 'none'; }}
        />
      </motion.div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ height: '220px', borderRadius: '1rem', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '1.25rem' }}>
          <RiImageLine style={{ fontSize: '3rem', color: '#3d3356', marginBottom: '1rem' }} />
          <p style={{ color: '#7c6fa0' }}>{search ? 'No students match your search.' : 'No mentees in your Student DB yet.'}</p>
        </div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          <AnimatePresence>
            {filtered.map((student, i) => {
              const initials = student.name ? student.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
              const color    = colors[i % colors.length];
              return (
                <motion.div
                  key={student.uid} layout
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  whileHover={{ scale: 1.03, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
                  onClick={() => setSelected(student)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '1rem', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                >
                  {/* Photo area */}
                  <div style={{ height: '140px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
                    {student.profileImageUrl ? (
                      <img src={student.profileImageUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `${color}25`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', fontWeight: '800', color }}>
                          {initials}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: '#4a3f6a', fontStyle: 'italic' }}>No photo</span>
                      </div>
                    )}
                    {/* Platform badges overlay */}
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {student.leetcodeUsername && <span style={{ padding: '0.15rem 0.4rem', borderRadius: '6px', background: 'rgba(0,0,0,0.65)', fontSize: '0.6rem', color: '#f59e0b', fontWeight: '700', backdropFilter: 'blur(4px)' }}>LC</span>}
                      {student.githubUsername   && <span style={{ padding: '0.15rem 0.4rem', borderRadius: '6px', background: 'rgba(0,0,0,0.65)', fontSize: '0.6rem', color: '#a78bfa', fontWeight: '700', backdropFilter: 'blur(4px)' }}>GH</span>}
                      {student.linkedinUrl      && <span style={{ padding: '0.15rem 0.4rem', borderRadius: '6px', background: 'rgba(0,0,0,0.65)', fontSize: '0.6rem', color: '#38bdf8', fontWeight: '700', backdropFilter: 'blur(4px)' }}>LI</span>}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '0.875rem' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.2rem' }}>
                      {student.name || 'Unknown'}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#7c6fa0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.4rem' }}>
                      {student.email}
                    </p>
                    {student.course && (
                      <span style={{ fontSize: '0.65rem', color: '#a78bfa', background: 'rgba(139,92,246,0.12)', padding: '0.15rem 0.45rem', borderRadius: '99px' }}>
                        {student.course}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && <StudentModal student={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
