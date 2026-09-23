import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, CheckCircle, RefreshCw, Clock, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DAYS_MAPPING = [
  { label: 'M', full: 'Monday' }, 
  { label: 'T', full: 'Tuesday' }, 
  { label: 'W', full: 'Wednesday' }, 
  { label: 'Th', full: 'Thursday' }, 
  { label: 'F', full: 'Friday' }, 
  { label: 'S', full: 'Saturday' },
];

const convertTo24Hour = (timeStr) => {
  if (!timeStr) return '';
  const ampmMatch = timeStr.match(/(AM|PM)/i);
  if (!ampmMatch) {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].substring(0, 2).padStart(2, '0');
      return `${h}:${m}`;
    }
    return '';
  }
  const isPM = /PM/i.test(ampmMatch[0]);
  const cleanTime = timeStr.replace(/(AM|PM)/i, '').trim();
  let [hours, minutes] = cleanTime.split(':');
  let h = parseInt(hours, 10);
  let m = minutes ? minutes.substring(0, 2) : '00';
  if (isPM && h < 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const parseScheduleString = (scheduleStr) => {
  if (!scheduleStr) return { days: [], startTime: '08:00', endTime: '09:00' };

  const str = String(scheduleStr).trim();
  const timeMatch = str.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i);

  let startTime24 = '08:00';
  let endTime24 = '09:00';
  let daysPart = str;

  if (timeMatch) {
    startTime24 = convertTo24Hour(timeMatch[1].trim()) || '08:00';
    endTime24 = convertTo24Hour(timeMatch[2].trim()) || '09:00';
    daysPart = str.substring(0, timeMatch.index).trim();
  }

  const recognizedDays = [];
  if (daysPart.includes(',')) {
    daysPart.split(',').map(d => d.trim()).forEach(d => {
      if (['M', 'T', 'W', 'Th', 'F', 'S'].includes(d) && !recognizedDays.includes(d)) {
        recognizedDays.push(d);
      }
    });
  } else {
    let remaining = daysPart.replace(/\s+/g, '');
    let i = 0;
    while (i < remaining.length) {
      if (remaining.substring(i, i + 2) === 'Th') {
        if (!recognizedDays.includes('Th')) recognizedDays.push('Th');
        i += 2;
      } else {
        const char = remaining[i];
        if (['M', 'T', 'W', 'F', 'S'].includes(char)) {
          if (!recognizedDays.includes(char)) recognizedDays.push(char);
        }
        i += 1;
      }
    }
  }

  return {
    days: recognizedDays,
    startTime: startTime24,
    endTime: endTime24
  };
};

