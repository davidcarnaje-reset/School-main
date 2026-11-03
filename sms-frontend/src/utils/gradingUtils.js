// ─────────────────────────────────────────────────────────────────────────────
// gradingUtils.js
// Complete DepEd Order No. 015, s. 2026 Grading Engine
// Supports Kindergarten (KS1), Grades 1-3 (KS1 PACE & Descriptive / Numerical),
// Grade School Grades 4-6 (KS2), JHS Grades 7-10 (KS3), SHS Grades 11-12 (KS4),
// and College.
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. DO 015, s. 2026 ADJUSTED TRANSMUTATION TABLE (Annex D, Table 4, p. 40) ─
export const DO_2026_TRANSMUTATION_TABLE = [
  { min: 99.50, max: 100.00, transmuted: 100 },
  { min: 98.32, max: 99.49,  transmuted: 99 },
  { min: 97.14, max: 98.31,  transmuted: 98 },
  { min: 95.96, max: 97.13,  transmuted: 97 },
  { min: 94.78, max: 95.95,  transmuted: 96 },
  { min: 93.60, max: 94.77,  transmuted: 95 },
  { min: 92.42, max: 93.59,  transmuted: 94 },
  { min: 91.24, max: 92.41,  transmuted: 93 },
  { min: 90.06, max: 91.23,  transmuted: 92 },
  { min: 88.88, max: 90.05,  transmuted: 91 },
  { min: 87.70, max: 88.87,  transmuted: 90 },
  { min: 86.52, max: 87.69,  transmuted: 89 },
  { min: 85.34, max: 86.51,  transmuted: 88 },
  { min: 84.16, max: 85.33,  transmuted: 87 },
  { min: 82.98, max: 84.15,  transmuted: 86 },
  { min: 81.80, max: 82.97,  transmuted: 85 },
  { min: 80.62, max: 81.79,  transmuted: 84 },
  { min: 79.44, max: 80.61,  transmuted: 83 },
  { min: 78.26, max: 79.43,  transmuted: 82 },
  { min: 77.08, max: 78.25,  transmuted: 81 },
  { min: 75.90, max: 77.07,  transmuted: 80 },
  { min: 74.72, max: 75.89,  transmuted: 79 },
  { min: 73.54, max: 74.71,  transmuted: 78 },
  { min: 72.36, max: 73.53,  transmuted: 77 },
  { min: 71.18, max: 72.35,  transmuted: 76 },
  { min: 70.00, max: 71.17,  transmuted: 75 }, // Minimum passing IG = 70.00 -> 75
  { min: 65.34, max: 69.99,  transmuted: 74 },
  { min: 60.67, max: 65.33,  transmuted: 73 },
  { min: 56.01, max: 60.66,  transmuted: 72 },
  { min: 51.34, max: 56.00,  transmuted: 71 },
  { min: 46.67, max: 51.33,  transmuted: 70 },
  { min: 42.01, max: 46.66,  transmuted: 69 },
  { min: 37.34, max: 42.00,  transmuted: 68 },
  { min: 32.68, max: 37.33,  transmuted: 67 },
  { min: 28.01, max: 32.67,  transmuted: 66 },
  { min: 23.35, max: 28.00,  transmuted: 65 },
  { min: 18.68, max: 23.34,  transmuted: 64 },
  { min: 14.01, max: 18.67,  transmuted: 63 },
  { min: 9.35,  max: 14.00,  transmuted: 62 },
  { min: 4.68,  max: 9.34,   transmuted: 61 },
  { min: 0.00,  max: 4.67,   transmuted: 60 },
];

/**
 * Converts an Initial Grade (IG) to a Term Grade (TG) per DO 015, s. 2026.
 * @param {number} initialGrade - 0 to 100
 * @param {'adjusted_2026'|'zero_based'} mode
 * @returns {number} Whole number transmuted grade (60 to 100)
 */
export const transmuteGradeDO2026 = (initialGrade, mode = 'adjusted_2026') => {
  const ig = parseFloat(initialGrade);
  if (isNaN(ig) || ig <= 0) return 0;
  const clamped = Math.min(100, Math.max(0, parseFloat(ig.toFixed(2))));

  if (mode === 'zero_based') {
    // DO 015, s. 2026 Sec. 15 & 18 (Annex D): Rounded directly without transmutation, minimum reportable grade 60
    return Math.max(60, Math.round(clamped));
  }

  for (const row of DO_2026_TRANSMUTATION_TABLE) {
    if (clamped >= row.min && clamped <= row.max) {
      return row.transmuted;
    }
  }
  return clamped >= 70 ? 75 : 60;
};

// ─── 2. DESCRIPTIVE GRADING SCALES (Tables 7, 8, 11 & Annex C) ───────────────

// Table 7: Kindergarten Descriptive Grading (KS1 - Kinder)
export const KINDER_DESCRIPTIVE_SCALE = [
  {
    code: 'CO',
    descriptor: 'Consistent',
    filipino: 'Palagiang Naipapakita',
    numericEquivalent: 95,
    color: 'emerald',
    description: 'Consistently demonstrates the expected competency; actively participates in activities; works independently; may exceed expectations in some areas'
  },
  {
    code: 'DV',
    descriptor: 'Developing',
    filipino: 'Umuusbong',
    numericEquivalent: 82,
    color: 'amber',
    description: 'Demonstrates the competency inconsistently; participates with minimal supervision; shows progress with continued practice'
  },
  {
    code: 'BG',
    descriptor: 'Beginning',
    filipino: 'Nagsisimula',
    numericEquivalent: 72,
    color: 'blue',
    description: 'Rarely demonstrates the expected competency; participates with close supervision; requires sustained guidance and support'
  }
];

// Table 8 & Annex C: Grades 1 to 3 Descriptive Grading (KS1 - Grades 1-3)
export const G1_TO_3_DESCRIPTIVE_SCALE = [
  {
    code: 'A',
    descriptor: 'Advancing',
    filipino: 'Namumukod-tangi',
    range: '90-100',
    min: 90,
    max: 100,
    numericEquivalent: 95,
    color: 'emerald',
    description: 'Consistently demonstrates advanced skills, understanding, and values beyond expectations; performs with confidence, accuracy, and independence'
  },
  {
    code: 'B',
    descriptor: 'Benchmarking',
    filipino: 'Naipamamalas',
    range: '80-89',
    min: 80,
    max: 89,
    numericEquivalent: 85,
    color: 'blue',
    description: 'Demonstrates expected skills, understanding, and values at grade level with consistency; performs tasks accurately and independently'
  },
  {
    code: 'C',
    descriptor: 'Connecting',
    filipino: 'Natutungo',
    range: '75-79',
    min: 75,
    max: 79,
    numericEquivalent: 77,
    color: 'indigo',
    description: 'Demonstrates foundational skills, understanding, and values; applies learning in familiar tasks with minimal guidance'
  },
  {
    code: 'D',
    descriptor: 'Developing',
    filipino: 'Napauunlad',
    range: '65-74',
    min: 65,
    max: 74,
    numericEquivalent: 70,
    color: 'amber',
    description: 'Demonstrates partial understanding and inconsistent application of skills and values; requires targeted support and regular practice to improve performance'
  },
  {
    code: 'E',
    descriptor: 'Emerging',
    filipino: 'Nagsisimula',
    range: '0-64',
    min: 0,
    max: 64,
    numericEquivalent: 60,
    color: 'rose',
    description: 'Beginning to demonstrate basic skills, understanding, and values; requires intensive support and close guidance'
  }
];

