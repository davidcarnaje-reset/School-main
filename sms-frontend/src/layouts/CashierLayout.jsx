import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  CreditCard,
  History,
  Users,
  Bell,
  Megaphone,
  Search,
  Layers,
  Receipt,
  BookOpen,
  Banknote,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  LifeBuoy
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CreateAnnouncementModal from "../components/shared/CreateAnnouncementModal";
import ReadNotificationModal from "../components/shared/ReadNotificationModal";

const CashierLayout = () => {
  const { logout, user, branding, activePermissions, API_BASE_URL, getLogoUrl } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return JSON.parse(localStorage.getItem('cashierSidebarCollapsed')) ?? false;
  });
  
  const isAppRouteActive = location.pathname === '/employee-portal' || location.pathname === '/cashier/helpdesk';
  const [isAppsOpen, setIsAppsOpen] = useState(isAppRouteActive);

  useEffect(() => {
    if (location.pathname === '/employee-portal' || location.pathname === '/cashier/helpdesk') {
      setIsAppsOpen(true);
    }
  }, [location.pathname]);
  const [isCreateNotifModalOpen, setIsCreateNotifModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const location = useLocation();
  const notifRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('cashierSidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/cashier/dashboard":
        return "Dashboard";
      case "/cashier/billing":
        return "Student Billing";
      case "/cashier/fees":
        return "Fee Catalog";
      case "/cashier/scholarships":
        return "Scholarships";
      case "/cashier/scholarship-catalog":
        return "Scholarship Catalog";
      case "/cashier/reports":
        return "Collection Reports";
      case "/cashier/payroll":
        return "Payroll Management";
      default:
        return "Cashier Portal";
    }
  };

  const getLightVariant = (hexColor) =>
    hexColor ? `${hexColor}1A` : "#f8fafc";

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const currentId = user.role === 'student' ? user.student_id : user.id;
      const res = await axios.get(
        `${API_BASE_URL}/notifications/get_notifications.php?user_id=${currentId}&role=${user.role || 'cashier'}`
      );
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (error) {
      console.error("Notif error:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const menuItems = [
    { type: "header", label: "Cashier Dashboard" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/cashier/dashboard" },

    { type: "header", label: "Billing & Transactions" },
    { icon: Search, label: "Student Billing", path: "/cashier/billing", module: "billing" },
    { icon: CreditCard, label: "Process Payments", path: "/cashier/payments", module: "payments" },
    { icon: Layers, label: "Fee Catalog", path: "/cashier/fees", module: "fees" },

    { type: "header", label: "Scholarships" },
    { icon: Receipt, label: "Scholarships", path: "/cashier/scholarships", module: "scholarships" },
    {
      icon: BookOpen,
      label: "Scholarships Catalog",
      path: "/cashier/scholarship-catalog",
      module: "scholarship_catalog"
    },

    { type: "header", label: "Reports & Finance" },
    { icon: History, label: "Collection Reports", path: "/cashier/reports", module: "reports" },
    { icon: Banknote, label: "Payroll", path: "/cashier/payroll", module: "payroll" },
  ];

  const isModuleEnabled = (role, moduleName) => {
    if (activePermissions === null) return false;
    const perm = activePermissions.find(p => 
      p.role.toLowerCase() === role.toLowerCase() && 
      p.module_name.toLowerCase() === moduleName.toLowerCase()
    );
    return perm ? perm.is_enabled === 1 : false;
  };

  const isCurrentPortalEnabled = () => {
    if (activePermissions === null) return true; // Wait for load
    const rolePerms = activePermissions.filter(p => p.role.toLowerCase() === 'cashier');
    if (rolePerms.length === 0) return false;
    return rolePerms.some(p => p.is_enabled === 1);
  };

  const portalEnabled = isCurrentPortalEnabled();

  const filteredMenuItems = !portalEnabled ? [] : menuItems.filter(item => {
    if (item.type === 'header') return true;
    if (!item.module) return true;
    return isModuleEnabled("cashier", item.module);
  });

  // Clean trailing/duplicate headers
  const finalMenuItems = filteredMenuItems.filter((item, idx, arr) => {
    if (item.type === 'header') {
      const nextItem = arr[idx + 1];
      return nextItem && nextItem.type !== 'header';
    }
    return true;
  });

  return (
    <div
      className="flex h-screen w-full overflow-hidden p-3 md:p-5 transition-colors duration-500"
      style={{ backgroundColor: getLightVariant(branding?.theme_color) }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* SIDEBAR - Collapsible & Partitioned */}
      <aside
        className={`
        fixed inset-y-4 left-4 z-50 bg-slate-900 rounded-[2rem] shadow-2xl transition-all duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"}
        lg:relative lg:translate-x-0 lg:inset-y-0 lg:left-0
        w-64 ${isCollapsed ? "lg:w-[5.5rem]" : "lg:w-64"}
      `}
      >
        {/* COLLAPSE TOGGLE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute right-0 translate-x-1/2 top-10 w-8 h-8 bg-blue-600 text-white rounded-full items-center justify-center shadow-md border-[3px] border-slate-50 z-50 hover:bg-blue-700 hover:scale-105 transition-all cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>

        <div className="flex flex-col h-full p-4 md:p-6 overflow-hidden">
          {/* BRANDING AREA */}
          <div className="flex flex-col items-center text-center mb-6 shrink-0">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl p-2 shadow-xl mb-2 flex items-center justify-center overflow-hidden border-2 border-slate-800 shrink-0">
              {branding?.school_logo ? (
                <img
                  src={getLogoUrl(branding.school_logo)}
                  className="w-full h-full object-contain"
                  alt="Logo"
                />
              ) : (
                <span className="text-xl font-black text-slate-900 italic uppercase">
                  {branding?.school_name?.charAt(0)}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <>
                <h1 className="text-white font-black italic tracking-tighter text-xs md:text-sm leading-tight uppercase line-clamp-2 px-2">
                  {branding?.school_name}
                </h1>
                <div className="mt-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                    Cashier Portal
                  </p>
                </div>
              </>
            )}
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
            {finalMenuItems.map((item, index) => {
              if (item.type === "header") {
                return (
                  <React.Fragment key={`header-${index}`}>
                    <div className={`my-3 mx-auto w-6 border-t border-slate-800 hidden ${isCollapsed ? 'lg:block' : ''}`} />
                    <div className={`pt-4 pb-1 px-3 ${isCollapsed ? 'lg:hidden' : ''}`}>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap truncate">
                        {item.label}
                      </p>
                    </div>
                  </React.Fragment>
                );
              }

              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center ${isCollapsed ? 'lg:justify-center px-0' : 'px-4'} py-3 rounded-full font-bold transition-all duration-300 ease-in-out group ${
                    isActive
                      ? "text-white shadow-lg shadow-black/20 scale-[1.02]"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  }`}
                  style={
                    isActive ? { backgroundColor: branding?.theme_color || '#2563eb' } : {}
                  }
                >
                  <item.icon
                    size={18}
                    className={`shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                  />
                  {!isCollapsed && (
                    <span className="tracking-tight text-xs uppercase italic text-[11px] ml-3 truncate">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* APPS DROPDOWN */}
            <div className="space-y-1 mt-3 border-t border-white/10 pt-3">
              <button
                onClick={() => setIsAppsOpen(!isAppsOpen)}
                title={isCollapsed ? "Apps" : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center px-0' : 'px-4 justify-between'} py-3 rounded-full font-bold transition-all duration-300 ease-in-out group ${
                  location.pathname === '/employee-portal' || location.pathname === '/cashier/helpdesk'
                    ? "bg-white/10 text-white"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center">
                  <LayoutGrid
                    size={18}
                    className={`shrink-0 transition-transform duration-300 ${
                      location.pathname === '/employee-portal' || location.pathname === '/cashier/helpdesk' ? "scale-110 text-white" : "text-slate-500 group-hover:scale-110"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="tracking-tight text-xs uppercase italic text-[11px] ml-3 truncate">
                      Apps
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="text-slate-500 group-hover:text-slate-300">
                    {isAppsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                )}
              </button>

              {isAppsOpen && (
                <div className={`space-y-1 transition-all duration-300 ${isCollapsed ? 'lg:pl-0' : 'pl-4'}`}>
                  {/* Payroll Portal */}
                  <Link
                    to="/employee-portal"
                    title={isCollapsed ? "Payroll Portal" : undefined}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center ${isCollapsed ? 'lg:justify-center px-0' : 'px-3'} py-2.5 rounded-full font-bold transition-all duration-250 group ${
                      location.pathname === '/employee-portal'
                        ? "text-white shadow-md scale-[1.02]"
                        : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                    }`}
                    style={
                      location.pathname === '/employee-portal'
                        ? { backgroundColor: branding?.theme_color || '#2563eb' }
                        : {}
                    }
                  >
                    <CreditCard
                      size={16}
                      className={`shrink-0 transition-transform duration-300 ${
                        location.pathname === '/employee-portal' ? "scale-110" : "group-hover:scale-110"
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="tracking-tight text-[10px] uppercase ml-2.5 truncate">
                        Payroll Portal
                      </span>
                    )}
                  </Link>

                  {/* IT Help Desk */}
                  <Link
                    to="/cashier/helpdesk"
                    title={isCollapsed ? "IT Help Desk" : undefined}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center ${isCollapsed ? 'lg:justify-center px-0' : 'px-3'} py-2.5 rounded-full font-bold transition-all duration-250 group ${
                      location.pathname === '/cashier/helpdesk'
                        ? "text-white shadow-md scale-[1.02]"
                        : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
                    }`}
                    style={
                      location.pathname === '/cashier/helpdesk'
                        ? { backgroundColor: branding?.theme_color || '#2563eb' }
                        : {}
                    }
                  >
                    <LifeBuoy
                      size={16}
                      className={`shrink-0 transition-transform duration-300 ${
                        location.pathname === '/cashier/helpdesk' ? "scale-110" : "group-hover:scale-110"
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="tracking-tight text-[10px] uppercase ml-2.5 truncate">
                        IT Help Desk
                      </span>
                    )}
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* LOGOUT */}
          <button
            onClick={logout}
            title={isCollapsed ? "Sign Out" : undefined}
            className={`flex items-center ${isCollapsed ? 'lg:justify-center px-0' : 'px-4'} py-3.5 rounded-2xl font-black text-rose-500 hover:bg-rose-500/10 transition-all mt-4 uppercase text-[10px] tracking-widest border border-rose-500/10 shrink-0 cursor-pointer`}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span className="ml-3">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-5 relative">
        <header className="h-20 flex items-center justify-between px-6 lg:px-8 shrink-0 relative z-[40]">
          <div className="absolute inset-x-2 lg:inset-x-0 bottom-1 top-1 bg-white/60 backdrop-blur-md rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-white/50 -z-10"></div>

          {/* HEADER PART */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2.5 bg-white rounded-xl shadow-md text-slate-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Tinanggal ang 'hidden sm:block' para laging kita ang title */}
            <div className="block">
              <h2 className="text-sm md:text-lg font-black italic text-slate-800 uppercase tracking-tighter leading-none">
                {getPageTitle()}
              </h2>
              <div
                className="h-1 w-6 rounded-full mt-1"
                style={{ backgroundColor: branding?.theme_color }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-5 relative">
            <div className="flex items-center gap-1.5 lg:gap-2 bg-white/80 p-1.5 rounded-xl shadow-inner border border-white">
              <button
                onClick={() => setIsCreateNotifModalOpen(true)}
                className="p-2 hover:bg-white rounded-lg text-slate-600 transition-all shadow-sm"
              >
                <Megaphone size={18} />
              </button>
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 hover:bg-white rounded-lg text-slate-600 transition-all relative shadow-sm"
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in duration-200">
                    <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-black italic text-slate-800 uppercase text-[9px] tracking-[0.2em]">
                        Notifications
                      </h3>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 rounded-md text-white">
                        {notifications.length}
                      </span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setSelectedNotif(n);
                              setIsNotifOpen(false);
                            }}
                            className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition-colors group"
                          >
                            <p className="text-[8px] font-black text-indigo-500 uppercase mb-0.5">
                              {n.type || "System"}
                            </p>
                            <p className="text-xs font-bold text-slate-800 leading-tight mb-1 group-hover:underline">
                              {n.title}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold">
                              {new Date(n.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-[9px] font-black text-slate-300 uppercase italic">
                          No updates
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pl-3 border-l-2 border-slate-200/50">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 leading-none mb-0.5">
                  {user?.full_name}
                </p>
                <p
                  className="text-[9px] font-black uppercase tracking-widest opacity-60"
                  style={{ color: branding.theme_color }}
                >
                  Cashier Officer
                </p>
              </div>
              <div className="w-10 h-10 bg-white rounded-xl border-2 border-white shadow-lg flex items-center justify-center overflow-hidden ring-1 ring-slate-200">
                {user?.profile_image && user.profile_image !== 'null' && user.profile_image !== 'undefined' ? (
                  <img
                    src={`${API_BASE_URL}/uploads/profiles/${user.profile_image}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-black text-slate-400 text-sm">
                    {user?.full_name?.charAt(0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar pt-2 px-4 lg:px-8 pb-10">
          {!portalEnabled ? (
            <div className="h-[60vh] bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-xl max-w-xl mx-auto flex flex-col items-center justify-center mt-8 animate-in zoom-in duration-300">
              <ShieldAlert className="text-amber-500 mb-4 animate-bounce" size={60} />
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Portal Access Disabled</h3>
              <p className="text-slate-500 mt-2 max-w-sm font-medium">
                Ang portal na ito ay kasalukuyang naka-disable para sa inyong campus. Mangyaring makipag-ugnayan sa Super Admin upang i-enable ito.
              </p>
              <div className="mt-4 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold uppercase tracking-wider border border-amber-100 flex items-center gap-2">
                <ShieldAlert size={14} />
                Please contact Super Admin
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>

      <CreateAnnouncementModal
        isOpen={isCreateNotifModalOpen}
        onClose={() => {
          setIsCreateNotifModalOpen(false);
          fetchNotifications();
        }}
      />
      {selectedNotif && (
        <ReadNotificationModal
          isOpen={!!selectedNotif}
          onClose={() => setSelectedNotif(null)}
          notification={selectedNotif}
        />
      )}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default CashierLayout;
