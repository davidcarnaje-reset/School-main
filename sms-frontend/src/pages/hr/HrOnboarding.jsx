import React, { useState } from 'react';
import { UserCheck, CheckCircle2, Clipboard } from 'lucide-react';

const HrOnboarding = () => {
  const [candidates, setCandidates] = useState([
    { id: "OB-101", name: "Jobel Jobert", role: "IT", progress: 60, steps: [
      { name: "Sign employment agreement", done: true },
      { name: "IT Portal credentials generated", done: true },
      { name: "Payroll file linked (Finance)", done: true },
      { name: "Company workstation setup", done: false },
      { name: "Department orientation", done: false }
    ]},
    { id: "OB-102", name: "Prof. Del Rosario", role: "Teacher", progress: 80, steps: [
      { name: "Sign employment agreement", done: true },
      { name: "IT Portal credentials generated", done: true },
      { name: "Payroll file linked (Finance)", done: true },
      { name: "LMS Classroom course load map (Registrar)", done: true },
      { name: "Faculty room key assignment", done: false }
    ]}
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <UserCheck className="text-blue-600" size={32} />
          New Hire Onboarding Tracker
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Monitor checklists, account setup steps, and onboarding progress for new staff.</p>
      </div>

      {/* CANDIDATES LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {candidates.map((c) => (
          <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">{c.id}</span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1">{c.name}</h3>
                <p className="text-xs font-bold text-slate-500">{c.role} Portal Staff</p>
              </div>
              <span className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-violet-100">{c.progress}% Done</span>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${c.progress}%` }}></div>
            </div>

            {/* STEPS CHECKLIST */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Onboarding Checklist</p>
              {c.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <CheckCircle2 size={16} className={step.done ? "text-emerald-500 shrink-0" : "text-slate-200 shrink-0"} />
                  <span className={step.done ? "line-through text-slate-400" : ""}>{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default HrOnboarding;
