import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { 
  User, BookOpen, CreditCard, LogOut, Menu, X, 
  GraduationCap, LayoutDashboard, Bell, ChevronLeft, ChevronRight,
  FileBadge // Dinagdag natin ito para sa Scholarship Icon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ProfileModal from '../components/student/ProfileModal';
import ReadNotificationModal from '../components/shared/ReadNotificationModal';

const StudentLayout = () => {
  const { user, logout, branding, API_BASE_URL } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentData, setStudentData] = useState(null);
  
  const location = useLocation();
  const [editForm, setEditForm] = useState({ email: '', contact_no: '', address: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Notifications State (Para consistent sa Admin)
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // FETCH STUDENT DATA
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/student/get_students.php`);
      const studentsList = res.data.students || [];
      const myData = studentsList.find(s => s.email === user.email);

      if (myData) {
        setStudentData(myData);
        setEditForm({ 
          email: myData.email || '', 
          contact_no: myData.mobile_no || '',  
          address: myData.address_house || ''  
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, [user.email, API_BASE_URL]);

  // FETCH NOTIFICATIONS
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const currentId = user.student_id || user.id;
      const response = await axios.get(
        `${API_BASE_URL}/notifications/get_notifications.php?user_id=${currentId}&role=student`
      );
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchData();
      fetchNotifications();
    }
  }, [user?.email, fetchData]);

  // ====================================================
  // 📌 DITO NATIN DINAGDAG ANG GRADES SA SIDEBAR
  // ====================================================
  const studentMenu = [
    { icon: <LayoutDashboard size={20}/>, label: "Dashboard", path: "/student/dashboard" },
    { icon: <BookOpen size={20}/>, label: "Learning Hub", path: "/student/lms" },
    { icon: <GraduationCap size={20}/>, label: "My Grades", path: "/student/grades" }, // <--- DINAGDAG
    { icon: <CreditCard size={20}/>, label: "Accounting", path: "/student/accounting" },
    { icon: <FileBadge size={20}/>, label: "Scholarship", path: "/student/scholarship" }, // <--- INIBA ANG ICON
  ];

  const handleNotifClick = async (notif) => {
    setSelectedNotification({
      ...notif,
      sender: notif.sender_name || "System",
      time: new Date(notif.created_at).toLocaleString(),
    });
    setIsNotifOpen(false);
    if (notif.is_read === 0) {
      try {
        await axios.post(`${API_BASE_URL}/notifications/mark_as_read.php`, {
          notification_id: notif.id,
          user_id: studentData?.student_id
        });
        fetchNotifications();
      } catch (err) { console.error(err); }
    }
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!studentData?.student_id) return alert("Error: Student ID not found.");

    const formData = new FormData();
    formData.append('student_id', studentData.student_id);
    formData.append('email', editForm.email);
    formData.append('mobile_no', editForm.contact_no);
    formData.append('address_house', editForm.address);
    if (selectedFile) formData.append('profile_image', selectedFile);

    try {
      const res = await axios.post(`${API_BASE_URL}/student/update_student.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        alert("Success!");
        await fetchData();
        setIsEditModalOpen(false);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-screen bg-slate-50 relative font-sans overflow-hidden">
      
      {/* 1. MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 2. SIDEBAR */}
      <aside className={`
        fixed z-50 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out shadow-2xl
        inset-y-0 left-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:h-[calc(100vh-2rem)] lg:my-4 lg:ml-4 lg:rounded-[2rem]
        w-64 ${isCollapsed ? 'lg:w-[5.5rem]' : 'lg:w-64'} 
      `}>
        {/* LOGO SECTION */}
        <div className={`h-20 px-4 border-b border-slate-800 flex items-center shrink-0 transition-all justify-between ${isCollapsed ? 'lg:justify-center' : 'lg:justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            {branding?.school_logo && <img src={`${API_BASE_URL}/uploads/branding/${branding.school_logo}`} alt="Logo" className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-lg" />}
            <span className={`text-[15px] leading-tight font-black text-white tracking-tight line-clamp-2 w-36 ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : ''}`}>{branding?.school_name}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white"><X size={20}/></button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto scrollbar-hide">
          <div className={`px-3 mb-2 ${isCollapsed ? 'hidden' : 'block'}`}>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Student Portal</p>
          </div>
          {studentMenu.map((item, index) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link 
                key={index} 
                to={item.path} 
                className={`flex items-center p-3 rounded-2xl transition-all ${isActive ? 'text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isCollapsed ? 'lg:justify-center' : 'gap-4'}`} 
                style={isActive ? { backgroundColor: branding?.theme_color || '#4f46e5' } : {}}
              >
                {item.icon}
                {!isCollapsed && <span className="font-bold text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button onClick={logout} className="flex items-center p-3 rounded-2xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 w-full gap-3 transition-all">
            <LogOut size={20} />
            {!isCollapsed && <span className="text-sm font-bold">Sign Out</span>}
          </button>
        </div>

        {/* COLLAPSE TOGGLE (Desktop Only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-600 shadow-sm hover:text-blue-600 z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shrink-0 shadow-sm">
          <div className="flex items-center space-x-4">
            <button className="p-2 lg:hidden text-slate-600" onClick={() => setIsSidebarOpen(true)}><Menu size={20} /></button>
            <h2 className="text-slate-800 font-black text-lg lg:text-xl capitalize">
              {location.pathname.split('/').pop()?.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center">
            {/* NOTIFICATION BELL */}
            <div className="flex items-center space-x-2 mr-6 pr-6 border-r border-slate-200 relative">
              <div className="relative">
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-2.5 rounded-full transition-all relative ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>
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
                      <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-bold">{unreadCount} New</span>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center text-slate-400">
                          <Bell className="mx-auto mb-2 opacity-20" size={30} />
                          <p className="text-[10px] font-bold uppercase">No updates</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} onClick={() => handleNotifClick(notif)} className={`flex gap-3 p-3 rounded-2xl cursor-pointer transition-all ${notif.is_read === 0 ? 'bg-indigo-50/50' : 'opacity-60'}`}>
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                               <Bell size={16} className="text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{notif.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* USER PROFILE SECTION */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-black text-slate-800">{studentData?.first_name} {studentData?.last_name}</p>
                {/* Status Logic integrated in Admin Style */}
                {(() => {
                  const balance = Number(studentData?.balance || 0);
                  const paid = Number(studentData?.paid_amount || 0);
                  const isPaid = paid > 0 && balance <= 0;
                  return (
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isPaid ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isPaid ? 'Fully Settled' : (paid > 0 ? 'Partial Payment' : 'Unpaid')}
                    </p>
                  );
                })()}
              </div>
              <div className="w-11 h-11 bg-slate-200 rounded-2xl overflow-hidden shadow-sm border-2 border-white ring-1 ring-slate-100">
                {studentData?.profile_image ? (
                  <img src={`${API_BASE_URL}/uploads/profiles/${studentData.profile_image}`} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-slate-400 bg-slate-100">
                    {studentData?.first_name?.charAt(0) || <User size={20}/>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* DYNAMIC CONTENT AREA */}
        <div className="p-6 lg:p-10">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* MODALS */}
      <ProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        branding={branding}
        studentData={studentData}
        editForm={editForm}
        setEditForm={setEditForm}
        previewUrl={previewUrl}
        handleFileChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
          }
        }}
        handleUpdateProfile={handleUpdateProfile}
        API_BASE_URL={API_BASE_URL}
      />

      <ReadNotificationModal 
        isOpen={!!selectedNotification} 
        onClose={() => setSelectedNotification(null)} 
        notification={selectedNotification}
      />
    </div>
  );
};

export default StudentLayout;