// Table 11: Qualitative Descriptors of Numeric Grades (KS2 to KS4)
export const NUMERIC_QUALITATIVE_DESCRIPTORS = [
  { min: 90, max: 100, code: 'A', descriptor: 'Advancing',    filipino: 'Namumukod-tangi', remarks: 'Passed', color: 'emerald' },
  { min: 80, max: 89,  code: 'B', descriptor: 'Benchmarking', filipino: 'Naipamamalas',    remarks: 'Passed', color: 'blue' },
  { min: 75, max: 79,  code: 'C', descriptor: 'Connecting',   filipino: 'Natutungo',       remarks: 'Passed', color: 'indigo' },
  { min: 65, max: 74,  code: 'D', descriptor: 'Developing',   filipino: 'Napauunlad',      remarks: 'Failed', color: 'amber' },
  { min: 0,  max: 64,  code: 'E', descriptor: 'Emerging',     filipino: 'Nagsisimula',     remarks: 'Failed', color: 'rose' },
];

export const getNumericDescriptorInfo = (grade) => {
  const num = parseFloat(grade);
  if (isNaN(num) || num <= 0) {
    return { code: '-', descriptor: 'No Grade', filipino: '', remarks: 'Pending', color: 'slate' };
  }
  const rounded = Math.round(num);
  for (const item of NUMERIC_QUALITATIVE_DESCRIPTORS) {
    if (rounded >= item.min && rounded <= item.max) {
      return item;
    }
  }
  return NUMERIC_QUALITATIVE_DESCRIPTORS[NUMERIC_QUALITATIVE_DESCRIPTORS.length - 1];
};

export const getDescriptiveScaleItem = (code, isKinder = false) => {
  const list = isKinder ? KINDER_DESCRIPTIVE_SCALE : G1_TO_3_DESCRIPTIVE_SCALE;
  return list.find(i => i.code === String(code || '').toUpperCase()) || null;
};

// ─── 3. SUBJECT GROUP WEIGHT PROFILES (Tables 9 & 10, Annex D) ───────────────
export const SUBJECT_WEIGHT_PROFILES = {
  // KS2 (Grades 4-6) & KS3 (Grades 7-10) - Table 9
  KS2_KS3_CORE: {
    id: 'KS2_KS3_CORE',
    label: 'Academic Core (Eng, Fil, Math, Sci, AP, GMRC/VE, Makabansa)',
    shortLabel: 'Academic Core (20/50/30)',
    ww: 0.20,
    pt: 0.50,
    ex: 0.30,
    hasST: true,
    st1Weight: 0.30,
    st2Weight: 0.30,
    teWeight: 0.40
  },
  KS2_KS3_SKILL: {
    id: 'KS2_KS3_SKILL',
    label: 'EPP / TLE / MAPEH (Music, Arts, PE, Health)',
    shortLabel: 'EPP / TLE / MAPEH (20/60/20)',
    ww: 0.20,
    pt: 0.60,
    ex: 0.20,
    hasST: true,
    st1Weight: 0.30,
    st2Weight: 0.30,
    teWeight: 0.40
  },

  // KS4 (Strengthened Senior High School Grades 11-12) - Table 10
  SHS_CORE_ACADEMIC: {
    id: 'SHS_CORE_ACADEMIC',
    label: 'SHS Core Subjects & Academic Electives',
    shortLabel: 'SHS Core / Academic (20/50/30)',
    ww: 0.20,
    pt: 0.50,
    ex: 0.30,
    hasST: true,
    st1Weight: 0.30,
    st2Weight: 0.30,
    teWeight: 0.40
  },
  SHS_ARTS_SPORTS: {
    id: 'SHS_ARTS_SPORTS',
    label: 'SHS Arts, Sports, & Health and Wellness Electives',
    shortLabel: 'SHS Arts/Sports/Wellness (20/60/20)',
    ww: 0.20,
    pt: 0.60,
    ex: 0.20,
    hasST: true,
    st1Weight: 0.30,
    st2Weight: 0.30,
    teWeight: 0.40
  },
  SHS_TECHPRO: {
    id: 'SHS_TECHPRO',
    label: 'SHS TechPro / TVL Electives',
    shortLabel: 'SHS TechPro (15/65/20)',
    ww: 0.15,
    pt: 0.65,
    ex: 0.20,
    hasST: true,
    st1Weight: 0.30,
    st2Weight: 0.30,
    teWeight: 0.40
  },
  SHS_FIELD_EXPOSURE: {
    id: 'SHS_FIELD_EXPOSURE',
    label: 'SHS Field Exposure, Arts Apprenticeship & Creative Production',
    shortLabel: 'SHS Field Exposure (15/70/15 TE only)',
    ww: 0.15,
    pt: 0.70,
    ex: 0.15,
    hasST: false, // Solely TE = 15%, no STs (Sec. 46.a)
    st1Weight: 0,
    st2Weight: 0,
    teWeight: 1.00
  },
  SHS_RESEARCH_DESIGN: {
    id: 'SHS_RESEARCH_DESIGN',
    label: 'SHS Research Electives & Design and Innovation',
    shortLabel: 'SHS Research & Innovation (40/60/0)',
    ww: 0.40,
    pt: 0.60,
    ex: 0.00, // No EXs component (Sec. 46.b)
    hasST: false,
    st1Weight: 0,
    st2Weight: 0,
    teWeight: 0
  },
  SHS_WORK_IMMERSION: {
    id: 'SHS_WORK_IMMERSION',
    label: 'SHS Work Immersion',
    shortLabel: 'SHS Work Immersion (20/80/0)',
    ww: 0.20,
    pt: 0.80,
    ex: 0.00, // No EXs component (Sec. 46.c)
    hasST: false,
    st1Weight: 0,
    st2Weight: 0,
    teWeight: 0
  }
};

