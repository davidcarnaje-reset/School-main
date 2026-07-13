import React, { useState } from 'react';
import { Calendar, CheckCircle2, Laptop } from 'lucide-react';

const CustodianBorrowing = () => {
  const [borrowed, setBorrowed] = useState([
    { id: "CB-401", asset: "Epson Projector (ID: AST-201)", staff: "Prof. Lopez (Science Dept)", date: "July 12, 2026", status: "Active", expectedReturn: "July 14, 2026" },
    { id: "CB-402", asset: "HDMI Connection Cord (ID: AST-89)", staff: "Mrs. Gomez (Registrar)", date: "July 13, 2026", status: "Returned", expectedReturn: "July 13, 2026" }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Laptop className="text-blue-600" size={32} />
          Equipment Borrowing Logs
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Track temporary release of extension cords, projectors, and audio accessories to teachers.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Release Audit Queue</h3>
        <div className="space-y-4">
          {borrowed.map((b) => (
            <div key={b.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <Laptop size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{b.id}</span>
                    <h4 className="text-sm font-bold text-slate-800">{b.asset}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Borrower: <span className="text-slate-800 font-bold">{b.staff}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Return Target</p>
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Calendar size={12} className="text-slate-400" /> {b.expectedReturn}
                  </p>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${b.status === 'Returned' ? 'bg-emerald-50 text-emerald-600 font-bold border border-emerald-100' : 'bg-amber-50 text-amber-600 font-bold border border-amber-100'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'Returned' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CustodianBorrowing;
