import React from 'react';
import { Server, Activity, Laptop, LifeBuoy, AlertTriangle, ShieldCheck, CheckCircle, RefreshCw } from 'lucide-react';

const ItDashboard = () => {
  const nodes = [
    { name: "Primary Database (MySQL replication)", status: "Active", uptime: "100%", ping: "2ms", statusType: "success" },
    { name: "Student Portal Frontend (Node.js)", status: "Active", uptime: "99.98%", ping: "14ms", statusType: "success" },
    { name: "LMS File Storage Service (AWS S3)", status: "Active", uptime: "100%", ping: "28ms", statusType: "success" },
    { name: "Backup Replication Node", status: "Syncing", uptime: "99.90%", ping: "12ms", statusType: "warning" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* BRANDING CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-700">
        <div>
          <h1 className="text-3xl font-black tracking-tight leading-none">IT Admin Command Center</h1>
          <p className="mt-2 text-slate-300 font-medium text-sm">Monitor network infrastructure, configure security protocols, and review tech tickets.</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-white/10 shadow-lg active:scale-95"
        >
          <RefreshCw size={14} className="animate-spin" />
          Refresh Stats
        </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/30 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Server Status</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">99.98%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
              <Server size={18} />
            </div>
          </div>
          <p className="text-xs text-emerald-500 font-bold flex items-center gap-1.5">
            <CheckCircle size={12} /> All nodes operational
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/30 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Tickets</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">4 Tickets</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
              <LifeBuoy size={18} />
            </div>
          </div>
          <p className="text-xs text-blue-500 font-bold">2 High Priority pending</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/30 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Borrowed Assets</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">12 Devices</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center border border-violet-100">
              <Laptop size={18} />
            </div>
          </div>
          <p className="text-xs text-violet-500 font-bold">Due for return this week</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/30 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network Bandwidth</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">185 Mbps</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <Activity size={18} />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-bold">Traffic load: Normal</p>
        </div>
      </div>

      {/* SYSTEMS REPLICAS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Infrastructure Replicas</h2>
            <p className="text-slate-400 text-xs font-medium mt-1">Real-time status of nodes and load-balancing services.</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">IT Secured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Node</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Uptime Metric</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ping latency</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Health</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <p className="text-sm font-bold text-slate-700">{node.name}</p>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold text-slate-500">{node.uptime}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-mono text-slate-500">{node.ping}</span>
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${node.statusType === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${node.statusType === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {node.status}
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

export default ItDashboard;
