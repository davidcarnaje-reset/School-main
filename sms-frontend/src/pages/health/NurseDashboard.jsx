import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Heart, Calendar, AlertTriangle, ClipboardList, RefreshCw, 
  Activity, Package, AlertCircle, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NurseDashboard = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { visitsToday: 0, totalProfiles: 0, shortageMedicines: 0, totalPhysicalChecks: 0 },
    recentVisits: [],
    expiryAlerts: []
  });

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/health/dashboard-stats`);
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Fetch nurse dashboard stats error:", err);
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
        <span className="font-bold text-sm">Loading Nurse Dashboard...</span>
      </div>
    );
  }

  const { stats, recentVisits, expiryAlerts } = data;

  const cardItems = [
    {
      title: "Clinic Visits Today",
      value: stats.visitsToday,
      desc: "Total sick bay consultations",
      icon: <Activity size={24} />,
      color: "bg-rose-500/10 text-rose-600 border-rose-100"
    },
    {
      title: "Student Health Cards",
      value: stats.totalProfiles,
      desc: "Chronic logs & allergy profiles",
      icon: <Heart size={24} />,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-100"
    },
    {
      title: "Stock Shortage Alerts",
      value: stats.shortageMedicines,
      desc: "Medicines with stock under 10",
      icon: <Package size={24} />,
      color: "bg-amber-500/10 text-amber-600 border-amber-100"
    },
    {
      title: "Physical Checkups",
      value: stats.totalPhysicalChecks,
      desc: "Total height, weight, BMI checks",
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
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">School Health Clinic</h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              Check student wellness profiles, update physical checkups (BMI), dispense clinic drugs, and track emergency contacts.
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

      {/* Lists section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent visits */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Recent Consultations</h2>
              <p className="text-xs text-slate-500 font-semibold">Sick bay visits recorded today and recently.</p>
            </div>
            <Activity className="text-slate-400" size={20} />
          </div>

          <div className="space-y-4">
            {recentVisits.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No clinic visits recorded recently.
              </div>
            ) : (
              recentVisits.map((visit) => (
                <div key={visit.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col space-y-2 hover:bg-slate-100/55 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">{visit.student_name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      visit.outcome === 'Sent Home' ? 'bg-red-100 text-red-700' :
                      visit.outcome === 'Rested' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {visit.outcome}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Complaint: <span className="text-slate-700 font-bold">{visit.complaint}</span>
                  </p>
                  {visit.treatment && (
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Treatment: {visit.treatment}
                    </p>
                  )}
                  <div className="text-[9px] text-slate-400 font-bold pt-1 border-t border-slate-100 flex justify-between">
                    <span>Visit Date: {visit.visit_date}</span>
                    <span>Time: {visit.visit_time.slice(0, 5)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiration alerts */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Medicine Expiration Alerts</h2>
              <p className="text-xs text-slate-500 font-semibold">Drug batches expiring in the next 6 months.</p>
            </div>
            <AlertCircle className="text-slate-400" size={20} />
          </div>

          <div className="space-y-4">
            {expiryAlerts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No expiring medicines in inventory.
              </div>
            ) : (
              expiryAlerts.map((med) => (
                <div key={med.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-100/55 transition-all">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{med.medicine_name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Stock qty: {med.stock_qty} tabs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-600 flex items-center justify-end gap-1">
                      <AlertTriangle size={12} />
                      <span>{med.expiration_date}</span>
                    </p>
                    <p className="text-[9px] font-black uppercase text-red-400 mt-0.5">Expires soon</p>
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

export default NurseDashboard;
