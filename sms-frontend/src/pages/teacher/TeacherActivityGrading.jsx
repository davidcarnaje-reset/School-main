import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Context at Styles
import { useAuth } from '../../context/AuthContext';
import { gradingStyles } from '../../components/shared/gradingStyles';

// 🟢 ITO YUNG IMPORT NG MGA UI COMPONENTS NA GINAWA NATIN
import {
  GradingSkeleton,
  GradeExamSubmissionModal,
  ViewSubmissionModal,
  GradingOfflineBanner,
  GradingHeader,
  GradingTable
} from '../../components/shared/TeacherActivityGradingUI';

const quarterColors = {
  1: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  2: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  3: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  4: { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
};

const TeacherActivityGrading = () => {
  const { activityId } = useParams();
  const navigate       = useNavigate();
  const location       = useLocation();

  // Ibalik natin ito para makuha ang API URL at kulay
  const { API_BASE_URL, branding } = useAuth();
  const themeColor = branding?.theme_color || '#6366f1';

  const { subject, section } = location.state || {}; // Inalis natin ang quarter dito
  
  // ISANG BESES LANG IDE-DECLARE ANG MGA STATES
  const [activity,          setActivity]          = useState(null);
  const [scores,            setScores]            = useState([]);
  const [isLoading,         setIsLoading]         = useState(true);
  const [isServerOffline,   setIsServerOffline]   = useState(false);
  const [isRetrying,        setIsRetrying]        = useState(false);
  
  const [gradingExamStudent, setGradingExamStudent] = useState(null); 
  const [viewingWrittenWork, setViewingWrittenWork] = useState(null); 

  // 🟢 DITO NA NATIN KUKUNIN ANG QUARTER MISMO SA ACTIVITY DATA
  const activeQuarter = activity?.quarter || null;
  const qNum    = activeQuarter ? parseInt(activeQuarter) : null;
  const qColors = qNum ? quarterColors[qNum] : null;

  const fetchData = useCallback(async (showLoading = true) => {
    if (!activityId || activityId === 'undefined') return;
    if (showLoading) setIsLoading(true);
    setIsRetrying(true);
    try {
      const token = localStorage.getItem('sms_token');
      const res = await axios.get(`${API_BASE_URL}/teacher/get_activity_scores.php`, {
        params: { activity_id: activityId },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setActivity(res.data.activity);
        const formattedScores = (res.data.scores || []).map(s => ({
          ...s,
          score: (s.score !== null && s.score !== '') ? Math.round(parseFloat(s.score)) : ''
        }));
        setScores(formattedScores);
        setIsServerOffline(false);
      }
    } catch (err) {
      console.error("Failed fetching activity scores", err);
      setIsServerOffline(true);
    } finally {
      setTimeout(() => { setIsLoading(false); setIsRetrying(false); }, 800);
    }
  }, [activityId, API_BASE_URL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) return (
    <>
      <style>{gradingStyles(themeColor)}</style>
      <GradingSkeleton themeColor={themeColor} />
    </>
  );

  const isActivityAnExam = activity?.category === 'exam' || activity?.type === 'exam' || activity?.category === 'quarterly_exam';

  return (
    <div className="tag-root">
      <style>{gradingStyles(themeColor)}</style>

     {/* MODALS */}
      {gradingExamStudent && (
        <GradeExamSubmissionModal 
          studentId={gradingExamStudent.student_id} activityId={activityId} classId={activity?.class_id}
          quarter={activeQuarter} studentName={gradingExamStudent.name} themeColor={themeColor} API_BASE_URL={API_BASE_URL}
          onClose={() => setGradingExamStudent(null)} onRefresh={() => fetchData(false)}
        />
      )}

      {viewingWrittenWork && (
        <ViewSubmissionModal 
          studentId={viewingWrittenWork.student_id} activityId={activityId} classId={activity?.class_id}
          quarter={activeQuarter} studentName={viewingWrittenWork.name} maxScore={activity?.max_score}
          submission={{ type: viewingWrittenWork.submission_type || 'text', content: viewingWrittenWork.submission_content }}
          currentScore={viewingWrittenWork.score} onRefresh={() => fetchData(false)} onClose={() => setViewingWrittenWork(null)}
          themeColor={themeColor} API_BASE_URL={API_BASE_URL}
        />
      )}

      {/* UI COMPONENTS */}
      <GradingHeader 
        navigate={navigate} themeColor={themeColor} subject={subject} section={section} 
        activity={activity} qNum={qNum} qColors={qColors} 
      />

      <GradingOfflineBanner 
        isServerOffline={isServerOffline} isRetrying={isRetrying} onRetry={() => fetchData(false)} 
      />

      <GradingTable 
        scores={scores} themeColor={themeColor} activity={activity} isActivityAnExam={isActivityAnExam} 
        setGradingExamStudent={setGradingExamStudent} setViewingWrittenWork={setViewingWrittenWork} 
      />
    </div>
  );
};

export default TeacherActivityGrading;