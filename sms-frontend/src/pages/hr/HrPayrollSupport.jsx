import React from 'react';
import { CreditCard, Banknote, ShieldCheck } from 'lucide-react';

const HrPayrollSupport = () => {
  const staffRates = [
    { name: "Mark Torres", role: "Faculty (Teacher)", baseRate: "Php 28,500 /mo", allowance: "Php 2,000", status: "Verified" },
    { name: "Clara Santos", role: "Registrar Officer", baseRate: "Php 22,000 /mo", allowance: "Php 1,500", status: "Verified" },
    { name: "Jobel Jobert", role: "IT Support", baseRate: "Php 24,000 /mo", allowance: "Php 1,500", status: "Pending Verification" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CreditCard className="text-blue-600" size={32} />
            Payroll Setup & Salary Verification
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Review basic salary allocations, benefits mapping, and authorize release sheets for Finance/Cashier.</p>
        </div>
        <button 
          onClick={() => alert("Syncing details with Finance/Cashier Department...")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Banknote size={16} />
          Sync with Finance
        </button>
      </div>

      {/* RATES TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Employee Compensation Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Name</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Salary</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Allowances</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {staffRates.map((s, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <p className="text-sm font-bold text-slate-700">{s.name}</p>
                    <span className="text-xs text-slate-400 font-semibold">{s.role}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-mono font-bold text-slate-700">{s.baseRate}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-mono text-slate-500">{s.allowance}</span>
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${s.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <ShieldCheck size={12} />
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default HrPayrollSupport;
