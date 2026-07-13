import React from 'react';
import { BookOpen, Calendar, CheckCircle2 } from 'lucide-react';

const HrTraining = () => {
  const courses = [
    { title: "New Faculty Teaching Methodologies & LMS", date: "July 18, 2026", participants: "12 Teachers enrolled", status: "Active" },
    { title: "IT Infrastructure Security & Auditing Standards", date: "July 22, 2026", participants: "3 IT Staff enrolled", status: "Scheduled" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <BookOpen className="text-blue-600" size={32} />
          Training & Staff Seminars
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Configure professional seminars, register employees for LMS onboarding courses, and track compliance.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Development Program Schedule</h3>
        <div className="space-y-4">
          {courses.map((c, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{c.title}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Class Allocations: {c.participants}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Date Logged</p>
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Calendar size={12} className="text-slate-400" /> {c.date}
                  </p>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrTraining;
