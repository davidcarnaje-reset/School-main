import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { 
  Users, UserCheck, Clock, TrendingUp, Calendar, 
  FileText, Activity, ChevronRight, GraduationCap, ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const RegistrarDashboard = () => {
  const { user, branding, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Dashboard Data States (Dinagdag ang pendingRequests)
  const [stats, setStats] = useState({
    totalStudents: 0,
    enrolledCurrentSY: 0,
    pendingEnrollment: 0,
    awaitingPayment: 0,
    pendingRequests: 0 // <--- BAGONG DAGDAG
  });

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/registrar/get_registrar_dashboard.php`);
      
      if (response.data.success) {
        const data = response.data;
        
        setStats({
          totalStudents: data.stats.total_students,
          enrolledCurrentSY: data.stats.total_enrolled,
          pendingEnrollment: data.stats.pending_registrar,
          awaitingPayment: data.stats.awaiting_payment,
          pendingRequests: data.stats.pending_requests || 0 // <--- KUKUNIN MULA SA PHP
        });

        const activities = data.recent_activities.map((act, index) => {
          let displayAction = "";
          let statusColor = "";

          if (act.status === 'Enrolled') {
            displayAction = "OFFICIALLY ENROLLED";
            statusColor = "success";
          } else if (act.status === 'Assessed' || act.status === 'Awaiting Cashier') {
            displayAction = "WAITING FOR PAYMENT";
            statusColor = "info";
          } else {
            displayAction = "FOR ASSESSMENT";
            statusColor = "pending";
          }

          return {
            id: index,
            name: `${act.first_name} ${act.last_name}`,
            action: displayAction,
            time: new Date(act.date_added).toLocaleDateString(),
            status: statusColor
          };
        });

        setRecentActivities(activities);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // UI Helper for Stat Cards
  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, bgColorClass }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-start gap-3 transition-all hover:shadow-md hover:-translate-y-1">
      <div className={`p-4 rounded-2xl w-fit ${bgColorClass} ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{loading ? '...' : value}</h3>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-0.5">{title}</p>
        <p className="text-[10px] font-bold text-slate-400">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Calendar size={16}/> S.Y. 2026 - 2027
          </p>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Registrar'}!
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Real-time enrollment monitoring is active.
          </p>
        </div>
        
        <div className="relative z-10 flex gap-3 w-full md:w-auto mt-4 md:mt-0">
           <Link to="/registrar/students" className="flex-1 md:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-center text-sm">
             Add Student
           </Link>
           <Link to="/registrar/enrollment" className="flex-1 md:flex-none px-6 py-3 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-center text-sm" style={{ backgroundColor: branding.theme_color || '#2563eb' }}>
             Go to Enrollment
           </Link>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-white rounded-full blur-3xl -z-0 opacity-50 transform translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* STATS GRID (GINAWANG 5 COLUMNS PARA KASYA ANG PENDING REQUESTS) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          subtitle="Masterlist count"
          icon={Users} 
          colorClass="text-blue-600" 
          bgColorClass="bg-blue-50"
        />
        <StatCard 
          title="Enrolled" 
          value={stats.enrolledCurrentSY} 
          subtitle="Paid and Validated"
          icon={UserCheck} 
          colorClass="text-emerald-600" 
          bgColorClass="bg-emerald-50"
        />
        <StatCard 
          title="Assessment" 
          value={stats.pendingEnrollment} 
          subtitle="Action Needed"
          icon={Clock} 
          colorClass="text-amber-600" 
          bgColorClass="bg-amber-50"
        />
        <StatCard 
          title="For Payment" 
          value={stats.awaitingPayment} 
          subtitle="At Cashier"
          icon={TrendingUp} 
          colorClass="text-indigo-600" 
          bgColorClass="bg-indigo-50"
        />
        {/* BAGONG CARD PARA SA REQUESTS */}
        <StatCard 
          title="Doc Requests" 
          value={stats.pendingRequests} 
          subtitle="Active Documents"
          icon={FileText} 
          colorClass="text-purple-600" 
          bgColorClass="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Activity className="text-blue-500" size={20}/> Recent Enrollment Activity
            </h3>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-6">Student</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Update</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="3" className="p-10 text-center text-slate-400 font-bold">Loading activities...</td></tr>
                ) : recentActivities.length === 0 ? (
                  <tr><td colSpan="3" className="p-10 text-center text-slate-400 font-bold">No recent activities found.</td></tr>
                ) : (
                  recentActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-800 text-sm">{activity.name}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex w-fit items-center gap-1.5 ${
                          activity.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                          activity.status === 'info' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {activity.action}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-500">{activity.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK TASKS SECTION */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <ClipboardList className="text-blue-500" size={20}/> Quick Tasks
          </h3>
          
          <div className="space-y-4 flex-1">
            <Link to="/registrar/students" className="group flex items-center p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-700">Student Masterlist</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Manage profiles</p>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link to="/registrar/enrollment" className="group flex items-center p-4 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-amber-700">Assessments</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stats.pendingEnrollment} for assessment</p>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* BAGONG TASK: STUDENT REQUESTS SHORTCUT */}
            <Link to="/registrar/requests" className="group flex items-center p-4 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-purple-700">Student Requests</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Process docs & forms</p>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-transform" />
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrarDashboard;