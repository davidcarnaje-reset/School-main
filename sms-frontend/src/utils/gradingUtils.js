// ─────────────────────────────────────────────────────────────────────────────
// gradingUtils.js
// Pure grading logic aligned with sms_db `student_grades` columns.
// ─────────────────────────────────────────────────────────────────────────────

export const getTeacherLevel = (classInfo) => {
  if (!classInfo) return 'K-12';

  if (classInfo.department) {
    if (classInfo.department === 'College') return 'College';
    if (classInfo.department === 'SHS') return 'SHS';
    if (classInfo.department === 'K-10') return 'K-12';
  }

  const category = (classInfo.level_category || '').toLowerCase();
  if (category === 'college') return 'College';
  if (category === 'shs') return 'SHS';

  const gl = (classInfo.grade_level || '').toLowerCase();
  if (gl.includes('year') || gl.includes('college')) return 'College';
  if (gl.includes('11') || gl.includes('12')) return 'SHS';

  return 'JHS';
};

/**
 * Returns grading categories matching sms_db `student_grades` columns.
 * Both K-12 and College use the same categories for input.
 */
export const getGradingCategories = (level) => {
  // Both K-12 and College use the same categories
  return [
    { key: 'written',     label: 'Written Work',   percentage: '30%', weight: 0.30 },
    { key: 'performance', label: 'Performance',    percentage: '50%', weight: 0.50 },
    { key: 'exam',        label: 'Examination',    percentage: '20%', weight: 0.20 },
  ];
};

/**
 * Computes the final grade string.
 * College → 1.0–5.0 scale | K-10/SHS → raw weighted percentage (2 dp).
 */
export const calculateFinalGrade = (student, level) => {
  const cats = getGradingCategories(level);
  const weighted = cats.reduce(
    (sum, cat) => sum + (parseFloat(student[cat.key]) || 0) * cat.weight,
    0
  );

  if (level === 'College') {
    if (weighted >= 97) return '1.00';
    if (weighted >= 94) return '1.25';
    if (weighted >= 91) return '1.50';
    if (weighted >= 88) return '1.75';
    if (weighted >= 85) return '2.00';
    if (weighted >= 82) return '2.25';
    if (weighted >= 79) return '2.50';
    if (weighted >= 76) return '2.75';
    if (weighted >= 75) return '3.00';
    return '5.00';
  }

  return weighted.toFixed(2);
};

/**
 * Returns 'Passed' | 'Failed'.
 */
export const getGradeStatus = (finalGrade, level) => {
  if (level === 'College') return parseFloat(finalGrade) <= 3.00 ? 'Passed' : 'Failed';
  return parseFloat(finalGrade) >= 75 ? 'Passed' : 'Failed';
};

/**
 * Normalises a raw API student record so all grade keys are numbers
 * and `name` / `student_number` are always present.
 */
export const normaliseStudent = (raw) => ({
  ...raw,
  id: raw.id || raw.student_id,
  name: raw.name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim(),
  student_number: raw.student_number || raw.student_id || '',
  written: parseFloat(raw.written) || 0,
  performance: parseFloat(raw.performance) || 0,
  exam: parseFloat(raw.exam) || 0,
  prelim: parseFloat(raw.prelim) || 0,
  midterm: parseFloat(raw.midterm) || 0,
  finals: parseFloat(raw.finals) || 0,
});

/**
 * Builds the payload for saving a single student.
 */
export const buildStudentPayload = (student, level) => {
  const final = calculateFinalGrade(student, level);
  const remarks = getGradeStatus(final, level);
  return {
    student_id: student.student_number || student.student_id,
    written: student.written,
    performance: student.performance,
    exam: student.exam,
    prelim: student.prelim,
    midterm: student.midterm,
    finals: student.finals,
    final_grade: parseFloat(final) || 0,
    remarks,
  };
};

/**
 * Clamps a raw input value to [0, 100].
 */
export const clampGrade = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY SCORE COMPUTATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build scores map from activity scores API response
 * @param {Array} scoresData - Array of { activity_id, student_id, score }
 * @returns {Object} - { [activity_id]: { [student_id]: score } }
 */
export const buildScoresMap = (scoresData) => {
  const map = {};
  if (!scoresData || !Array.isArray(scoresData)) return map;
  
  scoresData.forEach(score => {
    if (!map[score.activity_id]) {
      map[score.activity_id] = {};
    }
    map[score.activity_id][score.student_id] = parseFloat(score.score) || 0;
  });
  return map;
};

