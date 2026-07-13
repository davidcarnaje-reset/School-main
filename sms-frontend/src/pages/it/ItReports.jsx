import React from 'react';
import { History, BarChart2, ShieldCheck, CheckCircle2 } from 'lucide-react';

const ItReports = () => {
  const reports = [
    { title: "System SLA Close Rate (Q2)", desc: "Average support ticket resolution timeframe and satisfaction grades.", date: "July 01, 2026", size: "1.2 MB", format: "PDF" },
    { title: "Network Bandwidth Consumption Report", desc: "Detailed breakdown of Wi-Fi traffic and gateway utilization metrics.", date: "July 10, 2026", size: "420 KB", format: "CSV" },
    { title: "Campus Hardware Distribution Audit", desc: "Annual physical computing inventory and location assignments sheet.", date: "July 12, 2026", size: "2.4 MB", format: "PDF" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <History className="text-blue-600" size={32} />
          IT Performance Reports & Analytics
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review resolution timeframes, bandwidth loads charts, and hardware logs sheets.</p>
      </div>

      {/* REPORTS LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Generated Performance Statements</h3>
        
        <div className="space-y-4">
          {reports.map((r, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <BarChart2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{r.title}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">{r.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">File Details</p>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">{r.size} • {r.format}</p>
                </div>
                <button 
                  onClick={() => alert(`Downloading ${r.title}...`)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ItReports;
