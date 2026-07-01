import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiMailLine, RiLockLine, RiUserLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Signup() {
  const { signup, AVATARS } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', avatar: '🧑‍💻' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const res = await signup(form);
    setLoading(false);
    if (res.success) {
      toast.success('Account created! Welcome to ARS SmartTrack 🎉');
      navigate('/dashboard');
    } else {
      setErr(res.error);
    }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
              fontSize: '1.75rem', fontWeight: '900', color: '#fff',
            }}
          >
            A
          </motion.div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Create account
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Start organizing your life with ARS SmartTrack
          </p>
        </div>

        {/* Card */}
        <div className="glass-dark" style={{ padding: '2rem 2.25rem' }}>
          {/* Error */}
          {err && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '1.25rem',
                color: '#fca5a5', fontSize: '0.875rem',
              }}
            >
              {err}
            </motion.div>
          )}

          {/* Avatar picker */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Choose your avatar
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {AVATARS.map(av => (
                <button
                  key={av} type="button"
                  onClick={() => setForm(p => ({ ...p, avatar: av }))}
                  style={{
                    width: '42px', height: '42px', borderRadius: '10px', fontSize: '1.25rem',
                    border: form.avatar === av ? '2px solid #6366f1' : '1.5px solid rgba(255,255,255,0.1)',
                    background: form.avatar === av ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    transform: form.avatar === av ? 'scale(1.12)' : 'scale(1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <RiUserLine style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem' }} />
                <input id="signup-name" type="text" required placeholder="John Doe"
                  value={form.name} onChange={set('name')} className="auth-input" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <RiMailLine style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem' }} />
                <input id="signup-email" type="email" required placeholder="you@example.com"
                  value={form.email} onChange={set('email')} className="auth-input" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <RiLockLine style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem' }} />
                <input id="signup-password" type={showPass ? 'text' : 'password'} required placeholder="Min. 6 characters"
                  value={form.password} onChange={set('password')} className="auth-input" style={{ paddingRight: '3rem' }} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} id="signup-submit"
              className="btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}>
              {loading
                ? <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                : 'Create Account ✨'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', fontWeight: '700', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
