import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Edit2,
  Trash2,
  Tag,
  X,
  Layers,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SectionHeader } from "../../components/cashier/CashierComponents";

const FeeCatalog = () => {
  const [fees, setFees] = useState([]);
  const { API_BASE_URL } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    item_name: "",
    amount: "",
    category: "Mandatory",
    applicable_to: "All",
  });

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/manage_fees.php`);
      setFees(res.data);
    } catch (err) {
      console.error("Error fetching fees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_BASE_URL}/cashier/manage_fees.php`,
        formData,
      );
      if (res.data.status === "success") {
        setIsModalOpen(false);
        setFormData({
          item_name: "",
          amount: "",
          category: "Mandatory",
          applicable_to: "All",
        });
        fetchFees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFees = fees.filter((fee) => {
    const matchesSearch = fee.item_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterCategory === "All" || fee.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">
            Fee Catalog
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
            Manage School Fees & Pricing
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} /> New Fee Item
        </button>
      </div>

      {/* 2. SEARCH & FILTERS PILL */}
      <div className="bg-white p-4 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"
            size={18}
          />
          <input
            type="text"
            placeholder="Search fee name..."
            className="w-full pl-14 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border-2 border-slate-100 w-full md:w-auto">
          {["All", "Tuition", "Mandatory", "Document"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${
                filterCategory === cat
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. FEES LIST */}
      <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm overflow-hidden p-8">
        <SectionHeader title="Active Fee Records" icon={Tag} />

        <div className="mt-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 border-b-2 border-slate-50">
                <th className="pb-4 text-left px-2">Item Detail</th>
                <th className="pb-4 text-center px-2">Category</th>
                <th className="pb-4 text-center px-2">Applicable To</th>
                <th className="pb-4 text-right px-2">Amount</th>
                <th className="pb-4 text-right px-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredFees.map((fee) => (
                <tr
                  key={fee.id}
                  className="group hover:bg-indigo-50/30 transition-colors"
                >
                  <td className="py-5 px-2">
                    <p className="text-xs font-black text-slate-800 uppercase">
                      {fee.item_name}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase italic">
                      System ID: #{fee.id}
                    </p>
                  </td>
                  <td className="py-5 px-2 text-center">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-black text-[8px] uppercase tracking-tighter">
                      {fee.category}
                    </span>
                  </td>
                  <td className="py-5 px-2 text-center">
                    <span className="text-[10px] font-bold text-slate-500">
                      {fee.applicable_to}
                    </span>
                  </td>
                  <td className="py-5 px-2 text-right">
                    <span className="text-sm font-black text-slate-900 italic">
                      ₱{parseFloat(fee.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-5 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFees.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="py-20 text-center text-slate-300 font-black uppercase italic text-xs tracking-widest"
                  >
                    No matching fee items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL FOR NEW FEE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-10 animate-in zoom-in duration-300 shadow-2xl relative border-b-[12px] border-indigo-600">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-8 top-8 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-rose-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Plus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase italic leading-none">
                  New Fee Item
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Add to Billing Catalog
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                  Fee Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Graduation Fee"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  value={formData.item_name}
                  onChange={(e) =>
                    setFormData({ ...formData, item_name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                    Amount (₱)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs text-indigo-600 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                    Category
                  </label>
                  <select
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="Tuition">Tuition</option>
                    <option value="Mandatory">Mandatory</option>
                    <option value="Optional">Optional</option>
                    <option value="Document">Document</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                  Target Group
                </label>
                <select
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  value={formData.applicable_to}
                  onChange={(e) =>
                    setFormData({ ...formData, applicable_to: e.target.value })
                  }
                >
                  <option value="All">All Students</option>
                  <option value="Elementary">Elementary Only</option>
                  <option value="High School">High School Only</option>
                  <option value="College">College Only</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] uppercase text-[11px] tracking-[0.2em] mt-4 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
              >
                Save Fee Configuration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCatalog;
