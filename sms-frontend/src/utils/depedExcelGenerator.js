// ─────────────────────────────────────────────────────────────────────────────
// depedExcelGenerator.js
// Generates Official DepEd Order No. 015, s. 2026 Excel Workbooks (.xlsx)
// 1. Teacher Export:
//    - Kindergarten: INPUT DATA + KINDER DOMAIN CHECKLIST (CO/DV/BG) + KINDER SF9
//    - Grades 1-3: INPUT DATA + TERM SUMMARY + PACE FORM + SF9 - GRADE 1-3 + ECR
//    - Grade School (G4-6), JHS (G7-10), SHS (G11-12): INPUT DATA + TERM ECR + SUMMARY OF GRADES + TRANSMUTATION TABLE
// 2. Registrar Export:
//    - Student Official SF9 Report Card (.xlsx) tailored to Kinder, G1-3 (with PACE), GS, JHS, or SHS
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import {
  DO_2026_TRANSMUTATION_TABLE,
  KINDER_DESCRIPTIVE_SCALE,
  G1_TO_3_DESCRIPTIVE_SCALE,
  NUMERIC_QUALITATIVE_DESCRIPTORS,
  SUBJECT_WEIGHT_PROFILES,
  KINDER_DOMAINS_CATALOG,
  DEFAULT_ECR_HPS,
  detectSchoolStage,
  getPaceCatalogForSubject,
  computeEcrStudentMetrics,
  computeConsistentDescriptiveGrade,
  getNumericDescriptorInfo,
  getDescriptiveScaleItem
} from './gradingUtils';

const splitByGender = (students = []) => {
  const males = [];
  const females = [];
  students.forEach(s => {
    const g = String(s.gender || 'Male').toLowerCase();
    if (g.startsWith('f')) females.push(s);
    else males.push(s);
  });
  return { males, females };
};

// ─── 1. BUILD INPUT DATA SHEET (Shared across all DepEd workbooks) ───────────
const buildInputDataSheet = ({ branding, classInfo, students, stageInfo, weightProfile }) => {
  const schoolName = branding?.school_name || 'SCHOOL MANAGEMENT SYSTEM';
  const schoolId = branding?.school_id || '400001';
  const schoolYear = classInfo?.school_year || '2026-2027';
  const gradeLevel = classInfo?.grade_level || stageInfo?.shortLabel || 'Grade Level';
  const sectionName = classInfo?.section_name || classInfo?.section || 'Section A';
  const teacherName = classInfo?.teacher_name || classInfo?.adviser_name || 'Class Teacher';
  const subjectName = classInfo?.subject_description || classInfo?.subject_name || 'Learning Area';

  const { males, females } = splitByGender(students);
  const maxRows = Math.max(males.length, females.length, 30);

  const rows = [
    ['Input Data Sheet for Electronic Class Record (ECR), PACE Form, and SF9 (DepEd Order No. 015, s. 2026)'],
    [],
    ['SCHOOL INFORMATION', '', '', '', '', 'LEARNERS\' DATA'],
    ['REGION', ':', 'NCR / Region IV-A', '', '', 'No.', 'MALE LEARNERS (Last Name, First Name, M.I.)', 'LRN / ID', 'BIRTHDATE', '', 'No.', 'FEMALE LEARNERS (Last Name, First Name, M.I.)', 'LRN / ID', 'BIRTHDATE'],
    ['DIVISION', ':', 'Schools Division Office', '', ''],
    ['SCHOOL ID', ':', schoolId, '', ''],
    ['SCHOOL NAME', ':', schoolName, '', ''],
    ['SCHOOL YEAR', ':', schoolYear, '', ''],
    ['GRADE LEVEL', ':', gradeLevel, '', ''],
    ['SECTION', ':', sectionName, '', ''],
    ['TEACHER / ADVISER', ':', teacherName, '', ''],
    ['LEARNING AREA', ':', subjectName, '', ''],
    ['GRADING SYSTEM', ':', stageInfo?.label || 'DO 015, s. 2026', '', ''],
    ['WEIGHT PROFILE', ':', weightProfile?.label || 'Descriptive / Standard', '', ''],
  ];

  for (let i = 0; i < maxRows; i++) {
    const m = males[i];
    const f = females[i];
    const rowIdx = 4 + i;
    while (rows.length <= rowIdx) rows.push(['', '', '', '', '']);
    const existingLeft = rows[rowIdx].slice(0, 5);
    while (existingLeft.length < 5) existingLeft.push('');

    rows[rowIdx] = [
      ...existingLeft,
      i + 1,
      m ? m.name : '',
      m ? (m.lrn || m.student_number || '') : '',
      m ? (m.dob || '') : '',
      '',
      i + 1,
      f ? f.name : '',
      f ? (f.lrn || f.student_number || '') : '',
      f ? (f.dob || '') : ''
    ];
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 20 }, { wch: 3 }, { wch: 34 }, { wch: 4 }, { wch: 4 },
    { wch: 5 }, { wch: 32 }, { wch: 16 }, { wch: 14 }, { wch: 4 },
    { wch: 5 }, { wch: 32 }, { wch: 16 }, { wch: 14 }
  ];
  return ws;
};

