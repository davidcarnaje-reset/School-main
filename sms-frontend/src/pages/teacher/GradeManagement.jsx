import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, CheckCircle } from 'lucide-react';
import {
  getGradingCategories, calculateFinalGrade, getGradeStatus,
  normaliseStudent, buildStudentPayload, clampGrade,
  buildScoresMap, computeWrittenFromActivities, computeExamFromActivities,
  categorizeActivities
} from '../../utils/gradingUtils';
import { gradeStyles } from '../../components/shared/GradeManagementStyles';
import { GradeHeader, GradeStats, GradeTable, GradeManagementSkeleton } from '../../components/shared/GradeManagementUI';

const GradeManagement = () => {
  const { classId } = useParams();
  const { user, API_BASE_URL, branding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const themeColor = branding?.theme_color || '#6366f1';

  // ─── STATE ──────────────────────────────────────────────────────────────────
  const { subject: stateSubject, section: stateSection, grade_level: stateGradeLevel, fromActivities } = location.state || {};
  const initialQuarter = parseInt(searchParams.get('quarter')) || parseInt(searchParams.get('period')) || location.state?.quarter || 1;
  const [selectedQuarter, setSelectedQuarter] = useState(initialQuarter);

  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [allActivities, setAllActivities] = useState([]);
  const [activityScores, setActivityScores] = useState([]);

  // ─── DERIVED VALUES ────────────────────────────────────────────────────────
  const currentLevel = useMemo(() => {
    const dept = (classInfo?.department || '').toUpperCase();
    const gl = (classInfo?.grade_level || classInfo?.level || stateGradeLevel || '').toUpperCase();
    if (dept === 'COLLEGE' || gl.includes('YEAR') || gl.includes('COLLEGE')) return 'College';
    if (dept === 'SHS' || gl.includes('11') || gl.includes('12')) return 'SHS';
    return 'K-10';
  }, [classInfo, stateGradeLevel]);

  const isK12 = currentLevel !== 'College';
  const categories = useMemo(() => getGradingCategories(currentLevel), [currentLevel]);

  const systemLabel = currentLevel === 'College' ? 'College System' : (currentLevel === 'SHS' ? 'SHS System' : 'JHS System');
  const displaySubject = classInfo?.subject_description || classInfo?.subject_name || stateSubject || 'Grade Management';
  const displaySection = classInfo?.section_name || classInfo?.section || stateSection || 'TBA';
  const displayGradeLevel = classInfo?.grade_level || classInfo?.level || stateGradeLevel || 'Grade Level';
  const periodLabels = { 1: 'Prelim', 2: 'Midterm', 3: 'Finals' };

  // ─── FETCH FUNCTIONS ───────────────────────────────────────────────────────
  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem('sms_token') || '';
      const params = { class_id: classId };
      if (isK12) params.quarter = selectedQuarter;

      const res = await axios.get(`${API_BASE_URL}/teacher/get_activities.php`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setAllActivities(res.data.data || []);
        return res.data.data || [];
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
    return [];
  }, [classId, selectedQuarter, isK12, API_BASE_URL]);

  const fetchActivityScores = useCallback(async () => {
    try {
      const token = localStorage.getItem('sms_token') || '';
      const params = { class_id: classId };
      if (isK12) params.quarter = selectedQuarter;

      const res = await axios.get(`${API_BASE_URL}/teacher/get_activity_scores.php`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setActivityScores(res.data.data || []);
        return res.data.data || [];
      }
    } catch (err) {
      console.error('Failed to fetch activity scores:', err);
    }
    return [];
  }, [classId, selectedQuarter, isK12, API_BASE_URL]);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const token = localStorage.getItem('sms_token');
      const params = { class_id: classId, quarter: selectedQuarter };

      const [gradesRes, activities, scores] = await Promise.all([
        axios.get(`${API_BASE_URL}/teacher/get_class_grades.php`, { params, headers: { Authorization: `Bearer ${token}` } }),
        fetchActivities(),
        fetchActivityScores()
      ]);

      if (gradesRes.data.status === 'success') {
        setClassInfo(prev => gradesRes.data.class_info || prev);
        
        let mappedStudents = gradesRes.data.data.map(normaliseStudent) || [];
        
        const scoresMapData = buildScoresMap(scores);
        const categorized = categorizeActivities(activities);
        
        mappedStudents = mappedStudents.map(s => {
          const studentId = String(s.student_number || s.student_id);
          return {
            ...s,
            written: computeWrittenFromActivities(studentId, categorized.written, scoresMapData),
            exam: computeExamFromActivities(studentId, categorized.exam, scoresMapData),
            performance: parseFloat(s.performance) || 0,
          };
        });
        
        setStudents(mappedStudents);
        setIsSubmitted(gradesRes.data.class_info?.is_grades_submitted === 1 || gradesRes.data.class_info?.is_grades_submitted === true);
        setIsServerOffline(false);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
      setIsServerOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [classId, selectedQuarter, API_BASE_URL, fetchActivities, fetchActivityScores]);

  // ─── EFFECTS ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.id && classId) {
      fetchData(true);
    }
  }, [user?.id, classId, selectedQuarter, fetchData]);

  // ─── ACTIVITY COUNT ────────────────────────────────────────────────────────
  const actCount = useMemo(() => {
    const categorized = categorizeActivities(allActivities);
    return {
      written: categorized.written.length,
      performance: categorized.performance.length,
      exam: categorized.exam.length,
    };
  }, [allActivities]);

  // ─── HANDLERS ──────────────────────────────────────────────────────────────
  const handleQuarterChange = (quarter) => {
    setSelectedQuarter(quarter);
    setSearchParams(isK12 ? { quarter } : { period: quarter }, { replace: true, state: location.state });
  };

  const syncFromActivities = async () => {
    if (isSubmitted) return;
    const quarterText = isK12 ? `Quarter ${selectedQuarter}` : periodLabels[selectedQuarter] || 'this period';
    if (!window.confirm(`This will auto-calculate Written Work and Examination for ${quarterText}. Continue?`)) return;

    setIsSaving(true);
    setStatusMsg(null);
    try {
      await fetchData(false);
      setStatusMsg({ type: 'success', text: `Grades synced successfully!` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Unknown error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleInputChange = (id, field, value) => {
    if (isSubmitted) return;
    if (field !== 'performance') return;
    
    if (value === '') {
      return setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: '' } : s));
    }
    if (/^\d*$/.test(value)) {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num <= 100) {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: num } : s));
      }
    }
  };

  const handleInputBlur = (id, field, value) => {
    if (isSubmitted) return;
    if (field !== 'performance') return;
    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value === '' ? 0 : clampGrade(value) } : s
    ));
  };

  const saveAllGrades = async () => {
    if (isSubmitted) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sms_token');
      const payload = { 
        class_id: parseInt(classId), 
        quarter: selectedQuarter,
        students: students.map(s => buildStudentPayload(s, currentLevel)) 
      };

      const res = await axios.post(`${API_BASE_URL}/teacher/save_grades.php`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Grades saved!' });
      } else {
        throw new Error(res.data.message || 'Save failed');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Save failed.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const submitFinalGrades = async () => {
    if (!window.confirm("Submit and lock these grades?")) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sms_token');
      const payload = {
        class_id: parseInt(classId),
        quarter: selectedQuarter,
        students: students.map(s => ({
          student_id: s.student_id || s.student_number,
          final_grade: calculateFinalGrade(s, currentLevel),
          remarks: getGradeStatus(calculateFinalGrade(s, currentLevel), currentLevel),
          ...buildStudentPayload(s, currentLevel)
        }))
      };

      const res = await axios.post(`${API_BASE_URL}/teacher/submit_final_grades.php`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Grades submitted and locked!' });
        setIsSubmitted(true);
      } else {
        throw new Error(res.data.message || 'Submission failed');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const requestEditPermission = async () => {
    if (!window.confirm("Request permission to unlock grades?")) return;
    setIsRequesting(true);
    try {
      const token = localStorage.getItem('sms_token');
      const payload = { class_id: parseInt(classId), quarter: selectedQuarter };
      
      const res = await axios.post(`${API_BASE_URL}/teacher/request_grade_unlock.php`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Unlock request sent.' });
      } else {
        throw new Error(res.data.message || 'Request failed');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to send request.' });
    } finally {
      setIsRequesting(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleGoBack = () => {
    navigate(fromActivities ? `/teacher/activities/${classId}` : '/teacher/classes');
  };

  // ─── COMPUTED STATS ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    return students.reduce((acc, s) => {
      const finalGrade = calculateFinalGrade(s, currentLevel);
      const status = getGradeStatus(finalGrade, currentLevel);
      status === 'Passed' ? acc.passed++ : acc.failed++;
      return acc;
    }, { passed: 0, failed: 0 });
  }, [students, currentLevel]);

  const passRate = students.length ? Math.round((stats.passed / students.length) * 100) : 0;

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return students.filter(s => {
      const matchSearch = !q || 
        (s.name || '').toLowerCase().includes(q) || 
        (s.student_number || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (filterStatus === 'All') return true;
      const finalGrade = calculateFinalGrade(s, currentLevel);
      return getGradeStatus(finalGrade, currentLevel) === filterStatus;
    });
  }, [students, searchQuery, filterStatus, currentLevel]);

  // ─── RENDER ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <style>{gradeStyles(themeColor)}</style>
        <GradeManagementSkeleton themeColor={themeColor} />
      </>
    );
  }

  return (
  <div className="gm-root w-full max-w-full overflow-hidden px-1 sm:px-3" style={{ maxWidth: '100vw' }}>
      <style>{gradeStyles(themeColor)}</style>

      <GradeHeader
        displaySubject={displaySubject}
        displayGradeLevel={displayGradeLevel}
        displaySection={displaySection}
        systemLabel={systemLabel}
        isK12={isK12}
        selectedQuarter={selectedQuarter}
        setSelectedQuarter={handleQuarterChange}
        setSearchParams={setSearchParams}
        locationState={location.state}
        themeColor={themeColor}
        isSubmitted={isSubmitted}
        handleGoBack={handleGoBack}
        syncFromActivities={syncFromActivities}
        saveAllGrades={saveAllGrades}
        submitFinalGrades={submitFinalGrades}
        requestEditPermission={requestEditPermission}
        isSaving={isSaving}
        isServerOffline={isServerOffline}
        isRequesting={isRequesting}
      />

      {isServerOffline && (
        <div className="gm-offline-banner">
          <AlertCircle size={15} /> Server is offline. Showing cached data.
        </div>
      )}

      {statusMsg && (
        <div className={`gm-status gm-status--${statusMsg.type}`}>
          {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <GradeStats
        studentsLength={students.length}
        stats={stats}
        passRate={passRate}
        themeColor={themeColor}
      />

      <GradeTable
        themeColor={themeColor}
        categories={categories}
        actCount={actCount}
        isK12={isK12}
        isSubmitted={isSubmitted}
        studentsLength={students.length}
        filteredStudents={filteredStudents}
        handleInputChange={handleInputChange}
        handleInputBlur={handleInputBlur}
        currentLevel={currentLevel}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        classInfo={classInfo}
      />
    </div>
  );
};

export default GradeManagement;