import RichContent from './RichContent';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Save, CheckCircle, Eye, BookOpen, Users, AlignLeft,
  WifiOff, RefreshCw, Edit3, FileText, Download,
  Check, X as XIcon, ArrowLeft, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, Video, Image
} from 'lucide-react';

// ─── 0. SKELETON LOADER ──────────────────────────────────────────────────────
export const GradingSkeleton = ({ themeColor }) => (
  <div className="tag-root">
    <style>{`
      @keyframes gradSkPulse { 
        0% { background-color: ${themeColor}15; } 
        50% { background-color: ${themeColor}30; } 
        100% { background-color: ${themeColor}15; } 
      } 
      .grd-sk { animation: gradSkPulse 1.5s ease-in-out infinite; border-radius: 6px; }
    `}</style>
    
    <div style={{ 
      display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '2rem',
      padding: '1.5rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.75)', 
      backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
    }}>
      <div className="grd-sk" style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div className="grd-sk" style={{ width: '180px', height: '14px' }} />
        <div className="grd-sk" style={{ width: '350px', height: '28px', borderRadius: '0.5rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          <div className="grd-sk" style={{ width: '80px', height: '24px', borderRadius: '2rem' }} />
          <div className="grd-sk" style={{ width: '110px', height: '24px', borderRadius: '2rem' }} />
          <div className="grd-sk" style={{ width: '90px', height: '24px', borderRadius: '2rem' }} />
        </div>
        <div className="grd-sk" style={{ width: '100%', maxWidth: '600px', height: '45px', borderRadius: '0.75rem', marginTop: '0.5rem' }} />
      </div>
    </div>

    <div className="tag-container" style={{ 
      background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', 
      borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
      border: '1px solid rgba(255,255,255,0.6)' 
    }}>
      <table className="tag-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <th style={{ padding: '1.25rem 1rem' }}><div className="grd-sk" style={{ width: '120px', height: '14px' }} /></th>
            <th style={{ padding: '1.25rem 1rem' }}><div className="grd-sk" style={{ width: '80px', height: '14px', margin: '0 auto' }} /></th>
            <th style={{ padding: '1.25rem 1rem' }}><div className="grd-sk" style={{ width: '60px', height: '14px', margin: '0 auto' }} /></th>
            <th style={{ padding: '1.25rem 1rem' }}><div className="grd-sk" style={{ width: '70px', height: '14px', margin: '0 auto' }} /></th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map(n => (
            <tr key={n} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="grd-sk" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div className="grd-sk" style={{ width: '140px', height: '14px' }} />
                    <div className="grd-sk" style={{ width: '90px', height: '12px' }} />
                  </div>
                </div>
              </td>
              <td style={{ padding: '1rem' }}><div className="grd-sk" style={{ width: '85px', height: '32px', borderRadius: '0.5rem', margin: '0 auto' }} /></td>
              <td style={{ padding: '1rem' }}><div className="grd-sk" style={{ width: '30px', height: '18px', margin: '0 auto' }} /></td>
              <td style={{ padding: '1rem' }}><div className="grd-sk" style={{ width: '75px', height: '24px', borderRadius: '2rem', margin: '0 auto' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── 1. GRADE EXAM SUBMISSION MODAL ──────────────────────────────────────────
export const GradeExamSubmissionModal = ({ studentId, activityId, classId, quarter, studentName, onClose, onRefresh, themeColor, API_BASE_URL }) => {
  const [examData, setExamData] = useState([]);
  const [proctoring, setProctoring] = useState({ violation_count: 0, auto_submit_reason: null, violation_log: null });
  const [isLoadingExam, setIsLoadingExam] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [essayScores, setEssayScores] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const loadExamData = async () => {
      setIsLoadingExam(true);
      try {
        const token = localStorage.getItem('sms_token');
        const res = await axios.get(`${API_BASE_URL}/teacher/get_exam_questions.php`, {
          params: { activity_id: activityId, student_id: studentId },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.status === 'success') {
          const questions = res.data.questions || [];
          setExamData(questions);
          if (res.data.proctoring) {
            setProctoring(res.data.proctoring);
          }
          const essays = questions.filter(q => q.question_type === 'essay');
          setEssayScores(essays.map(q => ({
            question_id: q.id,
            score: q.points_earned !== null ? q.points_earned : ''
          })));
        }
      } catch (error) {
        console.error('Failed to fetch exam questions:', error);
      } finally {
        setIsLoadingExam(false);
      }
    };
    if (activityId && studentId) loadExamData();
  }, [activityId, studentId, API_BASE_URL]);

  const objectiveQuestions = examData.filter(q => q.question_type !== 'essay');
  const essayQuestions = examData.filter(q => q.question_type === 'essay');

  const totalMcScore = objectiveQuestions.reduce((sum, q) => sum + (parseFloat(q.points_earned) || 0), 0);
  const maxMcScore = objectiveQuestions.reduce((sum, q) => sum + (parseFloat(q.max_points) || 0), 0);
  const currentEssayTotal = essayScores.reduce((sum, item) => sum + (parseFloat(item.score) || 0), 0);
  const maxEssayScore = essayQuestions.reduce((sum, q) => sum + (parseFloat(q.max_points) || 0), 0);
  
  const overallTotal = totalMcScore + currentEssayTotal;
  const overallMax = maxMcScore + maxEssayScore;

  let parsedViolationLogs = [];
  if (proctoring?.violation_log) {
    try {
      parsedViolationLogs = typeof proctoring.violation_log === 'string'
        ? JSON.parse(proctoring.violation_log)
        : proctoring.violation_log;
    } catch (e) {}
  }

  const handleScoreChange = (questionId, value) => {
    setEssayScores(prev => prev.map(item => {
      if (item.question_id === questionId) {
        const essayMax = parseFloat(essayQuestions.find(q => q.id === questionId)?.max_points || 100);
        let numValue = parseFloat(value);
        if (isNaN(numValue)) return { ...item, score: '' };
        return { ...item, score: Math.min(Math.max(0, numValue), essayMax) };
      }
      return item;
    }));
  };

  const handleSaveGrades = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sms_token');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = { 
        student_id: studentId, 
        activity_id: activityId, 
        score: overallTotal, 
        essay_scores: essayScores.map(s => ({
          question_id: s.question_id,
          score: s.score === '' ? 0 : parseFloat(s.score)
        }))
      };
      
      const res = await axios.post(`${API_BASE_URL}/teacher/save_activity_scores.php`, payload, { headers });

      if (res.data.status === 'success') {
        await axios.post(`${API_BASE_URL}/teacher/sync_grades.php`, { class_id: parseInt(classId), quarter: quarter }, { headers });
        alert("Exam graded and Class Gradebook updated!");
        if (onRefresh) onRefresh(); 
        onClose();     
      }
    } catch (error) {
      alert("Error grading exam.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingExam) {
    return (
      <div className="glass-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: `4px solid ${themeColor}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ margin: 0, color: '#475569', fontWeight: 600 }}>Loading student exam paper...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="glass-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', overflowY: 'auto' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '920px', background: '#f8fafc', borderRadius: '1.25rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 2rem)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.5rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#e0e7ff', color: '#1e40af', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                EXAM REVIEWER
              </span>
              {Number(proctoring?.violation_count || 0) > 0 ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 800 }}>
                  <ShieldAlert size={13} /> {proctoring.violation_count} Anti-Cheat Violation(s)
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 800 }}>
                  <ShieldCheck size={13} /> Clean Attempt (0 Violations)
                </span>
              )}
            </div>
            <h2 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.4rem' }}>{studentName}'s Paper</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Exam Score</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: themeColor, lineHeight: 1 }}>{overallTotal.toFixed(1)}</span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>/ {overallMax}</span>
              </div>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }}></div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '0.6rem', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>
              <XIcon size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          {/* ANTI-CHEAT PROCTORING LOG BANNER IF FLAGGED */}
          {(Number(proctoring?.violation_count || 0) > 0 || proctoring?.auto_submit_reason) && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '1rem', padding: '1rem 1.25rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <AlertTriangle size={18} />
                <span>Anti-Cheat Proctoring Report</span>
                {proctoring?.auto_submit_reason && (
                  <span style={{ marginLeft: 'auto', background: '#fee2e2', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.72rem' }}>
                    Auto-Submitted: {proctoring.auto_submit_reason}
                  </span>
                )}
              </div>
              {parsedViolationLogs.length > 0 && (
                <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0, fontSize: '0.78rem', color: '#7f1d1d', fontWeight: 600 }}>
                  {parsedViolationLogs.map((logItem, idx) => (
                    <li key={idx} style={{ marginBottom: '0.2rem' }}>{logItem}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {objectiveQuestions.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <BookOpen size={20} color="#64748b" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>
                  Part I: Objective Items <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginLeft: '0.5rem' }}>(Auto-Graded)</span>
                </h3>
                <span style={{ marginLeft: 'auto', background: '#e2e8f0', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  {totalMcScore} / {maxMcScore} Pts
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
                {objectiveQuestions.map((q, idx) => {
                  const correctAnswerText = q.correct_answer_text || q.choices?.filter(c => c.is_correct == 1).map(c => c.choice_text).join(', ') || 'N/A';
                  return (
                    <div key={q.id} style={{ background: 'white', border: `1px solid ${q.is_correct ? '#a7f3d0' : '#fecaca'}`, borderRadius: '0.75rem', padding: '1.25rem', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: q.is_correct ? '#10b981' : '#ef4444' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.85rem' }}>
                          Q{idx + 1}. <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8' }}>({q.question_type.replace('_', ' ')})</span>
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: q.is_correct ? '#059669' : '#dc2626' }}>
                          {q.points_earned} / {q.max_points} pts
                        </span>
                      </div>
                      <RichContent as="div" html={q.question_text} style={{ margin: '0 0 1rem 0', fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', lineHeight: 1.5 }} />
                      <div style={{ background: q.is_correct ? '#f0fdf4' : '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        {q.is_correct ? <Check size={16} color="#10b981" style={{ marginTop: '0.1rem' }} /> : <XIcon size={16} color="#ef4444" style={{ marginTop: '0.1rem' }} />}
                        <div>
                          <p style={{ margin: 0, color: q.is_correct ? '#065f46' : '#991b1b', fontSize: '0.85rem', fontWeight: 700 }}>
                            Student Answer: {q.student_answer || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>No Answer</span>}
                          </p>
                          {!q.is_correct && (
                            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                              Answer Key: <span style={{ color: '#059669', fontWeight: 800 }}>{correctAnswerText}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {essayQuestions.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <Edit3 size={20} color={themeColor} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Part II: Essay Responses <span style={{ fontSize: '0.85rem', color: themeColor, fontWeight: 600, marginLeft: '0.5rem' }}>(Needs Grading)</span>
                </h3>
                <span style={{ marginLeft: 'auto', background: `${themeColor}20`, padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, color: themeColor }}>
                  {currentEssayTotal} / {maxEssayScore} Pts
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {essayQuestions.map((essay, index) => {
                  const essayScore = essayScores.find(s => s.question_id === essay.id)?.score ?? '';
                  const eMax = parseFloat(essay.max_points) || 100;
                  return (
                    <div key={essay.id} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ padding: '1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <div style={{ background: themeColor, color: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>{index + 1}</div>
                          <div style={{ flex: 1 }}><RichContent html={essay.question_text} style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '1.05rem', lineHeight: '1.5' }} /></div>
                        </div>
                      </div>
                      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ background: '#f1f5f9', padding: '1.25rem', borderRadius: '0.75rem', borderLeft: `4px solid ${themeColor}` }}>
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Student's Answer:</p>
                          <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{essay.essay_answer || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No answer provided by the student.</span>}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>POINTS AWARDED:</label>
                          <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '0.5rem', padding: '0.3rem', border: `2px solid ${themeColor}`, width: '160px', boxShadow: `0 0 0 3px ${themeColor}15` }}>
                            <input type="number" min="0" max={eMax} placeholder="0" value={essayScore} onChange={(e) => handleScoreChange(essay.id, e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontWeight: 800, color: '#1e293b', fontSize: '1.2rem' }} />
                            <span style={{ paddingRight: '0.75rem', color: '#94a3b8', fontWeight: 700, borderLeft: '1px solid #e2e8f0', paddingLeft: '0.5rem' }}>/ {eMax}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : objectiveQuestions.length > 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'white', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
              <div style={{ display: 'inline-flex', padding: '1.25rem', background: '#d1fae5', borderRadius: '50%', marginBottom: '1rem' }}><CheckCircle size={42} color="#059669" /></div>
              <h3 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.35rem', margin: '0 0 0.4rem 0' }}>Exam is Fully Auto-Graded!</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto', lineHeight: 1.5 }}>
                All objective items (Multiple Choice, Checkboxes, True/False, Identification, Fill in the Blank, Enumeration) have been scored automatically.
              </p>
            </div>
          ) : null}
        </div>

        <div style={{ padding: '1.5rem 2rem', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Click Save Exam & Sync to push scores to the Class Gradebook.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '0.8rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSaveGrades} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: themeColor, color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '0.75rem', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, boxShadow: `0 4px 15px ${themeColor}40` }}>
              <Save size={18} /> {isSaving ? 'Processing...' : 'Save Exam & Sync'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── 2. VIEW SUBMISSION MODAL ────────────────────────────────────────────────
export const ViewSubmissionModal = ({ studentId, activityId, classId, quarter, studentName, maxScore, submission, currentScore, onRefresh, onClose, themeColor, API_BASE_URL }) => {
  const [scoreInput, setScoreInput] = useState(currentScore || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sms_token');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        activity_id: activityId, student_id: studentId,
        score: scoreInput === '' ? 0 : parseFloat(scoreInput)
      };
      
      const res = await axios.post(`${API_BASE_URL}/teacher/save_activity_scores.php`, payload, { headers });

      if (res.data.status === 'success') {
        await axios.post(`${API_BASE_URL}/teacher/sync_grades.php`, { class_id: parseInt(classId), quarter: quarter }, { headers });
        alert("Score saved and Gradebook updated!");
        if (onRefresh) onRefresh();
        onClose();
      }
    } catch (error) {
      alert("Error saving score.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', overflowY: 'auto' }} onClick={onClose}>
      <div className="glass-modal" style={{ width: '100%', maxWidth: '620px', maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column', background: '#f8fafc', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ flexShrink: 0, padding: '1.25rem 1.75rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: '1.25rem' }}>Review Submission</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>{studentName}</p>
          </div>
          <button onClick={onClose} title="Close" style={{ border: '1.5px solid #cbd5e1', background: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XIcon size={18} /></button>
        </div>
        <div style={{ padding: '1.5rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1 }}>
          
          {/* 1. UPLOADED PHOTO OF PAPER WORK / FILE */}
          {(submission?.file_url || (submission?.type === 'file' && submission?.content)) && (() => {
            const fileName = submission.file_url || submission.content;
            const fileUrl = `${API_BASE_URL}/api/uploads/submissions/${fileName}`;
            const isImage = /\.(jpe?g|png|webp|gif)$/i.test(fileName);

            return (
              <div style={{ padding: '1.25rem', border: '1.5px solid #cbd5e1', borderRadius: '0.85rem', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: 800, fontSize: '0.9rem' }}>
                    {isImage ? <Image size={18} color={themeColor} /> : <FileText size={18} color={themeColor} />}
                    <span>{isImage ? 'Uploaded Paper Work / Photo' : 'Uploaded File / Document'}</span>
                  </div>
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem', 
                      background: 'white', border: '1px solid #cbd5e1', color: '#334155', 
                      padding: '0.45rem 0.9rem', borderRadius: '0.5rem', textDecoration: 'none', 
                      fontWeight: 700, fontSize: '0.78rem' 
                    }}
                  >
                    <ExternalLink size={13} /> Open Full File ↗
                  </a>
                </div>

                {isImage ? (
                  <div style={{ textAlign: 'center', background: '#ffffff', padding: '0.75rem', borderRadius: '0.65rem', border: '1px solid #e2e8f0' }}>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" title="Click to open full size">
                      <img 
                        src={fileUrl} 
                        alt="Student Paper Work" 
                        style={{ maxWidth: '100%', maxHeight: '380px', borderRadius: '0.5rem', objectFit: 'contain', margin: '0 auto', cursor: 'zoom-in' }} 
                      />
                    </a>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Click photo to open high resolution in new tab</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '0.85rem', borderRadius: '0.65rem', border: '1px solid #e2e8f0' }}>
                    <FileText size={28} color={themeColor} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.85rem', wordBreak: 'break-all' }}>{fileName}</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Student Document</p>
                    </div>
                    <a href={fileUrl} download style={{ background: themeColor, color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Download size={14} /> Download
                    </a>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 2. VIDEO LINK / GOOGLE DOCS LINK */}
          {(submission?.url || (submission?.content && String(submission.content).startsWith('http'))) && (() => {
            const linkUrl = submission.url || submission.content;
            const isVideo = /(youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|drive\.google\.com.*\/(file|view)|video)/i.test(linkUrl);

            return (
              <div style={{ padding: '1.25rem', border: '1.5px solid #c7d2fe', borderRadius: '0.85rem', background: '#f5f7ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: isVideo ? '#b91c1c' : '#3730a3', fontWeight: 800, fontSize: '0.88rem' }}>
                  {isVideo ? <Video size={18} color="#dc2626" /> : <ExternalLink size={18} color={themeColor} />}
                  <span>{isVideo ? 'Performance Video Link (Dance / Presentation)' : 'Google Docs / Online Link'}</span>
                </div>
                <p style={{ margin: '0 0 0.85rem 0', color: '#4b5563', fontSize: '0.85rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {linkUrl}
                </p>
                <a 
                  href={linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                    background: isVideo ? '#dc2626' : themeColor, color: 'white', 
                    padding: '0.65rem 1.25rem', borderRadius: '0.6rem', textDecoration: 'none', 
                    fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
                  }}
                >
                  <ExternalLink size={15} /> {isVideo ? 'Watch Performance Video ↗' : 'Open Link in New Tab ↗'}
                </a>
              </div>
            );
          })()}

          {/* 3. WRITTEN TEXT / ESSAY */}
          {submission?.content && !String(submission.content).startsWith('http') && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', borderLeft: `4px solid ${themeColor}`, borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginBottom: '0.85rem' }}>
                <AlignLeft size={16} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Written Work / Notes:</span>
              </div>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {submission.content}
              </p>
            </div>
          )}

          {!submission?.file_url && !submission?.url && (!submission?.content || submission?.content.trim() === '') && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.95rem' }}>
              No submission content provided by the student.
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, padding: '1.25rem 1.75rem', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Score Given:</label>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '0.5rem', padding: '0.3rem', border: `1px solid ${themeColor}`, width: '130px' }}>
            <input type="number" min="0" max={maxScore} placeholder="0" value={scoreInput} onChange={(e) => setScoreInput(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }} />
            <span style={{ paddingRight: '0.5rem', color: '#94a3b8', fontWeight: 700 }}>/ {Math.round(maxScore)}</span>
          </div>
          <button onClick={handleSave} disabled={isSaving} style={{ background: themeColor, color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={16} /> {isSaving ? 'Saving...' : 'Save & Sync'}</button>
        </div>
      </div>
    </div>
  );
};

// ─── 3. OFFLINE BANNER ───────────────────────────────────────────────────────
export const GradingOfflineBanner = ({ isServerOffline, isRetrying, onRetry }) => {
  if (!isServerOffline) return null;
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(251,191,36,0.5)', borderRadius: '0.85rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#f59e0b,#ef4444,#f59e0b)', opacity: 0.8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ padding: '0.4rem', background: 'rgba(251,191,36,0.15)', borderRadius: '0.5rem', border: '1px solid rgba(251,191,36,0.3)', display: 'flex' }}><WifiOff size={15} color="#b45309" /></div>
        <div>
          <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Database Offline</p>
          <p style={{ margin: 0, fontSize: '0.68rem', color: '#a16207', fontWeight: 500 }}>Cannot connect. Scores may not be saved.</p>
        </div>
      </div>
      <button onClick={onRetry} disabled={isRetrying} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '0.6rem', fontSize: '0.7rem', fontWeight: 700, color: '#92400e', cursor: 'pointer' }}><RefreshCw size={12} style={{ animation: isRetrying ? 'spin 1s linear infinite' : 'none' }} /> Retry</button>
    </div>
  );
};

// ─── 4. GRADING HEADER ───────────────────────────────────────────────────────
export const GradingHeader = ({ navigate, themeColor, subject, section, activity, qNum, qColors }) => (
  <div className="tag-header" style={{ alignItems: 'flex-start' }}>
    <div className="tag-header-info" style={{ alignItems: 'flex-start' }}>
      <button className="tag-back-btn" onClick={() => navigate(-1)} style={{ marginTop: '0.25rem' }}><ArrowLeft size={18} color="#64748b" /></button>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <BookOpen size={12} />
          <span>{subject ?? activity?.subject_name ?? 'Subject'}</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>{section ?? activity?.section_name ?? activity?.section ?? 'Section'}</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{activity?.title}</h1>
        <div className="tag-badge-group" style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span className="tag-badge">{activity?.category}</span>
          <span className="tag-badge" style={{ color: themeColor }}>Max Score: {activity?.max_score && Math.round(activity.max_score)}</span>
          {qNum && qColors && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px', backgroundColor: qColors.bg, color: qColors.color, border: `1px solid ${qColors.border}` }}>
              Q{qNum} — {['First', 'Second', 'Third', 'Fourth'][qNum - 1]} Quarter
            </span>
          )}
        </div>
        {activity?.description && (
          <div style={{ display: 'flex', gap: '0.5rem', color: '#475569', backgroundColor: 'rgba(255,255,255,0.6)', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.05)', maxWidth: '600px' }}>
            <AlignLeft size={16} color={themeColor} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.5' }}>{activity.description}</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ─── 5. GRADING TABLE ────────────────────────────────────────────────────────
export const GradingTable = ({ scores, themeColor, activity, isActivityAnExam, setGradingExamStudent, setViewingWrittenWork }) => (
  <div className="tag-container">
    <table className="tag-table">
      <thead>
        <tr>
          <th className="tag-th">STUDENT NAME</th>
          <th className="tag-th" style={{ textAlign: 'center' }}>SUBMISSION</th>
          {isActivityAnExam && <th className="tag-th" style={{ textAlign: 'center' }}>PROCTORING</th>}
          <th className="tag-th" style={{ textAlign: 'center' }}>
            SCORE
            {activity?.max_score && <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: '0.3rem' }}>/ {Math.round(activity.max_score)}</span>}
          </th>
          <th className="tag-th" style={{ textAlign: 'center' }}>STATUS</th>
        </tr>
      </thead>
      <tbody>
        {scores.length === 0 ? (
          <tr>
            <td colSpan={isActivityAnExam ? 5 : 4} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ color: '#475569', fontWeight: 700, fontSize: '1rem', margin: '0 0 0.5rem 0' }}>No Students Found</p>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>There are no students enrolled in this class yet.</p>
            </td>
          </tr>
        ) : scores.map(s => {
          const status = s.status || 'Pending';
          let badgeBg = '#f1f5f9', badgeColor = '#475569';
          if (status === 'Graded') { badgeBg = '#d1fae5'; badgeColor = '#065f46'; }
          else if (status === 'Submitted') { badgeBg = '#dbeafe'; badgeColor = '#1e40af'; }

          const vCount = parseInt(s.violation_count || 0, 10);

          return (
            <tr key={s.student_id}>
              <td className="tag-td">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: themeColor }}>
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.student_id}</div>
                  </div>
                </div>
              </td>
              <td className="tag-td" style={{ textAlign: 'center' }}>
                {status !== 'Pending' ? (
                  <button 
                    onClick={() => isActivityAnExam ? setGradingExamStudent(s) : setViewingWrittenWork(s)}
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.45rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: themeColor, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <Eye size={14} /> Review
                  </button>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>No Submission</span>
                )}
              </td>
              {isActivityAnExam && (
                <td className="tag-td" style={{ textAlign: 'center' }}>
                  {status === 'Pending' ? (
                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>—</span>
                  ) : vCount > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '2rem', fontSize: '0.68rem', fontWeight: 800, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                      <ShieldAlert size={12} /> {vCount} {vCount === 1 ? 'Strike' : 'Strikes'}
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', borderRadius: '2rem', fontSize: '0.68rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                      <ShieldCheck size={12} /> Clean
                    </span>
                  )}
                </td>
              )}
              <td className="tag-td" style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{s.score !== '' ? s.score : '-'}</span>
              </td>
              <td className="tag-td" style={{ textAlign: 'center' }}>
                <span style={{ display: 'inline-block', padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px', backgroundColor: badgeBg, color: badgeColor }}>
                  {status.toUpperCase()}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
