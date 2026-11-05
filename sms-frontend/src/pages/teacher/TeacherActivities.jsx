import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getTeacherLevel, getGradingCategories } from '../../utils/gradingUtils';
import {
  Plus, BookOpen, FileText, MoreVertical, ChevronDown, ChevronUp,
  MessageSquare, Share, Link as LinkIcon, Edit3, Megaphone, Send, Trash2, X, Video, ExternalLink
} from 'lucide-react';

import {
  gcGlassStyles,
  ActivitySkeletonList,
  TypeSelectorModal,
  CreateActivityModal,
  CreateModuleModal
} from '../../components/shared/TeacherActivityUI';

const TeacherActivities = () => {
  const { classId: urlClassId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // 🟢 Dinagdag para makuha ang ipinasang state mula sidebar

  const { user, API_BASE_URL, branding } = useAuth();
  const themeColor = branding?.theme_color || '#6366f1';

  const [assignedClasses, setAssignedClasses] = useState([]);
  const [viewClassId, setViewClassId] = useState(urlClassId || '');
  const [activities, setActivities] = useState([]);
  const [modules, setModules] = useState([]);
  const [classAnnouncements, setClassAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('Stream'); // 🟢 Default na ito
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Class Announcement Composer States
  const [isComposingAnnouncement, setIsComposingAnnouncement] = useState(false);
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'Announcement'
  });

  const [filterCategory, setFilterCategory] = useState('');
  const [filterQuarter, setFilterQuarter] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);

  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [formData, setFormData] = useState({ class_id: '', title: '', description: '', category: '', quarter: '', max_score: 100, due_date: '' });

  // Learning Module Modal State
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    module_type: 'lecture',
    file_url: ''
  });

  // 🟢 EFFECT PARA SALUHIN YUNG CLICK GALING SIDEBAR AT ILIPAT ANG TAB
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (urlClassId && urlClassId !== viewClassId) {
      setViewClassId(urlClassId);
    }
  }, [urlClassId]);

  const selectedClassForView = assignedClasses.find(c => String(c.id) === String(viewClassId));
  const viewTeacherLevel = getTeacherLevel(selectedClassForView);
  const viewCategories = getGradingCategories(viewTeacherLevel);
  const isModalKto12 = viewTeacherLevel !== 'College';

  const fetchClasses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('sms_token');
      const res = await axios.get(`${API_BASE_URL}/teacher/get_my_schedule.php?teacher_id=${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') {
        setAssignedClasses(res.data.data);
        if (!viewClassId && res.data.data.length > 0) {
          setViewClassId(res.data.data[0].id);
          navigate(`/teacher/activities/${res.data.data[0].id}`, { replace: true });
        }
      }
    } catch (err) { }
  }, [user, API_BASE_URL, viewClassId, navigate]);

  const fetchActivities = useCallback(async () => {
    if (!viewClassId) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sms_token');
      const res = await axios.get(`${API_BASE_URL}/teacher/get_activities.php?class_id=${viewClassId}&all=1`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') setActivities(res.data.data || []);
    } catch (err) { }
    finally { setIsLoading(false); }
  }, [viewClassId, API_BASE_URL]);

  const fetchModules = useCallback(async () => {
    if (!viewClassId) return;
    try {
      const token = localStorage.getItem('sms_token');
      const res = await axios.get(`${API_BASE_URL}/teacher/get_modules.php?class_id=${viewClassId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') setModules(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch modules:", err);
    }
  }, [viewClassId, API_BASE_URL]);

  const fetchClassAnnouncements = useCallback(async () => {
    if (!viewClassId) return;
    try {
      const token = localStorage.getItem('sms_token');
      const res = await axios.get(`${API_BASE_URL}/teacher/get_class_announcements.php?class_id=${viewClassId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') {
        setClassAnnouncements(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch class announcements:", err);
    }
  }, [viewClassId, API_BASE_URL]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => {
    fetchActivities();
    fetchModules();
    fetchClassAnnouncements();
  }, [fetchActivities, fetchModules, fetchClassAnnouncements]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.message.trim()) {
      alert('Please enter an announcement message for your class.');
      return;
    }

    setIsPostingAnnouncement(true);
    try {
      const token = localStorage.getItem('sms_token');
      const payload = {
        class_id: viewClassId,
        teacher_id: user?.id,
        title: announcementForm.title.trim() || `${selectedClassForView?.subject_description || 'Class'} Announcement`,
        message: announcementForm.message.trim(),
        type: announcementForm.type
      };
      const res = await axios.post(`${API_BASE_URL}/teacher/create_class_announcement.php`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        setAnnouncementForm({ title: '', message: '', type: 'Announcement' });
        setIsComposingAnnouncement(false);
        fetchClassAnnouncements();
      } else {
        alert(res.data.message || 'Failed to post announcement.');
      }
    } catch (err) {
      alert('Failed to post class announcement. Please check your connection.');
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Remove this announcement from the class stream?')) return;
    try {
      const token = localStorage.getItem('sms_token');
      const res = await axios.post(`${API_BASE_URL}/teacher/delete_class_announcement.php`, {
        id: announcementId,
        class_id: viewClassId
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') {
        fetchClassAnnouncements();
      }
    } catch (err) {
      alert('Failed to delete announcement.');
    }
  };

  const handleOpenModal = () => {
    setEditingActivityId(null);
    setFormData({ class_id: viewClassId, title: '', description: '', category: '', quarter: '', max_score: 100, due_date: '' });
    setShowTypeSelector(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (act) => {
    setEditingActivityId(act.id);
    const formattedDate = act.due_date ? new Date(act.due_date).toISOString().split('T')[0] : '';
    setFormData({
      class_id: viewClassId,
      title: act.title || '',
      description: act.description || '',
      category: act.category || '',
      quarter: act.quarter || '',
      max_score: act.max_score || 100,
      due_date: formattedDate
    });
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleDeleteActivity = async (act) => {
    if (!window.confirm(`Delete "${act.title}"? This will also remove any student scores recorded for this activity.`)) return;
    try {
      const token = localStorage.getItem('sms_token');
      const res = await axios.post(`${API_BASE_URL}/teacher/delete_activity.php`, {
        activity_id: act.id,
        class_id: viewClassId
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') {
        fetchActivities();
      } else {
        alert(res.data.message || 'Failed to delete activity.');
      }
    } catch (err) {
      alert('Error deleting activity.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isModalKto12 && !formData.quarter) {
      alert('Please select a Quarter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sms_token');
      const payload = {
        ...formData,
        activity_id: editingActivityId,
        teacher_id: user.id,
        quarter: isModalKto12 ? parseInt(formData.quarter, 10) : null
      };

      const endpoint = editingActivityId
        ? `${API_BASE_URL}/teacher/update_activity.php`
        : `${API_BASE_URL}/teacher/create_activity.php`;

      const res = await axios.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.status === 'success') {
        setIsModalOpen(false);
        setEditingActivityId(null);
        setFormData({ class_id: '', title: '', description: '', category: '', quarter: '', max_score: 100, due_date: '' });
        fetchActivities();
      } else {
        alert(res.data.message || 'Failed to save activity.');
      }
    } catch (err) {
      alert('Failed to save activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModuleModal = () => {
    setModuleForm({ title: '', description: '', module_type: 'lecture', file_url: '' });
    setShowTypeSelector(false);
    setIsModuleModalOpen(true);
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!moduleForm.title.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('sms_token');
      const res = await axios.post(`${API_BASE_URL}/teacher/create_module.php`, {
        class_id: viewClassId,
        teacher_id: user?.id,
        ...moduleForm
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.status === 'success') {
        setIsModuleModalOpen(false);
        setModuleForm({ title: '', description: '', module_type: 'lecture', file_url: '' });
        fetchModules();
      } else {
        alert(res.data.message || 'Failed to post module.');
      }
    } catch (err) {
      alert('Failed to post learning module.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Remove this learning module from the classroom?')) return;
    try {
      const token = localStorage.getItem('sms_token');
      const res = await axios.post(`${API_BASE_URL}/teacher/delete_module.php`, {
        module_id: moduleId
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status === 'success') {
        fetchModules();
      }
    } catch (err) {
      alert('Failed to delete module.');
    }
  };

  const handleShareActivity = async (activity) => {
    if (!window.confirm(`Share "${activity.title}" to all students in this class? They will receive a notification and see it in the stream.`)) return;

    try {
      const token = localStorage.getItem('sms_token');
      const payload = { activity_id: activity.id, class_id: viewClassId, title: activity.title };
      const res = await axios.post(`${API_BASE_URL}/teacher/share_activity.php`, payload, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.status === 'success') {
        alert('Activity shared successfully! All enrolled students have been notified.');
        fetchClassAnnouncements();
      } else {
        alert(res.data.message || 'Failed to share activity.');
      }
    } catch (err) {
      alert('Error sharing activity to students. Please check your connection.');
    }
  };

  const toggleGroup = (key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  const isAllCollapsed = viewCategories.every(cat => collapsedGroups[cat.key] === true);
  const handleToggleAll = () => {
    if (isAllCollapsed) {
      setCollapsedGroups({});
    } else {
      const newState = {};
      viewCategories.forEach(cat => newState[cat.key] = true);
      setCollapsedGroups(newState);
    }
  };

  const matchesCategory = (actCategory, catKey) => {
    if (!catKey) return true;
    if (catKey === 'written') {
      return actCategory === 'written' || actCategory === 'seatwork' || actCategory === 'quiz' || actCategory === 'task' || actCategory === 'assignment';
    }
    if (catKey === 'performance') {
      return actCategory === 'performance' || actCategory === 'activity' || actCategory === 'pt' || actCategory === 'project';
    }
    if (catKey === 'exam') {
      return actCategory === 'exam' || actCategory === 'quarterly' || actCategory === 'periodical' || actCategory === 'prelim' || actCategory === 'midterm' || actCategory === 'finals' || actCategory === 'quarterly_exam';
    }
    return actCategory === catKey;
  };

  const displayedActivities = activities.filter(act => {
    if (filterCategory && !matchesCategory(act.category, filterCategory)) return false;
    if (filterQuarter && String(act.quarter) !== String(filterQuarter)) return false;
    return true;
  });

  // Merge announcements, modules, and classwork for Stream view sorted by newest first
  const streamItems = [
    ...classAnnouncements.map(ann => ({
      streamKey: `ann_${ann.id}`,
      streamType: 'announcement',
      rawId: ann.id,
      title: ann.title,
      message: ann.message,
      badgeType: ann.type || 'Announcement',
      author: ann.teacher_name || user?.full_name || 'Teacher',
      dateLabel: `${ann.date_posted || ''} ${ann.time_posted ? `• ${ann.time_posted}` : ''}`,
      createdAt: ann.created_at
    })),
    ...modules.map(mod => ({
      streamKey: `mod_${mod.id}`,
      streamType: 'module',
      rawId: mod.id,
      title: mod.title,
      message: mod.description || (mod.module_type === 'video' ? 'Video Lecture Resource' : 'Learning Handout / Reference Material'),
      badgeType: mod.module_type === 'video' ? 'Video Lecture' : 'Learning Module',
      fileUrl: mod.file_url,
      moduleType: mod.module_type,
      author: user?.full_name || 'Teacher',
      dateLabel: mod.created_at ? new Date(mod.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
      createdAt: mod.created_at
    })),
    ...activities.map(act => ({
      streamKey: `act_${act.id}`,
      streamType: 'activity',
      rawId: act.id,
      title: act.title,
      message: act.description || `${act.max_score} pts ${act.quarter ? `• Quarter ${act.quarter}` : ''}`,
      badgeType: act.category === 'exam' ? 'Examination' : act.category === 'seatwork' ? 'Seatwork' : act.category === 'quiz' ? 'Class Quiz' : act.category === 'performance' ? 'Performance Task' : 'Classwork',
      author: user?.full_name || 'Teacher',
      dateLabel: act.created_at ? new Date(act.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
      createdAt: act.created_at,
      activityObj: act
    }))
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <div className="w-full max-w-5xl mx-auto pb-10">
      <style>{gcGlassStyles(themeColor)}</style>

      {/* TABS + CLASS SWITCHER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="gc-tabs">
          {['Stream', 'Classwork', 'Grades'].map(tab => (
            <div key={tab} className={`gc-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                if (tab === 'Grades' && selectedClassForView) {
                  navigate(`/teacher/sections/${selectedClassForView.id}`, {
                    state: {
                      subject: selectedClassForView.subject_description,
                      section: selectedClassForView.section_name || selectedClassForView.section,
                      grade_level: selectedClassForView.grade_level || selectedClassForView.level,
                      fromActivities: true
                    }
                  });
                } else {
                  setActiveTab(tab);
                }
              }}>
              {tab}
            </div>
          ))}
        </div>

        {assignedClasses.length > 1 && (
          <div className="px-4">
            <select
              value={viewClassId}
              onChange={(e) => {
                setViewClassId(e.target.value);
                navigate(`/teacher/activities/${e.target.value}`);
              }}
              className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-indigo-500 cursor-pointer"
            >
              {assignedClasses.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.subject_description || cls.subject_code} — {cls.section_name || cls.section} ({cls.grade_level})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* STREAM TAB */}
      {activeTab === 'Stream' && (
        <div className="w-full mt-4 animate-slide-up">

          {/* 🟢 EXACT GOOGLE CLASSROOM HERO BANNER 🟢 */}
          <div className="relative w-full h-[240px] rounded-[1.5rem] overflow-hidden mb-6 shadow-md" style={{ background: selectedClassForView ? 'linear-gradient(135deg, #d49a2a 0%, #4a545c 100%)' : 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' }}>
            {/* Malaking Curve na Transparent sa Kanan */}
            <div className="absolute right-[-10%] top-[-20%] w-[450px] h-[450px] bg-black/10 rounded-full" />

            {/* Customize Button (Top Right) */}
            <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
              <button
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm"
                onClick={handleOpenModuleModal}
              >
                <BookOpen size={16} /> Post Module
              </button>
              <button
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm"
                onClick={() => setIsComposingAnnouncement(true)}
              >
                <Megaphone size={16} /> New Announcement
              </button>
            </div>

            {/* Texts (Bottom Left) */}
            <div className="absolute bottom-6 left-8 z-10">
              <h1 className="text-white text-[2.4rem] leading-none font-bold tracking-tight mb-2 drop-shadow-sm">
                {selectedClassForView ? selectedClassForView.subject_description : 'No Assigned Class'}
              </h1>
              <p className="text-white/90 text-[1.1rem] font-semibold drop-shadow-sm">
                {selectedClassForView ? `${selectedClassForView.section_name || selectedClassForView.section} • ${selectedClassForView.grade_level || ''}` : 'No Section / Schedule Assigned'}
              </p>
            </div>
          </div>

          {assignedClasses.length === 0 ? (
            <div className="w-full max-w-4xl mx-auto py-12 px-8 bg-amber-50/80 border-2 border-amber-200/80 rounded-3xl text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                ⚠️
              </div>
              <h3 className="text-xl font-black text-amber-900 uppercase">No Class Schedule Assigned</h3>
              <p className="text-xs text-amber-800 font-semibold max-w-md mx-auto leading-relaxed">
                You do not have any active subject or section assigned to your teacher account yet. Please contact the <strong>School Admin or Registrar</strong> to assign classes to your schedule.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto">
              {/* 🟢 CLASS ANNOUNCEMENT COMPOSER CARD 🟢 */}
              {!isComposingAnnouncement ? (
                <div
                  className="bg-white/75 backdrop-blur-md border border-white rounded-2xl p-5 shadow-sm mb-6 flex items-center gap-4 cursor-pointer hover:bg-white/95 transition-all"
                  onClick={() => setIsComposingAnnouncement(true)}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm" style={{ backgroundColor: themeColor }}>
                    {user?.full_name?.charAt(0) || 'T'}
                  </div>
                  <div className="flex-1 bg-slate-50/90 border border-slate-200 rounded-full px-5 py-3.5 text-slate-500 font-bold text-sm hover:bg-white hover:border-indigo-300 transition-all shadow-inner flex items-center justify-between">
                    <span>Announce something to your class...</span>
                    <Megaphone size={18} className="text-indigo-500" />
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handlePostAnnouncement}
                  className="bg-white/90 backdrop-blur-xl border-2 border-indigo-100 rounded-3xl p-6 shadow-lg mb-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm" style={{ backgroundColor: themeColor }}>
                        {user?.full_name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">
                          Post Announcement to {selectedClassForView?.subject_description} ({selectedClassForView?.section_name || selectedClassForView?.section})
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-400">
                          Visible in Student Dashboard Bulletin, Notification Bell, and LMS Classroom Stream
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsComposingAnnouncement(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Title / Subject Heading (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g., Reminder for ${selectedClassForView?.subject_description || 'Class'} tomorrow`}
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 outline-none text-sm font-bold text-slate-800 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Category
                      </label>
                      <select
                        value={announcementForm.type}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="Announcement">📢 General Announcement</option>
                        <option value="Task Reminder">📝 Task / Assignment Reminder</option>
                        <option value="Urgent Alert">🚨 Urgent Class Alert</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Message to Students <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Write your announcement, instructions, or reminders for your students here..."
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 outline-none text-sm font-semibold text-slate-700 leading-relaxed transition-all resize-y"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsComposingAnnouncement(false)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPostingAnnouncement}
                      className="px-6 py-2.5 rounded-xl font-black text-xs text-white shadow-md hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Send size={15} />
                      {isPostingAnnouncement ? 'Posting to Students...' : 'Post Announcement'}
                    </button>
                  </div>
                </form>
              )}

              {/* 🟢 STREAM FEED LIST (ANNOUNCEMENTS + MODULES + CLASSWORK) 🟢 */}
              {streamItems.length === 0 ? (
                <div className="text-center py-16 bg-white/40 border border-white rounded-3xl backdrop-blur-md shadow-sm">
                  <MessageSquare size={54} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 font-black text-xl">This is where you can talk to your class</p>
                  <p className="text-slate-500 text-sm mt-2 font-semibold">Use the stream to share announcements, syllabi, and engaging materials.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {streamItems.map((item) => (
                    <div
                      key={item.streamKey}
                      className="bg-white/80 backdrop-blur-md border border-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 ${
                              item.streamType === 'announcement'
                                ? item.badgeType === 'Urgent Alert'
                                  ? 'bg-red-500'
                                  : item.badgeType === 'Task Reminder'
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-600'
                                : item.streamType === 'module'
                                ? item.moduleType === 'video'
                                  ? 'bg-rose-500'
                                  : 'bg-emerald-600'
                                : 'bg-slate-700'
                            }`}
                            style={item.streamType === 'announcement' && item.badgeType === 'Announcement' ? { backgroundColor: themeColor } : {}}
                          >
                            {item.streamType === 'announcement' ? (
                              <Megaphone size={20} />
                            ) : item.streamType === 'module' ? (
                              item.moduleType === 'video' ? <Video size={20} /> : <BookOpen size={20} />
                            ) : (
                              <FileText size={20} />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                item.badgeType === 'Urgent Alert'
                                  ? 'bg-red-100 text-red-700'
                                  : item.badgeType === 'Task Reminder'
                                  ? 'bg-amber-100 text-amber-700'
                                  : item.streamType === 'announcement'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : item.streamType === 'module'
                                  ? 'bg-teal-100 text-teal-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {item.badgeType}
                              </span>
                              <span className="text-xs font-bold text-slate-400">{item.dateLabel}</span>
                            </div>
                            <h3 className="text-base font-black text-slate-800 mt-1">{item.title}</h3>
                          </div>
                        </div>

                        {item.streamType === 'announcement' ? (
                          <button
                            onClick={() => handleDeleteAnnouncement(item.rawId)}
                            title="Delete Announcement"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 size={17} />
                          </button>
                        ) : item.streamType === 'module' ? (
                          <div className="flex items-center gap-2">
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black flex items-center gap-1.5 transition-colors"
                              >
                                <ExternalLink size={14} /> Open Link
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteModule(item.rawId)}
                              title="Delete Module"
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/teacher/activities/${item.rawId}/grading`, {
                              state: {
                                subject: selectedClassForView?.subject_description,
                                section: selectedClassForView?.section_name || selectedClassForView?.section,
                                quarter: item.activityObj?.quarter
                              }
                            })}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-black transition-colors"
                          >
                            Open Activity
                          </button>
                        )}
                      </div>

                      {item.message && (
                        <div className="mt-4 pl-14 text-sm font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                          {item.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CLASSWORK TAB */}
      {activeTab === 'Classwork' && (
        <div className="w-full mt-6 max-w-4xl mx-auto animate-slide-up">
          <div className="mb-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                className="px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                style={{ backgroundColor: themeColor, color: 'white' }}
                onClick={() => setShowTypeSelector(true)}
              >
                <Plus size={20} /> Create
              </button>
              <button
                className="px-5 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                onClick={handleOpenModuleModal}
              >
                <BookOpen size={18} /> Post Module / Video
              </button>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-300/50 pb-4">
              <div className="flex items-center gap-4">

                {/* 1. TOPIC FILTER */}
                <div className="relative mt-2">
                  <label className="absolute -top-2 left-3 bg-slate-50/80 backdrop-blur-md px-1.5 text-[11px] font-bold text-slate-500 z-10 rounded">Topic filter</label>
                  <select 
                    className="appearance-none bg-white/50 backdrop-blur-md border-2 border-slate-200/80 rounded-xl pl-4 pr-10 py-2 shadow-sm text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-400 focus:bg-white/80 transition-all relative z-0 w-48"
                    value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All topics</option>
                    {viewCategories.map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                </div>

                {/* 2. QUARTER / TERM FILTER */}
                <div className="relative mt-2">
                  <label className="absolute -top-2 left-3 bg-slate-50/80 backdrop-blur-md px-1.5 text-[11px] font-bold text-slate-500 z-10 rounded">
                    {isModalKto12 ? 'Quarter' : 'Term'}
                  </label>
                  <select 
                    className="appearance-none bg-white/50 backdrop-blur-md border-2 border-slate-200/80 rounded-xl pl-4 pr-10 py-2 shadow-sm text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-400 focus:bg-white/80 transition-all relative z-0 w-40"
                    value={filterQuarter} onChange={(e) => setFilterQuarter(e.target.value)}
                  >
                    <option value="">{isModalKto12 ? 'All quarters' : 'All terms'}</option>
                    {isModalKto12 ? (
                      [1, 2, 3, 4].map(q => <option key={q} value={q}>Quarter {q}</option>)
                    ) : (
                      ['Prelims', 'Midterms', 'Finals'].map(term => <option key={term} value={term}>{term}</option>)
                    )}
                  </select>
                  <ChevronDown size={16} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                </div>

              </div>

              {/* EXPAND / COLLAPSE BUTTON */}
              <button 
                className="flex items-center gap-1.5 font-bold text-sm hover:bg-white/50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                style={{ color: themeColor }} onClick={handleToggleAll}
              >
                {isAllCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                {isAllCollapsed ? 'Expand all' : 'Collapse all'}
              </button>
            </div>
          </div>

          {/* LEARNING MODULES & VIDEO LECTURES SECTION */}
          {modules.length > 0 && !filterCategory && (
            <div className="mb-10">
              <div className="flex justify-between items-center py-3 px-2">
                <h2 className="text-[1.6rem] font-normal tracking-tight leading-none text-emerald-700">
                  Learning Modules & Video Lectures
                </h2>
              </div>
              <div className="flex flex-col border-t border-slate-300/50">
                {modules.map(mod => (
                  <div
                    key={mod.id}
                    className="flex items-center gap-4 p-4 border-b border-slate-300/50 bg-white/40 hover:bg-white/80 backdrop-blur-md transition-all"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ${mod.module_type === 'video' ? 'bg-rose-500' : 'bg-emerald-600'}`}>
                      {mod.module_type === 'video' ? <Video size={20} /> : <BookOpen size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-[15px] truncate">{mod.title}</h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
                        {mod.module_type === 'video' ? 'Video Lecture' : 'Handout / Reading Material'}
                        {mod.description ? ` • ${mod.description}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {mod.file_url && (
                        <a
                          href={mod.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink size={14} /> Open
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Module"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <ActivitySkeletonList themeColor={themeColor} />
          ) : displayedActivities.length === 0 ? (
            <div className="text-center p-12 bg-white/40 border border-white rounded-3xl backdrop-blur-md shadow-sm mt-8 animate-slide-up">
              <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-bold text-lg">No activities found</p>
              <p className="text-slate-500 text-sm mt-1">Click "Create" to assign new work to your students.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10 pb-10">
              {viewCategories.map(category => {
                const items = displayedActivities.filter(act => matchesCategory(act.category, category.key));
                if (items.length === 0) return null;
                const isCollapsed = collapsedGroups[category.key];

                return (
                  <div key={category.key}>
                    <div className="flex justify-between items-center py-3 px-2 group cursor-pointer hover:bg-white/30 rounded-lg transition-all" onClick={() => toggleGroup(category.key)}>
                      <h2 className="text-[1.75rem] font-normal text-slate-800 tracking-tight leading-none" style={{ color: themeColor }}>{category.label}</h2>
                      <div className="flex items-center gap-1 text-slate-400">
                        <button className="p-2 hover:bg-slate-200/50 rounded-full transition-colors opacity-0 group-hover:opacity-100">{isCollapsed ? <ChevronDown size={22} /> : <ChevronUp size={22} />}</button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="flex flex-col border-t border-slate-300/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        {items.map(act => (
                          <div
                            key={act.id}
                            className="flex items-center gap-4 p-4 border-b border-slate-300/50 bg-white/30 hover:bg-white/70 backdrop-blur-md cursor-pointer transition-all group/item"
                            onClick={() => navigate(`/teacher/activities/${act.id}/grading`, { 
                              state: { 
                                subject: selectedClassForView?.subject_description, 
                                section: selectedClassForView?.section_name || selectedClassForView?.section,
                                quarter: act.quarter
                              } 
                            })}
                          >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: themeColor }}><FileText size={20} /></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-slate-800 text-[15px]">{act.title}</h3>
                                {act.category === 'seatwork' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">Seatwork</span>
                                )}
                                {act.category === 'quiz' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">Class Quiz</span>
                                )}
                                {act.category === 'activity' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">Activity</span>
                                )}
                                {act.category === 'performance' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">Performance Task</span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{act.max_score} pts {act.quarter && ` • Q${act.quarter}`}</p>
                            </div>
                            <div className="text-right flex items-center gap-4 relative">
                              <span className="text-sm font-semibold text-slate-500 hidden sm:block">{act.due_date ? `Due ${new Date(act.due_date).toLocaleDateString()}` : 'No due date'}</span>

                              <div className="relative">
                                <button
                                  className={`p-2 rounded-full transition-colors ${openMenuId === act.id ? 'bg-slate-200/80 text-slate-700 opacity-100' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 opacity-0 group-hover/item:opacity-100'}`}
                                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === act.id ? null : act.id); }}
                                >
                                  <MoreVertical size={20} />
                                </button>
                                {openMenuId === act.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] z-[100] py-1.5 animate-in fade-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2.5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditModal(act);
                                      }}
                                    >
                                      <Edit3 size={16} style={{ color: themeColor }} /> Edit Activity
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2.5"
                                      onClick={(e) => {
                                        e.stopPropagation(); setOpenMenuId(null);
                                        const shareLink = `${window.location.origin}/lms/exam/${act.id}`;
                                        navigator.clipboard.writeText(shareLink).then(() => { alert('Link copied to clipboard!\n\n' + shareLink); });
                                      }}
                                    >
                                      <LinkIcon size={16} style={{ color: themeColor }} /> Copy Link
                                    </button>
                                    <button
                                      className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2.5"
                                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleShareActivity(act); }}
                                    >
                                      <Share size={16} style={{ color: themeColor }} /> Share to Students
                                    </button>
                                    <div className="my-1 border-t border-slate-100" />
                                    <button
                                      className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        handleDeleteActivity(act);
                                      }}
                                    >
                                      <Trash2 size={16} /> Delete Activity
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <TypeSelectorModal
        isOpen={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        onSelectBasic={handleOpenModal}
        onSelectExam={() => {
          setShowTypeSelector(false);
          navigate('/teacher/activities/create-exam', { state: { classId: viewClassId } });
        }}
        onSelectModule={handleOpenModuleModal}
        themeColor={themeColor}
      />
      <CreateActivityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingActivityId(null);
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        selectedClass={selectedClassForView}
        modalCategories={viewCategories}
        isModalKto12={isModalKto12}
        themeColor={themeColor}
        isEditing={Boolean(editingActivityId)}
      />
      <CreateModuleModal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        moduleForm={moduleForm}
        setModuleForm={setModuleForm}
        onSubmit={handleCreateModule}
        isSubmitting={isSubmitting}
        selectedClass={selectedClassForView}
        themeColor={themeColor}
      />
    </div>
  );
};

export default TeacherActivities;
