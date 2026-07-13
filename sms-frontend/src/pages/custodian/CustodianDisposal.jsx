import React from 'react';
import { Trash2, ShieldAlert } from 'lucide-react';

const CustodianDisposal = () => {
  const obsolete = [
    { name: "LG 19 inch CRT Monitors (10 units)", reason: "Obsolete / Non-functional", date: "July 12, 2026", action: "E-waste disposal" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Trash2 className="text-blue-600" size={32} />
          Disposal & Obsolete Management
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review obsolete inventory items, track e-waste disposal steps, and log auction schedules.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Disposal Ledger</h3>
        <div className="space-y-4">
          {obsolete.map((o, idx) => (
            <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shrink-0">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{o.name}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Reason: "{o.reason}"</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Disposal Date</p>
                  <p className="text-xs font-bold text-slate-650 mt-0.5">{o.date}</p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-650 border border-red-100">
                  <ShieldAlert size={12} />
                  {o.action}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CustodianDisposal;
