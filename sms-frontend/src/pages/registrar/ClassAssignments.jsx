import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Layers, Plus, Search, BookOpen, Clock, 
  MapPin, Users, Edit, Trash2, X, CheckCircle, RefreshCw, AlertTriangle, Presentation, ListChecks, Filter
} from 'lucide-react';
import EditClassAssignModal from '../../components/registrar/EditClassAssignModal'; // 🛑 NEW IMPORT
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/shared/CustomAlert'; // Siguraduhin na tama ang path

const DAYS_MAPPING = [
  { label: 'M', full: 'Monday' }, { label: 'T', full: 'Tuesday' },
  { label: 'W', full: 'Wednesday' }, { label: 'Th', full: 'Thursday' },
  { label: 'F', full: 'Friday' }, { label: 'S', full: 'Saturday' },
];

const ClassAssignments = () => {
  const { branding, token, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // 🛑 ARCHITECT ADDITION: Filter State
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false); // ARCHITECT: New Bulk Modal State
  // Ilagay ito sa ilalim ng existing states mo (e.g., sa ilalim ng showBulkModal)
  const [editModalConfig, setEditModalConfig] = useState({ show: false, data: null });
  const [deleteModalConfig, setDeleteModalConfig] = useState({ show: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Data States
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]); 
  const [rooms, setRooms] = useState([]); 
  const [editId, setEditId] = useState(null);
  
  // Single Assign States
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");

  const initialForm = {
    teacher_id: '',
    subject_id: '',
    section_id: '', 
    grade_level: '', 
    room_id: '',    
    schedule: '',
    days: '',       
    start_time: '', 
    end_time: '',   
    school_year: '2026-2027',
  };
  const [formData, setFormData] = useState(initialForm);

  // Bulk Assign States
  const [bulkSectionId, setBulkSectionId] = useState('');
  const [bulkDrafts, setBulkDrafts] = useState([]); // Array to hold multiple class assignments

  // --- FETCH DATA ---
  const fetchAssignmentData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/class_assign_data.php`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setTeachers(res.data.teachers || []);
        setSubjects(res.data.subjects || []);
        setAssignments(res.data.assignments || []);
        setSections(res.data.sections || []); 
        setRooms(res.data.rooms || []); 
      }
    } catch (error) { console.error("Error fetching data:", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAssignmentData(); }, []);

  // --- HELPER: FORMAT TIME ---
  const formatTime12h = (time) => {
    if (!time) return '';
    let [h, m] = time.split(':');
    let ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  // --- SINGLE ASSIGN LOGIC ---
  const updateScheduleString = useCallback((days, start, end) => {
    if (days.length === 0) {
      setFormData(prev => ({ ...prev, schedule: '', days: '', start_time: '', end_time: '' }));
      return;
    }
    const dayDataStr = days.join(','); 
    const displayDayStr = days.join(''); 
    const scheduleStr = `${displayDayStr} ${formatTime12h(start)} - ${formatTime12h(end)}`;
    
    setFormData(prev => ({ 
        ...prev, schedule: scheduleStr, days: dayDataStr, start_time: start, end_time: end 
    }));
  }, []);

  const toggleDay = (dayLabel) => {
    const newDays = selectedDays.includes(dayLabel) ? selectedDays.filter(d => d !== dayLabel) : [...selectedDays, dayLabel];
    setSelectedDays(newDays);
    updateScheduleString(newDays, startTime, endTime);
  };

const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData(initialForm);
    setSelectedDays([]);
    setStartTime("08:00");
    setEndTime("09:00");
  };


  // CUSTOM ALERT STATE
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'info', // 'success', 'error', 'warning', 'info'
    title: '',
    message: ''
  });

  // Helper function para madaling tawagin
  const showAlert = (type, title, message) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.days || !formData.start_time || !formData.end_time) {
        showAlert('error', 'Missing Information', 'Please configure the schedule days and time.');
        return;
    }

    if (formData.start_time >= formData.end_time) {
        showAlert('error', 'Invalid Schedule', 'The End Time must be AFTER the Start Time.');
        return;
    }
    if (formData.start_time < "06:00" || formData.end_time > "22:00") {
        showAlert('error', 'Out of Bounds', 'Classes must be scheduled between 6:00 AM and 10:00 PM only.');
        return;
    }

    setSaveLoading(true);
    const endpoint = editId ? 'update_class_assign.php' : 'add_class_assign.php';
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/${endpoint}`, { ...formData, id: editId }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setShowModal(false); setFormData(initialForm); setSelectedDays([]); fetchAssignmentData();
      } else { showAlert('error', 'Error', res.data.message); }
    } catch (error) { showAlert('error', 'Server Error', 'An error occurred while saving the assignment.'); } finally { setSaveLoading(false); }
  };

  // --- BULK ASSIGN LOGIC (THE DRAFTING BOARD) ---
  const handleBulkSectionSelect = (e) => {
      const sectionId = e.target.value;
      setBulkSectionId(sectionId);
      
      if (!sectionId) {
          setBulkDrafts([]);
          return;
      }

      const selectedSection = sections.find(sec => sec.id === parseInt(sectionId));
      if (!selectedSection) return;

      const sectionGrade = String(selectedSection.grade_level || "").trim().toLowerCase();

      // ARCHITECT: Ginamit natin yung strict filter natin dito!
      const eligibleSubjects = subjects.filter(sub => {
            const subjectGrade = String(sub.grade_level_applicable || "").trim().toLowerCase();
            if (!selectedSection.program_id) return sectionGrade === subjectGrade;
            
            // 🛑 ARCHITECT FIX: Idinagdag din natin yung check dito para sa Bulk Assign
            return (parseInt(sub.program_id) === parseInt(selectedSection.program_id) || sub.program_id === null || sub.program_id === "") && 
                  sectionGrade === subjectGrade;
        });

      // Gagawa tayo ng "Draft List" para sa bawat subject
      const newDrafts = eligibleSubjects.map(sub => ({
          subject_id: sub.id,
          subject_code: sub.subject_code,
          subject_description: sub.subject_description,
          teacher_id: '',
          room_id: '',
          days: [], // Array muna para madaling i-toggle sa UI
          start_time: '08:00',
          end_time: '09:00'
      }));

      setBulkDrafts(newDrafts);
  };

  const handleDraftChange = (index, field, value) => {
      const updatedDrafts = [...bulkDrafts];
      updatedDrafts[index][field] = value;
      setBulkDrafts(updatedDrafts);
  };

  const toggleBulkDay = (index, dayLabel) => {
      const updatedDrafts = [...bulkDrafts];
      const currentDays = updatedDrafts[index].days;
      
      if (currentDays.includes(dayLabel)) {
          updatedDrafts[index].days = currentDays.filter(d => d !== dayLabel);
      } else {
          updatedDrafts[index].days = [...currentDays, dayLabel];
      }
      setBulkDrafts(updatedDrafts);
  };

