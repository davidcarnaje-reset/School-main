import React from 'react';
import { Package, Clipboard, Calendar, AlertTriangle, Send, RefreshCw } from 'lucide-react';

const CustodianDashboard = () => {
  const tasks = [
    { type: "Forward to IT", item: "Dell Server RAM Failure in Room 102", target: "IT Portal", status: "Dispatched", date: "Today" },
    { type: "Procurement Request", item: "Requesting 50 Whiteboard Markers", target: "Finance / Cashier", status: "Sent to Finance", date: "Yesterday" },
    { type: "Facilities Audit Report", item: "Gym Roof Inspection Sheet", target: "School Administration", status: "Approved", date: "July 12, 2026" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* BRANDING HEADER */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-950 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-amber-800/30">
        <div>
          <h1 className="text-3xl font-black tracking-tight leading-none">Property Custodian Dashboard</h1>
          <p className="mt-2 text-slate-300 font-medium text-sm">Manage physical school assets, log repair maintenance tickets, and coordinate facility bookings.</p>
        </div>
        <span className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-full text-xs font-black uppercase tracking-wider border border-amber-500/30">
          Custodian Secured
        </span>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Assets</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">1,240 Items</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <Package size={18} />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-bold">Gym, AV Room & Classrooms</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Repairs</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">4 Requests</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-xs text-red-500 font-bold">1 forwarded to IT Support</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reservations</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">3 Bookings</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
              <Calendar size={18} />
            </div>
          </div>
          <p className="text-xs text-blue-500 font-bold">AV Room & Audio Labs today</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disposal Queue</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">15 Obsolete</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-550/10 text-slate-600 flex items-center justify-center border border-slate-200">
              <Clipboard size={18} />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-bold">Scheduled for auction</p>
        </div>
      </div>

      {/* WORKFLOW DISPATCH STATUS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Departmental Integrations Dispatch Logs</h2>
          <p className="text-slate-400 text-xs font-medium mt-1">Triggers logged when dispatching computer alerts to IT, requests to Finance, or conditions updates to Admin.</p>
        </div>

        <div className="space-y-4">
          {tasks.map((t, idx) => (
            <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
                  <Send size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{t.type}: <span className="text-blue-600">"{t.item}"</span></h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Target Department: <span className="text-slate-700 font-bold">{t.target}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Approved' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
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

export default CustodianDashboard;
