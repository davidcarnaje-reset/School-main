import React from 'react';
import { Award, Mail, PlusCircle, ShieldCheck } from 'lucide-react';

const HrPerformance = () => {
  const evaluations = [
    { employee: "Prof. Del Rosario (Teacher)", evaluator: "Academic Head Ramos", score: "94.5% (Excellent)", status: "Completed", date: "July 10, 2026" },
    { employee: "Clara Santos (Registrar)", evaluator: "Super Admin", score: "90.2% (Very Satisfactory)", status: "Completed", date: "July 08, 2026" },
    { employee: "Jobel Jobert (IT Support)", evaluator: "IT Administrator", score: "Pending", status: "Evaluation Request Sent", date: "Today" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Award className="text-blue-600" size={32} />
            Performance Evaluations & KPI
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Dispatch evaluation forms, track grading metrics from academic heads, and archive annual reviews.</p>
        </div>
        <button 
          onClick={() => alert("Evaluation forms dispatched to all department heads.")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Dispatch Forms
        </button>
      </div>

      {/* EVALUATION LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Performance Reviews Ledger</h3>
        <div className="space-y-4">
          {evaluations.map((e, idx) => (
            <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
              <div>
                <h4 className="text-sm font-bold text-slate-800">{e.employee}</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">Evaluator: <span className="text-slate-700 font-bold">{e.evaluator}</span></p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Date Logged: {e.date}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">KPI Rating Score</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{e.score}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${e.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  <ShieldCheck size={12} />
                  {e.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrPerformance;
