import RichContent from '../../components/shared/RichContent';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Loader2, CheckCircle, ArrowLeft, Clock, ShieldAlert, ShieldCheck,
  Maximize2, AlertTriangle, Lock, EyeOff, FileCheck, Upload, Send, ExternalLink, FileText, Image, Paperclip, Video, Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/shared/CustomAlert';

const DEFAULT_ANTI_CHEAT = {
  enabled: true,
  require_fullscreen: true,
  detect_tab_switch: true,
  max_warnings: 2,
  block_copy_paste: true,
  shuffle_questions: false
};

const LmsTakeExam = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user, API_BASE_URL } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examData, setExamData] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [writtenForm, setWrittenForm] = useState({ content: '', url: '' });
  const [writtenSubmitting, setWrittenSubmitting] = useState(false);
  const [writtenSubmitted, setWrittenSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };
  const [result, setResult] = useState(null);

  const [timeLeft, setTimeLeft] = useState(null);
  const [attemptsInfo, setAttemptsInfo] = useState({ current: 0, max: 1 });

  // Anti-cheat live tracking states
  const [violationCount, setViolationCount] = useState(0);
  const [violationLog, setViolationLog] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastViolationTimeRef = useRef(0);
  const violationCountRef = useRef(0);
  const violationLogRef = useRef([]);

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

  const showAlert = useCallback((type, title, message, onCloseCallback = null) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      confirmText: 'I Understand',
      cancelText: 'Cancel',
      onConfirm: null,
      onClose: () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
        if (onCloseCallback) onCloseCallback();
      }
    });
  }, []);

  const showConfirm = useCallback((type, title, message, confirmText, cancelText, onConfirmCallback) => {
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
  }, []);

  // 1. FETCH EXAM DETAILS
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const studentId = user?.student_id || user?.id || user?.username;
        const res = await axios.get(`${API_BASE_URL}/lms/get_exam_details.php?activity_id=${activityId}&student_id=${studentId}`);

        if (res.data.status === 'success') {
          const data = res.data.data;
          setExamData(data);
          setAttemptsInfo({
            current: res.data.current_attempts || 0,
            max: data?.max_attempts || 1
          });

          if (res.data.already_taken) {
            setResult(res.data.score_details);
          } else if (data?.time_limit_minutes || data?.seconds_until_due != null) {
            // Timer is the exam time limit, capped by the remaining time before the deadline
            const limitSecs = data?.time_limit_minutes ? data.time_limit_minutes * 60 : Infinity;
            const dueSecs = data?.seconds_until_due != null ? data.seconds_until_due : Infinity;
            setTimeLeft(Math.min(limitSecs, dueSecs));
          }
        } else {
          setErrorState({
            title: res.data.not_available ? 'Examination Unavailable' : 'Exam Locked',
            message: res.data.message || 'You cannot take this exam at this time.'
          });
        }
      } catch (err) {
        console.error("Exam Fetch Error:", err);
        setErrorState({
          title: 'Unable to Load Examination',
          message: err?.response?.data?.message || 'Failed to load exam details. Please check your connection or contact your instructor.'
        });
      } finally {
        setLoading(false);
      }
    };
    if (user && activityId) fetchExam();
  }, [activityId, user, API_BASE_URL, navigate, showAlert]);

  const handleWrittenSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile && !writtenForm.url.trim() && !writtenForm.content.trim()) {
      showAlert('warning', 'Incomplete Submission', 'Please provide at least one: an uploaded photo/file of your paper work, a video/docs link, or a written answer.');
      return;
    }
    setWrittenSubmitting(true);
    try {
      const studentId = user?.student_id || user?.id || user?.username;
      const formData = new FormData();
      formData.append('activity_id', activityId);
      formData.append('student_id', studentId);
      formData.append('submission_content', writtenForm.content);
      formData.append('submission_url', writtenForm.url);
      if (selectedFile) {
        formData.append('submission_file', selectedFile);
      }

      const res = await axios.post(`${API_BASE_URL}/lms/submit_activity.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        setWrittenSubmitted(true);
      } else {
        showAlert('error', 'Submission Failed', res.data.message || 'Unable to submit work.');
      }
    } catch (err) {
      console.error("Submit written work error:", err);
      showAlert('error', 'Submission Error', err.response?.data?.message || 'Error submitting work.');
    } finally {
      setWrittenSubmitting(false);
    }
  };

  const antiCheat = {
    ...DEFAULT_ANTI_CHEAT,
    ...(examData?.anti_cheat || {})
  };

  // Exit fullscreen helper when exam finishes
  const exitFullscreenSafely = () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
  };

  // 2. SUBMIT HANDLER
  const handleSubmit = useCallback(async (e = null, reason = '') => {
    if (e) e.preventDefault();

    setSubmitting(true);
    try {
      const studentId = user?.student_id || user?.id || user?.username;
      const res = await axios.post(`${API_BASE_URL}/lms/submit_exam.php`, {
        student_id: studentId,
        activity_id: activityId,
        answers: answers,
        auto_submit_reason: reason || null,
        violation_count: violationCountRef.current,
        violation_log: violationLogRef.current
      });

      if (res.data.status === 'success') {
        exitFullscreenSafely();
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
  }, [answers, activityId, user, API_BASE_URL, showAlert]);

  // Record a violation strike (debounced by 1500ms so blur + visibilitychange don't double-count)
  const recordViolation = useCallback((reasonLabel) => {
    if (!hasStarted || result || submitting || !antiCheat.enabled) return;

    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1500) return;
    lastViolationTimeRef.current = now;

    const timeStamp = new Date().toLocaleTimeString();
    const entry = `${timeStamp} — ${reasonLabel}`;
    const nextCount = violationCountRef.current + 1;
    const nextLog = [...violationLogRef.current, entry];

    violationCountRef.current = nextCount;
    violationLogRef.current = nextLog;
    setViolationCount(nextCount);
    setViolationLog(nextLog);

    const maxWarnings = Number(antiCheat.max_warnings ?? 2);

    if (nextCount > maxWarnings) {
      showAlert(
        'error',
        '🚨 Anti-Cheat Forced Submission',
        `Violation Detected: ${reasonLabel}.\n\nYou have exceeded the maximum allowed warnings (${maxWarnings}). Your examination has been locked and automatically submitted to your teacher.`,
        () => handleSubmit(null, `anti_cheat: ${reasonLabel}`)
      );
    } else {
      const remaining = maxWarnings - nextCount + 1;
      showAlert(
        'warning',
        `⚠️ Anti-Cheat Warning (${nextCount} of ${maxWarnings})`,
        `Violation Detected: ${reasonLabel}.\n\nPlease stay on the examination screen. ${remaining === 1 ? 'One more violation will automatically lock and submit your exam!' : `You have ${remaining - 1} warning(s) remaining before automatic submission.`}`
      );
    }
  }, [hasStarted, result, submitting, antiCheat.enabled, antiCheat.max_warnings, showAlert, handleSubmit]);

  // Start Exam & Enter Fullscreen if required
  const handleStartExam = async () => {
    if (antiCheat.enabled && antiCheat.require_fullscreen) {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (e) {
        console.warn("Fullscreen request declined or unsupported:", e);
      }
    }
    setHasStarted(true);
  };

  const requestFullscreenAgain = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (e) {}
  };

  // 3. TIMER & AUTO-SUBMIT LOGIC
  useEffect(() => {
    if (!hasStarted || timeLeft === null || result || submitting) return;

    if (timeLeft <= 0) {
      showAlert('error', '⏰ Time Expired', 'Your examination time has run out. Your answers are now being submitted automatically.', () => {
        handleSubmit(null, 'time_expired');
      });
      return;
    }

    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [hasStarted, timeLeft, result, submitting, handleSubmit, showAlert]);

  // 4. ANTI-CHEAT LISTENERS: TAB SWITCH, WINDOW BLUR, FULLSCREEN EXIT, COPY/PASTE, RIGHT-CLICK, DEVTOOLS
  useEffect(() => {
    if (!hasStarted || result || submitting || !examData || !antiCheat.enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && antiCheat.detect_tab_switch) {
        recordViolation('Switched browser tab or minimized window');
      }
    };

    const handleWindowBlur = () => {
      if (antiCheat.detect_tab_switch) {
        recordViolation('Left examination window / switched application (Alt+Tab)');
      }
    };

    const handleFullscreenChange = () => {
      const inFs = Boolean(document.fullscreenElement);
      setIsFullscreen(inFs);
      if (!inFs && antiCheat.require_fullscreen) {
        recordViolation('Exited Fullscreen proctoring mode');
      }
    };

    const handleCopyCutPaste = (e) => {
      if (antiCheat.block_copy_paste) {
        e.preventDefault();
        showAlert('warning', '🛡️ Action Blocked', 'Copying, cutting, and pasting content are strictly disabled by the Anti-Cheat Policy.');
      }
    };

    const handleContextMenu = (e) => {
      if (antiCheat.block_copy_paste) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e) => {
      if (!antiCheat.block_copy_paste) return;
      const key = (e.key || '').toLowerCase();
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (e.ctrlKey && ['u', 'p', 's'].includes(key))
      ) {
        e.preventDefault();
        showAlert('warning', '🛡️ Restricted Shortcut', 'Browser inspector, printing, and source shortcuts are disabled during the examination.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopyCutPaste);
    document.addEventListener('cut', handleCopyCutPaste);
    document.addEventListener('paste', handleCopyCutPaste);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopyCutPaste);
      document.removeEventListener('cut', handleCopyCutPaste);
      document.removeEventListener('paste', handleCopyCutPaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasStarted, result, submitting, examData, antiCheat.enabled, antiCheat.detect_tab_switch, antiCheat.require_fullscreen, antiCheat.block_copy_paste, recordViolation, showAlert]);

  // 5. BLOCK PAGE REFRESH OR CLOSE
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasStarted && !result && !submitting && examData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasStarted, result, submitting, examData]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    showConfirm(
      'warning',
      'Submit Examination?',
      'Are you sure you want to turn in your examination answers? You cannot edit them after submitting.',
      'Yes, Submit Exam',
      'Review Answers',
      () => handleSubmit(null)
    );
  };

  const handleBackClick = () => {
    if (hasStarted && !result && examData) {
      showConfirm(
        'warning',
        'Abandon Examination?',
        'Warning: Leaving now will immediately submit your current progress and consume your attempt.\n\nAre you sure you want to leave?',
        'Yes, Submit & Leave',
        'Stay in Exam',
        () => handleSubmit(null, 'abandoned')
      );
    } else {
      exitFullscreenSafely();
      navigate(-1);
    }
  };

  const toggleCheckboxAnswer = (questionId, choiceId) => {
    setAnswers(prev => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const exists = current.includes(choiceId);
      const next = exists ? current.filter(id => id !== choiceId) : [...current, choiceId];
      return { ...prev, [questionId]: next };
    });
  };

  const updateEnumerationAnswer = (questionId, itemIndex, val, totalItems) => {
    setAnswers(prev => {
      const current = Array.isArray(prev[questionId])
        ? [...prev[questionId]]
        : Array.from({ length: totalItems }, () => '');
      current[itemIndex] = val;
      return { ...prev, [questionId]: current };
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Secure Examination...</p>
      </div>
    );
  }
  if (errorState || !examData) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 mx-auto mb-4 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">
            {errorState?.title || 'Examination Closed'}
          </h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            {errorState?.message || 'This activity or examination is no longer available.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return to Classroom
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900 py-8 px-4 font-sans relative select-none">
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

      {/* STICKY TOP PROCTORING BAR */}
      <div className="max-w-3xl mx-auto flex flex-wrap justify-between items-center gap-3 mb-6 sticky top-3 z-40 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-md border border-slate-200">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-black text-xs bg-slate-100 hover:bg-indigo-50 px-3.5 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft size={15} /> {hasStarted && !result ? 'Abandon / Leave' : 'Back'}
        </button>

        {hasStarted && !result && (
          <div className="flex flex-wrap items-center gap-2.5">
            {antiCheat.enabled && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                violationCount > 0
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {violationCount > 0 ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}
                <span>Strikes: {violationCount} / {antiCheat.max_warnings}</span>
              </div>
            )}

            {antiCheat.enabled && antiCheat.require_fullscreen && !isFullscreen && (
              <button
                type="button"
                onClick={requestFullscreenAgain}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500 text-white shadow-sm hover:bg-amber-600 transition-colors"
              >
                <Maximize2 size={14} /> Re-enter Fullscreen
              </button>
            )}

            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-black border transition-colors ${
                timeLeft <= 60
                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                  : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <Clock size={16} />
                <span className="tracking-widest text-sm">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto pb-24">
        {result ? (
          /* ─── RESULT SCREEN ─── */
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden text-center p-10 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={42} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">Examination Submitted!</h1>
            <p className="text-slate-500 text-sm font-medium mb-6">
              {result.auto_submit_reason
                ? `Auto-submitted due to: ${result.auto_submit_reason}`
                : 'Your answers have been recorded in the class gradebook.'}
            </p>

            <div className="inline-flex flex-col sm:flex-row items-center gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-200/80 mb-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Objective Score</p>
                <p className="text-5xl font-black text-indigo-600">
                  {result.score} <span className="text-2xl text-slate-400">/ {result.total}</span>
                </p>
              </div>
              <div className="h-10 w-[1px] bg-slate-200 hidden sm:block" />
              <div className="text-left">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Proctoring Status</p>
                {(result.violation_count || violationCount) > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                    <AlertTriangle size={14} /> {result.violation_count || violationCount} Violation(s) Logged
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                    <ShieldCheck size={14} /> Clean Attempt (0 Violations)
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {result.can_retake && !examData?.is_closed && (
                <button
                  type="button"
                  onClick={handleStartRetake}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Award size={18} /> Retake Assessment ({attemptsInfo.current}/{attemptsInfo.max} Used • Keeps Highest Score)
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
              >
                Return to Classroom
              </button>
            </div>

            {examData?.is_closed && (
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-4 flex items-center justify-center gap-1.5">
                <Lock size={14} className="text-rose-500" /> Activity is now closed. Retakes are not allowed after the due date.
              </p>
            )}

            {!examData?.is_closed && attemptsInfo.current >= attemptsInfo.max && attemptsInfo.max > 1 && (
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-4 flex items-center justify-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" /> All {attemptsInfo.max} allowed attempts have been completed.
              </p>
            )}
          </div>
        ) : (!examData.questions || examData.questions.length === 0) ? (
          /* ─── SCENARIO A: WRITTEN WORK / PERFORMANCE TASK (NO EXAM QUESTIONS) ─── */
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-indigo-600 to-slate-900 p-8 text-white">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 backdrop-blur-md mb-3 inline-block">
                {examData.category ? examData.category.toUpperCase() : 'WRITTEN WORK / TASK'} • {examData.max_score || 100} PTS
              </span>
              <h1 className="text-2xl md:text-3xl font-black">{examData.title}</h1>
              {examData.description && (
                <p className="text-white/85 text-sm mt-3 whitespace-pre-wrap leading-relaxed">{examData.description}</p>
              )}
            </div>

            <div className="p-8">
              {writtenSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={36} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2">Work Successfully Submitted!</h2>
                  <p className="text-sm text-slate-500 mb-6">Your submission has been recorded. Your teacher will review and grade your work.</p>
                  <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-700 transition-all"
                  >
                    Return to Classroom
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWrittenSubmit} className="space-y-6">
                  {/* Option 1: Upload Paper Work Photo or Document */}
                  <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70">
                    <div className="flex items-center gap-2 mb-2 text-slate-700 font-black text-xs uppercase tracking-wider">
                      <Image size={16} className="text-indigo-600" />
                      <span>Upload Paper Work Photo / Document</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Take a photo of your handwritten paper work, drawings, or upload a PDF document.
                    </p>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors">
                        <Paperclip size={14} /> Choose Photo or File
                        <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                      </label>
                      {selectedFile && (
                        <span className="text-xs text-slate-600 font-semibold truncate max-w-[240px]">
                          {selectedFile.name}
                        </span>
                      )}
                    </div>

                    {filePreview && (
                      <div className="mt-3 relative inline-block rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <img src={filePreview} alt="Paper work preview" className="max-h-48 rounded-xl object-contain" />
                        <button
                          type="button"
                          onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                          className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Video Link / Google Docs Link */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Video size={14} className="text-red-600" /> Video Performance Link (Dance / Presentation) or Google Docs
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="e.g. YouTube video, Google Drive dance video, or Google Docs link"
                        value={writtenForm.url}
                        onChange={(e) => setWrittenForm({ ...writtenForm, url: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none pr-24"
                      />
                      {writtenForm.url && String(writtenForm.url).startsWith('http') && (
                        <a
                          href={writtenForm.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-2 top-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          Test Link <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      For performance tasks (dance/presentation), paste your YouTube or Google Drive link. Set sharing to "Anyone with the link can view".
                    </p>
                  </div>

                  {/* Option 3: Written Text / Notes */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Written Answer / Essay / Notes to Teacher
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Type your answer, essay, or comments for your teacher here..."
                      value={writtenForm.content}
                      onChange={(e) => setWrittenForm({ ...writtenForm, content: e.target.value })}
                      className="w-full p-4 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={writtenSubmitting || (!selectedFile && !writtenForm.url.trim() && !writtenForm.content.trim())}
                      className="px-7 py-3 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {writtenSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Turn In Work
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : !hasStarted ? (
          /* ─── PRE-EXAM ANTI-CHEAT POLICY BRIEFING LOBBY ─── */
          <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-indigo-600 to-slate-900 p-8 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-3">
                <ShieldCheck size={15} /> Official Proctored Examination
              </div>
              <h1 className="text-2xl md:text-3xl font-black leading-tight">{examData.title}</h1>
              {examData.description && (
                <p className="text-white/85 text-sm mt-2 whitespace-pre-wrap">{examData.description}</p>
              )}
            </div>

            <div className="p-8 space-y-6">
              {/* Exam Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400">Total Items</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{examData.questions?.length || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400">Total Points</p>
                  <p className="text-xl font-black text-indigo-600 mt-0.5">{examData.max_score || 0} pts</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400">Time Limit</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">
                    {examData.time_limit_minutes ? `${examData.time_limit_minutes} mins` : 'Untimed'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400">Attempt</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">
                    {attemptsInfo.current + 1} of {attemptsInfo.max}
                  </p>
                </div>
              </div>

              {/* Anti-Cheat Policy Card */}
              {antiCheat.enabled && (
                <div className="bg-amber-50/90 border-2 border-amber-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldAlert size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-amber-950">Anti-Cheat Policy & Proctoring Rules</h3>
                      <p className="text-xs font-semibold text-amber-800">
                        This examination is actively monitored. Violations are logged and reported to your teacher.
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs font-bold text-amber-900 pl-1">
                    {antiCheat.require_fullscreen && (
                      <li className="flex items-start gap-2.5">
                        <Maximize2 size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Fullscreen Mode Required:</strong> The exam will open in fullscreen. Exiting fullscreen during the exam counts as a violation strike.</span>
                      </li>
                    )}
                    {antiCheat.detect_tab_switch && (
                      <li className="flex items-start gap-2.5">
                        <EyeOff size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>No Tab or Window Switching:</strong> Switching browser tabs, minimizing the browser, or pressing <code>Alt+Tab</code> is strictly prohibited.</span>
                      </li>
                    )}
                    {antiCheat.block_copy_paste && (
                      <li className="flex items-start gap-2.5">
                        <Lock size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Clipboard & Right-Click Locked:</strong> Copying, cutting, pasting, right-clicking, and browser developer tools are disabled.</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2.5">
                      <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
                      <span className="text-red-800">
                        <strong>Strike Limit ({antiCheat.max_warnings} {antiCheat.max_warnings === 1 ? 'Warning' : 'Warnings'}):</strong> Exceeding {antiCheat.max_warnings} {antiCheat.max_warnings === 1 ? 'warning' : 'warnings'} will immediately lock and auto-submit your exam.
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleStartExam}
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <FileCheck size={18} />
                  <span>I Agree to the Policy — Start Examination Now</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ─── ACTIVE EXAM FORM ─── */
          <form onSubmit={handleFormSubmit}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600"></div>
              <div className="p-8 pt-10">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 leading-tight">{examData.title}</h1>
                {examData.description && (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{examData.description}</p>
                )}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-xs font-bold text-slate-500">
                  <div className="flex gap-4">
                    <span>Category: <span className="uppercase text-indigo-600 font-black">{examData.category}</span></span>
                    <span>Total Items: <strong>{examData.questions.length}</strong></span>
                  </div>
                  <span className="bg-slate-100 px-3 py-1 rounded-md text-slate-600">
                    Attempt {attemptsInfo.current + 1} of {attemptsInfo.max}
                  </span>
                </div>
              </div>
            </div>

            {examData.questions.map((q, index) => {
              const qType = q.question_type || 'multiple_choice';
              const enumCount = q.expected_items || 3;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 p-6 md:p-8 transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300"
                >
                  <div className="flex justify-between items-start gap-4 mb-5">
                    <div className="text-base font-bold text-slate-800 leading-snug flex gap-2">
                      <span className="text-indigo-600 font-black shrink-0">{index + 1}.</span>
                      <RichContent html={q.question_text} />
                    </div>
                    <span className="shrink-0 text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {q.points} {Number(q.points) === 1 ? 'pt' : 'pts'}
                    </span>
                  </div>

                  {/* 1. MULTIPLE CHOICE / TRUE OR FALSE */}
                  {(qType === 'multiple_choice' || qType === 'true_false') && (
                    <div className="flex flex-col gap-2.5">
                      {(q.choices || []).map((choice, cIdx) => {
                        const selected = String(answers[q.id]) === String(choice.id);
                        const letter = String.fromCharCode(65 + cIdx);
                        return (
                          <label
                            key={choice.id}
                            className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              selected
                                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold shadow-xs'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              value={choice.id}
                              checked={selected}
                              onChange={() => setAnswers(prev => ({ ...prev, [q.id]: choice.id }))}
                              required
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            {qType === 'multiple_choice' && (
                              <span className="text-xs font-black text-indigo-600">{letter}.</span>
                            )}
                            <span className="text-sm">{choice.choice_text}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. CHECKBOXES (MULTIPLE ANSWERS) */}
                  {qType === 'checkboxes' && (
                    <div className="flex flex-col gap-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Select all that apply:
                      </p>
                      {(q.choices || []).map((choice) => {
                        const selectedArr = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                        const isChecked = selectedArr.includes(choice.id);
                        return (
                          <label
                            key={choice.id}
                            className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCheckboxAnswer(q.id, choice.id)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm">{choice.choice_text}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. IDENTIFICATION / FILL IN THE BLANK */}
                  {(qType === 'identification' || qType === 'fill_blank') && (
                    <div>
                      <input
                        type="text"
                        required
                        placeholder={qType === 'fill_blank' ? 'Type the missing word or phrase...' : 'Type your answer here...'}
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        style={{ color: '#0f172a', caretColor: '#0f172a' }}
                        className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-900"
                      />
                    </div>
                  )}

                  {/* 4. ENUMERATION */}
                  {qType === 'enumeration' && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Provide {enumCount} {enumCount === 1 ? 'answer' : 'answers'}:
                      </p>
                      {Array.from({ length: enumCount }).map((_, idx) => {
                        const currentArr = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              required
                              placeholder={`Answer #${idx + 1}`}
                              value={currentArr[idx] || ''}
                              onChange={(e) => updateEnumerationAnswer(q.id, idx, e.target.value, enumCount)}
                              style={{ color: '#0f172a', caretColor: '#0f172a' }}
                              className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none text-sm font-bold text-slate-900"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 5. ESSAY / PARAGRAPH */}
                  {qType === 'essay' && (
                    <textarea
                      rows="4"
                      placeholder="Type your explanation or essay response here..."
                      required
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      style={{ color: '#0f172a', caretColor: '#0f172a' }}
                      className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y text-sm font-medium text-slate-900"
                    />
                  )}
                </div>
              );
            })}

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Submitting Examination...' : 'Submit Examination Answers'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LmsTakeExam;
