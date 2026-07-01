import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function ProtectedLayout() {
  const { isLoggedIn, loading } = useAuth();

  // Wait for Firebase to resolve the auth state before deciding to redirect
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        {/* ARS SmartTrack logo */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', fontWeight: '900', color: '#fff',
          boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
        }}>
          A
        </div>

        {/* Spinner */}
        <div style={{
          width: '36px', height: '36px',
          border: '3px solid rgba(99,102,241,0.25)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', letterSpacing: '0.04em' }}>
          Loading ARS SmartTrack…
        </p>
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