// ─── 4. DETECT SCHOOL LEVEL & GRADING SYSTEM PROFILE ─────────────────────────
export const detectSchoolStage = (classInfoOrGradeLevel) => {
  const rawObj = typeof classInfoOrGradeLevel === 'object' && classInfoOrGradeLevel !== null
    ? classInfoOrGradeLevel
    : { grade_level: String(classInfoOrGradeLevel || '') };

  const dept = String(rawObj.department || '').toUpperCase();
  const cat = String(rawObj.level_category || '').toUpperCase();
  const gl = String(rawObj.grade_level || rawObj.level || '').toUpperCase();

  if (dept === 'COLLEGE' || cat === 'COLLEGE' || gl.includes('COLLEGE') || gl.includes('YEAR')) {
    return {
      stage: 'COLLEGE',
      keyStage: 'College',
      label: 'College System',
      shortLabel: 'College',
      defaultMode: 'college',
      termsCount: 3
    };
  }

  if (dept === 'KINDER' || gl.includes('KINDER') || gl === 'K') {
    return {
      stage: 'KINDER',
      keyStage: 'KS1',
      label: 'Kindergarten (KS1 Descriptive - CO/DV/BG)',
      shortLabel: 'Kindergarten (KS1)',
      defaultMode: 'kinder_descriptive',
      termsCount: 3
    };
  }

  const numMatch = gl.match(/\d+/);
  const gradeNum = numMatch ? parseInt(numMatch[0], 10) : null;

  if (dept === 'SHS' || cat === 'SHS' || gradeNum === 11 || gradeNum === 12) {
    return {
      stage: 'SHS',
      keyStage: 'KS4',
      gradeNum: gradeNum || 11,
      label: 'Senior High School (KS4 Strengthened SHS)',
      shortLabel: 'SHS (KS4)',
      defaultMode: 'numerical_ecr',
      termsCount: 3
    };
  }

  if (gradeNum !== null && gradeNum >= 1 && gradeNum <= 3) {
    return {
      stage: 'G1_3',
      keyStage: 'KS1',
      gradeNum,
      label: `Grade ${gradeNum} (KS1 PACE & Descriptive A-E / ECR)`,
      shortLabel: `Grade ${gradeNum} (KS1)`,
      // DO 015, s. 2026: Grade 1 uses Descriptive PACE by default; Grades 2-3 can toggle PACE or Numerical ECR
      defaultMode: gradeNum === 1 ? 'pace_descriptive' : 'pace_descriptive',
      termsCount: 3
    };
  }

  if (gradeNum !== null && gradeNum >= 4 && gradeNum <= 6) {
    return {
      stage: 'GS_4_6',
      keyStage: 'KS2',
      gradeNum,
      label: `Grade ${gradeNum} - Grade School (KS2 Numerical ECR)`,
      shortLabel: `Grade School (KS2)`,
      defaultMode: 'numerical_ecr',
      termsCount: 3
    };
  }

  return {
    stage: 'JHS_7_10',
    keyStage: 'KS3',
    gradeNum: gradeNum || 7,
    label: `Junior High School (KS3 Numerical ECR)`,
    shortLabel: `JHS (KS3)`,
    defaultMode: 'numerical_ecr',
    termsCount: 3
  };
};

/**
 * Automatically selects the DO 015, s. 2026 Subject Weight Profile from subject name/code/stage.
 */
export const detectSubjectWeightProfileKey = (classInfo) => {
  const stageInfo = detectSchoolStage(classInfo);
  const code = String(classInfo?.subject_code || '').toUpperCase();
  const desc = String(classInfo?.subject_description || classInfo?.subject_name || '').toUpperCase();
  const subType = String(classInfo?.subject_type || '').toUpperCase();
  const combined = `${code} ${desc} ${subType}`;

  if (stageInfo.stage === 'SHS') {
    if (combined.includes('IMMERSION')) return 'SHS_WORK_IMMERSION';
    if (combined.includes('RESEARCH') || combined.includes('INNOVATION') || combined.includes('DESIGN') || combined.includes('INQUIRIES') || combined.includes('CAPSTONE')) {
      return 'SHS_RESEARCH_DESIGN';
    }
    if (combined.includes('FIELD EXPOSURE') || combined.includes('APPRENTICESHIP') || combined.includes('CREATIVE PRODUCTION')) {
      return 'SHS_FIELD_EXPOSURE';
    }
    if (combined.includes('TECHPRO') || combined.includes('TVL') || combined.includes('ICT') || combined.includes('HOME ECONOMICS') || combined.includes('INDUSTRIAL') || combined.includes('AGRI')) {
      return 'SHS_TECHPRO';
    }
    if (combined.includes('ARTS') || combined.includes('SPORTS') || combined.includes('PE ') || combined.includes('PHYSICAL EDUCATION') || combined.includes('HEALTH') || combined.includes('WELLNESS')) {
      return 'SHS_ARTS_SPORTS';
    }
    return 'SHS_CORE_ACADEMIC';
  }

  // KS1 / KS2 / KS3 (Grade School & JHS)
  if (
    combined.includes('MAPEH') ||
    combined.includes('MUSIC') ||
    combined.includes('ARTS') ||
    combined.includes('PHYSICAL EDUCATION') ||
    combined.includes('HEALTH') ||
    combined.includes('EPP') ||
    combined.includes('TLE') ||
    combined.includes('TECHNOLOGY AND LIVELIHOOD') ||
    combined.includes('PANTAHANAN')
  ) {
    return 'KS2_KS3_SKILL';
  }

  return 'KS2_KS3_CORE';
};

// ─── 5. OFFICIAL COMPETENCIES CATALOG FOR KINDER (ANNEX E) & GRADES 1-3 (ANNEX F) ─

export const KINDER_DOMAINS_CATALOG = [
  {
    domainKey: 'sensory_motor',
    domainTitle: 'I. Sensory Perceptual and Motor Development',
    competencies: [
      { id: 'sm_1', no: 1, text: 'Identifies external body parts and their functions' },
      { id: 'sm_2', no: 2, text: 'Identifies ways to care for and protect the body' },
      { id: 'sm_3', no: 3, text: 'Demonstrates gross motor skills (locomotor, non-locomotor)' },
      { id: 'sm_4', no: 4, text: 'Moves body parts as directed' },
      { id: 'sm_5', no: 5, text: 'Demonstrates fine motor skills (tearing, cutting, pasting, molding with playdough)' }
    ]
  },
  {
    domainKey: 'socio_emotional',
    domainTitle: 'II. Socio-Emotional Development',
    competencies: [
      { id: 'se_1', no: 1, text: 'Identifies and expresses feelings in appropriate ways' },
      { id: 'se_2', no: 2, text: 'Recognizes and respects feelings of others' },
      { id: 'se_3', no: 3, text: 'Expresses needs and preferences' },
      { id: 'se_4', no: 4, text: 'Behaves appropriately in different situations' },
      { id: 'se_5', no: 5, text: 'Participates in classroom routines and activities' },
      { id: 'se_6', no: 6, text: 'Follows classroom and school rules' },
      { id: 'se_7', no: 7, text: 'Fulfills classroom responsibilities' }
    ]
  },
  {
    domainKey: 'cognitive',
    domainTitle: 'III. Cognitive Development',
    competencies: [
      { id: 'cg_1', no: 1, text: 'Identifies attributes of objects (color, shape, size)' },
      { id: 'cg_2', no: 2, text: 'Matches objects based on attributes' },
      { id: 'cg_3', no: 3, text: 'Describes objects based on attributes (shape, color, taste, texture)' },
      { id: 'cg_4', no: 4, text: 'Classifies objects by a single attribute (color, shape, size)' },
      { id: 'cg_5', no: 5, text: 'Arranges objects according to specific attributes' },
      { id: 'cg_6', no: 6, text: 'Recognizes, extends and creates patterns using concrete objects' },
      { id: 'cg_7', no: 7, text: 'Counts with one-to-one correspondence and recognizes numerals' },
      { id: 'cg_8', no: 8, text: 'Adds and subtracts using concrete objects' },
      { id: 'cg_9', no: 9, text: 'Shows awareness and care for the natural and physical environment' },
      { id: 'cg_10', no: 10, text: 'Predicts outcomes and suggests solutions to problems in stories read aloud' }
    ]
  },
  {
    domainKey: 'language_literacy',
    domainTitle: 'IV. Language, Literacy, and Communication Development',
    competencies: [
      { id: 'll_1', no: 1, text: 'Identifies familiar environmental sounds and recalls what happens first, middle, and end in a story' },
      { id: 'll_2', no: 2, text: 'Retells story in sequence and follows 1-2 step instructions' },
      { id: 'll_3', no: 3, text: 'Recognizes sight words and decodable words in and out of context' },
      { id: 'll_4', no: 4, text: 'Identifies first and last name, classmates, teachers, and family members' },
      { id: 'll_5', no: 5, text: 'Uses polite greetings and courteous expressions in varied situations' },
      { id: 'll_6', no: 6, text: 'Expresses ideas and feelings using phrases and simple sentences' },
      { id: 'll_7', no: 7, text: 'Identifies uppercase and lowercase letters and their corresponding sounds' },
      { id: 'll_8', no: 8, text: 'Demonstrates book handling skills and awareness of print (left to right, top to bottom)' },
      { id: 'll_9', no: 9, text: 'Traces/copies/writes name, uppercase and lowercase letters, and simple words phonetically' }
    ]
  }
];

