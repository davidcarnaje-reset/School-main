import React from 'react';
import {
  ArrowLeft, GraduationCap, ClipboardCheck, BookOpen, Calendar, Lock,
  RefreshCw, Save, CheckCircle, Unlock, Users, Award, AlertCircle, TrendingUp,
  Search
} from 'lucide-react';

import {
  calculateFinalGrade, getGradeStatus
} from '../../utils/gradingUtils';

// ─── HELPER PARA SA GLASSMORPHISM CONTAINER ──────────────────────────────────
const getGlassStyle = () => ({
  background: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.05)',
});

// ─── SKELETON COMPONENT ─────────────────────────────────────────────────────
export const GradeManagementSkeleton = ({ themeColor }) => {
  return (
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
      
      {/* HEADER SKELETON */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[1.5rem] w-full" style={getGlassStyle()}>
        <div className="flex flex-row items-start sm:items-center gap-3 sm:gap-5 w-full">
          <div className="gm-sk w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 w-full">
            <div className="gm-sk w-3/4 h-5 sm:h-7 max-w-xs" />
            <div className="flex flex-wrap gap-2">
              <div className="gm-sk w-16 h-4 sm:h-6 rounded-full" />
              <div className="gm-sk w-20 h-4 sm:h-6 rounded-full" />
              <div className="gm-sk w-14 h-4 sm:h-6 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="gm-sk col-span-1 sm:w-28 h-8 sm:h-10 rounded-xl" />
          <div className="gm-sk col-span-1 sm:w-28 h-8 sm:h-10 rounded-xl" />
          <div className="gm-sk col-span-2 sm:col-span-1 sm:w-36 h-8 sm:h-10 rounded-xl" />
        </div>
      </div>

      {/* STATS CARDS SKELETON */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="flex flex-col items-center sm:flex-row sm:items-center gap-2 p-3 sm:p-4 rounded-xl sm:rounded-[1.5rem] w-full" style={getGlassStyle()}>
            <div className="gm-sk w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shrink-0" />
            <div className="flex flex-col items-center sm:items-start gap-1.5 w-full">
              <div className="gm-sk w-full sm:w-16 h-2 sm:h-3" />
              <div className="gm-sk w-3/4 sm:w-10 h-4 sm:h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* TABLE SKELETON */}
      <div className="flex flex-col rounded-2xl sm:rounded-[1.5rem] w-full overflow-hidden" style={getGlassStyle()}>
        <div className="p-3 sm:p-6 border-b border-black/5 flex flex-col gap-3 w-full">
          <div className="gm-sk w-full h-8 sm:h-10 rounded-xl" />
        </div>
        <div className="w-full bg-white/30 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-black/5">
                <th className="p-2"><div className="gm-sk w-full h-2" /></th>
                <th className="p-2"><div className="gm-sk w-full h-2" /></th>
                <th className="p-2"><div className="gm-sk w-full h-2" /></th>
                <th className="p-2"><div className="gm-sk w-full h-2" /></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map(n => (
                <tr key={n} className="border-b border-black/5">
                  <td className="p-2">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="gm-sk w-full h-2" />
                      <div className="gm-sk w-2/3 h-1.5" />
                    </div>
                  </td>
                  <td className="p-2"><div className="gm-sk w-full h-5 sm:h-7 rounded-lg" /></td>
                  <td className="p-2"><div className="gm-sk w-full h-5 sm:h-7 rounded-lg" /></td>
                  <td className="p-2"><div className="gm-sk w-full h-3 sm:h-5 rounded-full" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── HEADER COMPONENT ────────────────────────────────────────────────────────
export const GradeHeader = ({
  displaySubject, displayGradeLevel, displaySection, systemLabel, isK12,
  selectedQuarter, setSelectedQuarter, setSearchParams, locationState,
  themeColor, isSubmitted, handleGoBack, syncFromActivities, saveAllGrades,
  submitFinalGrades, requestEditPermission, isSaving, isServerOffline, isRequesting
}) => (
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-6 p-3 sm:p-6 lg:p-8 mb-3 sm:mb-6 rounded-xl sm:rounded-[1.5rem] w-full" style={getGlassStyle()}>
    
    <div className="flex flex-row items-start sm:items-center gap-2 sm:gap-6 w-full lg:w-auto">
      <button 
        onClick={handleGoBack} 
        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all border border-slate-200 shrink-0 mt-0.5 sm:mt-0 shadow-sm"
      >
        <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
      
      <div className="flex flex-col w-full min-w-0">
        <h1 className="text-base sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-1 break-words line-clamp-2">
          {displaySubject}
        </h1>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <span className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/80 border border-slate-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-bold text-slate-600 shrink-0">
            <GraduationCap size={10} className="sm:w-3 sm:h-3" /> {displayGradeLevel}
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/80 border border-slate-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-bold text-slate-600 shrink-0">
            <ClipboardCheck size={10} className="sm:w-3 sm:h-3" /> Sec: {displaySection}
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5 border px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-black shrink-0" style={{ background: `${themeColor}15`, borderColor: `${themeColor}30`, color: themeColor }}>
            <BookOpen size={10} className="sm:w-3 sm:h-3" /> {systemLabel}
          </span>
          
          {/* Quarter/Period Selector */}
          {isK12 ? (
            <div className="flex flex-wrap bg-white/50 p-0.5 sm:p-1 rounded-full border border-black/5 w-full sm:w-auto mt-1 sm:mt-0">
              {[1, 2, 3, 4].map(q => (
                <button
                  key={q}
                  onClick={() => { setSelectedQuarter(q); setSearchParams({ quarter: q }, { replace: true, state: locationState }); }}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-bold transition-all shrink-0 ${selectedQuarter === q ? 'shadow-sm text-white' : 'text-slate-500 hover:bg-white/50'}`}
                  style={selectedQuarter === q ? { background: themeColor } : {}}
                >
                  {selectedQuarter === q && <Calendar size={10} className="sm:w-3 sm:h-3" />} Q{q}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap bg-white/50 p-0.5 sm:p-1 rounded-full border border-black/5 w-full sm:w-auto mt-1 sm:mt-0">
              {[
                { value: 1, label: 'Prelim', short: 'P' },
                { value: 2, label: 'Midterm', short: 'M' },
                { value: 3, label: 'Finals', short: 'F' }
              ].map(period => (
                <button
                  key={period.value}
                  onClick={() => { setSelectedQuarter(period.value); setSearchParams({ period: period.value }, { replace: true, state: locationState }); }}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-bold transition-all shrink-0 ${selectedQuarter === period.value ? 'shadow-sm text-white' : 'text-slate-500 hover:bg-white/50'}`}
                  style={selectedQuarter === period.value ? { background: themeColor } : {}}
                >
                  {selectedQuarter === period.value && <Calendar size={10} className="sm:w-3 sm:h-3" />}
                  <span className="hidden sm:inline">{period.label}</span>
                  <span className="sm:hidden">{period.short}</span>
                </button>
              ))}
            </div>
          )}
          
          {isSubmitted && (
            <span className="flex items-center gap-1 sm:gap-1.5 bg-red-100 border border-red-200 text-red-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-black shadow-sm mt-1 sm:mt-0 shrink-0">
              <Lock size={10} className="sm:w-3 sm:h-3" /> LOCKED
            </span>
          )}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto mt-1 lg:mt-0">
      {!isSubmitted ? (
        <>
          <button 
            className="col-span-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[10px] sm:text-sm bg-white/80 border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
            onClick={syncFromActivities} disabled={isSaving || isServerOffline}
          >
            <RefreshCw size={12} className={`shrink-0 sm:w-4 sm:h-4 ${isSaving ? 'animate-spin' : ''}`} /> 
            <span className="sm:inline">Sync</span>
          </button>
          <button 
            className="col-span-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[10px] sm:text-sm bg-white/80 border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
            onClick={saveAllGrades} disabled={isSaving || isServerOffline}
          >
            <Save size={12} className="shrink-0 sm:w-4 sm:h-4" /> 
            <span className="sm:inline">Save</span>
          </button>
          <button 
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-[10px] sm:text-sm text-white shadow-md hover:brightness-110 transition-all disabled:opacity-50"
            style={{ background: themeColor }}
            onClick={submitFinalGrades} disabled={isSaving || isServerOffline}
          >
            <CheckCircle size={12} className="shrink-0 sm:w-[18px] sm:h-[18px]" /> 
            <span className="sm:inline">Submit</span>
          </button>
        </>
      ) : (
        <button 
          className="col-span-2 sm:w-auto flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-[10px] sm:text-sm bg-amber-500 text-white shadow-md hover:bg-amber-600 transition-all disabled:opacity-50"
          onClick={requestEditPermission} disabled={isRequesting || isServerOffline}
        >
          <Unlock size={12} className="shrink-0 sm:w-[18px] sm:h-[18px]" /> 
          <span className="sm:inline">Request Unlock</span>
        </button>
      )}
    </div>
  </div>
);

export const GradeStats = ({ studentsLength, stats, passRate, themeColor }) => (
  <div className="grid grid-cols-4 gap-1 sm:gap-3 mb-3 sm:mb-4 w-full">
    {/* Total Students */}
    <div className="flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg sm:rounded-xl w-full" style={getGlassStyle()}>
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase">Total</span>
        <span className="text-sm sm:text-base font-black text-slate-800">{studentsLength}</span>
      </div>
    </div>

    {/* Passed */}
    <div className="flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg sm:rounded-xl w-full" style={getGlassStyle()}>
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
        <Award className="w-3 h-3 sm:w-4 sm:h-4" />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase">Pass</span>
        <span className="text-sm sm:text-base font-black text-slate-800">{stats.passed}</span>
      </div>
    </div>

    {/* Failed */}
    <div className="flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg sm:rounded-xl w-full" style={getGlassStyle()}>
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase">Fail</span>
        <span className="text-sm sm:text-base font-black text-slate-800">{stats.failed}</span>
      </div>
    </div>

    {/* Pass Rate */}
    <div className="flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg sm:rounded-xl w-full" style={getGlassStyle()}>
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
      </div>
      <div className="flex flex-col items-center w-full px-1">
        <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase">Rate</span>
        <span className="text-sm sm:text-base font-black text-slate-800">{passRate}%</span>
        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-0.5">
          <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${passRate}%` }} />
        </div>
      </div>
    </div>
  </div>
);

export const GradeTable = ({
  themeColor, categories, actCount, isK12, isSubmitted, studentsLength,
  filteredStudents, handleInputChange, handleInputBlur, currentLevel,
  searchQuery, setSearchQuery, filterStatus, setFilterStatus, classInfo
}) => (
  <div className="flex flex-col rounded-xl sm:rounded-[1.5rem] w-full overflow-hidden" style={getGlassStyle()}>
    
    {/* TOOLBAR */}
    <div className="p-2 sm:p-4 border-b border-black/5 flex flex-col sm:flex-row justify-between gap-2 w-full">
      <div className="relative w-full sm:max-w-[200px] flex items-center bg-white/60 border border-slate-200 rounded-lg px-2 py-1.5 shadow-inner">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          className="w-full bg-transparent border-none outline-none ml-2 text-xs font-bold text-slate-700 placeholder-slate-400" 
        />
      </div>

      <div className="flex w-full sm:w-auto items-center gap-1 bg-white/50 p-1 rounded-lg border border-slate-200">
        {['All', 'Passed', 'Failed'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilterStatus(f)}
            className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-black transition-all text-center whitespace-nowrap`}
            style={{
              background: filterStatus === f ? 'white' : 'transparent',
              color: filterStatus === f ? themeColor : '#64748b',
              boxShadow: filterStatus === f ? '0 1px 4px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            {f === 'All' ? 'All' : f === 'Passed' ? 'Pass' : 'Fail'}
          </button>
        ))}
      </div>
    </div>

    {/* TABLE - Fixed width, no horizontal scroll */}
    <div className="w-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed', width: '100%' }}>
        <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm">
          <tr className="border-b border-black/5">
            {/* Student Column */}
            <th className="p-2 text-left text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{ width: '35%' }}>
              <div className="flex items-center gap-1">
                <Users size={10} className="hidden sm:block shrink-0" style={{ color: themeColor }} /> 
                <span className="truncate">Student</span>
              </div>
            </th>
            
            {/* Category Columns - WITH LOCK ICONS RESTORED */}
            {categories.map(cat => {
              const isAutoCalculated = cat.key === 'written' || cat.key === 'exam';
              const isLocked = isAutoCalculated || (actCount?.[cat.key] > 0);
              return (
                <th key={cat.key} className="p-1 text-center border-l border-black/5 text-[7px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{ width: '15%' }}>
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {/* 🟢 LOCK ICON RESTORED */}
                      {isLocked && <Lock size={8} className="text-red-400 shrink-0 hidden sm:block" />}
                      <span className="sm:hidden truncate">
                        {cat.key === 'written' ? 'WW' : cat.key === 'performance' ? 'PT' : 'EX'}
                      </span>
                      <span className="hidden sm:inline truncate">{cat.label}</span>
                    </div>
                    <span className="mt-0.5 text-[6px] sm:text-[9px] font-black px-0.5 py-0.5 rounded-full inline-block whitespace-nowrap" style={{ color: themeColor, background: `${themeColor}15` }}>
                      {cat.percentage}
                    </span>
                  </div>
                </th>
              );
            })}
            
            {/* Final Column */}
            <th className="p-1 text-center border-l border-black/5 text-[7px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{ width: '10%' }}>
              <span className="hidden sm:inline">Final</span>
              <span className="sm:hidden">Fin</span>
            </th>
            
            {/* Remarks Column */}
            <th className="p-1 text-center border-l border-black/5 text-[7px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{ width: '10%' }}>
              <span className="hidden sm:inline">Remarks</span>
              <span className="sm:hidden">Rem</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length === 0 ? (
            <tr>
              <td colSpan={categories.length + 3} className="text-center py-8 px-2 text-slate-500 font-bold text-[9px] sm:text-sm">
                {studentsLength === 0 ? 'No students enrolled.' : 'No matches found.'}
              </td>
            </tr>
          ) : filteredStudents.map((student, idx) => {
            const final = calculateFinalGrade(student, currentLevel);
            const status = getGradeStatus(final, currentLevel);
            const passed = status === 'Passed';
            
            return (
              <tr key={student.id ?? idx} className="border-b border-black/5 hover:bg-white/50 transition-colors">
                {/* Student Info */}
                <td className="p-2" style={{ width: '35%' }}>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="hidden sm:flex w-5 h-5 sm:w-6 sm:h-6 rounded-full text-white items-center justify-center font-black text-[7px] sm:text-[9px] shrink-0 shadow-sm" style={{ background: themeColor }}>
                      {(student.name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0 overflow-hidden">
                      <span className="font-bold text-slate-800 text-[8px] sm:text-[11px] leading-tight truncate">{student.name}</span>
                      <span className="font-semibold text-slate-400 text-[6px] sm:text-[8px] truncate">{student.student_number}</span>
                    </div>
                  </div>
                </td>

                {categories.map(cat => {
                  const isAutoCalculated = cat.key === 'written' || cat.key === 'exam';
                  const isLocked = isAutoCalculated || (actCount?.[cat.key] > 0);
                  const isEditable = !isSubmitted && !isAutoCalculated;
                  
                  return (
                    <td key={cat.key} className="p-1 text-center border-l border-black/5" style={{ width: '15%' }}>
                      {isLocked ? (
                        <div className="flex justify-center items-center gap-0.5 px-0.5 py-1 rounded bg-slate-100/80 border border-slate-200 text-[8px] sm:text-[10px] font-bold text-slate-600 mx-auto">
                          {/* 🟢 LOCK ICON IN LOCKED CELLS */}
                          {isAutoCalculated && <Lock size={8} className="text-slate-400 shrink-0 hidden sm:block" />}
                          <span className="truncate">{student[cat.key] ?? 0}</span>
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          inputMode="numeric" 
                          pattern="[0-9]*"
                          placeholder="0" 
                          disabled={!isEditable}
                          value={student[cat.key] === 0 ? '' : (student[cat.key] ?? '')} 
                          onChange={e => handleInputChange(student.id, cat.key, e.target.value)} 
                          onBlur={e => handleInputBlur(student.id, cat.key, e.target.value)} 
                          className="w-full text-center p-1 rounded text-[8px] sm:text-[10px] font-bold outline-none transition-all shadow-inner border mx-auto"
                          style={{
                            maxWidth: '45px',
                            background: !isEditable ? '#f1f5f9' : '#ffffff',
                            borderColor: !isEditable ? '#e2e8f0' : '#cbd5e1',
                            color: !isEditable ? '#94a3b8' : '#1e293b',
                            cursor: !isEditable ? 'not-allowed' : 'text'
                          }}
                        />
                      )}
                    </td>
                  );
                })}
                
                {/* Final Grade */}
                <td className="p-1 text-center border-l border-black/5" style={{ width: '10%' }}>
                  <span className={`text-[8px] sm:text-[10px] font-black ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                    {final}
                  </span>
                </td>
                
                {/* Remarks */}
                <td className="p-1 text-center border-l border-black/5" style={{ width: '10%' }}>
                  <span className={`inline-block px-1 py-0.5 rounded-full text-[6px] sm:text-[8px] font-black tracking-wider uppercase shadow-sm border
                    ${passed ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {status === 'Passed' ? 'P' : 'F'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    
    {/* Footer */}
    <div className="p-2 sm:p-3 bg-slate-50/50 border-t border-black/5 text-[8px] sm:text-[10px] font-bold text-slate-400 flex flex-row justify-between items-center">
      <span>{filteredStudents.length}/{studentsLength} students</span>
      {classInfo?.school_year && <span>SY {classInfo.school_year}</span>}
    </div>
  </div>
);