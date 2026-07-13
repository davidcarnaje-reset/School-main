import React, { useState } from 'react';
import { Wrench, Calendar, CheckCircle2, Clock, Play } from 'lucide-react';

const ItMaintenance = () => {
  const [schedules, setSchedules] = useState([
    { id: "M-41", title: "Database Replication Node Backup Sync", type: "Scheduled Backup", date: "Everyday at 02:00 AM", status: "Active" },
    { id: "M-42", title: "Nginx SSL Certificate Renewal & Check", type: "Security System Update", date: "July 25, 2026", status: "Pending" },
    { id: "M-43", title: "SMS Database Index Optimizations", type: "Performance Tuning", date: "July 12, 2026", status: "Completed" }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Wrench className="text-blue-600" size={32} />
            IT Maintenance & Backups
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Schedule and review automated database backups, node updates, and optimizations.</p>
        </div>
        <button 
          onClick={() => alert("Task trigger will be handled soon.")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play size={14} />
          Run Backup Now
        </button>
      </div>

      {/* SCHEDULES LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Maintenance Schedules</h3>
        
        <div className="space-y-4">
          {schedules.map((s) => (
            <div key={s.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center border border-violet-100 shrink-0">
                  <Wrench size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{s.title}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Type: {s.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Date & Time Check</p>
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Clock size={12} className="text-slate-400" /> {s.date}
                  </p>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${s.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : s.status === 'Active' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'Completed' ? 'bg-emerald-500' : s.status === 'Active' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ItMaintenance;
