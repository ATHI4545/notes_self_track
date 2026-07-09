import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiDashboardLine, RiTaskLine, RiCompass3Line, RiBarChartLine,
  RiTimerLine, RiUserLine, RiSettings4Line, RiMenuLine,
  RiCloseLine, RiMoonLine, RiSunLine, RiLogoutBoxLine,
  RiAwardLine, RiCodeSSlashLine, RiFileList3Line,
  RiTrophyLine, RiBookOpenLine,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
  { to: '/tasks', icon: RiTaskLine, label: 'Tasks' },
  { to: '/roadmap', icon: RiCompass3Line, label: 'Roadmap AI' },
  { to: '/analytics', icon: RiBarChartLine, label: 'Analytics' },
  { to: '/certificates', icon: RiAwardLine, label: 'Certificates' },
  { to: '/platforms', icon: RiCodeSSlashLine, label: 'Platforms' },
  { to: '/leaderboard', icon: RiTrophyLine, label: 'Leaderboard' },
  { to: '/resources', icon: RiBookOpenLine, label: 'Resources' },
  { to: '/programming-sheet', icon: RiFileList3Line, label: 'Prog. Sheet' },
  { to: '/profile', icon: RiUserLine, label: 'Profile' },
  { to: '/settings', icon: RiSettings4Line, label: 'Settings' },
];

const navLinkBase = {
  display: 'flex', alignItems: 'center', gap: '0.75rem',
  padding: '0.65rem 0.875rem', borderRadius: '0.75rem',
  fontWeight: '500', fontSize: '0.875rem',
  textDecoration: 'none', transition: 'all 0.18s ease',
  border: '1px solid transparent', cursor: 'pointer',
};

const navDefault = {
  color: '#64748b',
};

const navActive = {
  background: 'rgba(99,102,241,0.13)',
  color: '#6366f1',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(99,102,241,0.22)',
  fontWeight: '600',
};

function SidebarContent({ onClose }) {
  const { profile, logout } = useAuth();
  const { darkMode, applyDarkMode } = useTask();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1.375rem 1.25rem 1.25rem',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          padding: '2px',
        }}>
          <img
            src="/Logo.png"
            alt="Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
        <span className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
          ARS SmartTrack
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.875rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            style={({ isActive }) => ({ ...navLinkBase, ...(isActive ? navActive : navDefault) })}
          >
            <Icon style={{ fontSize: '1.2rem', flexShrink: 0 }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        {/* Dark mode toggle */}
        <button
          onClick={() => applyDarkMode(!darkMode)}
          style={{
            ...navLinkBase, ...navDefault,
            width: '100%', background: 'none', border: '1px solid transparent',
            marginBottom: '0.25rem',
          }}
        >
          {darkMode
            ? <RiSunLine style={{ fontSize: '1.2rem', color: '#f59e0b' }} />
            : <RiMoonLine style={{ fontSize: '1.2rem' }} />
          }
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* User profile */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.6rem 0.875rem', borderRadius: '0.75rem',
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
        }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{profile.avatar}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.name || 'User'}
            </p>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0.25rem', borderRadius: '0.375rem', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <RiLogoutBoxLine />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{
          display: 'none', position: 'fixed', top: '1rem', left: '1rem', zIndex: 50,
          width: '42px', height: '42px', borderRadius: '10px', border: 'none',
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: '#1e293b', fontSize: '1.25rem',
        }}
        id="mobile-menu-btn"
        className="mobile-menu-btn"
      >
        <RiMenuLine />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            />
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{
                position: 'fixed', top: 0, left: 0, zIndex: 50,
                width: '16rem', height: '100vh',
                background: 'rgba(255,255,255,0.96)',
                borderRight: '1px solid rgba(226,232,240,0.8)',
                boxShadow: '4px 0 30px rgba(0,0,0,0.12)',
              }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem', background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '8px',
                }}
              >
                <RiCloseLine />
              </button>
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 1023px) {
          .sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
