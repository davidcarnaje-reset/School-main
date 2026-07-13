import React from 'react';
import { Users, FileCheck2, UserCheck, Award, Heart, Clipboard, Send, Layers } from 'lucide-react';

const HrDashboard = () => {
  const transactions = [
    { type: "IT Account Setup", employee: "Mark Torres (Faculty)", target: "IT Dept", status: "Sent to IT", date: "Today" },
    { type: "Payroll Setup", employee: "Clara Santos (Registrar)", target: "Finance Dept", status: "Approved & Linked", date: "Yesterday" },
    { type: "Evaluation Request", employee: "Prof. Del Rosario (Teacher)", target: "Acad Head Mr. Ramos", status: "Pending Response", date: "July 12, 2026" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* BRANDING HEADER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight leading-none">Human Resources Command</h1>
          <p className="mt-2 text-slate-300 font-medium text-sm">Manage staff records, onboarding checklist pipelines, performance ratings, and inter-departmental triggers.</p>
        </div>
        <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-xs font-black uppercase tracking-wider border border-blue-500/30">
          HR SECURED
        </span>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/30 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Staff</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">42 Employees</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
              <Users size={18} />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-bold">32 Faculty • 10 Non-teaching</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/30 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Leaves</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">3 Requests</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <Clipboard size={18} />
            </div>
          </div>
          <p className="text-xs text-amber-500 font-bold">Needs verification</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/30 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Hires</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">2 Onboarding</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center border border-violet-100">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="text-xs text-violet-500 font-bold">In progress checklists</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/30 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Rating</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">92.4%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
              <Award size={18} />
            </div>
          </div>
          <p className="text-xs text-emerald-500 font-bold">Q2 review completed</p>
        </div>
      </div>

      {/* TRIGGERS WORKFLOW LOG */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Inter-Departmental Automation Logs</h2>
          <p className="text-slate-400 text-xs font-medium mt-1">Triggers logged when hiring, setting up payroll, or evaluating staff.</p>
        </div>

        <div className="space-y-4">
          {transactions.map((t, idx) => (
            <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <Send size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{t.type}: <span className="text-blue-600">{t.employee}</span></h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Target Department/Head: <span className="text-slate-700 font-bold">{t.target}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.status === 'Approved & Linked' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Approved & Linked' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                  {t.status}
                </span>
                <span className="text-[10px] text-slate-400 font-bold font-mono">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrDashboard;
