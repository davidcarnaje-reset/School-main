import React, { useState, useMemo } from 'react';
import {
  Printer, FileSpreadsheet, Lock, Unlock, Award, CheckCircle2,
  BookOpen, Calendar, UserCheck, Sparkles, Eye, Layers
} from 'lucide-react';
import {
  detectSchoolStage,
  KINDER_DESCRIPTIVE_SCALE,
  G1_TO_3_DESCRIPTIVE_SCALE,
  NUMERIC_QUALITATIVE_DESCRIPTORS,
  KINDER_DOMAINS_CATALOG,
  PACE_G1_3_COMPETENCIES,
  getNumericDescriptorInfo,
  getDescriptiveScaleItem
} from '../../utils/gradingUtils';
import { exportStudentSF9Excel } from '../../utils/depedExcelGenerator';

const DEFAULT_ATTENDANCE = [
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

const OfficialSF9Card = ({
  branding,
  student,
  subjects: propSubjects = [],
  rawGrades = [],
  onUnlockGrade = null,
  onUnlockQuarter = null,
  showUnlockControls = true,
  showRegistrarActions = true
}) => {
  const handleUnlockFn = onUnlockGrade || onUnlockQuarter;
  const allowUnlock = showUnlockControls && showRegistrarActions;

  // Normalize flat quarter grade rows (from get_student_records.php) or pre-grouped subjects (from get_form138_card.php)
  const subjects = useMemo(() => {
    const source = (propSubjects && propSubjects.length > 0) ? propSubjects : rawGrades;
    if (!Array.isArray(source) || source.length === 0) return [];

    // Check if already grouped (has q1/q2/q3 or no 'quarter' key)
    const isFlatQuarterRows = source.some(item => item.quarter !== undefined && item.q1 === undefined);
    if (!isFlatQuarterRows) return source;

    const map = {};
    source.forEach(g => {
      const key = g.class_id || g.code || g.description;
      if (!map[key]) {
        map[key] = {
          class_id: g.class_id,
          code: g.code,
          description: g.description,
          units: g.units,
          sem_grade: null,
          q1: null, q2: null, q3: null, q4: null,
          desc1: '', desc2: '', desc3: '', desc4: '',
          details1: null, details2: null, details3: null, details4: null,
          is_locked: { sem: 0, q1: 0, q2: 0, q3: 0, q4: 0 },
          remarks: { sem: '', q1: '', q2: '', q3: '', q4: '' }
        };
      }
      if (g.quarter) {
        const q = g.quarter;
        map[key][`q${q}`] = g.final_grade;
        map[key][`desc${q}`] = g.descriptive_grade || '';
        map[key][`details${q}`] = g.details_json || null;
        map[key].is_locked[`q${q}`] = g.is_locked;
        map[key].remarks[`q${q}`] = g.remarks;
      } else {
        map[key].sem_grade = g.final_grade;
        map[key].is_locked.sem = g.is_locked;
        map[key].remarks.sem = g.remarks;
      }
    });
    return Object.values(map);
  }, [propSubjects, rawGrades]);

  const stageInfo = useMemo(() => detectSchoolStage(student), [student]);

  // Allow Registrar to preview/switch card template (auto-detected from student grade level by default)
  const [selectedCardMode, setSelectedCardMode] = useState(null);
  const activeStage = selectedCardMode || stageInfo.stage; // 'KINDER', 'G1_3', 'GS_4_6', 'JHS_7_10', 'SHS', 'COLLEGE'

  // For Grade 1-3: toggle between SF9 Narrative Card, PACE Form, or Both
  const [g1ViewTab, setG1ViewTab] = useState('both'); // 'sf9' | 'pace' | 'both'
  const [activePaceArea, setActivePaceArea] = useState('READING_LITERACY');

  // Show unlocked grades toggle for Registrar preview (default true so Registrar can inspect and print card anytime)
  const [includeUnlockedInPreview, setIncludeUnlockedInPreview] = useState(true);

  // Editable Attendance & Teacher Remarks for clean SF9 card printing
  const [attendance, setAttendance] = useState(DEFAULT_ATTENDANCE);
  const [teacherRemarks, setTeacherRemarks] = useState({
    term1: 'Demonstrates active participation and steady progress in classroom learning activities.',
    term2: 'Consistently applies foundational skills and collaborates well with classmates.',
    term3: 'Shows readiness for the next grade level with commendable performance.'
  });

  // Extract saved narrative remarks / PACE ratings / Kinder ratings from subject details_json if available
  const extractedSubjectDetails = useMemo(() => {
    const narrativesByTerm = {
      1: { canDo: [], improve: [], remarks: [] },
      2: { canDo: [], improve: [], remarks: [] },
      3: { canDo: [], improve: [], remarks: [] }
    };
    const paceRatingsByTerm = { 1: {}, 2: {}, 3: {} };
    const kinderRatingsByTerm = { 1: {}, 2: {}, 3: {} };

    subjects.forEach(sub => {
      [1, 2, 3].forEach(t => {
        const rawDet = sub[`details${t}`] || sub.details_json;
        if (rawDet) {
          try {
            const parsed = typeof rawDet === 'string' ? JSON.parse(rawDet) : rawDet;
            if (parsed.what_can_do) narrativesByTerm[t].canDo.push(`${sub.code || sub.description}: ${parsed.what_can_do}`);
            if (parsed.learning_to_improve) narrativesByTerm[t].improve.push(`${sub.code || sub.description}: ${parsed.learning_to_improve}`);
            if (parsed.teacher_remarks) narrativesByTerm[t].remarks.push(parsed.teacher_remarks);
            if (parsed.pace_ratings) Object.assign(paceRatingsByTerm[t], parsed.pace_ratings);
            if (parsed.kinder_ratings) Object.assign(kinderRatingsByTerm[t], parsed.kinder_ratings);
          } catch (e) {}
        }
      });
    });

    return { narrativesByTerm, paceRatingsByTerm, kinderRatingsByTerm };
  }, [subjects]);

  // Process subjects with Final Grade, Descriptor, and Remarks
  const processedSubjects = useMemo(() => {
    return subjects.map(sub => {
      const getTermVal = (qNum) => {
        const rawVal = sub[`q${qNum}`];
        const locked = sub.is_locked?.[`q${qNum}`] == 1;
        if (!includeUnlockedInPreview && !locked) return null;
        const parsed = parseFloat(rawVal);
        return !isNaN(parsed) && parsed > 0 ? Math.round(parsed) : null;
      };

      const t1 = getTermVal(1);
      const t2 = getTermVal(2);
      const t3 = getTermVal(3);
      const t4 = getTermVal(4);

      const validTerms = [t1, t2, t3, t4].filter(v => v !== null && v > 0);
      const finalGrade = validTerms.length > 0
        ? Math.round(validTerms.reduce((a, b) => a + b, 0) / validTerms.length)
        : (sub.final_grade && parseFloat(sub.final_grade) > 0 ? Math.round(parseFloat(sub.final_grade)) : null);

      const descInfo = finalGrade ? getNumericDescriptorInfo(finalGrade) : null;

      // Descriptive code for G1-3 / Kinder
      const d1 = sub.desc1 || (t1 ? getNumericDescriptorInfo(t1).code : '');
      const d2 = sub.desc2 || (t2 ? getNumericDescriptorInfo(t2).code : '');
      const d3 = sub.desc3 || (t3 ? getNumericDescriptorInfo(t3).code : '');
      const d4 = sub.desc4 || (t4 ? getNumericDescriptorInfo(t4).code : '');
      const dFinal = sub.descriptive_final || d3 || d2 || d1 || (descInfo ? descInfo.code : '');

      return {
        ...sub,
        t1, t2, t3, t4,
        d1, d2, d3, d4,
        dFinal,
        computedFinal: finalGrade,
        descriptor: descInfo ? descInfo.descriptor : (sub.descriptor || ''),
        filipinoDescriptor: descInfo ? descInfo.filipino : '',
        computedRemarks: finalGrade ? (finalGrade >= 75 ? 'Passed' : 'Failed') : (dFinal ? 'Promoted' : '')
      };
    });
  }, [subjects, includeUnlockedInPreview]);

  const hasFourthQuarter = useMemo(
    () => processedSubjects.some(s => s.t4 !== null && s.t4 > 0),
    [processedSubjects]
  );

  // Compute General Average & DO 015, s. 2026 Academic Excellence Award
  const summaryMetrics = useMemo(() => {
    const validFGs = processedSubjects
      .map(s => s.computedFinal)
      .filter(v => v !== null && !isNaN(v) && v > 0);

    if (validFGs.length === 0) {
      return { generalAverage: '', descriptor: '', remarks: '', award: null };
    }

    // DO 015, s. 2026 Sec. 53: GA is expressed as a whole number
    const ga = Math.round(validFGs.reduce((a, b) => a + b, 0) / validFGs.length);
    const minFG = Math.min(...validFGs);
    const descInfo = getNumericDescriptorInfo(ga);

    // DO 015, s. 2026 Sec. IX.75: GA of 90 or higher, with no FG below 80 in any learning area
    let award = null;
    if (ga >= 90 && minFG >= 80 && activeStage !== 'KINDER' && activeStage !== 'G1_3') {
      award = 'Academic Excellence Award';
    }

    return {
      generalAverage: ga,
      descriptor: `${descInfo.descriptor} (${descInfo.filipino})`,
      remarks: ga >= 75 ? 'PROMOTED' : 'FOR INTERVENTION',
      award
    };
  }, [processedSubjects, activeStage]);

  const attendanceTotals = useMemo(() => {
    return attendance.reduce(
      (acc, r) => ({
        days: acc.days + (Number(r.days) || 0),
        present: acc.present + (Number(r.present) || 0),
        absent: acc.absent + (Number(r.absent) || 0),
      }),
      { days: 0, present: 0, absent: 0 }
    );
  }, [attendance]);

  const handleAttendanceChange = (idx, field, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setAttendance(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      const updated = { ...row, [field]: num };
      if (field === 'present' && num <= updated.days) {
        updated.absent = Math.max(0, updated.days - num);
      } else if (field === 'absent' && num <= updated.days) {
        updated.present = Math.max(0, updated.days - num);
      }
      return updated;
    }));
  };

  const handleExportExcel = () => {
    exportStudentSF9Excel({
      branding,
      student,
      subjects: processedSubjects.map(s => ({
        ...s,
        q1: s.t1,
        q2: s.t2,
        q3: s.t3,
        q4: s.t4,
        desc1: s.d1,
        desc2: s.d2,
        desc3: s.d3,
        desc4: s.d4,
        final_grade: s.computedFinal,
        descriptive_final: s.dFinal
      })),
      attendance,
      teacherRemarks
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── TOP ACTION & FORMAT SELECTOR BAR (Hidden on Print) ────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1 flex items-center gap-1">
            <Layers size={14} className="text-blue-600" /> SF9 Format (DO 015, s. 2026):
          </span>
          {[
            { id: 'KINDER', label: 'Kinder (Annex E: CO/DV/BG)' },
            { id: 'G1_3', label: 'Grades 1–3 (Annex F: PACE & Narrative)' },
            { id: 'GS_4_6', label: 'Grade School G4–6 (Annex G)' },
            { id: 'JHS_7_10', label: 'JHS G7–10 (Annex G)' },
            { id: 'SHS', label: 'SHS G11–12 (Annex G)' }
          ].map(mode => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setSelectedCardMode(mode.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeStage === mode.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={includeUnlockedInPreview}
              onChange={e => setIncludeUnlockedInPreview(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Show All Encoded Grades</span>
          </label>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={16} /> Export SF9 Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer size={16} /> Print Official SF9 Card
          </button>
        </div>
      </div>

      {/* ─── OFFICIAL DEPED SF9 REPORT CARD CONTAINER ──────────────────────── */}
      <div className="bg-white rounded-[2rem] print:rounded-none border border-slate-200 print:border-none shadow-sm print:shadow-none p-6 sm:p-10 print:p-0 text-slate-900">
        
        {/* OFFICIAL DEPED HEADER */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600 print:text-black">Republic of the Philippines</p>
          <p className="text-xs font-black uppercase tracking-wider text-slate-800 print:text-black">Department of Education</p>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 mt-1">
            {branding?.school_name || 'SCHOOL MANAGEMENT SYSTEM'}
          </h2>
          <p className="text-[11px] font-semibold text-slate-500 print:text-black">
            {branding?.school_address || 'Basic Education Department'}
          </p>
          <div className="mt-3 inline-block px-5 py-1 bg-slate-900 text-white print:bg-transparent print:text-black print:border print:border-black rounded-full text-xs font-black uppercase tracking-widest">
            {activeStage === 'KINDER'
              ? 'KINDERGARTEN PROGRESS REPORT (SF9)'
              : activeStage === 'G1_3'
              ? `LEARNER'S PROGRESS REPORT CARD (SF9 - ${student?.grade_level || 'GRADE 1-3'})`
              : `LEARNER'S PERFORMANCE REPORT CARD (SF9 - ${student?.grade_level || 'GRADES 4 TO 12'})`}
          </div>
          <p className="text-[10px] font-bold text-slate-500 print:text-black mt-1">
            School Year {student?.school_year || '2026-2027'} • DepEd Order No. 015, s. 2026
          </p>
        </div>

        {/* STUDENT DEMOGRAPHIC GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 p-4 bg-slate-50 print:bg-transparent rounded-2xl print:rounded-none border border-slate-200 print:border-black text-xs">
          <div className="col-span-2">
            <span className="text-[10px] font-black uppercase text-slate-400 print:text-black block">Learner's Full Name:</span>
            <span className="font-black text-sm uppercase text-slate-900">{student?.formal_name || student?.name || `${student?.last_name || ''}, ${student?.first_name || ''}`}</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 print:text-black block">LRN / Student ID:</span>
            <span className="font-mono font-black text-sm text-blue-700 print:text-black">{student?.lrn || student?.student_id}</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 print:text-black block">Sex / Age:</span>
            <span className="font-bold text-slate-800">{student?.gender || 'N/A'} {student?.age ? `• ${student.age} yrs old` : ''}</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 print:text-black block">Grade Level:</span>
            <span className="font-black text-slate-800">{student?.grade_level || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 print:text-black block">Section:</span>
            <span className="font-bold text-slate-800">{student?.section_name || student?.section || 'Section A'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] font-black uppercase text-slate-400 print:text-black block">
              {activeStage === 'SHS' ? 'Track / Strand & Adviser:' : 'Curriculum / Class Adviser:'}
            </span>
            <span className="font-bold text-slate-800">
              {student?.program || 'Revised K to 12 Curriculum'} {student?.adviser_name ? `• Adviser: ${student.adviser_name}` : ''}
            </span>
          </div>
        </div>

        {/* ===================================================================
            CASE 1: KINDERGARTEN PROGRESS REPORT (ANNEX E - CO / DV / BG)
            =================================================================== */}
        {activeStage === 'KINDER' && (
          <div className="space-y-6">
            <div className="p-3.5 bg-amber-50/70 print:bg-transparent border border-amber-200 print:border-black rounded-xl text-[11px] leading-relaxed text-slate-700 print:text-black">
              This progress report informs parents/guardians about their child's learning achievements based on the Revised Kindergarten Curriculum Guide (DO 015, s. 2026). Each competency is marked as: <b>BG – Beginning (Nagsisimula)</b>; <b>DV – Developing (Umuusbong)</b>; and <b>CO – Consistent (Palagiang Naipapakita)</b>.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
              {KINDER_DOMAINS_CATALOG.map(domain => (
                <div key={domain.domainKey} className="border border-slate-300 print:border-black rounded-xl overflow-hidden">
                  <div className="bg-slate-800 text-white print:bg-slate-200 print:text-black px-3 py-2 text-xs font-black uppercase flex justify-between items-center">
                    <span>{domain.domainTitle}</span>
                    <span className="text-[10px] tracking-widest">T1 | T2 | T3</span>
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-black uppercase border-b border-slate-300 print:border-black">
                        <th className="p-2 text-left w-8">#</th>
                        <th className="p-2 text-left">Competency</th>
                        <th className="p-2 text-center w-10 border-l border-slate-300 print:border-black">T1</th>
                        <th className="p-2 text-center w-10 border-l border-slate-300 print:border-black">T2</th>
                        <th className="p-2 text-center w-10 border-l border-slate-300 print:border-black">T3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 print:divide-black">
                      {domain.competencies.map(comp => {
                        const r1 = extractedSubjectDetails.kinderRatingsByTerm[1]?.[comp.id] || 'CO';
                        const r2 = extractedSubjectDetails.kinderRatingsByTerm[2]?.[comp.id] || 'CO';
                        const r3 = extractedSubjectDetails.kinderRatingsByTerm[3]?.[comp.id] || 'CO';
                        return (
                          <tr key={comp.id} className="hover:bg-slate-50">
                            <td className="p-2 text-center font-bold text-slate-500">{comp.no}</td>
                            <td className="p-2 font-medium text-slate-800 text-[11px]">{comp.text}</td>
                            <td className="p-2 text-center font-black border-l border-slate-200 print:border-black text-emerald-700 print:text-black">{r1}</td>
                            <td className="p-2 text-center font-black border-l border-slate-200 print:border-black text-emerald-700 print:text-black">{r2}</td>
                            <td className="p-2 text-center font-black border-l border-slate-200 print:border-black text-emerald-700 print:text-black">{r3}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* KINDER RATING LEGEND */}
            <div className="border border-slate-300 print:border-black rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-xs font-black uppercase border-b border-slate-300 print:border-black">
                Kindergarten Descriptive Rating Scale (Table 7, DO 015, s. 2026)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 print:divide-black text-xs">
                {KINDER_DESCRIPTIVE_SCALE.map(item => (
                  <div key={item.code} className="p-3">
                    <div className="font-black text-slate-900">{item.code} – {item.descriptor} ({item.filipino})</div>
                    <p className="text-[11px] text-slate-600 print:text-black mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            CASE 2: GRADES 1 TO 3 PROGRESS REPORT + PACE FORM (ANNEX F)
            =================================================================== */}
        {activeStage === 'G1_3' && (
          <div className="space-y-6">
            {/* Sub-navigation for G1-3 SF9 vs PACE Form (Hidden on print if 'both' is selected) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 print:hidden">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-950">
                <Sparkles size={16} className="text-indigo-600" />
                <span>KS1 (Grades 1–3) Official Reporting Package:</span>
              </div>
              <div className="flex gap-1.5">
                {[
                  { id: 'both', label: 'Full Package (SF9 + PACE Form)' },
                  { id: 'sf9', label: 'SF9 Narrative & Subject Summary Only' },
                  { id: 'pace', label: 'PACE Competency Form Only' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setG1ViewTab(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      g1ViewTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-indigo-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {(g1ViewTab === 'sf9' || g1ViewTab === 'both') && (
              <div className="space-y-6">
                <div className="p-3.5 bg-blue-50/60 print:bg-transparent border border-blue-200 print:border-black rounded-xl text-[11px] leading-relaxed text-slate-700 print:text-black">
                  <b>Dear Parents/Guardians:</b> This report provides a <b>descriptive account of your child's learning progress</b> for each term in accordance with DepEd Order No. 015, s. 2026 (Annex F). It highlights what your child can already do, what they are currently developing, and how they can be further supported.
                </div>

                {/* SUBJECT SUMMARY RATINGS (A - E) */}
                <div className="border border-slate-300 print:border-black rounded-xl overflow-hidden">
                  <div className="bg-slate-800 text-white print:bg-slate-200 print:text-black px-4 py-2.5 text-xs font-black uppercase flex justify-between items-center">
                    <span>Learning Areas – Descriptive Performance Summary (Table 8)</span>
                    <span className="text-[10px]">A (Advancing) • B (Benchmarking) • C (Connecting) • D (Developing) • E (Emerging)</span>
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-black uppercase border-b border-slate-300 print:border-black">
                        <th className="p-3 text-left">Learning Areas</th>
                        <th className="p-3 text-center w-20 border-l border-slate-300 print:border-black">Term 1</th>
                        <th className="p-3 text-center w-20 border-l border-slate-300 print:border-black">Term 2</th>
                        <th className="p-3 text-center w-20 border-l border-slate-300 print:border-black">Term 3</th>
                        <th className="p-3 text-center w-28 border-l border-slate-300 print:border-black">Overall Rating</th>
                        <th className="p-3 text-left border-l border-slate-300 print:border-black">Descriptor</th>
                        {showUnlockControls && onUnlockGrade && (
                          <th className="p-3 text-center w-24 border-l border-slate-300 print:hidden">Locks</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 print:divide-black">
                      {processedSubjects.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400 font-bold">No learning areas encoded yet.</td>
                        </tr>
                      ) : processedSubjects.map(sub => {
                        const scaleItem = getDescriptiveScaleItem(sub.dFinal || 'B', false) || G1_TO_3_DESCRIPTIVE_SCALE[1];
                        return (
                          <tr key={sub.class_id || sub.code} className="hover:bg-slate-50">
                            <td className="p-3 font-black text-slate-800 uppercase">
                              {sub.description || sub.code}
                              <span className="block text-[10px] font-bold text-slate-400 print:hidden">{sub.code}</span>
                            </td>
                            <td className="p-3 text-center font-black text-sm border-l border-slate-200 print:border-black">
                              {sub.d1 || '-'}
                              {sub.t1 ? <span className="block text-[9px] text-slate-400 print:hidden">({sub.t1})</span> : null}
                            </td>
                            <td className="p-3 text-center font-black text-sm border-l border-slate-200 print:border-black">
                              {sub.d2 || '-'}
                              {sub.t2 ? <span className="block text-[9px] text-slate-400 print:hidden">({sub.t2})</span> : null}
                            </td>
                            <td className="p-3 text-center font-black text-sm border-l border-slate-200 print:border-black">
                              {sub.d3 || '-'}
                              {sub.t3 ? <span className="block text-[9px] text-slate-400 print:hidden">({sub.t3})</span> : null}
                            </td>
                            <td className="p-3 text-center font-black text-base text-indigo-700 print:text-black border-l border-slate-200 print:border-black bg-indigo-50/30 print:bg-transparent">
                              {sub.dFinal || '-'}
                            </td>
                            <td className="p-3 font-bold text-slate-700 border-l border-slate-200 print:border-black">
                              {sub.dFinal ? `${scaleItem.descriptor} (${scaleItem.filipino})` : 'In Progress'}
                            </td>
                            {showUnlockControls && onUnlockGrade && (
                              <td className="p-2 text-center border-l border-slate-200 print:hidden">
                                <div className="flex justify-center gap-1">
                                  {[1, 2, 3].map(q => sub.is_locked?.[`q${q}`] == 1 ? (
                                    <button
                                      key={q}
                                      type="button"
                                      onClick={() => onUnlockGrade(sub.class_id, q)}
                                      title={`Unlock Term ${q}`}
                                      className="px-1.5 py-1 bg-amber-50 text-amber-700 hover:bg-red-500 hover:text-white rounded text-[10px] font-black border border-amber-200 transition-colors cursor-pointer"
                                    >
                                      T{q} <Lock size={10} className="inline" />
                                    </button>
                                  ) : null)}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* NARRATIVE FEEDBACK BOXES FOR TERM 1, TERM 2, TERM 3 (ANNEX F) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                  {[
                    { term: 1, title: 'TERM 1 (UNANG TERMINO)' },
                    { term: 2, title: 'TERM 2 (IKALAWANG TERMINO)' },
                    { term: 3, title: 'TERM 3 (IKATLONG TERMINO)' }
                  ].map(({ term, title }) => {
                    const savedCanDo = extractedSubjectDetails.narrativesByTerm[term]?.canDo?.join(' ') ||
                      'Consistently demonstrates expected foundational literacy, numeracy, and socio-emotional skills in classroom tasks.';
                    const savedImprove = extractedSubjectDetails.narrativesByTerm[term]?.improve?.join(' ') ||
                      'Continue guided reading and practice exercises at home to strengthen fluency and confidence.';

                    return (
                      <div key={term} className="border border-slate-300 print:border-black rounded-xl overflow-hidden flex flex-col justify-between">
                        <div className="bg-slate-800 text-white print:bg-slate-200 print:text-black px-3 py-2 text-xs font-black uppercase text-center">
                          {title}
                        </div>
                        <div className="p-3 space-y-3 flex-1 text-xs">
                          <div>
                            <div className="font-black text-emerald-800 print:text-black text-[11px] uppercase mb-1">
                              What Your Child Can Do (Mga Nagagawa):
                            </div>
                            <p className="text-[11px] text-slate-700 print:text-black bg-slate-50 print:bg-transparent p-2 rounded border border-slate-200 print:border-black min-h-[60px]">
                              {savedCanDo}
                            </p>
                          </div>
                          <div>
                            <div className="font-black text-amber-800 print:text-black text-[11px] uppercase mb-1">
                              What Your Child Is Learning To Improve (Dapat Linangin):
                            </div>
                            <p className="text-[11px] text-slate-700 print:text-black bg-slate-50 print:bg-transparent p-2 rounded border border-slate-200 print:border-black min-h-[60px]">
                              {savedImprove}
                            </p>
                          </div>
                        </div>
                        <div className="p-3 border-t border-slate-200 print:border-black text-[10px] font-bold text-slate-500 print:text-black">
                          Parent's / Guardian's Signature: _______________________
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PERFORMANCE LEVELS TABLE FOR GRADES 1-3 (TABLE 8) */}
                <div className="border border-slate-300 print:border-black rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 text-xs font-black uppercase border-b border-slate-300 print:border-black">
                    Performance Levels Used in Monitoring (Table 8, DepEd Order No. 015, s. 2026)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 print:divide-black text-[11px]">
                    {G1_TO_3_DESCRIPTIVE_SCALE.map(lvl => (
                      <div key={lvl.code} className="p-2.5">
                        <div className="font-black text-slate-900">{lvl.code} – {lvl.descriptor}</div>
                        <div className="text-[10px] font-bold text-indigo-600 print:text-black italic mb-1">({lvl.filipino})</div>
                        <p className="text-[10px] text-slate-600 print:text-black leading-snug">{lvl.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ATTACHED PACE FORM (PERFORMANCE AND COMPETENCY EVALUATION FORM) */}
            {(g1ViewTab === 'pace' || g1ViewTab === 'both') && (
              <div className="border-2 border-slate-800 print:border-black rounded-2xl overflow-hidden mt-6 print:break-before-page">
                <div className="bg-slate-900 text-white print:bg-slate-200 print:text-black p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      PERFORMANCE AND COMPETENCY EVALUATION (PACE) FORM (ANNEX F)
                    </h3>
                    <p className="text-[11px] opacity-80">
                      Detailed record of learner's progress across specific learning competencies (A - Advancing | B - Benchmarking | C - Connecting | D - Developing | E - Emerging)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 print:hidden">
                    {Object.values(PACE_G1_3_COMPETENCIES).map(area => (
                      <button
                        key={area.subjectKey}
                        type="button"
                        onClick={() => setActivePaceArea(area.subjectKey)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          activePaceArea === area.subjectKey
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {area.title.split(' / ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const currentArea = PACE_G1_3_COMPETENCIES[activePaceArea] || PACE_G1_3_COMPETENCIES.READING_LITERACY;
                  return (
                    <div className="p-4">
                      <div className="font-black text-xs uppercase text-indigo-700 print:text-black mb-2">
                        Learning Area: {currentArea.title}
                      </div>
                      <table className="w-full text-xs border-collapse border border-slate-300 print:border-black">
                        <thead>
                          <tr className="bg-slate-100 text-[10px] font-black uppercase">
                            <th className="p-2 border border-slate-300 print:border-black w-14 text-center">No.</th>
                            <th className="p-2 border border-slate-300 print:border-black text-left">Learning Competencies</th>
                            <th className="p-2 border border-slate-300 print:border-black w-14 text-center">T1</th>
                            <th className="p-2 border border-slate-300 print:border-black w-14 text-center">T2</th>
                            <th className="p-2 border border-slate-300 print:border-black w-14 text-center">T3</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentArea.domains.map((dom, dIdx) => (
                            <React.Fragment key={dIdx}>
                              <tr className="bg-slate-200/70 print:bg-slate-100 font-black text-[11px]">
                                <td colSpan={5} className="p-2 border border-slate-300 print:border-black text-slate-800">
                                  {dom.title}
                                </td>
                              </tr>
                              {dom.items.map(item => {
                                const r1 = extractedSubjectDetails.paceRatingsByTerm[1]?.[item.id] || 'B';
                                const r2 = extractedSubjectDetails.paceRatingsByTerm[2]?.[item.id] || 'B';
                                const r3 = extractedSubjectDetails.paceRatingsByTerm[3]?.[item.id] || 'A';
                                return (
                                  <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="p-2 border border-slate-200 print:border-black text-center font-bold text-slate-500">{item.no}</td>
                                    <td className="p-2 border border-slate-200 print:border-black text-[11px] font-medium text-slate-800">{item.text}</td>
                                    <td className="p-2 border border-slate-200 print:border-black text-center font-black text-indigo-700 print:text-black">{r1}</td>
                                    <td className="p-2 border border-slate-200 print:border-black text-center font-black text-indigo-700 print:text-black">{r2}</td>
                                    <td className="p-2 border border-slate-200 print:border-black text-center font-black text-indigo-700 print:text-black">{r3}</td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            CASE 3: GRADES 4-6 (GS), JHS (G7-10), SHS (G11-12) PERFORMANCE REPORT (ANNEX G)
            =================================================================== */}
        {['GS_4_6', 'JHS_7_10', 'SHS', 'COLLEGE'].includes(activeStage) && (
          <div className="space-y-6">
            {summaryMetrics.award && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs font-black text-amber-900 print:border-black">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-amber-600" />
                  <span>DO 015, s. 2026 Qualification: {summaryMetrics.award} (General Average ≥ 90 with no Final Grade below 80)</span>
                </div>
                <span className="px-3 py-1 bg-amber-200/70 rounded-full text-[10px] uppercase tracking-widest">
                  GA: {summaryMetrics.generalAverage}
                </span>
              </div>
            )}

            {/* LEARNING PROGRESS AND ACHIEVEMENT TABLE (ANNEX G) */}
            <div className="border border-slate-300 print:border-black rounded-xl overflow-hidden">
              <div className="bg-slate-900 text-white print:bg-slate-200 print:text-black px-4 py-2.5 text-xs font-black uppercase flex justify-between items-center">
                <span>LEARNING PROGRESS AND ACHIEVEMENT ({activeStage === 'SHS' ? 'Strengthened SHS - Key Stage 4' : activeStage === 'GS_4_6' ? 'Grade School - Key Stage 2' : 'Junior High School - Key Stage 3'})</span>
                <span className="text-[10px] opacity-80">Three-Term School Calendar (DO 015, s. 2026)</span>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase border-b border-slate-300 print:border-black">
                    <th rowSpan={2} className="p-3 text-left border-r border-slate-300 print:border-black">
                      {activeStage === 'SHS' ? 'Subjects (Core & Electives)' : 'Learning Areas'}
                    </th>
                    <th colSpan={hasFourthQuarter ? 4 : 3} className="p-2 text-center border-b border-r border-slate-300 print:border-black">
                      Term / Quarter
                    </th>
                    <th rowSpan={2} className="p-3 text-center w-24 border-r border-slate-300 print:border-black">
                      Final Grade
                    </th>
                    <th rowSpan={2} className="p-3 text-center w-36 border-r border-slate-300 print:border-black">
                      Qualitative Descriptor
                    </th>
                    <th rowSpan={2} className="p-3 text-center w-24 border-r border-slate-300 print:border-black">
                      Remarks
                    </th>
                    {allowUnlock && handleUnlockFn && (
                      <th rowSpan={2} className="p-3 text-center w-28 print:hidden">
                        Registrar Unlock
                      </th>
                    )}
                  </tr>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase border-b border-slate-300 print:border-black">
                    <th className="p-2 text-center w-14 border-r border-slate-300 print:border-black">1</th>
                    <th className="p-2 text-center w-14 border-r border-slate-300 print:border-black">2</th>
                    <th className="p-2 text-center w-14 border-r border-slate-300 print:border-black">3</th>
                    {hasFourthQuarter && (
                      <th className="p-2 text-center w-14 border-r border-slate-300 print:border-black">4</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 print:divide-black">
                  {processedSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={hasFourthQuarter ? 9 : 8} className="p-8 text-center text-slate-400 font-bold">
                        No enrolled subjects found for this student.
                      </td>
                    </tr>
                  ) : processedSubjects.map(sub => {
                    const failed = sub.computedFinal !== null && sub.computedFinal < 75;
                    return (
                      <tr key={sub.class_id || sub.code} className="hover:bg-slate-50">
                        <td className="p-3 border-r border-slate-200 print:border-black">
                          <div className="font-black text-slate-800 uppercase">{sub.description || sub.code}</div>
                          <div className="text-[10px] font-bold text-slate-400 print:hidden flex items-center gap-2 mt-0.5">
                            <span>{sub.code}</span>
                            {sub.subject_type && sub.subject_type !== 'None' && (
                              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">{sub.subject_type}</span>
                            )}
                          </div>
                        </td>
                        <td className={`p-2.5 text-center font-black border-r border-slate-200 print:border-black ${sub.t1 && sub.t1 < 75 ? 'text-red-600' : 'text-slate-800'}`}>
                          {sub.t1 ?? '-'}
                        </td>
                        <td className={`p-2.5 text-center font-black border-r border-slate-200 print:border-black ${sub.t2 && sub.t2 < 75 ? 'text-red-600' : 'text-slate-800'}`}>
                          {sub.t2 ?? '-'}
                        </td>
                        <td className={`p-2.5 text-center font-black border-r border-slate-200 print:border-black ${sub.t3 && sub.t3 < 75 ? 'text-red-600' : 'text-slate-800'}`}>
                          {sub.t3 ?? '-'}
                        </td>
                        {hasFourthQuarter && (
                          <td className={`p-2.5 text-center font-black border-r border-slate-200 print:border-black ${sub.t4 && sub.t4 < 75 ? 'text-red-600' : 'text-slate-800'}`}>
                            {sub.t4 ?? '-'}
                          </td>
                        )}
                        <td className={`p-2.5 text-center font-black text-sm border-r border-slate-200 print:border-black bg-blue-50/30 print:bg-transparent ${failed ? 'text-red-600' : 'text-blue-900 print:text-black'}`}>
                          {sub.computedFinal ?? '-'}
                        </td>
                        <td className="p-2.5 text-center font-bold text-[11px] text-slate-700 border-r border-slate-200 print:border-black">
                          {sub.descriptor || '-'}
                        </td>
                        <td className="p-2.5 text-center border-r border-slate-200 print:border-black">
                          {sub.computedRemarks ? (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              sub.computedRemarks === 'Failed'
                                ? 'bg-red-100 text-red-700 print:bg-transparent print:text-black'
                                : 'bg-emerald-100 text-emerald-800 print:bg-transparent print:text-black'
                            }`}>
                              {sub.computedRemarks}
                            </span>
                          ) : '-'}
                        </td>
                        {allowUnlock && handleUnlockFn && (
                          <td className="p-2 text-center print:hidden">
                            <div className="flex flex-wrap justify-center gap-1">
                              {[1, 2, 3, 4].map(q => sub.is_locked?.[`q${q}`] == 1 ? (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => handleUnlockFn(sub.class_id, q)}
                                  title={`Unlock Term/Q${q}`}
                                  className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-black border border-slate-200 transition-all cursor-pointer flex items-center gap-0.5"
                                >
                                  T{q} <Lock size={10} />
                                </button>
                              ) : null)}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot className="bg-slate-100 print:bg-transparent font-black border-t-2 border-slate-300 print:border-black">
                  <tr>
                    <td colSpan={hasFourthQuarter ? 5 : 4} className="p-3 text-right uppercase tracking-wider text-xs border-r border-slate-300 print:border-black">
                      General Average
                    </td>
                    <td className="p-3 text-center text-base text-blue-700 print:text-black border-r border-slate-300 print:border-black">
                      {summaryMetrics.generalAverage || '-'}
                    </td>
                    <td className="p-3 text-center text-xs text-slate-700 print:text-black border-r border-slate-300 print:border-black">
                      {summaryMetrics.descriptor || '-'}
                    </td>
                    <td className="p-3 text-center text-xs text-emerald-700 print:text-black border-r border-slate-300 print:border-black">
                      {summaryMetrics.remarks || '-'}
                    </td>
                    {allowUnlock && handleUnlockFn && <td className="print:hidden" />}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* PERFORMANCE DESCRIPTORS SCALE (ANNEX G & TABLE 11) */}
            <div className="border border-slate-300 print:border-black rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-[11px] font-black uppercase border-b border-slate-300 print:border-black">
                Performance Descriptors (DepEd Order No. 015, s. 2026 – Table 11 & Annex G)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 print:divide-black text-xs text-center">
                {NUMERIC_QUALITATIVE_DESCRIPTORS.map(d => (
                  <div key={d.code} className="p-2.5">
                    <div className="font-black text-slate-900">{d.min} – {d.max}</div>
                    <div className="font-bold text-blue-700 print:text-black text-[11px]">{d.descriptor}</div>
                    <div className="text-[10px] text-slate-500 print:text-black italic">({d.filipino})</div>
                    <div className={`mt-1 inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      d.remarks === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    } print:bg-transparent print:text-black`}>
                      {d.remarks}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            SHARED BOTTOM SECTION: ATTENDANCE RECORD, TEACHER COMMENTS & TRANSFER
            =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 print:grid-cols-2">
          
          {/* LEFT: ATTENDANCE RECORD TABLE */}
          <div className="border border-slate-300 print:border-black rounded-xl overflow-hidden">
            <div className="bg-slate-800 text-white print:bg-slate-200 print:text-black px-4 py-2 text-xs font-black uppercase flex justify-between items-center">
              <span>ATTENDANCE RECORD</span>
              <span className="text-[10px] opacity-80 print:hidden">Click numbers to adjust</span>
            </div>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 font-black uppercase text-[10px] border-b border-slate-300 print:border-black">
                  <th className="p-1.5 text-center border-r border-slate-300 print:border-black w-12">Term</th>
                  <th className="p-1.5 text-left border-r border-slate-300 print:border-black">Month</th>
                  <th className="p-1.5 text-center border-r border-slate-300 print:border-black w-20">Class Days</th>
                  <th className="p-1.5 text-center border-r border-slate-300 print:border-black w-20">Days Present</th>
                  <th className="p-1.5 text-center w-20">Days Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-black">
                {attendance.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-1.5 text-center font-black border-r border-slate-200 print:border-black">{row.term}</td>
                    <td className="p-1.5 font-bold text-slate-700 border-r border-slate-200 print:border-black">{row.month}</td>
                    <td className="p-1 text-center border-r border-slate-200 print:border-black">
                      <input
                        type="number"
                        min="0"
                        max="31"
                        value={row.days}
                        onChange={e => handleAttendanceChange(idx, 'days', e.target.value)}
                        className="w-12 text-center font-bold bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded"
                      />
                    </td>
                    <td className="p-1 text-center border-r border-slate-200 print:border-black">
                      <input
                        type="number"
                        min="0"
                        max="31"
                        value={row.present}
                        onChange={e => handleAttendanceChange(idx, 'present', e.target.value)}
                        className="w-12 text-center font-bold text-emerald-700 print:text-black bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <input
                        type="number"
                        min="0"
                        max="31"
                        value={row.absent}
                        onChange={e => handleAttendanceChange(idx, 'absent', e.target.value)}
                        className="w-12 text-center font-bold text-rose-600 print:text-black bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 print:border-black">
                <tr>
                  <td colSpan={2} className="p-2 text-right uppercase border-r border-slate-300 print:border-black">Total</td>
                  <td className="p-2 text-center border-r border-slate-300 print:border-black">{attendanceTotals.days}</td>
                  <td className="p-2 text-center text-emerald-700 print:text-black border-r border-slate-300 print:border-black">{attendanceTotals.present}</td>
                  <td className="p-2 text-center text-rose-600 print:text-black">{attendanceTotals.absent}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* RIGHT: TEACHER'S COMMENTS/REMARKS & CERTIFICATE OF TRANSFER */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="border border-slate-300 print:border-black rounded-xl overflow-hidden">
              <div className="bg-slate-800 text-white print:bg-slate-200 print:text-black px-4 py-2 text-xs font-black uppercase">
                TEACHER'S COMMENTS / REMARKS & PARENT'S SIGNATURE
              </div>
              <div className="p-3 space-y-2.5 text-xs">
                {[
                  { key: 'term1', label: 'Term 1 (Unang Termino)' },
                  { key: 'term2', label: 'Term 2 (Ikalawang Termino)' },
                  { key: 'term3', label: 'Term 3 (Ikatlong Termino)' }
                ].map(t => (
                  <div key={t.key} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-600 print:text-black">
                      <span>{t.label}:</span>
                      <span>Parent/Guardian Signature: _______________</span>
                    </div>
                    <textarea
                      rows={2}
                      value={teacherRemarks[t.key]}
                      onChange={e => setTeacherRemarks(prev => ({ ...prev, [t.key]: e.target.value }))}
                      className="w-full p-2 text-[11px] font-medium text-slate-800 bg-slate-50 print:bg-transparent border border-slate-200 print:border-black rounded-lg outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* CERTIFICATE OF TRANSFER */}
            <div className="border border-slate-300 print:border-black rounded-xl p-4 text-xs space-y-3 bg-slate-50/50 print:bg-transparent">
              <div className="font-black uppercase text-center border-b border-slate-200 print:border-black pb-1.5">
                CERTIFICATE OF TRANSFER / ELIGIBILITY
              </div>
              <p className="text-[11px] text-slate-700 print:text-black leading-relaxed">
                This is to certify that the above-named learner has satisfactorily completed the requirements for <b>{student?.grade_level || 'current grade level'}</b> and is eligible for admission to the next level.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2 text-[11px]">
                <div>
                  <span className="font-bold text-slate-500 print:text-black">Admitted to Grade:</span> _________________
                </div>
                <div>
                  <span className="font-bold text-slate-500 print:text-black">Date:</span> {new Date().toLocaleDateString()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-6 text-center">
                <div>
                  <div className="border-b border-slate-800 print:border-black font-black uppercase text-[11px] pb-0.5">
                    {student?.adviser_name || 'CLASS ADVISER'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 print:text-black">Class Adviser</div>
                </div>
                <div>
                  <div className="border-b border-slate-800 print:border-black font-black uppercase text-[11px] pb-0.5">
                    SCHOOL PRINCIPAL / REGISTRAR
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 print:text-black">School Head / Registrar</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OfficialSF9Card;

