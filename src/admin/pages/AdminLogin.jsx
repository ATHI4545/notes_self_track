import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine,
  RiShieldKeyholeLine,
} from 'react-icons/ri';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'react-toastify';

/* ── Animated background particles ─────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.8 + 0.3,
      dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.6 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0, width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

export default function AdminLogin() {
  const { adminLogin, isAdminLoggedIn } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  // If already logged in as admin, redirect
  useEffect(() => {
    if (isAdminLoggedIn) navigate('/admin/dashboard', { replace: true });
  }, [isAdminLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const res = await adminLogin(form);
    setLoading(false);
    if (res.success) {
      toast.success('Welcome, Admin! 🛡️');
      navigate('/admin/dashboard');
    } else {
      setErr(res.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0614 0%, #130d25 50%, #1a0a2e 100%)',
      padding: '2rem 1rem',
      position: 'relative', overflow: 'hidden',
    }}>
      <ParticleCanvas />

      {/* Glowing orbs */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.13) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 200 }}
            style={{
              width: '72px', height: '72px', borderRadius: '22px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 40px rgba(124,58,237,0.5)',
            }}
          >
            <RiShieldKeyholeLine style={{ color: '#fff', fontSize: '2rem' }} />
          </motion.div>

          <h1 style={{
            fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em',
            lineHeight: 1.2,
            background: 'linear-gradient(135deg, #e2e8f0 0%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Admin Portal
          </h1>
          <p style={{ color: '#7c6fa0', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            ARS SmartTrack — Restricted Access
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '1.5rem',
          padding: '2.25rem',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>

          {/* Error */}
          {err && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '1.25rem',
                color: '#fca5a5', fontSize: '0.875rem',
              }}
            >
              {err}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: '0.78rem', fontWeight: '600',
                color: '#7c6fa0', marginBottom: '0.5rem',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Admin Email
              </label>
              <div style={{ position: 'relative' }}>
                <RiMailLine style={{
                  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  color: '#6d28d9', fontSize: '1.1rem',
                }} />
                <input
                  id="admin-email"
                  type="email" required
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem',
                    background: 'rgba(139,92,246,0.07)',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: '0.75rem', color: '#e2e8f0',
                    fontSize: '0.9rem', outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(139,92,246,0.6)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(139,92,246,0.25)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: '0.78rem', fontWeight: '600',
                color: '#7c6fa0', marginBottom: '0.5rem',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <RiLockLine style={{
                  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  color: '#6d28d9', fontSize: '1.1rem',
                }} />
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'} required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.85rem 3rem 0.85rem 2.75rem',
                    background: 'rgba(139,92,246,0.07)',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: '0.75rem', color: '#e2e8f0',
                    fontSize: '0.9rem', outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(139,92,246,0.6)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(139,92,246,0.25)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6d28d9', fontSize: '1.1rem', padding: '0',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              id="admin-login-submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              style={{
                width: '100%', padding: '0.95rem',
                background: loading
                  ? 'rgba(124,58,237,0.4)'
                  : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                border: 'none', borderRadius: '0.875rem',
                color: '#fff', fontWeight: '700', fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(124,58,237,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontFamily: 'inherit',
                marginTop: '0.25rem',
              }}
            >
              {loading ? (
                <span style={{
                  width: '18px', height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
              ) : (
                <>
                  <RiShieldKeyholeLine style={{ fontSize: '1.1rem' }} />
                  Sign In as Admin
                </>
              )}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', color: '#4a3f6a', fontSize: '0.8rem', marginTop: '1.5rem' }}>
            🔒 Admin access only — no self-registration
          </p>
        </div>
      </motion.div>
    </div>
  );
}
