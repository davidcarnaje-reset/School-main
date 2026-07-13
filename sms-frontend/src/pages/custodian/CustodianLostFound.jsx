import React, { useState } from 'react';
import { HelpCircle, Search, PlusCircle, CheckCircle2 } from 'lucide-react';

const CustodianLostFound = () => {
  const [items, setItems] = useState([
    { id: "LF-01", item: "Casio scientific calculator (FX-991EX)", location: "Room 302 Desk", date: "July 12, 2026", status: "Unclaimed" },
    { id: "LF-02", item: "Car key fob with black leather lanyard", location: "Gymnasium benches", date: "July 11, 2026", status: "Claimed" }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <HelpCircle className="text-blue-600" size={32} />
            Lost & Found Registry
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Log lost items, search descriptions, and process claim signatures.</p>
        </div>
        <button 
          onClick={() => alert("Registration log form handled soon.")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Report Found Item
        </button>
      </div>

      {/* ITEMS LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Logged Items Queue</h3>
        <div className="space-y-4">
          {items.map((i) => (
            <div key={i.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{i.id}</span>
                    <h4 className="text-sm font-bold text-slate-800">{i.item}</h4>
                  </div>
                  <p className="text-xs text-slate-550 mt-1 font-semibold">Found at: <span className="text-slate-800 font-bold">{i.location}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-500">{i.date}</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${i.status === 'Claimed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  {i.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CustodianLostFound;