/**
 * Compute Written Work grade from activities
 * Formula: (Total Student Score / Total Max Score) * 100
 * @param {string} studentId - Student ID
 * @param {Array} writtenActivities - Array of written work activities
 * @param {Object} scoresMap - { [activity_id]: { [student_id]: score } }
 * @returns {number} - Computed grade (0-100)
 */
export const computeWrittenFromActivities = (studentId, writtenActivities, scoresMap) => {
  if (!writtenActivities || writtenActivities.length === 0) return 0;

  let totalScore = 0;
  let totalPossible = 0;

  writtenActivities.forEach(activity => {
    const maxScore = parseFloat(activity.max_score) || 0;
    const studentScore = parseFloat(scoresMap?.[activity.id]?.[studentId] ?? 0);
    totalScore += studentScore;
    totalPossible += maxScore;
  });

  if (totalPossible === 0) return 0;
  return parseFloat(((totalScore / totalPossible) * 100).toFixed(2));
};

/**
 * Compute Performance Task grade from activities
 * Formula: (Total Student Score / Total Max Score) * 100
 * @param {string} studentId - Student ID
 * @param {Array} performanceActivities - Array of performance activities
 * @param {Object} scoresMap - { [activity_id]: { [student_id]: score } }
 * @returns {number} - Computed grade (0-100)
 */
export const computePerformanceFromActivities = (studentId, performanceActivities, scoresMap) => {
  if (!performanceActivities || performanceActivities.length === 0) return 0;

  let totalScore = 0;
  let totalPossible = 0;

  performanceActivities.forEach(activity => {
    const maxScore = parseFloat(activity.max_score) || 0;
    const studentScore = parseFloat(scoresMap?.[activity.id]?.[studentId] ?? 0);
    totalScore += studentScore;
    totalPossible += maxScore;
  });

  if (totalPossible === 0) return 0;
  return parseFloat(((totalScore / totalPossible) * 100).toFixed(2));
};

/**
 * Compute Examination grade from exam activities
 * Formula: (Total Student Score / Total Max Score) * 100
 * @param {string} studentId - Student ID
 * @param {Array} examActivities - Array of exam activities
 * @param {Object} scoresMap - { [activity_id]: { [student_id]: score } }
 * @returns {number} - Computed grade (0-100)
 */
export const computeExamFromActivities = (studentId, examActivities, scoresMap) => {
  if (!examActivities || examActivities.length === 0) return 0;

  let totalScore = 0;
  let totalPossible = 0;

  examActivities.forEach(activity => {
    const maxScore = parseFloat(activity.max_score) || 0;
    const studentScore = parseFloat(scoresMap?.[activity.id]?.[studentId] ?? 0);
    totalScore += studentScore;
    totalPossible += maxScore;
  });

  if (totalPossible === 0) return 0;
  return parseFloat(((totalScore / totalPossible) * 100).toFixed(2));
};

/**
 * Categorize activities by type
 * @param {Array} activities - Array of all activities
 * @returns {Object} - { written: [], performance: [], exam: [] }
 */
export const categorizeActivities = (activities) => {
  const writtenCategories = ['written', 'quiz', 'assignment', 'task', 'homework'];
  const examCategories = ['exam', 'quarterly_exam', 'prelim', 'midterm', 'finals', 'test'];
  
  return {
    written: activities.filter(a => {
      const cat = (a.category || '').toLowerCase();
      return writtenCategories.includes(cat);
    }),
    performance: activities.filter(a => {
      const cat = (a.category || '').toLowerCase();
      return cat === 'performance';
    }),
    exam: activities.filter(a => {
      const cat = (a.category || '').toLowerCase();
      return examCategories.includes(cat);
    })
  };
};

/**
 * Compute all auto-grades for a student
 * @param {string} studentId - Student ID
 * @param {Array} activities - All activities
 * @param {Object} scoresMap - { [activity_id]: { [student_id]: score } }
 * @returns {Object} - { written: number, performance: number, exam: number }
 */
export const computeAllAutoGrades = (studentId, activities, scoresMap) => {
  const categorized = categorizeActivities(activities);
  
  return {
    written: computeWrittenFromActivities(studentId, categorized.written, scoresMap),
    performance: computePerformanceFromActivities(studentId, categorized.performance, scoresMap),
    exam: computeExamFromActivities(studentId, categorized.exam, scoresMap)
  };
};