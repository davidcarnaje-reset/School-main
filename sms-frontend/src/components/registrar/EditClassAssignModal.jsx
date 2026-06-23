import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // Ayusin ang path kung kailangan

const DAYS_MAPPING = [
  { label: 'M' }, { label: 'T' }, { label: 'W' }, 
  { label: 'Th' }, { label: 'F' }, { label: 'S' },
];

const EditClassAssignModal = ({ isOpen, onClose, assignmentData, teachers, subjects, sections, rooms, onSuccess, showAlert }) => {
    const { token, API_BASE_URL } = useAuth();
    const [saveLoading, setSaveLoading] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedDays, setSelectedDays] = useState([]);

    // Populate form kapag bumukas ang modal
    useEffect(() => {
        if (isOpen && assignmentData) {
            setFormData({
                id: assignmentData.id,
                teacher_id: assignmentData.teacher_id || '',
                subject_id: assignmentData.subject_id || '',
                section_id: assignmentData.section_id || '',
                room_id: assignmentData.room_id || '',
                days: assignmentData.days || '',
                start_time: assignmentData.start_time || '08:00:00',
                end_time: assignmentData.end_time || '09:00:00',
                schedule: assignmentData.schedule || ''
            });
            // Gawing array yung days (Hal: "M,W,F" -> ['M', 'W', 'F'])
            setSelectedDays(assignmentData.days ? assignmentData.days.split(',') : []);
        }
    }, [isOpen, assignmentData]);

    const formatTime12h = (time) => {
        if (!time) return '';
        let [h, m] = time.split(':');
        let ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    };

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
        const newDays = selectedDays.includes(dayLabel) ? selectedDays.filter(d => d !== dayLabel) : [...selectedDays, dayLabel];
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

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <form onSubmit={handleSave} className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Edit Class Record</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Update Master Schedule</p>
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
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.room_name} ({r.room_type})</option>)}
                            </select>
                        </div>

                        {/* SCHEDULE CONFIG */}
                        <div className="col-span-2 bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 space-y-4">
                            <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Schedule Configuration</label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS_MAPPING.map(day => (
                                    <button key={day.label} type="button" onClick={() => toggleDay(day.label)} className={`w-12 h-12 rounded-xl font-black text-xs transition-all border ${selectedDays.includes(day.label) ? 'bg-amber-500 text-white border-amber-500 shadow-lg scale-105' : 'bg-white text-slate-400 border-slate-200'}`}>
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <input type="time" value={formData.start_time} onChange={(e) => {setFormData({...formData, start_time: e.target.value}); updateScheduleString(selectedDays, e.target.value, formData.end_time);}} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-amber-500" />
                                <input type="time" value={formData.end_time} onChange={(e) => {setFormData({...formData, end_time: e.target.value}); updateScheduleString(selectedDays, formData.start_time, e.target.value);}} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-amber-500" />
                            </div>
                            <div className="p-3 bg-white rounded-xl text-center border-2 border-dashed border-amber-200">
                                <p className="text-xs font-black text-amber-600 uppercase tracking-tighter">New Schedule: {formData.schedule || 'None'}</p>
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