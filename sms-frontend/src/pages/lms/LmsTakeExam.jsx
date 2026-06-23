import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/shared/CustomAlert';

const LmsTakeExam = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user, API_BASE_URL } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState({}); 
  const [result, setResult] = useState(null);

  const [timeLeft, setTimeLeft] = useState(null);
  const [attemptsInfo, setAttemptsInfo] = useState({ current: 0, max: 1 });

  // ==========================================
  // [ FULL FLEXIBLE CUSTOM ALERT STATE ]
  // ==========================================
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'Okay',
    cancelText: 'Cancel',
    onClose: null,
    onConfirm: null
  });

  const showAlert = (type, title, message, onCloseCallback = null) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      confirmText: 'Okay',
      cancelText: 'Cancel',
      onConfirm: null, // Walang confirm = Single button mode
      onClose: () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
        if (onCloseCallback) onCloseCallback();
      }
    });
  };

  const showConfirm = (type, title, message, confirmText, cancelText, onConfirmCallback) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
        if (onConfirmCallback) onConfirmCallback();
      },
      onClose: () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 1. FETCH EXAM DETAILS
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const studentId = user?.id || user?.username;
        const res = await axios.get(`${API_BASE_URL}/lms/get_exam_details.php?activity_id=${activityId}&student_id=${studentId}`);
        
        if (res.data.status === 'success') {
          setExamData(res.data.data);
          setAttemptsInfo({ current: res.data.current_attempts, max: res.data.data.max_attempts });
          
          if (res.data.already_taken) {
            setResult(res.data.score_details); 
          } else if (res.data.data.time_limit_minutes) {
            setTimeLeft(res.data.data.time_limit_minutes * 60);
          }
        } else {
          showAlert('error', 'Exam Locked', res.data.message || 'You cannot take this exam.', () => navigate(-1));
        }
      } catch (err) {
        console.error("Exam Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user && activityId) fetchExam();
  }, [activityId, user, API_BASE_URL, navigate]);

  // 2. SUBMIT HANDLER
  const handleSubmit = useCallback(async (e = null, reason = '') => {
    if (e) e.preventDefault();

    setSubmitting(true);
    try {
      const studentId = user?.id || user?.username;
      const res = await axios.post(`${API_BASE_URL}/lms/submit_exam.php`, {
        student_id: studentId,
        activity_id: activityId,
        answers: answers,
        auto_submit_reason: reason
      });

      if (res.data.status === 'success') {
        setResult(res.data.score_details);
        setTimeLeft(null); 
        window.scrollTo(0, 0);
      } else {
        showAlert('error', 'Error', res.data.message || 'Failed to submit exam.');
      }
    } catch (err) {
      console.error("Submit Error:", err);
    } finally {
      setSubmitting(false);
    }
  }, [answers, activityId, user, API_BASE_URL]);

  // Handle Manual Submission with Custom Alert
  const handleFormSubmit = (e) => {
    e.preventDefault();
    showConfirm(
      'warning',
      'Submit Answers?',
      'Are you sure you want to turn in your exam answers? You cannot change them after this.',
      'Yes, Submit',
      'Cancel',
      () => handleSubmit(null)
    );
  };

  // 3. TIMER & AUTO-SUBMIT LOGIC
  useEffect(() => {
    if (timeLeft === null || result || submitting) return;

    if (timeLeft <= 0) {
      showAlert('error', 'Time Expired', 'Your time has run out. Your exam is now being submitted.', () => {
        handleSubmit(null, 'time_expired');
      });
      return;
    }

    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, result, submitting, handleSubmit]);

  // 4. ANTI-CHEAT: TAB SWITCH TRIGGER
  useEffect(() => {
    if (result || submitting || !examData) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const currentSwitches = parseInt(sessionStorage.getItem(`sw_${activityId}`) || '0') + 1;
        sessionStorage.setItem(`sw_${activityId}`, currentSwitches);

        if (currentSwitches === 1) {
          showAlert(
            'warning', 
            'Violation Warning!', 
            'Leaving the exam screen or tab switching is forbidden! Doing it again will automatically submit your attempt.'
          );
        } else if (currentSwitches >= 2) {
          showAlert(
            'error', 
            'Forced Submission', 
            'You switched windows multiple times. Your exam attempt has been locked and submitted.', 
            () => handleSubmit(null, 'tab_switching')
          );
        }
      }
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      showAlert('warning', 'Restricted', 'Copying or pasting content is disabled during exams.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, [result, submitting, examData, activityId, handleSubmit]);

  // 5. ANTI-CHEAT: BLOCK PAGE REFRESH OR CLOSE
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!result && !submitting && examData) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [result, submitting, examData]);

  // 6. CUSTOM LEAVE TRIGGER
  const handleBackClick = () => {
    if (!result && examData) {
      showConfirm(
        'warning',
        'Abandon Exam?',
        'Warning: Leaving now will immediately turn in your progress and consume one attempt.\n\nAre you sure you want to proceed?',
        'Yes, Leave',
        'Stay',
        () => handleSubmit(null, 'abandoned')
      );
    } else {
      navigate(-1);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 mb-4" size={40} /></div>;
  if (!examData) return null;

  return (
    <div className="min-h-screen bg-[#f0f2f5] py-10 px-4 font-sans relative select-none">
      
      {/* 100% EXAKTONG CUSTOM ALERT MO NA MAY DUAL-MODE LOGIC */}
      <CustomAlert 
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
        onClose={alertState.onClose}
      />

      {/* STICKY TOP BAR */}
      <div className="max-w-3xl mx-auto flex justify-between items-center mb-6 sticky top-4 z-40 bg-[#f0f2f5]/90 backdrop-blur-md py-2 rounded-xl">
        <button onClick={handleBackClick} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-black text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-colors">
          <ArrowLeft size={16} /> Leave
        </button>

        {timeLeft !== null && !result && (
          <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black shadow-sm border transition-colors ${timeLeft <= 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-slate-700 border-slate-200'}`}>
            <Clock size={18} />
            <span className="tracking-widest text-lg">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto pb-24">
        {result ? (
          /* RESULT SCREEN */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center p-10 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} /></div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">Examination Submitted!</h1>
            <p className="text-slate-500 mb-8">You have successfully completed this attempt.</p>
            <div className="inline-block bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
               <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Your Score</p>
               <p className="text-5xl font-black text-indigo-600">{result.score} <span className="text-2xl text-slate-300">/ {result.total}</span></p>
            </div>
            <div><button onClick={() => navigate(-1)} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Return to Class</button></div>
          </div>
        ) : (
          /* EXAM FORM */
          <form onSubmit={handleFormSubmit}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600"></div>
              <div className="p-8 pt-10">
                <h1 className="text-3xl font-black text-slate-800 mb-3 leading-tight">{examData.title}</h1>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{examData.description}</p>
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
                  <div className="flex gap-4">
                    <span>Type: <span className="uppercase text-indigo-500">{examData.category}</span></span>
                    <span>Total Items: {examData.questions.length}</span>
                  </div>
                  <span className="bg-slate-100 px-3 py-1 rounded-md text-slate-500">Attempt {attemptsInfo.current + 1} of {attemptsInfo.max}</span>
                </div>
              </div>
            </div>

            {examData.questions.map((q, index) => (
              <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-6 md:p-8 transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                <div className="flex justify-between items-start gap-4 mb-5">
                  <h3 className="text-base font-bold text-slate-800 leading-snug"><span className="mr-2 text-indigo-500">{index + 1}.</span>{q.question_text}</h3>
                  <span className="shrink-0 text-xs font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{q.points} pts</span>
                </div>
                {(q.question_type === 'multiple_choice' || q.question_type === 'true_false') && (
                  <div className="flex flex-col gap-3">
                    {q.choices.map(choice => (
                      <label key={choice.id} className="flex items-center gap-4 p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-colors">
                        <input type="radio" name={`q_${q.id}`} value={choice.id} onChange={() => setAnswers(prev => ({ ...prev, [q.id]: choice.id }))} required className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
                        <span className="text-slate-700 text-sm">{choice.choice_text}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.question_type === 'essay' && (
                  <textarea rows="4" placeholder="Type your answer here..." required onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y text-sm"></textarea>
                )}
              </div>
            ))}
            <div className="flex justify-end mt-8">
              <button type="submit" disabled={submitting} className="px-8 py-3 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-70">
                {submitting && <Loader2 size={16} className="animate-spin" />} {submitting ? 'Submitting...' : 'Submit Answers'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LmsTakeExam;