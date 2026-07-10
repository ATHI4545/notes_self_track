import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  RiTeamLine, RiFileList3Line, RiShieldLine,
  RiSendPlaneLine, RiTimeLine, RiCheckboxCircleLine, RiExternalLinkLine,
  RiInformationLine, RiCodeSSlashLine, RiLink, RiPlayLine, RiEyeLine
} from 'react-icons/ri';

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

export default function MentorConnect() {
  const { profile } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState({}); // { postId: submissionDocData }
  const [loading, setLoading] = useState(true);

  // Quiz active taking states
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({}); // { questionIndex: choice }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const timerRef = useRef(null);

  // Link type draft submissions
  const [linkDrafts, setLinkDrafts] = useState({}); // { postId: solutionUrl }

  const loadMentorData = async () => {
    if (!profile?.email) return;
    setLoading(true);
    try {
      // Find admin document where mentees array contains student email
      const adminsRef = collection(db, 'admin');
      const q = query(adminsRef, where('mentees', 'array-contains', profile.email.toLowerCase()));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const adminDoc = snap.docs[0];
        const adminData = { uid: adminDoc.id, ...adminDoc.data() };
        setMentor(adminData);

        // Fetch assessments
        const assessmentsRef = collection(db, 'assessments', adminDoc.id, 'posts');
        const asmSnap = await getDocs(assessmentsRef);
        const asmList = asmSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        asmList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setAssessments(asmList);

        // Fetch submissions
        const subs = {};
        for (const asm of asmList) {
          const subRef = doc(db, 'assessments', adminData.uid, 'posts', asm.id, 'submissions', profile.uid);
          const subSnap = await getDoc(subRef);
          if (subSnap.exists()) {
            subs[asm.id] = subSnap.data();
          }
        }
        setSubmissions(subs);
      } else {
        setMentor(null);
        setAssessments([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load mentor connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.email) {
      loadMentorData();
    }
  }, [profile]);

  // ── Quiz timer effect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeQuizId && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            // Auto submit
            submitQuiz(activeQuizId, true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [activeQuizId, timeLeft]);

  // ── Start quiz handler ───────────────────────────────────────────────────────
  const handleStartQuiz = (asm) => {
    setActiveQuizId(asm.id);
    setActiveQuestions(asm.questions || []);
    setQuizAnswers({});
    setTimeLeft((asm.duration || 10) * 60);
    toast.info('Quiz started! Good luck. ⏱️');
  };

  // ── Submit Quiz responses ───────────────────────────────────────────────────
  const submitQuiz = async (postId, isAuto = false) => {
    if (!mentor) return;
    clearInterval(timerRef.current);

    // Calculate score
    const quizPost = assessments.find(a => a.id === postId);
    if (!quizPost) return;

    let score = 0;
    quizPost.questions.forEach((q, idx) => {
      const selected = quizAnswers[idx] || '';
      if (selected === q.correctOption) {
        score += 1;
      }
    });

    try {
      const subRef = doc(db, 'assessments', mentor.uid, 'posts', postId, 'submissions', profile.uid);
      const submissionData = {
        studentName: profile.name || 'Student',
        studentEmail: profile.email,
        answers: quizAnswers,
        score,
        totalQs: quizPost.questions.length,
        submittedAt: new Date().toISOString(),
      };

      await setDoc(subRef, submissionData);
      setSubmissions(prev => ({ ...prev, [postId]: submissionData }));
      setActiveQuizId(null);
      toast.success(isAuto ? "⏱️ Time's up! Quiz submitted automatically." : 'Quiz submitted successfully! 🚀');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit quiz.');
    }
  };

  // ── Submit Link solution URL ────────────────────────────────────────────────
  const handleSubmitLink = async (e, postId) => {
    e.preventDefault();
    if (!mentor) return;
    const solution = linkDrafts[postId] || '';
    if (!solution.trim()) return toast.error('Please enter your solution answer or code.');

    try {
      const subRef = doc(db, 'assessments', mentor.uid, 'posts', postId, 'submissions', profile.uid);
      const submissionData = {
        studentName: profile.name || 'Student',
        studentEmail: profile.email,
        solutionText: solution.trim(),
        submittedAt: new Date().toISOString(),
      };

      await setDoc(subRef, submissionData);
      setSubmissions(prev => ({ ...prev, [postId]: submissionData }));
      toast.success('Solution submitted successfully! 🚀');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit solution.');
    }
  };

  const handleSelectMcq = (qIdx, choice) => {
    setQuizAnswers(prev => ({ ...prev, [qIdx]: choice }));
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const initials = mentor?.name
    ? mentor.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'M';

  if (activeQuizId) {
    // ── Timed Quiz taking UI ──────────────────────────────────────────────────
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1.5rem' }}>
        <div className="glass-card" style={{
          position: 'sticky', top: '1rem', zIndex: 50,
          padding: '1rem 1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          marginBottom: '2rem',
        }}>
          <div>
            <h3 style={{ color: 'inherit', fontSize: '1rem', fontWeight: '700' }}>Active Quiz</h3>
            <p style={{ color: 'inherit', opacity: 0.6, fontSize: '0.75rem' }}>Auto-submits when time runs out</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RiTimeLine style={{ color: '#fb923c', fontSize: '1.2rem' }} />
            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fb923c', fontFamily: 'monospace' }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeQuestions.map((q, qi) => (
            <div key={qi} className="glass-card" style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'inherit', marginBottom: '1rem' }}>
                Q{qi + 1}. {q.text}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {q.options?.map((opt, oi) => {
                  const choice = String.fromCharCode(65 + oi);
                  const isSelected = quizAnswers[qi] === choice;
                  return (
                    <button
                      key={oi} type="button"
                      onClick={() => handleSelectMcq(qi, choice)}
                      style={{
                        textAlign: 'left', padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
                        background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(124,58,237,0.03)',
                        border: isSelected ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(124,58,237,0.15)',
                        color: isSelected ? '#a78bfa' : 'inherit',
                        fontSize: '0.85rem', fontWeight: isSelected ? '700' : '500',
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontWeight: '800', marginRight: '0.5rem', color: isSelected ? '#818cf8' : '#7c6fa0' }}>
                        {choice}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => submitQuiz(activeQuizId)}
          className="btn-primary"
          style={{
            marginTop: '2rem', width: '100%', padding: '1rem',
            fontWeight: '700', fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
        >
          <RiSendPlaneLine /> Submit Test Solution
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
          }}>
            <RiTeamLine style={{ color: '#fff', fontSize: '1.2rem' }} />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Mentor Connect
          </h1>
        </div>
        <p style={{ color: 'inherit', opacity: 0.7, fontSize: '0.9rem' }}>
          Connect with your assigned mentor and complete assessments.
        </p>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ height: '100px', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '300px', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ) : !mentor ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '1.5rem', padding: '4rem 2rem', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <RiInformationLine style={{ color: '#6366f1', fontSize: '2rem' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'inherit', marginBottom: '0.5rem' }}>No Mentor Assigned Yet</h3>
          <p style={{ color: 'inherit', opacity: 0.7, maxWidth: '450px', margin: '0 auto', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Your account is currently not linked to any mentor list. Please share your registered email ID (<strong style={{ color: '#818cf8' }}>{profile.email}</strong>) with your mentor/admin so they can add you.
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Mentor Profile details */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{
              padding: '1.5rem 2rem',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            {mentor.profileImageUrl ? (
              <img src={mentor.profileImageUrl} alt="Mentor" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(99,102,241,0.3)' }} />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '800', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.2)' }}>
                {initials}
              </div>
            )}
            <div>
              <p style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Your Assigned Mentor</p>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'inherit', letterSpacing: '-0.01em', marginBottom: '0.2rem' }}>{mentor.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RiShieldLine style={{ color: '#a78bfa', fontSize: '0.9rem' }} />
                <span style={{ fontSize: '0.8rem', color: 'inherit', opacity: 0.7 }}>{mentor.designation || 'HOD / Coordinator'}</span>
              </div>
            </div>
          </motion.div>

          {/* Assessments list */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'inherit', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RiFileList3Line style={{ color: '#a855f7' }} /> Assessments & Tasks
            </h3>

            {assessments.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <RiFileList3Line style={{ fontSize: '2.5rem', color: '#4b5563', marginBottom: '0.75rem' }} />
                <p style={{ color: 'inherit', opacity: 0.6, fontSize: '0.875rem' }}>No assessments posted by your mentor yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {assessments.map((asm) => {
                  const sub = submissions[asm.id];

                  return (
                    <div key={asm.id} className="glass-card" style={{
                      padding: '1.5rem', position: 'relative',
                    }}>
                      {/* Badges top-right */}
                      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.625rem', fontWeight: '700', padding: '0.15rem 0.45rem', borderRadius: '99px',
                          background: asm.type === 'quiz' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                          color: asm.type === 'quiz' ? '#818cf8' : '#fb923c',
                          border: asm.type === 'quiz' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(245,158,11,0.3)'
                        }}>
                          {asm.type === 'quiz' ? 'Quiz' : 'Link'}
                        </span>
                        {sub ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', fontSize: '0.625rem', fontWeight: '700' }}>
                            Completed
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '99px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '0.625rem', fontWeight: '700' }}>
                            Pending
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'inherit', paddingRight: '7rem', marginBottom: '0.35rem' }}>{asm.title}</h4>
                      {asm.dueDate && <p style={{ fontSize: '0.75rem', color: '#fb923c', marginBottom: '0.75rem', fontWeight: '600' }}>Due Date & Time: {formatDueDate(asm.dueDate)}</p>}
                      {asm.description && <p style={{ fontSize: '0.85rem', color: 'inherit', opacity: 0.8, lineHeight: '1.6', marginBottom: '1.25rem' }}>{asm.description}</p>}

                      <hr style={{ border: 'none', borderTop: '1px solid rgba(124, 58, 237, 0.15)', marginBottom: '1.25rem' }} />

                      {/* --- Solution flows --- */}
                      {asm.type === 'link' ? (
                        <div>
                          {/* Target Leetcode Link */}
                          <div style={{ marginBottom: '1.25rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'inherit', opacity: 0.6 }}>Target Link:</span>
                            <a href={asm.problemUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: '#fb923c', textDecoration: 'none', marginTop: '0.2rem', fontWeight: '700' }}>
                              Go to problem page <RiExternalLinkLine />
                            </a>
                          </div>

                           {sub ? (
                            <div style={{ marginTop: '0.5rem' }}>
                              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700', display: 'block', marginBottom: '0.5rem' }}>
                                Submitted Solution:
                              </span>
                              <pre className="input-field" style={{
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                fontSize: '0.85rem',
                                maxHeight: '250px',
                                overflowY: 'auto',
                                height: 'auto',
                                display: 'block',
                                color: 'inherit',
                              }}>
                                {sub.solutionText || sub.solutionUrl}
                              </pre>
                            </div>
                          ) : (
                            <form onSubmit={(e) => handleSubmitLink(e, asm.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'inherit', opacity: 0.6, marginBottom: '0.4rem' }}>
                                  Your Solution (Paragraph or Code format):
                                </label>
                                <textarea
                                  required rows={6}
                                  placeholder="Write your explanation here in a paragraph, or paste your programming code / source code here..."
                                  value={linkDrafts[asm.id] || ''}
                                  onChange={e => setLinkDrafts(p => ({ ...p, [asm.id]: e.target.value }))}
                                  className="input-field"
                                  style={{ fontFamily: 'monospace', resize: 'vertical' }}
                                />
                              </div>
                              <button type="submit" className="btn-primary" style={{ padding: '0.7rem 1.5rem', alignSelf: 'flex-start' }}>
                                <RiSendPlaneLine /> Submit Solution
                              </button>
                            </form>
                          )}
                        </div>
                      ) : (
                        /* Timed Quiz Block */
                        <div>
                          {!sub ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                              <div>
                                <p style={{ fontSize: '0.85rem', color: 'inherit', fontWeight: '700' }}>Time Limit: {asm.duration} minutes</p>
                                <p style={{ fontSize: '0.75rem', color: 'inherit', opacity: 0.6 }}>Auto-evaluates once submitted. Make sure you don't refresh after starting.</p>
                              </div>
                              <button
                                onClick={() => handleStartQuiz(asm)}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)', fontSize: '0.82rem' }}
                              >
                                <RiPlayLine /> Start Quiz
                              </button>
                            </div>
                          ) : (
                            /* Submited Quiz review flow */
                            <div>
                              {!asm.resultsPublished ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.75rem' }}>
                                  <RiInformationLine style={{ color: '#fb923c' }} />
                                  <p style={{ fontSize: '0.8rem', color: '#fb923c' }}>Quiz submitted successfully. Results will be visible once published by your mentor.</p>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', marginBottom: '1.25rem' }}>
                                    <p style={{ fontSize: '0.72rem', color: 'inherit', opacity: 0.6, textTransform: 'uppercase', fontWeight: '600' }}>Your Grade / Score:</p>
                                    <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399', letterSpacing: '-0.02em', marginTop: '0.2rem' }}>
                                      {sub.score} / {sub.totalQs} ({Math.round((sub.score / sub.totalQs) * 100)}%)
                                    </p>
                                  </div>

                                  {/* Render MCQ questions showing selected vs correct */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                    {asm.questions?.map((q, qi) => {
                                      const studentAns = sub.answers?.[qi] || '';
                                      const isCorrect = studentAns === q.correctOption;
                                      return (
                                        <div key={qi} style={{ padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '0.75rem' }}>
                                          <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'inherit', marginBottom: '0.5rem' }}>
                                            Q{qi + 1}: {q.text}
                                          </p>
                                          <div style={{ paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                            {q.options?.map((opt, oi) => {
                                              const opChar = String.fromCharCode(65 + oi);
                                              const opSelected = studentAns === opChar;
                                              const opCorrect = q.correctOption === opChar;
                                              return (
                                                <p key={oi} style={{
                                                  fontSize: '0.78rem',
                                                  color: opCorrect ? '#34d399' : (opSelected ? '#f87171' : 'inherit'),
                                                  fontWeight: (opCorrect || opSelected) ? '700' : '400',
                                                  opacity: (opCorrect || opSelected) ? 1 : 0.6
                                                }}>
                                                  {opChar}. {opt} {opCorrect ? '(Correct)' : (opSelected ? '(Your Choice - Incorrect)' : '')}
                                                </p>
                                              );
                                            })}
                                          </div>
                                          {q.explanation && (
                                            <div style={{
                                              marginTop: '0.75rem',
                                              padding: '0.6rem 0.85rem',
                                              borderRadius: '0.5rem',
                                              background: 'rgba(99, 102, 241, 0.08)',
                                              borderLeft: '3px solid #6366f1',
                                              fontSize: '0.78rem',
                                              color: 'inherit',
                                            }}>
                                              <strong style={{ color: '#818cf8', display: 'block', marginBottom: '0.2rem' }}>Explanation:</strong>
                                              {q.explanation}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
