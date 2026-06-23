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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CreateAnnouncementModal from "../components/shared/CreateAnnouncementModal";
import ReadNotificationModal from "../components/shared/ReadNotificationModal";

const CashierLayout = () => {
  const { logout, user, branding, API_BASE_URL } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateNotifModalOpen, setIsCreateNotifModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const location = useLocation();
  const notifRef = useRef(null);

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
    try {
      const res = await axios.get(
        `${API_BASE_URL}/shared/get_notifications.php`,
      );
      setNotifications(res.data);
    } catch (error) {
      console.error("Notif error:", error);
    }
  };

  useEffect(() => {
    //fetchNotifications();
    //const handleClickOutside = (e) => {
      //if (notifRef.current && !notifRef.current.contains(e.target))
        //setIsNotifOpen(false);
    //};
    //document.addEventListener("mousedown", handleClickOutside);
    //return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/cashier/dashboard" },
    { icon: Search, label: "Student Billing", path: "/cashier/billing" },
    { icon: CreditCard, label: "Process Payments", path: "/cashier/payments" },
    { icon: Layers, label: "Fee Catalog", path: "/cashier/fees" },
    { icon: Receipt, label: "Scholarships", path: "/cashier/scholarships" },
    {
      icon: BookOpen,
      label: "Scholarships Catalog",
      path: "/cashier/scholarship-catalog",
    },
    { icon: History, label: "Collection Reports", path: "/cashier/reports" },
    { icon: Banknote, label: "Payroll", path: "/cashier/payroll" },
  ];

  return (
    <div
      className="flex h-screen w-full overflow-hidden p-3 md:p-5 transition-colors duration-500"
      style={{ backgroundColor: getLightVariant(branding?.theme_color) }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* SIDEBAR - Compact Version */}
      <aside
        className={`
        fixed inset-y-4 left-4 z-50 w-64 bg-slate-900 rounded-[2rem] shadow-2xl transition-transform duration-300 transform
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"}
        lg:relative lg:translate-x-0 lg:inset-y-0 lg:left-0
      `}
      >
        <div className="flex flex-col h-full p-6">
          {/* BRANDING AREA - Scaled Down */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-white rounded-2xl p-2 shadow-xl mb-3 flex items-center justify-center overflow-hidden border-2 border-slate-800 shrink-0">
              {branding?.school_logo ? (
                <img
                  src={`${API_BASE_URL}/uploads/branding/${branding.school_logo}`}
                  className="w-full h-full object-contain"
                  alt="Logo"
                />
              ) : (
                <span className="text-xl font-black text-slate-900 italic uppercase">
                  {branding?.school_name?.charAt(0)}
                </span>
              )}
            </div>
            <h1 className="text-white font-black italic tracking-tighter text-sm leading-tight uppercase line-clamp-2 px-2">
              {branding?.school_name}
            </h1>
            <div className="mt-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Cashier Portal
              </p>
            </div>
          </div>

          {/* NAVIGATION - Reduced Paddings & Icon Size */}
          {/* NAVIGATION - Smooth & Rounded */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full font-bold transition-all duration-500 ease-in-out group ${
                    isActive
                      ? "text-white shadow-lg shadow-black/20 scale-[1.02]"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  }`}
                  style={
                    isActive ? { backgroundColor: branding.theme_color } : {}
                  }
                >
                  <item.icon
                    size={18}
                    className={`transition-transform duration-500 ${isActive ? "scale-110" : "group-hover:translateX-1"}`}
                  />
                  <span className="tracking-tight text-sm uppercase italic text-[11px]">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* LOGOUT - Compact */}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-4 rounded-2xl font-black text-rose-500 hover:bg-rose-500/10 transition-all mt-4 uppercase text-[10px] tracking-widest border border-rose-500/10 shrink-0"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
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
                {user?.profile_image ? (
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
          <Outlet />
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
