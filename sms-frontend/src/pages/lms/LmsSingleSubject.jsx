import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, Video, CheckSquare, Award, Clock, MoreVertical, 
  MessageCircle, FileDown, PieChart as PieChartIcon, 
  LayoutGrid, List as ListIcon, CheckCircle, Loader2
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

  // ==========================================
  // [ SECTION 2: DYNAMIC STATES ]
  // Dito papasok ang totoong data galing sa database
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [courseFeed, setCourseFeed] = useState([]);
  const [dueSoon, setDueSoon] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [quarterStanding, setQuarterStanding] = useState({ status: 'Evaluating', grade: 0 });

  // FETCH CLASSROOM DATA
  useEffect(() => {
    const fetchClassroomData = async () => {
      setLoading(true);
      try {
        const studentIdentifier = user?.id || user?.username;
        // Ito ang bagong endpoint na kailangan sa backend
        const res = await axios.get(`${API_BASE_URL}/lms/get_classroom_feed.php?student_id=${studentIdentifier}&class_id=${id}`);
        
        if (res.data.status === 'success') {
         if (res.data.course_info) {
             setCourseInfo(res.data.course_info);
          }
          setCourseFeed(res.data.feed || []);
          setDueSoon(res.data.due_soon || []);
          setRecentGrades(res.data.recent_grades || []);
          setQuarterStanding(res.data.standing || { status: 'Evaluating', grade: 0 });
        }
      } catch (err) {
        console.error("Failed to fetch classroom data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id && user) fetchClassroomData();
  }, [id, user, API_BASE_URL]);

  // ==========================================
  // [ SECTION 3: FILTERING LOGIC ]
  // ==========================================
  const filteredFeed = courseFeed.filter(item => {
    if (currentTab === 'all') return true;
    if (currentTab === 'lectures' && item.type === 'lecture') return true;
    if (currentTab === 'videos' && item.type === 'video') return true;
    if (currentTab === 'activities' && item.type === 'activity') return true;
    if (currentTab === 'exams' && item.type === 'exam') return true;
    return false;
  });

  const getPostStyle = (type) => {
    switch(type) {
      case 'video': return { icon: <Video size={20}/>, bg: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400', tag: 'Video Lecture' };
      case 'activity': return { icon: <CheckSquare size={20}/>, bg: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400', tag: 'Written Activity' };
      case 'exam': return { icon: <Award size={20}/>, bg: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400', tag: 'Major Exam' };
      // FIX: Gumamit ng primary color para sa default files
      default: return { icon: <FileText size={20}/>, bg: 'bg-[var(--primary-color)]/20 text-[var(--primary-color)]', tag: 'Handout / PDF' };
    }
  };

  // ==========================================
  // [ SECTION 4: UI RENDER ]
  // ==========================================
  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 pb-20 transition-colors">
      
      {/* 1. THE CLASSROOM BANNER (Dynamic using Context Data) */}
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
            <p className="font-bold text-white/80 flex items-center gap-2">
              Teacher: {courseInfo.teacher || 'TBA'}
            </p>
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
                      <div key={task.id} className="group cursor-pointer">
                         <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[var(--primary-color)] dark:group-hover:text-blue-400 transition-colors">{task.title}</p>
                         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Due: {task.date} • {task.time}</p>
                      </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center py-2">No upcoming deadlines.</p>
               )}
               
               <button className="w-full mt-6 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] dark:text-white bg-[var(--primary-color)]/10 dark:bg-[var(--primary-color)] rounded-xl hover:brightness-90 transition-colors">View All</button>
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

         {/* RIGHT COLUMN: THE DYNAMIC FEED OR GRADES VIEW */}
         <div className="lg:col-span-3 space-y-6">
            
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <Loader2 className="animate-spin text-[var(--primary-color)] dark:text-slate-500 mb-4" size={40} />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Syncing Classroom...</p>
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
                        <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">No {currentTab} posted yet.</h3>
                     </div>
                  ) : (
                     filteredFeed.map((post) => {
                        const style = getPostStyle(post.type);
                        return (
                           <div key={post.id} className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-bottom-2">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center ${style.bg} shadow-inner`}>{style.icon}</div>
                                    <div>
                                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{style.tag}</span>
                                       <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white leading-tight group-hover:text-[var(--primary-color)] transition-colors cursor-pointer">{post.title}</h3>
                                       <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{post.date} • {post.time}</p>
                                    </div>
                                 </div>
                                 <button className="text-slate-300 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2"><MoreVertical size={18}/></button>
                              </div>

                              <div className="pl-16">
                                 <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4">{post.desc}</p>
                                 <div className="flex flex-wrap items-center gap-3">
                                    {post.type === 'video' && <button className="px-5 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"><Video size={16} /> Watch Video</button>}
                                    {post.type === 'lecture' && <button className="px-5 py-2.5 bg-[var(--primary-color)]/10 text-[var(--primary-color)] rounded-xl text-xs font-black flex items-center gap-2 hover:bg-[var(--primary-color)]/20 transition-colors"><FileDown size={16} /> Download PDF</button>}
                                    
                                    {/* KUNG EXAM O ACTIVITY NA PWEDE PANG I-TAKE O RETAKE */}
                                    {(post.type === 'activity' || post.type === 'exam') && (post.attempts < post.max_attempts || !post.status || post.status === 'Pending') && (
                                    <button 
                                       onClick={() => navigate(`/lms/exam/${post.id.replace('act_', '')}`)} 
                                       className="px-5 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-xs font-black flex items-center gap-2 hover:brightness-110 shadow-md transition-all group"
                                    >
                                       <Award size={16} className="group-hover:scale-110 transition-transform" /> 
                                       {post.attempts > 0 ? `Retake Exam (${post.attempts}/${post.max_attempts} Tries)` : 'Take Exam / Activity'}
                                    </button>
                                    )}

                                    {/* KUNG GRADED NA AT NA-EXHAUST NA LAHAT NG ATTEMPTS */}
                                    {(post.type === 'activity' || post.type === 'exam') && post.status === 'Graded' && post.attempts >= post.max_attempts && (
                                    <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                       <CheckCircle size={16} /> 
                                       Graded: {post.score}/{post.total} (Used: {post.attempts}/{post.max_attempts} Tries)
                                    </div>
                                    )}

                                    {/* KUNG NA-SUBMIT NA PERO HINDI PA NAMA-MARKAHAN NG TEACHER (Lalo na kung may Essay) */}
                                    {(post.type === 'activity' || post.type === 'exam') && post.status === 'Submitted' && post.attempts >= post.max_attempts && (
                                    <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black border border-amber-100 dark:border-amber-500/20 flex items-center gap-2">
                                       <Clock size={16} /> 
                                       Waiting for Grade
                                    </div>
                                    )}
                                    <button className="px-4 py-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"><MessageCircle size={16} /> Add class comment</button>
                                 </div>
                              </div>
                           </div>
                        )
                     })
                  )}
               </>
            )}

         </div>
      </div>

    </div>
  );
};

export default LmsSingleSubject;