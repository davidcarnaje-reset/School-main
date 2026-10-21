import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  X, Sparkles, Users, BookOpen, Clock, Calendar, 
  MapPin, CheckCircle, AlertTriangle, CheckSquare, Square,
  Check, UserCheck, ChevronRight, Sliders, AlertCircle, RefreshCw, Layers, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DAYS_OPTIONS = [
  { label: 'M', full: 'Monday' },
  { label: 'T', full: 'Tuesday' },
  { label: 'W', full: 'Wednesday' },
  { label: 'Th', full: 'Thursday' },
  { label: 'F', full: 'Friday' },
  { label: 'S', full: 'Saturday' },
];

const AutoScheduleModal = ({ 
  isOpen, 
  onClose, 
  targetGroup, 
  teachers = [], 
  subjects = [], 
  rooms = [], 
  onSuccess,
  showAlert
}) => {
  const { token, API_BASE_URL } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Selected Sections to schedule
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);

  // Tagging State: mapping subject_id -> Array of teacher_ids
  // e.g. { [subjectId]: [teacherId1, teacherId2] }
  const [subjectTeacherMap, setSubjectTeacherMap] = useState({});

  // Schedule Parameters
  const [startTime, setStartTime] = useState("08:00");
  const [dismissalTime, setDismissalTime] = useState("15:00"); // 3:00 PM default dismissal
  const [sessionDuration, setSessionDuration] = useState(45); // 45 mins default for elementary / basic ed
  const [schedulePattern, setSchedulePattern] = useState("alternating"); // "alternating" (MWF & T-Th) | "daily" (Daily M-F)
  const [selectedDays, setSelectedDays] = useState(['M', 'T', 'W', 'Th', 'F']);
  const [deliveryMode, setDeliveryMode] = useState('Face-to-Face');
  const [recessAfterSlot, setRecessAfterSlot] = useState(2);
  const [recessDuration, setRecessDuration] = useState(15);
  const [lunchAfterSlot, setLunchAfterSlot] = useState(4);
  const [lunchDuration, setLunchDuration] = useState(60);
  const [clearExisting, setClearExisting] = useState(true);

  // Filter applicable subjects for this level/group
  const applicableSubjects = useMemo(() => {
    if (!targetGroup) return [];
    const lvl = (targetGroup.grade_level || '').trim().toLowerCase();
    const dept = targetGroup.department || '';
    const progId = targetGroup.program_id;

    return subjects.filter(sub => {
      // 1. Level match - use comma-tokenized exact comparison to avoid false positives (e.g. Grade 1 vs Grade 10)
      const rawSubLvl = sub.grade_level_applicable || '';
      const tokens = rawSubLvl.split(',').map(s => s.trim().toLowerCase());
      const matchesLevel = rawSubLvl === 'All' || tokens.includes(lvl) || rawSubLvl.trim().toLowerCase() === lvl;

      // 2. Program match for College / SHS
      if (progId && sub.program_id) {
        if (parseInt(sub.program_id, 10) !== parseInt(progId, 10)) {
          return false;
        }
      }

      // 3. Department match
      if (dept && dept !== 'All' && sub.level_category && sub.level_category !== 'All') {
        if (dept === 'K-10' && sub.level_category !== 'K-10') return false;
        if (dept === 'SHS' && sub.level_category !== 'SHS') return false;
        if (dept === 'College' && sub.level_category !== 'College') return false;
      }

      return matchesLevel;
    });
  }, [targetGroup, subjects]);

  // Filter active teachers only (strictly exclude Inactive, Archived, Resigned, Terminated)
  const activeTeachers = useMemo(() => {
    return (teachers || []).filter(t => {
      const status = (t.status || '').toLowerCase();
      const empStatus = (t.emp_status || '').toLowerCase();
      if (status === 'inactive' || status === 'archived' || status === 'resigned' || status === 'terminated') return false;
      if (empStatus === 'inactive' || empStatus === 'archived' || empStatus === 'resigned' || empStatus === 'terminated') return false;
      return true;
    });
  }, [teachers]);

  // Calculate dynamic duration preview for Daily mode
  const estimatedDynamicDuration = useMemo(() => {
    if (!startTime || !dismissalTime || applicableSubjects.length === 0) return 45;
    const toMins = (t) => {
      const [h, m] = String(t).split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const startMins = toMins(startTime);
    const endMins = toMins(dismissalTime);
    const totalSpan = Math.max(endMins - startMins, 180);
    let breakMins = 0;
    if (recessAfterSlot && recessAfterSlot < applicableSubjects.length) {
      breakMins += (Number(recessDuration) || 15);
    }
    if (lunchAfterSlot && lunchAfterSlot < applicableSubjects.length) {
      breakMins += (Number(lunchDuration) || 45);
    }
    const netClassMins = Math.max(totalSpan - breakMins, applicableSubjects.length * 25);
    const calculated = Math.floor(netClassMins / applicableSubjects.length);
    return Math.min(Math.max(calculated, 30), 60);
  }, [startTime, dismissalTime, applicableSubjects.length, recessAfterSlot, recessDuration, lunchAfterSlot, lunchDuration]);

  // Initialize selected sections and teacher map when targetGroup changes
  useEffect(() => {
    if (isOpen && targetGroup) {
      const sectionIds = (targetGroup.sections || []).map(s => s.id);
      setSelectedSectionIds(sectionIds);

      // Pre-populate subjectTeacherMap with empty arrays for all applicable subjects
      const initialMap = {};
      applicableSubjects.forEach(sub => {
        initialMap[sub.id] = [];
      });

      // Smart auto-suggestion: if active teacher's assigned_levels or position matches
      activeTeachers.forEach(t => {
        const tDept = (t.department || '').toLowerCase();
        const tLevels = (t.assigned_levels || '').toLowerCase();
        const grpLvl = (targetGroup.grade_level || '').toLowerCase().trim();
        const lvlTokens = tLevels.split(',').map(s => s.trim().toLowerCase());

        // If teacher is associated with this department or level, pre-tag or suggest
        applicableSubjects.forEach(sub => {
          if (lvlTokens.includes(grpLvl) || (targetGroup.department === 'K-10' && tDept.includes('basic ed'))) {
            if (!initialMap[sub.id].includes(t.id)) {
              initialMap[sub.id].push(t.id);
            }
          }
        });
      });

      setSubjectTeacherMap(initialMap);
    }
  }, [isOpen, targetGroup, applicableSubjects, activeTeachers]);

  if (!isOpen || !targetGroup) return null;

  // Toggle section selection
  const toggleSection = (secId) => {
    setSelectedSectionIds(prev => 
      prev.includes(secId) ? prev.filter(id => id !== secId) : [...prev, secId]
    );
  };

  // Toggle all sections
  const toggleAllSections = () => {
    const allIds = (targetGroup.sections || []).map(s => s.id);
    if (selectedSectionIds.length === allIds.length) {
      setSelectedSectionIds([]);
    } else {
      setSelectedSectionIds(allIds);
    }
  };

  // Toggle teacher for a specific subject
  const toggleTeacherForSubject = (subjectId, teacherId) => {
    setSubjectTeacherMap(prev => {
      const currentList = prev[subjectId] || [];
      const updatedList = currentList.includes(teacherId)
        ? currentList.filter(id => id !== teacherId)
        : [...currentList, teacherId];
      return { ...prev, [subjectId]: updatedList };
    });
  };

  // Tag all active teachers for a subject
  const tagAllTeachersForSubject = (subjectId) => {
    const allTeacherIds = activeTeachers.map(t => t.id);
    setSubjectTeacherMap(prev => {
      const current = prev[subjectId] || [];
      const isAllSelected = current.length === allTeacherIds.length;
      return {
        ...prev,
        [subjectId]: isAllSelected ? [] : allTeacherIds
      };
    });
  };

  // Toggle day
  const toggleDay = (dayLabel) => {
    setSelectedDays(prev => 
      prev.includes(dayLabel) ? prev.filter(d => d !== dayLabel) : [...prev, dayLabel]
    );
  };

  // Handle Form Submission
  const handleGenerateSchedule = async () => {
    if (selectedSectionIds.length === 0) {
      if (showAlert) showAlert('error', 'No Sections Selected', 'Please select at least one section to schedule.');
      return;
    }
    if (applicableSubjects.length === 0) {
      if (showAlert) showAlert('error', 'No Subjects Found', `No subjects are configured for ${targetGroup.grade_level}.`);
      return;
    }
    if (selectedDays.length === 0) {
      if (showAlert) showAlert('error', 'Schedule Days Required', 'Please select at least one day for classes.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        grade_level: targetGroup.grade_level,
        department: targetGroup.department,
        program_id: targetGroup.program_id || null,
        section_ids: selectedSectionIds,
        teacher_tags: subjectTeacherMap,
        start_time: startTime,
        dismissal_time: dismissalTime,
        schedule_pattern: schedulePattern,
        session_duration: parseInt(sessionDuration, 10),
        recess_after_slot: parseInt(recessAfterSlot, 10),
        recess_duration: parseInt(recessDuration, 10),
        lunch_after_slot: parseInt(lunchAfterSlot, 10),
        lunch_duration: parseInt(lunchDuration, 10),
        days: selectedDays,
        delivery_mode: deliveryMode,
        room_ids: rooms.map(r => r.id),
        school_year: '2026-2027',
        clear_existing: clearExisting
      };

      const res = await axios.post(`${API_BASE_URL}/registrar/auto_schedule.php`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        const { summary } = res.data;
        if (showAlert) {
          showAlert(
            'success', 
            'Schedule Generated Successfully!',
            `Scheduled ${summary?.total_classes || 0} classes across ${summary?.sections_scheduled || selectedSectionIds.length} sections. (${summary?.assigned_teachers || 0} assigned, ${summary?.waiting_for_teacher || 0} waiting for teacher)`
          );
        }
        if (onSuccess) onSuccess();
        onClose();
      } else {
        if (showAlert) showAlert('error', 'Scheduling Failed', res.data?.message || 'Failed to auto-generate schedule.');
      }
    } catch (err) {
      console.error("Auto-schedule error:", err);
      if (showAlert) showAlert('error', 'Server Error', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalSubjectsCount = applicableSubjects.length;
  const subjectsWithTeachers = applicableSubjects.filter(sub => (subjectTeacherMap[sub.id] || []).length > 0).length;
  const subjectsWaiting = totalSubjectsCount - subjectsWithTeachers;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-100">
        
        {/* MODAL HEADER */}
        <div className="p-7 px-8 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Sparkles size={24} className="text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                  {targetGroup.department}
                </span>
                {targetGroup.program_code && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider">
                    {targetGroup.program_code}
                  </span>
                )}
                <span className="text-white/80 text-xs font-semibold">Auto-Scheduler Module</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Auto-Schedule {targetGroup.grade_level}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={submitting}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer disabled:opacity-50"
          >
            <X size={20}/>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-slate-50/50">
          
          {/* STEP 1: TARGET SECTIONS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Target Sections to Schedule
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    Select sections in {targetGroup.grade_level} that will receive this curriculum timetable.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleAllSections}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {selectedSectionIds.length === (targetGroup.sections || []).length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {(targetGroup.sections || []).map(sec => {
                const isSelected = selectedSectionIds.includes(sec.id);
                return (
                  <div
                    key={sec.id}
                    onClick={() => toggleSection(sec.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm shadow-blue-500/10'
                        : 'border-slate-100 bg-white hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {isSelected ? <Check size={16} /> : <Users size={16} />}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase">{sec.section_name}</p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {sec.adviser_name ? `Adviser: ${sec.adviser_name}` : 'No Adviser'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-100 text-slate-400">
                      Cap: {sec.max_capacity || 40}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: TEACHER SUBJECT TAGGING */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    Teacher-Subject Tagging
                    <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold">
                      {applicableSubjects.length} Curriculum Subjects
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    Tag which teachers can teach each subject. If unassigned or busy, the subject is scheduled as <strong className="text-amber-600 font-black">"Waiting For Teacher"</strong>.
                  </p>
                </div>
              </div>

              {/* Tagging Summary Pill */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <UserCheck size={13} /> {subjectsWithTeachers} Tagged
                </span>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 flex items-center gap-1.5">
                  <Clock size={13} /> {subjectsWaiting} Waiting
                </span>
              </div>
            </div>

            {applicableSubjects.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-black text-slate-600 uppercase">No subjects found for this level</p>
                <p className="text-xs text-slate-400 mt-1">Please add subjects for {targetGroup.grade_level} in Subject Management first.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {applicableSubjects.map(sub => {
                  const taggedTeacherIds = subjectTeacherMap[sub.id] || [];
                  const isAnyTagged = taggedTeacherIds.length > 0;

                  return (
                    <div 
                      key={sub.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        isAnyTagged ? 'border-purple-200 bg-purple-50/20' : 'border-amber-200/80 bg-amber-50/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                            isAnyTagged ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <BookOpen size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 text-sm uppercase">{sub.subject_code}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                {sub.units || 3} units
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500">{sub.subject_description}</p>
                          </div>
                        </div>

                        {/* Tag Status Badge & Quick Action */}
                        <div className="flex items-center gap-2">
                          {isAnyTagged ? (
                            <span className="text-[11px] font-black uppercase text-purple-700 bg-purple-100/70 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <UserCheck size={13} /> {taggedTeacherIds.length} Qualified {taggedTeacherIds.length === 1 ? 'Teacher' : 'Teachers'}
                            </span>
                          ) : (
                            <span className="text-[11px] font-black uppercase text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Clock size={13} /> Waiting For Teacher
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => tagAllTeachersForSubject(sub.id)}
                            className="text-[10px] font-bold text-slate-500 hover:text-purple-600 px-2 py-1 bg-white border border-slate-200 rounded-lg hover:border-purple-200 transition-colors cursor-pointer"
                          >
                            {taggedTeacherIds.length === activeTeachers.length ? 'Clear' : 'Tag All'}
                          </button>
                        </div>
                      </div>

                      {/* TEACHER CHIPS SELECTION */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                        {activeTeachers.map(teacher => {
                          const isTagged = taggedTeacherIds.includes(teacher.id);
                          return (
                            <button
                              type="button"
                              key={teacher.id}
                              onClick={() => toggleTeacherForSubject(sub.id, teacher.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isTagged
                                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                                isTagged ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {isTagged ? <Check size={10} /> : '+' }
                              </div>
                              <span>{teacher.full_name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 3: SCHEDULE TIMETABLE SETTINGS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                3
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Timetable & Slot Configuration
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Configure start times, period durations, break intervals, and class days.
                </p>
              </div>
            </div>

            {/* SCHEDULE DISTRIBUTION PATTERN */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  Weekly Schedule Pattern
                </label>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Piliin kung araw-araw o modular/part-by-part ang subjects
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSchedulePattern('daily')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    schedulePattern === 'daily'
                      ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Dynamic All-Subjects (M - F)
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Lahat Araw-araw
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Lahat ng subjects ay ituturo araw-araw. Awtomatikong pinagkakasiya ang oras (~{estimatedDynamicDuration} mins bawat klase) para matapos lahat bago mag-{dismissalTime}. Staggered per section para walang conflict.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSchedulePattern('alternating')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    schedulePattern === 'alternating'
                      ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-500/20 text-purple-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      Part-by-Part (MWF & T-Th)
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      DepEd Modular
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Major subjects (Math, English, Science, Filipino, MTB) tuwing MWF (3 days); Other subjects (MAPEH, ESP, AP, TLE) tuwing T-Th (2 days). Magaan at maagang natatapos bago mag-tanghali.
                  </p>
                </button>
              </div>

              {schedulePattern === 'daily' && (
                <div className="p-3 bg-blue-100/70 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900 font-semibold">
                  <Sparkles size={16} className="text-blue-600 shrink-0" />
                  <span>
                    <strong>Dynamic Time Fit Active:</strong> Bawat subject ay tatagal ng humigit-kumulang <strong>{estimatedDynamicDuration} minuto</strong> upang <strong>lahat ng {applicableSubjects.length} subjects</strong> ay maipasok sa araw bago mag-<strong>{dismissalTime} dismissal cutoff</strong>.
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
              
              {/* START TIME */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                  Class Start Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 transition-all text-sm"
                  />
                </div>
              </div>

              {/* DISMISSAL / CUTOFF TIME */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    Class Dismissal (End Time)
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Max Cutoff
                  </span>
                </div>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                  <input
                    type="time"
                    value={dismissalTime}
                    onChange={(e) => setDismissalTime(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-amber-500 font-bold text-slate-700 transition-all text-sm"
                  />
                </div>
              </div>

              {/* SESSION DURATION */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                  Duration per Subject
                </label>
                {schedulePattern === 'daily' ? (
                  <div className="px-4 py-3 bg-blue-50/80 border border-blue-200 rounded-2xl font-bold text-blue-900 text-sm flex items-center justify-between">
                    <span>⚡ ~{estimatedDynamicDuration} Minutes</span>
                    <span className="text-[10px] font-black bg-blue-200 text-blue-800 px-2 py-0.5 rounded-md">Auto Dynamic</span>
                  </div>
                ) : (
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 transition-all text-sm cursor-pointer"
                  >
                    <option value={45}>45 Minutes (Elementary/Preschool)</option>
                    <option value={50}>50 Minutes (Standard Period - Recommended)</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={90}>90 Minutes (1.5 Hours - College)</option>
                  </select>
                )}
              </div>

              {/* DELIVERY MODALITY */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                  Delivery Mode
                </label>
                <select
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 transition-all text-sm cursor-pointer"
                >
                  <option value="Face-to-Face">🏫 Face-to-Face (On-Campus)</option>
                  <option value="Online">🌐 Pure Online (Google Meet)</option>
                  <option value="Hybrid">🔄 Hybrid Modality</option>
                </select>
              </div>

              {/* RECESS SETTINGS */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                  Recess Break Interval
                </label>
                <select
                  value={recessAfterSlot}
                  onChange={(e) => setRecessAfterSlot(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 transition-all text-sm cursor-pointer"
                >
                  <option value={0}>No Morning Recess</option>
                  <option value={2}>After 2 Subjects (15 mins Recess)</option>
                  <option value={3}>After 3 Subjects (15 mins Recess)</option>
                </select>
              </div>

              {/* LUNCH BREAK SETTINGS */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                  Lunch Break Interval
                </label>
                <select
                  value={lunchAfterSlot}
                  onChange={(e) => setLunchAfterSlot(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 transition-all text-sm cursor-pointer"
                >
                  <option value={0}>No Lunch Break (Half-Day)</option>
                  <option value={4}>After 4 Subjects (1 Hour Lunch)</option>
                  <option value={5}>After 5 Subjects (1 Hour Lunch)</option>
                </select>
              </div>

              {/* DAYS SELECTION */}
              {schedulePattern === 'daily' && (
                <div className="md:col-span-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                    Class Days for Daily Schedule
                  </label>
                  <div className="flex gap-1.5">
                    {DAYS_OPTIONS.map(d => {
                      const isDaySelected = selectedDays.includes(d.label);
                      return (
                        <button
                          type="button"
                          key={d.label}
                          onClick={() => toggleDay(d.label)}
                          className={`w-9 h-11 rounded-xl font-black text-xs transition-all cursor-pointer ${
                            isDaySelected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                          title={d.full}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* OVERWRITE CHECKBOX */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <input
                type="checkbox"
                id="clearExisting"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="clearExisting" className="text-xs font-bold text-slate-600 cursor-pointer">
                Clear & replace any existing schedule for selected sections in S.Y. 2026-2027
              </label>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-6 px-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Info size={16} className="text-blue-500 shrink-0" />
            <span>
              Generating will create schedule slots for <strong>{selectedSectionIds.length}</strong> sections ({applicableSubjects.length} subjects each).
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerateSchedule}
              disabled={submitting || selectedSectionIds.length === 0 || applicableSubjects.length === 0}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Generating Timetables...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-amber-300" />
                  Generate Schedule Now
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AutoScheduleModal;