const formatTime12h = (time) => {
  if (!time) return '';
  let [h, m] = time.split(':');
  let hours = parseInt(h, 10);
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${m ? m.substring(0, 2) : '00'} ${ampm}`;
};

const EditClassAssignModal = ({ isOpen, onClose, assignmentData, teachers, subjects, sections, rooms, onSuccess, showAlert }) => {
    const { token, API_BASE_URL } = useAuth();
    const [saveLoading, setSaveLoading] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedDays, setSelectedDays] = useState([]);

    // Populate form kapag bumukas ang modal
    useEffect(() => {
        if (isOpen && assignmentData) {
            let initialDays = [];
            let initialStart = '08:00';
            let initialEnd = '09:00';

            // Check if days / times are already provided directly
            if (assignmentData.days && assignmentData.start_time && assignmentData.end_time) {
                initialDays = assignmentData.days.split(',').map(d => d.trim()).filter(Boolean);
                initialStart = assignmentData.start_time.slice(0, 5);
                initialEnd = assignmentData.end_time.slice(0, 5);
            } else if (assignmentData.schedule) {
                // Parse fallback from schedule text
                const parsed = parseScheduleString(assignmentData.schedule);
                initialDays = parsed.days;
                initialStart = parsed.startTime;
                initialEnd = parsed.endTime;
            }

            setSelectedDays(initialDays);
            setFormData({
                id: assignmentData.id,
                teacher_id: assignmentData.teacher_id || '',
                subject_id: assignmentData.subject_id || '',
                section_id: assignmentData.section_id || '',
                room_id: assignmentData.room_id || '',
                days: initialDays.join(','),
                start_time: initialStart,
                end_time: initialEnd,
                schedule: assignmentData.schedule || (initialDays.length > 0 ? `${initialDays.join('')} ${formatTime12h(initialStart)} - ${formatTime12h(initialEnd)}` : '')
            });
        }
    }, [isOpen, assignmentData]);

    const updateScheduleString = useCallback((daysArr, start, end) => {
        if (daysArr.length === 0) {
            setFormData(prev => ({ ...prev, schedule: '', days: '', start_time: start, end_time: end }));
            return;
        }
        const dayDataStr = daysArr.join(','); 
        const displayDayStr = daysArr.join(''); 
        const scheduleStr = `${displayDayStr} ${formatTime12h(start)} - ${formatTime12h(end)}`;
        setFormData(prev => ({ ...prev, schedule: scheduleStr, days: dayDataStr, start_time: start, end_time: end }));
    }, []);

    const toggleDay = (dayLabel) => {
        const newDays = selectedDays.includes(dayLabel) 
            ? selectedDays.filter(d => d !== dayLabel) 
            : [...selectedDays, dayLabel];
        setSelectedDays(newDays);
        updateScheduleString(newDays, formData.start_time, formData.end_time);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (selectedDays.length === 0) return showAlert('error', 'Missing Information', 'Please select schedule days.');
        if (formData.start_time >= formData.end_time) return showAlert('error', 'Invalid Schedule', 'End Time must be after Start Time.');

        setSaveLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/registrar/update_class_assign.php`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                showAlert('success', 'Updated', res.data.message);
                onSuccess(); // I-refresh ang main table
                onClose();
            } else {
                showAlert('error', 'Error', res.data.message);
            }
        } catch (error) {
            showAlert('error', 'Error', 'Server error while updating.');
        } finally {
            setSaveLoading(false);
        }
    };

    if (!isOpen) return null;

    // Filter subjects base sa piniling section
    const currentSection = sections.find(s => s.id === parseInt(formData.section_id));
    const eligibleSubjects = subjects.filter(sub => {
        if (!currentSection) return true; // Show all if no section selected
        const secGrade = String(currentSection.grade_level || "").trim().toLowerCase();
        const subGrade = String(sub.grade_level_applicable || "").trim().toLowerCase();
        const matchesProg = !currentSection.program_id || parseInt(sub.program_id) === parseInt(currentSection.program_id) || !sub.program_id;
        return matchesProg && (secGrade === subGrade);
    });

    const isScheduleModified = assignmentData?.schedule && formData.schedule && assignmentData.schedule.trim() !== formData.schedule.trim();

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <form onSubmit={handleSave} className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Edit Class Record</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Update Master Schedule & Assignment</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-3 bg-white text-slate-300 hover:text-red-500 rounded-2xl shadow-sm transition-all"><X size={20}/></button>
                </div>
                
                <div className="p-10 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-2 gap-6">
                        {/* TEACHER */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Teacher</label>
                            <select required value={formData.teacher_id} onChange={e=>setFormData({...formData, teacher_id: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500">
                                <option value="">-- Select Faculty Member --</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                            </select>
                        </div>

                        {/* SECTION */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Section</label>
                            <select required value={formData.section_id} onChange={e=>setFormData({...formData, section_id: e.target.value, subject_id: ''})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500">
                                <option value="">-- Select Section --</option>
                                {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.section_name} ({sec.grade_level})</option>)}
                            </select>
                        </div>

                        {/* SUBJECT */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Load</label>
                            <select required disabled={!formData.section_id} value={formData.subject_id} onChange={e=>setFormData({...formData, subject_id: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 disabled:opacity-50">
                                <option value="">-- Select Eligible Subject --</option>
                                {eligibleSubjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_description}</option>)}
                            </select>
                        </div>

                        {/* ROOM */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room / Venue</label>
                            <select required value={formData.room_id} onChange={e=>setFormData({...formData, room_id: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500">
                                <option value="">-- Select Academic Venue --</option>
                                {rooms.map(r => {
                                    const roomLabel = (r.room_name?.trim().toLowerCase() === 'room' && r.room_number)
                                      ? `Room ${r.room_number}`
                                      : `${r.room_name}${r.room_number ? ` (${r.room_number})` : ''}`;
                                    return <option key={r.id} value={r.id}>{roomLabel} ({r.room_type})</option>;
                                })}
                            </select>
                        </div>

                        {/* SCHEDULE CONFIGURATION BOX */}
                        <div className="col-span-2 bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Schedule Configuration</label>
                                <span className="text-[10px] font-bold text-amber-700/70">
                                    {selectedDays.length > 0 ? `${selectedDays.length} day(s) configured` : 'No days configured'}
                                </span>
                            </div>

                            {/* CURRENT ACTIVE SCHEDULE BANNER */}
                            <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black shadow-inner">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider block">Current Schedule</span>
                                        <span className="text-xs font-black text-slate-700 tracking-tight">
                                            {assignmentData?.schedule || 'No schedule assigned'}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black px-3 py-1 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 uppercase tracking-wider">
                                    Existing
                                </span>
                            </div>

                            {/* DAYS SELECTION */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Configure Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_MAPPING.map(day => {
                                        const isSelected = selectedDays.includes(day.label);
                                        return (
                                            <button 
                                                key={day.label} 
                                                type="button" 
                                                onClick={() => toggleDay(day.label)} 
                                                className={`w-12 h-12 rounded-xl font-black text-xs transition-all border ${
                                                    isSelected 
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-105' 
                                                        : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'
                                                }`}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TIME PICKERS */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        value={formData.start_time || '08:00'} 
                                        onChange={(e) => {
                                            const newStart = e.target.value;
                                            setFormData(prev => ({ ...prev, start_time: newStart })); 
                                            updateScheduleString(selectedDays, newStart, formData.end_time);
                                        }} 
                                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-amber-500 shadow-sm" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">End Time</label>
                                    <input 
                                        type="time" 
                                        value={formData.end_time || '09:00'} 
                                        onChange={(e) => {
                                            const newEnd = e.target.value;
                                            setFormData(prev => ({ ...prev, end_time: newEnd })); 
                                            updateScheduleString(selectedDays, formData.start_time, newEnd);
                                        }} 
                                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-amber-500 shadow-sm" 
                                    />
                                </div>
                            </div>

                            {/* NEW / CONFIGURED SCHEDULE PREVIEW */}
                            <div className={`p-3.5 bg-white rounded-xl text-center border-2 border-dashed ${isScheduleModified ? 'border-amber-400 bg-amber-50/30' : 'border-amber-200'}`}>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">
                                        {isScheduleModified ? 'New Configured Schedule:' : 'Configured Schedule:'}
                                    </span>
                                    <span className="text-xs font-black text-amber-700 uppercase tracking-tight">
                                        {formData.schedule || 'None (Select Days & Time)'}
                                    </span>
                                </div>
                                {isScheduleModified && (
                                    <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-widest">
                                        ● Changes detected — will be updated upon saving
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-8 py-4 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                    <button type="submit" disabled={saveLoading} className="bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2">
                        {saveLoading ? <RefreshCw className="animate-spin" size={16}/> : <CheckCircle size={16}/>} Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditClassAssignModal;