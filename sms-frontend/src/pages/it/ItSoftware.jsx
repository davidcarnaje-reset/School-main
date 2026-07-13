import React, { useState } from 'react';
import { Layers, ShieldCheck, PlusCircle, Calendar } from 'lucide-react';

const ItSoftware = () => {
  const [software, setSoftware] = useState([
    { id: "SW-01", name: "Microsoft Windows 11 Enterprise", type: "Operating System", key: "XXXXX-XXXXX-XXXXX-XXXXX-Y8912", installs: "84 Seats active", status: "Active" },
    { id: "SW-02", name: "Adobe Creative Cloud Desktop Suite", type: "Design Tools Suite", key: "Adobe Enterprise Portal", installs: "15 Seats active", status: "Active" },
    { id: "SW-03", name: "MySQL Workbench Enterprise Edition", type: "Database Administrator Console", key: "MySQL Core License key", installs: "3 Seats active", status: "Active" },
    { id: "SW-04", name: "Bitdefender GravityZone Antivirus", type: "Security Endpoint Protection", key: "BIT-CORE-891-23", installs: "85 Seats active", status: "Active" }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="text-blue-600" size={32} />
            Software Licensing & Catalog
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage institutional operating systems, developer licenses, security licenses, and active seat counts.</p>
        </div>
        <button 
          onClick={() => alert("Software register form will be handled soon.")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Add Software License
        </button>
      </div>

      {/* SOFTWARE LIST */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Software Item</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">License Key / Access</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seat Activations</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {software.map((sw) => (
                <tr key={sw.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <p className="text-sm font-bold text-slate-700">{sw.name}</p>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold text-slate-500">{sw.type}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{sw.key}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold text-slate-600">{sw.installs}</span>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
                      <ShieldCheck size={12} />
                      {sw.status}
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

export default ItSoftware;
