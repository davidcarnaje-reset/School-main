import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Lock, Unlock, Loader2, ArrowRight, 
  ClipboardList, CheckCircle2, 
  Calendar, Clock, Wallet, Activity, ArrowUpRight,
  MonitorPlay, Timer, GraduationCap, Info, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentLms = () => {
  const { user, branding, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);

  // --- REAL DATABASE STATES ---
  const [scheduleToday, setScheduleToday] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  
  // Updated State: Gamit na natin ang totalMinutes imbes na totalHours
  const [lmsAnalytics, setLmsAnalytics] = useState({
    totalMinutes: 0,
    sessions: 0,
    completionRate: 0,
    currentGwa: "0.00"
  });

  // HELPER: Convert total minutes into an aesthetic format (e.g. 1h 30m)
  const formatStudyTime = (totalMins) => {
    if (!totalMins || totalMins === 0) return { value: '0', unit: 'mins' };
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    
    if (h > 0 && m > 0) return { value: `${h}h ${m}m`, unit: '' };
    if (h > 0) return { value: `${h}`, unit: h === 1 ? 'hr' : 'hrs' };
    return { value: `${m}`, unit: 'mins' };
  };

  const timeDisplay = formatStudyTime(lmsAnalytics.totalMinutes);

  const fetchData = async () => {
    try {
      // 1. FETCH STUDENT & BILLING
      const response = await axios.get(`${API_BASE_URL}/student/get_students.php`);
      const studentList = response.data.students || [];
      const billingItems = response.data.billing_items || []; 
      const myData = studentList.find(s => s.email === user.email);
      
      if (myData) {
        // --- GATEKEEPER LOGIC ---
        const totalAmount = parseFloat(myData.total_amount || 0);
        const totalPaidOverall = parseFloat(myData.paid_amount || 0);
        const isPaidFull = totalPaidOverall >= (totalAmount - 1); 
        const isPartial = totalPaidOverall > 0 && totalPaidOverall < totalAmount;
        
        myData.computedPaymentStatus = isPaidFull ? 'Fully Paid' : isPartial ? 'Partial Payment' : 'Unpaid';
        myData.remainingBalance = Math.max(0, totalAmount - totalPaidOverall);

        const tuitionItem = billingItems.find(item => 
            item.billing_id === myData.billing_id && 
            (item.item_name.toLowerCase().includes("tuition") || item.item_name.toLowerCase().includes("tf"))
        );

        const totalTuitionPrice = tuitionItem ? parseFloat(tuitionItem.amount) : (totalAmount * 0.7); 
        const actualTuitionPaid = tuitionItem ? parseFloat(tuitionItem.paid_amount) : totalPaidOverall;
        const tuitionThreshold = totalTuitionPrice * 0.5; 

        const isValidStatus = ["Enrolled", "Assessed"].includes((myData.enrollment_status || "").trim());
        const hasPaidThreshold = actualTuitionPaid >= (tuitionThreshold - 1);
        const isOfficiallyPaid = myData.computedPaymentStatus === 'Partial Payment' || myData.computedPaymentStatus === 'Fully Paid';

        if (isValidStatus && (hasPaidThreshold || isOfficiallyPaid)) {
          myData.isLmsLocked = false;
          myData.neededForUnlock = 0;
        } else {
          myData.isLmsLocked = true;
          myData.neededForUnlock = Math.max(0, tuitionThreshold - actualTuitionPaid);
        }

        myData.displayTuition = totalTuitionPrice; 
        myData.actualTuitionPaid = actualTuitionPaid;
        setStudentData(myData);

        // 2. FETCH REAL SCHEDULE & TASKS (May Cache Buster na param para laging fresh data!)
        try {
          const acadRes = await axios.get(`${API_BASE_URL}/student/get_student_dashboard_data.php?student_id=${myData.student_id}&_t=${Date.now()}`);
          if (acadRes.data.success) {
            setScheduleToday(acadRes.data.scheduleToday || []);
            setPendingTasks(acadRes.data.pendingTasks || []);
            
            if (acadRes.data.analytics) {
              setLmsAnalytics(prev => ({
                 ...prev,
                 totalMinutes: acadRes.data.analytics.totalMinutes || 0,
                 sessions: acadRes.data.analytics.sessions || 0,
                 completionRate: acadRes.data.analytics.completionRate || 0
              }));
            }
          }
        } catch (e) { console.error("Academic Data Error:", e); }

        // 3. FETCH REAL GRADES FOR GWA & RECENT SUBJECTS
        try {
          const currentSy = myData.school_year || '2023-2024';
          const gradeRes = await axios.get(`${API_BASE_URL}/student/get_student_grades.php?email=${user.email}&sy=${currentSy}`);
          if (gradeRes.data.status === 'success') {
             const gradesData = gradeRes.data.data || [];
             
             setRecentGrades(gradesData.slice(0, 3).map(g => ({
                subject: g.code,
                grade: g.final || 'Pending',
                status: g.remarks || 'Ongoing'
             })));

             if (gradesData.length > 0) {
                 const total = gradesData.reduce((acc, curr) => acc + parseFloat(curr.final || 0), 0);
                 const gwa = (total / gradesData.length).toFixed(2);
                 setLmsAnalytics(prev => ({ ...prev, currentGwa: gwa }));
             }
          }
        } catch (e) { console.error("Grades Data Error:", e); }

      }
    } catch (err) {
      console.error("Error fetching LMS status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) fetchData();
  }, [user.email]);

  const safeThemeColor = branding?.theme_color?.startsWith('#') ? branding.theme_color : '#6366f1';

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center font-sans font-black animate-pulse text-slate-400 uppercase tracking-widest gap-4 bg-slate-50/50">
      <Loader2 className="animate-spin text-indigo-500" size={40} />
      Checking LMS Access...
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 w-full space-y-6 animate-in fade-in duration-500 font-sans bg-slate-50/50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <MonitorPlay className="text-indigo-600" size={32}/> Learning Hub Overview
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
             Classroom Gateway & Academic Summary
          </p>
        </div>
        <div className="flex gap-2 items-center bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Status: Active</span>
        </div>
      </div>

      {/* KPI ROW (LMS Analytics & Balance) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         
         {/* Total Study Time Card */}
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.2rem] flex items-center justify-center shrink-0">
               <Timer size={24}/>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Study Time</p>
               <h3 className="text-2xl font-black text-slate-800 leading-none mt-1">
                  {timeDisplay.value} <span className="text-sm text-slate-400">{timeDisplay.unit}</span>
               </h3>
            </div>
         </div>

         {/* Active Study Days Card (Updated Label) */}
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.2rem] flex items-center justify-center shrink-0">
               <Activity size={24}/>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Study Days</p>
               <h3 className="text-2xl font-black text-slate-800 leading-none mt-1">
                  {lmsAnalytics.sessions} <span className="text-sm text-slate-400">{lmsAnalytics.sessions === 1 ? 'day' : 'days'}</span>
               </h3>
            </div>
         </div>

         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.2rem] flex items-center justify-center shrink-0">
               <CheckCircle2 size={24}/>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Task Completion</p>
               <h3 className="text-2xl font-black text-slate-800 leading-none mt-1">{lmsAnalytics.completionRate}%</h3>
            </div>
         </div>

         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between group cursor-pointer hover:border-slate-200 transition-colors" onClick={() => navigate('/student/accounting')}>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><Wallet size={12}/> Balance</p>
               <h3 className="text-xl font-black text-slate-800 leading-none mt-1 tracking-tight">₱{studentData?.remainingBalance?.toLocaleString()}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
               <ArrowRight size={14}/>
            </div>
         </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: The Gatekeeper & Academic Summary */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* THE LMS GATEWAY CARD */}
          {studentData?.isLmsLocked ? (
             <div className="bg-white border-2 border-red-100 p-8 md:p-12 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
               <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none -mt-10 -mr-10">
                  <Lock size={250}/>
               </div>
               <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center shrink-0 border border-red-100 shadow-inner z-10">
                  <Lock size={40} />
               </div>
               <div className="relative z-10 flex-1 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-2">LMS Access is Locked</h2>
                  <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                    To access your digital classroom, modules, and quizzes, you must settle the required tuition milestone.
                  </p>
                  <div className="bg-red-50 p-5 rounded-2xl border border-red-100 inline-block w-full text-left mb-6">
                     <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1 flex items-center gap-1"><Info size={14}/> Minimum Requirement</p>
                     <p className="text-sm font-bold text-slate-700">Pay at least <span className="font-black text-red-600">₱{studentData?.neededForUnlock?.toLocaleString()}</span> (50% of Tuition Basis) to unlock.</p>
                  </div>
                  <button onClick={() => navigate('/student/accounting')} className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                    Proceed to Accounting <ArrowRight size={16} />
                  </button>
               </div>
             </div>
          ) : (
             <div style={{ backgroundColor: safeThemeColor }} className="p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 text-white group">
               <div className="absolute top-0 right-0 opacity-[0.05] pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
                  <MonitorPlay size={250}/>
               </div>
               <div className="w-24 h-24 bg-white/10 backdrop-blur-md text-white rounded-[2rem] flex items-center justify-center shrink-0 border border-white/20 shadow-inner z-10">
                  <Unlock size={40} />
               </div>
               <div className="relative z-10 flex-1 text-center md:text-left">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 drop-shadow-md">Ready to Learn!</h2>
                  <p className="text-sm font-medium text-white/80 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
                    Your LMS account is fully unlocked. You can now access your learning modules, video lectures, discussions, and take your quizzes.
                  </p>
                  <button onClick={() => navigate('/lms/dashboard')} className="w-full md:w-auto px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-xl hover:-translate-y-1 active:scale-95">
                    Continue to LMS <ArrowUpRight size={16} />
                  </button>
               </div>
             </div>
          )}

          {/* RECENT GRADES / ACADEMIC SUMMARY WIDGET */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                   <GraduationCap size={20} className="text-indigo-500"/> Academic Standing
                </h3>
                <button onClick={() => navigate('/student/grades')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All Grades</button>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Current GWA</p>
                   <p className="text-3xl font-black text-slate-800">{lmsAnalytics.currentGwa}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center sm:col-span-2 flex flex-col justify-center">
                   <p className="text-xs font-bold text-slate-500 italic">"Consistent effort yields consistent results. Keep up the good work!"</p>
                </div>
             </div>

             <div className="space-y-3">
               {recentGrades.length > 0 ? recentGrades.map((grade, idx) => (
                 <div key={idx} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><FileText size={16}/></div>
                       <p className="font-black text-sm text-slate-800 uppercase">{grade.subject}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                       <span className="font-black text-lg text-slate-800 w-12 text-center">{grade.grade}</span>
                       <span className={`w-20 text-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${grade.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {grade.status}
                       </span>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-4 text-slate-400 font-bold text-xs">No grades encoded yet.</div>
               )}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (Schedule & Tasks) */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Today's Schedule */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-sm">
               <Calendar size={18} className="text-indigo-500"/> Schedule Today
            </h3>
            <div className="space-y-4">
              {scheduleToday.length > 0 ? (
                scheduleToday.map((sched, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center shrink-0 border border-slate-100">
                       <Clock size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase leading-tight">{sched.subject}</h4>
                      <p className="text-[11px] font-bold text-slate-500 mt-1">{sched.time}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{sched.room || 'TBA'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 font-bold text-xs">No classes scheduled today.</div>
              )}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
               <ClipboardList size={80}/>
            </div>
            <div className="relative z-10">
               <h3 className="font-black text-white/90 mb-6 flex items-center gap-2 text-sm">
                  <CheckCircle2 size={18} className="text-yellow-400"/> Pending Tasks
               </h3>
               <div className="space-y-4">
                  {pendingTasks.length > 0 ? pendingTasks.map((task, i) => (
                    <div key={i} className="p-5 rounded-[1.5rem] bg-white/10 border border-white/5 hover:bg-white/20 transition-colors cursor-pointer">
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md">{task.subject}</span>
                       </div>
                       <h4 className="font-bold text-sm leading-tight mb-3">{task.title}</h4>
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/40 rounded-lg text-[9px] font-bold text-white/80 uppercase tracking-widest">
                         <Clock size={10}/> Due: {task.due}
                       </span>
                    </div>
                  )) : (
                     <div className="text-center py-6 text-white/50 font-bold text-xs">No pending tasks!</div>
                  )}
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentLms;