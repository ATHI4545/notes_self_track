import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  RiDashboardLine, RiTeamLine, RiFileList3Line, RiCodeSSlashLine,
  RiGithubLine, RiLinkedinLine, RiUserAddLine, RiArrowRightLine,
  RiCalendarLine, RiCheckboxCircleLine,
} from 'react-icons/ri';

function StatCard({ icon: Icon, label, value, color, to, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}30`,
        borderRadius: '1.25rem', padding: '1.5rem',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#7c6fa0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            {label}
          </p>
          <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#e2e8f0', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {value}
          </p>
        </div>
        <div style={{
          width: '46px', height: '46px', borderRadius: '12px',
          background: `${color}20`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon style={{ color, fontSize: '1.35rem' }} />
        </div>
      </div>
      {to && (
        <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.875rem', fontSize: '0.75rem', color, textDecoration: 'none', fontWeight: '600' }}>
          View all <RiArrowRightLine />
        </Link>
      )}
    </motion.div>
  );
}

function MenteeRow({ student, index }) {
  const initials = student.name
    ? student.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : student.email?.slice(0, 2).toUpperCase() || '??';
  const colors = ['#7c3aed','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899'];
  const color  = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 * index }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.75rem 1rem', borderRadius: '0.875rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(139,92,246,0.1)',
        marginBottom: '0.5rem',
      }}
    >
      {student.profileImageUrl ? (
        <img src={student.profileImageUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: `${color}25`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color }}>
          {initials}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {student.name || 'Student'}
        </p>
        <p style={{ fontSize: '0.72rem', color: '#7c6fa0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {student.email}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        {student.leetcodeUsername && <span style={{ padding: '0.2rem 0.45rem', borderRadius: '6px', background: 'rgba(245,158,11,0.15)', fontSize: '0.65rem', color: '#f59e0b', fontWeight: '700' }}>LC</span>}
        {student.githubUsername   && <span style={{ padding: '0.2rem 0.45rem', borderRadius: '6px', background: 'rgba(139,92,246,0.15)', fontSize: '0.65rem', color: '#a78bfa', fontWeight: '700' }}>GH</span>}
        {student.linkedinUrl      && <span style={{ padding: '0.2rem 0.45rem', borderRadius: '6px', background: 'rgba(14,165,233,0.15)', fontSize: '0.65rem', color: '#38bdf8', fontWeight: '700' }}>LI</span>}
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { adminProfile, fetchMenteesData } = useAdminAuth();
  const [mentees,     setMentees]     = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [students, asmSnap] = await Promise.all([
          fetchMenteesData(),
          (async () => {
            if (!adminProfile?.uid) return { docs: [] };
            const q = query(
              collection(db, 'assessments', adminProfile.uid, 'posts'),
              orderBy('createdAt', 'desc'),
              limit(3)
            );
            return getDocs(q);
          })(),
        ]);
        setMentees(students);
        setAssessments(asmSnap.docs?.map(d => ({ id: d.id, ...d.data() })) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (adminProfile) load();
  }, [adminProfile]);

  const total        = adminProfile?.mentees?.length || 0;
  const withLeetcode = mentees.filter(s => s.leetcodeUsername).length;
  const withGithub   = mentees.filter(s => s.githubUsername).length;
  const withLinkedin = mentees.filter(s => s.linkedinUrl).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
            <RiDashboardLine style={{ color: '#fff', fontSize: '1.2rem' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #e2e8f0 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Dashboard
          </h1>
        </div>
        <p style={{ color: '#7c6fa0', fontSize: '0.9rem' }}>
          {greeting()}, <strong style={{ color: '#c4b5fd' }}>{adminProfile?.name || 'Admin'}</strong>
          {adminProfile?.designation ? ` · ${adminProfile.designation}` : ''}
        </p>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={RiTeamLine}       label="My Mentees"       value={total}        color="#a855f7" to="/admin/students" delay={0.05} />
        <StatCard icon={RiCodeSSlashLine} label="LeetCode Linked"  value={withLeetcode} color="#f59e0b" delay={0.1} />
        <StatCard icon={RiGithubLine}     label="GitHub Linked"    value={withGithub}   color="#8b5cf6" delay={0.15} />
        <StatCard icon={RiLinkedinLine}   label="LinkedIn Linked"  value={withLinkedin} color="#0ea5e9" delay={0.2} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Mentees list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '1.25rem', padding: '1.5rem', backdropFilter: 'blur(12px)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RiUserAddLine style={{ color: '#a855f7' }} /> My Mentees
            </h2>
            <Link to="/admin/students" style={{ fontSize: '0.75rem', color: '#a78bfa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>
              Manage <RiArrowRightLine />
            </Link>
          </div>
          {loading ? (
            <p style={{ color: '#7c6fa0', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem' }}>Loading…</p>
          ) : mentees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#7c6fa0', fontSize: '0.875rem', marginBottom: '0.75rem' }}>No mentees yet</p>
              <Link to="/admin/students" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
                <RiUserAddLine /> Add Students
              </Link>
            </div>
          ) : (
            mentees.slice(0, 5).map((s, i) => <MenteeRow key={s.uid} student={s} index={i} />)
          )}
        </motion.div>

        {/* Recent assessments */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '1.25rem', padding: '1.5rem', backdropFilter: 'blur(12px)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RiFileList3Line style={{ color: '#a855f7' }} /> Recent Assessments
            </h2>
            <Link to="/admin/assessment" style={{ fontSize: '0.75rem', color: '#a78bfa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>
              View all <RiArrowRightLine />
            </Link>
          </div>
          {loading ? (
            <p style={{ color: '#7c6fa0', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem' }}>Loading…</p>
          ) : assessments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#7c6fa0', fontSize: '0.875rem', marginBottom: '0.75rem' }}>No assessments posted yet</p>
              <Link to="/admin/assessment" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
                <RiFileList3Line /> Create Assessment
              </Link>
            </div>
          ) : assessments.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}
              style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)', marginBottom: '0.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '0.2rem' }}>{a.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: '#7c6fa0', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <RiCheckboxCircleLine /> {a.questions?.length || 0} questions
                    </span>
                    {a.dueDate && (
                      <span style={{ fontSize: '0.7rem', color: '#7c6fa0', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <RiCalendarLine /> Due {a.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style>{`@media (max-width: 768px) { .dash-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
