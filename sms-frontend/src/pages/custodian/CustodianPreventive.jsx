import React from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

const CustodianPreventive = () => {
  const plans = [
    { task: "Airconditioning Unit General Cleaning", dates: "July 20, 2026", frequency: "Semi-annual", status: "Scheduled" },
    { task: "Fire Extinguisher Safety Pressure Check", dates: "July 28, 2026", frequency: "Annual audit", status: "Scheduled" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Calendar className="text-blue-600" size={32} />
          Preventive Maintenance Schedule
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Plan and log scheduled inspections for school assets, generator sync checks, and fire safety systems.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Upcoming Tasks</h3>
        <div className="space-y-4">
          {plans.map((p, idx) => (
            <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center border border-violet-100 shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{p.task}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Audit Cycle: {p.frequency}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Scheduled Date</p>
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Clock size={12} className="text-slate-400" /> {p.dates}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CustodianPreventive;
