import React from 'react';
import { ClipboardList, Clock, ShieldCheck } from 'lucide-react';

const HrAttendance = () => {
  const logs = [
    { name: "Clara Santos (Registrar)", date: "July 13, 2026", timeIn: "07:54 AM", timeOut: "05:00 PM", status: "On Time" },
    { name: "Mark Torres (Faculty)", date: "July 13, 2026", timeIn: "08:12 AM", timeOut: "05:00 PM", status: "Late" },
    { name: "Jobel Jobert (IT Support)", date: "July 13, 2026", timeIn: "07:48 AM", timeOut: "05:00 PM", status: "On Time" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ClipboardList className="text-blue-600" size={32} />
          Daily Time Records (DTR)
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Monitor daily employee login time logs, compute clock-in stats, and check late compliance records.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Daily Login History</h3>
        <div className="space-y-4">
          {logs.map((log, idx) => (
            <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{log.name}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Time Log: <span className="text-slate-700 font-mono font-bold">{log.timeIn} - {log.timeOut}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-500">{log.date}</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${log.status === 'On Time' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  <ShieldCheck size={12} />
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrAttendance;
