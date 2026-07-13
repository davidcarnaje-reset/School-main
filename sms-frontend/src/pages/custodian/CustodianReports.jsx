import React, { useState } from 'react';
import { BarChart2, Calendar, FileText, Send } from 'lucide-react';

const CustodianReports = () => {
  const [reports, setReports] = useState([
    { id: "REP-91", title: "Gymnasium Structural Condition Audit", desc: "Annual physical condition log mapping gym ceilings, floors, and bleachers.", date: "July 11, 2026", dispatched: false },
    { id: "REP-92", title: "Classrooms Lighting & Electrical Maintenance Check", desc: "List of damaged light fixtures, switchboards, and outlet points requiring immediate repair.", date: "July 13, 2026", dispatched: false }
  ]);

  const handleDispatchReport = (id) => {
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        alert(
          `Report dispatched successfully!\n\nCustodian → Administration Alert:\n"${r.title}" has been sent to the School Administration portal for budget approval and replacements review.`
        );
        return { ...r, dispatched: true };
      }
      return r;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <BarChart2 className="text-blue-600" size={32} />
          Facilities Audit & Reports
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Generate structural condition audits and dispatch replacements files directly to the School Administration.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Institutional Audits Directory</h3>
        
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{r.title}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">{r.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Date Logged</p>
                  <p className="text-xs font-bold text-slate-650 mt-0.5 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" /> {r.date}
                  </p>
                </div>

                {r.dispatched ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    Sent to Admin
                  </span>
                ) : (
                  <button 
                    onClick={() => handleDispatchReport(r.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <Send size={10} /> Send to Admin
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CustodianReports;
