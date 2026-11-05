import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Plus, Trash2, ArrowLeft, Save, CheckCircle2, Circle, School, AlignLeft,
  ShieldAlert, ShieldCheck, Clock, RefreshCw, Maximize2, Copy, EyeOff,
  CheckSquare, Square, ListOrdered, Type, HelpCircle, X
} from 'lucide-react';
import axios from 'axios';
import { getTeacherLevel } from '../../utils/gradingUtils';
import RichQuestionEditor from './RichQuestionEditor';
import { hasRichContent } from './RichContent';

// ─── Quarter Colors Helper ───
const quarterColors = {
  1: { bg: '#dbeafe', color: '#1e40af' },
  2: { bg: '#d1fae5', color: '#065f46' },
  3: { bg: '#fef3c7', color: '#92400e' },
  4: { bg: '#ede9fe', color: '#5b21b6' },
};

const QUESTION_TYPE_OPTIONS = [
  { value: 'multiple_choice', label: '🔘 Multiple Choice (Single Answer)' },
  { value: 'checkboxes', label: '☑️ Checkboxes (Multiple Answers)' },
  { value: 'true_false', label: '⚖️ True or False (Tama o Mali)' },
  { value: 'identification', label: '🔤 Identification / Short Answer' },
  { value: 'fill_blank', label: '✏️ Fill in the Blank' },
  { value: 'enumeration', label: '🔢 Enumeration (List Items)' },
  { value: 'essay', label: '📝 Essay / Paragraph' },
];