export const PACE_G1_3_COMPETENCIES = {
  READING_LITERACY: {
    subjectKey: 'READING_LITERACY',
    title: 'Reading and Literacy',
    domains: [
      {
        title: 'Phonological Awareness (oracy for literacy)',
        items: [
          { id: 'rl_1', no: '1', text: 'Chant rhymes and poems.' },
          { id: 'rl_2', no: '2', text: 'Segment a two to three syllable word into its syllabic parts.' },
          { id: 'rl_3', no: '3', text: 'Identify rhyming words in nursery rhymes, poems, and chants.' },
          { id: 'rl_4', no: '4', text: 'Say two or three words that rhyme.' },
          { id: 'rl_5', no: '5', text: 'Identify initial sounds (vowels, consonants, and semi-vowels, if any).' }
        ]
      },
      {
        title: 'Phonics and Word Study (sounds to words)',
        items: [
          { id: 'rl_6', no: '6', text: 'Produce the sound of the letters of L1.' },
          { id: 'rl_7', no: '7', text: 'Identify the letters in L1.' },
          { id: 'rl_8', no: '8', text: 'Isolate sounds (consonants and vowels) in a word (beginning and/or ending).' },
          { id: 'rl_9', no: '9', text: 'Substitute individual sounds in simple words to make new words.' },
          { id: 'rl_10', no: '10', text: 'Sound out words accurately.' }
        ]
      },
      {
        title: 'Vocabulary and Word Knowledge (words)',
        items: [
          { id: 'rl_11', no: '11', text: 'Use vocabulary referring to self, family, school, community, and environment.' },
          { id: 'rl_12a', no: '12a', text: 'Identify words that label persons, places, things, animals, actions, situations, ideas, and emotions.' },
          { id: 'rl_12b', no: '12b', text: 'Identify words that describe persons, places, things, animals, actions, situations, ideas, and emotions.' },
          { id: 'rl_13', no: '13', text: 'Read high-frequency words accurately for meaning.' },
          { id: 'rl_14', no: '14', text: 'Read content-specific words (Math, Makabansa, and GMRC) accurately for meaning.' },
          { id: 'rl_15', no: '15', text: 'Write words legibly and correctly.' }
        ]
      },
      {
        title: 'Book and Print Knowledge',
        items: [
          { id: 'rl_16', no: '16', text: 'Recognize environmental print (symbols).' },
          { id: 'rl_17', no: '17', text: 'Recognize the parts of the book (cover page, title page, etc.).' },
          { id: 'rl_18', no: '18', text: 'Recognize proper eye movement skills in reading: left to right, top to bottom, and return sweep.' }
        ]
      },
      {
        title: 'Comprehending and Analyzing Texts (discourse)',
        items: [
          { id: 'rl_19', no: '19', text: 'Read sentences with appropriate speed, accuracy, and expression.' },
          { id: 'rl_20a', no: '20a', text: 'Comprehend stories: Note important details (character, setting, and events).' },
          { id: 'rl_20b', no: '20b', text: 'Comprehend stories: Sequence events in stories.' },
          { id: 'rl_20c', no: '20c', text: 'Comprehend stories: Infer the character’s feelings and traits.' },
          { id: 'rl_20d', no: '20d', text: 'Comprehend stories: Predict possible ending.' },
          { id: 'rl_20e', no: '20e', text: 'Comprehend stories: Relate story events to one’s experience.' },
          { id: 'rl_20f', no: '20f', text: 'Comprehend stories: Identify cause and effect of events.' },
          { id: 'rl_20g', no: '20g', text: 'Comprehend stories: Identify problem and solution in stories.' },
          { id: 'rl_21', no: '21', text: 'Comprehend informational text: Note significant details and identify problem and solution.' }
        ]
      },
      {
        title: 'Creating and Composing Texts (discourse)',
        items: [
          { id: 'rl_22', no: '22', text: 'Narrate one’s personal experiences (oneself, family, school, community).' },
          { id: 'rl_23', no: '23', text: 'Use own words in retelling myths, legends, fables, and narrative poems.' },
          { id: 'rl_24', no: '24', text: 'Express ideas about oneself, school, and community.' },
          { id: 'rl_25', no: '25', text: 'Respond creatively to texts (myths, legends, fables, and narrative poems).' }
        ]
      }
    ]
  },
  LANGUAGE: {
    subjectKey: 'LANGUAGE',
    title: 'Language / Filipino / English',
    domains: [
      {
        title: 'Language for Interacting with Others',
        items: [
          { id: 'lg_1', no: '1', text: 'Talk about one’s personal experiences (oneself, school, community).' },
          { id: 'lg_2', no: '2', text: 'Participate in classroom interactions using verbal and non-verbal responses.' },
          { id: 'lg_3', no: '3', text: 'Interact purposely and participate in conversations and discussions (make requests, offer/clarify info, seek help).' },
          { id: 'lg_4', no: '4', text: 'Use common and socially acceptable expressions (greetings, leave-taking, polite terms).' },
          { id: 'lg_5', no: '5', text: 'Share confidently thoughts, preferences, needs, feelings, and ideas with peers, teachers, and other adults.' }
        ]
      },
      {
        title: 'Language for Developing and Expressing Ideas',
        items: [
          { id: 'lg_6', no: '6', text: 'Express ideas using a variety of symbols (drawings, emojis, scribbles).' },
          { id: 'lg_7', no: '7', text: 'Use words to represent ideas and events (naming words, action words, describing words).' },
          { id: 'lg_8', no: '8', text: 'Use high-frequency and content-specific words.' },
          { id: 'lg_9', no: '9', text: 'Use language to express connections between ideas (compare/contrast, cause/effect, time words).' },
          { id: 'lg_10', no: '10', text: 'Participate in and contribute to group oral language activities (singing, chanting, sabayang bigkas).' },
          { id: 'lg_11', no: '11', text: 'Recognize how a change in intonation and body language can change the meanings of utterances.' },
          { id: 'lg_12', no: '12', text: 'Recognize how language reflects cultural practices and norms.' }
        ]
      },
      {
        title: 'Interacting with Texts & Creating Texts',
        items: [
          { id: 'lg_13', no: '13', text: 'View and listen to a range of texts for enjoyment and interest.' },
          { id: 'lg_14', no: '14', text: 'Recognize icons and symbols in various texts found in familiar contexts.' },
          { id: 'lg_15', no: '15', text: 'Engage with or respond to a range of texts (discuss what is interesting, express personal preferences).' },
          { id: 'lg_16', no: '16', text: 'Record and report ideas and events using some learnt vocabulary (note main points, sequence 3 key events).' },
          { id: 'lg_17', no: '17', text: 'Use own words in retelling information from various texts (legends, fables, jokes).' },
          { id: 'lg_18', no: '18', text: 'Draw and discuss information or ideas from a range of texts (infer feelings, predict endings).' }
        ]
      }
    ]
  },
  MATHEMATICS: {
    subjectKey: 'MATHEMATICS',
    title: 'Mathematics',
    domains: [
      {
        title: 'Term 1: Number & Algebra / Measurement & Geometry',
        items: [
          { id: 'mt_t1_1', no: 'T1.1', text: 'Count up to 100 and read/write numerals up to 100.' },
          { id: 'mt_t1_2', no: 'T1.2', text: 'Recognize and represent numbers up to 100 using concrete and pictorial models.' },
          { id: 'mt_t1_3', no: 'T1.3', text: 'Compare and order numbers up to 20 and describe ordinal positions (1st to 10th).' },
          { id: 'mt_t1_4', no: 'T1.4', text: 'Compose and decompose numbers up to 10 using concrete materials.' },
          { id: 'mt_t1_5', no: 'T1.5', text: 'Illustrate and solve addition problems with sums up to 20.' },
          { id: 'mt_t1_6', no: 'T1.6', text: 'Identify, compare, and compose simple 2-dimensional shapes (triangle, rectangle, square).' },
          { id: 'mt_t1_7', no: 'T1.7', text: 'Measure and compare length and distance using non-standard units.' }
        ]
      },
      {
        title: 'Term 2: Number & Algebra / Data & Probability',
        items: [
          { id: 'mt_t2_1', no: 'T2.1', text: 'Order numbers up to 100 and count by 2s, 5s, and 10s up to 100.' },
          { id: 'mt_t2_2', no: 'T2.2', text: 'Determine place value and value of a digit in a 2-digit number.' },
          { id: 'mt_t2_3', no: 'T2.3', text: 'Decompose and add 2-digit numbers with sums up to 100 without regrouping.' },
          { id: 'mt_t2_4', no: 'T2.4', text: 'Illustrate and solve subtraction problems involving numbers up to 20 and 2-digit numbers without regrouping.' },
          { id: 'mt_t2_5', no: 'T2.5', text: 'Collect, present, and interpret data in a pictograph without a scale.' }
        ]
      },
      {
        title: 'Term 3: Number & Algebra / Measurement & Geometry',
        items: [
          { id: 'mt_t3_1', no: 'T3.1', text: 'Determine the next term/s in a repeating pattern and create repeating patterns.' },
          { id: 'mt_t3_2', no: 'T3.2', text: 'Illustrate and compare 1/2 and 1/4 as parts of a whole; count halves and quarters.' },
          { id: 'mt_t3_3', no: 'T3.3', text: 'Recognize, compare, and solve 1-step problems involving coins and bills up to ₱100.' },
          { id: 'mt_t3_4', no: 'T3.4', text: 'Identify position of objects moved in half turn or quarter turn.' },
          { id: 'mt_t3_5', no: 'T3.5', text: 'Read and write time by the hour, half hour, and quarter hour; solve problems involving time and calendar.' }
        ]
      }
    ]
  },
  GMRC: {
    subjectKey: 'GMRC',
    title: 'Good Manners and Right Conduct (GMRC) / ESP',
    domains: [
      {
        title: 'Term 1: Nililinang na Pagpapahalaga',
        items: [
          { id: 'gm_t1_1', no: 'T1.1', text: 'Tiwala sa Sarili (Self-Confidence): Naipakikita ang tiwala sa sarili sa paggamit ng batayang impormasyon.' },
          { id: 'gm_t1_2', no: 'T1.2', text: 'Pagiging Totoo (Sincerity): Naipapakita sa mabuting pakikipag-ugnayan sa kapwa.' },
          { id: 'gm_t1_3', no: 'T1.3', text: 'Tiyaga (Perseverance): Naipakikita sa pamamagitan ng palagiang pagtatabi ng naipong pera o gamit.' },
          { id: 'gm_t1_4', no: 'T1.4', text: 'Madasalin (Prayerful): Naipakikita sa pamamagitan ng wastong kilos at salita sa pananalangin.' },
          { id: 'gm_t1_5', no: 'T1.5', text: 'Mapagpasalamat (Gratitude): Naipakikita sa pag-iingat ng mga yamang mula sa kapaligiran.' },
          { id: 'gm_t1_6', no: 'T1.6', text: 'Magalang (Respectful): Naipakikita sa pamamagitan ng mga angkop na kilos na nagbibigay-halaga sa karapatang tinatamasa.' },
          { id: 'gm_t1_7', no: 'T1.7', text: 'Kalinisan (Cleanliness): Naipakikita sa palagiang pagsunod sa mga alituntunin sa paglilinis ng katawan.' }
        ]
      },
      {
        title: 'Term 2: Nililinang na Pagpapahalaga',
        items: [
          { id: 'gm_t2_1', no: 'T2.1', text: 'Magalang (Respectful): Naipakikita sa pamamagitan ng wastong pagtugon sa mensahe ng kapwa.' },
          { id: 'gm_t2_2', no: 'T2.2', text: 'Responsable (Responsible): Naipakikita sa pakikiisa sa mga munting gawain sa pamayanan.' },
          { id: 'gm_t2_3', no: 'T2.3', text: 'Matulungin (Helpful): Naipakikita sa pagtulong sa mga gawain ng pamilya at nakatatanda.' },
          { id: 'gm_t2_4', no: 'T2.4', text: 'Kalinisan at Masunurin (Cleanliness & Obedient): Pakikibahagi sa gawain ng pangangalaga sa kapaligiran at pagtalima sa mabuting gawi.' },
          { id: 'gm_t2_5', no: 'T2.5', text: 'Mapagbigay (Generosity): Naipakikita sa kusang-loob na pagbabahagi ng anumang mayroon siya.' }
        ]
      },
      {
        title: 'Term 3: Nililinang na Pagpapahalaga',
        items: [
          { id: 'gm_t3_1', no: 'T3.1', text: 'Magalang at Kalinisan: Pagtalima sa mga tagubilin sa pook-dalanginan at pagpapanatili ng kaayusan sa kapaligiran.' },
          { id: 'gm_t3_2', no: 'T3.2', text: 'Mapagmalasakit at Mapagbigay (Compassion & Generosity): Kusang-loob na pagbabahagi at paghikayat sa kapwa.' },
          { id: 'gm_t3_3', no: 'T3.3', text: 'Mabuting Mamamayan (Good Citizenship): Nakapagsasanay sa kusang-loob na pagtulong sa gawaing pampamayanan.' },
          { id: 'gm_t3_4', no: 'T3.4', text: 'Pagmamahal sa Bayan (Love of Country): Palagiang pagsunod sa mga panuntunan para sa mga sagisag ng bayan.' }
        ]
      }
    ]
  },
  MAKABANSA: {
    subjectKey: 'MAKABANSA',
    title: 'Makabansa / Araling Panlipunan / MAPEH',
    domains: [
      {
        title: 'Term 1: Pagkilala sa Sarili at Karapatan',
        items: [
          { id: 'mk_t1_1', no: 'T1.1', text: 'Nailalarawan na ang bawat tao ay may iba’t ibang katangiang pisikal, pangangailangan, at interes at kakayahan.' },
          { id: 'mk_t1_2', no: 'T1.2', text: 'Naipapaliwanag ang karapatan at tungkulin ng bawat bata.' },
          { id: 'mk_t1_3', no: 'T1.3', text: 'Napahahalagahan ang indibidwalidad ng bawat tao.' }
        ]
      },
      {
        title: 'Term 2: Ang Aking Pamilya',
        items: [
          { id: 'mk_t2_1', no: 'T2.1', text: 'Naipaliliwanag ang konsepto ng pamilya batay sa bumubuo nito (two-parent, solo parent, extended family).' },
          { id: 'mk_t2_2', no: 'T2.2', text: 'Naipaliliwanag ang papel at tungkulin ng mga kasapi ng pamilya.' },
          { id: 'mk_t2_3', no: 'T2.3', text: 'Napahahalagahan ang papel at tungkulin ng mga kasapi ng pamilya.' }
        ]
      },
      {
        title: 'Term 3: Ang Aking Paaralan at Pamayanan',
        items: [
          { id: 'mk_t3_1', no: 'T3.1', text: 'Nailalahad ang mga batayang impormasyon tulad ng pangalan, pinagmulan, laki at lawak, kinaroroonan, at kwento ng sariling paaralan.' },
          { id: 'mk_t3_2', no: 'T3.2', text: 'Naipaliliwanag ang tungkulin ng mga taong bumubuo sa paaralan (punong guro, guro, doctor, nars, dyanitor, mag-aaral).' },
          { id: 'mk_t3_3', no: 'T3.3', text: 'Natutukoy ang kahalagahan ng mga palatandaan at estruktura mula sa tahanan patungo sa paaralan.' },
          { id: 'mk_t3_4', no: 'T3.4', text: 'Napahahalagahan ang sariling paaralan at mga kasapi ng kinabibilangang pamayanan.' }
        ]
      }
    ]
  }
};