// ─── 2. BUILD NUMERICAL ECR SHEET (KS2, KS3, KS4, and G1-3 Numerical) ────────
const buildNumericalEcrSheet = ({
  branding,
  classInfo,
  students,
  selectedQuarter,
  hps = DEFAULT_ECR_HPS,
  weightProfileKey = 'KS2_KS3_CORE',
  transmutationMode = 'adjusted_2026'
}) => {
  const profile = SUBJECT_WEIGHT_PROFILES[weightProfileKey] || SUBJECT_WEIGHT_PROFILES.KS2_KS3_CORE;
  const schoolName = branding?.school_name || 'SCHOOL MANAGEMENT SYSTEM';
  const schoolId = branding?.school_id || '400001';
  const schoolYear = classInfo?.school_year || '2026-2027';
  const gradeLevel = classInfo?.grade_level || 'Grade Level';
  const sectionName = classInfo?.section_name || 'Section A';
  const teacherName = classInfo?.teacher_name || 'Teacher';
  const subjectName = `${classInfo?.subject_code || ''} - ${classInfo?.subject_description || 'Subject'}`;

  const wwPct = `${Math.round(profile.ww * 100)}%`;
  const ptPct = `${Math.round(profile.pt * 100)}%`;
  const exPct = `${Math.round(profile.ex * 100)}%`;

  const wwHpsList = hps?.ww || [20, 20, 20, 20, 20];
  const ptHpsList = hps?.pt || [25, 25, 25, 25, 25];
  const exHps = hps?.ex || { st1: 30, st2: 30, te: 40 };

  const wwHpsTotal = wwHpsList.reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const ptHpsTotal = ptHpsList.reduce((a, b) => a + (parseFloat(b) || 0), 0);

  const rows = [
    ['ELECTRONIC CLASS RECORD (ECR) - DEPED ORDER NO. 015, S. 2026'],
    ['SCHOOL NAME:', schoolName, '', 'SCHOOL ID:', schoolId, '', 'SCHOOL YEAR:', schoolYear, '', 'TERM / QUARTER:', `TERM ${selectedQuarter}`],
    ['GRADE & SECTION:', `${gradeLevel} - ${sectionName}`, '', 'TEACHER:', teacherName, '', 'LEARNING AREA:', subjectName, '', 'GRADING MODE:', transmutationMode === 'zero_based' ? 'Zero-Based (DO 015 s.2026)' : 'Adjusted Transmutation (IG 70 = 75)'],
    [],
    [
      'No.',
      "LEARNERS' NAMES",
      'LRN / ID',
      `WRITTEN / ORAL WORKS (${wwPct})`, '', '', '', '', '', '', '',
      `PRODUCT / PERFORMANCE TASKS (${ptPct})`, '', '', '', '', '', '', '',
      `EXAMINATIONS (${exPct})`, '', '', '', '', '', '', '',
      'INITIAL GRADE (IG)',
      `TERM ${selectedQuarter} GRADE (TG)`,
      'QUALITATIVE DESCRIPTOR',
      'REMARKS'
    ],
    [
      '',
      '',
      '',
      'WW 1', 'WW 2', 'WW 3', 'WW 4', 'WW 5', 'TOTAL', 'PS (100)', `WS (${wwPct})`,
      'PT 1', 'PT 2', 'PT 3', 'PT 4', 'PT 5', 'TOTAL', 'PS (100)', `WS (${ptPct})`,
      'ST 1', 'ST 2', 'TE', 'WS ST1 (30%)', 'WS ST2 (30%)', 'WS TE (40%)', 'PS (ST&TE)', `WS (${exPct})`,
      '',
      '',
      '',
      ''
    ],
    [
      '',
      'HIGHEST POSSIBLE SCORE (HPS)',
      '',
      wwHpsList[0], wwHpsList[1], wwHpsList[2], wwHpsList[3], wwHpsList[4], wwHpsTotal, 100, wwPct,
      ptHpsList[0], ptHpsList[1], ptHpsList[2], ptHpsList[3], ptHpsList[4], ptHpsTotal, 100, ptPct,
      exHps.st1, exHps.st2, exHps.te, 30, 30, 40, 100, exPct,
      100,
      100,
      'Advancing',
      'Passed'
    ]
  ];

  const { males, females } = splitByGender(students);

  const pushStudentSection = (label, list) => {
    rows.push(['', label]);
    list.forEach((st, idx) => {
      const m = computeEcrStudentMetrics(st, hps, weightProfileKey, transmutationMode);
      const wwS = st.details?.ww_scores || ['', '', '', '', ''];
      const ptS = st.details?.pt_scores || ['', '', '', '', ''];
      const exS = st.details?.ex_scores || { st1: '', st2: '', te: '' };

      rows.push([
        idx + 1,
        st.name,
        st.lrn || st.student_number || '',
        wwS[0] ?? '', wwS[1] ?? '', wwS[2] ?? '', wwS[3] ?? '', wwS[4] ?? '',
        m.wwTotal || '', m.wwPS, m.wwWS,
        ptS[0] ?? '', ptS[1] ?? '', ptS[2] ?? '', ptS[3] ?? '', ptS[4] ?? '',
        m.ptTotal || '', m.ptPS, m.ptWS,
        exS.st1 ?? '', exS.st2 ?? '', exS.te ?? '',
        m.wsST1, m.wsST2, m.wsTE, m.exPS, m.exWS,
        m.initialGrade,
        m.termGrade || '',
        m.descriptor,
        m.remarks
      ]);
    });
  };

  pushStudentSection('MALE', males);
  pushStudentSection('FEMALE', females);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 }, { wch: 30 }, { wch: 15 },
    { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 8 }, { wch: 9 }, { wch: 9 },
    { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 8 }, { wch: 9 }, { wch: 9 },
    { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 10 }, { wch: 9 },
    { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 12 }
  ];
  return ws;
};

