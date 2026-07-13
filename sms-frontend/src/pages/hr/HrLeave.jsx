import React, { useState } from 'react';
import { Clipboard, Check, X, FileText, Calendar } from 'lucide-react';

const HrLeave = () => {
  const [requests, setRequests] = useState([
    { id: "LR-901", employee: "Jane Smith (Cashier)", type: "Sick Leave", dates: "July 15 - July 17, 2026", reason: "Scheduled minor surgery", status: "Pending" },
    { id: "LR-902", employee: "Prof. Lopez (Teacher)", type: "Vacation Leave", dates: "July 20 - July 24, 2026", reason: "Family trip", status: "Pending" }
  ]);

  const handleAction = (id, newStatus) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    alert(`Leave request ${id} has been ${newStatus.toLowerCase()}!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Clipboard className="text-blue-600" size={32} />
          Leave & Absence Management
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review leave applications, view reasons logs, and confirm department coverage approval.</p>
      </div>

      {/* REQUESTS LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Leave Application Queue</h3>
        
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors hover:border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{r.id}</span>
                    <h4 className="text-sm font-bold text-slate-800">{r.employee}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Type: <strong className="text-slate-700">{r.type}</strong></p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">Reason: "{r.reason}"</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Requested Duration</p>
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Calendar size={12} className="text-slate-400" /> {r.dates}
                  </p>
                </div>

                {r.status === 'Pending' ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAction(r.id, "Approved")}
                      className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 flex items-center justify-center transition-colors"
                      title="Approve Leave"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={() => handleAction(r.id, "Rejected")}
                      className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 flex items-center justify-center transition-colors"
                      title="Reject Leave"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${r.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {r.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrLeave;
