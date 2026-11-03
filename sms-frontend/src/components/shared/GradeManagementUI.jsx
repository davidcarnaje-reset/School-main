import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, GraduationCap, ClipboardCheck, BookOpen, Calendar, Lock,
  RefreshCw, Save, CheckCircle, Unlock, Users, Award, AlertCircle, TrendingUp,
  Search, FileSpreadsheet, Sliders, Sparkles, CheckSquare, X, Eye, Layers
} from 'lucide-react';

import {
  KINDER_DESCRIPTIVE_SCALE,
  G1_TO_3_DESCRIPTIVE_SCALE,
  SUBJECT_WEIGHT_PROFILES,
  KINDER_DOMAINS_CATALOG,
  PACE_G1_3_COMPETENCIES,
  DEFAULT_ECR_HPS,
  getPaceCatalogForSubject,
  getNumericDescriptorInfo,
  getDescriptiveScaleItem,
  computeEcrStudentMetrics,
  computeConsistentDescriptiveGrade,
  generateAutoNarrativeRemarks,
  calculateFinalGrade,
  getGradeStatus
} from '../../utils/gradingUtils';

const COLOR_BADGE_MAP = {
  emerald: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  blue: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  indigo: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
  amber: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  rose: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
  slate: { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' }
};

const getBadgeColors = (colorName) => COLOR_BADGE_MAP[colorName] || COLOR_BADGE_MAP.slate;

const getGlassStyle = () => ({
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.7)',
  boxShadow: '0 8px 32px 0 rgba(15, 23, 42, 0.05)',
});

