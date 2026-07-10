import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'react-toastify';
import {
  RiUserStarLine, RiCameraLine, RiSaveLine, RiMailLine,
  RiBriefcaseLine, RiShieldLine, RiLockLine,
} from 'react-icons/ri';

export default function AdminProfile() {
  const { adminProfile, updateAdminProfile, uploadAdminProfileImage } = useAdminAuth();
  const [name,        setName]        = useState('');
  const [designation, setDesignation] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [saving,       setSaving]      = useState(false);

  useEffect(() => {
    if (adminProfile) {
      setName(adminProfile.name || '');
      setDesignation(adminProfile.designation || '');
    }
  }, [adminProfile]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file.');
    setImgUploading(true);
    try {
      const url = await uploadAdminProfileImage(file);
      await updateAdminProfile({ profileImageUrl: url });
      toast.success('Profile photo updated! 📸');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image.');
    } finally {
      setImgUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required.');
    setSaving(true);
    try {
      await updateAdminProfile({ name: name.trim(), designation: designation.trim() });
      toast.success('Profile updated! ✅');
    } catch (err) {
      console.error(err); toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = adminProfile?.name
    ? adminProfile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
            <RiUserStarLine style={{ color: '#fff', fontSize: '1.2rem' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #e2e8f0, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Admin Profile
          </h1>
        </div>
      </motion.div>

      {/* Profile photo card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '1.5rem', overflow: 'hidden', backdropFilter: 'blur(16px)', marginBottom: '1.25rem' }}
      >
        {/* Banner */}
        <div style={{ height: '90px', background: 'linear-gradient(135deg, #4c1d95, #7c3aed 40%, #a855f7 70%, #6d28d9)', position: 'relative' }}>
          {[{ s:120,t:-35,r:15,o:0.14 }, { s:70,t:10,r:80,o:0.1 }].map((c,i) => (
            <div key={i} style={{ position: 'absolute', borderRadius: '50%', width: c.s, height: c.s, top: c.t, right: c.r, background: 'rgba(255,255,255,1)', opacity: c.o }} />
          ))}
        </div>

        <div style={{ padding: '0 1.75rem 1.75rem', position: 'relative' }}>
          {/* Avatar with upload */}
          <div style={{ position: 'relative', display: 'inline-block', marginTop: '-40px', marginBottom: '1rem' }}>
            {adminProfile?.profileImageUrl ? (
              <img src={adminProfile.profileImageUrl} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(10,6,20,0.9)', boxShadow: '0 8px 30px rgba(124,58,237,0.4)' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: '4px solid rgba(10,6,20,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', color: '#fff', boxShadow: '0 8px 30px rgba(124,58,237,0.4)' }}>
                {initials}
              </div>
            )}
            <label htmlFor="admin-photo-upload" style={{
              position: 'absolute', bottom: '2px', right: '2px',
              width: '26px', height: '26px', borderRadius: '50%',
              background: '#7c3aed', border: '2px solid rgba(10,6,20,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: imgUploading ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>
              {imgUploading
                ? <span style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                : <RiCameraLine style={{ color: '#fff', fontSize: '0.75rem' }} />
              }
            </label>
            <input id="admin-photo-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#e2e8f0', marginBottom: '0.2rem' }}>
            {adminProfile?.name || 'Admin User'}
          </h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.7rem', borderRadius: '99px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <RiShieldLine style={{ color: '#a78bfa', fontSize: '0.8rem' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#c4b5fd' }}>{adminProfile?.designation || 'Administrator'}</span>
          </div>
        </div>
      </motion.div>

      {/* Edit form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '1.25rem', padding: '1.75rem', backdropFilter: 'blur(12px)', marginBottom: '1.25rem' }}
      >
        <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>Edit Profile</h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <RiUserStarLine style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#6d28d9', fontSize: '1rem' }} />
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.75rem', color: '#e2e8f0', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
          {/* Designation */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Designation</label>
            <div style={{ position: 'relative' }}>
              <RiBriefcaseLine style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#6d28d9', fontSize: '1rem' }} />
              <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. HOD, Assistant Professor"
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.75rem', color: '#e2e8f0', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
          {/* Email — read-only */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Email (read-only)</label>
            <div style={{ position: 'relative' }}>
              <RiMailLine style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#4a3f5e', fontSize: '1rem' }} />
              <input type="email" value={adminProfile?.email || ''} readOnly
                style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.6rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '0.75rem', color: '#6d6a80', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <motion.button type="submit" disabled={saving} whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: saving ? 1 : 0.97 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', background: saving ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: '0.875rem', color: '#fff', fontWeight: '700', fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 16px rgba(124,58,237,0.35)', marginTop: '0.25rem' }}
          >
            {saving ? <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> : <><RiSaveLine /> Save Changes</>}
          </motion.button>
        </form>
      </motion.div>

      {/* Security note */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ display: 'flex', gap: '0.875rem', padding: '1rem 1.25rem', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '1rem' }}
      >
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RiLockLine style={{ color: '#a78bfa', fontSize: '1rem' }} />
        </div>
        <div>
          <p style={{ fontSize: '0.82rem', fontWeight: '700', color: '#c4b5fd', marginBottom: '0.2rem' }}>Password & Security</p>
          <p style={{ fontSize: '0.78rem', color: '#6d6a80', lineHeight: 1.5 }}>
            To change your password, go to Firebase Console → Authentication → and reset your admin account password.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
