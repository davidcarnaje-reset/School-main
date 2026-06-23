import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Calendar, LogOut, Menu, X, School, BookOpen,
  Bell, ChevronLeft, ChevronRight, RefreshCw, Megaphone, CheckCheck,
  MoreHorizontal, Check, XSquare, BellOff, Bug
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TeacherProfileModal from '../components/admin/UserProfileModal';
import ReadNotificationModal from '../components/shared/ReadNotificationModal';
import { SHARED_STYLES } from '../components/shared/teacherConstants';


// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
const timeAgo = (dateString) => {
  if (!dateString) return 'Just now';
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  let i = seconds / 31536000; if (i > 1) return Math.floor(i) + "y";
  i = seconds / 2592000; if (i > 1) return Math.floor(i) + "mo";
  i = seconds / 86400; if (i > 1) return Math.floor(i) + "d";
  i = seconds / 3600; if (i > 1) return Math.floor(i) + "h";
  i = seconds / 60; if (i > 1) return Math.floor(i) + "m";
  return "Just now";
};

const isUnread = (notif) => !notif.is_read || notif.is_read === 0 || notif.is_read === "0";

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const TeacherLayout = () => {
  const { logout, user, branding, API_BASE_URL } = useAuth();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const optionsMenuRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(() => JSON.parse(localStorage.getItem('teacherSidebarCollapsed')) ?? true);

  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showAllInDropdown, setShowAllInDropdown] = useState(false);
  const [activeMenuNotif, setActiveMenuNotif] = useState(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, right: 0 });
  const [isBellHovered, setIsBellHovered] = useState(false);

  const isAnnouncementsPage = location.pathname === '/teacher/announcements';
  const isProfileActive = location.pathname === '/teacher/profile';
  const isDashboard = location.pathname === '/teacher/dashboard';
  const themeColor = branding?.theme_color || '#2563eb';

  // ─── STYLE HELPERS PARA PUMAIKLI ANG KODIGO ─────────────────────────────────
  const activeStyle = (isActive) => ({
    backgroundColor: isActive ? themeColor : '',
    color: isActive ? '#ffffff' : ''
  });

  const applyHover = (e, isActive, bg = themeColor, text = '#ffffff') => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = bg;
      e.currentTarget.style.color = text;
    }
  };

  const removeHover = (e, isActive) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = '';
      e.currentTarget.style.color = '';
    }
  };

  // ─── EFFECTS ─────────────────────────────────────────────────────────────────
  useEffect(() => localStorage.setItem('teacherSidebarCollapsed', JSON.stringify(isCollapsed)), [isCollapsed]);

  useEffect(() => {
    if (user?.id && user?.role === 'teacher') {
      const token = localStorage.getItem('sms_token') || '';
      axios.get(`${API_BASE_URL}/teacher/get_sections.php?teacher_id=${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { if (res.data.status === 'success') setTeachingClasses(res.data.data || []); })
        .catch(console.error);
    }
  }, [user, API_BASE_URL]);

  useEffect(() => {
    if (user?.id && user?.role) {
      const fetchNotifs = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/teacher/get_announcements.php`, {
            params: { user_id: user.id, role: user.role, fetch_type: 'general' },
            headers: { Authorization: `Bearer ${localStorage.getItem('sms_token')}` }
          });
          if (res.data.status === 'success') {
            const notifs = res.data.data || [];
            setNotifications(notifs);
            setUnreadCount(notifs.filter(isUnread).length);
          }
        } catch (err) { console.error(err); }
      };
      fetchNotifs();
      const intId = setInterval(fetchNotifs, 30000);
      return () => clearInterval(intId);
    }
  }, [user, API_BASE_URL]);

  useEffect(() => { setIsNotifyOpen(false); setActiveMenuNotif(null); }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectedNotif) return;
      const inDrop = dropdownRef.current?.contains(e.target);
      const inOpts = optionsMenuRef.current?.contains(e.target);
      const isBell = e.target.closest('[data-notification-bell]');

      if (!inDrop && !inOpts && !isBell) { setIsNotifyOpen(false); setActiveMenuNotif(null); }
      else if (inDrop && !inOpts) setActiveMenuNotif(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('touchstart', handleClickOutside); };
  }, [selectedNotif]);

  // ─── HANDLERS ────────────────────────────────────────────────────────────────
  const toggleNotifications = () => {
    if (isAnnouncementsPage) return;
    const newState = !isNotifyOpen;
    setIsNotifyOpen(newState);
    if (!newState) { setShowAllInDropdown(false); setActiveMenuNotif(null); }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    if (unreadCount === 0) return;
    setUnreadCount(0);
    setNotifications(p => p.map(n => ({ ...n, is_read: 1 })));
    try { await axios.post(`${API_BASE_URL}/teacher/mark_notifications_read.php`, { user_id: user.id, role: user.role }, { headers: { Authorization: `Bearer ${localStorage.getItem('sms_token')}` } }); } catch { }
  };

  const handleNotifClick = async (notif) => {
    if (isUnread(notif)) {
      setNotifications(p => p.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
      setUnreadCount(p => Math.max(0, p - 1));
      try { await axios.post(`${API_BASE_URL}/notifications/mark_single_read.php`, { notification_id: notif.id, user_id: user.id, role: user.role }, { headers: { Authorization: `Bearer ${localStorage.getItem('sms_token')}` } }); } catch { }
    }
    setSelectedNotif({
      id: notif.id, type: notif.type || 'Announcement', title: notif.title, message: notif.message,
      sender: notif.sender_name || notif.sender_role || 'Admin', sender_role: notif.sender_role?.toLowerCase() || '',
      time: notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Recently',
      attachment: notif.attachment, reaction: notif.reaction
    });
  };

  const handleDeleteLocal = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    const notif = notifications.find(n => n.id === id);
    setNotifications(p => p.filter(n => n.id !== id));
    if (notif && isUnread(notif)) setUnreadCount(p => Math.max(0, p - 1));
    setActiveMenuNotif(null);
  };

  const handleToggleReadLocal = (e, notif) => {
    e.preventDefault(); e.stopPropagation();
    const unread = isUnread(notif);
    setNotifications(p => p.map(n => n.id === notif.id ? { ...n, is_read: unread ? 1 : 0 } : n));
    setUnreadCount(p => unread ? Math.max(0, p - 1) : p + 1);
    setActiveMenuNotif(p => ({ ...p, is_read: unread ? 1 : 0 }));
  };

  // ─── RENDER HELPERS ──────────────────────────────────────────────────────────
  const filteredNotifs = notifications.filter(n => n.type !== 'Task Reminder' && (notifFilter === 'all' || isUnread(n)));
  const displayedNotifications = showAllInDropdown ? filteredNotifs : filteredNotifs.slice(0, 6);

  const currentMenu = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/teacher/dashboard' },
    { icon: <School size={20} />, label: 'My Classes', path: '/teacher/classes' },
    { icon: <Calendar size={20} />, label: 'Daily Time Record', path: '/teacher/dtr' },
    { icon: <BookOpen size={20} />, label: 'LMS', path: '/teacher/activities', state: { tab: 'Stream' } }
  ];

  const getHeaderTitle = () => {
    const path = location.pathname;

    // 1. Kung may state na pinasa galing sa navigate(), yun ang gamitin natin
    if (location.state && location.state.subject) {
      const isGrading = path.includes('grading');
      // I-check kung may quarter na naipasa, kung meron, ilagay ang "Quarter X | "
      const quarterText = location.state.quarter ? `Quarter ${location.state.quarter} | ` : '';

      return {
        main: isGrading 
                ? `${quarterText}Grading Activity - ${location.state.subject}` 
                : location.state.subject,
        sub: location.state.section || ''
      };
    }
    // 2. Fallback kung walang state (e.g. direct link or refresh)
    if (path.includes('/teacher/activities') || path.includes('/teacher/sections/')) {
      const classId = path.split('/').pop();

      // Kung ang huling word ay 'grading', wag na i-try hanapin yung classId
      if (classId === 'grading') {
        return { main: 'Activity Grading', sub: 'Student Submissions' };
      }

      const actClass = teachingClasses.find(c => String(c.id) === String(classId));
      return actClass
        ? { main: path.includes('sections') ? `Gradebook - ${actClass.subject}` : actClass.subject, sub: actClass.section_name || actClass.section }
        : { main: path.includes('sections') ? 'Grade Management' : 'LMS', sub: '' };
    }

    if (path.includes('/teacher/profile')) return { main: 'My Profile', sub: '' };
    return { main: path.split('/').pop()?.replace('-', ' ') || 'Dashboard', sub: '' };
  };

  const optionMenuActions = [
    { icon: Check, label: activeMenuNotif && !isUnread(activeMenuNotif) ? 'Mark as unread' : 'Mark as read', action: (e) => { handleToggleReadLocal(e, activeMenuNotif); setActiveMenuNotif(null); } },
    { icon: XSquare, label: 'Remove this notification', action: (e) => handleDeleteLocal(e, activeMenuNotif.id) },
    { icon: BellOff, label: 'Turn off notifications like this', action: (e) => { e.stopPropagation(); setActiveMenuNotif(null); } },
    { icon: Bug, label: 'Report issue to team', action: (e) => { e.stopPropagation(); setActiveMenuNotif(null); } }
  ];

  return (
    <div className="flex h-screen bg-slate-50 relative font-sans overflow-hidden z-0 lg:p-0 lg:gap-0">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&display=swap');
        h1, h2, h3, h4, h5, h6, .header-jakarta { font-family: 'Plus Jakarta Sans', sans-serif !important; }
        html, body, #root { height: 100%; overflow: hidden; }
        .sidebar-scroll { overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .sidebar-scroll::-webkit-scrollbar { display: none; }
        
        .glass-sidebar { background: rgba(255,255,255,0.75); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-right: 1px solid rgba(255,255,255,0.5); }
        .glass-header { background: rgba(255,255,255,0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.7); }
        
        ${SHARED_STYLES(themeColor)}
      `}</style>

      {/* BACKGROUND BLOBS */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50">
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-blob-1" style={{ backgroundColor: themeColor, opacity: 0.15 }}></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] animate-blob-2" style={{ backgroundColor: themeColor, opacity: 0.15 }}></div>
        <div className="absolute top-[20%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] animate-blob-3" style={{ backgroundColor: themeColor, opacity: 0.15 }}></div>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 z-[100] lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      {/* ─── SIDEBAR ─── */}
      <aside className={`glass-sidebar fixed z-[110] text-slate-700 flex flex-col transition-all duration-300 ease-in-out shadow-2xl left-0 top-0 h-full w-[85%] max-w-xs m-0 rounded-r-[2rem] lg:left-0 lg:top-0 lg:h-full lg:m-0 lg:rounded-none lg:rounded-r-[2rem] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shadow-[4px_0_24px_rgba(0,0,0,0.05)] ${isCollapsed ? 'lg:w-[5.5rem]' : 'lg:w-64'}`}>

        {/* LOGO */}
        <div className="h-24 px-6 border-b border-slate-200/50 flex items-center shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {branding?.school_logo ? (
              <img src={`${API_BASE_URL}/uploads/branding/${branding.school_logo}`} alt="Logo" className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm border border-white" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0 border border-white shadow-sm" style={{ backgroundColor: themeColor }}>{branding?.school_name?.charAt(0) || 'S'}</div>
            )}
            <span className={`header-jakarta text-[15px] leading-tight font-black text-slate-800 tracking-tight transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-[200px] lg:opacity-100'}`}>
              {branding?.school_name || 'School System'}
            </span>
          </div>
          <button className="lg:hidden text-slate-600 p-2 bg-slate-100/50 rounded-xl ml-auto" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>

        {/* NAV LINKS */}
        <nav className="flex-1 py-6 px-3 space-y-2 sidebar-scroll">
          {currentMenu.map((item, index) => {
            const isActive = location.pathname === item.path || (location.pathname.includes('sections') && item.path.includes('classes')) || (location.pathname.includes('activities') && item.path.includes('activities'));
            return (
              <Link
                key={index}
                to={item.path}
                state={item.state}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center rounded-2xl transition-all duration-300 group ${isCollapsed ? 'lg:justify-center lg:px-0' : 'lg:px-4 lg:gap-4'
                  } px-4 py-3.5 gap-4 ${isActive ? 'text-white shadow-md border border-white/40' : 'text-slate-700'}`}
                style={activeStyle(isActive)}
                onMouseEnter={(e) => applyHover(e, isActive)}
                onMouseLeave={(e) => removeHover(e, isActive)}
              >
                <span className={`w-6 h-6 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <span className={`font-bold text-sm transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'lg:hidden' : ''
                  }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {teachingClasses.length > 0 && (
            <div className="pt-4 mt-4 border-t border-slate-200/50">
              <p className={`px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 transition-all duration-300 ${isCollapsed ? 'lg:hidden' : ''}`}>Teaching</p>
              <div className="space-y-1">
                {teachingClasses.map(cls => {
                  const isActive = location.pathname.includes(`/${cls.id}`);
                  return (
                    <Link
                      key={cls.id}
                      to={`/teacher/activities/${cls.id}`}
                      state={{ tab: 'Stream' }}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center rounded-2xl transition-all duration-200 group ${isCollapsed ? 'lg:justify-center lg:px-0' : 'lg:px-3 lg:gap-3'
                        } px-4 py-3 gap-4 ${isActive ? 'text-white shadow-md border border-white/40' : 'text-slate-700'}`}
                      style={activeStyle(isActive)}
                      onMouseEnter={(e) => applyHover(e, isActive)}
                      onMouseLeave={(e) => removeHover(e, isActive)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-white/20 group-hover:text-white'}`}>
                        {cls.subject?.charAt(0) || 'C'}
                      </div>
                      <div className={`flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'lg:hidden' : ''
                        }`}>
                        <span className="text-[13px] font-bold truncate">{cls.subject}</span>
                        <span className={`text-[10px] font-semibold truncate ${isActive ? 'text-white/80' : 'group-hover:text-white/80'}`}>
                          {cls.section_name || cls.section}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex absolute -right-3.5 top-24 w-7 h-7 bg-white text-slate-800 rounded-full items-center justify-center shadow-md border border-slate-200 hover:scale-110 transition-transform z-50">
          {isCollapsed ? <ChevronRight size={16} strokeWidth={3} /> : <ChevronLeft size={16} strokeWidth={3} />}
        </button>

        {/* BOTTOM NAV */}
        <div className="p-4 border-t border-slate-200/50 bg-white/40 shrink-0 lg:rounded-br-[2rem] rounded-b-[2rem]">
          <Link
            to="/teacher/profile"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center mb-2 cursor-pointer transition-all duration-300 w-full gap-3 px-2 py-2 rounded-2xl ${isProfileActive ? 'text-white shadow-md border border-white/40' : 'text-slate-800'}`}
            style={activeStyle(isProfileActive)}
            onMouseEnter={(e) => applyHover(e, isProfileActive)}
            onMouseLeave={(e) => removeHover(e, isProfileActive)}
          >
            <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden border-2 border-white shadow-sm">
              {user?.profile_image ? (
                <img src={`${API_BASE_URL}/uploads/profiles/${user.profile_image}`} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: themeColor }}>
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-[150px] lg:opacity-100'}`}>
              <p className="header-jakarta text-[13px] leading-tight font-black line-clamp-1 mb-0.5">
                {user?.full_name}
              </p>
              <p className={`text-[9px] uppercase tracking-widest font-bold ${isProfileActive ? 'text-white/80' : ' group-hover:text-white/80'}`}>
                {user?.role}
              </p>
            </div>
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center p-3 mb-2 rounded-2xl text-slate-700 transition-all group w-full gap-4 px-4 overflow-hidden"
            onMouseEnter={(e) => applyHover(e, false, '#ccfcec', '#10b981')}
            onMouseLeave={(e) => removeHover(e, false)}
          >
            <RefreshCw size={20} className="shrink-0 group-hover:rotate-180 transition-transform duration-500 ease-out" />
            <span className={`text-sm font-bold tracking-wide transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'lg:hidden' : ''}`}>
              Refresh Page
            </span>
          </button>

          <button onClick={logout} className="flex items-center p-3 rounded-2xl hover:bg-red-50 text-slate-700 hover:text-red-600 transition-all group w-full gap-4 px-4 overflow-hidden">
            <LogOut size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
            <span className={`text-sm font-bold whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-[100px] lg:opacity-100'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative lg:pl-4">
        {/* ─── HEADER ─── */}
        <header className="glass-header relative z-[90] h-24 lg:rounded-bl-[2.5rem] rounded-b-3xl flex items-center justify-between px-6 lg:px-10 shadow-sm shrink-0">
          <div className="flex items-center space-x-4">
            <button className="p-2.5 rounded-xl bg-white/50 border border-white shadow-sm lg:hidden" onClick={() => setIsSidebarOpen(true)}><Menu size={20} /></button>
            <div>
              <h2 className="header-jakarta text-slate-800 font-black text-lg lg:text-xl uppercase">{getHeaderTitle().main}</h2>
              {getHeaderTitle().sub && <p className="text-[11px] lg:text-[13px] font-bold text-slate-500 lowercase first-letter:uppercase">{getHeaderTitle().sub}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="relative" ref={dropdownRef}>
              <button title="Notifications" onClick={toggleNotifications} onMouseEnter={() => setIsBellHovered(true)} onMouseLeave={() => setIsBellHovered(false)} data-notification-bell="true"
                className="p-3 rounded-full cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm border border-white/40 backdrop-blur-md"
                style={{ backgroundColor: isNotifyOpen || isBellHovered || isAnnouncementsPage ? themeColor : 'rgba(255,255,255,0.5)', color: isNotifyOpen || isBellHovered || isAnnouncementsPage ? '#fff' : '#475569' }}>
                <Bell size={22} className={unreadCount > 0 ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white px-1 shadow-sm min-w-[18px]">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>

              {/* ─── NOTIFICATION DROPDOWN (REVERTED TO STANDARD WHITE) ─── */}
              {isNotifyOpen && (
                <div className="bg-white fixed sm:absolute top-[5rem] sm:top-[3.5rem] left-[50%] sm:left-auto right-auto sm:-right-4 -translate-x-1/2 sm:translate-x-0 w-[90%] sm:w-[380px] max-w-[380px] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-2 flex flex-col">

                  <div className="px-5 py-4 border-b border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xl font-black text-slate-800">Notifications</h3>
                      <button onClick={handleMarkAllAsRead} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Mark all read"><CheckCheck size={18} /></button>
                    </div>
                    <div className="flex gap-2">
                      {['all', 'unread'].map(f => (
                        <button key={f} onClick={() => setNotifFilter(f)} className={`px-4 py-1.5 rounded-full text-[12px] font-bold capitalize transition-colors ${notifFilter === f ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>{f}</button>
                      ))}
                    </div>
                  </div>

                  <div className="px-5 py-2 flex justify-between items-center bg-white border-b border-slate-50">
                    <span className="text-sm font-bold text-slate-800">Earlier</span>
                    <Link to="/teacher/announcements" onClick={() => setIsNotifyOpen(false)} className="text-sm font-semibold text-blue-600 hover:underline">
                      See all
                    </Link>
                  </div>

                  <div className="max-h-[50vh] overflow-y-auto custom-scroll relative">
                    {displayedNotifications.length > 0 ? displayedNotifications.map(notif => {
                      const unread = isUnread(notif);
                      return (
                        <div key={notif.id} onClick={() => { handleNotifClick(notif); setIsNotifyOpen(false); }} className="group flex gap-3 p-3 mx-2 my-1 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors relative">
                          <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white shadow-sm overflow-hidden" style={{ backgroundColor: themeColor }}>
                            {notif.sender_image ? <img src={`${API_BASE_URL}/uploads/profiles/${notif.sender_image}`} className="w-full h-full object-cover" /> : <span className="text-lg font-black">{(notif.sender_name || 'A').charAt(0)}</span>}
                          </div>

                          <div className="flex-1 min-w-0 pr-6 flex flex-col justify-center">
                            <p
                              className="text-[9px] font-black uppercase tracking-widest mb-0.5"
                              style={{
                                color: notif.type === 'Urgent Alert' ? '#DC2626' :
                                  (notif.sender_role || '').toLowerCase().includes('cashier') ? '#D97706' :
                                    (notif.sender_role || '').toLowerCase().includes('registrar') ? '#7C3AED' :
                                      (notif.sender_role || '').toLowerCase().includes('guidance') ? '#059669' :
                                        themeColor
                              }}
                            >
                              {notif.sender_role ? `${notif.sender_role} Office` : 'General Notice'}
                            </p>
                            <p className={`text-[13px] font-bold leading-tight line-clamp-1 mb-0.5 ${unread ? 'text-slate-900' : 'text-slate-600'}`}>
                              {notif.title || 'Untitled Announcement'}
                            </p>
                            <p className="text-[11px] text-slate-500 leading-tight line-clamp-1">
                              <span className="font-semibold text-slate-600">{notif.sender_name || 'Admin'}</span>: {notif.message || 'Tap to view details.'}
                            </p>
                            <p className={`text-[10px] mt-1.5 font-bold ${unread ? 'text-blue-600' : 'text-slate-400'}`}>
                              {timeAgo(notif.created_at)}
                            </p>
                          </div>
                          {unread && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-sm" />}
                          <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuCoords({ top: e.currentTarget.getBoundingClientRect().bottom + 5, right: window.innerWidth - e.currentTarget.getBoundingClientRect().right }); setActiveMenuNotif(activeMenuNotif?.id === notif.id ? null : notif); }} className="absolute right-2 top-2 p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><MoreHorizontal size={16} /></button>
                        </div>
                      );
                    }) : <div className="p-8 text-center text-slate-400 font-bold text-sm"><Bell size={28} className="mx-auto mb-2 opacity-50" />No {notifFilter === 'unread' ? 'unread' : ''} notifications.</div>}
                  </div>

                  {!showAllInDropdown && filteredNotifs.length > 6 && (
                    <div className="p-3 border-t border-slate-100 bg-white">
                      <button onClick={e => { e.stopPropagation(); setShowAllInDropdown(true); }} className="w-full py-2 text-[13px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">See previous notifications</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsProfileOpen(true)}>
              <div className="hidden sm:block text-right">
                <p className="header-jakarta text-[14px] font-black text-slate-800 leading-none">{user?.full_name}</p>
                <p className="text-[9px] font-bold uppercase mt-1 tracking-widest" style={{ color: themeColor }}>System Verified</p>
              </div>
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: themeColor }}>
                {user?.profile_image ? <img src={`${API_BASE_URL}/uploads/profiles/${user.profile_image}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-white">{user?.full_name?.charAt(0) || 'U'}</div>}
              </div>
            </div>
          </div>
        </header>

        <div className={`flex-1 min-h-0 relative ${isDashboard ? 'overflow-y-auto custom-scroll lg:overflow-hidden' : 'overflow-y-auto custom-scroll'}`}>
          <div className={`max-w-7xl mx-auto w-full p-4 lg:p-8 flex flex-col ${isDashboard ? 'min-h-full lg:h-full' : 'min-h-full'}`}><Outlet /></div>
        </div>
      </main>

      <TeacherProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} branding={branding} logout={logout} />
      <ReadNotificationModal isOpen={!!selectedNotif} onClose={() => setSelectedNotif(null)} notification={selectedNotif} onReactionUpdate={(id, r) => setNotifications(p => p.map(n => n.id === id ? { ...n, reaction: r } : n))} />

      {/* ─── OPTIONS FLOATING MENU (STANDARD WHITE) ─── */}
      {activeMenuNotif && (
        <div ref={optionsMenuRef} className="bg-white fixed z-[999] w-64 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-100 py-2 animate-in fade-in" style={{ top: `${menuCoords.top}px`, right: `${menuCoords.right}px` }}>
          {optionMenuActions.map((opt, i) => (
            <button key={i} onClick={opt.action} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-[13px] font-bold text-slate-700 transition-colors">
              <opt.icon size={16} className="text-slate-400" /> {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherLayout;