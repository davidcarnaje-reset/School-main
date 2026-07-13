import React from 'react';
import { HelpCircle, CheckCircle, Clock } from 'lucide-react';

const ItUserSupport = () => {
  const requests = [
    { name: "John Doe (Teacher)", email: "john@school.edu", description: "Requesting software license key for MS Office Excel extension.", status: "Resolved", date: "July 12, 2026" },
    { name: "Jane Smith (Cashier Staff)", email: "jane.cashier@school.edu", description: "Unable to sync cash terminal with primary database replication.", status: "Pending", date: "July 13, 2026" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <HelpCircle className="text-blue-600" size={32} />
          User Support & Consultations
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review questions, remote configurations requests, and accounts recovery queries.</p>
      </div>

      {/* USER REQUESTS LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Support Inquiries</h3>
        <div className="space-y-4">
          {requests.map((r, idx) => (
            <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">{r.name} <span className="text-xs font-semibold text-slate-400 font-mono">({r.email})</span></h4>
                <p className="text-xs text-slate-600 mt-1.5 font-medium">{r.description}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Received on: {r.date}</p>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${r.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {r.status === 'Resolved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ItUserSupport;
