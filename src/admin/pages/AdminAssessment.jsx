import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'react-toastify';
import {
  RiFileList3Line, RiAddLine, RiDeleteBinLine, RiCloseLine,
  RiCheckboxCircleLine, RiCalendarLine, RiArrowDownSLine,
  RiArrowUpSLine, RiQuestionLine, RiExternalLinkLine, RiTimeLine,
  RiLink, RiEyeLine, RiEyeOffLine
} from 'react-icons/ri';

const EMPTY_Q = () => ({ id: Date.now(), text: '', options: ['', '', '', ''], correctOption: 'A', explanation: '' });

const formatDueDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.replace('T', ' ');
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr.replace('T', ' ');
  }
};

function QuizBuilder({ questions, setQuestions }) {
  const addQ = () => setQuestions(p => [...p, EMPTY_Q()]);
  const removeQ = (id) => setQuestions(p => p.filter(q => q.id !== id));
  const updateQ = (id, field, val) => setQuestions(p => p.map(q => q.id === id ? { ...q, [field]: val } : q));
  const updateOption = (qId, idx, val) =>
    setQuestions(p => p.map(q => q.id === qId ? { ...q, options: q.options.map((o, i) => i === idx ? val : o) } : q));

  return (
    <div>
      {questions.map((q, qi) => (
        <div key={q.id} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#a78bfa', flexShrink: 0 }}>
              {qi + 1}
            </span>
            <input
              type="text" value={q.text} placeholder={`Question ${qi + 1}`}
              onChange={e => updateQ(q.id, 'text', e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={() => removeQ(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a3f5e', fontSize: '1rem', display: 'flex', alignItems: 'center', padding: '0.25rem', borderRadius: '0.375rem', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#4a3f5e'}
            >
              <RiCloseLine />
            </button>
          </div>

          {/* MCQ Options */}
          <div style={{ paddingLeft: '2.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {q.options.map((opt, oi) => (
              <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(139,92,246,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#7c6fa0', fontWeight: '700' }}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <input
                  type="text" value={opt} placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  onChange={e => updateOption(q.id, oi, e.target.value)}
                  style={{ flex: 1, padding: '0.4rem 0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '0.4rem', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            ))}
          </div>

          {/* Correct Answer Selection */}
          <div style={{ paddingLeft: '2.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#7c6fa0', fontWeight: '600' }}>Correct Answer:</span>
            {['A', 'B', 'C', 'D'].map(ans => (
              <button
                key={ans} type="button"
                onClick={() => updateQ(q.id, 'correctOption', ans)}
                style={{
                  padding: '0.25rem 0.6rem', borderRadius: '0.35rem', fontSize: '0.75rem', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: q.correctOption === ans ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)',
                  border: q.correctOption === ans ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: q.correctOption === ans ? '#34d399' : '#7c6fa0',
                }}
              >
                {ans}
              </button>
            ))}
          </div>

          {/* Explanation Input */}
          <div style={{ paddingLeft: '2.25rem' }}>
            <input
              type="text" value={q.explanation || ''} placeholder="Explanation (Optional - shown after results are published)"
              onChange={e => updateQ(q.id, 'explanation', e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '0.4rem', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      ))}
      <button
        type="button" onClick={addQ}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'rgba(139,92,246,0.1)', border: '1px dashed rgba(139,92,246,0.35)', borderRadius: '0.75rem', color: '#a78bfa', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center', transition: 'background 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.18)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
      >
        <RiAddLine /> Add Question
      </button>
    </div>
  );
}

function AssessmentCard({ adminUid, assessment, index, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [published, setPublished] = useState(assessment.resultsPublished || false);

  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    try {
      const subsRef = collection(db, 'assessments', adminUid, 'posts', assessment.id, 'submissions');
      const snap = await getDocs(subsRef);
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    if (expanded && adminUid && assessment.id) {
      fetchSubmissions();
    }
  }, [expanded, adminUid, assessment.id]);

  const handlePublishResults = async () => {
    try {
      const docRef = doc(db, 'assessments', adminUid, 'posts', assessment.id);
      await updateDoc(docRef, { resultsPublished: true });
      setPublished(true);
      toast.success('Quiz results published successfully! 📢');
    } catch (err) {
      console.error(err);
      toast.error('Failed to publish results.');
    }
  };

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '1rem', overflow: 'hidden', backdropFilter: 'blur(12px)' }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1.125rem 1.25rem', cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <RiFileList3Line style={{ color: '#a855f7', fontSize: '1.1rem' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#e2e8f0' }}>{assessment.title}</p>
            <span style={{
              fontSize: '0.625rem', fontWeight: '700', padding: '0.15rem 0.45rem', borderRadius: '99px',
              background: assessment.type === 'quiz' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
              color: assessment.type === 'quiz' ? '#818cf8' : '#fb923c',
              border: assessment.type === 'quiz' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(245,158,11,0.3)'
            }}>
              {assessment.type === 'quiz' ? 'Quiz' : 'Link'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {assessment.type === 'quiz' ? (
              <>
                <span style={{ fontSize: '0.72rem', color: '#7c6fa0', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <RiQuestionLine /> {assessment.questions?.length || 0} Questions
                </span>
                <span style={{ fontSize: '0.72rem', color: '#7c6fa0', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <RiTimeLine /> {assessment.duration} min
                </span>
              </>
            ) : (
              <span style={{ fontSize: '0.72rem', color: '#7c6fa0', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <RiLink /> Problem Link
              </span>
            )}
            {assessment.dueDate && (
              <span style={{ fontSize: '0.72rem', color: '#7c6fa0', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <RiCalendarLine /> Due: {formatDueDate(assessment.dueDate)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={e => { e.stopPropagation(); onDelete(assessment.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a3f5e', fontSize: '1rem', display: 'flex', alignItems: 'center', padding: '0.25rem', borderRadius: '0.375rem', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a3f5e'}
          >
            <RiDeleteBinLine />
          </button>
          <span style={{ color: '#7c6fa0', fontSize: '1.1rem' }}>
            {expanded ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(139,92,246,0.1)' }}
          >
            <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Left Column: Details & Questions */}
              <div>
                <p style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Details</p>
                {assessment.description && (
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.875rem', lineHeight: 1.6 }}>{assessment.description}</p>
                )}
                {assessment.type === 'link' && assessment.problemUrl && (
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#7c6fa0' }}>Target Link:</span>
                    <a href={assessment.problemUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#fb923c', textDecoration: 'none', marginTop: '0.2rem' }}>
                      {assessment.problemUrl} <RiExternalLinkLine />
                    </a>
                  </div>
                )}

                {assessment.type === 'quiz' && (
                  <div>
                    <p style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Questions & Answers</p>
                    {(assessment.questions || []).map((q, qi) => (
                      <div key={qi} style={{ marginBottom: '0.875rem' }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '0.35rem' }}>
                          Q{qi + 1}. {q.text}
                        </p>
                        <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.25rem' }}>
                          {q.options?.filter(Boolean).map((opt, oi) => {
                            const choice = String.fromCharCode(65 + oi);
                            const isCorrect = q.correctOption === choice;
                            return (
                              <p key={oi} style={{ fontSize: '0.78rem', color: isCorrect ? '#34d399' : '#7c6fa0', fontWeight: isCorrect ? '700' : '400' }}>
                                {choice}. {opt} {isCorrect ? '✓' : ''}
                              </p>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <p style={{ fontSize: '0.75rem', color: '#c4b5fd', paddingLeft: '1rem', marginTop: '0.2rem', fontStyle: 'italic' }}>
                            Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Submissions */}
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Submissions ({submissions.length})
                  </p>
                  {assessment.type === 'quiz' && (
                    <button
                      onClick={handlePublishResults}
                      disabled={published || submissions.length === 0}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.3rem 0.6rem', borderRadius: '0.5rem',
                        fontSize: '0.7rem', fontWeight: '700', cursor: (published || submissions.length === 0) ? 'not-allowed' : 'pointer',
                        background: published ? 'rgba(52,211,153,0.15)' : 'rgba(139,92,246,0.15)',
                        border: published ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(139,92,246,0.3)',
                        color: published ? '#34d399' : '#a78bfa',
                      }}
                    >
                      {published ? <><RiEyeLine /> Results Published</> : <><RiEyeOffLine /> Publish Results</>}
                    </button>
                  )}
                </div>

                {loadingSubs ? (
                  <p style={{ fontSize: '0.78rem', color: '#7c6fa0' }}>Loading submissions...</p>
                ) : submissions.length === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: '#7c6fa0', fontStyle: 'italic' }}>No submissions yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                    {submissions.map((sub) => (
                      <div key={sub.id} style={{ padding: '0.75rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#e2e8f0' }}>{sub.studentName}</span>
                          <span style={{ fontSize: '0.65rem', color: '#7c6fa0' }}>
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {assessment.type === 'quiz' ? (
                          <p style={{ fontSize: '0.8rem', fontWeight: '800', color: '#34d399' }}>
                            Score: {sub.score} / {sub.totalQs} ({Math.round((sub.score / sub.totalQs) * 100)}%)
                          </p>
                        ) : (
                          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            <span style={{ color: '#a78bfa', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Solution Content:</span>
                            <pre style={{
                              background: 'rgba(0, 0, 0, 0.3)',
                              padding: '0.6rem',
                              borderRadius: '0.35rem',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              color: '#34d399',
                              maxHeight: '120px',
                              overflowY: 'auto',
                              fontSize: '0.75rem',
                              border: '1px solid rgba(139,92,246,0.1)'
                            }}>
                              {sub.solutionText || sub.solutionUrl || 'N/A'}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminAssessment() {
  const { adminProfile } = useAdminAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);

  const [asmType, setAsmType]         = useState('quiz'); // quiz | link
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate]         = useState('');
  const [duration, setDuration]       = useState(10); // minutes
  const [problemUrl, setProblemUrl]   = useState('');
  const [questions, setQuestions]     = useState([EMPTY_Q()]);

  const load = async () => {
    if (!adminProfile?.uid) return;
    setLoading(true);
    try {
      const q    = query(collection(db, 'assessments', adminProfile.uid, 'posts'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setAssessments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (adminProfile) load(); }, [adminProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Please enter a title.');
    
    let payload = {
      type: asmType,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || '',
      createdAt: new Date().toISOString(),
    };

    if (asmType === 'quiz') {
      const validQs = questions.filter(q => q.text.trim());
      if (validQs.length === 0) return toast.error('Add at least one question.');
      payload.duration = parseInt(duration) || 10;
      payload.questions = validQs.map(({ text, options, correctOption, explanation }) => ({
        text, options: options.filter(Boolean), correctOption, explanation: explanation || '',
      }));
      payload.resultsPublished = false;
    } else {
      if (!problemUrl.trim()) return toast.error('Please enter the target problem URL.');
      payload.problemUrl = problemUrl.trim();
    }

    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'assessments', adminProfile.uid, 'posts'), payload);
      toast.success('Assessment posted successfully! 📝');
      setAssessments(prev => [{ id: docRef.id, ...payload }, ...prev]);
      
      // Reset states
      setTitle(''); setDescription(''); setDueDate(''); setProblemUrl('');
      setDuration(10); setQuestions([EMPTY_Q()]); setShowForm(false);
    } catch (err) {
      console.error(err); toast.error('Failed to post assessment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assessment?')) return;
    await deleteDoc(doc(db, 'assessments', adminProfile.uid, 'posts', id));
    setAssessments(prev => prev.filter(a => a.id !== id));
    toast.success('Assessment deleted.');
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
            <RiFileList3Line style={{ color: '#fff', fontSize: '1.2rem' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #e2e8f0, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Post Assessment
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#7c6fa0' }}>{assessments.length} assessment{assessments.length !== 1 ? 's' : ''} posted</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: showForm ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', border: showForm ? '1px solid rgba(239,68,68,0.3)' : 'none', borderRadius: '0.875rem', color: showForm ? '#f87171' : '#fff', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: showForm ? 'none' : '0 4px 16px rgba(124,58,237,0.35)', transition: 'all 0.2s' }}
        >
          {showForm ? <><RiCloseLine /> Cancel</> : <><RiAddLine /> New Assessment</>}
        </button>
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -12, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '1.5rem' }}
          >
            <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '1.25rem', padding: '1.75rem', backdropFilter: 'blur(12px)' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#c4b5fd', marginBottom: '1.25rem' }}>Create New Assessment</h2>
              
              {/* Type Switcher */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Assessment Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { key: 'quiz', label: 'Timed Quiz (MCQs)' },
                    { key: 'link', label: 'External Problem Link' }
                  ].map(t => (
                    <button
                      key={t.key} type="button" onClick={() => setAsmType(t.key)}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: '0.625rem', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                        background: asmType === t.key ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                        border: asmType === t.key ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(139,92,246,0.15)',
                        color: asmType === t.key ? '#c4b5fd' : '#7c6fa0',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Title *</label>
                  <input type="text" value={title} placeholder="Assessment title" onChange={e => setTitle(e.target.value)} required
                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.75rem', color: '#e2e8f0', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Due Date & Time</label>
                  <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.75rem', color: '#e2e8f0', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Description / Instructions</label>
                <textarea value={description} placeholder="Brief instructions" onChange={e => setDescription(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.75rem', color: '#e2e8f0', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', resize: 'none' }}
                />
              </div>

              {/* Conditional builders */}
              {asmType === 'quiz' ? (
                <>
                  <div style={{ marginBottom: '1.25rem', maxWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Duration (minutes)</label>
                    <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.75rem', color: '#e2e8f0', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Quiz Questions *</label>
                    <QuizBuilder questions={questions} setQuestions={setQuestions} />
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Problem URL (LeetCode/HackerRank) *</label>
                  <div style={{ position: 'relative' }}>
                    <RiLink style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6d28d9', fontSize: '1rem' }} />
                    <input type="url" value={problemUrl} placeholder="https://leetcode.com/problems/..." onChange={e => setProblemUrl(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.75rem', color: '#e2e8f0', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              )}

              <button type="submit" disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', background: saving ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: '0.875rem', color: '#fff', fontWeight: '700', fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 16px rgba(124,58,237,0.35)' }}
              >
                {saving ? <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> : <><RiCheckboxCircleLine /> Post Assessment</>}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assessments list */}
      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} style={{ height: '72px', borderRadius: '1rem', background: 'rgba(255,255,255,0.03)', marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }} />)
      ) : assessments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '1.25rem' }}>
          <RiFileList3Line style={{ fontSize: '3rem', color: '#3d3356', marginBottom: '1rem' }} />
          <p style={{ color: '#7c6fa0' }}>No assessments posted yet. Click "New Assessment" to start.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {assessments.map((a, i) => (
            <AssessmentCard
              key={a.id}
              adminUid={adminProfile.uid}
              assessment={a}
              index={i}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