// ─── 3. BUILD SUMMARY OF GRADES SHEET (Terms 1-3 / Q1-Q4 + Final Grade) ──────
const buildSummaryOfGradesSheet = ({ branding, classInfo, students }) => {
  const schoolName = branding?.school_name || 'SCHOOL MANAGEMENT SYSTEM';
  const schoolYear = classInfo?.school_year || '2026-2027';
  const gradeLevel = classInfo?.grade_level || 'Grade Level';
  const sectionName = classInfo?.section_name || 'Section A';
  const teacherName = classInfo?.teacher_name || 'Teacher';
  const subjectName = `${classInfo?.subject_code || ''} - ${classInfo?.subject_description || 'Subject'}`;

  const rows = [
    ['SUMMARY OF TERM / QUARTERLY GRADES (DEPED ORDER NO. 015, S. 2026)'],
    ['SCHOOL NAME:', schoolName, '', 'SCHOOL YEAR:', schoolYear],
    ['GRADE & SECTION:', `${gradeLevel} - ${sectionName}`, '', 'LEARNING AREA:', subjectName, '', 'TEACHER:', teacherName],
    [],
    [
      'No.',
      "LEARNERS' NAMES",
      'LRN / ID',
      'SEX',
      'TERM 1 (Q1)',
      'TERM 2 (Q2)',
      'TERM 3 (Q3)',
      'Q4 (If 4-Quarter)',
      'FINAL GRADE (FG)',
      'DESCRIPTIVE CODE',
      'QUALITATIVE DESCRIPTOR (DO 015 s. 2026)',
      'REMARKS'
    ]
  ];

  const { males, females } = splitByGender(students);

  const pushGroup = (title, list) => {
    rows.push(['', title]);
    list.forEach((st, idx) => {
      const terms = st.all_terms || {};
      const t1 = parseFloat(terms[1]?.final_grade) || (st.selectedQuarter === 1 ? parseFloat(st.final_grade) : 0) || null;
      const t2 = parseFloat(terms[2]?.final_grade) || (st.selectedQuarter === 2 ? parseFloat(st.final_grade) : 0) || null;
      const t3 = parseFloat(terms[3]?.final_grade) || (st.selectedQuarter === 3 ? parseFloat(st.final_grade) : 0) || null;
      const t4 = parseFloat(terms[4]?.final_grade) || (st.selectedQuarter === 4 ? parseFloat(st.final_grade) : 0) || null;

      const validTerms = [t1, t2, t3, t4].filter(v => v !== null && v > 0);
      const fg = validTerms.length > 0
        ? Math.round(validTerms.reduce((a, b) => a + b, 0) / validTerms.length)
        : '';

      const descInfo = fg ? getNumericDescriptorInfo(fg) : { code: '-', descriptor: 'Incomplete', remarks: 'Incomplete' };

      rows.push([
        idx + 1,
        st.name,
        st.lrn || st.student_number || '',
        String(st.gender || 'M').charAt(0).toUpperCase(),
        t1 || '',
        t2 || '',
        t3 || '',
        t4 || '',
        fg,
        descInfo.code,
        descInfo.descriptor,
        descInfo.remarks
      ]);
    });
  };

  pushGroup('MALE', males);
  pushGroup('FEMALE', females);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 }, { wch: 32 }, { wch: 16 }, { wch: 6 },
    { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 15 },
    { wch: 16 }, { wch: 16 }, { wch: 28 }, { wch: 14 }
  ];
  return ws;
};

