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
  RefreshCw,
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

  const [programs, setPrograms] = useState([]);
  const [targetType, setTargetType] = useState("All");
  const [subTarget, setSubTarget] = useState("");
  const [deleteModal, setDeleteModal] = useState({ show: false, fee: null });
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchPrograms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/get_academic_programs.php`);
      if (Array.isArray(res.data)) {
        setPrograms(res.data.filter(p => p.status === 'Active'));
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchPrograms();
  }, []);

  const handleTargetTypeChange = (val) => {
    setTargetType(val);
    setSubTarget("");
    setFormData(prev => ({ ...prev, applicable_to: val }));
  };

  const handleSubTargetChange = (val) => {
    setSubTarget(val);
    setFormData(prev => ({ ...prev, applicable_to: val || targetType }));
  };

  const handleEditClick = (fee) => {
    const prog = programs.find(p => p.program_code === fee.applicable_to);
    let derivedTargetType = fee.applicable_to;
    let derivedSubTarget = "";
    
    if (prog) {
      derivedTargetType = prog.department; 
      derivedSubTarget = fee.applicable_to;
    } else if (fee.applicable_to !== "All" && fee.applicable_to !== "Elementary" && fee.applicable_to !== "High School" && fee.applicable_to !== "SHS" && fee.applicable_to !== "College") {
      derivedTargetType = "College";
      derivedSubTarget = fee.applicable_to;
    }
    
    setTargetType(derivedTargetType);
    setSubTarget(derivedSubTarget);
    setFormData({
      id: fee.id,
      item_name: fee.item_name,
      amount: fee.amount.toString(),
      category: fee.category,
      applicable_to: fee.applicable_to
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (fee) => {
    setDeleteModal({ show: true, fee });
  };

  const confirmDelete = async () => {
    if (!deleteModal.fee) return;
    setIsDeleting(true);
    try {
      const res = await axios.delete(`${API_BASE_URL}/cashier/manage_fees.php`, {
        params: { id: deleteModal.fee.id }
      });
      if (res.data.status === "success") {
        setDeleteModal({ show: false, fee: null });
        fetchFees();
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (err) {
      console.error("Error deleting fee:", err);
      alert("Server error while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

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
        setTargetType("All");
        setSubTarget("");
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
          onClick={() => {
            setFormData({
              item_name: "",
              amount: "",
              category: "Mandatory",
              applicable_to: "All",
            });
            setTargetType("All");
            setSubTarget("");
            setIsModalOpen(true);
          }}
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
                      <button 
                        onClick={() => handleEditClick(fee)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit Fee"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(fee)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete Fee"
                      >
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
                {formData.id ? <Edit2 size={24} /> : <Plus size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase italic leading-none">
                  {formData.id ? "Edit Fee Item" : "New Fee Item"}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {formData.id ? "Update Billing Catalog" : "Add to Billing Catalog"}
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
                  value={targetType}
                  onChange={(e) => handleTargetTypeChange(e.target.value)}
                >
                  <option value="All">All Students</option>
                  <option value="Elementary">Elementary Only</option>
                  <option value="High School">High School Only</option>
                  <option value="SHS">Senior High (SHS) Only</option>
                  <option value="College">College Only</option>
                </select>
              </div>

              {formData.category === "Tuition" && targetType === "SHS" && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                    Select Strand (Optional)
                  </label>
                  <select
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={subTarget}
                    onChange={(e) => handleSubTargetChange(e.target.value)}
                  >
                    <option value="">All SHS Strands</option>
                    {programs.filter(p => p.department === "SHS").map(p => (
                      <option key={p.id} value={p.program_code}>{p.program_code} - {p.program_description}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.category === "Tuition" && targetType === "College" && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                    Select Course (Optional)
                  </label>
                  <select
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={subTarget}
                    onChange={(e) => handleSubTargetChange(e.target.value)}
                  >
                    <option value="">All College Courses</option>
                    {programs.filter(p => p.department === "College").map(p => (
                      <option key={p.id} value={p.program_code}>{p.program_code} - {p.program_description}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] uppercase text-[11px] tracking-[0.2em] mt-4 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
              >
                {formData.id ? "Update Fee Configuration" : "Save Fee Configuration"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteModal.show && deleteModal.fee && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[550] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-center text-slate-800 uppercase tracking-tighter mb-2">Delete Fee Item?</h3>
            <p className="text-center font-bold text-slate-500 text-sm mb-6">
              Are you sure you want to delete <span className="text-red-500 font-black">{deleteModal.fee.item_name}</span>?
            </p>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-8 text-center">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-relaxed">
                Warning: This will permanently delete this fee item configuration. Existing student bills referencing this catalog item will remain, but new assessments will not be able to select it.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModal({ show: false, fee: null })} 
                disabled={isDeleting} 
                className="flex-1 py-4 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={isDeleting} 
                className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-red-600 transition-all flex justify-center items-center gap-2"
              >
                {isDeleting ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCatalog;
