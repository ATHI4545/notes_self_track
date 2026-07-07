import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiGithubLine, RiStarLine, RiGitForkLine, RiRefreshLine,
  RiExternalLinkLine, RiCodeSSlashLine, RiTimeLine,
} from 'react-icons/ri';

const GITHUB_API = 'https://api.github.com';

// Language → colour map (top languages)
const LANG_COLORS = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', Swift: '#F05138',
  Kotlin: '#A97BFF', PHP: '#4F5D95', HTML: '#e34c26', CSS: '#563d7c',
  Shell: '#89e051', Dart: '#00B4AB', Vue: '#41b883', Svelte: '#ff3e00',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function GithubRepos({ username }) {
  const [repos, setRepos] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);

    const headers = { Accept: 'application/vnd.github+json' };

    Promise.all([
      fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`, { headers }).then(r => r.json()),
      fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`, { headers }).then(r => r.json()),
    ])
      .then(([userData, reposData]) => {
        if (userData.message) throw new Error(userData.message === 'Not Found' ? 'GitHub user not found.' : userData.message);
        if (!Array.isArray(reposData)) throw new Error('Failed to load repositories.');
        setUser(userData);
        setRepos(reposData.filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [username, refreshKey]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,0,0,0.06)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: '14px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', marginBottom: '0.5rem', width: '140px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: '11px', borderRadius: '4px', background: 'rgba(0,0,0,0.04)', width: '100px', animation: 'pulse 1.5s infinite' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: '130px', borderRadius: '12px', background: 'rgba(0,0,0,0.04)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
        <RiGithubLine style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '0.5rem' }} />
        <p style={{ fontWeight: '700', color: '#ef4444', fontSize: '0.9rem' }}>GitHub Fetch Failed</p>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{error}</p>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="btn-secondary"
          style={{ marginTop: '0.875rem', padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <RiRefreshLine /> Retry
        </button>
      </div>
    );
  }

  const filtered = repos.filter(r =>
    r.name.toLowerCase().includes(filter.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ padding: '1.5rem 1.75rem', borderLeft: '4px solid #238636', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* ── Profile header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img
            src={user?.avatar_url}
            alt={username}
            style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #238636', objectFit: 'cover', flexShrink: 0 }}
          />
          <div>
            <h3 style={{ fontWeight: '800', fontSize: '1.05rem', margin: 0, letterSpacing: '-0.01em' }}>
              {user?.name || username}
            </h3>
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.75rem', color: '#238636', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              @{username} <RiExternalLinkLine style={{ fontSize: '0.85rem' }} />
            </a>
            {user?.bio && (
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.15rem 0 0', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Repos', value: user?.public_repos },
            { label: 'Followers', value: user?.followers },
            { label: 'Following', value: user?.following },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '0.4rem 0.875rem', borderRadius: '10px',
              background: 'rgba(35, 134, 54, 0.07)', border: '1px solid rgba(35,134,54,0.15)',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: '800', lineHeight: 1.1 }}>{s.value?.toLocaleString()}</span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
            </div>
          ))}
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem', padding: '0.3rem', borderRadius: '6px', transition: 'color 0.2s', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = '#238636'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            title="Refresh"
          >
            <RiRefreshLine />
          </button>
        </div>
      </div>

      {/* ── Search / filter ────────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <RiCodeSSlashLine style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1rem' }} />
        <input
          type="text"
          placeholder="Search repositories…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '2.5rem', fontSize: '0.85rem', padding: '0.55rem 0.9rem 0.55rem 2.5rem' }}
        />
      </div>

      {/* ── Repo grid ──────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          No repositories match your search.
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
          }}>
            {filtered.map((repo, i) => {
              const langColor = LANG_COLORS[repo.language] || '#94a3b8';
              return (
                <motion.a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                    padding: '1rem 1.125rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(35,134,54,0.12)',
                    background: 'rgba(35,134,54,0.04)',
                    textDecoration: 'none', color: 'inherit',
                    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(35,134,54,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(35,134,54,0.35)';
                    e.currentTarget.style.background = 'rgba(35,134,54,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'rgba(35,134,54,0.12)';
                    e.currentTarget.style.background = 'rgba(35,134,54,0.04)';
                  }}
                >
                  {/* Repo name + external icon */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#238636', wordBreak: 'break-word', lineHeight: 1.3 }}>
                      {repo.name}
                    </span>
                    <RiExternalLinkLine style={{ color: '#94a3b8', fontSize: '0.85rem', flexShrink: 0, marginTop: '0.15rem' }} />
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', flex: 1, margin: 0,
                  }}>
                    {repo.description || 'No description provided.'}
                  </p>

                  {/* Topics */}
                  {repo.topics?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {repo.topics.slice(0, 4).map(t => (
                        <span key={t} style={{
                          fontSize: '0.65rem', fontWeight: '600',
                          padding: '0.15rem 0.45rem', borderRadius: '20px',
                          background: 'rgba(35,134,54,0.1)', color: '#238636',
                        }}>{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Footer — language · stars · forks · date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.72rem', color: '#94a3b8', flexWrap: 'wrap', marginTop: 'auto' }}>
                    {repo.language && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: langColor, flexShrink: 0 }} />
                        {repo.language}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <RiStarLine /> {repo.stargazers_count}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <RiGitForkLine /> {repo.forks_count}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}>
                      <RiTimeLine /> {formatDate(repo.updated_at)}
                    </span>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'right', margin: 0 }}>
        Showing {filtered.length} of {repos.length} original repos · Forks excluded
      </p>
    </motion.div>
  );
}
