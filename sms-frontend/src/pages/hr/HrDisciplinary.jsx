import React from 'react';
import { AlertCircle, ShieldAlert, PlusCircle } from 'lucide-react';

const HrDisciplinary = () => {
  const infractions = [
    { employee: "Mark Torres (Faculty)", incident: "Late submission of final student gradebooksheets", action: "Written warning issued", date: "July 08, 2026", status: "Resolved" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <AlertCircle className="text-blue-600" size={32} />
            Disciplinary Logs & Cases
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Review internal code of conduct complaints, log incident warnings, and record resolution notes.</p>
        </div>
        <button 
          onClick={() => alert("Create incident log soon.")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Report Infraction
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Conduct Incident Ledger</h3>
        <div className="space-y-4">
          {infractions.map((inf, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{inf.employee}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Incident: <span className="text-slate-700 font-bold">"{inf.incident}"</span></p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Action: {inf.action} • {inf.date}</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
                {inf.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrDisciplinary;