/**
 * Matches a subject description/code to the closest Grade 1-3 PACE Learning Area catalog.
 */
export const getPaceCatalogForSubject = (classInfo) => {
  const code = String(classInfo?.subject_code || '').toUpperCase();
  const desc = String(classInfo?.subject_description || classInfo?.subject_name || '').toUpperCase();
  const text = `${code} ${desc}`;

  if (text.includes('MATH')) return PACE_G1_3_COMPETENCIES.MATHEMATICS;
  if (text.includes('GMRC') || text.includes('ESP') || text.includes('EDUKASYON SA PAGPAPAKATAO') || text.includes('VALUES') || text.includes('MANNERS')) {
    return PACE_G1_3_COMPETENCIES.GMRC;
  }
  if (text.includes('MAKABANSA') || text.includes('ARALING PANLIPUNAN') || text.includes('AP') || text.includes('MAPEH') || text.includes('MUSIC') || text.includes('ARTS')) {
    return PACE_G1_3_COMPETENCIES.MAKABANSA;
  }
  if (text.includes('READ') || text.includes('LITERACY')) {
    return PACE_G1_3_COMPETENCIES.READING_LITERACY;
  }
  if (text.includes('LANG') || text.includes('FILIPINO') || text.includes('ENGLISH') || text.includes('MOTHER TONGUE')) {
    return PACE_G1_3_COMPETENCIES.LANGUAGE;
  }
  return PACE_G1_3_COMPETENCIES.READING_LITERACY;
};