// ─── 4. BUILD GRADE 1-3 PACE & NARRATIVE SUMMARY SHEETS (Matches Grade 1 Excel) ─
const buildG1To3TermSummarySheet = ({ branding, classInfo, students, selectedQuarter }) => {
  const schoolName = branding?.school_name || 'SCHOOL MANAGEMENT SYSTEM';
  const schoolId = branding?.school_id || '400001';
  const schoolYear = classInfo?.school_year || '2026-2027';
  const gradeLevel = classInfo?.grade_level || 'Grade 1';
  const sectionName = classInfo?.section_name || 'Section A';
  const adviserName = classInfo?.adviser_name || classInfo?.teacher_name || 'Adviser';
  const termNames = { 1: 'FIRST TERM (UNANG TERMINO)', 2: 'SECOND TERM (IKALAWANG TERMINO)', 3: 'THIRD TERM (IKATLONG TERMINO)', 4: 'FOURTH TERM' };

  const rows = [
    ['CLASS SUMMARY - LEARNER\'S PROGRESS REPORT (DEPED ORDER NO. 015, S. 2026 - ANNEX F)'],
    ['REGION:', 'NCR / IV-A', '', 'DIVISION:', 'Schools Division Office', '', 'SCHOOL ID:', schoolId],
    ['SCHOOL NAME:', schoolName, '', 'SCHOOL YEAR:', schoolYear, '', 'ADVISER:', adviserName],
    ['TERM:', termNames[selectedQuarter] || `TERM ${selectedQuarter}`, '', 'GRADE & SECTION:', `${gradeLevel} - ${sectionName}`],
    [],
    [
      'No.',
      "LEARNERS' NAMES",
      'LRN',
      'Date of Birth',
      'Age',
      'Sex',
      'LETTER GRADE (A-E)',
      'DESCRIPTIVE LEVEL',
      'What Your Child Can Do (Mga Nagagawa)',
      'What Your Child Is Learning To Improve (Dapat Linangin)'
    ]
  ];

  const { males, females } = splitByGender(students);

  const pushGroup = (label, list) => {
    rows.push(['', label]);
    list.forEach((st, idx) => {
      const code = st.descriptive_grade || computeConsistentDescriptiveGrade(st.details?.pace_ratings, false) || 'B';
      const scaleItem = getDescriptiveScaleItem(code, false) || G1_TO_3_DESCRIPTIVE_SCALE[1];
      rows.push([
        idx + 1,
        st.name,
        st.lrn || st.student_number || '',
        st.dob || '',
        st.age || '',
        String(st.gender || 'M').charAt(0).toUpperCase(),
        scaleItem.code,
        `${scaleItem.descriptor} (${scaleItem.filipino})`,
        st.details?.what_can_do || 'Consistently demonstrates expected foundational skills and participates actively in learning tasks.',
        st.details?.learning_to_improve || 'Continue guided practice and reading activities at home.'
      ]);
    });
  };

  pushGroup('MALE', males);
  pushGroup('FEMALE', females);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 }, { wch: 32 }, { wch: 16 }, { wch: 14 }, { wch: 6 }, { wch: 6 },
    { wch: 16 }, { wch: 28 }, { wch: 50 }, { wch: 50 }
  ];
  return ws;
};

const buildPaceClassRecordSheet = ({ branding, classInfo, students, selectedQuarter }) => {
  const catalog = getPaceCatalogForSubject(classInfo);
  const allItems = [];
  catalog.domains.forEach(dom => {
    dom.items.forEach(item => {
      allItems.push({ ...item, domainTitle: dom.title });
    });
  });

  const rows = [
    [`PERFORMANCE AND COMPETENCY EVALUATION (PACE) FORM - ${catalog.title.toUpperCase()}`],
    [
      'SCHOOL NAME:', branding?.school_name || 'School Management System',
      '', 'GRADE & SECTION:', `${classInfo?.grade_level || 'Grade 1'} - ${classInfo?.section_name || 'Section A'}`,
      '', 'TERM:', `TERM ${selectedQuarter}`,
      '', 'ADVISER/TEACHER:', classInfo?.teacher_name || 'Teacher'
    ],
    [
      'LETTER GRADE & DESCRIPTOR LEGEND:',
      'A - Advancing (Namumukod-tangi)',
      'B - Benchmarking (Naipamamalas)',
      'C - Connecting (Natutungo)',
      'D - Developing (Napauunlad)',
      'E - Emerging (Nagsisimula)'
    ],
    [],
    [
      'No.',
      "LEARNERS' NAMES",
      'LRN',
      'Sex',
      'CONSISTENT RATING',
      'DESCRIPTOR',
      ...allItems.map(it => `[${it.no}] ${it.text}`)
    ]
  ];

  const { males, females } = splitByGender(students);

  const pushGroup = (label, list) => {
    rows.push(['', label]);
    list.forEach((st, idx) => {
      const ratings = st.details?.pace_ratings || {};
      const consistentCode = st.descriptive_grade || computeConsistentDescriptiveGrade(ratings, false) || 'B';
      const scaleItem = getDescriptiveScaleItem(consistentCode, false) || G1_TO_3_DESCRIPTIVE_SCALE[1];
      rows.push([
        idx + 1,
        st.name,
        st.lrn || st.student_number || '',
        String(st.gender || 'M').charAt(0).toUpperCase(),
        scaleItem.code,
        scaleItem.descriptor,
        ...allItems.map(it => ratings[it.id] || consistentCode)
      ]);
    });
  };

  pushGroup('MALE', males);
  pushGroup('FEMALE', females);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 6 }, { wch: 16 }, { wch: 18 },
    ...allItems.map(() => ({ wch: 16 }))
  ];
  return ws;
};

