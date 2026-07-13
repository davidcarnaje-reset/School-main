import React, { useState } from 'react';
import { Package, PlusCircle, Search, Edit2, ShieldAlert } from 'lucide-react';

const ItInventory = () => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([
    { code: "EQ-1002", name: "Cisco Catalyst 2960 Switch", type: "Network Hardware", serial: "SN-9081290", status: "Operational", location: "Server Room A" },
    { code: "EQ-1003", name: "Dell PowerEdge R740 Server", type: "Server Node", serial: "SN-Dell8912", status: "Operational", location: "Server Room A" },
    { code: "EQ-1004", name: "Ubiquiti UniFi AP AC Pro", type: "Wireless AP", serial: "SN-Ubi8912", status: "Operational", location: "Hallway Floor 2" },
    { code: "EQ-1005", name: "Logitech MK270 Keyboard Mouse Combo", type: "Peripherals", serial: "SN-Logi1002", status: "Under Repair", location: "Storage B" },
    { code: "EQ-1006", name: "HP LaserJet Pro MFP M227fdw", type: "Printer", serial: "SN-HP7081", status: "Operational", location: "Registrar Office" }
  ]);

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.type.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="text-blue-600" size={32} />
            Hardware & Supply Inventory
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Track and manage network assets, servers, computers, and peripheral stocks.</p>
        </div>
        <button 
          onClick={() => alert("Registration form will be handled soon.")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Register New Asset
        </button>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-4 shadow-xl flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by asset code, name, or hardware type..."
          className="w-full text-sm bg-transparent focus:outline-none placeholder-slate-400 font-medium text-slate-700"
        />
      </div>

      {/* INVENTORY TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Code</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description Name</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Type</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial Number</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.code} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <span className="text-xs font-mono font-bold text-slate-400">{item.code}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-sm font-bold text-slate-700">{item.name}</p>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold text-slate-500">{item.type}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-mono text-slate-500">{item.serial}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold text-slate-600">{item.location}</span>
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === 'Operational' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Operational' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {item.status}
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

export default ItInventory;