/**
 * Computes the most consistent (modal) descriptive grade from a map of competency ratings.
 * DO 015, s. 2026 Annex C: "Teachers shall look for the learner's most consistent level of performance over time."
 */
export const computeConsistentDescriptiveGrade = (ratingsMap, isKinder = false) => {
  if (!ratingsMap || typeof ratingsMap !== 'object') return '';
  const values = Object.values(ratingsMap).filter(Boolean);
  if (values.length === 0) return '';

  const counts = {};
  values.forEach(v => {
    counts[v] = (counts[v] || 0) + 1;
  });

  const order = isKinder ? ['CO', 'DV', 'BG'] : ['A', 'B', 'C', 'D', 'E'];
  let bestCode = values[0];
  let bestCount = -1;

  for (const code of order) {
    if ((counts[code] || 0) > bestCount) {
      bestCount = counts[code] || 0;
      bestCode = code;
    }
  }
  return bestCode;
};

/**
 * Generates helpful narrative remarks ("What Your Child Can Do" & "What Your Child Is Learning To Improve")
 * based on the learner's PACE / Kinder competency ratings.
 */
export const generateAutoNarrativeRemarks = (ratingsMap, competenciesCatalog, isKinder = false) => {
  if (!ratingsMap || typeof ratingsMap !== 'object') {
    return { what_can_do: '', learning_to_improve: '' };
  }

  const strongItems = [];
  const improvingItems = [];

  if (isKinder) {
    KINDER_DOMAINS_CATALOG.forEach(dom => {
      dom.competencies.forEach(c => {
        const r = ratingsMap[c.id];
        if (r === 'CO') strongItems.push(c.text.toLowerCase());
        else if (r === 'DV' || r === 'BG') improvingItems.push(c.text.toLowerCase());
      });
    });
  } else if (competenciesCatalog?.domains) {
    competenciesCatalog.domains.forEach(dom => {
      dom.items.forEach(c => {
        const r = ratingsMap[c.id];
        if (r === 'A' || r === 'B' || r === 'C') strongItems.push(c.text.replace(/\.$/, ''));
        else if (r === 'D' || r === 'E') improvingItems.push(c.text.replace(/\.$/, ''));
      });
    });
  }

  const what_can_do = strongItems.length > 0
    ? `Consistently demonstrates proficiency in key areas such as: ${strongItems.slice(0, 3).join('; ')}.`
    : 'Actively participates in classroom learning tasks and guided activities.';

  const learning_to_improve = improvingItems.length > 0
    ? `Needs continued guided practice and reinforcement in: ${improvingItems.slice(0, 3).join('; ')}.`
    : 'Continue reading and practicing enrichment activities at home to sustain growth.';

  return { what_can_do, learning_to_improve };
};

// ─── 6. NUMERICAL ECR COMPUTATION HELPERS (Annex D) ──────────────────────────

export const DEFAULT_ECR_HPS = {
  ww: [20, 20, 20, 20, 20],
  pt: [25, 25, 25, 25, 25],
  ex: { st1: 30, st2: 30, te: 40 }
};

export const createEmptyEcrDetails = (weightProfileKey = 'KS2_KS3_CORE') => ({
  mode: 'numerical_ecr',
  weight_profile: weightProfileKey,
  transmutation_mode: 'adjusted_2026',
  ww_scores: ['', '', '', '', ''],
  pt_scores: ['', '', '', '', ''],
  ex_scores: { st1: '', st2: '', te: '' },
  pace_ratings: {},
  kinder_ratings: {},
  what_can_do: '',
  learning_to_improve: '',
  teacher_remarks: '',
  attendance: {
    jun: '', jul: '', aug: '', sep1: '',
    sep2: '', oct: '', nov: '', dec: '',
    jan: '', feb: '', mar: '', apr: ''
  }
});

/**
 * Computes WW, PT, and EX Percentage Scores (PS), Weighted Scores (WS),
 * Initial Grade (IG), and Transmuted Term Grade (TG) per DO 015, s. 2026 Annex D.
 */
