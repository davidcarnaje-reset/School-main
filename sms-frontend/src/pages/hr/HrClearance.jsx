import React from 'react';
import { UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

const HrClearance = () => {
  const clearanceList = [
    { name: "Prof. Del Rosario", status: "Active Employee", clearance: "Cleared (No pending handovers)", items: ["IT Account disabled", "Library clearance checked", "Workstation returned"] }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <UserCheck className="text-blue-600" size={32} />
          Clearance & Offboarding
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review department clearances, track equipment return status, and manage exit routing pipelines.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Exit Route Directory</h3>
        <div className="space-y-4">
          {clearanceList.map((c, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Status: {c.status}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Clearance Status</p>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">{c.clearance}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={12} />
                  Cleared
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrClearance;
