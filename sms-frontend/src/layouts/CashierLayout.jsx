import React, { useState, useEffect, useRef, useMemo } from "react";
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
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cashierSidebarCollapsed')) ?? false;
    } catch {
      return false;
    }
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

  const portalEnabled = useMemo(() => {
    if (activePermissions === null) return true; // Wait for load
    const rolePerms = activePermissions.filter(p => p.role.toLowerCase() === 'cashier');
    if (rolePerms.length === 0) return false;
    return rolePerms.some(p => p.is_enabled === 1);
  }, [activePermissions]);

  const finalMenuItems = useMemo(() => {
    if (!portalEnabled) return [];
    const filtered = menuItems.filter(item => {
      if (item.type === 'header') return true;
      if (!item.module) return true;
      return isModuleEnabled("cashier", item.module);
    });

    return filtered.filter((item, idx, arr) => {
      if (item.type === 'header') {
        const nextItem = arr[idx + 1];
        return nextItem && nextItem.type !== 'header';
      }
      return true;
    });
  }, [portalEnabled, activePermissions]);

  const themeColor = branding?.theme_color || '#2563eb';

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
          fixed inset-y-4 left-4 z-50
          transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"}
          lg:relative lg:translate-x-0 lg:inset-y-0 lg:left-0
          w-64 ${isCollapsed ? "lg:w-[5.5rem]" : "lg:w-64"}
        `}
      >
        {/* COLLAPSE TOGGLE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute right-0 translate-x-1/2 top-10 w-8 h-8 text-white rounded-full items-center justify-center shadow-md border-[3px] border-slate-50 z-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          style={{ backgroundColor: themeColor }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ChevronLeft
            size={17}
            strokeWidth={2.5}
            className={`transition-transform duration-300 ease-in-out ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>

        <div className="bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col h-full overflow-hidden">
          {/* BRANDING AREA */}
          <div className="h-20 px-6 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center min-w-0">
              <div className="w-10 h-10 bg-white rounded-xl p-1.5 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                {branding?.school_logo ? (
                  <img
                    src={getLogoUrl(branding.school_logo)}
                    className="w-full h-full object-contain"
                    alt="Logo"
                  />
                ) : (
                  <span className="text-base font-black text-slate-900 italic uppercase">
                    {branding?.school_name?.charAt(0) || 'C'}
                  </span>
                )}
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isCollapsed ? 'lg:max-w-0 lg:opacity-0 lg:ml-0' : 'lg:max-w-[160px] lg:opacity-100 ml-3'
                }`}
              >
                <h1 className="text-white font-black tracking-tight text-[13px] leading-tight line-clamp-2 w-[148px]">
                  {branding?.school_name || 'Cashier Portal'}
                </h1>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-white/50 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {finalMenuItems.map((item, index) => {
              if (item.type === "header") {
                return (
                  <div
                    key={`header-${index}`}
                    className={`relative flex items-center px-3 overflow-hidden transition-all duration-300 ${
                      index === 0 ? 'pt-1 pb-1.5' : 'pt-4 pb-1.5'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap transition-all duration-300 ease-in-out ${
                        isCollapsed ? 'lg:opacity-0 lg:-translate-x-2 lg:pointer-events-none' : 'lg:opacity-100 lg:translate-x-0'
                      }`}
                    >
                      {item.label}
                    </p>
                    <div
                      className={`hidden lg:block absolute left-3 right-3 border-t border-slate-700/80 transition-all duration-300 ease-in-out ${
                        isCollapsed ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                      }`}
                    />
                  </div>
                );
              }

              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-3 py-1.5 rounded-2xl font-bold transition-colors duration-200 group ${
                    isActive
                      ? "text-white shadow-lg shadow-black/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                  style={isActive ? { backgroundColor: themeColor } : {}}
                >
                  <div className="w-10 h-9 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <item.icon size={19} />
                  </div>
                  <span
                    className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isCollapsed ? 'lg:max-w-0 lg:opacity-0 lg:ml-0' : 'lg:max-w-[160px] lg:opacity-100 ml-2'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* APPS DROPDOWN */}
            <div className="space-y-1 mt-2 border-t border-slate-800/80 pt-3">
              <button
                onClick={() => setIsAppsOpen(!isAppsOpen)}
                title={isCollapsed ? "Apps" : undefined}
                className={`w-full flex items-center px-3 py-1.5 rounded-2xl font-bold transition-colors duration-200 group ${
                  location.pathname === '/employee-portal' || location.pathname === '/cashier/helpdesk'
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <div className="w-10 h-9 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <LayoutGrid size={19} />
                </div>
                <div
                  className={`flex items-center justify-between flex-1 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isCollapsed ? 'lg:max-w-0 lg:opacity-0 lg:ml-0' : 'lg:max-w-[160px] lg:opacity-100 ml-2'
                  }`}
                >
                  <span className="text-sm font-bold whitespace-nowrap truncate">
                    Apps
                  </span>
                  <span className="text-slate-400 group-hover:text-white shrink-0 ml-2">
                    {isAppsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </span>
                </div>
              </button>

              {isAppsOpen && (
                <div className={`space-y-1 transition-all duration-300 ${isCollapsed ? 'lg:pl-0' : 'pl-3'}`}>
                  {/* Payroll Portal */}
                  <Link
                    to="/employee-portal"
                    title={isCollapsed ? "Payroll Portal" : undefined}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-3 py-1.5 rounded-xl font-bold transition-colors duration-200 group ${
                      location.pathname === '/employee-portal'
                        ? "text-white shadow-md"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                    }`}
                    style={
                      location.pathname === '/employee-portal'
                        ? { backgroundColor: themeColor }
                        : {}
                    }
                  >
                    <div className="w-10 h-8 flex items-center justify-center shrink-0">
                      <CreditCard size={17} />
                    </div>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        isCollapsed ? 'lg:max-w-0 lg:opacity-0 lg:ml-0' : 'lg:max-w-[150px] lg:opacity-100 ml-2'
                      }`}
                    >
                      Payroll Portal
                    </span>
                  </Link>

                  {/* IT Help Desk */}
                  <Link
                    to="/cashier/helpdesk"
                    title={isCollapsed ? "IT Help Desk" : undefined}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-3 py-1.5 rounded-xl font-bold transition-colors duration-200 group ${
                      location.pathname === '/cashier/helpdesk'
                        ? "text-white shadow-md"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                    }`}
                    style={
                      location.pathname === '/cashier/helpdesk'
                        ? { backgroundColor: themeColor }
                        : {}
                    }
                  >
                    <div className="w-10 h-8 flex items-center justify-center shrink-0">
                      <LifeBuoy size={17} />
                    </div>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        isCollapsed ? 'lg:max-w-0 lg:opacity-0 lg:ml-0' : 'lg:max-w-[150px] lg:opacity-100 ml-2'
                      }`}
                    >
                      IT Help Desk
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* LOGOUT */}
          <div className="p-3 border-t border-slate-800/80 shrink-0">
            <button
              onClick={logout}
              title={isCollapsed ? "Sign Out" : undefined}
              className="flex items-center px-3 py-1.5 rounded-2xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 w-full transition-colors duration-200 group cursor-pointer"
            >
              <div className="w-10 h-9 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                <LogOut size={19} />
              </div>
              <span
                className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isCollapsed ? 'lg:max-w-0 lg:opacity-0 lg:ml-0' : 'lg:max-w-[140px] lg:opacity-100 ml-2'
                }`}
              >
                Sign Out
              </span>
            </button>
          </div>
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
                  <>
                    <div className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent" onClick={() => setIsNotifOpen(false)} />
                    <div className="fixed sm:absolute top-20 sm:top-full left-3 right-3 sm:left-auto sm:right-0 sm:mt-3 w-auto sm:w-80 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in duration-200">
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
                </>
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
