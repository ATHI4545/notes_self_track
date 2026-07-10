import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiDashboardLine, RiTeamLine, RiFileList3Line,
  RiUserStarLine, RiImageLine, RiSettings4Line,
  RiShieldLine, RiLogoutBoxLine, RiMenuLine, RiCloseLine,
} from 'react-icons/ri';
import { useAdminAuth } from '../context/AdminAuthContext';

const NAV_ITEMS = [
  { to: '/admin/dashboard',  icon: RiDashboardLine,  label: 'Dashboard'        },
  { to: '/admin/students',   icon: RiTeamLine,        label: 'Student Progress' },
  { to: '/admin/assessment', icon: RiFileList3Line,   label: 'Post Assessment'  },
  { to: '/admin/studentdb',  icon: RiImageLine,       label: 'Student DB'       },
  { to: '/admin/profile',    icon: RiUserStarLine,    label: 'Admin Profile'    },
  { to: '/admin/settings',   icon: RiSettings4Line,   label: 'Settings'         },
];

function SidebarContent({ onClose }) {
  const { adminProfile, adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await adminLogout();
    if (onClose) onClose();
    navigate('/admin/login');
  };

  const initials = adminProfile?.name
    ? adminProfile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1.5rem 1.25rem 1.25rem',
        borderBottom: '1px solid rgba(139,92,246,0.15)',
      }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
        }}>
          <RiShieldLine style={{ color: '#fff', fontSize: '1.2rem' }} />
        </div>
        <div>
          <span style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.01em', display: 'block' }}>
            Admin Portal
          </span>
          <span style={{ fontSize: '0.68rem', color: '#a78bfa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ARS SmartTrack
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.875rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.7rem',
              padding: '0.65rem 0.875rem', borderRadius: '0.75rem',
              fontWeight: '500', fontSize: '0.855rem',
              textDecoration: 'none', transition: 'all 0.18s ease',
              border: '1px solid transparent',
              ...(isActive ? {
                background: 'rgba(139,92,246,0.18)',
                color: '#c4b5fd',
                borderColor: 'rgba(139,92,246,0.3)',
                fontWeight: '600',
              } : { color: '#94a3b8' }),
            })}
          >
            <Icon style={{ fontSize: '1.15rem', flexShrink: 0 }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Admin info + Logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(139,92,246,0.15)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.65rem 0.875rem', borderRadius: '0.75rem',
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
        }}>
          {adminProfile?.profileImageUrl ? (
            <img
              src={adminProfile.profileImageUrl}
              alt="Admin"
              style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(139,92,246,0.4)' }}
            />
          ) : (
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: '700', color: '#fff',
            }}>
              {initials}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminProfile?.name || 'Admin'}
            </p>
            <p style={{ fontSize: '0.68rem', color: '#a78bfa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminProfile?.designation || 'Administrator'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', flexShrink: 0,
              padding: '0.25rem', borderRadius: '0.375rem', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <RiLogoutBoxLine />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="admin-sidebar" style={{
        width: '225px', flexShrink: 0, height: '100vh',
        position: 'sticky', top: 0,
        background: 'rgba(10, 6, 20, 0.95)',
        borderRight: '1px solid rgba(139,92,246,0.15)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        overflowY: 'auto', zIndex: 30, display: 'flex', flexDirection: 'column',
      }}>
        <SidebarContent />
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="admin-mobile-btn"
        style={{
          display: 'none', position: 'fixed', top: '1rem', left: '1rem', zIndex: 50,
          width: '42px', height: '42px', borderRadius: '10px', border: 'none',
          background: 'rgba(124,58,237,0.85)', backdropFilter: 'blur(8px)',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: '#fff', fontSize: '1.25rem',
        }}
      >
        <RiMenuLine />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{
                position: 'fixed', top: 0, left: 0, zIndex: 50,
                width: '225px', height: '100vh',
                background: 'rgba(10, 6, 20, 0.98)',
                borderRight: '1px solid rgba(139,92,246,0.2)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1.25rem', color: '#94a3b8',
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
          .admin-sidebar { display: none !important; }
          .admin-mobile-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
