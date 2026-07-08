import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiRobotLine, RiCodeBoxLine, RiBriefcaseLine,
  RiExternalLinkLine, RiArrowRightLine, RiSparklingLine,
  RiGlobalLine,
} from 'react-icons/ri';

const RESOURCES = [
  {
    id: 'ai-tools',
    name: 'All AI Tools',
    url: 'https://db88qorl3uvv.trickle.host/',
    description: 'Curated collection of the best AI tools for developers, designers, and creators.',
    icon: RiRobotLine,
    emoji: '🤖',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
    glowColor: 'rgba(99,102,241,0.35)',
    tag: 'AI & Productivity',
    tagColor: '#6366f1',
    tagBg: 'rgba(99,102,241,0.1)',
    stats: [
      { label: 'Tools Listed', value: '100+' },
      { label: 'Categories', value: '15+' },
      { label: 'Free Tools', value: '60%' },
    ],
  },
  {
    id: 'projects',
    name: 'All Projects',
    url: 'https://www.nxtwave.co.in/academy/project-gallery-2',
    description: 'Explore real-world student projects from NxtWave Academy — get inspired and showcase your work.',
    icon: RiCodeBoxLine,
    emoji: '🚀',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%)',
    glowColor: 'rgba(14,165,233,0.35)',
    tag: 'NxtWave Projects',
    tagColor: '#0ea5e9',
    tagBg: 'rgba(14,165,233,0.1)',
    stats: [
      { label: 'Projects', value: '500+' },
      { label: 'Students', value: '1000+' },
      { label: 'Tech Stacks', value: '20+' },
    ],
  },
  {
    id: 'jobs',
    name: 'Search Your Jobs',
    url: 'https://www.lets-code.co.in/jobs/',
    description: 'Find the best tech jobs and internships curated for developers — apply directly and land your dream role.',
    icon: RiBriefcaseLine,
    emoji: '💼',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    glowColor: 'rgba(16,185,129,0.35)',
    tag: 'Jobs & Internships',
    tagColor: '#10b981',
    tagBg: 'rgba(16,185,129,0.1)',
    stats: [
      { label: 'Jobs Posted', value: '200+' },
      { label: 'Companies', value: '50+' },
      { label: 'New Today', value: 'Daily' },
    ],
  },
];

export default function Resources() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [clickedCard, setClickedCard] = useState(null);

  const handleOpen = (resource) => {
    setClickedCard(resource.id);
    setTimeout(() => {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
      setClickedCard(null);
    }, 200);
  };

  return (
    <div style={{ padding: '1.5rem 1.75rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1.15rem', boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          }}>
            <RiGlobalLine />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Resources
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
          Quick access to the best tools, projects, and job opportunities curated for you.
        </p>
      </motion.div>

      {/* ── Resource Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {RESOURCES.map((res, idx) => {
          const Icon = res.icon;
          const isHovered = hoveredCard === res.id;
          const isClicked = clickedCard === res.id;

          return (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              onMouseEnter={() => setHoveredCard(res.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleOpen(res)}
              style={{
                cursor: 'pointer',
                borderRadius: '20px',
                background: isHovered ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)',
                border: `1.5px solid ${isHovered ? 'rgba(99,102,241,0.2)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isHovered
                  ? `0 20px 48px ${res.glowColor}, 0 4px 16px rgba(0,0,0,0.08)`
                  : '0 4px 16px rgba(0,0,0,0.05)',
                transform: isClicked ? 'scale(0.97)' : isHovered ? 'translateY(-6px)' : 'translateY(0)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Card top gradient banner */}
              <div style={{
                background: res.gradient,
                padding: '1.5rem 1.5rem 1.75rem',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Decorative blobs */}
                <div style={{
                  position: 'absolute', top: '-20px', right: '-20px',
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                }} />
                <div style={{
                  position: 'absolute', bottom: '-30px', left: '30%',
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                }} />

                {/* Icon + Emoji */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '14px',
                    background: 'rgba(255,255,255,0.22)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}>
                    <Icon />
                  </div>
                  <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))', lineHeight: 1 }}>
                    {res.emoji}
                  </span>
                </div>

                {/* Tag */}
                <div style={{ marginTop: '1rem', position: 'relative', zIndex: 1 }}>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.625rem',
                    borderRadius: '20px', backdropFilter: 'blur(6px)',
                  }}>
                    {res.tag}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Name */}
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#0f172a' }}>
                    {res.name}
                  </h2>
                  <p style={{ margin: '0.375rem 0 0', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                    {res.description}
                  </p>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {res.stats.map((stat) => (
                    <div key={stat.label} style={{
                      flex: 1, textAlign: 'center', padding: '0.5rem 0.25rem',
                      background: 'rgba(99,102,241,0.04)', borderRadius: '10px',
                      border: '1px solid rgba(99,102,241,0.08)',
                    }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#4f46e5' }}>{stat.value}</p>
                      <p style={{ margin: 0, fontSize: '0.62rem', color: '#94a3b8', marginTop: '0.1rem' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', borderRadius: '12px',
                  background: isHovered ? res.gradient : 'rgba(99,102,241,0.06)',
                  border: `1px solid ${isHovered ? 'transparent' : 'rgba(99,102,241,0.12)'}`,
                  transition: 'all 0.25s',
                }}>
                  <span style={{
                    fontSize: '0.82rem', fontWeight: 700,
                    color: isHovered ? '#fff' : '#4f46e5',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    <RiExternalLinkLine />
                    Open {res.name}
                  </span>
                  <div style={{
                    width: 28, height: 28, borderRadius: '8px',
                    background: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isHovered ? '#fff' : '#6366f1',
                    transition: 'all 0.2s',
                    transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                  }}>
                    <RiArrowRightLine />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Bottom Banner ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.07) 100%)',
          border: '1px solid rgba(99,102,241,0.12)',
          display: 'flex', alignItems: 'center', gap: '0.875rem',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>
          <RiSparklingLine style={{ color: '#6366f1', fontSize: '1.5rem' }} />
        </span>
        <div>
          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5' }}>
            Pro Tip — Bookmark these resources!
          </p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Visit them regularly to stay updated with new AI tools, inspiring projects, and fresh job openings.
          </p>
        </div>
      </motion.div>

    </div>
  );
}
