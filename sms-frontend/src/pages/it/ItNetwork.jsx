import React from 'react';
import { Activity, Globe, CheckCircle2, Wifi, Server } from 'lucide-react';

const ItNetwork = () => {
  const networks = [
    { name: "Primary Gateway Router (192.168.1.1)", ping: "1ms", status: "Active", bandwidth: "145 Mbps" },
    { name: "Fiber Optic Lease line 1 (Main link)", ping: "8ms", status: "Active", bandwidth: "450 Mbps" },
    { name: "Backup Wireless ISP Link", ping: "24ms", status: "Standby", bandwidth: "0 Mbps" },
    { name: "Room 102 Access Point Hub", ping: "4ms", status: "Active", bandwidth: "42 Mbps" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Activity className="text-blue-600" size={32} />
          Network Monitoring & Gateways
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Real-time gateway pings, wireless access points status, and ISP load metrics.</p>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
            <Wifi size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wi-Fi Channels Uptime</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">99.98%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
            <Globe size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">DNS Gateway Latency</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">8ms avg</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center border border-violet-100 shrink-0">
            <Server size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Access Nodes</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">28 AP Nodes</h3>
          </div>
        </div>
      </div>

      {/* GATEWAY DETAILS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Core Gateway Terminals</h3>
        <div className="space-y-4">
          {networks.map((net, i) => (
            <div key={i} className="p-4 border border-slate-100 hover:border-slate-200 bg-slate-50/50 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all">
              <div>
                <h4 className="text-sm font-bold text-slate-800">{net.name}</h4>
                <p className="text-slate-400 text-xs font-semibold mt-1">Uptime Latency: <span className="text-slate-700 font-mono">{net.ping}</span></p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">ISP Bandwidth Load</p>
                  <p className="text-xs font-black text-slate-700 mt-0.5">{net.bandwidth}</p>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${net.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${net.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  {net.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ItNetwork;