const CreateExam = () => {
  const { user, API_BASE_URL, branding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const themeColor = branding?.theme_color || '#6366f1';
  const bottomRef = useRef(null);

  // 1. Fetch Assigned Classes State
  const [assignedClasses, setAssignedClasses] = useState([]);

  // 2. Exam Details & Anti-Cheat Policy State
  const [examDetails, setExamDetails] = useState({
    class_id: location.state?.classId || '',
    title: '',
    category: 'exam',
    quarter: '',
    description: '',
    open_date: '',
    due_date: '',
    time_limit_minutes: 60,
    max_attempts: 1,
    anti_cheat: {
      enabled: true,
      require_fullscreen: true,
      detect_tab_switch: true,
      max_warnings: 2,
      block_copy_paste: true,
      shuffle_questions: true
    }
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
      correctChoiceIndex: 0,
      correctChoiceIndices: [0],
      correctAnswer: ''
    }
  ]);

  const [activeQuestionId, setActiveQuestionId] = useState(defaultQuestionId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate total max score
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

  useEffect(() => {
    if (questions.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [questions.length]);

  // ─── Anti-Cheat Toggle Helper ────────────────────────────────────────────
  const updateAntiCheat = (key, value) => {
    setExamDetails(prev => ({
      ...prev,
      anti_cheat: {
        ...prev.anti_cheat,
        [key]: value
      }
    }));
  };

  // ─── Question Handlers ──────────────────────────────────────────────────
  const addQuestion = () => {
    const newId = Date.now();
    setQuestions([
      ...questions,
      {
        id: newId,
        type: 'multiple_choice',
        text: '',
        points: 1,
        choices: ['', '', '', ''],
        correctChoiceIndex: 0,
        correctChoiceIndices: [0],
        correctAnswer: ''
      }
    ]);
    setActiveQuestionId(newId);
  };

  const duplicateQuestion = (questionToCopy, e) => {
    e.preventDefault();
    e.stopPropagation();
    const newId = Date.now();
    const copy = {
      ...questionToCopy,
      id: newId,
      choices: [...(questionToCopy.choices || [])],
      correctChoiceIndices: [...(questionToCopy.correctChoiceIndices || [0])]
    };
    setQuestions(prev => [...prev, copy]);
    setActiveQuestionId(newId);
  };

  const removeQuestion = (idToRemove, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (questions.length === 1) return alert("You must have at least one question.");

    const newQuestions = questions.filter(q => q.id !== idToRemove);
    setQuestions(newQuestions);

    if (activeQuestionId === idToRemove) {
      setActiveQuestionId(newQuestions[0].id);
    }
  };

  const handleTypeChange = (id, newType) => {
    setQuestions(questions.map(q => {
      if (q.id !== id) return q;
      if (newType === 'true_false') {
        return {
          ...q,
          type: newType,
          choices: ['True', 'False'],
          correctChoiceIndex: 0
        };
      }
      if (newType === 'multiple_choice' || newType === 'checkboxes') {
        const existingChoices = Array.isArray(q.choices) && q.choices.length >= 2
          ? q.choices
          : ['', '', '', ''];
        return {
          ...q,
          type: newType,
          choices: existingChoices,
          correctChoiceIndex: 0,
          correctChoiceIndices: [0]
        };
      }
      if (newType === 'identification' || newType === 'fill_blank') {
        return {
          ...q,
          type: newType,
          choices: q.correctAnswer ? [q.correctAnswer] : [''],
          correctAnswer: q.correctAnswer || ''
        };
      }
      if (newType === 'enumeration') {
        return {
          ...q,
          type: newType,
          choices: ['', '', ''],
          points: 3
        };
      }
      return { ...q, type: newType };
    }));
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

  const addChoiceOption = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        if (q.choices.length >= 10) return q;
        return { ...q, choices: [...q.choices, ''] };
      }
      return q;
    }));
  };

  const removeChoiceOption = (questionId, choiceIndex) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        if (q.choices.length <= 2) return q;
        const newChoices = q.choices.filter((_, idx) => idx !== choiceIndex);
        const newCorrectIdx = q.correctChoiceIndex >= newChoices.length ? 0 : q.correctChoiceIndex;
        const newCorrectIndices = (q.correctChoiceIndices || [0])
          .filter(idx => idx !== choiceIndex)
          .map(idx => (idx > choiceIndex ? idx - 1 : idx));
        return {
          ...q,
          choices: newChoices,
          correctChoiceIndex: newCorrectIdx,
          correctChoiceIndices: newCorrectIndices.length > 0 ? newCorrectIndices : [0]
        };
      }
      return q;
    }));
  };

  const toggleCheckboxCorrect = (questionId, choiceIndex) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      const current = Array.isArray(q.correctChoiceIndices) ? q.correctChoiceIndices : [0];
      const exists = current.includes(choiceIndex);
      const next = exists
        ? (current.length > 1 ? current.filter(i => i !== choiceIndex) : current)
        : [...current, choiceIndex];
      return { ...q, correctChoiceIndices: next };
    }));
  };

  // ─── Submit Handler ─────────────────────────────────────────────────────
  const handleSaveExam = async () => {
    if (!examDetails.class_id) return alert("Class ID is missing.");
    if (isKto12 && !examDetails.quarter) return alert("Please select a Quarter.");
    if (!examDetails.title.trim()) return alert("Please provide an exam title.");
    if (examDetails.open_date && examDetails.due_date && examDetails.due_date <= examDetails.open_date) {
      return alert("The due date / closing time must be later than the opening time.");
    }

    const hasEmptyQuestions = questions.some(q => !hasRichContent(q.text));
    if (hasEmptyQuestions) return alert("Please fill in all question prompts before saving.");

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if ((q.type === 'identification' || q.type === 'fill_blank') && !String(q.correctAnswer || q.choices?.[0] || '').trim()) {
        return alert(`Please provide the Answer Key for Question #${i + 1}.`);
      }
      if (q.type === 'enumeration' && (!Array.isArray(q.choices) || q.choices.filter(c => String(c).trim()).length === 0)) {
        return alert(`Please provide at least one item in the Answer Key for Enumeration Question #${i + 1}.`);
      }
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sms_token');
      const normalizedQuestions = questions.map(q => {
        if (q.type === 'identification' || q.type === 'fill_blank') {
          const accepted = String(q.correctAnswer || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          return {
            ...q,
            choices: accepted.length > 0 ? accepted : [String(q.correctAnswer || '').trim()]
          };
        }
        return q;
      });

      const payload = {
        teacher_id: user.id,
        exam_details: {
          ...examDetails,
          max_score: totalPoints
        },
        questions: normalizedQuestions
      };

      const res = await axios.post(`${API_BASE_URL}/teacher/create_exam.php`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        alert("Examination and Anti-Cheat Policy successfully saved!");
        navigate(-1);
      } else {
        alert(res.data.message || "Failed to save exam.");
      }
    } catch (err) {
      console.error("Save exam error:", err);
      const serverMsg = err.response?.data?.message;
      alert(serverMsg ? `Failed to save exam: ${serverMsg}` : "Network error. Please make sure the backend server is running and restarted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="exam-builder-root" style={{ '--theme-color': themeColor, padding: '1rem 1rem 4rem 1rem', maxWidth: '880px', margin: '0 auto' }}>
      {/* ─── STYLES (Glassmorphism & Google Forms UX) ─── */}
      <style>{`
        .glass-panel {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 1.25rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .gf-card { position: relative; padding: 2rem; margin-bottom: 1.5rem; overflow: hidden; }
        
        .gf-header-card {
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.08);
        }
        .gf-header-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 12px; background-color: var(--theme-color); }

        .gf-question-card { 
          animation: slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          cursor: pointer;
        }
        
        .gf-question-card.inactive {
          background: rgba(255, 255, 255, 0.65);
          border-left: 6px solid transparent;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          transform: scale(0.99);
        }
        .gf-question-card.inactive:hover {
          background: rgba(255, 255, 255, 0.85);
        }

        .gf-question-card.active {
          background: rgba(255, 255, 255, 1);
          border-left: 6px solid var(--theme-color);
          box-shadow: 0 15px 40px -10px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px) scale(1);
          cursor: default;
        }

        .gf-title-input {
          width: 100%; font-size: 1.85rem; font-weight: 800; color: #0f172a;
          padding: 0.5rem 0; background: transparent; border: none;
          border-bottom: 2px solid rgba(0,0,0,0.1); font-family: inherit; transition: all 0.3s ease;
        }
        .gf-title-input:focus { outline: none; border-bottom-color: var(--theme-color); }
        .gf-title-input::placeholder { color: #cbd5e1; }

        .gf-desc-input, .gf-question-input {
          width: 100%; font-size: 0.95rem; padding: 0.85rem 1rem; color: #0f172a;
          background: rgba(255, 255, 255, 0.85); border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 0.65rem; font-family: inherit; transition: all 0.2s ease;
          resize: vertical;
        }
        .gf-question-input { background: #f8fafc; border-color: rgba(0,0,0,0.1); font-weight: 600; } 
        .gf-desc-input:focus, .gf-question-input:focus {
          outline: none; background: #ffffff; border-color: var(--theme-color);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }

        .gf-choice-input {
          flex: 1; padding: 0.6rem 0.75rem; font-size: 0.95rem; color: #0f172a; font-weight: 600;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.6rem;
          font-family: inherit; transition: all 0.2s ease;
        }
        .gf-choice-input:hover { border-color: #cbd5e1; background: #ffffff; }
        .gf-choice-input:focus {
          outline: none; background: #ffffff;
          border-color: var(--theme-color); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .glass-label { display: block; font-size: 0.72rem; font-weight: 800; color: #475569; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px; }

        @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .choice-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.6rem; padding: 0.25rem 0; border-radius: 0.5rem; }
        
        .radio-btn { cursor: pointer; color: #94a3b8; transition: all 0.2s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .radio-btn:hover { color: #64748b; }
        .radio-btn.selected { color: #10b981; transform: scale(1.1); }

        .btn-glass {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.85rem 1.75rem; border-radius: 0.75rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-add { background: rgba(255,255,255,0.95); border: 2px solid var(--theme-color); color: var(--theme-color); }
        .btn-add:hover { background: var(--theme-color); color: white; transform: translateY(-2px); }
        .btn-save { background: var(--theme-color); border: none; color: white; box-shadow: 0 4px 15px var(--theme-color)40; }
        .btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px var(--theme-color)60; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* ─── HEADER ACTIONS ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <ArrowLeft size={20} color="#64748b" />
          </button>
          <div>
            <h1 className="header-jakarta" style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem', fontWeight: 800 }}>
              {examDetails.category === 'quiz' ? 'Create Class Quiz' :
               examDetails.category === 'seatwork' ? 'Create Seatwork' :
               examDetails.category === 'activity' ? 'Create Activity' :
               'Create Examination'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              Multi-format assessment builder with automated grading & anti-cheat proctoring
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.4rem 0.85rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={15} /> {examDetails.anti_cheat.enabled ? 'Anti-Cheat Active' : 'Standard Mode'}
          </span>
          <span style={{ background: themeColor, color: 'white', padding: '0.45rem 1rem', borderRadius: '2rem', fontWeight: 800, fontSize: '0.8rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            {questions.length} {questions.length === 1 ? 'Item' : 'Items'} • {totalPoints} Pts
          </span>
        </div>
      </div>

      {/* ─── EXAM DETAILS (HEADER CARD) ─── */}
      <div
        className={`glass-panel gf-card gf-header-card ${activeQuestionId === 'header' ? 'active' : 'inactive'}`}
        onClick={() => setActiveQuestionId('header')}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {/* Class & Quarter Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: isKto12 ? '1fr 1fr' : '1fr', gap: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div>
            <label className="glass-label"><School size={12} style={{ display: 'inline', marginRight: '4px', marginBottom: '2px' }} /> Assigned Class</label>
            <div style={{
              padding: '0.8rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '0.65rem', color: '#1e293b', fontWeight: 700, fontSize: '0.95rem'
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
                        padding: '0.65rem 0', borderRadius: '0.6rem',
                        border: selected ? `2px solid ${qc.color}` : '1px solid #e2e8f0',
                        background: selected ? qc.bg : '#f8fafc',
                        color: selected ? qc.color : '#64748b',
                        fontWeight: selected ? 800 : 600, fontSize: '0.85rem', cursor: 'pointer',
                        transition: 'all 0.2s'
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

        {/* Assessment Category Selection */}
        <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <label className="glass-label" style={{ marginBottom: '0.6rem' }}>Assessment Type / Category <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            {[
              { key: 'exam', label: 'Quarterly Exam', short: 'Periodical Examination', icon: '🏆' },
              { key: 'quiz', label: 'Quiz', short: 'Formative / Summative', icon: '📝' },
              { key: 'activity', label: 'Class Activity', short: 'Interactive Task', icon: '📋' },
              { key: 'seatwork', label: 'Seatwork', short: 'In-Class Seatwork', icon: '🪑' }
            ].map(cat => {
              const selected = (examDetails.category || 'exam') === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setExamDetails({ ...examDetails, category: cat.key })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: selected ? '2px solid var(--theme-color)' : '1.5px solid #e2e8f0',
                    background: selected ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: selected ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: selected ? 800 : 700, color: selected ? 'var(--theme-color)' : '#1e293b' }}>
                      {cat.label}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                      {cat.short}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title & Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            placeholder={
              examDetails.category === 'quiz' ? 'Quiz Title (e.g. Quiz #1: Mga Bahagi ng Pananalita)' :
              examDetails.category === 'activity' ? 'Activity Title (e.g. Activity 1: Pagsusuri sa Kwento)' :
              examDetails.category === 'seatwork' ? 'Seatwork Title (e.g. Seatwork 2: Pagsasanay sa Aralin)' :
              'Exam Title (e.g. 1st Quarter Periodical Examination)'
            }
            value={examDetails.title}
            onChange={(e) => setExamDetails({ ...examDetails, title: e.target.value })}
            className="gf-title-input header-jakarta"
          />
          <textarea
            placeholder="General instructions or directions for students (Optional)"
            value={examDetails.description}
            onChange={(e) => setExamDetails({ ...examDetails, description: e.target.value })}
            className="gf-desc-input"
            style={{ minHeight: '75px' }}
          />
        </div>

        {/* ─── ANTI-CHEAT POLICY & PROCTORING SETTINGS ─── */}
        <div style={{
          background: examDetails.anti_cheat.enabled ? 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)' : '#f8fafc',
          border: examDetails.anti_cheat.enabled ? '1.5px solid #c7d2fe' : '1px solid #e2e8f0',
          borderRadius: '1rem',
          padding: '1.25rem 1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '0.75rem',
                background: examDetails.anti_cheat.enabled ? '#4f46e5' : '#94a3b8',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: examDetails.anti_cheat.enabled ? '0 4px 12px rgba(79,70,229,0.3)' : 'none'
              }}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                  Anti-Cheat Policy & Proctoring Controls
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  Enforce fullscreen lock, tab-switch strike detection, clipboard protection, and timer limits
                </p>
              </div>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'white', padding: '0.45rem 0.9rem', borderRadius: '2rem', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.75rem', color: examDetails.anti_cheat.enabled ? '#4f46e5' : '#64748b' }}>
              <input
                type="checkbox"
                checked={examDetails.anti_cheat.enabled}
                onChange={(e) => updateAntiCheat('enabled', e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
              />
              {examDetails.anti_cheat.enabled ? 'Proctoring Enabled' : 'Proctoring Disabled'}
            </label>
          </div>

          {/* Availability Window: Open Date & Due Date / Closing Time */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="glass-label"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> Opens On (Optional)</label>
              <input
                type="datetime-local"
                value={examDetails.open_date || ''}
                onChange={(e) => setExamDetails({ ...examDetails, open_date: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '0.6rem', border: '1px solid #cbd5e1', background: 'white', fontWeight: 600, color: '#1e293b' }}
              />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>Students cannot start before this date/time.</p>
            </div>
            <div>
              <label className="glass-label"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> Due Date / Closes On (Optional)</label>
              <input
                type="datetime-local"
                value={examDetails.due_date || ''}
                min={examDetails.open_date || undefined}
                onChange={(e) => setExamDetails({ ...examDetails, due_date: e.target.value })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '0.6rem', border: '1px solid #cbd5e1', background: 'white', fontWeight: 600, color: '#1e293b' }}
              />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>Exam closes automatically after this time.</p>
            </div>
          </div>

          {/* Time Limit, Max Attempts, & Max Warnings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: examDetails.anti_cheat.enabled ? '1rem' : 0 }}>
            <div>
              <label className="glass-label"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> Time Limit</label>
              <select
                value={examDetails.time_limit_minutes || ''}
                onChange={(e) => setExamDetails({ ...examDetails, time_limit_minutes: e.target.value ? parseInt(e.target.value, 10) : null })}
                className="gf-desc-input"
                style={{ padding: '0.6rem 0.75rem', fontWeight: 700, fontSize: '0.85rem' }}
              >
                <option value="">No Time Limit</option>
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes (1 Hour)</option>
                <option value="90">90 Minutes (1.5 Hours)</option>
                <option value="120">120 Minutes (2 Hours)</option>
              </select>
            </div>

            <div>
              <label className="glass-label"><RefreshCw size={12} style={{ display: 'inline', marginRight: '4px' }} /> Allowed Attempts</label>
              <select
                value={examDetails.max_attempts || 1}
                onChange={(e) => setExamDetails({ ...examDetails, max_attempts: parseInt(e.target.value, 10) })}
                className="gf-desc-input"
                style={{ padding: '0.6rem 0.75rem', fontWeight: 700, fontSize: '0.85rem' }}
              >
                <option value="1">1 Attempt Only (Strict)</option>
                <option value="2">2 Attempts</option>
                <option value="3">3 Attempts</option>
                <option value="5">5 Attempts (Practice)</option>
              </select>
            </div>

            {examDetails.anti_cheat.enabled && (
              <div>
                <label className="glass-label"><ShieldAlert size={12} style={{ display: 'inline', marginRight: '4px', color: '#ef4444' }} /> Max Warnings Before Auto-Submit</label>
                <select
                  value={examDetails.anti_cheat.max_warnings}
                  onChange={(e) => updateAntiCheat('max_warnings', parseInt(e.target.value, 10))}
                  className="gf-desc-input"
                  style={{ padding: '0.6rem 0.75rem', fontWeight: 700, fontSize: '0.85rem', borderColor: '#fca5a5', color: '#b91c1c' }}
                >
                  <option value="0">0 Warnings (Instant Auto-Submit on 1st Violation)</option>
                  <option value="1">1 Warning (Auto-Submit on 2nd Violation)</option>
                  <option value="2">2 Warnings (Auto-Submit on 3rd Violation)</option>
                  <option value="3">3 Warnings (Auto-Submit on 4th Violation)</option>
                  <option value="5">5 Warnings</option>
                </select>
              </div>
            )}
          </div>

          {/* Granular Anti-Cheat Checkboxes */}
          {examDetails.anti_cheat.enabled && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', marginTop: '0.75rem' }}>
              {[
                {
                  key: 'require_fullscreen',
                  title: 'Require Fullscreen Mode',
                  desc: 'Forces fullscreen lock; exiting triggers a strike'
                },
                {
                  key: 'detect_tab_switch',
                  title: 'Detect Tab / Window Switching',
                  desc: 'Flags Alt+Tab, minimizing, or switching tabs'
                },
                {
                  key: 'block_copy_paste',
                  title: 'Block Copy, Paste & Right-Click',
                  desc: 'Disables clipboard, right-click & DevTools keys'
                },
                {
                  key: 'shuffle_questions',
                  title: 'Shuffle Question Order',
                  desc: 'Randomizes question sequence per student'
                }
              ].map(rule => (
                <label
                  key={rule.key}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                    padding: '0.7rem 0.85rem', background: 'white', borderRadius: '0.75rem',
                    border: examDetails.anti_cheat[rule.key] ? '1.5px solid #818cf8' : '1px solid #e2e8f0',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(examDetails.anti_cheat[rule.key])}
                    onChange={(e) => updateAntiCheat(rule.key, e.target.checked)}
                    style={{ marginTop: '0.2rem', width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>{rule.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, lineHeight: 1.3 }}>{rule.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
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
              {/* Top Row: Question Number + Type Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{
                  background: `${themeColor}15`, color: themeColor,
                  padding: '0.35rem 0.85rem', borderRadius: '2rem',
                  fontWeight: 800, fontSize: '0.8rem'
                }}>
                  Question #{index + 1}
                </span>

                <select
                  value={q.type}
                  onChange={(e) => handleTypeChange(q.id, e.target.value)}
                  className="gf-desc-input"
                  style={{
                    width: 'auto', minWidth: '250px', padding: '0.5rem 0.9rem',
                    fontSize: '0.85rem', cursor: 'pointer', fontWeight: 800,
                    color: '#1e293b', border: `1.5px solid ${themeColor}50`, borderRadius: '0.65rem',
                    background: '#ffffff'
                  }}
                >
                  {QUESTION_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Question Prompt Input */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <RichQuestionEditor
                  key={`rq-${q.id}`}
                  value={q.text}
                  onChange={(html) => updateQuestion(q.id, 'text', html)}
                  placeholder={
                    q.type === 'fill_blank'
                      ? "Type sentence with blank, e.g., The national hero of the Philippines is ___."
                      : q.type === 'enumeration'
                      ? "Type your enumeration prompt, e.g., Give the 3 branches of the Philippine Government."
                      : "Type your question here..."
                  }
                />
              </div>

              {/* ─── CONDITIONAL RENDERING BY QUESTION TYPE ─── */}

              {/* 1. MULTIPLE CHOICE (SINGLE ANSWER) */}
              {q.type === 'multiple_choice' && (
                <div style={{ paddingLeft: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Click the circle to mark the correct answer ({q.choices.length} options)
                    </p>
                  </div>
                  {q.choices.map((choice, cIndex) => {
                    const isCorrect = q.correctChoiceIndex === cIndex;
                    const optionLetter = String.fromCharCode(65 + cIndex);
                    return (
                      <div key={cIndex} className="choice-row">
                        <div
                          onClick={() => updateQuestion(q.id, 'correctChoiceIndex', cIndex)}
                          className={`radio-btn ${isCorrect ? 'selected' : ''}`}
                          title="Mark as correct answer"
                        >
                          {isCorrect ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <Circle size={22} />}
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isCorrect ? '#10b981' : '#64748b', width: '20px' }}>
                          {optionLetter}.
                        </span>
                        <input
                          type="text"
                          placeholder={`Option ${optionLetter}`}
                          value={choice}
                          onChange={(e) => updateChoice(q.id, cIndex, e.target.value)}
                          className="gf-choice-input"
                          style={isCorrect ? { borderColor: '#10b981', background: '#f0fdf4' } : {}}
                        />
                        {q.choices.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeChoiceOption(q.id, cIndex)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.35rem' }}
                            title="Remove option"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {q.choices.length < 10 && (
                    <button
                      type="button"
                      onClick={() => addChoiceOption(q.id)}
                      style={{
                        marginTop: '0.5rem', background: '#f8fafc', border: '1px dashed #cbd5e1',
                        color: themeColor, padding: '0.45rem 1rem', borderRadius: '0.6rem',
                        fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                      }}
                    >
                      <Plus size={15} /> Add Another Choice
                    </button>
                  )}
                </div>
              )}

              {/* 2. CHECKBOXES (MULTIPLE CORRECT ANSWERS) */}
              {q.type === 'checkboxes' && (
                <div style={{ paddingLeft: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Check ALL correct options (Students must select all correct answers)
                  </p>
                  {q.choices.map((choice, cIndex) => {
                    const isChecked = (q.correctChoiceIndices || [0]).includes(cIndex);
                    return (
                      <div key={cIndex} className="choice-row">
                        <div
                          onClick={() => toggleCheckboxCorrect(q.id, cIndex)}
                          className={`radio-btn ${isChecked ? 'selected' : ''}`}
                          title="Toggle correct answer"
                        >
                          {isChecked ? <CheckSquare size={22} strokeWidth={2.5} /> : <Square size={22} />}
                        </div>
                        <input
                          type="text"
                          placeholder={`Option ${cIndex + 1}`}
                          value={choice}
                          onChange={(e) => updateChoice(q.id, cIndex, e.target.value)}
                          className="gf-choice-input"
                          style={isChecked ? { borderColor: '#10b981', background: '#f0fdf4' } : {}}
                        />
                        {q.choices.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeChoiceOption(q.id, cIndex)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.35rem' }}
                            title="Remove option"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {q.choices.length < 10 && (
                    <button
                      type="button"
                      onClick={() => addChoiceOption(q.id)}
                      style={{
                        marginTop: '0.5rem', background: '#f8fafc', border: '1px dashed #cbd5e1',
                        color: themeColor, padding: '0.45rem 1rem', borderRadius: '0.6rem',
                        fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                      }}
                    >
                      <Plus size={15} /> Add Checkbox Option
                    </button>
                  )}
                </div>
              )}

              {/* 3. TRUE OR FALSE (TAMA O MALI) */}
              {q.type === 'true_false' && (
                <div style={{ paddingLeft: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                      Select the correct statement value:
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => updateQuestion(q.id, 'choices', ['True', 'False'])}
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: '0.4rem', border: '1px solid #cbd5e1', background: q.choices[0] === 'True' ? '#e0e7ff' : 'white', color: '#1e293b', cursor: 'pointer' }}
                      >
                        True / False
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestion(q.id, 'choices', ['Tama', 'Mali'])}
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: '0.4rem', border: '1px solid #cbd5e1', background: q.choices[0] === 'Tama' ? '#e0e7ff' : 'white', color: '#1e293b', cursor: 'pointer' }}
                      >
                        Tama / Mali
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {(q.choices?.length === 2 ? q.choices : ['True', 'False']).map((label, cIndex) => {
                      const isSelected = q.correctChoiceIndex === cIndex;
                      return (
                        <button
                          key={cIndex}
                          type="button"
                          onClick={() => updateQuestion(q.id, 'correctChoiceIndex', cIndex)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            padding: '0.85rem', borderRadius: '0.75rem', cursor: 'pointer',
                            border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                            background: isSelected ? '#ecfdf5' : '#f8fafc',
                            color: isSelected ? '#047857' : '#475569',
                            fontWeight: 800, fontSize: '0.95rem'
                          }}
                        >
                          {isSelected ? <CheckCircle2 size={20} color="#10b981" /> : <Circle size={20} color="#94a3b8" />}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. IDENTIFICATION / FILL IN THE BLANK */}
              {(q.type === 'identification' || q.type === 'fill_blank') && (
                <div style={{ paddingLeft: '0.5rem', background: '#f0fdf4', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #bbf7d0' }}>
                  <label className="glass-label" style={{ color: '#065f46' }}>
                    Exact Answer Key (Auto-Graded, Case-Insensitive) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jose Rizal, Dr. Jose Rizal (separate acceptable variations with commas)"
                    value={q.correctAnswer ?? q.choices?.[0] ?? ''}
                    onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                    className="gf-choice-input"
                    style={{ width: '100%', background: 'white', borderColor: '#86efac' }}
                  />
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>
                    💡 Tip: You can enter multiple accepted variations separated by commas (e.g. <code>Photosynthesis, Process of Photosynthesis</code>).
                  </p>
                </div>
              )}

              {/* 5. ENUMERATION */}
              {q.type === 'enumeration' && (
                <div style={{ paddingLeft: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                    Expected Answers to Enumerate (Auto-Graded in any order)
                  </p>
                  {(q.choices || ['']).map((item, cIndex) => (
                    <div key={cIndex} className="choice-row">
                      <span style={{
                        width: '26px', height: '26px', borderRadius: '50%', background: '#e0e7ff',
                        color: '#4338ca', fontWeight: 800, fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {cIndex + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`Correct Item #${cIndex + 1}`}
                        value={item}
                        onChange={(e) => updateChoice(q.id, cIndex, e.target.value)}
                        className="gf-choice-input"
                      />
                      {q.choices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChoiceOption(q.id, cIndex)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.35rem' }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addChoiceOption(q.id)}
                    style={{
                      marginTop: '0.5rem', background: '#f8fafc', border: '1px dashed #cbd5e1',
                      color: themeColor, padding: '0.45rem 1rem', borderRadius: '0.6rem',
                      fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                    }}
                  >
                    <Plus size={15} /> Add Item to Enumerate
                  </button>
                </div>
              )}

              {/* 6. ESSAY / PARAGRAPH */}
              {q.type === 'essay' && (
                <div style={{ paddingLeft: '0.5rem', opacity: 0.85 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b' }}>
                    <AlignLeft size={18} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Open-ended Essay / Paragraph Response (Teacher-Graded)</span>
                  </div>
                  <textarea
                    disabled
                    placeholder="Students will type their paragraph/essay response here..."
                    className="gf-choice-input"
                    style={{ width: '100%', minHeight: '75px', cursor: 'not-allowed', resize: 'none', background: '#f1f5f9' }}
                  />
                </div>
              )}

              {/* Bottom Actions of Card (Points, Duplicate, Trash) */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '1.5rem', paddingTop: '1.1rem', borderTop: '1px solid rgba(0,0,0,0.06)', gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                  {q.type === 'essay' ? 'Manual Teacher Scoring' : '⚡ Auto-Graded by System'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Points:</label>
                    <input
                      type="number"
                      min="1"
                      value={q.points}
                      onChange={(e) => updateQuestion(q.id, 'points', e.target.value)}
                      className="gf-desc-input"
                      style={{ width: '75px', padding: '0.45rem', textAlign: 'center', fontWeight: 800 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => duplicateQuestion(q, e)}
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', cursor: 'pointer', padding: '0.45rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Duplicate Question"
                  >
                    <Copy size={15} /> Duplicate
                  </button>

                  <button
                    type="button"
                    onClick={(e) => removeQuestion(q.id, e)}
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', padding: '0.45rem 0.6rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Delete Question"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={bottomRef} style={{ height: '20px' }}></div>

      {/* ─── FLOATING FOOTER ACTIONS ─── */}
      <div style={{
        position: 'sticky', bottom: '16px', zIndex: 20,
        display: 'flex', justifyContent: 'center', gap: '0.75rem',
        flexWrap: 'wrap',
        marginTop: '2rem', padding: '0.85rem 1.25rem',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
        borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 15px 40px rgba(0,0,0,0.12)'
      }}>
        <button type="button" className="btn-glass btn-add" onClick={addQuestion}>
          <Plus size={20} strokeWidth={2.5} />
          <span>Add Question</span>
        </button>

        <button type="button" className="btn-glass btn-save" onClick={handleSaveExam} disabled={isSubmitting}>
          <Save size={20} />
          <span>{isSubmitting ? 'Saving...' : 'Save & Publish Exam'}</span>
        </button>
      </div>
    </div>
  );
};

export default CreateExam;
