import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, Video, CheckSquare, Award, Clock, MoreVertical, 
  MessageCircle, FileDown, PieChart as PieChartIcon, 
  LayoutGrid, List as ListIcon, CheckCircle, Loader2, User, Megaphone, Users, ExternalLink,
  Lock, AlertCircle, Upload, Send, X, Eye, Edit3, Image, Paperclip
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LmsSingleSubject = () => {
  const { id } = useParams(); // Ito ang class_id
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get('tab') || 'all';
  const { user, API_BASE_URL } = useAuth();

  // [ SECTION 1: INSTANT HEADER LOAD ]
  const [courseInfo, setCourseInfo] = useState({ tag: 'SYNCING...', title: 'Loading Subject...', teacher: 'Fetching Teacher...' });

  const [gradesViewMode, setGradesViewMode] = useState('list'); // 'list' or 'card'
  const [submittingWork, setSubmittingWork] = useState(null);
  const [workForm, setWorkForm] = useState({ content: '', url: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // ==========================================
  // [ SECTION 2: DYNAMIC STATES ]
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [courseFeed, setCourseFeed] = useState([]);
  const [dueSoon, setDueSoon] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [classmates, setClassmates] = useState([]);
  const [quarterStanding, setQuarterStanding] = useState({ status: 'Evaluating', grade: 0 });

  // FETCH CLASSROOM DATA
  const fetchClassroomData = async () => {
      setLoading(true);
      try {
        const studentIdentifier = user?.student_id || user?.id || user?.username;
        const res = await axios.get(`${API_BASE_URL}/lms/get_classroom_feed.php?student_id=${studentIdentifier}&class_id=${id}`);
        
        if (res.data.status === 'success') {
          if (res.data.course_info) {
            setCourseInfo(res.data.course_info);
          }
          setCourseFeed(res.data.feed || []);
          setDueSoon(res.data.due_soon || []);
          setRecentGrades(res.data.recent_grades || []);
          setClassmates(res.data.classmates || []);
          setQuarterStanding(res.data.standing || { status: 'Evaluating', grade: 0 });
        }
      } catch (err) {
        console.error("Failed to fetch classroom data:", err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (id && user) fetchClassroomData();
  }, [id, user, API_BASE_URL]);

  useEffect(() => {
    if (!submittingWork) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSubmittingWork(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submittingWork]);

  const handleOpenSubmitModal = (post) => {
    setSubmittingWork(post);
    setSelectedFile(null);
    setFilePreview(null);
    setWorkForm({
      content: post.submission?.content || '',
      url: post.submission?.url || ''
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmitWrittenWork = async () => {
    if (!submittingWork) return;
    if (!selectedFile && !workForm.url.trim() && !workForm.content.trim()) {
      alert("Please provide at least one: an uploaded photo/file of your paper work, a video/docs link, or a written answer.");
      return;
    }
    setIsSubmittingWork(true);
    try {
      const studentIdentifier = user?.student_id || user?.id || user?.username;
      const formData = new FormData();
      formData.append('activity_id', submittingWork.id.replace('act_', ''));
      formData.append('student_id', studentIdentifier);
      formData.append('submission_content', workForm.content);
      formData.append('submission_url', workForm.url);
      if (selectedFile) {
        formData.append('submission_file', selectedFile);
      }

      const res = await axios.post(`${API_BASE_URL}/lms/submit_activity.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status === 'success') {
        alert("Work successfully submitted! Your teacher will review and grade your submission.");
        setSubmittingWork(null);
        setSelectedFile(null);
        setFilePreview(null);
        fetchClassroomData();
      } else {
        alert(res.data.message || "Failed to submit work.");
      }
    } catch (err) {
      console.error("Submit work error:", err);
      alert(err.response?.data?.message || "Error submitting work. Please try again.");
    } finally {
      setIsSubmittingWork(false);
    }
  };

  // ==========================================
  // [ SECTION 3: FILTERING LOGIC ]
  // ==========================================
  const filteredFeed = courseFeed.filter(item => {
    if (currentTab === 'all') return true;
    if (currentTab === 'announcements' && item.type === 'announcement') return true;
    if (currentTab === 'lectures' && item.type === 'lecture') return true;
    if (currentTab === 'videos' && item.type === 'video') return true;
    if (currentTab === 'activities') {
      // User: "Sa LMS activities makikita yung seatwork, quizzes and written work"
      return item.type === 'activity' || ['seatwork', 'quiz', 'written', 'performance', 'activity'].includes(item.category);
    }
    if (currentTab === 'exams') {
      // User: "then exams yung quarterly exams or periodically"
      return item.type === 'exam' || ['exam', 'quarterly', 'periodical', 'prelim', 'midterm', 'finals'].includes(item.category);
    }
    return false;
  });

  const getPostStyle = (type, subType, category) => {
    if (category === 'quiz') {
      return { icon: <FileText size={20}/>, bg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', tag: 'Class Quiz' };
    }
    if (category === 'seatwork') {
      return { icon: <CheckSquare size={20}/>, bg: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400', tag: 'Seatwork' };
    }
    if (category === 'written') {
      return { icon: <CheckSquare size={20}/>, bg: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400', tag: 'Written Work' };
    }
    if (category === 'performance') {
      return { icon: <Award size={20}/>, bg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400', tag: 'Performance Task' };
    }
    if (type === 'exam' || ['exam', 'quarterly', 'periodical', 'prelim', 'midterm', 'finals'].includes(category)) {
      return { icon: <Award size={20}/>, bg: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400', tag: 'Quarterly Examination' };
    }
    switch(type) {
      case 'announcement':
        if (subType === 'Urgent Alert') {
          return { icon: <Megaphone size={20}/>, bg: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400', tag: 'Urgent Class Alert' };
        }
        if (subType === 'Task Reminder') {
          return { icon: <Megaphone size={20}/>, bg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400', tag: 'Task Reminder' };
        }
        return { icon: <Megaphone size={20}/>, bg: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400', tag: 'Class Announcement' };
      case 'video': return { icon: <Video size={20}/>, bg: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400', tag: 'Video Lecture' };
      case 'activity': return { icon: <CheckSquare size={20}/>, bg: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400', tag: 'Class Activity' };
      case 'exam': return { icon: <Award size={20}/>, bg: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400', tag: 'Major Exam' };
      default: return { icon: <FileText size={20}/>, bg: 'bg-[var(--primary-color)]/20 text-[var(--primary-color)]', tag: 'Handout / Module' };
    }
  };

  // ==========================================
  // [ SECTION 4: UI RENDER ]
  // ==========================================
  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 pb-20 transition-colors">
      
      {/* 1. THE CLASSROOM BANNER */}
      <div className="bg-[var(--primary-color)] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-[var(--primary-color)]/20 dark:shadow-none mb-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8 transition-colors">
         <div className="absolute -right-10 -top-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
         <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>

         <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-black/20 backdrop-blur-md text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10">
              {courseInfo.tag || 'SUBJECT CODE'}
            </span>
            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight leading-tight max-w-2xl drop-shadow-sm">
              {courseInfo.title || 'Loading Subject...'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-white/90 mt-2">
              <span className="flex items-center gap-1.5"><User size={14} /> Teacher: {courseInfo.teacher || 'TBA'}</span>
              {courseInfo.section_name && <span className="flex items-center gap-1.5 opacity-80">• Section: {courseInfo.section_name}</span>}
              {courseInfo.schedule && <span className="flex items-center gap-1.5 opacity-80"><Clock size={13} /> {courseInfo.schedule}</span>}
              {courseInfo.room && courseInfo.room !== 'TBA' && <span className="flex items-center gap-1.5 opacity-80">• Room: {courseInfo.room}</span>}
            </div>
         </div>

         {/* PIE CHART (Dynamic Standing) */}
         <div className="relative z-10 bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 flex items-center gap-6 shadow-2xl">
            <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Quarter Standing</span>
               <span className="text-2xl font-black text-white">{quarterStanding.status}</span>
               <button onClick={() => navigate('?tab=grades')} className="text-[10px] font-bold text-white/80 underline mt-1 text-left hover:text-white">View full breakdown</button>
            </div>
            <div className="w-20 h-20 rounded-full flex items-center justify-center relative shadow-inner" style={{ background: `conic-gradient(#4ade80 ${quarterStanding.grade}%, rgba(255,255,255,0.2) 0)` }}>
               <div className="w-16 h-16 bg-[var(--primary-color)] rounded-full flex items-center justify-center">
                  <span className="text-sm font-black text-white">{quarterStanding.grade}%</span>
               </div>
            </div>
         </div>
      </div>

      {/* 2. MAIN LAYOUT (Left Widget + Right Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         
         {/* LEFT COLUMN: WIDGETS */}
         <div className="lg:col-span-1 space-y-6">
            
            {/* Widget 1: Due Soon */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
               <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Clock size={16} className="text-orange-500 dark:text-orange-400"/> Due Soon</h3>
               
               {loading ? (
                 <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-300 dark:text-slate-600" size={20} /></div>
               ) : dueSoon.length > 0 ? (
                 <div className="space-y-4">
                    {dueSoon.map((task) => (
                      <div key={task.id} onClick={() => navigate(`/lms/exam/${task.id}`)} className="group cursor-pointer">
                         <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[var(--primary-color)] dark:group-hover:text-blue-400 transition-colors">{task.title}</p>
                         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Due: {task.date} • {task.time}</p>
                      </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center py-2">No upcoming deadlines.</p>
               )}
               
               <button onClick={() => navigate('?tab=activities')} className="w-full mt-6 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] dark:text-white bg-[var(--primary-color)]/10 dark:bg-[var(--primary-color)] rounded-xl hover:brightness-90 transition-colors">View All Activities</button>
            </div>

            {/* Widget 2: Recent Grades */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
               <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2"><PieChartIcon size={16} className="text-emerald-500 dark:text-emerald-400"/> Recent Grades</h3>
               
               {loading ? (
                 <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-300 dark:text-slate-600" size={20} /></div>
               ) : recentGrades.length > 0 ? (
                 <div className="space-y-4">
                    {recentGrades.slice(0, 3).map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center group cursor-pointer" onClick={() => navigate('?tab=grades')}>
                          <div>
                             <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate max-w-[120px]">{item.title}</p>
                             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{item.type}</p>
                          </div>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                             {item.score}/{item.total}
                          </span>
                       </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center py-2">No recent grades.</p>
               )}
               
               <button onClick={() => navigate('?tab=grades')} className="w-full mt-6 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl hover:brightness-95 transition-colors">Open Grades Log</button>
            </div>

         </div>

         {/* RIGHT COLUMN: THE DYNAMIC FEED, GRADES VIEW, OR CLASSMATES VIEW */}
         <div className="lg:col-span-3 space-y-6">
            
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <Loader2 className="animate-spin text-[var(--primary-color)] dark:text-slate-500 mb-4" size={40} />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Syncing Classroom...</p>
               </div>
            ) : currentTab === 'people' ? (
               /* 🟢 CLASSMATES / PEOPLE TAB 🟢 */
               <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 space-y-8 transition-colors">
                  {/* Teacher Section */}
                  <div>
                     <h2 className="text-lg font-black text-[var(--primary-color)] dark:text-blue-400 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4 flex items-center gap-2">
                        <User size={20} /> Subject Teacher
                     </h2>
                     <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--primary-color)] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm overflow-hidden">
                           {courseInfo.teacher_image && courseInfo.teacher_image !== 'null' ? (
                              <img src={`${API_BASE_URL}/uploads/profiles/${courseInfo.teacher_image}`} alt="Teacher" className="w-full h-full object-cover" />
                           ) : (
                              (courseInfo.teacher || 'T').charAt(0)
                           )}
                        </div>
                        <div>
                           <h3 className="font-black text-slate-800 dark:text-white text-base">{courseInfo.teacher || 'To Be Assigned'}</h3>
                           <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                              {courseInfo.title} • {courseInfo.section_name || 'Instructor'}
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Classmates Section */}
                  <div>
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
                        <h2 className="text-lg font-black text-[var(--primary-color)] dark:text-blue-400 flex items-center gap-2">
                           <Users size={20} /> Classmates
                        </h2>
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black">
                           {classmates.length} {classmates.length === 1 ? 'Student' : 'Students'}
                        </span>
                     </div>

                     {classmates.length === 0 ? (
                        <p className="text-center text-slate-400 dark:text-slate-500 py-10 font-bold text-sm">No classmates enrolled in this section yet.</p>
                     ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {classmates.map((peer, idx) => (
                              <div key={peer.student_id || idx} className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                 <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-[var(--primary-color)] dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
                                    {peer.profile_image && peer.profile_image !== 'null' ? (
                                       <img src={peer.profile_image.startsWith('http') ? peer.profile_image : `${API_BASE_URL}/uploads/profiles/${peer.profile_image}`} alt={peer.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                       (peer.first_name || 'S').charAt(0)
                                    )}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <p className="font-black text-slate-800 dark:text-white text-sm truncate">{peer.full_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ID: {peer.student_id}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            ) : currentTab === 'grades' ? (
               /* KUNG NASA 'GRADES' TAB: Ipakita ang Dedicated Grades UI */
               <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 transition-colors">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                     <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Award className="text-emerald-500 dark:text-emerald-400" /> My Grades Log</h2>
                     
                     <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                        <button onClick={() => setGradesViewMode('card')} className={`p-2 rounded-lg transition-all ${gradesViewMode === 'card' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}><LayoutGrid size={16} /></button>
                        <button onClick={() => setGradesViewMode('list')} className={`p-2 rounded-lg transition-all ${gradesViewMode === 'list' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}><ListIcon size={16} /></button>
                     </div>
                  </div>

                  {recentGrades.length === 0 ? (
                    <p className="text-center text-slate-400 dark:text-slate-500 py-10 font-bold text-sm">No graded activities yet.</p>
                  ) : gradesViewMode === 'card' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentGrades.map(item => (
                           <div key={item.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 group">
                              <div className="flex justify-between items-start mb-4">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded-md">{item.type}</span>
                                  <CheckCircle size={16} className="text-emerald-400 dark:text-emerald-500" />
                              </div>
                              <h3 className="font-black text-slate-800 dark:text-white mb-1">{item.title}</h3>
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-4">Graded on: {item.date}</p>
                              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end">
                                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Score</span>
                                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{item.score}<span className="text-sm text-slate-400 dark:text-slate-500">/{item.total}</span></span>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {recentGrades.map(item => (
                           <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Award size={18} /></div>
                                  <div>
                                     <h3 className="font-black text-slate-800 dark:text-white text-sm">{item.title}</h3>
                                     <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{item.type} • {item.date}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{item.score}<span className="text-xs text-slate-400 dark:text-slate-500">/{item.total}</span></span>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            ) : (
               /* KUNG NASA IBANG TAB (Lectures, Videos, All, etc.): Ipakita ang Feed */
               <>
                  {currentTab !== 'all' && (
                     <div className="flex items-center gap-2 mb-2 text-sm font-black text-slate-600 dark:text-slate-300 transition-colors">
                        <span className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse"></span>
                        Showing filter: <span className="uppercase text-[var(--primary-color)]">{currentTab}</span>
                     </div>
                  )}

                  {filteredFeed.length === 0 ? (
                     <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-12 border border-slate-100 dark:border-slate-700 shadow-sm text-center animate-in fade-in transition-colors">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-500"><CheckSquare size={32} /></div>
                        <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">No {currentTab === 'all' ? 'posts or announcements' : currentTab} posted yet.</h3>
                     </div>
                  ) : (
                     filteredFeed.map((post) => {
                        const style = getPostStyle(post.type, post.status, post.category);
                        return (
                           <div key={post.id} className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-bottom-2">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center ${style.bg} shadow-inner`}>{style.icon}</div>
                                    <div>
                                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{style.tag}</span>
                                       <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white leading-tight group-hover:text-[var(--primary-color)] transition-colors cursor-pointer">{post.title}</h3>
                                       <div className="flex flex-wrap items-center gap-2 mt-1">
                                       <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Posted: {post.date} • {post.time}</p>
                                       {post.due_date_formatted && (
                                         <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                           post.is_closed 
                                             ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' 
                                             : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                                         }`}>
                                           <Clock size={11} /> {post.is_closed ? 'Deadline Expired:' : 'Due:'} {post.due_date_formatted}
                                         </span>
                                       )}
                                       {post.open_date_formatted && post.is_not_open_yet && (
                                         <span className="text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                                           <Clock size={11} /> Opens: {post.open_date_formatted}
                                         </span>
                                       )}
                                    </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="pl-16">
                                 <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-line leading-relaxed">{post.desc}</p>
                                 <div className="flex flex-wrap items-center gap-3">
                                    {post.type === 'video' && (
                                      <button
                                        onClick={() => post.attachment_url ? window.open(post.attachment_url, '_blank', 'noopener,noreferrer') : alert('Video resource link will be provided by your teacher.')}
                                        className="px-5 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                                      >
                                        <Video size={16} /> Watch Video Lecture <ExternalLink size={13} />
                                      </button>
                                    )}
                                    {post.type === 'lecture' && (
                                      <button
                                        onClick={() => post.attachment_url ? window.open(post.attachment_url, '_blank', 'noopener,noreferrer') : alert('Handout / module text is shown above.')}
                                        className="px-5 py-2.5 bg-[var(--primary-color)]/10 text-[var(--primary-color)] rounded-xl text-xs font-black flex items-center gap-2 hover:bg-[var(--primary-color)]/20 transition-colors"
                                      >
                                        <FileDown size={16} /> {post.attachment_url ? 'Open / Download Handout' : 'View Module Details'}
                                      </button>
                                    )}
                                    
                                    {/* ─── KUNG HINDI PA BUKAS (SCHEDULED IN FUTURE) ─── */}
                                    {(post.type === 'activity' || post.type === 'exam') && post.is_not_open_yet && (
                                       <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-black flex items-center gap-2 border border-slate-200 dark:border-slate-600">
                                          <Lock size={15} /> Locked • Opens on {post.open_date_formatted || 'scheduled time'}
                                       </div>
                                    )}

                                    {/* ─── SCENARIO A: INTERACTIVE ASSESSMENT MAY QUESTIONS (QUIZ / EXAM) ─── */}
                                    {(post.type === 'activity' || post.type === 'exam') && post.has_questions && !post.is_not_open_yet && (
                                      <>
                                        {/* KUNG CLOSED AT NAKA-TAKE NA (BAWAL NA RETAKE KAHIT MAY TRIES PA) */}
                                        {post.is_closed && (post.attempts > 0 || post.status === 'Graded') && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                              <CheckCircle size={15} /> Final Score: {post.score ?? 0}/{post.total ?? 0} (Activity Closed)
                                            </div>
                                            <button
                                              onClick={() => navigate(`/lms/exam/${post.id.replace('act_', '')}`)}
                                              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                                            >
                                              <Award size={15} /> View Result
                                            </button>
                                          </div>
                                        )}

                                        {/* KUNG CLOSED AT HINDI NAKA-TAKE */}
                                        {post.is_closed && (!post.attempts || post.attempts === 0) && post.status !== 'Graded' && (
                                          <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black flex items-center gap-2 border border-rose-200 dark:border-rose-500/30">
                                            <Lock size={15} /> Closed • Deadline Expired
                                          </div>
                                        )}

                                        {/* KUNG OPEN AT PWEDE PANG I-TAKE O RETAKE */}
                                        {!post.is_closed && (post.attempts < post.max_attempts || !post.status || post.status === 'Pending') && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            {post.status === 'Graded' && (
                                              <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                                <CheckCircle size={15} /> Best Score: {post.score ?? 0}/{post.total ?? 0}
                                              </div>
                                            )}
                                            <button 
                                               onClick={() => navigate(`/lms/exam/${post.id.replace('act_', '')}`)} 
                                               className="px-5 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-xs font-black flex items-center gap-2 hover:brightness-110 shadow-md transition-all group cursor-pointer"
                                            >
                                               <Award size={16} className="group-hover:scale-110 transition-transform" /> 
                                               {post.attempts > 0 ? `Retake (${post.attempts}/${post.max_attempts} Tries • Keeps Highest)` : 'Take Assessment'}
                                            </button>
                                          </div>
                                        )}

                                        {/* KUNG GRADED NA AT NAUBOS NA ANG ATTEMPTS PERO HINDI CLOSED */}
                                        {!post.is_closed && post.status === 'Graded' && post.attempts >= post.max_attempts && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                               <CheckCircle size={16} /> 
                                               Final Score: {post.score}/{post.total} (Attempts Exhausted)
                                            </div>
                                            <button
                                              onClick={() => navigate(`/lms/exam/${post.id.replace('act_', '')}`)}
                                              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                                            >
                                              <Award size={15} /> View Result
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    )}

                                    {/* ─── SCENARIO B: WRITTEN WORK / TASK / SUBMISSION (WALANG QUIZ QUESTIONS) ─── */}
                                    {(post.type === 'activity' || post.type === 'exam') && !post.has_questions && !post.is_not_open_yet && (
                                      <>
                                        {/* KUNG GRADED NA NG TEACHER */}
                                        {post.status === 'Graded' && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                               <CheckCircle size={16} /> 
                                               Graded: {post.score ?? 0}/{post.total ?? 100}
                                            </div>
                                            <button
                                              onClick={() => handleOpenSubmitModal(post)}
                                              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            >
                                              <Eye size={15} /> View Submission & Grade
                                            </button>
                                          </div>
                                        )}

                                        {/* KUNG NAKA-SUBMIT NA AT NAGHIHINTAY NG GRADE */}
                                        {post.status === 'Submitted' && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black border border-amber-100 dark:border-amber-500/20 flex items-center gap-2">
                                               <Clock size={16} /> Submitted • Waiting for Teacher's Grade
                                            </div>
                                            <button
                                              onClick={() => handleOpenSubmitModal(post)}
                                              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            >
                                              <Edit3 size={15} /> View / Edit Submission
                                            </button>
                                          </div>
                                        )}

                                        {/* KUNG CLOSED AT HINDI NAKAPAG-SUBMIT */}
                                        {post.is_closed && post.status !== 'Graded' && post.status !== 'Submitted' && (
                                          <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black flex items-center gap-2 border border-rose-200 dark:border-rose-500/30">
                                            <Lock size={15} /> Closed • Deadline Expired
                                          </div>
                                        )}

                                        {/* KUNG HINDI PA NAKA-SUBMIT AT OPEN PA */}
                                        {!post.is_closed && post.status !== 'Graded' && post.status !== 'Submitted' && (
                                          <button 
                                             onClick={() => handleOpenSubmitModal(post)} 
                                             className="px-5 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-xs font-black flex items-center gap-2 hover:brightness-110 shadow-md transition-all group"
                                          >
                                             <Upload size={16} className="group-hover:scale-110 transition-transform" /> 
                                             Submit Written Work / Link
                                          </button>
                                        )}
                                      </>
                                    )}                                 </div>
                              </div>
                           </div>
                        )
                     })
                  )}
               </>
            )}

         </div>
      </div>

      {/* ─── MODAL: SUBMIT WRITTEN WORK / TASK / GOOGLE DOCS LINK ─── */}
      {submittingWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto" onClick={() => setSubmittingWork(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[var(--primary-color)] to-slate-900 text-white flex justify-between items-start flex-shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md mb-2 inline-block">
                  {submittingWork.category ? submittingWork.category.toUpperCase() : 'WRITTEN WORK'} • {submittingWork.total || 100} PTS
                </span>
                <h2 className="text-xl font-black">{submittingWork.title}</h2>
                {submittingWork.due_date_formatted && (
                  <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
                    <Clock size={12} /> Deadline: {submittingWork.due_date_formatted}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSubmittingWork(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Instructions */}
              {submittingWork.desc && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Teacher Instructions</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                    {submittingWork.desc}
                  </p>
                </div>
              )}

              {/* Grade info if already graded */}
              {submittingWork.status === 'Graded' && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">Grade Recorded</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Your teacher has graded this submission.</p>
                  </div>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {submittingWork.score ?? 0} <span className="text-sm text-slate-400">/ {submittingWork.total ?? 100}</span>
                  </span>
                </div>
              )}

              {/* ─── OPTION 1: PHOTO OF PAPER WORK / FILE UPLOAD ─── */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider">
                  <Image size={16} className="text-[var(--primary-color)]" />
                  <span>Upload Paper Work Photo / Document</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Take a clear photo of your handwritten paper work, drawings, or upload a PDF / file.
                </p>

                {submittingWork.status !== 'Graded' && (!submittingWork.is_closed || submittingWork.status !== 'Submitted') && (
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors">
                      <Paperclip size={14} /> Choose Photo or File
                      <input 
                        type="file" 
                        accept="image/*,.pdf,.doc,.docx" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                    </label>
                    {selectedFile && (
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[200px]">
                        {selectedFile.name}
                      </span>
                    )}
                  </div>
                )}

                {/* Preview of newly selected image */}
                {filePreview && (
                  <div className="mt-3 relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                    <img src={filePreview} alt="Paper work preview" className="max-h-48 rounded-xl object-contain" />
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                      className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Previously uploaded file info */}
                {submittingWork.submission?.file_url && !selectedFile && (
                  <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                      Attached: {submittingWork.submission.file_url}
                    </span>
                    <a
                      href={`${API_BASE_URL}/api/uploads/submissions/${submittingWork.submission.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[var(--primary-color)] hover:underline shrink-0 flex items-center gap-1"
                    >
                      View <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>

              {/* ─── OPTION 2: VIDEO LINK / GOOGLE DOCS LINK ─── */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ExternalLink size={13} className="text-indigo-500" /> Video Performance Link (Dance / Presentation) or Google Docs
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="e.g. YouTube video, Google Drive dance video, or Google Docs link"
                    disabled={submittingWork.status === 'Graded' || (submittingWork.is_closed && submittingWork.status === 'Submitted')}
                    value={workForm.url}
                    onChange={(e) => setWorkForm({ ...workForm, url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition-all pr-24"
                  />
                  {workForm.url && String(workForm.url).startsWith('http') && (
                    <a
                      href={workForm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      Test <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                  Tip: For dance/performance tasks, paste your YouTube or Google Drive video link. Set access to "Anyone with the link can view".
                </p>
              </div>

              {/* Written Notes / Answer Input */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Written Answer / Submission Notes
                </label>
                <textarea
                  rows={4}
                  disabled={submittingWork.status === 'Graded' || (submittingWork.is_closed && submittingWork.status === 'Submitted')}
                  placeholder="Type your answer, essay, or comments for your teacher here..."
                  value={workForm.content}
                  onChange={(e) => setWorkForm({ ...workForm, content: e.target.value })}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSubmittingWork(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {submittingWork.status === 'Graded' ? 'Close' : 'Cancel'}
              </button>
              {submittingWork.status !== 'Graded' && (!submittingWork.is_closed || submittingWork.status !== 'Submitted') && (
                <button
                  type="button"
                  disabled={isSubmittingWork || (!selectedFile && !workForm.url.trim() && !workForm.content.trim())}
                  onClick={handleSubmitWrittenWork}
                  className="px-6 py-2.5 rounded-xl bg-[var(--primary-color)] text-white font-black text-xs hover:brightness-110 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingWork ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submittingWork.submission ? 'Update Submission' : 'Turn In Work'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LmsSingleSubject;