// ─── 5. BUILD KINDERGARTEN DOMAIN CHECKLIST SHEET (Annex E) ──────────────────
const buildKinderDomainSheet = ({ branding, classInfo, students, selectedQuarter }) => {
  const allCompetencies = [];
  KINDER_DOMAINS_CATALOG.forEach(dom => {
    dom.competencies.forEach(c => {
      allCompetencies.push({ ...c, domainTitle: dom.domainTitle });
    });
  });

  const rows = [
    ['KINDERGARTEN PROGRESS REPORT - CLASS COMPETENCY CHECKLIST (DEPED ORDER NO. 015, S. 2026 - ANNEX E)'],
    [
      'SCHOOL NAME:', branding?.school_name || 'School Management System',
      '', 'SECTION:', classInfo?.section_name || 'Kindergarten',
      '', 'TERM:', `TERM ${selectedQuarter}`,
      '', 'TEACHER:', classInfo?.teacher_name || 'Teacher'
    ],
    [
      'RATING SCALE:',
      'CO - Consistent (Palagiang Naipapakita)',
      'DV - Developing (Umuusbong)',
      'BG - Beginning (Nagsisimula)'
    ],
    [],
    [
      'No.',
      "LEARNERS' NAMES",
      'LRN',
      'Sex',
      'OVERALL RATING',
      'DESCRIPTOR',
      'TEACHER COMMENTS / REMARKS',
      ...allCompetencies.map(c => `[${c.id.toUpperCase()}] ${c.text}`)
    ]
  ];

  const { males, females } = splitByGender(students);

  const pushGroup = (label, list) => {
    rows.push(['', label]);
    list.forEach((st, idx) => {
      const ratings = st.details?.kinder_ratings || {};
      const code = st.descriptive_grade || computeConsistentDescriptiveGrade(ratings, true) || 'CO';
      const scaleItem = getDescriptiveScaleItem(code, true) || KINDER_DESCRIPTIVE_SCALE[0];
      rows.push([
        idx + 1,
        st.name,
        st.lrn || st.student_number || '',
        String(st.gender || 'M').charAt(0).toUpperCase(),
        scaleItem.code,
        `${scaleItem.descriptor} (${scaleItem.filipino})`,
        st.details?.teacher_remarks || st.details?.what_can_do || 'Actively participates in play-based and structured classroom activities.',
        ...allCompetencies.map(c => ratings[c.id] || code)
      ]);
    });
  };

  pushGroup('MALE', males);
  pushGroup('FEMALE', females);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 6 }, { wch: 14 }, { wch: 26 }, { wch: 42 },
    ...allCompetencies.map(() => ({ wch: 16 }))
  ];
  return ws;
};

