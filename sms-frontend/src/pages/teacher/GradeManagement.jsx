import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, CheckCircle } from 'lucide-react';
import {
  getGradingCategories,
  calculateFinalGrade,
  getGradeStatus,
  normaliseStudent,
  buildStudentPayload,
  clampGrade,
  buildScoresMap,
  computeWrittenFromActivities,
  computeExamFromActivities,
  categorizeActivities,
  detectSchoolStage,
  detectSubjectWeightProfileKey,
  computeEcrStudentMetrics,
  DEFAULT_ECR_HPS,
  getDescriptiveScaleItem
} from '../../utils/gradingUtils';
import { exportTeacherClassRecordExcel } from '../../utils/depedExcelGenerator';
import { gradeStyles } from '../../components/shared/GradeManagementStyles';
import {
  GradeHeader,
  GradeConfigBar,
  GradeStats,
  GradeTable,
  GradeManagementSkeleton
} from '../../components/shared/GradeManagementUI';

const GradeManagement = () => {
  const { classId } = useParams();
  const { user, API_BASE_URL, branding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const themeColor = branding?.theme_color || '#4f46e5';

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

  // DepEd DO 015, s. 2026 Grading Controls
  const [weightProfileKey, setWeightProfileKey] = useState('KS2_KS3_CORE');
  const [transmutationMode, setTransmutationMode] = useState('adjusted_2026'); // 'adjusted_2026' | 'zero_based'
  const [viewMode, setViewMode] = useState('ECR'); // 'ECR' | 'QUICK' | 'SUMMARY'
  const [gradingMode, setGradingMode] = useState('numerical_ecr'); // 'kinder_descriptive' | 'pace_descriptive' | 'numerical_ecr' | 'college'
  const [hps, setHps] = useState(DEFAULT_ECR_HPS);

  // ─── DERIVED VALUES ────────────────────────────────────────────────────────
  const displaySubject = classInfo?.subject_description || classInfo?.subject_name || stateSubject || 'Grade Management';
  const displaySection = classInfo?.section_name || classInfo?.section || stateSection || 'Section A';
  const displayGradeLevel = classInfo?.grade_level || classInfo?.level || stateGradeLevel || 'Grade Level';

  const stageInfo = useMemo(
    () => detectSchoolStage({
      ...classInfo,
      grade_level: displayGradeLevel,
      subject_description: displaySubject
    }),
    [classInfo, displayGradeLevel, displaySubject]
  );

  const stage = stageInfo.stage; // 'KINDER' | 'G1_3' | 'GS_4_6' | 'JHS_7_10' | 'SHS' | 'COLLEGE'
  const currentLevel = stage === 'COLLEGE' ? 'College' : (stage === 'SHS' ? 'SHS' : 'K-10');
  const isK12 = stage !== 'COLLEGE';
  const categories = useMemo(() => getGradingCategories(weightProfileKey, classInfo), [weightProfileKey, classInfo]);
  const systemLabel = stageInfo.label;

  // Auto-detect subject weight profile and default grading mode when classInfo changes
  useEffect(() => {
    const detectedProfile = detectSubjectWeightProfileKey({
      ...classInfo,
      grade_level: displayGradeLevel,
      subject_description: displaySubject
    });
    setWeightProfileKey(detectedProfile);
    setGradingMode(stageInfo.defaultMode || 'numerical_ecr');
  }, [classInfo, displayGradeLevel, displaySubject, stageInfo.defaultMode]);

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

  const fetchData = useCallback(async (isInitialLoad = false, forceSyncActivities = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const token = localStorage.getItem('sms_token');
      const params = { class_id: classId, quarter: selectedQuarter };

      const [gradesRes, activities, scores] = await Promise.all([
        axios.get(`${API_BASE_URL}/teacher/get_class_grades.php`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetchActivities(),
        fetchActivityScores()
      ]);

      if (gradesRes.data.status === 'success') {
        const fetchedClassInfo = gradesRes.data.class_info || null;
        setClassInfo(prev => fetchedClassInfo || prev);

        const defaultProfile = detectSubjectWeightProfileKey(fetchedClassInfo || {});
        let mappedStudents = (gradesRes.data.data || []).map(r => normaliseStudent(r, defaultProfile));
        const scoresMapData = buildScoresMap(scores);
        const categorized = categorizeActivities(activities);

        // Restore saved HPS, weight_profile, or transmutation_mode from first student with details if present
        const firstWithHps = mappedStudents.find(s => s.details?.hps);
        if (firstWithHps?.details?.hps) setHps(firstWithHps.details.hps);
        if (firstWithHps?.details?.weight_profile) setWeightProfileKey(firstWithHps.details.weight_profile);
        if (firstWithHps?.details?.transmutation_mode) setTransmutationMode(firstWithHps.details.transmutation_mode);

        mappedStudents = mappedStudents.map(s => {
          const studentId = String(s.student_number || s.student_id);
          const hasSavedWritten = parseFloat(s.written) > 0;
          const hasSavedExam = parseFloat(s.exam) > 0;

          const computedWritten = categorized.written.length > 0
            ? computeWrittenFromActivities(studentId, categorized.written, scoresMapData)
            : (parseFloat(s.written) || 0);

          const computedExam = categorized.exam.length > 0
            ? computeExamFromActivities(studentId, categorized.exam, scoresMapData)
            : (parseFloat(s.exam) || 0);

          return {
            ...s,
            written: (forceSyncActivities || !hasSavedWritten) ? computedWritten : (parseFloat(s.written) || 0),
            exam: (forceSyncActivities || !hasSavedExam) ? computedExam : (parseFloat(s.exam) || 0),
            performance: parseFloat(s.performance) || 0
          };
        });

        setStudents(mappedStudents);
        setIsSubmitted(
          fetchedClassInfo?.is_grades_submitted === 1 ||
          fetchedClassInfo?.is_grades_submitted === true
        );
        setIsServerOffline(false);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
      setIsServerOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [classId, selectedQuarter, API_BASE_URL, fetchActivities, fetchActivityScores]);

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
    if (!window.confirm('Sync Written Works and Examination scores from LMS Activities?')) return;

    setIsSaving(true);
    setStatusMsg(null);
    try {
      await fetchData(false, true);
      setStatusMsg({ type: 'success', text: 'Grades synced from LMS activities!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Sync error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  // HPS Change Handler
  const handleHpsChange = (group, idxOrKey, val) => {
    if (isSubmitted) return;
    const num = Math.max(1, parseFloat(val) || 1);
    setHps(prev => {
      if (group === 'ex') {
        return { ...prev, ex: { ...(prev.ex || {}), [idxOrKey]: num } };
      }
      const nextArr = [...(prev[group] || [])];
      nextArr[idxOrKey] = num;
      return { ...prev, [group]: nextArr };
    });
  };

  // ECR Itemized Score Change (WW 1-5, PT 1-5, EX: st1, st2, te)
  const handleEcrItemChange = (studentId, arrayKey, itemIndexOrKey, rawVal) => {
    if (isSubmitted) return;
    const maxScore = arrayKey === 'ww_scores'
      ? (hps.ww?.[itemIndexOrKey] || 100)
      : arrayKey === 'pt_scores'
      ? (hps.pt?.[itemIndexOrKey] || 100)
      : (hps.ex?.[itemIndexOrKey] || 100);

    let cleanVal = '';
    if (rawVal !== '') {
      const num = parseFloat(rawVal);
      if (!isNaN(num)) {
        cleanVal = Math.min(maxScore, Math.max(0, num));
      }
    }

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const nextDetails = { ...(s.details || {}) };

      if (arrayKey === 'ex_scores') {
        nextDetails.ex_scores = { ...(nextDetails.ex_scores || { st1: '', st2: '', te: '' }), [itemIndexOrKey]: cleanVal };
      } else {
        const arr = [...(nextDetails[arrayKey] || ['', '', '', '', ''])];
        arr[itemIndexOrKey] = cleanVal;
        nextDetails[arrayKey] = arr;
      }

      const updatedStudent = { ...s, details: nextDetails };
      const metrics = computeEcrStudentMetrics(updatedStudent, hps, weightProfileKey, transmutationMode);

      return {
        ...updatedStudent,
        written: metrics.wwPS,
        performance: metrics.ptPS,
        exam: metrics.exPS,
        initial_grade: metrics.initialGrade,
        final_grade: metrics.termGrade,
        descriptive_grade: metrics.descriptiveCode || s.descriptive_grade,
        descriptor: metrics.descriptor,
        remarks: metrics.remarks
      };
    }));
  };

  // Direct Percentage Component Change (Quick % View)
  const handleDirectComponentChange = (studentId, field, rawVal) => {
    if (isSubmitted) return;
    const num = rawVal === '' ? 0 : Math.min(100, Math.max(0, parseFloat(rawVal) || 0));

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const nextDetails = { ...(s.details || {}) };
      if (field === 'written') nextDetails.ww_scores = ['', '', '', '', ''];
      if (field === 'performance') nextDetails.pt_scores = ['', '', '', '', ''];
      if (field === 'exam') nextDetails.ex_scores = { st1: '', st2: '', te: '' };

      const updatedStudent = { ...s, [field]: num, details: nextDetails };
      const metrics = computeEcrStudentMetrics(updatedStudent, hps, weightProfileKey, transmutationMode);

      return {
        ...updatedStudent,
        initial_grade: metrics.initialGrade,
        final_grade: metrics.termGrade,
        descriptive_grade: metrics.descriptiveCode || s.descriptive_grade,
        descriptor: metrics.descriptor,
        remarks: metrics.remarks
      };
    }));
  };

  // Descriptive Grade Change (Kindergarten CO/DV/BG or Grades 1-3 A/B/C/D/E)
  const handleDescriptiveGradeChange = (studentId, code) => {
    if (isSubmitted) return;
    const isKinder = stage === 'KINDER';
    const scaleInfo = getDescriptiveScaleItem(code, isKinder);

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      return {
        ...s,
        descriptive_grade: code,
        descriptor: scaleInfo ? `${scaleInfo.descriptor} (${scaleInfo.filipino})` : code,
        final_grade: scaleInfo ? scaleInfo.numericEquivalent : s.final_grade,
        remarks: (code === 'BG' || code === 'E') ? 'Needs Support' : 'Passed'
      };
    }));
  };

  // Save PACE / Kindergarten Competencies & Narrative from Modal
  const handleSaveStudentDetails = (studentId, modalData) => {
    if (isSubmitted) return;
    const isKinder = stage === 'KINDER';
    const code = modalData.descriptive_grade || (isKinder ? 'CO' : 'B');
    const scaleInfo = getDescriptiveScaleItem(code, isKinder);

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const nextDetails = {
        ...(s.details || {}),
        ...(modalData.pace_ratings ? { pace_ratings: modalData.pace_ratings } : {}),
        ...(modalData.kinder_ratings ? { kinder_ratings: modalData.kinder_ratings } : {}),
        what_can_do: modalData.what_can_do || '',
        learning_to_improve: modalData.learning_to_improve || ''
      };

      return {
        ...s,
        descriptive_grade: code,
        descriptor: scaleInfo ? `${scaleInfo.descriptor} (${scaleInfo.filipino})` : code,
        final_grade: scaleInfo ? scaleInfo.numericEquivalent : s.final_grade,
        remarks: (code === 'BG' || code === 'E') ? 'Needs Support' : 'Passed',
        details: nextDetails
      };
    }));
  };

  // College handlers
  const handleInputChange = (id, field, value) => {
    if (isSubmitted) return;
    if (value === '') {
      return setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: '' } : s));
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num <= 100) {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: num } : s));
    }
  };

  const handleInputBlur = (id, field, value) => {
    if (isSubmitted) return;
    setStudents(prev => prev.map(s =>
      s.id === id ? { ...s, [field]: value === '' ? 0 : clampGrade(value) } : s
    ));
  };

  const effectiveGradingMode = stage === 'KINDER'
    ? 'kinder_descriptive'
    : (stage === 'G1_3' ? gradingMode : 'numerical_ecr');

  const saveAllGrades = async () => {
    if (isSubmitted) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sms_token');
      const payload = {
        class_id: parseInt(classId),
        quarter: selectedQuarter,
        students: students.map(s => buildStudentPayload(s, currentLevel, {
          gradingMode: effectiveGradingMode,
          weightProfileKey,
          transmutationMode,
          hps
        }))
      };

      const res = await axios.post(`${API_BASE_URL}/teacher/save_grades.php`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        setStatusMsg({ type: 'success', text: 'DepEd DO 015, s. 2026 grades & PACE data saved!' });
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
    if (!window.confirm('Submit and lock official grades for this term/quarter?')) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sms_token');
      const payload = {
        class_id: parseInt(classId),
        quarter: selectedQuarter,
        students: students.map(s => buildStudentPayload(s, currentLevel, {
          gradingMode: effectiveGradingMode,
          weightProfileKey,
          transmutationMode,
          hps
        }))
      };

      const res = await axios.post(`${API_BASE_URL}/teacher/submit_final_grades.php`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Official grades submitted and locked!' });
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
    if (!window.confirm('Request Registrar permission to unlock grades?')) return;
    setIsRequesting(true);
    try {
      const token = localStorage.getItem('sms_token');
      const payload = { class_id: parseInt(classId), quarter: selectedQuarter };

      const res = await axios.post(`${API_BASE_URL}/teacher/request_grade_unlock.php`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Unlock request sent to Registrar.' });
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

  // Export Official DepEd Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      exportTeacherClassRecordExcel({
        branding,
        classInfo: {
          ...classInfo,
          subject_description: displaySubject,
          section_name: displaySection,
          grade_level: displayGradeLevel,
          teacher_name: user?.full_name || user?.name || 'Subject Teacher'
        },
        students,
        selectedQuarter,
        gradingMode: effectiveGradingMode,
        weightProfileKey,
        transmutationMode,
        hps
      });
      setStatusMsg({
        type: 'success',
        text: 'Generated Official DepEd Excel Workbook (ECR, PACE Form, Term Summary & SF9)!'
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      console.error('Excel export failed:', err);
      setStatusMsg({ type: 'error', text: 'Failed to export Excel workbook.' });
    }
  };

  const handleGoBack = () => {
    navigate(fromActivities ? `/teacher/activities/${classId}` : '/teacher/classes');
  };

  // ─── COMPUTED STATS ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    return students.reduce((acc, s) => {
      if (stage === 'KINDER') {
        const code = s.descriptive_grade || 'CO';
        code === 'BG' ? acc.failed++ : acc.passed++;
        return acc;
      }
      if (stage === 'G1_3' && gradingMode === 'pace_descriptive') {
        const code = s.descriptive_grade || 'B';
        (code === 'D' || code === 'E') ? acc.failed++ : acc.passed++;
        return acc;
      }
      if (isK12) {
        const metrics = computeEcrStudentMetrics(s, hps, weightProfileKey, transmutationMode);
        metrics.termGrade >= 75 ? acc.passed++ : acc.failed++;
        return acc;
      }
      const finalGrade = calculateFinalGrade(s, currentLevel);
      const status = getGradeStatus(finalGrade, currentLevel);
      status === 'Passed' ? acc.passed++ : acc.failed++;
      return acc;
    }, { passed: 0, failed: 0 });
  }, [students, stage, gradingMode, isK12, hps, weightProfileKey, transmutationMode, currentLevel]);

  const passRate = students.length ? Math.round((stats.passed / students.length) * 100) : 0;

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return students.filter(s => {
      const matchSearch =
        !q ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.student_number || '').toLowerCase().includes(q) ||
        (s.lrn || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (filterStatus === 'All') return true;

      let isPassed = true;
      if (stage === 'KINDER') {
        isPassed = (s.descriptive_grade || 'CO') !== 'BG';
      } else if (stage === 'G1_3' && gradingMode === 'pace_descriptive') {
        const code = s.descriptive_grade || 'B';
        isPassed = code !== 'D' && code !== 'E';
      } else if (isK12) {
        const metrics = computeEcrStudentMetrics(s, hps, weightProfileKey, transmutationMode);
        isPassed = metrics.termGrade >= 75;
      } else {
        const finalGrade = calculateFinalGrade(s, currentLevel);
        isPassed = getGradeStatus(finalGrade, currentLevel) === 'Passed';
      }

      return filterStatus === 'Passed' ? isPassed : !isPassed;
    });
  }, [students, searchQuery, filterStatus, stage, gradingMode, isK12, hps, weightProfileKey, transmutationMode, currentLevel]);

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
        handleExportExcel={handleExportExcel}
        isSaving={isSaving}
        isServerOffline={isServerOffline}
        isRequesting={isRequesting}
        stage={stage}
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

      <GradeConfigBar
        stage={stage}
        isK12={isK12}
        weightProfileKey={weightProfileKey}
        setWeightProfileKey={setWeightProfileKey}
        transmutationMode={transmutationMode}
        setTransmutationMode={setTransmutationMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        gradingMode={gradingMode}
        setGradingMode={setGradingMode}
      />

      <GradeStats
        studentsLength={students.length}
        stats={stats}
        passRate={passRate}
        stage={stage}
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
        classInfo={{
          ...classInfo,
          subject_description: displaySubject,
          section_name: displaySection,
          grade_level: displayGradeLevel
        }}
        stage={stage}
        weightProfileKey={weightProfileKey}
        transmutationMode={transmutationMode}
        viewMode={viewMode}
        gradingMode={gradingMode}
        hps={hps}
        onHpsChange={handleHpsChange}
        onEcrItemChange={handleEcrItemChange}
        onDirectComponentChange={handleDirectComponentChange}
        onDescriptiveGradeChange={handleDescriptiveGradeChange}
        onSaveStudentDetails={handleSaveStudentDetails}
      />
    </div>
  );
};

export default GradeManagement;
