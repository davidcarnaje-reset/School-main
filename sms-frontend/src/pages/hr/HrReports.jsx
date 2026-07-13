import React from 'react';
import { BarChart2, Calendar, FileText, Download } from 'lucide-react';

const HrReports = () => {
  const reports = [
    { title: "Institutional Employee Turnover Rate (Q2)", desc: "Quarterly hiring speed and resignation ratios report.", date: "July 01, 2026", size: "840 KB", format: "PDF" },
    { title: "Monthly DTR Compliance Audit Summary", desc: "Clock-in timings consistency and late sheets breakdown.", date: "July 11, 2026", size: "1.5 MB", format: "CSV" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <BarChart2 className="text-blue-600" size={32} />
          HR Reports & Turnover Analytics
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review clock-in logs audits, onboarding speed rate charts, and turnover statements.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Monthly HR Sheets</h3>
        <div className="space-y-4">
          {reports.map((r, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
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
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">File Details</p>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">{r.size} • {r.format}</p>
                </div>
                <button 
                  onClick={() => alert(`Downloading ${r.title}...`)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  <Download size={14} className="inline mr-1" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrReports;