// ─── 6. BUILD TRANSMUTATION REFERENCE SHEET ──────────────────────────────────
const buildTransmutationReferenceSheet = () => {
  const rows = [
    ['DEPED ORDER NO. 015, S. 2026 - ANNEX D, TABLE 4: ADJUSTED TRANSMUTATION TABLE'],
    ['Minimum Initial Grade (IG) required for a passing Transmuted Grade of 75 is 70.00.'],
    [],
    ['Initial Grade (IG) Range', 'Transmuted Grade (TG)', '', 'Numeric Grade Range', 'Qualitative Descriptor', 'Filipino Descriptor', 'Remarks'],
  ];

  DO_2026_TRANSMUTATION_TABLE.forEach((r, idx) => {
    const descRow = NUMERIC_QUALITATIVE_DESCRIPTORS[idx] || null;
    rows.push([
      `${r.min.toFixed(2)} - ${r.max.toFixed(2)}`,
      r.transmuted,
      '',
      descRow ? `${descRow.min} - ${descRow.max}` : '',
      descRow ? descRow.descriptor : '',
      descRow ? descRow.filipino : '',
      descRow ? descRow.remarks : ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 24 }, { wch: 22 }, { wch: 6 },
    { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 14 }
  ];
  return ws;
};

// ─── 7. MAIN TEACHER WORKBOOK EXPORT ─────────────────────────────────────────
export const exportTeacherClassRecordExcel = ({
  branding,
  classInfo,
  students,
  selectedQuarter = 1,
  gradingMode = 'numerical_ecr',
  weightProfileKey = 'KS2_KS3_CORE',
  transmutationMode = 'adjusted_2026',
  hps = DEFAULT_ECR_HPS
}) => {
  const wb = XLSX.utils.book_new();
  const stageInfo = detectSchoolStage(classInfo);
  const weightProfile = SUBJECT_WEIGHT_PROFILES[weightProfileKey] || SUBJECT_WEIGHT_PROFILES.KS2_KS3_CORE;

  // Sheet 1: INPUT DATA
  const inputSheet = buildInputDataSheet({ branding, classInfo, students, stageInfo, weightProfile });
  XLSX.utils.book_append_sheet(wb, inputSheet, 'INPUT DATA');

  if (stageInfo.stage === 'KINDER' || gradingMode === 'kinder_descriptive') {
    // Kinder Sheets
    const kinderChecklist = buildKinderDomainSheet({ branding, classInfo, students, selectedQuarter });
    XLSX.utils.book_append_sheet(wb, kinderChecklist, `TERM ${selectedQuarter} KINDER CHECKLIST`);

    const summarySheet = buildG1To3TermSummarySheet({ branding, classInfo, students, selectedQuarter });
    XLSX.utils.book_append_sheet(wb, summarySheet, 'KINDER SF9 SUMMARY');
  } else if (stageInfo.stage === 'G1_3' && gradingMode === 'pace_descriptive') {
    // Grade 1-3 PACE + SF9 + ECR Workbook (Matches UPDATED [Grade 1] ECR, PACE Form, and SF9.xlsx)
    const termSummarySheet = buildG1To3TermSummarySheet({ branding, classInfo, students, selectedQuarter });
    XLSX.utils.book_append_sheet(wb, termSummarySheet, `TERM ${selectedQuarter} SUMMARY`);

    const paceSheet = buildPaceClassRecordSheet({ branding, classInfo, students, selectedQuarter });
    XLSX.utils.book_append_sheet(wb, paceSheet, 'PACE - GRADE 1-3');

    const ecrSheet = buildNumericalEcrSheet({
      branding,
      classInfo,
      students,
      selectedQuarter,
      hps,
      weightProfileKey,
      transmutationMode
    });
    XLSX.utils.book_append_sheet(wb, ecrSheet, `TERM ${selectedQuarter} ECR`);

    const multiTermSheet = buildSummaryOfGradesSheet({ branding, classInfo, students });
    XLSX.utils.book_append_sheet(wb, multiTermSheet, 'TERM 1-3 SUMMARY');
  } else {
    // Grade School (G4-6), JHS (G7-10), SHS (G11-12), or G1-3 Numerical Mode
    const ecrSheet = buildNumericalEcrSheet({
      branding,
      classInfo,
      students,
      selectedQuarter,
      hps,
      weightProfileKey,
      transmutationMode
    });
    XLSX.utils.book_append_sheet(wb, ecrSheet, `TERM ${selectedQuarter} ECR`);

    const summarySheet = buildSummaryOfGradesSheet({ branding, classInfo, students });
    XLSX.utils.book_append_sheet(wb, summarySheet, 'SUMMARY OF GRADES');

    const transSheet = buildTransmutationReferenceSheet();
    XLSX.utils.book_append_sheet(wb, transSheet, 'DO 015 TRANSMUTATION');
  }

  const safeSubj = String(classInfo?.subject_code || classInfo?.subject_description || 'Class').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSec = String(classInfo?.section_name || 'Section').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `DepEd_DO015_s2026_${safeSubj}_${safeSec}_Term${selectedQuarter}.xlsx`;

  XLSX.writeFile(wb, fileName);
  return fileName;
};

// ─── 8. REGISTRAR STUDENT SF9 REPORT CARD EXCEL EXPORT ───────────────────────
export const exportStudentSF9Excel = ({
  branding,
  student,
  subjects = [],
  attendance = null,
  teacherRemarks = null
}) => {
  const wb = XLSX.utils.book_new();
  const stageInfo = detectSchoolStage(student);
  const schoolName = branding?.school_name || 'SCHOOL MANAGEMENT SYSTEM';
  const schoolYear = student?.school_year || '2026-2027';

  const defaultAttendance = attendance || [
    { term: 1, month: 'June', days: 16, present: 16, absent: 0 },
    { term: 1, month: 'July', days: 23, present: 23, absent: 0 },
    { term: 1, month: 'August', days: 19, present: 19, absent: 0 },
    { term: 1, month: 'September (T1)', days: 11, present: 11, absent: 0 },
    { term: 2, month: 'September (T2)', days: 11, present: 11, absent: 0 },
    { term: 2, month: 'October', days: 22, present: 22, absent: 0 },
    { term: 2, month: 'November', days: 19, present: 19, absent: 0 },
    { term: 2, month: 'December', days: 13, present: 13, absent: 0 },
    { term: 3, month: 'January', days: 20, present: 20, absent: 0 },
    { term: 3, month: 'February', days: 20, present: 20, absent: 0 },
    { term: 3, month: 'March', days: 21, present: 21, absent: 0 },
    { term: 3, month: 'April', days: 6, present: 6, absent: 0 },
  ];

  // Sheet 1: Official SF9 Card
  const sf9Rows = [
    ['Republic of the Philippines'],
    ['Department of Education'],
    [schoolName.toUpperCase()],
    [stageInfo.keyStage === 'KS1' ? "LEARNER'S PROGRESS REPORT CARD (SF9)" : "LEARNER'S PERFORMANCE REPORT CARD (SF9)"],
    [`Pursuant to DepEd Order No. 015, s. 2026 (${stageInfo.label})`],
    [],
    ['Learner Name:', student?.name || `${student?.last_name || ''}, ${student?.first_name || ''}`, '', 'LRN:', student?.lrn || student?.student_id || ''],
    ['Grade & Section:', `${student?.grade_level || ''} - ${student?.section_name || student?.section || ''}`, '', 'Sex / Age:', `${student?.gender || 'N/A'} / ${student?.age || 'N/A'}`],
    ['School Year:', schoolYear, '', 'Track / Program:', student?.program || 'K to 12 Basic Education'],
    ['Class Adviser:', student?.adviser_name || 'Class Adviser'],
    [],
    ['I. LEARNING PROGRESS AND ACHIEVEMENT'],
    [
      'Learning Areas / Subjects',
      'Subject Code',
      'Term 1 (Q1)',
      'Term 2 (Q2)',
      'Term 3 (Q3)',
      'Q4 (If Applicable)',
      'Final Rating',
      'Qualitative Descriptor (DO 015 s. 2026)',
      'Remarks'
    ]
  ];

  let totalFG = 0;
  let fgCount = 0;

  subjects.forEach(sub => {
    const q1 = sub.desc1 || sub.q1 || '';
    const q2 = sub.desc2 || sub.q2 || '';
    const q3 = sub.desc3 || sub.q3 || '';
    const q4 = sub.desc4 || sub.q4 || '';

    const numGrades = [sub.q1, sub.q2, sub.q3, sub.q4].map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
    const computedFG = sub.final_grade || (numGrades.length > 0 ? Math.round(numGrades.reduce((a, b) => a + b, 0) / numGrades.length) : '');

    if (computedFG && !isNaN(parseFloat(computedFG))) {
      totalFG += parseFloat(computedFG);
      fgCount++;
    }

    const descInfo = computedFG ? getNumericDescriptorInfo(computedFG) : null;
    const displayFinal = stageInfo.keyStage === 'KS1' && (sub.descriptive_final || sub.desc3 || sub.desc2 || sub.desc1)
      ? (sub.descriptive_final || sub.desc3 || sub.desc2 || sub.desc1)
      : computedFG;

    sf9Rows.push([
      sub.description || sub.code,
      sub.code || '',
      q1,
      q2,
      q3,
      q4,
      displayFinal,
      descInfo ? `${descInfo.descriptor} (${descInfo.filipino})` : (sub.descriptor || 'Consistent / Benchmarking'),
      computedFG ? (computedFG >= 75 ? 'Passed' : 'Failed') : (displayFinal ? 'Promoted' : 'In Progress')
    ]);
  });

  const ga = fgCount > 0 ? Math.round(totalFG / fgCount) : '';
  const gaDesc = ga ? getNumericDescriptorInfo(ga) : null;

  sf9Rows.push([
    'GENERAL AVERAGE',
    '',
    '',
    '',
    '',
    '',
    ga || (stageInfo.keyStage === 'KS1' ? 'Descriptive' : ''),
    gaDesc ? `${gaDesc.descriptor} (${gaDesc.filipino})` : '',
    ga ? (ga >= 75 ? 'PROMOTED' : 'FOR INTERVENTION') : 'PROMOTED'
  ]);

  sf9Rows.push(
    [],
    ['II. ATTENDANCE RECORD (THREE-TERM SCHOOL CALENDAR)'],
    ['Term', 'Month', 'No. of Class Days', 'No. of Days Present', 'No. of Times Absent']
  );

  let totDays = 0;
  let totPres = 0;
  let totAbs = 0;
  defaultAttendance.forEach(a => {
    totDays += Number(a.days || 0);
    totPres += Number(a.present || 0);
    totAbs += Number(a.absent || 0);
    sf9Rows.push([a.term, a.month, a.days, a.present, a.absent]);
  });
  sf9Rows.push(['TOTAL', '', totDays, totPres, totAbs]);

  sf9Rows.push(
    [],
    ['III. TEACHER\'S COMMENTS / NARRATIVE FEEDBACK (DO 015, S. 2026)'],
    ['Term 1 (Unang Termino):', teacherRemarks?.term1 || 'Demonstrates steady progress and active participation in classroom learning tasks.'],
    ['Term 2 (Ikalawang Termino):', teacherRemarks?.term2 || 'Consistently applies foundational skills and collaborates well with peers.'],
    ['Term 3 (Ikatlong Termino):', teacherRemarks?.term3 || 'Ready for the next grade level with commendable performance across learning areas.'],
    [],
    ['IV. PERFORMANCE DESCRIPTORS (DO 015, S. 2026)'],
    ['90 - 100 / A', 'Advancing (Namumukod-tangi)', 'Passed'],
    ['80 - 89 / B', 'Benchmarking (Naipamamalas)', 'Passed'],
    ['75 - 79 / C', 'Connecting (Natutungo)', 'Passed'],
    ['65 - 74 / D', 'Developing (Napauunlad)', 'Failed / Needs Targeted Support'],
    ['0 - 64 / E', 'Emerging (Nagsisimula)', 'Failed / Needs Intensive Support'],
    [],
    ['V. CERTIFICATE OF TRANSFER / ELIGIBILITY'],
    ['Eligible for Admission to Grade:', '', 'Approved by:', student?.adviser_name || 'Class Adviser', '', 'School Principal / Registrar']
  );

  const wsSf9 = XLSX.utils.aoa_to_sheet(sf9Rows);
  wsSf9['!cols'] = [
    { wch: 36 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 32 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSf9, 'SF9 - REPORT CARD');

  // If Kinder or Grade 1-3, also append the detailed PACE / Kinder Competency Sheet!
  if (stageInfo.stage === 'KINDER') {
    const kinderRows = [
      ['KINDERGARTEN PROGRESS REPORT - DEVELOPMENTAL DOMAINS (ANNEX E)'],
      ['Learner:', student?.name || '', 'LRN:', student?.lrn || ''],
      ['Rating Scale: BG - Beginning (Nagsisimula) | DV - Developing (Umuusbong) | CO - Consistent (Palagiang Naipapakita)'],
      [],
      ['Domain / No.', 'Competency Indicator', 'Term 1', 'Term 2', 'Term 3']
    ];
    KINDER_DOMAINS_CATALOG.forEach(dom => {
      kinderRows.push([dom.domainTitle, '', '', '', '']);
      dom.competencies.forEach(c => {
        kinderRows.push([c.no, c.text, 'CO', 'CO', 'CO']);
      });
    });
    const wsKinder = XLSX.utils.aoa_to_sheet(kinderRows);
    wsKinder['!cols'] = [{ wch: 16 }, { wch: 68 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsKinder, 'KINDER DOMAINS (ANNEX E)');
  } else if (stageInfo.stage === 'G1_3') {
    const paceRows = [
      ['PERFORMANCE AND COMPETENCY EVALUATION (PACE) FORM - ANNEX F'],
      ['Learner:', student?.name || '', 'LRN:', student?.lrn || '', 'Section:', student?.section_name || student?.section || ''],
      ['Descriptors: A - Advancing | B - Benchmarking | C - Connecting | D - Developing | E - Emerging'],
      [],
      ['Learning Area / Domain', 'Competency', 'Term 1', 'Term 2', 'Term 3']
    ];
    Object.values( getPaceCatalogForSubject ? [
      getPaceCatalogForSubject({ subject_code: 'READ' }),
      getPaceCatalogForSubject({ subject_code: 'LANG' }),
      getPaceCatalogForSubject({ subject_code: 'MATH' }),
      getPaceCatalogForSubject({ subject_code: 'GMRC' }),
      getPaceCatalogForSubject({ subject_code: 'MAKABANSA' })
    ] : []).forEach(cat => {
      paceRows.push([cat.title.toUpperCase(), '', '', '', '']);
      cat.domains.forEach(dom => {
        paceRows.push([`  ${dom.title}`, '', '', '', '']);
        dom.items.forEach(it => {
          paceRows.push([`    [${it.no}]`, it.text, 'B', 'A', 'A']);
        });
      });
    });
    const wsPace = XLSX.utils.aoa_to_sheet(paceRows);
    wsPace['!cols'] = [{ wch: 32 }, { wch: 68 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsPace, 'PACE FORM (ANNEX F)');
  }

  const safeId = String(student?.student_id || student?.lrn || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `SF9_ReportCard_${safeId}_DO015_s2026.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
};

