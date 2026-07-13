import React, { useState } from 'react';
import { Laptop, PlusCircle, Calendar, CheckCircle } from 'lucide-react';

const ItBorrowing = () => {
  const [borrowers, setBorrowers] = useState([
    { id: "B-201", asset: "MacBook Air M2 (ID: #091)", borrower: "Prof. Del Rosario (Academics)", date: "July 12, 2026", status: "Active", expectedReturn: "July 20, 2026" },
    { id: "B-202", asset: "Lenovo ThinkPad L14 (ID: #042)", borrower: "Liza Gomez (Registrar)", date: "July 10, 2026", status: "Active", expectedReturn: "July 17, 2026" },
    { id: "B-203", asset: "Projector Epson X41 (ID: #011)", borrower: "Mr. Ramos (Custodian)", date: "July 09, 2026", status: "Returned", expectedReturn: "July 09, 2026" }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Laptop className="text-blue-600" size={32} />
            Asset Borrowing & Requests
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Monitor release logs and return schedules for faculty laptops and projectors.</p>
        </div>
        <button 
          onClick={() => alert("Request form will be handled soon.")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          New Borrowing Log
        </button>
      </div>

      {/* BORROWING QUEUE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Device Release Queue</h3>
        <div className="space-y-4">
          {borrowers.map((b) => (
            <div key={b.id} className="p-4 border border-slate-100 hover:border-slate-200 bg-slate-50/50 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <Laptop size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 font-mono">{b.id}</span>
                    <span className="text-xs font-bold text-slate-700">{b.asset}</span>
                  </div>
                  <p className="text-slate-500 text-xs font-semibold mt-1">Borrower: <span className="text-slate-800 font-bold">{b.borrower}</span></p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">Borrowed on: {b.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Expected Return</p>
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Calendar size={12} className="text-slate-400" /> {b.expectedReturn}
                  </p>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${b.status === 'Returned' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
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

export default ItBorrowing;
