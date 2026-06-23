import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getTeacherLevel, getGradingCategories } from '../../utils/gradingUtils';
import {
  Plus, BookOpen, FileText, MoreVertical, ChevronDown, ChevronUp, MessageSquare, Share, Link as LinkIcon, Edit3
} from 'lucide-react';

import {
  gcGlassStyles,
  ActivitySkeletonList,
  TypeSelectorModal,
  CreateActivityModal
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
  const [activeTab, setActiveTab] = useState('Stream'); // 🟢 Default na ito
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filterCategory, setFilterCategory] = useState('');
  const [filterQuarter, setFilterQuarter] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);

  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ class_id: '', title: '', description: '', category: '', quarter: '', max_score: 100, due_date: '' });

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

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleOpenModal = () => {
    setFormData(prev => ({ ...prev, class_id: viewClassId, category: '', quarter: '' }));
    setShowTypeSelector(false);
    setIsModalOpen(true);
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
      const payload = { ...formData, teacher_id: user.id, quarter: isModalKto12 ? parseInt(formData.quarter) : null };
      const res = await axios.post(`${API_BASE_URL}/teacher/create_activity.php`, payload, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.status === 'success') {
        setIsModalOpen(false);
        setFormData({ class_id: '', title: '', description: '', category: '', quarter: '', max_score: 100, due_date: '' });
        alert('Activity created successfully!');
        fetchActivities();
      }
    } catch (err) {
      alert('Failed to create activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareActivity = async (activity) => {
    if (!window.confirm(`Share "${activity.title}" to all students in this class? They will receive a notification.`)) return;

    try {
      const token = localStorage.getItem('sms_token');
      const payload = { activity_id: activity.id, class_id: viewClassId, title: activity.title };
      const res = await axios.post(`${API_BASE_URL}/teacher/share_activity.php`, payload, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.status === 'success') alert('Activity shared successfully! All enrolled students have been notified.');
      else alert(res.data.message || 'Failed to share activity.');
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

  const displayedActivities = activities.filter(act => {
    if (act.category === 'performance') return false;
    if (filterCategory && act.category !== filterCategory) return false;
    if (filterQuarter && String(act.quarter) !== String(filterQuarter)) return false;
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto pb-10">
      <style>{gcGlassStyles(themeColor)}</style>

      {/* TABS */}
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

      {/* STREAM TAB */}
      {activeTab === 'Stream' && (
        <div className="w-full mt-4 animate-slide-up">

          {/* 🟢 EXACT GOOGLE CLASSROOM HERO BANNER 🟢 */}
          <div className="relative w-full h-[240px] rounded-[1.5rem] overflow-hidden mb-6 shadow-md" style={{ background: 'linear-gradient(135deg, #d49a2a 0%, #4a545c 100%)' }}>
            {/* Malaking Curve na Transparent sa Kanan */}
            <div className="absolute right-[-10%] top-[-20%] w-[450px] h-[450px] bg-black/10 rounded-full" />

            {/* Customize Button (Top Right) */}
            <div className="absolute top-5 right-5 z-10">
              <button
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm"
                onClick={() => alert("Customization coming soon!")}
              >
                <Edit3 size={16} /> Customize
              </button>
            </div>

            {/* Texts (Bottom Left) */}
            <div className="absolute bottom-6 left-8 z-10">
              <h1 className="text-white text-[2.4rem] leading-none font-bold tracking-tight mb-2 drop-shadow-sm">
                {selectedClassForView ? selectedClassForView.subject_description : 'Earth and Life Science'}
              </h1>
              <p className="text-white/90 text-[1.1rem] font-semibold drop-shadow-sm">
                {selectedClassForView ? `${selectedClassForView.section_name || selectedClassForView.section} • ${selectedClassForView.grade_level || ''}` : 'Malabhan • Grade 11'}
              </p>
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-md border border-white rounded-2xl p-6 shadow-sm mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm" style={{ backgroundColor: themeColor }}>
                {user?.full_name?.charAt(0) || 'T'}
              </div>
              <div className="flex-1 bg-white border border-slate-200 rounded-full px-5 py-3.5 text-slate-500 font-bold text-sm cursor-pointer hover:bg-slate-50 transition-colors shadow-inner" onClick={() => alert("Announcement creation coming soon!")}>
                Announce something to your class
              </div>
            </div>

            <div className="text-center py-16 bg-white/40 border border-white rounded-3xl backdrop-blur-md shadow-sm">
              <MessageSquare size={54} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-black text-xl">This is where you can talk to your class</p>
              <p className="text-slate-500 text-sm mt-2 font-semibold">Use the stream to share announcements, syllabi, and engaging materials.</p>
            </div>
          </div>
        </div>
      )}

      {/* CLASSWORK TAB */}
      {activeTab === 'Classwork' && (
        <div className="w-full mt-6 max-w-4xl mx-auto animate-slide-up">
          <div className="mb-8">
            <div className="mb-6">
              <button
                className="px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                style={{ backgroundColor: themeColor, color: 'white' }}
                onClick={() => setShowTypeSelector(true)}
              >
                <Plus size={20} /> Create
              </button>
            </div>

           <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-300/50 pb-4">
              <div className="flex items-center gap-4">

                {/* 1. TOPIC FILTER (LAGING NANDITO) */}
                <div className="relative mt-2">
                  <label className="absolute -top-2 left-3 bg-slate-50/80 backdrop-blur-md px-1.5 text-[11px] font-bold text-slate-500 z-10 rounded">Topic filter</label>
                  <select 
                    className="appearance-none bg-white/50 backdrop-blur-md border-2 border-slate-200/80 rounded-xl pl-4 pr-10 py-2 shadow-sm text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-400 focus:bg-white/80 transition-all relative z-0 w-48"
                    value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All topics</option>
                    {viewCategories.filter(cat => cat.key !== 'performance').map(cat => (
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
                    
                    {/* Kung K-12, numbers 1-4 ang lalabas. Kung College, Prelim, Midterm, Finals */}
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
              {viewCategories.filter(c => c.key !== 'performance').map(category => {
                const items = displayedActivities.filter(act => act.category === category.key);
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
})}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: themeColor }}><FileText size={20} /></div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-800 text-[15px]">{act.title}</h3>
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
                                        e.stopPropagation(); setOpenMenuId(null);
                                        const shareLink = `${window.location.origin}/student/activity/${act.id}`;
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

      <TypeSelectorModal isOpen={showTypeSelector} onClose={() => setShowTypeSelector(false)} onSelectBasic={handleOpenModal} onSelectExam={() => { setShowTypeSelector(false); navigate('/teacher/activities/create-exam', { state: { classId: viewClassId } }); }} themeColor={themeColor} />
      <CreateActivityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} formData={formData} setFormData={setFormData} onSubmit={handleSubmit} isSubmitting={isSubmitting} selectedClass={selectedClassForView} modalCategories={viewCategories} isModalKto12={isModalKto12} themeColor={themeColor} />
    </div>
  );
};

export default TeacherActivities;