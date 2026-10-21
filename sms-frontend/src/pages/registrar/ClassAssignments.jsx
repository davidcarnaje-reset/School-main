import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Layers, Plus, Search, BookOpen, Clock, 
  MapPin, Users, Edit, Trash2, X, CheckCircle, RefreshCw, AlertTriangle, Presentation, ListChecks, Filter,
  LayoutGrid, List, Sparkles, ChevronRight, ArrowLeft, Calendar, School, UserCheck, AlertCircle, Award, Check
} from 'lucide-react';
import EditClassAssignModal from '../../components/registrar/EditClassAssignModal';
import AutoScheduleModal from '../../components/registrar/AutoScheduleModal';
import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/shared/CustomAlert';

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
  const [categoryFilter, setCategoryFilter] = useState('All');

  // VIEW MODE: 'cards' (Default) vs 'list'
  const [viewMode, setViewMode] = useState('cards');
  
  // LEVEL DRILLDOWN: null (all level cards) or group object (drilled into e.g. Grade 1)
  const [activeLevelGroup, setActiveLevelGroup] = useState(null);
  const [activeSectionTab, setActiveSectionTab] = useState('ALL');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [autoScheduleGroup, setAutoScheduleGroup] = useState(null);

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
    delivery_mode: 'Face-to-Face',
    online_platform: 'Google Meet',
    meeting_link: '',
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

      // Gagawa tayo ng "Draft List" para sa bawat subject na may Modality Support
      const newDrafts = eligibleSubjects.map(sub => ({
          subject_id: sub.id,
          subject_code: sub.subject_code,
          subject_description: sub.subject_description,
          teacher_id: '',
          room_id: '',
          delivery_mode: 'Face-to-Face',
          online_platform: 'Google Meet',
          meeting_link: '',
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
      
      // 1. Validation: Siguraduhing may teacher, schedule, at room (kung hindi pure Online)
      const hasEmptyFields = bulkDrafts.some(draft => {
          const isOnline = draft.delivery_mode === 'Online';
          if (!draft.teacher_id || draft.days.length === 0 || !draft.start_time || !draft.end_time) return true;
          if (!isOnline && !draft.room_id) return true;
          return false;
      });

      if (hasEmptyFields) {
          showAlert('error', 'Missing Information', 'Please complete all required fields (Teacher, Room/Platform, Days, Time) for every subject before saving.');
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

  // --- FILTER DISPLAY  // Group sections by Academic Level / Course & Year
  const levelGroups = useMemo(() => {
    const groups = {};

    sections.forEach(sec => {
      const isCollege = sec.department === 'College' || ['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(sec.grade_level);
      
      let key = '';
      let displayTitle = '';
      let subTitle = '';
      let dept = sec.department || 'K-10';
      let programCode = sec.program_code || null;
      let programId = sec.program_id || null;

      if (isCollege) {
        dept = 'College';
        const progStr = sec.program_code ? sec.program_code : 'General College';
        key = `college_${sec.program_id || 'gen'}_${sec.grade_level}`;
        displayTitle = `${progStr} - ${sec.grade_level}`;
        subTitle = sec.program_description || 'College Degree Curriculum';
      } else {
        key = `level_${dept}_${sec.grade_level}`;
        displayTitle = sec.grade_level;
        subTitle = dept === 'SHS' 
          ? (sec.program_code ? `${sec.program_code} Strand` : 'Senior High School')
          : `${dept} Basic Education`;
      }

      if (!groups[key]) {
        groups[key] = {
          key,
          grade_level: sec.grade_level,
          department: dept,
          program_id: programId,
          program_code: programCode,
          title: displayTitle,
          subtitle: subTitle,
          sections: []
        };
      }
      groups[key].sections.push(sec);
    });

    return Object.values(groups);
  }, [sections]);

  // Filter level groups based on category filter and search
  const filteredLevelGroups = useMemo(() => {
    return levelGroups.filter(grp => {
      const matchesCategory = categoryFilter === 'All' || grp.department === categoryFilter;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        grp.title.toLowerCase().includes(searchLower) ||
        grp.subtitle.toLowerCase().includes(searchLower) ||
        grp.sections.some(s => s.section_name.toLowerCase().includes(searchLower));

      return matchesCategory && matchesSearch;
    });
  }, [levelGroups, categoryFilter, searchQuery]);

  // --- FILTER DISPLAY FOR LIST VIEW ---
  const filteredAssignments = assignments.filter(a => {
      const searchString = `${a.teacher_name || 'Waiting for Teacher'} ${a.subject_code || ''} ${a.subject_name || ''} ${a.section_name || ''} ${a.room || ''}`;
      const matchesSearch = searchString.toLowerCase().includes(searchQuery.toLowerCase());

      let department = 'K-10';
      const gl = String(a.grade_level).toLowerCase();
      if (gl.includes('year') || gl.includes('college')) {
          department = 'College';
      } else if (gl.includes('11') || gl.includes('12')) {
          department = 'SHS';
      }

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
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-500/20">
            <Presentation size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
              Class Assignments
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">
              Conflict-Aware Scheduling & Auto-Scheduler System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* VIEW SWITCHER: Card View vs List View */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setViewMode('cards');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid size={15} /> Card View
            </button>
            <button
              onClick={() => {
                setViewMode('list');
                setActiveLevelGroup(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List size={15} /> List View
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <button 
            onClick={() => {
              if (activeLevelGroup) {
                setAutoScheduleGroup(activeLevelGroup);
              } else if (filteredLevelGroups.length > 0) {
                setAutoScheduleGroup(filteredLevelGroups[0]);
              }
              setShowAutoScheduleModal(true);
            }} 
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-5 py-3.5 rounded-2xl flex items-center gap-2 font-black uppercase text-xs tracking-wider shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles size={16} className="text-amber-300" /> Auto Schedule
          </button>
          <button onClick={() => setShowBulkModal(true)} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-5 py-3.5 rounded-2xl flex items-center gap-2 font-black uppercase text-xs tracking-wider hover:bg-emerald-100 transition-all cursor-pointer">
            <ListChecks size={18} /> Bulk Assign
          </button>
          <button onClick={() => {
            if (activeLevelGroup) {
              setFormData({ ...initialForm, grade_level: activeLevelGroup.grade_level });
            }
            setShowModal(true);
          }} className="bg-blue-600 text-white px-5 py-3.5 rounded-2xl flex items-center gap-2 shadow-md font-black uppercase text-xs tracking-wider hover:bg-blue-700 transition-all active:scale-95 cursor-pointer">
            <Plus size={18} /> Single Class
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CARD VIEW (DEFAULT) */}
      {/* ========================================================================= */}
      {viewMode === 'cards' && (
        <>
          {/* A. LEVEL DRILLDOWN VIEW (WHEN A LEVEL CARD IS CLICKED) */}
          {activeLevelGroup ? (
            <div className="space-y-6">
              {/* BREADCRUMB & LEVEL ACTION BAR */}
              <div className="bg-white p-6 px-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setActiveLevelGroup(null);
                      setActiveSectionTab('ALL');
                    }}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all flex items-center gap-1.5 text-xs font-black uppercase cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Back to Levels
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                        {activeLevelGroup.department}
                      </span>
                      {activeLevelGroup.program_code && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                          {activeLevelGroup.program_code}
                        </span>
                      )}
                      <span className="text-slate-400 text-xs font-semibold">
                        {activeLevelGroup.sections.length} Active {activeLevelGroup.sections.length === 1 ? 'Section' : 'Sections'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">
                      {activeLevelGroup.title} Overview & Schedules
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setAutoScheduleGroup(activeLevelGroup);
                      setShowAutoScheduleModal(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-6 py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={16} className="text-amber-300" /> Auto Schedule {activeLevelGroup.grade_level}
                  </button>
                </div>
              </div>

              {/* SECTION TABS (WHEN MULTIPLE SECTIONS EXIST) */}
              {activeLevelGroup.sections.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveSectionTab('ALL')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeSectionTab === 'ALL'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    All Sections ({activeLevelGroup.sections.length})
                  </button>
                  {activeLevelGroup.sections.map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSectionTab(sec.id)}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeSectionTab === sec.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      Section {sec.section_name}
                    </button>
                  ))}
                </div>
              )}

              {/* SECTION DETAILS CARDS & TIMETABLES */}
              <div className="space-y-6">
                {activeLevelGroup.sections
                  .filter(sec => activeSectionTab === 'ALL' || activeSectionTab === sec.id)
                  .map(sec => {
                    const secAssignments = assignments.filter(a => a.section_id === sec.id);
                    const waitingCount = secAssignments.filter(a => !a.teacher_id).length;
                    const assignedCount = secAssignments.filter(a => a.teacher_id).length;

                    return (
                      <div key={sec.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                        {/* SECTION HEADER BAR */}
                        <div className="p-6 px-8 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black text-lg border-2 border-white shadow-sm">
                              {sec.section_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                                  {sec.grade_level}
                                </span>
                                {sec.adviser_name && (
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1">
                                    <UserCheck size={11} /> Adviser: {sec.adviser_name}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">
                                Section {sec.section_name}
                              </h3>
                            </div>
                          </div>

                          {/* Status pills & add button */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider">
                              Cap: {sec.max_capacity || 40}
                            </span>
                            {secAssignments.length > 0 ? (
                              <>
                                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                                  <CheckCircle size={14} /> {assignedCount} Scheduled
                                </span>
                                {waitingCount > 0 && (
                                  <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                    <Clock size={14} /> {waitingCount} Waiting For Teacher
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-black uppercase tracking-wider">
                                No Schedule Yet
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setFormData({ ...initialForm, section_id: sec.id, grade_level: sec.grade_level });
                                setShowModal(true);
                              }}
                              className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus size={14} /> Add Class
                            </button>
                          </div>
                        </div>

                        {/* SECTION TIMETABLE TABLE */}
                        {secAssignments.length === 0 ? (
                          <div className="p-16 text-center bg-slate-50/30">
                            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-sm">
                              <Clock size={28} />
                            </div>
                            <h4 className="text-base font-black text-slate-700 uppercase tracking-tight">
                              No Classes Scheduled for Section {sec.section_name}
                            </h4>
                            <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto mt-1 mb-5">
                              Generate timetables automatically using our conflict-aware scheduler with teacher tagging.
                            </p>
                            <button
                              onClick={() => {
                                setAutoScheduleGroup(activeLevelGroup);
                                setShowAutoScheduleModal(true);
                              }}
                              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all inline-flex items-center gap-2 cursor-pointer"
                            >
                              <Sparkles size={14} className="text-amber-300" /> Auto Schedule Now
                            </button>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-8 text-left">Subject & Load</th>
                                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Schedule & Time</th>
                                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Teacher Assigned</th>
                                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Venue / Modality</th>
                                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {secAssignments.map(item => (
                                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                                    <td className="p-5 pl-8">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                                          <BookOpen size={16} />
                                        </div>
                                        <div>
                                          <p className="font-black text-slate-800 text-sm uppercase">{item.subject_code}</p>
                                          <p className="text-xs text-slate-500 font-semibold truncate max-w-xs">{item.subject_name}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-5">
                                      <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 w-max">
                                        <Clock size={13} className="text-blue-500" /> {item.schedule}
                                      </span>
                                    </td>
                                    <td className="p-5">
                                      {item.teacher_name ? (
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black text-xs border border-purple-100">
                                            {item.teacher_name.charAt(0)}
                                          </div>
                                          <div>
                                            <p className="font-black text-slate-800 text-xs uppercase">{item.teacher_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Faculty</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 w-max animate-pulse">
                                          <Clock size={13} /> Waiting For Teacher
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-5">
                                      <div className="flex items-center gap-2">
                                        {item.delivery_mode === 'Online' ? (
                                          <span className="text-[10px] font-black uppercase text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                            🌐 Online ({item.online_platform || 'Google Meet'})
                                          </span>
                                        ) : item.delivery_mode === 'Hybrid' ? (
                                          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                            🔄 Hybrid ({item.room || 'TBA'})
                                          </span>
                                        ) : (
                                          <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                                            <MapPin size={14} className="text-emerald-500 shrink-0" /> {item.room || 'Room TBA'}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-5 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => setEditModalConfig({ show: true, data: item })}
                                          className="p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                                          title="Edit Schedule & Assign Teacher"
                                        >
                                          <Edit size={16} />
                                        </button>
                                        <button
                                          onClick={() => setDeleteModalConfig({ show: true, data: item })}
                                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                          title="Delete Class Schedule"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* B. LEVEL CARDS GRID (MAIN CARD VIEW) */
            <div className="space-y-6">
              {/* SEARCH & CATEGORY FILTER BAR */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filter by grade level, course, or section name..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 shadow-sm transition-all text-sm" 
                  />
                </div>

                {/* DEPARTMENT FILTER TABS */}
                <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                  {['All', 'K-10', 'SHS', 'College'].map(dept => (
                    <button
                      key={dept}
                      onClick={() => setCategoryFilter(dept)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        categoryFilter === dept
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {dept === 'All' ? 'All Departments' : dept === 'K-10' ? 'K-10 Basic Ed' : dept === 'SHS' ? 'Senior High (SHS)' : 'College Blocks'}
                    </button>
                  ))}
                </div>
              </div>

              {/* GRID OF LEVEL CARDS */}
              {loading ? (
                <div className="p-20 text-center font-black text-slate-300 uppercase tracking-widest animate-pulse">
                  Loading Academic Levels...
                </div>
              ) : filteredLevelGroups.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-sm">
                  <School size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-black text-slate-700 uppercase">No Academic Levels Found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    No active sections match your current filter. Create sections in Section Management first.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLevelGroups.map(group => {
                    const groupSectionIds = group.sections.map(s => s.id);
                    const groupAssignments = assignments.filter(a => groupSectionIds.includes(a.section_id));
                    const totalScheduled = groupAssignments.length;
                    const waitingCount = groupAssignments.filter(a => !a.teacher_id).length;
                    const assignedCount = groupAssignments.filter(a => a.teacher_id).length;

                    return (
                      <div
                        key={group.key}
                        onClick={() => {
                          setActiveLevelGroup(group);
                          setActiveSectionTab('ALL');
                        }}
                        className="group bg-white rounded-[2.5rem] p-7 border-2 border-slate-100 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer text-left relative overflow-hidden"
                      >
                        {/* TOP ACCENT STRIP */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div>
                          {/* BADGES ROW */}
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              group.department === 'College' 
                                ? 'bg-blue-100 text-blue-700' 
                                : group.department === 'SHS'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {group.department}
                            </span>

                            <span className="text-[11px] font-bold text-slate-400">
                              {group.sections.length} {group.sections.length === 1 ? 'Section' : 'Sections'}
                            </span>
                          </div>

                          {/* TITLE & SUBTITLE */}
                          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                            {group.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-semibold mt-1">
                            {group.subtitle}
                          </p>

                          {/* SECTIONS PILLS */}
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                              Included Sections:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {group.sections.map(s => (
                                <span 
                                  key={s.id} 
                                  className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold uppercase"
                                >
                                  {s.section_name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* STATUS & CALL TO ACTION */}
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            {totalScheduled === 0 ? (
                              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                                <Clock size={13} /> Not Yet Scheduled
                              </span>
                            ) : waitingCount > 0 ? (
                              <span className="text-[11px] font-black text-amber-600 flex items-center gap-1.5 animate-pulse">
                                <Clock size={13} /> {waitingCount} Waiting For Teacher
                              </span>
                            ) : (
                              <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1.5">
                                <CheckCircle size={13} /> {totalScheduled} Classes Scheduled
                              </span>
                            )}

                            <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                              View <ChevronRight size={14} />
                            </span>
                          </div>

                          {/* QUICK ACTION BUTTON */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAutoScheduleGroup(group);
                              setShowAutoScheduleModal(true);
                            }}
                            className="w-full py-3 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles size={14} className="text-amber-500" /> Auto-Schedule {group.grade_level}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. LIST VIEW (CLASSIC TABLE VIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* SEARCH & FILTER BAR */}
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
                          {(item.teacher_name || 'W').charAt(0)}
                        </div>
                        <div>
                          {item.teacher_name ? (
                            <p className="font-black text-slate-800 text-sm uppercase">{item.teacher_name}</p>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-black uppercase flex items-center gap-1 w-max">
                              <Clock size={11} /> Waiting For Teacher
                            </span>
                          )}
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
                      <div className="space-y-1.5">
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 w-max">
                          <Clock size={12}/> {item.schedule}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.delivery_mode === 'Online' ? (
                            <span className="text-[10px] font-black uppercase text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              🌐 Online ({item.online_platform || 'Virtual'})
                            </span>
                          ) : item.delivery_mode === 'Hybrid' ? (
                            <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              🔄 Hybrid ({item.room || 'Venue TBA'} / {item.online_platform || 'Online'})
                            </span>
                          ) : (
                            <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 tracking-wider">
                              <MapPin size={13} className="text-emerald-500 shrink-0"/> {item.room || 'No Room Assigned'}
                            </p>
                          )}
                        </div>
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
        </div>
      )}

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
                  <select value={formData.teacher_id} onChange={e=>setFormData({...formData, teacher_id: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500">
                    <option value="">⏳ Waiting For Teacher (Unassigned)</option>
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

                {/* MODALITY SELECTOR */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class Delivery Mode (Modality)</label>
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_mode: 'Face-to-Face' })}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        formData.delivery_mode === 'Face-to-Face' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>🏫</span> Face-to-Face
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_mode: 'Online' })}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        formData.delivery_mode === 'Online' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>🌐</span> Online Class
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_mode: 'Hybrid' })}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        formData.delivery_mode === 'Hybrid' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>🔄</span> Hybrid
                    </button>
                  </div>
                </div>

                {/* 4. ROOM SELECT OR VIRTUAL PLATFORM */}
                {formData.delivery_mode === 'Online' ? (
                  <div className="col-span-2 space-y-2 animate-in fade-in">
                    <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Online Platform</label>
                    <select 
                      value={formData.online_platform || 'Google Meet'} 
                      onChange={e=>setFormData({...formData, online_platform: e.target.value})} 
                      className="w-full p-4 bg-cyan-50 border border-cyan-200 text-cyan-900 rounded-2xl font-bold outline-none focus:border-cyan-500"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom Meeting</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="School LMS / Canvas">School LMS / Canvas</option>
                    </select>
                  </div>
                ) : (
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {formData.delivery_mode === 'Hybrid' ? 'Physical Room / Venue (Hybrid Duty)' : 'Room / Venue'}
                    </label>
                    <select 
                      required={formData.delivery_mode !== 'Online'}
                      value={formData.room_id} 
                      onChange={e=>setFormData({...formData, room_id: e.target.value})} 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500"
                    >
                      <option value="">-- Select Academic Venue --</option>
                      {rooms.map(r => {
                          const roomLabel = (r.room_name?.trim().toLowerCase() === 'room' && r.room_number)
                            ? `Room ${r.room_number}`
                            : `${r.room_name}${r.room_number ? ` (${r.room_number})` : ''}`;
                          return (
                            <option key={r.id} value={r.id}>
                                {roomLabel} ({r.room_type} | Capacity: {r.capacity})
                            </option>
                          );
                      })}
                    </select>
                  </div>
                )}

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

            <div className="p-6 md:p-8 overflow-y-auto bg-slate-50/80 flex-1">
                {bulkDrafts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-20">
                        <ListChecks size={64} className="opacity-20"/>
                        <p className="font-black uppercase tracking-widest text-sm">Select a section to auto-load subjects</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bulkDrafts.map((draft, index) => (
                            <div 
                                key={index} 
                                className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
                            >
                                {/* 1. TOP HEADER: SUBJECT INFO & MODALITY PILL */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 font-mono font-black text-xs rounded-xl border border-blue-200/60 shadow-xs shrink-0">
                                            {draft.subject_code}
                                        </span>
                                        <h4 className="text-sm font-black text-slate-800 tracking-tight leading-snug">
                                            {draft.subject_description}
                                        </h4>
                                    </div>

                                    {/* MODALITY SELECTOR CHIPS */}
                                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => handleDraftChange(index, 'delivery_mode', 'Face-to-Face')}
                                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                                draft.delivery_mode === 'Face-to-Face' 
                                                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60' 
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            <span>🏫</span> F2F
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDraftChange(index, 'delivery_mode', 'Online')}
                                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                                draft.delivery_mode === 'Online' 
                                                    ? 'bg-cyan-600 text-white shadow-xs' 
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            <span>🌐</span> Online
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDraftChange(index, 'delivery_mode', 'Hybrid')}
                                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                                draft.delivery_mode === 'Hybrid' 
                                                    ? 'bg-purple-600 text-white shadow-xs' 
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            <span>🔄</span> Hybrid
                                        </button>
                                    </div>
                                </div>

                                {/* 2. BOTTOM CONTROLS GRID: 4 BALANCED, DEDICATED COLUMNS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
                                    {/* COL 1: ASSIGN TEACHER */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                            👨‍🏫 Faculty Teacher
                                        </label>
                                        <select 
                                            required 
                                            value={draft.teacher_id} 
                                            onChange={e => handleDraftChange(index, 'teacher_id', e.target.value)} 
                                            className="w-full h-[46px] px-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl font-bold text-xs text-slate-800 outline-none transition-all cursor-pointer truncate"
                                        >
                                            <option value="">-- Choose Faculty --</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                        </select>
                                    </div>

                                    {/* COL 2: VENUE / ONLINE PLATFORM (DYNAMIC BASE SA MODALITY) */}
                                    {draft.delivery_mode === 'Online' ? (
                                        <div className="space-y-1.5 animate-in fade-in">
                                            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                🌐 Virtual Platform
                                            </label>
                                            <select 
                                                value={draft.online_platform || 'Google Meet'} 
                                                onChange={e => handleDraftChange(index, 'online_platform', e.target.value)} 
                                                className="w-full h-[46px] px-3.5 bg-cyan-50 border border-cyan-200 hover:border-cyan-300 text-cyan-900 focus:border-cyan-500 rounded-2xl font-bold text-xs outline-none transition-all cursor-pointer"
                                            >
                                                <option value="Google Meet">Google Meet</option>
                                                <option value="Zoom">Zoom Meeting</option>
                                                <option value="Microsoft Teams">Microsoft Teams</option>
                                                <option value="School LMS / Canvas">School LMS / Canvas</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                {draft.delivery_mode === 'Hybrid' ? '🔄 Physical Room (Hybrid)' : '🏫 Room / Venue'}
                                            </label>
                                            <select 
                                                required={draft.delivery_mode !== 'Online'} 
                                                value={draft.room_id} 
                                                onChange={e => handleDraftChange(index, 'room_id', e.target.value)} 
                                                className="w-full h-[46px] px-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl font-bold text-xs text-slate-800 outline-none transition-all cursor-pointer truncate"
                                            >
                                                <option value="">-- Choose Venue --</option>
                                                {rooms.map(r => {
                                                    const roomLabel = (r.room_name?.trim().toLowerCase() === 'room' && r.room_number)
                                                      ? `Room ${r.room_number}`
                                                      : `${r.room_name}${r.room_number ? ` (${r.room_number})` : ''}`;
                                                    return <option key={r.id} value={r.id}>{roomLabel}</option>;
                                                })}
                                            </select>
                                        </div>
                                    )}

                                    {/* COL 3: CLASS DAYS CHIPS */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                🗓️ Class Days
                                            </label>
                                            <span className="text-[9px] font-bold text-blue-600 lowercase">{draft.days.length} selected</span>
                                        </div>
                                        <div className="flex items-center justify-between p-1 bg-slate-50 border border-slate-200 rounded-2xl h-[46px]">
                                            {DAYS_MAPPING.map(day => (
                                                <button 
                                                    key={day.label} 
                                                    type="button" 
                                                    onClick={() => toggleBulkDay(index, day.label)} 
                                                    className={`flex-1 h-8 mx-0.5 rounded-xl font-black text-[10px] transition-all border ${
                                                        draft.days.includes(day.label) 
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                                            : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                                                    }`}
                                                >
                                                    {day.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* COL 4: TIME SCHEDULE */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 ml-1">
                                            ⏰ Time (Start - End)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 h-[46px]">
                                            <input 
                                                required 
                                                type="time" 
                                                value={draft.start_time} 
                                                onChange={e => handleDraftChange(index, 'start_time', e.target.value)} 
                                                className="w-full h-full px-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl font-bold text-xs outline-none text-slate-700 transition-all text-center cursor-pointer" 
                                            />
                                            <input 
                                                required 
                                                type="time" 
                                                value={draft.end_time} 
                                                onChange={e => handleDraftChange(index, 'end_time', e.target.value)} 
                                                className="w-full h-full px-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl font-bold text-xs outline-none text-slate-700 transition-all text-center cursor-pointer" 
                                            />
                                        </div>
                                    </div>
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

      {/* 🛑 AUTO SCHEDULE MODAL 🛑 */}
      <AutoScheduleModal 
        isOpen={showAutoScheduleModal}
        onClose={() => setShowAutoScheduleModal(false)}
        targetGroup={autoScheduleGroup}
        teachers={teachers}
        subjects={subjects}
        rooms={rooms}
        onSuccess={fetchAssignmentData}
        showAlert={showAlert}
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