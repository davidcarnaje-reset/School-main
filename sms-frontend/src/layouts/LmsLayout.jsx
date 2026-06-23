import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Home, Calendar, Bell, User, Power, BookMarked, 
  MessageSquare, Settings, Info, GraduationCap, ChevronUp, X,
  Layers, FileText, Video, CheckSquare, Award, PieChart, Users,
  Library, Microscope, BookOpen, BarChart3
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LmsLayout = () => {
  const { user, branding, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // ==========================================
  // [ SECTION 1: STATE MANAGEMENT ]
  // ==========================================
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileSubMenuOpen, setIsMobileSubMenuOpen] = useState(false); 
  
  const [courses, setCourses] = useState([]);
  const [studentLevel, setStudentLevel] = useState('unknown'); 
  const [activeCategory, setActiveCategory] = useState('all'); 
  
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false); 
  const lastScrollY = useRef(0);

  // ==========================================
  // [ NEW: GLOBAL THEME INJECTION ]
  // (Idinagdag lang para alam ng layout kung naka-Dark Mode sa DB)
  // ==========================================
  useEffect(() => {
    const loadGlobalSettings = async () => {
      const studentId = user?.id || user?.username;
      const role = user?.role || 'student';
      if (!studentId) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/settings/get_settings.php?user_id=${studentId}&user_role=${role}`);
        if (res.data.status === 'success') {
          const dbSettings = res.data.settings;
          const htmlElement = document.documentElement;
          
          if (parseInt(dbSettings.dark_mode) === 1) {
            htmlElement.classList.add('dark');
            htmlElement.style.colorScheme = 'dark';
          } else {
            htmlElement.classList.remove('dark');
            htmlElement.style.colorScheme = 'light';
          }

          if (dbSettings.theme_color) {
            htmlElement.style.setProperty('--primary-color', dbSettings.theme_color);
          }
        }
      } catch (err) {
        console.error("Theme Load Error:", err);
      }
    };
    if (user) loadGlobalSettings();
  }, [user, API_BASE_URL]);

  // ==========================================
  // [ SECTION 2: CENTRALIZED COURSE FETCHING ]
  // ==========================================
  useEffect(() => {
    const fetchCatalog = async () => {
      const studentId = user?.id || user?.username;
      if (!studentId) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/lms/get_all_courses.php?student_id=${studentId}`);
        if (res.data.status === 'success' && res.data.courses.length > 0) {
          setCourses(res.data.courses);
          setStudentLevel(res.data.courses[0].level_category); 
        }
      } catch (err) {
        console.error("Layout Fetch Error:", err);
      }
    };
    if(user) fetchCatalog();
  }, [user, API_BASE_URL]);

  // ==========================================
  // [ SECTION 3: STATIC MENUS & TABS ]
  // ==========================================
  const navItems = [
    { id: 'dashboard', icon: <Home size={22} />, path: '/lms/dashboard' },
    { id: 'schedule', icon: <Calendar size={22} />, path: '/lms/calendar' },
    { id: 'courses', icon: <Library size={22} />, path: '/lms/courses' },
    { id: 'profile', icon: <User size={22} />, path: '/lms/profile' },
  ];

  // ARCHITECT ADDITION: Profile-specific Rail Items
  const profileRailItems = [
    { id: 'overview', icon: <User size={20} />, path: '/lms/profile/overview', label: 'Overview' },
    { id: 'messages', icon: <MessageSquare size={20} />, path: '/lms/profile/messages', label: 'Messages' },
    { id: 'performance', icon: <BarChart3 size={20} />, path: '/lms/profile/performance', label: 'Performance' },
    { id: 'settings', icon: <Settings size={20} />, path: '/lms/profile/settings', label: 'Account' },
  ];

  const courseTabs = [
    { id: 'all', icon: <Layers size={18} />, label: 'Stream / All' },
    { id: 'lectures', icon: <FileText size={18} />, label: 'Written Lectures' },
    { id: 'videos', icon: <Video size={18} />, label: 'Video Lectures' },
    { id: 'activities', icon: <CheckSquare size={18} />, label: 'Activities' },
    { id: 'exams', icon: <Award size={18} />, label: 'Exams' },
    { id: 'grades', icon: <PieChart size={18} />, label: 'My Grades' },
    { id: 'people', icon: <Users size={18} />, label: 'Classmates' },
  ];

  // ==========================================
  // [ SECTION 4: DYNAMIC CATEGORY GENERATOR ]
  // ==========================================
  const getDynamicCategories = () => {
    const level = String(studentLevel).trim().toLowerCase();
    const baseCategories = [
      { id: 'all', label: 'All Subjects', icon: <Layers size={20} />, color: 'bg-slate-800' }
    ];

    if (level === 'college') {
      return [
        ...baseCategories,
        { id: 'ge', label: 'General Ed', icon: <BookOpen size={20} />, color: 'bg-blue-600' },
        { id: 'major', label: 'Major Subjects', icon: <Microscope size={20} />, color: 'bg-indigo-600' }
      ];
    }

    if (level === 'shs') {
      return [
        ...baseCategories,
        { id: 'core', label: 'Core Subjects', icon: <BookOpen size={20} />, color: 'bg-blue-600' },
        { id: 'applied', label: 'Applied Subjects', icon: <GraduationCap size={20} />, color: 'bg-orange-500' },
        { id: 'major', label: 'Specialized', icon: <Microscope size={20} />, color: 'bg-emerald-600' }
      ];
    }
    return baseCategories;
  };

  const categoryFilters = getDynamicCategories();

  // ==========================================
  // [ SECTION 5: ROUTE CONTEXT & LOGIC ]
  // ==========================================
  const currentPath = location.pathname;
  const isHome = currentPath.includes('dashboard');
  const isProfile = currentPath.includes('profile');
  const isProfileArea = currentPath.includes('/lms/profile');
  const isCoursesList = currentPath.endsWith('/courses');
  const isCourseDetail = currentPath.includes('/course/'); 
  const isSchedule = currentPath.includes('calendar');
  
  const currentCourseTabId = searchParams.get('tab') || 'all';
  const activeCourseTab = courseTabs.find(t => t.id === currentCourseTabId) || courseTabs[0];

  // ARCHITECT FIX 1: I-reset ang category sa 'all' tuwing lilipat ng page!
  useEffect(() => {
    setActiveCategory('all');
    setIsMobileSubMenuOpen(false); // Isara na rin natin ang mobile drawer para sure
  }, [location.pathname]);

  // ARCHITECT FIX 2: IBINALIK ANG ACTIVITY TRACKER / HEARTBEAT
  useEffect(() => {
    const studentIdentifier = user?.id || user?.username;
    if (!studentIdentifier) return;

    // Track Login/Access immediately
    axios.post(`${API_BASE_URL}/lms/track_activity.php`, { student_id: studentIdentifier, type: 'login' })
      .catch(err => console.error("Tracker Error:", err));

    // Continuous Ping every 60 seconds para alam ng system na online pa si student
    const interval = setInterval(() => {
      axios.post(`${API_BASE_URL}/lms/track_activity.php`, { student_id: studentIdentifier, type: 'ping' })
        .catch(err => console.error("Ping Error:", err));
    }, 60000);

    return () => clearInterval(interval);
  }, [user, API_BASE_URL]);

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    setIsScrolled(currentScrollY > 20);
    // Hide nav dock on scroll down, show on scroll up (Applies to both Desktop and Mobile!)
    if (currentScrollY > lastScrollY.current + 15) {
      setIsNavVisible(false); 
      setIsMobileSubMenuOpen(false); 
    } else if (currentScrollY < lastScrollY.current - 15) {
      setIsNavVisible(true); 
    }
    lastScrollY.current = currentScrollY;
  };

  const handleNavClick = (path) => {
    navigate(path);
    setIsMobileSubMenuOpen(false);
  };

  // ==========================================
  // [ SECTION 6: UI RENDER ]
  // ==========================================
  return (
    // FIX: Binago ang bg-[#f8fafc] para maka-support ng dark mode (bg-slate-50 dark:bg-slate-900)
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden relative transition-colors duration-300">
      
      {/* -------------------------------------------
          [ DESKTOP SIDEBAR CONTEXT MENUS ]
          Fixed on desktop, never hides on scroll.
          Nandito na yung Filters at Categories para sa Desktop.
      --------------------------------------------- */}
      {!isHome && (
        <aside className="hidden md:flex w-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 flex-col items-center py-6 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0 transition-colors duration-300">
           {/* CASE: PROFILE SIDE RAIL */}
           {isProfileArea && (
             <div className="flex flex-col gap-6 w-full px-2 items-center animate-in slide-in-from-left duration-300">
                <p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2">My Account</p>
                {profileRailItems.map((item) => {
                  const isActive = currentPath === item.path || (item.id === 'overview' && currentPath === '/lms/profile');
                  return (
                    <button 
                      key={item.id} 
                      onClick={() => navigate(item.path)} 
                      // FIX: Gumamit ng bg-[var(--primary-color)] para laging tama ang kulay at hindi pumuti
                      className={`group relative p-4 rounded-2xl transition-all duration-300 ${isActive ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-blue-500/20 scale-110' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[var(--primary-color)] dark:hover:text-white'}`}
                    >
                      {item.icon}
                      <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 border dark:border-slate-700 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-all uppercase tracking-widest shadow-xl">{item.label}</span>
                    </button>
                  );
                })}
             </div>
           )}

           {isCoursesList && (
             <div className="flex flex-col gap-5 w-full px-2 mt-4">
                <p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 text-center tracking-widest mb-2">Category</p>
                {categoryFilters.map((cat) => (
                  <div key={cat.id} onClick={() => setActiveCategory(cat.id)} className="group relative flex justify-center cursor-pointer">
                     <div className={`w-12 h-12 ${cat.color} rounded-[1.2rem] text-white shadow-md flex items-center justify-center transition-all duration-500 ease-out ${activeCategory === cat.id ? 'scale-110 ring-4 ring-slate-200 dark:ring-slate-700/50 opacity-100' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}>
                        {cat.icon}
                     </div>
                     <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-xl transition-all duration-300">{cat.label}</span>
                  </div>
                ))}
             </div>
           )}

           {isSchedule && (
             <div className="flex flex-col gap-4 w-full px-2 mt-4">
                <p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 text-center tracking-widest mb-2 border-b border-slate-200 dark:border-slate-800 pb-2">Subjects</p>
                {courses.map((course, index) => {
                  const bgColors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];
                  const themeColor = bgColors[index % bgColors.length];
                  return (
                    <div key={course.class_id} className="group relative flex justify-center cursor-pointer">
                       <div className={`w-11 h-11 ${themeColor} rounded-[1rem] shadow-sm flex items-center justify-center transition-all duration-300 hover:scale-110`}>
                          <span className="text-white text-[9px] font-black tracking-tighter uppercase">{course.tag.substring(0, 4)}</span>
                       </div>
                       <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-xl transition-all duration-300">{course.title}</span>
                    </div>
                  )
                })}
             </div>
           )}

           {isCourseDetail && (
             <div className="flex flex-col gap-4 w-full px-2 mt-4">
                <p className="text-[8px] font-black uppercase text-[var(--primary-color)] text-center tracking-widest mb-2">Classroom</p>
                {courseTabs.map((tab) => (
                  <div key={tab.id} onClick={() => navigate(`${location.pathname}?tab=${tab.id}`)} className="group relative flex justify-center cursor-pointer">
                     {/* FIX: Ginamit din dito ang bg-[var(--primary-color)] */}
                     <div className={`w-12 h-12 rounded-[1.2rem] shadow-sm flex items-center justify-center transition-all duration-500 ease-out ${currentCourseTabId === tab.id ? 'bg-[var(--primary-color)] text-white scale-110 shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-[var(--primary-color)] dark:hover:text-white'}`}>
                        {tab.icon}
                     </div>
                     <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-xl transition-all duration-300">{tab.label}</span>
                  </div>
                ))}
             </div>
           )}
        </aside>
      )}

      {/* -------------------------------------------
          [ MAIN CONTENT AREA ]
      --------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
         <header className={`absolute top-0 left-0 right-0 h-20 px-6 flex justify-between items-center z-50 transition-all duration-500 ease-out ${isNavVisible ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-[20px] shadow-sm border-b border-slate-200 dark:border-slate-800' : 'bg-transparent'}`}>
            <div className="flex items-center gap-3">
               {branding?.school_logo && <img src={`${API_BASE_URL}/uploads/branding/${branding.school_logo}`} className="w-10 h-10 object-contain" alt="Logo" />}
               <h2 className="font-black text-slate-800 dark:text-white tracking-tight hidden sm:block uppercase">LMS Hub</h2>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center text-[var(--primary-color)] dark:text-slate-300 font-black transition-transform hover:scale-105 hover:bg-slate-200 dark:hover:bg-slate-700"><User size={18} /></button>
               {isProfileMenuOpen && (
                 <div className="absolute top-full right-0 mt-3 w-56 bg-white/90 dark:bg-slate-800/95 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 p-2 z-[110]">
                    <button onClick={() => navigate('/student/dashboard')} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-black text-xs uppercase transition-colors"><Power size={16} /> Exit LMS</button>
                 </div>
               )}
            </div>
         </header>

         <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-40 scroll-smooth relative" onScroll={handleScroll}>
            <div className="max-w-[1400px] mx-auto pt-24 pb-6">
               <Outlet context={{ activeCategory, courses }} /> 
            </div>
         </main>
      </div>

      {/* -------------------------------------------
          [ UNIVERSAL BOTTOM DOCK (MOBILE & DESKTOP) ]
          Visible on both, hides on scroll for both.
      --------------------------------------------- */}
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-[420px] transition-transform duration-500 ${isNavVisible ? 'translate-y-0' : 'translate-y-[150%]'}`}>
        
        {/* Main Wrapper with Liquid Glass Background (Inayos para mag-adapt sa Light/Dark) */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-[30px] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/10 flex flex-col overflow-hidden transition-colors duration-300">
           
          {/* =========================================
              [ MOBILE ONLY: CONTEXTUAL DRAWER ]
              Architect Note: Restored dynamic colors and centering.
          =========================================== */}
          <div className="md:hidden flex flex-col w-full overflow-hidden">
            {(isCoursesList || isSchedule || isCourseDetail || isProfileArea) && (
              <>
                {/* 1. THE TRIGGER BUTTON (Centered and Styled) */}
                {!isMobileSubMenuOpen && (
                  <button 
                    onClick={() => setIsMobileSubMenuOpen(true)}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-6 bg-transparent hover:bg-slate-100/50 dark:hover:bg-white/10 border-b border-slate-200/50 dark:border-white/5 transition-colors group"
                  >
                    {/* ARCHITECT FIX: Centered text and restored icon color */}
                    <span className="text-[var(--primary-color)] dark:text-blue-400">
                       {isProfileArea && (profileRailItems.find(i => currentPath.includes(i.id))?.icon || <User size={16}/>)}
                       {isCoursesList && <Layers size={16}/>}
                       {isCourseDetail && activeCourseTab?.icon}
                       {isSchedule && <Calendar size={16}/>}
                    </span>
                    
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-200">
                       {isProfileArea ? (profileRailItems.find(i => currentPath.includes(i.id))?.label || "Profile Menu") : "Select View"}
                    </span>
                    <ChevronUp size={14} className="text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors ml-1" />
                  </button>
                )}

                {/* 2. THE EXPANDED DRAWER */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMobileSubMenuOpen ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {/* Drawer Header */}
                  <div className="flex justify-between items-center px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                       {isProfileArea ? 'Profile Navigation' : 'Select View'}
                    </span>
                    <button onClick={() => setIsMobileSubMenuOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                      <X size={18}/>
                    </button>
                  </div>

                  {/* List of Options (Restored Colors) */}
                  <div className="p-4 flex flex-col gap-1 overflow-y-auto max-h-[40vh] custom-scrollbar">
                    
                    {/* OPTION SET A: Profile Navigation */}
                    {isProfileArea && profileRailItems.map(item => {
                       const isActive = currentPath === item.path || (item.id === 'overview' && currentPath === '/lms/profile');
                       return (
                         <button 
                           key={item.id} 
                           onClick={() => { navigate(item.path); setIsMobileSubMenuOpen(false); }}
                           className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black tracking-wide transition-all ${isActive ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                         >
                           {/* ARCHITECT FIX: Ginamit ang var(--primary-color) for non-active icons */}
                           <span className={isActive ? 'text-white' : 'text-[var(--primary-color)]'}>{item.icon}</span>
                           {item.label.toUpperCase()}
                         </button>
                       );
                    })}

                    {/* OPTION SET B: Course List Categories (RESTORED DYNAMIC COLORS) */}
                    {isCoursesList && categoryFilters.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => { setActiveCategory(cat.id); setIsMobileSubMenuOpen(false); }}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black tracking-wide transition-all ${activeCategory === cat.id ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                      >
                        {/* ARCHITECT FIX: Ibinalik ang color-coding mula sa config */}
                        <span className={activeCategory === cat.id ? 'text-white' : cat.color.replace('bg-', 'text-')}>{cat.icon}</span>
                        {cat.label.toUpperCase()}
                      </button>
                    ))}

                    {/* OPTION SET C: Classroom Tabs (RESTORED ICON COLORS) */}
                    {isCourseDetail && courseTabs.map(tab => (
                      <button 
                        key={tab.id} 
                        onClick={() => { navigate(`${location.pathname}?tab=${tab.id}`); setIsMobileSubMenuOpen(false); }}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black tracking-wide transition-all ${currentCourseTabId === tab.id ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                      >
                        <span className={currentCourseTabId === tab.id ? 'text-white' : 'text-[var(--primary-color)]'}>{tab.icon}</span>
                        {tab.label.toUpperCase()}
                      </button>
                    ))}

                    {/* OPTION SET D: Schedule Subjects Filter (RESTORED COLOR-CODING) */}
                    {isSchedule && (
                      <>
                         <button 
                            onClick={() => { setActiveCategory('all'); setIsMobileSubMenuOpen(false); }}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black tracking-wide transition-all ${activeCategory === 'all' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                         >
                            <span className={activeCategory === 'all' ? 'text-white' : 'text-[var(--primary-color)]'}><Layers size={18}/></span>
                            ALL SUBJECTS
                         </button>
                         {courses.map((course, index) => {
                           const iconColors = ['text-blue-400', 'text-emerald-400', 'text-orange-400', 'text-purple-400', 'text-pink-400'];
                           const colorClass = iconColors[index % iconColors.length];
                           return (
                             <button 
                                 key={course.class_id} 
                                 onClick={() => { setActiveCategory(course.class_id); setIsMobileSubMenuOpen(false); }}
                                 className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black tracking-wide transition-all ${activeCategory === course.class_id ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                             >
                                 {/* ARCHITECT FIX: Ibinalik ang color loop para sa subjects */}
                                 <span className={activeCategory === course.class_id ? 'text-white' : colorClass}><BookMarked size={18}/></span>
                                 {course.title.toUpperCase()}
                             </button>
                           )
                         })}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
           {/* =========================================
               [ UNIVERSAL: MAIN ICONS ]
               Ito lang ang matitira kapag naka-desktop view.
           =========================================== */}
           <div className="flex justify-around w-full px-2 py-3 bg-white/40 dark:bg-slate-800/40 border-t border-slate-200/50 dark:border-slate-700/50 md:border-t-0 md:bg-transparent relative transition-colors duration-300">
              {navItems.map((item) => {
                 const isActive = location.pathname.includes(item.path);
                 return (
                   <button 
                     key={item.id} 
                     onClick={() => handleNavClick(item.path)} 
                     className={`p-3 rounded-2xl transition-all relative flex flex-col items-center justify-center ${isActive ? 'bg-[var(--primary-color)] text-white shadow-lg shadow-blue-500/30 scale-110' : 'text-slate-500 dark:text-slate-400 hover:text-[var(--primary-color)] dark:hover:text-white'}`}
                   >
                      {item.icon}
                      {isActive && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]"></span>}
                   </button>
                 )
              })}
           </div>

        </div>
      </div>
      
    </div>
  );
};

export default LmsLayout;