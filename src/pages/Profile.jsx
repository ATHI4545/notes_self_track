import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  RiEdit2Line, RiSaveLine, RiCloseLine,
  RiCalendarLine, RiMailLine, RiUserLine,
  RiCheckboxCircleLine, RiTimeLine, RiFireLine,
  RiListCheck, RiMedalLine, RiExternalLinkLine,
  RiFileTextLine, RiImageAddLine, RiBookOpenLine,
  RiStarLine, RiBriefcaseLine, RiShieldUserLine,
  RiUser3Line,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { computeStats } from '../utils/helpers';
import { format } from 'date-fns';

// ── Compress image to a small base64 string (stays well under Firestore 1 MB limit)
function compressImage(file, maxW = 300, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width, maxW / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Field input row ─────────────────────────────────────────────────────────
function Field({ label, icon: Icon, iconColor = '#6366f1', children }) {
  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem',
      }}>
        <Icon style={{ color: iconColor, fontSize: '0.9rem' }} />
        {label}
      </label>
      {children}
    </div>
  );
}

// Helper to ensure external links are absolute URLs
const ensureAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^(https?:\/\/|data:)/i.test(url)) {
    return url;
  }
  return `https://${url}`;
};

// ── Read-only info row ──────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, color = '#6366f1', href }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '0.875rem 1.125rem', borderRadius: '0.875rem',
      background: `${color}07`,
      borderWidth: '1px', borderStyle: 'solid', borderColor: `${color}18`,
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
        background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ color, fontSize: '1.1rem' }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>
          {label}
        </p>
        {href ? (
          <a href={ensureAbsoluteUrl(href)} target="_blank" rel="noopener noreferrer" style={{ fontWeight: '700', color, fontSize: '0.875rem', textDecoration: 'none', wordBreak: 'break-all' }}>
            {value || '—'}
          </a>
        ) : (
          <p style={{ fontWeight: '700', color: 'inherit', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value || '—'}
          </p>
        )}
      </div>
    </div>
  );
}


