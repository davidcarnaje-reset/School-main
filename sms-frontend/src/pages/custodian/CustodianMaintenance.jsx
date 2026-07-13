import React, { useState } from 'react';
import { Wrench, ShieldAlert, CheckCircle, Send, ArrowRight } from 'lucide-react';

const CustodianMaintenance = () => {
  const [requests, setRequests] = useState([
    { id: "M-301", item: "Dell OptiPlex 3090 (Lab Host #02)", type: "IT Hardware", issue: "Flickering screen and boot loops", reportedBy: "Prof. Lopez (Teacher)", status: "Pending review", forwardedToIt: false },
    { id: "M-302", item: "Wooden Student Desks (10 units)", type: "Furniture", issue: "Broken writing pads and wobbly legs", reportedBy: "Mr. Santos (Custodian Assistant)", status: "Pending review", forwardedToIt: false }
  ]);

  const handleForwardToIt = (id) => {
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        alert(
          `Workflow triggered successfully!\n\nCustodian → IT Support Alert:\n${r.item} has been flagged as network/computing hardware. Incident report forwarded to the IT Portal queue for technical repair.`
        );
        return { ...r, status: "Forwarded to IT Support", forwardedToIt: true };
      }
      return r;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Wrench className="text-blue-600" size={32} />
          Maintenance & Repair Requests
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review broken facility reports from staff, resolve desks repairs, and dispatch computing faults to IT.</p>
      </div>

      {/* REQUESTS LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Active Repair Reports</h3>
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors hover:border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <Wrench size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{r.id}</span>
                    <h4 className="text-sm font-bold text-slate-800">{r.item} <span className="text-xs font-semibold text-slate-400">({r.type})</span></h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Reported by: <span className="text-slate-800 font-bold">{r.reportedBy}</span></p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">Issue Details: "{r.issue}"</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${r.forwardedToIt ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' : 'bg-amber-50 text-amber-600 font-bold border border-amber-100'}`}>
                  {r.status}
                </span>

                {r.type.toLowerCase() === 'it hardware' && !r.forwardedToIt && (
                  <button 
                    onClick={() => handleForwardToIt(r.id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 hover:scale-105 active:scale-95 shadow-sm"
                  >
                    Forward to IT <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CustodianMaintenance;