// ─── SKELETON COMPONENT ─────────────────────────────────────────────────────
export const GradeManagementSkeleton = ({ themeColor }) => (
  <div className="flex flex-col gap-4 sm:gap-6 w-full animate-[fadeIn_0.4s_ease-out_forwards] px-2 sm:px-4">
    <style>{`
      @keyframes shimmerGlass {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      .gm-sk {
        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%), ${themeColor}15;
        background-size: 1000px 100%;
        animation: shimmerGlass 2.5s infinite linear;
        border-radius: 6px;
      }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-6 rounded-2xl w-full" style={getGlassStyle()}>
      <div className="gm-sk w-64 h-8" />
      <div className="gm-sk w-48 h-10 rounded-xl" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
      {[1, 2, 3, 4].map(n => (
        <div key={n} className="p-4 rounded-xl w-full" style={getGlassStyle()}>
          <div className="gm-sk w-full h-10" />
        </div>
      ))}
    </div>
    <div className="p-6 rounded-2xl w-full" style={getGlassStyle()}>
      <div className="gm-sk w-full h-64 rounded-xl" />
    </div>
  </div>
);

// ─── HEADER COMPONENT ────────────────────────────────────────────────────────
export const GradeHeader = ({
  displaySubject, displayGradeLevel, displaySection, systemLabel, isK12,
  selectedQuarter, setSelectedQuarter, setSearchParams, locationState,
  themeColor, isSubmitted, handleGoBack, syncFromActivities, saveAllGrades,
  submitFinalGrades, requestEditPermission, handleExportExcel,
  isSaving, isServerOffline, isRequesting, stage
}) => {
  const isTrimesterRef = stage === 'KINDER' || stage === 'G1_3';

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-5 p-3 sm:p-6 mb-3 sm:mb-4 rounded-xl sm:rounded-[1.5rem] w-full" style={getGlassStyle()}>
      <div className="flex flex-row items-start sm:items-center gap-2 sm:gap-4 w-full lg:w-auto">
        <button
          onClick={handleGoBack}
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all border border-slate-200 shrink-0 mt-0.5 sm:mt-0 shadow-sm cursor-pointer"
          title="Back to Classes"
        >
          <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>

        <div className="flex flex-col w-full min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight leading-tight break-words">
              {displaySubject}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              DepEd DO 015, s. 2026
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-slate-700 shrink-0">
              <GraduationCap size={12} /> {displayGradeLevel}
            </span>
            <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-slate-700 shrink-0">
              <ClipboardCheck size={12} /> Sec: {displaySection}
            </span>
            <span
              className="flex items-center gap-1 border px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black shrink-0"
              style={{ background: `${themeColor}15`, borderColor: `${themeColor}30`, color: themeColor }}
            >
              <BookOpen size={12} /> {systemLabel}
            </span>

            {/* Quarter / Term Selector */}
            {isK12 ? (
              <div className="flex flex-wrap bg-slate-100/90 p-0.5 sm:p-1 rounded-full border border-slate-200 w-full sm:w-auto mt-1 sm:mt-0">
                {[1, 2, 3, 4].map(q => (
                  <button
                    key={q}
                    onClick={() => {
                      setSelectedQuarter(q);
                      setSearchParams({ quarter: q }, { replace: true, state: locationState });
                    }}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black transition-all shrink-0 cursor-pointer ${
                      selectedQuarter === q ? 'shadow-sm text-white' : 'text-slate-600 hover:bg-white'
                    }`}
                    style={selectedQuarter === q ? { background: themeColor } : {}}
                  >
                    {selectedQuarter === q && <Calendar size={11} />}
                    <span>{isTrimesterRef && q <= 3 ? `Term ${q}` : `Q${q}`}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap bg-slate-100/90 p-0.5 sm:p-1 rounded-full border border-slate-200 w-full sm:w-auto mt-1 sm:mt-0">
                {[
                  { value: 1, label: 'Prelim', short: 'P' },
                  { value: 2, label: 'Midterm', short: 'M' },
                  { value: 3, label: 'Finals', short: 'F' }
                ].map(period => (
                  <button
                    key={period.value}
                    onClick={() => {
                      setSelectedQuarter(period.value);
                      setSearchParams({ period: period.value }, { replace: true, state: locationState });
                    }}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black transition-all shrink-0 cursor-pointer ${
                      selectedQuarter === period.value ? 'shadow-sm text-white' : 'text-slate-600 hover:bg-white'
                    }`}
                    style={selectedQuarter === period.value ? { background: themeColor } : {}}
                  >
                    {selectedQuarter === period.value && <Calendar size={11} />}
                    <span className="hidden sm:inline">{period.label}</span>
                    <span className="sm:hidden">{period.short}</span>
                  </button>
                ))}
              </div>
            )}

            {isSubmitted && (
              <span className="flex items-center gap-1 bg-red-100 border border-red-200 text-red-700 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black shadow-sm">
                <Lock size={11} /> LOCKED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          title="Generate Official DepEd ECR, PACE Form, Term Summary & SF9 Workbook (.xlsx)"
        >
          <FileSpreadsheet size={15} />
          <span>Export DepEd Excel (.xlsx)</span>
        </button>

        {!isSubmitted ? (
          <>
            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              onClick={syncFromActivities}
              disabled={isSaving || isServerOffline}
              title="Sync Written Works & Exam scores from LMS Activities"
            >
              <RefreshCw size={14} className={isSaving ? 'animate-spin' : ''} />
              <span>Sync LMS</span>
            </button>
            <button
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              onClick={saveAllGrades}
              disabled={isSaving || isServerOffline}
            >
              <Save size={14} />
              <span>Save Draft</span>
            </button>
            <button
              className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl font-black text-xs text-white shadow-md hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
              style={{ background: themeColor }}
              onClick={submitFinalGrades}
              disabled={isSaving || isServerOffline}
            >
              <CheckCircle size={15} />
              <span>Submit & Lock</span>
            </button>
          </>
        ) : (
          <button
            className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl font-black text-xs bg-amber-500 text-white shadow-md hover:bg-amber-600 transition-all disabled:opacity-50 cursor-pointer"
            onClick={requestEditPermission}
            disabled={isRequesting || isServerOffline}
          >
            <Unlock size={15} />
            <span>Request Unlock</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ─── DO 015 s. 2026 CONFIGURATION BAR ────────────────────────────────────────
export const GradeConfigBar = ({
  stage,
  isK12,
  weightProfileKey,
  setWeightProfileKey,
  transmutationMode,
  setTransmutationMode,
  viewMode,
  setViewMode,
  gradingMode,
  setGradingMode
}) => {
  if (!isK12) return null;

  return (
    <div className="p-3 sm:p-4 mb-3 sm:mb-4 rounded-xl sm:rounded-2xl w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3" style={getGlassStyle()}>
      {/* Left: Stage-Specific Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
        {stage === 'KINDER' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-black text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" /> Kindergarten Descriptive Scale (DO 015, s. 2026):
            </span>
            {KINDER_DESCRIPTIVE_SCALE.map(sc => {
              const colors = getBadgeColors(sc.color);
              return (
                <span
                  key={sc.code}
                  className="px-2.5 py-1 rounded-lg font-bold text-[11px] border"
                  style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                >
                  {sc.code} – {sc.descriptor} ({sc.filipino})
                </span>
              );
            })}
          </div>
        )}

        {stage === 'G1_3' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Sliders size={13} /> Grade 1–3 Grading Mode:
            </span>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setGradingMode('pace_descriptive')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  gradingMode === 'pace_descriptive' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                PACE & Descriptive (A–E)
              </button>
              <button
                type="button"
                onClick={() => setGradingMode('numerical_ecr')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  gradingMode === 'numerical_ecr' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Numerical E-Class Record (ECR)
              </button>
            </div>
          </div>
        )}

        {(stage === 'GS_4_6' || stage === 'JHS_7_10' || stage === 'SHS' || (stage === 'G1_3' && gradingMode === 'numerical_ecr')) && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sliders size={13} /> Subject Weights:
              </span>
              <select
                value={weightProfileKey}
                onChange={e => setWeightProfileKey(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm"
              >
                {Object.values(SUBJECT_WEIGHT_PROFILES).map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.shortLabel} — {prof.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTransmutationMode('adjusted_2026')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  transmutationMode === 'adjusted_2026' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
                title="DepEd DO 015, s. 2026 Adjusted Transmutation (Initial Grade 70.00 = Transmuted 75)"
              >
                Transmuted (IG 70=75)
              </button>
              <button
                type="button"
                onClick={() => setTransmutationMode('zero_based')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  transmutationMode === 'zero_based' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
                title="Zero-Based Grading (Direct Initial Grade rounded to whole number)"
              >
                Zero-Based
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right: View Switcher */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-end lg:self-auto">
        {stage !== 'KINDER' && !(stage === 'G1_3' && gradingMode === 'pace_descriptive') && (
          <>
            <button
              type="button"
              onClick={() => setViewMode('ECR')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                viewMode === 'ECR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Layers size={12} /> Full ECR Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('QUICK')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                viewMode === 'QUICK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Eye size={12} /> Quick % View
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'SUMMARY' ? 'ECR' : 'SUMMARY')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
            viewMode === 'SUMMARY' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Calendar size={12} /> {viewMode === 'SUMMARY' ? 'Back to Term Grading' : 'All Terms Summary'}
        </button>
      </div>
    </div>
  );
};

// ─── STATS CARDS ─────────────────────────────────────────────────────────────
export const GradeStats = ({ studentsLength, stats, passRate, stage }) => (
  <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4 w-full">
    <div className="flex flex-col sm:flex-row items-center gap-2 p-2.5 sm:p-3.5 rounded-xl w-full" style={getGlassStyle()}>
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="flex flex-col items-center sm:items-start">
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">Total Learners</span>
        <span className="text-sm sm:text-lg font-black text-slate-800">{studentsLength}</span>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row items-center gap-2 p-2.5 sm:p-3.5 rounded-xl w-full" style={getGlassStyle()}>
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
        <Award className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="flex flex-col items-center sm:items-start">
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">
          {stage === 'KINDER' ? 'Consistent / Dev' : 'Passed (≥75 / A–C)'}
        </span>
        <span className="text-sm sm:text-lg font-black text-emerald-700">{stats.passed}</span>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row items-center gap-2 p-2.5 sm:p-3.5 rounded-xl w-full" style={getGlassStyle()}>
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="flex flex-col items-center sm:items-start">
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">
          {stage === 'KINDER' ? 'Beginning (BG)' : 'Needs Support (<75 / D–E)'}
        </span>
        <span className="text-sm sm:text-lg font-black text-amber-700">{stats.failed}</span>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row items-center gap-2 p-2.5 sm:p-3.5 rounded-xl w-full" style={getGlassStyle()}>
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="flex flex-col items-center sm:items-start w-full">
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">Proficiency Rate</span>
        <span className="text-sm sm:text-lg font-black text-slate-800">{passRate}%</span>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
          <div className="h-full bg-purple-600 rounded-full transition-all duration-700" style={{ width: `${passRate}%` }} />
        </div>
      </div>
    </div>
  </div>
);

// ─── PACE & KINDER COMPETENCY EVALUATION MODAL ───────────────────────────────
const PaceEvaluationModal = ({
  student,
  stage,
  classInfo,
  isSubmitted,
  onClose,
  onSaveStudentDetails
}) => {
  if (!student) return null;

  const isKinder = stage === 'KINDER';
  const scaleOptions = isKinder ? KINDER_DESCRIPTIVE_SCALE : G1_TO_3_DESCRIPTIVE_SCALE;
  const defaultCatalog = !isKinder ? getPaceCatalogForSubject(classInfo) : null;
  const [selectedPaceKey, setSelectedPaceKey] = useState(defaultCatalog?.subjectKey || 'READING_LITERACY');
  const paceCatalog = !isKinder
    ? (PACE_G1_3_COMPETENCIES[selectedPaceKey] || defaultCatalog)
    : null;

  const existingDetails = student.details || {};
  const [ratingsMap, setRatingsMap] = useState(
    isKinder ? (existingDetails.kinder_ratings || {}) : (existingDetails.pace_ratings || {})
  );
  const [descriptiveGrade, setDescriptiveGrade] = useState(
    student.descriptive_grade || (isKinder ? 'CO' : 'B')
  );
  const [whatCanDo, setWhatCanDo] = useState(existingDetails.what_can_do || '');
  const [learningToImprove, setLearningToImprove] = useState(existingDetails.learning_to_improve || '');

  const handleRatingSelect = (itemId, code) => {
    if (isSubmitted) return;
    const next = { ...ratingsMap, [itemId]: code };
    setRatingsMap(next);
    const modalGrade = computeConsistentDescriptiveGrade(next, isKinder);
    if (modalGrade) setDescriptiveGrade(modalGrade);
  };

  const handleFillAll = (code) => {
    if (isSubmitted) return;
    const next = { ...ratingsMap };
    if (isKinder) {
      KINDER_DOMAINS_CATALOG.forEach(dom => {
        dom.competencies.forEach(c => { next[c.id] = code; });
      });
    } else if (paceCatalog?.domains) {
      paceCatalog.domains.forEach(dom => {
        dom.items.forEach(c => { next[c.id] = code; });
      });
    }
    setRatingsMap(next);
    setDescriptiveGrade(code);
  };

  const handleAutoNarrative = () => {
    if (isSubmitted) return;
    const generated = generateAutoNarrativeRemarks(ratingsMap, paceCatalog, isKinder);
    setWhatCanDo(generated.what_can_do);
    setLearningToImprove(generated.learning_to_improve);
  };

  const handleApply = () => {
    onSaveStudentDetails(student.id, {
      descriptive_grade: descriptiveGrade,
      pace_ratings: !isKinder ? ratingsMap : undefined,
      kinder_ratings: isKinder ? ratingsMap : undefined,
      what_can_do: whatCanDo,
      learning_to_improve: learningToImprove
    });
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-[fadeIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/40 text-[10px] font-black uppercase tracking-widest text-indigo-200">
                DepEd Order No. 015, s. 2026
              </span>
              <span className="text-[11px] font-bold text-slate-300">
                {isKinder
                  ? 'Kindergarten Developmental Domains Checklist (Annex E)'
                  : `PACE Form (Annex F) – ${paceCatalog?.title || ''}`}
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-black mt-1">
              {student.name}
              <span className="ml-2 text-xs font-semibold text-slate-400">
                (LRN / ID: {student.lrn || student.student_number})
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
            title="Close PACE Form"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sticky Sub-Header: Learning Area Tabs (G1-3) + Overall Consistent Rating */}
        <div className="px-4 py-3 sm:px-6 bg-indigo-50/90 border-b border-indigo-200 space-y-2.5 shrink-0">
          {!isKinder && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 mr-1">
                PACE Learning Area:
              </span>
              {Object.values(PACE_G1_3_COMPETENCIES).map(area => (
                <button
                  key={area.subjectKey}
                  type="button"
                  onClick={() => setSelectedPaceKey(area.subjectKey)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    selectedPaceKey === area.subjectKey
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-indigo-100 border border-indigo-200/70'
                  }`}
                >
                  {area.title.split(' / ')[0]}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                Overall Consistent Descriptive Rating (SF9 Mark)
              </h4>
              <p className="text-[11px] text-indigo-700 font-medium">
                Auto-computed from the learner's most consistent competency rating, or select below:
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {scaleOptions.map(opt => {
                const colors = getBadgeColors(opt.color);
                return (
                  <button
                    key={opt.code}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => setDescriptiveGrade(opt.code)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      descriptiveGrade === opt.code
                        ? 'ring-2 ring-indigo-600 shadow-sm scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                  >
                    {opt.code} – {opt.descriptor}
                  </button>
                );
              })}
              {!isSubmitted && (
                <button
                  type="button"
                  onClick={() => handleFillAll(descriptiveGrade)}
                  className="ml-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-black hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Fill All "{descriptiveGrade}"
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/40">
          {/* KINDERGARTEN 4 DOMAINS OR GRADE 1-3 PACE COMPETENCIES */}
          {isKinder ? (
            <div className="space-y-4">
              {KINDER_DOMAINS_CATALOG.map(dom => (
                <div key={dom.domainKey} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 font-black text-xs text-slate-800 uppercase">
                    {dom.domainTitle}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {dom.competencies.map(comp => {
                      const val = ratingsMap[comp.id] || descriptiveGrade || 'CO';
                      return (
                        <div key={comp.id} className="px-4 py-2.5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs hover:bg-slate-50">
                          <span className="font-semibold text-slate-700">{comp.no}. {comp.text}</span>
                          <div className="flex gap-1.5 shrink-0">
                            {scaleOptions.map(opt => {
                              const colors = getBadgeColors(opt.color);
                              return (
                                <button
                                  key={opt.code}
                                  type="button"
                                  disabled={isSubmitted}
                                  onClick={() => handleRatingSelect(comp.id, opt.code)}
                                  className={`px-3 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-all ${
                                    val === opt.code ? 'ring-2 ring-slate-900 shadow-xs scale-105' : 'opacity-45 hover:opacity-90'
                                  }`}
                                  style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                                >
                                  {opt.code}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(paceCatalog?.domains || []).map((dom, dIdx) => (
                <div key={dIdx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 font-black text-xs text-slate-800 uppercase flex justify-between items-center">
                    <span>{dom.title}</span>
                    <span className="text-[10px] font-bold text-slate-500">Rate: A (Advancing) to E (Emerging)</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {dom.items.map(item => {
                      const val = ratingsMap[item.id] || descriptiveGrade || 'B';
                      return (
                        <div key={item.id} className="px-4 py-2.5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs hover:bg-slate-50">
                          <div className="flex items-start gap-2 pr-2">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-black text-slate-700 shrink-0 mt-0.5">
                              {item.no}
                            </span>
                            <span className="font-semibold text-slate-800 leading-relaxed">{item.text}</span>
                          </div>
                          <div className="flex gap-1.5 shrink-0 self-end sm:self-center">
                            {scaleOptions.map(opt => {
                              const colors = getBadgeColors(opt.color);
                              return (
                                <button
                                  key={opt.code}
                                  type="button"
                                  disabled={isSubmitted}
                                  onClick={() => handleRatingSelect(item.id, opt.code)}
                                  className={`w-8 h-8 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                                    val === opt.code ? 'ring-2 ring-slate-900 scale-105 shadow-xs' : 'opacity-45 hover:opacity-90'
                                  }`}
                                  style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                                  title={`${opt.code} – ${opt.descriptor} (${opt.filipino})`}
                                >
                                  {opt.code}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Narrative Feedback Section (SF9 Qualitative Feedback) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h5 className="font-black text-slate-800 text-xs sm:text-sm">
                  SF9 Qualitative Teacher Feedback (Ulat sa Magulang)
                </h5>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Appears on the learner's official SF9 Progress Report Card
                </p>
              </div>
              {!isSubmitted && (
                <button
                  type="button"
                  onClick={handleAutoNarrative}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm cursor-pointer"
                >
                  <Sparkles size={13} /> Auto-Generate from Competencies
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-emerald-800 mb-1">
                  What Your Child Can Do (Mga Nagagawa ng Bata)
                </label>
                <textarea
                  rows={3}
                  disabled={isSubmitted}
                  value={whatCanDo}
                  onChange={e => setWhatCanDo(e.target.value)}
                  placeholder="Describe key strengths and mastered competencies..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-amber-800 mb-1">
                  What Your Child Is Learning To Improve (Mga Dapat Linangin)
                </label>
                <textarea
                  rows={3}
                  disabled={isSubmitted}
                  value={learningToImprove}
                  onChange={e => setLearningToImprove(e.target.value)}
                  placeholder="Describe areas for growth and home support recommendations..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3.5 sm:px-6 bg-slate-100 border-t border-slate-200 flex justify-between items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
            Selected SF9 Mark: <b className="text-indigo-700">{descriptiveGrade}</b> ({Object.keys(ratingsMap).length} competencies rated)
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            {!isSubmitted && (
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Apply Rating & Save to Class Record
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

// ─── MAIN GRADE TABLE COMPONENT ──────────────────────────────────────────────
export const GradeTable = ({
  themeColor,
  categories,
  isK12,
  isSubmitted,
  studentsLength,
  filteredStudents,
  handleInputChange,
  handleInputBlur,
  currentLevel,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  classInfo,
  stage = 'JHS_7_10',
  weightProfileKey = 'KS2_KS3_CORE',
  transmutationMode = 'adjusted_2026',
  viewMode = 'ECR',
  gradingMode = 'numerical_ecr',
  hps = DEFAULT_ECR_HPS,
  onHpsChange,
  onEcrItemChange,
  onDirectComponentChange,
  onDescriptiveGradeChange,
  onSaveStudentDetails
}) => {
  const [activeModalStudentId, setActiveModalStudentId] = useState(null);
  const activeModalStudent = filteredStudents.find(s => s.id === activeModalStudentId) || null;
  const activeProfile = SUBJECT_WEIGHT_PROFILES[weightProfileKey] || SUBJECT_WEIGHT_PROFILES.KS2_KS3_CORE;

  const renderToolbar = () => (
    <div className="p-3 sm:p-4 border-b border-black/5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 w-full">
      <div className="relative w-full sm:max-w-xs flex items-center bg-white/80 border border-slate-200 rounded-xl px-3 py-2 shadow-inner">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search learner name or LRN..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none outline-none ml-2 text-xs font-bold text-slate-700 placeholder-slate-400"
        />
      </div>

      <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
        {['All', 'Passed', 'Failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className="px-3 py-1 rounded-lg text-xs font-black transition-all text-center whitespace-nowrap cursor-pointer"
            style={{
              background: filterStatus === f ? 'white' : 'transparent',
              color: filterStatus === f ? themeColor : '#64748b',
              boxShadow: filterStatus === f ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            {f === 'All' ? 'All Learners' : f === 'Passed' ? 'Proficient / Passed' : 'Needs Support'}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── VIEW 1: ALL TERMS / QUARTERLY SUMMARY VIEW ──────────────────────────
  if (viewMode === 'SUMMARY' && isK12) {
    const isDescriptiveStage = stage === 'KINDER' || (stage === 'G1_3' && gradingMode === 'pace_descriptive');
    return (
      <div className="flex flex-col rounded-xl sm:rounded-[1.5rem] w-full overflow-hidden" style={getGlassStyle()}>
        {renderToolbar()}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-slate-100/90 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 text-left">Learner Name & LRN</th>
                <th className="p-3 text-center border-l border-slate-200">Term 1 / Q1</th>
                <th className="p-3 text-center border-l border-slate-200">Term 2 / Q2</th>
                <th className="p-3 text-center border-l border-slate-200">Term 3 / Q3</th>
                <th className="p-3 text-center border-l border-slate-200">Q4</th>
                <th className="p-3 text-center border-l border-slate-200 bg-indigo-50 text-indigo-900">
                  {isDescriptiveStage ? 'Consistent Rating' : 'Final Rating'}
                </th>
                <th className="p-3 text-center border-l border-slate-200">Qualitative Descriptor</th>
                <th className="p-3 text-center border-l border-slate-200">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s, idx) => {
                const terms = s.all_terms || {};
                const t1 = terms[1]?.descriptive_grade || terms[1]?.final_grade || '-';
                const t2 = terms[2]?.descriptive_grade || terms[2]?.final_grade || '-';
                const t3 = terms[3]?.descriptive_grade || terms[3]?.final_grade || '-';
                const t4 = terms[4]?.descriptive_grade || terms[4]?.final_grade || '-';

                let finalMark = '-';
                let descText = '-';
                let passed = true;

                if (isDescriptiveStage) {
                  const isKinder = stage === 'KINDER';
                  const codesMap = { 1: terms[1]?.descriptive_grade, 2: terms[2]?.descriptive_grade, 3: terms[3]?.descriptive_grade };
                  finalMark = computeConsistentDescriptiveGrade(codesMap, isKinder) || s.descriptive_grade || '-';
                  const info = getDescriptiveScaleItem(finalMark, isKinder);
                  descText = info ? `${info.descriptor} (${info.filipino})` : '-';
                  passed = finalMark !== 'BG' && finalMark !== 'E';
                } else {
                  const nums = [1, 2, 3, 4]
                    .map(q => parseFloat(terms[q]?.final_grade))
                    .filter(v => !isNaN(v) && v > 0);
                  const avg = nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : (s.final_grade || 0);
                  finalMark = avg > 0 ? avg : '-';
                  const info = getNumericDescriptorInfo(avg);
                  descText = avg > 0 ? `${info.descriptor} (${info.filipino})` : '-';
                  passed = avg >= 75;
                }

                return (
                  <tr key={s.id ?? idx} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-800">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-slate-400">LRN: {s.lrn || s.student_number}</div>
                    </td>
                    <td className="p-3 text-center border-l border-slate-100 font-bold">{t1}</td>
                    <td className="p-3 text-center border-l border-slate-100 font-bold">{t2}</td>
                    <td className="p-3 text-center border-l border-slate-100 font-bold">{t3}</td>
                    <td className="p-3 text-center border-l border-slate-100 font-bold">{t4}</td>
                    <td className="p-3 text-center border-l border-slate-100 bg-indigo-50/40 font-black text-sm text-indigo-900">
                      {finalMark}
                    </td>
                    <td className="p-3 text-center border-l border-slate-100 font-bold text-slate-700">{descText}</td>
                    <td className="p-3 text-center border-l border-slate-100">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {passed ? 'PASSED' : 'NEEDS SUPPORT'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── VIEW 2: KINDERGARTEN OR GRADES 1–3 PACE & DESCRIPTIVE MODE ──────────
  if (isK12 && (stage === 'KINDER' || (stage === 'G1_3' && gradingMode === 'pace_descriptive'))) {
    const isKinder = stage === 'KINDER';
    const scaleList = isKinder ? KINDER_DESCRIPTIVE_SCALE : G1_TO_3_DESCRIPTIVE_SCALE;
    const paceCatalog = !isKinder ? getPaceCatalogForSubject(classInfo) : null;

    return (
      <div className="flex flex-col rounded-xl sm:rounded-[1.5rem] w-full overflow-hidden" style={getGlassStyle()}>
        {renderToolbar()}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-slate-100/90 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 text-left w-64">Learner Name & LRN</th>
                <th className="p-3 text-center border-l border-slate-200 w-48">
                  {isKinder ? 'Developmental Domains (Annex E)' : `PACE Form (${paceCatalog?.title || 'Competencies'})`}
                </th>
                <th className="p-3 text-center border-l border-slate-200 w-48">
                  Term Descriptive Rating
                </th>
                <th className="p-3 text-center border-l border-slate-200 w-48">
                  Qualitative Descriptor (DO 015 s. 2026)
                </th>
                <th className="p-3 text-left border-l border-slate-200">
                  Teacher's Qualitative Feedback (Strengths & Areas to Improve)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                    {studentsLength === 0 ? 'No learners enrolled in this class.' : 'No matching learners found.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const code = student.descriptive_grade || (isKinder ? 'CO' : 'B');
                  const scaleInfo = getDescriptiveScaleItem(code, isKinder) || scaleList[0];
                  const colors = getBadgeColors(scaleInfo.color);
                  const details = student.details || {};
                  const compMap = isKinder ? (details.kinder_ratings || {}) : (details.pace_ratings || {});
                  const compCount = Object.keys(compMap).length;

                  return (
                    <tr key={student.id ?? idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div className="font-black text-slate-800 text-xs">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          LRN: {student.lrn || student.student_number}
                        </div>
                      </td>

                      {/* PACE / Domain Modal Trigger */}
                      <td className="p-3 text-center border-l border-slate-100">
                        <button
                          type="button"
                          onClick={() => setActiveModalStudentId(student.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-black text-[11px] inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <CheckSquare size={13} />
                          <span>{isKinder ? 'Evaluate Domains' : 'Open PACE Form'}</span>
                          {compCount > 0 && (
                            <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[9px]">
                              {compCount}
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Direct Descriptive Grade Selector */}
                      <td className="p-3 text-center border-l border-slate-100">
                        <div className="flex items-center justify-center gap-1">
                          {scaleList.map(opt => {
                            const optColors = getBadgeColors(opt.color);
                            return (
                              <button
                                key={opt.code}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => onDescriptiveGradeChange(student.id, opt.code)}
                                className={`w-8 h-8 rounded-lg font-black text-xs border transition-all cursor-pointer ${
                                  code === opt.code
                                    ? 'ring-2 ring-slate-900 scale-105 shadow-sm'
                                    : 'opacity-45 hover:opacity-85'
                                }`}
                                style={{ backgroundColor: optColors.bg, color: optColors.text, borderColor: optColors.border }}
                                title={`${opt.code} – ${opt.descriptor} (${opt.filipino})`}
                              >
                                {opt.code}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Descriptor Badge */}
                      <td className="p-3 text-center border-l border-slate-100">
                        <span
                          className="inline-block px-3 py-1 rounded-xl font-black text-xs border"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border
                          }}
                        >
                          {scaleInfo.code} – {scaleInfo.descriptor}
                          <span className="block text-[9px] font-semibold opacity-80">{scaleInfo.filipino}</span>
                        </span>
                      </td>

                      {/* Narrative Remarks Summary */}
                      <td className="p-3 border-l border-slate-100 text-[11px]">
                        {details.what_can_do || details.learning_to_improve ? (
                          <div className="space-y-1">
                            {details.what_can_do && (
                              <p className="text-emerald-800 font-semibold line-clamp-1">
                                <b className="uppercase text-[9px]">Can Do:</b> {details.what_can_do}
                              </p>
                            )}
                            {details.learning_to_improve && (
                              <p className="text-amber-800 font-semibold line-clamp-1">
                                <b className="uppercase text-[9px]">Improve:</b> {details.learning_to_improve}
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveModalStudentId(student.id)}
                            className="text-slate-400 hover:text-indigo-600 font-semibold italic text-[11px] cursor-pointer"
                          >
                            + Click to add PACE qualitative remarks...
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {activeModalStudent && (
          <PaceEvaluationModal
            student={activeModalStudent}
            stage={stage}
            classInfo={classInfo}
            isSubmitted={isSubmitted}
            onClose={() => setActiveModalStudentId(null)}
            onSaveStudentDetails={onSaveStudentDetails}
          />
        )}
      </div>
    );
  }

  // ─── VIEW 3: FULL DEPED E-CLASS RECORD (ECR) GRID (KS1 ECR, KS2, KS3, KS4) ─
  if (isK12 && viewMode === 'ECR') {
    const wwPct = Math.round(activeProfile.ww * 100);
    const ptPct = Math.round(activeProfile.pt * 100);
    const exPct = Math.round(activeProfile.ex * 100);
    const hasEx = exPct > 0;
    const hpsWwTotal = (hps.ww || []).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const hpsPtTotal = (hps.pt || []).reduce((a, b) => a + (parseFloat(b) || 0), 0);

    return (
      <div className="flex flex-col rounded-xl sm:rounded-[1.5rem] w-full overflow-hidden" style={getGlassStyle()}>
        {renderToolbar()}

        <div className="w-full overflow-x-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <table className="w-full border-collapse text-[11px] min-w-[1150px]">
            <thead className="sticky top-0 z-20 bg-slate-100 text-slate-700 font-black uppercase text-[10px]">
              <tr className="border-b border-slate-300">
                <th rowSpan={2} className="p-2.5 text-left bg-slate-100 sticky left-0 z-30 border-r border-slate-300 w-52">
                  Learner's Name
                </th>
                <th colSpan={8} className="p-1.5 text-center bg-blue-50 text-blue-900 border-r border-slate-300">
                  Written / Oral Works ({wwPct}%)
                </th>
                <th colSpan={8} className="p-1.5 text-center bg-emerald-50 text-emerald-900 border-r border-slate-300">
                  Product / Performance Tasks ({ptPct}%)
                </th>
                {hasEx && (
                  <th colSpan={5} className="p-1.5 text-center bg-amber-50 text-amber-900 border-r border-slate-300">
                    Examinations ({exPct}%) [30% ST1 · 30% ST2 · 40% TE]
                  </th>
                )}
                <th rowSpan={2} className="p-2 text-center bg-slate-100 border-r border-slate-300 w-16">
                  Initial Grade
                </th>
                <th rowSpan={2} className="p-2 text-center bg-indigo-50 text-indigo-900 border-r border-slate-300 w-16">
                  Term Grade
                </th>
                <th rowSpan={2} className="p-2 text-center bg-slate-100 w-28">
                  Descriptor (DO 015)
                </th>
              </tr>

              <tr className="border-b border-slate-300 text-[9px]">
                {[1, 2, 3, 4, 5].map(i => (
                  <th key={`ww-h-${i}`} className="p-1 text-center bg-blue-50/60 border-r border-slate-200 w-11">W{i}</th>
                ))}
                <th className="p-1 text-center bg-blue-100/60 border-r border-slate-200 w-12">TOT</th>
                <th className="p-1 text-center bg-blue-100/60 border-r border-slate-200 w-12">PS</th>
                <th className="p-1 text-center bg-blue-200/60 border-r border-slate-300 w-12">WS</th>

                {[1, 2, 3, 4, 5].map(i => (
                  <th key={`pt-h-${i}`} className="p-1 text-center bg-emerald-50/60 border-r border-slate-200 w-11">P{i}</th>
                ))}
                <th className="p-1 text-center bg-emerald-100/60 border-r border-slate-200 w-12">TOT</th>
                <th className="p-1 text-center bg-emerald-100/60 border-r border-slate-200 w-12">PS</th>
                <th className="p-1 text-center bg-emerald-200/60 border-r border-slate-300 w-12">WS</th>

                {hasEx && (
                  <>
                    <th className="p-1 text-center bg-amber-50/60 border-r border-slate-200 w-12">ST1</th>
                    <th className="p-1 text-center bg-amber-50/60 border-r border-slate-200 w-12">ST2</th>
                    <th className="p-1 text-center bg-amber-50/60 border-r border-slate-200 w-12">TE</th>
                    <th className="p-1 text-center bg-amber-100/60 border-r border-slate-200 w-12">PS</th>
                    <th className="p-1 text-center bg-amber-200/60 border-r border-slate-300 w-12">WS</th>
                  </>
                )}
              </tr>

              {/* HIGHEST POSSIBLE SCORE (HPS) ROW */}
              <tr className="bg-slate-200/80 border-b-2 border-slate-400 text-[10px] font-black text-slate-800">
                <td className="p-2 sticky left-0 z-30 bg-slate-200 border-r border-slate-300 uppercase">
                  Highest Possible Score (HPS)
                </td>
                {[0, 1, 2, 3, 4].map(idx => (
                  <td key={`hps-ww-${idx}`} className="p-1 text-center border-r border-slate-300">
                    <input
                      type="number"
                      min="1"
                      disabled={isSubmitted}
                      value={hps.ww?.[idx] ?? 20}
                      onChange={e => onHpsChange('ww', idx, e.target.value)}
                      className="w-10 text-center bg-white rounded border border-slate-300 py-0.5 text-[10px] font-black"
                    />
                  </td>
                ))}
                <td className="p-1 text-center border-r border-slate-300">{hpsWwTotal}</td>
                <td className="p-1 text-center border-r border-slate-300">100.0</td>
                <td className="p-1 text-center border-r border-slate-300 text-blue-900">{wwPct}%</td>

                {[0, 1, 2, 3, 4].map(idx => (
                  <td key={`hps-pt-${idx}`} className="p-1 text-center border-r border-slate-300">
                    <input
                      type="number"
                      min="1"
                      disabled={isSubmitted}
                      value={hps.pt?.[idx] ?? 25}
                      onChange={e => onHpsChange('pt', idx, e.target.value)}
                      className="w-10 text-center bg-white rounded border border-slate-300 py-0.5 text-[10px] font-black"
                    />
                  </td>
                ))}
                <td className="p-1 text-center border-r border-slate-300">{hpsPtTotal}</td>
                <td className="p-1 text-center border-r border-slate-300">100.0</td>
                <td className="p-1 text-center border-r border-slate-300 text-emerald-900">{ptPct}%</td>

                {hasEx && (
                  <>
                    {['st1', 'st2', 'te'].map(exKey => (
                      <td key={`hps-ex-${exKey}`} className="p-1 text-center border-r border-slate-300">
                        <input
                          type="number"
                          min="1"
                          disabled={isSubmitted}
                          value={hps.ex?.[exKey] ?? 30}
                          onChange={e => onHpsChange('ex', exKey, e.target.value)}
                          className="w-10 text-center bg-white rounded border border-slate-300 py-0.5 text-[10px] font-black"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center border-r border-slate-300">100.0</td>
                    <td className="p-1 text-center border-r border-slate-300 text-amber-900">{exPct}%</td>
                  </>
                )}

                <td className="p-1 text-center border-r border-slate-300">100.0</td>
                <td className="p-1 text-center border-r border-slate-300 text-indigo-900">100</td>
                <td className="p-1 text-center">Advancing</td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((student, idx) => {
                const details = student.details || {};
                const wwScores = details.ww_scores || ['', '', '', '', ''];
                const ptScores = details.pt_scores || ['', '', '', '', ''];
                const exScores = details.ex_scores || { st1: '', st2: '', te: '' };

                const metrics = computeEcrStudentMetrics(student, hps, weightProfileKey, transmutationMode);
                const descInfo = getNumericDescriptorInfo(metrics.termGrade);
                const colors = getBadgeColors(descInfo.color);

                return (
                  <tr key={student.id ?? idx} className="hover:bg-slate-50/90 transition-colors">
                    <td className="p-2 sticky left-0 z-10 bg-white border-r border-slate-200">
                      <div className="font-bold text-slate-800 truncate max-w-[190px]">{student.name}</div>
                      <div className="text-[9px] text-slate-400 font-semibold">{student.lrn || student.student_number}</div>
                    </td>

                    {/* WW 1-5 Inputs */}
                    {[0, 1, 2, 3, 4].map(i => (
                      <td key={`ww-${i}`} className="p-1 text-center border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max={hps.ww?.[i] || 100}
                          disabled={isSubmitted}
                          value={wwScores[i] ?? ''}
                          placeholder="-"
                          onChange={e => onEcrItemChange(student.id, 'ww_scores', i, e.target.value)}
                          className="w-10 text-center py-1 rounded border border-slate-200 focus:border-blue-500 outline-none font-bold text-slate-700"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center border-r border-slate-100 bg-blue-50/30 font-bold text-slate-600">
                      {metrics.wwTotal || '-'}
                    </td>
                    <td className="p-1 text-center border-r border-slate-100 bg-blue-50/30 font-bold text-slate-700">
                      {metrics.wwPS.toFixed(1)}
                    </td>
                    <td className="p-1 text-center border-r border-slate-300 bg-blue-100/40 font-black text-blue-900">
                      {metrics.wwWS.toFixed(2)}
                    </td>

                    {/* PT 1-5 Inputs */}
                    {[0, 1, 2, 3, 4].map(i => (
                      <td key={`pt-${i}`} className="p-1 text-center border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max={hps.pt?.[i] || 100}
                          disabled={isSubmitted}
                          value={ptScores[i] ?? ''}
                          placeholder="-"
                          onChange={e => onEcrItemChange(student.id, 'pt_scores', i, e.target.value)}
                          className="w-10 text-center py-1 rounded border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center border-r border-slate-100 bg-emerald-50/30 font-bold text-slate-600">
                      {metrics.ptTotal || '-'}
                    </td>
                    <td className="p-1 text-center border-r border-slate-100 bg-emerald-50/30 font-bold text-slate-700">
                      {metrics.ptPS.toFixed(1)}
                    </td>
                    <td className="p-1 text-center border-r border-slate-300 bg-emerald-100/40 font-black text-emerald-900">
                      {metrics.ptWS.toFixed(2)}
                    </td>

                    {/* EX Inputs (ST1, ST2, TE) */}
                    {hasEx && (
                      <>
                        {['st1', 'st2', 'te'].map(exKey => (
                          <td key={`ex-${exKey}`} className="p-1 text-center border-r border-slate-100">
                            <input
                              type="number"
                              min="0"
                              max={hps.ex?.[exKey] || 100}
                              disabled={isSubmitted}
                              value={exScores[exKey] ?? ''}
                              placeholder="-"
                              onChange={e => onEcrItemChange(student.id, 'ex_scores', exKey, e.target.value)}
                              className="w-10 text-center py-1 rounded border border-slate-200 focus:border-amber-500 outline-none font-bold text-slate-700"
                            />
                          </td>
                        ))}
                        <td className="p-1 text-center border-r border-slate-100 bg-amber-50/30 font-bold text-slate-700">
                          {metrics.exPS.toFixed(1)}
                        </td>
                        <td className="p-1 text-center border-r border-slate-300 bg-amber-100/40 font-black text-amber-900">
                          {metrics.exWS.toFixed(2)}
                        </td>
                      </>
                    )}

                    {/* Initial Grade */}
                    <td className="p-1 text-center border-r border-slate-200 font-bold text-slate-600">
                      {metrics.initialGrade.toFixed(2)}
                    </td>

                    {/* Transmuted / Term Grade */}
                    <td className="p-1 text-center border-r border-slate-200 bg-indigo-50/40 font-black text-sm text-indigo-900">
                      {stage === 'G1_3' && metrics.termGrade > 0
                        ? `${metrics.descriptiveCode} (${metrics.termGrade})`
                        : (metrics.termGrade || '-')}
                    </td>

                    {/* Qualitative Descriptor */}
                    <td className="p-1 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase border"
                        style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                      >
                        {descInfo.descriptor}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── VIEW 4: QUICK COMPONENT % VIEW OR COLLEGE TABLE ───────────────────────
  return (
    <div className="flex flex-col rounded-xl sm:rounded-[1.5rem] w-full overflow-hidden" style={getGlassStyle()}>
      {renderToolbar()}

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3 text-left">Learner Name & ID</th>
              {isK12 ? (
                <>
                  <th className="p-3 text-center border-l border-slate-200">
                    Written / Oral Works ({Math.round(activeProfile.ww * 100)}%)
                  </th>
                  <th className="p-3 text-center border-l border-slate-200">
                    Performance Tasks ({Math.round(activeProfile.pt * 100)}%)
                  </th>
                  {activeProfile.ex > 0 && (
                    <th className="p-3 text-center border-l border-slate-200">
                      Examinations ({Math.round(activeProfile.ex * 100)}%)
                    </th>
                  )}
                  <th className="p-3 text-center border-l border-slate-200">Initial Grade</th>
                  <th className="p-3 text-center border-l border-slate-200 bg-indigo-50 text-indigo-900">
                    Term Grade
                  </th>
                  <th className="p-3 text-center border-l border-slate-200">Descriptor (DO 015)</th>
                </>
              ) : (
                categories.map(cat => (
                  <th key={cat.key} className="p-3 text-center border-l border-slate-200">
                    {cat.label} ({cat.percentage})
                  </th>
                ))
              )}
              <th className="p-3 text-center border-l border-slate-200">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((student, idx) => {
              if (isK12) {
                const metrics = computeEcrStudentMetrics(student, hps, weightProfileKey, transmutationMode);
                const descInfo = getNumericDescriptorInfo(metrics.termGrade);
                const colors = getBadgeColors(descInfo.color);
                const passed = metrics.termGrade >= 75;

                return (
                  <tr key={student.id ?? idx} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{student.name}</div>
                      <div className="text-[10px] text-slate-400">{student.lrn || student.student_number}</div>
                    </td>
                    <td className="p-2 text-center border-l border-slate-100">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isSubmitted}
                        value={student.written ?? 0}
                        onChange={e => onDirectComponentChange(student.id, 'written', e.target.value)}
                        className="w-16 text-center p-1.5 rounded-lg border border-slate-300 font-bold"
                      />
                    </td>
                    <td className="p-2 text-center border-l border-slate-100">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isSubmitted}
                        value={student.performance ?? 0}
                        onChange={e => onDirectComponentChange(student.id, 'performance', e.target.value)}
                        className="w-16 text-center p-1.5 rounded-lg border border-slate-300 font-bold"
                      />
                    </td>
                    {activeProfile.ex > 0 && (
                      <td className="p-2 text-center border-l border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isSubmitted}
                          value={student.exam ?? 0}
                          onChange={e => onDirectComponentChange(student.id, 'exam', e.target.value)}
                          className="w-16 text-center p-1.5 rounded-lg border border-slate-300 font-bold"
                        />
                      </td>
                    )}
                    <td className="p-3 text-center border-l border-slate-100 font-bold text-slate-600">
                      {metrics.initialGrade.toFixed(2)}
                    </td>
                    <td className="p-3 text-center border-l border-slate-100 bg-indigo-50/40 font-black text-sm text-indigo-900">
                      {metrics.termGrade || '-'}
                    </td>
                    <td className="p-3 text-center border-l border-slate-100">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border"
                        style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                      >
                        {descInfo.descriptor}
                      </span>
                    </td>
                    <td className="p-3 text-center border-l border-slate-100">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                  </tr>
                );
              }

              const final = calculateFinalGrade(student, currentLevel);
              const status = getGradeStatus(final, currentLevel);
              const passed = status === 'Passed';

              return (
                <tr key={student.id ?? idx} className="hover:bg-slate-50/80">
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{student.name}</div>
                    <div className="text-[10px] text-slate-400">{student.student_number}</div>
                  </td>
                  {categories.map(cat => (
                    <td key={cat.key} className="p-2 text-center border-l border-slate-100">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isSubmitted}
                        value={student[cat.key] ?? 0}
                        onChange={e => handleInputChange(student.id, cat.key, e.target.value)}
                        onBlur={e => handleInputBlur(student.id, cat.key, e.target.value)}
                        className="w-16 text-center p-1.5 rounded-lg border border-slate-300 font-bold"
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center border-l border-slate-100">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {final} ({status})
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] font-bold text-slate-500 flex justify-between items-center">
        <span>Showing {filteredStudents.length} of {studentsLength} learners</span>
        {classInfo?.school_year && <span>School Year: {classInfo.school_year}</span>}
      </div>
    </div>
  );
};