export default function Profile() {
  const { profile, updateProfile, uploadResumePdf, AVATARS } = useAuth();
  const { tasks, streak } = useTask();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);  // PDF upload in progress
  const [imgPreview, setImgPreview] = useState(null);   // local blob for instant image preview
  const [pdfFile, setPdfFile] = useState(null);   // pending PDF File to upload
  const fileRef = useRef(null);
  const pdfRef = useRef(null);

  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
    avatar: profile.avatar || '🧑‍💻',
    profileImageUrl: profile.profileImageUrl || '',
    resumeUrl: profile.resumeUrl || '',
    portfolioUrl: profile.portfolioUrl || '',
    cgpa: profile.cgpa || '',
    course: profile.course || '',
    dob: profile.dob || '',
  });

  const stats = computeStats(tasks);
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // ── Open edit mode ────────────────────────────────────────────────────────
  const openEdit = () => {
    setForm({
      name: profile.name || '',
      email: profile.email || '',
      avatar: profile.avatar || '🧑‍💻',
      profileImageUrl: profile.profileImageUrl || '',
      resumeUrl: profile.resumeUrl || '',
      portfolioUrl: profile.portfolioUrl || '',
      cgpa: profile.cgpa || '',
      course: profile.course || '',
      dob: profile.dob || '',
    });
    setImgPreview(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setImgPreview(null);
    setPdfFile(null);
  };

  // ── Image file selected: instant preview ────────────────────────────────
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }
    // Show instant blob preview in hero + edit preview
    const blobUrl = URL.createObjectURL(file);
    setImgPreview(blobUrl);
    // Store file reference in form for compression on Save
    setForm(p => ({ ...p, _pendingFile: file, profileImageUrl: '' }));
  };

  // ── PDF file selected: upload to Cloudinary, and save URL to Firestore immediately ────────────────
  const handlePdfFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please select a PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Resume PDF must be under 10 MB');
      return;
    }

    setUploading(true);
    setPdfFile(file);
    const pdfToastId = 'pdf-upload';
    toast.info('☁️ Saving resume PDF to database…', { autoClose: false, toastId: pdfToastId });
    try {
      const pdfUrl = await uploadResumePdf(file);
      // Immediately update Firestore database
      await updateProfile({ resumeUrl: pdfUrl });
      
      // Update local state
      setForm(p => ({ ...p, resumeUrl: pdfUrl }));
      toast.dismiss(pdfToastId);
      toast.success('📄 Resume uploaded and saved to database!');
    } catch (pdfErr) {
      toast.dismiss(pdfToastId);
      toast.error('PDF upload failed: ' + pdfErr.message);
      setPdfFile(null);
    } finally {
      setUploading(false);
    }
  };

  // ── Save: compress image + save fields to Firestore ────────────────────────
  const save = async () => {
    if (!form.name.trim()) { toast.error('Name cannot be empty'); return; }
    if (form.cgpa && (isNaN(form.cgpa) || +form.cgpa < 0 || +form.cgpa > 10)) {
      toast.error('CGPA must be between 0 and 10'); return;
    }

    setSaving(true);
    try {
      const finalForm = { ...form };
      delete finalForm._pendingFile;

      // 1. Compress and save image if a new one was picked
      if (form._pendingFile) {
        toast.info('🖼️ Processing image…', { autoClose: 2000, toastId: 'img-proc' });
        const compressed = await compressImage(form._pendingFile, 300, 0.75);
        finalForm.profileImageUrl = compressed;
        toast.dismiss('img-proc');
      }

      // 2. Save all fields to Firestore
      await updateProfile(finalForm);
      toast.success('✅ Profile saved!');

      setForm(prev => ({ ...prev, profileImageUrl: finalForm.profileImageUrl, resumeUrl: finalForm.resumeUrl, _pendingFile: undefined }));
      setEditing(false);
      setImgPreview(null);   // hero now reads from profile.profileImageUrl via context
      setPdfFile(null);
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const STAT_ITEMS = [
    { label: 'Total Tasks', value: stats.total, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: RiListCheck },
    { label: 'Completed', value: stats.completed, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: RiCheckboxCircleLine },
    { label: 'Pending', value: stats.pending, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: RiTimeLine },
    { label: 'Day Streak 🔥', value: streak, color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: RiFireLine },
  ];

  // displayImg: show local blob while editing, otherwise use saved profile URL
  const displayImg = imgPreview || profile.profileImageUrl;

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'inherit' }}>Profile</h1>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>Manage your account and academic details</p>
      </motion.div>

      {/* ── Two-column grid ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gap: '1.75rem', alignItems: 'start' }} className="profile-grid">

        {/* ══ LEFT COLUMN ══════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Hero banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="profile-hero"
          >
            {/* Profile image or emoji avatar */}
            {displayImg ? (
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: '3px solid rgba(255,255,255,0.5)',
                margin: '0 auto 1rem', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)', flexShrink: 0,
              }}>
                <img
                  src={displayImg}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setImgPreview(null)}
                />
              </div>
            ) : (
              <div className="profile-avatar-ring">{profile.avatar || form.avatar || '🧑‍💻'}</div>
            )}

            {/* View mode info */}
            {!editing && (
              <>
                <h2 style={{ fontSize: '1.625rem', fontWeight: '800', marginBottom: '0.25rem', position: 'relative' }}>
                  {profile.name || 'No name set'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', position: 'relative' }}>
                  {profile.email}
                </p>
                {profile.course && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    marginTop: '0.75rem', padding: '0.35rem 0.9rem', borderRadius: '999px',
                    background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                    fontSize: '0.8rem', fontWeight: '600', color: '#fff', position: 'relative',
                  }}>
                    <RiBookOpenLine /> {profile.course}
                  </div>
                )}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  marginTop: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '999px',
                  background: 'rgba(255,255,255,0.12)',
                  fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.85)', position: 'relative',
                }}>
                  <RiShieldUserLine /> Active Member
                </div>
              </>
            )}

            {/* Avatar picker when editing */}
            {editing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ position: 'relative', width: '100%' }}
              >
                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.625rem' }}>
                  Choose an emoji avatar
                </p>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {AVATARS.map(av => (
                    <button
                      key={av} type="button"
                      onClick={() => setForm(p => ({ ...p, avatar: av }))}
                      style={{
                        fontSize: '1.5rem', width: '46px', height: '46px', borderRadius: '12px',
                        background: form.avatar === av ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)',
                        border: form.avatar === av ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                        transform: form.avatar === av ? 'scale(1.12)' : 'scale(1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >{av}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Completion progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card" style={{ padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RiMedalLine style={{ color: '#f59e0b', fontSize: '1.3rem' }} />
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Task Completion</span>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#6366f1' }}>{completionRate}%</span>
            </div>
            <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>
              <span>{stats.completed} completed</span><span>{stats.total} total</span>
            </div>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card" style={{ padding: '1.75rem' }}
          >
            <h2 style={{ fontWeight: '700', fontSize: '1rem', color: 'inherit', marginBottom: '1.25rem' }}>Your Stats</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {STAT_ITEMS.map(({ label, value, color, bg, icon: Icon }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  style={{
                    padding: '1.25rem 1rem', borderRadius: '0.875rem',
                    background: bg, borderWidth: '1px', borderStyle: 'solid', borderColor: `${color}25`,
                    display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'default',
                  }}
                >
                  <Icon style={{ color, fontSize: '1.3rem' }} />
                  <p style={{ fontSize: '2rem', fontWeight: '800', color, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* ── Profile card ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card" style={{ padding: '2rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: '700', fontSize: '1.05rem', color: 'inherit', letterSpacing: '-0.01em' }}>
                {editing ? 'Edit Profile' : 'Account Info'}
              </h2>
              {!editing && (
                <button onClick={openEdit} className="btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
                  <RiEdit2Line /> Edit
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {editing ? (
                /* ── EDIT FORM ───────────────────────────────────────────────── */
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
                >

                  {/* Profile image upload */}
                  <Field label="Profile Photo" icon={RiImageAddLine} iconColor="#8b5cf6">
                    <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                      {/* Preview circle */}
                      <div
                        onClick={() => fileRef.current?.click()}
                        style={{
                          width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                          border: '2.5px dashed #6366f1', cursor: 'pointer', overflow: 'hidden',
                          background: 'rgba(99,102,241,0.06)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.14)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                      >
                        {imgPreview || form.profileImageUrl ? (
                          <img
                            src={imgPreview || form.profileImageUrl}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <RiUser3Line style={{ fontSize: '2rem', color: '#6366f1' }} />
                        )}
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="btn-secondary"
                          style={{ padding: '0.45rem 0.875rem', fontSize: '0.82rem', width: 'fit-content' }}
                        >
                          <RiImageAddLine />
                          {form._pendingFile ? 'Change Photo' : 'Upload Photo'}
                        </button>

                        {form._pendingFile ? (
                          <p style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '600' }}>
                            📸 {form._pendingFile.name} — ready to save
                          </p>
                        ) : (
                          <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Max 10 MB · JPG, PNG, WebP · auto-compressed</p>
                        )}

                        <input
                          ref={fileRef} type="file" accept="image/*"
                          style={{ display: 'none' }} onChange={handleImageFile}
                        />
                      </div>
                    </div>

                    {/* URL paste option */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Or paste URL:</span>
                      <input
                        value={imgPreview ? '' : form.profileImageUrl}
                        onChange={e => {
                          setImgPreview(null);
                          setForm(p => ({ ...p, profileImageUrl: e.target.value, _pendingFile: undefined }));
                        }}
                        className="input-field"
                        placeholder="https://..."
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                      />
                    </div>
                  </Field>

                  {/* Name */}
                  <Field label="Full Name" icon={RiUserLine}>
                    <div style={{ position: 'relative' }}>
                      <RiUserLine style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="input-field" placeholder="Your full name" style={{ paddingLeft: '2.75rem' }} />
                    </div>
                  </Field>

                  {/* DOB */}
                  <Field label="Date of Birth" icon={RiCalendarLine} iconColor="#10b981">
                    <input type="date" value={form.dob}
                      onChange={e => setForm(p => ({ ...p, dob: e.target.value }))}
                      className="input-field" max={new Date().toISOString().split('T')[0]} />
                  </Field>

                  {/* Course */}
                  <Field label="Course / Degree" icon={RiBookOpenLine} iconColor="#8b5cf6">
                    <div style={{ position: 'relative' }}>
                      <RiBookOpenLine style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))}
                        className="input-field" placeholder="e.g. B.Tech Computer Science" style={{ paddingLeft: '2.75rem' }} />
                    </div>
                  </Field>

                  {/* CGPA */}
                  <Field label="CGPA (out of 10)" icon={RiStarLine} iconColor="#f59e0b">
                    <div style={{ position: 'relative' }}>
                      <RiStarLine style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="number" step="0.01" min="0" max="10"
                        value={form.cgpa} onChange={e => setForm(p => ({ ...p, cgpa: e.target.value }))}
                        className="input-field" placeholder="e.g. 8.75" style={{ paddingLeft: '2.75rem' }} />
                    </div>
                  </Field>

                  {/* Portfolio */}
                  <Field label="Portfolio Link" icon={RiBriefcaseLine} iconColor="#06b6d4">
                    <div style={{ position: 'relative' }}>
                      <RiExternalLinkLine style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input value={form.portfolioUrl} onChange={e => setForm(p => ({ ...p, portfolioUrl: e.target.value }))}
                        className="input-field" placeholder="https://yourportfolio.com" style={{ paddingLeft: '2.75rem' }} />
                    </div>
                  </Field>

                  {/* Resume — PDF upload or URL */}
                  <Field label="Resume (PDF)" icon={RiFileTextLine} iconColor="#ef4444">
                    {/* File picker row */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => pdfRef.current?.click()}
                        className="btn-secondary"
                        style={{ padding: '0.45rem 0.875rem', fontSize: '0.82rem', whiteSpace: 'nowrap', borderColor: '#ef4444', color: '#ef4444' }}
                        disabled={uploading}
                      >
                        <RiFileTextLine /> {pdfFile ? 'Change PDF' : 'Upload PDF'}
                      </button>

                      {pdfFile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                          <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📄 {pdfFile.name}
                          </p>
                          <p style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: '600' }}>Saved to Database!</p>
                        </div>
                      ) : form.resumeUrl ? (
                        <a href={ensureAbsoluteUrl(form.resumeUrl)} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: '600', textDecoration: 'underline' }}>
                          View current resume ↗
                        </a>
                      ) : (
                        <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PDF only · max 10 MB</p>
                      )}

                      <input ref={pdfRef} type="file" accept="application/pdf,.pdf"
                        style={{ display: 'none' }} onChange={handlePdfFile} />
                    </div>

                    {/* Fallback — paste URL */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Or paste URL:</span>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <RiFileTextLine style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }} />
                        <input
                          value={pdfFile ? '' : form.resumeUrl}
                          onChange={e => { setPdfFile(null); setForm(p => ({ ...p, resumeUrl: e.target.value })); }}
                          className="input-field"
                          placeholder="https://drive.google.com/..."
                          style={{ paddingLeft: '2.25rem', padding: '0.45rem 0.75rem 0.45rem 2.25rem', fontSize: '0.82rem' }}
                        />
                      </div>
                    </div>
                  </Field>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                    <button onClick={cancel} className="btn-secondary" style={{ flex: 1 }} disabled={saving || uploading}>
                      <RiCloseLine /> Cancel
                    </button>
                    <button onClick={save} className="btn-primary" style={{ flex: 1 }} disabled={saving || uploading}>
                      {uploading ? '☁️ Uploading PDF…' : saving ? '⏳ Saving…' : <><RiSaveLine /> Save Profile</>}
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── VIEW MODE ───────────────────────────────────────────────── */
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                  <InfoRow icon={RiUserLine} label="Full Name" value={profile.name} color="#6366f1" />
                  <InfoRow icon={RiMailLine} label="Email" value={profile.email} color="#06b6d4" />
                  <InfoRow
                    icon={RiCalendarLine} label="Date of Birth"
                    value={profile.dob ? format(new Date(profile.dob), 'MMMM d, yyyy') : ''}
                    color="#10b981"
                  />
                  <InfoRow icon={RiBookOpenLine} label="Course" value={profile.course} color="#8b5cf6" />
                  <InfoRow icon={RiStarLine} label="CGPA" value={profile.cgpa ? `${profile.cgpa} / 10` : ''} color="#f59e0b" />
                  <InfoRow
                    icon={RiBriefcaseLine} label="Portfolio"
                    value={profile.portfolioUrl || ''} color="#06b6d4"
                    href={profile.portfolioUrl || undefined}
                  />
                  <InfoRow
                    icon={RiFileTextLine} label="Resume"
                    value={profile.resumeUrl ? '📄 View Resume' : ''} color="#ef4444"
                    href={profile.resumeUrl || undefined}
                  />
                  <InfoRow
                    icon={RiCalendarLine} label="Member Since"
                    value={profile.joinedDate ? format(new Date(profile.joinedDate), 'MMMM d, yyyy') : ''}
                    color="#94a3b8"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <style>{`
        .profile-grid { grid-template-columns: 1fr; }
        @media (min-width: 900px)  { .profile-grid { grid-template-columns: 360px 1fr; } }
        @media (min-width: 1200px) { .profile-grid { grid-template-columns: 400px 1fr; } }
      `}</style>
    </div>
  );
}