export const computeEcrStudentMetrics = (student, hps = DEFAULT_ECR_HPS, weightProfileKey = 'KS2_KS3_CORE', transmutationMode = 'adjusted_2026') => {
  const profile = SUBJECT_WEIGHT_PROFILES[weightProfileKey] || SUBJECT_WEIGHT_PROFILES.KS2_KS3_CORE;
  const details = student?.details || {};

  // 1. Written/Oral Works (WW)
  const wwScores = Array.isArray(details.ww_scores) ? details.ww_scores : [];
  const hasItemizedWW = wwScores.some(v => v !== '' && v !== null && v !== undefined);
  let wwTotal = 0;
  let wwHpsTotal = 0;
  if (hasItemizedWW) {
    wwScores.forEach((val, idx) => {
      const s = parseFloat(val);
      const maxS = parseFloat(hps?.ww?.[idx] ?? 20);
      if (!isNaN(s) && maxS > 0) {
        wwTotal += s;
        wwHpsTotal += maxS;
      }
    });
  }
  const wwPS = hasItemizedWW
    ? (wwHpsTotal > 0 ? parseFloat(((wwTotal / wwHpsTotal) * 100).toFixed(2)) : 0)
    : (parseFloat(student?.written) || 0);
  const wwWS = parseFloat((wwPS * profile.ww).toFixed(2));

  // 2. Product/Performance Tasks (PT)
  const ptScores = Array.isArray(details.pt_scores) ? details.pt_scores : [];
  const hasItemizedPT = ptScores.some(v => v !== '' && v !== null && v !== undefined);
  let ptTotal = 0;
  let ptHpsTotal = 0;
  if (hasItemizedPT) {
    ptScores.forEach((val, idx) => {
      const s = parseFloat(val);
      const maxS = parseFloat(hps?.pt?.[idx] ?? 25);
      if (!isNaN(s) && maxS > 0) {
        ptTotal += s;
        ptHpsTotal += maxS;
      }
    });
  }
  const ptPS = hasItemizedPT
    ? (ptHpsTotal > 0 ? parseFloat(((ptTotal / ptHpsTotal) * 100).toFixed(2)) : 0)
    : (parseFloat(student?.performance) || 0);
  const ptWS = parseFloat((ptPS * profile.pt).toFixed(2));

  // 3. Examinations (EX: ST1 30%, ST2 30%, TE 40% per Sec. 45 & Annex D Table 5/6)
  const exScores = details.ex_scores || {};
  const hasItemizedEX = (exScores.st1 !== '' && exScores.st1 !== undefined && exScores.st1 !== null) ||
                        (exScores.st2 !== '' && exScores.st2 !== undefined && exScores.st2 !== null) ||
                        (exScores.te !== '' && exScores.te !== undefined && exScores.te !== null);

  let exPS = parseFloat(student?.exam) || 0;
  let wsST1 = 0;
  let wsST2 = 0;
  let wsTE = 0;

  if (profile.ex === 0) {
    exPS = 0;
  } else if (hasItemizedEX) {
    const st1Max = parseFloat(hps?.ex?.st1 || 30);
    const st2Max = parseFloat(hps?.ex?.st2 || 30);
    const teMax = parseFloat(hps?.ex?.te || 40);

    const st1Val = parseFloat(exScores.st1) || 0;
    const st2Val = parseFloat(exScores.st2) || 0;
    const teVal = parseFloat(exScores.te) || 0;

    if (!profile.hasST) {
      // TE only (e.g., SHS Field Exposure)
      exPS = teMax > 0 ? parseFloat(((teVal / teMax) * 100).toFixed(2)) : 0;
      wsTE = exPS;
    } else {
      wsST1 = st1Max > 0 ? parseFloat(((st1Val / st1Max) * 30).toFixed(2)) : 0;
      wsST2 = st2Max > 0 ? parseFloat(((st2Val / st2Max) * 30).toFixed(2)) : 0;
      wsTE  = teMax > 0  ? parseFloat(((teVal / teMax) * 40).toFixed(2)) : 0;
      exPS  = parseFloat((wsST1 + wsST2 + wsTE).toFixed(2));
    }
  }
  const exWS = parseFloat((exPS * profile.ex).toFixed(2));

  // 4. Initial Grade (IG) & Transmuted Term Grade (TG)
  const initialGrade = parseFloat((wwWS + ptWS + exWS).toFixed(2));
  const hasAnyScore = wwPS > 0 || ptPS > 0 || exPS > 0;
  const termGrade = hasAnyScore ? transmuteGradeDO2026(initialGrade, transmutationMode) : 0;
  const descInfo = getNumericDescriptorInfo(termGrade);

  return {
    wwTotal,
    wwHpsTotal,
    wwPS,
    wwWS,
    ptTotal,
    ptHpsTotal,
    ptPS,
    ptWS,
    wsST1,
    wsST2,
    wsTE,
    exPS,
    exWS,
    initialGrade,
    termGrade,
    descriptor: descInfo.descriptor,
    descriptiveCode: descInfo.code,
    remarks: hasAnyScore ? descInfo.remarks : 'Pending'
  };
};

// ─── 7. LEGACY & COMPATIBILITY EXPORTS ──────────────────────────────────────

export const getTeacherLevel = (classInfo) => {
  if (!classInfo) return 'K-12';
  const stageInfo = detectSchoolStage(classInfo);
  if (stageInfo.stage === 'COLLEGE') return 'College';
  if (stageInfo.stage === 'SHS') return 'SHS';
  if (stageInfo.stage === 'KINDER') return 'Kinder';
  if (stageInfo.stage === 'G1_3') return 'G1-3';
  if (stageInfo.stage === 'GS_4_6') return 'GS';
  return 'JHS';
};

/**
 * Returns grading categories matching DO 015, s. 2026 component weights.
 */
export const getGradingCategories = (levelOrProfileKey = 'KS2_KS3_CORE', classInfo = null) => {
  const profileKey = SUBJECT_WEIGHT_PROFILES[levelOrProfileKey]
    ? levelOrProfileKey
    : detectSubjectWeightProfileKey(classInfo || { department: levelOrProfileKey });
  const profile = SUBJECT_WEIGHT_PROFILES[profileKey] || SUBJECT_WEIGHT_PROFILES.KS2_KS3_CORE;

  const categories = [
    {
      key: 'written',
      label: 'Written/Oral Works (WWs)',
      shortLabel: 'WWs',
      percentage: `${Math.round(profile.ww * 100)}%`,
      weight: profile.ww
    },
    {
      key: 'performance',
      label: 'Performance Tasks (PTs)',
      shortLabel: 'PTs',
      percentage: `${Math.round(profile.pt * 100)}%`,
      weight: profile.pt
    },
    {
      key: 'exam',
      label: profile.ex > 0 ? (profile.hasST ? 'Examinations (ST1+ST2+TE)' : 'Term Examination (TE)') : 'Examinations (N/A)',
      shortLabel: 'EXs',
      percentage: `${Math.round(profile.ex * 100)}%`,
      weight: profile.ex
    }
  ];
  return categories;
};

/**
 * Computes the final grade string for a student.
 */
