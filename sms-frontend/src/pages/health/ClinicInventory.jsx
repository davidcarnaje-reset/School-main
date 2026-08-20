import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Search, RefreshCw, X, Plus, Edit2, AlertTriangle, 
  Trash2, Package, Calendar, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ClinicInventory = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({ medicine_name: '', stock_qty: 0, unit: 'tabs', expiration_date: '' });
  const [updateForm, setUpdateForm] = useState({ stock_qty: 0, expiration_date: '' });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/health/inventory`);
      if (res.data && res.data.success) {
        setInventory(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [API_BASE_URL]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/health/inventory`, addForm);
      if (res.data && res.data.success) {
        alert("Medicine added to inventory.");
        setShowAddModal(false);
        setAddForm({ medicine_name: '', stock_qty: 0, unit: 'tabs', expiration_date: '' });
        fetchInventory();
      }
    } catch (err) {
      alert("Failed to add inventory item.");
    }
  };

  const triggerUpdateItem = (item) => {
    setSelectedItem(item);
    setUpdateForm({
      stock_qty: item.stock_qty,
      expiration_date: item.expiration_date || ''
    });
    setShowUpdateModal(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_BASE_URL}/health/inventory/${selectedItem.id}`, updateForm);
      if (res.data && res.data.success) {
        alert("Medicine stock details updated.");
        setShowUpdateModal(false);
        fetchInventory();
      }
    } catch (err) {
      alert("Failed to update stock levels.");
    }
  };

  const filteredInv = inventory.filter(item => {
    return item.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const isExpired = (expDate) => {
    if (!expDate) return false;
    return new Date(expDate) <= new Date();
  };

  const isExpiringSoon = (expDate) => {
    if (!expDate) return false;
    const exp = new Date(expDate);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return exp > new Date() && exp <= sixMonthsFromNow;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
            <Package size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clinic Medicine Inventory</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Monitor active clinic medicine supplies, track stock counts, units, and track expiration dates.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md self-start"
        >
          <Plus size={16} />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by drug/medicine name..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-rose-500 text-xs font-semibold text-slate-700"
          />
        </div>
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          Total: {filteredInv.length} medicine records
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4">Medicine / Drug Name</th>
                <th className="p-4">Stock Levels</th>
                <th className="p-4">Unit Type</th>
                <th className="p-4">Expiration Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 font-semibold">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredInv.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">
                    No medicine inventory records found.
                  </td>
                </tr>
              ) : (
                filteredInv.map((item) => {
                  const expired = isExpired(item.expiration_date);
                  const expiring = isExpiringSoon(item.expiration_date);
                  const isLow = item.stock_qty < 10;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{item.medicine_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-slate-700'}`}>{item.stock_qty}</span>
                          {isLow && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-500 uppercase text-xs">{item.unit}</td>
                      <td className="p-4">
                        {item.expiration_date ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <Calendar size={14} className="text-slate-400" />
                            <span className={expired ? 'text-red-600 font-bold' : expiring ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                              {item.expiration_date}
                            </span>
                            {expired && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-100 text-red-700">Expired</span>
                            )}
                            {expiring && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-100 text-amber-700">Expiring</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-450 italic">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => triggerUpdateItem(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all inline-flex items-center gap-1 text-[11px] font-bold"
                          title="Restock / Edit Expiry"
                        >
                          <Edit2 size={14} />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD MEDICINE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Package className="text-rose-500" size={18} />
              <span>Add Medicine to Inventory</span>
            </h3>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Medicine Name *</label>
                <input 
                  type="text" required
                  placeholder="e.g. Paracetamol, Ibuprofen, Amoxicillin"
                  value={addForm.medicine_name}
                  onChange={(e) => setAddForm({...addForm, medicine_name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Initial Qty *</label>
                  <input 
                    type="number" min="0" required
                    value={addForm.stock_qty}
                    onChange={(e) => setAddForm({...addForm, stock_qty: parseInt(e.target.value, 10)})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Unit Type *</label>
                  <select 
                    value={addForm.unit}
                    onChange={(e) => setAddForm({...addForm, unit: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                  >
                    <option value="tabs">Tabs</option>
                    <option value="bottles">Bottles</option>
                    <option value="vials">Vials</option>
                    <option value="tubes">Tubes</option>
                    <option value="boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Expiration Date</label>
                <input 
                  type="date"
                  value={addForm.expiration_date}
                  onChange={(e) => setAddForm({...addForm, expiration_date: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-all shadow-md"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE RESTOCK MODAL */}
      {showUpdateModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 md:p-8 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Plus className="text-rose-500" size={18} />
              <span>Restock / Edit Medicine Details</span>
            </h3>
            <p className="text-xs text-slate-500 font-bold">{selectedItem.medicine_name}</p>
            
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Restocked / Current Qty *</label>
                <input 
                  type="number" min="0" required
                  value={updateForm.stock_qty}
                  onChange={(e) => setUpdateForm({...updateForm, stock_qty: parseInt(e.target.value, 10)})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">New Expiration Date</label>
                <input 
                  type="date"
                  value={updateForm.expiration_date}
                  onChange={(e) => setUpdateForm({...updateForm, expiration_date: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-500 text-xs font-bold text-slate-700"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-all shadow-md"
                >
                  Save Stock Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClinicInventory;
