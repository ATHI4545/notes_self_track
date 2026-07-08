import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  RiCompass3Line, RiMapPinRangeLine, RiPlayLine, RiBookOpenLine,
  RiCheckboxCircleFill, RiCheckboxBlankCircleLine, RiLoader5Line,
  RiArrowRightUpLine, RiSparklingLine, RiLightbulbLine,
  RiFileList3Line, RiAddLine, RiYoutubeLine, RiAwardLine,
  RiExternalLinkLine, RiBook2Line
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

const TEMPLATES = [
  { title: 'Frontend React Engineer', level: 'Beginner to Job Ready', duration: '8 Weeks' },
  { title: 'Fullstack Node.js Developer', level: 'Intermediate to Expert', duration: '12 Weeks' },
  { title: 'Python & AI Agent Developer', level: 'Beginner to Job Ready', duration: '6 Weeks' },
  { title: 'System Design Architect', level: 'Advanced / Interview Prep', duration: '4 Weeks' },
];

export default function Roadmap() {
  const { profile } = useAuth();
  const location = useLocation();

  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner to Job Ready');
  const [duration, setDuration] = useState('8 Weeks');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [completedItems, setCompletedItems] = useState({});
  const [roadmapId, setRoadmapId] = useState(null);
  const [savingRoadmap, setSavingRoadmap] = useState(false);

  // If a roadmap was clicked on the dashboard, load it!
  useEffect(() => {
    if (location.state?.activeRoadmap) {
      const rm = location.state.activeRoadmap;
      setRoadmap(rm);
      setCompletedItems(rm.completedItems || {});
      setRoadmapId(rm.id);
      setTopic(rm.title.replace('Study Roadmap: ', ''));
      setLevel(rm.level);
      setDuration(rm.duration);
    }
  }, [location.state]);

  const saveRoadmap = async () => {
    if (!profile?.uid || !roadmap) return;
    setSavingRoadmap(true);
    
    const roadmapData = {
      title: roadmap.title,
      overview: roadmap.overview || '',
      level: roadmap.level || level,
      duration: roadmap.duration || duration,
      phases: roadmap.phases || [],
      completedItems: completedItems,
      status: 'on-going',
      createdAt: new Date().toISOString(),
    };

    try {
      // Try Firestore first
      const docRef = await addDoc(collection(db, 'users', profile.uid, 'roadmaps'), {
        ...roadmapData,
        createdAt: serverTimestamp()
      });
      setRoadmapId(docRef.id);
      toast.success('🎯 Roadmap saved to cloud!');
    } catch (err) {
      console.warn('Firestore save failed, falling back to local storage:', err);
      // Fallback: Local Storage
      try {
        const localId = `local-${Date.now()}`;
        const localRoadmaps = JSON.parse(localStorage.getItem('self_track_local_roadmaps') || '[]');
        localRoadmaps.push({ id: localId, ...roadmapData });
        localStorage.setItem('self_track_local_roadmaps', JSON.stringify(localRoadmaps));
        setRoadmapId(localId);
        toast.info('🎯 Saved locally! (Deploy firestore.rules to sync online)');
      } catch (localErr) {
        console.error(localErr);
        toast.error('Failed to save roadmap.');
      }
    } finally {
      setSavingRoadmap(false);
    }
  };

  const toggleCheck = async (phaseIndex, type, index) => {
    const key = `${phaseIndex}-${type}-${index}`;
    const newCompleted = { ...completedItems, [key]: !completedItems[key] };
    setCompletedItems(newCompleted);

    if (roadmapId) {
      if (roadmapId.startsWith('local-')) {
        // Update local storage
        try {
          const localRoadmaps = JSON.parse(localStorage.getItem('self_track_local_roadmaps') || '[]');
          const idx = localRoadmaps.findIndex(rm => rm.id === roadmapId);
          if (idx !== -1) {
            localRoadmaps[idx].completedItems = newCompleted;
            localStorage.setItem('self_track_local_roadmaps', JSON.stringify(localRoadmaps));
          }
        } catch (err) {
          console.error('Failed to update local roadmap:', err);
        }
      } else if (profile?.uid) {
        // Update Firestore
        try {
          const docRef = doc(db, 'users', profile.uid, 'roadmaps', roadmapId);
          await updateDoc(docRef, { completedItems: newCompleted });
        } catch (err) {
          console.error('Failed to sync checklist to Firestore:', err);
        }
      }
    }
  };

  const generateRoadmap = async (selectedTopic = topic) => {
    const activeTopic = selectedTopic.trim();
    if (!activeTopic) {
      toast.error('Please enter or select a topic first.');
      return;
    }
    setLoading(true);
    setRoadmap(null);
    setCompletedItems({});
    setRoadmapId(null);

    const systemPrompt = `You are ARS StudyTrack AI, an elite educational architect. Your task is to output a strictly valid, parsed JSON object representing a comprehensive, step-by-step learning roadmap.
    
    You MUST format your output strictly as a single JSON object. Do not write any normal chat introduction, markdown explanations, or postscript dialogue. Return only the JSON object.
    
    JSON Schema to follow EXACTLY:
    {
      "title": "Study Roadmap: [Topic Name]",
      "overview": "[Brief description of what will be learned]",
      "level": "[Difficulty level]",
      "duration": "[Estimated duration]",
      "phases": [
        {
          "name": "Phase 1: [Phase title]",
          "timeframe": "[Estimated weeks/days]",
          "objectives": ["key skill 1", "key skill 2"],
          "topics": [
            {
              "name": "[Subtopic title]",
              "description": "[Brief description of this concept]"
            }
          ],
          "projects": [
            {
              "title": "[Project title]",
              "desc": "[Brief description of what to build]"
            }
          ],
          "resources": {
            "certificates": [
              {
                "name": "[Real free course or certificate name]",
                "platform": "[Coursera / edX / Google / freeCodeCamp / Udemy / LinkedIn Learning / IBM / Meta]",
                "url": "[Real working URL to the free course/certificate page]"
              }
            ],
            "youtube": [
              {
                "title": "[Real YouTube video or playlist title]",
                "channel": "[Real YouTube channel name]",
                "url": "[Real YouTube URL — youtube.com/watch?v=... or youtube.com/playlist?list=...]"
              }
            ],
            "studyMaterials": [
              {
                "title": "[Resource title]",
                "type": "[Official Docs / Book / Article / Cheatsheet / GitHub Repo / MDN / W3Schools]",
                "url": "[Real working URL]"
              }
            ]
          }
        }
      ]
    }
    
    IMPORTANT RULES:
    - Provide REAL, working URLs for every resource. Do NOT make up URLs.
    - For YouTube, use real channel playlists (e.g. Traversy Media, Fireship, The Coding Train).
    - For certificates use actual free course pages (Coursera audit, edX audit, freeCodeCamp, Google Career Certs).
    - Every phase MUST have at least 1 certificate, 2 YouTube resources, and 2 study materials.
    - Return ONLY the JSON object. No markdown, no extra text.`;

    const userMessage = `Create a detailed learning roadmap for: "${activeTopic}"
    Target difficulty level: "${level}"
    Timeframe/Duration: "${duration}"`;

    try {
      // /api/nvidia-proxy → Vite dev proxy locally, Vercel serverless function in production
      const response = await fetch('/api/nvidia-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.2,
          max_tokens: 2048,
          top_p: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`NVIDIA API responded with status ${response.status}`);
      }

      const resJson = await response.json();
      const reply = resJson.choices?.[0]?.message?.content || '';

      // Attempt to clean JSON block if AI wrapped it in markdown code fences
      let cleanedReply = reply.trim();
      if (cleanedReply.includes('```')) {
        const matches = cleanedReply.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (matches && matches[1]) {
          cleanedReply = matches[1].trim();
        }
      }

      const roadmapData = JSON.parse(cleanedReply);
      setRoadmap(roadmapData);
      toast.success('🚀 Custom study roadmap generated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse AI output. Trying fallback roadmap generator...');
      
      // Fallback markdown roadmap render in case JSON parsing completely fails
      try {
        const fallbackPrompt = `Provide a beautiful, styled markdown roadmap for learning "${activeTopic}" at a "${level}" level over "${duration}". Break it down into clear phases with bullet points.`;

        const responseFb = await fetch('/api/nvidia-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'meta/llama-3.1-8b-instruct',
            messages: [
              { role: 'user', content: fallbackPrompt }
            ]
          })
        });

        if (!responseFb.ok) throw new Error();
        const resJsonFb = await responseFb.json();
        const textReply = resJsonFb.choices?.[0]?.message?.content || '';

        setRoadmap({
          title: `Study Roadmap: ${activeTopic}`,
          overview: `Difficulty: ${level} · Duration: ${duration}`,
          markdown: textReply
        });
      } catch (fallbackErr) {
        toast.error('Could not generate roadmap. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="tasks-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RiCompass3Line /> Study Roadmap Generator
        </h1>
        <span className="tasks-count-badge">AI STUDY ARCHITECT</span>
      </motion.div>

      {/* Input panel & Templates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Settings form */}
        <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 0, borderLeft: '4px solid #6366f1' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RiSparklingLine style={{ color: '#a78bfa' }} /> Build Roadmap
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Topic to Learn</label>
              <input
                type="text"
                placeholder="e.g. DevOps Engineer, Machine Learning, Rust Programming"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="searchbar-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Skill Level</label>
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  className="searchbar-input"
                  style={{ width: '100%', paddingRight: '1rem', background: 'inherit', color: 'inherit' }}
                >
                  <option value="Beginner to Job Ready">Beginner to Job</option>
                  <option value="Intermediate to Expert">Intermediate to Expert</option>
                  <option value="Advanced / Interview Prep">Advanced Prep</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="searchbar-input"
                  style={{ width: '100%', paddingRight: '1rem', background: 'inherit', color: 'inherit' }}
                >
                  <option value="4 Weeks">4 Weeks</option>
                  <option value="6 Weeks">6 Weeks</option>
                  <option value="8 Weeks">8 Weeks</option>
                  <option value="12 Weeks">12 Weeks</option>
                  <option value="6 Months">6 Months</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => generateRoadmap()}
              className="btn-primary tasks-add-btn"
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <RiLoader5Line className="animate-spin" /> Structuring Roadmap...
                </>
              ) : (
                <>
                  <RiCompass3Line /> Generate AI Roadmap
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick templates */}
        <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 0, borderLeft: '4px solid #a78bfa' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RiFileList3Line style={{ color: '#818cf8' }} /> Popular Templates
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '1rem' }}>
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.title}
                onClick={() => {
                  setTopic(tpl.title);
                  setLevel(tpl.level);
                  setDuration(tpl.duration);
                  generateRoadmap(tpl.title);
                }}
                disabled={loading}
                className="filter-chip"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: '0.875rem 1.25rem', gap: '0.2rem', textAlign: 'left',
                  width: '100%', cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{tpl.title}</span>
                  <RiPlayLine style={{ fontSize: '0.9rem', opacity: 0.6 }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '500' }}>
                  {tpl.level} · {tpl.duration}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output / Rendering area */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card"
            style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderRadius: 0 }}
          >
            <RiLoader5Line style={{ fontSize: '3rem', color: '#6366f1' }} className="animate-spin" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Synthesizing Custom Study Roadmap</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '420px', margin: '0 auto' }}>
              We are consulting Groq AI to divide this topic into progressive phases, specify focus concepts, and formulate practical training projects.
            </p>
          </motion.div>
        )}

        {roadmap && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="animate-slide-up"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {/* Header info */}
            <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 0, borderLeft: '4px solid #38bdf8' }}>
              <span className="task-category-tag" style={{ marginBottom: '0.5rem' }}>STUDY GUIDE</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>{roadmap.title}</h2>
              {roadmap.overview && <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '0.4rem', lineHeight: 1.5 }}>{roadmap.overview}</p>}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {roadmap.level && <span className="badge-low" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>{roadmap.level}</span>}
                  {roadmap.duration && <span className="badge-medium" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>{roadmap.duration}</span>}
                </div>
                
                {profile?.uid && (
                  <button
                    onClick={roadmapId ? null : saveRoadmap}
                    className="btn-primary tasks-add-btn"
                    disabled={savingRoadmap}
                    style={{
                      background: roadmapId ? 'rgba(16,185,129,0.1)' : undefined,
                      color: roadmapId ? '#10b981' : undefined,
                      border: roadmapId ? '1px solid rgba(16,185,129,0.2)' : undefined,
                      boxShadow: roadmapId ? 'none' : undefined,
                      cursor: roadmapId ? 'default' : 'pointer',
                      fontSize: '0.8rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    {roadmapId ? '✓ Saved to Dashboard' : savingRoadmap ? 'Saving...' : 'Save to Dashboard'}
                  </button>
                )}
              </div>
            </div>

            {/* Markdown fallback render */}
            {roadmap.markdown ? (
              <div className="glass-card" style={{ padding: '2rem', borderRadius: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem' }}>
                {roadmap.markdown}
              </div>
            ) : (
              /* Phases view */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {roadmap.phases?.map((phase, phaseIdx) => (
                  <div
                    key={phase.name}
                    className="glass-card task-card-sharp"
                    style={{ padding: '1.5rem 1.75rem', borderLeftWidth: '4px', borderLeftStyle: 'solid' }}
                  >
                    {/* Phase Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid rgba(167,139,250,0.15)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'inherit' }}>{phase.name}</h3>
                        <span style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Timeframe: {phase.timeframe}
                        </span>
                      </div>
                      
                      {/* Objectives */}
                      {phase.objectives && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {phase.objectives.map(obj => (
                            <span key={obj} style={{ fontSize: '0.68rem', fontWeight: '700', background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.15)', padding: '0.15rem 0.5rem' }}>
                              {obj}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Topics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                      {/* Subtopics list */}
                      <div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <RiBookOpenLine /> Key Concepts
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                          {phase.topics?.map((topic, idx) => {
                            const isChecked = !!completedItems[`${phaseIdx}-topic-${idx}`];
                            return (
                              <div
                                key={topic.name}
                                onClick={() => toggleCheck(phaseIdx, 'topic', idx)}
                                style={{
                                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                  padding: '0.6rem 0.75rem', background: isChecked ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                                  border: isChecked ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)',
                                  cursor: 'pointer', transition: 'all 0.15s'
                                }}
                              >
                                <span style={{ color: isChecked ? '#10b981' : '#94a3b8', fontSize: '1.1rem', marginTop: '1px' }}>
                                  {isChecked ? <RiCheckboxCircleFill /> : <RiCheckboxBlankCircleLine />}
                                </span>
                                <div>
                                  <p style={{ fontSize: '0.82rem', fontWeight: '700', color: isChecked ? '#10b981' : 'inherit', textDecoration: isChecked ? 'line-through' : 'none' }}>
                                    {topic.name}
                                  </p>
                                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem', lineHeight: 1.35 }}>
                                    {topic.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Projects to build */}
                      {phase.projects && phase.projects.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <RiLightbulbLine /> Hands-on Practice
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {phase.projects.map((proj, idx) => {
                              const isChecked = !!completedItems[`${phaseIdx}-proj-${idx}`];
                              return (
                                <div
                                  key={proj.title}
                                  onClick={() => toggleCheck(phaseIdx, 'proj', idx)}
                                  style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                    padding: '0.6rem 0.75rem', background: isChecked ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                                    border: isChecked ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                  }}
                                >
                                  <span style={{ color: isChecked ? '#10b981' : '#94a3b8', fontSize: '1.1rem', marginTop: '1px' }}>
                                    {isChecked ? <RiCheckboxCircleFill /> : <RiCheckboxBlankCircleLine />}
                                  </span>
                                  <div>
                                    <p style={{ fontSize: '0.82rem', fontWeight: '700', color: isChecked ? '#10b981' : 'inherit', textDecoration: isChecked ? 'line-through' : 'none' }}>
                                      {proj.title}
                                    </p>
                                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem', lineHeight: 1.35 }}>
                                      {proj.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Resources: Certificates · YouTube · Study Materials ── */}
                    {phase.resources && (
                      phase.resources.certificates?.length > 0 ||
                      phase.resources.youtube?.length > 0 ||
                      phase.resources.studyMaterials?.length > 0
                    ) && (
                      <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(167,139,250,0.12)', paddingTop: '1.25rem' }}>
                        <h4 style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', letterSpacing: '0.05em' }}>
                          <RiArrowRightUpLine style={{ color: '#a78bfa' }} /> Learning Resources
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>

                          {/* Free Certificates */}
                          {phase.resources.certificates?.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#fbbf24', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem', letterSpacing: '0.05em' }}>
                                <RiAwardLine /> Free Certificates
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {phase.resources.certificates.map((cert, ci) => (
                                  <a
                                    key={ci}
                                    href={cert.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                                      padding: '0.55rem 0.8rem',
                                      background: 'rgba(251,191,36,0.05)',
                                      border: '1px solid rgba(251,191,36,0.18)',
                                      textDecoration: 'none',
                                      transition: 'all 0.15s',
                                      borderRadius: '2px'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.12)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.35)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.05)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.18)'; }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cert.name}</p>
                                      <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0.1rem 0 0 0', fontWeight: '600' }}>{cert.platform}</p>
                                    </div>
                                    <RiExternalLinkLine style={{ color: '#fbbf24', fontSize: '0.85rem', flexShrink: 0 }} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* YouTube Resources */}
                          {phase.resources.youtube?.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#f87171', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem', letterSpacing: '0.05em' }}>
                                <RiYoutubeLine /> YouTube Resources
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {phase.resources.youtube.map((vid, vi) => (
                                  <a
                                    key={vi}
                                    href={vid.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                                      padding: '0.55rem 0.8rem',
                                      background: 'rgba(248,113,113,0.05)',
                                      border: '1px solid rgba(248,113,113,0.18)',
                                      textDecoration: 'none',
                                      transition: 'all 0.15s',
                                      borderRadius: '2px'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.05)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.18)'; }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vid.title}</p>
                                      <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0.1rem 0 0 0', fontWeight: '600' }}>{vid.channel}</p>
                                    </div>
                                    <RiExternalLinkLine style={{ color: '#f87171', fontSize: '0.85rem', flexShrink: 0 }} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Study Materials */}
                          {phase.resources.studyMaterials?.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#38bdf8', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem', letterSpacing: '0.05em' }}>
                                <RiBook2Line /> Study Materials
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {phase.resources.studyMaterials.map((mat, mi) => (
                                  <a
                                    key={mi}
                                    href={mat.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                                      padding: '0.55rem 0.8rem',
                                      background: 'rgba(56,189,248,0.05)',
                                      border: '1px solid rgba(56,189,248,0.18)',
                                      textDecoration: 'none',
                                      transition: 'all 0.15s',
                                      borderRadius: '2px'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.12)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.35)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.05)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.18)'; }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mat.title}</p>
                                      <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0.1rem 0 0 0', fontWeight: '600' }}>{mat.type}</p>
                                    </div>
                                    <RiExternalLinkLine style={{ color: '#38bdf8', fontSize: '0.85rem', flexShrink: 0 }} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
