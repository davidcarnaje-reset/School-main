import React, { useState } from 'react';
import { Package, Search, PlusCircle, AlertCircle } from 'lucide-react';

const CustodianInventory = () => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([
    { id: "AST-201", name: "Epson EH-TW7000 Projector", qty: 3, location: "Audio Visual Room", status: "Operational" },
    { id: "AST-202", name: "Steelcase Office Chairs", qty: 45, location: "Faculty Room", status: "Operational" },
    { id: "AST-203", name: "Wooden Student Desk", qty: 120, location: "Rooms 101 - 105", status: "Operational" },
    { id: "AST-204", name: "Dell OptiPlex 3090 Computer Host", qty: 25, location: "IT Computer Lab 2", status: "Requires Repair" }
  ]);

  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="text-blue-600" size={32} />
            Asset & Equipment Inventory
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Audit school desks, chairs, electronic projectors, and laboratory assets.</p>
        </div>
        <button 
          onClick={() => alert("Registration handled soon.")}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Register New Asset
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-4 shadow-xl flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by asset name or location room..."
          className="w-full text-sm bg-transparent focus:outline-none placeholder-slate-400 font-medium text-slate-700"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset ID</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description Name</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Room</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <span className="text-xs font-mono font-bold text-slate-400">{item.id}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-sm font-bold text-slate-700">{item.name}</p>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold text-slate-500">{item.qty} units</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold text-slate-600">{item.location}</span>
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === 'Operational' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
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

export default CustodianInventory;
