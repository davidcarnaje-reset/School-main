import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, ArrowLeft, Save, CheckCircle2, Circle, School, AlignLeft } from 'lucide-react';
import axios from 'axios';
import { getTeacherLevel } from '../../utils/gradingUtils';

// ─── Quarter Colors Helper ───
const quarterColors = {
  1: { bg: '#dbeafe', color: '#1e40af' },
  2: { bg: '#d1fae5', color: '#065f46' },
  3: { bg: '#fef3c7', color: '#92400e' },
  4: { bg: '#ede9fe', color: '#5b21b6' },
};

const CreateExam = () => {
  const { user, API_BASE_URL, branding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const themeColor = branding?.theme_color || '#6366f1';
  const bottomRef = useRef(null);

  // 1. Fetch Assigned Classes State
  const [assignedClasses, setAssignedClasses] = useState([]);
  
  // 2. Exam Details State
  const [examDetails, setExamDetails] = useState({
    class_id: location.state?.classId || '', 
    title: '',
    category: 'exam',
    quarter: '',
    description: '',
  });

  // 3. Questions State
  const defaultQuestionId = Date.now();
  const [questions, setQuestions] = useState([
    {
      id: defaultQuestionId,
      type: 'multiple_choice',
      text: '',
      points: 1,
      choices: ['', '', '', ''],
      correctChoiceIndex: 0
    }
  ]);

  // 🔴 GOOGLE FORMS FEATURE: State para i-track kung aling question ang kasalukuyang ine-edit
  const [activeQuestionId, setActiveQuestionId] = useState(defaultQuestionId);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔴 AUTO-CALCULATE TOTAL MAX SCORE
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  // ─── Fetch Teacher's Classes ─────────────────────────────────────────────
  useEffect(() => {
    const fetchClasses = async () => {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem('sms_token');
        const res = await axios.get(`${API_BASE_URL}/teacher/get_my_schedule.php`, {
          params: { teacher_id: user.id },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === 'success') {
          const classes = res.data.data;
          setAssignedClasses(classes);
          
          if (!examDetails.class_id && classes.length > 0) {
            setExamDetails(prev => ({ ...prev, class_id: classes[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    };
    fetchClasses();
  }, [user?.id, API_BASE_URL, examDetails.class_id]);

  const selectedClass = assignedClasses.find(c => String(c.id) === String(examDetails.class_id));
  const isKto12 = selectedClass ? getTeacherLevel(selectedClass) !== 'College' : true;

  // Auto-scroll to bottom kapag nag-add ng question
  useEffect(() => {
    if (questions.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [questions.length]);

  // ─── Question Handlers ──────────────────────────────────────────────────
  const addQuestion = () => {
    const newId = Date.now();
    setQuestions([
      ...questions,
      { id: newId, type: 'multiple_choice', text: '', points: 1, choices: ['', '', '', ''], correctChoiceIndex: 0 }
    ]);
    // Set ang bagong gawang question bilang "Active"
    setActiveQuestionId(newId);
  };

  const removeQuestion = (idToRemove, e) => {
    e.preventDefault();
    e.stopPropagation(); // Pinipigilan nitong ma-trigger ang pagiging 'active' ng card kapag dinelete
    
    if (questions.length === 1) return alert("You must have at least one question.");
    
    const newQuestions = questions.filter(q => q.id !== idToRemove);
    setQuestions(newQuestions);
    
    // Kung ang dinelete ay ang active, ilipat ang active status sa unang question
    if (activeQuestionId === idToRemove) {
      setActiveQuestionId(newQuestions[0].id);
    }
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateChoice = (questionId, choiceIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newChoices = [...q.choices];
        newChoices[choiceIndex] = value;
        return { ...q, choices: newChoices };
      }
      return q;
    }));
  };

  // ─── Submit Handler ─────────────────────────────────────────────────────
  const handleSaveExam = async () => {
    if (!examDetails.class_id) return alert("Class ID is missing.");
    if (isKto12 && !examDetails.quarter) return alert("Please select a Quarter.");
    if (!examDetails.title.trim()) return alert("Please provide an exam title.");
    
    const hasEmptyQuestions = questions.some(q => !q.text.trim());
    if (hasEmptyQuestions) return alert("Please fill in all question fields before saving.");

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sms_token');
      // Ipasa ang total computed points bilang max_score sa backend payload
      const payload = { 
        teacher_id: user.id, 
        exam_details: { ...examDetails, max_score: totalPoints }, 
        questions: questions 
      };
      
      const res = await axios.post(`${API_BASE_URL}/teacher/create_exam.php`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        alert("Exam successfully created!");
        navigate(-1);
      } else {
        alert(res.data.message || "Failed to save exam.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="exam-builder-root" style={{ '--theme-color': themeColor, padding: '1rem 1rem 4rem 1rem', maxWidth: '850px', margin: '0 auto' }}>
      
      {/* ─── STYLES (Glassmorphism & Google Forms UX) ─── */}
      <style>{`
        .glass-panel {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .gf-card { position: relative; padding: 2rem; margin-bottom: 1.5rem; overflow: hidden; }
        
        .gf-header-card {
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.08);
        }
        .gf-header-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 12px; background-color: var(--theme-color); }

        /* --- GOOGLE FORMS ACTIVE STATE CSS --- */
        .gf-question-card { 
          animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          cursor: pointer;
        }
        
        /* INACTIVE Question Styling */
        .gf-question-card.inactive {
          background: rgba(255, 255, 255, 0.5);
          border-left: 6px solid transparent;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          transform: scale(0.99);
        }
        .gf-question-card.inactive:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        /* ACTIVE Question Styling */
        .gf-question-card.active {
          background: rgba(255, 255, 255, 1);
          border-left: 6px solid var(--theme-color);
          box-shadow: 0 15px 40px -10px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px) scale(1);
          cursor: default;
        }

        /* --- MODERN INPUT STYLES --- */
        .gf-title-input {
          width: 100%; font-size: 2rem; font-weight: 800; color: #0f172a;
          padding: 0.5rem 0; background: transparent; border: none;
          border-bottom: 2px solid rgba(0,0,0,0.1); font-family: inherit; transition: all 0.3s ease;
        }
        .gf-title-input:focus { outline: none; border-bottom-color: var(--theme-color); }
        .gf-title-input::placeholder { color: #cbd5e1; }

        .gf-desc-input, .gf-question-input {
          width: 100%; font-size: 1rem; padding: 0.85rem 1rem; color: #334155;
          background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 0.5rem; font-family: inherit; transition: all 0.2s ease;
          resize: vertical;
        }
        .gf-question-input { background: #f8fafc; border-color: rgba(0,0,0,0.08); } 
        .gf-desc-input:focus, .gf-question-input:focus {
          outline: none; background: #ffffff; border-color: var(--theme-color);
          box-shadow: 0 0 0 3px rgba(0,0,0,0.03);
        }

        .gf-choice-input {
          flex: 1; padding: 0.6rem 0.5rem; font-size: 0.95rem; color: #1e293b;
          background: transparent; border: none; border-bottom: 1px solid transparent;
          font-family: inherit; transition: all 0.2s ease;
        }
        .gf-choice-input:hover { border-bottom-color: rgba(0,0,0,0.2); }
        .gf-choice-input:focus {
          outline: none; background: rgba(255,255,255,0.8);
          border-bottom: 2px solid var(--theme-color); border-radius: 0.25rem 0.25rem 0 0;
        }

        .glass-label { display: block; font-size: 0.75rem; font-weight: 800; color: #475569; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px; }

        @keyframes slideUpFade { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        .choice-row { display: flex; alignItems: center; gap: 1rem; margin-bottom: 0.5rem; padding: 0.25rem 0.5rem; border-radius: 0.5rem; transition: background 0.2s; }
        .choice-row:focus-within { background: rgba(241, 245, 249, 0.5); }
        
        .radio-btn { cursor: pointer; color: #cbd5e1; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .radio-btn:hover { color: #94a3b8; }
        .radio-btn.selected { color: #22c55e; transform: scale(1.15); }

        .btn-glass {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.85rem 1.75rem; border-radius: 0.75rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-add { background: rgba(255,255,255,0.9); border: 2px solid var(--theme-color); color: var(--theme-color); }
        .btn-add:hover { background: var(--theme-color); color: white; transform: translateY(-2px); border-style: solid; }
        .btn-save { background: var(--theme-color); border: none; color: white; box-shadow: 0 4px 15px var(--theme-color)40; }
        .btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px var(--theme-color)60; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* ─── HEADER ACTIONS ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='#f8fafc'} onMouseOut={e => e.currentTarget.style.background='white'}>
          <ArrowLeft size={20} color="#64748b" />
        </button>
        <h1 className="header-jakarta" style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem', fontWeight: 800 }}>Create Examination</h1>
      </div>

      {/* ─── EXAM DETAILS (HEADER CARD) ─── */}
      <div 
        className={`glass-panel gf-card gf-header-card ${activeQuestionId === 'header' ? 'active' : 'inactive'}`} 
        onClick={() => setActiveQuestionId('header')}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        
        {/* Read-Only Class Display & Quarter Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: isKto12 ? '1fr 1fr' : '1fr', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          
          <div>
            <label className="glass-label"><School size={12} style={{ display: 'inline', marginRight: '4px', marginBottom: '2px' }}/> Assigned Class</label>
            <div style={{ 
              padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '0.5rem', color: '#1e293b', fontWeight: 700, fontSize: '0.95rem'
            }}>
              {selectedClass ? `${selectedClass.subject_description} - ${selectedClass.section_name || selectedClass.section}` : 'Loading details...'}
            </div>
          </div>

          {isKto12 && (
            <div>
              <label className="glass-label">Quarter <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[1, 2, 3, 4].map(q => {
                  const qc = quarterColors[q];
                  const selected = String(examDetails.quarter) === String(q);
                  return (
                    <button
                      key={q} type="button" onClick={() => setExamDetails({ ...examDetails, quarter: q })}
                      style={{
                        padding: '0.6rem 0', borderRadius: '0.5rem',
                        border: selected ? `2px solid ${qc.color}` : '1px solid rgba(0,0,0,0.1)',
                        background: selected ? qc.bg : 'rgba(255,255,255,0.6)',
                        color: selected ? qc.color : '#64748b',
                        fontWeight: selected ? 800 : 600, fontSize: '0.85rem', cursor: 'pointer',
                        transition: 'all 0.2s', boxShadow: selected ? `0 4px 10px ${qc.color}30` : 'none'
                      }}
                    >
                      Q{q}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Title, Description & Total Points display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
            <input 
              type="text" placeholder="Exam Title (e.g. 1st Quarter Examination in Math)"
              value={examDetails.title} onChange={(e) => setExamDetails({...examDetails, title: e.target.value})}
              className="gf-title-input header-jakarta"
            />
            {/* TOTAL POINTS BADGE */}
            <div style={{ background: themeColor, color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '0.5rem' }}>
              Total Points: {totalPoints}
            </div>
          </div>
          <textarea 
            placeholder="Form description or instructions (Optional)"
            value={examDetails.description} onChange={(e) => setExamDetails({...examDetails, description: e.target.value})}
            className="gf-desc-input"
            style={{ minHeight: '80px' }}
          />
        </div>
      </div>

      {/* ─── QUESTIONS BUILDER ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {questions.map((q, index) => {
          const isActive = activeQuestionId === q.id;

          return (
            <div 
              key={q.id} 
              onClick={() => setActiveQuestionId(q.id)}
              className={`glass-panel gf-card gf-question-card ${isActive ? 'active' : 'inactive'}`}
            >
              
              {/* Question Type Selector */}
              {isActive && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                    className="gf-desc-input"
                    style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700, color: themeColor, border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="essay">Essay / Paragraph</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <span style={{ fontWeight: 800, color: themeColor, fontSize: '1.2rem', marginTop: '0.6rem' }}>
                  {index + 1}.
                </span>
                <textarea
                  placeholder="Type your question here..."
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                  className="gf-question-input"
                  style={{ minHeight: '60px' }}
                />
              </div>

              {/* 🔴 CONDITIONAL RENDERING: Choices o Essay Dummy Input */}
              {q.type === 'multiple_choice' ? (
                <div style={{ paddingLeft: '2.2rem' }}>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>
                    Click the circle to set the correct answer
                  </p>
                  {q.choices.map((choice, cIndex) => (
                    <div key={cIndex} className="choice-row">
                      <div onClick={() => updateQuestion(q.id, 'correctChoiceIndex', cIndex)} className={`radio-btn ${q.correctChoiceIndex === cIndex ? 'selected' : ''}`} title="Mark as correct answer">
                        {q.correctChoiceIndex === cIndex ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <Circle size={22} />}
                      </div>
                      <input
                        type="text" placeholder={`Option ${cIndex + 1}`} value={choice}
                        onChange={(e) => updateChoice(q.id, cIndex, e.target.value)}
                        className="gf-choice-input"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ paddingLeft: '2.2rem', opacity: 0.7 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#94a3b8' }}>
                     <AlignLeft size={18} />
                     <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Long answer text</span>
                   </div>
                   <textarea
                     disabled
                     placeholder="Students will type their answer here..."
                     className="gf-choice-input"
                     style={{ width: '100%', minHeight: '80px', borderBottom: '1px dotted rgba(0,0,0,0.3)', cursor: 'not-allowed', resize: 'none' }}
                   />
                </div>
              )}

              {/* Bottom Actions of Card (Points & Trash) - Lalabas lang nang buo kung ACTIVE ang card */}
              <div style={{ 
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center', 
                marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(0,0,0,0.05)', gap: '1.5rem',
                opacity: isActive ? 1 : 0.4, transition: 'opacity 0.3s' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Points:</label>
                  <input 
                    type="number" min="1" value={q.points} onChange={(e) => updateQuestion(q.id, 'points', e.target.value)}
                    className="gf-desc-input" style={{ width: '80px', padding: '0.5rem', textAlign: 'center' }}
                  />
                </div>

                <button 
                  onClick={(e) => removeQuestion(q.id, e)} 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Delete Question" onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Trash2 size={20} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      <div ref={bottomRef} style={{ height: '20px' }}></div>

      {/* ─── FLOATING FOOTER ACTIONS ─── */}
      <div style={{ 
        position: 'sticky', bottom: '20px', zIndex: 10,
        display: 'flex', justifyContent: 'center', gap: '1rem', 
        marginTop: '2rem', padding: '1rem',
        background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
        borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 15px 40px rgba(0,0,0,0.12)'
      }}>
        <button className="btn-glass btn-add" onClick={addQuestion}>
          <Plus size={20} strokeWidth={2.5} /> 
          <span>Add Question</span>
        </button>

        <button className="btn-glass btn-save" onClick={handleSaveExam} disabled={isSubmitting}>
          <Save size={20} /> 
          <span>{isSubmitting ? 'Saving...' : 'Save & Publish Exam'}</span>
        </button>
      </div>

    </div>
  );
};

export default CreateExam;