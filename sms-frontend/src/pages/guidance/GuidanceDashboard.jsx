import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Heart, Calendar, AlertCircle, ClipboardList, RefreshCw, 
  ChevronRight, AlertTriangle, UserCheck, Clock, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GuidanceDashboard = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { activeCases: 0, pendingAppointments: 0, unresolvedIncidents: 0, totalTestsTaken: 0 },
    recentIncidents: [],
    upcomingAppointments: []
  });

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/guidance/dashboard-stats`);
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Fetch guidance dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <RefreshCw className="animate-spin mr-2" />
        <span className="font-bold text-sm">Loading Guidance Dashboard...</span>
      </div>
    );
  }

  const { stats, recentIncidents, upcomingAppointments } = data;

  const cardItems = [
    {
      title: "Active Student Cases",
      value: stats.activeCases,
      desc: "Students currently monitored",
      icon: <Heart size={24} />,
      color: "bg-red-500/10 text-red-600 border-red-100"
    },
    {
      title: "Pending Appointments",
      value: stats.pendingAppointments,
      desc: "Awaiting counselor approval",
      icon: <Calendar size={24} />,
      color: "bg-amber-500/10 text-amber-600 border-amber-100"
    },
    {
      title: "Unresolved Incidents",
      value: stats.unresolvedIncidents,
      desc: "Reported bullying / health logs",
      icon: <AlertTriangle size={24} />,
      color: "bg-purple-500/10 text-purple-600 border-purple-100"
    },
    {
      title: "Completed Psych Tests",
      value: stats.totalTestsTaken,
      desc: "Student DISC & Personality runs",
      icon: <ClipboardList size={24} />,
      color: "bg-blue-500/10 text-blue-600 border-blue-100"
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-rose-500/10 text-rose-600 rounded-2xl">
            <Heart size={32} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Guidance & Counseling Hub</h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              Monitor student mental well-being, schedule counseling sessions, inspect psychological tests, and manage reports.
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardItems.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl border ${item.color.split(' ')[0]} ${item.color.split(' ')[1]}`}>
                {item.icon}
              </div>
              <span className="text-3xl font-black text-slate-800 tracking-tight">{item.value}</span>
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.title}</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upcoming Appointments */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Approved Appointments</h2>
              <p className="text-xs text-slate-500 font-semibold">Your upcoming schedule for today and onwards.</p>
            </div>
            <Calendar className="text-slate-400" size={20} />
          </div>

          <div className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No upcoming sessions scheduled.
              </div>
            ) : (
              upcomingAppointments.map((appt) => (
                <div key={appt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/55 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {appt.student_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{appt.student_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{appt.student_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-700 flex items-center justify-end gap-1">
                      <Clock size={12} className="text-slate-400" />
                      <span>{appt.appointment_time.slice(0, 5)}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{appt.appointment_date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Distress Incident Reports */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Recent Incident Reports</h2>
              <p className="text-xs text-slate-500 font-semibold">Bullying and personal struggle logs submitted by students.</p>
            </div>
            <AlertCircle className="text-slate-400" size={20} />
          </div>

          <div className="space-y-4">
            {recentIncidents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No incidents reported recently.
              </div>
            ) : (
              recentIncidents.map((incident) => (
                <div key={incident.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col space-y-2 hover:bg-slate-100/55 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-700">{incident.student_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      incident.status === 'Reported' ? 'bg-amber-100 text-amber-700' :
                      incident.status === 'Investigating' ? 'bg-purple-100 text-purple-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {incident.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                    {incident.details}
                  </p>
                  <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100/80 flex justify-between">
                    <span>Incident: {incident.incident_date}</span>
                    {incident.is_anonymous === 1 && <span className="text-purple-600 font-bold">Anonymous</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GuidanceDashboard;
