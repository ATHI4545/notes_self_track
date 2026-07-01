import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  RiMoonLine, RiSunLine, RiBellLine, RiBellFill,
  RiDownloadLine, RiUploadLine, RiDeleteBin6Line,
  RiUserLine, RiPaletteLine, RiDatabase2Line, RiShieldLine,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { exportToJSON, importFromJSON } from '../utils/helpers';

function Toggle({ value, onChange }) {
  return (
    <button
      className="toggle-track"
      onClick={() => onChange(!value)}
      style={{ background: value ? '#6366f1' : 'rgba(148,163,184,0.4)' }}
      aria-label="Toggle"
    >
      <span
        className="toggle-thumb"
        style={{ transform: value ? 'translateX(24px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function Section({ icon: Icon, title, iconColor = '#6366f1', children, delay = 0, danger = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card settings-section"
      style={danger ? { borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.25)' } : {}}
    >
      <div
        className="settings-section-header"
        style={{ color: danger ? '#ef4444' : '#6366f1' }}
      >
        <Icon style={{ fontSize: '1.1rem' }} />
        {title}
      </div>
      {children}
    </motion.div>
  );
}

function Row({ icon: Icon, label, description, iconBg, iconColor = '#6366f1', children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-left">
        <div
          className="settings-row-icon"
          style={{ background: iconBg || 'rgba(99,102,241,0.1)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.15)', color: iconColor }}
        >
          <Icon />
        </div>
        <div>
          <p className="settings-row-label">{label}</p>
          {description && <p className="settings-row-desc">{description}</p>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export default function Settings() {
  const { profile, updateProfile } = useAuth();
  const { tasks, categories, settings, updateSettings, deleteAllTasks, importTasks, darkMode, applyDarkMode } = useTask();
  const [username, setUsername] = useState(profile.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef(null);

  const handleExport = () => {
    exportToJSON({ tasks, categories, exportedAt: new Date().toISOString() }, 'ars-smarttrack-backup.json');
    toast.success('📥 Data exported successfully!');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromJSON(file);
      importTasks(data);
    } catch (err) {
      toast.error('Failed to import: ' + err.message);
    }
    e.target.value = '';
  };

  const handleDeleteAll = () => {
    if (confirmDelete) {
      deleteAllTasks();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
    }
  };

  const saveUsername = async () => {
    if (!username.trim()) return;
    await updateProfile({ name: username.trim() });
    toast.success('✅ Username updated!');
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '48rem' }}>
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'inherit' }}>
          Settings
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Manage your preferences and account
        </p>
      </motion.div>

      {/* Appearance */}
      <Section icon={RiPaletteLine} title="Appearance" delay={0.04}>
        <Row
          icon={darkMode ? RiMoonLine : RiSunLine}
          label="Dark Mode"
          description="Switch between light and dark theme"
          iconBg={darkMode ? 'rgba(139,92,246,0.12)' : 'rgba(245,158,11,0.12)'}
          iconColor={darkMode ? '#8b5cf6' : '#f59e0b'}
        >
          <Toggle value={darkMode} onChange={applyDarkMode} />
        </Row>
      </Section>

      {/* Notifications */}
      <Section icon={RiBellLine} title="Notifications" delay={0.08}>
        <Row
          icon={settings.notifications ? RiBellFill : RiBellLine}
          label="Toast Notifications"
          description="Show popups for task actions"
          iconBg="rgba(99,102,241,0.1)"
        >
          <Toggle value={settings.notifications} onChange={v => updateSettings({ notifications: v })} />
        </Row>
      </Section>

      {/* Account */}
      <Section icon={RiUserLine} title="Account" delay={0.12}>
        <Row
          icon={RiUserLine}
          label="Display Name"
          description="Update your display name across the app"
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#10b981"
        >
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveUsername()}
              className="input-field"
              placeholder="Your name"
              style={{ width: '160px', padding: '0.55rem 0.875rem', fontSize: '0.875rem' }}
            />
            <button onClick={saveUsername} className="btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
              Save
            </button>
          </div>
        </Row>
      </Section>

      {/* Data Management */}
      <Section icon={RiDatabase2Line} title="Data Management" delay={0.16}>
        <Row
          icon={RiDownloadLine}
          label="Export Data"
          description="Download your tasks as a JSON backup file"
          iconBg="rgba(6,182,212,0.1)"
          iconColor="#06b6d4"
        >
          <button onClick={handleExport} className="btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
            <RiDownloadLine /> Export
          </button>
        </Row>
        <Row
          icon={RiUploadLine}
          label="Import Data"
          description="Restore tasks from a JSON backup file"
          iconBg="rgba(245,158,11,0.1)"
          iconColor="#f59e0b"
        >
          <button onClick={() => fileRef.current?.click()} className="btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
            <RiUploadLine /> Import
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </Row>
      </Section>

      {/* Danger Zone */}
      <Section icon={RiShieldLine} title="Danger Zone" delay={0.2} danger>
        <Row
          icon={RiDeleteBin6Line}
          label="Delete All Tasks"
          description="Permanently remove all tasks. This cannot be undone!"
          iconBg="rgba(239,68,68,0.1)"
          iconColor="#ef4444"
        >
          <button
            onClick={handleDeleteAll}
            style={{
              padding: '0.55rem 1.1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              background: confirmDelete
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'rgba(239,68,68,0.1)',
              color: confirmDelete ? '#fff' : '#ef4444',
              boxShadow: confirmDelete ? '0 4px 16px rgba(239,68,68,0.35)' : 'none',
              animation: confirmDelete ? 'blobPulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            {confirmDelete ? '⚠️ Confirm Delete?' : 'Delete All'}
          </button>
        </Row>
      </Section>
    </div>
  );
}
