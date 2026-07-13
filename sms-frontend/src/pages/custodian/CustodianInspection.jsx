import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

const CustodianInspection = () => {
  const rooms = [
    { name: "Computer Laboratory 1", inspector: "Mr. Santos (Custodian)", date: "July 12, 2026", status: "Pass (All clean & secure)" },
    { name: "Science Laboratory Room", inspector: "Mr. Santos (Custodian)", date: "July 11, 2026", status: "Pass (Hazard lock checked)" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Shield className="text-blue-600" size={32} />
          Facilities & Property Inspections
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review campus room lock audits, hazard checks, and physical inspections checklists.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Inspection Logs</h3>
        <div className="space-y-4">
          {rooms.map((r, idx) => (
            <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{r.name}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Inspector: {r.inspector}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Audit Date</p>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">{r.date}</p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 size={12} />
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CustodianInspection;
