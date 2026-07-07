import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiAwardLine, RiShieldUserLine, RiLink, RiLinkUnlink,
  RiLoader5Line, RiCheckDoubleLine, RiGithubLine,
  RiLinkedinBoxLine, RiExternalLinkLine, RiUserLine,
  RiPlugLine, RiGlobalLine, RiDatabaseLine,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import CodingStats from '../components/CodingStats';
import GithubRepos from '../components/GithubRepos';


const ALFA_API = 'https://alfa-leetcode-api.onrender.com';
const GITHUB_API = 'https://api.github.com';
const PLATFORM_TIMEOUT_MS = 30000;

// Fetch with timeout for platform linking
async function platformFetch(url, timeoutMs = PLATFORM_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error('Request timed out. The API is starting up — please try again in a moment.');
    throw err;
  }
}

async function platformFetchWithRetry(url, retries = 3, delayMs = 4000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await platformFetch(url);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delayMs * attempt));
    }
  }
}

// ── LinkedIn URL → slug helper ────────────────────────────────────────────────
function parseLinkedinUsername(raw) {
  try {
    const cleaned = raw.trim();
    // full URL (with or without protocol)
    const withProto = cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
    if (cleaned.includes('linkedin.com')) {
      const url = new URL(withProto);
      const parts = url.pathname.replace(/\/$/, '').split('/');
      const inIdx = parts.indexOf('in');
      if (inIdx !== -1 && parts[inIdx + 1]) return decodeURIComponent(parts[inIdx + 1]);
    }
    // plain slug — strip leading @
    return cleaned.replace(/^@/, '').replace(/^\//, '');
  } catch { return raw.trim().replace(/^@/, ''); }
}

// ── Validate any reasonable LinkedIn input ────────────────────────────────────
function isValidLinkedinInput(raw) {
  const s = raw.trim();
  if (!s) return false;
  // contains linkedin domain
  if (s.includes('linkedin.com')) return true;
  // plain slug: letters, numbers, hyphens, underscores, dots (LinkedIn allows all of these)
  if (/^[a-zA-Z0-9._\-]{2,}$/.test(s)) return true;
  return false;
}

// ── Direct Firestore write for LinkedIn (guaranteed, no auth patch needed) ────
async function saveLinkedinToDB(linkedinUrl) {
  if (!auth.currentUser) throw new Error('Not authenticated');
  const userRef = doc(db, 'users', auth.currentUser.uid);
  await setDoc(userRef, { linkedinUrl, updatedAt: new Date().toISOString() }, { merge: true });
}

// ── LinkedIn profile card (shown in stats box) ────────────────────────────────
function LinkedinCard({ url }) {
  const slug = parseLinkedinUsername(url);
  const profileUrl = `https://www.linkedin.com/in/${slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        padding: '0.25rem',
      }}
    >
      {/* Profile card */}
      <div style={{
        borderRadius: '1.25rem',
        border: '1px solid rgba(10,102,194,0.2)',
        background: 'linear-gradient(135deg, rgba(10,102,194,0.06) 0%, rgba(10,102,194,0.02) 100%)',
        padding: '2rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '1.25rem', textAlign: 'center',
      }}>
        {/* LinkedIn logo circle */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #0a66c2 0%, #0d4f96 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.25rem', color: '#fff',
          boxShadow: '0 8px 24px rgba(10,102,194,0.35)',
        }}>
          <RiLinkedinBoxLine />
        </div>

        {/* Name / slug */}
        <div>
          <h3 style={{ fontWeight: '800', fontSize: '1.15rem', margin: 0, letterSpacing: '-0.01em' }}>
            {slug}
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            LinkedIn Profile Connected
          </p>
        </div>

        {/* Info pills */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: <RiGlobalLine />, text: 'Public Profile' },
            { icon: <RiUserLine />, text: `@${slug}` },
          ].map(p => (
            <span key={p.text} style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.78rem', fontWeight: '600',
              padding: '0.35rem 0.875rem', borderRadius: '20px',
              background: 'rgba(10,102,194,0.08)', color: '#0a66c2',
              border: '1px solid rgba(10,102,194,0.15)',
            }}>
              {p.icon} {p.text}
            </span>
          ))}
        </div>

        {/* CTA button */}
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.7rem 1.75rem', borderRadius: '10px',
            background: 'linear-gradient(135deg, #0a66c2 0%, #0d4f96 100%)',
            color: '#fff', fontWeight: '700', fontSize: '0.9rem',
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(10,102,194,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(10,102,194,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,102,194,0.3)'; }}
        >
          <RiLinkedinBoxLine style={{ fontSize: '1.1rem' }} />
          View LinkedIn Profile
          <RiExternalLinkLine style={{ fontSize: '0.85rem' }} />
        </a>
      </div>

      {/* Note about API limitations */}
      <div style={{
        padding: '0.875rem 1.125rem',
        borderRadius: '10px',
        background: 'rgba(148,163,184,0.05)',
        border: '1px solid rgba(148,163,184,0.1)',
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
          LinkedIn's public API does not expose profile data (connections, skills, experience)
          to third-party apps without OAuth approval. Your profile URL is saved and you can visit
          it directly from here.
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Platforms() {
  const { profile, updateProfile } = useAuth();

  // ── Active tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(
    profile.leetcodeUsername ? 'leetcode' :
      profile.githubUsername ? 'github' :
        profile.linkedinUrl ? 'linkedin' : 'leetcode'
  );

  // ── LeetCode state ─────────────────────────────────────────────────────────
  const [leetcodeUsername, setLeetcodeUsername] = useState(profile.leetcodeUsername || '');
  const [lcSaving, setLcSaving] = useState(false);
  const [lcVerifying, setLcVerifying] = useState(false);
  const [lcPreview, setLcPreview] = useState(null);

  // ── GitHub state ───────────────────────────────────────────────────────────
  const [githubUsername, setGithubUsername] = useState(profile.githubUsername || '');
  const [ghSaving, setGhSaving] = useState(false);
  const [ghVerifying, setGhVerifying] = useState(false);
  const [ghPreview, setGhPreview] = useState(null);

  // ── LinkedIn state ─────────────────────────────────────────────────────────
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl || '');
  const [liSaving, setLiSaving] = useState(false);
  const [liPreview, setLiPreview] = useState(null);

  // ── Linked platforms list ──────────────────────────────────────────────────
  const linkedPlatforms = [
    profile.leetcodeUsername && { key: 'leetcode', label: 'LeetCode', color: '#ffa116' },
    profile.githubUsername && { key: 'github', label: 'GitHub', color: '#238636' },
    profile.linkedinUrl && { key: 'linkedin', label: 'LinkedIn', color: '#0a66c2' },
  ].filter(Boolean);

  // ── LeetCode handlers ──────────────────────────────────────────────────────
  const handleLinkLeetcode = async (e) => {
    e.preventDefault();
    if (!leetcodeUsername.trim()) { toast.error('Please enter a LeetCode username'); return; }
    setLcVerifying(true); setLcPreview(null);
    const target = leetcodeUsername.trim();
    try {
      toast.info('⏳ Verifying LeetCode profile…', { autoClose: false, toastId: 'lc-verify' });
      const res = await platformFetchWithRetry(`${ALFA_API}/userProfile/${encodeURIComponent(target)}`);
      if (!res.ok) throw new Error(`LeetCode API returned ${res.status}. Please try again.`);
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0]?.message || 'User not found.');
      if (json.totalSolved === undefined && json.totalQuestions === undefined)
        throw new Error('LeetCode profile not found. Check the username.');
      setLcPreview({ solved: json.totalSolved || 0, total: json.totalQuestions || 0 });
      setLcSaving(true);
      await updateProfile({ leetcodeUsername: target });
      setActiveTab('leetcode');
      toast.dismiss('lc-verify');
      toast.success('🔗 LeetCode linked!');
    } catch (err) {
      toast.dismiss('lc-verify');
      toast.error(err.message || 'Verification failed.');
    }
    finally { setLcVerifying(false); setLcSaving(false); }
  };

  const handleUnlinkLeetcode = async () => {
    if (!window.confirm('Unlink LeetCode profile?')) return;
    setLcSaving(true);
    try {
      await updateProfile({ leetcodeUsername: '' });
      setLeetcodeUsername(''); setLcPreview(null);
      toast.success('LeetCode unlinked');
    } catch (err) { toast.error('Failed: ' + err.message); }
    finally { setLcSaving(false); }
  };

  // ── GitHub handlers ────────────────────────────────────────────────────────
  const handleLinkGithub = async (e) => {
    e.preventDefault();
    if (!githubUsername.trim()) { toast.error('Please enter a GitHub username'); return; }
    setGhVerifying(true); setGhPreview(null);
    const target = githubUsername.trim();
    try {
      const res = await fetch(`${GITHUB_API}/users/${encodeURIComponent(target)}`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error(res.status === 404 ? 'GitHub user not found.' : 'GitHub API error.');
      const json = await res.json();
      setGhPreview({ name: json.name || target, repos: json.public_repos, followers: json.followers, avatar: json.avatar_url });
      setGhSaving(true);
      await updateProfile({ githubUsername: target });
      setActiveTab('github');
      toast.success('🐙 GitHub linked!');
    } catch (err) { toast.error(err.message || 'Verification failed.'); }
    finally { setGhVerifying(false); setGhSaving(false); }
  };

  const handleUnlinkGithub = async () => {
    if (!window.confirm('Unlink GitHub profile?')) return;
    setGhSaving(true);
    try {
      await updateProfile({ githubUsername: '' });
      setGithubUsername(''); setGhPreview(null);
      toast.success('GitHub unlinked');
    } catch (err) { toast.error('Failed: ' + err.message); }
    finally { setGhSaving(false); }
  };

  // ── LinkedIn handlers ──────────────────────────────────────────────────────
  const handleLinkLinkedin = async (e) => {
    e.preventDefault();
    const raw = linkedinUrl.trim();

    if (!raw) {
      toast.error('Please enter your LinkedIn profile URL or username');
      return;
    }

    if (!isValidLinkedinInput(raw)) {
      toast.error('Enter a valid LinkedIn URL (e.g. linkedin.com/in/yourname) or your LinkedIn username');
      return;
    }

    setLiSaving(true);
    try {
      const slug = parseLinkedinUsername(raw);
      if (!slug) throw new Error('Could not extract a LinkedIn username from what you entered.');

      const canonicalUrl = `https://www.linkedin.com/in/${slug}`;

      // 1️⃣ Direct Firestore write — guaranteed save regardless of anything else
      await saveLinkedinToDB(canonicalUrl);

      // 2️⃣ Also update via context so React state + any other fields stay in sync
      await updateProfile({ linkedinUrl: canonicalUrl });

      // 3️⃣ Update local UI state
      setLinkedinUrl(canonicalUrl);
      setLiPreview(slug);
      setActiveTab('linkedin');
      toast.success('💼 LinkedIn profile saved to database!');
    } catch (err) {
      console.error('LinkedIn save error:', err);
      toast.error('Save failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLiSaving(false);
    }
  };

  const handleUnlinkLinkedin = async () => {
    if (!window.confirm('Unlink LinkedIn profile?')) return;
    setLiSaving(true);
    try {
      await updateProfile({ linkedinUrl: '' });
      setLinkedinUrl(''); setLiPreview(null);
      toast.success('LinkedIn unlinked');
    } catch (err) { toast.error('Failed: ' + err.message); }
    finally { setLiSaving(false); }
  };

  const statusBadge = (linked) => linked
    ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' }
    : { background: 'rgba(148,163,184,0.1)', color: '#94a3b8' };

  // ── Tab icon helper ────────────────────────────────────────────────────────
  const TabIcon = ({ k }) => {
    if (k === 'leetcode') return <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#ffa116', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: '800', flexShrink: 0 }}>L</span>;
    if (k === 'github') return <RiGithubLine style={{ fontSize: '1rem' }} />;
    if (k === 'linkedin') return <RiLinkedinBoxLine style={{ fontSize: '1rem' }} />;
    return null;
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
          Platforms Integration
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Connect your accounts to display achievements, stats, and projects in one place
        </p>
      </motion.div>

      {/* ── Unified stats box ────────────────────────────────────────────────── */}
      {linkedPlatforms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          {/* Tab bar */}
          <div style={{
            display: 'flex', alignItems: 'stretch',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(0,0,0,0.02)',
            padding: '0 1.25rem',
            gap: '0.25rem',
          }}>
            {linkedPlatforms.map(p => (
              <button
                key={p.key}
                onClick={() => setActiveTab(p.key)}
                style={{
                  padding: '0.875rem 1.125rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === p.key ? '700' : '500',
                  color: activeTab === p.key ? p.color : '#94a3b8',
                  borderBottom: activeTab === p.key ? `2.5px solid ${p.color}` : '2.5px solid transparent',
                  marginBottom: '-1px',
                  transition: 'color 0.2s, border-color 0.2s',
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <TabIcon k={p.key} />
                {p.label}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '0.25rem' }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: '700',
                padding: '0.2rem 0.6rem', borderRadius: '20px',
                background: 'rgba(16,185,129,0.1)', color: '#10b981',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                <RiCheckDoubleLine /> {linkedPlatforms.length} connected
              </span>
            </div>
          </div>

          {/* Tab content */}
          <div style={{ padding: '1.5rem 1.75rem' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'leetcode' && profile.leetcodeUsername && (
                <motion.div key="lc" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}>
                  <CodingStats />
                </motion.div>
              )}
              {activeTab === 'github' && profile.githubUsername && (
                <motion.div key="gh" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}>
                  <GithubRepos username={profile.githubUsername} />
                </motion.div>
              )}
              {activeTab === 'linkedin' && profile.linkedinUrl && (
                <motion.div key="li" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}>
                  <LinkedinCard url={profile.linkedinUrl} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Manage connections ───────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
          <RiPlugLine /> Manage Connections
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }} className="platforms-grid">

          {/* ── LeetCode ───────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ffa116' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#ffa116 0%,#ff7a00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '1.1rem' }}>L</div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '750', margin: 0 }}>LeetCode</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>Track solved questions &amp; badges</p>
                </div>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.2rem', ...statusBadge(profile.leetcodeUsername) }}>
                {profile.leetcodeUsername ? <><RiCheckDoubleLine /> LINKED</> : 'NOT CONNECTED'}
              </span>
            </div>
            <form onSubmit={handleLinkLeetcode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <RiShieldUserLine style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem' }} />
                  <input type="text" required placeholder="LeetCode username" value={leetcodeUsername} onChange={e => setLeetcodeUsername(e.target.value)} className="input-field" style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }} disabled={lcVerifying || lcSaving} />
                </div>
                {profile.leetcodeUsername && (
                  <button type="button" onClick={handleUnlinkLeetcode} className="btn-secondary" style={{ border: '1px solid #ef4444', color: '#ef4444', background: 'none', padding: '0 0.875rem', fontSize: '0.82rem' }} disabled={lcVerifying || lcSaving}>
                    <RiLinkUnlink /> Unlink
                  </button>
                )}
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0.65rem', background: 'linear-gradient(135deg,#ffa116 0%,#ff7a00 100%)', boxShadow: '0 4px 14px rgba(255,161,22,0.2)', fontSize: '0.875rem' }} disabled={lcVerifying || lcSaving}>
                {lcVerifying ? <><RiLoader5Line className="animate-spin" /> Verifying…</> : lcSaving ? <><RiLoader5Line className="animate-spin" /> Saving…</> : <><RiLink /> {profile.leetcodeUsername ? 'Update' : 'Link'} LeetCode</>}
              </button>
            </form>
            {lcPreview && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255,161,22,0.06)', border: '1px solid rgba(255,161,22,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><p style={{ fontWeight: '700', fontSize: '0.8rem', color: '#ffa116' }}>✓ Verified!</p><p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>{lcPreview.solved} / {lcPreview.total} solved</p></div>
                <RiAwardLine style={{ fontSize: '1.75rem', color: '#ffa116' }} />
              </motion.div>
            )}
          </motion.div>

          {/* ── GitHub ─────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #238636' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#238636 0%,#1a6b28 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.3rem' }}><RiGithubLine /></div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '750', margin: 0 }}>GitHub</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>Showcase projects &amp; repositories</p>
                </div>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.2rem', ...statusBadge(profile.githubUsername) }}>
                {profile.githubUsername ? <><RiCheckDoubleLine /> LINKED</> : 'NOT CONNECTED'}
              </span>
            </div>
            <form onSubmit={handleLinkGithub} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <RiGithubLine style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem' }} />
                  <input type="text" required placeholder="GitHub username" value={githubUsername} onChange={e => setGithubUsername(e.target.value)} className="input-field" style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }} disabled={ghVerifying || ghSaving} />
                </div>
                {profile.githubUsername && (
                  <button type="button" onClick={handleUnlinkGithub} className="btn-secondary" style={{ border: '1px solid #ef4444', color: '#ef4444', background: 'none', padding: '0 0.875rem', fontSize: '0.82rem' }} disabled={ghVerifying || ghSaving}>
                    <RiLinkUnlink /> Unlink
                  </button>
                )}
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0.65rem', background: 'linear-gradient(135deg,#238636 0%,#1a6b28 100%)', boxShadow: '0 4px 14px rgba(35,134,54,0.2)', fontSize: '0.875rem' }} disabled={ghVerifying || ghSaving}>
                {ghVerifying ? <><RiLoader5Line className="animate-spin" /> Verifying…</> : ghSaving ? <><RiLoader5Line className="animate-spin" /> Saving…</> : <><RiGithubLine /> {profile.githubUsername ? 'Update' : 'Link'} GitHub</>}
              </button>
            </form>
            {ghPreview && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(35,134,54,0.06)', border: '1px solid rgba(35,134,54,0.15)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {ghPreview.avatar && <img src={ghPreview.avatar} alt={ghPreview.name} style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #238636' }} />}
                <div style={{ flex: 1 }}><p style={{ fontWeight: '700', fontSize: '0.8rem', color: '#238636' }}>✓ Verified!</p><p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>{ghPreview.repos} repos · {ghPreview.followers} followers</p></div>
                <RiGithubLine style={{ fontSize: '1.75rem', color: '#238636' }} />
              </motion.div>
            )}
          </motion.div>

          {/* ── LinkedIn ───────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #0a66c2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#0a66c2 0%,#0d4f96 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem' }}><RiLinkedinBoxLine /></div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '750', margin: 0 }}>LinkedIn</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>Link your professional profile</p>
                </div>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.2rem', ...statusBadge(profile.linkedinUrl) }}>
                {profile.linkedinUrl ? <><RiCheckDoubleLine /> LINKED</> : 'NOT CONNECTED'}
              </span>
            </div>
            <form onSubmit={handleLinkLinkedin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <RiLinkedinBoxLine style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem' }} />
                  <input
                    type="text" required
                    placeholder="linkedin.com/in/yourname"
                    value={linkedinUrl}
                    onChange={e => setLinkedinUrl(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
                    disabled={liSaving}
                  />
                </div>
                {profile.linkedinUrl && (
                  <button type="button" onClick={handleUnlinkLinkedin} className="btn-secondary" style={{ border: '1px solid #ef4444', color: '#ef4444', background: 'none', padding: '0 0.875rem', fontSize: '0.82rem' }} disabled={liSaving}>
                    <RiLinkUnlink /> Unlink
                  </button>
                )}
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '0.65rem', background: 'linear-gradient(135deg,#0a66c2 0%,#0d4f96 100%)', boxShadow: '0 4px 14px rgba(10,102,194,0.2)', fontSize: '0.875rem' }} disabled={liSaving}>
                {liSaving ? <><RiLoader5Line className="animate-spin" /> Saving…</> : <><RiLinkedinBoxLine /> {profile.linkedinUrl ? 'Update' : 'Link'} LinkedIn</>}
              </button>
            </form>
            {liPreview && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(10,102,194,0.06)', border: '1px solid rgba(10,102,194,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><p style={{ fontWeight: '700', fontSize: '0.8rem', color: '#0a66c2' }}>✓ Profile Saved!</p><p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>@{liPreview}</p></div>
                <RiLinkedinBoxLine style={{ fontSize: '1.75rem', color: '#0a66c2' }} />
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .platforms-grid { grid-template-columns: 1fr 1fr 1fr !important; }
        }
        @media (max-width: 767px) {
          .platforms-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
