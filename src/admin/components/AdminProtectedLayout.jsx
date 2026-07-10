import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminSidebar from './AdminSidebar';
import { RiShieldLine } from 'react-icons/ri';

function AdminLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '1.25rem',
      background: 'linear-gradient(135deg, #0a0614 0%, #130d25 50%, #1a0a2e 100%)',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '16px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
      }}>
        <RiShieldLine style={{ color: '#fff', fontSize: '1.75rem' }} />
      </div>
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid rgba(139,92,246,0.25)',
        borderTopColor: '#a855f7',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', letterSpacing: '0.04em' }}>
        Loading Admin Portal…
      </p>
    </div>
  );
}

export default function AdminProtectedLayout() {
  const { isAdminLoggedIn, loading } = useAdminAuth();

  if (loading) return <AdminLoader />;
  if (!isAdminLoggedIn) return <Navigate to="/admin/login" replace />;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0614 0%, #130d25 60%, #0f0a1e 100%)',
    }}>
      <AdminSidebar />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        minHeight: '100vh',
        padding: '2rem',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
