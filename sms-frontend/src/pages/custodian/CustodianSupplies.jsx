import React, { useState } from 'react';
import { Package, Send, PlusCircle, AlertCircle } from 'lucide-react';

const CustodianSupplies = () => {
  const [supplies, setSupplies] = useState([
    { id: "SUP-01", name: "Whiteboard Markers (Black/Blue)", stock: 12, unit: "Boxes", threshold: 15, requestSent: false },
    { id: "SUP-02", name: "Dustless White Chalks", stock: 8, unit: "Boxes", threshold: 10, requestSent: false },
    { id: "SUP-03", name: "A4 Bond Papers (70gsm)", stock: 85, unit: "Reams", threshold: 20, requestSent: false }
  ]);

  const handleProcureRequest = (id) => {
    setSupplies(prev => prev.map(s => {
      if (s.id === id) {
        alert(
          `Procurement triggered successfully!\n\nCustodian → Finance Purchase Request:\nRequisition of supply item "${s.name}" dispatched to the Finance/Cashier portal for procurement.`
        );
        return { ...s, requestSent: true };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Package className="text-blue-600" size={32} />
          Office & Classroom Supplies Stocks
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Audit consumable stock quantities, check threshold levels, and trigger purchase requests to Finance.</p>
      </div>

      {/* SUPPLIES TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Stock Ledger</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supply Code</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stock</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety Threshold</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Procurement Actions</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((s) => {
                const lowStock = s.stock < s.threshold;

                return (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      <span className="text-xs font-mono font-bold text-slate-400">{s.id}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-sm font-bold text-slate-700">{s.name}</p>
                    </td>
                    <td className="py-4">
                      <span className={`text-xs font-bold ${lowStock ? 'text-red-500' : 'text-slate-650'}`}>{s.stock} {s.unit}</span>
                      {lowStock && <span className="text-[9px] text-red-500 font-bold block mt-0.5">⚠️ Reorder point reached</span>}
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-semibold text-slate-500">{s.threshold} {s.unit}</span>
                    </td>
                    <td className="py-4">
                      {s.requestSent ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          Sent to Finance
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleProcureRequest(s.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 hover:scale-105 active:scale-95 shadow-sm"
                        >
                          <Send size={10} /> Purchase Request
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CustodianSupplies;
