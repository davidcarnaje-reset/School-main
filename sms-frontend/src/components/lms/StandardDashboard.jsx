import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, User, Clock, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

const StandardDashboard = ({ courses, nextLessons }) => {
  const navigate = useNavigate(); // 2. INITIALIZE NAVIGATE

  return (
    <div className="animate-in fade-in duration-700">
      
      {/* COURSES SECTION */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
               <Sparkles className="text-amber-500 animate-pulse" /> Recently Accessed
            </h2>
            <button 
               onClick={() => navigate('/lms/courses')} 
               // FIX: Gumamit ng bg-[var(--primary-color)] para sumunod sa theme setting
               className="px-6 py-2 bg-[var(--primary-color)] hover:brightness-110 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-lg transition-all active:scale-95"
            >
               View All Courses
            </button>
         </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
               <div 
                  key={course.class_id} 
                  className="p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden text-white group transition-all hover:scale-[1.02] min-h-[320px] flex flex-col justify-between"
                  style={{ 
                     backgroundColor: course.color?.replace('bg-[', '').replace(']', '') || 'var(--primary-color)' 
                  }}
               >
                  {/* Background Pattern Overlay para maging aesthetic */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>

                  <div className="relative z-10">
                     <div className="flex justify-between items-start mb-4">
                     <span className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                        {course.tag || course.subject_code}
                     </span>
                     <BookMarked size={18} className="opacity-40" />
                     </div>

                     <h3 className="text-2xl font-black mb-8 leading-tight tracking-tight drop-shadow-md">
                     {course.title || course.subject_description}
                     </h3>
                  </div>

                  <div className="relative z-10 space-y-6">
                     {/* Progress Section */}
                     <div className="space-y-3">
                     <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest opacity-80">
                        <span>Progress</span>
                        <span>{course.progress || 0}/{course.total || 1} Lessons</span>
                     </div>
                     <div className="h-2 bg-black/20 rounded-full overflow-hidden border border-white/5">
                        <div 
                           className="h-full bg-white transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                           style={{ width: `${((course.progress || 0) / (course.total || 1)) * 100}%` }}
                        ></div>
                     </div>
                     </div>

                     {/* Footer Section ng bawat Course Card */}
                     <div className="flex justify-between items-center">
                     
                     <div className="flex -space-x-3 items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center" title={course.teacher}>
                           <User size={14} className="opacity-80"/>
                        </div>
                        
                        {course.student_count > 1 && (
                           <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center">
                           <User size={14} className="opacity-80"/>
                           </div>
                        )}

                        {course.student_count > 2 && (
                           <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-black">
                           +{course.student_count - 2}
                           </div>
                        )}
                     </div>
                     
                     {/* 3. DITO NA YUNG BUTTON NA MAPIPINDOT! */}
                     <button 
                        onClick={() => navigate(`/lms/course/${course.class_id}`)}
                        className="bg-[#a3e635] text-slate-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-white transition-all active:scale-95"
                     >
                        Continue <ArrowRight size={14} />
                     </button>
                     </div>
                  </div>
               </div>
               ))}
        </div>
      </div>

      {/* TASKS & PROMO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* DARK MODE FIX: Dinagdag ang dark:bg-slate-800, dark:border-slate-700 */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
               <h3 className="text-xl font-black text-slate-800 dark:text-white">Upcoming Tasks & Lessons</h3>
            </div>
            <div className="space-y-2">
               {nextLessons.map((lesson, idx) => (
                 <div 
                    key={idx} 
                    onClick={() => navigate(`/lms/course/${lesson.class_id}`)}
                    // DARK MODE FIX: Hover states and border adaptations
                    className="flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-[1.2rem] flex items-center justify-center text-slate-400 group-hover:bg-[var(--primary-color)] group-hover:text-white transition-colors">
                          <CheckCircle size={20} />
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm group-hover:text-[var(--primary-color)] dark:group-hover:text-white transition-colors">{lesson.title}</h4>
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{lesson.desc || lesson.subject}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-12 text-sm font-bold">
                       <div className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          {/* FIX: Ginamit ang var(--primary-color) sa avatar text */}
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-[var(--primary-color)] dark:text-slate-300 flex items-center justify-center text-[10px]">{lesson.teacher ? lesson.teacher.charAt(0) : 'T'}</div>
                          {lesson.teacher || 'TBA'}
                       </div>
                       <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 w-24">
                          <Clock size={14} /> {lesson.duration || lesson.due || 'No Due'}
                       </div>
                    </div>
                 </div>
               ))}
               
               {nextLessons.length === 0 && (
                 <div className="text-center py-8">
                   <p className="text-slate-400 font-bold text-sm">No upcoming tasks. You're all caught up!</p>
                 </div>
               )}
            </div>
         </div>

         {/* GREEN PROMO CARD - Pwedeng i-keep ang light color nito or i-adjust sa dark mode */}
         <div className="bg-[#a3e635] dark:bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between group transition-colors">
            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
               <Sparkles size={100} className="text-white"/>
            </div>
            <div>
               <p className="text-slate-800 dark:text-emerald-50 font-bold text-sm mb-4">Achievement Unlocked!</p>
               <span className="inline-block px-3 py-1 bg-slate-900 dark:bg-slate-900/50 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 border border-transparent dark:border-white/10">Top 10%</span>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">You are performing excellently in your subjects!</h3>
            </div>
            <button className="w-full py-4 mt-6 bg-orange-500 dark:bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-orange-600 dark:hover:bg-orange-500 transition-colors flex justify-center items-center gap-2">
               View Ranking <ArrowRight size={16} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default StandardDashboard;