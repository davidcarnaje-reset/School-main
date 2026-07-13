import React from 'react';
import { Heart, ShieldCheck } from 'lucide-react';

const HrBenefits = () => {
  const benefits = [
    { title: "Statutory Contributions (SSS, Philhealth, Pag-IBIG)", coverage: "Mandatory (All active staff)", status: "Active" },
    { title: "Institutional Maxicare HMO Plan", coverage: "Faculty and Regular Administrators (Tier 1 coverage)", status: "Active" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Heart className="text-blue-600" size={32} />
          Employee Benefits & HMO
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review SSS allocations, health insurance policies, and statutory contribution logs.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Benefits Policies List</h3>
        <div className="space-y-4">
          {benefits.map((b, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center border border-pink-100 shrink-0">
                  <Heart size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{b.title}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Coverage Scope: {b.coverage}</p>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600`}>
                <ShieldCheck size={12} />
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrBenefits;
