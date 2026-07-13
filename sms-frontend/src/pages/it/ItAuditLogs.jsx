import React from 'react';
import { ShieldCheck, History, Clock } from 'lucide-react';

const ItAuditLogs = () => {
  const logs = [
    { time: "July 13, 2026, 18:24:12", event: "IT Portal module configuration saved successfully", ip: "192.168.100.16", status: "Success" },
    { time: "July 13, 2026, 18:20:01", event: "Automated DB Backup task completed successfully", ip: "Local Replication Node", status: "Success" },
    { time: "July 13, 2026, 17:45:32", event: "Staff login attempt authorized for role 'hr' (Ana Cruz)", ip: "192.168.100.22", status: "Success" },
    { time: "July 13, 2026, 17:02:11", event: "Unusual traffic spike detected on secondary Wi-Fi AP", ip: "Access Node #08", status: "Warning" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-blue-600" size={32} />
          IT System Security & Audit Logs
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Audit active sysadmin logins, critical automation tasks, and authentication anomalies logs.</p>
      </div>

      {/* AUDIT LOGS TIMELINE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Security Event Timeline</h3>
        <div className="space-y-6">
          {logs.map((log, idx) => (
            <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${log.status === 'Success' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{log.event}</h4>
                  <p className="text-slate-400 text-xs font-semibold mt-1">IP Host: <span className="text-slate-700 font-mono font-bold">{log.ip}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  {log.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ItAuditLogs;