const handleBulkSave = async (e) => {
      e.preventDefault();
      
      // 1. Validation: Siguraduhing walang nakalimutan sagutan si Registrar
      const hasEmptyFields = bulkDrafts.some(draft => 
          !draft.teacher_id || !draft.room_id || draft.days.length === 0 || !draft.start_time || !draft.end_time
      );

      if (hasEmptyFields) {
          showAlert('error', 'Missing Information', 'Please complete all fields (Teacher, Room, Days, Time) for every subject before saving.');
          return;
      }
      

// 🛑 ARCHITECT FIX: Bulk Time Validation
      const hasInvalidTime = bulkDrafts.some(draft => draft.start_time >= draft.end_time);
      if (hasInvalidTime) {
          showAlert('error', 'Invalid Schedule', 'The End Time must be AFTER the Start Time.');
          return;
      }

      const hasOutlierTime = bulkDrafts.some(draft => draft.start_time < "06:00" || draft.end_time > "22:00");
      if (hasOutlierTime) {
          showAlert('error', 'Out of Bounds', 'Classes must be scheduled between 6:00 AM and 10:00 PM only.');
          return;
      }

      setSaveLoading(true);

      try {
          const payload = {
              section_id: bulkSectionId,
              school_year: '2026-2027',
              drafts: bulkDrafts
          };

          const res = await axios.post(`${API_BASE_URL}/registrar/bulk_add_class_assign.php`, payload, {
              headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data.success) {
              showAlert('success', 'Success', res.data.message);
              setShowBulkModal(false);
              setBulkDrafts([]);
              setBulkSectionId('');
              fetchAssignmentData(); // I-refresh ang main table para lumabas lahat ng dinagdag
          } else {
              // Ipapalabas dito yung exact Conflict (e.g., "CONFLICT in SCIENCE 6: Room is occupied")
              showAlert('error', 'Error', res.data.message);
          }
      } catch (error) {
          showAlert('error', 'Server Error', 'An error occurred while saving the assignment.');
      } finally {
          setSaveLoading(false);
      }
  };

  // --- FILTER DISPLAY ---
// --- SMART FILTER DISPLAY ---
  const filteredAssignments = assignments.filter(a => {
      // 1. Text Search
      const searchString = `${a.teacher_name} ${a.subject_code} ${a.subject_name} ${a.section_name} ${a.room}`;
      const matchesSearch = searchString.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Department Category Mapping (Inaalam niya kung K-10, SHS, o College base sa Grade Level)
      let department = 'K-10';
      const gl = String(a.grade_level).toLowerCase();
      if (gl.includes('year') || gl.includes('college')) {
          department = 'College';
      } else if (gl.includes('11') || gl.includes('12')) {
          department = 'SHS';
      }

      // 3. Category Check
      const matchesCategory = categoryFilter === 'All' || department === categoryFilter;

      return matchesSearch && matchesCategory;
  });

  const confirmDelete = async () => {
      setIsDeleting(true);
      try {
          const res = await axios.post(`${API_BASE_URL}/registrar/delete_class_assign.php`, 
              { id: deleteModalConfig.data.id },
              { headers: { Authorization: `Bearer ${token}` } }
          );
          if(res.data.success) {
              showAlert('success', 'Deleted', res.data.message);
              setDeleteModalConfig({ show: false, data: null });
              fetchAssignmentData();
          } else { showAlert('error', 'Error', res.data.message); }
      } catch (error) { showAlert('error', 'Server Error', 'Failed to delete class.'); }
      finally { setIsDeleting(false); }
  };

return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tighter uppercase">
            <Presentation className="text-blue-600" size={36} /> Class Assignments
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">Conflict-Aware Scheduling System</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setShowBulkModal(true)} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-6 py-4 rounded-2xl flex items-center gap-2 font-black uppercase text-xs tracking-widest hover:bg-emerald-100 transition-all">
                <ListChecks size={20} /> Bulk Assign
            </button>
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-4 rounded-2xl flex items-center gap-2 shadow-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all active:scale-95">
                <Plus size={20} /> Single Class
            </button>
        </div>
      </div>

      {/* SEARCH */}
{/* 🛑 ARCHITECT FIX: SEARCH & FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
             type="text" 
             placeholder="Search by teacher, subject code, section, or room..." 
             value={searchQuery} 
             onChange={(e) => setSearchQuery(e.target.value)} 
             className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 shadow-sm transition-all" 
          />
        </div>
        
        {/* NEW FILTER DROPDOWN */}
        <div className="relative w-full md:w-72">
           <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 shadow-sm transition-all appearance-none cursor-pointer"
           >
              <option value="All">All Departments</option>
              <option value="College">College</option>
              <option value="SHS">Senior High (SHS)</option>
              <option value="K-10">K-10 (Kinder - Gr.10)</option>
           </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-10 text-left">Teacher & Load</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Target Section</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Schedule & Venue</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="4" className="p-20 text-center text-slate-300 font-black uppercase animate-pulse">Synchronizing Data...</td></tr>
            ) : filteredAssignments.length === 0 ? (
              <tr><td colSpan="4" className="p-20 text-center text-slate-300 font-black uppercase">No records found.</td></tr>
            ) : filteredAssignments.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="p-6 pl-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg border-2 border-white shadow-sm">
                      {item.teacher_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm uppercase">{item.teacher_name}</p>
                      <p className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1 mt-1">
                        <BookOpen size={12}/> {item.subject_code}: {item.subject_name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Users size={16}/></div>
                    <div>
                      <p className="font-black text-slate-700 text-sm uppercase">{item.section_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item.grade_level}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 w-max">
                      <Clock size={12}/> {item.schedule}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 tracking-widest">
                      <MapPin size={14} className="text-emerald-500"/> {item.room || 'No Room Assigned'}
                    </p>
                  </div>
                </td>
                <td className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setEditModalConfig({ show: true, data: item })} className="p-3 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all">
                            <Edit size={18}/>
                        </button>
                        <button onClick={() => setDeleteModalConfig({ show: true, data: item })} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={18}/>
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <form onSubmit={handleSave} className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Assign Class Record</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Master Scheduling System</p>
              </div>
              <button type="button" onClick={handleCloseModal} className="p-3 bg-white text-slate-300 hover:text-red-500 rounded-2xl shadow-sm transition-all"><X size={20}/></button>
            </div>
            
            <div className="p-10 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                
                {/* 1. TEACHER SELECT */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Teacher</label>
                  <select required value={formData.teacher_id} onChange={e=>setFormData({...formData, teacher_id: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500">
                    <option value="">-- Select Faculty Member --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>

                {/* 2. DYNAMIC SECTION SELECT */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Section</label>
                  <select required value={formData.section_id} onChange={e=>{
                    const selected = sections.find(sec => sec.id === parseInt(e.target.value));
                    setFormData({...formData, section_id: e.target.value, grade_level: selected?.grade_level || '', subject_id: ''});
                  }} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500">
                    <option value="">-- Select Section --</option>
                    {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.section_name} ({sec.grade_level})</option>)}
                  </select>
                </div>

                {/* 3. SUBJECT SELECT WITH STRICT FILTER */}
                <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Load</label>
                    <select 
                      required 
                      disabled={!formData.section_id} 
                      value={formData.subject_id} 
                      onChange={e=>setFormData({...formData, subject_id: e.target.value})} 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">
                        {!formData.section_id ? '-- Select Section First --' : '-- Select Eligible Subject --'}
                      </option>
                      
                      {subjects.filter(sub => {
                          const selectedSection = sections.find(sec => sec.id === parseInt(formData.section_id));
                          if (!selectedSection) return false;

                          const sectionGrade = String(selectedSection.grade_level || "").trim().toLowerCase();
                          const subjectGrade = String(sub.grade_level_applicable || "").trim().toLowerCase();

                          if (!selectedSection.program_id) {
                                return sectionGrade === subjectGrade;
                            } else {
                                // 🛑 ARCHITECT FIX: Idinagdag natin yung check kung null o empty ang program_id (GE Subjects)
                                return (parseInt(sub.program_id) === parseInt(selectedSection.program_id) || sub.program_id === null || sub.program_id === "") && 
                                      sectionGrade === subjectGrade;
                            }
                      }).map(s => (
                          <option key={s.id} value={s.id}>
                              {s.subject_code} - {s.subject_description || s.name}
                          </option>
                      ))}
                    </select>
                </div>

                {/* 4. ROOM SELECT (ARCHITECT FIX: DROPDOWN NA!) */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room / Venue</label>
                  <select 
                    required 
                    value={formData.room_id} 
                    onChange={e=>setFormData({...formData, room_id: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Academic Venue --</option>
                    {rooms.map(r => (
                        <option key={r.id} value={r.id}>
                            {r.room_name} ({r.room_type} | Capacity: {r.capacity})
                        </option>
                    ))}
                  </select>
                </div>

                {/* SCHEDULE BUILDER */}
                <div className="col-span-2 bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Schedule Configuration</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_MAPPING.map(day => (
                      <button key={day.label} type="button" onClick={() => toggleDay(day.label)} className={`w-12 h-12 rounded-xl font-black text-xs transition-all border ${selectedDays.includes(day.label) ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-white text-slate-400 border-slate-200'}`}>
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <input type="time" value={startTime} onChange={(e) => {setStartTime(e.target.value); updateScheduleString(selectedDays, e.target.value, endTime);}} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" />
                    <input type="time" value={endTime} onChange={(e) => {setEndTime(e.target.value); updateScheduleString(selectedDays, startTime, e.target.value);}} className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" />
                  </div>
                  <div className="p-3 bg-white rounded-xl text-center border-2 border-dashed border-blue-200">
                     <p className="text-xs font-black text-blue-600 uppercase tracking-tighter">Selected: {formData.schedule || 'None'}</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={handleCloseModal} className="px-8 py-4 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button type="submit" disabled={saveLoading} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2">
                {saveLoading ? <RefreshCw className="animate-spin" size={16}/> : <CheckCircle size={16}/>} Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* BULK ASSIGN MODAL (THE DRAFTING BOARD) */}
      {/* ------------------------------------------------------------------------ */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <form onSubmit={handleBulkSave} className="bg-white rounded-[3rem] w-full max-w-6xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Bulk Assign Curriculum</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">The Drafting Board</p>
              </div>
              <button type="button" onClick={() => {setShowBulkModal(false); setBulkDrafts([]); setBulkSectionId('');}} className="p-3 bg-white text-slate-300 hover:text-red-500 rounded-2xl shadow-sm transition-all"><X size={20}/></button>
            </div>
            
            <div className="p-8 bg-white border-b border-slate-100 flex items-center gap-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Target Section to Draft:</label>
                <select required value={bulkSectionId} onChange={handleBulkSectionSelect} className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500">
                    <option value="">-- Choose Section --</option>
                    {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.section_name} ({sec.grade_level})</option>)}
                </select>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
                {bulkDrafts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-20">
                        <ListChecks size={64} className="opacity-20"/>
                        <p className="font-black uppercase tracking-widest text-sm">Select a section to auto-load subjects</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bulkDrafts.map((draft, index) => (
                            <div key={index} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-4 items-start xl:items-center">
                                
                                {/* SUBJECT NAME */}
                                <div className="w-full xl:w-1/4">
                                    <p className="font-black text-slate-800 uppercase text-sm">{draft.subject_code}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{draft.subject_description}</p>
                                </div>

                                {/* TEACHER */}
                                <select required value={draft.teacher_id} onChange={e => handleDraftChange(index, 'teacher_id', e.target.value)} className="w-full xl:w-1/4 p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                                    <option value="">-- Assign Teacher --</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                </select>

                                {/* ROOM */}
                                <select required value={draft.room_id} onChange={e => handleDraftChange(index, 'room_id', e.target.value)} className="w-full xl:w-1/4 p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                                    <option value="">-- Assign Room --</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.room_name}</option>)}
                                </select>

                                {/* TIME & DAYS */}
                                <div className="w-full xl:w-auto flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {DAYS_MAPPING.map(day => (
                                            <button key={day.label} type="button" onClick={() => toggleBulkDay(index, day.label)} className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all border ${draft.days.includes(day.label) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                    <input required type="time" value={draft.start_time} onChange={e => handleDraftChange(index, 'start_time', e.target.value)} className="p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs outline-none" />
                                    <span className="text-slate-300 font-bold">-</span>
                                    <input required type="time" value={draft.end_time} onChange={e => handleDraftChange(index, 'end_time', e.target.value)} className="p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs outline-none" />
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button type="submit" disabled={bulkDrafts.length === 0} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
                 Test Drafting Board
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 🛑 ARCHITECT FIX: DITO NATIN ILALAGAY ANG CUSTOM ALERT COMPONENT 🛑 */}
      <CustomAlert 
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 🛑 EDIT MODAL 🛑 */}
      <EditClassAssignModal 
          isOpen={editModalConfig.show}
          onClose={() => setEditModalConfig({ show: false, data: null })}
          assignmentData={editModalConfig.data}
          teachers={teachers}
          subjects={subjects}
          sections={sections}
          rooms={rooms}
          onSuccess={fetchAssignmentData}
          showAlert={showAlert}
      />

      {/* 🛑 DELETE WARNING MODAL 🛑 */}
      {deleteModalConfig.show && deleteModalConfig.data && (
        <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-center text-slate-800 uppercase tracking-tighter mb-2">Delete Schedule?</h3>
                <p className="text-center font-bold text-slate-500 text-sm mb-6">
                    Remove schedule for <span className="text-red-500 font-black">{deleteModalConfig.data.subject_code}</span>? 
                </p>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-8">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-relaxed text-center">
                        Warning: This will also unenroll all students currently assigned to this specific class schedule!
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModalConfig({show: false, data: null})} disabled={isDeleting} className="flex-1 py-4 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                    <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-red-600 transition-all flex justify-center items-center gap-2">
                        {isDeleting ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />} Delete
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ClassAssignments;