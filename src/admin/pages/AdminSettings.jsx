import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'react-toastify';
import {
  RiSettings4Line, RiUserStarLine, RiBriefcaseLine, RiSaveLine,
  RiDeleteBin2Line, RiAlertLine,
} from 'react-icons/ri';

export default function AdminSettings() {
  const { adminProfile, updateAdminProfile, removeMentee } = useAdminAuth();
  const [name,        setName]        = useState('');
  const [designation, setDesignation] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [clearing,    setClearing]    = useState(false);

  useEffect(() => {
    if (adminProfile) {
      setName(adminProfile.name || '');
      setDesignation(adminProfile.designation || '');
    }
  }, [adminProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required.');
    setSaving(true);
    try {
      await updateAdminProfile({ name: name.trim(), designation: designation.trim() });
      toast.success('Settings saved ✅');
    } catch (err) {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearMentees = async () => {
    if (!confirm(`This will remove ALL ${adminProfile?.mentees?.length || 0} mentees from your list. Are you sure?`)) return;
    setClearing(true);
    try {
      const mentees = [...(adminProfile?.mentees || [])];
      for (const email of mentees) await removeMentee(email);
      toast.success('All mentees cleared.');
    } catch (err) {
      toast.error('Failed to clear mentees.');
    } finally {
      setClearing(false);
    }
  };

  const Field = ({ label, icon: Icon, value, onChange, placeholder }) => (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#6d28d9', fontSize: '1rem' }} />
        <input type="text" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.75rem', color: '#e2e8f0', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
            <RiSettings4Line style={{ color: '#fff', fontSize: '1.2rem' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #e2e8f0, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Settings
          </h1>
        </div>
      </motion.div>

      {/* General settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '1.25rem', padding: '1.75rem', backdropFilter: 'blur(12px)', marginBottom: '1.25rem' }}
      >
        <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>General</h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Display Name"  icon={RiUserStarLine}    value={name}        onChange={setName}        placeholder="Your full name" />
          <Field label="Designation"   icon={RiBriefcaseLine}   value={designation} onChange={setDesignation} placeholder="e.g. HOD, Assistant Professor" />
          <motion.button type="submit" disabled={saving} whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.97 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', background: saving ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: '0.875rem', color: '#fff', fontWeight: '700', fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 16px rgba(124,58,237,0.3)', marginTop: '0.25rem' }}
          >
            {saving ? <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> : <><RiSaveLine /> Save Settings</>}
          </motion.button>
        </form>
      </motion.div>

      {/* Mentee stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '1.25rem', padding: '1.75rem', backdropFilter: 'blur(12px)', marginBottom: '1.25rem' }}
      >
        <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>Mentee Overview</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '0.875rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <div>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#e2e8f0', lineHeight: 1 }}>{adminProfile?.mentees?.length || 0}</p>
            <p style={{ fontSize: '0.8rem', color: '#7c6fa0', marginTop: '0.2rem' }}>Total mentees connected</p>
          </div>
          <div style={{ fontSize: '2.5rem' }}>👨‍🎓</div>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#6d6a80', marginTop: '0.875rem', lineHeight: 1.5 }}>
          Mentees are students connected to your account by their email. You can add or remove them from the <strong style={{ color: '#a78bfa' }}>Student Progress</strong> page.
        </p>
      </motion.div>

      {/* Danger zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '1.25rem', padding: '1.75rem', backdropFilter: 'blur(12px)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <RiAlertLine style={{ color: '#ef4444', fontSize: '1.1rem' }} />
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Danger Zone</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.88rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '0.2rem' }}>Clear All Mentees</p>
            <p style={{ fontSize: '0.78rem', color: '#7c6fa0' }}>Remove all {adminProfile?.mentees?.length || 0} mentees from your list. This cannot be undone.</p>
          </div>
          <button onClick={handleClearMentees} disabled={clearing || !adminProfile?.mentees?.length}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', borderRadius: '0.75rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontWeight: '600', fontSize: '0.82rem',
              cursor: (clearing || !adminProfile?.mentees?.length) ? 'not-allowed' : 'pointer',
              opacity: !adminProfile?.mentees?.length ? 0.5 : 1,
              fontFamily: 'inherit', transition: 'background 0.2s', flexShrink: 0,
            }}
            onMouseEnter={e => { if (adminProfile?.mentees?.length) e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          >
            {clearing ? <span style={{ width: '14px', height: '14px', border: '2px solid rgba(248,113,113,0.3)', borderTopColor: '#f87171', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> : <RiDeleteBin2Line />}
            Clear All
          </button>
        </div>
      </motion.div>
    </div>
  );
}
