import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutGrid, 
  StretchHorizontal, 
  List as ListIcon, 
  ArrowRight,
  User,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LmsCourses = () => {
  const { user, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  
  // ==========================================
  // [ SECTION 1: CONTEXT FROM LAYOUT ]
  // Kinuha natin pareho ang activeCategory AT ang courses data na na-fetch na sa Layout!
  // ==========================================
  const { activeCategory, courses } = useOutletContext(); 

  const [viewMode, setViewMode] = useState('detailed');

  // ==========================================
  // [ SECTION 2: DYNAMIC FILTERING LOGIC ]
  // Ginamit ang useMemo para hindi bumagal ang app tuwing nagta-type o nagpapalit ng category
  // ==========================================
  const filteredSubjects = useMemo(() => {
    // Kung wala pang data o undefined, ibalik ang empty array
    if (!courses || courses.length === 0) return [];

    if (activeCategory === 'all') {
      return courses;
    }

    return courses.filter(sub => {
      // Architect's safe comparison: Tinatanggal ang spaces at ginagawang lowercase
      const subCat = String(sub.category).trim().toLowerCase();
      const targetCat = String(activeCategory).trim().toLowerCase();
      
      return subCat === targetCat;
    });
  }, [activeCategory, courses]);

  // ==========================================
  // [ SECTION 3: NAVIGATION & RECENCY TRACKING ]
  // ==========================================
  const handleEnterCourse = async (courseId) => {
    try {
      // I-update muna ang recency sa DB para sa Dashboard history
      await axios.post(`${API_BASE_URL}/lms/update_last_accessed.php`, {
        student_id: user?.id || user?.username,
        class_id: courseId
      });
      // Siguraduhing naka-default sa 'all' tabs kapag pumasok sa classroom
      navigate(`/lms/course/${courseId}?tab=all`);
    } catch (err) {
      console.error("Tracking Update Error:", err);
      // Kahit mag-fail ang tracker, ituloy pa rin ang pasok sa klase para hindi ma-block ang user
      navigate(`/lms/course/${courseId}?tab=all`);
    }
  };

  // ==========================================
  // [ SECTION 4: UI RENDER ]
  // ==========================================
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 transition-colors">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">Full Course Catalog</h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
            Showing {filteredSubjects.length} {activeCategory === 'all' ? 'All' : activeCategory} Subjects
          </p>
        </div>

        {/* VIEW MODE SWITCHER - DARK MODE ADAPTIVE */}
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 ring-1 ring-slate-200/50 dark:ring-slate-700/50 transition-colors">
          <button 
            onClick={() => setViewMode('card')} 
            className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'card' ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[var(--primary-color)]'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('detailed')} 
            className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'detailed' ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[var(--primary-color)]'}`}
          >
            <StretchHorizontal size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/20' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[var(--primary-color)]'}`}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </header>

      {/* SUBJECTS GRID DISPLAY */}
      {filteredSubjects.length > 0 ? (
        <div className={`grid gap-6 ${
          viewMode === 'card' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 
          viewMode === 'detailed' ? 'grid-cols-1 md:grid-cols-2' : 
          'grid-cols-1'
        }`}>
          {filteredSubjects.map((sub, index) => {
            
            // ARCHITECT UI: Dynamic Colors para hindi boring ang mga subjects
            const bgGradients = [
              'from-blue-500 to-blue-600', 
              'from-emerald-500 to-emerald-600', 
              'from-orange-500 to-orange-600', 
              'from-purple-500 to-purple-600', 
              'from-pink-500 to-pink-600'
            ];
            const themeGradient = bgGradients[index % bgGradients.length];
            const shortTag = sub.tag.split('-').pop().substring(0, 5); // Kunin ang acronym (e.g. PURPC)

            return (
              <div 
                key={sub.class_id} 
                onClick={() => handleEnterCourse(sub.class_id)}
                // DARK MODE FIX: Card Backgrounds and Borders
                className="bg-white dark:bg-slate-800 rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[var(--primary-color)] dark:hover:border-slate-500 hover:-translate-y-1 cursor-pointer group min-h-[160px]"
              >
                {/* Top Half: Icon & Titles */}
                <div className="flex gap-4 items-start mb-4">
                  <div className={`w-[3.5rem] h-[3.5rem] shrink-0 rounded-2xl bg-gradient-to-br ${themeGradient} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                    <span className="font-black text-[11px] tracking-widest uppercase">{shortTag}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0 mt-1">
                    <h3 className="font-black text-slate-800 dark:text-white text-[15px] leading-snug line-clamp-2 transition-colors">
                      {sub.title}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-1 flex items-center gap-1.5 truncate">
                      <User size={12} className="text-slate-300 dark:text-slate-600" />
                      {sub.teacher || 'TBA'}
                    </p>
                  </div>
                </div>
                
                {/* Compact Progress Line */}
                <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-900 rounded-full mb-4 overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
                  <div 
                    className="h-full bg-[var(--primary-color)] rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--primary-color),0.4)]" 
                    style={{ width: `${((sub.completed_lessons || 0) / (sub.total_lessons || 1)) * 100}%` }}
                  ></div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-slate-100 dark:bg-slate-700/50 my-2 transition-colors"></div>

                {/* Bottom Half: Stats & Action Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    {/* FIX: Adaptive Icon Color */}
                    <Users size={14} className="text-[var(--primary-color)] opacity-70" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {sub.student_count || 0} Peers Enrolled
                    </span>
                  </div>

                  {/* FIX: Primary Color on Hover */}
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] group-hover:brightness-75 dark:group-hover:brightness-125 transition-colors">
                    Classroom 
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* EMPTY STATE DISPLAY */
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-500 shadow-sm transition-colors">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4 transition-colors">
             <LayoutGrid size={40} />
          </div>
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm transition-colors">No Subjects Found</h3>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1 transition-colors">There are no courses enrolled under the "{activeCategory}" category.</p>
        </div>
      )}
    </div>
  );
};

export default LmsCourses;