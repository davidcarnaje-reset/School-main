import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Settings, LogOut, Menu, X, 
  BookOpen, CreditCard, UserCircle, Search, Receipt, 
  History, ClipboardList, GraduationCap, Layers, FileText,
  Library, Award, ChevronLeft, ChevronRight, MapPin,
  Bell, Megaphone, Banknote, FileCheck2, Image, Globe, Compass, School,
  Server, Shield, LifeBuoy, Zap, FileSpreadsheet, Building, Package, Wrench, Key
} from 'lucide-react'; 
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/admin/UserProfileModal'; 
import CreateAnnouncementModal from '../components/shared/CreateAnnouncementModal';
import ReadNotificationModal from '../components/shared/ReadNotificationModal';

const AdminLayout = () => {
  const { logout, user, branding, activePermissions, API_BASE_URL, getLogoUrl } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isCollapsed, setIsCollapsed] = useState(false); 
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ==========================================
  // 🚀 NOTIFICATION STATES
  // ==========================================
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCreateNotifModalOpen, setIsCreateNotifModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const currentId = user.role === 'student' ? user.student_id : user.id;
      const response = await axios.get(
        `${API_BASE_URL}/notifications/get_notifications.php?user_id=${currentId}&role=${user.role}`
      );
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) { console.error("Error fetching notifications:", error); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotifClick = async (notif) => {
    const currentId = user.role === 'student' ? user.student_id : user.id;
    setSelectedNotification({
      ...notif,
      sender: notif.sender_name || "System",
      time: new Date(notif.created_at).toLocaleString(),
      hasImage: notif.attachment ? true : false
    });
    setIsNotifOpen(false);

    if (notif.is_read === 0) {
      try {
        await axios.post(`${API_BASE_URL}/notifications/mark_as_read.php`, {
          notification_id: notif.id,
          user_id: currentId
        });
        fetchNotifications(); 
      } catch (error) { console.error("Error marking as read:", error); }
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'Urgent Alert': return <AlertTriangle size={16} className="text-red-600" />;
      case 'Task Reminder': return <Clock size={16} className="text-amber-600" />;
      default: return <Megaphone size={16} className="text-blue-600" />;
    }
  };

  const activeSchoolId = localStorage.getItem('selected_school_id');

  const menuConfig = {
    super_admin_global: [
      { icon: <Globe size={20} />, label: 'Campuses', path: '/admin/schools' },
      { icon: <LayoutDashboard size={20} />, label: 'Network Reports', path: '/admin/dashboard' },
    ],
    admin: [
      { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: <Users size={20} />, label: 'User Management', path: '/admin/users' },
      { icon: <Settings size={20} />, label: 'Branding Engine', path: '/admin/branding' },
      { icon: <Image size={20} />, label: 'Landing Banners', path: '/admin/promotions' },
      { icon: <MapPin size={20} />, label: 'Room Management', path: '/admin/rooms' },
    ],
    registrar: [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/registrar/dashboard' },
        { icon: <UserCircle size={20} />, label: 'Student Masterlist', path: '/registrar/students', module: 'students' },
        { type: 'header', label: 'Academics' }, 
        { icon: <Library size={20} />, label: 'Academic Programs', path: '/registrar/programs', module: 'programs' }, 
        { icon: <BookOpen size={20} />, label: 'Subject Management', path: '/registrar/subjects', module: 'subjects' },
        { icon: <GraduationCap size={20} />, label: 'Class Assignments', path: '/registrar/assignments', module: 'assignments' },
        { type: 'header', label: 'Enrollment & Requests' },
        { icon: <ClipboardList size={20} />, label: 'Enrollment Module', path: '/registrar/enrollment', module: 'enrollment' },
        { icon: <FileText size={20} />, label: 'Student Requests', path: '/registrar/requests', module: 'requests' }, 
        { icon: <Award size={20} />, label: 'Scholarship Applications', path: '/registrar/scholarships', module: 'scholarships' },
        { icon: <Layers size={20} />, label: 'Section Management', path: '/registrar/sections', module: 'sections' },
        { icon: <FileCheck2 size={20} />, label: 'Student Grades', path: '/registrar/grades', module: 'grades' },
    ],
    hr: [
      { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/hr/dashboard' },
      { icon: <Users size={20} />, label: 'Employee Directory', path: '/hr/employees', module: 'employees' },
      { icon: <Banknote size={20} />, label: 'Payroll Management', path: '/hr/payroll', module: 'payroll' },
      { icon: <ClipboardList size={20} />, label: 'Attendance (DTR)', path: '/hr/attendance', module: 'attendance' }
    ],
    it: [
      { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/it/dashboard' },
      { icon: <Server size={20} />, label: 'Infrastructure', path: '/it/infrastructure', module: 'infrastructure' },
      { icon: <Shield size={20} />, label: 'Security & Audits', path: '/it/security', module: 'security' },
      { icon: <LifeBuoy size={20} />, label: 'Tech Support', path: '/it/support', module: 'support' }
    ],
    school_admin: [
      { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/school-admin/dashboard' },
      { icon: <Zap size={20} />, label: 'Utility Bills', path: '/school-admin/utilities', module: 'utilities' },
      { icon: <FileSpreadsheet size={20} />, label: 'Service Contracts', path: '/school-admin/contracts', module: 'contracts' },
      { icon: <Building size={20} />, label: 'Facilities Manage', path: '/school-admin/facilities', module: 'facilities' }
    ],
    custodian: [
      { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/custodian/dashboard' },
      { icon: <Package size={20} />, label: 'Inventory List', path: '/custodian/inventory', module: 'inventory' },
      { icon: <Wrench size={20} />, label: 'Maintenance Coord', path: '/custodian/maintenance', module: 'maintenance' },
      { icon: <Key size={20} />, label: 'Room Assets List', path: '/custodian/assets', module: 'assets' }
    ]
  };

  let currentMenu = [];
  if (user?.role === 'super_admin') {
    currentMenu = activeSchoolId ? menuConfig.admin : menuConfig.super_admin_global;
  } else {
    currentMenu = menuConfig[user?.role] || [];
  }

  const isModuleEnabled = (role, moduleName) => {
    if (!activePermissions || activePermissions.length === 0) return true;
    const perm = activePermissions.find(p => 
      p.role.toLowerCase() === role.toLowerCase() && 
      p.module_name.toLowerCase() === moduleName.toLowerCase()
    );
    return perm ? perm.is_enabled === 1 : false;
  };

  const filteredMenu = currentMenu.filter(item => {
    if (item.type === 'header') return true;
    if (!item.module) return true;
    return isModuleEnabled(user?.role, item.module);
  });

  const finalMenu = [];
  for (let i = 0; i < filteredMenu.length; i++) {
    const currentItem = filteredMenu[i];
    if (currentItem.type === 'header') {
      let hasSubItems = false;
      for (let j = i + 1; j < filteredMenu.length; j++) {
        if (filteredMenu[j].type === 'header') break;
        hasSubItems = true;
      }
      if (hasSubItems) {
        finalMenu.push(currentItem);
      }
    } else {
      finalMenu.push(currentItem);
    }
  }

  const getLogoSrc = () => {
    return getLogoUrl(branding?.school_logo);
  };

  return (
    <div className="flex h-screen bg-slate-50 relative font-sans overflow-hidden">
      
      {/* 1. MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 2. SIDEBAR - ARCHITECT FIX: Inalis ang bg-color at overflow-hidden dito para hindi maputol ang button */}
      <aside className={`
        fixed z-40 transition-all duration-300 ease-in-out
        inset-y-0 left-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:relative lg:h-[calc(100vh-2rem)] lg:my-4 lg:ml-4
        w-64 ${isCollapsed ? 'lg:w-[5.5rem]' : 'lg:w-64'} 
      `}>
        
        {/* COLLAPSE BUTTON - Ngayon ay makakalabas na ito ng sidebar nang buo */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute right-0 translate-x-1/2 top-10 w-8 h-8 bg-blue-600 text-white rounded-full items-center justify-center shadow-md border-[3px] border-slate-50 z-50 hover:bg-blue-700 hover:scale-105 transition-all"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>

        {/* VISUAL BOX - Dito napunta ang kulay at ang overflow-hidden para mapigilan ang text bleed */}
        <div className="bg-slate-900 text-slate-300 flex flex-col w-full h-full overflow-hidden shadow-2xl lg:rounded-[2rem]">
          
          {/* LOGO HEADER */}
          <div className={`h-20 px-4 border-b border-slate-800 flex items-center shrink-0 transition-all ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              {activeSchoolId && branding.school_logo ? (
                <img src={getLogoSrc()} alt="School Logo" className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-lg" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg" style={{ backgroundColor: branding.theme_color || '#2563eb' }}>
                  {activeSchoolId ? branding.school_name?.charAt(0) : 'N'}
                </div>
              )}
              <span className={`text-[15px] leading-tight font-black text-white tracking-tight line-clamp-2 w-36 whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'opacity-100'}`}>
                  {activeSchoolId ? branding.school_name : "Network Control"}
              </span>
            </div>
          </div>

          {/* Super Admin Back to Network button */}
          {user?.role === 'super_admin' && activeSchoolId && !isCollapsed && (
            <div className="px-4 pt-4 shrink-0">
              <button 
                onClick={() => {
                  localStorage.removeItem('selected_school_id');
                  window.location.href = '/admin/schools';
                }}
                className="w-full py-2.5 px-4 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all border border-slate-800"
              >
                <Globe size={12} />
                Exit Campus View
              </button>
            </div>
          )}

          {/* NAVIGATION LIST */}
          <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {finalMenu.map((item, index) => {
              
              if (item.type === 'header') {
                  return (
                    <React.Fragment key={index}>
                      <div className={`my-4 mx-auto w-6 border-t border-slate-700 hidden ${isCollapsed ? 'lg:block' : ''}`}></div>
                      <div className={`pt-6 pb-2 px-3 ${isCollapsed ? 'lg:hidden' : ''}`}>
                          <p className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap truncate">{item.label}</p>
                      </div>
                    </React.Fragment>
                  );
              }

              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={index} 
                  to={item.path} 
                  className={`flex items-center p-3 rounded-2xl transition-all ${isActive ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isCollapsed ? 'lg:justify-center gap-0' : 'gap-4'}`} 
                  style={isActive ? { backgroundColor: branding.theme_color || '#2563eb' } : {}}
                  title={isCollapsed ? item.label : ''} 
                >
                  <div className="shrink-0">{item.icon}</div>
                  <span className={`font-bold text-sm whitespace-nowrap truncate transition-all duration-300 ${isCollapsed ? 'lg:hidden lg:w-0 lg:opacity-0' : 'opacity-100'}`}>
                      {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          
          {/* FOOTER */}
          <div className="p-4 border-t border-slate-800 shrink-0">
               <button 
                  onClick={logout} 
                  className={`flex items-center p-3 rounded-2xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 w-full transition-all ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}
                  title={isCollapsed ? "Sign Out" : ""}
               >
                  <LogOut size={20} className="shrink-0" />
                  <span className={`text-sm font-bold whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'lg:hidden lg:w-0 lg:opacity-0' : 'opacity-100'}`}>Sign Out</span>
               </button>
          </div>
        </div>
      </aside>

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto z-10">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shrink-0 shadow-sm">
          <div className="flex items-center space-x-4">
            <button className="p-2 lg:hidden text-slate-600" onClick={() => setIsSidebarOpen(true)}><Menu size={20} /></button>
            <h2 className="text-slate-800 font-black text-lg lg:text-xl capitalize">{location.pathname.split('/').pop()?.replace('-', ' ')}</h2>
            {activeSchoolId ? (
              <span className="hidden sm:inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                🏫 {branding.school_name}
              </span>
            ) : user?.role === 'super_admin' && (
              <span className="hidden sm:inline-block px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                🌐 Global Control
              </span>
            )}
          </div>

          <div className="flex items-center">
            
            {/* NOTIFICATION SECTION */}
            <div className="flex items-center space-x-2 mr-6 pr-6 border-r border-slate-200 relative">
              {user?.role !== 'student' && (
                <button onClick={() => setIsCreateNotifModalOpen(true)} className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                    <Megaphone size={20} />
                </button>
              )}
              <div className="relative">
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-2.5 rounded-full transition-all relative ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                        {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800">Notifications</h3>
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">{unreadCount} New</span>
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center text-slate-400">
                          <Bell className="mx-auto mb-2 opacity-20" size={40} />
                          <p className="text-xs font-bold uppercase tracking-widest">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => handleNotifClick(notif)}
                            className={`flex gap-3 p-3 rounded-2xl cursor-pointer transition-all relative ${notif.is_read === 0 ? 'bg-blue-50/50 hover:bg-blue-100' : 'hover:bg-slate-50 opacity-70'}`}
                          >
                            {notif.is_read === 0 && <div className="w-2 h-2 bg-blue-500 rounded-full absolute left-2 top-1/2 -translate-y-1/2" />}
                            
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 ml-2 overflow-hidden border border-slate-200">
                               {notif.sender_image ? (
                                 <img src={`${API_BASE_URL}/uploads/profiles/${notif.sender_image}`} className="w-full h-full object-cover" />
                               ) : (
                                 getNotifIcon(notif.type)
                               )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-tight ${notif.is_read === 0 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                                {notif.title}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 truncate">{notif.message}</p>
                              <p className="text-[9px] text-blue-500 font-black uppercase tracking-tighter mt-1">
                                {new Date(notif.created_at).toLocaleDateString()} • {notif.sender_role}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* USER PROFILE */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsProfileOpen(true)}>
              <div className="hidden sm:block text-right">
                  <p className="text-sm font-black text-slate-800">{user?.full_name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: branding.theme_color }}>{user?.role}</p>
              </div>
              <div className="w-11 h-11 bg-slate-200 rounded-2xl overflow-hidden shadow-sm border-2 border-white ring-1 ring-slate-100">
                 {user?.profile_image ? <img src={`${API_BASE_URL}/uploads/profiles/${user.profile_image}`} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-black text-slate-400">{user?.full_name?.charAt(0)}</div>}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {user?.role === 'super_admin' && !activeSchoolId && location.pathname !== '/admin/schools' ? (
              <div className="h-[60vh] bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-xl max-w-xl mx-auto flex flex-col items-center justify-center animate-in zoom-in duration-300">
                <Compass className="text-blue-600 mb-4 animate-bounce" size={60} />
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Active Campus Required</h3>
                <p className="text-slate-500 mt-2 max-w-sm font-medium">
                  Upang pamahalaan ang mga kwarto, branding, o users, kailangan mo munang pumili ng aktibong campus sa Campus Registry.
                </p>
                <Link 
                  to="/admin/schools" 
                  className="mt-6 px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                  Go to Campus Registry
                </Link>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} branding={branding} logout={logout} />
      
      <CreateAnnouncementModal 
        isOpen={isCreateNotifModalOpen} 
        onClose={() => {
            setIsCreateNotifModalOpen(false);
            fetchNotifications(); 
        }} 
      />

      <ReadNotificationModal 
        isOpen={!!selectedNotification} 
        onClose={() => setSelectedNotification(null)} 
        notification={selectedNotification}
      />
    </div>
  );
};

export default AdminLayout;