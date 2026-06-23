import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User, BookOpen, Lock, Calendar as CalendarIcon, ChevronRight, 
  Megaphone, Wallet, Activity, ArrowUpRight, Loader2,
  BellOff, Clock, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user, branding, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  
  // REAL DATABASE STATES
  const [scheduleToday, setScheduleToday] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);

  const fetchData = async () => {
    try {
      // 1. FETCH STUDENT & BILLING INFO
      const res = await axios.get(`${API_BASE_URL}/student/get_students.php`);
      const allStudents = res.data.students || [];
      const allItems = res.data.billing_items || [];
      const myData = allStudents.find(s => s.email === user.email);

      if (myData) {
        // --- Compute LMS Lock Logic ---
        const totalAmount = parseFloat(myData.total_amount || 0);
        const paidAmount = parseFloat(myData.paid_amount || 0);
        myData.remainingBalance = Math.max(0, totalAmount - paidAmount);
        
        const isPaid = paidAmount >= totalAmount && totalAmount > 0;
        
        const tuitionItem = allItems.find(item => 
          parseInt(item.billing_id) === parseInt(myData.billing_id) && 
          item.item_name.toLowerCase().includes('tuition')
        );
        
        const actualTuitionPaid = tuitionItem ? parseFloat(tuitionItem.paid_amount || 0) : 0;
        const tuitionAmount = tuitionItem ? parseFloat(tuitionItem.amount || 0) : 0;
        const tuitionThreshold = tuitionAmount > 0 ? (tuitionAmount * 0.5) : (totalAmount * 0.5);

        myData.isLmsActive = isPaid || (tuitionAmount > 0 && actualTuitionPaid >= tuitionThreshold) || paidAmount >= tuitionThreshold;
        myData.tuitionThreshold = tuitionThreshold;

        setStudentData(myData);

        // 2. FETCH REAL ANNOUNCEMENTS
        try {
          const annRes = await axios.get(`${API_BASE_URL}/notifications/get_student_announcements.php?student_id=${myData.student_id}`);
          if (annRes.data.success) {
            setAnnouncements(annRes.data.data);
          }
        } catch (e) { console.error("Announcements Error:", e); }

        // 3. FETCH REAL SCHEDULE & TASKS
        try {
          const acadRes = await axios.get(`${API_BASE_URL}/student/get_student_dashboard_data.php?student_id=${myData.student_id}`);
          if (acadRes.data.success) {
            setScheduleToday(acadRes.data.scheduleToday || []);
            setPendingTasks(acadRes.data.pendingTasks || []);
          }
        } catch (e) { console.error("Academic Data Error:", e); }
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) fetchData();
  }, [user.email]);

  const safeThemeColor = branding?.theme_color?.startsWith('#') ? branding.theme_color : '#6366f1';
  const today = new Date();
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center font-black animate-pulse text-slate-400 uppercase tracking-widest gap-4 bg-slate-50/50">
      <Loader2 className="animate-spin text-indigo-500" size={40} />
      Loading Academic Dashboard...
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 w-full space-y-6 animate-in fade-in duration-500 font-sans bg-slate-50/50 min-h-screen">
      
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
            {today.toLocaleDateString('en-US', dateOptions)}
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
            Welcome back, <span style={{ color: safeThemeColor }}>{studentData?.first_name}! 👋</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
            <User size={14} /> My Profile
          </button>
        </div>
      </div>

      {/* 2. KPI CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card A: LMS Gateway */}
        <div className={`p-6 rounded-[2rem] border transition-all ${
            studentData?.isLmsActive ? 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${studentData?.isLmsActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
              {studentData?.isLmsActive ? <BookOpen size={20} /> : <Lock size={20} />}
            </div>
            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${studentData?.isLmsActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {studentData?.isLmsActive ? 'Unlocked' : 'Locked'}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">LMS Classroom</h3>
          <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2">
            {studentData?.isLmsActive ? "Access your learning modules and assignments." : `Pay ₱${studentData?.tuitionThreshold?.toLocaleString()} to unlock LMS features.`}
          </p>
          <button 
            onClick={() => studentData?.isLmsActive ? navigate('/lms/dashboard') : navigate('/student/accounting')}
            className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
              studentData?.isLmsActive ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200' : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {studentData?.isLmsActive ? 'Enter LMS' : 'Go to Accounting'} <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Card B: Academic Status */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Activity size={16} className="text-emerald-500"/> Enrollment Status
            </h3>
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2">
               {studentData?.enrollment_status || 'Official'}
            </span>
            <h3 className="text-xl font-black text-slate-800">{studentData?.program_code}</h3>
            <p className="text-sm font-bold text-slate-400 mt-1">{studentData?.grade_level}</p>
          </div>
        </div>

        {/* Card C: Tuition / Balance */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Wallet size={20} />
            </div>
            <button onClick={() => navigate('/student/accounting')} className="text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
               Finance Portal
            </button>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4">Remaining Balance</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight mt-1">
              ₱{studentData?.remainingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Announcements & Today's Classes */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Announcements Section */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Megaphone size={18} className="text-indigo-500"/> Bulletin & Announcements
              </h2>
            </div>
            <div className="space-y-4">
               {announcements.length > 0 ? (
                  announcements.slice(0, 3).map((notif, i) => (
                    <div key={i} className="flex gap-4 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow bg-slate-50/50 hover:bg-white group">
                      <div className={`w-2 h-full rounded-full shrink-0 ${
                         notif.type === 'Urgent Alert' ? 'bg-red-500' : notif.type === 'Task Reminder' ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                           <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{notif.title}</h4>
                           <span className="text-[10px] font-bold text-slate-400">{notif.date_posted}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{notif.message}</p>
                      </div>
                    </div>
                  ))
               ) : (
                  <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                     <BellOff size={32} className="mx-auto text-slate-300 mb-2"/>
                     <p className="text-xs font-bold text-slate-400">No new announcements at the moment.</p>
                  </div>
               )}
            </div>
          </div>

          {/* Today's Classes List (REAL DATA) */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-500"/> Today's Classes
              </h2>
            </div>
            <div className="space-y-4">
              {scheduleToday.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                   <p className="text-sm font-bold text-slate-400">No classes scheduled for today! 🎉</p>
                </div>
              ) : (
                scheduleToday.map((sched, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 bg-indigo-100 text-indigo-600">
                         <span className="text-[10px] font-black uppercase tracking-wider">{sched.subject.substring(0,4)}</span>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm">{sched.description || sched.subject}</h4>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">{sched.subject} • {sched.room || 'TBA'}</p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 shadow-sm">
                        {sched.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Calendar & Tasks */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Aesthetic Calendar Widget */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
             <div className="flex justify-center items-center mb-6">
                <h3 className="font-black text-slate-800 text-sm">{today.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}</h3>
             </div>
             <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-[10px] font-black text-slate-400">{d}</div>)}
             </div>
             <div className="grid grid-cols-7 gap-1 text-center">
                <div className="p-2 text-transparent">0</div>
                <div className="p-2 text-transparent">0</div>
                <div className="p-2 text-transparent">0</div>
                {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                  <div key={day} className={`p-2 text-xs font-bold rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                     day === today.getDate() ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                  }`}>
                    {day}
                  </div>
                ))}
             </div>
          </div>

          {/* Pending Tasks Widget (REAL DATA) */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm">
               <CheckCircle size={16} className="text-emerald-500"/> Pending Tasks
            </h3>
            <div className="space-y-3">
               {pendingTasks.length > 0 ? pendingTasks.map((task, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div>
                       <h4 className="text-xs font-black text-slate-800">{task.title}</h4>
                       <p className="text-[10px] font-bold text-slate-400 mt-0.5">{task.subject}</p>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                          {task.due}
                       </span>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-6">
                    <p className="text-xs font-bold text-slate-400">All caught up! No pending tasks.</p>
                 </div>
               )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;