export const calculateFinalGrade = (student, level = 'K-10', weightProfileKey = null, transmutationMode = 'adjusted_2026') => {
  if (!student) return '0';

  if (level === 'College' || level === 'COLLEGE') {
    const cats = getGradingCategories('KS2_KS3_CORE');
    const weighted = cats.reduce(
      (sum, cat) => sum + (parseFloat(student[cat.key]) || 0) * cat.weight,
      0
    );
    if (weighted <= 0) return '5.00';
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

  // If student is in Kinder or G1-3 Descriptive mode and has a descriptive grade
  if (student.descriptive_grade && (level === 'Kinder' || level === 'KINDER' || level === 'G1_3_DESC')) {
    const item = getDescriptiveScaleItem(student.descriptive_grade, level === 'Kinder' || level === 'KINDER');
    return item ? String(item.numericEquivalent) : '85';
  }

  const profileKey = weightProfileKey || student?.details?.weight_profile || 'KS2_KS3_CORE';
  const mode = transmutationMode || student?.details?.transmutation_mode || 'adjusted_2026';
  const metrics = computeEcrStudentMetrics(student, student?.details?.hps || DEFAULT_ECR_HPS, profileKey, mode);

  return String(metrics.termGrade || 0);
};

/**
 * Returns 'Passed' | 'Failed'.
 */
export const getGradeStatus = (finalGrade, level) => {
  if (level === 'College' || level === 'COLLEGE') {
    const fg = parseFloat(finalGrade);
    return fg > 0 && fg <= 3.00 ? 'Passed' : 'Failed';
  }
  if (typeof finalGrade === 'string' && ['CO', 'DV', 'BG', 'A', 'B', 'C'].includes(finalGrade.toUpperCase())) {
    return 'Passed';
  }
  return parseFloat(finalGrade) >= 75 ? 'Passed' : 'Failed';
};

/**
 * Normalises a raw API student record so all grade keys and parsed `details` are present.
 */
export const normaliseStudent = (raw, defaultProfileKey = 'KS2_KS3_CORE') => {
  let parsedDetails = createEmptyEcrDetails(defaultProfileKey);
  if (raw.details_json) {
    try {
      const obj = typeof raw.details_json === 'string' ? JSON.parse(raw.details_json) : raw.details_json;
      parsedDetails = {
        ...parsedDetails,
        ...obj,
        ex_scores: { ...parsedDetails.ex_scores, ...(obj.ex_scores || {}) },
        pace_ratings: { ...(obj.pace_ratings || {}) },
        kinder_ratings: { ...(obj.kinder_ratings || {}) },
        attendance: { ...parsedDetails.attendance, ...(obj.attendance || {}) }
      };
    } catch (e) {
      // Keep default details
    }
  }

  return {
    ...raw,
    id: raw.id || raw.student_id,
    student_id: raw.student_id || raw.id,
    name: raw.name || `${raw.last_name || ''}, ${raw.first_name || ''}`.trim(),
    student_number: raw.student_number || raw.student_id || '',
    lrn: raw.lrn || '',
    gender: raw.gender || 'Male',
    dob: raw.dob || '',
    written: parseFloat(raw.written) || 0,
    performance: parseFloat(raw.performance) || 0,
    exam: parseFloat(raw.exam) || 0,
    initial_grade: raw.initial_grade !== null && raw.initial_grade !== undefined ? parseFloat(raw.initial_grade) : 0,
    final_grade: parseFloat(raw.final_grade) || 0,
    descriptive_grade: raw.descriptive_grade || '',
    descriptor: raw.descriptor || '',
    prelim: parseFloat(raw.prelim) || 0,
    midterm: parseFloat(raw.midterm) || 0,
    finals: parseFloat(raw.finals) || 0,
    details: parsedDetails,
    all_terms: raw.all_terms || {}
  };
};

/**
 * Builds the payload for saving a single student.
 */
export const buildStudentPayload = (student, level, options = {}) => {
  const {
    gradingMode = 'numerical_ecr',
    weightProfileKey = 'KS2_KS3_CORE',
    transmutationMode = 'adjusted_2026',
    hps = DEFAULT_ECR_HPS
  } = options;

  if (gradingMode === 'kinder_descriptive') {
    const code = student.descriptive_grade || computeConsistentDescriptiveGrade(student.details?.kinder_ratings, true) || 'CO';
    const scaleItem = getDescriptiveScaleItem(code, true) || KINDER_DESCRIPTIVE_SCALE[0];
    const detailsObj = {
      ...(student.details || {}),
      mode: 'kinder_descriptive'
    };
    return {
      student_id: student.student_number || student.student_id,
      written: scaleItem.numericEquivalent,
      performance: scaleItem.numericEquivalent,
      exam: scaleItem.numericEquivalent,
      initial_grade: scaleItem.numericEquivalent,
      final_grade: scaleItem.numericEquivalent,
      descriptive_grade: scaleItem.code,
      descriptor: `${scaleItem.descriptor} (${scaleItem.filipino})`,
      remarks: 'Promoted',
      details_json: JSON.stringify(detailsObj)
    };
  }

  if (gradingMode === 'pace_descriptive') {
    const code = student.descriptive_grade || computeConsistentDescriptiveGrade(student.details?.pace_ratings, false) || 'B';
    const scaleItem = getDescriptiveScaleItem(code, false) || G1_TO_3_DESCRIPTIVE_SCALE[1];
    const detailsObj = {
      ...(student.details || {}),
      mode: 'pace_descriptive'
    };
    return {
      student_id: student.student_number || student.student_id,
      written: scaleItem.numericEquivalent,
      performance: scaleItem.numericEquivalent,
      exam: scaleItem.numericEquivalent,
      initial_grade: scaleItem.numericEquivalent,
      final_grade: scaleItem.numericEquivalent,
      descriptive_grade: scaleItem.code,
      descriptor: `${scaleItem.descriptor} (${scaleItem.filipino})`,
      remarks: scaleItem.numericEquivalent >= 75 ? 'Passed' : 'Needs Support',
      details_json: JSON.stringify(detailsObj)
    };
  }

  if (level === 'College' || level === 'COLLEGE') {
    const final = calculateFinalGrade(student, 'College');
    const remarks = getGradeStatus(final, 'College');
    return {
      student_id: student.student_number || student.student_id,
      written: student.written,
      performance: student.performance,
      exam: student.exam,
      prelim: student.prelim,
      midterm: student.midterm,
      finals: student.finals,
      initial_grade: student.written * 0.3 + student.performance * 0.5 + student.exam * 0.2,
      final_grade: parseFloat(final) || 0,
      descriptive_grade: null,
      descriptor: remarks,
      remarks,
      details_json: JSON.stringify(student.details || {})
    };
  }

  // Numerical ECR (KS2, KS3, KS4, or G1-3 Numerical)
  const metrics = computeEcrStudentMetrics(student, hps, weightProfileKey, transmutationMode);
  const detailsObj = {
    ...(student.details || {}),
    mode: 'numerical_ecr',
    weight_profile: weightProfileKey,
    transmutation_mode: transmutationMode,
    hps
  };

  return {
    student_id: student.student_number || student.student_id,
    written: metrics.wwPS,
    performance: metrics.ptPS,
    exam: metrics.exPS,
    initial_grade: metrics.initialGrade,
    final_grade: metrics.termGrade,
    descriptive_grade: metrics.descriptiveCode,
    descriptor: metrics.descriptor,
    remarks: metrics.remarks === 'Pending' ? 'N/A' : metrics.remarks,
    details_json: JSON.stringify(detailsObj)
  };
};

export const clampGrade = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY SCORE COMPUTATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

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

export const categorizeActivities = (activities) => {
  if (!Array.isArray(activities)) return { written: [], performance: [], exam: [] };
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

export const computeAllAutoGrades = (studentId, activities, scoresMap) => {
  const categorized = categorizeActivities(activities);
  
  return {
    written: computeWrittenFromActivities(studentId, categorized.written, scoresMap),
    performance: computePerformanceFromActivities(studentId, categorized.performance, scoresMap),
    exam: computeExamFromActivities(studentId, categorized.exam, scoresMap)
  };
};
